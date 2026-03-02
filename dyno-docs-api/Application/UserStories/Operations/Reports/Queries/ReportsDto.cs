namespace Application.UserStories.Operations.Reports.Queries;

public class ReportsDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public string? GeneratedReport { get; set; }
}