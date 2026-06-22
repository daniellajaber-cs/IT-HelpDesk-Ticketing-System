import {
  Lock,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Unlock,
  UserCheck,
  UserMinus,
  UsersRound,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'

const API_BASE_URL = 'http://localhost:5227/api'
const ROLES = ['Admin', 'Manager', 'IT Support Agent', 'Employee']
const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  department: '',
  role: 'Employee',
  isActive: true,
}

function initials(name) {
  return String(name || 'Unknown User')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function formatDate(value) {
  if (!value) return '\u2014'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function getDepartment(user) {
  const department = user?.department ?? user?.Department
  return typeof department === 'string' ? department.trim() : ''
}

function avatarClass(name) {
  const palette = ['peach', 'lilac', 'mint', 'sky', 'rose', 'amber']
  const sum = String(name || '').split('').reduce((total, char) => total + char.charCodeAt(0), 0)
  return palette[sum % palette.length]
}

function UserModal({ user, onClose, onSave, saving }) {
  const [form, setForm] = useState(
    user
      ? { ...emptyForm, ...user, department: getDepartment(user), password: '' }
      : emptyForm,
  )

  function updateField(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  function submit(event) {
    event.preventDefault()
    onSave(form)
  }

  return (
    <div className="users-modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="users-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title" onMouseDown={(event) => event.stopPropagation()}>
        <header className="users-modal-header">
          <div>
            <h2 id="user-modal-title">{user ? 'Edit User' : 'Add User'}</h2>
            <p>{user ? 'Update this user’s profile and access details.' : 'Create a new user account for SupportOps.'}</p>
          </div>
          <button type="button" className="users-close-button" onClick={onClose} aria-label="Close modal"><X size={20} /></button>
        </header>
        <form className="users-form" onSubmit={submit}>
          <label>Full Name<input required name="fullName" value={form.fullName} onChange={updateField} placeholder="e.g. Jordan Lee" /></label>
          <label>Email<input required type="email" name="email" value={form.email} onChange={updateField} placeholder="jordan@company.com" /></label>
          <label>Password<input required={!user} type="password" name="password" value={form.password} onChange={updateField} placeholder={user ? 'Leave blank to keep current password' : 'Create a secure password'} /></label>
          <div className="users-form-row">
            <label>Department<input required name="department" value={form.department} onChange={updateField} placeholder="e.g. IT Operations" /></label>
            <label>Role<select name="role" value={form.role} onChange={updateField}>{ROLES.map((role) => <option key={role}>{role}</option>)}</select></label>
          </div>
          <label className="users-active-control"><input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} /><span><strong>Active user</strong><small>User can sign in and access SupportOps.</small></span></label>
          <footer className="users-modal-footer"><button type="button" className="users-secondary-button" onClick={onClose}>Cancel</button><button className="users-primary-button" disabled={saving}>{saving ? 'Saving…' : user ? 'Save Changes' : 'Create User'}</button></footer>
        </form>
      </section>
    </div>
  )
}

function Users() {
  const role = localStorage.getItem('role') || 'Employee'
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [modalUser, setModalUser] = useState(undefined)
  const [deletingUser, setDeletingUser] = useState(null)
  const [saving, setSaving] = useState(false)

  async function loadUsers() {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/Users`)
      if (!response.ok) throw new Error('Unable to load users.')
      const data = await response.json()
      setUsers(Array.isArray(data) ? data : [])
    } catch (loadError) {
      setError(loadError.message || 'Unable to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (role !== 'Admin') return undefined

    const loadTimer = window.setTimeout(() => {
      loadUsers()
    }, 0)

    return () => window.clearTimeout(loadTimer)
  }, [role])

  const departments = useMemo(() => [...new Set(users.map(getDepartment).filter(Boolean))].sort(), [users])
  const filteredUsers = useMemo(() => users.filter((user) => {
    const matchesQuery = `${user.fullName || ''} ${user.email || ''}`.toLowerCase().includes(query.toLowerCase().trim())
    const matchesRole = !roleFilter || user.role === roleFilter
    const matchesDepartment = !departmentFilter || user.department === departmentFilter
    const matchesStatus = !statusFilter || (statusFilter === 'Active' ? user.isActive : !user.isActive)
    return matchesQuery && matchesRole && matchesDepartment && matchesStatus
  }), [users, query, roleFilter, departmentFilter, statusFilter])

  const stats = {
    total: users.length,
    active: users.filter((user) => user.isActive).length,
    inactive: users.filter((user) => !user.isActive).length,
    admins: users.filter((user) => user.role === 'Admin').length,
  }

  function clearFilters() {
    setQuery(''); setRoleFilter(''); setDepartmentFilter(''); setStatusFilter('')
  }

  async function saveUser(form) {
    const isEdit = Boolean(modalUser)
    setSaving(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/Users${isEdit ? `/${modalUser.id}` : ''}`, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error(await response.text() || 'Unable to save user.')
      setModalUser(undefined)
      await loadUsers()
    } catch (saveError) {
      setError(saveError.message || 'Unable to save user.')
    } finally { setSaving(false) }
  }

  async function setActivation(user) {
    setError('')
    try {
      const action = user.isActive ? 'deactivate' : 'activate'
      const response = await fetch(`${API_BASE_URL}/Users/${user.id}/${action}`, { method: 'PUT' })
      if (!response.ok) throw new Error(await response.text() || `Unable to ${action} user.`)
      await loadUsers()
    } catch (actionError) { setError(actionError.message || 'Unable to update user.') }
  }

  async function deleteUser() {
    if (!deletingUser) return
    setError('')
    try {
      const response = await fetch(`${API_BASE_URL}/Users/${deletingUser.id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error(await response.text() || 'Unable to deactivate user.')
      setDeletingUser(null)
      await loadUsers()
    } catch (deleteError) { setError(deleteError.message || 'Unable to deactivate user.') }
  }

  if (role !== 'Admin') {
    return <DashboardLayout><section className="users-permission"><ShieldCheck size={34} /><h1>Users Management</h1><p>You do not have permission to manage users.</p></section></DashboardLayout>
  }

  return (
    <DashboardLayout>
      <section className="users-page">
        <header className="users-page-header"><div><p className="users-eyebrow">Administration</p><h1>Users Management</h1><p>Manage system users, roles, and access permissions.</p></div><button className="users-primary-button users-add-button" onClick={() => setModalUser(null)}><Plus size={18} />Add User</button></header>
        <div className="users-stats-grid">
          {[['Total Users', stats.total, UsersRound, 'blue'], ['Active Users', stats.active, UserCheck, 'green'], ['Inactive Users', stats.inactive, UserMinus, 'red'], ['Admin Users', stats.admins, ShieldCheck, 'purple']].map(([label, value, Icon, tone]) => <article className="users-stat-card" key={label}><div className={`users-stat-icon ${tone}`}><Icon size={21} /></div><div><span>{label}</span><strong>{value}</strong></div></article>)}
        </div>
        <section className="users-filter-card"><div className="users-filter-search"><Search size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by name or email..." /></div><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="">All Roles</option>{ROLES.map((item) => <option key={item}>{item}</option>)}</select><select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}><option value="">All Departments</option>{departments.map((item) => <option key={item}>{item}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">All Statuses</option><option>Active</option><option>Inactive</option></select><button className="users-clear-button" onClick={clearFilters}>Clear Filters</button></section>
        {error && <div className="users-message error">{error}</div>}
        <section className="users-table-card"><div className="users-table-heading"><div><h2>System Users</h2><p>Showing {filteredUsers.length} of {users.length} users</p></div></div><div className="users-table-scroll"><table><thead><tr><th>User</th><th>Email</th><th>Department</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead><tbody>{loading ? <tr><td colSpan="7" className="users-empty">Loading users…</td></tr> : filteredUsers.length === 0 ? <tr><td colSpan="7" className="users-empty">No users match the selected filters.</td></tr> : filteredUsers.map((user) => <tr key={user.id}><td><div className="users-person"><span className={`users-avatar ${avatarClass(user.fullName)}`}>{initials(user.fullName)}</span><strong>{user.fullName}</strong></div></td><td>{user.email}</td><td>{getDepartment(user) || '\u2014'}</td><td><span className={`users-role-badge ${String(user.role || '').toLowerCase().replaceAll(' ', '-')}`}>{user.role}</span></td><td><span className={`users-status-badge ${user.isActive ? 'active' : 'inactive'}`}>{user.isActive ? 'Active' : 'Inactive'}</span></td><td className="users-joined-date">{formatDate(user.createdAt ?? user.CreatedAt)}</td><td><div className="users-actions"><button title="Edit" aria-label="Edit" onClick={() => setModalUser(user)}><Pencil size={15} /></button><button title={user.isActive ? 'Deactivate' : 'Activate'} aria-label={user.isActive ? 'Deactivate' : 'Activate'} className={user.isActive ? 'deactivate' : 'activate'} onClick={() => setActivation(user)}>{user.isActive ? <Lock size={14} /> : <Unlock size={14} />}</button><button title="Delete" aria-label="Delete" className="delete" onClick={() => setDeletingUser(user)}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table></div></section>
      </section>
      {modalUser !== undefined && <UserModal user={modalUser} onClose={() => setModalUser(undefined)} onSave={saveUser} saving={saving} />}
      {deletingUser && <div className="users-modal-backdrop" role="presentation" onMouseDown={() => setDeletingUser(null)}><section className="users-confirm-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><div className="users-danger-icon"><Trash2 size={22} /></div><h2>Deactivate user?</h2><p>Are you sure you want to deactivate this user?</p><div><button className="users-secondary-button" onClick={() => setDeletingUser(null)}>Cancel</button><button className="users-danger-button" onClick={deleteUser}>Deactivate User</button></div></section></div>}
    </DashboardLayout>
  )
}

export default Users
