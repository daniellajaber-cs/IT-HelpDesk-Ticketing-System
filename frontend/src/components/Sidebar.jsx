import {
  BarChart3,
  Bell,
  BookOpen,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  Ticket,
  Users,
} from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'

const menuItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Tickets', icon: Ticket, to: '/tickets' },
  { label: 'Create Ticket', icon: PlusCircle, to: '/create-ticket' },
  { label: 'Reports', icon: BarChart3, to: '/reports' },
  { label: 'Notifications', icon: Bell, to: '/notifications' },
  { label: 'Knowledge Base', icon: BookOpen, to: '#' },
  { label: 'Users', icon: Users, to: '#' },
  { label: 'Settings', icon: Settings, to: '#' },
]

const roleMenuItems = {
  Admin: [
    'Dashboard',
    'Tickets',
    'Create Ticket',
    'Reports',
    'Notifications',
    'Knowledge Base',
    'Users',
    'Settings',
  ],
  Manager: ['Dashboard', 'Tickets', 'Reports', 'Notifications', 'Knowledge Base'],
  'IT Support Agent': ['Dashboard', 'Assigned Tickets', 'Notifications', 'Knowledge Base'],
  Employee: ['Dashboard', 'My Tickets', 'Create Ticket', 'Notifications', 'Knowledge Base'],
}

const labelOverrides = {
  'Assigned Tickets': 'Tickets',
  'My Tickets': 'Tickets',
}

function Sidebar() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const allowedLabels = roleMenuItems[role] || roleMenuItems.Employee
  const sidebarItems = allowedLabels
    .map((label) => {
      const item = menuItems.find((menuItem) => menuItem.label === (labelOverrides[label] || label))

      return item ? { ...item, label } : null
    })
    .filter(Boolean)

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('fullName')
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-brand">
          <div className="sidebar-logo">S</div>
          <div>
            <h1>SupportOps</h1>
            <p>Enterprise IT Desk</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          {sidebarItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                className={({ isActive }) =>
                  item.to !== '#' && isActive
                    ? 'sidebar-link active'
                    : 'sidebar-link'
                }
                key={item.label}
                to={item.to}
              >
                <Icon size={20} strokeWidth={2} />
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <button className="sidebar-link logout-link" type="button" onClick={handleLogout}>
        <LogOut size={20} strokeWidth={2} />
        <span>Logout</span>
      </button>
    </aside>
  )
}

export default Sidebar
