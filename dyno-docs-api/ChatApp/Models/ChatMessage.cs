using System.ComponentModel.DataAnnotations;

namespace ChatApp.Models;

public class ChatMessage
{
    [Key]
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
