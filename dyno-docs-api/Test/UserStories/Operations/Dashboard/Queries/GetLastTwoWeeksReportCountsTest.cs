using Application.UserStories.Operations.Dashboard.Queries;
using Test.Common;
using Xunit;

namespace Test.UserStories.Operations.Dashboard.Queries;

public class GetLastTwoWeeksReportCountsTest
{
    [Fact]
    public async Task Handle_ShouldReturn14DaysCounts()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid();
        var today = DateTime.Now;
        var startDate = today.AddDays(-13);

        // Set up reports for different days
        var reports = new List<Domain.Entities.Operations.Report>
        {
            new()
            {
                CustomerName = "Customer 1",
                CustomerEmail = "customer1@example.com",
                GeneratedReport = "Report 1",
                TenantId = tenantId,
                CreatedAt = startDate // Day 1
            },
            new()
            {
                CustomerName = "Customer 2",
                CustomerEmail = "customer2@example.com",
                GeneratedReport = "Report 2",
                TenantId = tenantId,
                CreatedAt = startDate.AddDays(1) // Day 2
            },
            new()
            {
                CustomerName = "Customer 3",
                CustomerEmail = "customer3@example.com",
                GeneratedReport = "Report 3",
                TenantId = tenantId,
                CreatedAt = startDate.AddDays(1) // Day 2 (another report)
            },
            new()
            {
                CustomerName = "Customer 4",
                CustomerEmail = "customer4@example.com",
                GeneratedReport = "Report 4",
                TenantId = tenantId,
                CreatedAt = startDate.AddDays(5) // Day 6
            }
        };

        foreach (var report in reports)
        {
            context.Report.Add(report);
        }
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetLastTwoWeeksReportCountsHandler(context);
        var query = new GetLastTwoWeeksReportCounts
        {
            TenantId = tenantId
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(14, result.Count); // Should return exactly 14 days

        // Check specific days
        var day1 = result.FirstOrDefault(d => d.Date == DateOnly.FromDateTime(startDate));
        Assert.NotNull(day1);
        Assert.Equal(1, day1.Count);

        var day2 = result.FirstOrDefault(d => d.Date == DateOnly.FromDateTime(startDate.AddDays(1)));
        Assert.NotNull(day2);
        Assert.Equal(2, day2.Count);

        var day6 = result.FirstOrDefault(d => d.Date == DateOnly.FromDateTime(startDate.AddDays(5)));
        Assert.NotNull(day6);
        Assert.Equal(1, day6.Count);

        // Check that days with no reports have count 0
        var day3 = result.FirstOrDefault(d => d.Date == DateOnly.FromDateTime(startDate.AddDays(2)));
        Assert.NotNull(day3);
        Assert.Equal(0, day3.Count);

        var day14 = result.FirstOrDefault(d => d.Date == DateOnly.FromDateTime(startDate.AddDays(13)));
        Assert.NotNull(day14);
        Assert.Equal(0, day14.Count);
    }

    [Fact]
    public async Task Handle_ShouldReturnZeroCounts_WhenNoReports()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid(); // Tenant with no reports

        var handler = new GetLastTwoWeeksReportCountsHandler(context);
        var query = new GetLastTwoWeeksReportCounts
        {
            TenantId = tenantId
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(14, result.Count); // Should return exactly 14 days

        // All days should have count 0
        foreach (var dayCount in result)
        {
            Assert.Equal(0, dayCount.Count);
        }
    }
}
