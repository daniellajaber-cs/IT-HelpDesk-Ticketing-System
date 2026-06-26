import {
  AlertTriangle,
  Bell,
  CheckCheck,
  CheckCircle2,
  Clock3,
  FileText,
  Lock,
  MessageCircle,
  Paperclip,
  RefreshCw,
  Settings,
  UserCheck,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'

const API_BASE_URL = 'https://supportops-api-daniella-fufeejcrfgcah2bc.uaenorth-01.azurewebsites.net/api'

const filters = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'system', label: 'System Alerts' },
]

const defaultNotificationPreferences = {
  ticketAssignments: true,
  ticketStatusUpdates: true,
  newComments: true,
  newAttachments: true,
  internalNotes: true,
  actionLogs: true,
}

const notificationPreferenceOptions = [
  { id: 'ticketAssignments', label: 'Ticket assignments' },
  { id: 'ticketStatusUpdates', label: 'Ticket status updates' },
  { id: 'newComments', label: 'New comments' },
  { id: 'newAttachments', label: 'New attachments' },
  { id: 'internalNotes', label: 'Internal notes' },
  { id: 'actionLogs', label: 'Action logs' },
]

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

function isSystemAlert(notification) {
  const text = `${notification.title || ''} ${notification.message || ''}`.toLowerCase()

  return text.includes('system') || text.includes('alert') || text.includes('warning') || text.includes('maintenance')
}

function getNotificationDisplay(notification) {
  const text = `${notification.title || ''} ${notification.message || ''}`.toLowerCase()

  if (text.includes('assigned') || text.includes('assignment')) {
    return {
      Icon: UserCheck,
      iconBackgroundColor: '#DBEAFE',
      iconColor: '#2563EB',
      categoryLabel: 'Assignment',
      categoryBadgeClass: 'assignment',
    }
  }

  if (text.includes('resolved')) {
    return {
      Icon: CheckCircle2,
      iconBackgroundColor: '#DCFCE7',
      iconColor: '#15803D',
      categoryLabel: 'Resolved',
      categoryBadgeClass: 'resolved',
    }
  }

  if (text.includes('closed')) {
    return {
      Icon: Lock,
      iconBackgroundColor: '#E5E7EB',
      iconColor: '#4B5563',
      categoryLabel: 'Closed',
      categoryBadgeClass: 'closed',
    }
  }

  if (text.includes('status') && (text.includes('updated') || text.includes('changed'))) {
    return {
      Icon: RefreshCw,
      iconBackgroundColor: '#DCFCE7',
      iconColor: '#16A34A',
      categoryLabel: 'Status Update',
      categoryBadgeClass: 'status',
    }
  }

  if (text.includes('comment')) {
    return {
      Icon: MessageCircle,
      iconBackgroundColor: '#F3E8FF',
      iconColor: '#7C3AED',
      categoryLabel: 'Comment',
      categoryBadgeClass: 'comment',
    }
  }

  if (text.includes('attachment') || text.includes('attached') || text.includes('file uploaded')) {
    return {
      Icon: Paperclip,
      iconBackgroundColor: '#FFEDD5',
      iconColor: '#EA580C',
      categoryLabel: 'Attachment',
      categoryBadgeClass: 'attachment',
    }
  }

  if (text.includes('internal note') || text.includes('private note')) {
    return {
      Icon: FileText,
      iconBackgroundColor: '#E0F2FE',
      iconColor: '#0284C7',
      categoryLabel: 'Internal Note',
      categoryBadgeClass: 'internal-note',
    }
  }

  if (text.includes('action log') || text.includes('activity log')) {
    return {
      Icon: Clock3,
      iconBackgroundColor: '#FEF3C7',
      iconColor: '#D97706',
      categoryLabel: 'Action Log',
      categoryBadgeClass: 'action-log',
    }
  }

  if (isSystemAlert(notification)) {
    return {
      Icon: AlertTriangle,
      iconBackgroundColor: '#FEE2E2',
      iconColor: '#DC2626',
      categoryLabel: 'System Alert',
      categoryBadgeClass: 'system-alert',
    }
  }

  return {
    Icon: Bell,
    iconBackgroundColor: '#EFF6FF',
    iconColor: '#2563EB',
    categoryLabel: 'Notification',
    categoryBadgeClass: 'notification',
  }
}

function Notifications() {
  const userId = localStorage.getItem('userId')
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeFilter, setActiveFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [notificationPreferences, setNotificationPreferences] = useState(defaultNotificationPreferences)

  async function loadNotifications() {
    if (!userId) {
      setNotifications([])
      setUnreadCount(0)
      setErrorMessage('Please login again to view notifications.')
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const [notificationsResponse, unreadCountResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/Notifications/user/${userId}`),
        fetch(`${API_BASE_URL}/Notifications/user/${userId}/unread-count`),
      ])

      if (!notificationsResponse.ok || !unreadCountResponse.ok) {
        throw new Error('Unable to load notifications.')
      }

      const notificationsData = await notificationsResponse.json()
      const unreadCountData = await unreadCountResponse.json()
      const nextUnreadCount = Number(unreadCountData.count || 0)

      setNotifications(Array.isArray(notificationsData) ? notificationsData : [])
      setUnreadCount(nextUnreadCount)
      window.dispatchEvent(new CustomEvent('notifications:unread-count', { detail: nextUnreadCount }))
    } catch (error) {
      console.log(error)
      setNotifications([])
      setUnreadCount(0)
      setErrorMessage('Unable to load notifications.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [userId])

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'unread') {
      return notifications.filter((notification) => !notification.isRead)
    }

    if (activeFilter === 'system') {
      return notifications.filter(isSystemAlert)
    }

    return notifications
  }, [activeFilter, notifications])

  async function handleNotificationClick(notification) {
    if (notification.isRead) {
      return
    }

    const response = await fetch(`${API_BASE_URL}/Notifications/${notification.id}/read`, {
      method: 'PUT',
    })

    if (response.ok) {
      loadNotifications()
    }
  }

  async function handleMarkAllAsRead() {
    const unreadNotifications = notifications.filter((notification) => !notification.isRead)

    if (unreadNotifications.length === 0) {
      return
    }

    setIsMarkingAll(true)

    await Promise.all(
      unreadNotifications.map((notification) =>
        fetch(`${API_BASE_URL}/Notifications/${notification.id}/read`, {
          method: 'PUT',
        }),
      ),
    )

    setIsMarkingAll(false)
    loadNotifications()
  }

  function handlePreferenceChange(preferenceId) {
    setNotificationPreferences((currentPreferences) => ({
      ...currentPreferences,
      [preferenceId]: !currentPreferences[preferenceId],
    }))
  }

  function handleSavePreferences() {
    setIsSettingsOpen(false)
    setSuccessMessage('Notification preferences saved.')

    window.setTimeout(() => {
      setSuccessMessage('')
    }, 3500)
  }

  return (
    <DashboardLayout>
      <div className="notifications-page">
        <div className="notifications-header">
          <div>
            <h2>Notifications Center</h2>
            <p>Stay updated with the latest ticket movements and system updates.</p>
          </div>

          <div className="notifications-header-actions">
            <button type="button" onClick={handleMarkAllAsRead} disabled={isMarkingAll || unreadCount === 0}>
              <CheckCheck size={18} strokeWidth={2} />
              <span>{isMarkingAll ? 'Marking...' : 'Mark all as read'}</span>
            </button>
            <button type="button" onClick={() => setIsSettingsOpen(true)}>
              <Settings size={18} strokeWidth={2} />
              <span>Notification Settings</span>
            </button>
          </div>
        </div>

        <section className="notifications-panel">
          <div className="notifications-toolbar">
            <div className="notification-tabs" role="tablist" aria-label="Notification filters">
              {filters.map((filter) => (
                <button
                  className={activeFilter === filter.id ? 'active' : ''}
                  key={filter.id}
                  type="button"
                  onClick={() => setActiveFilter(filter.id)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="notifications-count">
              <span>{unreadCount}</span>
              unread
            </div>
          </div>

          {errorMessage && <div className="notifications-message error">{errorMessage}</div>}
          {successMessage && <div className="notifications-message success">{successMessage}</div>}
          {isLoading && <div className="notifications-empty">Loading notifications...</div>}

          {!isLoading && !errorMessage && filteredNotifications.length === 0 && (
            <div className="notifications-empty">No notifications yet.</div>
          )}

          {!isLoading && !errorMessage && filteredNotifications.length > 0 && (
            <div className="notifications-list">
              {filteredNotifications.map((notification) => {
                const isUnread = !notification.isRead
                const display = getNotificationDisplay(notification)
                const Icon = display.Icon

                return (
                  <button
                    className={`notification-card${isUnread ? ' unread' : ''}`}
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <span
                      className="notification-icon"
                      style={{ backgroundColor: display.iconBackgroundColor, color: display.iconColor }}
                      aria-hidden="true"
                    >
                      <Icon size={20} strokeWidth={2} />
                    </span>
                    <span className="notification-content">
                      <span className="notification-title-row">
                        <span className="notification-title-block">
                          <strong>{notification.title || 'Notification'}</strong>
                          <span className={`notification-category-badge ${display.categoryBadgeClass}`}>
                            {display.categoryLabel}
                          </span>
                        </span>
                        {isUnread && <span className="notification-unread-dot" aria-label="Unread notification"></span>}
                      </span>
                      <span className="notification-message">{notification.message || '-'}</span>
                      <time>{formatDate(notification.createdAt)}</time>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </section>

        {isSettingsOpen && (
          <div className="notification-settings-overlay" role="presentation">
            <div className="notification-settings-modal" role="dialog" aria-modal="true" aria-labelledby="notification-settings-title">
              <div className="notification-settings-header">
                <div>
                  <h3 id="notification-settings-title">Notification Settings</h3>
                  <p>Choose which notification types you want to receive.</p>
                </div>
                <button
                  className="notification-settings-close"
                  type="button"
                  aria-label="Close notification settings"
                  onClick={() => setIsSettingsOpen(false)}
                >
                  x
                </button>
              </div>

              <div className="notification-settings-options">
                {notificationPreferenceOptions.map((option) => (
                  <label className="notification-settings-option" htmlFor={`notification-setting-${option.id}`} key={option.id}>
                    <input
                      id={`notification-setting-${option.id}`}
                      type="checkbox"
                      checked={notificationPreferences[option.id]}
                      onChange={() => handlePreferenceChange(option.id)}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>

              <p className="notification-settings-note">
                Preferences are saved locally for now and can be connected to the backend later.
              </p>

              <div className="notification-settings-actions">
                <button type="button" onClick={() => setIsSettingsOpen(false)}>
                  Cancel
                </button>
                <button type="button" onClick={handleSavePreferences}>
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Notifications
