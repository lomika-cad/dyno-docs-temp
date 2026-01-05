using System.ComponentModel.DataAnnotations;

namespace Domain.Common;

public class BaseEntity : AuditableEntity
{
    [Key]
    public Guid Id { get; set; }
    
    public Guid TenantId { get; set; }
}