import { InfoOutline, NavigateNext, NavigateBefore } from "@mui/icons-material";
import { useState, useEffect, useRef } from "react";
import Navbar from "../layouts/Navbar";
import "../styles/agencyData.css";
import { showSuccess, showError } from "../components/Toast";

export default function ReportGeneration() {
    const [infoOpen, setInfoOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(2);
    const [isLoading, setIsLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
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
                selectedHotel: "",
                remarks: ""
            }
        ] as Array<{
            id: number;
            selectedDay: string;
            visitingPlaces: string[];
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

    const handleDayCardLocationToggle = (cardId: number, location: string) => {
        setFormData((prev) => ({
            ...prev,
            dayCards: prev.dayCards.map((card) =>
                card.id === cardId
                    ? {
                          ...card,
                          visitingPlaces: card.visitingPlaces.includes(location)
                              ? card.visitingPlaces.filter((l) => l !== location)
                              : [...card.visitingPlaces, location],
                      }
                    : card
            ),
        }));
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
                                            style={{
                                                background: "linear-gradient(135deg, var(--color-primary) 0%, #F0A94D 100%)",
                                                color: "white",
                                                border: "none",
                                                borderRadius: "6px",
                                                padding: "8px 16px",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                transition: "all 0.2s",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "6px"
                                            }}
                                        >
                                            + Add Day
                                        </button>
                                    </div>
                                    
                                    {formData.dayCards.map((dayCard, index) => (
                                        <div
                                            key={dayCard.id}
                                            style={{
                                                background: "linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)",
                                                border: "1px solid rgba(255, 123, 46, 0.15)",
                                                borderRadius: "12px",
                                                padding: "20px",
                                                marginBottom: "16px",
                                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                                                position: "relative"
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
                                                <div style={{
                                                    display: "flex",
                                                    flexWrap: "wrap",
                                                    gap: "8px",
                                                    marginTop: "8px"
                                                }}>
                                                    {locationCheckpoints.map((location) => (
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
                                                            />
                                                            {location}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>

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