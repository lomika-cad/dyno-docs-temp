using System.ComponentModel.DataAnnotations;
using Domain.Common;

namespace Domain.Entities.Operations;

public class Template
{
    [Key]
    public Guid Id { get; set; }
    [Required]
    public string TemplateName { get; set; }
    
    [Required]
    public byte[] TemplateThumbnail { get; set; }
    public string TemplateDesign { get; set; } = string.Empty;
    public bool isPaid { get; set; }
    public decimal? Price { get; set; }
    
    public DateTime CreatedAt { get; set; }
   
    public string CreatedBy { get; set; }
    
    public DateTime? LastModifiedAt { get; set; }
    
    public string? LastModifiedBy { get; set; }
}