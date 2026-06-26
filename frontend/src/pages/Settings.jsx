import {
  BellRing, CheckCircle2, ChevronRight, Clock3, Database, LockKeyhole,
  Save, Server, Settings2, ShieldCheck, UserRound,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'

const API_BASE_URL = 'https://supportops-api-daniella-fufeejcrfgcah2bc.uaenorth-01.azurewebsites.net/api'
const notificationDefaults = [
  ['assignments', 'Ticket assignments', 'Get notified when a ticket is assigned to you.'],
  ['statusUpdates', 'Status updates', 'Stay informed when ticket status changes.'],
  ['comments', 'New comments', 'Receive alerts for new ticket comments.'],
  ['attachments', 'Attachments', 'Know when files are added to your tickets.'],
  ['knowledgeBase', 'Knowledge Base updates', 'Get updates when helpful articles are published.'],
  ['email', 'Email notifications', 'Email delivery is ready to connect to the backend later.'],
]

function initials(name) {
  return String(name || 'SupportOps User').trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}

function formatDate(value) {
  if (!value) return '\u2014'
  const date = new Date(value)
  if (Number.isNaN(date.getTime()) || date.getFullYear() < 2000) return '\u2014'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function Message({ message }) {
  if (!message?.text) return null
  return <div className={`settings-message ${message.type}`} role="status">{message.type === 'success' ? <CheckCircle2 size={18} /> : null}{message.text}</div>
}

function Toggle({ checked, onChange, label }) {
  return <button type="button" className={`settings-toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)} role="switch" aria-checked={checked} aria-label={label}><span /></button>
}

function Settings() {
  const role = localStorage.getItem('role') || 'Employee'
  const userId = localStorage.getItem('userId')
  const isAdmin = role === 'Admin'
  const [tab, setTab] = useState('profile')
  const [profile, setProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({ fullName: '', email: '', department: '' })
  const [systemForm, setSystemForm] = useState(null)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [preferences, setPreferences] = useState(() => Object.fromEntries(notificationDefaults.map(([key]) => [key, true])))
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingSystem, setLoadingSystem] = useState(false)
  const [saving, setSaving] = useState('')
  const [message, setMessage] = useState(null)

  function showMessage(type, text) { setMessage({ type, text }) }
  function getError(response, fallback) { return response.text().then((text) => text || fallback) }

  /* Profile and system settings are asynchronous external data sources. */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!userId) { setLoadingProfile(false); showMessage('error', 'Your account session is missing. Please sign in again.'); return }
    fetch(`${API_BASE_URL}/Settings/profile/${userId}`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await getError(response, 'Unable to load your profile.'))
        return response.json()
      })
      .then((data) => { setProfile(data); setProfileForm({ fullName: data.fullName || '', email: data.email || '', department: data.department || '' }) })
      .catch((error) => showMessage('error', error.message || 'Unable to load your profile.'))
      .finally(() => setLoadingProfile(false))
  }, [userId])

  useEffect(() => {
    if (!isAdmin || tab !== 'system' || systemForm) return
    setLoadingSystem(true)
    fetch(`${API_BASE_URL}/Settings/system`)
      .then(async (response) => {
        if (!response.ok) throw new Error(await getError(response, 'Unable to load system settings.'))
        return response.json()
      })
      .then((data) => setSystemForm({ applicationName: data.applicationName || '', supportEmail: data.supportEmail || '', defaultPriority: data.defaultPriority || 'Medium', emailNotificationsEnabled: Boolean(data.emailNotificationsEnabled), maintenanceMode: Boolean(data.maintenanceMode), sessionTimeoutHours: data.sessionTimeoutHours || 2 }))
      .catch((error) => showMessage('error', error.message || 'Unable to load system settings.'))
      .finally(() => setLoadingSystem(false))
  }, [tab, isAdmin, systemForm])

  async function saveProfile(event) {
    event.preventDefault(); setSaving('profile'); setMessage(null)
    try {
      const response = await fetch(`${API_BASE_URL}/Settings/profile/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profileForm) })
      if (!response.ok) throw new Error(await getError(response, 'Unable to save profile.'))
      const data = await response.json()
      setProfile(data); localStorage.setItem('fullName', profileForm.fullName); showMessage('success', 'Profile updated successfully.')
    } catch (error) { showMessage('error', error.message || 'Unable to save profile.') } finally { setSaving('') }
  }

  async function changePassword(event) {
    event.preventDefault(); setMessage(null)
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { showMessage('error', 'New password and confirmation must match.'); return }
    setSaving('password')
    try {
      const response = await fetch(`${API_BASE_URL}/Settings/change-password/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(passwordForm) })
      if (!response.ok) throw new Error(await getError(response, 'Unable to change password.'))
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); showMessage('success', 'Password changed successfully.')
    } catch (error) { showMessage('error', error.message || 'Unable to change password.') } finally { setSaving('') }
  }

  async function saveSystem(event) {
    event.preventDefault(); setSaving('system'); setMessage(null)
    try {
      const response = await fetch(`${API_BASE_URL}/Settings/system`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...systemForm, sessionTimeoutHours: Number(systemForm.sessionTimeoutHours) }) })
      if (!response.ok) throw new Error(await getError(response, 'Unable to save system settings.'))
      const data = await response.json(); setSystemForm((current) => ({ ...current, ...data })); showMessage('success', 'System settings updated successfully.')
    } catch (error) { showMessage('error', error.message || 'Unable to save system settings.') } finally { setSaving('') }
  }

  const tabs = [['profile', 'Profile', UserRound], ['security', 'Security', LockKeyhole], ['notifications', 'Notifications', BellRing], ...(isAdmin ? [['system', 'System Settings', Settings2]] : [])]
  const accountStatus = profile?.isActive ? 'Active' : 'Inactive'
  const updateProfile = (event) => setProfileForm((current) => ({ ...current, [event.target.name]: event.target.value }))

  return <DashboardLayout><section className="settings-page">
    <header className="settings-header"><div><p className="settings-eyebrow">Account & configuration</p><h1>Settings</h1><p>Manage your account preferences and system configuration.</p></div><span className="settings-role-badge"><ShieldCheck size={15} />{role}</span></header>
    <div className="settings-layout"><aside className="settings-tabs" aria-label="Settings sections">{tabs.map(([key, label, Icon]) => <button type="button" key={key} onClick={() => { setTab(key); setMessage(null) }} className={tab === key ? 'active' : ''}><Icon size={18} /><span>{label}</span><ChevronRight size={16} /></button>)}</aside>
      <div className="settings-panel"><Message message={message} />
        {tab === 'profile' && <>{loadingProfile ? <div className="settings-loading">Loading your profile…</div> : profile && <><article className="settings-profile-hero"><div className="settings-avatar">{initials(profile.fullName)}</div><div><h2>{profile.fullName}</h2><p>{profile.email || 'No email address'}</p><div><span className={`settings-status ${profile.isActive ? 'active' : 'inactive'}`}>{accountStatus}</span><span>{profile.department || 'No department'}</span></div></div></article><form className="settings-card settings-form" onSubmit={saveProfile}><div className="settings-card-heading"><div><h2>Profile information</h2><p>Update the contact details associated with your account.</p></div></div><div className="settings-form-grid"><label>Full Name<input required name="fullName" value={profileForm.fullName} onChange={updateProfile} /></label><label>Email<input required type="email" name="email" value={profileForm.email} onChange={updateProfile} /></label><label>Department<input name="department" value={profileForm.department} onChange={updateProfile} /></label><label>Role<input value={profile.role || role} readOnly /></label></div><div className="settings-meta-row"><span>Account status <strong className={profile.isActive ? 'green' : 'red'}>{accountStatus}</strong></span><span>Member since <strong>{formatDate(profile.createdAt)}</strong></span></div><button className="settings-primary-button" disabled={saving === 'profile'}><Save size={17} />{saving === 'profile' ? 'Saving…' : 'Save Changes'}</button></form></>}</>}
        {tab === 'security' && <div className="settings-section-stack"><form className="settings-card settings-form" onSubmit={changePassword}><div className="settings-card-heading"><div><h2>Change password</h2><p>Use a strong, unique password to keep your account secure.</p></div><LockKeyhole size={22} /></div><div className="settings-form-grid single-column"><label>Current Password<input required type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((current) => ({ ...current, currentPassword: e.target.value }))} /></label><label>New Password<input required type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((current) => ({ ...current, newPassword: e.target.value }))} /></label><label>Confirm New Password<input required type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((current) => ({ ...current, confirmPassword: e.target.value }))} /></label></div><button className="settings-primary-button" disabled={saving === 'password'}><LockKeyhole size={17} />{saving === 'password' ? 'Changing…' : 'Change Password'}</button></form><article className="settings-card"><div className="settings-card-heading"><div><h2>Security information</h2><p>Your current account security details.</p></div></div><div className="settings-info-grid"><div><Clock3 size={19} /><span>JWT Session Timeout</span><strong>2 hours</strong></div><div><ShieldCheck size={19} /><span>Account Status</span><strong>{loadingProfile ? 'Loading…' : accountStatus}</strong></div><div><UserRound size={19} /><span>Role</span><strong>{role}</strong></div><div><Clock3 size={19} /><span>Last Login</span><strong>Not tracked yet</strong></div></div></article></div>}
        {tab === 'notifications' && <article className="settings-card"><div className="settings-card-heading"><div><h2>Notification preferences</h2><p>Choose which SupportOps activity you want to hear about.</p></div><BellRing size={22} /></div><div className="settings-notifications">{notificationDefaults.map(([key, title, description]) => <div key={key}><div><strong>{title}</strong><p>{description}</p></div><Toggle checked={preferences[key]} label={title} onChange={(value) => setPreferences((current) => ({ ...current, [key]: value }))} /></div>)}</div><p className="settings-local-note">Notification preferences are saved locally for now and can be connected to backend later.</p><button type="button" className="settings-primary-button" onClick={() => showMessage('success', 'Notification preferences saved locally.')}><Save size={17} />Save Preferences</button></article>}
        {tab === 'system' && isAdmin && <>{loadingSystem ? <div className="settings-loading">Loading system settings…</div> : systemForm && <div className="settings-section-stack"><form className="settings-card settings-form" onSubmit={saveSystem}><div className="settings-card-heading"><div><h2>System Settings</h2><p>Configure the shared defaults for your SupportOps workspace.</p></div><Settings2 size={22} /></div><div className="settings-form-grid"><label>Application Name<input required value={systemForm.applicationName} onChange={(e) => setSystemForm((c) => ({ ...c, applicationName: e.target.value }))} /></label><label>Support Email<input required type="email" value={systemForm.supportEmail} onChange={(e) => setSystemForm((c) => ({ ...c, supportEmail: e.target.value }))} /></label><label>Default Priority<select value={systemForm.defaultPriority} onChange={(e) => setSystemForm((c) => ({ ...c, defaultPriority: e.target.value }))}>{['Low', 'Medium', 'High', 'Critical'].map((item) => <option key={item}>{item}</option>)}</select></label><label>Session Timeout Hours<input required min="1" type="number" value={systemForm.sessionTimeoutHours} onChange={(e) => setSystemForm((c) => ({ ...c, sessionTimeoutHours: e.target.value }))} /></label></div><div className="settings-system-toggles"><div><div><strong>Email Notifications Enabled</strong><p>Allow email delivery for system communications.</p></div><Toggle checked={systemForm.emailNotificationsEnabled} label="Email Notifications Enabled" onChange={(value) => setSystemForm((c) => ({ ...c, emailNotificationsEnabled: value }))} /></div><div><div><strong>Maintenance Mode</strong><p>Temporarily restrict access while maintenance is in progress.</p></div><Toggle checked={systemForm.maintenanceMode} label="Maintenance Mode" onChange={(value) => setSystemForm((c) => ({ ...c, maintenanceMode: value }))} /></div></div><button className="settings-primary-button" disabled={saving === 'system'}><Save size={17} />{saving === 'system' ? 'Saving…' : 'Save System Settings'}</button></form><article className="settings-card"><div className="settings-card-heading"><div><h2>System status</h2><p>Current operational overview.</p></div></div><div className="settings-info-grid"><div><Server size={19} /><span>Server Status</span><strong className="settings-health-value"><i />Online</strong></div><div><Database size={19} /><span>Database Status</span><strong className="settings-health-value"><i />Connected</strong></div><div><ShieldCheck size={19} /><span>Security Patch</span><strong className="settings-health-value"><i />Up to date</strong></div><div><Settings2 size={19} /><span>System Version</span><strong>SupportOps v1.0</strong></div></div></article></div>}</>}
      </div></div>
  </section></DashboardLayout>
}

export default Settings
