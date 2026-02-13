using Domain.Common;

namespace Domain.Entities.Operations;

public class UserSubscription : BaseEntity
{
    public int PlanId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsActive { get; set; }
    public int? ReportsLimit { get; set; }
    public int? TemplatesLimit { get; set; }
    public int? DiscountPercentage { get; set; }
}