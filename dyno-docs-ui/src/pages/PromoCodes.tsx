import { useEffect, useMemo, useState } from "react";
import Navbar from "../layouts/Navbar";
import "../styles/promoCodes.css";
import "../styles/agencyData.css";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CircularProgress from "@mui/material/CircularProgress";
import { showError, showSuccess } from "../components/Toast";
import {
    getPromoCodes,
    createPromoCode,
    deletePromoCode,
    type PromoCode,
    type CreatePromoCodePayload,
} from "../services/promo-codes-api";

// Mock token - replace with actual auth token from your auth system
const DD_TOKEN = "mock-token";

const ITEMS_PER_PAGE = 5;

// Helper to format date for input
const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

// Helper to get default valid dates (today to 30 days from now)
const getDefaultDates = () => {
    const today = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(today.getDate() + 30);
    return {
        validFrom: formatDateForInput(today),
        validTo: formatDateForInput(thirtyDaysLater),
    };
};

export default function PromoCodes() {
    // Data state
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Form state
    const defaultDates = getDefaultDates();
    const [formData, setFormData] = useState<CreatePromoCodePayload>({
        code: "",
        discountPercentage: 0,
        isActive: true,
        validFrom: defaultDates.validFrom,
        validTo: defaultDates.validTo,
    });

    // Search & pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Modal state
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [promoToDelete, setPromoToDelete] = useState<PromoCode | null>(null);
    const [infoOpen, setInfoOpen] = useState(false);

    // Fetch promo codes on mount
    useEffect(() => {
        fetchPromoCodes();
    }, []);

    const fetchPromoCodes = async () => {
        try {
            setIsLoading(true);
            const response = await getPromoCodes(DD_TOKEN);
            setPromoCodes(response.data);
        } catch (error) {
            showError("Failed to fetch promo codes");
        } finally {
            setIsLoading(false);
        }
    };

    // Filtered and paginated data
    const filteredCodes = useMemo(() => {
        if (!searchTerm.trim()) return promoCodes;
        const term = searchTerm.toLowerCase();
        return promoCodes.filter(
            (p) =>
                p.code.toLowerCase().includes(term) ||
                (p.isActive ? "active" : "inactive").includes(term)
        );
    }, [promoCodes, searchTerm]);

    const totalPages = Math.ceil(filteredCodes.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentCodes = filteredCodes.slice(startIndex, endIndex);

    // Pagination numbers
    const getPaginationNumbers = (): (number | string)[] => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const pages: (number | string)[] = [];
        pages.push(1);
        if (currentPage > 3) pages.push("...");

        for (
            let i = Math.max(2, currentPage - 1);
            i <= Math.min(totalPages - 1, currentPage + 1);
            i++
        ) {
            if (!pages.includes(i)) pages.push(i);
        }

        if (currentPage < totalPages - 2) pages.push("...");
        if (!pages.includes(totalPages)) pages.push(totalPages);

        return pages;
    };

    // Check if promo code is valid (active and within date range)
    const isPromoValid = (promo: PromoCode): boolean => {
        if (!promo.isActive) return false;
        const now = new Date();
        const validFrom = new Date(promo.validFrom);
        const validTo = new Date(promo.validTo);
        return now >= validFrom && now <= validTo;
    };

    // Form handlers
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "number" ? Number(value) : value,
        }));
    };

    const handleStatusChange = (isActive: boolean) => {
        setFormData((prev) => ({ ...prev, isActive }));
    };

    const handleClear = () => {
        const dates = getDefaultDates();
        setFormData({
            code: "",
            discountPercentage: 0,
            isActive: true,
            validFrom: dates.validFrom,
            validTo: dates.validTo,
        });
    };

    const handleSubmit = async () => {
        // Validation
        if (!formData.code.trim()) {
            showError("Promo code is required");
            return;
        }
        if (formData.discountPercentage <= 0 || formData.discountPercentage > 100) {
            showError("Discount must be between 1 and 100");
            return;
        }
        if (!formData.validFrom || !formData.validTo) {
            showError("Valid from and valid to dates are required");
            return;
        }
        if (new Date(formData.validFrom) > new Date(formData.validTo)) {
            showError("Valid from date must be before valid to date");
            return;
        }

        try {
            setIsSubmitting(true);
            await createPromoCode(formData);
            showSuccess("Promo code created successfully!");
            handleClear();
            fetchPromoCodes();
        } catch (error) {
            showError("Failed to create promo code");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete handlers
    const handleDeleteClick = (promo: PromoCode) => {
        setPromoToDelete(promo);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!promoToDelete) return;

        try {
            setIsDeleting(true);
            await deletePromoCode(promoToDelete.id);
            showSuccess("Promo code deleted successfully");
            setDeleteModalOpen(false);
            setPromoToDelete(null);
            fetchPromoCodes();
        } catch (error) {
            showError("Failed to delete promo code");
        } finally {
            setIsDeleting(false);
        }
    };

    // Format date for display
    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <Navbar>
            <div className="promo">
                {/* Page Header */}
                <header>
                    <div className="agency-header">
                        <div>
                            <h2 className="promo-title">Promo Codes</h2>
                        </div>
                        <button
                            type="button"
                            className="infoBtn"
                            aria-label="Promo code steps"
                            onClick={() => setInfoOpen(true)}
                        >
                            <InfoOutlinedIcon fontSize="small" />
                        </button>
                    </div>
                </header>

                {/* Add Promo Code Form */}
                <section className="panel">
                    <div className="panel-body">
                        <div className="formGroup">
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "20px" }}>
                                <div className="formField">
                                    <label htmlFor="code" className="formField-label">
                                        Promo Code
                                    </label>
                                    <input
                                        id="code"
                                        type="text"
                                        name="code"
                                        className="formField-input"
                                        placeholder="Enter promo code"
                                        value={formData.code}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="formField">
                                    <label
                                        htmlFor="discountPercentage"
                                        className="formField-label"
                                    >
                                        Discount %
                                    </label>
                                    <input
                                        id="discountPercentage"
                                        type="number"
                                        name="discountPercentage"
                                        className="formField-input"
                                        placeholder="Enter percentage"
                                        min={1}
                                        max={100}
                                        value={formData.discountPercentage || ""}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="formField">
                                    <label htmlFor="validFrom" className="formField-label">
                                        Valid From
                                    </label>
                                    <input
                                        id="validFrom"
                                        type="date"
                                        name="validFrom"
                                        className="formField-input"
                                        value={formData.validFrom}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="formField">
                                    <label htmlFor="validTo" className="formField-label">
                                        Valid To
                                    </label>
                                    <input
                                        id="validTo"
                                        type="date"
                                        name="validTo"
                                        className="formField-input"
                                        value={formData.validTo}
                                        onChange={handleInputChange}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: "1 / -1" }}>
                                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                                        <span className="formField-label">Status</span>
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "16px" }}>
                                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                                                <input
                                                    type="radio"
                                                    name="isActive"
                                                    value="true"
                                                    style={{ cursor: "pointer", width: "18px", height: "18px" }}
                                                    checked={formData.isActive === true}
                                                    onChange={() => handleStatusChange(true)}
                                                    disabled={isSubmitting}
                                                />
                                                Active
                                            </label>
                                            <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "13px" }}>
                                                <input
                                                    type="radio"
                                                    name="isActive"
                                                    value="false"
                                                    style={{ cursor: "pointer", width: "18px", height: "18px" }}
                                                    checked={formData.isActive === false}
                                                    onChange={() => handleStatusChange(false)}
                                                    disabled={isSubmitting}
                                                />
                                                Inactive
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px" }}>
                                <button
                                    type="button"
                                    className="btn btn--secondary"
                                    onClick={handleClear}
                                    disabled={isSubmitting}
                                >
                                    Clear
                                </button>
                                <button
                                    type="button"
                                    className="btn btn--orange"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Submitting..." : "Submit"}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Promo Codes Table */}
                <section className="panel">
                    <div className="controls">
                        <div /> {/* Spacer */}
                        <label className="search">
                            <SearchRoundedIcon fontSize="small" aria-hidden="true" />
                            <input
                                placeholder="Search Code"
                                aria-label="Search Code"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </label>
                    </div>

                    <div className="tableWrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Promo Code</th>
                                    <th>Discount</th>
                                    <th>Valid Period</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                                            Loading...
                                        </td>
                                    </tr>
                                ) : currentCodes.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                                            {searchTerm
                                                ? `No results found for "${searchTerm}"`
                                                : "No promo codes available"}
                                        </td>
                                    </tr>
                                ) : (
                                    currentCodes.map((promo) => (
                                        <tr key={promo.id}>
                                            <td>{promo.code}</td>
                                            <td>{promo.discountPercentage}%</td>
                                            <td>
                                                {formatDate(promo.validFrom)} - {formatDate(promo.validTo)}
                                            </td>
                                            <td>
                                                <span
                                                    className={`statusBadge statusBadge--${isPromoValid(promo) ? 'available' : 'used'}`}
                                                >
                                                    {isPromoValid(promo) ? "Active" : "Inactive"}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="iconBtn--delete"
                                                    aria-label="Delete"
                                                    onClick={() => handleDeleteClick(promo)}
                                                >
                                                    <DeleteRoundedIcon fontSize="small" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="footerRow">
                        <div className="panel-hint">
                            <strong>Showing</strong>{" "}
                            <strong style={{ color: "var(--color-primary)" }}>
                                {filteredCodes.length === 0 ? 0 : startIndex + 1}-
                                {Math.min(endIndex, filteredCodes.length)}
                            </strong>{" "}
                            of{" "}
                            <strong style={{ color: "var(--color-primary)" }}>
                                {filteredCodes.length}
                            </strong>{" "}
                            Entries
                        </div>

                        <div className="pagination" aria-label="Pagination">
                            <button
                                type="button"
                                className="pageBtn"
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            {getPaginationNumbers().map((page, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`pageBtn ${page === currentPage ? "pageBtn--active" : ""}`}
                                    onClick={() =>
                                        typeof page === "number" && setCurrentPage(page)
                                    }
                                    disabled={page === "..."}
                                >
                                    {page}
                                </button>
                            ))}
                            <button
                                type="button"
                                className="pageBtn"
                                onClick={() =>
                                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                                }
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {infoOpen && (
                <div className="ddModal" role="dialog" aria-modal="true" aria-label="Promo code guide">
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => setInfoOpen(false)}
                    />

                    <div className="ddModal-card">
                        <div className="ddModal-title">Promo Codes Guide</div>
                        <div className="ddModal-subtitle" style={{ textAlign: "left", marginTop: 8 }}>
                            Quick tips for creating and managing promo codes:
                        </div>
                        <div className="ddModal-content">
                            <ol>
                                <li>Enter the code, discount percentage, valid dates, and status before submitting.</li>
                                <li>Use the Clear action anytime you want to reset the form inputs.</li>
                                <li>Filter the table with the search bar to locate specific codes or statuses.</li>
                                <li>Use the delete action when a promotion should be retired.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && promoToDelete && (
                <div
                    className="ddModal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Confirm delete"
                >
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => {
                            if (!isDeleting) {
                                setDeleteModalOpen(false);
                                setPromoToDelete(null);
                            }
                        }}
                    />

                    <div className="ddModal-card">
                        <div className="ddModal-logo" aria-hidden="true">
                            <DeleteRoundedIcon
                                style={{ fontSize: 48, color: "var(--color-error)" }}
                            />
                        </div>

                        <div className="ddModal-title">Delete Promo Code</div>
                        <div className="ddModal-subtitle">
                            Are you sure you want to delete promo code{" "}
                            <strong>{promoToDelete.code}</strong>? This action cannot be
                            undone.
                        </div>

                        <div className="ddModal-actions">
                            <button
                                type="button"
                                className="ddModal-btn ddModal-btn--ghost"
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setPromoToDelete(null);
                                }}
                                disabled={isDeleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn--danger"
                                onClick={handleConfirmDelete}
                                disabled={isDeleting}
                            >
                                <DeleteRoundedIcon fontSize="small" />
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Loader */}
            {(isLoading || isSubmitting || isDeleting) && (
                <div className="globalLoader" role="status" aria-live="polite">
                    <CircularProgress size={56} sx={{ color: "var(--accent-600, #ff6b00)" }} />
                </div>
            )}
        </Navbar>
    );
}
