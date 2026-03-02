import { useEffect, useState } from "react";
import Navbar from "../layouts/Navbar";
import "../styles/agencyData.css";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

import CircularProgress from '@mui/material/CircularProgress';
import { getReports } from "../services/reports-api";
import { showError } from "../components/Toast";

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
            {viewModalOpen && selectedReport && (() => {
                let reportData: any = null;
                try {
                    reportData = JSON.parse(selectedReport.generatedReport);
                } catch (e) {
                    console.error('Failed to parse report data:', e);
                }

                if (!reportData) {
                    return (
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
                                padding: "40px",
                                textAlign: "center"
                            }}>
                                <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
                                <div style={{ fontSize: "16px", color: "#6b7280" }}>Failed to load report data</div>
                            </div>
                        </div>
                    );
                }

                const getImgSrc = (raw: any): string => {
                    const s = typeof raw === 'string' ? raw : raw?.url ?? raw?.src ?? raw?.path ?? '';
                    if (!s) return '';
                    if (s.startsWith('data:')) return s;
                    if (s.length > 200 && /^[A-Za-z0-9+/]+=*$/.test(s)) return `data:image/jpeg;base64,${s}`;
                    return s;
                };

                const placeImgs = (place: any): string[] => {
                    const urls: string[] = [];
                    let idx = 1;
                    while (place[`image${idx}Url`]) { urls.push(getImgSrc(place[`image${idx}Url`])); idx++; }
                    if (urls.length === 0) {
                        const fb = place.images ?? place.Images ?? place.image ?? place.Image;
                        if (fb) (Array.isArray(fb) ? fb : [fb]).forEach((u: any) => urls.push(getImgSrc(u)));
                    }
                    return urls.filter(Boolean);
                };

                const svcImgs = (hotel: any): string[] => {
                    const raw = hotel.images ?? hotel.Images ?? hotel.image ?? hotel.Image ?? [];
                    return (Array.isArray(raw) ? raw : [raw]).map(getImgSrc).filter(Boolean);
                };

                const PageShell = ({ children }: { children: React.ReactNode }) => (
                    <div style={{
                        width: '700px', height: '991px', background: '#FAFAFA',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.75)',
                        fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                        borderRadius: '4px',
                    }}>
                        {children}
                    </div>
                );

                const SectionTitle = ({ color, children }: { color: string; children: React.ReactNode }) => (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        marginBottom: '10px',
                    }}>
                        <div style={{ width: '3px', height: '16px', background: color, borderRadius: '2px', flexShrink: 0 }} />
                        <div style={{ fontSize: '10px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{children}</div>
                    </div>
                );

                return (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 10000,
                        background: 'linear-gradient(160deg, #0a0a18 0%, #12121f 100%)',
                        display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0 28px', height: '58px', flexShrink: 0,
                            background: 'rgba(255,255,255,0.03)',
                            borderBottom: '1px solid rgba(255,255,255,0.07)',
                            backdropFilter: 'blur(12px)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{
                                    width: '34px', height: '34px', borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #FF7B2E 0%, #F0A94D 100%)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
                                }}>✈️</div>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.3px' }}>
                                        {reportData.metadata?.customerName || selectedReport.customerName}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                                        {reportData.totalPages || 0} pages • {reportData.metadata?.daysAndNights || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setViewModalOpen(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                                    color: 'rgba(255,255,255,0.8)', borderRadius: '8px', padding: '7px 18px',
                                    cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                            >✕ Close</button>
                        </div>

                        <div style={{
                            flex: 1, overflowY: 'auto', overflowX: 'auto',
                            padding: '44px 24px 60px',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px',
                        }}>
                            {reportData.pages?.map((page: any, idx: number) => {
                                if (page.type === 'template') {
                                    return (
                                        <div key={`tpl-${idx}`} style={{ flexShrink: 0, marginBottom: '48px' }}>
                                            <PageShell>
                                                <div style={{ width: '595px', height: '842px', transform: 'scale(1.176)', transformOrigin: 'top left', position: 'relative' }}>
                                                    {page.content?.elements?.map((el: any, i: number) => {
                                                        if (el.type === 'text') {
                                                            return (
                                                                <div key={i} style={{
                                                                    position: 'absolute',
                                                                    left: `${el.x ?? 0}px`,
                                                                    top: `${el.y ?? 0}px`,
                                                                    width: el.width ? `${el.width}px` : 'auto',
                                                                    fontSize: `${el.fontSize ?? 14}px`,
                                                                    fontFamily: el.fontFamily ?? 'Arial',
                                                                    fontWeight: el.fontWeight ?? 400,
                                                                    color: el.color ?? '#000',
                                                                    lineHeight: el.lineHeight ?? 1.4,
                                                                }}>
                                                                    {el.content}
                                                                </div>
                                                            );
                                                        }
                                                        if (el.type === 'shape' && el.shape === 'rectangle') {
                                                            return (
                                                                <div key={i} style={{
                                                                    position: 'absolute',
                                                                    left: `${el.x ?? 0}px`,
                                                                    top: `${el.y ?? 0}px`,
                                                                    width: `${el.width ?? 100}px`,
                                                                    height: `${el.height ?? 100}px`,
                                                                    background: el.fill ?? 'transparent',
                                                                    borderRadius: `${el.borderRadius ?? 0}px`,
                                                                }} />
                                                            );
                                                        }
                                                        if (el.type === 'image') {
                                                            return (
                                                                <img key={i} src={getImgSrc(el.src)} alt="" style={{
                                                                    position: 'absolute',
                                                                    left: `${el.x ?? 0}px`,
                                                                    top: `${el.y ?? 0}px`,
                                                                    width: `${el.width ?? 100}px`,
                                                                    height: `${el.height ?? 100}px`,
                                                                    objectFit: 'cover',
                                                                    borderRadius: `${el.borderRadius ?? 0}px`,
                                                                }} />
                                                            );
                                                        }
                                                        return null;
                                                    })}
                                                </div>
                                            </PageShell>
                                        </div>
                                    );
                                }

                                if (page.type === 'customerInfo') {
                                    const metadata = reportData.metadata || page.content;
                                    const customerInitials = metadata.customerName?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'N/A';
                                    const infoFields = [
                                        { icon: '👤', label: 'Full Name', value: metadata.customerName },
                                        { icon: '🌍', label: 'Country', value: metadata.country },
                                        { icon: '📱', label: 'Mobile', value: metadata.mobileNo },
                                        { icon: '📧', label: 'Email', value: metadata.customerEmail },
                                        { icon: '🗓️', label: 'Duration', value: metadata.daysAndNights },
                                        { icon: '👥', label: 'Passengers', value: metadata.numberOfPassengers },
                                        ...(metadata.transportationMode ? [{ icon: '🚌', label: 'Transport', value: metadata.transportationMode }] : []),
                                    ];

                                    return (
                                        <div key={`info-${idx}`} style={{ flexShrink: 0, marginBottom: '48px' }}>
                                            <PageShell>
                                                <div style={{ height: '170px', background: 'linear-gradient(135deg, #0284C7 0%, #0EA5E9 100%)', position: 'relative', overflow: 'hidden' }}>
                                                    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                                                    <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(0,0,0,0.08)' }} />
                                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 700, color: '#0284C7', margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                                                            {customerInitials}
                                                        </div>
                                                        <div style={{ fontSize: '20px', fontWeight: 700, color: 'white', marginBottom: '4px' }}>Booking Information</div>
                                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)' }}>Complete travel itinerary details</div>
                                                    </div>
                                                </div>
                                                <div style={{ padding: '32px 36px' }}>
                                                    <SectionTitle color="#0284C7">Customer Details</SectionTitle>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '28px' }}>
                                                        {infoFields.map((field, i) => (
                                                            <div key={i} style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                                    <span style={{ fontSize: '16px' }}>{field.icon}</span>
                                                                    <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.label}</span>
                                                                </div>
                                                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A', paddingLeft: '24px' }}>{field.value || 'N/A'}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <SectionTitle color="#10B981">Selected Route</SectionTitle>
                                                    <div style={{ background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)', padding: '16px', borderRadius: '10px', border: '1px solid #A7F3D0', marginBottom: '28px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                                                            {(metadata.selectedRoutes || []).map((route: string, i: number) => (
                                                                <div key={i}>
                                                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'white', borderRadius: '6px', fontSize: '12px', fontWeight: 600, color: '#047857', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                                                        <span>📍</span>
                                                                        <span>{route}</span>
                                                                    </div>
                                                                    {i < (metadata.selectedRoutes || []).length - 1 && (
                                                                        <span style={{ margin: '0 4px', color: '#10B981', fontSize: '12px' }}>→</span>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <SectionTitle color="#F59E0B">Trip Summary</SectionTitle>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                                                        <div style={{ textAlign: 'center', padding: '14px', background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)', borderRadius: '10px', border: '1px solid #FCD34D' }}>
                                                            <div style={{ fontSize: '22px', fontWeight: 700, color: '#B45309', marginBottom: '4px' }}>{reportData.pages?.filter((p: any) => p.type === 'dayDetail').length || 0}</div>
                                                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Days</div>
                                                        </div>
                                                        <div style={{ textAlign: 'center', padding: '14px', background: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)', borderRadius: '10px', border: '1px solid #93C5FD' }}>
                                                            <div style={{ fontSize: '22px', fontWeight: 700, color: '#1E40AF', marginBottom: '4px' }}>{(metadata.selectedRoutes || []).length}</div>
                                                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#1E3A8A', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Locations</div>
                                                        </div>
                                                        <div style={{ textAlign: 'center', padding: '14px', background: 'linear-gradient(135deg, #FECACA 0%, #FCA5A5 100%)', borderRadius: '10px', border: '1px solid #F87171' }}>
                                                            <div style={{ fontSize: '22px', fontWeight: 700, color: '#991B1B', marginBottom: '4px' }}>{metadata.numberOfPassengers || 0}</div>
                                                            <div style={{ fontSize: '10px', fontWeight: 700, color: '#7F1D1D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Guests</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </PageShell>
                                        </div>
                                    );
                                }

                                if (page.type === 'dayDetail') {
                                    const heroImgs: string[] = [];
                                    (page.content?.selectedPlaces || []).forEach((sp: any) => placeImgs(sp.place).slice(0, 2).forEach((u: string) => heroImgs.push(u)));
                                    const svcColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
                                        hotel: { bg: '#f5f0ff', border: '#ddd6fe', text: '#5b21b6', badge: '#7c3aed' },
                                        transport: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', badge: '#2563eb' },
                                        activity: { bg: '#fff1f0', border: '#fecaca', text: '#b91c1c', badge: '#dc2626' },
                                    };

                                    return (
                                        <div key={`day-${idx}`} style={{ flexShrink: 0, marginBottom: '48px' }}>
                                            <PageShell>
                                                <div style={{ height: '130px', background: '#1E293B', position: 'relative', overflow: 'hidden' }}>
                                                    {heroImgs.length > 0 ? (
                                                        <div style={{ display: 'flex', height: '100%' }}>
                                                            {heroImgs.slice(0, 4).map((src, i) => (
                                                                <div key={i} style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                                                                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)' }} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)' }} />
                                                    )}
                                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', zIndex: 10 }}>
                                                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(255,255,255,0.95)', fontSize: '20px', fontWeight: 700, color: '#1E293B', marginBottom: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
                                                            {page.dayNumber}
                                                        </div>
                                                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{page.content?.selectedDay || 'Date TBD'}</div>
                                                    </div>
                                                </div>
                                                <div style={{ padding: '20px 32px 32px' }}>
                                                    {page.content?.description && (
                                                        <div style={{ marginBottom: '20px' }}>
                                                            <SectionTitle color="#8B5CF6">Daily Itinerary</SectionTitle>
                                                            <div style={{ fontSize: '12px', lineHeight: 1.6, color: '#374151', background: '#F9FAFB', padding: '14px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                                                {page.content.description}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {(page.content?.selectedPlaces || []).length > 0 && (
                                                        <div style={{ marginBottom: '20px' }}>
                                                            <SectionTitle color="#10B981">Visiting Places</SectionTitle>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                                                                {(page.content.selectedPlaces || []).map((sp: any, i: number) => {
                                                                    const imgs = placeImgs(sp.place);
                                                                    return (
                                                                        <div key={i} style={{ background: 'white', borderRadius: '10px', overflow: 'hidden', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                                                                            <div style={{ display: 'grid', gridTemplateColumns: imgs.length >= 2 ? 'repeat(2, 68px)' : '68px', gridTemplateRows: imgs.length > 2 ? 'repeat(2, 68px)' : '68px', gap: '0' }}>
                                                                                {imgs.slice(0, 4).map((src, j) => (
                                                                                    <img key={j} src={src} alt="" style={{ width: '68px', height: '68px', objectFit: 'cover' }} />
                                                                                ))}
                                                                            </div>
                                                                            <div style={{ padding: '10px' }}>
                                                                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#111827', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                    {sp.place?.name || sp.place?.placeName || 'Unknown'}
                                                                                </div>
                                                                                <div style={{ fontSize: '10px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                                    <span>📍</span>
                                                                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sp.district}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {(page.content?.selectedHotels || []).length > 0 && (
                                                        <div style={{ marginBottom: '20px' }}>
                                                            <SectionTitle color="#F59E0B">Services & Accommodations</SectionTitle>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                                {(page.content.selectedHotels || []).map((sh: any, i: number) => {
                                                                    const imgs = svcImgs(sh.hotel);
                                                                    const theme = svcColors[sh.type] || svcColors.hotel;
                                                                    return (
                                                                        <div key={i} style={{ display: 'flex', gap: '10px', background: theme.bg, padding: '10px', borderRadius: '8px', border: `1px solid ${theme.border}` }}>
                                                                            {imgs[0] && (
                                                                                <img src={imgs[0]} alt="" style={{ width: '70px', height: '64px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }} />
                                                                            )}
                                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                                                    <div style={{ padding: '2px 8px', borderRadius: '4px', background: theme.badge, color: 'white', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase' }}>
                                                                                        {sh.type === 'hotel' ? '🏨 Hotel' : sh.type === 'transport' ? '🚗 Transport' : '🎯 Activity'}
                                                                                    </div>
                                                                                </div>
                                                                                <div style={{ fontSize: '12px', fontWeight: 700, color: theme.text, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                                    {sh.hotel?.name || sh.hotel?.serviceName || 'Service'}
                                                                                </div>
                                                                                <div style={{ fontSize: '10px', color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {sh.district}</div>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {page.content?.remarks && (
                                                        <div>
                                                            <SectionTitle color="#EC4899">Additional Notes</SectionTitle>
                                                            <div style={{ fontSize: '11px', lineHeight: 1.5, color: '#6B7280', background: '#FDF2F8', padding: '12px', borderRadius: '8px', border: '1px solid #FBCFE8', fontStyle: 'italic' }}>
                                                                {page.content.remarks}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </PageShell>
                                        </div>
                                    );
                                }

                                if (page.type === 'cost') {
                                    const costData = page.content || {};
                                    const reportCostData = reportData.cost || {};
                                    const totalAmount = costData.totalAmount || reportCostData.totalAmount || 0;
                                    const promoCode = costData.promoCode || reportCostData.promoCode || '';
                                    const promoCodeDiscount = costData.promoCodeDiscount || reportCostData.promoCodeDiscount || 0;
                                    const finalAmount = costData.finalAmount || reportCostData.finalAmount || totalAmount;

                                    return (
                                        <div key={`cost-${idx}`} style={{ flexShrink: 0, marginBottom: '48px' }}>
                                            <PageShell>
                                                {/* Hero Section */}
                                                <div style={{
                                                    height: '120px', flexShrink: 0, position: 'relative', overflow: 'hidden',
                                                    background: 'linear-gradient(135deg, #0f766e 0%, #0d9488 25%, #14b8a6 75%, #5eead4 100%)',
                                                }}>
                                                    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                                                    <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                                                    <div style={{ position: 'absolute', top: '24px', left: '36px', right: '36px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                            <div style={{
                                                                width: '40px', height: '40px', borderRadius: '50%',
                                                                background: 'rgba(255,255,255,0.15)', display: 'flex',
                                                                alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                                                            }}>💰</div>
                                                            <div>
                                                                <div style={{ color: 'white', fontSize: '18px', fontWeight: 700, lineHeight: 1 }}>Cost Summary</div>
                                                                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginTop: '2px' }}>
                                                                    Package pricing & discounts
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div style={{ padding: '32px 48px', flex: 1, background: '#fafafa' }}>
                                                    {/* Cost Breakdown Card */}
                                                    <div style={{
                                                        background: 'white', borderRadius: '16px', padding: '28px',
                                                        boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9',
                                                        marginBottom: '24px'
                                                    }}>
                                                        <div style={{ marginBottom: '20px' }}>
                                                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b', marginBottom: '16px' }}>Package Details</div>
                                                        </div>

                                                        {/* Subtotal */}
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                            <span style={{ fontSize: '13px', color: '#64748b' }}>Tour Package Amount</span>
                                                            <span style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>LKR {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                        </div>

                                                        {/* Promo Code Discount */}
                                                        {promoCodeDiscount > 0 && (
                                                            <>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <span style={{ fontSize: '13px', color: '#64748b' }}>Promo Code Discount</span>
                                                                        {promoCode && (
                                                                            <span style={{
                                                                                fontSize: '10px', padding: '2px 6px', borderRadius: '4px',
                                                                                background: '#dcfce7', color: '#15803d', fontWeight: 600
                                                                            }}>
                                                                                {promoCode}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span style={{ fontSize: '14px', fontWeight: 600, color: '#dc2626' }}>-LKR {promoCodeDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                </div>
                                                            </>
                                                        )}

                                                        {/* Final Amount */}
                                                        <div style={{
                                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                            marginTop: '12px',
                                                            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                                                            margin: '16px -28px -28px',
                                                            padding: '20px 28px',
                                                            borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px'
                                                        }}>
                                                            <span style={{ fontSize: '16px', fontWeight: 700, color: '#15803d' }}>Total Amount</span>
                                                            <span style={{ fontSize: '20px', fontWeight: 700, color: '#15803d' }}>
                                                                LKR {finalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Payment Terms */}
                                                    <div style={{
                                                        background: 'white', borderRadius: '12px', padding: '20px',
                                                        boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9'
                                                    }}>
                                                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>💳 Payment Information</div>
                                                        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>
                                                            • 40% advance payment required to confirm booking<br />
                                                            • Balance 60% due 30 days before tour commencement<br />
                                                            • All amounts are in Sri Lankan Rupees (LKR)
                                                        </div>
                                                    </div>
                                                </div>
                                            </PageShell>
                                        </div>
                                    );
                                }

                                if (page.type === 'policies') {
                                    const policiesData = page.content || {};
                                    const reportPoliciesData = reportData.policies || {};
                                    const specialRemark = policiesData.specialRemark || reportPoliciesData.specialRemark || '';
                                    const bookingPolicy = policiesData.bookingPolicy || reportPoliciesData.bookingPolicy || '';
                                    const cancellationPolicy = policiesData.cancellationPolicy || reportPoliciesData.cancellationPolicy || '';

                                    return (
                                        <div key={`policies-${idx}`} style={{ flexShrink: 0, marginBottom: '48px' }}>
                                            <PageShell>
                                                {/* Hero Section */}
                                                <div style={{
                                                    height: '120px', flexShrink: 0, position: 'relative', overflow: 'hidden',
                                                    background: 'linear-gradient(135deg, #7c2d12 0%, #dc2626 25%, #ef4444 75%, #fca5a5 100%)',
                                                }}>
                                                    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                                                    <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                                                    <div style={{ position: 'absolute', top: '24px', left: '36px', right: '36px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                                            <div style={{
                                                                width: '40px', height: '40px', borderRadius: '50%',
                                                                background: 'rgba(255,255,255,0.15)', display: 'flex',
                                                                alignItems: 'center', justifyContent: 'center', fontSize: '18px'
                                                            }}>📋</div>
                                                            <div>
                                                                <div style={{ color: 'white', fontSize: '18px', fontWeight: 700, lineHeight: 1 }}>Terms & Policies</div>
                                                                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '11px', marginTop: '2px' }}>
                                                                    Important information & conditions
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Content */}
                                                <div style={{ padding: '32px 48px', flex: 1, background: '#fafafa' }}>
                                                    {/* Special Remark */}
                                                    {specialRemark && (
                                                        <div style={{
                                                            background: 'white', borderRadius: '12px', padding: '20px',
                                                            boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
                                                            marginBottom: '20px'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                                <div style={{ fontSize: '16px' }}>⚡</div>
                                                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Important Notice</div>
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.6, padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fbbf24' }}>
                                                                {specialRemark}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Booking Policy */}
                                                    {bookingPolicy && (
                                                        <div style={{
                                                            background: 'white', borderRadius: '12px', padding: '20px',
                                                            boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9',
                                                            marginBottom: '20px'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                                <div style={{ fontSize: '16px' }}>📅</div>
                                                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Booking Policy</div>
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.7 }}>
                                                                {bookingPolicy}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Cancellation Policy */}
                                                    {cancellationPolicy && (
                                                        <div style={{
                                                            background: 'white', borderRadius: '12px', padding: '20px',
                                                            boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9'
                                                        }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                                <div style={{ fontSize: '16px' }}>❌</div>
                                                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Cancellation Policy</div>
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#4b5563', lineHeight: 1.7 }}>
                                                                {cancellationPolicy}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </PageShell>
                                        </div>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    </div>
                );
            })()}
        </Navbar>
    );
}