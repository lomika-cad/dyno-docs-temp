using Application.UserStories.Operations.Customers.Commands;
using Domain.Common;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.Customers.Commands;

public class CreateCustomerCommandTest
{
    [Fact]
    public async Task Handle_ShouldCreateCustomer_WhenEmailIsUnique()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new CreateCustomerCommandHandler(context);
        var command = new CreateCustomerCommand
        {
            Name = "John Doe",
            Email = "john.doe@example.com",
            ContactNo = "+1234567890",
            Country = "USA",
            DateOfBirth = new DateOnly(1990, 1, 1),
            Gender = Gender.Male,
            CreatedBy = "TestUser"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Customer created successfully.", result.Message);

        var customer = await context.Customer.FirstOrDefaultAsync(c => c.Email == command.Email);
        Assert.NotNull(customer);
        Assert.Equal(command.Name, customer.Name);
        Assert.Equal(command.Email, customer.Email);
        Assert.Equal(command.ContactNo, customer.ContactNo);
        Assert.Equal(command.Country, customer.Country);
        Assert.Equal(command.DateOfBirth, customer.DateOfBirth);
        Assert.Equal(command.Gender, customer.Gender);
        Assert.Equal(command.CreatedBy, customer.CreatedBy);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenEmailAlreadyExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var existingCustomer = new Domain.Entities.Operations.Customer
        {
            Name = "Existing Customer",
            Email = "existing@example.com",
            ContactNo = "+1234567890",
            Country = "USA",
            DateOfBirth = new DateOnly(1990, 1, 1),
            Gender = Gender.Male,
            CreatedBy = "TestUser",
            CreatedAt = DateTime.Now
        };
        context.Customer.Add(existingCustomer);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new CreateCustomerCommandHandler(context);
        var command = new CreateCustomerCommand
        {
            Name = "John Doe",
            Email = "existing@example.com", // Same email
            ContactNo = "+0987654321",
            Country = "Canada",
            DateOfBirth = new DateOnly(1992, 2, 2),
            Gender = Gender.Female,
            CreatedBy = "TestUser"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("A customer with the same email already exists.", result.Message);

        // Verify no new customer was added
        var customerCount = await context.Customer.CountAsync();
        Assert.Equal(1, customerCount);
    }
}
