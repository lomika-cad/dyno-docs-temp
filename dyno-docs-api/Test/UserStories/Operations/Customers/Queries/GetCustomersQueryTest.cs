using Application.UserStories.Operations.Customers.Queries;
using Domain.Common;
using Test.Common;
using Xunit;

namespace Test.UserStories.Operations.Customers.Queries;

public class GetCustomersQueryTest
{
    [Fact]
    public async Task Handle_ShouldReturnAllCustomers()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var customers = new List<Domain.Entities.Operations.Customer>
        {
            new()
            {
                Name = "John Doe",
                Email = "john.doe@example.com",
                ContactNo = "+1234567890",
                Country = "USA",
                DateOfBirth = new DateOnly(1990, 1, 1),
                Gender = Gender.Male,
                CreatedBy = "TestUser",
                CreatedAt = DateTime.Now
            },
            new()
            {
                Name = "Jane Smith",
                Email = "jane.smith@example.com",
                ContactNo = "+0987654321",
                Country = "Canada",
                DateOfBirth = new DateOnly(1992, 2, 2),
                Gender = Gender.Female,
                CreatedBy = "TestUser",
                CreatedAt = DateTime.Now
            }
        };

        foreach (var customer in customers)
        {
            context.Customer.Add(customer);
        }
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetCustomersQueryHandler(context);
        var query = new GetCustomersQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Contains(result, c => c.Name == "John Doe");
        Assert.Contains(result, c => c.Name == "Jane Smith");
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNoCustomersExist()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new GetCustomersQueryHandler(context);
        var query = new GetCustomersQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}
