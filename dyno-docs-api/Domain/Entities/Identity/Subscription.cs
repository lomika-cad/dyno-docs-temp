using Domain.Common;

namespace Domain.Entities.Identity;

public class Subscription : BaseEntity
{
    public int CurrentToken { get; set; } = 100;
    public int AvailableToken { get; set; } = 100;
    
    // Foreign key to Tenant
    public Guid TenantId { get; set; }
    public virtual Tenant? Tenant { get; set; }
}
