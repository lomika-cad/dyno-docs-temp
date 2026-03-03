import { useEffect, useState } from "react";
import { Box, Container, Grid } from "@mui/material";
import { Users, NotepadText } from "lucide-react";
import Navbar from "../layouts/Navbar";
import { getLastTwoWeeksReportStats, getStats } from "../services/dashboard-api";
import { StatCard } from "../components/StatCard";

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

  const handleGetLastTwoWeeksReportStats = async () => {
    if (!token || !tenantId) {
      console.error("Token or Tenant ID not found in session storage.");
      return;
    }

    try {
      const reportStats = await getLastTwoWeeksReportStats(token, tenantId);
      console.log("Last two weeks report stats:", reportStats);
    } catch (error) {
      console.error("Error fetching last two weeks report stats:", error);
    }
  }

  useEffect(() => {
    handleGetStats();
    handleGetLastTwoWeeksReportStats();
  }, []);

  return (
    <Navbar>
      <div className="agency">
        <div className="agency-header">
          <h2 className="agency-title">Dashboard</h2>
        </div>
      </div>
      <Container sx={{ py: 2 }}>
        <Box className="agency">

          <Grid container spacing={{ md: 2 }}>
            <Grid size={3}>
              <StatCard
                title="Generated Reports"
                value={stats.generatedReports || 0}
                icon={<NotepadText size={20} />}
              />
            </Grid>

            <Grid size={3}>
              <StatCard
                title="Customers"
                value={stats.customers || 0}
                icon={<Users size={20} />}
              />
            </Grid>

            <Grid size={3}>
              <StatCard
                title="Available Templates"
                value={stats.availableTemplates === -1 ? "Unlimited" : stats.availableTemplates || 0}
                icon={<NotepadText size={20} />}
              />
            </Grid>

            <Grid size={3}>
              <StatCard
                title="Available Reports"
                value={stats.availableReports === -1 ? "Unlimited" : stats.availableReports || 0}
                icon={<NotepadText size={20} />}
              />
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Navbar>
  );
}