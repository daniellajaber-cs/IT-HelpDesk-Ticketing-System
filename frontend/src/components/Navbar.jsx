import { Bell, Moon, Search, UserCircle } from 'lucide-react'

function Navbar() {
  const fullName = localStorage.getItem('fullName') || 'Admin User'
  const role = localStorage.getItem('role') || 'IT Director'

  return (
    <header className="top-navbar">
      <div className="search-field">
        <Search size={18} strokeWidth={2} />
        <input
          aria-label="Search"
          placeholder="Search Help Desk tickets, agents, or assets..."
          type="search"
        />
      </div>

      <div className="navbar-actions">
        <button className="icon-button" type="button" aria-label="Notifications">
          <Bell size={20} strokeWidth={2} />
        </button>
        <button className="icon-button" type="button" aria-label="Dark mode">
          <Moon size={20} strokeWidth={2} />
        </button>

        <div className="profile-section">
          <div className="profile-avatar" aria-hidden="true">
            <UserCircle size={30} strokeWidth={1.9} />
          </div>
          <div>
            <strong>{fullName}</strong>
            <span>{role}</span>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
