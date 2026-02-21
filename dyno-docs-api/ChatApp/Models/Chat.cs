using System.ComponentModel.DataAnnotations;

namespace ChatApp.Models;

public class Chat
{
    [Key]
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Name { get; set; }
    // public Guid ClientUserId { get; set; }
    // public Guid? AgentUserId { get; set; }
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
