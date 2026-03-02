import { useEffect, useState } from "react";
import Navbar from "../layouts/Navbar";
import "../styles/agencyData.css";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import CircularProgress from '@mui/material/CircularProgress';
import { getReports } from "../services/reports-api";
import { showError, showSuccess } from "../components/Toast";

interface Report {
    id: string;
    customerName: string;
    customerEmail: string;
    generatedReport: string;
    createdAt: string;
    lastModifiedAt?: string;
}

export default function ReportsHistory() {
    const DD_TOKEN = sessionStorage.getItem("dd_token") || "";
    const [reports, setReports] = useState<Report[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const itemsPerPage = 10;

    const handleFetchReports = async () => {
        try {
            setIsLoading(true);
            const tenantId = sessionStorage.getItem('dd_tenant_id') || '';
            const response = await getReports(tenantId, DD_TOKEN);
            setReports(response || []);
            setCurrentPage(1);
        } catch (error) {
            showError("Failed to fetch reports. Please try again.");
            setReports([]);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        handleFetchReports();
    }, []);

    // Filter reports based on search term
    const filteredReports = reports.filter((report) =>
        report.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination calculations
    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentReports = filteredReports.slice(startIndex, endIndex);

    const getPaginationNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleViewReport = (report: Report) => {
        setSelectedReport(report);
        setViewModalOpen(true);
    };

    return (
        <Navbar>
            {isLoading && (
                <div className="globalLoader">
                    <CircularProgress size={40} sx={{ color: "var(--color-primary)" }} />
                </div>
            )}

            <div className="agency">
                <div className="agency-header">
                    <h1 className="agency-title">Reports History</h1>
                </div>

                <div className="panel">
                    <div className="panel-header">
                        <div style={{
                            position: "relative",
                            flexGrow: 1,
                            maxWidth: "420px"
                        }}>
                            <SearchRoundedIcon style={{
                                position: "absolute",
                                left: "14px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#9ca3af",
                                fontSize: "20px",
                                pointerEvents: "none"
                            }} />
                            <input
                                type="text"
                                placeholder="Search by customer name or email..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                style={{
                                    width: "100%",
                                    paddingLeft: "44px",
                                    paddingRight: "14px",
                                    paddingTop: "10px",
                                    paddingBottom: "10px",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "10px",
                                    fontSize: "14px",
                                    outline: "none",
                                    transition: "all 0.2s",
                                    background: "#fff"
                                }}
                                onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
                                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                            />
                        </div>
                        <div style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontSize: "13px",
                            color: "#6b7280",
                            fontWeight: "600"
                        }}>
                            {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
                        </div>
                    </div>

                    <div className="panel-body">
                        {currentReports.length === 0 ? (
                            <div style={{
                                textAlign: "center",
                                padding: "60px 20px",
                                color: "#9ca3af"
                            }}>
                                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                                <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>
                                    No reports found
                                </div>
                                <div style={{ fontSize: "14px" }}>
                                    {searchTerm ? "Try adjusting your search" : "Generated reports will appear here"}
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                overflowX: "auto"
                            }}>
                                <table style={{
                                    width: "100%",
                                    borderCollapse: "collapse"
                                }}>
                                    <thead>
                                        <tr style={{
                                            borderBottom: "2px solid #e5e7eb"
                                        }}>
                                            <th style={{
                                                textAlign: "left",
                                                padding: "12px 16px",
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                color: "#6b7280",
                                                letterSpacing: "0.5px",
                                                textTransform: "uppercase"
                                            }}>Customer Name</th>
                                            <th style={{
                                                textAlign: "left",
                                                padding: "12px 16px",
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                color: "#6b7280",
                                                letterSpacing: "0.5px",
                                                textTransform: "uppercase"
                                            }}>Email</th>
                                            <th style={{
                                                textAlign: "left",
                                                padding: "12px 16px",
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                color: "#6b7280",
                                                letterSpacing: "0.5px",
                                                textTransform: "uppercase"
                                            }}>Created At</th>
                                            <th style={{
                                                textAlign: "center",
                                                padding: "12px 16px",
                                                fontSize: "12px",
                                                fontWeight: "700",
                                                color: "#6b7280",
                                                letterSpacing: "0.5px",
                                                textTransform: "uppercase"
                                            }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentReports.map((report, index) => (
                                            <tr key={report.id} style={{
                                                borderBottom: index !== currentReports.length - 1 ? "1px solid #f3f4f6" : "none",
                                                transition: "background-color 0.2s"
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                <td style={{
                                                    padding: "16px",
                                                    fontSize: "14px",
                                                    fontWeight: "600",
                                                    color: "#111827"
                                                }}>{report.customerName}</td>
                                                <td style={{
                                                    padding: "16px",
                                                    fontSize: "14px",
                                                    color: "#6b7280"
                                                }}>{report.customerEmail}</td>
                                                <td style={{
                                                    padding: "16px",
                                                    fontSize: "13px",
                                                    color: "#6b7280"
                                                }}>{formatDate(report.createdAt)}</td>
                                                <td style={{
                                                    padding: "16px",
                                                    textAlign: "center"
                                                }}>
                                                    <div style={{
                                                        display: "flex",
                                                        gap: "8px",
                                                        justifyContent: "center"
                                                    }}>
                                                        <button
                                                            onClick={() => handleViewReport(report)}
                                                            style={{
                                                                border: "none",
                                                                background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                                                                color: "white",
                                                                padding: "8px 12px",
                                                                borderRadius: "8px",
                                                                cursor: "pointer",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                gap: "6px",
                                                                fontSize: "13px",
                                                                fontWeight: "600",
                                                                transition: "all 0.2s",
                                                                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.25)"
                                                            }}
                                                            onMouseEnter={(e) => {
                                                                e.currentTarget.style.transform = "translateY(-2px)";
                                                                e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.35)";
                                                            }}
                                                            onMouseLeave={(e) => {
                                                                e.currentTarget.style.transform = "translateY(0)";
                                                                e.currentTarget.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.25)";
                                                            }}
                                                        >
                                                            <VisibilityRoundedIcon style={{ fontSize: "16px" }} />
                                                            View
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div style={{
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                gap: "8px",
                                marginTop: "24px",
                                paddingTop: "20px",
                                borderTop: "1px solid #f3f4f6"
                            }}>
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    style={{
                                        border: "1px solid #e5e7eb",
                                        background: currentPage === 1 ? "#f9fafb" : "white",
                                        color: currentPage === 1 ? "#9ca3af" : "#374151",
                                        padding: "8px 14px",
                                        borderRadius: "8px",
                                        cursor: currentPage === 1 ? "not-allowed" : "pointer",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Previous
                                </button>
                                {getPaginationNumbers().map((page, index) => (
                                    page === '...' ? (
                                        <span key={`ellipsis-${index}`} style={{
                                            padding: "8px 12px",
                                            color: "#9ca3af",
                                            fontSize: "14px"
                                        }}>...</span>
                                    ) : (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page as number)}
                                            style={{
                                                border: "1px solid #e5e7eb",
                                                background: currentPage === page ? "linear-gradient(135deg, var(--color-primary) 0%, #F0A94D 100%)" : "white",
                                                color: currentPage === page ? "white" : "#374151",
                                                padding: "8px 14px",
                                                borderRadius: "8px",
                                                cursor: "pointer",
                                                fontSize: "14px",
                                                fontWeight: "600",
                                                minWidth: "40px",
                                                transition: "all 0.2s",
                                                boxShadow: currentPage === page ? "0 2px 8px rgba(255, 123, 46, 0.25)" : "none"
                                            }}
                                            onMouseEnter={(e) => {
                                                if (currentPage !== page) {
                                                    e.currentTarget.style.borderColor = "var(--color-primary)";
                                                    e.currentTarget.style.color = "var(--color-primary)";
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (currentPage !== page) {
                                                    e.currentTarget.style.borderColor = "#e5e7eb";
                                                    e.currentTarget.style.color = "#374151";
                                                }
                                            }}
                                        >
                                            {page}
                                        </button>
                                    )
                                ))}
                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    style={{
                                        border: "1px solid #e5e7eb",
                                        background: currentPage === totalPages ? "#f9fafb" : "white",
                                        color: currentPage === totalPages ? "#9ca3af" : "#374151",
                                        padding: "8px 14px",
                                        borderRadius: "8px",
                                        cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                                        fontSize: "14px",
                                        fontWeight: "600",
                                        transition: "all 0.2s"
                                    }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* View Report Modal */}
            {viewModalOpen && selectedReport && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "20px"
                }} onClick={() => setViewModalOpen(false)}>
                    <div style={{
                        background: "white",
                        borderRadius: "16px",
                        maxWidth: "600px",
                        width: "100%",
                        maxHeight: "80vh",
                        overflow: "auto",
                        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)"
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{
                            padding: "24px",
                            borderBottom: "1px solid #e5e7eb",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <h2 style={{
                                fontSize: "20px",
                                fontWeight: "700",
                                color: "#111827",
                                margin: 0
                            }}>Report Details</h2>
                            <button
                                onClick={() => setViewModalOpen(false)}
                                style={{
                                    border: "none",
                                    background: "transparent",
                                    cursor: "pointer",
                                    padding: "8px",
                                    borderRadius: "8px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#6b7280",
                                    transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = "#f3f4f6";
                                    e.currentTarget.style.color = "#111827";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "transparent";
                                    e.currentTarget.style.color = "#6b7280";
                                }}
                            >
                                <DeleteRoundedIcon />
                            </button>
                        </div>
                        <div style={{
                            padding: "24px"
                        }}>
                            <div style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "20px"
                            }}>
                                <div>
                                    <div style={{
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "8px"
                                    }}>Customer Name</div>
                                    <div style={{
                                        fontSize: "16px",
                                        fontWeight: "600",
                                        color: "#111827"
                                    }}>{selectedReport.customerName}</div>
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "8px"
                                    }}>Email</div>
                                    <div style={{
                                        fontSize: "16px",
                                        color: "#3b82f6"
                                    }}>{selectedReport.customerEmail}</div>
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "8px"
                                    }}>Created At</div>
                                    <div style={{
                                        fontSize: "14px",
                                        color: "#6b7280"
                                    }}>{formatDate(selectedReport.createdAt)}</div>
                                </div>
                                <div>
                                    <div style={{
                                        fontSize: "12px",
                                        fontWeight: "700",
                                        color: "#6b7280",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.5px",
                                        marginBottom: "8px"
                                    }}>Report Data</div>
                                    <div style={{
                                        background: "#f9fafb",
                                        padding: "16px",
                                        borderRadius: "8px",
                                        fontSize: "13px",
                                        color: "#374151",
                                        fontFamily: "monospace",
                                        maxHeight: "300px",
                                        overflow: "auto",
                                        border: "1px solid #e5e7eb"
                                    }}>
                                        {selectedReport.generatedReport}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Navbar>
    );
}