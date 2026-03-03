import { useEffect, useState } from "react";
import { Box, Grid } from "@mui/material";
import { Users, NotepadText } from "lucide-react";
import Navbar from "../layouts/Navbar";
import { getBirthdayReminders, getLastTwoWeeksReportStats, getStats } from "../services/dashboard-api";
import { StatCard } from "../components/StatCard";
import { BarChart } from "../components/BarChart";

interface ChartDataPoint {
  date: string;
  count: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>({});
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const token = sessionStorage.getItem("dd_token");
  const tenantId = sessionStorage.getItem("dd_tenant_id");

  const handleGetStats = async () => {
    if (!token || !tenantId) {
      return;
    }
    try {
      const stats = await getStats(token, tenantId);
      setStats(stats);
    } catch (error) {
      setStats({});
    }
  }

  const handleGetLastTwoWeeksReportStats = async () => {
    if (!token || !tenantId) {
      return;
    }

    try {
      const reportStats = await getLastTwoWeeksReportStats(token, tenantId);
      if (Array.isArray(reportStats)) {
        setChartData(reportStats);
      }
    } catch (error) {
      setChartData([]);
    }
  }

  const handleGetBirthdayReminders = async () => {
    if (!token || !tenantId) {
      console.error("Token or Tenant ID not found in session storage.");
      return;
    }

    try {
      const reminders = await getBirthdayReminders(token, tenantId);
    } catch (error) {
      console.error("Error fetching birthday reminders:", error);
    }
  }

  useEffect(() => {
    handleGetStats();
    handleGetLastTwoWeeksReportStats();
    handleGetBirthdayReminders();
  }, []);

  return (
    <Navbar>
      <div className="agency">
        <div className="agency-header">
          <h2 className="agency-title">Dashboard</h2>
        </div>
      </div>
        <Box className="agency">
          {/* Stats Cards Row */}
          <Grid container spacing={{ xs: 2, md: 2 }} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Generated Reports"
                value={stats.generatedReports || 0}
                icon={<NotepadText size={20} />}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Customers"
                value={stats.customers || 0}
                icon={<Users size={20} />}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Available Templates"
                value={stats.availableTemplates === -1 ? "Unlimited" : stats.availableTemplates || 0}
                icon={<NotepadText size={20} />}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Available Reports"
                value={stats.availableReports === -1 ? "Unlimited" : stats.availableReports || 0}
                icon={<NotepadText size={20} />}
              />
            </Grid>
          </Grid>

          {/* Chart Row */}
          <Grid container spacing={{ xs: 2, md: 4 }}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <BarChart 
                data={chartData} 
                title="Report Generation - Last 2 Weeks" 
              />
            </Grid>
            
            {/* Additional chart or content can go here */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <Box 
                sx={{ 
                  height: { xs: "200px", md: "300px" },
                  bgcolor: "#f8f9fa",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px dashed #e0e0e0"
                }}
              >
                <Box sx={{ textAlign: "center", color: "#999" }}>
                  <NotepadText size={40} />
                  <Box sx={{ mt: 2, fontSize: "0.9rem" }}>Additional Chart Area</Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
    </Navbar>
  );
}