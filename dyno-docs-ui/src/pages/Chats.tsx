import { useState, useEffect, useRef } from "react";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import SendIcon from "@mui/icons-material/Send";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import SmartToyIcon from "@mui/icons-material/SmartToy";
import PersonIcon from "@mui/icons-material/Person";
import CircularProgress from "@mui/material/CircularProgress";
import Navbar from "../layouts/Navbar";
import { getAvailableChats } from "../services/agent-api";
import { getMessages, sendMessage } from "../services/chat-api";
import { showError, showSuccess } from "../components/Toast";
import "../styles/chats.css";
import { InfoOutline } from "@mui/icons-material";

interface ChatItem {
    id: string;
    name: string;
    email: string;
    lastMessage: string;
    lastMessageDate: string;
    unreadCount?: number;
}

interface Message {
    id: string;
    sender: "bot" | "user";
    text: string;
    timestamp: string;
}

export default function Chats() {
    const DD_TOKEN = sessionStorage.getItem("dd_token") || "";
    const [chats, setChats] = useState<ChatItem[]>([]);
    const [selectedChat, setSelectedChat] = useState<ChatItem | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState("");
    const [isLoadingChats, setIsLoadingChats] = useState(true);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadChats();
    }, []);

    useEffect(() => {
        if (selectedChat) {
            loadMessages(selectedChat.id);
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
                                    name: clientUser.name || "Anonymous User",
                                    email: clientUser.email || "",
                                    lastMessage: lastMessage 
                                        ? (lastMessage.message || lastMessage.text || "No messages yet")
                                        : "No messages yet",
                                    lastMessageDate: formatDate(
                                        lastMessage?.createdAt || lastMessage?.timestamp || chat.createdAt || new Date().toISOString()
                                    ),
                                    unreadCount: 0
                                });
                            } catch (msgError) {
                                console.warn(`Failed to fetch messages for client ${clientUser.id}:`, msgError);
                                // Add chat item without last message info
                                transformedChats.push({
                                    id: clientUser.id,
                                    name: clientUser.name || "Anonymous User",
                                    email: clientUser.email || "",
                                    lastMessage: "No messages yet",
                                    lastMessageDate: formatDate(chat.createdAt || new Date().toISOString()),
                                    unreadCount: 0
                                });
                            }
                        }
                    }
                }
            }

            console.log("Transformed Chats:", transformedChats);
            setChats(transformedChats);

            // Auto-select first chat if available
            if (transformedChats.length > 0) {
                setSelectedChat(transformedChats[0]);
            }
        } catch (error: any) {
            console.error("Failed to load chats:", error);
            showError("Failed to load chats. Please try again.");
            // Set mock data for demonstration
            setMockChats();
        } finally {
            setIsLoadingChats(false);
        }
    };

    const setMockChats = () => {
        const mockChats: ChatItem[] = [
            {
                id: "1",
                name: "John Traveler",
                email: "john@example.com",
                lastMessage: "Can you generate a report for Galle Fort?",
                lastMessageDate: "01/12/25",
                unreadCount: 1
            },
            {
                id: "2",
                name: "Sarah Explorer",
                email: "sarah@example.com",
                lastMessage: "I need travel details for Anuradhapura tomorrow.",
                lastMessageDate: "30/11/25",
            },
            {
                id: "3",
                name: "Mike Adventure",
                email: "mike@example.com",
                lastMessage: "Show me the top attractions in Nuwara Eliya.",
                lastMessageDate: "27/11/25",
            },
            {
                id: "4",
                name: "Emma Tourist",
                email: "emma@example.com",
                lastMessage: "Perfect! Thanks for the info",
                lastMessageDate: "23/11/25",
            },
            {
                id: "5",
                name: "David Wanderer",
                email: "david@example.com",
                lastMessage: "Find hotels near Sigiriya Rock...",
                lastMessageDate: "21/11/25",
            }
        ];
        setChats(mockChats);
        setSelectedChat(mockChats[0]);
        setMockMessages();
    };

    const setMockMessages = () => {
        const mockMessages: Message[] = [
            {
                id: "1",
                sender: "user",
                text: "Hi! I'm planning a quick trip to Ella.",
                timestamp: new Date().toISOString()
            },
            {
                id: "2",
                sender: "bot",
                text: "Hello! That sounds exciting 🌄\nHow can I help you today?",
                timestamp: new Date().toISOString()
            },
            {
                id: "3",
                sender: "user",
                text: "Can you suggest must-see attractions in Ella?",
                timestamp: new Date().toISOString()
            },
            {
                id: "4",
                sender: "bot",
                text: "Of course! Ella has some amazing places to explore. Would you like nature spots, scenic viewpoints, or adventure activities?",
                timestamp: new Date().toISOString()
            },
            {
                id: "5",
                sender: "user",
                text: "Nature spots would be nice!",
                timestamp: new Date().toISOString()
            },
            {
                id: "6",
                sender: "bot",
                text: "Great choice! Here are some beautiful nature attractions in Ella:\n\n• Nine Arch Bridge\n• Little Adam's Peak\n• Ravana Falls\n• Ella Rock (for hiking)",
                timestamp: new Date().toISOString()
            },
            {
                id: "7",
                sender: "user",
                text: "Perfect! Thanks for the info 👍",
                timestamp: new Date().toISOString()
            }
        ];
        setMessages(mockMessages);
    };

    const loadMessages = async (chatUserId: string) => {
        try {
            setIsLoadingMessages(true);
            const response = await getMessages(chatUserId);

            console.log("Messages Response:", response);

            // Handle paginated response structure
            let messagesList = [];
            if (response.messages && Array.isArray(response.messages)) {
                messagesList = response.messages;
            } else if (Array.isArray(response)) {
                messagesList = response;
            }

            // Transform the response to match our Message interface
            const transformedMessages: Message[] = messagesList.map((msg: any) => {
                const isBot = msg.senderType === "Bot" || msg.isFromBot || msg.role === "bot" || msg.sender === "bot";
                
                return {
                    id: msg.id || msg.messageId,
                    sender: isBot ? "bot" : "user",
                    text: msg.message || msg.text || msg.content,
                    timestamp: msg.timestamp || msg.createdAt || msg.createdDate || new Date().toISOString()
                };
            });

            console.log("Transformed Messages:", transformedMessages);
            setMessages(transformedMessages);
        } catch (error: any) {
            console.error("Failed to load messages:", error);
            // Show mock messages for demonstration
            setMockMessages();
        } finally {
            setIsLoadingMessages(false);
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

        try {
            setIsSendingMessage(true);

            // Send message using the client user ID as chatId
            const response = await sendMessage({
                chatId: selectedChat.id, // This is the chatUserId from clientUsers
                message: messageToBeSent,
                conversationIndex: 1
            });

            console.log("Send message response:", response);

            // Reload messages to get the latest including bot response
            setTimeout(() => {
                loadMessages(selectedChat.id);
            }, 500);

            showSuccess("Message sent successfully!");
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
                                        onClick={() => setSelectedChat(chat)}
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
                                        {chat.unreadCount && chat.unreadCount > 0 && (
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
                                    <div>
                                    </div>

                                    <button
                                        type="button"
                                        className="exportBtn"
                                        onClick={handleExportPDF}
                                        aria-label="Export to PDF"
                                    >
                                        <PictureAsPdfIcon fontSize="small" />
                                        Export To PDF
                                    </button>
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
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                <div className="chatsPage-inputArea">
                                    <div className="chatsPage-inputWrapper">
                                        <input
                                            type="text"
                                            className="chatsPage-input"
                                            placeholder="Type your message ..."
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            onKeyPress={handleKeyPress}
                                            disabled={isSendingMessage}
                                        />
                                        <button
                                            type="button"
                                            className="chatsPage-sendBtn"
                                            onClick={handleSendMessage}
                                            disabled={!messageInput.trim() || isSendingMessage}
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