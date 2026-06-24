import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const API_BASE_URL = 'http://localhost:5227/api'

const getErrorMessage = async (response, fallback) => {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    const data = await response.json()
    return data.message || data.error || data.title || fallback
  }
  return (await response.text()) || fallback
}

function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  async function sendResetCode(event) {
    event.preventDefault()
    if (!email.trim()) {
      setErrorMessage('Email address is required.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/Auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Unable to send a reset code.'))
      setSuccessMessage('A reset code has been sent. Enter it below to set a new password.')
      setStep(2)
    } catch (error) {
      setErrorMessage(error.message || 'Unable to send a reset code.')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function resetPassword(event) {
    event.preventDefault()
    if (!resetCode.trim() || !newPassword || !confirmPassword) {
      setErrorMessage('Reset code and both password fields are required.')
      return
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password must match.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')
    try {
      const response = await fetch(`${API_BASE_URL}/Auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetCode: resetCode.trim(), newPassword, confirmPassword }),
      })
      if (!response.ok) throw new Error(await getErrorMessage(response, 'Unable to reset your password.'))
      setSuccessMessage('Your password has been reset successfully. Please sign in with your new password.')
      setStep(3)
    } catch (error) {
      setErrorMessage(error.message || 'Unable to reset your password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return <main className="login-page">
    <section className="brand-panel" aria-label="SupportOps overview">
      <div className="glow glow-one" /><div className="glow glow-two" /><div className="grid-overlay" />
      <div className="brand-content"><div className="logo-section"><div className="logo-mark">S</div><div><h1>SupportOps</h1><p>ENTERPRISE IT DESK</p></div></div>
        <div className="glass-card"><div className="card-icon">IT</div><h2>Securely regain access to your SupportOps account.</h2><p>We&apos;ll guide you through resetting your password and getting back to work.</p></div>
      </div>
    </section>
    <section className="form-panel" aria-label="Forgot password form"><div className="login-card"><div className="form-heading"><h2>Forgot Password</h2><p>Enter your email and we&apos;ll send you a reset code.</p></div>
      {successMessage && <div className="auth-message success">{successMessage}</div>}
      {errorMessage && <div className="auth-message error">{errorMessage}</div>}
      {step === 1 && <form onSubmit={sendResetCode}><div className="input-group"><label htmlFor="forgot-email">Email address</label><input id="forgot-email" type="email" placeholder="name@company.com" value={email} onChange={(event) => setEmail(event.target.value)} /></div><button className="sign-in-button" disabled={isSubmitting} type="submit">{isSubmitting ? 'Sending...' : 'Send Reset Code'}</button></form>}
      {step === 2 && <form onSubmit={resetPassword}><div className="input-group"><label htmlFor="reset-code">Reset Code</label><input id="reset-code" type="text" value={resetCode} onChange={(event) => setResetCode(event.target.value)} /></div><div className="input-group"><label htmlFor="new-password">New Password</label><input id="new-password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></div><div className="input-group"><label htmlFor="confirm-password">Confirm Password</label><input id="confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} /></div><button className="sign-in-button" disabled={isSubmitting} type="submit">{isSubmitting ? 'Resetting...' : 'Reset Password'}</button></form>}
      {step === 3 && <button className="sign-in-button" type="button" onClick={() => navigate('/login')}>Back to Login</button>}
      {step !== 3 && <><p className="forgot-password-note">For demo users, reset codes are sent to the configured notification email.</p><p className="admin-text">Remembered your password? <Link to="/login">Back to Login</Link></p></>}
    </div></section>
  </main>
}

export default ForgotPassword
