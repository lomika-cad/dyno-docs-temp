using Application.UserStories.Operations.PromoCodes.Commands;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.PromoCodes.Commands;

public class DeletePromoCodeCommandTest
{
    [Fact]
    public async Task Handle_ShouldDeletePromoCode_WhenExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var existingPromoCode = new Domain.Entities.Operations.PromoCode
        {
            Code = "DELETE20",
            Description = "20% off discount to be deleted",
            DiscountPercentage = 20,
            ValidFrom = DateTime.Now.AddDays(-1),
            ValidTo = DateTime.Now.AddDays(29),
            IsActive = true,
            CurrentUsageCount = 0,
            CreatedAt = DateTime.Now
        };
        context.PromoCode.Add(existingPromoCode);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new DeletePromoCodeCommandHandler(context);
        var command = new DeletePromoCodeCommand
        {
            Id = existingPromoCode.Id
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Promo code deleted successfully", result.Message);

        var deletedPromoCode = await context.PromoCode.FirstOrDefaultAsync(p => p.Id == existingPromoCode.Id);
        Assert.Null(deletedPromoCode);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new DeletePromoCodeCommandHandler(context);
        var command = new DeletePromoCodeCommand
        {
            Id = Guid.NewGuid() // Non-existent ID
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Promo code not found", result.Message);
    }
}
