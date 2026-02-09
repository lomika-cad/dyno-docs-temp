using Domain.Common;

namespace Domain.Entities.Operations;

public class Customer : BaseEntity
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? ContactNo { get; set; }
    public string? Country { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
}