using ChatApp.Models;

namespace ChatApp.Models.Dtos;

public class CreateChatbotCommandDto
{
    public Guid ChatId { get; set; }
    public int Index { get; set; }
    public string[] Message { get; set; } = [];
    public string[] Reply { get; set; } = [];
    public CommandType Type { get; set; }
    public string Keywords { get; set; } = string.Empty;
}

public class UpdateChatbotCommandDto
{
    public int? Index { get; set; }
    public string[]? Message { get; set; }
    public string[]? Reply { get; set; }
    public CommandType? Type { get; set; }
    public string? Keywords { get; set; }
}
