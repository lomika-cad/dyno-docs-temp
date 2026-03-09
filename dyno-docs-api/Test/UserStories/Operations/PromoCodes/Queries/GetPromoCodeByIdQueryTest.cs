using Application.UserStories.Operations.PromoCodes.Queries;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.PromoCodes.Queries;

public class GetPromoCodeByIdQueryTest
{
    [Fact]
    public async Task Handle_ShouldReturnPromoCode_WhenExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var promoCode = new Domain.Entities.Operations.PromoCode
        {
            Code = "TEST20",
            Description = "Test 20% discount",
            DiscountPercentage = 20,
            ValidFrom = DateTime.Now,
            ValidTo = DateTime.Now.AddDays(30),
            IsActive = true,
            CurrentUsageCount = 5,
            MaxUsageCount = 100,
            CreatedAt = DateTime.Now
        };
        context.PromoCode.Add(promoCode);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetPromoCodeByIdQueryHandler(context);
        var query = new GetPromoCodeByIdQuery
        {
            Id = promoCode.Id
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(promoCode.Id, result.Id);
        Assert.Equal("TEST20", result.Code);
        Assert.Equal("Test 20% discount", result.Description);
        Assert.Equal(20, result.DiscountPercentage);
        Assert.Equal(5, result.CurrentUsageCount);
        Assert.Equal(100, result.MaxUsageCount);
        Assert.True(result.IsActive);
    }

    [Fact]
    public async Task Handle_ShouldReturnNull_WhenNotExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new GetPromoCodeByIdQueryHandler(context);
        var query = new GetPromoCodeByIdQuery
        {
            Id = Guid.NewGuid() // Non-existent ID
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.Null(result);
    }
}
