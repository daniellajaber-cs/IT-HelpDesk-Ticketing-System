import { Bell, Moon, Search, Sun, UserCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from './ThemeContext'

const API_BASE_URL = 'http://localhost:5227/api'

function Navbar() {
  const navigate = useNavigate()
  const fullName = localStorage.getItem('fullName') || 'Admin User'
  const role = localStorage.getItem('role') || 'IT Director'
  const userId = localStorage.getItem('userId')
  const [unreadCount, setUnreadCount] = useState(0)
  const { theme, toggleTheme } = useTheme()

  useEffect(() => {
    function handleUnreadCountChange(event) {
      setUnreadCount(Number(event.detail || 0))
    }

    window.addEventListener('notifications:unread-count', handleUnreadCountChange)

    if (!userId) {
      setUnreadCount(0)
      return () => window.removeEventListener('notifications:unread-count', handleUnreadCountChange)
    }

    fetch(`${API_BASE_URL}/Notifications/user/${userId}/unread-count`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Unable to load unread notifications.')
        }

        return response.json()
      })
      .then((data) => setUnreadCount(Number(data.count || 0)))
      .catch((error) => {
        console.log(error)
        setUnreadCount(0)
      })

    return () => window.removeEventListener('notifications:unread-count', handleUnreadCountChange)
  }, [userId])

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
        <button className="icon-button notification-nav-button" type="button" aria-label="Notifications" onClick={() => navigate('/notifications')}>
          <Bell size={20} strokeWidth={2} />
          {unreadCount > 0 && <span className="navbar-notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
        </button>
        <button className="icon-button theme-toggle-button" type="button" aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={20} strokeWidth={2} /> : <Moon size={20} strokeWidth={2} />}
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
