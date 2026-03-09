using Application.UserStories.Operations.Customers.Commands;
using Domain.Common;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.Customers.Commands;

public class UpdateCustomerCommandTest
{
    [Fact]
    public async Task Handle_ShouldUpdateCustomer_WhenCustomerExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var existingCustomer = new Domain.Entities.Operations.Customer
        {
            Name = "Original Name",
            Email = "original@example.com",
            ContactNo = "+1234567890",
            Country = "USA",
            DateOfBirth = new DateOnly(1990, 1, 1),
            Gender = Gender.Male,
            CreatedBy = "TestUser",
            CreatedAt = DateTime.Now
        };
        context.Customer.Add(existingCustomer);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new UpdateCustomerCommandHandler(context);
        var command = new UpdateCustomerCommand
        {
            Id = existingCustomer.Id,
            Name = "Updated Name",
            Email = "updated@example.com",
            ContactNo = "+0987654321",
            Country = "Canada",
            DateOfBirth = new DateOnly(1992, 2, 2),
            Gender = Gender.Female,
            UpdatedBy = "TestUser"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Customer updated successfully.", result.Message);

        var updatedCustomer = await context.Customer.FirstOrDefaultAsync(c => c.Id == existingCustomer.Id);
        Assert.NotNull(updatedCustomer);
        Assert.Equal(command.Name, updatedCustomer.Name);
        Assert.Equal(command.Email, updatedCustomer.Email);
        Assert.Equal(command.ContactNo, updatedCustomer.ContactNo);
        Assert.Equal(command.Country, updatedCustomer.Country);
        Assert.Equal(command.DateOfBirth, updatedCustomer.DateOfBirth);
        Assert.Equal(command.Gender, updatedCustomer.Gender);
        Assert.Equal(command.UpdatedBy, updatedCustomer.LastModifiedBy);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenCustomerNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new UpdateCustomerCommandHandler(context);
        var command = new UpdateCustomerCommand
        {
            Id = Guid.NewGuid(), // Non-existent ID
            Name = "Updated Name",
            Email = "updated@example.com",
            ContactNo = "+0987654321",
            Country = "Canada",
            DateOfBirth = new DateOnly(1992, 2, 2),
            Gender = Gender.Female,
            UpdatedBy = "TestUser"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Customer not found.", result.Message);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenEmailBelongsToAnotherCustomer()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var customer1 = new Domain.Entities.Operations.Customer
        {
            Name = "Customer 1",
            Email = "customer1@example.com",
            ContactNo = "+1234567890",
            Country = "USA",
            DateOfBirth = new DateOnly(1990, 1, 1),
            Gender = Gender.Male,
            CreatedBy = "TestUser",
            CreatedAt = DateTime.Now
        };
        var customer2 = new Domain.Entities.Operations.Customer
        {
            Name = "Customer 2",
            Email = "customer2@example.com",
            ContactNo = "+0987654321",
            Country = "Canada",
            DateOfBirth = new DateOnly(1992, 2, 2),
            Gender = Gender.Female,
            CreatedBy = "TestUser",
            CreatedAt = DateTime.Now
        };
        context.Customer.Add(customer1);
        context.Customer.Add(customer2);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new UpdateCustomerCommandHandler(context);
        var command = new UpdateCustomerCommand
        {
            Id = customer1.Id,
            Name = "Updated Name",
            Email = "customer2@example.com", // Email already belongs to customer2
            ContactNo = "+1111111111",
            Country = "UK",
            DateOfBirth = new DateOnly(1993, 3, 3),
            Gender = Gender.Male,
            UpdatedBy = "TestUser"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Another customer with the same email already exists.", result.Message);

        // Verify customer1 was not updated
        var unchangedCustomer = await context.Customer.FirstOrDefaultAsync(c => c.Id == customer1.Id);
        Assert.NotNull(unchangedCustomer);
        Assert.Equal("Customer 1", unchangedCustomer.Name);
        Assert.Equal("customer1@example.com", unchangedCustomer.Email);
    }
}
