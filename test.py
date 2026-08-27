import re
text = 'className={`px-1 py-0.5 rounded text-[8.5px] font-mono border transition-all ${showArcs ? \'bg-red-50 text-red-700 border-red-200 font-bold shadow-xs\' : \'bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100\'}`}'
match = re.search(r'className=\{\`(.*?)\`\}', text, flags=re.DOTALL)
if match:
    print("MATCHED")
else:
    print("NO MATCH")
