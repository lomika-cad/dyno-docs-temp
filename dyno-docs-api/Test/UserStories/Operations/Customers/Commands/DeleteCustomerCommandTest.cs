using Application.UserStories.Operations.Customers.Commands;
using Domain.Common;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.Customers.Commands;

public class DeleteCustomerCommandTest
{
    [Fact]
    public async Task Handle_ShouldDeleteCustomer_WhenCustomerExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var existingCustomer = new Domain.Entities.Operations.Customer
        {
            Name = "John Doe",
            Email = "john.doe@example.com",
            ContactNo = "+1234567890",
            Country = "USA",
            DateOfBirth = new DateOnly(1990, 1, 1),
            Gender = Gender.Male,
            CreatedBy = "TestUser",
            CreatedAt = DateTime.Now
        };
        context.Customer.Add(existingCustomer);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new DeleteCustomerCommandHandler(context);
        var command = new DeleteCustomerCommand
        {
            Id = existingCustomer.Id
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Customer deleted successfully.", result.Message);

        var deletedCustomer = await context.Customer.FirstOrDefaultAsync(c => c.Id == existingCustomer.Id);
        Assert.Null(deletedCustomer);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenCustomerNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new DeleteCustomerCommandHandler(context);
        var command = new DeleteCustomerCommand
        {
            Id = Guid.NewGuid() // Non-existent ID
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Customer not found.", result.Message);
    }
}
