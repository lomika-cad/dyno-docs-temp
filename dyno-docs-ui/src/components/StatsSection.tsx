import { useEffect, useMemo, useRef, useState } from "react";
import { Container, Grid, Box, Typography } from "@mui/material";
import { Hourglass, Zap, Bookmark, Shield } from "lucide-react";

const StatsSection = () => {
  const stats = useMemo(
    () => [
      {
        icon: Hourglass,
        value: 98,
        suffix: "%",
        label: "Reporting Time Saved",
      },
      {
        icon: Zap,
        value: 40,
        suffix: "%",
        label: "Increase in Decision Speed",
      },
      {
        icon: Bookmark,
        value: 500,
        suffix: "+",
        label: "Custom Reports Generated Monthly",
      },
      {
        icon: Shield,
        value: 99.9,
        suffix: "%",
        label: "Data Accuracy",
      },
    ],
    [],
  );

  const [counts, setCounts] = useState<number[]>(() => stats.map(() => 0));
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const animatedSet = useRef<Set<number>>(new Set());

  useEffect(() => {
    const animateValue = (index: number, target: number, duration = 1400) => {
      const start = performance.now();

      const step = (timestamp: number) => {
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic for a smooth finish
        const current = target * eased;

        setCounts((prev) => {
          const next = [...prev];
          next[index] = current;
          return next;
        });

        if (progress < 1) {
          requestAnimationFrame(step);
        }
      };

      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const index = Number(entry.target.getAttribute("data-stat-index"));
          if (Number.isNaN(index)) return;
          if (animatedSet.current.has(index)) return;

          animatedSet.current.add(index);
          animateValue(index, stats[index].value);
        });
      },
      { threshold: 0.35 },
    );

    cardRefs.current.forEach((card, index) => {
      if (card) {
        card.setAttribute("data-stat-index", String(index));
        observer.observe(card);
      }
    });

    return () => observer.disconnect();
  }, [stats]);

  return (
    <Box sx={{ py: 15, bgcolor: "#ff7b2e17", px: { xs: 2, md: 5 } }}>
      <Container maxWidth="lg">
        <Grid
          container
          spacing={{ xs: 4, md: 6 }}
          alignItems="stretch"
        >
          {/* Left Content */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Box data-aos="fade-right">
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
                  mb: 4.5,
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
            <Grid container spacing={{ xs: 3.5, md: 4.5 }}>
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                const isDecimal = stat.value % 1 !== 0;
                const displayValue = isDecimal
                  ? counts[index].toFixed(1)
                  : Math.round(counts[index]).toLocaleString();

                return (
                  <Grid
                    size={{ xs: 12, sm: 6 }}
                    key={index}
                    data-aos="fade-up"
                    data-aos-delay={index * 120}
                  >
                    <Box
                      ref={(el) => {
                        cardRefs.current[index] = el as HTMLDivElement | null;
                      }}
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 3.5,
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
                          {displayValue}
                          {stat.suffix}
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
