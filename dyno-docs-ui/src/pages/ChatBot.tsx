import { useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Navbar from "../layouts/Navbar";
import "../styles/agencyData.css";

export default function ChatBot() {
    const [infoOpen, setInfoOpen] = useState(false);

    return (
        <Navbar>
            <div className="agency">
                <div className="agency-header">
                    <h2 className="agency-title">Chatbot Integration</h2>
                    <button
                        type="button"
                        className="infoBtn"
                        aria-label="Chatbot integration steps"
                        onClick={() => setInfoOpen(true)}
                    >
                        <InfoOutlinedIcon fontSize="small" />
                    </button>
                </div>
                <p className="panel-hint">
                    Connect DynoDocs with your preferred chat widget and expose instant travel answers on your site.
                </p>
            </div>

            {infoOpen && (
                <div className="ddModal" role="dialog" aria-modal="true" aria-label="Chatbot integration guide">
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => setInfoOpen(false)}
                    />

                    <div className="ddModal-card">
                        <div className="ddModal-subtitle" style={{ textAlign: "left", marginTop: 8 }}>
                            High-level steps for enabling the chatbot experience:
                        </div>
                        <div className="ddModal-content">
                            <ol>
                                <li>Generate your chatbot credentials from DynoDocs and copy the provided script snippet.</li>
                                <li>Paste the snippet into your website or CRM portal where you want the chat icon to appear.</li>
                                <li>Configure tenant-specific responses, handoff rules, and branding settings inside DynoDocs.</li>
                                <li>Test the bot, then monitor conversations and usage analytics from the dashboard.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            )}
        </Navbar>
    );
}