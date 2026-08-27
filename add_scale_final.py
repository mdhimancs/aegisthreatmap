import re

with open('src/components/WorldThreatMapView.tsx', 'r') as f:
    content = f.read()

def replacer_quotes(match):
    prefix = match.group(1)
    class_name = match.group(2)
    if 'scale-105' not in class_name:
        return f'{prefix}className="scale-105 {class_name}"'
    return match.group(0)

def replacer_template(match):
    prefix = match.group(1)
    class_name = match.group(2)
    if 'scale-105' not in class_name:
        return f'{prefix}className={{`scale-105 {class_name}`}}'
    return match.group(0)

# Use (.*?) to allow > inside the button tag (e.g. arrow functions), but constrain it by looking for className
# Actually, to prevent matching across tags, we can just match <button\b followed by anything up to className.
# A better regex: find <button, then look ahead to ensure we are inside the same tag (no </button>).
# Actually, since it's just a script, we can split by "<button" and process each chunk.

chunks = content.split('<button')
new_chunks = [chunks[0]]

for chunk in chunks[1:]:
    # Find the first >
    tag_end = chunk.find('>')
    if tag_end != -1:
        tag_content = chunk[:tag_end]
        rest = chunk[tag_end:]
        
        # Process tag_content
        # Replace className="something"
        def cb_quotes(m):
            c = m.group(1)
            if 'scale-105' not in c: return f'className="scale-105 {c}"'
            return m.group(0)
        tag_content = re.sub(r'className="([^"]*)"', cb_quotes, tag_content)
        
        # Replace className={`something`}
        def cb_template(m):
            c = m.group(1)
            if 'scale-105' not in c: return f'className={{`scale-105 {c}`}}'
            return m.group(0)
        tag_content = re.sub(r'className=\{\`(.*?)\`\}', cb_template, tag_content, flags=re.DOTALL)
        
        new_chunks.append('<button' + tag_content + rest)
    else:
        new_chunks.append('<button' + chunk)

with open('src/components/WorldThreatMapView.tsx', 'w') as f:
    f.write(''.join(new_chunks))
