import { useState, useRef } from "react";
import Navbar from "../layouts/Navbar";
import "../styles/agencyData.css";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";

interface PartnershipRecord {
    id: number;
    title: string;
    type: string;
}

const MOCK_PARTNERSHIPS: PartnershipRecord[] = [
    { id: 1, title: "Destination Collaborations", type: "Destinations" },
    { id: 2, title: "Hospitality Partnerships", type: "Hotels & Stays" },
    { id: 3, title: "Transport & Mobility Partners", type: "Transport" },
    { id: 4, title: "Experience & Activity Partners", type: "Activities" },
    { id: 5, title: "Travel Service Partners", type: "Travel Services" },
];

export default function Partnerships() {
    const [title, setTitle] = useState("");
    const [type, setType] = useState("");
    const [description, setDescription] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [isImagesDragActive, setIsImagesDragActive] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const imagesInputRef = useRef<HTMLInputElement | null>(null);

    const filteredPartnerships = MOCK_PARTNERSHIPS.filter((item) => {
        const term = searchTerm.toLowerCase();
        return (
            item.title.toLowerCase().includes(term) ||
            item.type.toLowerCase().includes(term)
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
        setSelectedImages([]);
        setImagePreviews([]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Placeholder submit handler – integrate API or data logic here.
    };

    return (
        <Navbar userName="User">
            <div className="agency">
                <h2 className="agency__title">Partnerships</h2>

                <section className="panel">
                    <div className="panel__body">
                        <form
                            className="partnershipsForm formGroup"
                            onSubmit={handleSubmit}
                        >
                            <div className="partnershipsForm__row">
                                <div className="formField">
                                    <label className="formField__label" htmlFor="title">
                                        Title
                                    </label>
                                    <input
                                        id="title"
                                        className="formField__input"
                                        type="text"
                                        placeholder="Enter title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="formField">
                                    <label className="formField__label" htmlFor="type">
                                        Partnership Type
                                    </label>
                                    <select
                                        id="type"
                                        className="formField__input"
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                    >
                                        <option value="">Select partnership type</option>
                                        <option value="Hotels & Stays">Hotels</option>
                                        <option value="Transport">Transport</option>
                                        <option value="Activities">Activities</option>
                                        <option value="Travel Services">Travel Services</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="formField">
                                <label className="formField__label" htmlFor="description">
                                    Description
                                </label>
                                <textarea
                                    id="description"
                                    className="formField__textarea"
                                    placeholder="Enter description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                />
                            </div>

                            <div className="formField">
                                <span className="formField__label">Images</span>
                                <div
                                    className={`dropzone ${
                                        isImagesDragActive ? "dropzone--active" : ""
                                    }`}
                                    onDragOver={handleImagesDragOver}
                                    onDragLeave={handleImagesDragLeave}
                                    onDrop={handleImagesDrop}
                                >
                                    <span className="dropzone__icon" aria-hidden="true">
                                        <CloudUploadRoundedIcon />
                                    </span>
                                    <div className="dropzone__title">
                                        Select your images or drag and drop
                                    </div>
                                    <div className="dropzone__sub">
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
                                                    className="imagePreviewItem__img"
                                                />
                                                <button
                                                    type="button"
                                                    className="imagePreviewItem__remove"
                                                    onClick={() => removeImage(index)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="partnershipsForm__actions">
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
                                >
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                <section className="panel">
                    <div className="panel__header">
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
                                    <th>Partnership Types</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={3}>No records found.</td>
                                    </tr>
                                ) : (
                                    currentItems.map((item) => (
                                        <tr key={item.id}>
                                            <td>{item.title}</td>
                                            <td>{item.type}</td>
                                            <td>
                                                <span className="actions">
                                                    <button
                                                        type="button"
                                                        className="iconBtn iconBtn--edit"
                                                        aria-label="Edit partnership"
                                                    >
                                                        <EditRoundedIcon fontSize="inherit" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="iconBtn iconBtn--del"
                                                        aria-label="Delete partnership"
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
                        <div className="panel__hint">
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
                                    className={`pageBtn ${
                                        page === currentPage ? "pageBtn--active" : ""
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
        </Navbar>
    );
}