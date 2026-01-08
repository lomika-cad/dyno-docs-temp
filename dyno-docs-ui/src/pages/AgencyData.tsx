import Navbar from "../layouts/Navbar";
import "../styles/agencyData.css";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";
import { useState, useRef, useEffect } from "react";
import { downloadSampleExcel, uploadAgencyData, getUploadDataSet } from "../services/agency-data-api";
import { showError, showSuccess } from "../components/Toast";
import excelImg from "../assets/xlsx.png";

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
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedPlace, setSelectedPlace] = useState<PlaceData | null>(null);
    const [places, setPlaces] = useState<PlaceData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadSampleExcel = async () => {
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
            const response = await getUploadDataSet(DD_TOKEN);
            setPlaces(response.data || []);
        } catch (error) {
            setPlaces([]);
        }
    }

    const handleViewPlace = (place: PlaceData) => {
        setSelectedPlace(place);
        setViewModalOpen(true);
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
                <h2 className="agency__title">Agency Data</h2>
                <section className="panel">
                    <div className="panel__header">
                        <div className="panel__title">Download Excel Template</div>
                        <button
                            type="button"
                            className="btn btn--success"
                            onClick={() => setDownloadModalOpen(true)}
                        >
                            <DownloadRoundedIcon fontSize="small" />
                            Download
                        </button>
                    </div>
                    <div className="panel__body">
                        <p className="panel__hint">
                            Please download this Excel template and review the sample data. You can then enter your own data
                            (required for report generation) and submit the completed Excel file using the section below.
                        </p>
                    </div>
                </section>

                <section className="panel">
                    <div className="panel__header">
                        <div className="panel__title">Upload Your Data Set</div>
                    </div>
                    <div className="panel__body">
                        <div
                            className={`dropzone ${isDragging ? 'dropzone--active' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <span className="dropzone__icon" aria-hidden="true">
                                <CloudUploadRoundedIcon />
                            </span>
                            <div className="dropzone__title">select your excel or drag and drop</div>
                            <div className="dropzone__sub">.xls, .xlsx accepted (max 10MB)</div>
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
                                browse
                            </button>
                        </div>
                    </div>
                </section>

                <section className="panel">
                    <div className="controls">
                        <label className="search">
                            <SearchRoundedIcon fontSize="small" aria-hidden="true" />
                            <input placeholder="Search Record" aria-label="Search Record" />
                        </label>
                        <button type="button" className="btn btn--orange">
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
                                ) : (
                                    places.map((place) => (
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
                                                    <button type="button" className="iconBtn iconBtn--edit" aria-label="Edit">
                                                        <EditRoundedIcon fontSize="inherit" />
                                                    </button>
                                                    <button type="button" className="iconBtn iconBtn--del" aria-label="Delete">
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
                            <strong>Showing</strong> <strong>{places.length}</strong> of <strong>{places.length}</strong> Entries
                        </div>

                        <div className="pagination" aria-label="Pagination">
                            <button type="button" className="pageBtn">Previous</button>
                            <button type="button" className="pageBtn pageBtn--active">1</button>
                            <button type="button" className="pageBtn">2</button>
                            <button type="button" className="pageBtn">3</button>
                            <button type="button" className="pageBtn">10</button>
                            <button type="button" className="pageBtn">Next</button>
                        </div>
                    </div>
                </section>
            </div>

            {downloadModalOpen && (
                <div className="ddModal" role="dialog" aria-modal="true" aria-label="Verify download">
                    <button
                        type="button"
                        className="ddModal__backdrop"
                        aria-label="Close"
                        onClick={() => setDownloadModalOpen(false)}
                    />

                    <div className="ddModal__card">
                        <div className="ddModal__logo" aria-hidden="true">
                            <img className="ddModal__img" src={excelImg} alt="Excel file icon" />
                        </div>

                        <div className="ddModal__title">Download Sample Excel</div>
                        <div className="ddModal__subtitle">
                            Are you sure you want to download the sample Excel template?
                        </div>

                        <div className="ddModal__actions">
                            <button
                                type="button"
                                className="ddModal__btn ddModal__btn--ghost"
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
                        className="ddModal__backdrop"
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

                    <div className="ddModal__card">
                        <div className="ddModal__logo" aria-hidden="true">
                            <img className="ddModal__img" src={excelImg} alt="Excel file icon" />
                        </div>

                        <div className="ddModal__title">Upload Excel File</div>
                        <div className="ddModal__subtitle" style={{ marginBottom: '12px' }}>
                            <strong>File:</strong> {selectedFile?.name}
                        </div>
                        <div className="ddModal__subtitle" style={{ color: '#f57c00', fontWeight: 'bold' }}>
                            ⚠️ Warning: After every Excel upload, previous uploaded data will be lost and replaced with new data.
                        </div>

                        <div className="ddModal__actions">
                            <button
                                type="button"
                                className="ddModal__btn ddModal__btn--ghost"
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
                        className="ddModal__backdrop"
                        aria-label="Close"
                        onClick={() => {
                            setViewModalOpen(false);
                            setSelectedPlace(null);
                        }}
                    />

                    <div className="ddModal__card ddModal__card--large">
                        <div className="ddModal__header">
                            <div className="ddModal__title">{selectedPlace.name}</div>
                            <button
                                type="button"
                                className="ddModal__close"
                                aria-label="Close"
                                onClick={() => {
                                    setViewModalOpen(false);
                                    setSelectedPlace(null);
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="ddModal__content">
                            <div className="detailSection">
                                <h3 className="detailSection__title">Basic Information</h3>
                                <div className="detailGrid">
                                    <div className="detailItem">
                                        <span className="detailItem__label">District:</span>
                                        <span className="detailItem__value">{selectedPlace.district}</span>
                                    </div>
                                    <div className="detailItem">
                                        <span className="detailItem__label">City:</span>
                                        <span className="detailItem__value">{selectedPlace.city}</span>
                                    </div>
                                    <div className="detailItem">
                                        <span className="detailItem__label">Average Visit Duration:</span>
                                        <span className="detailItem__value">{selectedPlace.averageVisitDuration}</span>
                                    </div>
                                </div>
                            </div>

                            {selectedPlace.description && (
                                <div className="detailSection">
                                    <h3 className="detailSection__title">Description</h3>
                                    <p className="detailSection__text">{selectedPlace.description}</p>
                                </div>
                            )}

                            {selectedPlace.funFact && (
                                <div className="detailSection">
                                    <h3 className="detailSection__title">Fun Fact</h3>
                                    <p className="detailSection__text">{selectedPlace.funFact}</p>
                                </div>
                            )}

                            <div className="detailSection">
                                <h3 className="detailSection__title">Images</h3>
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
                                            <div key={idx} className="imageGrid__item">
                                                <img
                                                    src={`data:image/jpeg;base64,${url}`}
                                                    alt={`${selectedPlace.name} - Image ${idx + 1}`}
                                                    className="imageGrid__img"
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
                                        <p className="detailSection__text">No images available</p>
                                    )}
                                </div>
                            </div>

                            <div className="detailSection">
                                <h3 className="detailSection__title">Metadata</h3>
                                <div className="detailGrid">
                                    <div className="detailItem">
                                        <span className="detailItem__label">Created By:</span>
                                        <span className="detailItem__value">{selectedPlace.createdBy}</span>
                                    </div>
                                    <div className="detailItem">
                                        <span className="detailItem__label">Created At:</span>
                                        <span className="detailItem__value">
                                            {new Date(selectedPlace.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                    {selectedPlace.lastModifiedBy && (
                                        <div className="detailItem">
                                            <span className="detailItem__label">Last Modified By:</span>
                                            <span className="detailItem__value">{selectedPlace.lastModifiedBy}</span>
                                        </div>
                                    )}
                                    {selectedPlace.lastModifiedAt && (
                                        <div className="detailItem">
                                            <span className="detailItem__label">Last Modified At:</span>
                                            <span className="detailItem__value">
                                                {new Date(selectedPlace.lastModifiedAt).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="ddModal__actions">
                            <button
                                type="button"
                                className="btn btn--orange"
                                onClick={() => {
                                    setViewModalOpen(false);
                                    setSelectedPlace(null);
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Navbar>
    );
}