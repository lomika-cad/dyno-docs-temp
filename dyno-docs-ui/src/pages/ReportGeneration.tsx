import { InfoOutline, NavigateNext, NavigateBefore } from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import Navbar from "../layouts/Navbar";
import "../styles/agencyData.css";
import { showSuccess, showError } from "../components/Toast";
import { getDataByDistrict } from "../services/agency-data-api";

export default function ReportGeneration() {
    const [infoOpen, setInfoOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(2);
    const [isLoading, setIsLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [districtData, setDistrictData] = useState<{[key: string]: any}>({});
    const [loadingDistricts, setLoadingDistricts] = useState<{[key: string]: boolean}>({});
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
                selectedPlaces: [] as Array<{district: string, place: any}>,
                selectedHotel: "",
                remarks: ""
            }
        ] as Array<{
            id: number;
            selectedDay: string;
            visitingPlaces: string[];
            selectedPlaces: Array<{district: string, place: any}>;
            selectedHotel: string;
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

    const locationCheckpoints = [
        "Airport",
        "Kandy",
        "Nuwara Eliya",
        "Bentota",
    ];

    const hotelOptions = ["Hotel 1", "Hotel 2", "Hotel 3"];

    const templateOptions = [
        { id: 1, name: "Template 1" },
        { id: 2, name: "Template 2" },
        { id: 3, name: "Template 3" },
        { id: 4, name: "Template 4" },
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
                          // If unselecting a visiting place, also remove all selected places from that district
                          selectedPlaces: card.visitingPlaces.includes(location)
                              ? card.selectedPlaces.filter(p => p.district !== location)
                              : card.selectedPlaces
                      }
                    : card
            ),
        }));

        // If selecting (not deselecting) and don't have data for this district, fetch it
        if (!isCurrentlySelected && !districtData[location]) {
            await fetchDistrictData(location);
        }
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
                    selectedHotel: "",
                    remarks: "",
                },
            ],
        }));
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
                    formData.transportationMode.trim() !== "" &&
                    formData.numberOfPassengers.trim() !== "" &&
                    formData.daysAndNights.trim() !== ""
                );
            case 2:
                return (
                    formData.selectedRoutes.length > 0 &&
                    formData.dayCards.every(card => 
                        card.selectedDay.trim() !== "" &&
                        card.visitingPlaces.length > 0 &&
                        card.selectedHotel.trim() !== ""
                    )
                );
            case 3:
                return formData.selectedTemplate.trim() !== "";
            default:
                return false;
        }
    };

    const handleNext = () => {
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
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 2000));
            showSuccess("Report generated successfully!");
            // Reset form
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
                        selectedHotel: "",
                        remarks: ""
                    }
                ],
                selectedTemplate: "",
            });
            setCurrentStep(1);
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
                        selectedHotel: "",
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
                                            Transportation Type
                                        </label>
                                        <input
                                            type="text"
                                            name="transportationMode"
                                            className="formField-input"
                                            placeholder="Enter transportation type"
                                            value={formData.transportationMode}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="formField">
                                        <label className="formField-label">
                                            Number of Passengers
                                        </label>
                                        <input
                                            type="number"
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
                                                            onChange={() => {}} // Handled by parent onClick
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
                                                gridTemplateColumns: "1fr 1fr",
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

                                                {/* Hotel Selection */}
                                                <div className="formField">
                                                    <label className="formField-label" style={{ fontSize: "12px" }}>
                                                        Night {index + 1} - Select Hotel
                                                    </label>
                                                    <select
                                                        className="formField-input"
                                                        value={dayCard.selectedHotel}
                                                        onChange={(e) => handleDayCardChange(dayCard.id, 'selectedHotel', e.target.value)}
                                                        style={{ cursor: "pointer", fontSize: "13px" }}
                                                    >
                                                        <option value="">Select a hotel</option>
                                                        {hotelOptions.map((hotel) => (
                                                            <option key={hotel} value={hotel}>
                                                                {hotel}
                                                            </option>
                                                        ))}
                                                    </select>
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

                                            {/* Remarks */}
                                            <div className="formField">
                                                <label className="formField-label" style={{ fontSize: "12px" }}>
                                                    Remarks
                                                </label>
                                                <textarea
                                                    className="formField-textarea"
                                                    placeholder="Enter remarks for this day"
                                                    value={dayCard.remarks}
                                                    onChange={(e) => handleDayCardChange(dayCard.id, 'remarks', e.target.value)}
                                                    rows={3}
                                                    style={{ fontSize: "13px", resize: "vertical" }}
                                                />
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
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns:
                                            "repeat(auto-fill, minmax(150px, 1fr))",
                                        gap: "16px",
                                    }}
                                >
                                    {templateOptions.map((template) => (
                                        <div
                                            key={template.id}
                                            onClick={() =>
                                                handleTemplateSelect(
                                                    template.id
                                                )
                                            }
                                            style={{
                                                padding: "16px",
                                                borderRadius: "12px",
                                                border:
                                                    formData.selectedTemplate ===
                                                    template.id.toString()
                                                        ? "2px solid var(--color-primary)"
                                                        : "1px solid #e5e7eb",
                                                background:
                                                    formData.selectedTemplate ===
                                                    template.id.toString()
                                                        ? "linear-gradient(135deg, rgba(255, 123, 46, 0.1) 0%, rgba(255, 123, 46, 0.05) 100%)"
                                                        : "linear-gradient(135deg, #f8f9fa 0%, #f3f4f6 100%)",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                textAlign: "center",
                                                minHeight: "120px",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <div>
                                                <div
                                                    style={{
                                                        fontSize: "32px",
                                                        marginBottom: "8px",
                                                    }}
                                                >
                                                    📄
                                                </div>
                                                <div
                                                    style={{
                                                        fontSize: "13px",
                                                        fontWeight: "600",
                                                        color: "var(--color-text-black)",
                                                    }}
                                                >
                                                    {template.name}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
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
            </Navbar>
        </div>
    );
}