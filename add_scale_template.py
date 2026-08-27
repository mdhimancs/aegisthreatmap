import re

with open('src/components/WorldThreatMapView.tsx', 'r') as f:
    content = f.read()

# Handle className="SOMETHING"
def replacer_quotes(match):
    prefix = match.group(1)
    class_name = match.group(2)
    if 'scale-105' not in class_name:
        return f'{prefix}className="scale-105 {class_name}"'
    return match.group(0)

# Handle className={`SOMETHING`}
def replacer_template(match):
    prefix = match.group(1)
    class_name = match.group(2)
    if 'scale-105' not in class_name:
        return f'{prefix}className={{`scale-105 {class_name}`}}'
    return match.group(0)

content = re.sub(r'(<button[^>]*?)className="([^"]*)"', replacer_quotes, content, flags=re.DOTALL)
content = re.sub(r'(<button[^>]*?)className=\{\`([^`]*)\`\}', replacer_template, content, flags=re.DOTALL)

with open('src/components/WorldThreatMapView.tsx', 'w') as f:
    f.write(content)
