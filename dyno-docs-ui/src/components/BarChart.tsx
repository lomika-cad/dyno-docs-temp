import { Box, Card, CardContent, Typography } from "@mui/material";
import { BarChart as BarChartIcon } from "lucide-react";

interface ChartDataPoint {
  date: string;
  count: number;
}

interface BarChartProps {
  data: ChartDataPoint[];
  title?: string;
}

export function BarChart({ data, title = "Last 2 Weeks Report Statistics" }: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card
        sx={{
          height: "100%",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: "#E8F5E8",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BarChartIcon size={20} color="#2E7D32" strokeWidth={2} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "600",
                color: "#333",
                fontSize: { xs: "1rem", md: "1.1rem" },
              }}
            >
              {title}
            </Typography>
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: "#666",
              textAlign: "center",
              py: 4,
            }}
          >
            No data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count));
  const minBarHeight = 4; // Minimum height for zero values

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
          <Box
            sx={{
              p: 1.5,
              bgcolor: "#E8F5E8",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <BarChartIcon size={20} color="#2E7D32" strokeWidth={2} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "600",
              color: "#333",
              fontSize: { xs: "1rem", md: "1.1rem" },
            }}
          >
            {title}
          </Typography>
        </Box>

        {/* Chart Container */}
        <Box
          sx={{
            height: { xs: "200px", md: "250px" },
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            gap: { xs: "2px", sm: "3px", md: "4px" },
            px: 1,
            pb: 2,
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: "1px",
              bgcolor: "#e0e0e0",
            }
          }}
        >
          {data.map((item, index) => {
            const barHeight = maxValue > 0 
              ? Math.max(((item.count / maxValue) * 80), item.count === 0 ? minBarHeight : 10)
              : minBarHeight;
            
            return (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  "&:hover .bar": {
                    bgcolor: "#1976D2",
                    transform: "scaleY(1.05)",
                  },
                  "&:hover .value": {
                    opacity: 1,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                {/* Value Label */}
                <Typography
                  className="value"
                  variant="caption"
                  sx={{
                    color: "#666",
                    fontSize: { xs: "0.7rem", md: "0.75rem" },
                    fontWeight: "500",
                    mb: 0.5,
                    opacity: item.count > 0 ? 1 : 0.5,
                    transition: "all 0.3s ease",
                    minHeight: "20px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {item.count}
                </Typography>

                {/* Bar */}
                <Box
                  className="bar"
                  sx={{
                    width: { xs: "100%", sm: "80%", md: "70%" },
                    maxWidth: "20px",
                    height: `${barHeight}%`,
                    bgcolor: item.count === 0 ? "#e0e0e0" : "#4CAF50",
                    borderRadius: "4px 4px 0 0",
                    transition: "all 0.3s ease",
                    transformOrigin: "bottom",
                    position: "relative",
                    "&::after": item.count > 0 ? {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: "3px",
                      bgcolor: "#2E7D32",
                      borderRadius: "4px 4px 0 0",
                    } : {},
                  }}
                />

                {/* Date Label */}
                <Typography
                  variant="caption"
                  sx={{
                    color: "#999",
                    fontSize: { xs: "0.65rem", md: "0.7rem" },
                    mt: 1,
                    transform: "rotate(-45deg)",
                    transformOrigin: "center",
                    whiteSpace: "nowrap",
                    minHeight: { xs: "20px", md: "24px" },
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {formatDate(item.date)}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Summary Stats */}
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: "1px solid #f0f0f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1,
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{ color: "#999", fontSize: "0.7rem", display: "block" }}
            >
              Total
            </Typography>
            <Typography
              variant="body2"
              sx={{ 
                color: "#333", 
                fontWeight: "600",
                fontSize: { xs: "0.85rem", md: "0.9rem" }
              }}
            >
              {data.reduce((sum, item) => sum + item.count, 0)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{ color: "#999", fontSize: "0.7rem", display: "block" }}
            >
              Average
            </Typography>
            <Typography
              variant="body2"
              sx={{ 
                color: "#333", 
                fontWeight: "600",
                fontSize: { xs: "0.85rem", md: "0.9rem" }
              }}
            >
              {(data.reduce((sum, item) => sum + item.count, 0) / data.length).toFixed(1)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography
              variant="caption"
              sx={{ color: "#999", fontSize: "0.7rem", display: "block" }}
            >
              Peak
            </Typography>
            <Typography
              variant="body2"
              sx={{ 
                color: "#333", 
                fontWeight: "600",
                fontSize: { xs: "0.85rem", md: "0.9rem" }
              }}
            >
              {maxValue}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}