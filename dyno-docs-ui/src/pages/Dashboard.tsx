import { useEffect, useState } from "react";
import Navbar from "../layouts/Navbar";
import { getStats } from "../services/dashboard-api";

export default function Dashboard() {
  const [stats, setStats] = useState<any>({});
  const token = sessionStorage.getItem("dd_token");
  const tenantId = sessionStorage.getItem("dd_tenant_id");

  const handleGetStats = async () => {
    if (!token || !tenantId) {
      console.error("Token or Tenant ID not found in session storage.");
      return;
    }
    try {
      const stats = await getStats(token, tenantId);
      setStats(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    }
  }

  useEffect(() => {
    handleGetStats();
  }, []);

  return (
    <Navbar>
      <div className="agency">
        <div className="agency-header">
          <h2 className="agency-title">Dashboard</h2>
        </div>
      </div>
      {/* <div>
        <p>Total Chats: {stats.totalReports}</p>
        <p>Active Chats: {stats.totalCustomers}</p>
        <p>Resolved Chats: {stats.availableTemplates === -1 ? "Unlimited" : stats.availableTemplates}</p>
        <p>Average Response Time: {stats.availableReports === -1 ? "Unlimited" : stats.availableReports} seconds</p>
      </div> */}
    </Navbar>
  );
}