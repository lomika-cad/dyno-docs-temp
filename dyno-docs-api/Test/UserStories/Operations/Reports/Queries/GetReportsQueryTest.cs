using Application.UserStories.Operations.Reports.Queries;
using Test.Common;
using Xunit;

namespace Test.UserStories.Operations.Reports.Queries;

public class GetReportsQueryTest
{
    [Fact]
    public async Task Handle_ShouldReturnReports_FilteredByTenantId()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId1 = Guid.NewGuid();
        var tenantId2 = Guid.NewGuid();

        var reports = new List<Domain.Entities.Operations.Report>
        {
            new()
            {
                CustomerName = "John Doe",
                CustomerEmail = "john.doe@example.com",
                GeneratedReport = "Report 1 content",
                TenantId = tenantId1,
                CreatedAt = DateTime.Now.AddHours(1) // Most recent
            },
            new()
            {
                CustomerName = "Jane Smith",
                CustomerEmail = "jane.smith@example.com",
                GeneratedReport = "Report 2 content",
                TenantId = tenantId1,
                CreatedAt = DateTime.Now // Older
            },
            new()
            {
                CustomerName = "Bob Johnson",
                CustomerEmail = "bob.johnson@example.com",
                GeneratedReport = "Report 3 content",
                TenantId = tenantId2, // Different tenant
                CreatedAt = DateTime.Now
            }
        };

        foreach (var report in reports)
        {
            context.Report.Add(report);
        }
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetReportsQueryHandler(context);
        var query = new GetReportsQuery
        {
            TenantId = tenantId1
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);

        // Should be ordered by CreatedAt descending
        Assert.Equal("john.doe@example.com", result[0].CustomerEmail);
        Assert.Equal("jane.smith@example.com", result[1].CustomerEmail);

        // Should not include reports from different tenant
        Assert.DoesNotContain(result, r => r.CustomerEmail == "bob.johnson@example.com");
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNoReportsForTenant()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid();

        // Add a report for a different tenant
        var otherReport = new Domain.Entities.Operations.Report
        {
            CustomerName = "Other Customer",
            CustomerEmail = "other@example.com",
            GeneratedReport = "Other report",
            TenantId = Guid.NewGuid(), // Different tenant
            CreatedAt = DateTime.Now
        };
        context.Report.Add(otherReport);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetReportsQueryHandler(context);
        var query = new GetReportsQuery
        {
            TenantId = tenantId // No reports for this tenant
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}
