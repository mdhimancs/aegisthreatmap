with open('src/components/WorldThreatMapView.tsx', 'r') as f:
    content = f.read()

import re

# We want Column 2 to be Severity. So:
# Col 1: Classification
# Col 2: Severity
# Col 3: Location
# Col 4: Status

# Swap headers
# Current headers:
# 1. Classification (starts 1492)
# 2. Location (starts 1498)
# 3. Status (starts 1505)
# 4. Severity (starts 1512)

# I will replace the chunk of headers from Classification to Severity with a new ordered string
header_pattern = re.compile(
    r'(<th className="px-2 py-2 font-bold cursor-pointer hover:bg-slate-200 transition-colors border-r border-slate-200 bg-slate-200/20 w-24" onClick=\{.*?handleSort\(\'classification\'\).*?</th>).*?'
    r'(<th className="px-2 py-2 font-bold cursor-pointer hover:bg-slate-200 transition-colors min-w-\[140px\] border-r border-slate-200" onClick=\{.*?handleSort\(\'country\'\).*?</th>).*?'
    r'(<th className="px-2 py-2 font-bold border-r border-slate-200 bg-slate-200/40 whitespace-nowrap w-24" onClick=\{.*?handleSort\(\'status\'\).*?</th>).*?'
    r'(<th className="px-2 py-2 font-bold border-r border-slate-200 bg-slate-200/40 whitespace-nowrap w-20" onClick=\{.*?handleSort\(\'severity\'\).*?</th>)',
    re.DOTALL
)

def replacer_headers(m):
    return f"{m.group(1)}\n                {m.group(4)}\n                {m.group(2)}\n                {m.group(3)}"

content = header_pattern.sub(replacer_headers, content)

# Now swap data cells
# Current order:
# 1. Classification (1571-1587)
# 2. Location (1589-1603)
# 3. Status (1605-1624)
# 4. Severity (1626-1631)

data_pattern = re.compile(
    r'(<!-- Column 1: Classification \(Relocated\) -->.*?</td>).*?'
    r'(<!-- Column 2: Location \(Flag \+ Country/City\) -->.*?</td>).*?'
    r'(<!-- Column 3: Status -->.*?</td>).*?'
    r'(<!-- Column 4: Severity -->.*?</td>)',
    re.DOTALL
)

def replacer_data(m):
    return f"{m.group(1)}\n\n                  {m.group(4)}\n\n                  {m.group(2)}\n\n                  {m.group(3)}"

content = data_pattern.sub(replacer_data, content)

with open('src/components/WorldThreatMapView.tsx', 'w') as f:
    f.write(content)
