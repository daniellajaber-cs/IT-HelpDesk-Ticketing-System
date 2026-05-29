import {
  BarChart3,
  Bell,
  BookOpen,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  Settings,
  Ticket,
  Users,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Tickets", icon: Ticket },
  { label: "Create Ticket", icon: PlusCircle },
  { label: "Reports", icon: BarChart3 },
  { label: "Notifications", icon: Bell },
  { label: "Knowledge Base", icon: BookOpen },
  { label: "Users", icon: Users },
  { label: "Settings", icon: Settings },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-brand">
          <div className="brand-icon">SO</div>
          <div>
            <h1>SupportOps</h1>
            <p>Enterprise IT Desk</p>
          </div>
        </div>

        <nav className="sidebar-menu" aria-label="Main navigation">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <a
                className={`sidebar-link ${item.active ? "active" : ""}`}
                href="/"
                key={item.label}
              >
                <Icon size={20} strokeWidth={2} />
                <span>{item.label}</span>
              </a>
            );
          })}
        </nav>
      </div>

      <a className="sidebar-link logout-link" href="/">
        <LogOut size={20} strokeWidth={2} />
        <span>Logout</span>
      </a>
    </aside>
  );
}

export default Sidebar;
