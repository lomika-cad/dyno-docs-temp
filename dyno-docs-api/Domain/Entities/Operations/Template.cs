using System.ComponentModel.DataAnnotations;
using Domain.Common;

namespace Domain.Entities.Operations;

public class Template : BaseEntity
{
    [Required]
    public string TemplateName { get; set; }
    
    [Required]
    public byte[] TemplateThumbnail { get; set; }
    
    [MaxLength(5000)]
    public string TemplateDesign { get; set; }
    public bool isPaid { get; set; }
    public decimal? Price { get; set; }
}