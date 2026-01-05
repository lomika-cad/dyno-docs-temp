using UI.Common;

namespace Domain.Common;

public class AuditableEntity : ValidationBase
{
    public DateTime CreatedAt { get; set; }
   
    public string CreatedBy { get; set; }
    
    public DateTime? LastModifiedAt { get; set; }
    
    public string? LastModifiedBy { get; set; }
}