import { Container, Grid, Box, Typography, Button } from "@mui/material";
import { ArrowRight } from "lucide-react";
import previewSite from "../assets/site-preview.png";

const CTASection = () => {
  return (
    <Box sx={{ py: { xs: 6, md: 10 }, px: { xs: 2, md: 5 }, bgcolor: "#fff" }}>
      <Container maxWidth="lg">
        <Grid
          container
          spacing={{ xs: 3, md: 6 }}
          alignItems="center"
        >
          {/* Left Content */}
          <Grid size={{ xs: 12, md: 6 }} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            <Box>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: "bold",
                  color: "#000",
                  mb: 2.5,
                  fontSize: { xs: "1.8rem", md: "2.2rem" },
                  lineHeight: 1.2,
                }}
                data-aos="fade-right"
              >
                The Fastest Way to Generate Travel Reports
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: "#666",
                  lineHeight: 1.8,
                  fontSize: { xs: "0.95rem", md: "1rem" },
                  mb: 3.5,
                }}
                data-aos="fade-right"
              >
                Create accurate, professional reports in seconds—no spreadsheets,
                no delays, just instant insights powered by smart automation.
              </Typography>
              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowRight size={20} />}
                sx={{
                  bgcolor: "#FF8C42",
                  color: "#fff",
                  fontWeight: "600",
                  fontSize: "1rem",
                  padding: "12px 32px",
                  borderRadius: "8px",
                  textTransform: "none",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    bgcolor: "#FF7620",
                    transform: "translateX(4px)",
                  },
                }}
                data-aos="fade-right"
              >
                Get started for free
              </Button>
            </Box>
          </Grid>

          {/* Right Image */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Box
              sx={{
                position: "relative",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: { xs: "300px", md: "400px" },
              }}
              data-aos="fade-left"
            >
              {/* Placeholder for dashboard image */}
              <Box
                sx={{
                  width: "100%",
                  maxWidth: "500px",
                  bgcolor: "#f5f5f5",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  aspectRatio: "16/10",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Dashboard preview image - replace with actual image path */}
                <img
                  src={previewSite}
                  alt="DynoDocs Dashboard Preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>

              {/* Decorative shadow effect */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: -20,
                  width: "90%",
                  height: "40px",
                  bgcolor: "rgba(0,0,0,0.05)",
                  borderRadius: "50%",
                  filter: "blur(20px)",
                  zIndex: -1,
                }}
              />
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default CTASection;
