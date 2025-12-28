using System.ComponentModel.DataAnnotations;
using UI.Common;

namespace Domain.Common;

public class BaseEntity : ValidationBase
{
    [Key]
    public int Id { get; set; }
}