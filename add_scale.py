import re

with open('src/components/WorldThreatMapView.tsx', 'r') as f:
    content = f.read()

# Regex to find className inside <button ... > tags
# We need to match <button, then anything up to className="
# Then inject scale-105

def replacer(match):
    prefix = match.group(1)
    class_name = match.group(2)
    # Don't add if already there
    if 'scale-105' not in class_name:
        return f'{prefix}className="scale-105 {class_name}"'
    return match.group(0)

# This regex finds `<button ... className="SOMETHING"`
# It handles newlines as well.
new_content = re.sub(r'(<button[^>]*?)className="([^"]*)"', replacer, content, flags=re.DOTALL)

with open('src/components/WorldThreatMapView.tsx', 'w') as f:
    f.write(new_content)
