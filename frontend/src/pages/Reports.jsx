import {
  Download,
  FileText,
  PieChart as PieChartIcon,
  Timer,
  UsersRound,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
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
const analyticsColors = ['#2563eb', '#16a34a', '#f97316', '#7c3aed', '#475569', '#dc2626']

const overviewItems = [
  { key: 'totalTickets', label: 'Total Tickets', color: '#2563eb' },
  { key: 'openTickets', label: 'Open Tickets', color: '#0f766e' },
  { key: 'pendingTickets', label: 'Pending Tickets', color: '#d97706' },
  { key: 'resolvedTickets', label: 'Resolved Tickets', color: '#16a34a' },
  { key: 'closedTickets', label: 'Closed Tickets', color: '#475569' },
]

const overviewDonutItems = [
  { key: 'openTickets', label: 'Open Tickets', color: '#2563eb' },
  { key: 'pendingTickets', label: 'Pending Tickets', color: '#f59e0b' },
  { key: 'resolvedTickets', label: 'Resolved Tickets', color: '#22c55e' },
  { key: 'closedTickets', label: 'Closed Tickets', color: '#64748b' },
]

function getNumber(value) {
  return Number(value || 0)
}

function formatDateLabel(value) {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function getInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) {
    return 'NA'
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function normalizeBreakdown(data, labelKey) {
  const items = Array.isArray(data) ? data : []
  const total = items.reduce((sum, item) => sum + getNumber(item.count), 0)

  return items.map((item, index) => {
    const count = getNumber(item.count)

    return {
      label: item[labelKey] || 'Uncategorized',
      count,
      percentage: total ? Math.round((count / total) * 100) : 0,
      color: analyticsColors[index % analyticsColors.length],
    }
  })
}

function Reports() {
  const role = localStorage.getItem('role') || 'Employee'
  const fullName = localStorage.getItem('fullName') || 'SupportOps User'
  const canViewReports = role === 'Admin' || role === 'Manager'
  const [overview, setOverview] = useState(null)
  const [ticketVolume, setTicketVolume] = useState([])
  const [resolutionTime, setResolutionTime] = useState(null)
  const [teamPerformance, setTeamPerformance] = useState([])
  const [ticketsByCategory, setTicketsByCategory] = useState([])
  const [ticketsByPriority, setTicketsByPriority] = useState([])
  const [ticketsByStatus, setTicketsByStatus] = useState([])
  const [isLoading, setIsLoading] = useState(canViewReports)
  const [errorMessage, setErrorMessage] = useState('')
  const [exportMessage, setExportMessage] = useState('')

  useEffect(() => {
    if (!canViewReports) {
      setIsLoading(false)
      return
    }

    async function loadReports() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [
          overviewResponse,
          volumeResponse,
          resolutionResponse,
          teamResponse,
          categoryResponse,
          priorityResponse,
          statusResponse,
        ] = await Promise.all([
          fetch(`${API_BASE_URL}/Reports/overview`),
          fetch(`${API_BASE_URL}/Reports/ticket-volume`),
          fetch(`${API_BASE_URL}/Reports/resolution-time`),
          fetch(`${API_BASE_URL}/Reports/team-performance`),
          fetch(`${API_BASE_URL}/Reports/tickets-by-category`),
          fetch(`${API_BASE_URL}/Reports/tickets-by-priority`),
          fetch(`${API_BASE_URL}/Reports/tickets-by-status`),
        ])

        const responses = [
          overviewResponse,
          volumeResponse,
          resolutionResponse,
          teamResponse,
          categoryResponse,
          priorityResponse,
          statusResponse,
        ]

        if (responses.some((response) => !response.ok)) {
          throw new Error('Unable to load reports.')
        }

        const [
          overviewData,
          volumeData,
          resolutionData,
          teamData,
          categoryData,
          priorityData,
          statusData,
        ] = await Promise.all(responses.map((response) => response.json()))

        setOverview(overviewData)
        setTicketVolume(Array.isArray(volumeData) ? volumeData : [])
        setResolutionTime(resolutionData)
        setTeamPerformance(Array.isArray(teamData) ? teamData : [])
        setTicketsByCategory(Array.isArray(categoryData) ? categoryData : [])
        setTicketsByPriority(Array.isArray(priorityData) ? priorityData : [])
        setTicketsByStatus(Array.isArray(statusData) ? statusData : [])
      } catch (error) {
        console.log(error)
        setErrorMessage('Unable to load reports. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    loadReports()
  }, [canViewReports])

  const volumeData = useMemo(
    () =>
      ticketVolume.map((item) => ({
        ...item,
        dateLabel: formatDateLabel(item.date),
        count: getNumber(item.count),
      })),
    [ticketVolume],
  )

  const categoryData = useMemo(() => normalizeBreakdown(ticketsByCategory, 'category'), [ticketsByCategory])
  const priorityData = useMemo(() => normalizeBreakdown(ticketsByPriority, 'priority'), [ticketsByPriority])
  const statusData = useMemo(() => normalizeBreakdown(ticketsByStatus, 'status'), [ticketsByStatus])

  const totalTickets = getNumber(overview?.totalTickets)
  const averageResolutionHours = getNumber(resolutionTime?.averageResolutionHours)
  const pageTitle = role === 'Manager' ? 'Team Reports & Analytics' : 'Reports & Analytics'
  const pageSubtitle =
    role === 'Manager'
      ? 'Monitor ticket operations, team workload, and support performance.'
      : 'Real-time performance monitoring and ticket metrics.'
  const overviewDonutData = overviewDonutItems
    .map((item) => ({
      ...item,
      value: getNumber(overview?.[item.key]),
    }))
    .filter((item) => item.value > 0)

  async function handleExportCsv() {
    setExportMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/Reports/export-csv`)

      if (!response.ok) {
        throw new Error('Unable to export CSV.')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = 'ticket-report.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.log(error)
      setExportMessage('Unable to export CSV. Please try again.')
    }
  }

  async function handleExportPdf() {
    setExportMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/Reports/export-pdf`)

      if (!response.ok) {
        throw new Error('Unable to export PDF.')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = 'ticket-report.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.log(error)
      setExportMessage('Unable to export PDF. Please try again.')
    }
  }

  const breakdownSections = [
    { title: 'Tickets by Category', data: categoryData },
    { title: 'Tickets by Priority', data: priorityData },
    { title: 'Tickets by Status', data: statusData },
  ]

  return (
    <DashboardLayout>
      <div className="reports-page">
        {!canViewReports ? (
          <section className="reports-permission-card">
            You do not have permission to view reports.
          </section>
        ) : (
          <>
            <header className="reports-header" aria-label={`${pageTitle} for ${fullName}`}>
              <div>
                <h2>{pageTitle}</h2>
                <p>{pageSubtitle}</p>
              </div>
              <div className="reports-header-actions">
                <button className="reports-button secondary" type="button" onClick={handleExportCsv}>
                  <Download size={16} strokeWidth={2} />
                  <span>Export CSV</span>
                </button>
                <button className="reports-button primary" type="button" onClick={handleExportPdf}>
                  <FileText size={16} strokeWidth={2} />
                  <span>Export PDF</span>
                </button>
              </div>
            </header>

            {exportMessage && <div className="reports-message">{exportMessage}</div>}
            {isLoading && <div className="reports-state-card">Loading reports...</div>}
            {!isLoading && errorMessage && <div className="reports-state-card error">{errorMessage}</div>}

            {!isLoading && !errorMessage && (
              <>
                <section className="reports-top-grid">
                  <article className="reports-card reports-volume-card">
                    <div className="reports-card-header">
                      <div>
                        <h3>Ticket Volume</h3>
                        <p>Created tickets over time</p>
                      </div>
                      <span>{volumeData.reduce((sum, item) => sum + item.count, 0).toLocaleString()} tickets</span>
                    </div>

                    {volumeData.length === 0 ? (
                      <div className="reports-empty">No ticket volume data available.</div>
                    ) : (
                      <div className="reports-chart-wrap">
                        <ResponsiveContainer width="100%" height={280}>
                          <AreaChart data={volumeData} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="ticketVolumeFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.24} />
                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#eef2f7" vertical={false} />
                            <XAxis
                              dataKey="dateLabel"
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 11, fill: '#667085' }}
                            />
                            <YAxis
                              allowDecimals={false}
                              tickLine={false}
                              axisLine={false}
                              tick={{ fontSize: 11, fill: '#667085' }}
                            />
                            <Tooltip />
                            <Area
                              type="monotone"
                              dataKey="count"
                              stroke="#2563eb"
                              strokeWidth={3}
                              fill="url(#ticketVolumeFill)"
                              dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
                              activeDot={{ r: 5 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </article>

                  <article className="reports-card reports-overview-card">
                    <div className="reports-card-header">
                      <div>
                        <h3>Report Overview</h3>
                        <p>Live ticket distribution</p>
                      </div>
                      <PieChartIcon size={18} strokeWidth={2} />
                    </div>

                    <div className="reports-overview-ring-wrap">
                      <div className="reports-overview-ring">
                        {overviewDonutData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={overviewDonutData}
                                dataKey="value"
                                nameKey="label"
                                cx="50%"
                                cy="50%"
                                innerRadius={65}
                                outerRadius={82}
                                cornerRadius={7}
                                paddingAngle={2}
                                stroke="none"
                                isAnimationActive
                                animationDuration={850}
                                animationEasing="ease-out"
                              >
                                {overviewDonutData.map((item) => (
                                  <Cell key={item.key} fill={item.color} />
                                ))}
                              </Pie>
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <span className="reports-overview-ring-empty" />
                        )}
                        <div className="reports-overview-ring-center">
                          <span>{totalTickets.toLocaleString()}</span>
                          <small>Total Tickets</small>
                        </div>
                      </div>
                    </div>

                    <div className="reports-overview-list">
                      {overviewItems.map((item) => {
                        const value = getNumber(overview?.[item.key])
                        const percentage = totalTickets ? Math.round((value / totalTickets) * 100) : 0

                        return (
                          <div className="reports-overview-item" key={item.key}>
                            <span className="reports-overview-dot" style={{ backgroundColor: item.color }} />
                            <span>{item.label}</span>
                            <strong>{value.toLocaleString()}</strong>
                            <em>{percentage}%</em>
                          </div>
                        )
                      })}
                    </div>
                  </article>
                </section>

                <section className="reports-middle-grid">
                  <article className="reports-card reports-resolution-card">
                    <div className="reports-card-header">
                      <div>
                        <h3>Resolution Time</h3>
                        <p>Average duration for resolved tickets</p>
                      </div>
                      <Timer size={18} strokeWidth={2} />
                    </div>
                    <div className="reports-metric-block">
                      <span>Average Resolution Time</span>
                      <strong>{averageResolutionHours.toLocaleString()} hours</strong>
                    </div>
                  </article>

                  <article className="reports-card reports-team-card">
                    <div className="reports-card-header">
                      <div>
                        <h3>Team Performance</h3>
                        <p>IT Support Agent workload</p>
                      </div>
                      <UsersRound size={18} strokeWidth={2} />
                    </div>

                    {teamPerformance.length === 0 ? (
                      <div className="reports-empty compact">No team performance data available.</div>
                    ) : (
                      <div className="reports-team-table-wrap">
                        <table className="reports-team-table">
                          <thead>
                            <tr>
                              <th>Agent</th>
                              <th>Resolved Tickets</th>
                              <th>Active Tickets</th>
                            </tr>
                          </thead>
                          <tbody>
                            {teamPerformance.map((agent) => (
                              <tr key={agent.agentId || agent.fullName}>
                                <td>
                                  <span className="reports-agent-avatar">{getInitials(agent.fullName)}</span>
                                  <strong>{agent.fullName || 'Unnamed agent'}</strong>
                                </td>
                                <td>{getNumber(agent.resolvedTickets).toLocaleString()}</td>
                                <td>{getNumber(agent.activeTickets).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </article>
                </section>

                <section className="reports-breakdown-grid">
                  {breakdownSections.map((section) => (
                    <article className="reports-card reports-breakdown-card" key={section.title}>
                      <div className="reports-card-header">
                        <div>
                          <h3>{section.title}</h3>
                          <p>Count and share</p>
                        </div>
                      </div>

                      {section.data.length === 0 ? (
                        <div className="reports-empty compact">No data available.</div>
                      ) : (
                        <div className="reports-breakdown-list">
                          {section.data.map((item) => (
                            <div className="reports-breakdown-item" key={item.label}>
                              <div className="reports-breakdown-row">
                                <span>{item.label}</span>
                                <strong>
                                  {item.count.toLocaleString()} ({item.percentage}%)
                                </strong>
                              </div>
                              <div className="reports-progress-track small">
                                <span style={{ width: `${item.percentage}%`, backgroundColor: item.color }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </section>

                <section className="reports-summary-grid">
                  <article className="reports-summary-card">
                    <span>Pending Backlog</span>
                    <strong>{getNumber(overview?.pendingTickets).toLocaleString()}</strong>
                  </article>
                  <article className="reports-summary-card">
                    <span>Average Resolution Time</span>
                    <strong>{averageResolutionHours.toLocaleString()}h</strong>
                  </article>
                  <article className="reports-summary-card">
                    <span>Resolved Tickets</span>
                    <strong>{getNumber(overview?.resolvedTickets).toLocaleString()}</strong>
                  </article>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default Reports
