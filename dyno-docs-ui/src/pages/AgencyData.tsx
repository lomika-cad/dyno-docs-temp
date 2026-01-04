import Navbar from "../layouts/Navbar";
import "../styles/agencyData.css";
import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteRoundedIcon from "@mui/icons-material/DeleteRounded";

export default function AgencyData() {
    return (
        <Navbar userName="User">
            <h2>Agency Data</h2>
            <div className="agency">
                <section className="panel">
                    <div className="panel__header">
                        <div className="panel__title">Download Excel Template</div>
                        <button type="button" className="btn btn--success">
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
                        <div className="dropzone">
                            <span className="dropzone__icon" aria-hidden="true">
                                <CloudUploadRoundedIcon />
                            </span>
                            <div className="dropzone__title">select your excel or drag and drop</div>
                            <div className="dropzone__sub">.xls, .xlsx accepted</div>
                            <button type="button" className="btn btn--orange">
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
                                    <th>District</th>
                                    <th>Visiting Place</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {["Trincomalee", "Nuwara Eliya", "Kandy", "Hikkaduwa", "Kataragama"].map((district, idx) => (
                                    <tr key={district}>
                                        <td>{district}</td>
                                        <td>
                                            {
                                                [
                                                    "Koneshvaram Kovil",
                                                    "Victoria Park",
                                                    "Temple of the Tooth",
                                                    "Beach",
                                                    "Temple",
                                                ][idx]
                                            }
                                        </td>
                                        <td>
                                            <span className="actions">
                                                <button type="button" className="iconBtn iconBtn--view" aria-label="View">
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
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="footerRow">
                        <div className="panel__hint">
                            <strong>Showing</strong> <strong>1-5</strong> of <strong>50</strong> Entries
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
        </Navbar>
    );
}