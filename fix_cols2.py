import re

with open('src/components/WorldThreatMapView.tsx', 'r') as f:
    content = f.read()

# Replace body using curly braces syntax
data_pattern = re.compile(
    r'(\{\/\* Column 1: Classification \(Relocated\) \*\/\}[\s\S]*?</td>)[\s]*'
    r'(\{\/\* Column 2: Location \(Flag \+ Country/City\) \*\/\}[\s\S]*?</td>)[\s]*'
    r'(\{\/\* Column 3: Status \*\/\}[\s\S]*?</td>)[\s]*'
    r'(\{\/\* Column 4: Severity \*\/\}[\s\S]*?</td>)',
    re.MULTILINE
)

def replacer_data(m):
    return f"{m.group(1)}\n\n                  {m.group(4)}\n\n                  {m.group(2)}\n\n                  {m.group(3)}"

content = data_pattern.sub(replacer_data, content)

with open('src/components/WorldThreatMapView.tsx', 'w') as f:
    f.write(content)
