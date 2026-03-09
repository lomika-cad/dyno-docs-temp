using Application.UserStories.Operations.PromoCodes.Queries;
using Test.Common;
using Xunit;

namespace Test.UserStories.Operations.PromoCodes.Queries;

public class GetActivePromoCodesQueryTest
{
    [Fact]
    public async Task Handle_ShouldReturnOnlyActiveValidPromoCodes()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var now = DateTime.UtcNow;

        var promoCodes = new List<Domain.Entities.Operations.PromoCode>
        {
            new()
            {
                Code = "ACTIVE20",
                Description = "Active 20% discount",
                DiscountPercentage = 20,
                ValidFrom = now.AddDays(-1),
                ValidTo = now.AddDays(29),
                IsActive = true,
                CurrentUsageCount = 5,
                MaxUsageCount = 100,
                CreatedAt = now
            },
            new()
            {
                Code = "INACTIVE20",
                Description = "Inactive 20% discount",
                DiscountPercentage = 20,
                ValidFrom = now.AddDays(-1),
                ValidTo = now.AddDays(29),
                IsActive = false, // Not active
                CurrentUsageCount = 0,
                MaxUsageCount = 100,
                CreatedAt = now
            },
            new()
            {
                Code = "EXPIRED20",
                Description = "Expired 20% discount",
                DiscountPercentage = 20,
                ValidFrom = now.AddDays(-30),
                ValidTo = now.AddDays(-1), // Expired
                IsActive = true,
                CurrentUsageCount = 0,
                MaxUsageCount = 100,
                CreatedAt = now
            },
            new()
            {
                Code = "LIMITED20",
                Description = "Limited 20% discount",
                DiscountPercentage = 20,
                ValidFrom = now.AddDays(-1),
                ValidTo = now.AddDays(29),
                IsActive = true,
                CurrentUsageCount = 10,
                MaxUsageCount = 10, // At limit
                CreatedAt = now
            }
        };

        foreach (var promoCode in promoCodes)
        {
            context.PromoCode.Add(promoCode);
        }
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetActivePromoCodesQueryHandler(context);
        var query = new GetActivePromoCodesQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result); // Only ACTIVE20 should be returned
        Assert.Equal("ACTIVE20", result[0].Code);
        Assert.Equal("Active 20% discount", result[0].Description);
        Assert.True(result[0].IsActive);
    }

    [Fact]
    public async Task Handle_ShouldExcludeExpiredPromoCodes()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var now = DateTime.UtcNow;

        var promoCodes = new List<Domain.Entities.Operations.PromoCode>
        {
            new()
            {
                Code = "VALID20",
                Description = "Valid 20% discount",
                DiscountPercentage = 20,
                ValidFrom = now.AddDays(-1),
                ValidTo = now.AddDays(29),
                IsActive = true,
                CurrentUsageCount = 0,
                MaxUsageCount = 100,
                CreatedAt = now
            },
            new()
            {
                Code = "EXPIRED20",
                Description = "Expired 20% discount",
                DiscountPercentage = 20,
                ValidFrom = now.AddDays(-30),
                ValidTo = now.AddDays(-1), // Expired
                IsActive = true,
                CurrentUsageCount = 0,
                MaxUsageCount = 100,
                CreatedAt = now
            },
            new()
            {
                Code = "FUTURE20",
                Description = "Future 20% discount",
                DiscountPercentage = 20,
                ValidFrom = now.AddDays(1), // Not yet valid
                ValidTo = now.AddDays(30),
                IsActive = true,
                CurrentUsageCount = 0,
                MaxUsageCount = 100,
                CreatedAt = now
            }
        };

        foreach (var promoCode in promoCodes)
        {
            context.PromoCode.Add(promoCode);
        }
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetActivePromoCodesQueryHandler(context);
        var query = new GetActivePromoCodesQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Single(result); // Only VALID20 should be returned
        Assert.Equal("VALID20", result[0].Code);

        // Should not include expired or future promo codes
        Assert.DoesNotContain(result, p => p.Code == "EXPIRED20");
        Assert.DoesNotContain(result, p => p.Code == "FUTURE20");
    }
}
