using Application.UserStories.Operations.Places.Queries;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.Places.Queries;

public class GetPlaceByIdQueryTest
{
    [Fact]
    public async Task Handle_ShouldReturnPlace_WhenExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var existingPlace = new Domain.Entities.Operations.Place
        {
            Name = "Test Place",
            AverageVisitDuration = "2 hours",
            Description = "A test place",
            FunFact = "Fun fact",
            District = "Test District",
            City = "Test City",
            Image1 = new byte[] { 1, 2, 3 },
            Image2 = new byte[] { 4, 5, 6 },
            CreatedAt = DateTime.Now,
            CreatedBy = "TestUser"
        };
        context.Places.Add(existingPlace);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetPlaceByIdQueryHandler(context);
        var query = new GetPlaceByIdQuery(existingPlace.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(existingPlace.Id, result.Id);
        Assert.Equal("Test Place", result.Name);
        Assert.Equal("2 hours", result.AverageVisitDuration);
        Assert.Equal("A test place", result.Description);
        Assert.Equal("Fun fact", result.FunFact);
        Assert.Equal("Test District", result.District);
        Assert.Equal("Test City", result.City);
        Assert.Equal(Convert.ToBase64String(new byte[] { 1, 2, 3 }), result.Image1Url);
        Assert.Equal(Convert.ToBase64String(new byte[] { 4, 5, 6 }), result.Image2Url);
        Assert.Null(result.Image3Url);
        Assert.Null(result.Image4Url);
        Assert.Null(result.Image5Url);
    }

    [Fact]
    public async Task Handle_ShouldReturnNull_WhenNotExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new GetPlaceByIdQueryHandler(context);
        var query = new GetPlaceByIdQuery(Guid.NewGuid()); // Non-existent ID

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }
}
