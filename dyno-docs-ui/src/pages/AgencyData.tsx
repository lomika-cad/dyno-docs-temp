import Navbar from "../layouts/Navbar";
import "../styles/agencyData.css";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useState, useRef, useEffect } from "react";
import CircularProgress from '@mui/material/CircularProgress';
import { downloadSampleExcel, uploadAgencyData, getUploadDataSet, deleteData, createPlace, updatePlace } from "../services/agency-data-api";
import { showError, showSuccess } from "../components/Toast";
import excelImg from "../assets/xlsx.png";
import trashImg from "../assets/trash.png";

interface PlaceData {
    id: string;
    name: string;
    averageVisitDuration: string;
    description?: string;
    funFact?: string;
    district: string;
    city: string;
    image1Url?: string;
    image2Url?: string;
    image3Url?: string;
    image4Url?: string;
    image5Url?: string;
    createdAt: string;
    createdBy: string;
    lastModifiedAt?: string;
    lastModifiedBy?: string;
}

export default function AgencyData() {
    const DD_TOKEN = sessionStorage.getItem("dd_token") || "";
    const [downloadModalOpen, setDownloadModalOpen] = useState(false);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null);
    const [placeToDelete, setPlaceToDelete] = useState<PlaceData | null>(null);
    const [places, setPlaces] = useState<PlaceData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [addRecordModalOpen, setAddRecordModalOpen] = useState(false);
    const [editRecordModalOpen, setEditRecordModalOpen] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    const [placeToEdit, setPlaceToEdit] = useState<PlaceData | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        averageVisitDuration: '',
        description: '',
        funFact: '',
        district: '',
        city: '',
    });
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagesDragActive, setImagesDragActive] = useState(false);
    const itemsPerPage = 10;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadSampleExcel = async () => {
        setIsLoading(true);
        try {
            const response = await downloadSampleExcel(DD_TOKEN);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "template.xlsx");
            document.body.appendChild(link);
            link.click();
            link.parentNode?.removeChild(link);
            window.URL.revokeObjectURL(url);
            showSuccess("Template downloaded successfully.");
        } catch (error) {
            showError("Failed to download the template. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleUploadExcel = async () => {
        if (!selectedFile) {
            showError("Please select a file to upload.");
            return;
        }

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', selectedFile);
            await uploadAgencyData(formData, DD_TOKEN);
            showSuccess("File uploaded successfully.");
            setUploadModalOpen(false);
            setSelectedFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
            handleFetchDataSet();
        } catch (error) {
            showError("Failed to upload the file. Please try again.");
        } finally {
            setIsUploading(false);
        }
    }

    const handleFetchDataSet = async () => {
        try {
            setIsLoading(true);
            const response = await getUploadDataSet(DD_TOKEN);
            setPlaces(response.data || []);
            setCurrentPage(1); // Reset to first page when data is fetched
        } catch (error) {
            showError("Failed to fetch data. Please try again.");
            setPlaces([]);
        } finally {
            setIsLoading(false);
        }
    }

    // Filter places based on search term
    const filteredPlaces = places.filter((place) =>
        place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        place.district.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination calculations
    const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentPlaces = filteredPlaces.slice(startIndex, endIndex);

    const getPaginationNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            
            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                if (!pages.includes(i)) pages.push(i);
            }
            
            if (currentPage < totalPages - 2) pages.push('...');
            if (!pages.includes(totalPages)) pages.push(totalPages);
        }
        
        return pages;
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImagesDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setImagesDragActive(true);
    };

    const handleImagesDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setImagesDragActive(false);
    };

    const processImages = (files: FileList) => {
        const fileArray = Array.from(files).slice(0, 5 - selectedImages.length);
        const newImages = [...selectedImages, ...fileArray];
        
        if (newImages.length > 5) {
            showError('Maximum 5 images allowed');
            return;
        }

        setSelectedImages(newImages);

        // Generate previews
        const newPreviews: string[] = [];
        newImages.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newPreviews.push(reader.result as string);
                if (newPreviews.length === newImages.length) {
                    setImagePreviews(newPreviews);
                }
            };
            reader.readAsDataURL(file);
        });
    };

    const handleImagesDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setImagesDragActive(false);
        const files = e.dataTransfer.files;
        if (files) {
            processImages(files);
        }
    };

    const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            processImages(files);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddRecord = async () => {
        // Validate required fields
        if (!formData.name.trim()) {
            showError('Name is required');
            return;
        }
        if (!formData.averageVisitDuration.trim()) {
            showError('Average Visit Duration is required');
            return;
        }
        if (!formData.district.trim()) {
            showError('District is required');
            return;
        }
        if (!formData.city.trim()) {
            showError('City is required');
            return;
        }

        try {
            setIsSubmitting(true);
            const data = new FormData();
            data.append('name', formData.name);
            data.append('averageVisitDuration', formData.averageVisitDuration);
            data.append('description', formData.description);
            data.append('funFact', formData.funFact);
            data.append('district', formData.district);
            data.append('city', formData.city);

            selectedImages.forEach((image, index) => {
                data.append(`image${index + 1}`, image);
            });

            await createPlace(data, DD_TOKEN);
            showSuccess('Place added successfully!');
            setAddRecordModalOpen(false);
            resetForm();
            handleFetchDataSet();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to add place. Please try again.';
            showError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            averageVisitDuration: '',
            description: '',
            funFact: '',
            district: '',
            city: '',
        });
        setSelectedImages([]);
        setImagePreviews([]);
    };

    const handleEditClick = (place: PlaceData) => {
        setPlaceToEdit(place);
        setFormData({
            name: place.name,
            averageVisitDuration: place.averageVisitDuration,
            description: place.description || '',
            funFact: place.funFact || '',
            district: place.district,
            city: place.city,
        });
        setSelectedImages([]);
        setImagePreviews([]);
        setEditRecordModalOpen(true);
    };

    const handleUpdateRecord = async () => {
        if (!placeToEdit) return;

        // Validate required fields
        if (!formData.name.trim()) {
            showError('Name is required');
            return;
        }
        if (!formData.averageVisitDuration.trim()) {
            showError('Average Visit Duration is required');
            return;
        }
        if (!formData.district.trim()) {
            showError('District is required');
            return;
        }
        if (!formData.city.trim()) {
            showError('City is required');
            return;
        }

        try {
            setIsSubmitting(true);
            const data = {
                name: formData.name,
                averageVisitDuration: formData.averageVisitDuration,
                description: formData.description,
                funFact: formData.funFact,
                district: formData.district,
                city: formData.city,
            }

            await updatePlace(placeToEdit.id, data, DD_TOKEN);
            showSuccess('Place updated successfully!');
            setEditRecordModalOpen(false);
            setPlaceToEdit(null);
            resetForm();
            handleFetchDataSet();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || 'Failed to update place. Please try again.';
            showError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };
    const handleViewPlace = (place: PlaceData) => {
        setSelectedPlace(place);
        setViewModalOpen(true);
    }

    const handleDeleteClick = (place: PlaceData) => {
        setPlaceToDelete(place);
        setDeleteConfirmModalOpen(true);
    }

    const handleConfirmDelete = async () => {
        if (!placeToDelete) return;

        try {
            setIsDeleting(true);
            await deleteData(placeToDelete.id, DD_TOKEN);
            showSuccess("Place deleted successfully.");
            setDeleteConfirmModalOpen(false);
            setPlaceToDelete(null);
            // Refresh data after deletion
            handleFetchDataSet();
        } catch (error) {
            showError("Failed to delete the place. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    }

    useEffect(() => {
        handleFetchDataSet();
    }, []);

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            setSelectedFile(files[0]);
            setUploadModalOpen(true);
        }
    };

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0) {
            setSelectedFile(files[0]);
            setUploadModalOpen(true);
        }
    };

    return (
        <Navbar userName="User">
            <div className="agency">
                <div className="agency-header">
                    <h2 className="agency-title">Agency Data</h2>
                    <button
                        type="button"
                        className="infoBtn"
                        aria-label="Agency data steps"
                        onClick={() => setInfoOpen(true)}
                    >
                        <InfoOutlinedIcon fontSize="small" />
                    </button>
                </div>
                <section className="panel">
                    <div className="panel-header">
                        <div className="panel-title">Download Excel Template</div>
                        <button
                            type="button"
                            className="btn btn--success"
                            onClick={() => setDownloadModalOpen(true)}
                        >
                            <DownloadRoundedIcon fontSize="small" />
                            Download
                        </button>
                    </div>
                    <div className="panel-body">
                        <p className="panel-hint">
                            Please download this Excel template and review the sample data. You can then enter your own data
                            (required for report generation) and submit the completed Excel file using the section below.
                        </p>
                    </div>
                </section>

                <section className="panel">
                    <div className="panel-header">
                        <div className="panel-title">Upload Your Data Set</div>
                    </div>
                    <div className="panel-body">
                        <div
                            className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <span className="dropzone-icon" aria-hidden="true">
                                <CloudUploadRoundedIcon />
                            </span>
                            <div className="dropzone-title">Select your excel or drag and drop</div>
                            <div className="dropzone-sub">.xls, .xlsx accepted (max 10MB)</div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xls,.xlsx"
                                onChange={handleFileInputChange}
                                style={{ display: 'none' }}
                                aria-label="Upload Excel file"
                            />
                            <button
                                type="button"
                                className="btn btn--orange"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Browse
                            </button>
                        </div>
                    </div>
                </section>

                <section className="panel">
                    <div className="controls">
                        <label className="search">
                            <SearchRoundedIcon fontSize="small" aria-hidden="true" />
                            <input 
                                placeholder="Search Record" 
                                aria-label="Search Record"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1); // Reset to first page on search
                                }}
                            />
                        </label>
                        <button 
                            type="button" 
                            className="btn btn--orange"
                            onClick={() => {
                                resetForm();
                                setAddRecordModalOpen(true);
                            }}
                        >
                            + Add Record
                        </button>
                    </div>

                    <div className="tableWrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>District</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                                            Loading...
                                        </td>
                                    </tr>
                                ) : places.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                                            No data available. Please upload an Excel file.
                                        </td>
                                    </tr>
                                ) : filteredPlaces.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={{ textAlign: 'center', padding: '2rem' }}>
                                            No results found for "{searchTerm}".
                                        </td>
                                    </tr>
                                ) : (
                                    currentPlaces.map((place) => (
                                        <tr key={place.id}>
                                            <td>{place.name}</td>
                                            <td>{place.district}</td>
                                            <td>
                                                <span className="actions">
                                                    <button 
                                                        type="button" 
                                                        className="iconBtn iconBtn--view" 
                                                        aria-label="View"
                                                        onClick={() => handleViewPlace(place)}
                                                    >
                                                        <VisibilityRoundedIcon fontSize="inherit" />
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        className="iconBtn iconBtn--edit" 
                                                        aria-label="Edit"
                                                        onClick={() => handleEditClick(place)}
                                                    >
                                                        <EditRoundedIcon fontSize="inherit" />
                                                    </button>
                                                    <button type="button" className="iconBtn iconBtn--del" aria-label="Delete"
                                                        onClick={() => handleDeleteClick(place)}
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
                            <strong>Showing</strong> <strong>{filteredPlaces.length === 0 ? 0 : startIndex + 1}</strong> - <strong>{Math.min(endIndex, filteredPlaces.length)}</strong> of <strong>{filteredPlaces.length}</strong> Entries
                        </div>

                        <div className="pagination" aria-label="Pagination">
                            <button 
                                type="button" 
                                className="pageBtn"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </button>
                            {getPaginationNumbers().map((page, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    className={`pageBtn ${page === currentPage ? 'pageBtn--active' : ''}`}
                                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                                    disabled={page === '...'}
                                >
                                    {page}
                                </button>
                            ))}
                            <button 
                                type="button" 
                                className="pageBtn"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages || totalPages === 0}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {infoOpen && (
                <div className="ddModal" role="dialog" aria-modal="true" aria-label="Agency data hint">
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => setInfoOpen(false)}
                    />

                    <div className="ddModal-card">
                        <div className="ddModal-subtitle" style={{ textAlign: 'left', marginTop: 8 }}>
                            Follow these steps to add and manage agency data:
                        </div>
                        <div className="ddModal-content">
                            <ol>
                                <li>Download the <strong>Excel template</strong> to see required columns.</li>
                                <li>Fill in your records in the template and save as .xls or .xlsx.</li>
                                <li>Use the <strong>Upload</strong> section to submit the completed file (this replaces previous uploads).</li>
                                <li>Or add individual records using <strong>+ Add Record</strong> to enter data manually.</li>
                                <li>Use the actions to <strong>View, Edit</strong> or <strong>Delete</strong> existing records.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            )}

            {(isLoading || isUploading || isDeleting || isSubmitting) && (
                <div className="globalLoader" role="status" aria-live="polite">
                    <CircularProgress size={56} sx={{ color: 'var(--accent-600, #ff6b00)' }} />
                </div>
            )}

            {downloadModalOpen && (
                <div className="ddModal" role="dialog" aria-modal="true" aria-label="Verify download">
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => setDownloadModalOpen(false)}
                    />

                    <div className="ddModal-card">
                        <div className="ddModal-logo" aria-hidden="true">
                            <img className="ddModal-img" src={excelImg} alt="Excel file icon" />
                        </div>

                        <div className="ddModal-title">Download Sample Excel</div>
                        <div className="ddModal-subtitle">
                            Are you sure you want to download the sample Excel template?
                        </div>

                        <div className="ddModal-actions">
                            <button
                                type="button"
                                className="ddModal-btn ddModal-btn--ghost"
                                onClick={() => setDownloadModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn--success"
                                onClick={() => {
                                    handleDownloadSampleExcel();
                                    setDownloadModalOpen(false);
                                }}
                            >
                                <DownloadRoundedIcon fontSize="small" />
                                Download
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {uploadModalOpen && (
                <div className="ddModal" role="dialog" aria-modal="true" aria-label="Confirm upload">
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => {
                            if (!isUploading) {
                                setUploadModalOpen(false);
                                setSelectedFile(null);
                                if (fileInputRef.current) {
                                    fileInputRef.current.value = '';
                                }
                            }
                        }}
                    />

                    <div className="ddModal-card">
                        <div className="ddModal-logo" aria-hidden="true">
                            <img className="ddModal-img" src={excelImg} alt="Excel file icon" />
                        </div>

                        <div className="ddModal-title">Upload Excel File</div>
                        <div className="ddModal-subtitle" style={{ marginBottom: '12px' }}>
                            <strong>File:</strong> {selectedFile?.name}
                        </div>
                        <div className="ddModal-subtitle" style={{ color: '#f57c00', fontWeight: 'bold' }}>
                            ⚠️ Warning: After every Excel upload, previous uploaded data will be lost and replaced with new data.
                        </div>

                        <div className="ddModal-actions">
                            <button
                                type="button"
                                className="ddModal-btn ddModal-btn--ghost"
                                onClick={() => {
                                    setUploadModalOpen(false);
                                    setSelectedFile(null);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = '';
                                    }
                                }}
                                disabled={isUploading}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn--orange"
                                onClick={handleUploadExcel}
                                disabled={isUploading}
                            >
                                <CloudUploadRoundedIcon fontSize="small" />
                                {isUploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {viewModalOpen && selectedPlace && (
                <div className="ddModal ddModal--large" role="dialog" aria-modal="true" aria-label="View Place Details">
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => {
                            setViewModalOpen(false);
                            setSelectedPlace(null);
                        }}
                    />

                    <div className="ddModal-card ddModal-card--large">
                        <div className="ddModal-header">
                            <div className="ddModal-title">{selectedPlace.name}</div>
                            <button
                                type="button"
                                className="ddModal-close"
                                aria-label="Close"
                                onClick={() => {
                                    setViewModalOpen(false);
                                    setSelectedPlace(null);
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
                                        <span className="detailItem-value">{selectedPlace.district}</span>
                                    </div>
                                    <div className="detailItem">
                                        <span className="detailItem-label">City:</span>
                                        <span className="detailItem-value">{selectedPlace.city}</span>
                                    </div>
                                    <div className="detailItem">
                                        <span className="detailItem-label">Average Visit Duration:</span>
                                        <span className="detailItem-value">{selectedPlace.averageVisitDuration}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedPlace.description && (
                                <div className="detailSection">
                                    <h3 className="detailSection-title">Description</h3>
                                    <p className="detailSection-text">{selectedPlace.description}</p>
                                </div>
                            )}

                            {selectedPlace.funFact && (
                                <div className="detailSection">
                                    <h3 className="detailSection-title">Fun Fact</h3>
                                    <p className="detailSection-text">{selectedPlace.funFact}</p>
                                </div>
                            )}

                            <div className="detailSection">
                                <h3 className="detailSection-title">Images</h3>
                                <div className="imageGrid">
                                    {[
                                        selectedPlace.image1Url,
                                        selectedPlace.image2Url,
                                        selectedPlace.image3Url,
                                        selectedPlace.image4Url,
                                        selectedPlace.image5Url,
                                    ]
                                        .filter((url) => url)
                                        .map((url, idx) => (
                                            <div key={idx} className="imageGrid-item">
                                                <img
                                                    src={`data:image/jpeg;base64,${url}`}
                                                    alt={`${selectedPlace.name} - Image ${idx + 1}`}
                                                    className="imageGrid-img"
                                                />
                                            </div>
                                        ))}
                                    {![
                                        selectedPlace.image1Url,
                                        selectedPlace.image2Url,
                                        selectedPlace.image3Url,
                                        selectedPlace.image4Url,
                                        selectedPlace.image5Url,
                                    ].some((url) => url) && (
                                        <p className="detailSection-text">No images available</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {deleteConfirmModalOpen && placeToDelete && (
                <div className="ddModal" role="dialog" aria-modal="true" aria-label="Confirm delete">
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => {
                            if (!isDeleting) {
                                setDeleteConfirmModalOpen(false);
                                setPlaceToDelete(null);
                            }
                        }}
                    />

                    <div className="ddModal-card">
                        <div className="ddModal-logo" aria-hidden="true">
                            <img className="ddModal-img" src={trashImg} alt="Delete icon" />
                        </div>

                        <div className="ddModal-title">Delete Place</div>
                        <div className="ddModal-subtitle">
                            Are you sure you want to delete <strong>{placeToDelete.name}</strong>? This action cannot be undone.
                        </div>

                        <div className="ddModal-actions">
                            <button
                                type="button"
                                className="ddModal-btn ddModal-btn--ghost"
                                onClick={() => {
                                    setDeleteConfirmModalOpen(false);
                                    setPlaceToDelete(null);
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
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {addRecordModalOpen && (
                <div className="sideModal" role="dialog" aria-modal="true" aria-label="Add New Place">
                    <button
                        type="button"
                        className="sideModal-backdrop"
                        aria-label="Close"
                        onClick={() => {
                            if (!isSubmitting) {
                                setAddRecordModalOpen(false);
                                resetForm();
                            }
                        }}
                    />

                    <div className="sideModal-card">
                        <div className="sideModal-header">
                            <h2 className="sideModal-title">Add New Place</h2>
                            <button
                                type="button"
                                className="sideModal-close"
                                aria-label="Close"
                                onClick={() => {
                                    if (!isSubmitting) {
                                        setAddRecordModalOpen(false);
                                        resetForm();
                                    }
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="sideModal-content">
                            <form className="formGroup">
                                <div className="formField">
                                    <label htmlFor="name" className="formField-label">Name <span className="required">*</span></label>
                                    <input
                                        id="name"
                                        type="text"
                                        name="name"
                                        className="formField-input"
                                        placeholder="Enter place name"
                                        value={formData.name}
                                        onChange={handleFormChange}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="formField">
                                    <label htmlFor="averageVisitDuration" className="formField-label">Average Visit Duration <span className="required">*</span></label>
                                    <input
                                        id="averageVisitDuration"
                                        type="text"
                                        name="averageVisitDuration"
                                        className="formField-input"
                                        placeholder="e.g., 2-3 hours"
                                        value={formData.averageVisitDuration}
                                        onChange={handleFormChange}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="formField">
                                    <label htmlFor="district" className="formField-label">District <span className="required">*</span></label>
                                    <input
                                        id="district"
                                        type="text"
                                        name="district"
                                        className="formField-input"
                                        placeholder="Enter district"
                                        value={formData.district}
                                        onChange={handleFormChange}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="formField">
                                    <label htmlFor="city" className="formField-label">City <span className="required">*</span></label>
                                    <input
                                        id="city"
                                        type="text"
                                        name="city"
                                        className="formField-input"
                                        placeholder="Enter city"
                                        value={formData.city}
                                        onChange={handleFormChange}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="formField">
                                    <label htmlFor="description" className="formField-label">Description</label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        className="formField-textarea"
                                        placeholder="Enter description"
                                        value={formData.description}
                                        onChange={handleFormChange}
                                        disabled={isSubmitting}
                                        rows={3}
                                    />
                                </div>

                                <div className="formField">
                                    <label htmlFor="funFact" className="formField-label">Fun Fact</label>
                                    <textarea
                                        id="funFact"
                                        name="funFact"
                                        className="formField-textarea"
                                        placeholder="Enter a fun fact"
                                        value={formData.funFact}
                                        onChange={handleFormChange}
                                        disabled={isSubmitting}
                                        rows={3}
                                    />
                                </div>

                                <div className="formField">
                                    <label className="formField-label">Images (Max 5)</label>
                                    <div
                                        className={`imageDropzone ${imagesDragActive ? 'imageDropzone--active' : ''}`}
                                        onDragOver={handleImagesDragOver}
                                        onDragLeave={handleImagesDragLeave}
                                        onDrop={handleImagesDrop}
                                    >
                                        <div className="imageDropzone-content">
                                            <div className="imageDropzone-icon">📸</div>
                                            <p className="imageDropzone-title">Drag and drop images here or click to browse</p>
                                            <p className="imageDropzone-subtitle">Maximum 5 images</p>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleImagesSelect}
                                                style={{ display: 'none' }}
                                                id="imageInput"
                                                disabled={isSubmitting}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn--orange"
                                                onClick={() => document.getElementById('imageInput')?.click()}
                                                disabled={isSubmitting}
                                            >
                                                Browse Images
                                            </button>
                                        </div>
                                    </div>

                                    {imagePreviews.length > 0 && (
                                        <div className="imagePreviews">
                                            {imagePreviews.map((preview, idx) => (
                                                <div key={idx} className="imagePreviewItem">
                                                    <img src={preview} alt={`Preview ${idx + 1}`} className="imagePreviewItem-img" />
                                                    <button
                                                        type="button"
                                                        className="imagePreviewItem-remove"
                                                        onClick={() => removeImage(idx)}
                                                        disabled={isSubmitting}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </form>
                        </div>

                        <div className="sideModal-footer">
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={() => {
                                    setAddRecordModalOpen(false);
                                    resetForm();
                                }}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn--orange"
                                onClick={handleAddRecord}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Adding...' : 'Add Place'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {editRecordModalOpen && placeToEdit && (
                <div className="sideModal" role="dialog" aria-modal="true" aria-label="Edit Place">
                    <button
                        type="button"
                        className="sideModal-backdrop"
                        aria-label="Close"
                        onClick={() => {
                            if (!isSubmitting) {
                                setEditRecordModalOpen(false);
                                setPlaceToEdit(null);
                                resetForm();
                            }
                        }}
                    />

                    <div className="sideModal-card">
                        <div className="sideModal-header">
                            <h2 className="sideModal-title">Edit Place</h2>
                            <button
                                type="button"
                                className="sideModal-close"
                                aria-label="Close"
                                onClick={() => {
                                    if (!isSubmitting) {
                                        setEditRecordModalOpen(false);
                                        setPlaceToEdit(null);
                                        resetForm();
                                    }
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="sideModal-content">
                            <form className="formGroup">
                                <div className="formField">
                                    <label htmlFor="edit-name" className="formField-label">Name <span className="required">*</span></label>
                                    <input
                                        id="edit-name"
                                        type="text"
                                        name="name"
                                        className="formField-input"
                                        placeholder="Enter place name"
                                        value={formData.name}
                                        onChange={handleFormChange}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="formField">
                                    <label htmlFor="edit-averageVisitDuration" className="formField-label">Average Visit Duration <span className="required">*</span></label>
                                    <input
                                        id="edit-averageVisitDuration"
                                        type="text"
                                        name="averageVisitDuration"
                                        className="formField-input"
                                        placeholder="e.g., 2-3 hours"
                                        value={formData.averageVisitDuration}
                                        onChange={handleFormChange}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="formField">
                                    <label htmlFor="edit-district" className="formField-label">District <span className="required">*</span></label>
                                    <input
                                        id="edit-district"
                                        type="text"
                                        name="district"
                                        className="formField-input"
                                        placeholder="Enter district"
                                        value={formData.district}
                                        onChange={handleFormChange}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="formField">
                                    <label htmlFor="edit-city" className="formField-label">City <span className="required">*</span></label>
                                    <input
                                        id="edit-city"
                                        type="text"
                                        name="city"
                                        className="formField-input"
                                        placeholder="Enter city"
                                        value={formData.city}
                                        onChange={handleFormChange}
                                        disabled={isSubmitting}
                                    />
                                </div>

                                <div className="formField">
                                    <label htmlFor="edit-description" className="formField-label">Description</label>
                                    <textarea
                                        id="edit-description"
                                        name="description"
                                        className="formField-textarea"
                                        placeholder="Enter description"
                                        value={formData.description}
                                        onChange={handleFormChange}
                                        disabled={isSubmitting}
                                        rows={3}
                                    />
                                </div>

                                <div className="formField">
                                    <label htmlFor="edit-funFact" className="formField-label">Fun Fact</label>
                                    <textarea
                                        id="edit-funFact"
                                        name="funFact"
                                        className="formField-textarea"
                                        placeholder="Enter a fun fact"
                                        value={formData.funFact}
                                        onChange={handleFormChange}
                                        disabled={isSubmitting}
                                        rows={3}
                                    />
                                </div>

                                {/* <div className="formField">
                                    <label className="formField-label">Images (Max 5)</label>
                                    <div
                                        className={`imageDropzone ${imagesDragActive ? 'imageDropzone--active' : ''}`}
                                        onDragOver={handleImagesDragOver}
                                        onDragLeave={handleImagesDragLeave}
                                        onDrop={handleImagesDrop}
                                    >
                                        <div className="imageDropzone-content">
                                            <div className="imageDropzone-icon">📸</div>
                                            <p className="imageDropzone-title">Drag and drop images here or click to browse</p>
                                            <p className="imageDropzone-subtitle">Maximum 5 images</p>
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleImagesSelect}
                                                style={{ display: 'none' }}
                                                id="editImageInput"
                                                disabled={isSubmitting}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn--orange"
                                                onClick={() => document.getElementById('editImageInput')?.click()}
                                                disabled={isSubmitting}
                                            >
                                                Browse Images
                                            </button>
                                        </div>
                                    </div>

                                    {imagePreviews.length > 0 && (
                                        <div className="imagePreviews">
                                            {imagePreviews.map((preview, idx) => (
                                                <div key={idx} className="imagePreviewItem">
                                                    <img src={preview} alt={`Preview ${idx + 1}`} className="imagePreviewItem-img" />
                                                    <button
                                                        type="button"
                                                        className="imagePreviewItem-remove"
                                                        onClick={() => removeImage(idx)}
                                                        disabled={isSubmitting}
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div> */}
                            </form>
                        </div>

                        <div className="sideModal-footer">
                            <button
                                type="button"
                                className="btn btn--secondary"
                                onClick={() => {
                                    setEditRecordModalOpen(false);
                                    setPlaceToEdit(null);
                                    resetForm();
                                }}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn--orange"
                                onClick={handleUpdateRecord}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Updating...' : 'Update Place'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Navbar>
    );
}