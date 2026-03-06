import { useEffect, useState, useRef, useMemo } from "react";
import type { CSSProperties } from "react";
import Navbar from "../layouts/Navbar";
import "../styles/agencyData.css";
import "../styles/templateCustomize.css";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import FileDownloadRoundedIcon from "@mui/icons-material/FileDownloadRounded";
import PictureAsPdfRoundedIcon from "@mui/icons-material/PictureAsPdfRounded";
import CodeRoundedIcon from "@mui/icons-material/CodeRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import HeightRoundedIcon from "@mui/icons-material/HeightRounded";
import TextFieldsRoundedIcon from "@mui/icons-material/TextFieldsRounded";
import CircularProgress from '@mui/material/CircularProgress';
import { getReports, updateReport } from "../services/reports-api";
import { showError, showSuccess } from "../components/Toast";
import {
    ReportPageRenderer,
    A4_WIDTH,
    A4_HEIGHT,
    type ReportData,
    type ReportPage,
    getImgSrc,
    processReportPagesForOverflow,
    placeImgs,
    svcImgs,
    svcColors,
} from "../components/ReportPageRenderer";
import { DocumentScanner, Report } from "@mui/icons-material";

interface Report {
    id: string;
    customerName: string;
    customerEmail: string;
    generatedReport: string;
    createdAt: string;
    lastModifiedAt?: string;
}

// Element types for customization
interface BaseElement {
    id?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    opacity?: number;
    type?: string;
}

interface TextElement extends BaseElement {
    type: 'text';
    content?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: number | string;
    color?: string;
    letterSpacing?: number;
    lineHeight?: number;
}

interface ShapeElement extends BaseElement {
    type: 'shape';
    shape?: 'rectangle' | 'line' | 'polygon' | 'circle';
    fill?: string;
    stroke?: string;
    borderRadius?: number;
}

type DesignElement = TextElement | ShapeElement | BaseElement;

export default function ReportsHistory() {
    const DD_TOKEN = sessionStorage.getItem("dd_token") || "";
    const [reports, setReports] = useState<Report[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [customizeModalOpen, setCustomizeModalOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [exportDropdownOpen, setExportDropdownOpen] = useState<string | null>(null);
    const itemsPerPage = 10;

    // Customization state
    const [editableReportData, setEditableReportData] = useState<ReportData | null>(null);
    const [selectedPageIndex, setSelectedPageIndex] = useState<number>(0);
    const [selectedElementIndex, setSelectedElementIndex] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [canvasScale, setCanvasScale] = useState(1);

    // Drag state
    const dragRef = useRef<{
        pageIndex: number;
        elementIndex: number;
        startX: number;
        startY: number;
        originX: number;
        originY: number;
    } | null>(null);

    const canvasWrapperRef = useRef<HTMLDivElement | null>(null);
    const exportDropdownRef = useRef<HTMLDivElement | null>(null);

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
    };

    useEffect(() => {
        handleFetchReports();
    }, []);

    // Close export dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
                setExportDropdownOpen(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Canvas resize observer
    useEffect(() => {
        if (!canvasWrapperRef.current || !customizeModalOpen) return;

        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                const availableWidth = entry.contentRect.width - 40;
                setCanvasScale(Math.min(1, availableWidth / A4_WIDTH));
            }
        });

        observer.observe(canvasWrapperRef.current);
        return () => observer.disconnect();
    }, [customizeModalOpen]);

    // Drag and drop handlers
    useEffect(() => {
        if (!customizeModalOpen) return;

        const handleMouseMove = (event: MouseEvent) => {
            if (!dragRef.current || !editableReportData) return;

            const { pageIndex, elementIndex, startX, startY, originX, originY } = dragRef.current;
            const dx = (event.clientX - startX) / canvasScale;
            const dy = (event.clientY - startY) / canvasScale;

            setEditableReportData(prev => {
                if (!prev?.pages) return prev;

                const pages = [...prev.pages];
                const page = pages[pageIndex];
                if (!page || page.type !== 'template' || !page.content?.elements) return prev;

                const elements = [...page.content.elements];
                const element = elements[elementIndex];
                if (!element) return prev;

                elements[elementIndex] = {
                    ...element,
                    x: Math.max(0, Math.min(A4_WIDTH - (element.width || 0), originX + dx)),
                    y: Math.max(0, Math.min(A4_HEIGHT - (element.height || 0), originY + dy)),
                };

                pages[pageIndex] = {
                    ...page,
                    content: { ...page.content, elements }
                };

                return { ...prev, pages };
            });
        };

        const handleMouseUp = () => {
            dragRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [customizeModalOpen, canvasScale, editableReportData]);

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
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };
    
    const parseReportData = (report: Report): ReportData | null => {
        try {
            return JSON.parse(report.generatedReport);
        } catch (e) {
            console.error('Failed to parse report data:', e);
            return null;
        }
    };

    const handleViewReport = (report: Report) => {
        setSelectedReport(report);
        setViewModalOpen(true);
    };

    const handleCustomizeReport = (report: Report) => {
        const reportData = parseReportData(report);
        if (!reportData) {
            showError("Failed to load report data for customization");
            return;
        }
        setSelectedReport(report);
        setEditableReportData(reportData);
        setSelectedPageIndex(0);
        setSelectedElementIndex(null);
        setCustomizeModalOpen(true);
    };

    const handleCloseCustomizeModal = () => {
        setCustomizeModalOpen(false);
        setSelectedReport(null);
        setEditableReportData(null);
        setSelectedPageIndex(0);
        setSelectedElementIndex(null);
    };

    const handleElementMouseDown = (event: React.MouseEvent<HTMLDivElement>, pageIndex: number, elementIndex: number) => {
        event.stopPropagation();
        if (!editableReportData?.pages?.[pageIndex]) return;

        const page = editableReportData.pages[pageIndex];
        if (page.type !== 'template' || !page.content?.elements?.[elementIndex]) return;

        const element = page.content.elements[elementIndex];
        setSelectedPageIndex(pageIndex);
        setSelectedElementIndex(elementIndex);

        dragRef.current = {
            pageIndex,
            elementIndex,
            startX: event.clientX,
            startY: event.clientY,
            originX: element.x ?? 0,
            originY: element.y ?? 0,
        };
    };

    const handleCanvasClick = () => {
        setSelectedElementIndex(null);
    };

    const updateElementAtIndex = (pageIndex: number, elementIndex: number, updater: (el: DesignElement) => DesignElement) => {
        setEditableReportData(prev => {
            if (!prev?.pages?.[pageIndex]) return prev;

            const pages = [...prev.pages];
            const page = pages[pageIndex];
            if (page.type !== 'template' || !page.content?.elements?.[elementIndex]) return prev;

            const elements = [...page.content.elements];
            elements[elementIndex] = updater(elements[elementIndex]);

            pages[pageIndex] = {
                ...page,
                content: { ...page.content, elements }
            };

            return { ...prev, pages };
        });
    };

    // Update page content for non-template pages
    const updatePageContent = (pageIndex: number, field: string, value: any) => {
        setEditableReportData(prev => {
            if (!prev?.pages?.[pageIndex]) return prev;

            const pages = [...prev.pages];
            const page = pages[pageIndex];

            pages[pageIndex] = {
                ...page,
                content: { ...page.content, [field]: value }
            };

            return { ...prev, pages };
        });
    };

    // Update metadata
    const updateMetadata = (field: string, value: string) => {
        setEditableReportData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                metadata: { ...prev.metadata, [field]: value }
            };
        });
    };

    // Update policies
    const updatePolicies = (field: string, value: string) => {
        setEditableReportData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                policies: { ...prev.policies, [field]: value }
            };
        });
    };

    // Update cost
    const updateCost = (field: string, value: number) => {
        setEditableReportData(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                cost: { ...prev.cost, [field]: value }
            };
        });
    };

    const handleTextContentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (selectedElementIndex === null) return;
        const newValue = event.target.value;
        updateElementAtIndex(selectedPageIndex, selectedElementIndex, (el) => ({
            ...el,
            content: newValue,
        }));
    };

    const handleColorChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedElementIndex === null) return;
        updateElementAtIndex(selectedPageIndex, selectedElementIndex, (el) => ({
            ...el,
            color: event.target.value,
        }));
    };

    const handleFillChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedElementIndex === null) return;
        updateElementAtIndex(selectedPageIndex, selectedElementIndex, (el) => ({
            ...el,
            fill: event.target.value,
        }));
    };

    const handleSaveReport = async () => {
        if (!selectedReport || !editableReportData) return;

        const token = sessionStorage.getItem("dd_token");
        if (!token) {
            showError("Please sign in to save changes.");
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                reportId: selectedReport.id,
                customerName: selectedReport.customerName,
                customerEmail: selectedReport.customerEmail,
                newReportContent: JSON.stringify(editableReportData),
            };

            await updateReport(payload, token);
            showSuccess("Report updated successfully!");
            handleFetchReports();
            handleCloseCustomizeModal();
        } catch (error) {
            console.error("Failed to save report:", error);
            showError("Failed to save changes. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // Export functions
    const generateReportHTML = (reportData: ReportData): string => {
        const pages = processReportPagesForOverflow(reportData);
        let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Travel Report - ${reportData.metadata?.customerName || 'Customer'}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; }
        img { 
            max-width: 100%; 
            height: auto; 
            image-rendering: auto; 
            -webkit-filter: blur(0px);
            filter: blur(0px);
        }
        .page { 
            width: 595px; 
            min-height: 842px; 
            background: white; 
            margin: 20px auto; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
            page-break-after: always; 
            overflow: hidden; 
            position: relative;
            transform-origin: top left;
        }
        .page:last-child { page-break-after: auto; }
        @media print {
            @page {
                size: A4;
                margin: 0;
                padding: 0;
            }
            * {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                box-sizing: border-box;
            }
            html, body {
                width: 100% !important;
                height: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                font-size: 12px !important;
            }
            .page { 
                width: 210mm !important; 
                height: 297mm !important; 
                margin: 0 !important; 
                padding: 0 !important;
                box-shadow: none !important; 
                page-break-after: always !important;
                page-break-inside: avoid !important;
                overflow: hidden !important;
                position: relative !important;
                transform-origin: top left !important;
                transform: scale(1) !important;
            }
            .page:last-child {
                page-break-after: auto !important;
            }
            /* Cover page specific styles */
            .page:first-child {
                display: block !important;
                width: 210mm !important;
                height: 297mm !important;
                max-width: 210mm !important;
                max-height: 297mm !important;
                overflow: hidden !important;
                position: relative !important;
            }
            .page:first-child > * {
                max-width: 100% !important;
                max-height: 100% !important;
                overflow: hidden !important;
            }
            img { 
                display: block !important; 
                visibility: visible !important; 
                opacity: 1 !important;
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
                max-width: 100% !important;
                height: auto !important;
            }
            div {
                background-attachment: local !important;
            }
        }
        .section-title { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
        .section-title-bar { width: 3px; height: 16px; border-radius: 2px; }
        .section-title-text { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }
        .info-card { padding: 14px; background: #F8FAFC; border-radius: 10px; border: 1px solid #E2E8F0; }
        .route-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: white; border-radius: 6px; font-size: 12px; font-weight: 600; color: #047857; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin: 4px; }
    </style>
</head>
<body>`;

        pages.forEach((page, idx) => {
            if (page.type === 'template') {
                html += `<div class="page" style="position: relative; transform-origin: top left;">`;
                (page.content?.elements || []).forEach((el: any) => {
                    if (el.type === 'text') {
                        // Convert pixels to percentage for better print scaling
                        const leftPercent = ((el.x || 0) / 595) * 100;
                        const topPercent = ((el.y || 0) / 842) * 100;
                        const widthPercent = el.width ? ((el.width / 595) * 100) : 'auto';
                        html += `<div style="position: absolute; left: ${leftPercent}%; top: ${topPercent}%; width: ${typeof widthPercent === 'number' ? widthPercent + '%' : widthPercent}; font-size: ${(el.fontSize || 14) * 0.75}px; font-family: ${el.fontFamily || 'Arial'}; font-weight: ${el.fontWeight || 400}; color: ${el.color || '#000'}; line-height: ${el.lineHeight || 1.4};">${el.content || ''}</div>`;
                    } else if (el.type === 'shape') {
                        const leftPercent = ((el.x || 0) / 595) * 100;
                        const topPercent = ((el.y || 0) / 842) * 100;
                        const widthPercent = ((el.width || 100) / 595) * 100;
                        const heightPercent = ((el.height || 100) / 842) * 100;
                        
                        if (el.shape === 'polygon' && el.points?.length) {
                            const polygonPoints = el.points.map((p: any) => `${(p.x / 595) * 100}% ${(p.y / 842) * 100}%`).join(', ');
                            html += `<div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; background: ${el.fill || '#111827'}; clip-path: polygon(${polygonPoints});"></div>`;
                        } else if (el.shape === 'circle') {
                            html += `<div style="position: absolute; left: ${leftPercent}%; top: ${topPercent}%; width: ${widthPercent}%; height: ${heightPercent}%; background: ${el.fill || '#f3f4f6'}; border-radius: 50%;"></div>`;
                        } else if (el.shape === 'line') {
                            html += `<div style="position: absolute; left: ${leftPercent}%; top: ${topPercent}%; width: ${widthPercent}%; height: ${Math.max(0.1, heightPercent)}%; background: ${el.stroke || el.fill || '#e5e7eb'}; border-radius: 999px;"></div>`;
                        } else {
                            html += `<div style="position: absolute; left: ${leftPercent}%; top: ${topPercent}%; width: ${widthPercent}%; height: ${heightPercent}%; background: ${el.fill || 'transparent'}; border-radius: ${el.borderRadius || 0}px;"></div>`;
                        }
                    } else if (el.type === 'image') {
                        const imgSrc = getImgSrc(el.src);
                        const leftPercent = ((el.x || 0) / 595) * 100;
                        const topPercent = ((el.y || 0) / 842) * 100;
                        const widthPercent = ((el.width || 100) / 595) * 100;
                        const heightPercent = ((el.height || 100) / 842) * 100;
                        console.log('Template image src:', el.src, '->', imgSrc);
                        if (!imgSrc || imgSrc.trim() === '') {
                            console.warn('Empty image src for template element:', el);
                        }
                        html += `<img src="${imgSrc}" alt="" style="position: absolute; left: ${leftPercent}%; top: ${topPercent}%; width: ${widthPercent}%; height: ${heightPercent}%; object-fit: cover; border-radius: ${el.borderRadius || 0}px; display: block !important; visibility: visible !important; opacity: 1 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact;" />`;
                    } else if (el.type === 'pill') {
                        const leftPercent = ((el.x || 0) / 595) * 100;
                        const topPercent = ((el.y || 0) / 842) * 100;
                        html += `<div style="position: absolute; left: ${leftPercent}%; top: ${topPercent}%; padding: 14px 18px; border-radius: 18px; background: ${el.colors?.bg || '#ffffff'}; color: ${el.colors?.text || '#111827'}; border: 1px solid ${(el.colors?.text || '#111827')}30; display: flex; flex-direction: column; gap: 4px; min-width: 130px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);"><span style="font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase;">${el.label || ''}</span><span style="font-size: 16px; font-weight: 600;">${el.value || ''}</span></div>`;
                    }
                });
                html += `</div>`;
            } else if (page.type === 'customerInfo') {
                const metadata = reportData.metadata || page.content;
                const initials = metadata?.customerName?.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2) || 'N/A';
                html += `
<div class="page">
    <div style="height: 170px; background: linear-gradient(135deg, ${reportData.metadata?.bookingGradientColor || '#0284C7'} 0%, ${reportData.metadata?.bookingGradientColor ? reportData.metadata.bookingGradientColor + 'CC' : '#0EA5E9'} 100%); position: relative; display: flex; align-items: center; justify-content: center;">
        <div style="text-align: center;">
            <div style="width: 60px; height: 60px; border-radius: 50%; background: white; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 700; color: ${reportData.metadata?.bookingGradientColor || '#0284C7'}; margin: 0 auto 12px;">${initials}</div>
            <div style="font-size: 20px; font-weight: 700; color: white;">Booking Information</div>
            <div style="font-size: 12px; color: rgba(255,255,255,0.8);">Complete travel itinerary details</div>
        </div>
    </div>
    <div style="padding: 32px 36px;">
        <div class="section-title"><div class="section-title-bar" style="background: ${reportData.metadata?.bookingGradientColor || '#0284C7'};"></div><div class="section-title-text" style="color: ${reportData.metadata?.bookingGradientColor || '#0284C7'};">Customer Details</div></div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 28px;">
            <div class="info-card"><div style="font-size: 10px; font-weight: 700; color: #64748B; margin-bottom: 6px;">👤 FULL NAME</div><div style="font-size: 13px; font-weight: 600; color: #0F172A;">${metadata?.customerName || 'N/A'}</div></div>
            <div class="info-card"><div style="font-size: 10px; font-weight: 700; color: #64748B; margin-bottom: 6px;">🌍 COUNTRY</div><div style="font-size: 13px; font-weight: 600; color: #0F172A;">${metadata?.country || 'N/A'}</div></div>
            <div class="info-card"><div style="font-size: 10px; font-weight: 700; color: #64748B; margin-bottom: 6px;">📱 MOBILE</div><div style="font-size: 13px; font-weight: 600; color: #0F172A;">${metadata?.mobileNo || 'N/A'}</div></div>
            <div class="info-card"><div style="font-size: 10px; font-weight: 700; color: #64748B; margin-bottom: 6px;">📧 EMAIL</div><div style="font-size: 13px; font-weight: 600; color: #0F172A;">${metadata?.customerEmail || 'N/A'}</div></div>
            <div class="info-card"><div style="font-size: 10px; font-weight: 700; color: #64748B; margin-bottom: 6px;">🗓️ DURATION</div><div style="font-size: 13px; font-weight: 600; color: #0F172A;">${metadata?.daysAndNights || 'N/A'}</div></div>
            <div class="info-card"><div style="font-size: 10px; font-weight: 700; color: #64748B; margin-bottom: 6px;">👥 PASSENGERS</div><div style="font-size: 13px; font-weight: 600; color: #0F172A;">${metadata?.numberOfPassengers || 'N/A'}</div></div>
        </div>
        <div class="section-title"><div class="section-title-bar" style="background: #10B981;"></div><div class="section-title-text" style="color: #10B981;">Selected Route</div></div>
        <div style="background: linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%); padding: 16px; border-radius: 10px; border: 1px solid #A7F3D0; margin-bottom: 28px;">
            ${(metadata?.selectedRoutes || []).map((r: string) => `<span class="route-badge">📍 ${r}</span>`).join(' → ')}
        </div>
    </div>
</div>`;
            } else if (page.type === 'dayDetail' || page.type === 'dayDetailContinued') {
                const isContinuation = page.type === 'dayDetailContinued' || page.isOverflow;
                const heroImgs: string[] = [];
                (page.content?.selectedPlaces || []).forEach((sp: any) => {
                    placeImgs(sp.place).slice(0, 2).forEach((u: string) => heroImgs.push(u));
                });
                
                html += `
<div class="page">
    ${!isContinuation ? `
    <div style="height: 130px; background: linear-gradient(135deg, #1E293B 0%, #334155 100%); position: relative; display: flex; align-items: center; justify-content: center; overflow: hidden;">
        ${heroImgs.length > 0 ? `
        <div style="position: absolute; inset: 0; display: flex;">
            ${heroImgs.slice(0, 4).map((img: string) => `<div style="flex: 1; position: relative; overflow: hidden;"><img src="${img}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block !important; visibility: visible !important; opacity: 1 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact;" /><div style="position: absolute; inset: 0; background: rgba(0,0,0,0.3);"></div></div>`).join('')}
        </div>
        ` : ''}
        <div style="text-align: center; position: relative; z-index: 10;">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(255,255,255,0.95); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 700; color: #1E293B; margin: 0 auto 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.3);">${page.dayNumber || idx}</div>
            <div style="font-size: 15px; font-weight: 700; color: white; text-shadow: 0 2px 8px rgba(0,0,0,0.5);">${page.content?.selectedDay || 'Date TBD'}</div>
        </div>
    </div>
    ` : `
    <div style="height: 60px; background: linear-gradient(135deg, #1E293B 0%, #334155 100%); display: flex; align-items: center; padding: 0 32px;">
        <div style="display: flex; align-items: center; gap: 12px;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; color: white;">${page.dayNumber || ''}</div>
            <div>
                <div style="font-size: 13px; font-weight: 700; color: white;">Day ${page.dayNumber || ''} (Continued)</div>
                <div style="font-size: 10px; color: rgba(255,255,255,0.7);">${page.content?.selectedDay || ''}</div>
            </div>
        </div>
    </div>
    `}
    <div style="padding: 20px 32px;">
        ${page.content?.description && !isContinuation ? `
        <div class="section-title"><div class="section-title-bar" style="background: #8B5CF6;"></div><div class="section-title-text" style="color: #8B5CF6;">Daily Itinerary</div></div>
        <div style="font-size: 12px; line-height: 1.6; color: #374151; background: #F9FAFB; padding: 14px; border-radius: 8px; margin-bottom: 20px;">${page.content.description}</div>
        ` : ''}
        ${(page.content?.selectedPlaces || []).length > 0 ? `
        <div class="section-title"><div class="section-title-bar" style="background: #10B981;"></div><div class="section-title-text" style="color: #10B981;">${isContinuation ? 'More Visiting Places' : 'Visiting Places'}</div></div>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 20px;">
            ${(page.content.selectedPlaces || []).map((sp: any) => {
                const imgs = placeImgs(sp.place);
                return `
                <div style="background: white; border-radius: 10px; border: 1px solid #E5E7EB; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                    ${imgs[0] ? `<div style="height: 60px; overflow: hidden;"><img src="${imgs[0]}" alt="" style="width: 100%; height: 100%; object-fit: cover; display: block !important; visibility: visible !important; opacity: 1 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact;" /></div>` : ''}
                    <div style="padding: 10px;">
                        <div style="font-size: 12px; font-weight: 700; color: #111827;">${sp.place?.name || sp.place?.placeName || 'Unknown'}</div>
                        <div style="font-size: 10px; color: #6B7280;">📍 ${sp.district}</div>
                    </div>
                </div>
            `}).join('')}
        </div>
        ` : ''}
        ${(page.content?.selectedHotels || []).length > 0 ? `
        <div class="section-title"><div class="section-title-bar" style="background: #F59E0B;"></div><div class="section-title-text" style="color: #F59E0B;">${isContinuation ? 'More Services' : 'Services & Accommodations'}</div></div>
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px;">
            ${(page.content.selectedHotels || []).map((sh: any) => {
                const imgs = svcImgs(sh.hotel);
                const theme = svcColors[sh.type] || svcColors.hotel;
                return `
                <div style="display: flex; gap: 10px; background: ${theme.bg}; padding: 10px; border-radius: 8px; border: 1px solid ${theme.border};">
                    ${imgs[0] ? `<img src="${imgs[0]}" alt="" style="width: 60px; height: 50px; border-radius: 6px; object-fit: cover; flex-shrink: 0; display: block !important; visibility: visible !important; opacity: 1 !important; print-color-adjust: exact; -webkit-print-color-adjust: exact;" />` : ''}
                    <div style="flex: 1; min-width: 0;">
                        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                            <div style="padding: 2px 8px; border-radius: 4px; background: ${theme.badge}; color: white; font-size: 8px; font-weight: 700; text-transform: uppercase;">
                                ${sh.type === 'hotel' ? '🏨 Hotel' : sh.type === 'transport' ? '🚗 Transport' : '🎯 Activity'}
                            </div>
                        </div>
                        <div style="font-size: 11px; font-weight: 700; color: ${theme.text}; margin-bottom: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                            ${sh.hotel?.name || sh.hotel?.serviceName || 'Service'}
                        </div>
                        <div style="font-size: 9px; color: #6B7280;">📍 ${sh.district}</div>
                    </div>
                </div>
            `}).join('')}
        </div>
        ` : ''}
        ${page.content?.remarks ? `
        <div class="section-title"><div class="section-title-bar" style="background: #EC4899;"></div><div class="section-title-text" style="color: #EC4899;">Additional Notes</div></div>
        <div style="font-size: 10px; line-height: 1.5; color: #6B7280; background: #FDF2F8; padding: 12px; border-radius: 8px; border: 1px solid #FBCFE8; font-style: italic;">${page.content.remarks}</div>
        ` : ''}
    </div>
</div>`;
            } else if (page.type === 'cost') {
                const cost = page.content || reportData.cost || {};
                html += `
<div class="page">
    <div style="height: 120px; background: linear-gradient(135deg, #0f766e 0%, #14b8a6 100%); position: relative; display: flex; align-items: center; padding: 24px 36px;">
        <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 18px; margin-right: 12px;">💰</div>
        <div>
            <div style="color: white; font-size: 18px; font-weight: 700;">Cost Summary</div>
            <div style="color: rgba(255,255,255,0.7); font-size: 11px;">Package pricing & discounts</div>
        </div>
    </div>
    <div style="padding: 32px 48px; background: #fafafa; min-height: 722px;">
        <div style="background: white; border-radius: 16px; padding: 28px; box-shadow: 0 8px 32px rgba(0,0,0,0.08);">
            <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 16px;">Package Details</div>
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-size: 13px; color: #64748b;">Tour Package Amount</span>
                <span style="font-size: 14px; font-weight: 600; color: #1e293b;">LKR ${(cost.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            ${cost.promoCodeDiscount > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
                <span style="font-size: 13px; color: #64748b;">Promo Code Discount</span>
                <span style="font-size: 14px; font-weight: 600; color: #dc2626;">-LKR ${(cost.promoCodeDiscount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>` : ''}
            <div style="display: flex; justify-content: space-between; padding: 20px 0; margin-top: 12px; background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); margin: 16px -28px -28px; padding: 20px 28px; border-radius: 0 0 16px 16px;">
                <span style="font-size: 16px; font-weight: 700; color: #15803d;">Total Amount</span>
                <span style="font-size: 20px; font-weight: 700; color: #15803d;">LKR ${(cost.finalAmount || cost.totalAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
        </div>
    </div>
</div>`;
            } else if (page.type === 'policies') {
                const policies = page.content || reportData.policies || {};
                html += `
<div class="page">
    <div style="height: 120px; background: linear-gradient(135deg, #7c2d12 0%, #ef4444 100%); position: relative; display: flex; align-items: center; padding: 24px 36px;">
        <div style="width: 40px; height: 40px; border-radius: 50%; background: rgba(255,255,255,0.15); display: flex; align-items: center; justify-content: center; font-size: 18px; margin-right: 12px;">📋</div>
        <div>
            <div style="color: white; font-size: 18px; font-weight: 700;">Terms & Policies</div>
            <div style="color: rgba(255,255,255,0.7); font-size: 11px;">Important information & conditions</div>
        </div>
    </div>
    <div style="padding: 32px 48px; background: #fafafa; min-height: 722px;">
        ${policies.specialRemark ? `
        <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
            <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">⚡ Important Notice</div>
            <div style="font-size: 12px; color: #4b5563; line-height: 1.6; padding: 12px; background: #fef3c7; border-radius: 8px;">${policies.specialRemark}</div>
        </div>` : ''}
        ${policies.bookingPolicy ? `
        <div style="background: white; border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
            <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">📅 Booking Policy</div>
            <div style="font-size: 12px; color: #4b5563; line-height: 1.7;">${policies.bookingPolicy}</div>
        </div>` : ''}
        ${policies.cancellationPolicy ? `
        <div style="background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 16px rgba(0,0,0,0.04);">
            <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 12px;">❌ Cancellation Policy</div>
            <div style="font-size: 12px; color: #4b5563; line-height: 1.7;">${policies.cancellationPolicy}</div>
        </div>` : ''}
    </div>
</div>`;
            }
        });

        html += `</body></html>`;
        return html;
    };

    const handleExportHTML = (report: Report) => {
        const reportData = parseReportData(report);
        if (!reportData) {
            showError("Failed to parse report data");
            return;
        }

        const html = generateReportHTML(reportData);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `report-${report.customerName.replace(/\s+/g, '-').toLowerCase()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showSuccess("HTML exported successfully!");
        setExportDropdownOpen(null);
    };

    const handleExportPDF = (report: Report) => {
        const reportData = parseReportData(report);
        if (!reportData) {
            showError("Failed to parse report data");
            return;
        }

        const html = generateReportHTML(reportData);
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
            
            // Wait for images to load before printing
            printWindow.onload = () => {
                const images = printWindow.document.images;
                let loadedImages = 0;
                const totalImages = images.length;
                
                console.log(`Found ${totalImages} images in PDF`);
                
                if (totalImages === 0) {
                    // No images to load, print immediately
                    setTimeout(() => {
                        printWindow.print();
                    }, 500);
                    return;
                }
                
                const checkAllImagesLoaded = () => {
                    loadedImages++;
                    console.log(`Loaded ${loadedImages}/${totalImages} images`);
                    if (loadedImages === totalImages) {
                        console.log('All images loaded, printing...');
                        setTimeout(() => {
                            printWindow.print();
                        }, 1000); // Extra delay to ensure rendering
                    }
                };
                
                // Add load event listeners to all images
                Array.from(images).forEach((img, index) => {
                    console.log(`Image ${index}: ${img.src.substring(0, 100)}...`);
                    if (img.complete && img.naturalWidth > 0) {
                        console.log(`Image ${index} already loaded`);
                        checkAllImagesLoaded();
                    } else {
                        img.onload = () => {
                            console.log(`Image ${index} loaded successfully`);
                            checkAllImagesLoaded();
                        };
                        img.onerror = (e) => {
                            console.warn(`Image ${index} failed to load:`, img.src, e);
                            checkAllImagesLoaded();
                        };
                        
                        // Force reload if image has not started loading
                        if (!img.src || img.src === 'about:blank') {
                            console.warn(`Image ${index} has invalid src, skipping`);
                            checkAllImagesLoaded();
                        }
                    }
                });
                
                // Fallback timeout in case images take too long
                setTimeout(() => {
                    if (loadedImages < totalImages) {
                        console.warn('Some images may not have loaded completely');
                        printWindow.print();
                    }
                }, 5000);
            };
        }
        showSuccess("Print dialog will open once images are loaded.");
        setExportDropdownOpen(null);
    };

    // Get selected element for customization panel
    const selectedElement = useMemo(() => {
        if (!editableReportData?.pages || selectedElementIndex === null) return null;
        const page = editableReportData.pages[selectedPageIndex];
        if (page?.type !== 'template' || !page.content?.elements) return null;
        return page.content.elements[selectedElementIndex] || null;
    }, [editableReportData, selectedPageIndex, selectedElementIndex]);

    // Element summary for layer list
    const elementSummary = useMemo(() => {
        if (!editableReportData?.pages) return [];
        const page = editableReportData.pages[selectedPageIndex];
        if (page?.type !== 'template' || !page.content?.elements) return [];

        return page.content.elements.map((el: any) => {
            if (el.type === 'text') return `Text · ${(el.content || 'Empty').slice(0, 20)}`;
            if (el.type === 'image') return 'Image';
            if (el.type === 'shape') return `Shape · ${el.shape || 'rectangle'}`;
            if (el.type === 'pill') return 'Pill';
            return 'Element';
        });
    }, [editableReportData, selectedPageIndex]);

    // Render customizable template page
    const renderCustomizableTemplatePage = (page: ReportPage, pageIndex: number) => {
        if (page.type !== 'template' || !page.content?.elements) return null;

        return (
            <div
                style={{
                    width: `${A4_WIDTH * canvasScale}px`,
                    height: `${A4_HEIGHT * canvasScale}px`,
                    background: '#FFFFFF',
                    position: 'relative',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                }}
                onClick={handleCanvasClick}
            >
                {page.content.elements.map((el: any, i: number) => {
                    const isSelected = selectedPageIndex === pageIndex && selectedElementIndex === i;
                    const baseStyle: CSSProperties = {
                        position: 'absolute',
                        left: `${(el.x ?? 0) * canvasScale}px`,
                        top: `${(el.y ?? 0) * canvasScale}px`,
                        cursor: 'grab',
                        outline: isSelected ? '2px dashed #ff7b2e' : 'none',
                        outlineOffset: '2px',
                    };

                    if (el.type === 'text') {
                        return (
                            <div
                                key={i}
                                style={{
                                    ...baseStyle,
                                    width: el.width ? `${el.width * canvasScale}px` : 'auto',
                                    fontSize: `${(el.fontSize ?? 14) * canvasScale}px`,
                                    fontFamily: el.fontFamily ?? 'Arial',
                                    fontWeight: el.fontWeight ?? 400,
                                    color: el.color ?? '#000',
                                    lineHeight: el.lineHeight ?? 1.4,
                                }}
                                onMouseDown={(e) => handleElementMouseDown(e, pageIndex, i)}
                            >
                                {el.content}
                            </div>
                        );
                    }
                    if (el.type === 'shape') {
                        if (el.shape === 'rectangle' || !el.shape) {
                            return (
                                <div
                                    key={i}
                                    style={{
                                        ...baseStyle,
                                        width: `${(el.width ?? 100) * canvasScale}px`,
                                        height: `${(el.height ?? 100) * canvasScale}px`,
                                        background: el.fill ?? 'transparent',
                                        borderRadius: `${(el.borderRadius ?? 0) * canvasScale}px`,
                                        border: el.stroke ? `1px solid ${el.stroke}` : undefined,
                                    }}
                                    onMouseDown={(e) => handleElementMouseDown(e, pageIndex, i)}
                                />
                            );
                        }
                        if (el.shape === 'circle') {
                            const diameter = (el.width ?? el.height ?? 0) * canvasScale;
                            return (
                                <div
                                    key={i}
                                    style={{
                                        ...baseStyle,
                                        width: `${diameter}px`,
                                        height: `${diameter}px`,
                                        borderRadius: '50%',
                                        background: el.fill ?? '#f3f4f6',
                                        border: el.stroke ? `1px solid ${el.stroke}` : undefined,
                                    }}
                                    onMouseDown={(e) => handleElementMouseDown(e, pageIndex, i)}
                                />
                            );
                        }
                        if (el.shape === 'polygon' && el.points?.length) {
                            const polygonPoints = el.points
                                .map((point: { x: number; y: number }) => `${(point.x / A4_WIDTH) * 100}% ${(point.y / A4_HEIGHT) * 100}%`)
                                .join(', ');
                            return (
                                <div
                                    key={i}
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        width: `${A4_WIDTH * canvasScale}px`,
                                        height: `${A4_HEIGHT * canvasScale}px`,
                                        background: el.fill ?? '#111827',
                                        clipPath: `polygon(${polygonPoints})`,
                                        cursor: 'grab',
                                        outline: isSelected ? '2px dashed #ff7b2e' : 'none',
                                    }}
                                    onMouseDown={(e) => handleElementMouseDown(e, pageIndex, i)}
                                />
                            );
                        }
                        if (el.shape === 'line') {
                            return (
                                <div
                                    key={i}
                                    style={{
                                        ...baseStyle,
                                        width: `${(el.width ?? 100) * canvasScale}px`,
                                        height: `${Math.max(1, (el.height ?? 1) * canvasScale)}px`,
                                        background: el.stroke ?? el.fill ?? '#e5e7eb',
                                        borderRadius: '999px',
                                    }}
                                    onMouseDown={(e) => handleElementMouseDown(e, pageIndex, i)}
                                />
                            );
                        }
                    }
                    if (el.type === 'image') {
                        return (
                            <img
                                key={i}
                                src={getImgSrc(el.src)}
                                alt=""
                                style={{
                                    ...baseStyle,
                                    width: `${(el.width ?? 100) * canvasScale}px`,
                                    height: `${(el.height ?? 100) * canvasScale}px`,
                                    objectFit: 'cover',
                                    borderRadius: `${(el.borderRadius ?? 0) * canvasScale}px`,
                                }}
                                onMouseDown={(e) => handleElementMouseDown(e, pageIndex, i)}
                            />
                        );
                    }
                    if (el.type === 'pill') {
                        return (
                            <div
                                key={i}
                                style={{
                                    ...baseStyle,
                                    padding: `${14 * canvasScale}px ${18 * canvasScale}px`,
                                    borderRadius: `${18 * canvasScale}px`,
                                    background: el.colors?.bg ?? '#ffffff',
                                    color: el.colors?.text ?? '#111827',
                                    border: `1px solid ${(el.colors?.text ?? '#111827')}30`,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: `${4 * canvasScale}px`,
                                }}
                                onMouseDown={(e) => handleElementMouseDown(e, pageIndex, i)}
                            >
                                <span style={{ fontSize: `${10 * canvasScale}px`, letterSpacing: '0.25em', textTransform: 'uppercase' }}>{el.label}</span>
                                <span style={{ fontSize: `${16 * canvasScale}px`, fontWeight: 600 }}>{el.value}</span>
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        );
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
                        <div style={{ position: "relative", flexGrow: 1, maxWidth: "420px" }}>
                            <SearchRoundedIcon style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af", fontSize: "20px", pointerEvents: "none" }} />
                            <input
                                type="text"
                                placeholder="Search by customer name or email..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                style={{ width: "100%", paddingLeft: "44px", paddingRight: "14px", paddingTop: "10px", paddingBottom: "10px", border: "1px solid #e5e7eb", borderRadius: "10px", fontSize: "14px", outline: "none", transition: "all 0.2s", background: "#fff" }}
                                onFocus={(e) => e.target.style.borderColor = "var(--color-primary)"}
                                onBlur={(e) => e.target.style.borderColor = "#e5e7eb"}
                            />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6b7280", fontWeight: "600" }}>
                            {filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}
                        </div>
                    </div>

                    <div className="panel-body">
                        {currentReports.length === 0 ? (
                            <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
                                <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                                <div style={{ fontSize: "16px", fontWeight: "600", marginBottom: "8px" }}>No reports found</div>
                                <div style={{ fontSize: "14px" }}>{searchTerm ? "Try adjusting your search" : "Generated reports will appear here"}</div>
                            </div>
                        ) : (
                            <div style={{ overflowX: "auto", position: "relative" }}>
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                                            <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "12px", fontWeight: "700", color: "#6b7280", letterSpacing: "0.5px", textTransform: "uppercase" }}>Customer Name</th>
                                            <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "12px", fontWeight: "700", color: "#6b7280", letterSpacing: "0.5px", textTransform: "uppercase" }}>Email</th>
                                            <th style={{ textAlign: "center", padding: "12px 16px", fontSize: "12px", fontWeight: "700", color: "#6b7280", letterSpacing: "0.5px", textTransform: "uppercase" }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentReports.map((report, index) => (
                                            <tr key={report.id} style={{ borderBottom: index !== currentReports.length - 1 ? "1px solid #f3f4f6" : "none", transition: "background-color 0.2s" }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#f9fafb"}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
                                                <td style={{ padding: "16px", fontSize: "14px", fontWeight: "600", color: "#111827" }}>{report.customerName}</td>
                                                <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>{report.customerEmail}</td>
                                                <td style={{ padding: "16px", textAlign: "center" }}>
                                                    <div style={{ display: "flex", gap: "8px", justifyContent: "center", position: "relative" }}>
                                                        <button onClick={() => handleViewReport(report)} style={{ border: "none", background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", color: "white", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(59, 130, 246, 0.25)" }}>
                                                            <VisibilityRoundedIcon style={{ fontSize: "16px" }} />
                                                            View
                                                        </button>
                                                        <button onClick={() => handleCustomizeReport(report)} style={{ border: "none", background: "linear-gradient(135deg, #eed920 0%, #ea7e02 100%)", color: "white", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(234, 126, 2, 0.25)" }}>
                                                            <EditRoundedIcon style={{ fontSize: "16px" }} />
                                                            Customize
                                                        </button>
                                                        <div style={{ position: "relative" }} ref={exportDropdownOpen === report.id ? exportDropdownRef : null}>
                                                            <button 
                                                                onClick={(e) => {
                                                                    const isOpening = exportDropdownOpen !== report.id;
                                                                    setExportDropdownOpen(isOpening ? report.id : null);
                                                                    
                                                                    if (isOpening) {
                                                                        // Wait for next frame to ensure dropdown is rendered
                                                                        setTimeout(() => {
                                                                            const dropdown = exportDropdownRef.current;
                                                                            if (dropdown) {
                                                                                const buttonRect = e.currentTarget.getBoundingClientRect();
                                                                                dropdown.style.top = `${buttonRect.bottom + 4}px`;
                                                                                dropdown.style.left = `${buttonRect.right - dropdown.offsetWidth}px`;
                                                                            }
                                                                        }, 0);
                                                                    }
                                                                }} 
                                                                style={{ border: "none", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", padding: "8px 12px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: "600", transition: "all 0.2s", boxShadow: "0 2px 8px rgba(16, 185, 129, 0.25)" }}
                                                            >
                                                                <FileDownloadRoundedIcon style={{ fontSize: "16px" }} />
                                                                Export
                                                            </button>
                                                            {exportDropdownOpen === report.id && (
                                                                <div 
                                                                    style={{ 
                                                                        position: "fixed", 
                                                                        background: "white", 
                                                                        borderRadius: "8px", 
                                                                        boxShadow: "0 10px 40px rgba(0,0,0,0.15)", 
                                                                        border: "1px solid #e5e7eb", 
                                                                        overflow: "hidden", 
                                                                        zIndex: 9999, 
                                                                        minWidth: "140px"
                                                                    }}
                                                                    ref={exportDropdownRef}
                                                                >
                                                                    <button onClick={() => handleExportPDF(report)} style={{ width: "100%", padding: "10px 16px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#374151", transition: "background 0.15s" }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                                                        <PictureAsPdfRoundedIcon style={{ fontSize: "18px", color: "#ef4444" }} />
                                                                        Export PDF
                                                                    </button>
                                                                    <button onClick={() => handleExportHTML(report)} style={{ width: "100%", padding: "10px 16px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#374151", transition: "background 0.15s" }}
                                                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
                                                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                                                                        <CodeRoundedIcon style={{ fontSize: "18px", color: "#3b82f6" }} />
                                                                        Export HTML
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginTop: "24px", paddingTop: "20px", borderTop: "1px solid #f3f4f6" }}>
                                <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} style={{ border: "1px solid #e5e7eb", background: currentPage === 1 ? "#f9fafb" : "white", color: currentPage === 1 ? "#9ca3af" : "#374151", padding: "8px 14px", borderRadius: "8px", cursor: currentPage === 1 ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600" }}>Previous</button>
                                {getPaginationNumbers().map((page, index) => (
                                    page === '...' ? (
                                        <span key={`ellipsis-${index}`} style={{ padding: "8px 12px", color: "#9ca3af", fontSize: "14px" }}>...</span>
                                    ) : (
                                        <button key={page} onClick={() => setCurrentPage(page as number)} style={{ border: "1px solid #e5e7eb", background: currentPage === page ? "linear-gradient(135deg, var(--color-primary) 0%, #F0A94D 100%)" : "white", color: currentPage === page ? "white" : "#374151", padding: "8px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "14px", fontWeight: "600", minWidth: "40px", boxShadow: currentPage === page ? "0 2px 8px rgba(255, 123, 46, 0.25)" : "none" }}>{page}</button>
                                    )
                                ))}
                                <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} style={{ border: "1px solid #e5e7eb", background: currentPage === totalPages ? "#f9fafb" : "white", color: currentPage === totalPages ? "#9ca3af" : "#374151", padding: "8px 14px", borderRadius: "8px", cursor: currentPage === totalPages ? "not-allowed" : "pointer", fontSize: "14px", fontWeight: "600" }}>Next</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* View Report Modal */}
            {viewModalOpen && selectedReport && (() => {
                const reportData = parseReportData(selectedReport);
                if (!reportData) {
                    return (
                        <div style={{ position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }} onClick={() => setViewModalOpen(false)}>
                            <div style={{ background: "white", borderRadius: "16px", padding: "40px", textAlign: "center" }}>
                                <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
                                <div style={{ fontSize: "16px", color: "#6b7280" }}>Failed to load report data</div>
                            </div>
                        </div>
                    );
                }

                return (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'linear-gradient(160deg, #0a0a18 0%, #12121f 100%)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: '58px', flexShrink: 0, background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg, #FF7B2E 0%, #F0A94D 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                                    <DocumentScanner style={{ color: 'white' }} />
                                </div>
                                <div>
                                    <div style={{ fontSize: '15px', fontWeight: 700, color: 'rgba(255,255,255,0.95)', letterSpacing: '-0.3px' }}>{reportData.metadata?.customerName || selectedReport.customerName}</div>
                                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>{processReportPagesForOverflow(reportData).length} pages • {reportData.metadata?.daysAndNights || 'N/A'}</div>
                                </div>
                            </div>
                            <button onClick={() => setViewModalOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.8)', borderRadius: '8px', padding: '7px 18px', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>✕ Close</button>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', padding: '44px 24px 60px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px' }}>
                            {processReportPagesForOverflow(reportData).map((page, idx) => (
                                <div key={idx} style={{ flexShrink: 0 }}>
                                    <ReportPageRenderer page={page} reportData={reportData} scale={1} />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })()}

            {/* Customize Report Modal */}
            {customizeModalOpen && selectedReport && editableReportData && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }}>
                    <div className="template-customize">
                        <header className="template-customize-header">
                        <div className="template-customize-title">
                            <button type="button" className="template-customize-back" onClick={handleCloseCustomizeModal}>
                                <ArrowBackRoundedIcon fontSize="small" />
                            </button>
                            <div>
                                <p>Report customization</p>
                                <h1>{selectedReport.customerName}</h1>
                            </div>
                        </div>
                        <div className="template-customize-actions">
                            <div className="template-customize-badge">
                                <HeightRoundedIcon fontSize="small" />
                                A4 canvas ({A4_WIDTH}×{A4_HEIGHT})
                            </div>
                            <button type="button" className="btn btn--orange" onClick={handleSaveReport} disabled={isSaving}>
                                <SaveRoundedIcon fontSize="small" />
                                {isSaving ? "Saving..." : "Save changes"}
                            </button>
                        </div>
                    </header>

                    <main className="template-customize-content">
                        <aside className="template-customize-panel template-customize-panel--left">
                            <div className="template-customize-panel-card">
                                <h3>Pages</h3>
                                <div className="template-customize-layer-list">
                                    {editableReportData.pages?.map((page, idx) => (
                                        <button key={idx} type="button" className={`template-customize-layer ${selectedPageIndex === idx ? 'active' : ''}`}
                                            onClick={() => { setSelectedPageIndex(idx); setSelectedElementIndex(null); }}>
                                            <span>
                                                {page.type === 'template' ? `📄 Cover Page ${idx + 1}` :
                                                    page.type === 'customerInfo' ? '👤 Customer Info' :
                                                        page.type === 'dayDetail' ? `📅 Day ${page.dayNumber}` :
                                                            page.type === 'cost' ? '💰 Cost Summary' :
                                                                page.type === 'policies' ? '📋 Policies' : `Page ${idx + 1}`}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {editableReportData.pages?.[selectedPageIndex]?.type === 'template' && (
                                <div className="template-customize-panel-card">
                                    <h3>Layers</h3>
                                    <div className="template-customize-layer-list">
                                        {elementSummary.length === 0 && <p className="template-customize-hint">No elements found.</p>}
                                        {elementSummary.map((summary: string, index: number) => (
                                            <button key={index} type="button" className={`template-customize-layer ${selectedElementIndex === index ? 'active' : ''}`}
                                                onClick={() => setSelectedElementIndex(index)}>
                                                <span>{summary}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </aside>

                        <section className="template-customize-canvas">
                            <div className="template-customize-canvas-scroll" ref={canvasWrapperRef}>
                                <div className="template-customize-canvas-wrapper">
                                    {editableReportData.pages?.[selectedPageIndex]?.type === 'template' ? (
                                        renderCustomizableTemplatePage(editableReportData.pages[selectedPageIndex], selectedPageIndex)
                                    ) : (
                                        <div style={{ margin: '20px auto' }}>
                                            <ReportPageRenderer page={editableReportData.pages![selectedPageIndex]} reportData={editableReportData} scale={canvasScale} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>

                        <aside className="template-customize-panel template-customize-panel--right">
                            <div className="template-customize-panel-card" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                                <h3>Edit Page Content</h3>
                                {/* Template page editing */}
                                {selectedElement && editableReportData.pages?.[selectedPageIndex]?.type === 'template' ? (
                                    <div className="template-customize-controls">
                                        <div className="template-customize-control">
                                            <label>Position</label>
                                            <div className="template-customize-position">
                                                <span>X: {Math.round(selectedElement.x ?? 0)}</span>
                                                <span>Y: {Math.round(selectedElement.y ?? 0)}</span>
                                            </div>
                                        </div>
                                        {selectedElement.type === 'text' && (
                                            <>
                                                <div className="template-customize-control">
                                                    <label>Text</label>
                                                    <textarea rows={4} className="template-customize-textarea" value={(selectedElement as TextElement).content ?? ''} onChange={handleTextContentChange} />
                                                </div>
                                                <div className="template-customize-control">
                                                    <label className="template-customize-color-label"><PaletteRoundedIcon fontSize="small" />Text color</label>
                                                    <input type="color" value={(selectedElement as TextElement).color ?? '#111827'} onChange={handleColorChange} />
                                                </div>
                                            </>
                                        )}
                                        {selectedElement.type === 'shape' && (
                                            <div className="template-customize-control">
                                                <label className="template-customize-color-label"><PaletteRoundedIcon fontSize="small" />Fill color</label>
                                                <input type="color" value={(selectedElement as ShapeElement).fill ?? '#ffffff'} onChange={handleFillChange} />
                                            </div>
                                        )}
                                        {selectedElement.type !== 'text' && selectedElement.type !== 'shape' && (
                                            <p className="template-customize-hint">Drag elements on the canvas to reposition them.</p>
                                        )}
                                    </div>
                                ) : editableReportData.pages?.[selectedPageIndex]?.type === 'template' && !selectedElement ? (
                                    <p className="template-customize-hint">Select an element from the canvas or the layer list to edit.</p>
                                ) : null}

                                {/* Customer Info page editing */}
                                {editableReportData.pages?.[selectedPageIndex]?.type === 'customerInfo' && (
                                    <div className="template-customize-controls">
                                        <div className="template-customize-control">
                                            <label><TextFieldsRoundedIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: '4px' }} />Customer Name</label>
                                            <input 
                                                type="text" 
                                                className="template-customize-input" 
                                                value={editableReportData.metadata?.customerName || ''} 
                                                onChange={(e) => updateMetadata('customerName', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label>Country</label>
                                            <input 
                                                type="text" 
                                                className="template-customize-input" 
                                                value={editableReportData.metadata?.country || ''} 
                                                onChange={(e) => updateMetadata('country', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label>Mobile Number</label>
                                            <input 
                                                type="text" 
                                                className="template-customize-input" 
                                                value={editableReportData.metadata?.mobileNo || ''} 
                                                onChange={(e) => updateMetadata('mobileNo', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label>Email</label>
                                            <input 
                                                type="email" 
                                                className="template-customize-input" 
                                                value={editableReportData.metadata?.customerEmail || ''} 
                                                onChange={(e) => updateMetadata('customerEmail', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label>Duration (Days & Nights)</label>
                                            <input 
                                                type="text" 
                                                className="template-customize-input" 
                                                value={editableReportData.metadata?.daysAndNights || ''} 
                                                onChange={(e) => updateMetadata('daysAndNights', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label className="template-customize-color-label"><PaletteRoundedIcon fontSize="small" />Booking Info Gradient Color</label>
                                            <input 
                                                type="color" 
                                                className="template-customize-input" 
                                                value={editableReportData.metadata?.bookingGradientColor || '#0284C7'} 
                                                onChange={(e) => updateMetadata('bookingGradientColor', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', height: '40px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label>Number of Passengers</label>
                                            <input 
                                                type="text" 
                                                className="template-customize-input" 
                                                value={editableReportData.metadata?.numberOfPassengers || ''} 
                                                onChange={(e) => updateMetadata('numberOfPassengers', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Day Detail page editing */}
                                {(editableReportData.pages?.[selectedPageIndex]?.type === 'dayDetail' || editableReportData.pages?.[selectedPageIndex]?.type === 'dayDetailContinued') && (
                                    <div className="template-customize-controls">
                                        <div className="template-customize-control">
                                            <label><TextFieldsRoundedIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: '4px' }} />Date</label>
                                            <input 
                                                type="text" 
                                                className="template-customize-input" 
                                                value={editableReportData.pages?.[selectedPageIndex]?.content?.selectedDay || ''} 
                                                onChange={(e) => updatePageContent(selectedPageIndex, 'selectedDay', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label>Daily Itinerary Description</label>
                                            <textarea 
                                                rows={6} 
                                                className="template-customize-textarea" 
                                                value={editableReportData.pages?.[selectedPageIndex]?.content?.description || ''} 
                                                onChange={(e) => updatePageContent(selectedPageIndex, 'description', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label className="template-customize-color-label"><PaletteRoundedIcon fontSize="small" />Header Color</label>
                                            <input 
                                                type="color" 
                                                className="template-customize-input" 
                                                value={editableReportData.pages?.[selectedPageIndex]?.content?.dayHeaderColor || '#1E293B'} 
                                                onChange={(e) => updatePageContent(selectedPageIndex, 'dayHeaderColor', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', height: '40px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label className="template-customize-color-label"><PaletteRoundedIcon fontSize="small" />Itinerary Section Color</label>
                                            <input 
                                                type="color" 
                                                className="template-customize-input" 
                                                value={editableReportData.pages?.[selectedPageIndex]?.content?.dayItineraryColor || '#8B5CF6'} 
                                                onChange={(e) => updatePageContent(selectedPageIndex, 'dayItineraryColor', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', height: '40px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label className="template-customize-color-label"><PaletteRoundedIcon fontSize="small" />Places Section Color</label>
                                            <input 
                                                type="color" 
                                                className="template-customize-input" 
                                                value={editableReportData.pages?.[selectedPageIndex]?.content?.dayPlacesColor || '#10B981'} 
                                                onChange={(e) => updatePageContent(selectedPageIndex, 'dayPlacesColor', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', height: '40px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label className="template-customize-color-label"><PaletteRoundedIcon fontSize="small" />Services Section Color</label>
                                            <input 
                                                type="color" 
                                                className="template-customize-input" 
                                                value={editableReportData.pages?.[selectedPageIndex]?.content?.dayServicesColor || '#F59E0B'} 
                                                onChange={(e) => updatePageContent(selectedPageIndex, 'dayServicesColor', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', height: '40px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label className="template-customize-color-label"><PaletteRoundedIcon fontSize="small" />Notes Section Color</label>
                                            <input 
                                                type="color" 
                                                className="template-customize-input" 
                                                value={editableReportData.pages?.[selectedPageIndex]?.content?.dayNotesColor || '#EC4899'} 
                                                onChange={(e) => updatePageContent(selectedPageIndex, 'dayNotesColor', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', height: '40px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label className="template-customize-color-label"><PaletteRoundedIcon fontSize="small" />Text Color</label>
                                            <input 
                                                type="color" 
                                                className="template-customize-input" 
                                                value={editableReportData.pages?.[selectedPageIndex]?.content?.textColor || '#374151'} 
                                                onChange={(e) => updatePageContent(selectedPageIndex, 'textColor', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', height: '40px' }}
                                            />
                                        </div>
                                        <p className="template-customize-hint" style={{ marginTop: '8px', fontSize: '11px', color: '#6b7280' }}>
                                            💡 Places and services are displayed from the original report data.
                                        </p>
                                    </div>
                                )}

                                {/* Cost page editing */}
                                {editableReportData.pages?.[selectedPageIndex]?.type === 'cost' && (
                                    <div className="template-customize-controls">
                                        <div className="template-customize-control">
                                            <label><TextFieldsRoundedIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: '4px' }} />Total Amount (LKR)</label>
                                            <input 
                                                type="number" 
                                                className="template-customize-input" 
                                                value={editableReportData.cost?.totalAmount || 0} 
                                                onChange={(e) => updateCost('totalAmount', parseFloat(e.target.value) || 0)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label>Promo Code Discount (LKR)</label>
                                            <input 
                                                type="number" 
                                                className="template-customize-input" 
                                                value={editableReportData.cost?.promoCodeDiscount || 0} 
                                                onChange={(e) => updateCost('promoCodeDiscount', parseFloat(e.target.value) || 0)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label>Final Amount (LKR)</label>
                                            <input 
                                                type="number" 
                                                className="template-customize-input" 
                                                value={editableReportData.cost?.finalAmount || 0} 
                                                onChange={(e) => updateCost('finalAmount', parseFloat(e.target.value) || 0)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label className="template-customize-color-label"><PaletteRoundedIcon fontSize="small" />Header Color</label>
                                            <input 
                                                type="color" 
                                                className="template-customize-input" 
                                                value={editableReportData.metadata?.costHeaderColor || '#0f766e'} 
                                                onChange={(e) => updateMetadata('costHeaderColor', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', height: '40px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label className="template-customize-color-label"><PaletteRoundedIcon fontSize="small" />Total Amount Color</label>
                                            <input 
                                                type="color" 
                                                className="template-customize-input" 
                                                value={editableReportData.metadata?.costTotalColor || '#15803d'} 
                                                onChange={(e) => updateMetadata('costTotalColor', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', height: '40px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label className="template-customize-color-label"><PaletteRoundedIcon fontSize="small" />Text Color</label>
                                            <input 
                                                type="color" 
                                                className="template-customize-input" 
                                                value={editableReportData.metadata?.textColor || '#1e293b'} 
                                                onChange={(e) => updateMetadata('textColor', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', height: '40px' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Policies page editing */}
                                {editableReportData.pages?.[selectedPageIndex]?.type === 'policies' && (
                                    <div className="template-customize-controls">
                                        <div className="template-customize-control">
                                            <label><TextFieldsRoundedIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: '4px' }} />Special Remark</label>
                                            <textarea 
                                                rows={3} 
                                                className="template-customize-textarea" 
                                                value={editableReportData.policies?.specialRemark || ''} 
                                                onChange={(e) => updatePolicies('specialRemark', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label>Booking Policy</label>
                                            <textarea 
                                                rows={4} 
                                                className="template-customize-textarea" 
                                                value={editableReportData.policies?.bookingPolicy || ''} 
                                                onChange={(e) => updatePolicies('bookingPolicy', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label>Cancellation Policy</label>
                                            <textarea 
                                                rows={4} 
                                                className="template-customize-textarea" 
                                                value={editableReportData.policies?.cancellationPolicy || ''} 
                                                onChange={(e) => updatePolicies('cancellationPolicy', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', resize: 'vertical' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label className="template-customize-color-label"><PaletteRoundedIcon fontSize="small" />Header Color</label>
                                            <input 
                                                type="color" 
                                                className="template-customize-input" 
                                                value={editableReportData.metadata?.policiesHeaderColor || '#dc2626'} 
                                                onChange={(e) => updateMetadata('policiesHeaderColor', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', height: '40px' }}
                                            />
                                        </div>
                                        <div className="template-customize-control">
                                            <label className="template-customize-color-label"><PaletteRoundedIcon fontSize="small" />Text Color</label>
                                            <input 
                                                type="color" 
                                                className="template-customize-input" 
                                                value={editableReportData.metadata?.textColor || '#1e293b'} 
                                                onChange={(e) => updateMetadata('textColor', e.target.value)}
                                                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '6px', fontSize: '13px', height: '40px' }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="template-customize-panel-card">
                                <h3>Report Info</h3>
                                <div style={{ padding: '8px 0' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Customer</label>
                                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{selectedReport.customerName}</div>
                                    </div>
                                    <div style={{ marginBottom: '12px' }}>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>Email</label>
                                        <div style={{ fontSize: '13px', fontWeight: '500', color: '#111827' }}>{selectedReport.customerEmail}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="template-customize-panel-card template-customize-panel-footer">
                                <button type="button" className="template-customize-close" onClick={handleCloseCustomizeModal}>
                                    <CloseRoundedIcon fontSize="small" />
                                    Exit customization
                                </button>
                                <button type="button" className="btn btn--orange" onClick={handleSaveReport} disabled={isSaving}>
                                    <SaveRoundedIcon fontSize="small" />
                                    {isSaving ? "Saving..." : "Save changes"}
                                </button>
                            </div>
                        </aside>
                    </main>
                </div>
                </div>
            )}
        </Navbar>
    );
}
