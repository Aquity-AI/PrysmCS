#!/usr/bin/env python3
# Remove customWidgets rendering sections from page components

with open('src/components/prysmcs.jsx', 'r') as f:
    lines = f.readlines()

# We need to find and remove the three sections that render custom widgets
# They follow a pattern: {customWidgets.filter... through </EditableGrid>}

output_lines = []
skip_until_line = None
i = 0

while i < len(lines):
    line = lines[i]

    # Check if this line starts a customWidgets rendering section
    if 'customWidgets.filter(w => w.page_id ===' in line and skip_until_line is None:
        # Find the end of this section (the closing })
        depth = 0
        found_opening = False
        j = i

        while j < len(lines):
            if '{' in lines[j]:
                found_opening = True
                depth += lines[j].count('{')
            depth -= lines[j].count('}')

            if found_opening and depth == 0:
                # Skip all lines from i to j (inclusive)
                i = j + 1
                break
            j += 1
    else:
        output_lines.append(line)
        i += 1

with open('src/components/prysmcs.jsx', 'w') as f:
    f.writelines(output_lines)

print(f"Original: {len(lines)} lines")
print(f"After removal: {len(output_lines)} lines")
print(f"Removed: {len(lines) - len(output_lines)} lines")
