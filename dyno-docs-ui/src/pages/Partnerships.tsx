import { useState, useRef, useEffect } from "react";
import Navbar from "../layouts/Navbar";
import "../styles/agencyData.css";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import {
    createPartnership,
    deletePartnership,
    getPartnerships,
    updatePartnership,
} from "../services/partnership-api";
import { showError, showSuccess } from "../components/Toast";
import { CircularProgress, Grid } from "@mui/material";
import trashImg from "../assets/trash.png";

interface PartnershipRecord {
    id: string;
    name?: string;
    description?: string;
    district?: string;
    partnershipType: number;
    images?: string[];
}

const PARTNERSHIP_TYPE_OPTIONS: { value: number; label: string }[] = [
    { value: 0, label: "Hotels" },
    { value: 1, label: "Transport" },
    { value: 2, label: "Activities" },
    { value: 3, label: "Travel Services" },
    { value: 4, label: "Other" },
];

const PARTNERSHIP_TYPE_LABELS: Record<number, string> = {
    0: "Hotels",
    1: "Transport",
    2: "Activities",
    3: "Travel Services",
    4: "Other",
};

const SRI_LANKA_DISTRICTS: string[] = [
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
    "Monaragala",
    "Ratnapura",
    "Kegalle",
];

export default function Partnerships() {
    const DD_TOKEN = sessionStorage.getItem("dd_token") || "";

    const [title, setTitle] = useState("");
    const [type, setType] = useState("");
    const [description, setDescription] = useState("");
    const [district, setDistrict] = useState("");
    const [partnerships, setPartnerships] = useState<PartnershipRecord[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isImagesDragActive, setIsImagesDragActive] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
    const [selectedPartnership, setSelectedPartnership] = useState<PartnershipRecord | null>(null);
    const [partnershipToDelete, setPartnershipToDelete] = useState<PartnershipRecord | null>(null);
    const itemsPerPage = 5;
    const imagesInputRef = useRef<HTMLInputElement | null>(null);
    const formTopRef = useRef<HTMLDivElement | null>(null);
    const titleInputRef = useRef<HTMLInputElement | null>(null);

    const fetchPartnerships = async () => {
        try {
            setIsLoading(true);
            const response = await getPartnerships(DD_TOKEN);
            setPartnerships(response.data || []);
            setCurrentPage(1);
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                "Failed to fetch partnerships. Please try again.";
            showError(message);
            setPartnerships([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPartnerships();
    }, []);

    const filteredPartnerships = partnerships.filter((item) => {
        const term = searchTerm.toLowerCase();
        const name = item.name || "";
        const typeLabel = PARTNERSHIP_TYPE_LABELS[item.partnershipType] || "";
        const itemDistrict = item.district || "";

        return (
            name.toLowerCase().includes(term) ||
            typeLabel.toLowerCase().includes(term) ||
            itemDistrict.toLowerCase().includes(term)
        );
    });

    const totalPages = Math.ceil(filteredPartnerships.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentItems = filteredPartnerships.slice(startIndex, endIndex);

    const getPaginationNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i += 1) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push("...");

            for (
                let i = Math.max(2, currentPage - 1);
                i <= Math.min(totalPages - 1, currentPage + 1);
                i += 1
            ) {
                if (!pages.includes(i)) pages.push(i);
            }

            if (currentPage < totalPages - 2) pages.push("...");
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }

        return pages;
    };

    const handleImagesDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsImagesDragActive(true);
    };

    const handleImagesDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsImagesDragActive(false);
    };

    const processImages = (files: FileList) => {
        const fileArray = Array.from(files).slice(0, 5 - selectedImages.length);
        const newImages = [...selectedImages, ...fileArray];
        if (newImages.length > 5) {
            return;
        }

        setSelectedImages(newImages);

        const previews: string[] = [];
        newImages.forEach((file) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                previews.push(reader.result as string);
                if (previews.length === newImages.length) {
                    setImagePreviews(previews);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleImagesDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsImagesDragActive(false);
        if (e.dataTransfer.files) {
            processImages(e.dataTransfer.files);
        }
    };

    const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processImages(e.target.files);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    };

    const handleClear = () => {
        setTitle("");
        setType("");
        setDescription("");
        setDistrict("");
        setSelectedImages([]);
        setImagePreviews([]);
        setEditingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            showError("Title is required");
            return;
        }

        if (!type) {
            showError("Partnership type is required");
            return;
        }

        if (!district) {
            showError("District is required");
            return;
        }

        const partnershipTypeValue = Number(type);
        if (Number.isNaN(partnershipTypeValue)) {
            showError("Invalid partnership type");
            return;
        }

        try {
            setIsSubmitting(true);

            if (editingId) {
                const payload = {
                    id: editingId,
                    name: title,
                    description,
                    district,
                    partnershipType: partnershipTypeValue,
                };

                const response = await updatePartnership(
                    editingId,
                    payload,
                    DD_TOKEN,
                );
                const message =
                    response?.data?.message ||
                    "Partnership updated successfully.";
                showSuccess(message);
            } else {
                const formData = new FormData();
                formData.append("Name", title);
                if (description) {
                    formData.append("Description", description);
                }
                formData.append("District", district);
                formData.append(
                    "PartnershipType",
                    String(partnershipTypeValue),
                );

                selectedImages.forEach((image) => {
                    formData.append("Images", image);
                });

                const response = await createPartnership(formData, DD_TOKEN);
                const message =
                    response?.data?.message ||
                    "Partnership created successfully.";
                showSuccess(message);
            }

            handleClear();
            fetchPartnerships();
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                (editingId
                    ? "Failed to update partnership. Please try again."
                    : "Failed to create partnership. Please try again.");
            showError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (record: PartnershipRecord) => {
        setEditingId(record.id);
        setTitle(record.name || "");
        setDescription(record.description || "");
        setType(String(record.partnershipType));
        setDistrict(record.district || "");
        setSelectedImages([]);
        setImagePreviews([]);

        // Smoothly scroll form into view and focus the title field
        if (formTopRef.current) {
            formTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (titleInputRef.current) {
            titleInputRef.current.focus();
        }
    };

    const handleViewClick = (record: PartnershipRecord) => {
        setSelectedPartnership(record);
        setViewModalOpen(true);
    };

    const handleDeleteClick = (record: PartnershipRecord) => {
        setPartnershipToDelete(record);
        setDeleteConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!partnershipToDelete) return;

        try {
            setIsDeleting(true);
            const response = await deletePartnership(partnershipToDelete.id, DD_TOKEN);
            const message =
                response?.data?.message ||
                "Partnership deleted successfully.";
            showSuccess(message);
            setDeleteConfirmModalOpen(false);
            setPartnershipToDelete(null);
            fetchPartnerships();
        } catch (error: any) {
            const message =
                error?.response?.data?.message ||
                "Failed to delete partnership. Please try again.";
            showError(message);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <Navbar userName="User">

            {(isLoading || isDeleting || isSubmitting) && (
                <div className="globalLoader" role="status" aria-live="polite">
                    <CircularProgress size={56} sx={{ color: 'var(--accent-600, #ff6b00)' }} />
                </div>
            )}
            <div className="agency" ref={formTopRef}>
                <h2 className="agency-title">Partnerships</h2>

                <section className="panel">
                    <div className="panel-body">
                        <form
                            className="partnershipsForm formGroup"
                            onSubmit={handleSubmit}
                        >
                            <Grid container spacing={2} alignItems="center" marginBottom={2}>
                                <Grid size={4}>
                                    <div className="formField">
                                        <label className="formField-label" htmlFor="title">
                                            Title
                                        </label>
                                        <input
                                            id="title"
                                            className="formField-input"
                                            type="text"
                                            placeholder="Enter title"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            ref={titleInputRef}
                                        />
                                    </div>
                                </Grid>
                                <Grid size={4}>
                                    <div className="formField">
                                    <label className="formField-label" htmlFor="type">
                                        Partnership Type
                                    </label>
                                    <select
                                        id="type"
                                        className="formField-input"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                    >
                                        <option value="">Select partnership type</option>
                                        {PARTNERSHIP_TYPE_OPTIONS.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                </Grid>
                                <Grid size={4}>
                                    <div className="formField">
                                    <label className="formField-label" htmlFor="district">
                                        District
                                    </label>
                                    <select
                                        id="district"
                                        className="formField-input"
                                        value={district}
                                        onChange={(e) => setDistrict(e.target.value)}
                                    >
                                        <option value="">Select district</option>
                                        {SRI_LANKA_DISTRICTS.map((d) => (
                                            <option key={d} value={d}>
                                                {d}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                </Grid>
                            </Grid>

                            <div className="formField">
                                <label className="formField-label" htmlFor="description">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    className="formField-textarea"
                                    placeholder="Enter description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            {!editingId && (
                                <div className="formField">
                                    <span className="formField-label">Images</span>
                                    <div
                                        className={`dropzone ${
                                            isImagesDragActive ? "dropzone--active" : ""
                                        }`}
                                        onDragOver={handleImagesDragOver}
                                        onDragLeave={handleImagesDragLeave}
                                        onDrop={handleImagesDrop}
                                    >
                                        <span className="dropzone-icon" aria-hidden="true">
                                            <CloudUploadRoundedIcon />
                                        </span>
                                        <div className="dropzone-title">
                                            Select your images or drag and drop
                                        </div>
                                        <div className="dropzone-sub">
                                            .png, .jpg, .jpeg accepted
                                        </div>
                                        <input
                                            ref={imagesInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            style={{ display: "none" }}
                                            onChange={handleImagesSelect}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn--orange"
                                            onClick={() => imagesInputRef.current?.click()}
                                        >
                                            Browse
                                        </button>
                                    </div>

                                    {imagePreviews.length > 0 && (
                                        <div className="imagePreviews">
                                            {imagePreviews.map((src, index) => (
                                                <div
                                                    key={index}
                                                    className="imagePreviewItem"
                                                >
                                                    <img
                                                        src={src}
                                                        alt={`Preview ${index + 1}`}
                                                        className="imagePreviewItem-img"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="imagePreviewItem-remove"
                                                        onClick={() => removeImage(index)}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="partnershipsForm-actions">
                                <button
                                    type="button"
                                    className="btn btn--secondary"
                                    onClick={handleClear}
                                >
                                    Clear
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn--orange"
                                    disabled={isSubmitting}
                                >
                                    {editingId ? "Update" : "Submit"}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                <section className="panel">
                    <div className="panel-header">
                        <div />
                        <div className="search" aria-label="Search partnerships">
                            <SearchRoundedIcon fontSize="small" />
                            <input
                                type="text"
                                placeholder="Search record"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>

                    <div className="tableWrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>District</th>
                                    <th>Partnership Types</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={4}>Loading...</td>
                                    </tr>
                                ) : currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={4}>No records found.</td>
                                    </tr>
                                ) : (
                                    currentItems.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.name}</td>
                                            <td>{item.district || "-"}</td>
                                            <td>
                                                {PARTNERSHIP_TYPE_LABELS[
                                                    item.partnershipType
                                                ] || "-"}
                                            </td>
                                            <td>
                                                <span className="actions">
                                                    <button
                                                        type="button"
                                                        className="iconBtn iconBtn--view"
                                                        aria-label="View partnership"
                                                        onClick={() => handleViewClick(item)}
                                                    >
                                                        <VisibilityRoundedIcon fontSize="inherit" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="iconBtn iconBtn--edit"
                                                        aria-label="Edit partnership"
                                                        onClick={() => handleEditClick(item)}
                                                    >
                                                        <EditRoundedIcon fontSize="inherit" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="iconBtn iconBtn--del"
                                                        aria-label="Delete partnership"
                                                        onClick={() =>
                                                            handleDeleteClick(item)
                                                        }
                                                    >
                                                        <DeleteRoundedIcon fontSize="inherit" />
                                                    </button>
                                                </span>
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
                            <strong>{
                                filteredPartnerships.length === 0
                                    ? 0
                                    : startIndex + 1
                            }</strong>{" "}
                            - <strong>{Math.min(endIndex, filteredPartnerships.length)}</strong>{" "}
                            of <strong>{filteredPartnerships.length}</strong> Entries
                        </div>

                        <div className="pagination" aria-label="Pagination">
                            <button
                                type="button"
                                className="pageBtn"
                                onClick={() =>
                                    setCurrentPage((prev) => Math.max(1, prev - 1))
                                }
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            {getPaginationNumbers().map((page, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`pageBtn ${page === currentPage ? "pageBtn--active" : ""
                                        }`}
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
                                    setCurrentPage((prev) =>
                                        Math.min(totalPages, prev + 1)
                                    )
                                }
                                disabled={
                                    currentPage === totalPages || totalPages === 0
                                }
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {viewModalOpen && selectedPartnership && (
                <div
                    className="ddModal ddModal--large"
                    role="dialog"
                    aria-modal="true"
                    aria-label="View partnership details"
                >
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => {
                            setViewModalOpen(false);
                            setSelectedPartnership(null);
                        }}
                    />

                    <div className="ddModal-card ddModal-card--large">
                        <div className="ddModal-header">
                            <div className="ddModal-title">{selectedPartnership.name}</div>
                            <button
                                type="button"
                                className="ddModal-close"
                                aria-label="Close"
                                onClick={() => {
                                    setViewModalOpen(false);
                                    setSelectedPartnership(null);
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="ddModal-content">
                            <div className="detailSection">
                                <h3 className="detailSection-title">Basic Information</h3>
                                <div className="detailGrid">
                                    <div className="detailItem">
                                        <span className="detailItem-label">District:</span>
                                        <span className="detailItem-value">{selectedPartnership.district || "-"}</span>
                                    </div>
                                    <div className="detailItem">
                                        <span className="detailItem-label">Partnership Type:</span>
                                        <span className="detailItem-value">
                                            {PARTNERSHIP_TYPE_LABELS[selectedPartnership.partnershipType] || "-"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {selectedPartnership.description && (
                                <div className="detailSection">
                                    <h3 className="detailSection-title">Description</h3>
                                    <p className="detailSection-text">{selectedPartnership.description}</p>
                                </div>
                            )}

                            {selectedPartnership.images && selectedPartnership.images.length > 0 && (
                                <div className="detailSection">
                                    <h3 className="detailSection-title">Images</h3>
                                    <div className="imageGrid">
                                        {selectedPartnership.images.filter(Boolean).map((img, idx) => (
                                            <div key={idx} className="imageGrid-item">
                                                <img
                                                    src={`data:image/jpeg;base64,${img}`}
                                                    alt={`${selectedPartnership.name || "Partnership"} - Image ${idx + 1}`}
                                                    className="imageGrid-img"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirmModalOpen && partnershipToDelete && (
                <div
                    className="ddModal"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Confirm delete partnership"
                >
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => {
                            if (!isDeleting) {
                                setDeleteConfirmModalOpen(false);
                                setPartnershipToDelete(null);
                            }
                        }}
                    />

                    <div className="ddModal-card">
                        <div className="ddModal-logo" aria-hidden="true">
                            <img className="ddModal-img" src={trashImg} alt="Delete icon" />
                        </div>

                        <div className="ddModal-title">Delete Partnership</div>
                        <div className="ddModal-subtitle">
                            Are you sure you want to delete <strong>{partnershipToDelete.name || "this partnership"}</strong>? This action cannot be undone.
                        </div>

                        <div className="ddModal-actions">
                            <button
                                type="button"
                                className="ddModal-btn ddModal-btn--ghost"
                                onClick={() => {
                                    setDeleteConfirmModalOpen(false);
                                    setPartnershipToDelete(null);
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