# ChatApp API Endpoints Documentation

## Overview
The ChatApp provides a multi-tenant chat system with intelligent chatbot capabilities for tourism agencies. The system supports real-time messaging between clients, agents, and AI-powered chatbots.

**Base URL:** `http://localhost:5085/api/`

**Authentication:** JWT Bearer Token (required for most endpoints)

**Multi-Tenant:** All endpoints are tenant-scoped via JWT claims

**Integration:** ChatApp is fully integrated with the main application - tenant registration automatically creates chat instances.

---

## Integration Flow

### Tenant Registration → Chat Creation
When a new agency registers in the main application (`/api/identity/register-agency`), the system automatically:

1. **Creates Tenant** in main database (`dynodocs`)
2. **Creates Chat** in chat database (`chatbot_db`) - 1:1 relationship
3. **Creates ChatUser** (Admin role) for the agency owner
4. **Initializes default bot commands** for tourism conversations

### Login → Single Token
When agency users login (`/api/identity/login`), the **same JWT** token works for both main app and chat endpoints since `TenantId` and `UserId` are embedded in the claims.

---

## 1. Main App Integration (`/api/identity`)

### 1.1 Register Agency (Auto-creates Chat)
**Endpoint:** `POST /api/identity/register-agency`

**Description:** Register a new agency. Automatically creates Chat, Admin ChatUser, and default bot commands.

**Response (200):**
```json
{
  "isSuccess": true,
  "message": "Agency registered successfully.",
  "data": "tenant-guid"
}
```

---

### 1.2 Login (Agency Owner / Agent)
**Endpoint:** `POST /api/identity/login`

**Description:** Login for agency staff. Returns a single JWT that works for both main app and chat endpoints.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "token": "jwt-token",
  "fullName": "string",
  "email": "string",
  "mobileNo": "string",
  "agencyName": "string",
  "tenantId": "guid",
  "userId": "guid"
}
```

> ⚠️ **Use `token` for all requests** — both main app (`/api/identity/*`) and chat (`/api/Chat/*`, `/api/ChatBot/*`, `/api/Agent/*`).

---

## 2. Client (Tourist) Registration & Login (`/api/Chat`)

> Tourists are **NOT** in the main app user table. They register directly into the chat system using the agency's `TenantId`. These endpoints are **public** (no auth required).

### 2.1 Register Client
**Endpoint:** `POST /api/Chat/register-client`

**Auth:** ❌ None required

**Description:** Register a new tourist/client for a specific agency's chat. `TenantId` tells the system which agency the client is chatting with.

**Request Body:**
```json
{
  "tenantId": "guid",
  "name": "string",
  "email": "string"
}
```

**Response (200):**
```json
{
  "chatUser": {
    "id": "guid",
    "name": "string",
    "email": "string",
    "tenantId": "guid",
    "role": "Client",
    "isBotOn": true
  },
  "chatId": "guid",
  "token": "client-jwt-token"
}
```

**Notes:**
- `isBotOn` is always `true` for new clients — bot handles first contact
- `chatId` is the tenant's chat instance — use for all messaging
- `token` is used as Bearer token for all subsequent chat requests
- Returns `400` if email already registered for this agency

---

### 2.2 Client Login
**Endpoint:** `POST /api/Chat/client-login`

**Auth:** ❌ None required

**Description:** Login for returning tourists.

**Request Body:**
```json
{
  "tenantId": "guid",
  "email": "string"
}
```

**Response (200):**
```json
{
  "chatUser": {
    "id": "guid",
    "name": "string",
    "email": "string",
    "tenantId": "guid",
    "role": "Client",
    "isBotOn": true
  },
  "chatId": "guid",
  "token": "client-jwt-token"
}
```

---

## 3. Agent Controller (`/api/Agent`)

> Use **agency staff token** from `/api/identity/login`

### 3.1 Get Available Chats
**Endpoint:** `GET /api/Agent/available-chats`

**Response (200):**
```json
[
  {
    "id": "guid",
    "name": "string",
    "createdAt": "datetime",
    "clientUsers": [{ "id": "guid", "name": "string", "email": "string" }]
  }
]
```

---

### 3.2 Get My Chats
**Endpoint:** `GET /api/Agent/my-chats`

**Description:** Chats where the current agent has sent messages.

**Response (200):**
```json
[
  {
    "id": "guid",
    "name": "string",
    "isActive": true,
    "createdAt": "datetime",
    "clientUsers": [{ "id": "guid", "name": "string", "email": "string" }]
  }
]
```

---

### 3.3 Toggle User Bot Mode
**Endpoint:** `POST /api/Agent/toggle-bot/{chatUserId}`

**Description:** Enable/disable bot for a specific client. When disabled, agent handles the conversation.

**Response (200):**
```json
{
  "message": "Bot mode enabled/disabled for user",
  "isBotOn": false
}
```

---

## 4. ChatBot Controller (`/api/ChatBot`)

> Use **agency staff token** (admins manage bot commands)

### 4.1 Process Message
**Endpoint:** `POST /api/ChatBot/process-message`

**Request Body:**
```json
{ "chatId": "guid", "message": "string" }
```

**Response (200):**
```json
{
  "hasResponse": true,
  "command": {
    "id": "guid",
    "index": 0,
    "message": ["string"],
    "reply": ["string"],
    "type": "Selection | Enter"
  }
}
```

---

### 4.2 Get Bot Commands
**Endpoint:** `GET /api/ChatBot/commands/{chatId}`

**Response (200):**
```json
[{ "id": "guid", "index": 0, "message": ["string"], "reply": ["string"], "type": "Selection | Enter", "keywords": "string" }]
```

---

### 4.3 Create Default Bot Commands
**Endpoint:** `POST /api/ChatBot/create-commands`

**Request Body:** `{ "chatId": "guid" }`

---

### 4.4 Create Bot Command
**Endpoint:** `POST /api/ChatBot/commands`

**Request Body:**
```json
{
  "chatId": "guid",
  "index": 0,
  "message": ["string"],
  "reply": ["string"],
  "type": "Selection | Enter",
  "keywords": "comma,separated,keywords"
}
```

---

### 4.5 Update Bot Command
**Endpoint:** `PUT /api/ChatBot/commands/{commandId}`

**Request Body:** (all fields optional)
```json
{
  "index": 0,
  "message": ["string"],
  "reply": ["string"],
  "type": "Selection | Enter",
  "keywords": "string"
}
```

---

### 4.6 Delete Bot Command
**Endpoint:** `DELETE /api/ChatBot/commands/{commandId}`

---

## 5. Chat Controller — Messaging (`/api/Chat`)

> **Clients** use token from `register-client` / `client-login`.
> **Agency staff** use token from `/api/identity/login`.

### 5.1 Get My Chat
**Endpoint:** `GET /api/Chat/my-chat`

**Description:** Get the tenant's chat instance.

**Response (200):**
```json
{ "id": "guid", "name": "string", "isActive": true, "createdAt": "datetime" }
```

---

### 5.2 Send Message
**Endpoint:** `POST /api/Chat/send-message`

**Request Body:**
```json
{
  "chatId": "guid",
  "message": "string",
  "conversationIndex": 1
}
```

**Response (200):**
```json
{ "messageId": "guid", "message": "Message sent successfully" }
```

**Notes:**
- `SenderType` auto-detected from the JWT's `UserRole` claim (Client → `Client`, Agent/Admin → `Agent`)
- `conversationIndex` links a reply to a specific bot command index

---

### 5.3 Get Messages
**Endpoint:** `GET /api/Chat/messages/{chatId}`

**Query params:** `?page=1&pageSize=50`

**Response (200):**
```json
{
  "totalMessages": 50,
  "page": 1,
  "pageSize": 50,
  "messages": [
    {
      "id": "guid",
      "message": "string",
      "senderType": "Bot | Client | Agent",
      "conversationIndex": 1,
      "orderSequence": 1,
      "isRead": false,
      "createdAt": "datetime",
      "chatUser": { "id": "guid", "name": "string", "email": "string", "role": "Client" }
    }
  ]
}
```

---

### 5.4 Mark Message as Read
**Endpoint:** `POST /api/Chat/messages/{messageId}/mark-read`

---

### 5.5 Get Chat Users
**Endpoint:** `GET /api/Chat/users`

**Response (200):**
```json
[
  { "id": "guid", "name": "string", "email": "string", "role": "Client | Agent | Admin", "isBotOn": true, "isOnline": false, "createdAt": "datetime" }
]
```

---

## Token Usage Summary

| Who | How to get token | Use for |
|-----|-----------------|---------|
| **Agency Owner / Admin** | `POST /api/identity/login` | Main app + all chat endpoints |
| **Agent (staff)** | `POST /api/identity/login` | Main app + all chat endpoints |
| **Client (tourist)** | `POST /api/Chat/register-client` or `POST /api/Chat/client-login` | Chat endpoints only |

---

## Database Architecture

| Database | Tables | Who uses it |
|----------|--------|-------------|
| `dynodocs` | Tenants, Users, Subscriptions, ... | Main app |
| `chatbot_db` | Chats, ChatUsers, ChatMessages, ChatbotCommands | ChatApp only |

---

## 1. Main App Integration (`/api/identity`)

### 1.1 Register Agency (Auto-creates Chat)
**Endpoint:** `POST /api/identity/register-agency`

**Description:** Register a new agency and automatically create their chat instance.

**Request Body:** (Form data with file upload)
```json
{
  "AgencyName": "string",
  "BusinessRegNo": "string",
  "ContactNo": "string",
  "Country": "string",
  "State": "string",
  "City": "string",
  "AgencyAddress": "string",
  "AgencyLogo": "file",
  "FullName": "string",
  "NICNo": "string",
  "MobileNo": "string",
  "Email": "string",
  "Password": "string",
  "ConfirmPassword": "string",
  "PlanId": 1,
  "PlanName": "string",
  "PlanType": "Basic"
}
```

**Response (200):**
```json
{
  "isSuccess": true,
  "message": "Agency registered successfully.",
  "data": "tenant-guid"
}
```

**Auto-creates:**
- Chat instance in `chatbot_db`
- Admin ChatUser for agency owner
- Default tourism bot commands

---

### 1.2 Login (Returns Dual Tokens)
**Endpoint:** `POST /api/identity/login`

**Description:** Authenticate user and return both main app and chat tokens.

**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "token": "main-app-jwt-token",
  "chatToken": "chat-app-jwt-token",
  "fullName": "string",
  "email": "string",
  "mobileNo": "string",
  "agencyName": "string",
  "tenantId": "guid",
  "userId": "guid"
}
```

**Notes:**
- `token`: Use for main app features (`/api/identity/*`, `/api/operations/*`, etc.)
- `chatToken`: Use for chat features (`/api/Chat/*`, `/api/ChatBot/*`, `/api/Agent/*`, `/api/Auth/*`)
- Chat user is auto-created if it doesn't exist

---

## 1. Authentication Controller (`/api/Auth`)

### 1.1 Register User
**Endpoint:** `POST /api/Auth/register`

**Description:** Register a new chat user (Client, Agent, or Admin) for the current tenant.

**Request Body:**
```json
{
  "email": "string",
  "name": "string",
  "role": "Client | Agent | Admin"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "guid",
    "email": "string",
    "name": "string",
    "role": "Client | Agent | Admin",
    "isBotOn": true
  },
  "token": "jwt_token_string"
}
```

**Notes:**
- Clients automatically start with `isBotOn: true`
- Agents and Admins start with `isBotOn: false`
- User must be unique per tenant (email + tenantId)

---

### 1.2 Login User
**Endpoint:** `POST /api/Auth/login`

**Description:** Authenticate an existing chat user and return JWT token.

**Request Body:**
```json
{
  "email": "string"
}
```

**Response (200):**
```json
{
  "user": {
    "id": "guid",
    "email": "string",
    "name": "string",
    "role": "Client | Agent | Admin",
    "isBotOn": true
  },
  "token": "jwt_token_string"
}
```

**Response (401):** Invalid credentials

---

## 2. Agent Controller (`/api/Agent`)

*All endpoints require authentication and return tenant-scoped data.*

### 2.1 Get Available Chats
**Endpoint:** `GET /api/Agent/available-chats`

**Description:** Get all active chats for the current tenant that agents can access.

**Response (200):**
```json
[
  {
    "id": "guid",
    "name": "string",
    "createdAt": "datetime",
    "clientUsers": [
      {
        "id": "guid",
        "name": "string",
        "email": "string"
      }
    ]
  }
]
```

**Notes:**
- Returns all active chats for the tenant
- Includes client users in each chat
- Agents can see all chats (no assignment system)

---

### 2.2 Get My Chats
**Endpoint:** `GET /api/Agent/my-chats`

**Description:** Get chats where the current agent user has participated (has sent messages).

**Response (200):**
```json
[
  {
    "id": "guid",
    "name": "string",
    "isActive": true,
    "createdAt": "datetime",
    "clientUsers": [
      {
        "id": "guid",
        "name": "string",
        "email": "string"
      }
    ]
  }
]
```

**Notes:**
- Filters chats where current agent has messages
- Useful for agents to see their conversation history

---

### 2.3 Take Chat
**Endpoint:** `POST /api/Agent/take-chat/{chatId}`

**Description:** Access a specific chat (legacy endpoint for compatibility).

**Parameters:**
- `chatId` (GUID): The chat ID to access

**Response (200):**
```json
{
  "message": "Chat accessed successfully"
}
```

**Response (404):** Chat not found or not in current tenant

**Notes:**
- Since Chat is 1:1 with Tenant, agents can access all chats
- This endpoint mainly validates access permissions

---

### 2.4 Toggle User Bot Mode
**Endpoint:** `POST /api/Agent/toggle-bot/{userId}`

**Description:** Toggle the bot interaction mode for a specific user.

**Parameters:**
- `userId` (GUID): The user ID to toggle bot mode for

**Response (200):**
```json
{
  "message": "Bot mode enabled/disabled for user",
  "isBotOn": true
}
```

**Response (404):** User not found

**Notes:**
- Agents can control whether clients interact with bots or human agents
- When `isBotOn: true`, client messages go to chatbot
- When `isBotOn: false`, client messages can be handled by agents

---

## 3. ChatBot Controller (`/api/ChatBot`)

*All endpoints require authentication and operate on specific chats.*

### 3.1 Process Message
**Endpoint:** `POST /api/ChatBot/process-message`

**Description:** Process a user message through the chatbot engine using keyword matching.

**Request Body:**
```json
{
  "chatId": "guid",
  "message": "string"
}
```

**Response (200 - Has Response):**
```json
{
  "hasResponse": true,
  "command": {
    "id": "guid",
    "index": 0,
    "message": ["string"],
    "reply": ["string"],
    "type": "Selection | Enter"
  }
}
```

**Response (200 - No Response):**
```json
{
  "hasResponse": false,
  "message": "No matching bot response found"
}
```

**Notes:**
- Uses keyword matching against bot commands
- Returns bot command with messages and reply options
- `type: "Selection"` = multiple choice options
- `type: "Enter"` = free text input expected

---

### 3.2 Get Bot Commands
**Endpoint:** `GET /api/ChatBot/commands/{chatId}`

**Description:** Get all bot commands configured for a specific chat.

**Parameters:**
- `chatId` (GUID): The chat ID to get commands for

**Response (200):**
```json
[
  {
    "id": "guid",
    "index": 0,
    "message": ["string"],
    "reply": ["string"],
    "type": "Selection | Enter",
    "keywords": "string"
  }
]
```

**Notes:**
- Returns all bot commands ordered by index
- Useful for debugging or managing bot conversations

---

### 3.3 Create Default Bot Commands
**Endpoint:** `POST /api/ChatBot/create-commands`

**Description:** Initialize default tourism bot commands for a new chat.

**Request Body:**
```json
{
  "chatId": "guid"
}
```

**Response (200):**
```json
{
  "message": "Bot commands created successfully"
}
```

**Response (400):** Failed to create bot commands

**Notes:**
- Creates default tourism-related bot commands:
  - Welcome message with options
  - Destination selection
  - Duration selection
- Commands are created per chat with tenant context

---

### 3.4 Create Bot Command
**Endpoint:** `POST /api/ChatBot/commands`

**Description:** Create a new individual bot command.

**Request Body:**
```json
{
  "chatId": "guid",
  "index": 0,
  "message": ["string"],
  "reply": ["string"],
  "type": "Selection | Enter",
  "keywords": "string"
}
```

**Response (200):**
```json
{
  "message": "Bot command created successfully",
  "commandId": "guid"
}
```

---

### 3.5 Update Bot Command
**Endpoint:** `PUT /api/ChatBot/commands/{commandId}`

**Description:** Update an existing bot command.

**Parameters:**
- `commandId` (GUID): The command ID to update

**Request Body:**
```json
{
  "index": 0,
  "message": ["string"],
  "reply": ["string"],
  "type": "Selection | Enter",
  "keywords": "string"
}
```

**Response (200):**
```json
{
  "message": "Bot command updated successfully"
}
```

**Response (404):** Bot command not found

---

### 3.6 Delete Bot Command
**Endpoint:** `DELETE /api/ChatBot/commands/{commandId}`

**Description:** Delete a bot command.

**Parameters:**
- `commandId` (GUID): The command ID to delete

**Response (200):**
```json
{
  "message": "Bot command deleted successfully"
}
```

**Response (404):** Bot command not found

---

## 4. Chat Controller (`/api/Chat`)

*All endpoints require authentication and are tenant-scoped.*

### 4.1 Get My Chat
**Endpoint:** `GET /api/Chat/my-chat`

**Description:** Get the chat instance for the current tenant (1:1 relationship).

**Response (200):**
```json
{
  "id": "guid",
  "name": "string",
  "isActive": true,
  "createdAt": "datetime"
}
```

**Response (404):** Chat not found for this tenant

---

### 4.2 Send Message
**Endpoint:** `POST /api/Chat/send-message`

**Description:** Send a message in a chat conversation.

**Request Body:**
```json
{
  "chatId": "guid",
  "message": "string",
  "conversationIndex": 0
}
```

**Response (200):**
```json
{
  "messageId": "guid",
  "message": "Message sent successfully"
}
```

**Notes:**
- Automatically determines sender type (Client/Agent) from user role
- Maintains message order sequence
- ConversationIndex links related messages

---

### 4.3 Get Messages
**Endpoint:** `GET /api/Chat/messages/{chatId}`

**Description:** Get paginated message history for a chat.

**Parameters:**
- `chatId` (GUID): The chat ID to get messages for

**Query Parameters:**
- `page` (int, optional): Page number (default: 1)
- `pageSize` (int, optional): Messages per page (default: 50)

**Response (200):**
```json
{
  "totalMessages": 150,
  "page": 1,
  "pageSize": 50,
  "messages": [
    {
      "id": "guid",
      "message": "string",
      "senderType": "Bot | Client | Agent",
      "conversationIndex": 0,
      "orderSequence": 1,
      "isRead": false,
      "createdAt": "datetime",
      "chatUser": {
        "id": "guid",
        "name": "string",
        "email": "string",
        "role": "Client | Agent | Admin"
      }
    }
  ]
}
```

---

### 4.4 Mark Message as Read
**Endpoint:** `POST /api/Chat/messages/{messageId}/mark-read`

**Description:** Mark a specific message as read.

**Parameters:**
- `messageId` (GUID): The message ID to mark as read

**Response (200):**
```json
{
  "message": "Message marked as read"
}
```

**Response (404):** Message not found

---

### 4.5 Get Chat Users
**Endpoint:** `GET /api/Chat/users`

**Description:** Get all chat users for the current tenant.

**Response (200):**
```json
[
  {
    "id": "guid",
    "name": "string",
    "email": "string",
    "role": "Client | Agent | Admin",
    "isBotOn": true,
    "isOnline": false,
    "createdAt": "datetime"
  }
]
```
