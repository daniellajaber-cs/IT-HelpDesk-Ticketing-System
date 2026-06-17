import { useEffect, useRef, useState } from 'react'
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
    return ''
  }

  if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(getFileExtension(file.name))) {
    return INVALID_ATTACHMENT_TYPE_MESSAGE
  }

  if (file.size > MAX_ATTACHMENT_FILE_SIZE) {
    return ATTACHMENT_SIZE_EXCEEDED_MESSAGE
  }

  return ''
}

function CreateTicket() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priorityId, setPriorityId] = useState('')
  const [categories, setCategories] = useState([])
  const [priorities, setPriorities] = useState([])
  const [selectedAttachment, setSelectedAttachment] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const attachmentInputRef = useRef(null)
  const successTimerRef = useRef(null)
  const currentUserId = localStorage.getItem('userId') || '4'

  useEffect(() => {
    fetch(`${API_BASE_URL}/Categories`)
      .then((response) => response.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch((error) => console.log(error))

    fetch(`${API_BASE_URL}/Priorities`)
      .then((response) => response.json())
      .then((data) => setPriorities(Array.isArray(data) ? data : []))
      .catch((error) => console.log(error))

    return () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
      }
    }
  }, [])

  function clearForm() {
    setTitle('')
    setDescription('')
    setCategoryId('')
    setPriorityId('')
    setSelectedAttachment(null)

    if (attachmentInputRef.current) {
      attachmentInputRef.current.value = ''
    }
  }

  function handleAttachmentChange(e) {
    const file = e.target.files && e.target.files.length > 0 ? e.target.files[0] : null
    const validationError = validateAttachmentFile(file)

    setSuccessMessage('')
    setErrorMessage(validationError)

    if (validationError) {
      setSelectedAttachment(null)
      e.target.value = ''
      return
    }

    setSelectedAttachment(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSuccessMessage('')
    setErrorMessage('')

    const attachmentValidationError = validateAttachmentFile(selectedAttachment)

    if (attachmentValidationError) {
      setErrorMessage(attachmentValidationError)
      return
    }

    const ticketData = {
      title: title,
      description: description,
      createdByUserId: Number(currentUserId),
      categoryId: Number(categoryId),
      priorityId: Number(priorityId),
    }

    const response = await fetch(`${API_BASE_URL}/Tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketData),
    })

    if (response.ok) {
      const newTicket = await response.json()

      if (selectedAttachment) {
        const formData = new FormData()
        formData.append('file', selectedAttachment)
        formData.append('uploadedByUserId', ticketData.createdByUserId)

        const uploadResponse = await fetch(`${API_BASE_URL}/Tickets/${newTicket.id}/attachments`, {
          method: 'POST',
          body: formData,
        })

        if (!uploadResponse.ok) {
          const message = await uploadResponse.text()
          setErrorMessage(message || 'Ticket created, but attachment upload failed.')
          return
        }
      }

      clearForm()
      setSuccessMessage('Ticket created successfully.')

      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
      }

      successTimerRef.current = setTimeout(() => {
        setSuccessMessage('')
      }, 3500)
    } else {
      setErrorMessage('Failed to create ticket. Please try again.')
    }
  }

  function handleCancel() {
    clearForm()
    setSuccessMessage('')
    setErrorMessage('')
  }

  return (
    <DashboardLayout>
      <div className="create-ticket-page">
        <div className="create-ticket-header">
          <div>
            <h2>Create New Ticket</h2>
            <p>Please fill in the details below to open a support request.</p>
          </div>

          <span className="agent-status-badge">Agent Activity: Online</span>
        </div>

        <form className="create-ticket-card" onSubmit={handleSubmit}>
          {successMessage && <div className="ticket-success-message">{successMessage}</div>}
          {errorMessage && <div className="ticket-error-message">{errorMessage}</div>}

          <div className="ticket-form-grid">
            <div className="input-group">
              <label htmlFor="ticket-title">Ticket Title</label>
              <input
                id="ticket-title"
                type="text"
                placeholder="Example: Laptop not turning on"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label htmlFor="ticket-category">Category</label>
              <select
                id="ticket-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
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
              <label htmlFor="ticket-priority">Priority Level</label>
              <select
                id="ticket-priority"
                value={priorityId}
                onChange={(e) => setPriorityId(e.target.value)}
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

            <div className="input-group ticket-description-field">
              <label htmlFor="ticket-description">Detailed Description</label>
              <textarea
                id="ticket-description"
                placeholder="Describe the issue, affected device or software, and any steps already tried."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="input-group ticket-attachment-field">
              <label htmlFor="ticket-attachments">Attachments</label>
              <label className="attachment-upload-box" htmlFor="ticket-attachments">
                <input
                  id="ticket-attachments"
                  type="file"
                  accept={ALLOWED_ATTACHMENT_EXTENSIONS.join(',')}
                  ref={attachmentInputRef}
                  onChange={handleAttachmentChange}
                />
                <span>{selectedAttachment ? selectedAttachment.name : 'Upload screenshots or files'}</span>
                <small>PNG, JPG, JPEG, PDF, DOC, DOCX, XLS, XLSX, PPT, and PPTX files up to 10 MB.</small>
              </label>
            </div>
          </div>

          <div className="ticket-form-actions">
            <button className="cancel-button" type="button" onClick={handleCancel}>
              Cancel
            </button>
            <button className="submit-ticket-button" type="submit">
              Submit Ticket
            </button>
          </div>
        </form>

        <div className="ticket-info-grid">
          <article className="ticket-info-card">
            <h3>Need help?</h3>
            <p>Include the device, app, error message, and when the issue started.</p>
          </article>

          <article className="ticket-info-card">
            <h3>Response Time</h3>
            <p>Critical tickets are reviewed first. Standard requests are handled in queue order.</p>
          </article>

          <article className="ticket-info-card">
            <h3>Sensitive Data</h3>
            <p>Please avoid sharing passwords, access codes, or private customer information.</p>
          </article>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default CreateTicket
