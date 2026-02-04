using Domain.Common;

namespace Domain.Entities.Operations;

public class UserTemplate : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid TemplateId { get; set; }
    public string TemplateDesign { get; set; } = string.Empty;
}