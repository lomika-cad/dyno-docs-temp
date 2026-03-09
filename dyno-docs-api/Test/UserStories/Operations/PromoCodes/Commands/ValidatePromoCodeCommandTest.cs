using Application.UserStories.Operations.PromoCodes.Commands;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.PromoCodes.Commands;

public class ValidatePromoCodeCommandTest
{
    [Fact]
    public async Task Handle_ShouldReturnValid_WhenPromoCodeIsValid()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var promoCode = new Domain.Entities.Operations.PromoCode
        {
            Code = "VALID20",
            Description = "Valid 20% discount",
            DiscountPercentage = 20,
            ValidFrom = DateTime.UtcNow.AddDays(-1),
            ValidTo = DateTime.UtcNow.AddDays(29),
            IsActive = true,
            CurrentUsageCount = 5,
            MaxUsageCount = 100,
            CreatedAt = DateTime.Now
        };
        context.PromoCode.Add(promoCode);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new ValidatePromoCodeCommandHandler(context);
        var command = new ValidatePromoCodeCommand
        {
            Code = "valid20", // Case insensitive
            PurchaseAmount = 100
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.IsValid);
        Assert.Equal("Promo code is valid", result.Message);
        Assert.Equal(20, result.DiscountPercentage);
        Assert.Equal(20, result.CalculatedDiscount); // 20% of 100
        Assert.Equal(promoCode.Id, result.PromoCodeId);
    }

    [Fact]
    public async Task Handle_ShouldReturnInvalid_WhenNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new ValidatePromoCodeCommandHandler(context);
        var command = new ValidatePromoCodeCommand
        {
            Code = "NONEXISTENT",
            PurchaseAmount = 100
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Promo code not found", result.Message);
        Assert.Null(result.DiscountPercentage);
        Assert.Null(result.CalculatedDiscount);
        Assert.Null(result.PromoCodeId);
    }

    [Fact]
    public async Task Handle_ShouldReturnInvalid_WhenNotActive()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var promoCode = new Domain.Entities.Operations.PromoCode
        {
            Code = "INACTIVE20",
            Description = "Inactive 20% discount",
            DiscountPercentage = 20,
            ValidFrom = DateTime.UtcNow.AddDays(-1),
            ValidTo = DateTime.UtcNow.AddDays(29),
            IsActive = false, // Not active
            CurrentUsageCount = 0,
            MaxUsageCount = 100,
            CreatedAt = DateTime.Now
        };
        context.PromoCode.Add(promoCode);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new ValidatePromoCodeCommandHandler(context);
        var command = new ValidatePromoCodeCommand
        {
            Code = "INACTIVE20",
            PurchaseAmount = 100
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Promo code is not active", result.Message);
    }

    [Fact]
    public async Task Handle_ShouldReturnInvalid_WhenNotYetValid()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var promoCode = new Domain.Entities.Operations.PromoCode
        {
            Code = "FUTURE20",
            Description = "Future 20% discount",
            DiscountPercentage = 20,
            ValidFrom = DateTime.UtcNow.AddDays(1), // Starts tomorrow
            ValidTo = DateTime.UtcNow.AddDays(30),
            IsActive = true,
            CurrentUsageCount = 0,
            MaxUsageCount = 100,
            CreatedAt = DateTime.Now
        };
        context.PromoCode.Add(promoCode);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new ValidatePromoCodeCommandHandler(context);
        var command = new ValidatePromoCodeCommand
        {
            Code = "FUTURE20",
            PurchaseAmount = 100
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Promo code is not yet valid", result.Message);
    }

    [Fact]
    public async Task Handle_ShouldReturnInvalid_WhenExpired()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var promoCode = new Domain.Entities.Operations.PromoCode
        {
            Code = "EXPIRED20",
            Description = "Expired 20% discount",
            DiscountPercentage = 20,
            ValidFrom = DateTime.UtcNow.AddDays(-30),
            ValidTo = DateTime.UtcNow.AddDays(-1), // Expired yesterday
            IsActive = true,
            CurrentUsageCount = 0,
            MaxUsageCount = 100,
            CreatedAt = DateTime.Now
        };
        context.PromoCode.Add(promoCode);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new ValidatePromoCodeCommandHandler(context);
        var command = new ValidatePromoCodeCommand
        {
            Code = "EXPIRED20",
            PurchaseAmount = 100
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Promo code has expired", result.Message);
    }

    [Fact]
    public async Task Handle_ShouldReturnInvalid_WhenUsageLimitReached()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var promoCode = new Domain.Entities.Operations.PromoCode
        {
            Code = "LIMITED20",
            Description = "Limited 20% discount",
            DiscountPercentage = 20,
            ValidFrom = DateTime.UtcNow.AddDays(-1),
            ValidTo = DateTime.UtcNow.AddDays(29),
            IsActive = true,
            CurrentUsageCount = 10,
            MaxUsageCount = 10, // At limit
            CreatedAt = DateTime.Now
        };
        context.PromoCode.Add(promoCode);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new ValidatePromoCodeCommandHandler(context);
        var command = new ValidatePromoCodeCommand
        {
            Code = "LIMITED20",
            PurchaseAmount = 100
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.IsValid);
        Assert.Equal("Promo code usage limit has been reached", result.Message);
    }
}
