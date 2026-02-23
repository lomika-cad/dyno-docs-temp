import { useState } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import SaveIcon from "@mui/icons-material/Save";
import Navbar from "../layouts/Navbar";
import { showError, showSuccess } from "../components/Toast";
import { createChatbot, createChatbotCommands } from "../services/chatbot-api";
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
    const DD_TOKEN = sessionStorage.getItem("dd_token") || "";
    const [infoOpen, setInfoOpen] = useState(false);
    const [saveConfirmModalOpen, setSaveConfirmModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
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
        // Validate that at least one flow is complete and there's at least one flow
        if (dialogFlows.length === 0) {
            showError("Please add at least one dialog step before saving.");
            return;
        }

        const incompleteFlows = dialogFlows.filter(flow => !isStepComplete(flow));
        if (incompleteFlows.length > 0) {
            showError("Please complete all dialog steps before saving. Check that agent responses are filled and client options are properly configured.");
            return;
        }

        // Open confirmation dialog
        setSaveConfirmModalOpen(true);
    };

    const handleConfirmSave = async () => {
        try {
            setIsSaving(true);
            const userName = sessionStorage.getItem("dd_full_name") || "User";
            const currentDate = new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // First, create the chatbot
            const chatbotData = {
                name: `Dialog Flow Chatbot - ${currentDate}`,
                isActive: true,
                createdBy: userName
            };

            const chatbotResponse = await createChatbot(chatbotData, DD_TOKEN);
            console.log("Chatbot created:", chatbotResponse);

            // Then, create commands for each dialog flow
            for (let i = 0; i < dialogFlows.length; i++) {
                const flow = dialogFlows[i];
                
                const commandData = {
                    chatId: "00000000-0000-0000-0000-000000000000", // Placeholder GUID - you may need to get actual chat ID
                    index: i + 1,
                    message: flow.clientType === "options" 
                        ? flow.clientOptions.map(opt => opt.text).filter(text => text.trim() !== "")
                        : [], // Empty for message type
                    reply: [flow.agentResponse],
                    type: flow.clientType === "options" ? 0 : 1, // 0 = Selection, 1 = Enter (based on CommandType enum)
                    keywords: flow.agentResponse.split(" ").slice(0, 3).join(", ").toLowerCase() // Generate keywords from response
                };

                await createChatbotCommands(commandData, DD_TOKEN);
            }

            showSuccess("Dialog flow saved successfully! Chatbot has been created with all commands.");
            setSaveConfirmModalOpen(false);
        } catch (error: any) {
            console.error("Failed to save dialog flow:", error);
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to save dialog flow. Please try again.";
            showError(errorMessage);
        } finally {
            setIsSaving(false);
        }
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
                            <SaveIcon fontSize="small" />
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

            {saveConfirmModalOpen && (
                <div className="ddModal" role="dialog" aria-modal="true" aria-label="Confirm save dialog flow">
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => {
                            if (!isSaving) {
                                setSaveConfirmModalOpen(false);
                            }
                        }}
                    />

                    <div className="ddModal-card">
                        <div className="ddModal-logo" aria-hidden="true">
                            <SaveIcon style={{ fontSize: 48, color: "#22c55e" }} />
                        </div>

                        <div className="ddModal-title">Save Dialog Flow</div>
                        <div className="ddModal-subtitle">
                            Are you sure you want to save this dialog flow? This will create a new chatbot with <strong>{dialogFlows.length} dialog step{dialogFlows.length > 1 ? 's' : ''}</strong>.
                        </div>

                        <div className="ddModal-actions">
                            <button
                                type="button"
                                className="ddModal-btn ddModal-btn--ghost"
                                onClick={() => setSaveConfirmModalOpen(false)}
                                disabled={isSaving}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn--success"
                                onClick={handleConfirmSave}
                                disabled={isSaving}
                            >
                                <SaveIcon fontSize="small" />
                                {isSaving ? 'Saving...' : 'Save Dialog Flow'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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