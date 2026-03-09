using Application.UserStories.Operations.Partnerships.Commands;
using Domain.Common;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.Partnerships.Commands;

public class UpdatePartnershipTest
{
    [Fact]
    public async Task Handle_ShouldUpdatePartnership_WhenExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var existingPartnership = new Domain.Entities.Operations.Partnership
        {
            Name = "Original Partnership",
            Description = "Original description",
            District = "Original District",
            PartnershipType = PartnershipTypes.Hotels,
            CreatedAt = DateTime.Now
        };
        context.Partnership.Add(existingPartnership);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new UpdatePartnershipHandler(context);
        var command = new UpdatePartnership
        {
            Id = existingPartnership.Id,
            Name = "Updated Partnership",
            Description = "Updated description",
            District = "Updated District",
            PartnershipType = PartnershipTypes.Transport
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Partnership updated successfully", result.Message);

        var updatedPartnership = await context.Partnership.FirstOrDefaultAsync(p => p.Id == existingPartnership.Id);
        Assert.NotNull(updatedPartnership);
        Assert.Equal(command.Name, updatedPartnership.Name);
        Assert.Equal(command.Description, updatedPartnership.Description);
        Assert.Equal(command.District, updatedPartnership.District);
        Assert.Equal(command.PartnershipType, updatedPartnership.PartnershipType);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenPartnershipNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new UpdatePartnershipHandler(context);
        var command = new UpdatePartnership
        {
            Id = Guid.NewGuid(), // Non-existent ID
            Name = "Updated Partnership",
            Description = "Updated description",
            District = "Updated District",
            PartnershipType = PartnershipTypes.Transport
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Partnership not found", result.Message);
    }
}
