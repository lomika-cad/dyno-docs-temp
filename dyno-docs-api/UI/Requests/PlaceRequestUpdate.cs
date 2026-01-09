namespace UI.Requests;

public class PlaceRequestUpdate
{
    public required string Name { get; set; }
    public required string AverageVisitDuration { get; set; }
    public string? Description { get; set; }
    public string? FunFact { get; set; }
    public required string District { get; set; }
    public required string City { get; set; }

}