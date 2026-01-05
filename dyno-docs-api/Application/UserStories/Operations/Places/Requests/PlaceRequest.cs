using System.ComponentModel.DataAnnotations;

namespace Application.UserStories.Operations.Places.Requests;

public class PlaceRequest
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

    public byte[]? Image1 { get; set; }
    public byte[]? Image2 { get; set; }
    public byte[]? Image3 { get; set; }
    public byte[]? Image4 { get; set; }
    public byte[]? Image5 { get; set; }
}