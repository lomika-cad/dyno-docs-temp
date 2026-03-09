using Application.UserStories.Operations.Places.Commands;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.Places.Commands;

public class DeletePlaceCommandTest
{
    [Fact]
    public async Task Handle_ShouldDeletePlace_WhenExists()
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
            CreatedAt = DateTime.Now
        };
        context.Places.Add(existingPlace);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new DeletePlaceCommandHandler(context);
        var command = new DeletePlaceCommand
        {
            Id = existingPlace.Id
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Place deleted successfully.", result.Message);

        var deletedPlace = await context.Places.FirstOrDefaultAsync(p => p.Id == existingPlace.Id);
        Assert.Null(deletedPlace);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenPlaceNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new DeletePlaceCommandHandler(context);
        var command = new DeletePlaceCommand
        {
            Id = Guid.NewGuid() // Non-existent ID
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Place not found.", result.Message);
    }
}
