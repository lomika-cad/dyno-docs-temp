
using Application.UserStories.Operations.PricingPlans.Queries;
using Test.Common;
using Xunit;

namespace Test.UserStories.Operations.PricingPlans.Queries;

public class GetPricingPlansTest
{
    [Fact]
    public async Task Handle_ShouldReturnAllPricingPlans()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var pricingPlans = new List<Domain.Entities.Operations.PricingPlan>
        {
            new()
            {
                Id = 1,
                PlanName = "Free",
                Description = "Basic free plan",
                MonthlyPrice = 0,
                YearlyPrice = 0,
                Features = new[] { "Basic features", "Limited usage" }
            },
            new()
            {
                Id = 2,
                PlanName = "Professional",
                Description = "Professional plan with more features",
                MonthlyPrice = 29.99m,
                YearlyPrice = 299.99m,
                Features = new[] { "All features", "Priority support", "Advanced analytics" }
            },
            new()
            {
                Id = 3,
                PlanName = "Enterprise",
                Description = "Enterprise plan for large organizations",
                MonthlyPrice = 99.99m,
                YearlyPrice = 999.99m,
                Features = new[] { "Everything", "Dedicated support", "Custom integrations" }
            }
        };

        foreach (var plan in pricingPlans)
        {
            context.PricingPlan.Add(plan);
        }
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetPricingPlansHandler(context);
        var query = new GetPricingPlans();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(3, result.Count);
        Assert.Contains(result, p => p.PlanName == "Free");
        Assert.Contains(result, p => p.PlanName == "Professional");
        Assert.Contains(result, p => p.PlanName == "Enterprise");

        var freePlan = result.FirstOrDefault(p => p.PlanName == "Free");
        Assert.NotNull(freePlan);
        Assert.Equal(0, freePlan.MonthlyPrice);
        Assert.Equal(0, freePlan.YearlyPrice);
        Assert.Equal(new[] { "Basic features", "Limited usage" }, freePlan.Features);
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNone()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new GetPricingPlansHandler(context);
        var query = new GetPricingPlans();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}
