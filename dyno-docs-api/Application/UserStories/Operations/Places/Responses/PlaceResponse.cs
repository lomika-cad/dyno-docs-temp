namespace Application.UserStories.Operations.Places.Responses;

public class PlaceResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AverageVisitDuration { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? FunFact { get; set; }
    public string District { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? Image1Url { get; set; }
    public string? Image2Url { get; set; }
    public string? Image3Url { get; set; }
    public string? Image4Url { get; set; }
    public string? Image5Url { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? LastModifiedAt { get; set; }
    public string? LastModifiedBy { get; set; }
}

