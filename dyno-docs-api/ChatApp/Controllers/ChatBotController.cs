using Domain.Common.Interfaces;
using ChatApp.Interfaces;
using ChatApp.Models.Dtos;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatBotController : ControllerBase
{
    private readonly IChatBotEngine _chatBotEngine;
    private readonly ITenantService _tenantService;

    public ChatBotController(
        IChatBotEngine chatBotEngine,
        ITenantService tenantService)
    {
        _chatBotEngine = chatBotEngine;
        _tenantService = tenantService;
    }
    
    [HttpPost("create-bot")]
    [Authorize]
    public async Task<Guid> CreateBot([FromBody] CreateChatbotDto dto)
    {
        try
        {
            var bot = await _chatBotEngine.CreateChatBotAsync(_tenantService.TenantId, dto);
            return bot;
        }
        catch (Exception ex)
        {
            throw new Exception("Failed to create chatbot", ex);
        }
    }

    /// <summary>Process a tourist message and return a matching bot command.</summary>
    [HttpPost("process-message")]
    public async Task<IActionResult> ProcessMessage([FromBody] ProcessMessageRequest request)
    {
        try
        {
            var botCommand = await _chatBotEngine.ProcessUserMessageAsync(request.ChatId, request.Message);
            if (botCommand == null)
                return Ok(new { hasResponse = false, message = "No matching bot response found" });

            return Ok(new
            {
                hasResponse = true,
                command = new { botCommand.Id, botCommand.Index, botCommand.Message, botCommand.Reply, botCommand.Type }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to process message", error = ex.Message });
        }
    }

    /// <summary>Get all bot commands for a specific chat, ordered by Index.</summary>
    ///
    [AllowAnonymous]
    [HttpGet("commands/{chatId}")]
    public async Task<IActionResult> GetBotCommands(Guid chatId)
    {
        try
        {
            var commands = await _chatBotEngine.GetBotCommandsByChatAsync(chatId);
            return Ok(commands.Select(c => new
            {
                c.Id, c.Index, c.Message, c.Reply, c.Type, c.Keywords, c.CreatedAt
            }));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to get bot commands", error = ex.Message });
        }
    }
    
    [HttpGet("bot-name/{chatId}")]
    public async Task<IActionResult> GetBotName(Guid chatId)
    {
        try
        {
            var botName = await _chatBotEngine.GetBotNameAsync(chatId);
            return Ok(new { botName });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to get bot name", error = ex.Message });
        }
    }

    /// <summary>Add a new bot command to a chat manually.</summary>
    [HttpPost("commands")]
    [Authorize]
    public async Task<IActionResult> AddBotCommand([FromBody] CreateChatbotCommandDto dto)
    {
        try
        {
            var command = await _chatBotEngine.AddBotCommandAsync(_tenantService.TenantId, dto);
            return Ok(new
            {
                message = "Bot command created successfully",
                command = new { command.Id, command.Index, command.Message, command.Reply, command.Type, command.Keywords }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to create bot command", error = ex.Message });
        }
    }

    /// <summary>Update an existing bot command (partial — only provided fields are changed).</summary>
    [HttpPut("commands/{commandId}")]
    [Authorize]
    public async Task<IActionResult> UpdateBotCommand(Guid commandId, [FromBody] UpdateChatbotCommandDto dto)
    {
        try
        {
            var command = await _chatBotEngine.UpdateBotCommandAsync(commandId, _tenantService.TenantId, dto);
            if (command == null)
                return NotFound(new { message = "Bot command not found" });

            return Ok(new
            {
                message = "Bot command updated successfully",
                command = new { command.Id, command.Index, command.Message, command.Reply, command.Type, command.Keywords }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to update bot command", error = ex.Message });
        }
    }

    /// <summary>Delete a bot command.</summary>
    [HttpDelete("commands/{commandId}")]
    [Authorize]
    public async Task<IActionResult> DeleteBotCommand(Guid commandId)
    {
        try
        {
            var deleted = await _chatBotEngine.DeleteBotCommandAsync(commandId, _tenantService.TenantId);
            if (!deleted)
                return NotFound(new { message = "Bot command not found" });

            return Ok(new { message = "Bot command deleted successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to delete bot command", error = ex.Message });
        }
    }
}

public class ProcessMessageRequest
{
    public Guid ChatId { get; set; }
    public string Message { get; set; } = string.Empty;
}
