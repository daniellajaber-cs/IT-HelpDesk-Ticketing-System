import { Bell, Moon, Search, UserCircle } from "lucide-react";

function Navbar() {
  return (
    <header className="navbar">
      <div className="search-box">
        <Search size={19} strokeWidth={2} />
        <input
          aria-label="Search"
          placeholder="Search Help Desk tickets, agents, or assets..."
          type="search"
        />
      </div>

      <div className="navbar-actions">
        <button className="icon-button" aria-label="Notifications" type="button">
          <Bell size={20} strokeWidth={2} />
        </button>
        <button className="icon-button" aria-label="Dark mode" type="button">
          <Moon size={20} strokeWidth={2} />
        </button>

        <div className="profile">
          <div className="profile-avatar" aria-hidden="true">
            <UserCircle size={26} strokeWidth={1.8} />
          </div>
          <div>
            <p className="profile-name">Admin User</p>
            <p className="profile-role">IT Director</p>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
