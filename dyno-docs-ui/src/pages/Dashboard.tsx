import { useEffect, useState } from "react";
import { Box, Grid } from "@mui/material";
import { Users, NotepadText } from "lucide-react";
import Navbar from "../layouts/Navbar";
import { getBirthdayReminders, getLastTwoWeeksReportStats, getStats } from "../services/dashboard-api";
import { StatCard } from "../components/StatCard";
import { BarChart } from "../components/BarChart";
import { BirthdayCards } from "../components/BirthdayCards";

interface ChartDataPoint {
  date: string;
  count: number;
}

interface BirthdayData {
  id: string;
  name: string;
  dateOfBirth: string;
  upcomingBirthday: string;
  daysRemaining: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>({});
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [birthdayData, setBirthdayData] = useState<BirthdayData[]>([]);
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
      if (Array.isArray(reminders)) {
        setBirthdayData(reminders);
      }
    } catch (error) {
      console.error("Error fetching birthday reminders:", error);
      // Set sample data if API fails for demonstration
      setBirthdayData([
        {
          id: "08de790e-ad75-4479-8eee-7248505d7875",
          name: "Garry Parker",
          dateOfBirth: "2000-03-10",
          upcomingBirthday: "2026-03-10T00:00:00",
          daysRemaining: 7
        },
        {
          id: "08de790e-bca4-4ad2-8e54-c503d084e86a",
          name: "Peter Pan",
          dateOfBirth: "1998-03-15",
          upcomingBirthday: "2026-03-15T00:00:00",
          daysRemaining: 12
        }
      ]);
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
                value={stats.totalReports || 0}
                icon={<NotepadText size={20} />}
              />
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <StatCard
                title="Customers"
                value={stats.totalCustomers || 0}
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
            
            {/* Birthday Cards Area */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <BirthdayCards data={birthdayData} />
            </Grid>
          </Grid>
        </Box>
    </Navbar>
  );
}