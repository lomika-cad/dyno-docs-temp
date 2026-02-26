import { useEffect, useMemo, useState } from "react";
import { Eye, PenSquare, Trash2 } from "lucide-react";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Navbar from "../layouts/Navbar";
import "../styles/customerProfile.css";
import "../styles/agencyData.css";
import { CircularProgress, Grid } from "@mui/material";
import { SearchRounded } from "@mui/icons-material";
import {
    createCustomer,
    deleteCustomer,
    getCustomers,
    updateCustomer,
} from "../services/customer-api";
import { showError, showInfo, showSuccess } from "../components/Toast";
import trashImg from "../assets/trash.png";

type FormState = {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    dob: string;
    gender: number;
};

type Customer = {
    id: string;
    name: string;
    country: string;
    email: string;
    contactNo: string;
    gender: number;
    dateOfBirth?: string;
};

const GENDER_LABELS: Record<number, string> = {
    0: "Male",
    1: "Female",
    3: "Prefer not to say",
};

const createEmptyForm = (): FormState => ({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    dob: "",
    gender: 3,
});

export default function CustomerProfile() {
    const [form, setForm] = useState<FormState>(createEmptyForm());
    const [query, setQuery] = useState("");
    const [page, setPage] = useState(1);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
    const [infoOpen, setInfoOpen] = useState(false);
    const pageSize = 5;

    const filteredCustomers = useMemo(() => {
        const value = query.trim().toLowerCase();
        if (!value) {
            return customers;
        }

        return customers.filter((customer) =>
            [customer.name, customer.country, customer.email]
                .join(" ")
                .toLowerCase()
                .includes(value),
        );
    }, [customers, query]);

    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
    const safePage = Math.min(page, totalPages);
    const startIndex = (safePage - 1) * pageSize;
    const visibleCustomers = filteredCustomers.slice(startIndex, startIndex + pageSize);
    const showingFrom = filteredCustomers.length ? startIndex + 1 : 0;
    const showingTo = filteredCustomers.length ? startIndex + visibleCustomers.length : 0;

    useEffect(() => {
        setPage(1);
    }, [query]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    const handleFormChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!form.fullName || !form.email || !form.country || !form.phone || !form.dob || form.gender === 3) {
            showInfo("Please fill all fields.");
            return;
        }

        if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            showError("Please enter a valid email address.");
            return;
        }

        if (form.phone && !/^\+?[0-9\s\-()]+$/.test(form.phone)) {
            showError("Please enter a valid phone number.");
            return;
        }

        setIsSaving(true);

        const body = {
            name: form.fullName,
            email: form.email,
            contactNo: form.phone,
            country: form.country,
            dateOfBirth: form.dob,
            gender: Number(form.gender),
            createdBy: sessionStorage.getItem("dd_user_id") || "unknown",
        };

        try {
            const token = sessionStorage.getItem("dd_token") || "";

            if (editingCustomerId) {
                await updateCustomer({ ...body, id: editingCustomerId }, token);
                showSuccess("Customer updated successfully!");
            } else {
                await createCustomer(body, token);
                showSuccess("Customer created successfully!");
            }

            setForm(createEmptyForm());
            setEditingCustomerId(null);
            await handleFetchCustomers();
        } catch (error: any) {
            const message =
                error.response?.data?.message ||
                (editingCustomerId
                    ? "Failed to update customer. Please try again."
                    : "Failed to create customer. Please try again.");
            showError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFetchCustomers = async () => {
        setIsLoading(true);
        try {
            const token = sessionStorage.getItem("dd_token") || "";
            const data = await getCustomers(token);
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error:any) {
            setCustomers([]);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        handleFetchCustomers();
    }, []);

    const handleClear = () => {
        setForm(createEmptyForm());
        setEditingCustomerId(null);
    };

    const formatDate = (value?: string) => {
        if (!value) return "";
        const [datePart] = value.split("T");
        return datePart;
    };

    const handleView = (customer: Customer) => {
        setSelectedCustomer(customer);
        setViewModalOpen(true);
    };

    const handleEdit = (customer: Customer) => {
        setEditingCustomerId(customer.id);
        setForm({
            fullName: customer.name || "",
            email: customer.email || "",
            phone: customer.contactNo || "",
            country: customer.country || "",
            dob: formatDate(customer.dateOfBirth),
            gender: Number.isFinite(customer.gender) ? customer.gender : 3,
        });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = (customer: Customer) => {
        setCustomerToDelete(customer);
        setDeleteConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!customerToDelete) return;

        try {
            setIsDeleting(true);
            const token = sessionStorage.getItem("dd_token") || "";
            await deleteCustomer(customerToDelete.id, token);
            showSuccess("Customer deleted successfully.");
            setDeleteConfirmModalOpen(false);
            setCustomerToDelete(null);
            await handleFetchCustomers();
        } catch (error: any) {
            const message = error.response?.data?.message || "Failed to delete customer. Please try again.";
            showError(message);
        } finally {
            setIsDeleting(false);
        }
    };

    const paginationButtons = useMemo(() => {
        const pages: (number | string)[] = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i += 1) {
                pages.push(i);
            }
            return pages;
        }

        if (safePage > 2) {
            pages.push(1, "...");
        }

        for (let i = safePage - 1; i <= safePage + 1; i += 1) {
            if (i > 0 && i <= totalPages) {
                pages.push(i);
            }
        }

        if (safePage < totalPages - 1) {
            pages.push("...", totalPages);
        }

        return pages;
    }, [safePage, totalPages]);

    return (
        <Navbar>
            {(isLoading || isSaving || isDeleting) && (
                <div className="globalLoader" role="status" aria-live="polite">
                    <CircularProgress size={56} sx={{ color: 'var(--accent-600, #ff6b00)' }} />
                </div>
            )}
            <section className="customer-profile">
                <header className="customer-profile-header">
                    <div className="agency-header">
                        <div>
                            <h2 className="agency-title">Customer Profiles</h2>
                        </div>
                        <button
                            type="button"
                            className="infoBtn"
                            aria-label="Customer profile steps"
                            onClick={() => setInfoOpen(true)}
                        >
                            <InfoOutlinedIcon fontSize="small" />
                        </button>
                    </div>
                </header>

                <article className="profile-card" aria-label="Customer details form">
                    <div className="profile-card-title">
                        <div>
                            <p className="title">Customer Details Form</p>
                        </div>
                    </div>

                    <form className="profile-form" onSubmit={handleSubmit}>
                        <Grid container spacing={2} alignItems="center" marginBottom={2}>
                            <Grid size={4}>
                                <div className="form-field" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <label className="formField-label" htmlFor="title">
                                        Name
                                    </label>
                                    <input
                                        name="fullName"
                                        className="formField-input"
                                        value={form.fullName}
                                        onChange={handleFormChange}
                                        placeholder="Enter your name"
                                        required
                                    />
                                </div>
                            </Grid>

                            <Grid size={4}>
                                <div className="form-field" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <label className="formField-label" htmlFor="email">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="formField-input"
                                        value={form.email}
                                        onChange={handleFormChange}
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                            </Grid>
                            <Grid size={4}>
                                <div className="form-field" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <label className="formField-label" htmlFor="phone">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="formField-input"
                                        value={form.phone}
                                        onChange={handleFormChange}
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </Grid>
                            <Grid size={4}>
                                <div className="form-field" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <label className="formField-label" htmlFor="country">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        className="formField-input"
                                        value={form.country}
                                        onChange={handleFormChange}
                                        placeholder="Enter country"
                                    />
                                </div>
                            </Grid>
                            <Grid size={4}>
                                <div className="form-field" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <label className="formField-label" htmlFor="dob">
                                        Date of Birth
                                    </label>
                                    <input
                                        type="date"
                                        className="formField-input"
                                        name="dob"
                                        value={form.dob}
                                        onChange={handleFormChange}
                                    />
                                </div>
                            </Grid>
                            <Grid size={4}>
                                <div className="form-field" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <label className="formField-label" htmlFor="gender">
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        className="formField-input"
                                        value={form.gender}
                                        onChange={handleFormChange}
                                    >
                                        <option value={3} disabled hidden>
                                            Select gender
                                        </option>
                                        <option value={0}>Male</option>
                                        <option value={1}>Female</option>
                                    </select>
                                </div>
                            </Grid>
                        </Grid>

                        <div className="form-actions">
                            <button type="button" className="btn ghost" onClick={handleClear}>
                                Clear
                            </button>
                            <button type="submit" className="btn primary" disabled={isSaving}>
                                {editingCustomerId ? "Update" : "Submit"}
                            </button>
                        </div>
                    </form>
                </article>

                <section className="panel">
                    <div className="panel-header">
                        <div />
                        <div className="search" aria-label="Search partnerships">
                            <SearchRounded fontSize="small" />
                            <input
                                type="text"
                                placeholder="Search record"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="tableWrap" style={{ marginTop: "8px" }}>
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Customer name</th>
                                    <th>Country</th>
                                    <th>Contact</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="empty-state">
                                            No customers match your search yet.
                                        </td>
                                    </tr>
                                ) : (
                                    visibleCustomers.map((customer) => (
                                        <tr key={customer.id}>
                                            <td>
                                                <p className="customer-name">{customer.name}</p>
                                            </td>
                                            <td>
                                                <span className="badge">{customer.country}</span>
                                            </td>
                                            <td>
                                                <p className="contact-line">{customer.email}</p>
                                                <span className="subtle">{customer.contactNo}</span>
                                            </td>
                                            <td>
                                                <div className="actions">
                                                    <button
                                                        type="button"
                                                        className="iconBtn iconBtn--view"
                                                        onClick={() => handleView(customer)}
                                                        aria-label={`View ${customer.name}`}
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="iconBtn iconBtn--edit"
                                                        onClick={() => handleEdit(customer)}
                                                        aria-label={`Edit ${customer.name}`}
                                                    >
                                                        <PenSquare size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="iconBtn iconBtn--del"
                                                        onClick={() => handleDelete(customer)}
                                                        aria-label={`Delete ${customer.name}`}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <footer className="table-footer">
                        <p className="muted">
                            Showing {showingFrom}-{showingTo} of {filteredCustomers.length} entries
                        </p>
                        <div className="pagination">
                            <button
                                type="button"
                                className="page-btn"
                                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                                disabled={safePage === 1 || filteredCustomers.length === 0}
                            >
                                Previous
                            </button>
                            {paginationButtons.map((btn, index) =>
                                typeof btn === "number" ? (
                                    <button
                                        key={btn}
                                        type="button"
                                        className={`page-btn ${btn === safePage ? "active" : ""}`}
                                        onClick={() => setPage(btn)}
                                    >
                                        {btn}
                                    </button>
                                ) : (
                                    <span key={`${btn}-${index}`} className="page-separator" aria-hidden="true">
                                        {btn}
                                    </span>
                                ),
                            )}
                            <button
                                type="button"
                                className="page-btn"
                                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                                disabled={safePage === totalPages || filteredCustomers.length === 0}
                            >
                                Next
                            </button>
                        </div>
                    </footer>
                </section>
            </section>

            {infoOpen && (
                <div className="ddModal" role="dialog" aria-modal="true" aria-label="Customer profile guide">
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => setInfoOpen(false)}
                    />

                    <div className="ddModal-card">
                        <div className="ddModal-title">Customer Profiles Guide</div>
                        <div className="ddModal-subtitle" style={{ textAlign: "left", marginTop: 8 }}>
                            Recommended steps for managing traveler records:
                        </div>
                        <div className="ddModal-content">
                            <ol>
                                <li>Complete the form with name, contact info, demographics, and submit to save the profile.</li>
                                <li>Use the Clear button when switching between new entries or abandoning edits.</li>
                                <li>Search the table to locate travelers, then open actions to View or Edit details.</li>
                                <li>Delete outdated records to keep your workspace focused on active customers.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            )}

            {viewModalOpen && selectedCustomer && (
                <div
                    className="ddModal ddModal--large"
                    role="dialog"
                    aria-modal="true"
                    aria-label="View customer details"
                >
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => {
                            setViewModalOpen(false);
                            setSelectedCustomer(null);
                        }}
                    />

                    <div className="ddModal-card ddModal-card--large">
                        <div className="ddModal-header">
                            <div className="ddModal-title">{selectedCustomer.name}</div>
                            <button
                                type="button"
                                className="ddModal-close"
                                aria-label="Close"
                                onClick={() => {
                                    setViewModalOpen(false);
                                    setSelectedCustomer(null);
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="ddModal-content">
                            <div className="detailSection">
                                <h3 className="detailSection-title">Contact</h3>
                                <div className="detailGrid">
                                    <div className="detailItem">
                                        <span className="detailItem-label">Email:</span>
                                        <span className="detailItem-value">{selectedCustomer.email || "-"}</span>
                                    </div>
                                    <div className="detailItem">
                                        <span className="detailItem-label">Phone:</span>
                                        <span className="detailItem-value">{selectedCustomer.contactNo || "-"}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="detailSection">
                                <h3 className="detailSection-title">Profile</h3>
                                <div className="detailGrid">
                                    <div className="detailItem">
                                        <span className="detailItem-label">Country:</span>
                                        <span className="detailItem-value">{selectedCustomer.country || "-"}</span>
                                    </div>
                                    <div className="detailItem">
                                        <span className="detailItem-label">Gender:</span>
                                        <span className="detailItem-value">{GENDER_LABELS[selectedCustomer.gender] || "-"}</span>
                                    </div>
                                    <div className="detailItem">
                                        <span className="detailItem-label">Date of Birth:</span>
                                        <span className="detailItem-value">{formatDate(selectedCustomer.dateOfBirth) || "-"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirmModalOpen && customerToDelete && (
                <div
                    className="ddModal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Confirm delete customer"
                >
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => {
                            if (!isDeleting) {
                                setDeleteConfirmModalOpen(false);
                                setCustomerToDelete(null);
                            }
                        }}
                    />

                    <div className="ddModal-card">
                        <div className="ddModal-logo" aria-hidden="true">
                            <img className="ddModal-img" src={trashImg} alt="Delete icon" />
                        </div>

                        <div className="ddModal-title">Delete Customer</div>
                        <div className="ddModal-subtitle">
                            Are you sure you want to delete <strong>{customerToDelete.name || "this customer"}</strong>? This action cannot be undone.
                        </div>

                        <div className="ddModal-actions">
                            <button
                                type="button"
                                className="ddModal-btn ddModal-btn--ghost"
                                onClick={() => {
                                    setDeleteConfirmModalOpen(false);
                                    setCustomerToDelete(null);
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
        </Navbar>
    );
}