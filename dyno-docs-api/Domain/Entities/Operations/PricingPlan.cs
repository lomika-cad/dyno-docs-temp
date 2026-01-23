namespace Domain.Entities.Operations;

public class PricingPlan
{
    public int Id { get; set; }
    public required string PlanName { get; set; }
    public required string Description { get; set; }
    public decimal MonthlyPrice { get; set; }
    public decimal YearlyPrice { get; set; }
    public string[]? Features { get; set; }
}