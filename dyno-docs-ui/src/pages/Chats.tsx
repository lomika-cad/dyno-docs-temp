import { useState, useEffect, useRef, useCallback } from "react";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SendIcon from "@mui/icons-material/Send";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import CircularProgress from "@mui/material/CircularProgress";
import CloseIcon from "@mui/icons-material/Close";
import Navbar from "../layouts/Navbar";
import { checkBotStatus, getAvailableChats, readMessages } from "../services/agent-api";
import { getMessages, sendMessage } from "../services/chat-api";
import { summarizeChat } from "../services/ai-api";
import type { ChatMessage } from "../services/ai-api";
import { showError, showSuccess } from "../components/Toast";
import "../styles/chats.css";
import { InfoOutline } from "@mui/icons-material";

interface ChatItem {
    id: string; // Client user ID
    chatId: string; // Actual chat ID (like dd_public_chat_id)
    name: string;
    email: string;
    lastMessage: string;
    lastMessageDate: string;
    unreadCount?: number;
    isBotOn?: boolean;
}

interface Message {
    id: string;
    sender: "bot" | "user"; // "bot" = left side (gray), "user" = right side (orange)
    text: string;
    timestamp: string;
}

export default function Chats() {
    const DD_TOKEN = sessionStorage.getItem("dd_token") || "";
    const DD_TENANT_ID = sessionStorage.getItem("dd_tenant_id") || "";
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [botStatus, setBotStatus] = useState(false);
    const isRefreshingRef = useRef(false); // Prevent concurrent refreshes
    const [isAiThinking, setIsAiThinking] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);

    useEffect(() => {
        loadChats();
    }, []);

    useEffect(() => {
        if (selectedChat) {
            loadMessages(selectedChat.id);
            checkAndSetBotStatus(selectedChat.id);
        }
    }, [selectedChat]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadChats = async () => {
        try {
            setIsLoadingChats(true);
            const response = await getAvailableChats(DD_TOKEN);

            console.log("API Response:", response);

            // Transform the response to flatten clientUsers into individual chat items
            const transformedChats: ChatItem[] = [];

            if (Array.isArray(response)) {
                // Flatten all client users from all chats
                for (const chat of response) {
                    // Check if chat has clientUsers array
                    if (chat.clientUsers && Array.isArray(chat.clientUsers)) {
                        // Create a chat item for each client user
                        for (const clientUser of chat.clientUsers) {
                            try {
                                // Fetch messages for this client to get the last message
                                const messagesResponse = await getMessages(clientUser.id);
                                const messagesList = messagesResponse.messages || messagesResponse || [];

                                const lastMessage = messagesList.length > 0
                                    ? messagesList[messagesList.length - 1]
                                    : null;

                                transformedChats.push({
                                    id: clientUser.id,
                                    chatId: chat.id, // Store the parent chat ID
                                    name: clientUser.name || "Anonymous User",
                                    email: clientUser.email || "",
                                    lastMessage: lastMessage
                                        ? (lastMessage.message || lastMessage.text || "No messages yet")
                                        : "No messages yet",
                                    lastMessageDate: formatDate(
                                        lastMessage?.createdAt || lastMessage?.timestamp || chat.createdAt || new Date().toISOString()
                                    ),
                                    unreadCount: clientUser.unreadMessageCount || 0
                                });
                            } catch (msgError) {
                                console.warn(`Failed to fetch messages for client ${clientUser.id}:`, msgError);
                                // Add chat item without last message info
                                transformedChats.push({
                                    id: clientUser.id,
                                    chatId: chat.id, // Store the parent chat ID
                                    name: clientUser.name || "Anonymous User",
                                    email: clientUser.email || "",
                                    lastMessage: "No messages yet",
                                    lastMessageDate: formatDate(chat.createdAt || new Date().toISOString()),
                                    unreadCount: clientUser.unreadMessageCount || 0
                                });
                            }
                        }
                    }
                }
            }

            console.log("Transformed Chats:", transformedChats);
            setChats(transformedChats);

            // Don't auto-select any chat - let user choose
        } catch (error: any) {
            console.error("Failed to load chats:", error);
            showError("Failed to load chats. Please try again.");
        } finally {
            setIsLoadingChats(false);
        }
    };

    const loadMessages = async (chatUserId: string) => {
        try {
            setIsLoadingMessages(true);
            const response = await getMessages(chatUserId);
            let messagesList = [];
            if (response.messages && Array.isArray(response.messages)) {
                messagesList = response.messages;
            } else if (Array.isArray(response)) {
                messagesList = response;
            }

            const transformedMessages: Message[] = messagesList.map((msg: any) => {
                const isClientMessage = msg.senderType === 2;

                return {
                    id: msg.id || msg.messageId,
                    sender: isClientMessage ? "bot" : "user",
                    text: msg.message || msg.text || msg.content,
                    timestamp: msg.timestamp || msg.createdAt || msg.createdDate || new Date().toISOString()
                };
            });
            setMessages(transformedMessages);

            // Scroll to bottom after messages are loaded
            setTimeout(() => {
                scrollToBottom();
            }, 100);

            // Mark messages as read
            try {
                await readMessages(chatUserId, DD_TOKEN);
                // Update the unread count in the chat list
                setChats(prevChats =>
                    prevChats.map(chat =>
                        chat.id === chatUserId ? { ...chat, unreadCount: 0 } : chat
                    )
                );
            } catch (readError) {
                console.error("Failed to mark messages as read:", readError);
            }
        } catch (error: any) {
            console.error("Failed to load messages:", error);
            showError("Failed to load messages. Please try again.");
        } finally {
            setIsLoadingMessages(false);
        }
    };

    const checkAndSetBotStatus = async (chatUserId: string) => {
        try {
            const response = await checkBotStatus(chatUserId, DD_TOKEN);
            console.log("Bot Status Response:", response);
            // Response is expected to be { isBotOn: true/false }
            setBotStatus(response.isBotOn || false);
        } catch (error: any) {
            console.error("Failed to check bot status:", error);
            // Default to false (allow messaging) if check fails
            setBotStatus(false);
        }
    };

    const silentLoadMessages = async (chatUserId: string) => {
        try {
            const response = await getMessages(chatUserId);
            let messagesList = [];
            if (response.messages && Array.isArray(response.messages)) {
                messagesList = response.messages;
            } else if (Array.isArray(response)) {
                messagesList = response;
            }

            const transformedMessages: Message[] = messagesList.map((msg: any) => {
                const isClientMessage = msg.senderType === 2;

                return {
                    id: msg.id || msg.messageId,
                    sender: isClientMessage ? "bot" : "user",
                    text: msg.message || msg.text || msg.content,
                    timestamp: msg.timestamp || msg.createdAt || msg.createdDate || new Date().toISOString()
                };
            });
            setMessages(transformedMessages);

            // Scroll to bottom after messages are loaded
            setTimeout(() => {
                scrollToBottom();
            }, 100);

            // Mark messages as read
            try {
                await readMessages(chatUserId, DD_TOKEN);
                // Update the unread count in the chat list
                setChats(prevChats =>
                    prevChats.map(chat =>
                        chat.id === chatUserId ? { ...chat, unreadCount: 0 } : chat
                    )
                );
            } catch (readError) {
                console.error("Failed to mark messages as read:", readError);
            }
        } catch (error: any) {
            console.error("Failed to silently load messages:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!messageInput.trim() || !selectedChat || isSendingMessage) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            sender: "user",
            text: messageInput,
            timestamp: new Date().toISOString()
        };

        // Optimistically add message to UI
        setMessages(prev => [...prev, newMessage]);
        const messageToBeSent = messageInput;
        setMessageInput("");

        // Immediately scroll to show the new message
        setTimeout(() => scrollToBottom(), 50);

        try {
            setIsSendingMessage(true);

            // Send message using the correct request body structure
            const response = await sendMessage({
                chatId: selectedChat.chatId, // Actual chat ID (like dd_public_chat_id in Chat.tsx)
                tenantId: DD_TENANT_ID,
                chatUserId: selectedChat.id, // Client user ID we're messaging
                message: messageToBeSent,
                senderType: 3, // 3 = Agent
                conversationIndex: null
            });

            console.log("Send message response:", response);

            // Silently reload messages to get the latest including bot response
            setTimeout(() => {
                silentLoadMessages(selectedChat.id);
                // Check bot status after message is sent and response is received
                checkAndSetBotStatus(selectedChat.id);
            }, 300);
        } catch (error: any) {
            console.error("Failed to send message:", error);
            showError("Failed to send message. Please try again.");
            // Remove the optimistically added message on error
            setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
            setMessageInput(messageToBeSent);
        } finally {
            setIsSendingMessage(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleExportPDF = async () => {
        if (!selectedChat || messages.length === 0) {
            showError("No messages to export.");
            return;
        }

        try {
            // Show AI thinking modal
            setIsAiThinking(true);

            // Convert messages to ChatMessage format for AI API
            const chatMessages: ChatMessage[] = messages.map(msg => ({
                role: msg.sender === "bot" ? "assistant" : "user",
                content: msg.text
            }));

            // Call AI service to get summary
            const summaryResponse = await summarizeChat(chatMessages, DD_TOKEN);

            // Generate PDF content
            const pdfContent = generatePDFContent(
                selectedChat.name,
                selectedChat.email,
                messages,
                summaryResponse.summary
            );

            // Wait 3 seconds before downloading
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Close modal
            setIsAiThinking(false);

            // Create and download PDF
            downloadPDF(pdfContent, `chat-${selectedChat.name}-${new Date().toISOString().split('T')[0]}.pdf`);

            showSuccess("PDF exported successfully!");
        } catch (error: any) {
            console.error("Error exporting PDF:", error);
            setIsAiThinking(false);
            showError(error?.response?.data?.message || "Failed to export PDF. Please try again.");
        }
    };

    const generatePDFContent = (
        clientName: string,
        clientEmail: string,
        messages: Message[],
        summary: string
    ): string => {
        const date = new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });

        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Chat Report - ${clientName}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 40px;
            color: #333;
        }
        .header {
            border-bottom: 3px solid #ff6b00;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #ff6b00;
            margin: 0 0 10px 0;
        }
        .header .info {
            color: #666;
            font-size: 14px;
        }
        .summary-section {
            background-color: #fff3e0;
            border-left: 4px solid #ff6b00;
            padding: 20px;
            margin-bottom: 30px;
        }
        .summary-section h2 {
            color: #ff6b00;
            margin-top: 0;
        }
        .summary-section pre {
            white-space: pre-wrap;
            font-family: Arial, sans-serif;
            line-height: 1.6;
        }
        .messages-section h2 {
            color: #333;
            border-bottom: 2px solid #ddd;
            padding-bottom: 10px;
        }
        .message {
            margin-bottom: 20px;
            padding: 15px;
            border-radius: 8px;
        }
        .message.bot {
            background-color: #f5f5f5;
            border-left: 4px solid #999;
        }
        .message.user {
            background-color: #fff3e0;
            border-left: 4px solid #ff6b00;
        }
        .message-header {
            font-weight: bold;
            margin-bottom: 8px;
            display: flex;
            justify-content: space-between;
        }
        .message-sender {
            color: #ff6b00;
        }
        .message-time {
            color: #999;
            font-size: 12px;
        }
        .message-content {
            line-height: 1.6;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #999;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Chat Conversation Report</h1>
        <div class="info">
            <strong>Client:</strong> ${clientName}<br>
            <strong>Email:</strong> ${clientEmail}<br>
            <strong>Date:</strong> ${date}<br>
            <strong>Total Messages:</strong> ${messages.length}
        </div>
    </div>

    <div class="summary-section">
        <h2>📋 Conversation Summary</h2>
        <pre>${summary}</pre>
    </div>

    <div class="messages-section">
        <h2>💬 Full Conversation</h2>
`;

        messages.forEach(msg => {
            const time = new Date(msg.timestamp).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit"
            });
            const senderLabel = msg.sender === "bot" ? "Agent" : "Client";

            html += `
        <div class="message ${msg.sender}">
            <div class="message-header">
                <span class="message-sender">${senderLabel}</span>
                <span class="message-time">${time}</span>
            </div>
            <div class="message-content">${msg.text}</div>
        </div>
`;
        });

        html += `
    </div>

    <div class="footer">
        <p>Generated by DynoDocs Chat System on ${date}</p>
    </div>
</body>
</html>
`;

        return html;
    };

    const downloadPDF = (htmlContent: string, filename: string) => {
        // Create a Blob from HTML content
        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);

        // Create temporary link and trigger download
        const link = document.createElement("a");
        link.href = url;
        link.download = filename.replace('.pdf', '.html');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const formatDate = (dateString: string): string => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit"
            });
        } catch {
            return dateString;
        }
    };

    const formatMessageTime = (timestamp: string): string => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return "";
        }
    };

    const handleCheckBotStatus = async () => {
        try {
            const res = await checkBotStatus(selectedChat?.id || "", DD_TOKEN);
            console.log("Bot status response:", res.message);
            if (res.message === "Bot is Off") {
                setBotStatus(false);
            } else {
                setBotStatus(true);
            }
        } catch (error) {

        }
    }

    useEffect(() => {
        if (selectedChat) {
            handleCheckBotStatus();
        }
    }, [selectedChat]);

    // Safe refresh function that runs on every mouse click
    const safeRefreshData = useCallback(async () => {
        // Prevent concurrent refreshes
        if (isRefreshingRef.current) {
            return;
        }

        try {
            isRefreshingRef.current = true;

            // Refresh clients list
            try {
                const response = await getAvailableChats(DD_TOKEN);
                const transformedChats: ChatItem[] = [];

                if (Array.isArray(response)) {
                    for (const chat of response) {
                        if (chat.clientUsers && Array.isArray(chat.clientUsers)) {
                            for (const clientUser of chat.clientUsers) {
                                try {
                                    const messagesResponse = await getMessages(clientUser.id);
                                    const messagesList = messagesResponse.messages || messagesResponse || [];

                                    const lastMessage = messagesList.length > 0
                                        ? messagesList[messagesList.length - 1]
                                        : null;

                                    transformedChats.push({
                                        id: clientUser.id,
                                        chatId: chat.id,
                                        name: clientUser.name || "Anonymous User",
                                        email: clientUser.email || "",
                                        lastMessage: lastMessage
                                            ? (lastMessage.message || lastMessage.text || "No messages yet")
                                            : "No messages yet",
                                        lastMessageDate: formatDate(
                                            lastMessage?.createdAt || lastMessage?.timestamp || chat.createdAt || new Date().toISOString()
                                        ),
                                        unreadCount: clientUser.unreadMessageCount || 0
                                    });
                                } catch (msgError) {
                                    // Silently handle message fetch errors
                                    transformedChats.push({
                                        id: clientUser.id,
                                        chatId: chat.id,
                                        name: clientUser.name || "Anonymous User",
                                        email: clientUser.email || "",
                                        lastMessage: "No messages yet",
                                        lastMessageDate: formatDate(chat.createdAt || new Date().toISOString()),
                                        unreadCount: clientUser.unreadMessageCount || 0
                                    });
                                }
                            }
                        }
                    }
                }
                setChats(transformedChats);
            } catch (chatsError) {
                console.error("Silent refresh - failed to load chats:", chatsError);
            }

            // Refresh messages for selected chat
            if (selectedChat) {
                try {
                    const response = await getMessages(selectedChat.id);
                    let messagesList = [];
                    if (response.messages && Array.isArray(response.messages)) {
                        messagesList = response.messages;
                    } else if (Array.isArray(response)) {
                        messagesList = response;
                    }

                    const transformedMessages: Message[] = messagesList.map((msg: any) => {
                        const isClientMessage = msg.senderType === 2;

                        return {
                            id: msg.id || msg.messageId,
                            sender: isClientMessage ? "bot" : "user",
                            text: msg.message || msg.text || msg.content,
                            timestamp: msg.timestamp || msg.createdAt || msg.createdDate || new Date().toISOString()
                        };
                    });
                    setMessages(transformedMessages);
                } catch (messagesError) {
                    console.error("Silent refresh - failed to load messages:", messagesError);
                }
            }
        } catch (error) {
            // Silently catch any other errors
            console.error("Silent refresh error:", error);
        } finally {
            isRefreshingRef.current = false;
        }
    }, [selectedChat, DD_TOKEN]);

    // Add click event listener
    useEffect(() => {
        const handleClick = () => {
            safeRefreshData();
        };

        // Add event listener to document
        document.addEventListener('click', handleClick);

        // Cleanup
        return () => {
            document.removeEventListener('click', handleClick);
        };
    }, [safeRefreshData]);

    return (
        <Navbar>
            <div className="chatsPage">
                <div className="chatsPage-header">
                    <div className="agency-header">
                        <h2 className="agency-title">Chats</h2>
                        <button
                            type="button"
                            className="infoBtn"
                            aria-label="Chats guide"
                            onClick={() => setInfoOpen(true)}
                        >
                            <InfoOutline fontSize="small" />
                        </button>
                    </div>
                </div>

                <div className="chatsPage-content">
                    {/* Sidebar with Chat List */}
                    <div className="chatsPage-sidebar">
                        <div className="chatsPage-sidebarHeader">
                            <h3 className="chatsPage-sidebarTitle">Recent chatbot conversations</h3>
                        </div>
                        <div className="chatsPage-chatList">
                            {isLoadingChats ? (
                                <div className="chatsPage-loading">
                                    <CircularProgress size={40} sx={{ color: "var(--color-primary, #ff7b2e)" }} />
                                    <p className="chatsPage-loadingText">Loading chats...</p>
                                </div>
                            ) : chats.length === 0 ? (
                                <div className="chatsPage-empty">
                                    <ChatBubbleOutlineIcon className="chatsPage-emptyIcon" />
                                    <p className="chatsPage-emptyText">No chats yet</p>
                                    <p className="chatsPage-emptySubtext">
                                        Start a conversation to see it here
                                    </p>
                                </div>
                            ) : (
                                chats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        className={`chatItem ${selectedChat?.id === chat.id ? "active" : ""}`}
                                        onClick={() => {
                                            setSelectedChat(chat)
                                            handleCheckBotStatus();
                                        }}
                                    >
                                        <div className="chatItem-avatar">
                                            <PersonIcon />
                                        </div>
                                        <div className="chatItem-content">
                                            <div className="chatItem-header">
                                                <span className="chatItem-name">{chat.name}</span>
                                                <span className="chatItem-date">{chat.lastMessageDate}</span>
                                            </div>
                                            <p className="chatItem-preview">{chat.lastMessage}</p>
                                        </div>
                                        {(chat.unreadCount ?? 0) > 0 && (
                                            <span className="chatItem-badge">{chat.unreadCount}</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Main Chat Area */}
                    <div className="chatsPage-mainArea">
                        {selectedChat ? (
                            <>
                                <div className="chatsPage-chatHeader">
                                    <div className="chatHeader-info">
                                        <span className="chatHeader-name">{selectedChat.name}</span>
                                    </div>

                                    <div className="chatHeader-actions">
                                        <button
                                            type="button"
                                            className="aiSummarizeBtn"
                                            onClick={handleExportPDF}
                                            aria-label="Summarize Chat"
                                            style={{
                                                background: 'white',
                                                border: '2px solid transparent',
                                                backgroundImage: 'linear-gradient(white, white), linear-gradient(90deg, #00d4ff 0%, #a855f7 25%, #ec4899 50%, #ef4444 75%, #f97316 100%)',
                                                backgroundOrigin: 'border-box',
                                                backgroundClip: 'padding-box, border-box',
                                                color: '#a855f7',
                                                fontWeight: '600',
                                                padding: '8px 16px',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease',
                                                fontSize: '14px'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = 'none';
                                            }}
                                        >
                                            <SmartToyIcon fontSize="small" style={{ 
                                                background: 'linear-gradient(90deg, #00d4ff 0%, #a855f7 25%, #ec4899 50%, #ef4444 75%, #f97316 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                backgroundClip: 'text'
                                            }} />
                                            <span style={{
                                                background: 'linear-gradient(90deg, #00d4ff 0%, #a855f7 25%, #ec4899 50%, #ef4444 75%, #f97316 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                backgroundClip: 'text'
                                            }}>
                                                Summarize Chat
                                            </span>
                                        </button>
                                        <button
                                            type="button"
                                            className="closeBtn"
                                            onClick={() => setSelectedChat(null)}
                                            aria-label="Close chat"
                                        >
                                            <CloseIcon fontSize="small" />
                                        </button>
                                    </div>
                                </div>

                                <div className="chatsPage-messagesArea">
                                    {isLoadingMessages ? (
                                        <div className="chatsPage-loading">
                                            <CircularProgress size={40} sx={{ color: "var(--color-primary, #ff7b2e)" }} />
                                            <p className="chatsPage-loadingText">Loading messages...</p>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((message) => (
                                                <div
                                                    key={message.id}
                                                    className={`message message--${message.sender}`}
                                                >
                                                    <div className="message-bubble">
                                                        {message.text.split("\n").map((line, i) => (
                                                            <span key={i}>
                                                                {line}
                                                                {i < message.text.split("\n").length - 1 && <br />}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <div className="message-time">
                                                        {formatMessageTime(message.timestamp)}
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                <div className="chatsPage-inputArea">
                                    {botStatus && (
                                        <div className="chatsPage-warningMessage">
                                            <InfoOutline fontSize="small" />
                                            <span>Cannot send message because bot dialog flow is still not over</span>
                                        </div>
                                    )}
                                    <div className="chatsPage-inputWrapper">
                                        <input
                                            type="text"
                                            className="chatsPage-input"
                                            placeholder={botStatus ? "Waiting for dialog flow to complete..." : "Type your message ..."}
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            disabled={isSendingMessage || botStatus}
                                        />
                                        <button
                                            type="button"
                                            className="chatsPage-sendBtn"
                                            onClick={handleSendMessage}
                                            disabled={!messageInput.trim() || isSendingMessage || botStatus}
                                            aria-label="Send message"
                                        >
                                            <SendIcon />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="chatsPage-empty">
                                <SmartToyIcon className="chatsPage-emptyIcon" />
                                <p className="chatsPage-emptyText">Select a chat to start messaging</p>
                                <p className="chatsPage-emptySubtext">
                                    Choose a conversation from the sidebar
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {infoOpen && (
                <div className="ddModal" role="dialog" aria-modal="true" aria-label="Chats guide">
                    <button
                        type="button"
                        className="ddModal-backdrop"
                        aria-label="Close"
                        onClick={() => setInfoOpen(false)}
                    />

                    <div className="ddModal-card">
                        <div className="ddModal-title">Chats Guide</div>
                        <div className="ddModal-subtitle" style={{ textAlign: "left", marginTop: 8 }}>
                            Manage and respond to live customer conversations:
                        </div>
                        <div className="ddModal-content">
                            <ol>
                                <li>Select a conversation from the left panel to load messages.</li>
                                <li>Use the message box to reply when the bot is not active.</li>
                                <li>Summarize Chat creates a quick AI summary for this conversation.</li>
                                <li>Unread message counts update automatically after viewing a chat.</li>
                            </ol>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Thinking Modal */}
            {isAiThinking && (
                <div className="ddModal" role="dialog" aria-modal="true" aria-label="AI Processing">
                    <div className="ddModal-backdrop" style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }} />

                    <div className="ddModal-card" style={{ maxWidth: '400px' }}>
                        <div className="ddModal-logo" aria-hidden="true" style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}>
                            <SmartToyIcon style={{ fontSize: 48, color: 'white' }} />
                        </div>

                        <div className="ddModal-title" style={{ fontSize: '24px', marginBottom: '12px' }}>
                            Thinking...
                        </div>
                        <div className="ddModal-subtitle" style={{ marginBottom: '30px' }}>
                            Analyzing your conversation and generating a comprehensive summary
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <CircularProgress
                                size={40}
                                sx={{
                                    color: '#667eea',
                                    '& .MuiCircularProgress-circle': {
                                        strokeLinecap: 'round'
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </Navbar>
    );
}