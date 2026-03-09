using Application.UserStories.Operations.Places.Commands;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.Places.Commands;

public class UpdatePlaceCommandTest
{
    [Fact]
    public async Task Handle_ShouldUpdatePlace_WhenExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var existingPlace = new Domain.Entities.Operations.Place
        {
            Name = "Original Place",
            AverageVisitDuration = "1 hour",
            Description = "Original description",
            FunFact = "Original fun fact",
            District = "Original District",
            City = "Original City",
            CreatedAt = DateTime.Now
        };
        context.Places.Add(existingPlace);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new UpdatePlaceCommandHandler(context);
        var command = new UpdatePlaceCommand
        {
            Id = existingPlace.Id,
            Name = "Updated Place",
            AverageVisitDuration = "3 hours",
            Description = "Updated description",
            FunFact = "Updated fun fact",
            District = "Updated District",
            City = "Updated City"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Place updated successfully.", result.Message);

        var updatedPlace = await context.Places.FirstOrDefaultAsync(p => p.Id == existingPlace.Id);
        Assert.NotNull(updatedPlace);
        Assert.Equal(command.Name, updatedPlace.Name);
        Assert.Equal(command.AverageVisitDuration, updatedPlace.AverageVisitDuration);
        Assert.Equal(command.Description, updatedPlace.Description);
        Assert.Equal(command.FunFact, updatedPlace.FunFact);
        Assert.Equal(command.District, updatedPlace.District);
        Assert.Equal(command.City, updatedPlace.City);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenPlaceNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new UpdatePlaceCommandHandler(context);
        var command = new UpdatePlaceCommand
        {
            Id = Guid.NewGuid(), // Non-existent ID
            Name = "Updated Place",
            AverageVisitDuration = "3 hours",
            Description = "Updated description",
            FunFact = "Updated fun fact",
            District = "Updated District",
            City = "Updated City"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Place not found.", result.Message);
    }
}
