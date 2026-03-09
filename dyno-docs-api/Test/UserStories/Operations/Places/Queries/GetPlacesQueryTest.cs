using Application.UserStories.Operations.Places.Queries;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.Places.Queries;

public class GetPlacesQueryTest
{
    [Fact]
    public async Task Handle_ShouldReturnAllPlaces()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var places = new List<Domain.Entities.Operations.Place>
        {
            new()
            {
                Name = "Place 1",
                AverageVisitDuration = "2 hours",
                Description = "Description 1",
                FunFact = "Fun fact 1",
                District = "District A",
                City = "City A",
                Image1 = new byte[] { 1, 2, 3 },
                Image2 = new byte[] { 4, 5, 6 },
                CreatedAt = DateTime.Now,
                CreatedBy = "TestUser"
            },
            new()
            {
                Name = "Place 2",
                AverageVisitDuration = "3 hours",
                Description = "Description 2",
                FunFact = "Fun fact 2",
                District = "District B",
                City = "City B",
                Image1 = new byte[] { 7, 8, 9 },
                Image3 = new byte[] { 10, 11, 12 },
                CreatedAt = DateTime.Now,
                CreatedBy = "TestUser"
            }
        };

        foreach (var place in places)
        {
            context.Places.Add(place);
        }
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetPlacesQueryHandler(context);
        var query = new GetPlacesQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);

        var place1Response = result.FirstOrDefault(p => p.Name == "Place 1");
        Assert.NotNull(place1Response);
        Assert.Equal("2 hours", place1Response.AverageVisitDuration);
        Assert.Equal("Description 1", place1Response.Description);
        Assert.Equal("Fun fact 1", place1Response.FunFact);
        Assert.Equal("District A", place1Response.District);
        Assert.Equal("City A", place1Response.City);
        Assert.Equal(Convert.ToBase64String(new byte[] { 1, 2, 3 }), place1Response.Image1Url);
        Assert.Equal(Convert.ToBase64String(new byte[] { 4, 5, 6 }), place1Response.Image2Url);
        Assert.Null(place1Response.Image3Url);

        var place2Response = result.FirstOrDefault(p => p.Name == "Place 2");
        Assert.NotNull(place2Response);
        Assert.Equal("3 hours", place2Response.AverageVisitDuration);
        Assert.Equal("Description 2", place2Response.Description);
        Assert.Equal("Fun fact 2", place2Response.FunFact);
        Assert.Equal("District B", place2Response.District);
        Assert.Equal("City B", place2Response.City);
        Assert.Equal(Convert.ToBase64String(new byte[] { 7, 8, 9 }), place2Response.Image1Url);
        Assert.Null(place2Response.Image2Url);
        Assert.Equal(Convert.ToBase64String(new byte[] { 10, 11, 12 }), place2Response.Image3Url);
    }
}
