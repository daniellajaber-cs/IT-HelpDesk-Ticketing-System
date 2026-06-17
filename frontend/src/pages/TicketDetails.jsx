import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

const API_BASE_URL = 'http://localhost:5227/api'
const MAX_ATTACHMENT_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_ATTACHMENT_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']
const INVALID_ATTACHMENT_TYPE_MESSAGE =
  'Invalid file type. Only PNG, JPG, JPEG, PDF, DOC, DOCX, XLS, XLSX, PPT, and PPTX files are allowed.'
const ATTACHMENT_SIZE_EXCEEDED_MESSAGE = 'File size exceeds the maximum allowed size of 10 MB.'

function getFileExtension(fileName) {
  const extensionStartIndex = fileName.lastIndexOf('.')

  if (extensionStartIndex === -1) {
    return ''
  }

  return fileName.slice(extensionStartIndex).toLowerCase()
}

function validateAttachmentFile(file) {
  if (!file) {
    return 'Please choose a file first.'
  }

  if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(getFileExtension(file.name))) {
    return INVALID_ATTACHMENT_TYPE_MESSAGE
  }

  if (file.size > MAX_ATTACHMENT_FILE_SIZE) {
    return ATTACHMENT_SIZE_EXCEEDED_MESSAGE
  }

  return ''
}

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) {
    return '-'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function TicketDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [categories, setCategories] = useState([])
  const [priorities, setPriorities] = useState([])
  const [statuses, setStatuses] = useState([])
  const [users, setUsers] = useState([])
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
  const [history, setHistory] = useState([])
  const [actionLogs, setActionLogs] = useState([])
  const [internalNotes, setInternalNotes] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentMessage, setCommentMessage] = useState('')
  const [commentError, setCommentError] = useState('')
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [selectedAttachment, setSelectedAttachment] = useState(null)
  const [attachmentMessage, setAttachmentMessage] = useState('')
  const [attachmentError, setAttachmentError] = useState('')
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false)
  const [actionLogDescription, setActionLogDescription] = useState('')
  const [actionLogType, setActionLogType] = useState('Investigation')
  const [actionLogDuration, setActionLogDuration] = useState('')
  const [actionLogDate, setActionLogDate] = useState(new Date().toISOString().split('T')[0])
  const [actionLogMessage, setActionLogMessage] = useState('')
  const [actionLogError, setActionLogError] = useState('')
  const [isAddingActionLog, setIsAddingActionLog] = useState(false)
  const [internalNoteText, setInternalNoteText] = useState('')
  const [internalNoteMessage, setInternalNoteMessage] = useState('')
  const [internalNoteError, setInternalNoteError] = useState('')
  const [isAddingInternalNote, setIsAddingInternalNote] = useState(false)
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
  const [attachmentsRefreshCount, setAttachmentsRefreshCount] = useState(0)
  const [historyRefreshCount, setHistoryRefreshCount] = useState(0)
  const [actionLogsRefreshCount, setActionLogsRefreshCount] = useState(0)
  const [internalNotesRefreshCount, setInternalNotesRefreshCount] = useState(0)
  const [activeSection, setActiveSection] = useState('info')
  const userRole = localStorage.getItem('role') || ''
  const currentUserId = localStorage.getItem('userId') || ''
  const canViewInternalNotes = userRole === 'Admin' || userRole === 'Manager' || userRole === 'IT Support Agent'

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
    fetch(`${API_BASE_URL}/Tickets/${id}/attachments`)
      .then((response) => response.json())
      .then((data) => setAttachments(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.log(error)
        setAttachments([])
      })
  }, [id, attachmentsRefreshCount])

  useEffect(() => {
    fetch(`${API_BASE_URL}/Tickets/${id}/history`)
      .then((response) => response.json())
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.log(error)
        setHistory([])
      })
  }, [id, historyRefreshCount])

  useEffect(() => {
    fetch(`${API_BASE_URL}/Tickets/${id}/action-logs`)
      .then((response) => response.json())
      .then((data) => setActionLogs(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.log(error)
        setActionLogs([])
      })
  }, [id, actionLogsRefreshCount])

  useEffect(() => {
    if (!canViewInternalNotes || !currentUserId) {
      return
    }

    fetch(`${API_BASE_URL}/Tickets/${id}/internal-notes?userId=${currentUserId}`)
      .then((response) => response.json())
      .then((data) => setInternalNotes(Array.isArray(data) ? data : []))
      .catch((error) => {
        console.log(error)
        setInternalNotes([])
      })
  }, [id, currentUserId, canViewInternalNotes, internalNotesRefreshCount])

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

  function formatDateOnly(value) {
    if (!value) {
      return '-'
    }

    return new Date(value).toLocaleDateString()
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

  function handleAttachmentChange(e) {
    const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null

    setAttachmentMessage('')

    if (!file) {
      setSelectedAttachment(null)
      setAttachmentError('')
      return
    }

    const validationError = validateAttachmentFile(file)

    if (validationError) {
      e.target.value = ''
    }

    setAttachmentError(validationError)
    setSelectedAttachment(validationError ? null : file)
  }

  async function handleUploadAttachment() {
    const validationError = validateAttachmentFile(selectedAttachment)

    if (validationError) {
      setAttachmentError(validationError)
      setAttachmentMessage('')
      return
    }

    if (!currentUserId) {
      setAttachmentError('Please login again before uploading an attachment.')
      setAttachmentMessage('')
      return
    }

    setIsUploadingAttachment(true)
    setAttachmentError('')
    setAttachmentMessage('')

    const formData = new FormData()
    formData.append('file', selectedAttachment)
    formData.append('uploadedByUserId', currentUserId)

    const response = await fetch(`${API_BASE_URL}/Tickets/${id}/attachments`, {
      method: 'POST',
      body: formData,
    })

    if (response.ok) {
      setSelectedAttachment(null)
      setAttachmentMessage('Attachment uploaded successfully.')
      setAttachmentsRefreshCount((currentCount) => currentCount + 1)
      setHistoryRefreshCount((currentCount) => currentCount + 1)
    } else {
      const message = await response.text()
      setAttachmentError(message || 'Failed to upload attachment. Please try again.')
    }

    setIsUploadingAttachment(false)
  }

  async function handleAddActionLog(e) {
    e.preventDefault()

    if (!actionLogDescription.trim()) {
      setActionLogError('Please enter a description.')
      setActionLogMessage('')
      return
    }

    if (!actionLogType) {
      setActionLogError('Please select a type.')
      setActionLogMessage('')
      return
    }

    if (!actionLogDuration || Number(actionLogDuration) <= 0) {
      setActionLogError('Duration hours must be greater than 0.')
      setActionLogMessage('')
      return
    }

    if (!actionLogDate) {
      setActionLogError('Please select a log date.')
      setActionLogMessage('')
      return
    }

    if (!currentUserId) {
      setActionLogError('Please login again before adding an action log.')
      setActionLogMessage('')
      return
    }

    setIsAddingActionLog(true)
    setActionLogError('')
    setActionLogMessage('')

    const response = await fetch(`${API_BASE_URL}/Tickets/${id}/action-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: Number(currentUserId),
        description: actionLogDescription,
        type: actionLogType,
        durationHours: Number(actionLogDuration),
        logDate: actionLogDate,
      }),
    })

    if (response.ok) {
      setActionLogDescription('')
      setActionLogType('Investigation')
      setActionLogDuration('')
      setActionLogDate(new Date().toISOString().split('T')[0])
      setActionLogMessage('Action log added successfully.')
      setActionLogsRefreshCount((currentCount) => currentCount + 1)
    } else {
      const message = await response.text()
      setActionLogError(message || 'Failed to add action log. Please try again.')
    }

    setIsAddingActionLog(false)
  }

  async function handleAddInternalNote(e) {
    e.preventDefault()

    if (!internalNoteText.trim()) {
      setInternalNoteError('Please enter an internal note.')
      setInternalNoteMessage('')
      return
    }

    if (!currentUserId) {
      setInternalNoteError('Please login again before adding an internal note.')
      setInternalNoteMessage('')
      return
    }

    setIsAddingInternalNote(true)
    setInternalNoteError('')
    setInternalNoteMessage('')

    const response = await fetch(`${API_BASE_URL}/Tickets/${id}/internal-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: Number(currentUserId),
        note: internalNoteText,
      }),
    })

    if (response.ok) {
      setInternalNoteText('')
      setInternalNoteMessage('Internal note added successfully.')
      setInternalNotesRefreshCount((currentCount) => currentCount + 1)
    } else {
      const message = await response.text()
      setInternalNoteError(message || 'Failed to add internal note. Please try again.')
    }

    setIsAddingInternalNote(false)
  }

  const priority = ticket ? getPriority() : ''
  const status = ticket ? getStatus() : ''
  const supportAgents = users.filter((user) => user.role === 'IT Support Agent')
  const canUpdateStatus = userRole === 'Admin' || userRole === 'Manager' || userRole === 'IT Support Agent'
  const canAssignTicket = userRole === 'Admin' || userRole === 'Manager'
  const canAddActionLog =
    userRole === 'Admin' ||
    userRole === 'Manager' ||
    (userRole === 'IT Support Agent' && ticket?.assignedToUserId === Number(currentUserId))
  const actionLogTypes = ['Investigation', 'Troubleshooting', 'Configuration', 'Testing', 'Follow-up', 'Other']
  const totalActionLogHours = actionLogs.reduce(
    (total, actionLog) => total + Number(actionLog.durationHours || 0),
    0,
  )
  const ticketSections = [
    { id: 'info', label: 'Ticket Info' },
    { id: 'comments', label: 'Comments' },
    { id: 'attachments', label: 'Attachments' },
    { id: 'history', label: 'Activity History' },
    { id: 'actionLogs', label: 'Action Logs' },
  ]

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
            <nav className="ticket-section-tabs" aria-label="Ticket sections">
              {ticketSections.map((section) => (
                <button
                  className={`ticket-section-tab ${activeSection === section.id ? 'active' : ''}`}
                  type="button"
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                >
                  {section.label}
                </button>
              ))}
            </nav>

            <div className="ticket-section-content">
              {activeSection === 'info' && (
                <div className="ticket-info-section">
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
                </div>
              )}

              {activeSection === 'comments' && (
                <div className="comments-section-stack">
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

                    <div className="ticket-subsection-heading">
                      <h4>Add Comment</h4>
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

                  {canViewInternalNotes && (
                    <section className="ticket-details-card internal-notes-card">
                      <div className="internal-notes-header">
                        <h3>Internal Notes</h3>
                        <p className="ticket-details-empty">Private notes visible only to support staff and managers.</p>
                      </div>

                      <form className="internal-note-form" onSubmit={handleAddInternalNote}>
                        <textarea
                          value={internalNoteText}
                          onChange={(e) => setInternalNoteText(e.target.value)}
                          placeholder="Add a private internal note..."
                          rows="4"
                        ></textarea>

                        <button type="submit" disabled={isAddingInternalNote}>
                          {isAddingInternalNote ? 'Adding...' : 'Add Internal Note'}
                        </button>
                      </form>

                      {internalNoteMessage && <div className="ticket-details-message success">{internalNoteMessage}</div>}
                      {internalNoteError && <div className="ticket-details-message error">{internalNoteError}</div>}

                      <div className="internal-notes-list">
                        {internalNotes.length === 0 && <p className="ticket-details-empty">No internal notes yet.</p>}

                        {internalNotes.map((note) => (
                          <article className="internal-note-item" key={note.id}>
                            <div className="internal-note-meta">
                              <strong>{note.userFullName || 'SupportOps User'}</strong>
                              <time>{formatDate(note.createdAt)}</time>
                            </div>
                            <p>{note.note}</p>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {activeSection === 'attachments' && (
                <section className="ticket-details-card">
                  <h3>Attachments</h3>

                  <div className="ticket-attachments-upload">
                    <div>
                      <strong>Upload an attachment</strong>
                      <p>Select one file to attach it to this ticket.</p>
                      {selectedAttachment && (
                        <span className="selected-attachment-name">Selected: {selectedAttachment.name}</span>
                      )}
                    </div>

                    <div className="ticket-attachments-actions">
                      <label className="choose-file-button" htmlFor="ticket-attachment-file">
                        Choose File
                      </label>
                      <input
                        id="ticket-attachment-file"
                        type="file"
                        key={selectedAttachment ? selectedAttachment.name : 'empty-attachment'}
                        accept={ALLOWED_ATTACHMENT_EXTENSIONS.join(',')}
                        onChange={handleAttachmentChange}
                      />

                      <button
                        type="button"
                        onClick={handleUploadAttachment}
                        disabled={isUploadingAttachment || !selectedAttachment}
                      >
                        {isUploadingAttachment ? 'Uploading...' : 'Upload Attachment'}
                      </button>
                    </div>
                  </div>

                  {attachmentMessage && <div className="ticket-details-message success">{attachmentMessage}</div>}
                  {attachmentError && <div className="ticket-details-message error">{attachmentError}</div>}

                  <div className="ticket-attachments-list">
                    {attachments.length === 0 && <p className="ticket-details-empty">No attachments uploaded.</p>}

                    {attachments.map((attachment) => (
                      <article className="ticket-attachment-item" key={attachment.id}>
                        <div className="ticket-attachment-main">
                          <strong>{attachment.fileName}</strong>
                          <div className="ticket-attachment-meta">
                            <span>{attachment.fileType || 'application/octet-stream'}</span>
                            <span>{formatFileSize(attachment.fileSize)}</span>
                            <span>Uploaded {formatDate(attachment.uploadedAt)}</span>
                            <span>By {attachment.uploadedByFullName || 'SupportOps User'}</span>
                          </div>
                        </div>
                        <a
                          className="ticket-attachment-download"
                          href={`${API_BASE_URL}/Tickets/attachments/${attachment.id}/download`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open/Download
                        </a>
                      </article>
                    ))}
                  </div>
                </section>
              )}

              {activeSection === 'history' && (
                <section className="ticket-details-card history-card">
                  <h3>Activity History</h3>
                  {history.length === 0 && <p className="ticket-details-empty">No activity history yet.</p>}

                  {history.length > 0 && (
                    <div className="ticket-history-timeline">
                      {history.map((historyItem) => (
                        <article className="ticket-history-item" key={historyItem.id}>
                          <div className="ticket-history-dot" aria-hidden="true"></div>
                          <div className="ticket-history-content">
                            <strong>{historyItem.action}</strong>

                            {historyItem.oldValue && historyItem.newValue && (
                              <p>
                                {historyItem.oldValue} &rarr; {historyItem.newValue}
                              </p>
                            )}

                            <time>{formatDate(historyItem.createdAt)}</time>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {activeSection === 'actionLogs' && (
                <section className="ticket-details-card action-logs-card">
                  <div className="action-logs-header">
                    <div>
                      <h3>Action Logs</h3>
                      <p className="ticket-details-empty">Track hands-on work and time spent on this ticket.</p>
                    </div>

                    <div className="action-log-total-card">
                      <span>Total Hours</span>
                      <strong>{totalActionLogHours.toFixed(2)}</strong>
                    </div>
                  </div>

                  {canAddActionLog && (
                    <form className="action-log-form" onSubmit={handleAddActionLog}>
                      <div className="input-group action-log-description-field">
                        <label htmlFor="action-log-description">Description</label>
                        <textarea
                          id="action-log-description"
                          value={actionLogDescription}
                          onChange={(e) => setActionLogDescription(e.target.value)}
                          placeholder="Describe the work completed..."
                          rows="4"
                        ></textarea>
                      </div>

                      <div className="input-group">
                        <label htmlFor="action-log-type">Type</label>
                        <select
                          id="action-log-type"
                          value={actionLogType}
                          onChange={(e) => setActionLogType(e.target.value)}
                        >
                          {actionLogTypes.map((type) => (
                            <option value={type} key={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="input-group">
                        <label htmlFor="action-log-duration">Duration Hours</label>
                        <input
                          id="action-log-duration"
                          type="number"
                          min="0.25"
                          step="0.25"
                          value={actionLogDuration}
                          onChange={(e) => setActionLogDuration(e.target.value)}
                          placeholder="1.5"
                        />
                      </div>

                      <div className="input-group">
                        <label htmlFor="action-log-date">Log Date</label>
                        <input
                          id="action-log-date"
                          type="date"
                          value={actionLogDate}
                          onChange={(e) => setActionLogDate(e.target.value)}
                        />
                      </div>

                      <div className="action-log-form-actions">
                        <button type="submit" disabled={isAddingActionLog}>
                          {isAddingActionLog ? 'Adding...' : 'Add Action Log'}
                        </button>
                      </div>
                    </form>
                  )}

                  {!canAddActionLog && (
                    <p className="ticket-details-empty action-log-permission-note">
                      You can view action logs, but only Admins, Managers, and the assigned IT Support Agent can add
                      them.
                    </p>
                  )}

                  {actionLogMessage && <div className="ticket-details-message success">{actionLogMessage}</div>}
                  {actionLogError && <div className="ticket-details-message error">{actionLogError}</div>}

                  <div className="action-logs-table-wrap">
                    <table className="action-logs-table">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>User</th>
                          <th>Type</th>
                          <th>Duration</th>
                          <th>Log Date</th>
                          <th>Created Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {actionLogs.map((actionLog) => (
                          <tr key={actionLog.id}>
                            <td>{actionLog.description || '-'}</td>
                            <td>{actionLog.userFullName || 'SupportOps User'}</td>
                            <td>{actionLog.type || '-'}</td>
                            <td>{Number(actionLog.durationHours || 0).toFixed(2)}h</td>
                            <td>{formatDateOnly(actionLog.logDate)}</td>
                            <td>{formatDate(actionLog.createdAt)}</td>
                          </tr>
                        ))}

                        {actionLogs.length === 0 && (
                          <tr>
                            <td className="action-logs-empty" colSpan="6">
                              No action logs yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}

            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

export default TicketDetails
