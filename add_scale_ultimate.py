with open('src/components/WorldThreatMapView.tsx', 'r') as f:
    lines = f.readlines()

new_lines = []
in_button = False

for line in lines:
    if '<button' in line:
        in_button = True
    
    if in_button and 'className="' in line:
        if 'scale-[1.05]' not in line and 'scale-105' not in line:
            line = line.replace('className="', 'className="scale-[1.05] ')
        in_button = False # assume one className per button
    elif in_button and 'className={`' in line:
        if 'scale-[1.05]' not in line and 'scale-105' not in line:
            line = line.replace('className={`', 'className={`scale-[1.05] ')
        in_button = False
        
    if in_button and '>' in line and '=>' not in line and '->' not in line:
        # We probably reached the end of the button opening tag
        if '</button>' not in line:
            pass # might still be multi-line but let's assume className comes before >
            
    new_lines.append(line)

with open('src/components/WorldThreatMapView.tsx', 'w') as f:
    f.writelines(new_lines)
