import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

const API_BASE_URL = 'http://localhost:5227/api'

function TicketDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [categories, setCategories] = useState([])
  const [priorities, setPriorities] = useState([])
  const [statuses, setStatuses] = useState([])
  const [users, setUsers] = useState([])
  const [comments, setComments] = useState([])
  const [history, setHistory] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentMessage, setCommentMessage] = useState('')
  const [commentError, setCommentError] = useState('')
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [assignMessage, setAssignMessage] = useState('')
  const [assignError, setAssignError] = useState('')
  const [isAssigning, setIsAssigning] = useState(false)
  const [selectedStatusId, setSelectedStatusId] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [statusError, setStatusError] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [refreshCount, setRefreshCount] = useState(0)
  const [commentsRefreshCount, setCommentsRefreshCount] = useState(0)
  const [historyRefreshCount, setHistoryRefreshCount] = useState(0)
  const userRole = localStorage.getItem('role') || ''
  const currentUserId = localStorage.getItem('userId') || ''

  useEffect(() => {
    fetch(`${API_BASE_URL}/Tickets/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Ticket not found')
        }

        return response.json()
      })
      .then((data) => {
        setTicket(data)
        setSelectedStatusId(data.statusId ? String(data.statusId) : '')
      })
      .catch((error) => {
        console.log(error)
        setTicket(null)
        setErrorMessage('Unable to load ticket details.')
      })
      .finally(() => setLoading(false))

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
  }, [id, refreshCount])

  useEffect(() => {
    fetch(`${API_BASE_URL}/Tickets/${id}/comments`)
      .then((response) => response.json())
      .then((data) => setComments(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.log(error)
        setComments([])
      })
  }, [id, commentsRefreshCount])

  useEffect(() => {
    fetch(`${API_BASE_URL}/Tickets/${id}/history`)
      .then((response) => response.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.log(error)
        setHistory([])
      })
  }, [id, historyRefreshCount])

  function getLookupName(items, itemId, fallbackLabel) {
    const item = items.find((lookupItem) => lookupItem.id === itemId)
    return item ? item.name : fallbackLabel
  }

  function getTicketNumber() {
    return ticket?.ticketNumber || `TCK-${ticket?.id || id}`
  }

  function getCategory() {
    return ticket?.categoryName || ticket?.category?.name || getLookupName(categories, ticket?.categoryId, 'General')
  }

  function getPriority() {
    return ticket?.priorityName || ticket?.priority?.name || getLookupName(priorities, ticket?.priorityId, 'Medium')
  }

  function getStatus() {
    return ticket?.statusName || ticket?.status?.name || getLookupName(statuses, ticket?.statusId, 'Open')
  }

  function getCreatedBy() {
    const creator = users.find((user) => user.id === ticket?.createdByUserId)

    return (
      ticket?.employeeName ||
      ticket?.createdByUser?.fullName ||
      ticket?.createdByUser?.name ||
      ticket?.createdByUserFullName ||
      ticket?.createdByName ||
      creator?.fullName ||
      'Employee'
    )
  }

  function getAssignedTo() {
    const assignedUser = users.find((user) => user.id === ticket?.assignedToUserId)

    return (
      ticket?.agentName ||
      ticket?.assignedToUser?.fullName ||
      ticket?.assignedToUser?.name ||
      ticket?.assignedToUserFullName ||
      ticket?.assignedToName ||
      assignedUser?.fullName ||
      'Unassigned'
    )
  }

  function getBadgeClass(value) {
    return value.toLowerCase().replaceAll(' ', '-')
  }

  function formatDate(value) {
    if (!value) {
      return '-'
    }

    return new Date(value).toLocaleString()
  }

  async function handleAssignTicket() {
    if (!selectedAgentId) {
      setAssignError('Please select an agent.')
      setAssignMessage('')
      return
    }

    setIsAssigning(true)
    setAssignError('')
    setAssignMessage('')

    const response = await fetch(`${API_BASE_URL}/Tickets/${id}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        assignedToUserId: Number(selectedAgentId),
      }),
    })

    if (response.ok) {
      setAssignMessage('Ticket assigned successfully.')
      setRefreshCount((currentCount) => currentCount + 1)
      setHistoryRefreshCount((currentCount) => currentCount + 1)
    } else {
      setAssignError('Failed to assign ticket. Please try again.')
    }

    setIsAssigning(false)
  }

  async function handleUpdateStatus() {
    if (!selectedStatusId) {
      setStatusError('Please select a status.')
      setStatusMessage('')
      return
    }

    setIsUpdatingStatus(true)
    setStatusError('')
    setStatusMessage('')

    const response = await fetch(`${API_BASE_URL}/Tickets/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        statusId: Number(selectedStatusId),
      }),
    })

    if (response.ok) {
      setStatusMessage('Ticket status updated successfully.')
      setRefreshCount((currentCount) => currentCount + 1)
      setHistoryRefreshCount((currentCount) => currentCount + 1)
    } else {
      setStatusError('Failed to update ticket status. Please try again.')
    }

    setIsUpdatingStatus(false)
  }

  async function handleAddComment(e) {
    e.preventDefault()

    if (!commentText.trim()) {
      setCommentError('Please enter a comment.')
      setCommentMessage('')
      return
    }

    if (!currentUserId) {
      setCommentError('Please login again before commenting.')
      setCommentMessage('')
      return
    }

    setIsAddingComment(true)
    setCommentError('')
    setCommentMessage('')

    const response = await fetch(`${API_BASE_URL}/Tickets/${id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: Number(currentUserId),
        commentText: commentText,
      }),
    })

    if (response.ok) {
      setCommentText('')
      setCommentMessage('Comment added successfully.')
      setCommentsRefreshCount((currentCount) => currentCount + 1)
      setHistoryRefreshCount((currentCount) => currentCount + 1)
    } else {
      const message = await response.text()
      setCommentError(message || 'Failed to add comment. Please try again.')
    }

    setIsAddingComment(false)
  }

  const priority = ticket ? getPriority() : ''
  const status = ticket ? getStatus() : ''
  const supportAgents = users.filter((user) => user.role === 'IT Support Agent')
  const canUpdateStatus = userRole === 'Admin' || userRole === 'Manager' || userRole === 'IT Support Agent'
  const canAssignTicket = userRole === 'Admin' || userRole === 'Manager'

  return (
    <DashboardLayout>
      <div className="ticket-details-page">
        <button className="ticket-details-back" type="button" onClick={() => navigate('/tickets')}>
          Back to Tickets
        </button>

        <div className="ticket-details-header">
          <div>
            <p className="ticket-details-eyebrow">Ticket Details</p>
            <h2>{loading ? 'Loading ticket...' : getTicketNumber()}</h2>
          </div>

          {ticket && (
            <div className="ticket-details-badges">
              <span className={`queue-status-badge ${getBadgeClass(status)}`}>{status}</span>
              <span className={`queue-priority-badge ${getBadgeClass(priority)}`}>{priority}</span>
            </div>
          )}
        </div>

        {errorMessage && <div className="ticket-details-message error">{errorMessage}</div>}

        {!errorMessage && (
          <>
            <section className="ticket-details-card main-info-card">
              <h3>Main Information</h3>

              {loading && <p className="ticket-details-muted">Loading ticket information...</p>}

              {ticket && (
                <>
                  <div className="ticket-details-summary">
                    <h4>{ticket.title || 'Untitled ticket'}</h4>
                    <p>{ticket.description || 'No description provided.'}</p>
                  </div>

                  <div className="ticket-details-grid">
                    <div>
                      <span>Category</span>
                      <strong>{getCategory()}</strong>
                    </div>
                    <div>
                      <span>Priority</span>
                      <strong>{priority}</strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <strong>{status}</strong>
                    </div>
                    <div>
                      <span>Created By</span>
                      <strong>{getCreatedBy()}</strong>
                    </div>
                    <div>
                      <span>Assigned To</span>
                      <strong>{getAssignedTo()}</strong>
                    </div>
                    <div>
                      <span>Created Date</span>
                      <strong>{formatDate(ticket.createdAt)}</strong>
                    </div>
                    <div>
                      <span>Updated Date</span>
                      <strong>{formatDate(ticket.updatedAt)}</strong>
                    </div>
                  </div>
                </>
              )}
            </section>

            {canUpdateStatus && (
              <section className="ticket-details-card update-status-card">
                <div>
                  <h3>Update Status</h3>
                  <p className="ticket-details-empty">Move this ticket through the support workflow.</p>
                </div>

                <div className="status-update-controls">
                  <select value={selectedStatusId} onChange={(e) => setSelectedStatusId(e.target.value)}>
                    <option value="">Select Status</option>
                    {statuses.map((statusOption) => (
                      <option value={statusOption.id} key={statusOption.id}>
                        {statusOption.name}
                      </option>
                    ))}
                  </select>

                  <button type="button" onClick={handleUpdateStatus} disabled={isUpdatingStatus || !ticket}>
                    {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                  </button>
                </div>

                {statusMessage && <div className="ticket-details-message success">{statusMessage}</div>}
                {statusError && <div className="ticket-details-message error">{statusError}</div>}
              </section>
            )}

            {canAssignTicket && (
              <section className="ticket-details-card assign-ticket-card">
                <div>
                  <h3>Assign Ticket</h3>
                  <p className="ticket-details-empty">Choose an IT Support Agent to handle this request.</p>
                </div>

                <div className="assign-ticket-controls">
                  <select value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)}>
                    <option value="">Select Agent</option>
                    {supportAgents.map((agent) => (
                      <option value={agent.id} key={agent.id}>
                        {agent.fullName}
                      </option>
                    ))}
                  </select>

                  <button type="button" onClick={handleAssignTicket} disabled={isAssigning || !ticket}>
                    {isAssigning ? 'Assigning...' : 'Assign Ticket'}
                  </button>
                </div>

                {assignMessage && <div className="ticket-details-message success">{assignMessage}</div>}
                {assignError && <div className="ticket-details-message error">{assignError}</div>}
              </section>
            )}

            <div className="ticket-details-secondary-grid">
              <section className="ticket-details-card ticket-comments-card">
                <h3>Comments</h3>
                <div className="ticket-comments-list">
                  {comments.length === 0 && <p className="ticket-details-empty">No comments yet.</p>}

                  {comments.map((comment) => (
                    <article className="ticket-comment-item" key={comment.id}>
                      <div className="ticket-comment-header">
                        <div>
                          <strong>{comment.userFullName || 'SupportOps User'}</strong>
                          {comment.userRole && <span>{comment.userRole}</span>}
                        </div>
                        <time>{formatDate(comment.createdAt)}</time>
                      </div>
                      <p>{comment.commentText}</p>
                    </article>
                  ))}
                </div>

                <form className="ticket-comment-form" onSubmit={handleAddComment}>
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    rows="4"
                  ></textarea>

                  <button type="submit" disabled={isAddingComment}>
                    {isAddingComment ? 'Adding...' : 'Add Comment'}
                  </button>
                </form>

                {commentMessage && <div className="ticket-details-message success">{commentMessage}</div>}
                {commentError && <div className="ticket-details-message error">{commentError}</div>}
              </section>

              <section className="ticket-details-card">
                <h3>Attachments</h3>
                <p className="ticket-details-empty">No attachments uploaded.</p>
              </section>

              <section className="ticket-details-card history-card">
                <h3>Activity History</h3>
                {history.length === 0 && <p className="ticket-details-empty">No activity history yet.</p>}

                {history.map((historyItem) => (
                  <div className="ticket-history-item" key={historyItem.id}>
                    <strong>{historyItem.action}</strong>

                    {historyItem.oldValue && historyItem.newValue && (
                      <p>
                        {historyItem.oldValue} &rarr; {historyItem.newValue}
                      </p>
                    )}

                    <time>{formatDate(historyItem.createdAt)}</time>
                  </div>
                ))}
              </section>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default TicketDetails
