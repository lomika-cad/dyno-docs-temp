import { useEffect, useState } from "react";
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
import { createChatbot, createChatbotCommands, getChatbotCommands, deleteChatbotCommand } from "../services/chatbot-api";
import "../styles/agencyData.css";
import "../styles/chatBot.css";
import Link from '@mui/icons-material/Link';
import { CircularProgress } from "@mui/material";

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
    agentOptions: DialogOption[];
    isLocked?: boolean;
}

export default function ChatBot() {
    const DD_TOKEN = sessionStorage.getItem("dd_token") || "";
    const DD_CHAT_USER_ID = sessionStorage.getItem("dd_chat_user_id") || "";
    const DD_TENANT_ID = sessionStorage.getItem("dd_tenant_id") || "";
    const [infoOpen, setInfoOpen] = useState(false);
    const [nameInputModalOpen, setNameInputModalOpen] = useState(false);
    const [saveConfirmModalOpen, setSaveConfirmModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [existingCommands, setExistingCommands] = useState<any[]>([]);
    const [chatbotName, setChatbotName] = useState("");
    const [dialogFlows, setDialogFlows] = useState<DialogFlow[]>([
        {
            id: "1",
            clientType: "message",
            clientText: "",
            clientOptions: [],
            agentResponse: "",
            agentOptions: [],
            isLocked: false
        }
    ]);

    const convertCommandsToDialogFlows = (commands: any[]): DialogFlow[] => {
        if (!commands || commands.length === 0) {
            return [{
                id: "1",
                clientType: "message",
                clientText: "",
                clientOptions: [],
                agentResponse: "",
                agentOptions: [],
                isLocked: false
            }];
        }

        return commands.map(command => {
            const isOptionsType = command.type === 1;
            const clientOptions: DialogOption[] = isOptionsType
                ? command.message.map((msg: string, index: number) => ({
                    id: `${command.id}_client_${index}`,
                    text: msg
                }))
                : [];

            const agentOptions: DialogOption[] = isOptionsType && command.reply
                ? command.reply.map((reply: string, index: number) => ({
                    id: `${command.id}_agent_${index}`,
                    text: reply
                }))
                : [];

            return {
                id: command.id || command.index.toString(),
                clientType: isOptionsType ? "options" as const : "message" as const,
                clientText: "",
                clientOptions,
                agentResponse: !isOptionsType && command.reply && command.reply.length > 0 ? command.reply[0] : "",
                agentOptions,
                isLocked: false
            };
        });
    };

    const handleGetCommands = async (chatId: any) => {
        sessionStorage.setItem("dd_chat_user_id", chatId);
        try {
            setIsLoading(true);
            const res = await getChatbotCommands(chatId, DD_TOKEN);
            if (res && Array.isArray(res)) {
                setExistingCommands(res); // Store existing commands with their IDs
                const convertedFlows = convertCommandsToDialogFlows(res);
                setDialogFlows(convertedFlows);
                console.log("Loaded chatbot commands:", res);
                console.log("Converted to dialog flows:", convertedFlows);
            }
        } catch (error) {
            console.error("Error fetching chatbot commands:", error);
            showError("Failed to load existing chatbot commands.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (DD_CHAT_USER_ID) {
            handleGetCommands(DD_CHAT_USER_ID);
        }
    }, [DD_CHAT_USER_ID]);

    const addDialogFlow = () => {
        const newFlow: DialogFlow = {
            id: Date.now().toString(),
            clientType: "message",
            clientText: "",
            clientOptions: [],
            agentResponse: "",
            agentOptions: [],
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
            const newClientOption: DialogOption = {
                id: Date.now().toString(),
                text: ""
            };
            const newAgentOption: DialogOption = {
                id: Date.now().toString() + "_agent",
                text: ""
            };
            updateDialogFlow(flowId, {
                clientOptions: [...flow.clientOptions, newClientOption],
                agentOptions: [...flow.agentOptions, newAgentOption]
            });
        }
    };

    const removeClientOption = (flowId: string, optionId: string) => {
        const flow = dialogFlows.find(f => f.id === flowId);
        if (flow) {
            const optionIndex = flow.clientOptions.findIndex(opt => opt.id === optionId);
            updateDialogFlow(flowId, {
                clientOptions: flow.clientOptions.filter(opt => opt.id !== optionId),
                agentOptions: flow.agentOptions.filter((_, index) => index !== optionIndex)
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
    const updateAgentOption = (flowId: string, optionIndex: number, text: string) => {
        const flow = dialogFlows.find(f => f.id === flowId);
        if (flow) {
            updateDialogFlow(flowId, {
                agentOptions: flow.agentOptions.map((opt, index) =>
                    index === optionIndex ? { ...opt, text } : opt
                )
            });
        }
    };

    const isStepComplete = (flow: DialogFlow): boolean => {
        if (flow.clientType === "options") {
            return flow.clientOptions.length > 0 &&
                flow.clientOptions.every(option => option.text.trim() !== "") &&
                flow.agentOptions.length > 0 &&
                flow.agentOptions.every(option => option.text.trim() !== "");
        }
        return flow.agentResponse.trim() !== "";
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

        // Check if we're updating existing chatbot or creating new one
        if (DD_CHAT_USER_ID) {
            // Updating existing chatbot - skip name input and go directly to confirmation
            setSaveConfirmModalOpen(true);
        } else {
            // Creating new chatbot - open name input dialog first
            setChatbotName(""); // Reset name
            setNameInputModalOpen(true);
        }
    };

    const handleNameSubmit = () => {
        if (!chatbotName.trim()) {
            showError("Please enter a chatbot name.");
            return;
        }

        // Close name modal and open confirmation modal
        setNameInputModalOpen(false);
        setSaveConfirmModalOpen(true);
    };

    const handleConfirmSave = async () => {
        try {
            setIsSaving(true);
            const userName = sessionStorage.getItem("dd_full_name") || "User";

            if (DD_CHAT_USER_ID) {
                // First, delete all existing commands
                if (existingCommands.length > 0) {
                    for (const existingCommand of existingCommands) {
                        await deleteChatbotCommand(existingCommand.id, DD_TOKEN);
                    }
                }

                // Then, create all new commands
                for (let i = 0; i < dialogFlows.length; i++) {
                    const flow = dialogFlows[i];
                    
                    const commandData = {
                        chatId: DD_CHAT_USER_ID,
                        index: i + 1,
                        message: flow.clientType === "options"
                            ? flow.clientOptions.map(opt => opt.text).filter(text => text.trim() !== "")
                            : [], // Empty for message type
                        reply: flow.clientType === "options"
                            ? flow.agentOptions.map(opt => opt.text).filter(text => text.trim() !== "")
                            : [flow.agentResponse],
                        type: flow.clientType === "options" ? 1 : 2, // 1 = Options/Selection, 2 = Message/Enter
                        keywords: flow.clientType === "options"
                            ? flow.agentOptions.map(opt => opt.text).join(", ").toLowerCase()
                            : flow.agentResponse.split(" ").slice(0, 3).join(", ").toLowerCase() // Generate keywords from response
                    };

                    // Create new command
                    await createChatbotCommands(commandData, DD_TOKEN);
                }

                showSuccess("Chatbot commands updated successfully!");
                setSaveConfirmModalOpen(false);
            } else {
                // Create new chatbot
                const chatbotData = {
                    name: chatbotName.trim(),
                    isActive: true,
                    createdBy: userName
                };

                const chatbotResponse = await createChatbot(chatbotData, DD_TOKEN);

                // Extract ChatId from the response
                const chatId = chatbotResponse;

                // Then, create commands for each dialog flow
                for (let i = 0; i < dialogFlows.length; i++) {
                    const flow = dialogFlows[i];

                    const commandData = {
                        chatId: chatId, // Use the actual ChatId from createChatbot response
                        index: i + 1,
                        message: flow.clientType === "options"
                            ? flow.clientOptions.map(opt => opt.text).filter(text => text.trim() !== "")
                            : [], // Empty for message type
                        reply: flow.clientType === "options"
                            ? flow.agentOptions.map(opt => opt.text).filter(text => text.trim() !== "")
                            : [flow.agentResponse],
                        type: flow.clientType === "options" ? 1 : 2, // 1 = Options/Selection, 2 = Message/Enter
                        keywords: flow.clientType === "options"
                            ? flow.agentOptions.map(opt => opt.text).join(", ").toLowerCase()
                            : flow.agentResponse.split(" ").slice(0, 3).join(", ").toLowerCase() // Generate keywords from response
                    };

                    await createChatbotCommands(commandData, DD_TOKEN);
                }

                showSuccess(`Chatbot "${chatbotName}" saved successfully! Dialog flow has been created with all commands.`);
                handleGetCommands(chatId);
                setSaveConfirmModalOpen(false);
            }

        } catch (error: any) {
            console.error("Failed to save dialog flow:", error);
            const errorMessage = error?.response?.data?.message || error?.message || "Failed to save dialog flow. Please try again.";
            showError(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCopyUrl = () => {
        if (!DD_TENANT_ID || !DD_CHAT_USER_ID) {
            showError("Unable to generate URL. Missing tenant or chat information.");
            return;
        }

        const chatUrl = `/chat/${DD_TENANT_ID}/${DD_CHAT_USER_ID}`;
        
        navigator.clipboard.writeText(window.location.origin + chatUrl)
            .then(() => {
                showSuccess("Chat URL copied to clipboard!");
            })
            .catch((err) => {
                console.error("Failed to copy URL:", err);
                showError("Failed to copy URL to clipboard.");
            });
    };

    return (
        <Navbar>
            <div className="agency">
                <div className="agency-header">
                    <h2 className="agency-title">Chatbot Integration</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        
                        <button
                            type="button"
                            className="infoBtn"
                            aria-label="Chatbot integration steps"
                            onClick={() => setInfoOpen(true)}
                        >
                            <InfoOutlinedIcon fontSize="small" />
                        </button>
                    </div>
                </div>

                {/* Dialog Flow Builder */}
                <div className="chatbot-builder">
                    <div className="chatbot-builder-header">
                        <div className="chatbot-section-title">
                            <SmartToyIcon className="chatbot-icon" />
                            Dialog Flow Builder

                            {DD_CHAT_USER_ID && (
                            <button
                                type="button"
                                className="infoBtn"
                                aria-label="Copy chat URL"
                                title="Copy chat URL"
                                onClick={handleCopyUrl}
                                style={{ color: 'black' }}
                            >
                                <Link fontSize="small" />
                            </button>
                        )}
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
                        {isLoading ? (
                            <div className="chatbot-loading" style={{ textAlign: 'center', padding: '40px' }}>
                                <CircularProgress size={40} sx={{ color: 'var(--accent-600, #ff6b00)' }} />
                                <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading existing commands...</p>
                            </div>
                        ) : (
                            dialogFlows.map((flow, index) => (
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
                                                onChange={(e) => {
                                                    const newType = e.target.value as "message" | "options";
                                                    if (newType === "options") {
                                                        // When switching to options, create initial agent options to match client options
                                                        const initialAgentOptions = flow.clientOptions.length > 0
                                                            ? flow.clientOptions.map((_, index) => ({
                                                                id: `${flow.id}_agent_${index}_${Date.now()}`,
                                                                text: ""
                                                            }))
                                                            : [];
                                                        updateDialogFlow(flow.id, {
                                                            clientType: newType,
                                                            agentOptions: initialAgentOptions,
                                                            agentResponse: "" // Clear single response when switching to options
                                                        });
                                                    } else {
                                                        // When switching to message, clear options
                                                        updateDialogFlow(flow.id, {
                                                            clientType: newType,
                                                            clientOptions: [],
                                                            agentOptions: []
                                                        });
                                                    }
                                                }}
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

                                        {flow.clientType === "message" ? (
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
                                        ) : (
                                            <div className="formField">
                                                <div className="chatbot-options-header">
                                                    <label className="formField-label">Agent Response Options</label>
                                                </div>

                                                <div className="chatbot-options-list">
                                                    {flow.agentOptions.map((option, index) => (
                                                        <div key={index} className="chatbot-option-item">
                                                            <input
                                                                type="text"
                                                                className="formField-input"
                                                                placeholder={`Response for option ${index + 1}`}
                                                                value={option.text}
                                                                disabled={flow.isLocked}
                                                                onChange={(e) => updateAgentOption(flow.id, index, e.target.value)}
                                                            />
                                                        </div>
                                                    ))}
                                                    {flow.agentOptions.length === 0 && (
                                                        <p className="chatbot-empty-options">
                                                            Add client options to create corresponding agent responses.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            ))
                        )}
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

            {nameInputModalOpen && (
                <div className="ddModal" role="dialog" aria-modal="true" aria-label="Enter chatbot name">
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => setNameInputModalOpen(false)}
                    />

                    <div className="ddModal-card">
                        <div className="ddModal-logo" aria-hidden="true">
                            <SmartToyIcon style={{ fontSize: 48, color: "#f59e0b" }} />
                        </div>

                        <div className="ddModal-title">Name Your Chatbot</div>
                        <div className="ddModal-subtitle">
                            Enter a name for your chatbot. This will help you identify it later.
                        </div>

                        <div className="ddModal-content" style={{ marginTop: 20 }}>
                            <div className="formField">
                                <label className="formField-label">Chatbot Name</label>
                                <input
                                    type="text"
                                    className="formField-input"
                                    placeholder="Enter chatbot name..."
                                    value={chatbotName}
                                    onChange={(e) => setChatbotName(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleNameSubmit();
                                        }
                                    }}
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="ddModal-actions">
                            <button
                                type="button"
                                className="ddModal-btn ddModal-btn--ghost"
                                onClick={() => setNameInputModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn--orange"
                                onClick={handleNameSubmit}
                            >
                                Continue
                            </button>
                        </div>
                    </div>
                </div>
            )}

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

                        <div className="ddModal-title">{DD_CHAT_USER_ID ? 'Update' : 'Save'} Dialog Flow</div>
                        <div className="ddModal-subtitle">
                            {DD_CHAT_USER_ID ? (
                                `Are you sure you want to update the chatbot commands with ${dialogFlows.length} dialog step${dialogFlows.length > 1 ? 's' : ''}?`
                            ) : (
                                <>Are you sure you want to save the chatbot <strong>"{chatbotName}"</strong> with <strong>{dialogFlows.length} dialog step{dialogFlows.length > 1 ? 's' : ''}</strong>?</>
                            )}
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
                                {isSaving ? (DD_CHAT_USER_ID ? 'Updating...' : 'Saving...') : (DD_CHAT_USER_ID ? 'Update Commands' : 'Save Dialog Flow')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isSaving && (
                <div className="globalLoader" role="status" aria-live="polite">
                    <CircularProgress size={56} sx={{ color: 'var(--accent-600, #ff6b00)' }} />
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