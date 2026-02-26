import { InfoOutline, NavigateNext, NavigateBefore } from "@mui/icons-material";
import { useState } from "react";
import Navbar from "../layouts/Navbar";
import "../styles/agencyData.css";
import { showSuccess, showError } from "../components/Toast";

export default function ReportGeneration() {
    const [infoOpen, setInfoOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        customerName: "",
        country: "",
        mobileNo: "",
        transportationMode: "",
        numberOfPassengers: "",
        daysAndNights: "",
        selectedRoute: "",
        selectedDay: "",
        selectedRoutes: [] as string[],
        visitingPlaces: [] as string[],
        selectedHotel: "",
        remarks: "",
        selectedTemplate: "",
    });

    const routeOptions = [
        "Airport → Kandy → Nuwara Eliya → Bentota → Airport",
        "Colombo → Sigiriya → Kandy → Tea Plantations",
        "South Coast Tour: Mirissa → Tangalle → Arugambe",
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

    const handleLocationToggle = (location: string) => {
        setFormData((prev) => ({
            ...prev,
            visitingPlaces: prev.visitingPlaces.includes(location)
                ? prev.visitingPlaces.filter((l) => l !== location)
                : [...prev.visitingPlaces, location],
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
                    formData.selectedRoute.trim() !== "" &&
                    formData.selectedDay.trim() !== "" &&
                    formData.visitingPlaces.length > 0 &&
                    formData.selectedHotel.trim() !== ""
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
                selectedDay: "",
                selectedRoutes: [],
                visitingPlaces: [],
                selectedHotel: "",
                remarks: "",
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
                selectedDay: "",
                selectedRoutes: [],
                visitingPlaces: [],
                selectedHotel: "",
                remarks: "",
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

                                {/* Select Route */}
                                <div className="formField">
                                    <label className="formField-label">
                                        Select Route
                                    </label>
                                    <select
                                        name="selectedRoute"
                                        className="formField-input"
                                        value={formData.selectedRoute}
                                        onChange={handleInputChange}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <option value="">Select a route</option>
                                        {routeOptions.map((route) => (
                                            <option key={route} value={route}>
                                                {route}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Day Selection */}
                                <div className="formField">
                                    <label className="formField-label">
                                        Day
                                    </label>
                                    <input
                                        type="date"
                                        name="selectedDay"
                                        className="formField-input"
                                        value={formData.selectedDay}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                {/* Routes Checkboxes */}
                                <div className="formField">
                                    <label className="formField-label">
                                        Routes
                                    </label>
                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "12px",
                                        }}
                                    >
                                        {routeOptions.map((route) => (
                                            <label
                                                key={route}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    cursor: "pointer",
                                                    padding: "8px 12px",
                                                    borderRadius: "8px",
                                                    background:
                                                        formData.selectedRoutes.includes(
                                                            route
                                                        )
                                                            ? "rgba(255, 123, 46, 0.1)"
                                                            : "transparent",
                                                    transition: "all 0.2s",
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.selectedRoutes.includes(
                                                        route
                                                    )}
                                                    onChange={() =>
                                                        handleRouteToggle(route)
                                                    }
                                                    style={{ cursor: "pointer" }}
                                                />
                                                <span style={{ fontSize: "13px" }}>
                                                    {route.substring(0, 20)}...
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Visiting Places */}
                                <div className="formField">
                                    <label className="formField-label">
                                        Visiting Places
                                    </label>
                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            gap: "12px",
                                        }}
                                    >
                                        {locationCheckpoints.map((location) => (
                                            <label
                                                key={location}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: "8px",
                                                    cursor: "pointer",
                                                    padding: "10px 16px",
                                                    borderRadius: "8px",
                                                    background:
                                                        formData.visitingPlaces.includes(
                                                            location
                                                        )
                                                            ? "linear-gradient(135deg, var(--color-primary) 0%, #F0A94D 100%)"
                                                            : "linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%)",
                                                    color:
                                                        formData.visitingPlaces.includes(
                                                            location
                                                        )
                                                            ? "white"
                                                            : "#6b7280",
                                                    transition: "all 0.2s",
                                                    fontWeight: "600",
                                                    fontSize: "13px",
                                                }}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.visitingPlaces.includes(
                                                        location
                                                    )}
                                                    onChange={() =>
                                                        handleLocationToggle(
                                                            location
                                                        )
                                                    }
                                                    style={{ cursor: "pointer" }}
                                                />
                                                {location}
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Night Hotel Selection */}
                                <div className="formField">
                                    <label className="formField-label">
                                        Night I - Select Hotel
                                    </label>
                                    <select
                                        name="selectedHotel"
                                        className="formField-input"
                                        value={formData.selectedHotel}
                                        onChange={handleInputChange}
                                        style={{ cursor: "pointer" }}
                                    >
                                        <option value="">Select a hotel</option>
                                        {hotelOptions.map((hotel) => (
                                            <option key={hotel} value={hotel}>
                                                {hotel}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Remarks */}
                                <div className="formField">
                                    <label className="formField-label">
                                        Remarks
                                    </label>
                                    <textarea
                                        name="remarks"
                                        className="formField-textarea"
                                        placeholder="Enter remarks"
                                        value={formData.remarks}
                                        onChange={handleInputChange}
                                    />
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