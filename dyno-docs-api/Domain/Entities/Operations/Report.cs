using Domain.Common;

namespace Domain.Entities.Operations;

public class Report : BaseEntity
{
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public string? GeneratedReport { get; set; }
}