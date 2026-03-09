using Application.UserStories.Operations.UserSubscriptions.Commands;
using Domain.Common;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.UserSubscriptions.Commands;

public class UpdateUserSubscriptionCommandTest
{
    [Fact]
    public async Task Handle_ShouldUpdateSubscription_WhenExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid();

        // Set up existing subscription (Free plan)
        var existingSubscription = new Domain.Entities.Operations.UserSubscription
        {
            TenantId = tenantId,
            PlanId = 1,
            PlanName = "Free",
            ReportsLimit = 10,
            TemplatesLimit = 5,
            DiscountPercentage = 0,
            IsActive = true,
            StartDate = DateTime.Now.AddMonths(-1),
            EndDate = DateTime.Now.AddMonths(11),
            CreatedAt = DateTime.Now.AddMonths(-1)
        };
        context.UserSubscription.Add(existingSubscription);

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

        var handler = new UpdateUserSubscriptionCommandHandler(context);
        var command = new UpdateUserSubscriptionCommand
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
        Assert.Equal("User subscription updated successfully", result.Message);

        var updatedSubscription = await context.UserSubscription.FirstOrDefaultAsync(us => us.TenantId == tenantId);
        Assert.NotNull(updatedSubscription);
        Assert.Equal(2, updatedSubscription.PlanId);
        Assert.Equal("Professional", updatedSubscription.PlanName);
        Assert.Equal(50 * 12, updatedSubscription.ReportsLimit); // Yearly Professional = 50*12
        Assert.Equal(50 * 12, updatedSubscription.TemplatesLimit); // Yearly Professional = 50*12
        Assert.Equal(5, updatedSubscription.DiscountPercentage);
        Assert.True(updatedSubscription.IsActive);
        Assert.NotNull(updatedSubscription.LastModifiedAt);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenPaymentPlanNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid();

        // Set up existing subscription
        var existingSubscription = new Domain.Entities.Operations.UserSubscription
        {
            TenantId = tenantId,
            PlanId = 1,
            PlanName = "Free",
            ReportsLimit = 10,
            TemplatesLimit = 5,
            IsActive = true,
            CreatedAt = DateTime.Now
        };
        context.UserSubscription.Add(existingSubscription);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new UpdateUserSubscriptionCommandHandler(context);
        var command = new UpdateUserSubscriptionCommand
        {
            TenantId = tenantId,
            PlanId = 999, // Non-existent plan
            PlanName = "NonExistent",
            PlanType = PlanType.Monthly
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Payment plan not found", result.Message);

        // Verify subscription was not updated
        var unchangedSubscription = await context.UserSubscription.FirstOrDefaultAsync(us => us.TenantId == tenantId);
        Assert.NotNull(unchangedSubscription);
        Assert.Equal(1, unchangedSubscription.PlanId);
        Assert.Equal("Free", unchangedSubscription.PlanName);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenSubscriptionNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid();

        // Set up pricing plan but no subscription
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

        var handler = new UpdateUserSubscriptionCommandHandler(context);
        var command = new UpdateUserSubscriptionCommand
        {
            TenantId = tenantId, // No subscription for this tenant
            PlanId = 2,
            PlanName = "Professional",
            PlanType = PlanType.Monthly
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal($"User subscription with tenant id {tenantId} was not found", result.Message);
    }
}
