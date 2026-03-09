using Application.UserStories.Operations.Dashboard.Queries;
using Test.Common;
using Xunit;

namespace Test.UserStories.Operations.Dashboard.Queries;

public class GetStatsQueryTest
{
    [Fact]
    public async Task Handle_ShouldReturnStats_ForTenant()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid();

        // Set up reports for the tenant
        var reports = new List<Domain.Entities.Operations.Report>
        {
            new()
            {
                CustomerName = "Customer 1",
                CustomerEmail = "customer1@example.com",
                GeneratedReport = "Report 1",
                TenantId = tenantId,
                CreatedAt = DateTime.Now
            },
            new()
            {
                CustomerName = "Customer 2",
                CustomerEmail = "customer2@example.com",
                GeneratedReport = "Report 2",
                TenantId = tenantId,
                CreatedAt = DateTime.Now
            }
        };
        foreach (var report in reports)
        {
            context.Report.Add(report);
        }

        // Set up customers for the tenant
        var customers = new List<Domain.Entities.Operations.Customer>
        {
            new()
            {
                Name = "Customer 1",
                Email = "customer1@example.com",
                ContactNo = "+1234567890",
                Country = "USA",
                TenantId = tenantId,
                CreatedAt = DateTime.Now
            },
            new()
            {
                Name = "Customer 2",
                Email = "customer2@example.com",
                ContactNo = "+0987654321",
                Country = "Canada",
                TenantId = tenantId,
                CreatedAt = DateTime.Now
            },
            new()
            {
                Name = "Customer 3",
                Email = "customer3@example.com",
                ContactNo = "+1111111111",
                Country = "UK",
                TenantId = tenantId,
                CreatedAt = DateTime.Now
            }
        };
        foreach (var customer in customers)
        {
            context.Customer.Add(customer);
        }

        // Set up user subscription for the tenant
        var userSubscription = new Domain.Entities.Operations.UserSubscription
        {
            TenantId = tenantId,
            PlanId = 2,
            PlanName = "Professional",
            ReportsLimit = 45,
            TemplatesLimit = 12,
            IsActive = true,
            CreatedAt = DateTime.Now
        };
        context.UserSubscription.Add(userSubscription);

        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetStatsQueryHandler(context);
        var query = new GetStatsQuery
        {
            TenantId = tenantId
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        var stats = result as dynamic;
        Assert.NotNull(stats);
        Assert.Equal(2, (int)stats.TotalReports);
        Assert.Equal(3, (int)stats.TotalCustomers);
        Assert.Equal(12, (int)stats.AvailableTemplates);
        Assert.Equal(45, (int)stats.AvailableReports);
    }

    [Fact]
    public async Task Handle_ShouldReturnZeros_WhenNoData()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid(); // Tenant with no data

        var handler = new GetStatsQueryHandler(context);
        var query = new GetStatsQuery
        {
            TenantId = tenantId
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        var stats = result as dynamic;
        Assert.NotNull(stats);
        Assert.Equal(0, (int)stats.TotalReports);
        Assert.Equal(0, (int)stats.TotalCustomers);
        Assert.Null(stats.AvailableTemplates);
        Assert.Null(stats.AvailableReports);
    }
}
