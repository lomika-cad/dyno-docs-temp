import { InfoOutline } from "@mui/icons-material";
import Navbar from "../layouts/Navbar";

export default function Chats() {
    return (
        <div>
            <Navbar>
                <div className="agency">
                <div className="agency-header">
                    <h2 className="agency-title">Chats</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        
                        <button
                            type="button"
                            className="infoBtn"
                            aria-label="Chatbot integration steps"
                            // onClick={() => setInfoOpen(true)}
                        >
                            <InfoOutline fontSize="small" />
                        </button>
                    </div>
                </div>
                </div>
            </Navbar>
        </div>
    );
}