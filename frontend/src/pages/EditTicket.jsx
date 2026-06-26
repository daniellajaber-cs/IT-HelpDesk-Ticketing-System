import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'

const API_BASE_URL = 'https://supportops-api-daniella-fufeejcrfgcah2bc.uaenorth-01.azurewebsites.net/api'

function EditTicket() {
  const { id } = useParams()
  const navigate = useNavigate()
  const role = localStorage.getItem('role') || ''
  const userId = Number(localStorage.getItem('userId'))
  const [ticket, setTicket] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priorityId, setPriorityId] = useState('')
  const [statusId, setStatusId] = useState('')
  const [categories, setCategories] = useState([])
  const [priorities, setPriorities] = useState([])
  const [statuses, setStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

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
        setTitle(data.title || '')
        setDescription(data.description || '')
        setCategoryId(data.categoryId ? String(data.categoryId) : '')
        setPriorityId(data.priorityId ? String(data.priorityId) : '')
        setStatusId(data.statusId ? String(data.statusId) : '')
      })
      .catch((error) => {
        console.log(error)
        setErrorMessage('Unable to load ticket for editing.')
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
  }, [id])

  function getStatusName(ticketStatusId) {
    const status = statuses.find((statusItem) => statusItem.id === ticketStatusId)
    return status ? status.name : ticket?.statusName || ticket?.status?.name || (ticketStatusId === 1 ? 'Open' : '')
  }

  function canEditTicket() {
    if (!ticket) {
      return false
    }

    if (role === 'Admin' || role === 'Manager') {
      return true
    }

    if (role === 'Employee') {
      return ticket.createdByUserId === userId && ticket.assignedToUserId == null && getStatusName(ticket.statusId) === 'Open'
    }

    return false
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    if (!canEditTicket()) {
      setErrorMessage('You do not have permission to edit this ticket.')
      return
    }

    setIsSaving(true)

    const response = await fetch(`${API_BASE_URL}/Tickets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        description: description,
        categoryId: Number(categoryId),
        priorityId: Number(priorityId),
        statusId: Number(statusId),
      }),
    })

    if (response.ok) {
      setSuccessMessage('Ticket updated successfully.')
      setTimeout(() => {
        navigate('/tickets')
      }, 800)
    } else {
      const message = await response.text()
      setErrorMessage(message || 'Failed to update ticket. Please try again.')
    }

    setIsSaving(false)
  }

  const canEdit = canEditTicket()

  return (
    <DashboardLayout>
      <div className="edit-ticket-page">
        <div className="edit-ticket-header">
          <div>
            <button className="ticket-details-back" type="button" onClick={() => navigate('/tickets')}>
              Back to Tickets
            </button>
            <h2>Edit Ticket</h2>
            <p>{ticket?.ticketNumber || `TCK-${ticket?.id || id}`}</p>
          </div>
        </div>

        <form className="edit-ticket-card" onSubmit={handleSubmit}>
          {loading && <div className="ticket-success-message">Loading ticket...</div>}
          {successMessage && <div className="ticket-success-message">{successMessage}</div>}
          {errorMessage && <div className="ticket-error-message">{errorMessage}</div>}
          {!loading && ticket && !canEdit && (
            <div className="ticket-error-message">You do not have permission to edit this ticket.</div>
          )}

          <div className="ticket-form-grid">
            <div className="input-group">
              <label htmlFor="edit-ticket-title">Title</label>
              <input
                id="edit-ticket-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading || !canEdit}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="edit-ticket-category">Category</label>
              <select
                id="edit-ticket-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loading || !canEdit}
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option value={category.id} key={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="edit-ticket-priority">Priority</label>
              <select
                id="edit-ticket-priority"
                value={priorityId}
                onChange={(e) => setPriorityId(e.target.value)}
                disabled={loading || !canEdit}
                required
              >
                <option value="">Select priority</option>
                {priorities.map((priority) => (
                  <option value={priority.id} key={priority.id}>
                    {priority.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label htmlFor="edit-ticket-status">Status</label>
              <select
                id="edit-ticket-status"
                value={statusId}
                onChange={(e) => setStatusId(e.target.value)}
                disabled={loading || !canEdit}
                required
              >
                <option value="">Select status</option>
                {statuses.map((status) => (
                  <option value={status.id} key={status.id}>
                    {status.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group ticket-description-field">
              <label htmlFor="edit-ticket-description">Description</label>
              <textarea
                id="edit-ticket-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading || !canEdit}
                required
              ></textarea>
            </div>
          </div>

          <div className="ticket-form-actions">
            <button className="cancel-button" type="button" onClick={() => navigate('/tickets')}>
              Cancel
            </button>
            <button className="submit-ticket-button" type="submit" disabled={loading || isSaving || !canEdit}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  )
}

export default EditTicket
