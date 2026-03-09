using Application.UserStories.Operations.UserSubscriptions.Commands;
using Microsoft.EntityFrameworkCore;
using Test.Common;
using Xunit;

namespace Test.UserStories.Operations.UserSubscriptions.Commands;

public class UpdateTemplateLimitCommandTest
{
    [Fact]
    public async Task Handle_ShouldDecrementLimit_WhenAssign()
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
            TemplatesLimit = 10, // Has templates available
            IsActive = true,
            CreatedAt = DateTime.Now
        };
        context.UserSubscription.Add(subscription);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new UpdateTemplateLimitCommandHandler(context);
        var command = new UpdateTemplateLimitCommand
        {
            TenantId = tenantId,
            ActionType = "Assign"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Template limit updated successfully", result.Message);

        var updatedSubscription = await context.UserSubscription.FirstOrDefaultAsync(us => us.TenantId == tenantId);
        Assert.NotNull(updatedSubscription);
        Assert.Equal(9, updatedSubscription.TemplatesLimit); // Decremented by 1
    }

    [Fact]
    public async Task Handle_ShouldIncrementLimit_WhenUnassign()
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
            TemplatesLimit = 10,
            IsActive = true,
            CreatedAt = DateTime.Now
        };
        context.UserSubscription.Add(subscription);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new UpdateTemplateLimitCommandHandler(context);
        var command = new UpdateTemplateLimitCommand
        {
            TenantId = tenantId,
            ActionType = "Unassign"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Template limit updated successfully", result.Message);

        var updatedSubscription = await context.UserSubscription.FirstOrDefaultAsync(us => us.TenantId == tenantId);
        Assert.NotNull(updatedSubscription);
        Assert.Equal(11, updatedSubscription.TemplatesLimit); // Incremented by 1
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenSubscriptionNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid(); // No subscription for this tenant

        var handler = new UpdateTemplateLimitCommandHandler(context);
        var command = new UpdateTemplateLimitCommand
        {
            TenantId = tenantId,
            ActionType = "Assign"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("UserSubscription not found", result.Message);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenNoTemplatesAvailable()
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
            TemplatesLimit = 0, // No templates available
            IsActive = true,
            CreatedAt = DateTime.Now
        };
        context.UserSubscription.Add(subscription);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new UpdateTemplateLimitCommandHandler(context);
        var command = new UpdateTemplateLimitCommand
        {
            TenantId = tenantId,
            ActionType = "Assign"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("No templates available to assign", result.Message);

        // Verify limit was not decremented
        var unchangedSubscription = await context.UserSubscription.FirstOrDefaultAsync(us => us.TenantId == tenantId);
        Assert.NotNull(unchangedSubscription);
        Assert.Equal(0, unchangedSubscription.TemplatesLimit);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenInvalidActionType()
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
            TemplatesLimit = 10,
            IsActive = true,
            CreatedAt = DateTime.Now
        };
        context.UserSubscription.Add(subscription);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new UpdateTemplateLimitCommandHandler(context);
        var command = new UpdateTemplateLimitCommand
        {
            TenantId = tenantId,
            ActionType = "InvalidAction" // Invalid action type
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Invalid ActionType", result.Message);

        // Verify limit was not changed
        var unchangedSubscription = await context.UserSubscription.FirstOrDefaultAsync(us => us.TenantId == tenantId);
        Assert.NotNull(unchangedSubscription);
        Assert.Equal(10, unchangedSubscription.TemplatesLimit);
    }
}
