using Domain.Common.Interfaces;
using ChatApp.Interfaces;
using ChatApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatController : ControllerBase
{
    private readonly ChatBotDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly ICurrentUserService _currentUserService;
    private readonly IChatService _chatService;
    private readonly IChatJwtService _chatJwtService;

    public ChatController(
        ChatBotDbContext context,
        ITenantService tenantService,
        ICurrentUserService currentUserService,
        IChatService chatService,
        IChatJwtService chatJwtService)
    {
        _context = context;
        _tenantService = tenantService;
        _currentUserService = currentUserService;
        _chatService = chatService;
        _chatJwtService = chatJwtService;
    }

    // ─── Public: Client Registration ──────────────────────────────────────────

    /// <summary>
    /// Register a new tourist/client for a specific tenant's chat.
    /// No auth required — tourists are NOT in the main app user table.
    /// TenantId is passed in the request body (not from JWT).
    /// </summary>
    [HttpPost("register-client")]
    [AllowAnonymous]
    public async Task<IActionResult> RegisterClient([FromBody] RegisterClientRequest request)
    {
        try
        {
            // Validate the tenant's chat exists
            var chat = await _context.Chats
                .FirstOrDefaultAsync(c => c.TenantId == request.TenantId);

            if (chat == null)
                return NotFound(new { message = "No active chat found for this agency" });

            // Check if client already exists for this tenant
            var existing = await _context.ChatUsers
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.TenantId == request.TenantId);

            if (existing != null)
                return BadRequest(new { message = "A client with this email already exists for this agency" });

            var chatUser = new ChatUser
            {
                Id = Guid.NewGuid(),
                TenantId = request.TenantId,
                Email = request.Email,
                Name = request.Name,
                Role = UserRole.Client,
                IsBotOn = true,  // Clients always start with bot on
                IsOnline = false,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "self-register"
            };

            _context.ChatUsers.Add(chatUser);
            await _context.SaveChangesAsync();

            var token = _chatJwtService.GenerateToken(chatUser);

            return Ok(new
            {
                chatUser = new
                {
                    chatUser.Id,
                    chatUser.Name,
                    chatUser.Email,
                    chatUser.TenantId,
                    chatUser.Role,
                    chatUser.IsBotOn
                },
                chatId = chat.Id,
                token
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Client registration failed", error = ex.Message });
        }
    }
    
    [HttpPost("check-client")]
    [AllowAnonymous]
    public async Task<IActionResult> CheckClientExists([FromQuery] string email)
    {
        try
        {
            var chatUser = await _context.ChatUsers
                .FirstOrDefaultAsync(u => u.Email == email
                                       && u.Role == UserRole.Client);

            if (chatUser == null)
                return NotFound(new { message = "Client not found" });

            return Ok(new
            {
                chatUser = new
                {
                    chatUser.Id,
                    chatUser.Name,
                    chatUser.Email,
                    chatUser.TenantId,
                    chatUser.Role,
                    chatUser.IsBotOn
                },
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to check client", error = ex.Message });
        }
    }

    /// <summary>
    /// Login an existing client by email + tenantId.
    /// Returns a ChatUser JWT for accessing chat endpoints.
    /// </summary>
    [HttpPost("client-login")]
    [AllowAnonymous]
    public async Task<IActionResult> ClientLogin([FromBody] ClientLoginRequest request)
    {
        try
        {
            var chatUser = await _context.ChatUsers
                .FirstOrDefaultAsync(u => u.Email == request.Email
                                       && u.TenantId == request.TenantId
                                       && u.Role == UserRole.Client);

            if (chatUser == null)
                return Unauthorized(new { message = "Client not found for this agency" });

            var chat = await _context.Chats
                .FirstOrDefaultAsync(c => c.TenantId == request.TenantId);

            var token = _chatJwtService.GenerateToken(chatUser);

            return Ok(new
            {
                chatUser = new
                {
                    chatUser.Id,
                    chatUser.Name,
                    chatUser.Email,
                    chatUser.TenantId,
                    chatUser.Role,
                    chatUser.IsBotOn
                },
                chatId = chat?.Id,
                token
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Client login failed", error = ex.Message });
        }
    }

    // ─── Authenticated Endpoints ───────────────────────────────────────────────
    [HttpGet("my-chat")]
    public async Task<IActionResult> GetMyChat()
    {
        try
        {
            // Since Chat is 1:1 with Tenant, get the chat for current tenant
            var chat = await _context.Chats
                .FirstOrDefaultAsync(c => c.TenantId == _tenantService.TenantId);

            if (chat == null)
            {
                return NotFound(new { message = "Chat not found for this tenant" });
            }

            return Ok(new
            {
                chat.Id,
                chat.Name,
                chat.IsActive,
                chat.CreatedAt
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to get chat", error = ex.Message });
        }
    }

    [HttpPost("send-message")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
    {
        try
        {
            var chatUser = await _context.ChatUsers
                .FirstOrDefaultAsync(u => u.Id == request.ChatUserId);

            if (chatUser == null)
                return Unauthorized(new { message = "Chat user not found or unauthorized" });

            var senderType = chatUser.Role == UserRole.Client ? SenderType.Client : SenderType.Agent;

            var lastMessage = await _context.ChatMessages
                .Where(m => m.ChatId == request.ChatId)
                .OrderByDescending(m => m.OrderSequence)
                .FirstOrDefaultAsync();

            var message = new ChatMessage
            {
                Id = Guid.NewGuid(),
                TenantId = request.TenantId,
                ChatId = request.ChatId,
                ChatUserId = request.ChatUserId,
                Message = request.Message,
                SenderType = request.SenderType,
                ConversationIndex = request.ConversationIndex,
                OrderSequence = (lastMessage?.OrderSequence ?? 0) + 1,
                IsRead = false,
                CreatedAt = DateTime.Now,
                CreatedBy = _currentUserService.UserName ?? "system"
            };

            _context.ChatMessages.Add(message);
            await _context.SaveChangesAsync();

            return Ok(new { messageId = message.Id, message = "Message sent successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to send message", error = ex.Message });
        }
    }

    [HttpGet("messages/{chatId}")]
    public async Task<IActionResult> GetMessages(Guid chatId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
    {
        try
        {
            var query = _context.ChatMessages
                .Where(m => m.ChatUserId == chatId)
                .Include(m => m.ChatUser)
                .OrderBy(m => m.OrderSequence);

            var totalMessages = await query.CountAsync();
            var messages = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return Ok(new
            {
                totalMessages,
                page,
                pageSize,
                messages = messages.Select(m => new
                {
                    m.Id,
                    m.Message,
                    m.SenderType,
                    m.ConversationIndex,
                    m.OrderSequence,
                    m.IsRead,
                    m.CreatedAt,
                    ChatUser = new { m.ChatUser.Id, m.ChatUser.Name, m.ChatUser.Email, m.ChatUser.Role }
                })
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to get messages", error = ex.Message });
        }
    }

    [HttpPost("messages/{messageId}/mark-read")]
    public async Task<IActionResult> MarkMessageAsRead(Guid messageId)
    {
        try
        {
            var message = await _context.ChatMessages.FindAsync(messageId);
            if (message == null || message.TenantId != _tenantService.TenantId)
                return NotFound(new { message = "Message not found" });

            message.IsRead = true;
            message.LastModifiedAt = DateTime.UtcNow;
            message.LastModifiedBy = _currentUserService.UserName ?? "system";
            await _context.SaveChangesAsync();

            return Ok(new { message = "Message marked as read" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to mark message as read", error = ex.Message });
        }
    }

    [HttpGet("users")]
    public async Task<IActionResult> GetChatUsers()
    {
        try
        {
            var users = await _context.ChatUsers
                .Where(u => u.TenantId == _tenantService.TenantId)
                .OrderBy(u => u.Name)
                .ToListAsync();

            return Ok(users.Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Role,
                u.IsBotOn,
                u.IsOnline,
                u.CreatedAt
            }));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to get chat users", error = ex.Message });
        }
    }
}

public class SendMessageRequest
{
    public Guid ChatId { get; set; }
    public Guid ChatUserId { get; set; }
    public Guid TenantId { get; set; }
    public string Message { get; set; }
    public int? ConversationIndex { get; set; }
    
    public SenderType SenderType { get; set; }
}

public class RegisterClientRequest
{
    public Guid TenantId { get; set; }   // Which agency's chat to join
    public string Name { get; set; }
    public string Email { get; set; }
}

public class ClientLoginRequest
{
    public Guid TenantId { get; set; }   // Which agency's chat
    public string Email { get; set; }
}
