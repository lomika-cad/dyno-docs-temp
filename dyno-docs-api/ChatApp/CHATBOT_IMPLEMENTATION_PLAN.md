# ChatBot Tourism System - Implementation Plan

## Overview
Transform the existing **standalone ChatApp project** into a multi-tenant tourism chat system with intelligent chatbots, real-time messaging via SignalR, and agent handover capabilities. The system will use its own database and maintain the existing project structure.

## Architecture Goals
- **Work with Existing Structure**: Use current ChatApp folders (Controllers, Services, Models, etc.)
- **Multi-Tenancy**: Each tourism agency gets isolated chat environment
- **Simple Communication**: Direct Client->Agent/ChatBot (NO chat groups)
- **Real-Time Communication**: SignalR for instant messaging
- **Intelligent Chatbot**: Simple keyword matching for tourism queries
- **Agent Handover**: Seamless bot-to-human agent switching
- **Separate Database**: Dedicated MySQL database for chat data

---

## Phase 1: Project Setup & Database

### 1.1 Update Project Dependencies
- [x] Update `ChatApp.csproj` with required NuGet packages:
  - [x] Microsoft.EntityFrameworkCore.Design
  - [x] MySql.EntityFrameworkCore
  - [x] Microsoft.AspNetCore.SignalR
  - [x] Microsoft.AspNetCore.Authentication.JwtBearer

### 1.2 Create Database Models in Models/ Folder
- [x] Replace `Models/WeatherForecast.cs` with chat models:
- [x] Create `Models/Chat.cs`
- [x] Create `Models/ChatbotCommands.cs`
- [x] Create `Models/ChatUser.cs`
- [x] Create `Models/ChatMessage.cs`
- [x] Create `Models/Enums/SenderType.cs` (Bot, Client, Agent)
- [x] Create `Models/Enums/CommandType.cs` (Selection, Enter)
- [x] Create `Models/Enums/UserRole.cs` (Client, Agent, Admin)

### 1.3 Database Context & Configuration
- [x] Create `Models/ChatBotDbContext.cs`
- [x] Update `appsettings.json` with ChatBot connection string
- [x] Update `appsettings.Development.json` with ChatBot connection string
- [x] Configure Entity Framework in `Program.cs`

---

## Phase 2: Core Services

### 2.1 Update Services Folder
- [x] Replace `Services/WeatherForecastService.cs` and `Interfaces/IWeatherForecastService.cs`
- [ ] Create `Services/ChatService.cs` and `Interfaces/IChatService.cs`
- [ ] Create `Services/ChatBotEngine.cs` and `Interfaces/IChatBotEngine.cs`
- [ ] Create `Services/TenantService.cs` and `Interfaces/ITenantService.cs`
- [ ] Create `Services/CurrentUserService.cs` and `Interfaces/ICurrentUserService.cs`

### 2.2 Authentication Services
- [ ] Create `Services/JwtService.cs` and `Interfaces/IJwtService.cs`
- [x] Configure JWT authentication in `Program.cs`
- [ ] Create authentication middleware

---

## Phase 3: Controllers Update

### 3.1 Replace Existing Controllers
- [x] Remove `Controllers/HomeController.cs` (WeatherForecast related)
- [x] Create `Controllers/ChatController.cs`
- [x] Create `Controllers/ChatBotController.cs`
- [x] Create `Controllers/AuthController.cs` (for user authentication)
- [x] Create `Controllers/AgentController.cs`

---

## Phase 4: SignalR Implementation

### 4.1 SignalR Hub
- [ ] Create `Hubs/` folder
- [ ] Create `Hubs/ChatHub.cs`
- [ ] Configure SignalR in `Program.cs`
- [ ] Implement direct client-agent messaging (no groups)

---

## Phase 5: Tourism Bot Intelligence

### 5.1 Bot Logic in Services
- [ ] Implement keyword matching in `ChatBotEngine.cs`
- [ ] Create tourism conversation templates
- [ ] Implement `Selection` and `Enter` type processing
- [ ] Add fallback responses

---

## Phase 6: Database Migration

### 6.1 EF Core Setup
- [ ] Generate initial migration
- [ ] Create database schema
- [ ] Add sample tourism bot commands

---

## Phase 7: Testing & Documentation

### 7.1 API Testing
- [ ] Update `ChatApp.http` with chat endpoints
- [ ] Test SignalR connections
- [ ] Test multi-tenant isolation

---

## Entity Structure (for Models/ folder)

### Chat.cs
```csharp
public class Chat
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; }
    public Guid ClientUserId { get; set; }
    public Guid? AgentUserId { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
    public DateTime? LastModifiedAt { get; set; }
    public string? LastModifiedBy { get; set; }
    
    // Navigation
    public virtual ChatUser ClientUser { get; set; }
    public virtual ChatUser? AgentUser { get; set; }
    public virtual ICollection<ChatMessage> Messages { get; set; }
    public virtual ICollection<ChatbotCommands> BotCommands { get; set; }
}
```

### ChatUser.cs
```csharp
public class ChatUser
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Email { get; set; }
    public string Name { get; set; }
    public UserRole Role { get; set; }
    public bool IsBotOn { get; set; }
    public bool IsOnline { get; set; }
    public string? ConnectionId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
    public DateTime? LastModifiedAt { get; set; }
    public string? LastModifiedBy { get; set; }
}
```

### ChatMessage.cs
```csharp
public class ChatMessage
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ChatId { get; set; }
    public Guid ChatUserId { get; set; }
    public string Message { get; set; }
    public SenderType SenderType { get; set; }
    public int? ConversationIndex { get; set; }
    public int OrderSequence { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
    public DateTime? LastModifiedAt { get; set; }
    public string? LastModifiedBy { get; set; }
}
```

### ChatbotCommands.cs
```csharp
public class ChatbotCommands
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public Guid ChatId { get; set; }
    public int Index { get; set; }
    public string[] Message { get; set; }
    public string[] Reply { get; set; }
    public CommandType Type { get; set; }
    public string Keywords { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
    public DateTime? LastModifiedAt { get; set; }
    public string? LastModifiedBy { get; set; }
}
```

---

## Database Configuration

### Connection String (appsettings.json)
```json
{
  "ConnectionStrings": {
    "ChatBotConnection": "Server=localhost;Database=chatbot_db;User=chatbot_user;Password=chatbot_password;"
  },
  "JwtSettings": {
    "SecretKey": "your-secret-key-here",
    "Issuer": "ChatBotApp",
    "Audience": "ChatBotUsers",
    "ExpiryInMinutes": 60
  }
}
```

---

*This plan works with the existing ChatApp project structure and does NOT try to impose Clean Architecture layers.*

---

## Estimated Timeline
- **Phase 1**: 1-2 days (Project Setup & Database Models)
- **Phase 2**: 2-3 days (Core Services)
- **Phase 3**: 1-2 days (Controllers)
- **Phase 4**: 2-3 days (SignalR Implementation)
- **Phase 5**: 2-3 days (Tourism Bot Intelligence)
- **Phase 6**: 1 day (Database Migration)
- **Phase 7**: 1-2 days (Testing & Documentation)

**Total Estimated Time**: 10-16 days

---

## Success Criteria

### Functional Requirements
- [ ] Multi-tenant chat isolation working correctly
- [ ] Real-time messaging via SignalR functional
- [ ] Chatbot responds to tourism queries accurately
- [ ] Agent handover process seamless (IsBotOn toggle)
- [ ] Conversation history preserved

### Technical Requirements
- [ ] Uses existing ChatApp project structure
- [ ] Database performance optimized
- [ ] API documented and testable
- [ ] Multi-tenancy security validated
- [ ] No dependencies on main DynoDocsApi project

---

*This plan works with the existing standalone ChatApp project and its current structure (Controllers/, Services/, Models/, etc.) without imposing Clean Architecture.*
