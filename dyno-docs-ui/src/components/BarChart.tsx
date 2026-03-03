import { Box, Card, CardContent, Typography } from "@mui/material";
import { BarChart as BarChartIcon } from "lucide-react";

interface ChartDataPoint {
  date: string; // ISO string: "2026-03-03"
  count: number;
}

interface BarChartProps {
  data: ChartDataPoint[];
  title?: string;
}

export function BarChart({
  data,
  title = "Last 2 Weeks Report Statistics",
}: BarChartProps) {
  const formatDate = (dateStr: string) => {
    // if dateStr is "YYYY-MM-DD" this is safe
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Empty state
  if (!data || data.length === 0) {
    return (
      <Card
        sx={{
          height: "100%",
          borderRadius: "12px",
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 10px 26px rgba(0,0,0,0.06)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                background:
                  "linear-gradient(135deg, rgba(255,106,0,0.16), rgba(255,176,0,0.12))",
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(255,106,0,0.20)",
              }}
            >
              <BarChartIcon size={18} color="#FF6A00" strokeWidth={2} />
            </Box>
            <Typography sx={{ fontWeight: 800, color: "#222", fontSize: 16 }}>
              {title}
            </Typography>
          </Box>

          <Typography
            variant="body2"
            sx={{ color: "rgba(0,0,0,0.55)", textAlign: "center", py: 4 }}
          >
            No data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // --- Scaling ---
  const chartHeight = 260; // px (fixed so bars scale correctly)
  const topPadding = 24; // space reserved for value labels
  const bottomPadding = 34; // space reserved for date labels
  const drawableHeight = chartHeight - topPadding - bottomPadding;

  const maxValue = Math.max(...data.map((d) => d.count), 1);
  const minPx = 3;

  const total = data.reduce((sum, x) => sum + x.count, 0);
  const avg = total / data.length;

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: "12px",
        border: "1px solid rgba(0,0,0,0.06)",
        transition: "all 0.25s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          borderColor: "rgba(255,106,0,0.22)",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              background:
                "linear-gradient(135deg, rgba(255,106,0,0.16), rgba(255,176,0,0.12))",
              display: "grid",
              placeItems: "center",
              border: "1px solid rgba(255,106,0,0.20)",
              boxShadow: "0 10px 26px rgba(255,106,0,0.10)",
            }}
          >
            <BarChartIcon size={18} color="#FF6A00" strokeWidth={2} />
          </Box>

          <Typography sx={{ fontWeight: 800, color: "#222", fontSize: 16 }}>
            {title}
          </Typography>
        </Box>

        {/* Chart */}
        <Box
          sx={{
            height: chartHeight,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: { xs: "3px", sm: "4px", md: "6px" },
            px: 1,
            pb: 1,
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 10,
              height: "1px",
              bgcolor: "rgba(0,0,0,0.10)",
            },
          }}
        >
          {data.map((item, index) => {
            // ✅ sqrt scaling makes small values visible when max is large
            const scaled = Math.sqrt(item.count) / Math.sqrt(maxValue);
            const barPx =
              item.count === 0
                ? minPx
                : Math.max(minPx, Math.round(scaled * drawableHeight));

            return (
              <Box
                key={`${item.date}-${index}`}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  "&:hover .bar": {
                    filter: "brightness(0.98)",
                    transform: "scaleY(1.06)",
                  },
                  "&:hover .value": {
                    opacity: 1,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                {/* Value */}
                <Typography
                  className="value"
                  variant="caption"
                  sx={{
                    height: topPadding,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: "rgba(0,0,0,0.55)",
                    opacity: item.count === 0 ? 0.45 : 0.95,
                    transition: "all 0.2s ease",
                    userSelect: "none",
                  }}
                >
                  {item.count}
                </Typography>

                {/* Bar */}
                <Box
                  className="bar"
                  sx={{
                    width: { xs: "100%", sm: "86%", md: "72%" },
                    maxWidth: 18,
                    height: `${barPx}px`,
                    borderRadius: "6px 6px 0 0",
                    background:
                      item.count === 0
                        ? "rgba(0,0,0,0.10)"
                        : "linear-gradient(180deg, #FFB000 0%, #FF6A00 100%)",
                    transformOrigin: "bottom",
                    transition: "transform 180ms ease",
                  }}
                />

                {/* Date */}
                <Typography
                  variant="caption"
                  sx={{
                    height: bottomPadding,
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(0,0,0,0.45)",
                    transform: "rotate(-45deg)",
                    transformOrigin: "center",
                    whiteSpace: "nowrap",
                    userSelect: "none",
                  }}
                >
                  {formatDate(item.date)}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Summary */}
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: "1px solid rgba(0,0,0,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ textAlign: "center", minWidth: 90 }}>
            <Typography sx={{ fontSize: 11, color: "rgba(0,0,0,0.45)", fontWeight: 800 }}>
              TOTAL
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#222", fontWeight: 900 }}>
              {total}
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center", minWidth: 90 }}>
            <Typography sx={{ fontSize: 11, color: "rgba(0,0,0,0.45)", fontWeight: 800 }}>
              AVERAGE
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#222", fontWeight: 900 }}>
              {avg.toFixed(1)}
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center", minWidth: 90 }}>
            <Typography sx={{ fontSize: 11, color: "rgba(0,0,0,0.45)", fontWeight: 800 }}>
              PEAK
            </Typography>
            <Typography sx={{ fontSize: 14, color: "#222", fontWeight: 900 }}>
              {maxValue}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}