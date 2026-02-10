#!/usr/bin/env python3
# Script to remove DragOverlay, EditableWidget, and EditableGrid functions

with open('src/components/prysmcs.jsx', 'r') as f:
    lines = f.readlines()

# Remove lines 22770-23442 (DragOverlay, EditableWidget, EditableGrid)
# Python uses 0-indexed arrays, so subtract 1 from line numbers
start = 22770 - 1
end = 23443

new_lines = lines[:start] + lines[end:]

with open('src/components/prysmcs.jsx', 'w') as f:
    f.writelines(new_lines)

print(f"Removed lines {start+1}-{end}")
print(f"Original: {len(lines)} lines, New: {len(new_lines)} lines, Removed: {end-start} lines")
