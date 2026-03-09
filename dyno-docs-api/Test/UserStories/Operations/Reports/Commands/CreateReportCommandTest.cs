using Application.Common.Interfaces;
using Application.UserStories.Operations.Reports.Commands;
using Test.Common;
using Xunit;
using Moq;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.Reports.Commands;

public class CreateReportCommandTest
{
    [Fact]
    public async Task Handle_ShouldCreateReport_WhenSubscriptionHasLimit()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var mockTenantService = new Mock<ITenantService>();
        var tenantId = Guid.NewGuid();

        var userSubscription = new Domain.Entities.Operations.UserSubscription
        {
            TenantId = tenantId,
            PlanId = 1,
            PlanName = "Professional",
            ReportsLimit = 10,
            TemplatesLimit = 15,
            IsActive = true,
            CreatedAt = DateTime.Now
        };
        context.UserSubscription.Add(userSubscription);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new CreateReportCommandHandler(context, mockTenantService.Object);
        var command = new CreateReportCommand
        {
            TenantId = tenantId,
            CustomerName = "John Doe",
            CustomerEmail = "john.doe@example.com",
            GeneratedReport = "Sample report content"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Report created successfully.", result.Message);

        var report = await context.Report.FirstOrDefaultAsync(r => r.CustomerEmail == command.CustomerEmail);
        Assert.NotNull(report);
        Assert.Equal(command.CustomerName, report.CustomerName);
        Assert.Equal(command.CustomerEmail, report.CustomerEmail);
        Assert.Equal(command.GeneratedReport, report.GeneratedReport);

        // Verify reports limit was decremented
        var updatedSubscription = await context.UserSubscription.FirstOrDefaultAsync(us => us.TenantId == tenantId);
        Assert.NotNull(updatedSubscription);
        Assert.Equal(9, updatedSubscription.ReportsLimit);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenNoSubscriptionFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var mockTenantService = new Mock<ITenantService>();
        var tenantId = Guid.NewGuid(); // No subscription for this tenant

        var handler = new CreateReportCommandHandler(context, mockTenantService.Object);
        var command = new CreateReportCommand
        {
            TenantId = tenantId,
            CustomerName = "John Doe",
            CustomerEmail = "john.doe@example.com",
            GeneratedReport = "Sample report content"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("No user subscriptions found for the tenant.", result.Message);

        // Verify no report was created
        var reportCount = await context.Report.CountAsync();
        Assert.Equal(0, reportCount);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenReportLimitIsZero()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var mockTenantService = new Mock<ITenantService>();
        var tenantId = Guid.NewGuid();

        var userSubscription = new Domain.Entities.Operations.UserSubscription
        {
            TenantId = tenantId,
            PlanId = 1,
            PlanName = "Free",
            ReportsLimit = 0, // No reports left
            TemplatesLimit = 5,
            IsActive = true,
            CreatedAt = DateTime.Now
        };
        context.UserSubscription.Add(userSubscription);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new CreateReportCommandHandler(context, mockTenantService.Object);
        var command = new CreateReportCommand
        {
            TenantId = tenantId,
            CustomerName = "John Doe",
            CustomerEmail = "john.doe@example.com",
            GeneratedReport = "Sample report content"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Report limit reached for the tenant.", result.Message);

        // Verify no report was created
        var reportCount = await context.Report.CountAsync();
        Assert.Equal(0, reportCount);

        // Verify limit was not decremented
        var unchangedSubscription = await context.UserSubscription.FirstOrDefaultAsync(us => us.TenantId == tenantId);
        Assert.NotNull(unchangedSubscription);
        Assert.Equal(0, unchangedSubscription.ReportsLimit);
    }

    [Fact]
    public async Task Handle_ShouldNotDecrementLimit_WhenLimitIsMinusOne()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var mockTenantService = new Mock<ITenantService>();
        var tenantId = Guid.NewGuid();

        var userSubscription = new Domain.Entities.Operations.UserSubscription
        {
            TenantId = tenantId,
            PlanId = 3,
            PlanName = "Enterprise",
            ReportsLimit = -1, // Unlimited
            TemplatesLimit = -1,
            IsActive = true,
            CreatedAt = DateTime.Now
        };
        context.UserSubscription.Add(userSubscription);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new CreateReportCommandHandler(context, mockTenantService.Object);
        var command = new CreateReportCommand
        {
            TenantId = tenantId,
            CustomerName = "John Doe",
            CustomerEmail = "john.doe@example.com",
            GeneratedReport = "Sample report content"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Report created successfully.", result.Message);

        var report = await context.Report.FirstOrDefaultAsync(r => r.CustomerEmail == command.CustomerEmail);
        Assert.NotNull(report);

        // Verify reports limit was NOT decremented (unlimited plan)
        var unchangedSubscription = await context.UserSubscription.FirstOrDefaultAsync(us => us.TenantId == tenantId);
        Assert.NotNull(unchangedSubscription);
        Assert.Equal(-1, unchangedSubscription.ReportsLimit);
    }
}
