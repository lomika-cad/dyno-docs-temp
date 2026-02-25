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

    const handleExportPDF = () => {
        showSuccess("PDF export functionality will be implemented soon!");
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
            if(res.message === "Bot is Off") {
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
                            aria-label="Agency data steps"
                        // onClick={() => setInfoOpen(true)}
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
                                            className="exportBtn"
                                            onClick={handleExportPDF}
                                            aria-label="Export to PDF"
                                        >
                                            <PictureAsPdfIcon fontSize="small" />
                                            Export To PDF
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
        </Navbar>
    );
}