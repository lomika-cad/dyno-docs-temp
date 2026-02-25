using Domain.Common.Interfaces;
using ChatApp.Interfaces;
using ChatApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AgentController : ControllerBase
{
    private readonly IChatService _chatService;
    private readonly ChatBotDbContext _context;
    private readonly ITenantService _tenantService;
    private readonly ICurrentUserService _currentUserService;

    public AgentController(
        IChatService chatService,
        ChatBotDbContext context,
        ITenantService tenantService,
        ICurrentUserService currentUserService)
    {
        _chatService = chatService;
        _context = context;
        _tenantService = tenantService;
        _currentUserService = currentUserService;
    }

    [HttpGet("available-chats")]
    public async Task<IActionResult> GetAvailableChats()
    {
        try
        {
            // Get all active chats for the tenant (agents can see all chats)
            var availableChats = await _context.Chats
                .Where(c => c.TenantId == _tenantService.TenantId && c.IsActive)
                .Include(c => c.ChatUsers.Where(cu => cu.Role == UserRole.Client))
                .Include(c => c.Messages)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(availableChats.Select(c => new
            {
                c.Id,
                c.Name,
                c.CreatedAt,
                ClientUsers = c.ChatUsers.Select(cu => new
                {
                    cu.Id,
                    cu.Name,
                    cu.Email,
                    UnreadMessageCount = c.Messages.Count(m => m.ChatUserId == cu.Id && !m.IsRead)
                })
            }));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to get available chats", error = ex.Message });
        }
    }

    [HttpGet("my-chats")]
    public async Task<IActionResult> GetMyChats()
    {
        try
        {
            var currentUserId = _currentUserService.UserId;

            // Get chats where current agent user exists and has messages
            var myChats = await _context.Chats
                .Where(c => c.TenantId == _tenantService.TenantId)
                .Include(c => c.ChatUsers.Where(cu => cu.Role == UserRole.Client))
                .Include(c => c.Messages.Where(m => m.ChatUserId == currentUserId))
                .Where(c => c.Messages.Any(m => m.ChatUserId == currentUserId))
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(myChats.Select(c => new
            {
                c.Id,
                c.Name,
                c.IsActive,
                c.CreatedAt,
                ClientUsers = c.ChatUsers.Select(cu => new
                {
                    cu.Id,
                    cu.Name,
                    cu.Email
                })
            }));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to get my chats", error = ex.Message });
        }
    }
    
    [HttpPut("read-messages/{chatId}")]
    public async Task<IActionResult> MarkMessagesAsRead(Guid chatId)
    {
        try
        {
            var currentUserId = _currentUserService.UserId;

            var messagesToMark = await _context.ChatMessages
                .Where(m =>  m.ChatUserId == chatId && !m.IsRead)
                .ToListAsync();

            if (!messagesToMark.Any())
            {
                return Ok(new { message = "No unread messages to mark as read" });
            }

            foreach (var message in messagesToMark)
            {
                message.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = $"{messagesToMark.Count} messages marked as read" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to mark messages as read", error = ex.Message });
        }
    }

    [HttpPost("take-chat/{chatId}")]
    public async Task<IActionResult> TakeChat(Guid chatId)
    {
        try
        {
            // Since Chat is 1:1 with Tenant, agents can access all chats
            // This method might not be needed anymore, but keeping it for compatibility
            var chat = await _context.Chats.FindAsync(chatId);
            if (chat == null || chat.TenantId != _tenantService.TenantId)
            {
                return NotFound(new { message = "Chat not found" });
            }

            return Ok(new { message = "Chat accessed successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to take chat", error = ex.Message });
        }
    }

    [HttpPost("toggle-bot/{chatUserId}")]
    public async Task<IActionResult> ToggleUserBotMode(Guid chatUserId)
    {
        try
        {
            var user = await _context.ChatUsers
                .FirstOrDefaultAsync(u => u.Id == chatUserId && u.TenantId == _tenantService.TenantId);

            if (user == null)
                return NotFound(new { message = "User not found" });

            user.IsBotOn = !user.IsBotOn;
            user.LastModifiedAt = DateTime.UtcNow;
            user.LastModifiedBy = _currentUserService.UserName ?? "system";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = $"Bot mode {(user.IsBotOn ? "enabled" : "disabled")} for user",
                isBotOn = user.IsBotOn
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to toggle bot mode", error = ex.Message });
        }
    }
    
    [HttpGet("bot-status")]
    public async Task<IActionResult> GetBotStatus(Guid chatUserId)
    {
        try
        {
            var botCommands = await _context.ChatbotCommands
                .Where(c => c.TenantId == _tenantService.TenantId)
                .ToListAsync();
            
            var message = await _context.ChatMessages
                .Where(m => m.ChatUserId == chatUserId && m.ConversationIndex == botCommands.Count)
                .FirstOrDefaultAsync();
            
            if (message == null)
            {
                return Ok(new { message = "Bot is On" });
            }
            else
            {
                return Ok(new {message = "Bot is Off" });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to get bot status", error = ex.Message });
        }
    }

    [HttpGet("unread-chat-count")]
    public async Task<IActionResult> GetUnreadChatCount()
    {
        try
        {
            var currentUserId = _currentUserService.UserId;

            var unreadChatCount = await _context.Chats
                .Where(c => c.TenantId == _tenantService.TenantId)
                .Include(c => c.Messages.Where(m => m.TenantId == _tenantService.TenantId && !m.IsRead))
                .Where(c => c.Messages.Any(m => m.TenantId == _tenantService.TenantId && !m.IsRead))
                .CountAsync();

            return Ok(new { unreadChatCount });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to get unread chat count", error = ex.Message });
        }
    }
}
