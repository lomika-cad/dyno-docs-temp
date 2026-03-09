using Application.UserStories.Operations.Partnerships.Commands;
using Domain.Common;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.Partnerships.Commands;

public class DeletePartnershipTest
{
    [Fact]
    public async Task Handle_ShouldDeletePartnership_WhenExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var existingPartnership = new Domain.Entities.Operations.Partnership
        {
            Name = "Test Partnership",
            Description = "A test partnership",
            District = "Test District",
            PartnershipType = PartnershipTypes.Hotels,
            CreatedAt = DateTime.Now
        };
        context.Partnership.Add(existingPartnership);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new DeletePartnershipHandler(context);
        var command = new DeletePartnership
        {
            Id = existingPartnership.Id
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Partnership deleted successfully", result.Message);

        var deletedPartnership = await context.Partnership.FirstOrDefaultAsync(p => p.Id == existingPartnership.Id);
        Assert.Null(deletedPartnership);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenPartnershipNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new DeletePartnershipHandler(context);
        var command = new DeletePartnership
        {
            Id = Guid.NewGuid() // Non-existent ID
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Partnership not found", result.Message);
    }
}
