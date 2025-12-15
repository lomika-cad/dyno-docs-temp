import { Container, Grid, Box, Typography } from "@mui/material";
import { Hourglass, Zap, Bookmark, Shield } from "lucide-react";

const StatsSection = () => {
  const stats = [
    {
      icon: Hourglass,
      value: "98%",
      label: "Reporting Time Saved",
    },
    {
      icon: Zap,
      value: "40%",
      label: "Increase in Decision Speed",
    },
    {
      icon: Bookmark,
      value: "500+",
      label: "Custom Reports Generated Monthly",
    },
    {
      icon: Shield,
      value: "99.9%",
      label: "Data Accuracy",
    },
  ];

  return (
    <Box sx={{ py: 8, bgcolor: "#ff7b2e17", px: { xs: 2, md: 5 } }}>
      <Container maxWidth="lg">
        <Grid
          container
          spacing={{ xs: 4, md: 6 }}
          alignItems="center"
        >
          {/* Left Content */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: "600",
                  color: "#333",
                  mb: 1,
                  fontSize: { xs: "1.5rem", md: "2rem" },
                }}
              >
                Empowering Travel Agencies
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  color: "#FF8C42",
                  fontWeight: "bold",
                  mb: 3.5,
                  fontSize: { xs: "1.3rem", md: "1.8rem" },
                }}
              >
                With Smarter Data
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#666",
                  lineHeight: 1.8,
                  fontSize: { xs: "0.95rem", md: "1rem" },
                }}
              >
                We help travel agencies evolve through intelligent reporting,
                automation, and real-time insights—built to boost performance and
                drive growth.
              </Typography>
            </Box>
          </Grid>

          {/* Right Stats Grid */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Grid container spacing={{ xs: 2.5, md: 3 }}>
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={index}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2.5,
                      }}
                    >
                      {/* Icon Container */}
                      <Box
                        sx={{
                          flexShrink: 0,
                          p: 1.2,
                          bgcolor: "#FFE8D6",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          minWidth: "50px",
                          height: "50px",
                        }}
                      >
                        <IconComponent
                          size={32}
                          color="#FF8C42"
                          strokeWidth={1.5}
                        />
                      </Box>

                      {/* Stat Content */}
                      <Box>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: "bold",
                            color: "#333",
                            fontSize: { xs: "1.5rem", md: "1.8rem" },
                            lineHeight: 1,
                            mb: 0.5,
                          }}
                        >
                          {stat.value}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#999",
                            fontSize: { xs: "0.85rem", md: "0.9rem" },
                            fontWeight: "500",
                          }}
                        >
                          {stat.label}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default StatsSection;
