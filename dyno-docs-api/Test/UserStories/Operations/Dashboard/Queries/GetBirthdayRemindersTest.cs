using Application.UserStories.Operations.Dashboard.Queries;
using Test.Common;
using Xunit;

namespace Test.UserStories.Operations.Dashboard.Queries;

public class GetBirthdayRemindersTest
{
    [Fact]
    public async Task Handle_ShouldReturnUpcomingBirthdays_Within14Days()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid();
        var today = DateTime.Today;

        // Set up customers with birthdays
        var customers = new List<Domain.Entities.Operations.Customer>
        {
            new()
            {
                Name = "John Doe",
                Email = "john@example.com",
                ContactNo = "+1234567890",
                Country = "USA",
                DateOfBirth = new DateOnly(today.Year, today.Month, today.Day + 3), // 3 days from now
                TenantId = tenantId,
                CreatedAt = DateTime.Now
            },
            new()
            {
                Name = "Jane Smith",
                Email = "jane@example.com",
                ContactNo = "+0987654321",
                Country = "Canada",
                DateOfBirth = new DateOnly(today.Year, today.Month, today.Day + 10), // 10 days from now
                TenantId = tenantId,
                CreatedAt = DateTime.Now
            },
            new()
            {
                Name = "Bob Johnson",
                Email = "bob@example.com",
                ContactNo = "+1111111111",
                Country = "UK",
                DateOfBirth = new DateOnly(today.Year, today.Month, today.Day + 20), // 20 days from now (outside 14-day window)
                TenantId = tenantId,
                CreatedAt = DateTime.Now
            },
            new()
            {
                Name = "Alice Brown",
                Email = "alice@example.com",
                ContactNo = "+2222222222",
                Country = "Australia",
                DateOfBirth = null, // No date of birth
                TenantId = tenantId,
                CreatedAt = DateTime.Now
            }
        };

        foreach (var customer in customers)
        {
            context.Customer.Add(customer);
        }
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetBirthdayRemindersHandler(context);
        var query = new GetBirthdayReminders
        {
            TenantId = tenantId
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count); // Only John and Jane (within 14 days)

        // Should be ordered by upcoming birthday
        Assert.Equal("John Doe", result[0].Name);
        Assert.Equal(3, result[0].DaysRemaining);

        Assert.Equal("Jane Smith", result[1].Name);
        Assert.Equal(10, result[1].DaysRemaining);

        // Verify dates are calculated correctly
        Assert.Equal(new DateOnly(today.Year, today.Month, today.Day + 3), result[0].DateOfBirth);
        Assert.Equal(today.AddDays(3), result[0].UpcomingBirthday);
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNoBirthdaysInRange()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid();
        var today = DateTime.Today;

        // Set up customers with birthdays outside the 14-day window
        var customers = new List<Domain.Entities.Operations.Customer>
        {
            new()
            {
                Name = "John Doe",
                Email = "john@example.com",
                ContactNo = "+1234567890",
                Country = "USA",
                DateOfBirth = new DateOnly(today.Year, today.Month, today.Day + 20), // 20 days from now
                TenantId = tenantId,
                CreatedAt = DateTime.Now
            },
            new()
            {
                Name = "Jane Smith",
                Email = "jane@example.com",
                ContactNo = "+0987654321",
                Country = "Canada",
                DateOfBirth = null, // No date of birth
                TenantId = tenantId,
                CreatedAt = DateTime.Now
            }
        };

        foreach (var customer in customers)
        {
            context.Customer.Add(customer);
        }
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetBirthdayRemindersHandler(context);
        var query = new GetBirthdayReminders
        {
            TenantId = tenantId
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result); // No birthdays within 14 days
    }
}
