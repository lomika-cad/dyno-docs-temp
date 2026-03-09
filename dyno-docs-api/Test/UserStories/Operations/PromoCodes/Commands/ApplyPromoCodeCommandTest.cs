using Application.UserStories.Operations.PromoCodes.Commands;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.PromoCodes.Commands;

public class ApplyPromoCodeCommandTest
{
    [Fact]
    public async Task Handle_ShouldIncrementUsage_WhenValid()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var promoCode = new Domain.Entities.Operations.PromoCode
        {
            Code = "VALID20",
            Description = "Valid 20% discount",
            DiscountPercentage = 20,
            ValidFrom = DateTime.Now.AddDays(-1),
            ValidTo = DateTime.Now.AddDays(29),
            IsActive = true,
            CurrentUsageCount = 5,
            MaxUsageCount = 100,
            CreatedAt = DateTime.Now
        };
        context.PromoCode.Add(promoCode);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new ApplyPromoCodeCommandHandler(context);
        var command = new ApplyPromoCodeCommand
        {
            PromoCodeId = promoCode.Id
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Promo code applied successfully", result.Message);

        var updatedPromoCode = await context.PromoCode.FirstOrDefaultAsync(p => p.Id == promoCode.Id);
        Assert.NotNull(updatedPromoCode);
        Assert.Equal(6, updatedPromoCode.CurrentUsageCount);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new ApplyPromoCodeCommandHandler(context);
        var command = new ApplyPromoCodeCommand
        {
            PromoCodeId = Guid.NewGuid() // Non-existent ID
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Promo code not found", result.Message);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenNotActive()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var promoCode = new Domain.Entities.Operations.PromoCode
        {
            Code = "INACTIVE20",
            Description = "Inactive 20% discount",
            DiscountPercentage = 20,
            ValidFrom = DateTime.Now.AddDays(-1),
            ValidTo = DateTime.Now.AddDays(29),
            IsActive = false, // Not active
            CurrentUsageCount = 0,
            MaxUsageCount = 100,
            CreatedAt = DateTime.Now
        };
        context.PromoCode.Add(promoCode);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new ApplyPromoCodeCommandHandler(context);
        var command = new ApplyPromoCodeCommand
        {
            PromoCodeId = promoCode.Id
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Promo code is not active", result.Message);

        // Verify usage count was not incremented
        var unchangedPromoCode = await context.PromoCode.FirstOrDefaultAsync(p => p.Id == promoCode.Id);
        Assert.NotNull(unchangedPromoCode);
        Assert.Equal(0, unchangedPromoCode.CurrentUsageCount);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenUsageLimitReached()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var promoCode = new Domain.Entities.Operations.PromoCode
        {
            Code = "LIMITED20",
            Description = "Limited 20% discount",
            DiscountPercentage = 20,
            ValidFrom = DateTime.Now.AddDays(-1),
            ValidTo = DateTime.Now.AddDays(29),
            IsActive = true,
            CurrentUsageCount = 10,
            MaxUsageCount = 10, // At limit
            CreatedAt = DateTime.Now
        };
        context.PromoCode.Add(promoCode);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new ApplyPromoCodeCommandHandler(context);
        var command = new ApplyPromoCodeCommand
        {
            PromoCodeId = promoCode.Id
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Promo code usage limit has been reached", result.Message);

        // Verify usage count was not incremented
        var unchangedPromoCode = await context.PromoCode.FirstOrDefaultAsync(p => p.Id == promoCode.Id);
        Assert.NotNull(unchangedPromoCode);
        Assert.Equal(10, unchangedPromoCode.CurrentUsageCount);
    }
}
