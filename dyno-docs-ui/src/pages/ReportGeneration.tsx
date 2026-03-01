import { InfoOutline, NavigateNext, NavigateBefore } from "@mui/icons-material";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import CircularProgress from "@mui/material/CircularProgress";
import { useState, useEffect, useRef } from "react";
import Navbar from "../layouts/Navbar";
import "../styles/agencyData.css";
import { showSuccess, showError } from "../components/Toast";
import { getDataByDistrict } from "../services/agency-data-api";
import { getPartnershipByDistrict } from "../services/partnership-api";
import { generateDayDescription } from "../services/ai-api";
import { getUserTemplates } from "../services/template-api";

export default function ReportGeneration() {
    const [infoOpen, setInfoOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(3);
    const [isLoading, setIsLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [districtData, setDistrictData] = useState<{ [key: string]: any }>({});
    const [loadingDistricts, setLoadingDistricts] = useState<{ [key: string]: boolean }>({});
    const [partnershipData, setPartnershipData] = useState<{ [key: string]: any }>({});
    const [loadingPartnerships, setLoadingPartnerships] = useState<{ [key: string]: boolean }>({});
    const [generatedDescriptions, setGeneratedDescriptions] = useState<{ [key: number]: string }>({});
    const [generatingDescriptionFor, setGeneratingDescriptionFor] = useState<number | null>(null);
    const [templates, setTemplates] = useState<any[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const [generatedReport, setGeneratedReport] = useState<{ templateDesign: any; template: any } | null>(null);
    const [exportMenuOpen, setExportMenuOpen] = useState(false);
    const dayCardRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch templates when reaching step 3
    useEffect(() => {
        if (currentStep !== 3) return;
        const token = sessionStorage.getItem("dd_token");
        const userId = sessionStorage.getItem("dd_user_id");
        if (!token || !userId) return;
        setLoadingTemplates(true);
        getUserTemplates(userId, token)
            .then((data) => setTemplates(Array.isArray(data) ? data : data?.templates ?? data?.data ?? []))
            .catch(() => showError("Failed to load templates."))
            .finally(() => setLoadingTemplates(false));
    }, [currentStep]);

    // Form state
    const [formData, setFormData] = useState({
        customerName: "",
        country: "",
        mobileNo: "",
        transportationMode: "",
        numberOfPassengers: "",
        daysAndNights: "",
        selectedRoute: "",
        selectedRoutes: [] as string[],
        dayCards: [
            {
                id: 1,
                selectedDay: "",
                visitingPlaces: [] as string[],
                selectedPlaces: [] as Array<{ district: string, place: any }>,
                selectedHotels: [] as Array<{ district: string, hotel: any, type: 'transport' | 'activity' | 'hotel' }>,
                remarks: ""
            }
        ] as Array<{
            id: number;
            selectedDay: string;
            visitingPlaces: string[];
            selectedPlaces: Array<{ district: string, place: any }>;
            selectedHotels: Array<{ district: string, hotel: any, type: 'transport' | 'activity' | 'hotel' }>;
            remarks: string;
        }>,
        selectedTemplate: "",
    });

    const routeOptions = [
        "Airport",
        "Colombo",
        "Gampaha",
        "Kalutara",
        "Kandy",
        "Matale",
        "Nuwara Eliya",
        "Galle",
        "Matara",
        "Hambantota",
        "Jaffna",
        "Kilinochchi",
        "Mannar",
        "Vavuniya",
        "Mullaitivu",
        "Batticaloa",
        "Ampara",
        "Trincomalee",
        "Kurunegala",
        "Puttalam",
        "Anuradhapura",
        "Polonnaruwa",
        "Badulla",
        "Moneragala",
        "Ratnapura",
        "Kegalle"
    ];

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleRouteToggle = (route: string) => {
        setFormData((prev) => ({
            ...prev,
            selectedRoutes: prev.selectedRoutes.includes(route)
                ? prev.selectedRoutes.filter((r) => r !== route)
                : [...prev.selectedRoutes, route],
        }));
    };

    const handleDayCardChange = (cardId: number, field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            dayCards: prev.dayCards.map((card) =>
                card.id === cardId ? { ...card, [field]: value } : card
            ),
        }));
    };

    const handleDayCardLocationToggle = async (cardId: number, location: string) => {
        const isCurrentlySelected = formData.dayCards.find(card => card.id === cardId)?.visitingPlaces.includes(location);

        // Update the form data
        setFormData((prev) => ({
            ...prev,
            dayCards: prev.dayCards.map((card) =>
                card.id === cardId
                    ? {
                        ...card,
                        visitingPlaces: card.visitingPlaces.includes(location)
                            ? card.visitingPlaces.filter((l) => l !== location)
                            : [...card.visitingPlaces, location],
                        // If unselecting a visiting place, also remove all selected places and hotels from that district
                        selectedPlaces: card.visitingPlaces.includes(location)
                            ? card.selectedPlaces.filter(p => p.district !== location)
                            : card.selectedPlaces,
                        selectedHotels: card.visitingPlaces.includes(location)
                            ? card.selectedHotels.filter(h => h.district !== location)
                            : card.selectedHotels
                    }
                    : card
            ),
        }));

        // If selecting (not deselecting) and don't have data for this district, fetch it
        if (!isCurrentlySelected && !districtData[location]) {
            await fetchDistrictData(location);
        }

        // Also fetch partnership data for hotels if selecting
        if (!isCurrentlySelected && !partnershipData[location]) {
            await fetchPartnershipData(location);
        }
    };

    const handleServiceToggle = (cardId: number, district: string, service: any, serviceType: 'transport' | 'activity' | 'hotel') => {
        setFormData((prev) => ({
            ...prev,
            dayCards: prev.dayCards.map((card) =>
                card.id === cardId
                    ? {
                        ...card,
                        selectedHotels: card.selectedHotels.some(h => h.hotel === service && h.type === serviceType)
                            ? card.selectedHotels.filter(h => !(h.hotel === service && h.type === serviceType))
                            : [...card.selectedHotels, { district, hotel: service, type: serviceType }],
                    }
                    : card
            ),
        }));
    };

    const handlePlaceToggle = (cardId: number, district: string, place: any) => {
        setFormData((prev) => ({
            ...prev,
            dayCards: prev.dayCards.map((card) =>
                card.id === cardId
                    ? {
                        ...card,
                        selectedPlaces: card.selectedPlaces.some(p => p.place === place)
                            ? card.selectedPlaces.filter(p => p.place !== place)
                            : [...card.selectedPlaces, { district, place }],
                    }
                    : card
            ),
        }));
    };

    const handleGenerateDescription = async (dayCard: typeof formData.dayCards[0], dayIndex: number) => {
        const token = sessionStorage.getItem("dd_token");
        if (!token) {
            showError("Authentication required. Please log in again.");
            return;
        }

        setGeneratingDescriptionFor(dayCard.id);

        try {
            const places = dayCard.selectedPlaces.map((sp: any) =>
                sp.place?.name || sp.place?.placeName || sp.place?.toString() || "Unknown Place"
            );
            const services = dayCard.selectedHotels.map((sh: any) =>
                `${sh.type === 'hotel' ? '🏨' : sh.type === 'transport' ? '🚗' : '🎯'} ${sh.hotel?.name || 'Service'} (${sh.district})`
            );

            const response = await generateDayDescription(
                {
                    dayNumber: dayIndex + 1,
                    date: dayCard.selectedDay || undefined,
                    places,
                    visitingPlaces: dayCard.visitingPlaces,
                    services,
                },
                token
            );

            setGeneratedDescriptions(prev => ({ ...prev, [dayCard.id]: response.description }));
            showSuccess(`Day ${dayIndex + 1} description generated!`);
        } catch (error: any) {
            console.error("Error generating description:", error);
            showError(error?.response?.data?.message || "Failed to generate description. Please try again.");
        } finally {
            setGeneratingDescriptionFor(null);
        }
    };

    const fetchPartnershipData = async (district: string) => {
        const token = sessionStorage.getItem("dd_token");
        const tenantId = sessionStorage.getItem("dd_tenant_id");

        if (!token || !tenantId) {
            showError("Authentication required. Please log in again.");
            return;
        }

        setLoadingPartnerships(prev => ({ ...prev, [district]: true }));

        try {
            const response = await getPartnershipByDistrict(tenantId, district, token);
            setPartnershipData(prev => ({
                ...prev,
                [district]: response.data
            }));
        } catch (error: any) {
            console.error(`Error fetching hotels for ${district}:`, error);
            showError(`Failed to load hotels for ${district}. ${error.response?.data?.message || error.message}`);
        } finally {
            setLoadingPartnerships(prev => ({ ...prev, [district]: false }));
        }
    };

    const fetchDistrictData = async (district: string) => {
        const token = sessionStorage.getItem("dd_token");
        const tenantId = sessionStorage.getItem("dd_tenant_id");

        if (!token || !tenantId) {
            showError("Authentication required. Please log in again.");
            return;
        }

        setLoadingDistricts(prev => ({ ...prev, [district]: true }));

        try {
            const response = await getDataByDistrict(tenantId, district, token);
            setDistrictData(prev => ({
                ...prev,
                [district]: response.data
            }));
        } catch (error: any) {
            showError(`Failed to load data for ${district}. ${error.response?.data?.message || error.message}`);
        } finally {
            setLoadingDistricts(prev => ({ ...prev, [district]: false }));
        }
    };

    const addDayCard = () => {
        const newId = Math.max(...formData.dayCards.map((card) => card.id)) + 1;
        setFormData((prev) => ({
            ...prev,
            dayCards: [
                ...prev.dayCards,
                {
                    id: newId,
                    selectedDay: "",
                    visitingPlaces: [],
                    selectedPlaces: [],
                    selectedHotels: [],
                    remarks: "",
                },
            ],
        }));
        // Scroll to new card after render
        setTimeout(() => {
            const el = dayCardRefs.current[newId];
            if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
            }
        }, 100);
    };

    const removeDayCard = (cardId: number) => {
        if (formData.dayCards.length > 1) {
            setFormData((prev) => ({
                ...prev,
                dayCards: prev.dayCards.filter((card) => card.id !== cardId),
            }));
        }
    };

    const handleTemplateSelect = (templateId: number) => {
        setFormData((prev) => ({
            ...prev,
            selectedTemplate: templateId.toString(),
        }));
    };

    const isStepValid = (step: number): boolean => {
        switch (step) {
            case 1:
                return (
                    formData.customerName.trim() !== "" &&
                    formData.country.trim() !== "" &&
                    formData.mobileNo.trim() !== "" &&
                    formData.numberOfPassengers.trim() !== "" &&
                    formData.daysAndNights.trim() !== ""
                );
            case 2:
                return (
                    formData.selectedRoutes.length > 0 &&
                    formData.dayCards.every(card =>
                        card.selectedDay.trim() !== "" &&
                        card.visitingPlaces.length > 0
                    ) &&
                    formData.dayCards.every(card => !!generatedDescriptions[card.id])
                );
            case 3:
                return formData.selectedTemplate.trim() !== "";
            default:
                return false;
        }
    };

    const handleNext = () => {
        if (currentStep === 2) {
            const basicValid =
                formData.selectedRoutes.length > 0 &&
                formData.dayCards.every(
                    (card) =>
                        card.selectedDay.trim() !== "" &&
                        card.visitingPlaces.length > 0
                );
            if (!basicValid) {
                showError("Please fill in all required fields for each day");
                return;
            }
            const missingDescDays = formData.dayCards
                .map((card, i) => ({ card, i }))
                .filter(({ card }) => !generatedDescriptions[card.id])
                .map(({ i }) => i + 1);
            if (missingDescDays.length > 0) {
                showError(
                    `Please generate AI descriptions for Day ${missingDescDays.join(", ")} before proceeding`
                );
                return;
            }
            setCurrentStep(3);
            return;
        }
        if (isStepValid(currentStep)) {
            setCurrentStep((prev) => Math.min(prev + 1, 3));
        } else {
            showError("Please fill in all required fields");
        }
    };

    const handlePrevious = () => {
        setCurrentStep((prev) => Math.max(prev - 1, 1));
    };

    const handleGenerate = async () => {
        if (!isStepValid(3)) {
            showError("Please select a template");
            return;
        }

        setIsLoading(true);
        try {
            const selected = templates.find(
                (t) => (t.id ?? t.templateId)?.toString() === formData.selectedTemplate
            );
            if (!selected) {
                showError("Selected template not found");
                return;
            }
            let templateDesign: any;
            try {
                const raw = selected.templateDesign;
                templateDesign = typeof raw === "string" ? JSON.parse(raw) : raw;
            } catch {
                showError("Failed to parse template design.");
                return;
            }
            setGeneratedReport({ templateDesign, template: selected });
            setReportModalOpen(true);
            showSuccess("Report generated successfully!");
        } catch (error) {
            showError("Failed to generate report. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        if (
            confirm(
                "Are you sure you want to cancel? Your progress will be lost."
            )
        ) {
            setFormData({
                customerName: "",
                country: "",
                mobileNo: "",
                transportationMode: "",
                numberOfPassengers: "",
                daysAndNights: "",
                selectedRoute: "",
                selectedRoutes: [],
                dayCards: [
                    {
                        id: 1,
                        selectedDay: "",
                        visitingPlaces: [],
                        selectedPlaces: [],
                        selectedHotels: [],
                        remarks: ""
                    }
                ],
                selectedTemplate: "",
            });
            setCurrentStep(1);
        }
    };

    return (
        <div>
            <Navbar>
                <div className="agency">
                    <div className="agency-header">
                        <h2 className="agency-title">Report Generation</h2>
                        <button
                            type="button"
                            className="infoBtn"
                            aria-label="Report generation guide"
                            onClick={() => setInfoOpen(true)}
                        >
                            <InfoOutline fontSize="small" />
                        </button>
                    </div>

                    {/* Step Indicator */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "20px",
                            marginBottom: "32px",
                        }}
                    >
                        {[1, 2, 3].map((step) => (
                            <div
                                key={step}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                }}
                            >
                                <div
                                    style={{
                                        width: "40px",
                                        height: "40px",
                                        borderRadius: "50%",
                                        background:
                                            step <= currentStep
                                                ? "linear-gradient(135deg, var(--color-primary) 0%, #F0A94D 100%)"
                                                : "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
                                        color:
                                            step <= currentStep
                                                ? "white"
                                                : "#6b7280",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: "700",
                                        fontSize: "14px",
                                    }}
                                >
                                    {step}
                                </div>
                                <div
                                    style={{
                                        fontSize: "13px",
                                        color:
                                            step <= currentStep
                                                ? "var(--color-primary)"
                                                : "#6b7280",
                                        fontWeight: "600",
                                    }}
                                >
                                    {step === 1 && "Customer Info"}
                                    {step === 2 && "Main Process"}
                                    {step === 3 && "Generation"}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Form Content */}
                    <div
                        style={{
                            background:
                                "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.8) 100%)",
                            borderRadius: "16px",
                            border: "1px solid rgba(255, 123, 46, 0.1)",
                            padding: "32px",
                            backdropFilter: "blur(20px)",
                            boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
                        }}
                    >
                        {/* Step 1: Customer Info */}
                        {currentStep === 1 && (
                            <div className="formGroup">
                                <h3 style={{ marginTop: 0, marginBottom: 20 }}>
                                    Customer Information
                                </h3>
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(2, minmax(0, 1fr))",
                                        gap: "20px",
                                    }}
                                >
                                    <div className="formField">
                                        <label className="formField-label">
                                            Customer Name
                                        </label>
                                        <input
                                            type="text"
                                            name="customerName"
                                            className="formField-input"
                                            placeholder="Enter customer name"
                                            value={formData.customerName}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="formField">
                                        <label className="formField-label">
                                            Country
                                        </label>
                                        <input
                                            type="text"
                                            name="country"
                                            className="formField-input"
                                            placeholder="Enter customer country"
                                            value={formData.country}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="formField">
                                        <label className="formField-label">
                                            Mobile No
                                        </label>
                                        <input
                                            type="tel"
                                            name="mobileNo"
                                            className="formField-input"
                                            placeholder="Enter customer mobile no"
                                            value={formData.mobileNo}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="formField">
                                        <label className="formField-label">
                                            Transportation Type{" "}
                                            <span style={{ fontSize: "11px", color: "#9ca3af", fontWeight: 400 }}>(Optional)</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="transportationMode"
                                            className="formField-input"
                                            placeholder="Enter transportation type (optional)"
                                            value={formData.transportationMode}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="formField">
                                        <label className="formField-label">
                                            Number of Passengers
                                        </label>
                                        <input
                                            type="text"
                                            name="numberOfPassengers"
                                            className="formField-input"
                                            placeholder="Enter passengers count"
                                            value={formData.numberOfPassengers}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="formField">
                                        <label className="formField-label">
                                            Days & Nights
                                        </label>
                                        <input
                                            type="text"
                                            name="daysAndNights"
                                            className="formField-input"
                                            placeholder="Enter days and nights count"
                                            value={formData.daysAndNights}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Main Process */}
                        {currentStep === 2 && (
                            <div className="formGroup">
                                <h3 style={{ marginTop: 0, marginBottom: 20 }}>
                                    Main Process
                                </h3>

                                {/* Multi-Select Route */}
                                <div className="formField">
                                    <label className="formField-label">
                                        Select Routes
                                    </label>
                                    <div ref={dropdownRef} style={{ position: "relative" }}>
                                        <div
                                            className="formField-input"
                                            onClick={() => setDropdownOpen(!dropdownOpen)}
                                            style={{
                                                cursor: "pointer",
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "center",
                                                minHeight: "40px"
                                            }}
                                        >
                                            <span style={{ color: formData.selectedRoutes.length === 0 ? "#9ca3af" : "#374151" }}>
                                                {formData.selectedRoutes.length === 0
                                                    ? "Select routes"
                                                    : `${formData.selectedRoutes.length} route(s) selected`}
                                            </span>
                                            <span style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>▼</span>
                                        </div>

                                        {dropdownOpen && (
                                            <div style={{
                                                position: "absolute",
                                                top: "100%",
                                                left: 0,
                                                right: 0,
                                                zIndex: 1000,
                                                background: "white",
                                                border: "1px solid #d1d5db",
                                                borderRadius: "8px",
                                                maxHeight: "200px",
                                                overflowY: "auto",
                                                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                                            }}>
                                                {routeOptions.map((route) => (
                                                    <div
                                                        key={route}
                                                        onClick={() => handleRouteToggle(route)}
                                                        style={{
                                                            padding: "10px 12px",
                                                            cursor: "pointer",
                                                            background: formData.selectedRoutes.includes(route) ? "#fef3f2" : "transparent",
                                                            borderBottom: "1px solid #f3f4f6",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            gap: "8px",
                                                            fontSize: "14px"
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            if (!formData.selectedRoutes.includes(route)) {
                                                                e.currentTarget.style.background = "#f9fafb";
                                                            }
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            if (!formData.selectedRoutes.includes(route)) {
                                                                e.currentTarget.style.background = "transparent";
                                                            }
                                                        }}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={formData.selectedRoutes.includes(route)}
                                                            onChange={() => { }} // Handled by parent onClick
                                                            style={{ pointerEvents: "none" }}
                                                        />
                                                        {route}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Selected Routes Display */}
                                    {formData.selectedRoutes.length > 0 && (
                                        <div style={{
                                            marginTop: "12px",
                                            padding: "12px",
                                            background: "#f8f9fa",
                                            borderRadius: "8px",
                                            border: "1px solid #e9ecef"
                                        }}>
                                            <div style={{
                                                fontSize: "13px",
                                                color: "#6b7280",
                                                marginBottom: "8px",
                                                fontWeight: "600"
                                            }}>Selected Routes:</div>
                                            <div style={{
                                                display: "flex",
                                                flexWrap: "wrap",
                                                gap: "8px"
                                            }}>
                                                {formData.selectedRoutes.map((route, index) => (
                                                    <div key={route} style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        background: "linear-gradient(135deg, var(--color-primary) 0%, #F0A94D 100%)",
                                                        color: "white",
                                                        padding: "6px 12px",
                                                        borderRadius: "20px",
                                                        fontSize: "12px",
                                                        fontWeight: "600"
                                                    }}>
                                                        {index > 0 && (
                                                            <span style={{ marginRight: "4px" }}>→</span>
                                                        )}
                                                        {route}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRouteToggle(route);
                                                            }}
                                                            style={{
                                                                background: "transparent",
                                                                border: "none",
                                                                color: "white",
                                                                cursor: "pointer",
                                                                fontSize: "14px",
                                                                padding: "0",
                                                                marginLeft: "4px",
                                                                lineHeight: 1
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Day Cards */}
                                <div style={{ marginTop: "24px" }}>
                                    <div style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginBottom: "16px"
                                    }}>
                                        <h4 style={{
                                            margin: 0,
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "var(--color-text-black)"
                                        }}>Trip Days</h4>
                                        <button
                                            type="button"
                                            onClick={addDayCard}
                                            disabled={formData.selectedRoutes.length === 0}
                                            style={{
                                                background: formData.selectedRoutes.length === 0
                                                    ? "linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)"
                                                    : "linear-gradient(135deg, var(--color-primary) 0%, #F0A94D 100%)",
                                                color: formData.selectedRoutes.length === 0 ? "#6b7280" : "white",
                                                border: "none",
                                                borderRadius: "6px",
                                                padding: "8px 16px",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                cursor: formData.selectedRoutes.length === 0 ? "not-allowed" : "pointer",
                                                transition: "all 0.2s",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px",
                                                opacity: formData.selectedRoutes.length === 0 ? 0.6 : 1
                                            }}
                                        >
                                            + Add Day
                                        </button>
                                    </div>

                                    {formData.dayCards.map((dayCard, index) => (
                                        <div
                                            key={dayCard.id}
                                            ref={(el) => { dayCardRefs.current[dayCard.id] = el; }}
                                            style={{
                                                background: formData.selectedRoutes.length === 0
                                                    ? "linear-gradient(135deg, rgba(243, 244, 246, 0.9) 0%, rgba(229, 231, 235, 0.9) 100%)"
                                                    : "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)",
                                                border: formData.selectedRoutes.length === 0
                                                    ? "1px solid rgba(209, 213, 219, 0.3)"
                                                    : "1px solid rgba(255, 123, 46, 0.15)",
                                                borderRadius: "12px",
                                                padding: "20px",
                                                marginBottom: "16px",
                                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                                                position: "relative",
                                                opacity: formData.selectedRoutes.length === 0 ? 0.5 : 1,
                                                pointerEvents: formData.selectedRoutes.length === 0 ? "none" : "auto"
                                            }}
                                        >
                                            {/* Card Header */}
                                            <div style={{
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                marginBottom: "16px",
                                                paddingBottom: "12px",
                                                borderBottom: "1px solid rgba(255, 123, 46, 0.1)"
                                            }}>
                                                <div style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "12px"
                                                }}>
                                                    <div style={{
                                                        width: "32px",
                                                        height: "32px",
                                                        borderRadius: "50%",
                                                        background: "linear-gradient(135deg, var(--color-primary) 0%, #F0A94D 100%)",
                                                        color: "white",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        fontSize: "12px",
                                                        fontWeight: "700"
                                                    }}>
                                                        {index + 1}
                                                    </div>
                                                    <h5 style={{
                                                        margin: 0,
                                                        fontSize: "14px",
                                                        fontWeight: "600",
                                                        color: "var(--color-text-black)"
                                                    }}>Day {index + 1}</h5>
                                                </div>
                                                {formData.dayCards.length > 1 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDayCard(dayCard.id)}
                                                        style={{
                                                            background: "transparent",
                                                            border: "1px solid #ef4444",
                                                            color: "#ef4444",
                                                            borderRadius: "6px",
                                                            padding: "4px 8px",
                                                            fontSize: "12px",
                                                            cursor: "pointer",
                                                            transition: "all 0.2s"
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = "#ef4444";
                                                            e.currentTarget.style.color = "white";
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = "transparent";
                                                            e.currentTarget.style.color = "#ef4444";
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>

                                            {/* Card Content */}
                                            <div style={{
                                                display: "grid",
                                                gridTemplateColumns: "1fr",
                                                gap: "16px",
                                                marginBottom: "16px"
                                            }}>
                                                {/* Date Selection */}
                                                <div className="formField">
                                                    <label className="formField-label" style={{ fontSize: "12px" }}>
                                                        Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        className="formField-input"
                                                        value={dayCard.selectedDay}
                                                        onChange={(e) => handleDayCardChange(dayCard.id, 'selectedDay', e.target.value)}
                                                        style={{ fontSize: "13px" }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Visiting Places */}
                                            <div className="formField" style={{ marginBottom: "16px" }}>
                                                <label className="formField-label" style={{ fontSize: "12px" }}>
                                                    Visiting Places
                                                </label>
                                                {formData.selectedRoutes.length === 0 ? (
                                                    <div style={{
                                                        padding: "16px",
                                                        borderRadius: "8px",
                                                        background: "linear-gradient(135deg, #fef3f2 0%, #fee2e2 100%)",
                                                        border: "1px solid #fecaca",
                                                        textAlign: "center",
                                                        marginTop: "8px"
                                                    }}>
                                                        <div style={{
                                                            fontSize: "24px",
                                                            marginBottom: "8px"
                                                        }}>🔒</div>
                                                        <div style={{
                                                            fontSize: "12px",
                                                            color: "#ef4444",
                                                            fontWeight: "600"
                                                        }}>Please select routes first</div>
                                                        <div style={{
                                                            fontSize: "11px",
                                                            color: "#dc2626",
                                                            marginTop: "4px"
                                                        }}>Routes will appear here as visiting places</div>
                                                    </div>
                                                ) : (
                                                    <div style={{
                                                        display: "flex",
                                                        flexWrap: "wrap",
                                                        gap: "8px",
                                                        marginTop: "8px"
                                                    }}>
                                                        {formData.selectedRoutes.map((location) => (
                                                            <label
                                                                key={location}
                                                                style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "6px",
                                                                    cursor: "pointer",
                                                                    padding: "6px 12px",
                                                                    borderRadius: "6px",
                                                                    background: dayCard.visitingPlaces.includes(location)
                                                                        ? "linear-gradient(135deg, var(--color-primary) 0%, #F0A94D 100%)"
                                                                        : "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
                                                                    color: dayCard.visitingPlaces.includes(location)
                                                                        ? "white"
                                                                        : "#6b7280",
                                                                    transition: "all 0.2s",
                                                                    fontWeight: "500",
                                                                    fontSize: "12px",
                                                                }}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    checked={dayCard.visitingPlaces.includes(location)}
                                                                    onChange={() => handleDayCardLocationToggle(dayCard.id, location)}
                                                                    style={{ cursor: "pointer", transform: "scale(0.9)" }}
                                                                    disabled={loadingDistricts[location]}
                                                                />
                                                                {loadingDistricts[location] ? (
                                                                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                                                        <span style={{ fontSize: "10px" }}>⏳</span>
                                                                        {location}
                                                                    </span>
                                                                ) : (
                                                                    location
                                                                )}
                                                                {districtData[location] && (
                                                                    <span style={{
                                                                        fontSize: "10px",
                                                                        background: "rgba(255, 255, 255, 0.3)",
                                                                        padding: "2px 6px",
                                                                        borderRadius: "10px",
                                                                        marginLeft: "4px"
                                                                    }}>
                                                                        {Array.isArray(districtData[location])
                                                                            ? `${districtData[location].length} places`
                                                                            : 'Data loaded'
                                                                        }
                                                                    </span>
                                                                )}
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Display loaded place data for selected visiting places */}
                                            {dayCard.visitingPlaces.some(place => districtData[place]) && (
                                                <div className="formField" style={{ marginBottom: "16px" }}>
                                                    <label className="formField-label" style={{ fontSize: "12px" }}>
                                                        Available Places in Selected Districts
                                                    </label>
                                                    <div style={{
                                                        marginTop: "8px",
                                                        background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                                                        borderRadius: "8px",
                                                        padding: "12px",
                                                        border: "1px solid #dee2e6",
                                                        maxHeight: "200px",
                                                        overflowY: "auto"
                                                    }}>
                                                        {dayCard.visitingPlaces.map(place => {
                                                            if (!districtData[place]) return null;

                                                            return (
                                                                <div key={place} style={{ marginBottom: "12px" }}>
                                                                    <div style={{
                                                                        fontSize: "13px",
                                                                        fontWeight: "600",
                                                                        color: "var(--color-primary)",
                                                                        marginBottom: "6px",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "6px"
                                                                    }}>
                                                                        📍 {place}
                                                                        <span style={{
                                                                            fontSize: "10px",
                                                                            background: "var(--color-primary)",
                                                                            color: "white",
                                                                            padding: "2px 6px",
                                                                            borderRadius: "10px"
                                                                        }}>
                                                                            {Array.isArray(districtData[place]) ? districtData[place].length : 0} places
                                                                        </span>
                                                                    </div>
                                                                    <div style={{
                                                                        display: "grid",
                                                                        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                                                                        gap: "6px",
                                                                        paddingLeft: "12px"
                                                                    }}>
                                                                        {Array.isArray(districtData[place]) && districtData[place].map((item: any, index: number) => (
                                                                            <label
                                                                                key={index}
                                                                                style={{
                                                                                    fontSize: "11px",
                                                                                    padding: "6px 8px",
                                                                                    background: dayCard.selectedPlaces.some(p => p.place === item) ? "#e8f5e8" : "white",
                                                                                    borderRadius: "4px",
                                                                                    border: dayCard.selectedPlaces.some(p => p.place === item) ? "1px solid #4ade80" : "1px solid #e5e7eb",
                                                                                    color: "#374151",
                                                                                    cursor: "pointer",
                                                                                    transition: "all 0.2s",
                                                                                    display: "flex",
                                                                                    alignItems: "center",
                                                                                    gap: "6px",
                                                                                    userSelect: "none"
                                                                                }}
                                                                                onMouseEnter={(e) => {
                                                                                    if (!dayCard.selectedPlaces.some(p => p.place === item)) {
                                                                                        e.currentTarget.style.background = "#f3f4f6";
                                                                                    }
                                                                                }}
                                                                                onMouseLeave={(e) => {
                                                                                    if (!dayCard.selectedPlaces.some(p => p.place === item)) {
                                                                                        e.currentTarget.style.background = "white";
                                                                                    }
                                                                                }}
                                                                            >
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={dayCard.selectedPlaces.some(p => p.place === item)}
                                                                                    onChange={() => handlePlaceToggle(dayCard.id, place, item)}
                                                                                    style={{ cursor: "pointer", transform: "scale(0.8)" }}
                                                                                />
                                                                                {item.name || item.placeName || `Place ${index + 1}`}
                                                                            </label>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Display selected place details */}
                                            {dayCard.selectedPlaces.length > 0 && (
                                                <div className="formField" style={{ marginBottom: "16px" }}>
                                                    <label className="formField-label" style={{ fontSize: "12px" }}>
                                                        Selected Places Details ({dayCard.selectedPlaces.length} selected)
                                                    </label>
                                                    <div style={{
                                                        marginTop: "8px",
                                                        background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                                                        borderRadius: "8px",
                                                        padding: "12px",
                                                        border: "1px solid #bae6fd",
                                                        maxHeight: "300px",
                                                        overflowY: "auto"
                                                    }}>
                                                        {dayCard.selectedPlaces.map((selectedPlace, index) => (
                                                            <div key={index} style={{
                                                                marginBottom: "12px",
                                                                padding: "12px",
                                                                background: "white",
                                                                borderRadius: "8px",
                                                                border: "1px solid #e5e7eb",
                                                                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)"
                                                            }}>
                                                                <div style={{
                                                                    display: "flex",
                                                                    justifyContent: "space-between",
                                                                    alignItems: "flex-start",
                                                                    marginBottom: "8px"
                                                                }}>
                                                                    <div>
                                                                        <div style={{
                                                                            fontSize: "13px",
                                                                            fontWeight: "600",
                                                                            color: "#1f2937",
                                                                            marginBottom: "2px"
                                                                        }}>
                                                                            {selectedPlace.place.name || selectedPlace.place.placeName || "Unknown Place"}
                                                                        </div>
                                                                        <div style={{
                                                                            fontSize: "11px",
                                                                            color: "#6b7280",
                                                                            background: "#f3f4f6",
                                                                            padding: "2px 6px",
                                                                            borderRadius: "4px",
                                                                            display: "inline-block"
                                                                        }}>
                                                                            📍 {selectedPlace.district}
                                                                        </div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handlePlaceToggle(dayCard.id, selectedPlace.district, selectedPlace.place)}
                                                                        style={{
                                                                            background: "transparent",
                                                                            border: "1px solid #ef4444",
                                                                            color: "#ef4444",
                                                                            borderRadius: "4px",
                                                                            padding: "2px 6px",
                                                                            fontSize: "10px",
                                                                            cursor: "pointer"
                                                                        }}
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                                {/* Display specific fields: description, fun facts and images */}
                                                                <div style={{ marginTop: "8px" }}>
                                                                    {/* Description */}
                                                                    {(selectedPlace.place.description || selectedPlace.place.Description) && (
                                                                        <div style={{
                                                                            marginBottom: "12px",
                                                                            padding: "8px",
                                                                            background: "#f8f9fa",
                                                                            borderRadius: "6px",
                                                                            border: "1px solid #e9ecef"
                                                                        }}>
                                                                            <div style={{
                                                                                fontSize: "11px",
                                                                                fontWeight: "600",
                                                                                color: "#495057",
                                                                                marginBottom: "4px"
                                                                            }}>
                                                                                📄 Description
                                                                            </div>
                                                                            <div style={{
                                                                                fontSize: "11px",
                                                                                color: "#6c757d",
                                                                                lineHeight: "1.4"
                                                                            }}>
                                                                                {selectedPlace.place.description || selectedPlace.place.Description}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Fun Facts */}
                                                                    {(selectedPlace.place.funFact) && (
                                                                        <div style={{
                                                                            marginBottom: "12px",
                                                                            padding: "8px",
                                                                            background: "#fff3cd",
                                                                            borderRadius: "6px",
                                                                            border: "1px solid #ffeaa7"
                                                                        }}>
                                                                            <div style={{
                                                                                fontSize: "11px",
                                                                                fontWeight: "600",
                                                                                color: "#856404",
                                                                                marginBottom: "4px"
                                                                            }}>
                                                                                💡 Fun Facts
                                                                            </div>
                                                                            <div style={{
                                                                                fontSize: "11px",
                                                                                color: "#856404",
                                                                                lineHeight: "1.4"
                                                                            }}>
                                                                                {selectedPlace.place.funFact}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Images */}
                                                                    {(() => {
                                                                        // Check for numbered image URLs (image1Url, image2Url, etc.)
                                                                        const imageUrls = [];
                                                                        let imageIndex = 1;

                                                                        // Look for image1Url, image2Url, image3Url, etc.
                                                                        while (selectedPlace.place[`image${imageIndex}Url`]) {
                                                                            imageUrls.push(selectedPlace.place[`image${imageIndex}Url`]);
                                                                            imageIndex++;
                                                                        }

                                                                        // Also check for other common image field patterns as fallback
                                                                        if (imageUrls.length === 0) {
                                                                            const otherImageFields = selectedPlace.place.images || selectedPlace.place.Images || selectedPlace.place.image || selectedPlace.place.Image;
                                                                            if (otherImageFields) {
                                                                                const imageArray = Array.isArray(otherImageFields) ? otherImageFields : [otherImageFields];
                                                                                imageUrls.push(...imageArray);
                                                                            }
                                                                        }

                                                                        return imageUrls.length > 0;
                                                                    })() && (
                                                                            <div style={{
                                                                                marginBottom: "8px",
                                                                                padding: "8px",
                                                                                background: "#e8f5e8",
                                                                                borderRadius: "6px",
                                                                                border: "1px solid #c3e6c3"
                                                                            }}>
                                                                                <div style={{
                                                                                    fontSize: "11px",
                                                                                    fontWeight: "600",
                                                                                    color: "#155724",
                                                                                    marginBottom: "6px"
                                                                                }}>
                                                                                    🖼️ Images
                                                                                </div>
                                                                                <div style={{
                                                                                    display: "flex",
                                                                                    flexWrap: "wrap",
                                                                                    gap: "6px"
                                                                                }}>
                                                                                    {(() => {
                                                                                        // Collect numbered image URLs
                                                                                        const imageUrls = [];
                                                                                        let imageIndex = 1;

                                                                                        while (selectedPlace.place[`image${imageIndex}Url`]) {
                                                                                            imageUrls.push(selectedPlace.place[`image${imageIndex}Url`]);
                                                                                            imageIndex++;
                                                                                        }

                                                                                        // Fallback to other image fields if no numbered URLs found
                                                                                        if (imageUrls.length === 0) {
                                                                                            const otherImageFields = selectedPlace.place.images || selectedPlace.place.Images || selectedPlace.place.image || selectedPlace.place.Image;
                                                                                            if (otherImageFields) {
                                                                                                const imageArray = Array.isArray(otherImageFields) ? otherImageFields : [otherImageFields];
                                                                                                imageUrls.push(...imageArray);
                                                                                            }
                                                                                        }

                                                                                        return imageUrls.map((imgUrl: any, imgIndex: number) => {
                                                                                            // Handle base64 images
                                                                                            const getImageSrc = (url: any) => {
                                                                                                const urlString = typeof url === 'string' ? url : url.url || url.src || url.path;

                                                                                                // Check if it's already a data URI
                                                                                                if (urlString && urlString.startsWith('data:')) {
                                                                                                    return urlString;
                                                                                                }

                                                                                                // Check if it's base64 without data URI prefix
                                                                                                if (urlString && (urlString.match(/^[A-Za-z0-9+/]*={0,2}$/) && urlString.length > 100)) {
                                                                                                    // Assume it's base64, add data URI prefix (defaulting to jpeg)
                                                                                                    return `data:image/jpeg;base64,${urlString}`;
                                                                                                }

                                                                                                // Regular URL
                                                                                                return urlString;
                                                                                            };

                                                                                            return (
                                                                                                <div key={imgIndex} style={{
                                                                                                    background: "white",
                                                                                                    borderRadius: "4px",
                                                                                                    overflow: "hidden",
                                                                                                    border: "1px solid #dee2e6",
                                                                                                    maxWidth: "120px"
                                                                                                }}>
                                                                                                    <img
                                                                                                        src={getImageSrc(imgUrl)}
                                                                                                        alt={`Place image ${imgIndex + 1}`}
                                                                                                        style={{
                                                                                                            width: "100%",
                                                                                                            height: "80px",
                                                                                                            objectFit: "cover",
                                                                                                            display: "block"
                                                                                                        }}
                                                                                                        onError={(e) => {
                                                                                                            e.currentTarget.style.display = 'none';
                                                                                                            (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block';
                                                                                                        }}
                                                                                                    />
                                                                                                    <div style={{
                                                                                                        display: "none",
                                                                                                        padding: "8px",
                                                                                                        fontSize: "10px",
                                                                                                        color: "#6c757d",
                                                                                                        textAlign: "center"
                                                                                                    }}>
                                                                                                        Image not available
                                                                                                    </div>
                                                                                                </div>
                                                                                            );
                                                                                        });
                                                                                    })()}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}



                                            {/* Partnership Services Selection */}
                                            <div className="formField">
                                                <label className="formField-label" style={{ fontSize: "12px" }}>
                                                    Day {index + 1} - Partnership Services
                                                </label>
                                                {dayCard.visitingPlaces.length === 0 ? (
                                                    <div style={{
                                                        padding: "12px",
                                                        borderRadius: "6px",
                                                        background: "#fef3f2",
                                                        border: "1px solid #fecaca",
                                                        textAlign: "center",
                                                        fontSize: "11px",
                                                        color: "#ef4444"
                                                    }}>
                                                        🏨 Select visiting places first to see available services
                                                    </div>
                                                ) : (
                                                    <div>
                                                        {dayCard.visitingPlaces.map(district => {
                                                            const partnerships = partnershipData[district];
                                                            if (!partnerships || !Array.isArray(partnerships)) return null;

                                                            // Separate partnerships by type
                                                            const transportServices = partnerships.filter((p: any) => p.partnershipType === 1);
                                                            const activities = partnerships.filter((p: any) => p.partnershipType === 2);

                                                            return (
                                                                <div key={district} style={{
                                                                    marginBottom: "16px",
                                                                    padding: "12px",
                                                                    background: "#f8f9fa",
                                                                    borderRadius: "8px",
                                                                    border: "1px solid #e9ecef"
                                                                }}>
                                                                    <div style={{
                                                                        fontSize: "12px",
                                                                        fontWeight: "600",
                                                                        color: "#495057",
                                                                        marginBottom: "12px",
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: "6px"
                                                                    }}>
                                                                        📍 Services in {district}
                                                                        {loadingPartnerships[district] && (
                                                                            <span style={{ fontSize: "10px" }}>⏳ Loading...</span>
                                                                        )}
                                                                    </div>

                                                                    {/* Transport Services */}
                                                                    {transportServices.length > 0 && (
                                                                        <div style={{ marginBottom: "12px" }}>
                                                                            <div style={{
                                                                                fontSize: "11px",
                                                                                fontWeight: "600",
                                                                                color: "#0066cc",
                                                                                marginBottom: "6px",
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: "4px"
                                                                            }}>
                                                                                🚗 Transport Services ({transportServices.length})
                                                                            </div>
                                                                            <div style={{
                                                                                display: "flex",
                                                                                flexWrap: "wrap",
                                                                                gap: "6px",
                                                                                marginBottom: "8px"
                                                                            }}>
                                                                                {transportServices.map((transport: any, idx: number) => (
                                                                                    <label
                                                                                        key={idx}
                                                                                        style={{
                                                                                            fontSize: "10px",
                                                                                            padding: "6px 8px",
                                                                                            background: dayCard.selectedHotels.some(h => h.hotel === transport && h.type === 'transport') ? "#e0f2fe" : "white",
                                                                                            borderRadius: "4px",
                                                                                            border: dayCard.selectedHotels.some(h => h.hotel === transport && h.type === 'transport') ? "1px solid #0ea5e9" : "1px solid #e5e7eb",
                                                                                            color: "#374151",
                                                                                            cursor: "pointer",
                                                                                            transition: "all 0.2s",
                                                                                            display: "flex",
                                                                                            alignItems: "center",
                                                                                            gap: "4px",
                                                                                            userSelect: "none"
                                                                                        }}
                                                                                    >
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={dayCard.selectedHotels.some(h => h.hotel === transport && h.type === 'transport')}
                                                                                            onChange={() => handleServiceToggle(dayCard.id, district, transport, 'transport')}
                                                                                            style={{ cursor: "pointer", transform: "scale(0.8)" }}
                                                                                        />
                                                                                        🚗 {transport.name || `Transport ${idx + 1}`}
                                                                                    </label>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Activities */}
                                                                    {activities.length > 0 && (
                                                                        <div>
                                                                            <div style={{
                                                                                fontSize: "11px",
                                                                                fontWeight: "600",
                                                                                color: "#dc2626",
                                                                                marginBottom: "6px",
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: "4px"
                                                                            }}>
                                                                                🎯 Activities ({activities.length})
                                                                            </div>
                                                                            <div style={{
                                                                                display: "flex",
                                                                                flexWrap: "wrap",
                                                                                gap: "6px"
                                                                            }}>
                                                                                {activities.map((activity: any, idx: number) => (
                                                                                    <label
                                                                                        key={idx}
                                                                                        style={{
                                                                                            fontSize: "10px",
                                                                                            padding: "6px 8px",
                                                                                            background: dayCard.selectedHotels.some(h => h.hotel === activity && h.type === 'activity') ? "#fef3f2" : "white",
                                                                                            borderRadius: "4px",
                                                                                            border: dayCard.selectedHotels.some(h => h.hotel === activity && h.type === 'activity') ? "1px solid #ef4444" : "1px solid #e5e7eb",
                                                                                            color: "#374151",
                                                                                            cursor: "pointer",
                                                                                            transition: "all 0.2s",
                                                                                            display: "flex",
                                                                                            alignItems: "center",
                                                                                            gap: "4px",
                                                                                            userSelect: "none"
                                                                                        }}
                                                                                    >
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={dayCard.selectedHotels.some(h => h.hotel === activity && h.type === 'activity')}
                                                                                            onChange={() => handleServiceToggle(dayCard.id, district, activity, 'activity')}
                                                                                            style={{ cursor: "pointer", transform: "scale(0.8)" }}
                                                                                        />
                                                                                        🎯 {activity.name || `Activity ${idx + 1}`}
                                                                                    </label>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}

                                                                    {/* Select Night Hotel */}
                                                                    <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #e9ecef" }}>
                                                                        <div style={{
                                                                            fontSize: "11px",
                                                                            fontWeight: "600",
                                                                            color: "#9333ea",
                                                                            marginBottom: "6px",
                                                                            display: "flex",
                                                                            alignItems: "center",
                                                                            gap: "4px"
                                                                        }}>
                                                                            🏨 Select Night Hotel
                                                                        </div>
                                                                        <div style={{
                                                                            display: "flex",
                                                                            flexWrap: "wrap",
                                                                            gap: "6px"
                                                                        }}>
                                                                            {partnerships.filter((p: any) => p.partnershipType === 0).length > 0 ? (
                                                                                partnerships.filter((p: any) => p.partnershipType === 0).map((hotel: any, idx: number) => (
                                                                                    <label
                                                                                        key={idx}
                                                                                        style={{
                                                                                            fontSize: "10px",
                                                                                            padding: "6px 8px",
                                                                                            background: dayCard.selectedHotels.some(h => h.hotel === hotel && h.type === 'hotel') ? "#f3e8ff" : "white",
                                                                                            borderRadius: "4px",
                                                                                            border: dayCard.selectedHotels.some(h => h.hotel === hotel && h.type === 'hotel') ? "1px solid #9333ea" : "1px solid #e5e7eb",
                                                                                            color: "#374151",
                                                                                            cursor: "pointer",
                                                                                            transition: "all 0.2s",
                                                                                            display: "flex",
                                                                                            alignItems: "center",
                                                                                            gap: "4px",
                                                                                            userSelect: "none"
                                                                                        }}
                                                                                    >
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={dayCard.selectedHotels.some(h => h.hotel === hotel && h.type === 'hotel')}
                                                                                            onChange={() => handleServiceToggle(dayCard.id, district, hotel, 'hotel')}
                                                                                            style={{ cursor: "pointer", transform: "scale(0.8)" }}
                                                                                        />
                                                                                        🏨 {hotel.name || `Hotel ${idx + 1}`}
                                                                                    </label>
                                                                                ))
                                                                            ) : (
                                                                                <div style={{
                                                                                    fontSize: "10px",
                                                                                    color: "#6b7280",
                                                                                    padding: "6px 0"
                                                                                }}>
                                                                                    No hotels available
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {/* Selected Services Summary */}
                                                        {dayCard.selectedHotels.length > 0 && (
                                                            <div style={{
                                                                marginTop: "8px",
                                                                padding: "12px",
                                                                background: "#f0f9ff",
                                                                borderRadius: "8px",
                                                                border: "1px solid #bae6fd"
                                                            }}>
                                                                <div style={{
                                                                    fontSize: "11px",
                                                                    fontWeight: "600",
                                                                    color: "#0369a1",
                                                                    marginBottom: "8px"
                                                                }}>
                                                                    Selected Services ({dayCard.selectedHotels.length})
                                                                </div>
                                                                <div style={{
                                                                    display: "flex",
                                                                    flexWrap: "wrap",
                                                                    gap: "6px"
                                                                }}>
                                                                    {dayCard.selectedHotels.map((selectedService, idx) => {
                                                                        const icon = selectedService.type === 'transport' ? '🚗' : '🎯';
                                                                        const bgColor = selectedService.type === 'transport' ? '#e0f2fe' : '#fef3f2';
                                                                        const borderColor = selectedService.type === 'transport' ? '#0ea5e9' : '#ef4444';

                                                                        return (
                                                                            <div key={idx} style={{
                                                                                fontSize: "10px",
                                                                                padding: "4px 8px",
                                                                                background: bgColor,
                                                                                borderRadius: "4px",
                                                                                border: `1px solid ${borderColor}`,
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                gap: "4px"
                                                                            }}>
                                                                                <span>{icon} {selectedService.hotel.name || 'Service'}</span>
                                                                                <span style={{ color: "#6b7280", fontSize: "9px" }}>({selectedService.district})</span>
                                                                                <button
                                                                                    onClick={() => handleServiceToggle(dayCard.id, selectedService.district, selectedService.hotel, selectedService.type)}
                                                                                    style={{
                                                                                        background: "transparent",
                                                                                        border: "none",
                                                                                        color: "#ef4444",
                                                                                        fontSize: "10px",
                                                                                        cursor: "pointer",
                                                                                        padding: "0",
                                                                                        marginLeft: "2px"
                                                                                    }}
                                                                                >
                                                                                    ×
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Service Details with Images */}
                                                        {dayCard.selectedHotels.length > 0 && dayCard.selectedHotels.some(h => h.hotel.images && h.hotel.images.length > 0) && (
                                                            <div style={{
                                                                marginTop: "12px",
                                                                padding: "12px",
                                                                background: "#fafafa",
                                                                borderRadius: "8px",
                                                                border: "1px solid #e5e7eb"
                                                            }}>
                                                                <div style={{
                                                                    fontSize: "11px",
                                                                    fontWeight: "600",
                                                                    color: "#374151",
                                                                    marginBottom: "8px",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "6px"
                                                                }}>
                                                                    📋 Service Details & Images
                                                                </div>
                                                                {dayCard.selectedHotels.map((selectedService, idx) => {
                                                                    if (!selectedService.hotel.images || selectedService.hotel.images.length === 0) return null;

                                                                    const icon = selectedService.type === 'transport' ? '🚗' : '🎯';
                                                                    const typeLabel = selectedService.type === 'transport' ? 'Transport Service' : 'Activity';

                                                                    return (
                                                                        <div key={idx} style={{
                                                                            marginBottom: "16px",
                                                                            padding: "12px",
                                                                            background: "white",
                                                                            borderRadius: "8px",
                                                                            border: "1px solid #e5e7eb",
                                                                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)"
                                                                        }}>
                                                                            <div style={{
                                                                                display: "flex",
                                                                                justifyContent: "space-between",
                                                                                alignItems: "flex-start",
                                                                                marginBottom: "8px"
                                                                            }}>
                                                                                <div>
                                                                                    <div style={{
                                                                                        fontSize: "12px",
                                                                                        fontWeight: "600",
                                                                                        color: "#1f2937",
                                                                                        marginBottom: "4px",
                                                                                        display: "flex",
                                                                                        alignItems: "center",
                                                                                        gap: "6px"
                                                                                    }}>
                                                                                        {icon} {selectedService.hotel.name || 'Service'}
                                                                                    </div>
                                                                                    <div style={{
                                                                                        fontSize: "10px",
                                                                                        color: "#6b7280",
                                                                                        background: "#f3f4f6",
                                                                                        padding: "2px 6px",
                                                                                        borderRadius: "4px",
                                                                                        display: "inline-block",
                                                                                        marginRight: "6px"
                                                                                    }}>
                                                                                        📍 {selectedService.district}
                                                                                    </div>
                                                                                    <div style={{
                                                                                        fontSize: "10px",
                                                                                        color: selectedService.type === 'transport' ? "#0369a1" : "#dc2626",
                                                                                        background: selectedService.type === 'transport' ? "#e0f2fe" : "#fef3f2",
                                                                                        padding: "2px 6px",
                                                                                        borderRadius: "4px",
                                                                                        display: "inline-block"
                                                                                    }}>
                                                                                        {typeLabel}
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Service Description */}
                                                                            {selectedService.hotel.description && (
                                                                                <div style={{
                                                                                    marginBottom: "8px",
                                                                                    padding: "8px",
                                                                                    background: "#f8f9fa",
                                                                                    borderRadius: "6px",
                                                                                    border: "1px solid #e9ecef"
                                                                                }}>
                                                                                    <div style={{
                                                                                        fontSize: "10px",
                                                                                        fontWeight: "600",
                                                                                        color: "#495057",
                                                                                        marginBottom: "4px"
                                                                                    }}>
                                                                                        📄 Description
                                                                                    </div>
                                                                                    <div style={{
                                                                                        fontSize: "10px",
                                                                                        color: "#6c757d",
                                                                                        lineHeight: "1.4"
                                                                                    }}>
                                                                                        {selectedService.hotel.description}
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {/* Images */}
                                                                            <div style={{
                                                                                display: "grid",
                                                                                gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                                                                                gap: "8px"
                                                                            }}>
                                                                                {selectedService.hotel.images.map((image: string, imageIdx: number) => {
                                                                                    // Handle base64 images
                                                                                    const getImageSrc = (imgData: any) => {
                                                                                        const imgString = typeof imgData === 'string' ? imgData : imgData.url || imgData.src || imgData.path;

                                                                                        // Check if it's already a data URI
                                                                                        if (imgString && imgString.startsWith('data:')) {
                                                                                            return imgString;
                                                                                        }

                                                                                        // Check if it's base64 without data URI prefix
                                                                                        if (imgString && (imgString.match(/^[A-Za-z0-9+/]*={0,2}$/) && imgString.length > 100)) {
                                                                                            return `data:image/jpeg;base64,${imgString}`;
                                                                                        }

                                                                                        // Regular URL
                                                                                        return imgString;
                                                                                    };

                                                                                    return (
                                                                                        <div key={imageIdx} style={{
                                                                                            background: "#f8f9fa",
                                                                                            borderRadius: "6px",
                                                                                            overflow: "hidden",
                                                                                            border: "1px solid #dee2e6"
                                                                                        }}>
                                                                                            <img
                                                                                                src={getImageSrc(image)}
                                                                                                alt={`${selectedService.hotel.name || 'Service'} image ${imageIdx + 1}`}
                                                                                                style={{
                                                                                                    width: "100%",
                                                                                                    height: "80px",
                                                                                                    objectFit: "cover",
                                                                                                    display: "block"
                                                                                                }}
                                                                                                onError={(e) => {
                                                                                                    e.currentTarget.style.display = 'none';
                                                                                                    const parent = e.currentTarget.parentElement;
                                                                                                    if (parent) {
                                                                                                        parent.innerHTML = `<div style="padding: 8px; fontSize: 9px; color: #6c757d; textAlign: center;">Image not available</div>`;
                                                                                                    }
                                                                                                }}
                                                                                            />
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Generate Day Description */}
                                            <div style={{
                                                marginTop: "20px",
                                                paddingTop: "16px",
                                                borderTop: "1px solid rgba(255, 123, 46, 0.1)"
                                            }}>
                                                {(() => {
                                                    const isReadyToGenerate =
                                                        dayCard.selectedDay.trim() !== "" &&
                                                        dayCard.visitingPlaces.length > 0;
                                                    const isGenerating = generatingDescriptionFor === dayCard.id;
                                                    const isDisabled = !isReadyToGenerate || isGenerating;
                                                    return (
                                                        <>
                                                            {!isReadyToGenerate && (
                                                                <div style={{
                                                                    fontSize: "11px",
                                                                    color: "#9ca3af",
                                                                    marginBottom: "8px",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    gap: "4px"
                                                                }}>
                                                                    ⚠️ Select a date and at least one visiting place to enable AI generation
                                                                </div>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleGenerateDescription(dayCard, index)}
                                                                disabled={isDisabled}
                                                                style={{
                                                                    background: isDisabled ? 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' : 'white',
                                                                    border: isDisabled ? '2px solid #d1d5db' : '2px solid transparent',
                                                                    backgroundImage: isDisabled ? 'none' : 'linear-gradient(white, white), linear-gradient(90deg, #00d4ff 0%, #a855f7 25%, #ec4899 50%, #ef4444 75%, #f97316 100%)',
                                                                    backgroundOrigin: 'border-box',
                                                                    backgroundClip: isDisabled ? 'unset' : 'padding-box, border-box',
                                                                    color: isDisabled ? '#9ca3af' : '#a855f7',
                                                                    fontWeight: '600',
                                                                    padding: '8px 16px',
                                                                    borderRadius: '8px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    cursor: isDisabled ? 'not-allowed' : 'pointer',
                                                                    transition: 'all 0.3s ease',
                                                                    fontSize: '13px',
                                                                    opacity: isDisabled ? 0.6 : 1,
                                                                    marginBottom: '12px'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (!isDisabled) {
                                                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                                                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                                                                    }
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                                    e.currentTarget.style.boxShadow = 'none';
                                                                }}
                                                            >
                                                                {isGenerating ? (
                                                                    <CircularProgress size={14} sx={{ color: '#a855f7' }} />
                                                                ) : (
                                                                    <SmartToyIcon fontSize="small" style={isDisabled ? { color: '#9ca3af' } : {
                                                                        background: 'linear-gradient(90deg, #00d4ff 0%, #a855f7 25%, #ec4899 50%, #ef4444 75%, #f97316 100%)',
                                                                        WebkitBackgroundClip: 'text',
                                                                        WebkitTextFillColor: 'transparent',
                                                                        backgroundClip: 'text'
                                                                    }} />
                                                                )}
                                                                <span style={isDisabled ? {} : {
                                                                    background: 'linear-gradient(90deg, #00d4ff 0%, #a855f7 25%, #ec4899 50%, #ef4444 75%, #f97316 100%)',
                                                                    WebkitBackgroundClip: 'text',
                                                                    WebkitTextFillColor: 'transparent',
                                                                    backgroundClip: 'text'
                                                                }}>
                                                                    {isGenerating
                                                                        ? 'Generating...'
                                                                        : `Generate Day ${index + 1} Description`}
                                                                </span>
                                                            </button>
                                                        </>
                                                    );
                                                })()}

                                                {/* Generated Description Output */}
                                                {generatedDescriptions[dayCard.id] && (
                                                    <div style={{
                                                        background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                                                        border: '1px solid #d8b4fe',
                                                        borderRadius: '10px',
                                                        padding: '14px',
                                                    }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '6px',
                                                            marginBottom: '10px',
                                                            fontSize: '12px',
                                                            fontWeight: '700',
                                                            color: '#7c3aed'
                                                        }}>
                                                            <SmartToyIcon fontSize="small" style={{ fontSize: '14px' }} />
                                                            AI Generated — Day {index + 1} Description
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#374151', lineHeight: '1.7' }}>
                                                            {generatedDescriptions[dayCard.id].split('\n').map((line, i) => (
                                                                <div key={i} style={{ marginBottom: line.startsWith('•') ? '4px' : '0' }}>
                                                                    {line}
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleGenerateDescription(dayCard, index)}
                                                            style={{
                                                                marginTop: '10px',
                                                                background: 'transparent',
                                                                border: '1px solid #c084fc',
                                                                color: '#7c3aed',
                                                                borderRadius: '6px',
                                                                padding: '4px 10px',
                                                                fontSize: '11px',
                                                                cursor: 'pointer',
                                                                fontWeight: '600'
                                                            }}
                                                        >
                                                            ↺ Regenerate
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Template Selection */}
                        {currentStep === 3 && (
                            <div className="formGroup">
                                <h3 style={{ marginTop: 0, marginBottom: 20 }}>
                                    Select Template
                                </h3>
                                <p
                                    style={{
                                        fontSize: "13px",
                                        color: "#6b7280",
                                        marginBottom: "20px",
                                    }}
                                >
                                    Choose a template for your report
                                    generation:
                                </p>
                                {loadingTemplates ? (
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", gap: "12px", color: "#6b7280", fontSize: "13px" }}>
                                        <CircularProgress size={20} sx={{ color: "var(--color-primary)" }} />
                                        Loading templates...
                                    </div>
                                ) : templates.length === 0 ? (
                                    <div style={{ padding: "32px", textAlign: "center", color: "#6b7280", fontSize: "13px", background: "#f9fafb", borderRadius: "12px", border: "1px dashed #e5e7eb" }}>
                                        <div style={{ fontSize: "32px", marginBottom: "8px" }}>📭</div>
                                        No templates assigned to your account.
                                    </div>
                                ) : (
                                    <div
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                                            gap: "16px",
                                        }}
                                    >
                                        {templates.map((template) => {
                                            const templateId = template.id ?? template.templateId;
                                            const isSelected = formData.selectedTemplate === templateId?.toString();
                                            const thumbnail = template.templateThumbnail;
                                            const thumbnailSrc = thumbnail
                                                ? thumbnail.startsWith("data:")
                                                    ? thumbnail
                                                    : `data:image/png;base64,${thumbnail}`
                                                : null;
                                            return (
                                                <div
                                                    key={templateId}
                                                    onClick={() => handleTemplateSelect(templateId)}
                                                    style={{
                                                        borderRadius: "12px",
                                                        border: isSelected
                                                            ? "2px solid var(--color-primary)"
                                                            : "1px solid #e5e7eb",
                                                        background: isSelected
                                                            ? "linear-gradient(135deg, rgba(255, 123, 46, 0.08) 0%, rgba(255, 123, 46, 0.03) 100%)"
                                                            : "white",
                                                        cursor: "pointer",
                                                        transition: "all 0.2s",
                                                        overflow: "hidden",
                                                        boxShadow: isSelected
                                                            ? "0 0 0 3px rgba(255, 123, 46, 0.2)"
                                                            : "0 1px 4px rgba(0,0,0,0.06)",
                                                    }}
                                                >
                                                    {/* Thumbnail */}
                                                    <div style={{
                                                        width: "100%",
                                                        height: "140px",
                                                        background: "#f3f4f6",
                                                        overflow: "hidden",
                                                        position: "relative",
                                                        borderBottom: "1px solid #e5e7eb",
                                                    }}>
                                                        {thumbnailSrc ? (
                                                            <img
                                                                src={thumbnailSrc}
                                                                alt={template.name ?? template.templateName ?? "Template"}
                                                                style={{
                                                                    width: "100%",
                                                                    height: "100%",
                                                                    objectFit: "cover",
                                                                    display: "block",
                                                                }}
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = "none";
                                                                    const parent = e.currentTarget.parentElement;
                                                                    if (parent) parent.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;font-size:36px;">📄</div>`;
                                                                }}
                                                            />
                                                        ) : (
                                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "36px" }}>
                                                                📄
                                                            </div>
                                                        )}
                                                        {isSelected && (
                                                            <div style={{
                                                                position: "absolute",
                                                                top: "8px",
                                                                right: "8px",
                                                                background: "var(--color-primary)",
                                                                color: "white",
                                                                borderRadius: "50%",
                                                                width: "22px",
                                                                height: "22px",
                                                                display: "flex",
                                                                alignItems: "center",
                                                                justifyContent: "center",
                                                                fontSize: "13px",
                                                                fontWeight: "700",
                                                            }}>✓</div>
                                                        )}
                                                    </div>
                                                    {/* Info */}
                                                    <div style={{ padding: "10px 12px" }}>
                                                        <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--color-text-black)" }}>
                                                            {template.name ?? template.templateName ?? `Template ${templateId}`}
                                                        </div>
                                                        {template.description && (
                                                            <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "3px" }}>
                                                                {template.description}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                marginTop: "32px",
                                paddingTop: "24px",
                                borderTop:
                                    "1px solid rgba(0, 0, 0, 0.06)",
                            }}
                        >
                            <div style={{ display: "flex", gap: "12px" }}>
                                <button
                                    onClick={handlePrevious}
                                    disabled={currentStep === 1}
                                    className="btn btn--secondary"
                                    style={{
                                        opacity: currentStep === 1 ? 0.5 : 1,
                                        cursor:
                                            currentStep === 1
                                                ? "not-allowed"
                                                : "pointer",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "6px",
                                    }}
                                >
                                    <NavigateBefore
                                        fontSize="small"
                                        style={{ marginRight: "4px" }}
                                    />
                                    Previous
                                </button>
                                <button
                                    onClick={handleCancel}
                                    className="btn btn--secondary"
                                    style={{
                                        color: "#6b7280",
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                            <div style={{ display: "flex", gap: "12px" }}>
                                {currentStep < 3 ? (
                                    <button
                                        onClick={handleNext}
                                        className="btn btn--orange"
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "6px",
                                        }}
                                    >
                                        Next
                                        <NavigateNext fontSize="small" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isLoading}
                                        className="btn btn--success"
                                        style={{
                                            opacity: isLoading ? 0.7 : 1,
                                        }}
                                    >
                                        {isLoading
                                            ? "Generating..."
                                            : "Generate"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Modal */}
                {infoOpen && (
                    <div
                        className="ddModal"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Report generation guide"
                    >
                        <button
                            type="button"
                            className="ddModal-backdrop"
                            aria-label="Close"
                            onClick={() => setInfoOpen(false)}
                        />

                        <div className="ddModal-card">
                            <div className="ddModal-title">
                                Report Generation Guide
                            </div>
                            <div
                                className="ddModal-subtitle"
                                style={{ textAlign: "left", marginTop: 8 }}
                            >
                                Follow these steps to generate a travel report:
                            </div>
                            <div className="ddModal-content">
                                <ol>
                                    <li>
                                        <strong>Customer Info:</strong> Enter
                                        customer details including name, country,
                                        mobile number, and trip preferences.
                                    </li>
                                    <li>
                                        <strong>Main Process:</strong> Select the
                                        route, date, visiting places, and accommodation
                                        details for the itinerary.
                                    </li>
                                    <li>
                                        <strong>Template Selection:</strong> Choose
                                        your preferred template format for the final
                                        report.
                                    </li>
                                    <li>
                                        Click <strong>Generate</strong> to create
                                        the report with all the provided information.
                                    </li>
                                </ol>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Overlay */}
                {isLoading && (
                    <div
                        className="globalLoader"
                        role="status"
                        aria-live="polite"
                    >
                        <div
                            style={{
                                fontSize: "14px",
                                color: "#6b7280",
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "32px",
                                    marginBottom: "12px",
                                }}
                            >
                                ⏳
                            </div>
                            Generating your report...
                        </div>
                    </div>
                )}

                {/* AI Thinking Modal */}
                {generatingDescriptionFor !== null && (
                    <div className="ddModal" role="dialog" aria-modal="true" aria-label="AI Processing">
                        <div className="ddModal-backdrop" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }} />
                        <div className="ddModal-card" style={{ maxWidth: '400px' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <SmartToyIcon style={{ fontSize: 40, color: 'white' }} />
                            </div>
                            <div className="ddModal-title" style={{ fontSize: '22px', marginBottom: '10px' }}>
                                Thinking...
                            </div>
                            <div className="ddModal-subtitle" style={{ marginBottom: '28px' }}>
                                Crafting an engaging itinerary description for Day {formData.dayCards.findIndex(c => c.id === generatingDescriptionFor) + 1}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>
                                <CircularProgress
                                    size={40}
                                    sx={{
                                        color: '#764ba2',
                                        '& .MuiCircularProgress-circle': { strokeLinecap: 'round' }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* ───────────── Report Preview Modal ───────────── */}
                {reportModalOpen && generatedReport && (() => {
                    // ── helpers ──────────────────────────────────────────
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
                    const totalPages = (generatedReport.templateDesign?.pages?.length ?? 1) + 1 + formData.dayCards.length;

                    // ── shared HTML builder ───────────────────────────────
                    const buildReportHTML = (bodyExtra = '') => {
                        const content = document.getElementById('report-print-content');
                        if (!content) return '';
                        return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Travel Report – ${formData.customerName}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; font-family: 'Segoe UI', Arial, sans-serif; }
  @page { size: 700px 991px; margin: 0; }
  @media print {
    html, body { background: white !important; }
    @page { size: 700px 991px; margin: 0; }
    body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    .rpt-page-wrap { page-break-after: always !important; break-after: page !important;
      margin-bottom: 0 !important; height: 991px !important; overflow: hidden !important;
      display: block !important; }
    .rpt-page-label { display: none !important; }
    #rpt-canvas { padding: 0 !important; gap: 0 !important; }
    img { max-width: 100% !important; display: block !important; }
  }
  .rpt-page-label { text-align: center; color: rgba(80,80,80,0.5); font-size: 11px;
    margin-bottom: 10px; letter-spacing: 0.06em; font-family: sans-serif; }
  .rpt-page-wrap { margin-bottom: 48px; flex-shrink: 0; }
  #rpt-canvas { padding: 44px 24px 60px; display: flex; flex-direction: column; align-items: center; gap: 0; }
  .rpt-img-grid { display: grid; }
  .rpt-img-grid img { width: 100%; height: 70px; object-fit: cover; display: block; }
  .rpt-hero-img { position: absolute; top: 0; height: 100%; object-fit: cover; filter: brightness(0.45); display: block; }
</style>
</head>
<body>
<div id="rpt-canvas">${content.innerHTML}</div>
${bodyExtra}
</body>
</html>`;
                    };

                    // ── shared filename helper ────────────────────────────
                    const reportFilename = (() => {
                        const name = formData.customerName.trim().replace(/\s+/g, '_') || 'TravelReport';
                        const digits = (formData.mobileNo ?? '').replace(/\D/g, '');
                        const last4 = digits.length > 0 ? digits.slice(-4).padStart(4, '0') : '0000';
                        return `${name}_${last4}`;
                    })();

                    // ── export as PDF (print dialog) ──────────────────────
                    const handleExportPDF = () => {
                        setExportMenuOpen(false);
                        const content = document.getElementById('report-print-content');
                        if (!content) return;
                        const printWin = window.open('', '_blank');
                        if (!printWin) { alert('Pop-ups are blocked. Please allow pop-ups for this site.'); return; }

                        const scriptTag = '<' + 'script>' +
                            'var imgs=Array.from(document.images),total=imgs.length,loaded=0;' +
                            'function tryPrint(){setTimeout(function(){window.focus();window.print();},600);}' +
                            'if(total===0){tryPrint();}' +
                            'else{imgs.forEach(function(img){' +
                            '  if(img.complete){if(++loaded>=total)tryPrint();}' +
                            '  else{img.onload=img.onerror=function(){if(++loaded>=total)tryPrint();};}' +
                            '});}' +
                            '</' + 'script>';

                        const css = [
                            '*, *::before, *::after { box-sizing: border-box; }',
                            'html, body { margin: 0; padding: 0; background: #fff; }',
                            '@page { size: 700px 991px; margin: 0; }',
                            '@media print {',
                            '  @page { size: 700px 991px; margin: 0; }',
                            '  body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
                            '  .rpt-page-label { display: none !important; }',
                            '  .rpt-page-wrap { page-break-after: always !important; break-after: page !important;',
                            '    height: 991px !important; overflow: hidden !important;',
                            '    margin: 0 !important; padding: 0 !important; display: block !important; }',
                            '  #rpt-canvas { padding: 0 !important; gap: 0 !important; background: white !important; }',
                            '  img { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }',
                            '}',
                            '.rpt-page-wrap { margin-bottom: 48px; }',
                            '#rpt-canvas { padding: 44px 24px 60px; display: flex; flex-direction: column; align-items: center; gap: 0; }',
                            '.rpt-img-grid { display: grid; }',
                            '.rpt-hero-img { position: absolute; top: 0; height: 100%; object-fit: cover; filter: brightness(0.45); display: block; }',
                        ].join('\n');

                        printWin.document.write(
                            '<!DOCTYPE html><html><head><meta charset="utf-8"/>' +
                            '<title>' + reportFilename + '</title>' +
                            '<style>' + css + '</style>' +
                            '</head><body>' +
                            '<div id="rpt-canvas">' + content.innerHTML + '</div>' +
                            scriptTag +
                            '</body></html>'
                        );
                        printWin.document.close();
                    };

                    // ── export as HTML ────────────────────────────────────
                    const handleExportHTML = () => {
                        setExportMenuOpen(false);
                        const html = buildReportHTML();
                        if (!html) return;
                        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${reportFilename}.html`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    };

                    // ── shared page shell ─────────────────────────────────
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

                    // ── section header helper ─────────────────────────────
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
                            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                            {/* ── top bar ── */}
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
                                        <div style={{ color: 'white', fontWeight: 700, fontSize: '15px', lineHeight: 1 }}>Travel Report</div>
                                        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '3px' }}>
                                            {generatedReport.template.name ?? generatedReport.template.templateName} · {totalPages} pages
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {/* ── Export split button ── */}
                                    <div style={{ position: 'relative' }}>
                                        {/* main + chevron row */}
                                        <div style={{
                                            display: 'flex', borderRadius: '8px', overflow: 'visible',
                                            boxShadow: '0 4px 14px rgba(255,123,46,0.35)',
                                        }}>
                                            {/* main action — Export PDF */}
                                            <button
                                                onClick={handleExportPDF}
                                                style={{
                                                    background: 'linear-gradient(135deg, #FF7B2E 0%, #F0A94D 100%)',
                                                    border: 'none', borderRadius: '8px 0 0 8px',
                                                    color: 'white', padding: '7px 16px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px', fontWeight: 700,
                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                    transition: 'opacity 0.15s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                                            >
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                    <polyline points="7 10 12 15 17 10" />
                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                </svg>
                                                Export PDF
                                            </button>
                                            {/* divider */}
                                            <div style={{ width: '1px', background: 'rgba(255,255,255,0.3)', flexShrink: 0, alignSelf: 'stretch' }} />
                                            {/* chevron toggle */}
                                            <button
                                                onClick={() => setExportMenuOpen(o => !o)}
                                                style={{
                                                    background: 'linear-gradient(135deg, #F0A94D 0%, #FF7B2E 100%)',
                                                    border: 'none', borderRadius: '0 8px 8px 0',
                                                    color: 'white', padding: '7px 9px',
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                    transition: 'opacity 0.15s',
                                                }}
                                                onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; }}
                                                onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                                            >
                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"
                                                    style={{ transform: exportMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s' }}>
                                                    <polyline points="6 9 12 15 18 9" />
                                                </svg>
                                            </button>
                                        </div>
                                        {/* dropdown menu */}
                                        {exportMenuOpen && (
                                            <div style={{
                                                position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                                                background: '#1e1e2e', border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '10px', overflow: 'hidden',
                                                boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                                                minWidth: '170px', zIndex: 100,
                                            }}>
                                                {/* PDF option */}
                                                <button
                                                    onClick={handleExportPDF}
                                                    style={{
                                                        width: '100%', background: 'none', border: 'none',
                                                        color: 'rgba(255,255,255,0.88)', padding: '10px 16px',
                                                        cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                                        display: 'flex', alignItems: 'center', gap: '10px',
                                                        textAlign: 'left', transition: 'background 0.12s',
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,123,46,0.15)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                                                >
                                                    <span style={{ fontSize: '16px' }}>📄</span>
                                                    <div>
                                                        <div>Export as PDF</div>
                                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>Print / save via browser</div>
                                                    </div>
                                                </button>
                                                {/* divider */}
                                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.07)', margin: '0 8px' }} />
                                                {/* HTML option */}
                                                <button
                                                    onClick={handleExportHTML}
                                                    style={{
                                                        width: '100%', background: 'none', border: 'none',
                                                        color: 'rgba(255,255,255,0.88)', padding: '10px 16px',
                                                        cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                                        display: 'flex', alignItems: 'center', gap: '10px',
                                                        textAlign: 'left', transition: 'background 0.12s',
                                                    }}
                                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,179,237,0.15)'; }}
                                                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                                                >
                                                    <span style={{ fontSize: '16px' }}>🌐</span>
                                                    <div>
                                                        <div>Export as HTML</div>
                                                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>Download .html file</div>
                                                    </div>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setReportModalOpen(false)}
                                        style={{
                                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                                            color: 'rgba(255,255,255,0.8)', borderRadius: '8px', padding: '7px 18px',
                                            cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                                    >✕ Close</button>
                                </div>
                            </div>

                            {/* ── scrollable canvas ── */}
                            <div id="report-print-content" style={{
                                flex: 1, overflowY: 'auto', overflowX: 'auto',
                                padding: '44px 24px 60px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px',
                            }}>

                                {/* ════ Template pages (untouched) ════ */}
                                {generatedReport.templateDesign?.pages?.map((page: any, pgIdx: number) => (
                                    <div key={`tpl-${pgIdx}`} className="rpt-page-wrap" style={{ flexShrink: 0, marginBottom: '48px' }}>
                                        <div className="rpt-page-label" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginBottom: '10px', letterSpacing: '0.06em' }}>
                                            PAGE {pgIdx + 1}
                                        </div>
                                        {/* scale 595×842 → 700×991 */}
                                        <div style={{
                                            width: '700px', height: `${Math.round(842 * 700 / 595)}px`,
                                            position: 'relative', overflow: 'hidden', flexShrink: 0,
                                            boxShadow: '0 32px 80px rgba(0,0,0,0.75)', borderRadius: '4px',
                                        }}>
                                            <div style={{
                                                width: '595px', height: '842px', position: 'absolute', top: 0, left: 0,
                                                transform: `scale(${700 / 595})`, transformOrigin: 'top left',
                                                background: generatedReport.templateDesign.background || '#fff',
                                            }}>
                                                {page.elements?.map((el: any, elIdx: number) => {
                                                    const pos: React.CSSProperties = { position: 'absolute', left: el.x, top: el.y, width: el.width, height: el.height };
                                                    if (el.type === 'image') return (
                                                        <img key={el.id || elIdx} src={el.src || el.fallback} alt=""
                                                            style={{ ...pos, objectFit: 'cover', objectPosition: 'center', display: 'block' }}
                                                            onError={(e) => { if (el.fallback && e.currentTarget.src !== el.fallback) e.currentTarget.src = el.fallback; else e.currentTarget.style.display = 'none'; }}
                                                        />
                                                    );
                                                    if (el.type === 'shape') return (
                                                        <div key={el.id || elIdx} style={{ ...pos, background: el.fill || 'transparent', borderRadius: el.borderRadius ? `${el.borderRadius}px` : 0 }} />
                                                    );
                                                    if (el.type === 'text') {
                                                        const ta = (el.textAlign || el.align || 'left') as React.CSSProperties['textAlign'];
                                                        return (
                                                            <div key={el.id || elIdx} style={{ ...pos, fontSize: el.fontSize, fontFamily: el.fontFamily, fontWeight: el.fontWeight, color: el.color || '#000', textAlign: ta, display: 'flex', alignItems: 'center', justifyContent: ta === 'center' ? 'center' : ta === 'right' ? 'flex-end' : 'flex-start', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'visible' }}>
                                                                {el.content}
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(() => {
                                    const infoPage = (generatedReport.templateDesign?.pages?.length ?? 1) + 1;
                                    const customerInitials = formData.customerName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
                                    const infoFields = [
                                        { icon: '👤', label: 'Full Name', value: formData.customerName },
                                        { icon: '🌍', label: 'Country', value: formData.country },
                                        { icon: '📱', label: 'Mobile', value: formData.mobileNo },
                                        { icon: '🗓️', label: 'Duration', value: formData.daysAndNights },
                                        { icon: '👥', label: 'Passengers', value: formData.numberOfPassengers },
                                        ...(formData.transportationMode ? [{ icon: '🚌', label: 'Transport', value: formData.transportationMode }] : []),
                                    ];
                                    return (
                                        <div className="rpt-page-wrap" style={{ flexShrink: 0, marginBottom: '48px' }}>
                                            <div className="rpt-page-label" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginBottom: '10px', letterSpacing: '0.06em' }}>
                                                PAGE {infoPage} · CUSTOMER INFORMATION
                                            </div>
                                            <PageShell>
                                                {/* Hero banner */}
                                                <div style={{
                                                    height: '170px', flexShrink: 0, position: 'relative', overflow: 'hidden',
                                                    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
                                                }}>
                                                    {/* decorative circles */}
                                                    <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '240px', height: '240px', borderRadius: '50%', background: 'rgba(255,123,46,0.12)' }} />
                                                    <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(240,169,77,0.08)' }} />
                                                    <div style={{ position: 'absolute', top: '30px', left: '48px', right: '48px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                                                            {/* initials avatar */}
                                                            <div style={{
                                                                width: '70px', height: '70px', borderRadius: '50%',
                                                                background: 'linear-gradient(135deg, #FF7B2E 0%, #F0A94D 100%)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '26px', fontWeight: 800, color: 'white',
                                                                boxShadow: '0 8px 24px rgba(255,123,46,0.4)', flexShrink: 0,
                                                            }}>{customerInitials || '?'}</div>
                                                            <div>
                                                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '4px' }}>Travel Itinerary</div>
                                                                <div style={{ fontSize: '26px', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>{formData.customerName}</div>
                                                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginTop: '5px' }}>
                                                                    {formData.daysAndNights} · {formData.country}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {/* stat chips */}
                                                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                                            {[
                                                                { v: String(formData.dayCards.length), l: 'Days' },
                                                                { v: String(formData.selectedRoutes.length), l: 'Routes' },
                                                                { v: formData.numberOfPassengers, l: 'Guests' },
                                                            ].map((s, i) => (
                                                                <div key={i} style={{
                                                                    padding: '7px 18px', borderRadius: '20px',
                                                                    background: 'rgba(255,255,255,0.1)',
                                                                    border: '1px solid rgba(255,255,255,0.15)',
                                                                    display: 'flex', alignItems: 'center', gap: '6px',
                                                                }}>
                                                                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#F0A94D' }}>{s.v}</span>
                                                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)' }}>{s.l}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* content area */}
                                                <div style={{ padding: '20px 36px', flex: 1, overflow: 'hidden' }}>
                                                    {/* info cards */}
                                                    <SectionTitle color="#FF7B2E">Booking Details</SectionTitle>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '14px' }}>
                                                        {infoFields.map((f, i) => (
                                                            <div key={i} style={{
                                                                padding: '8px 10px', background: 'white',
                                                                borderRadius: '8px', border: '1px solid #efefef',
                                                                boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                                                            }}>
                                                                <div style={{ fontSize: '13px', marginBottom: '2px' }}>{f.icon}</div>
                                                                <div style={{ fontSize: '9px', color: '#adb5bd', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>{f.label}</div>
                                                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a2e', marginTop: '1px' }}>{f.value}</div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* route timeline */}
                                                    <SectionTitle color="#0369a1">Route Journey</SectionTitle>
                                                    <div style={{
                                                        padding: '10px 14px', background: 'white',
                                                        borderRadius: '10px', border: '1px solid #e0f2fe',
                                                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)', marginBottom: '14px',
                                                    }}>
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0', alignItems: 'center' }}>
                                                            {formData.selectedRoutes.map((route, i) => (
                                                                <span key={route} style={{ display: 'flex', alignItems: 'center' }}>
                                                                    <span style={{
                                                                        padding: '5px 14px', borderRadius: '20px',
                                                                        background: i % 2 === 0
                                                                            ? 'linear-gradient(135deg, #FF7B2E 0%, #F0A94D 100%)'
                                                                            : 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
                                                                        color: 'white', fontSize: '11px', fontWeight: 700,
                                                                    }}>{route}</span>
                                                                    {i < formData.selectedRoutes.length - 1 && (
                                                                        <span style={{ color: '#9ca3af', fontSize: '16px', margin: '0 4px', fontWeight: 300 }}>›</span>
                                                                    )}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* day summary cards */}
                                                    <SectionTitle color="#7c3aed">Day-by-Day Summary</SectionTitle>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                        {formData.dayCards.map((card, ci) => (
                                                            <div key={card.id} style={{
                                                                display: 'flex', alignItems: 'center', gap: '10px',
                                                                padding: '7px 12px', background: 'white',
                                                                borderRadius: '8px', border: '1px solid #f3f0ff',
                                                                boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
                                                            }}>
                                                                <div style={{
                                                                    width: '30px', height: '30px', borderRadius: '50%',
                                                                    background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                                                                    color: 'white', display: 'flex', alignItems: 'center',
                                                                    justifyContent: 'center', fontSize: '11px', fontWeight: 800, flexShrink: 0,
                                                                }}>{ci + 1}</div>
                                                                <div style={{ flex: 1 }}>
                                                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#1a1a2e' }}>
                                                                        Day {ci + 1}
                                                                        {card.selectedDay && <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: '6px', fontSize: '11px' }}>
                                                                            {new Date(card.selectedDay + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                                                        </span>}
                                                                    </div>
                                                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '1px' }}>
                                                                        {card.visitingPlaces.join(' → ')}
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: '4px' }}>
                                                                    {card.selectedPlaces.length > 0 && <span style={{ padding: '2px 8px', background: '#e0f2fe', color: '#0369a1', borderRadius: '10px', fontSize: '10px', fontWeight: 600 }}>{card.selectedPlaces.length} places</span>}
                                                                    {card.selectedHotels.length > 0 && <span style={{ padding: '2px 8px', background: '#f3e8ff', color: '#7c3aed', borderRadius: '10px', fontSize: '10px', fontWeight: 600 }}>{card.selectedHotels.length} services</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* footer */}
                                                <div style={{ padding: '12px 44px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'white' }}>
                                                    <span style={{ fontSize: '10px', color: '#c0c0c0', fontWeight: 600, letterSpacing: '0.05em' }}>DYNODOCS · TRAVEL REPORT</span>
                                                    <span style={{ fontSize: '10px', color: '#c0c0c0' }}>Page {infoPage} of {totalPages}</span>
                                                </div>
                                            </PageShell>
                                        </div>
                                    );
                                })()}

                                {/* ════ Day Detail Pages ════ */}
                                {formData.dayCards.map((dayCard, dayIdx) => {
                                    const pageNum = (generatedReport.templateDesign?.pages?.length ?? 1) + 2 + dayIdx;
                                    // Collect all place images for hero strip
                                    const heroImgs: string[] = [];
                                    dayCard.selectedPlaces.forEach(sp => placeImgs(sp.place).slice(0, 2).forEach(u => heroImgs.push(u)));
                                    // Services with images
                                    const svcColors: Record<string, { bg: string; border: string; text: string; badge: string }> = {
                                        hotel: { bg: '#f5f0ff', border: '#ddd6fe', text: '#5b21b6', badge: '#7c3aed' },
                                        transport: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', badge: '#2563eb' },
                                        activity: { bg: '#fff1f0', border: '#fecaca', text: '#b91c1c', badge: '#dc2626' },
                                    };
                                    return (
                                        <div key={dayCard.id} className="rpt-page-wrap" style={{ flexShrink: 0, marginBottom: '48px' }}>
                                            <div className="rpt-page-label" style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginBottom: '10px', letterSpacing: '0.06em' }}>
                                                PAGE {pageNum} · DAY {dayIdx + 1}
                                            </div>
                                            <PageShell>
                                                {/* ── Day hero banner ── */}
                                                <div style={{
                                                    height: '130px',
                                                    flexShrink: 0, position: 'relative', overflow: 'hidden',
                                                    background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)',
                                                }}>
                                                    {/* background image collage - explicit widths for print */}
                                                    {heroImgs.length > 0 && heroImgs.slice(0, 3).map((src, hi) => {
                                                        const count = Math.min(heroImgs.length, 3);
                                                        return (
                                                            <img key={hi} src={src} alt="" className="rpt-hero-img"
                                                                style={{
                                                                    position: 'absolute', top: 0,
                                                                    left: `${(hi / count) * 100}%`,
                                                                    width: `${100 / count}%`,
                                                                    height: '100%', objectFit: 'cover',
                                                                    filter: 'brightness(0.45)',
                                                                    borderRight: hi < count - 1 ? '2px solid rgba(255,255,255,0.15)' : 'none',
                                                                    display: 'block',
                                                                }}
                                                                onError={e => { e.currentTarget.style.display = 'none'; }}
                                                            />
                                                        );
                                                    })}
                                                    {/* decorative circle */}
                                                    <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,123,46,0.18)' }} />

                                                    {/* day label */}
                                                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 44px', gap: '18px' }}>
                                                        <div style={{
                                                            width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0,
                                                            background: 'linear-gradient(135deg, #FF7B2E 0%, #F0A94D 100%)',
                                                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                            boxShadow: '0 8px 24px rgba(255,123,46,0.5)',
                                                        }}>
                                                            <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.8)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>DAY</span>
                                                            <span style={{ fontSize: '22px', fontWeight: 900, color: 'white', lineHeight: 1 }}>{dayIdx + 1}</span>
                                                        </div>
                                                        <div>
                                                            <div style={{ fontSize: '22px', fontWeight: 800, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                                                                {dayCard.visitingPlaces.join(' · ')}
                                                            </div>
                                                            {dayCard.selectedDay && (
                                                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', marginTop: '4px' }}>
                                                                    {new Date(dayCard.selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* ── Day body ── */}
                                                <div style={{ padding: '16px 36px', flex: 1, background: '#FAFAFA', overflow: 'hidden' }}>

                                                    {/* AI description */}
                                                    {generatedDescriptions[dayCard.id] && (
                                                        <div style={{ marginBottom: '12px' }}>
                                                            <SectionTitle color="#7c3aed">Day Overview</SectionTitle>
                                                            <div style={{
                                                                padding: '10px 14px',
                                                                background: 'linear-gradient(135deg, #faf5ff 0%, #f5f0ff 100%)',
                                                                borderRadius: '8px', border: '1px solid #e9d5ff',
                                                                fontSize: '11px', color: '#374151', lineHeight: 1.6,
                                                            }}>
                                                                {generatedDescriptions[dayCard.id]}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Selected places with images */}
                                                    {dayCard.selectedPlaces.length > 0 && (
                                                        <div style={{ marginBottom: '12px' }}>
                                                            <SectionTitle color="#0369a1">Places to Visit ({dayCard.selectedPlaces.length})</SectionTitle>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                {dayCard.selectedPlaces.map((sp, pi) => {
                                                                    const imgs = placeImgs(sp.place).slice(0, 3);
                                                                    return (
                                                                        <div key={pi} style={{
                                                                            background: 'white', borderRadius: '8px',
                                                                            border: '1px solid #e8f4fd',
                                                                            overflow: 'hidden',
                                                                        }}>
                                                                            {/* CSS grid image strip — print-safe, no flex:1 */}
                                                                            {imgs.length > 0 && (
                                                                                <div style={{
                                                                                    display: 'grid',
                                                                                    gridTemplateColumns: `repeat(${imgs.length}, 1fr)`,
                                                                                    height: '68px', overflow: 'hidden',
                                                                                }}>
                                                                                    {imgs.map((src, ii) => (
                                                                                        <img key={ii} src={src} alt=""
                                                                                            style={{ width: '100%', height: '68px', objectFit: 'cover', display: 'block' }}
                                                                                            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                                                        />
                                                                                    ))}
                                                                                </div>
                                                                            )}
                                                                            {/* place info */}
                                                                            <div style={{ padding: '7px 12px' }}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                                                                                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#0c4a6e' }}>
                                                                                        {sp.place?.name || sp.place?.placeName || 'Place'}
                                                                                    </div>
                                                                                    <span style={{ padding: '1px 8px', background: '#eff6ff', color: '#0369a1', borderRadius: '8px', fontSize: '9px', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                                                        📍 {sp.district}
                                                                                    </span>
                                                                                </div>
                                                                                {(sp.place?.description || sp.place?.Description) && (
                                                                                    <div style={{ fontSize: '10px', color: '#6b7280', lineHeight: 1.5 }}>
                                                                                        {(sp.place.description || sp.place.Description).slice(0, 120)}{(sp.place.description || sp.place.Description).length > 120 ? '…' : ''}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Services booked */}
                                                    {dayCard.selectedHotels.length > 0 && (
                                                        <div style={{ marginBottom: '12px' }}>
                                                            <SectionTitle color="#374151">Services & Accommodations ({dayCard.selectedHotels.length})</SectionTitle>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                                {dayCard.selectedHotels.map((sh, si) => {
                                                                    const imgs = svcImgs(sh.hotel);
                                                                    const svcIcon: Record<string, string> = { hotel: '🏨', transport: '🚗', activity: '🎯' };
                                                                    const c = svcColors[sh.type] ?? svcColors.activity;
                                                                    return (
                                                                        <div key={si} style={{
                                                                            background: 'white', borderRadius: '8px',
                                                                            border: `1px solid ${c.border}`,
                                                                            overflow: 'hidden', display: 'flex', alignItems: 'stretch',
                                                                        }}>
                                                                            {/* left accent bar */}
                                                                            <div style={{ width: '4px', flexShrink: 0, background: c.badge }} />
                                                                            {/* service image — explicit px size, no flex:1 */}
                                                                            {imgs.length > 0 && (
                                                                                <img src={imgs[0]} alt=""
                                                                                    style={{ width: '70px', height: '64px', objectFit: 'cover', flexShrink: 0, display: 'block' }}
                                                                                    onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                                                                                />
                                                                            )}
                                                                            {/* service details */}
                                                                            <div style={{ padding: '7px 12px', flex: 1, minWidth: 0 }}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '2px', flexWrap: 'wrap' }}>
                                                                                    <span style={{ fontSize: '12px' }}>{svcIcon[sh.type] ?? '🎯'}</span>
                                                                                    <span style={{ fontSize: '12px', fontWeight: 700, color: c.text }}>{sh.hotel?.name || 'Service'}</span>
                                                                                    <span style={{ padding: '1px 6px', background: c.bg, color: c.text, borderRadius: '8px', fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', border: `1px solid ${c.border}` }}>
                                                                                        {sh.type}
                                                                                    </span>
                                                                                </div>
                                                                                <div style={{ fontSize: '9px', color: '#9ca3af' }}>📍 {sh.district}</div>
                                                                                {sh.hotel?.description && (
                                                                                    <div style={{ fontSize: '9px', color: '#6b7280', marginTop: '2px', lineHeight: 1.4 }}>
                                                                                        {sh.hotel.description.slice(0, 100)}{sh.hotel.description.length > 100 ? '…' : ''}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Remarks */}
                                                    {dayCard.remarks && (
                                                        <div style={{ marginBottom: '12px' }}>
                                                            <SectionTitle color="#374151">Remarks</SectionTitle>
                                                            <div style={{ padding: '12px 16px', background: 'white', borderRadius: '10px', border: '1px solid #e5e7eb', fontSize: '12px', color: '#374151', lineHeight: 1.7, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                                                                {dayCard.remarks}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* footer */}
                                                <div style={{ padding: '12px 44px', borderTop: '1px solid #efefef', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, background: 'white' }}>
                                                    <span style={{ fontSize: '10px', color: '#c0c0c0', fontWeight: 600, letterSpacing: '0.05em' }}>DYNODOCS · TRAVEL REPORT</span>
                                                    <span style={{ fontSize: '10px', color: '#c0c0c0' }}>Day {dayIdx + 1} of {formData.dayCards.length} · Page {pageNum} of {totalPages}</span>
                                                </div>
                                            </PageShell>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })()}
            </Navbar>
        </div>
    );
}