import { useLocation, useParams } from "react-router-dom";
import { getChatbotCommands, getChatbotName } from "../services/chatbot-api";
import { checkClient, registerClient } from "../services/chat-api";
import { showError, showSuccess } from "../components/Toast";
import { useEffect, useState, useRef } from "react";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import SendIcon from "@mui/icons-material/Send";
import { CircularProgress } from "@mui/material";
import "../styles/chat.css";

interface Message {
    id: string;
    text: string;
    sender: "user" | "bot";
    timestamp: Date;
    options?: string[];
}

interface Command {
    id: string;
    index: number;
    message: string[];
    reply: string[];
    type: number;
    keywords: string;
}

export default function Chat() {
    const location = useLocation();
    const { tenantId, chatId } = useParams<{ tenantId: string; chatId: string }>();
    const [botName, setBotName] = useState("Chatbot");
    const [commands, setCommands] = useState<Command[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [currentCommandIndex, setCurrentCommandIndex] = useState(0);
    const [isEmailModalOpen, setIsEmailModalOpen] = useState(true);
    const [email, setEmail] = useState("");
    const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
    const [isClientReady, setIsClientReady] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleGetCommands = async () => {
        const botId = chatId || location.pathname.split("/").pop();
        try {
            setIsLoading(true);
            const res = await getChatbotCommands(botId || "", "");
            if (res && Array.isArray(res)) {
                setCommands(res.sort((a, b) => a.index - b.index));
                
                // Send first welcome message
                if (res.length > 0) {
                    const firstCommand = res.find(cmd => cmd.index === 1);
                    if (firstCommand) {
                        const welcomeMessage: Message = {
                            id: Date.now().toString(),
                            text: firstCommand.message[0] || "Hello! How can I help you?",
                            sender: "bot",
                            timestamp: new Date(),
                            options: firstCommand.type === 1 ? firstCommand.message : undefined
                        };
                        setMessages([welcomeMessage]);
                    }
                }
            }
        } catch (error) {
            console.error("Error loading commands:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetBotName = async () => {
        const botId = chatId || location.pathname.split("/").pop();
        try {
            const res = await getChatbotName(botId || "", "");
            setBotName(res.botName || "Chatbot");
        } catch (error) {
            console.error("Error loading bot name:", error);
        }
    };

    useEffect(() => {
        if (!isClientReady) return;

        handleGetCommands();
        handleGetBotName();
    }, [location.pathname, isClientReady]);

    const handleEmailSubmit = async () => {
        const trimmedEmail = email.trim();
        if (!trimmedEmail) {
            showError("Please enter your email.");
            return;
        }

        // Basic email format check
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            showError("Please enter a valid email address.");
            return;
        }

        setIsEmailSubmitting(true);
        try {
            try {
                const res = await checkClient(trimmedEmail);

                if (res?.chatUser) {
                    showSuccess("Welcome back! Let's continue your chat.");
                } else {
                    showSuccess("Welcome back!");
                }

                setIsClientReady(true);
                setIsEmailModalOpen(false);
                return;
            } catch (error: any) {
                const status = error?.response?.status;

                if (status !== 404) {
                    showError("Failed to verify email. Please try again.");
                    return;
                }
            }

            // 2) If not found (404), register a new client
            if (!tenantId) {
                showError("Missing tenant information for this chat.");
                return;
            }

            const defaultName = trimmedEmail.split("@")[0] || "Guest";

            try {
                await registerClient({
                    tenantId,
                    name: defaultName,
                    email: trimmedEmail,
                });

                showSuccess("You're registered. Let's start chatting!");
                setIsClientReady(true);
                setIsEmailModalOpen(false);
            } catch (error) {
                showError("Failed to register. Please try again.");
            }
        } finally {
            setIsEmailSubmitting(false);
        }
    };

    const handleSendMessage = (messageText?: string) => {
        const textToSend = messageText || inputText.trim();
        if (!textToSend) return;

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            text: textToSend,
            sender: "user",
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setInputText("");

        // Find matching command and send bot response
        setTimeout(() => {
            const nextCommand = commands.find(cmd => cmd.index === currentCommandIndex + 1);
            
            if (nextCommand) {
                const botResponse: Message = {
                    id: (Date.now() + 1).toString(),
                    text: nextCommand.reply[0] || "Thank you for your response.",
                    sender: "bot",
                    timestamp: new Date(),
                    options: nextCommand.type === 1 ? nextCommand.reply : undefined
                };
                setMessages(prev => [...prev, botResponse]);
                setCurrentCommandIndex(prev => prev + 1);
            } else {
                const finalMessage: Message = {
                    id: (Date.now() + 1).toString(),
                    text: "Thank you for chatting with us! Is there anything else I can help you with?",
                    sender: "bot",
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, finalMessage]);
            }
        }, 600);
    };

    const handleOptionClick = (option: string) => {
        handleSendMessage(option);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="chatPage">
            {isLoading && (
                <div className="chatPage-loadingOverlay">
                    <div className="chatPage-loading">
                        <CircularProgress size={48} sx={{ color: "var(--color-primary)" }} />
                        <p>Loading chat...</p>
                    </div>
                </div>
            )}
            {/* Header */}
            <div className="chatPage-header">
                <div className="chatPage-headerBot">
                    <div className="chatPage-headerBotAvatar">
                        <SmartToyIcon />
                    </div>
                    <div className="chatPage-headerBotInfo">
                        <h1 className="chatPage-headerBotName">{botName}</h1>
                        <span className="chatPage-headerBotStatus">Online</span>
                    </div>
                </div>
            </div>

            {/* Messages Container */}
            <div className="chatPage-messages">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`chatPage-messageWrapper chatPage-messageWrapper--${message.sender}`}
                    >
                        {message.sender === "bot" && (
                            <div className="chatPage-messageAvatar">
                                <SmartToyIcon />
                            </div>
                        )}
                        <div className="chatPage-messageContent">
                            <div className={`chatPage-messageBubble chatPage-messageBubble--${message.sender}`}>
                                {message.text}
                            </div>
                            {message.options && message.options.length > 0 && (
                                <div className="chatPage-messageOptions">
                                    {message.options.map((option, index) => (
                                        <button
                                            key={index}
                                            className="chatPage-optionBtn"
                                            onClick={() => handleOptionClick(option)}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            )}
                            <span className="chatPage-messageTime">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="chatPage-inputContainer">
                <div className="chatPage-inputWrapper">
                    <input
                        type="text"
                        className="chatPage-input"
                        placeholder="Type your message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={handleKeyPress}
                    />
                    <button
                        className="chatPage-sendBtn"
                        onClick={() => handleSendMessage()}
                        disabled={!inputText.trim()}
                        aria-label="Send message"
                    >
                        <SendIcon />
                    </button>
                </div>
            </div>

            {isEmailModalOpen && (
                <div className="ddModal" role="dialog" aria-modal="true" aria-label="Enter your email to start chat">
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        onClick={() => {}}
                        aria-hidden="true"
                    />
                    <div className="ddModal-card">
                        <div className="ddModal-title">Continue your chat</div>
                        <div className="ddModal-subtitle">
                            Enter your email so we can recognize you and keep your conversation.
                        </div>
                        <div style={{ marginTop: 16 }}>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        void handleEmailSubmit();
                                    }
                                }}
                                placeholder="you@example.com"
                                style={{
                                    width: "100%",
                                    padding: "10px 12px",
                                    borderRadius: 10,
                                    border: "1px solid var(--color-border)",
                                    fontSize: 14,
                                    outline: "none",
                                }}
                            />
                        </div>
                        <div className="ddModal-actions" style={{ gridTemplateColumns: "1fr" }}>
                            <button
                                className="ddModal-btn ddModal-btn--primary"
                                type="button"
                                onClick={() => void handleEmailSubmit()}
                                disabled={isEmailSubmitting}
                            >
                                {isEmailSubmitting ? "Please wait..." : "Continue"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}