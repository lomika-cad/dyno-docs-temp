using Application.UserStories.Operations.Places.Commands;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.Places.Commands;

public class CreatePlaceCommandTest
{
    [Fact]
    public async Task Handle_ShouldCreatePlace_WhenValidRequest()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new CreatePlaceCommandHandler(context);
        var command = new CreatePlaceCommand
        {
            Name = "Test Place",
            AverageVisitDuration = "2 hours",
            Description = "A beautiful test place",
            FunFact = "This is a fun fact",
            District = "Test District",
            City = "Test City",
            Image1 = new byte[] { 1, 2, 3 },
            Image2 = new byte[] { 4, 5, 6 },
            Image3 = null,
            Image4 = null,
            Image5 = null
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Place created successfully.", result.Message);

        var place = await context.Places.FirstOrDefaultAsync(p => p.Name == command.Name);
        Assert.NotNull(place);
        Assert.Equal(command.Name, place.Name);
        Assert.Equal(command.AverageVisitDuration, place.AverageVisitDuration);
        Assert.Equal(command.Description, place.Description);
        Assert.Equal(command.FunFact, place.FunFact);
        Assert.Equal(command.District, place.District);
        Assert.Equal(command.City, place.City);
        Assert.Equal(command.Image1, place.Image1);
        Assert.Equal(command.Image2, place.Image2);
        Assert.Null(place.Image3);
        Assert.Null(place.Image4);
        Assert.Null(place.Image5);
    }
}
