# ChatApp Merge & Refactor Plan

## Goal
Merge the **ChatApp** project into the main **UI** application so it runs on the **same URL/host**, while keeping the ChatApp project as a **referenced class library** (not standalone). Also refactor the `Chat` entity to remove `ClientUserId`/`AgentUserId` FKs since `Chat` acts as a 1:1 with `Tenant` (like the Tenant table — when a Tenant is created, a Chat entity is also created).

---

## Current State

### ChatApp (Standalone)
- ASP.NET Core Web API project (`Microsoft.NET.Sdk.Web`)
- Has its own `Program.cs`, Swagger, JWT auth, controllers
- Runs on `http://localhost:5085` (separate from main app)
- Own MySQL database: `chatbot_db`
- Own `ChatBotDbContext` with 4 DbSets

### UI (Main App)
- ASP.NET Core Web API project (`Microsoft.NET.Sdk.Web`)
- Clean Architecture: references Application, Domain, Infrastructure
- Runs on its own port with Swagger, JWT auth, CORS, TenantMiddleware
- Uses `ApplicationDbContext` → `dynodocs` database
- References: Application, Domain, Infrastructure

---

## Changes Overview

### A. Convert ChatApp from Web Project → Class Library
### B. Chat Entity Refactor (remove ClientUserId/AgentUserId)
### C. Wire ChatApp into UI's Program.cs
### D. Fix all affected Services/Controllers logic

---

## Phase 1: Convert ChatApp to Class Library

### Task 1.1 — Change ChatApp.csproj SDK
- [ ] Change `<Project Sdk="Microsoft.NET.Sdk.Web">` → `<Project Sdk="Microsoft.NET.Sdk">`
- [ ] Add `<FrameworkReference Include="Microsoft.AspNetCore.App" />` so it can still use ASP.NET Core types (controllers, SignalR, etc.)
- [ ] Remove `Microsoft.AspNetCore.OpenApi` package (Swagger is handled by UI)
- [ ] Remove `Swashbuckle.AspNetCore` package (Swagger is handled by UI)
- [ ] Keep `Pomelo.EntityFrameworkCore.MySql`, `Microsoft.EntityFrameworkCore.Design`, `Microsoft.AspNetCore.Authentication.JwtBearer`, `Microsoft.AspNetCore.SignalR`

### Task 1.2 — Remove ChatApp's Program.cs
- [ ] Delete `ChatApp/Program.cs` (UI's Program.cs will be the single entry point)
- [ ] Delete `ChatApp/Properties/launchSettings.json` (no longer runs standalone)
- [ ] Delete `ChatApp/appsettings.json` and `ChatApp/appsettings.Development.json` (config moves to UI)

### Task 1.3 — Create ChatApp DI Extension
- [ ] Create `ChatApp/ChatAppDependencyInjection.cs` with `AddChatApp(this IServiceCollection, IConfiguration)` method
- [ ] Move all service registrations from old `Program.cs` into this method:
  - `ChatBotDbContext` (Pomelo MySQL with `ChatBotConnection` connection string)
  - `ITenantService` → `TenantService`
  - `ICurrentUserService` → `CurrentUserService`
  - `IJwtService` → `JwtService`
  - `IChatService` → `ChatService`
  - `IChatBotEngine` → `ChatBotEngine`

### Task 1.4 — Add Project Reference in UI
- [ ] Add `<ProjectReference Include="..\ChatApp\ChatApp.csproj" />` to `UI/UI.csproj`

### Task 1.5 — Wire ChatApp in UI's Program.cs
- [ ] Call `builder.Services.AddChatApp(builder.Configuration)` in `UI/Program.cs`
- [ ] Add `ChatBotConnection` connection string to `UI/appsettings.json` and `UI/appsettings.Development.json`
- [ ] Controllers from ChatApp will auto-register via `app.MapControllers()` (since AddControllers scans all referenced assemblies — need to ensure `AddControllers()` includes ChatApp assembly with `.AddApplicationPart(typeof(ChatAppDependencyInjection).Assembly)`)

### Task 1.6 — Auto-migrate ChatBotDbContext
- [ ] Add ChatBotDbContext migration in UI's startup (alongside ApplicationDbContext migration)

---

## Phase 2: Chat Entity Refactor

### Current Problem
`Chat.cs` has:
```csharp
// public Guid ClientUserId { get; set; }   ← REMOVED
// public Guid? AgentUserId { get; set; }    ← REMOVED
public virtual ChatUser ClientUser { get; set; }   ← navigation with no FK
public virtual ChatUser? AgentUser { get; set; }   ← navigation with no FK
```

### New Design
`Chat` is a **1:1 with Tenant** — when a Tenant is created in the main app, a corresponding `Chat` entity is created in `chatbot_db`. The `Chat` table represents the tenant's chat configuration/instance. `ChatUser` entities belong to a Chat via `TenantId`.

### Task 2.1 — Refactor Chat.cs
- [ ] Remove `ClientUser` and `AgentUser` navigation properties (no direct user FKs on Chat)
- [ ] Keep `TenantId` as the primary link (this is the 1:1 with Tenant in main DB)
- [ ] Keep `Messages` and `BotCommands` navigation collections
- [ ] `Chat` becomes the "chat room/configuration" for a tenant, not a per-conversation entity

**New Chat.cs:**
```csharp
public class Chat
{
    [Key]
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }          // 1:1 with Tenant (from main DB)
    public string Name { get; set; }             // Tenant/Agency chat name
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
    public DateTime? LastModifiedAt { get; set; }
    public string? LastModifiedBy { get; set; }

    // Navigation
    public virtual ICollection<ChatMessage> Messages { get; set; }
    public virtual ICollection<ChatbotCommands> BotCommands { get; set; }
    public virtual ICollection<ChatUser> ChatUsers { get; set; }
}
```

### Task 2.2 — Update ChatUser.cs
- [ ] `ChatUser.TenantId` stays (links to the Chat's TenantId, used for filtering)
- [ ] No changes needed to ChatUser entity itself

### Task 2.3 — Update ChatBotDbContext with OnModelCreating
- [ ] Add `OnModelCreating` to configure:
  - `Chat` → `ChatMessage` (one-to-many via `ChatId`)
  - `Chat` → `ChatbotCommands` (one-to-many via `ChatId`)
  - `Chat` → `ChatUser` (one-to-many via `TenantId`)
  - Unique index on `Chat.TenantId` (1:1 with Tenant)
  - Index on `ChatMessage.ChatId`
  - Index on `ChatUser.TenantId`

---

## Phase 3: Fix Affected Services & Controllers

### Task 3.1 — Fix ChatService.cs
- [ ] Remove `AssignAgentToChatAsync` method (no agent FK on Chat anymore — agents are `ChatUser` entities with `Role = Agent`)
- [ ] Update `CreateChatAsync` — remove ClientUserId parameter (Chat is created per-tenant, not per-client)
- [ ] Update `GetChatByIdAsync` — remove `.Include(c => c.ClientUser)` and `.Include(c => c.AgentUser)`

### Task 3.2 — Fix IChatService.cs
- [ ] Update method signatures to match new ChatService logic
- [ ] Remove `AssignAgentToChatAsync`
- [ ] Update `CreateChatAsync` signature (no clientUserId)

### Task 3.3 — Fix AgentController.cs
- [ ] Remove/refactor `GetAvailableChats` — no longer filters by `AgentUserId == null` on Chat (agents are managed via ChatUser table)
- [ ] Remove/refactor `GetMyChats` — no longer filters by `AgentUserId == currentUserId`
- [ ] Remove/refactor `TakeChat` — no longer calls `AssignAgentToChatAsync`
- [ ] `ToggleUserBotMode` stays (it works on ChatUser, which is unchanged)

### Task 3.4 — Fix ChatBotController.cs
- [ ] No major changes needed (works on ChatId for bot commands, not user FKs)

### Task 3.5 — Fix ChatBotEngine.cs
- [ ] No major changes needed (works on ChatId, not user FKs)

### Task 3.6 — Fix AuthController.cs
- [ ] Ensure registration creates ChatUser properly with TenantId
- [ ] No user FK changes needed (already doesn't reference Chat.ClientUserId)

---

## Phase 4: Configuration & Cleanup

### Task 4.1 — Move connection string to UI config
- [ ] Add to `UI/appsettings.json`:
```json
"ConnectionStrings": {
    "DefaultConnection": "...(existing)...",
    "ChatBotConnection": "Server=localhost;Database=chatbot_db;User=chatbot_user;Password=chatbot_password;"
}
```
- [ ] Add same to `UI/appsettings.Development.json`

### Task 4.2 — Update ChatApp.http
- [ ] Update to use the main app's URL/port instead of `localhost:5085`

### Task 4.3 — Cleanup old files
- [ ] Delete `ChatApp/Program.cs`
- [ ] Delete `ChatApp/Properties/launchSettings.json`
- [ ] Delete `ChatApp/appsettings.json`
- [ ] Delete `ChatApp/appsettings.Development.json`

### Task 4.4 — Resolve duplicate service interfaces
- [ ] ChatApp has its own `ITenantService`, `ICurrentUserService`, `IJwtService` — these are **separate** from the main app's interfaces in `Application.Common.Interfaces`
- [ ] Keep them separate (ChatApp namespace `ChatApp.Interfaces`) — they serve the ChatApp context only
- [ ] ChatApp's `TenantService` reads from JWT claims (same approach as main app's `TenantMiddleware`)

---

## File Change Summary

| File | Action |
|------|--------|
| `ChatApp/ChatApp.csproj` | Change SDK to class library, add FrameworkReference, remove Swagger packages |
| `ChatApp/Program.cs` | **DELETE** |
| `ChatApp/Properties/launchSettings.json` | **DELETE** |
| `ChatApp/appsettings.json` | **DELETE** |
| `ChatApp/appsettings.Development.json` | **DELETE** |
| `ChatApp/ChatAppDependencyInjection.cs` | **CREATE** — DI extension method |
| `ChatApp/Models/Chat.cs` | Refactor — remove ClientUser/AgentUser navigations, add ChatUsers collection |
| `ChatApp/Models/ChatBotDbContext.cs` | Add `OnModelCreating` with relationships & indexes |
| `ChatApp/Interfaces/IChatService.cs` | Remove `AssignAgentToChatAsync`, update `CreateChatAsync` signature |
| `ChatApp/Services/ChatService.cs` | Refactor to match new Chat entity |
| `ChatApp/Controllers/AgentController.cs` | Refactor — remove Chat user-FK-based queries |
| `ChatApp/ChatApp.http` | Update URL |
| `UI/UI.csproj` | Add ChatApp project reference |
| `UI/Program.cs` | Add `AddChatApp()` call + ChatBotDbContext migration |
| `UI/appsettings.json` | Add `ChatBotConnection` connection string |
| `UI/appsettings.Development.json` | Add `ChatBotConnection` connection string |

---

## Execution Order
1. Phase 1 (Tasks 1.1 → 1.6) — Convert & wire up
2. Phase 2 (Tasks 2.1 → 2.3) — Entity refactor
3. Phase 3 (Tasks 3.1 → 3.6) — Fix services & controllers
4. Phase 4 (Tasks 4.1 → 4.4) — Config & cleanup

---

## Notes
- ChatApp keeps its own `ChatBotDbContext` pointing to a **separate MySQL database** (`chatbot_db`) — this is intentional, chat data is isolated
- ChatApp controllers will be available under the main API (e.g., `/api/ChatBot/...`, `/api/Agent/...`, `/api/Auth/...` for chat auth)
- The main app's JWT auth config in `UI/Program.cs` will handle auth for both main and chat controllers (same JWT token)
- SignalR hub implementation is **NOT** in this plan — that's a separate phase after merge is complete
