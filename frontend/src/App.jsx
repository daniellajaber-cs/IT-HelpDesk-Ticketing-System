import { useState } from "react";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e) {
    e.preventDefault();

    const loginData = {
      email: email,
      password: password,
    };

    try {
      const response = await fetch("http://localhost:5298/api/Auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      if (response.ok) {
        const data = await response.json();

        localStorage.setItem("token", data.token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("fullName", data.fullName);

        alert("Login successful");
      } else {
        alert("Invalid email or password");
      }
    } catch (error) {
      alert("Cannot connect to backend");
      console.log(error);
    }
  }

  return (
    <main className="login-page">
      <section className="brand-panel">
        <div className="glow glow-one"></div>
        <div className="glow glow-two"></div>
        <div className="grid-lines"></div>

        <div className="brand-header">
          <div className="logo-mark">S</div>
          <div>
            <h1>SupportOps</h1>
            <p>ENTERPRISE IT DESK</p>
          </div>
        </div>

        <div className="message-card">
          <span className="eyebrow">Intelligent Service Management</span>
          <h2>Empowering your enterprise with intelligent support.</h2>
          <p>
            Streamline incidents, automate ticket routing, and keep every team
            connected with a secure help desk built for modern IT operations.
          </p>
        </div>

        <div className="stats-row">
          <div className="stat-item">
            <strong>99.9%</strong>
            <span>SLA Uptime</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <strong>15min</strong>
            <span>Avg. Response</span>
          </div>
        </div>
      </section>

      <section className="form-panel">
        <div className="login-card">
          <div className="form-heading">
            <h2>Welcome back</h2>
            <p>Please enter your credentials to access the Help Desk.</p>
          </div>

          <form onSubmit={handleLogin}>
            <div className="field-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="agent@enterprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-options">
              <label className="remember-option" htmlFor="remember">
                <input id="remember" type="checkbox" />
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
              <span className="google-blue"></span>
              <span className="google-red"></span>
              <span className="google-yellow"></span>
              <span className="google-green"></span>
            </span>
            <span>Continue with Google</span>
          </button>

          <p className="admin-note">
            Don't have an account? <a href="/">Contact your administrator</a>
          </p>
        </div>
      </section>
    </main>
  );
}

export default App;