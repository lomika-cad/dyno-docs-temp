using Application.UserStories.Operations.UserSubscriptions.Commands;
using Domain.Common;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.UserSubscriptions.Commands;

public class CreateUserSubscriptionCommandTest
{
    [Fact]
    public async Task Handle_ShouldCreateSubscription_WhenFreePlan()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid();

        // Set up Free pricing plan
        var freePlan = new Domain.Entities.Operations.PricingPlan
        {
            Id = 1,
            PlanName = "Free",
            Description = "Basic free plan",
            MonthlyPrice = 0,
            YearlyPrice = 0,
            Features = new[] { "Basic features" }
        };
        context.PricingPlan.Add(freePlan);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new CreateUserSubscriptionCommandHandler(context);
        var command = new CreateUserSubscriptionCommand
        {
            TenantId = tenantId,
            PlanId = 1,
            PlanName = "Free",
            PlanType = PlanType.Monthly
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);

        var subscription = await context.UserSubscription.FirstOrDefaultAsync(us => us.TenantId == tenantId);
        Assert.NotNull(subscription);
        Assert.Equal(1, subscription.PlanId);
        Assert.Equal("Free", subscription.PlanName);
        Assert.Equal(10, subscription.ReportsLimit);
        Assert.Equal(5, subscription.TemplatesLimit);
        Assert.Equal(0, subscription.DiscountPercentage);
        Assert.True(subscription.IsActive);
        Assert.NotNull(subscription.EndDate);
        // Free plan is always monthly (1 month)
        Assert.True(subscription.EndDate.Value.Month == DateTime.Now.AddMonths(1).Month);
    }

    [Fact]
    public async Task Handle_ShouldCreateSubscription_WhenProfessionalPlan()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid();

        // Set up Professional pricing plan
        var proPlan = new Domain.Entities.Operations.PricingPlan
        {
            Id = 2,
            PlanName = "Professional",
            Description = "Professional plan",
            MonthlyPrice = 29.99m,
            YearlyPrice = 299.99m,
            Features = new[] { "All features" }
        };
        context.PricingPlan.Add(proPlan);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new CreateUserSubscriptionCommandHandler(context);
        var command = new CreateUserSubscriptionCommand
        {
            TenantId = tenantId,
            PlanId = 2,
            PlanName = "Professional",
            PlanType = PlanType.Yearly
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);

        var subscription = await context.UserSubscription.FirstOrDefaultAsync(us => us.TenantId == tenantId);
        Assert.NotNull(subscription);
        Assert.Equal(2, subscription.PlanId);
        Assert.Equal("Professional", subscription.PlanName);
        Assert.Equal(50, subscription.ReportsLimit);
        Assert.Equal(15, subscription.TemplatesLimit);
        Assert.Equal(5, subscription.DiscountPercentage);
        Assert.True(subscription.IsActive);
        Assert.NotNull(subscription.EndDate);
        // Professional plan respects PlanType (yearly = 12 months)
        Assert.True(subscription.EndDate.Value.Year == DateTime.Now.AddYears(1).Year);
    }

    [Fact]
    public async Task Handle_ShouldCreateSubscription_WhenEnterprisePlan()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid();

        // Set up Enterprise pricing plan
        var enterprisePlan = new Domain.Entities.Operations.PricingPlan
        {
            Id = 3,
            PlanName = "Enterprise",
            Description = "Enterprise plan",
            MonthlyPrice = 99.99m,
            YearlyPrice = 999.99m,
            Features = new[] { "Everything" }
        };
        context.PricingPlan.Add(enterprisePlan);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new CreateUserSubscriptionCommandHandler(context);
        var command = new CreateUserSubscriptionCommand
        {
            TenantId = tenantId,
            PlanId = 3,
            PlanName = "Enterprise",
            PlanType = PlanType.Monthly
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);

        var subscription = await context.UserSubscription.FirstOrDefaultAsync(us => us.TenantId == tenantId);
        Assert.NotNull(subscription);
        Assert.Equal(3, subscription.PlanId);
        Assert.Equal("Enterprise", subscription.PlanName);
        Assert.Equal(-1, subscription.ReportsLimit); // Unlimited
        Assert.Equal(-1, subscription.TemplatesLimit); // Unlimited
        Assert.Equal(100, subscription.DiscountPercentage);
        Assert.True(subscription.IsActive);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenPaymentPlanNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid();

        var handler = new CreateUserSubscriptionCommandHandler(context);
        var command = new CreateUserSubscriptionCommand
        {
            TenantId = tenantId,
            PlanId = 999, // Non-existent plan ID
            PlanName = "NonExistent",
            PlanType = PlanType.Monthly
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Payment plan not found", result.Message);

        // Verify no subscription was created
        var subscriptionCount = await context.UserSubscription.CountAsync();
        Assert.Equal(0, subscriptionCount);
    }
}
