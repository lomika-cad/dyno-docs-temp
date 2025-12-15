import { Container, Grid, Box, Typography, Card, CardContent } from "@mui/material";
import { Lightbulb, CheckCircle, Grid3x3 } from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Lightbulb,
      title: "Real-Time Insights at Your Fingertips",
      description:
        "Access live booking, sales, and performance data instantly—no more waiting for manual reports.",
    },
    {
      icon: CheckCircle,
      title: "Custom Reports for Every Need",
      description:
        "Filter, personalize, and generate reports that match your agency's unique workflow.",
    },
    {
      icon: Grid3x3,
      title: "Automate Your Reporting Tasks",
      description:
        "Schedule reports to run and deliver automatically, saving hours of repetitive work.",
    },
  ];

  return (
    <Box sx={{ py: 8, bgcolor: "#f9f9f9" }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: "bold",
              color: "#333",
              mb: 2,
              mt: 2,
              fontSize: { xs: "1.8rem", md: "2.5rem" },
            }}
          >
            Smart Reporting for Growing Agencies
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: "#666",
              fontSize: "1.1rem",
              maxWidth: "600px",
              mx: "auto",
            }}
          >
            Ideal for teams that need real-time dashboards and customizable
            reports.
          </Typography>
        </Box>

        {/* Features Grid */}
        <Grid container spacing={4}>
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    border: "1px solid #e0e0e0",
                    borderRadius: "12px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: "0 8px 16px rgba(0, 0, 0, 0.15)",
                      transform: "translateY(-4px)",
                    },
                  }}
                >
                  <CardContent
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      p: 3,
                    }}
                  >
                    {/* Icon */}
                    <Box
                      sx={{
                        mt: 2,
                        mb: 4,
                        p: 1.5,
                        bgcolor: "#FFD6B3",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconComponent
                        size={40}
                        color="#000000ff"
                        strokeWidth={1.5}
                      />
                    </Box>

                    {/* Title */}
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        color: "#333",
                        mb: 2,
                        px: 2,
                      }}
                    >
                      {feature.title}
                    </Typography>

                    {/* Description */}
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#666",
                        lineHeight: 1.6,
                        mt: 2,
                        mb: 1,
                        px: 1,
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
};

export default FeaturesSection;
