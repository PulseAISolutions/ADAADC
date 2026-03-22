import urllib.request
import re
from collections import defaultdict
from datetime import datetime
import urllib.parse

url = 'https://calendar.google.com/calendar/ical/3f5f7a4ba6a92792bc4ed098c1bc9963025a5aeefa8917da177e1d1b4135edc8%40group.calendar.google.com/public/basic.ics'
req = urllib.request.urlopen(url)
ics_data = req.read().decode('utf-8')
ics_data = ics_data.replace('\r\n ', '').replace('\\,', ',')

events = []
curr = {}
for line in ics_data.split('\r\n'):
    if line == 'BEGIN:VEVENT':
        curr = {}
    elif line == 'END:VEVENT':
        events.append(curr)
    elif ':' in line:
        k, v = line.split(':', 1)
        k = k.split(';')[0]
        curr[k] = v

def format_time(time_str):
    if len(time_str) >= 15 and 'T' in time_str:
        try:
            dt = datetime.strptime(time_str[-15:], '%Y%m%dT%H%M%S')
            return dt.strftime('%I:%M %p').lstrip('0')
        except:
            return time_str
    return time_str

from datetime import timedelta

cards = defaultdict(lambda: {'days': set(), 'dtstart': '', 'byday': ''})
for e in events:
    title = e.get('SUMMARY', '')
    location = e.get('LOCATION', '')
    rrule = e.get('RRULE', '')
    start = e.get('DTSTART', '')
    end = e.get('DTEND', '')
    
    days = []
    byday_str = ''
    if rrule:
        m = re.search(r'BYDAY=([^;]+)', rrule)
        if m:
            byday_str = m.group(1)
            day_map = {'MO': 'Mon', 'TU': 'Tue', 'WE': 'Wed', 'TH': 'Thu', 'FR': 'Fri', 'SA': 'Sat', 'SU': 'Sun'}
            days = [day_map.get(d, d) for d in byday_str.split(',')]
    if not days and start and 'T' in start:
        try:
            dt = datetime.strptime(start[-15:], '%Y%m%dT%H%M%S')
            days = [dt.strftime('%a')]
        except:
            pass
            
    start_fmt = format_time(start)
    end_fmt = format_time(end)
    time_str = f"{start_fmt} - {end_fmt}" if start_fmt and end_fmt else ""
    
    key = (title, location, time_str)
    for d in days:
        cards[key]['days'].add(d)
        if not cards[key]['dtstart'] or start < cards[key]['dtstart']:
            cards[key]['dtstart'] = start
        if byday_str:
            cards[key]['byday'] = byday_str

sorted_cards = sorted(cards.items(), key=lambda x: x[1]['dtstart'])

html_cards = []
for (t, l, ts), v in sorted_cards:
    title_match = re.match(r'^(.*?)(?:\s*\((.*?)\))?$', t)
    loc_name = title_match.group(1).strip() if title_match else t
    name_map = {
        'MHS': 'McKinley Hill Stadium',
        'Venare': 'Venare Nuvali',
        'Vermosa': 'Vermosa Sports Hub',
        'MOA': 'MOA Sky Football Pitch'
    }
    loc_name = name_map.get(loc_name, loc_name)
    
    age_group = title_match.group(2).strip() if title_match and title_match.group(2) else ""
    if not age_group:
        if 'All Ages' in t: age_group = 'All Ages'
        else: age_group = 'All Ages'

    parts = [p.replace('\\', '').strip() for p in l.split(',')]
    
    city = parts[-2] if len(parts) >= 2 else (parts[0] if parts else "")
    if "Metro Manila" in city and len(parts) >= 3:
        city = parts[-3]
    if "Philippines" in city and len(parts) >= 2:
        city = parts[-2]
    
    badge_color = "red" if ("15" in age_group or "17" in age_group or "All" in age_group) else ""
    badge_html = f'<span class="schedule-badge {badge_color}">{age_group}</span>' if badge_color else f'<span class="schedule-badge">{age_group}</span>'
    card_class = "schedule-card accent-red" if badge_color == "red" else "schedule-card"
    
    day_order = {'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7}
    days_sorted = ", ".join(sorted(list(v['days']), key=lambda d: day_order.get(d, 99)))
    days_str = days_sorted.replace(', ', ' & ') if days_sorted.count(',') == 1 else days_sorted

    # Next upcoming dates
    next_dates_str = ""
    try:
        dtstart = datetime.strptime(v['dtstart'][-15:], '%Y%m%dT%H%M%S')
        now = datetime.now()
        current = max(dtstart, now)
        current = current.replace(hour=0, minute=0, second=0, microsecond=0)
        
        byday_str = v.get('byday', '')
        day_map_rev = {'MO': 0, 'TU': 1, 'WE': 2, 'TH': 3, 'FR': 4, 'SA': 5, 'SU': 6}
        target_weekdays = [day_map_rev[d] for d in byday_str.split(',')] if byday_str else [dtstart.weekday()]
        
        next_dates = []
        while len(next_dates) < 3:
            if current.weekday() in target_weekdays:
                event_datetime = current.replace(hour=dtstart.hour, minute=dtstart.minute)
                if event_datetime >= now or (now - event_datetime).days == 0:
                    next_dates.append(event_datetime)
            current += timedelta(days=1)
            if (current - now).days > 60: break
            
        if next_dates:
            dates_formatted = ", ".join([d.strftime('%b %d') for d in next_dates])
            next_dates_str = f'<div style="font-size: 0.85rem; color: var(--navy); font-weight: 700; background: var(--gray-50); padding: 5px 10px; border-radius: 4px; border-left: 3px solid var(--blue); margin-bottom: 8px;">Dates: {dates_formatted}</div>'
    except Exception as ex:
        pass
    
    map_url = f"https://maps.google.com/?q={urllib.parse.quote(loc_name)}"
    
    city_html = f'<div class="schedule-detail"><span class="icon">📍</span> {city}</div>' if city else ""
    
    html = f"""        <div class="{card_class}">
          <div class="schedule-card-header">
            <div>
              <h3>{loc_name}</h3>
              <span class="dates">{days_str}</span>
            </div>
            {badge_html}
          </div>
          {next_dates_str}
          <div class="schedule-detail"><span class="icon">🕐</span> {ts}</div>
          {city_html}
          <a href="{map_url}" target="_blank" class="schedule-directions" style="margin-top: 10px;">📤 Get Directions</a>
        </div>"""
    html_cards.append(html)

schedule_grid = f"""
      <h2 class="section-title" style="text-align:center;">TRAINING <span class="highlight-blue">SCHEDULE</span></h2>
      <p class="section-subtitle" style="text-align:center; max-width: 600px; margin: 0 auto 40px auto;">Train at any of our locations across Metro Manila and South Luzon.</p>
      
      <div class="schedule-grid">
{chr(10).join(html_cards)}
      </div>

      <p class="schedule-note"><strong>Note:</strong> Schedule may change due to weather or tournaments. Follow us on <a href="https://instagram.com/azkals.development.academy" target="_blank">📷 Instagram</a> for updates.</p>
"""

with open('d:/ADAADC/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the whole header and iframe block
new_content = re.sub(
    r'<h2 class="section-title" style="text-align:center;">TRAINING <span class="highlight-blue">SCHEDULE</span></h2>.*?<p class="schedule-note">.*?</p>',
    schedule_grid.strip(), 
    content, 
    flags=re.DOTALL
)

with open('d:/ADAADC/index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("HTML generated and injected successfully.")
