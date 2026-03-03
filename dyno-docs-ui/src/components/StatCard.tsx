import { Card, CardContent, Typography, Box } from "@mui/material";

type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
};

export function StatCard({
  title,
  value,
  icon,
}: StatCardProps) {
  return (
    <Card
      sx={{
        borderRadius: 3,
        backgroundColor: "#ffffff",
        border: "1px solid #f0f0f0",
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
        transition: "all 0.25s ease",
        "&:hover": {
          boxShadow: "0 6px 18px rgba(255,106,0,0.15)",
          transform: "translateY(-2px)",
          borderColor: "rgba(255,106,0,0.25)",
        },
      }}
    >
      <CardContent
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px !important",
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 600,
              color: "#777",
              mb: 1,
            }}
          >
            {title}
          </Typography>

          <Typography
            sx={{
              fontSize: 26,
              fontWeight: 800,
              color: "#222",
              letterSpacing: "-0.5px",
            }}
          >
            {value}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            background:
              "linear-gradient(135deg, rgba(255,106,0,0.15), rgba(255,176,0,0.12))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FF6A00",
          }}
        >
          {icon}
        </Box>
      </CardContent>
    </Card>
  );
}