import sys

filepath = r"..\src\pages\workOrders\WorkOrderDetail.tsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('    return (\n        <div className="flex flex-col h-full">')
if idx != -1:
    print(content[idx:idx+800])
else:
    print('Not found')
