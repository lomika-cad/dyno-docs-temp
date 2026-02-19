import { useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import Navbar from "../layouts/Navbar";
import "../styles/agencyData.css";
import "../styles/chatBot.css";

interface DialogOption {
    id: string;
    text: string;
}

interface DialogFlow {
    id: string;
    clientType: "message" | "options";
    clientText: string;
    clientOptions: DialogOption[];
    agentResponse: string;
    isLocked?: boolean;
}

export default function ChatBot() {
    const [infoOpen, setInfoOpen] = useState(false);
    const [dialogFlows, setDialogFlows] = useState<DialogFlow[]>([
        {
            id: "1",
            clientType: "message",
            clientText: "",
            clientOptions: [],
            agentResponse: "",
            isLocked: false
        }
    ]);

    const addDialogFlow = () => {
        const newFlow: DialogFlow = {
            id: Date.now().toString(),
            clientType: "message",
            clientText: "",
            clientOptions: [],
            agentResponse: "",
            isLocked: false
        };
        setDialogFlows([...dialogFlows, newFlow]);
    };

    const removeDialogFlow = (id: string) => {
        if (dialogFlows.length > 1) {
            setDialogFlows(dialogFlows.filter(flow => flow.id !== id));
        }
    };

    const updateDialogFlow = (id: string, updates: Partial<DialogFlow>) => {
        setDialogFlows(dialogFlows.map(flow => 
            flow.id === id ? { ...flow, ...updates } : flow
        ));
    };

    const addClientOption = (flowId: string) => {
        const flow = dialogFlows.find(f => f.id === flowId);
        if (flow) {
            const newOption: DialogOption = {
                id: Date.now().toString(),
                text: ""
            };
            updateDialogFlow(flowId, {
                clientOptions: [...flow.clientOptions, newOption]
            });
        }
    };

    const removeClientOption = (flowId: string, optionId: string) => {
        const flow = dialogFlows.find(f => f.id === flowId);
        if (flow) {
            updateDialogFlow(flowId, {
                clientOptions: flow.clientOptions.filter(opt => opt.id !== optionId)
            });
        }
    };

    const updateClientOption = (flowId: string, optionId: string, text: string) => {
        const flow = dialogFlows.find(f => f.id === flowId);
        if (flow) {
            updateDialogFlow(flowId, {
                clientOptions: flow.clientOptions.map(opt => 
                    opt.id === optionId ? { ...opt, text } : opt
                )
            });
        }
    };

    const isStepComplete = (flow: DialogFlow): boolean => {
        if (!flow.agentResponse.trim()) return false;
        if (flow.clientType === "options") {
            return flow.clientOptions.length > 0 && 
                   flow.clientOptions.every(option => option.text.trim() !== "");
        }
        return true;
    };

    const toggleLock = (flowId: string) => {
        updateDialogFlow(flowId, { 
            isLocked: !dialogFlows.find(f => f.id === flowId)?.isLocked 
        });
    };

    const handleSaveDialogFlow = () => {
        // Here you can implement the logic to save the dialog flows
        console.log("Dialog Flows:", dialogFlows);
        alert("Dialog flows saved successfully!");
    };

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

                {/* Dialog Flow Builder */}
                <div className="chatbot-builder">
                    <div className="chatbot-builder-header">
                        <div className="chatbot-section-title">
                            <SmartToyIcon className="chatbot-icon" />
                            Dialog Flow Builder
                        </div>
                        <button
                            type="button"
                            className="btn btn--orange"
                            onClick={addDialogFlow}
                        >
                            <AddIcon fontSize="small" />
                            Add Dialog Step
                        </button>
                    </div>

                    <div className="chatbot-flows">
                        {dialogFlows.map((flow, index) => (
                            <div key={flow.id} className={`chatbot-flow-card ${flow.isLocked ? 'chatbot-flow-card--locked' : ''}`}>
                                <div className="chatbot-flow-header">
                                    <div className="chatbot-flow-status">
                                        <span className="chatbot-flow-number">Step {index + 1}</span>
                                        {isStepComplete(flow) && (
                                            <CheckCircleIcon className="chatbot-done-icon" />
                                        )}
                                    </div>
                                    <div className="chatbot-flow-actions">
                                        <button
                                            type="button"
                                            className={`chatbot-lock-btn ${flow.isLocked ? 'chatbot-lock-btn--locked' : ''}`}
                                            onClick={() => toggleLock(flow.id)}
                                            aria-label={flow.isLocked ? "Unlock step" : "Lock step"}
                                            title={flow.isLocked ? "Unlock step" : "Lock step"}
                                        >
                                            {flow.isLocked ? (
                                                <LockIcon fontSize="small" />
                                            ) : (
                                                <LockOpenIcon fontSize="small" />
                                            )}
                                        </button>
                                        {dialogFlows.length > 1 && (
                                            <button
                                                type="button"
                                                className="chatbot-remove-btn"
                                                onClick={() => removeDialogFlow(flow.id)}
                                                aria-label="Remove dialog step"
                                                disabled={flow.isLocked}
                                            >
                                                <DeleteOutlineIcon fontSize="small" />
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="chatbot-flow-content">
                                    {/* Client Side (Left) */}
                                    <div className="chatbot-side chatbot-side--client">
                                        <div className="chatbot-side-header">
                                            <PersonIcon className="chatbot-side-icon" />
                                            <span className="chatbot-side-title">Client Message</span>
                                        </div>

                                        <div className="formField">
                                            <label className="formField-label">Message Type</label>
                                            <select
                                                className="formField-input"
                                                value={flow.clientType}
                                                disabled={flow.isLocked}
                                                onChange={(e) => updateDialogFlow(flow.id, {
                                                    clientType: e.target.value as "message" | "options",
                                                    clientOptions: e.target.value === "message" ? [] : flow.clientOptions
                                                })}
                                            >
                                                <option value="message">Type a Message</option>
                                                <option value="options">Options</option>
                                            </select>
                                        </div>

                                        {flow.clientType === "message" ? (
                                            <div className="formField">
                                                <label className="formField-label">Message Preview</label>
                                                <textarea
                                                    className="formField-textarea chatbot-textarea--disabled"
                                                    placeholder="Keep it empty, client will type here..."
                                                    disabled
                                                    rows={3}
                                                />
                                                <p className="chatbot-hint">
                                                    This field is for display only - clients will type their messages here.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="formField">
                                                <div className="chatbot-options-header">
                                                    <label className="formField-label">Client Options</label>
                                                    <button
                                                        type="button"
                                                        className="chatbot-add-option-btn"
                                                        disabled={flow.isLocked}
                                                        onClick={() => addClientOption(flow.id)}
                                                    >
                                                        <AddIcon fontSize="small" />
                                                        Add Option
                                                    </button>
                                                </div>
                                                
                                                <div className="chatbot-options-list">
                                                    {flow.clientOptions.map((option) => (
                                                        <div key={option.id} className="chatbot-option-item">
                                                            <input
                                                                type="text"
                                                                className="formField-input"
                                                                placeholder="Enter option text"
                                                                value={option.text}
                                                                disabled={flow.isLocked}
                                                                onChange={(e) => updateClientOption(flow.id, option.id, e.target.value)}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="chatbot-remove-option-btn"
                                                                disabled={flow.isLocked}
                                                                onClick={() => removeClientOption(flow.id, option.id)}
                                                                aria-label="Remove option"
                                                            >
                                                                <DeleteOutlineIcon fontSize="small" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                    {flow.clientOptions.length === 0 && (
                                                        <p className="chatbot-empty-options">
                                                            Click "Add Option" to create selectable options for clients.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Agent Side (Right) */}
                                    <div className="chatbot-side chatbot-side--agent">
                                        <div className="chatbot-side-header">
                                            <SmartToyIcon className="chatbot-side-icon" />
                                            <span className="chatbot-side-title">Agent Response</span>
                                        </div>

                                        <div className="formField">
                                            <label className="formField-label">Response Message</label>
                                            <textarea
                                                className="formField-textarea"
                                                placeholder="Enter agent's response message..."
                                                value={flow.agentResponse}
                                                disabled={flow.isLocked}
                                                onChange={(e) => updateDialogFlow(flow.id, { agentResponse: e.target.value })}
                                                rows={4}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="chatbot-builder-actions">
                        <button
                            type="button"
                            className="btn btn--success"
                            onClick={handleSaveDialogFlow}
                        >
                            Save Dialog Flow
                        </button>
                        <button
                            type="button"
                            className="btn btn--orange"
                            onClick={addDialogFlow}
                        >
                            <AddIcon fontSize="small" />
                            Add Another Step
                        </button>
                    </div>
                </div>
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