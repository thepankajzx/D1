import os
import re
import glob

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    def replacer(match):
        attributes = match.group(1)
        inner = match.group(2).strip()
        
        if inner.startswith('{') and inner.endswith('}'):
            name_prop = f'name={{{inner[1:-1]}}}'
        elif inner.startswith('`${') and inner.endswith('}`'):
            name_prop = f'name={{{inner[1:-1]}}}'
        else:
            name_prop = f'name="{inner}"'
            
        new_attrs = attributes.replace('material-symbols-outlined', '').strip()
        new_attrs = re.sub(r'className="\s*"', '', new_attrs)
        new_attrs = re.sub(r'class="\s*"', '', new_attrs)
        # handle multiple spaces
        new_attrs = ' '.join(new_attrs.split())
        
        res = f'<Icon {name_prop} {new_attrs} />'
        return res

    new_content = re.sub(r'<span\s+([^>]*material-symbols-outlined[^>]*)>\s*(.*?)\s*</span>', replacer, content, flags=re.DOTALL)
    
    if new_content != content:
        # compute relative path to components/Icon
        rel = filepath.replace('\\', '/').split('src/')[1]
        depth = rel.count('/')
        prefix = '../' * depth if depth > 0 else './'
        import_stmt = f"import Icon from '{prefix}components/Icon';\n"
        
        # Add import after the last import
        import_match = list(re.finditer(r'^import .*?\n', new_content, flags=re.MULTILINE))
        if import_match:
            last_import = import_match[-1]
            new_content = new_content[:last_import.end()] + import_stmt + new_content[last_import.end():]
        else:
            new_content = import_stmt + new_content
            
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {filepath}")

for filepath in glob.glob('g:/STITCH HABIT TRACKER/definite-habit-tracker/src/**/*.jsx', recursive=True):
    process_file(filepath)
