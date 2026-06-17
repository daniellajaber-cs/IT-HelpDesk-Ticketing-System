import {
  AlertCircle,
  CheckCircle2,
  CircleDot,
  Clock3,
  Inbox,
  Lock,
  Ticket,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import DashboardLayout from '../components/DashboardLayout'

const API_BASE_URL = 'http://localhost:5227/api'
const chartColors = ['#2563eb', '#64748b', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0284c7']

const kpiConfig = [
  { key: 'totalTickets', label: 'Total Tickets', icon: Ticket, color: '#1d4ed8', background: '#eff6ff' },
  { key: 'openTickets', label: 'Open Tickets', icon: Inbox, color: '#0369a1', background: '#f0f9ff' },
  { key: 'inProgressTickets', label: 'In Progress', icon: Clock3, color: '#6d28d9', background: '#f5f3ff' },
  { key: 'pendingTickets', label: 'Pending', icon: AlertCircle, color: '#b45309', background: '#fffbeb' },
  { key: 'resolvedTickets', label: 'Resolved', icon: CheckCircle2, color: '#15803d', background: '#f0fdf4' },
  { key: 'closedTickets', label: 'Closed', icon: Lock, color: '#475569', background: '#f8fafc' },
]

function formatDate(value) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleDateString()
}

function getBadgeClass(value) {
  return String(value || '').toLowerCase().replaceAll(' ', '-')
}

function Dashboard() {
  const fullName = localStorage.getItem('fullName') || 'SupportOps User'
  const [stats, setStats] = useState(null)
  const [ticketsByStatus, setTicketsByStatus] = useState([])
  const [ticketsByCategory, setTicketsByCategory] = useState([])
  const [ticketsByPriority, setTicketsByPriority] = useState([])
  const [recentTickets, setRecentTickets] = useState([])
  const [statuses, setStatuses] = useState([])
  const [priorities, setPriorities] = useState([])
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
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/Dashboard/stats`),
          fetch(`${API_BASE_URL}/Dashboard/tickets-by-status`),
          fetch(`${API_BASE_URL}/Dashboard/tickets-by-category`),
          fetch(`${API_BASE_URL}/Dashboard/tickets-by-priority`),
          fetch(`${API_BASE_URL}/Dashboard/recent-tickets`),
          fetch(`${API_BASE_URL}/Statuses`),
          fetch(`${API_BASE_URL}/Priorities`),
        ])

        const requiredResponses = [statsResponse, statusResponse, categoryResponse, priorityResponse, recentTicketsResponse]

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
        ] = await Promise.all([
          statsResponse.json(),
          statusResponse.json(),
          categoryResponse.json(),
          priorityResponse.json(),
          recentTicketsResponse.json(),
          statusesResponse.ok ? statusesResponse.json() : Promise.resolve([]),
          prioritiesResponse.ok ? prioritiesResponse.json() : Promise.resolve([]),
        ])

        setStats(statsData)
        setTicketsByStatus(Array.isArray(statusData) ? statusData : [])
        setTicketsByCategory(Array.isArray(categoryData) ? categoryData : [])
        setTicketsByPriority(Array.isArray(priorityData) ? priorityData : [])
        setRecentTickets(Array.isArray(recentTicketsData) ? recentTicketsData : [])
        setStatuses(Array.isArray(statusesData) ? statusesData : [])
        setPriorities(Array.isArray(prioritiesData) ? prioritiesData : [])
      } catch (error) {
        console.log(error)
        setErrorMessage('Unable to load dashboard analytics. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const totalTickets = Number(stats?.totalTickets || 0)

  const recentTicketsWithLabels = useMemo(
    () =>
      recentTickets.map((ticket) => {
        const status = statuses.find((item) => item.id === ticket.statusId)
        const priority = priorities.find((item) => item.id === ticket.priorityId)

        return {
          ...ticket,
          statusName: status?.name || `Status ${ticket.statusId || '-'}`,
          priorityName: priority?.name || `Priority ${ticket.priorityId || '-'}`,
        }
      }),
    [priorities, recentTickets, statuses],
  )

  return (
    <DashboardLayout>
      <div className="analytics-dashboard-page">
        <header className="analytics-dashboard-header">
          <div>
            <h2>Help Desk Dashboard</h2>
            <p className="analytics-dashboard-welcome">Welcome back, {fullName}</p>
            <p className="analytics-dashboard-subtitle">
              Systems are operational. Here is the latest help desk overview.
            </p>
          </div>
        </header>

        {isLoading && <div className="dashboard-state-card">Loading dashboard analytics...</div>}
        {!isLoading && errorMessage && <div className="dashboard-state-card error">{errorMessage}</div>}

        {!isLoading && !errorMessage && (
          <>
            <section className="dashboard-kpi-grid" aria-label="Ticket statistics">
              {kpiConfig.map((item) => {
                const Icon = item.icon

                return (
                  <article className="dashboard-kpi-card" key={item.key}>
                    <div className="dashboard-kpi-icon" style={{ backgroundColor: item.background, color: item.color }}>
                      <Icon size={22} strokeWidth={2} />
                    </div>
                    <div>
                      <span>{item.label}</span>
                      <strong>{Number(stats?.[item.key] || 0).toLocaleString()}</strong>
                    </div>
                  </article>
                )
              })}
            </section>

            <section className="dashboard-charts-grid">
              <article className="dashboard-chart-card dashboard-chart-card-large">
                <div className="dashboard-card-header">
                  <h3>Tickets by Status</h3>
                  <span>{totalTickets.toLocaleString()} total</span>
                </div>

                {ticketsByStatus.length === 0 ? (
                  <div className="dashboard-chart-empty">No status data available.</div>
                ) : (
                  <div className="dashboard-chart-wrap">
                    <ResponsiveContainer width="100%" height={235}>
                      <PieChart>
                        <Pie
                          data={ticketsByStatus}
                          dataKey="count"
                          nameKey="status"
                          innerRadius={54}
                          outerRadius={82}
                          paddingAngle={2}
                        >
                          {ticketsByStatus.map((entry, index) => (
                            <Cell key={entry.status} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="dashboard-chart-card">
                <div className="dashboard-card-header">
                  <h3>Tickets by Category</h3>
                </div>

                {ticketsByCategory.length === 0 ? (
                  <div className="dashboard-chart-empty">No category data available.</div>
                ) : (
                  <div className="dashboard-chart-wrap">
                    <ResponsiveContainer width="100%" height={235}>
                      <BarChart data={ticketsByCategory}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="category" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="count" fill="#2563eb" radius={[5, 5, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>
            </section>

            <section className="dashboard-bottom-grid">
              <article className="dashboard-chart-card dashboard-priority-card">
                <div className="dashboard-card-header">
                  <h3>Tickets by Priority</h3>
                </div>

                {ticketsByPriority.length === 0 ? (
                  <div className="dashboard-chart-empty">No priority data available.</div>
                ) : (
                  <div className="dashboard-chart-wrap">
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={ticketsByPriority}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="priority" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                          {ticketsByPriority.map((entry, index) => (
                            <Cell key={entry.priority} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </article>

              <article className="dashboard-activity-card">
                <div className="dashboard-card-header">
                  <h3>Recent Activity</h3>
                  <CircleDot size={16} strokeWidth={2} />
                </div>
                <div className="dashboard-activity-empty">No recent activity available yet.</div>
              </article>
            </section>

            <section className="dashboard-table-section">
              <article className="dashboard-table-card">
                <div className="dashboard-card-header">
                  <h3>Recent Tickets</h3>
                </div>

                {recentTicketsWithLabels.length === 0 ? (
                  <div className="dashboard-chart-empty">No tickets exist yet.</div>
                ) : (
                  <div className="dashboard-recent-table-wrap">
                    <table className="dashboard-recent-table">
                      <thead>
                        <tr>
                          <th>Ticket Number</th>
                          <th>Title</th>
                          <th>Status</th>
                          <th>Priority</th>
                          <th>Created Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentTicketsWithLabels.map((ticket) => (
                          <tr key={ticket.id}>
                            <td>
                              <span className="dashboard-ticket-number">{ticket.ticketNumber || `TCK-${ticket.id}`}</span>
                            </td>
                            <td>{ticket.title || '-'}</td>
                            <td>
                              <span className={`dashboard-status-badge ${getBadgeClass(ticket.statusName)}`}>
                                {ticket.statusName}
                              </span>
                            </td>
                            <td>
                              <span className={`dashboard-priority-badge ${getBadgeClass(ticket.priorityName)}`}>
                                {ticket.priorityName}
                              </span>
                            </td>
                            <td>{formatDate(ticket.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </article>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Dashboard
