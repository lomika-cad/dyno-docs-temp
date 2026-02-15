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
            // Get chats that don't have an assigned agent
            var availableChats = await _context.Chats
                .Where(c => c.TenantId == _tenantService.TenantId && c.AgentUserId == null && c.IsActive)
                .Include(c => c.ClientUser)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(availableChats.Select(c => new
            {
                c.Id,
                c.Name,
                c.CreatedAt,
                ClientUser = new
                {
                    c.ClientUser.Id,
                    c.ClientUser.Name,
                    c.ClientUser.Email
                }
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
            var currentUserId = Guid.Parse(_currentUserService.UserId ?? Guid.Empty.ToString());

            var myChats = await _context.Chats
                .Where(c => c.TenantId == _tenantService.TenantId && c.AgentUserId == currentUserId)
                .Include(c => c.ClientUser)
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(myChats.Select(c => new
            {
                c.Id,
                c.Name,
                c.IsActive,
                c.CreatedAt,
                ClientUser = new
                {
                    c.ClientUser.Id,
                    c.ClientUser.Name,
                    c.ClientUser.Email
                }
            }));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to get my chats", error = ex.Message });
        }
    }

    [HttpPost("take-chat/{chatId}")]
    public async Task<IActionResult> TakeChat(Guid chatId)
    {
        try
        {
            var currentUserId = Guid.Parse(_currentUserService.UserId ?? Guid.Empty.ToString());
            var success = await _chatService.AssignAgentToChatAsync(chatId, currentUserId);

            if (!success)
            {
                return NotFound(new { message = "Chat not found or already assigned" });
            }

            return Ok(new { message = "Chat assigned successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to take chat", error = ex.Message });
        }
    }

    [HttpPost("toggle-bot/{userId}")]
    public async Task<IActionResult> ToggleUserBotMode(Guid userId)
    {
        try
        {
            var user = await _context.ChatUsers.FindAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

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
}
