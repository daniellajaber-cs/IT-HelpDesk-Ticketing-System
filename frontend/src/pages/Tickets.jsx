import { useEffect, useState } from 'react'
import { MoreVertical, Plus, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

const API_BASE_URL = 'https://supportops-api-daniella-fufeejcrfgcah2bc.uaenorth-01.azurewebsites.net/api'
const PAGE_SIZE = 7
const NEW_TICKET_WINDOW_MS = 5 * 60 * 1000
const NEW_TICKET_REFRESH_MS = 60 * 1000

function Tickets() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role')
  const userId = Number(localStorage.getItem('userId'))
  const [tickets, setTickets] = useState([])
  const [categories, setCategories] = useState([])
  const [priorities, setPriorities] = useState([])
  const [statuses, setStatuses] = useState([])
  const [users, setUsers] = useState([])
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [agentFilter, setAgentFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [openActionsTicketId, setOpenActionsTicketId] = useState(null)
  const [currentTime, setCurrentTime] = useState(Date.now())

  useEffect(() => {
    fetch(`${API_BASE_URL}/Tickets`)
      .then((response) => response.json())
      .then((data) => setTickets(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.log(error)
        setTickets([])
      })

    fetch(`${API_BASE_URL}/Categories`)
      .then((response) => response.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((error) => console.log(error))

    fetch(`${API_BASE_URL}/Priorities`)
      .then((response) => response.json())
      .then((data) => setPriorities(Array.isArray(data) ? data : []))
      .catch((error) => console.log(error))

    fetch(`${API_BASE_URL}/Statuses`)
      .then((response) => response.json())
      .then((data) => setStatuses(Array.isArray(data) ? data : []))
      .catch((error) => console.log(error))

    fetch(`${API_BASE_URL}/Users`)
      .then((response) => response.json())
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((error) => console.log(error))
  }, [])

  useEffect(() => {
    function closeActionsMenu() {
      setOpenActionsTicketId(null)
    }

    document.addEventListener('click', closeActionsMenu)

    return () => {
      document.removeEventListener('click', closeActionsMenu)
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(Date.now())
    }, NEW_TICKET_REFRESH_MS)

    return () => {
      window.clearInterval(timer)
    }
  }, [])

  function getLookupName(items, id, fallbackLabel) {
    const item = items.find((lookupItem) => lookupItem.id === id)
    return item ? item.name : fallbackLabel
  }

  function getTicketId(ticket) {
    return ticket.ticketNumber || `TCK-${ticket.id}`
  }

  function getCreatedAt(ticket) {
    return ticket.createdAt ?? ticket.CreatedAt
  }

  function getTitle(ticket) {
    return ticket.title || 'Untitled ticket'
  }

  function getDescription(ticket) {
    return ticket.description || 'No description provided.'
  }

  function getEmployee(ticket) {
    const creator = users.find((user) => user.id === ticket.createdByUserId)

    return (
      ticket.employeeName ||
      ticket.createdByUser?.fullName ||
      ticket.createdByUser?.name ||
      ticket.createdByUserFullName ||
      ticket.createdByName ||
      creator?.fullName ||
      'Employee'
    )
  }

  function getCategory(ticket) {
    return ticket.categoryName || ticket.category?.name || getLookupName(categories, ticket.categoryId, 'General')
  }

  function getPriority(ticket) {
    return ticket.priorityName || ticket.priority?.name || getLookupName(priorities, ticket.priorityId, 'Medium')
  }

  function getStatus(ticket) {
    return ticket.statusName || ticket.status?.name || getLookupName(statuses, ticket.statusId, 'Open')
  }

  function getAgent(ticket) {
    const assignedUser = users.find((user) => user.id === ticket.assignedToUserId)

    return (
      ticket.agentName ||
      ticket.assignedToUser?.fullName ||
      ticket.assignedToUser?.name ||
      ticket.assignedToUserFullName ||
      ticket.assignedToName ||
      assignedUser?.fullName ||
      ''
    )
  }

  function getInitials(name) {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  }

  function formatDate(value) {
    if (!value) {
      return '-'
    }

    return new Date(value).toLocaleDateString()
  }

  function getCreatedAtTime(ticket) {
    const createdAt = getCreatedAt(ticket)
    const createdAtTime = createdAt ? new Date(createdAt).getTime() : 0

    return Number.isNaN(createdAtTime) ? 0 : createdAtTime
  }

  function isNewTicket(ticket) {
    const createdAtTime = getCreatedAtTime(ticket)

    return createdAtTime > 0 && currentTime - createdAtTime < NEW_TICKET_WINDOW_MS
  }

  function getBadgeClass(value) {
    return value.toLowerCase().replaceAll(' ', '-')
  }

  function clearFilters() {
    setStatusFilter('')
    setPriorityFilter('')
    setCategoryFilter('')
    setAgentFilter('')
    setCurrentPage(1)
  }

  async function handleDelete(ticket) {
    setOpenActionsTicketId(null)
    const confirmed = window.confirm('Delete this ticket?')

    if (!confirmed) {
      return
    }

    const response = await fetch(`${API_BASE_URL}/Tickets/${ticket.id}`, {
      method: 'DELETE',
    })

    if (response.ok) {
      setTickets((currentTickets) => currentTickets.filter((item) => item.id !== ticket.id))
    } else {
      alert('Failed to delete ticket')
    }
  }

  const roleTickets = tickets.filter((ticket) => {
    if (role === 'IT Support Agent') {
      return ticket.assignedToUserId === userId
    }

    if (role === 'Employee') {
      return ticket.createdByUserId === userId
    }

    return true
  })

  const canCreateTicket = role !== 'IT Support Agent'

  const statusOptions =
    statuses.length > 0 ? statuses.map((status) => status.name) : [...new Set(roleTickets.map(getStatus))]
  const priorityOptions =
    priorities.length > 0 ? priorities.map((priority) => priority.name) : [...new Set(roleTickets.map(getPriority))]
  const categoryOptions =
    categories.length > 0 ? categories.map((category) => category.name) : [...new Set(roleTickets.map(getCategory))]
  const agentOptions = [...new Set(roleTickets.map((ticket) => getAgent(ticket)).filter(Boolean))]

  const filteredTickets = roleTickets
    .filter((ticket) => {
      const matchesStatus = !statusFilter || getStatus(ticket) === statusFilter
      const matchesPriority = !priorityFilter || getPriority(ticket) === priorityFilter
      const matchesCategory = !categoryFilter || getCategory(ticket) === categoryFilter
      const matchesAgent = !agentFilter || getAgent(ticket) === agentFilter

      return matchesStatus && matchesPriority && matchesCategory && matchesAgent
    })
    .sort((firstTicket, secondTicket) => getCreatedAtTime(secondTicket) - getCreatedAtTime(firstTicket))

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE))
  const activePage = Math.min(currentPage, totalPages)
  const visibleTickets = filteredTickets.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE)
  const emptyMessage = roleTickets.length === 0 ? 'No tickets found.' : 'No tickets match the selected filters.'

  function canEditTicket(ticket) {
    if (role === 'Admin' || role === 'Manager') {
      return true
    }

    if (role === 'Employee') {
      return ticket.createdByUserId === userId && ticket.assignedToUserId == null && getStatus(ticket) === 'Open'
    }

    return false
  }

  function canDeleteTicket(ticket) {
    if (role === 'Admin') {
      return true
    }

    if (role === 'Employee') {
      return ticket.assignedToUserId == null && getStatus(ticket) === 'Open'
    }

    return false
  }

  function handleView(ticket) {
    setOpenActionsTicketId(null)
    navigate(`/tickets/${ticket.id}`)
  }

  function handleEdit(ticket) {
    setOpenActionsTicketId(null)
    navigate(`/tickets/${ticket.id}/edit`)
  }

  return (
    <DashboardLayout>
      <div className="ticket-queue-page">
        <div className="ticket-queue-header">
          <div>
            <h2>Ticket Queue</h2>
            <p>Manage and respond to ongoing enterprise IT support requests.</p>
          </div>

          {canCreateTicket && (
            <button className="queue-primary-button" type="button" onClick={() => navigate('/create-ticket')}>
              <Plus size={16} strokeWidth={2.4} />
              <span>New Ticket</span>
            </button>
          )}
        </div>

        <section className="queue-filter-bar">
          <div className="quick-filter-label">QUICK FILTERS</div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="">All Statuses</option>
            {statusOptions.map((status) => (
              <option value={status} key={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="">All Priorities</option>
            {priorityOptions.map((priority) => (
              <option value={priority} key={priority}>
                {priority}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="">All Categories</option>
            {categoryOptions.map((category) => (
              <option value={category} key={category}>
                {category}
              </option>
            ))}
          </select>

          <select
            value={agentFilter}
            onChange={(e) => {
              setAgentFilter(e.target.value)
              setCurrentPage(1)
            }}
          >
            <option value="">Assigned Agent</option>
            {agentOptions.map((agent) => (
              <option value={agent} key={agent}>
                {agent}
              </option>
            ))}
          </select>

          <button className="clear-filters-link" type="button" onClick={clearFilters}>
            Clear All Filters
          </button>
        </section>

        <section className="queue-table-card">
          <div className="queue-table-wrap">
            <table className="queue-table">
              <colgroup>
                <col className="queue-col-id" />
                <col className="queue-col-title" />
                <col className="queue-col-employee" />
                <col className="queue-col-category" />
                <col className="queue-col-priority" />
                <col className="queue-col-status" />
                <col className="queue-col-agent" />
                <col className="queue-col-created" />
                <col className="queue-col-actions" />
              </colgroup>
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Title</th>
                  <th>Employee</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Agent</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleTickets.map((ticket) => {
                  const agent = getAgent(ticket)
                  const priority = getPriority(ticket)
                  const status = getStatus(ticket)

                  return (
                    <tr key={ticket.id}>
                      <td className="queue-ticket-id">
                        <span>{getTicketId(ticket)}</span>
                        {isNewTicket(ticket) && <span className="queue-new-ticket-badge">NEW</span>}
                      </td>
                      <td>
                        <strong className="queue-ticket-title">{getTitle(ticket)}</strong>
                        <span className="queue-ticket-description">{getDescription(ticket)}</span>
                      </td>
                      <td>{getEmployee(ticket)}</td>
                      <td>{getCategory(ticket)}</td>
                      <td>
                        <span className={`queue-priority-badge ${getBadgeClass(priority)}`}>{priority}</span>
                      </td>
                      <td>
                        <span className={`queue-status-badge ${getBadgeClass(status)}`}>{status}</span>
                      </td>
                      <td>
                        {agent ? (
                          <div className="queue-agent">
                            <span className="queue-agent-avatar">{getInitials(agent)}</span>
                            <span>{agent}</span>
                          </div>
                        ) : (
                          <div className="queue-agent unassigned">
                            <span className="queue-agent-avatar empty">
                              <UserRound size={14} strokeWidth={2} />
                            </span>
                            <span>Unassigned</span>
                          </div>
                        )}
                      </td>
                      <td>{formatDate(getCreatedAt(ticket))}</td>
                      <td className="queue-actions-cell">
                        <div className="queue-actions" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="queue-actions-trigger"
                            type="button"
                            aria-label={`Open actions for ${getTicketId(ticket)}`}
                            aria-expanded={openActionsTicketId === ticket.id}
                            onClick={() =>
                              setOpenActionsTicketId((currentId) => (currentId === ticket.id ? null : ticket.id))
                            }
                          >
                            <MoreVertical size={16} strokeWidth={2.4} />
                          </button>

                          {openActionsTicketId === ticket.id && (
                            <div className="queue-actions-menu">
                              <button type="button" onClick={() => handleView(ticket)}>
                                View
                              </button>
                              {canEditTicket(ticket) && (
                                <button type="button" onClick={() => handleEdit(ticket)}>
                                  Edit
                                </button>
                              )}
                              {canDeleteTicket(ticket) && (
                                <button className="danger" type="button" onClick={() => handleDelete(ticket)}>
                                  Delete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {visibleTickets.length === 0 && (
                  <tr>
                    <td className="queue-empty" colSpan="9">
                      {emptyMessage}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="queue-table-footer">
            <span>
              Showing {visibleTickets.length} of {filteredTickets.length} tickets
            </span>

            <div className="queue-pagination">
              <button type="button" disabled={activePage === 1} onClick={() => setCurrentPage(activePage - 1)}>
                Previous
              </button>
              <span>
                Page {activePage} of {totalPages}
              </span>
              <button type="button" disabled={activePage === totalPages} onClick={() => setCurrentPage(activePage + 1)}>
                Next
              </button>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

export default Tickets
