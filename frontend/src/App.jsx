import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import './App.css'
import CreateTicket from './pages/CreateTicket'
import Dashboard from './pages/Dashboard'
import EditTicket from './pages/EditTicket'
import KnowledgeBase from './pages/KnowledgeBase'
import Notifications from './pages/Notifications'
import Reports from './pages/Reports'
import TicketDetails from './pages/TicketDetails'
import Tickets from './pages/Tickets'
import Users from './pages/Users'

function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const stats = [
    { value: '99.9%', label: 'SLA Uptime' },
    { value: '15min', label: 'Avg. Response' },
  ]

  async function handleLogin(e) {
    e.preventDefault()

    try {
      const response = await fetch('http://localhost:5227/api/Auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        localStorage.setItem('userId', data.userId)
        localStorage.setItem('fullName', data.fullName)
        localStorage.setItem('role', data.role)
        localStorage.setItem('token', data.token)

        navigate('/dashboard')
      } else {
        alert('Invalid email or password')
      }
    } catch (error) {
      alert('Cannot connect to backend')
      console.log(error)
    }
  }

  return (
    <main className="login-page">
      <section className="brand-panel" aria-label="SupportOps overview">
        <div className="glow glow-one"></div>
        <div className="glow glow-two"></div>
        <div className="grid-overlay"></div>

        <div className="brand-content">
          <div className="logo-section">
            <div className="logo-mark">S</div>
            <div>
              <h1>SupportOps</h1>
              <p>ENTERPRISE IT DESK</p>
            </div>
          </div>

          <div className="glass-card">
            <div className="card-icon">IT</div>
            <h2>Empowering your enterprise with intelligent support.</h2>
            <p>
              Centralize incidents, speed up response times, and give every
              employee a secure path to reliable technical support.
            </p>
          </div>

          <div className="stats-row">
            {stats.map((stat) => (
              <div className="stat-item" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="form-panel" aria-label="Login form">
        <div className="login-card">
          <div className="form-heading">
            <h2>Welcome back</h2>
            <p>Please enter your credentials to access the Help Desk.</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-options">
              <label className="remember-option" htmlFor="remember">
                <input id="remember" name="remember" type="checkbox" />
                <span>Remember me</span>
              </label>

              <a href="/">Forgot password?</a>
            </div>

            <button className="sign-in-button" type="submit">
              Sign In
            </button>
          </form>

          <div className="divider">
            <span></span>
            <p>OR CONTINUE WITH</p>
            <span></span>
          </div>

          <button className="google-button" type="button">
            <span className="google-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06L5.84 9.9C6.71 7.3 9.14 5.38 12 5.38z"
                />
              </svg>
            </span>
            <span>Continue with Google</span>
          </button>

          <p className="admin-text">
            Don&apos;t have an account?{' '}
            <a href="/">Contact your administrator</a>
          </p>
        </div>
      </section>
    </main>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/tickets/:id/edit" element={<EditTicket />} />
        <Route path="/tickets/:id" element={<TicketDetails />} />
        <Route path="/create-ticket" element={<CreateTicket />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/knowledge-base" element={<KnowledgeBase />} />
        <Route path="/users" element={<Users />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
