import { useLocation, useParams } from "react-router-dom";
import { getChatbotCommands, getChatbotName } from "../services/chatbot-api";
import { checkClient, registerClient, sendMessage, getMessages } from "../services/chat-api";
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
    const [currentInputType, setCurrentInputType] = useState<number | null>(null); // 1 = options, 2 = free text
    const [currentOptions, setCurrentOptions] = useState<string[]>([]);
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

    // On mount, if we already have a stored chat client, skip the email modal
    useEffect(() => {
        const storedChatUserId = sessionStorage.getItem("dd_public_chat_user_id");
        const storedToken = sessionStorage.getItem("dd_public_chat_token");
        const storedChatId = sessionStorage.getItem("dd_public_chat_id");

        if (storedChatUserId && storedToken && storedChatId) {
            setIsClientReady(true);
            setIsEmailModalOpen(false);
        }
    }, []);

    const handleGetCommands = async () => {
        const botId = chatId || location.pathname.split("/").pop();
        try {
            setIsLoading(true);
            const res = await getChatbotCommands(botId || "", "");
            if (res && Array.isArray(res)) {
                const sortedCommands = res.sort((a, b) => a.index - b.index);
                setCommands(sortedCommands);
                
                // Initialize first command state only if no messages exist yet
                const firstCommand = sortedCommands.find(cmd => cmd.index === 1);
                if (firstCommand && messages.length === 0) {
                    setCurrentCommandIndex(firstCommand.index);
                    // Check if message array is empty or has values
                    if (firstCommand.message && firstCommand.message.length > 0) {
                        setCurrentInputType(1);
                        setCurrentOptions(firstCommand.message);
                    } else {
                        setCurrentInputType(2);
                        setCurrentOptions([]);
                    }
                }
                return sortedCommands;
            }
        } catch (error) {
            console.error("Error loading commands:", error);
        } finally {
            setIsLoading(false);
        }
        return [];
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

    const handleGetMessages = async (activeChatId: string, commandsList: Command[]) => {
        try {
            const res = await getMessages(activeChatId);
            const historyMessages = Array.isArray(res?.messages) ? res.messages : [];

            // Parse and display existing messages
            const parsedMessages: Message[] = historyMessages.map((m: any) => ({
                id: m.id || Date.now().toString(),
                text: m.message || "",
                sender: m.senderType === 2 ? "user" : "bot", // 2 = user (right), 1 = bot (left)
                timestamp: m.createdAt ? new Date(m.createdAt) : new Date(),
            }));

            setMessages(parsedMessages);

            // Determine next command index based on the last conversationIndex
            if (commandsList.length > 0) {
                const lastIndex = historyMessages.length > 0
                    ? [...historyMessages]
                        .reverse()
                        .find((m: any) => m.conversationIndex !== null && m.conversationIndex !== undefined)
                        ?.conversationIndex
                    : null;

                const nextIndex = typeof lastIndex === "number" ? lastIndex + 1 : 1;
                const nextCommand = commandsList.find(cmd => cmd.index === nextIndex);

                if (nextCommand) {
                    setCurrentCommandIndex(nextCommand.index);
                    // Check if message array is empty (type 2 - text input) or has values (type 1 - options)
                    if (nextCommand.message && nextCommand.message.length > 0) {
                        setCurrentInputType(1); // Has options
                        setCurrentOptions(nextCommand.message);
                    } else {
                        setCurrentInputType(2); // Text input
                        setCurrentOptions([]);
                    }
                } else {
                    // No more commands - enable text field
                    setCurrentInputType(2);
                    setCurrentOptions([]);
                }
            }
        } catch (error) {
            console.error("Failed to load messages", error);
        }
    }

    useEffect(() => {
        if (!isClientReady) return;

        const loadChatData = async () => {
            const commandsData = await handleGetCommands();
            await handleGetBotName();
            const storedChatId = sessionStorage.getItem("dd_public_chat_user_id");
            if (storedChatId && commandsData) {
                await handleGetMessages(storedChatId, commandsData);
            }
        };

        loadChatData();
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
                    sessionStorage.setItem("dd_public_chat_user_id", res.chatUser.id);
                    sessionStorage.setItem("dd_public_chat_email", res.chatUser.email ?? trimmedEmail);
                    sessionStorage.setItem("dd_public_chat_tenant_id", res.chatUser.tenantId ?? String(tenantId));
                    sessionStorage.setItem("dd_public_chat_id", location.pathname.split("/").pop() || "");
                    sessionStorage.setItem("dd_public_chat_token", res.token);
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
                const res = await registerClient({
                    tenantId,
                    name: defaultName,
                    email: trimmedEmail,
                });

                if (res?.chatUser?.id && res?.chatId && res?.token) {
                    sessionStorage.setItem("dd_public_chat_user_id", res.chatUser.id);
                    sessionStorage.setItem("dd_public_chat_email", res.chatUser.email ?? trimmedEmail);
                    sessionStorage.setItem("dd_public_chat_tenant_id", res.chatUser.tenantId ?? String(tenantId));
                    sessionStorage.setItem("dd_public_chat_id", res.chatId);
                    sessionStorage.setItem("dd_public_chat_token", res.token);
                }

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

    const handleSendMessage = async (messageText?: string, type?: any, botReplyText?: string) => {
        const textToSend = messageText || inputText.trim();
        if (!textToSend) return;

        const activeChatId = sessionStorage.getItem("dd_public_chat_id");
        if (!activeChatId) {
            showError("Chat is not ready. Please refresh the page.");
            return;
        }

        const activeCommand = commands.find(cmd => cmd.index === currentCommandIndex);
        
        // If no active command, still allow user to send message but don't auto-reply
        if (!activeCommand) {
            // Add user message only
            const userMessage: Message = {
                id: Date.now().toString(),
                text: textToSend,
                sender: "user",
                timestamp: new Date()
            };
            setInputText("");
            setMessages(prev => [...prev, userMessage]);

            // Send to backend
            try {
                await sendMessage({
                    chatId: activeChatId,
                    tenantId: sessionStorage.getItem("dd_public_chat_tenant_id") || "",
                    chatUserId: sessionStorage.getItem("dd_public_chat_user_id") || "",
                    message: textToSend,
                    senderType: type,
                    conversationIndex: null,
                });
            } catch (error) {
                console.error("Failed to send message to server", error);
            }
            return;
        }

        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            text: textToSend,
            sender: "user",
            timestamp: new Date()
        };
        setInputText("");

        // Send to backend chat API (fire and forget for now)
        try {
            await sendMessage({
                chatId: activeChatId,
                tenantId: sessionStorage.getItem("dd_public_chat_tenant_id") || "",
                chatUserId : sessionStorage.getItem("dd_public_chat_user_id") || "",
                message: textToSend,
                senderType : type,
                conversationIndex: currentCommandIndex || null,
            });
        } catch (error) {
            console.error("Failed to send message to server", error);
        }

        // Determine bot reply - use the passed botReplyText if provided (from option selection)
        const botText = botReplyText || (() => {
            if (activeCommand.message && activeCommand.message.length > 0) {
                const idx = activeCommand.message.findIndex(m => m === textToSend);
                return activeCommand.reply[idx >= 0 ? idx : 0] || "Thank you for your response.";
            }
            return activeCommand.reply[0] || "Thank you for your response.";
        })();
        
        const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: botText,
            sender: "bot",
            timestamp: new Date()
        };

        // Append both user and bot messages in order
        setMessages(prev => [...prev, userMessage, botMessage]);

        // Send bot response to backend as well
        try {
            await sendMessage({
                chatId: activeChatId,
                tenantId: sessionStorage.getItem("dd_public_chat_tenant_id") || "",
                chatUserId: sessionStorage.getItem("dd_public_chat_user_id") || "",
                message: botText,
                senderType: 1,
                conversationIndex: currentCommandIndex || null,
            });
        } catch (error) {
            console.error("Failed to send bot response to server", error);
        }

        // After sending, reload messages from server to determine the latest step
        try {
            const history = await getMessages(sessionStorage.getItem("dd_public_chat_user_id") || "");
            const historyMessages = Array.isArray(history?.messages) ? history.messages : [];

            if (commands.length > 0) {
                const lastIndex = historyMessages.length > 0
                    ? [...historyMessages]
                        .reverse()
                        .find((m: any) => m.conversationIndex !== null && m.conversationIndex !== undefined)
                        ?.conversationIndex
                    : null;

                const nextIndex = typeof lastIndex === "number" ? lastIndex + 1 : 1;
                const nextCommand = commands.find(cmd => cmd.index === nextIndex);

                if (nextCommand) {
                    setCurrentCommandIndex(nextCommand.index);
                    // Check if message array is empty (type 2 - text input) or has values (type 1 - options)
                    if (nextCommand.message && nextCommand.message.length > 0) {
                        setCurrentInputType(1); // Has options
                        setCurrentOptions(nextCommand.message);
                    } else {
                        setCurrentInputType(2); // Text input
                        setCurrentOptions([]);
                    }
                } else {
                    // No more commands - enable text field and clear command index
                    setCurrentCommandIndex(-1);
                    setCurrentInputType(2);
                    setCurrentOptions([]);
                }
            }
        } catch (error) {
            console.error("Failed to load chat history", error);
        }
    };

    const handleOptionClick = (option: string) => {
        // When user clicks an option, we need to find the index in the message array
        // and send both the user's choice and the bot's corresponding reply
        const activeCommand = commands.find(cmd => cmd.index === currentCommandIndex);
        if (!activeCommand) return;
        
        const optionIndex = activeCommand.message.findIndex(m => m === option);
        const botReply = optionIndex >= 0 && activeCommand.reply[optionIndex] 
            ? activeCommand.reply[optionIndex] 
            : activeCommand.reply[0] || "Thank you for your response.";
        
        handleSendMessage(option, 2, botReply);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(undefined, 2);
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
                            <span className="chatPage-messageTime">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Global options area near the input, on the right side */}
            {currentInputType === 1 && currentOptions.length > 0 && (
                <div className="chatPage-messageOptions chatPage-messageOptions--bottom">
                    {currentOptions.map((option, index) => (
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
                        disabled={currentInputType === 1}
                    />
                    <button
                        className="chatPage-sendBtn"
                        onClick={() => handleSendMessage(undefined, 2)}
                        disabled={currentInputType === 1 || !inputText.trim()}
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