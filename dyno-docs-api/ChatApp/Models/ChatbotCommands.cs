using System.ComponentModel.DataAnnotations;

namespace ChatApp.Models;

public class ChatbotCommands
{
    [Key]
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
