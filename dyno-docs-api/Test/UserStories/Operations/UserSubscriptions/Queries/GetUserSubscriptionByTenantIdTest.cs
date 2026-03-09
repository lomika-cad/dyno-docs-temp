using Application.UserStories.Operations.UserSubscriptions.Queries;
using Microsoft.EntityFrameworkCore;
using Test.Common;
using Xunit;

namespace Test.UserStories.Operations.UserSubscriptions.Queries;

public class GetUserSubscriptionByTenantIdTest
{
    [Fact]
    public async Task Handle_ShouldReturnSubscription_WhenExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid();

        var subscription = new Domain.Entities.Operations.UserSubscription
        {
            TenantId = tenantId,
            PlanId = 2,
            PlanName = "Professional",
            ReportsLimit = 50,
            TemplatesLimit = 15,
            DiscountPercentage = 5,
            IsActive = true,
            StartDate = DateTime.Now,
            EndDate = DateTime.Now.AddMonths(1),
            CreatedAt = DateTime.Now
        };
        context.UserSubscription.Add(subscription);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetUserSubscriptionByTenantIdHandler(context);
        var query = new GetUserSubscriptionByTenantId
        {
            TenantId = tenantId
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(tenantId, result.TenantId);
        Assert.Equal(2, result.PlanId);
        Assert.Equal("Professional", result.PlanName);
        Assert.Equal(50, result.ReportsLimit);
        Assert.Equal(15, result.TemplatesLimit);
        Assert.Equal(5, result.DiscountPercentage);
        Assert.True(result.IsActive);
    }

    [Fact]
    public async Task Handle_ShouldThrowException_WhenNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid(); // No subscription for this tenant

        var handler = new GetUserSubscriptionByTenantIdHandler(context);
        var query = new GetUserSubscriptionByTenantId
        {
            TenantId = tenantId
        };

        // Act & Assert
        var exception = await Assert.ThrowsAsync<ApplicationException>(() => handler.Handle(query, CancellationToken.None));
        Assert.Equal($"User subscription with id {tenantId} was not found", exception.Message);
    }

    [Fact]
    public async Task Handle_ShouldDeactivateExpiredSubscriptions()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId1 = Guid.NewGuid();
        var tenantId2 = Guid.NewGuid();

        // Active subscription
        var activeSubscription = new Domain.Entities.Operations.UserSubscription
        {
            TenantId = tenantId1,
            PlanId = 2,
            PlanName = "Professional",
            IsActive = true,
            StartDate = DateTime.Now.AddMonths(-1),
            EndDate = DateTime.Now.AddMonths(11), // Not expired
            CreatedAt = DateTime.Now.AddMonths(-1)
        };

        // Expired subscription
        var expiredSubscription = new Domain.Entities.Operations.UserSubscription
        {
            TenantId = tenantId2,
            PlanId = 1,
            PlanName = "Free",
            IsActive = true,
            StartDate = DateTime.Now.AddMonths(-2),
            EndDate = DateTime.Now.AddDays(-1), // Expired
            CreatedAt = DateTime.Now.AddMonths(-2)
        };

        context.UserSubscription.Add(activeSubscription);
        context.UserSubscription.Add(expiredSubscription);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetUserSubscriptionByTenantIdHandler(context);
        var query = new GetUserSubscriptionByTenantId
        {
            TenantId = tenantId1 // Request active subscription
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(tenantId1, result.TenantId);
        Assert.True(result.IsActive); // Active subscription remains active

        // Verify expired subscription was deactivated
        var deactivatedSubscription = await context.UserSubscription.FirstOrDefaultAsync(us => us.TenantId == tenantId2);
        Assert.NotNull(deactivatedSubscription);
        Assert.False(deactivatedSubscription.IsActive); // Should be deactivated
    }
}
