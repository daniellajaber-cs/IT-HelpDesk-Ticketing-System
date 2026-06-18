import {
  Bell,
  CheckCircle2,
  CircleDot,
  Clock3,
  ClipboardList,
  FileText,
  Inbox,
  Lock,
  MessageSquare,
  Paperclip,
  Ticket,
  UserCheck,
  UserRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import DashboardLayout from '../components/DashboardLayout'

const API_BASE_URL = 'http://localhost:5227/api'
const categoryProgressColors = ['#2563eb', '#f97316', '#475569', '#dc2626', '#16a34a', '#7c3aed']

const systemKpiConfig = [
  { key: 'totalTickets', label: 'Total Tickets', icon: Ticket, iconColor: '#1d4ed8', iconBackground: '#eff6ff' },
  { key: 'openTickets', label: 'Open Tickets', icon: Inbox, iconColor: '#1d4ed8', iconBackground: '#eff6ff' },
  { key: 'inProgressTickets', label: 'In Progress', icon: Clock3, iconColor: '#7c3aed', iconBackground: '#f5f3ff' },
  { key: 'pendingTickets', label: 'Pending', icon: ClipboardList, iconColor: '#475569', iconBackground: '#f1f5f9' },
  { key: 'resolvedTickets', label: 'Resolved', icon: CheckCircle2, iconColor: '#15803d', iconBackground: '#ecfdf3' },
  { key: 'closedTickets', label: 'Closed', icon: Lock, iconColor: '#b42318', iconBackground: '#fff1f3' },
]

const agentWorkloadConfig = [
  { key: 'assignedToday', label: 'Assigned Today', color: '#2563eb', background: '#eff6ff' },
  { key: 'resolvedToday', label: 'Resolved Today', color: '#15803d', background: '#ecfdf3' },
  { key: 'pendingReview', label: 'Pending Review', color: '#d97706', background: '#fffbeb' },
]

function formatKpiPercentage(count, total) {
  if (!total) {
    return '0%'
  }

  return `${Math.round((count / total) * 100)}%`
}

function getBadgeClass(value) {
  return String(value || '').toLowerCase().replaceAll(' ', '-')
}

function formatActivityDate(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)
  const dateText = date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
  const timeText = date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })

  return `${dateText} • ${timeText}`
}

function getActivityDisplay(action) {
  const normalizedAction = String(action || '').toLowerCase()

  if (normalizedAction.includes('comment')) {
    return { Icon: MessageSquare, color: '#15803d', background: '#ecfdf3' }
  }

  if (normalizedAction.includes('assign')) {
    return { Icon: UserCheck, color: '#c2410c', background: '#fff7ed' }
  }

  if (normalizedAction.includes('attachment') || normalizedAction.includes('upload')) {
    return { Icon: Paperclip, color: '#7c3aed', background: '#f5f3ff' }
  }

  if (normalizedAction.includes('internal note')) {
    return { Icon: FileText, color: '#475569', background: '#f1f5f9' }
  }

  if (normalizedAction.includes('action log') || normalizedAction.includes('work')) {
    return { Icon: ClipboardList, color: '#0f766e', background: '#ccfbf1' }
  }

  return { Icon: CircleDot, color: '#2563eb', background: '#eff6ff' }
}

function Dashboard() {
  const role = localStorage.getItem('role') || 'Employee'
  const currentUserId = Number(localStorage.getItem('userId') || 0)
  const fullName = localStorage.getItem('fullName') || 'SupportOps User'
  const firstName = fullName.split(' ')[0] || fullName
  const [stats, setStats] = useState(null)
  const [allTickets, setAllTickets] = useState([])
  const [ticketsByStatus, setTicketsByStatus] = useState([])
  const [ticketsByCategory, setTicketsByCategory] = useState([])
  const [ticketsByPriority, setTicketsByPriority] = useState([])
  const [recentTickets, setRecentTickets] = useState([])
  const [statuses, setStatuses] = useState([])
  const [priorities, setPriorities] = useState([])
  const [categories, setCategories] = useState([])
  const [users, setUsers] = useState([])
  const [topAgents, setTopAgents] = useState([])
  const [notifications, setNotifications] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [
          statsResponse,
          statusResponse,
          categoryResponse,
          priorityResponse,
          recentTicketsResponse,
          statusesResponse,
          prioritiesResponse,
          categoriesResponse,
          usersResponse,
          topAgentsResponse,
          ticketsResponse,
          notificationsResponse,
          recentActivityResponse,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/Dashboard/stats`),
          fetch(`${API_BASE_URL}/Dashboard/tickets-by-status`),
          fetch(`${API_BASE_URL}/Dashboard/tickets-by-category`),
          fetch(`${API_BASE_URL}/Dashboard/tickets-by-priority`),
          fetch(`${API_BASE_URL}/Dashboard/recent-tickets`),
          fetch(`${API_BASE_URL}/Statuses`),
          fetch(`${API_BASE_URL}/Priorities`),
          fetch(`${API_BASE_URL}/Categories`),
          fetch(`${API_BASE_URL}/Users`),
          fetch(`${API_BASE_URL}/Dashboard/top-agents`),
          fetch(`${API_BASE_URL}/Tickets`),
          currentUserId ? fetch(`${API_BASE_URL}/Notifications/user/${currentUserId}`) : Promise.resolve(null),
          fetch(`${API_BASE_URL}/Dashboard/recent-activity`),
        ])

        const requiredResponses = [
          statsResponse,
          statusResponse,
          categoryResponse,
          priorityResponse,
          recentTicketsResponse,
          topAgentsResponse,
          recentActivityResponse,
        ]

        if (requiredResponses.some((response) => !response.ok)) {
          throw new Error('Unable to load dashboard data.')
        }

        const [
          statsData,
          statusData,
          categoryData,
          priorityData,
          recentTicketsData,
          statusesData,
          prioritiesData,
          categoriesData,
          usersData,
          topAgentsData,
          ticketsData,
          notificationsData,
          recentActivityData,
        ] = await Promise.all([
          statsResponse.json(),
          statusResponse.json(),
          categoryResponse.json(),
          priorityResponse.json(),
          recentTicketsResponse.json(),
          statusesResponse.ok ? statusesResponse.json() : Promise.resolve([]),
          prioritiesResponse.ok ? prioritiesResponse.json() : Promise.resolve([]),
          categoriesResponse.ok ? categoriesResponse.json() : Promise.resolve([]),
          usersResponse.ok ? usersResponse.json() : Promise.resolve([]),
          topAgentsResponse.json(),
          ticketsResponse.ok ? ticketsResponse.json() : Promise.resolve([]),
          notificationsResponse?.ok ? notificationsResponse.json() : Promise.resolve([]),
          recentActivityResponse.json(),
        ])

        setStats(statsData)
        setAllTickets(Array.isArray(ticketsData) ? ticketsData : [])
        setTicketsByStatus(Array.isArray(statusData) ? statusData : [])
        setTicketsByCategory(Array.isArray(categoryData) ? categoryData : [])
        setTicketsByPriority(Array.isArray(priorityData) ? priorityData : [])
        setRecentTickets(Array.isArray(recentTicketsData) ? recentTicketsData : [])
        setStatuses(Array.isArray(statusesData) ? statusesData : [])
        setPriorities(Array.isArray(prioritiesData) ? prioritiesData : [])
        setCategories(Array.isArray(categoriesData) ? categoriesData : [])
        setUsers(Array.isArray(usersData) ? usersData : [])
        setTopAgents(Array.isArray(topAgentsData) ? topAgentsData : [])
        setNotifications(Array.isArray(notificationsData) ? notificationsData : [])
        setRecentActivity(Array.isArray(recentActivityData) ? recentActivityData : [])
      } catch (error) {
        console.log(error)
        setErrorMessage('Unable to load dashboard analytics. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [currentUserId])

  const scopedTickets = useMemo(() => {
    if (role === 'Employee') {
      return allTickets.filter((ticket) => ticket.createdByUserId === currentUserId)
    }

    if (role === 'IT Support Agent') {
      return allTickets.filter((ticket) => ticket.assignedToUserId === currentUserId)
    }

    return allTickets
  }, [allTickets, currentUserId, role])

  const scopedStats = useMemo(() => {
    const countByStatus = (statusName) =>
      scopedTickets.filter((ticket) => {
        const status = statuses.find((item) => item.id === ticket.statusId)

        return String(status?.name || '').toLowerCase() === statusName.toLowerCase()
      }).length

    return {
      totalTickets: scopedTickets.length,
      assignedTickets: scopedTickets.length,
      openTickets: countByStatus('Open'),
      inProgressTickets: countByStatus('In Progress'),
      pendingTickets: countByStatus('Pending'),
      resolvedTickets: countByStatus('Resolved'),
      closedTickets: countByStatus('Closed'),
    }
  }, [scopedTickets, statuses])

  const dashboardStats = role === 'Admin' || role === 'Manager' ? stats || scopedStats : scopedStats
  const totalTickets = Number(dashboardStats?.totalTickets || dashboardStats?.assignedTickets || 0)

  const scopedTicketsByStatus = useMemo(
    () =>
      statuses.map((status) => ({
        status: status.name,
        count: scopedTickets.filter((ticket) => ticket.statusId === status.id).length,
      })),
    [scopedTickets, statuses],
  )

  const scopedTicketsByCategory = useMemo(
    () =>
      categories.map((category) => ({
        category: category.name,
        count: scopedTickets.filter((ticket) => ticket.categoryId === category.id).length,
      })),
    [categories, scopedTickets],
  )

  const scopedTicketsByPriority = useMemo(
    () =>
      priorities.map((priority) => ({
        priority: priority.name,
        count: scopedTickets.filter((ticket) => ticket.priorityId === priority.id).length,
      })),
    [priorities, scopedTickets],
  )

  const visibleTicketsByStatus = role === 'Admin' || role === 'Manager' ? ticketsByStatus : scopedTicketsByStatus
  const visibleTicketsByCategory = role === 'Admin' || role === 'Manager' ? ticketsByCategory : scopedTicketsByCategory
  const visibleTicketsByPriority = role === 'Admin' || role === 'Manager' ? ticketsByPriority : scopedTicketsByPriority
  const highestStatusCount = Math.max(0, ...visibleTicketsByStatus.map((item) => Number(item.count || 0)))

  const roleKpiConfig =
    role === 'Employee'
      ? [
          { key: 'totalTickets', label: 'My Total Tickets', icon: Ticket, iconColor: '#1d4ed8', iconBackground: '#eff6ff' },
          { key: 'openTickets', label: 'My Open Tickets', icon: Inbox, iconColor: '#1d4ed8', iconBackground: '#eff6ff' },
          { key: 'pendingTickets', label: 'My Pending Tickets', icon: ClipboardList, iconColor: '#475569', iconBackground: '#f1f5f9' },
          { key: 'resolvedTickets', label: 'My Resolved Tickets', icon: CheckCircle2, iconColor: '#15803d', iconBackground: '#ecfdf3' },
        ]
      : role === 'IT Support Agent'
        ? [
            { key: 'assignedTickets', label: 'Assigned To Me', icon: UserRound, iconColor: '#1d4ed8', iconBackground: '#eff6ff' },
            { key: 'openTickets', label: 'My Open Tickets', icon: Inbox, iconColor: '#1d4ed8', iconBackground: '#eff6ff' },
            { key: 'inProgressTickets', label: 'My In Progress', icon: Clock3, iconColor: '#7c3aed', iconBackground: '#f5f3ff' },
            { key: 'resolvedTickets', label: 'My Resolved Tickets', icon: CheckCircle2, iconColor: '#15803d', iconBackground: '#ecfdf3' },
          ]
        : role === 'Manager'
          ? systemKpiConfig.filter((item) =>
              ['totalTickets', 'openTickets', 'pendingTickets', 'resolvedTickets'].includes(item.key),
            )
          : systemKpiConfig

  const dashboardTitle =
    role === 'Admin'
      ? 'System Overview'
      : role === 'Manager'
        ? 'Manager Dashboard'
        : role === 'IT Support Agent'
          ? 'Agent Dashboard'
          : 'Employee Dashboard'

  const dashboardSubtitle =
    role === 'Employee'
      ? 'Here is the latest overview of your help desk tickets.'
      : role === 'IT Support Agent'
        ? 'Manage your assigned tickets, track progress, and stay updated with the latest ticket activity.'
        : role === 'Manager'
          ? 'Here is the latest reporting overview for ticket operations.'
          : 'Here is the latest full system overview.'

  const recentTicketSource = role === 'Admin' || role === 'Manager' ? recentTickets : scopedTickets
  const todayDateKey = new Date().toDateString()
  const agentWorkloadStats = useMemo(
    () => ({
      assignedToday: scopedTickets.filter((ticket) => new Date(ticket.createdAt || 0).toDateString() === todayDateKey).length,
      resolvedToday: scopedTickets.filter((ticket) => {
        const status = statuses.find((item) => item.id === ticket.statusId)
        const resolvedDate = ticket.resolvedAt || ticket.closedAt || ticket.updatedAt

        return String(status?.name || '').toLowerCase() === 'resolved' && new Date(resolvedDate || 0).toDateString() === todayDateKey
      }).length,
      pendingReview: scopedTickets.filter((ticket) => {
        const status = statuses.find((item) => item.id === ticket.statusId)

        return String(status?.name || '').toLowerCase() === 'pending'
      }).length,
    }),
    [scopedTickets, statuses, todayDateKey],
  )

  const recentTicketsWithLabels = useMemo(
    () =>
      [...recentTicketSource]
        .sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0))
        .slice(0, 5)
        .map((ticket) => {
        const status = statuses.find((item) => item.id === ticket.statusId)
        const priority = priorities.find((item) => item.id === ticket.priorityId)
        const requester = users.find((item) => item.id === ticket.createdByUserId)

        return {
          ...ticket,
          statusName: status?.name || `Status ${ticket.statusId || '-'}`,
          priorityName: priority?.name || `Priority ${ticket.priorityId || '-'}`,
          requesterName:
            ticket.requesterName ||
            ticket.employeeName ||
            ticket.createdByUser?.fullName ||
            ticket.createdByUserFullName ||
            ticket.createdByName ||
            requester?.fullName ||
            requester?.email ||
            'Unknown requester',
        }
      }),
    [priorities, recentTicketSource, statuses, users],
  )

  const activityCard = (
    <article className="dashboard-activity-card">
      <div className="dashboard-card-header">
        <h3>Recent Activity</h3>
        <Link className="dashboard-view-all-link" to="/tickets">
          View All
        </Link>
      </div>
      {recentActivity.length === 0 ? (
        <div className="dashboard-activity-empty">No recent activity available yet.</div>
      ) : (
        <div className="dashboard-activity-list">
          {recentActivity.slice(0, 4).map((activity) => {
            const display = getActivityDisplay(activity.action)
            const Icon = display.Icon

            return (
              <div className="dashboard-activity-item" key={activity.id}>
                <span
                  className="dashboard-activity-icon"
                  style={{ backgroundColor: display.background, color: display.color }}
                >
                  <Icon size={14} strokeWidth={2} />
                </span>
                <span className="dashboard-activity-copy">
                  <strong>{activity.action || 'Ticket Activity'}</strong>
                  <span>
                    {activity.ticketNumber || `TCK-${activity.ticketId}`} • {activity.oldValue || '-'} {'→'}{' '}
                    {activity.newValue || '-'}
                  </span>
                  <time>{formatActivityDate(activity.createdAt)}</time>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )

  return (
    <DashboardLayout>
      <div className="analytics-dashboard-page">
        <header className="analytics-dashboard-header">
          <div>
            <h2>{dashboardTitle}</h2>
            <p className="analytics-dashboard-welcome">
              Welcome back, {role === 'Admin' ? `${firstName}.` : fullName}
            </p>
            <p className="analytics-dashboard-subtitle">
              {role === 'Admin' ? 'Manage tickets, users, reports, and monitor help desk performance.' : dashboardSubtitle}
            </p>
          </div>
        </header>

        {isLoading && <div className="dashboard-state-card">Loading dashboard analytics...</div>}
        {!isLoading && errorMessage && <div className="dashboard-state-card error">{errorMessage}</div>}

        {!isLoading && !errorMessage && (
          <>
            <section className="dashboard-kpi-grid" aria-label="Ticket statistics">
              {roleKpiConfig.map((item) => {
                const Icon = item.icon
                const count = Number(dashboardStats?.[item.key] || 0)

                return (
                  <article className="dashboard-kpi-card" key={item.key}>
                    <div className="dashboard-kpi-top">
                      <div
                        className="dashboard-kpi-icon"
                        style={{ backgroundColor: item.iconBackground, color: item.iconColor }}
                      >
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <span className="dashboard-kpi-badge">{formatKpiPercentage(count, totalTickets)}</span>
                    </div>
                    <span className="dashboard-kpi-label">{item.label}</span>
                    <strong className="dashboard-kpi-value">{count.toLocaleString()}</strong>
                  </article>
                )
              })}
            </section>

            {role !== 'IT Support Agent' && (
              <section className="dashboard-charts-grid">
                {role !== 'Manager' && (
                  <article className="dashboard-chart-card dashboard-chart-card-large">
                    <div className="dashboard-card-header">
                      <h3>{role === 'Employee' ? 'My Tickets by Status' : 'Tickets by Status'}</h3>
                      <span>{totalTickets.toLocaleString()} total</span>
                    </div>

                    {visibleTicketsByStatus.length === 0 ? (
                      <div className="dashboard-chart-empty">No status data available.</div>
                    ) : (
                      <div className="dashboard-chart-wrap dashboard-status-chart-wrap">
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={visibleTicketsByStatus} margin={{ top: 10, right: 8, left: -22, bottom: 0 }}>
                            <CartesianGrid stroke="#eef2f7" vertical={false} />
                            <XAxis
                              dataKey="status"
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 11, fill: '#667085' }}
                              interval={0}
                            />
                            <YAxis
                              allowDecimals={false}
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 11, fill: '#667085' }}
                            />
                            <Tooltip />
                            <Bar dataKey="count" radius={[7, 7, 0, 0]} barSize={34}>
                              {visibleTicketsByStatus.map((entry) => (
                                <Cell
                                  key={entry.status}
                                  fill={Number(entry.count || 0) === highestStatusCount ? '#2563eb' : '#dbeafe'}
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </article>
                )}

                <article className="dashboard-chart-card">
                  <div className="dashboard-card-header">
                    <h3>{role === 'Employee' ? 'My Tickets by Category' : 'By Category'}</h3>
                  </div>

                  {visibleTicketsByCategory.length === 0 ? (
                    <div className="dashboard-chart-empty">No category data available.</div>
                  ) : (
                    <div className="dashboard-category-list">
                      {visibleTicketsByCategory.map((item, index) => {
                        const count = Number(item.count || 0)
                        const percentage = totalTickets ? Math.round((count / totalTickets) * 100) : 0
                        const color = categoryProgressColors[index % categoryProgressColors.length]

                        return (
                          <div className="dashboard-category-item" key={item.category}>
                            <div className="dashboard-category-row">
                              <span>{item.category}</span>
                              <strong>{percentage}%</strong>
                            </div>
                            <div className="dashboard-category-track">
                              <span style={{ width: `${percentage}%`, backgroundColor: color }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </article>

                {role === 'Manager' && (
                  <article className="dashboard-chart-card">
                    <div className="dashboard-card-header">
                      <h3>Tickets by Priority</h3>
                    </div>

                    {visibleTicketsByPriority.length === 0 ? (
                      <div className="dashboard-chart-empty">No priority data available.</div>
                    ) : (
                      <div className="dashboard-category-list">
                        {visibleTicketsByPriority.map((item, index) => {
                          const count = Number(item.count || 0)
                          const percentage = totalTickets ? Math.round((count / totalTickets) * 100) : 0
                          const color = categoryProgressColors[index % categoryProgressColors.length]

                          return (
                            <div className="dashboard-category-item" key={item.priority}>
                              <div className="dashboard-category-row">
                                <span>{item.priority}</span>
                                <strong>{percentage}%</strong>
                              </div>
                              <div className="dashboard-category-track">
                                <span style={{ width: `${percentage}%`, backgroundColor: color }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </article>
                )}
              </section>
            )}

            {role === 'Admin' && (
              <section className="dashboard-admin-secondary-grid">
                <article className="dashboard-chart-card">
                  <div className="dashboard-card-header">
                    <h3>Tickets by Priority</h3>
                  </div>

                  {visibleTicketsByPriority.length === 0 ? (
                    <div className="dashboard-chart-empty">No priority data available.</div>
                  ) : (
                    <div className="dashboard-category-list">
                      {visibleTicketsByPriority.map((item, index) => {
                        const count = Number(item.count || 0)
                        const percentage = totalTickets ? Math.round((count / totalTickets) * 100) : 0
                        const color = categoryProgressColors[index % categoryProgressColors.length]

                        return (
                          <div className="dashboard-category-item" key={item.priority}>
                            <div className="dashboard-category-row">
                              <span>{item.priority}</span>
                              <strong>{percentage}%</strong>
                            </div>
                            <div className="dashboard-category-track">
                              <span style={{ width: `${percentage}%`, backgroundColor: color }} />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </article>

                {activityCard}
              </section>
            )}

            <section className={`dashboard-bottom-grid${role === 'Admin' ? ' dashboard-bottom-grid-single' : ''}`}>
              <article className="dashboard-table-card">
                <div className="dashboard-card-header">
                  <h3>
                    {role === 'Employee'
                      ? 'My Recent Tickets'
                      : role === 'IT Support Agent'
                        ? 'Assigned Tickets'
                        : 'Recent Tickets'}
                  </h3>
                  <Link className="dashboard-view-all-link" to="/tickets">
                    View All
                  </Link>
                </div>

                {recentTicketsWithLabels.length === 0 ? (
                  <div className="dashboard-chart-empty">No tickets exist yet.</div>
                ) : (
                  <div className="dashboard-recent-table-wrap">
                    <table className="dashboard-recent-table">
                      <thead>
                        <tr>
                          <th className="dashboard-ticket-number-col">Ticket Number</th>
                          <th className="dashboard-ticket-title-col">Title</th>
                          <th className="dashboard-ticket-requester-col">Requester</th>
                          <th className="dashboard-ticket-badge-col">Status</th>
                          <th className="dashboard-ticket-badge-col">Priority</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTicketsWithLabels.map((ticket) => (
                          <tr key={ticket.id}>
                            <td className="dashboard-ticket-number-col">
                              <Link className="dashboard-ticket-number" to={`/tickets/${ticket.id}`}>
                                {ticket.ticketNumber || `TCK-${ticket.id}`}
                              </Link>
                            </td>
                            <td className="dashboard-ticket-title-col">{ticket.title || '-'}</td>
                            <td className="dashboard-ticket-requester-col">{ticket.requesterName}</td>
                            <td className="dashboard-ticket-badge-col">
                              <span className={`dashboard-status-badge ${getBadgeClass(ticket.statusName)}`}>
                                {ticket.statusName}
                              </span>
                            </td>
                            <td className="dashboard-ticket-badge-col">
                              <span className={`dashboard-priority-badge ${getBadgeClass(ticket.priorityName)}`}>
                                {ticket.priorityName}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>

              {role !== 'Admin' && (role === 'Employee' || role === 'IT Support Agent') && (
                <article className="dashboard-activity-card">
                  <div className="dashboard-card-header">
                    <h3>Notifications Preview</h3>
                    {role === 'IT Support Agent' ? (
                      <Link className="dashboard-view-all-link" to="/notifications">
                        View All
                      </Link>
                    ) : (
                      <Bell size={16} strokeWidth={2} />
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="dashboard-activity-empty">No notifications available yet.</div>
                  ) : (
                    <div className="dashboard-notification-preview-list">
                      {notifications.slice(0, role === 'IT Support Agent' ? 3 : 4).map((notification) => (
                        <Link className="dashboard-notification-preview-item" to="/notifications" key={notification.id}>
                          <strong>{notification.title || 'Notification'}</strong>
                          <span>{notification.message || '-'}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </article>
              )}
              {role === 'Manager' && activityCard}
            </section>

            {role === 'IT Support Agent' && (
              <section className="dashboard-agent-workload-section">
                <div className="dashboard-card-header">
                  <h3>Today's Workload</h3>
                </div>
                <div className="dashboard-agent-workload-grid">
                  {agentWorkloadConfig.map((item) => (
                    <div className="dashboard-agent-workload-item" key={item.key}>
                      <span
                        className="dashboard-agent-workload-icon"
                        style={{ backgroundColor: item.background, color: item.color }}
                      >
                        <CircleDot size={14} strokeWidth={2.4} />
                      </span>
                      <span>{item.label}</span>
                      <strong>{Number(agentWorkloadStats[item.key] || 0).toLocaleString()}</strong>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(role === 'Admin' || role === 'Manager') && (
              <section className="dashboard-agents-section">
                <div className="dashboard-card-header">
                  <h3>Top Performing Agents</h3>
                </div>

                {topAgents.length === 0 ? (
                  <div className="dashboard-chart-empty">No agent performance data available yet.</div>
                ) : (
                  <div className="dashboard-agents-grid">
                    {topAgents.map((agent) => {
                      const resolvedTickets = Number(agent.resolvedTickets || 0)

                      return (
                        <article className="dashboard-agent-card" key={agent.id}>
                          <div className="dashboard-agent-avatar">
                            <UserRound size={18} strokeWidth={2} />
                          </div>
                          <div className="dashboard-agent-copy">
                            <strong>{agent.fullName || 'Unnamed agent'}</strong>
                            <span>
                              {resolvedTickets.toLocaleString()} Resolved {resolvedTickets === 1 ? 'Ticket' : 'Tickets'}
                            </span>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
