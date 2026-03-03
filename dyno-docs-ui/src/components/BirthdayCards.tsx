import { Box, Card, CardContent, Typography, IconButton, Chip } from "@mui/material";
import { Calendar, Mail, Cake } from "lucide-react";

interface BirthdayData {
  id: string;
  name: string;
  dateOfBirth: string;
  upcomingBirthday: string;
  daysRemaining: number;
}

interface BirthdayCardsProps {
  data: BirthdayData[];
}

export function BirthdayCards({ data }: BirthdayCardsProps) {
  const handleSendEmail = (person: BirthdayData) => {
    // Handle sending birthday email
    console.log("Sending email to:", person.name);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getBirthdayChipColor = (daysRemaining: number) => {
    if (daysRemaining === 0) return { bgcolor: "#FF5722", color: "white" };
    if (daysRemaining <= 3) return { bgcolor: "#FF9800", color: "white" };
    return { bgcolor: "#4CAF50", color: "white" };
  };

  const getBirthdayText = (daysRemaining: number) => {
    if (daysRemaining === 0) return "Today!";
    if (daysRemaining === 1) return "Tomorrow";
    return `${daysRemaining} days`;
  };

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
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
            <Box
              sx={{
                p: 1.5,
                bgcolor: "#FFF3E0",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Cake size={20} color="#F57C00" strokeWidth={2} />
            </Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: "600",
                color: "#333",
                fontSize: { xs: "1rem", md: "1.1rem" },
              }}
            >
              Upcoming Birthdays
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
            No upcoming birthdays
          </Typography>
        </CardContent>
      </Card>
    );
  }

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
              bgcolor: "#FFF3E0",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Cake size={20} color="#F57C00" strokeWidth={2} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: "600",
              color: "#333",
              fontSize: { xs: "1rem", md: "1.1rem" },
            }}
          >
            Upcoming Birthdays
          </Typography>
        </Box>

        {/* Birthday List */}
        <Box
          sx={{
            maxHeight: { xs: "200px", md: "240px" },
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              width: "4px",
            },
            "&::-webkit-scrollbar-track": {
              bgcolor: "#f1f1f1",
              borderRadius: "4px",
            },
            "&::-webkit-scrollbar-thumb": {
              bgcolor: "#c1c1c1",
              borderRadius: "4px",
              "&:hover": {
                bgcolor: "#a8a8a8",
              },
            },
          }}
        >
          {data.map((person, index) => (
            <Box
              key={person.id}
              sx={{
                p: 2,
                border: "1px solid #f0f0f0",
                borderRadius: "8px",
                mb: index === data.length - 1 ? 0 : 2,
                transition: "all 0.3s ease",
                "&:hover": {
                  bgcolor: "#f8f9fa",
                  borderColor: "#e0e0e0",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "600",
                    color: "#333",
                    fontSize: { xs: "0.9rem", md: "1rem" },
                  }}
                >
                  {person.name}
                </Typography>
                
                {person.daysRemaining === 0 && (
                  <IconButton
                    size="small"
                    onClick={() => handleSendEmail(person)}
                    sx={{
                      color: "#1976D2",
                      "&:hover": {
                        bgcolor: "#E3F2FD",
                      },
                    }}
                  >
                    <Mail size={16} />
                  </IconButton>
                )}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Calendar size={14} color="#666" />
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#666",
                      fontSize: { xs: "0.8rem", md: "0.85rem" },
                    }}
                  >
                    {formatDate(person.upcomingBirthday)}
                  </Typography>
                </Box>

                <Chip
                  label={getBirthdayText(person.daysRemaining)}
                  size="small"
                  sx={{
                    ...getBirthdayChipColor(person.daysRemaining),
                    fontSize: { xs: "0.7rem", md: "0.75rem" },
                    height: { xs: "20px", md: "24px" },
                    fontWeight: "500",
                  }}
                />
              </Box>

              {person.daysRemaining === 0 && (
                <Box
                  sx={{
                    mt: 1,
                    p: 1,
                    bgcolor: "#FFF3E0",
                    borderRadius: "4px",
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Cake size={14} color="#F57C00" />
                  <Typography
                    variant="caption"
                    sx={{
                      color: "#F57C00",
                      fontWeight: "600",
                      fontSize: { xs: "0.7rem", md: "0.75rem" },
                    }}
                  >
                    🎉 Birthday Today!
                  </Typography>
                </Box>
              )}
            </Box>
          ))}
        </Box>

        {/* Footer with count */}
        <Box
          sx={{
            mt: 2,
            pt: 2,
            borderTop: "1px solid #f0f0f0",
            textAlign: "center",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "#999",
              fontSize: { xs: "0.75rem", md: "0.8rem" },
            }}
          >
            {data.length} upcoming birthday{data.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}