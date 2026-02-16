using System.ComponentModel.DataAnnotations;

namespace ChatApp.Models;

public class ChatUser
{
    [Key]
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string Email { get; set; }
    public string Name { get; set; }
    public UserRole Role { get; set; }
    public bool IsBotOn { get; set; }
    public bool IsOnline { get; set; }
    public string? ConnectionId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; }
    public DateTime? LastModifiedAt { get; set; }
    public string? LastModifiedBy { get; set; }
}
