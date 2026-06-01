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
  { label: 'Tickets', icon: Ticket, to: '#' },
  { label: 'Create Ticket', icon: PlusCircle, to: '#' },
  { label: 'Reports', icon: BarChart3, to: '#' },
  { label: 'Notifications', icon: Bell, to: '#' },
  { label: 'Knowledge Base', icon: BookOpen, to: '#' },
  { label: 'Users', icon: Users, to: '#' },
  { label: 'Settings', icon: Settings, to: '#' },
]

function Sidebar() {
  const navigate = useNavigate()

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
          {menuItems.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                className={({ isActive }) =>
                  item.to === '/dashboard' && isActive
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
