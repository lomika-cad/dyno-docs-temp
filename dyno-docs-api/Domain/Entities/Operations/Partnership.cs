using System.ComponentModel.DataAnnotations;
using Domain.Common;

namespace Domain.Entities.Operations;

public class Partnership : BaseEntity
{
    [MaxLength(255)]
    public string? Name { get; set; }
    [MaxLength(500)]
    public string? Description { get; set; }
    [MaxLength(225)]
    public string? District { get; set; }
    public PartnershipTypes PartnershipType { get; set; }
    public byte[][]? Images { get; set; }
}