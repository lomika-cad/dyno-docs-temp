import { Box, Card, CardContent, Typography, IconButton, Chip } from "@mui/material";
import { Calendar, Mail, Cake } from "lucide-react";
import { sendCustomerEmail } from "../services/customer-api";
import { showSuccess, showError } from "./Toast";
import { useState } from "react";
import "../styles/agencyData.css";

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
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<BirthdayData | null>(null);
  const [sending, setSending] = useState(false);
  const token = sessionStorage.getItem("dd_token");

  const handleSendEmail = (person: BirthdayData) => {
    setSelectedPerson(person);
    setConfirmModalOpen(true);
  };

  const handleConfirmSend = async () => {
    if (!selectedPerson || !token) {
      showError("Unable to send email. Please try again.");
      return;
    }

    setSending(true);
    try {
      await sendCustomerEmail(selectedPerson.id, token);
      showSuccess(`Birthday email sent to ${selectedPerson.name}! 🎉`);
      setConfirmModalOpen(false);
      setSelectedPerson(null);
    } catch (error) {
      console.error("Error sending birthday email:", error);
      showError("Failed to send birthday email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleCloseModal = () => {
    if (!sending) {
      setConfirmModalOpen(false);
      setSelectedPerson(null);
    }
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
      <>
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

        {/* Confirmation Modal */}
        {confirmModalOpen && selectedPerson && (
          <div 
            className="ddModal" 
            role="dialog" 
            aria-modal="true" 
            aria-label="Send Birthday Email"
            style={{ 
              position: 'fixed', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)'
            }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={handleCloseModal}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                border: 'none',
                cursor: 'pointer'
              }}
            />

            <div className="ddModal-card" style={{ position: 'relative', zIndex: 1 }}>
              <div className="ddModal-logo" aria-hidden="true">
                <Mail size={32} color="#1976D2" strokeWidth={1.5} />
              </div>

              <div className="ddModal-title">Send Birthday Wish? 🎂</div>
              <div className="ddModal-subtitle">
                Do you want to send a birthday email to <strong>{selectedPerson.name}</strong>?
              </div>

              <div className="ddModal-actions">
                <button
                  type="button"
                  className="ddModal-btn ddModal-btn--ghost"
                  onClick={handleCloseModal}
                  disabled={sending}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ddModal-btn ddModal-btn--primary"
                  onClick={handleConfirmSend}
                  disabled={sending}
                >
                  <Mail size={16} style={{ marginRight: '8px' }} />
                  {sending ? 'Sending...' : 'Send Email'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
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
                  
                  <IconButton
                    size="small"
                    onClick={() => handleSendEmail(person)}
                    sx={{
                      color: "#1976D2",
                      "&:hover": {
                        bgcolor: "#E3F2FD",
                      },
                    }}
                    title="Send birthday email"
                  >
                    <Mail size={16} />
                  </IconButton>
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

      {/* Confirmation Modal */}
      {confirmModalOpen && selectedPerson && (
        <div 
          className="ddModal" 
          role="dialog" 
          aria-modal="true" 
          aria-label="Send Birthday Email"
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)'
          }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={handleCloseModal}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              border: 'none',
              cursor: 'pointer'
            }}
          />

          <div className="ddModal-card" style={{ position: 'relative', zIndex: 1 }}>
            <div className="ddModal-logo" aria-hidden="true">
              <Mail size={32} color="#1976D2" strokeWidth={1.5} />
            </div>

            <div className="ddModal-title">Send Birthday Wish? 🎂</div>
            <div className="ddModal-subtitle">
              Do you want to send a birthday email to <strong>{selectedPerson.name}</strong>?
            </div>

            <div className="ddModal-actions">
              <button
                type="button"
                className="ddModal-btn ddModal-btn--ghost"
                onClick={handleCloseModal}
                disabled={sending}
              >
                Cancel
              </button>
              <button
                type="button"
                className="ddModal-btn ddModal-btn--primary"
                onClick={handleConfirmSend}
                disabled={sending}
              >
                <Mail size={16} style={{ marginRight: '8px' }} />
                {sending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}