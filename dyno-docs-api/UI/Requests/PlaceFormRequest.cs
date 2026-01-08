using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace UI.Requests;

public class PlaceFormRequest
{
    [Required]
    [MaxLength(255)]
    public required string Name { get; set; }

    [Required]
    [MaxLength(255)]
    public required string AverageVisitDuration { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public string? FunFact { get; set; }

    [Required]
    [MaxLength(225)]
    public required string District { get; set; }

    [Required]
    [MaxLength(225)]
    public required string City { get; set; }

    public IFormFile? Image1 { get; set; }
    public IFormFile? Image2 { get; set; }
    public IFormFile? Image3 { get; set; }
    public IFormFile? Image4 { get; set; }
    public IFormFile? Image5 { get; set; }
}