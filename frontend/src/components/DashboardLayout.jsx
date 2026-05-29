import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

function DashboardLayout({ children }) {
  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-shell">
        <Navbar />
        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}

export default DashboardLayout;
