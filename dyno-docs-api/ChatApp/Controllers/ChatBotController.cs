using ChatApp.Interfaces;
using ChatApp.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ChatApp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatBotController : ControllerBase
{
    private readonly IChatBotEngine _chatBotEngine;
    private readonly ChatBotDbContext _context;
    private readonly ITenantService _tenantService;

    public ChatBotController(IChatBotEngine chatBotEngine, ChatBotDbContext context, ITenantService tenantService)
    {
        _chatBotEngine = chatBotEngine;
        _context = context;
        _tenantService = tenantService;
    }

    [HttpPost("process-message")]
    public async Task<IActionResult> ProcessMessage([FromBody] ProcessMessageRequest request)
    {
        try
        {
            var botCommand = await _chatBotEngine.ProcessUserMessageAsync(request.ChatId, request.Message);

            if (botCommand == null)
            {
                return Ok(new
                {
                    hasResponse = false,
                    message = "No matching bot response found"
                });
            }

            return Ok(new
            {
                hasResponse = true,
                command = new
                {
                    botCommand.Id,
                    botCommand.Index,
                    botCommand.Message,
                    botCommand.Reply,
                    botCommand.Type
                }
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to process message", error = ex.Message });
        }
    }

    [HttpGet("commands/{chatId}")]
    public async Task<IActionResult> GetBotCommands(Guid chatId)
    {
        try
        {
            var commands = await _chatBotEngine.GetBotCommandsByChatAsync(chatId);
            return Ok(commands.Select(c => new
            {
                c.Id,
                c.Index,
                c.Message,
                c.Reply,
                c.Type,
                c.Keywords
            }));
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to get bot commands", error = ex.Message });
        }
    }

    [HttpPost("create-commands")]
    public async Task<IActionResult> CreateBotCommands([FromBody] CreateBotCommandsRequest request)
    {
        try
        {
            var success = await _chatBotEngine.CreateBotCommandsForChatAsync(request.ChatId, _tenantService.TenantId);

            if (success)
            {
                return Ok(new { message = "Bot commands created successfully" });
            }
            else
            {
                return BadRequest(new { message = "Failed to create bot commands" });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Failed to create bot commands", error = ex.Message });
        }
    }
}

public class ProcessMessageRequest
{
    public Guid ChatId { get; set; }
    public string Message { get; set; }
}

public class CreateBotCommandsRequest
{
    public Guid ChatId { get; set; }
}
