import sys

filepath = r"..\src\pages\workOrders\NewWorkOrder.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
if "useLocation" not in content:
    content = content.replace("import { useNavigate } from 'react-router-dom';", "import { useNavigate, useLocation } from 'react-router-dom';")
    content = content.replace("import { useNavigate, Link } from 'react-router-dom';", "import { useNavigate, Link, useLocation } from 'react-router-dom';")

# 2. Add useLocation and state destructuring
old_init = """    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [formData, setFormData] = useState<FormData>({
        machine_id: '',
        type: 'corrective',
        category: 'maintenance',
        priority: 'medium',
        title: '',
        description: '',"""

new_init = """    const navigate = useNavigate();
    const location = useLocation();
    const { machineId, title, description } = (location.state as any) || {};
    
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [formData, setFormData] = useState<FormData>({
        machine_id: machineId || '',
        type: 'corrective',
        category: 'maintenance',
        priority: 'medium',
        title: title || '',
        description: description || '',"""

if "const location = useLocation();" not in content:
    content = content.replace(old_init, new_init)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated NewWorkOrder.tsx")