using Application.UserStories.Operations.PromoCodes.Queries;
using Test.Common;
using Xunit;

namespace Test.UserStories.Operations.PromoCodes.Queries;

public class GetPromoCodesQueryTest
{
    [Fact]
    public async Task Handle_ShouldReturnAllPromoCodes_OrderedByCreatedAtDesc()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var baseTime = DateTime.Now;

        var promoCodes = new List<Domain.Entities.Operations.PromoCode>
        {
            new()
            {
                Code = "FIRST20",
                Description = "First 20% discount",
                DiscountPercentage = 20,
                ValidFrom = baseTime,
                ValidTo = baseTime.AddDays(30),
                IsActive = true,
                CreatedAt = baseTime.AddHours(1) // Most recent
            },
            new()
            {
                Code = "SECOND15",
                Description = "Second 15% discount",
                DiscountPercentage = 15,
                ValidFrom = baseTime,
                ValidTo = baseTime.AddDays(30),
                IsActive = true,
                CreatedAt = baseTime // Oldest
            },
            new()
            {
                Code = "THIRD25",
                Description = "Third 25% discount",
                DiscountPercentage = 25,
                ValidFrom = baseTime,
                ValidTo = baseTime.AddDays(30),
                IsActive = true,
                CreatedAt = baseTime.AddMinutes(30) // Middle
            }
        };

        foreach (var promoCode in promoCodes)
        {
            context.PromoCode.Add(promoCode);
        }
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetPromoCodesQueryHandler(context);
        var query = new GetPromoCodesQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);

        // Should be ordered by CreatedAt descending (most recent first)
        Assert.Equal("FIRST20", result[0].Code);
        Assert.Equal("THIRD25", result[1].Code);
        Assert.Equal("SECOND15", result[2].Code);

        // Verify all promo codes are included
        Assert.Contains(result, p => p.Code == "FIRST20");
        Assert.Contains(result, p => p.Code == "SECOND15");
        Assert.Contains(result, p => p.Code == "THIRD25");
    }
}
