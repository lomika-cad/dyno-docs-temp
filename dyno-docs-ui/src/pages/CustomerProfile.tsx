import { useEffect, useMemo, useState } from "react";
import { Eye, PenSquare, Search, Trash2 } from "lucide-react";
import Navbar from "../layouts/Navbar";
import "../styles/customerProfile.css";
import "../styles/agencyData.css";
import { CircularProgress, Grid } from "@mui/material";
import { SearchRounded } from "@mui/icons-material";
import { createCustomer } from "../services/customer-api";
import { showError, showInfo, showSuccess } from "../components/Toast";

type FormState = {
    fullName: string;
    email: string;
    phone: string;
    country: string;
    dob: string;
    gender: number;
};

type Customer = {
    id: number;
    name: string;
    country: string;
    email: string;
    phone: string;
    registered: string;
};

const COUNTRIES = [
    "Australia",
    "United Kingdom",
    "Spain",
    "Canada",
    "United States",
    "Germany",
    "France",
];

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
    const [isLoading, setIsLoading] = useState(false);
    const pageSize = 5;

    const customers = useMemo<Customer[]>(
        () => [
            {
                id: 1,
                name: "Ethan Collins",
                country: "Australia",
                email: "ethan.collins@example.com",
                phone: "+61 2 5550 0430",
                registered: "Jan 12, 2024",
            },
            {
                id: 2,
                name: "Lily Parker",
                country: "United Kingdom",
                email: "lily.parker@example.com",
                phone: "+44 20 7946 0010",
                registered: "Jan 26, 2024",
            },
            {
                id: 3,
                name: "Noah Ramirez",
                country: "Spain",
                email: "noah.ramirez@example.com",
                phone: "+34 91 123 7845",
                registered: "Feb 02, 2024",
            },
            {
                id: 4,
                name: "Ava Mitchell",
                country: "Canada",
                email: "ava.mitchell@example.com",
                phone: "+1 416 555 9786",
                registered: "Feb 18, 2024",
            },
            {
                id: 5,
                name: "Lucas Bennett",
                country: "United States",
                email: "lucas.bennett@example.com",
                phone: "+1 917 555 8402",
                registered: "Mar 04, 2024",
            },
            {
                id: 6,
                name: "Sofia Meyer",
                country: "Germany",
                email: "sofia.meyer@example.com",
                phone: "+49 30 5589 6521",
                registered: "Mar 22, 2024",
            },
            {
                id: 7,
                name: "Isla Dupont",
                country: "France",
                email: "isla.dupont@example.com",
                phone: "+33 1 44 55 6677",
                registered: "Apr 05, 2024",
            },
        ],
        [],
    );

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

        if (!form.fullName || !form.email || !form.country || !form.phone || !form.dob || !form.gender) {
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

        setIsLoading(true);

        const body = {
            name: form.fullName,
            email: form.email,
            contactNo: form.phone,
            country: form.country,
            dateOfBirth: form.dob,
            gender: Number(form.gender),
            createdBy: sessionStorage.getItem("dd_user_id") || "unknown",
        }

        try {
            await createCustomer(body, sessionStorage.getItem("dd_token") || "");
            setForm(createEmptyForm());
            showSuccess("Customer created successfully!");
        } catch (error:any) {
            showError(error.response?.data?.message || "Failed to create customer. Please try again.")
        } finally {
            setIsLoading(false);
        }
    };

    const handleClear = () => {
        setForm(createEmptyForm());
    };

    const handleAction = (action: string, customer: Customer) => {
        console.info(`${action} action triggered for`, customer);
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
        <Navbar userName="User">
            {(isLoading) && (
                <div className="globalLoader" role="status" aria-live="polite">
                    <CircularProgress size={56} sx={{ color: 'var(--accent-600, #ff6b00)' }} />
                </div>
            )}
            <section className="customer-profile">
                <header className="customer-profile__header">
                    <div>
                        <h2 className="agency__title">Customer Profiles</h2>
                        <p className="muted">
                            Keep traveler records up to date to unlock curated itineraries and proactive service options.
                        </p>
                    </div>
                </header>

                <article className="profile-card" aria-label="Customer details form">
                    <div className="profile-card__title">
                        <div>
                            <p className="title">Customer Details Form</p>
                        </div>
                    </div>

                    <form className="profile-form" onSubmit={handleSubmit}>
                        <Grid container spacing={2} alignItems="center" marginBottom={2}>
                            <Grid size={4}>
                                <div className="form-field" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <label className="formField__label" htmlFor="title">
                                        Name
                                    </label>
                                    <input
                                        name="fullName"
                                        className="formField__input"
                                        value={form.fullName}
                                        onChange={handleFormChange}
                                        placeholder="Enter your name"
                                        required
                                    />
                                </div>
                            </Grid>

                            <Grid size={4}>
                                <div className="form-field" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <label className="formField__label" htmlFor="email">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="formField__input"
                                        value={form.email}
                                        onChange={handleFormChange}
                                        placeholder="Enter your email"
                                        required
                                    />
                                </div>
                            </Grid>
                            <Grid size={4}>
                                <div className="form-field" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <label className="formField__label" htmlFor="phone">
                                        Phone
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="formField__input"
                                        value={form.phone}
                                        onChange={handleFormChange}
                                        placeholder="Enter phone number"
                                    />
                                </div>
                            </Grid>
                            <Grid size={4}>
                                <div className="form-field" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <label className="formField__label" htmlFor="country">
                                        Country
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        className="formField__input"
                                        value={form.country}
                                        onChange={handleFormChange}
                                        placeholder="Enter country"
                                    />
                                </div>
                            </Grid>
                            <Grid size={4}>
                                <div className="form-field" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <label className="formField__label" htmlFor="dob">
                                        Date of Birth
                                    </label>
                                    <input
                                        type="date"
                                        className="formField__input"
                                        name="dob"
                                        value={form.dob}
                                        onChange={handleFormChange}
                                    />
                                </div>
                            </Grid>
                            <Grid size={4}>
                                <div className="form-field" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <label className="formField__label" htmlFor="gender">
                                        Gender
                                    </label>
                                    <select
                                        name="gender"
                                        className="formField__input"
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
                            <button type="submit" className="btn primary">
                                Submit
                            </button>
                        </div>
                    </form>
                </article>

                <section className="panel">
                    <div className="panel__header">
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
                                                <span className="subtle">Joined {customer.registered}</span>
                                            </td>
                                            <td>
                                                <span className="badge">{customer.country}</span>
                                            </td>
                                            <td>
                                                <p className="contact-line">{customer.email}</p>
                                                <span className="subtle">{customer.phone}</span>
                                            </td>
                                            <td>
                                                <div className="actions">
                                                    <button
                                                        type="button"
                                                        className="icon-btn neutral"
                                                        onClick={() => handleAction("View", customer)}
                                                        aria-label={`View ${customer.name}`}
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="icon-btn warn"
                                                        onClick={() => handleAction("Edit", customer)}
                                                        aria-label={`Edit ${customer.name}`}
                                                    >
                                                        <PenSquare size={15} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="icon-btn danger"
                                                        onClick={() => handleAction("Delete", customer)}
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
        </Navbar>
    );
}