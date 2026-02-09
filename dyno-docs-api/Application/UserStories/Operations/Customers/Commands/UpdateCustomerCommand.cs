using Application.Common;
using Application.Common.Interfaces;
using Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Customers.Commands;

public class UpdateCustomerCommand : IRequest<Result>
{
    public Guid? Id { get; set; }
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? ContactNo { get; set; }
    public string? Country { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public string? UpdatedBy { get; set; }
}

public class UpdateCustomerCommandHandler (IApplicationDbContext dbContext) : IRequestHandler<UpdateCustomerCommand, Result>
{
    public async Task<Result> Handle(UpdateCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = await dbContext.Customer.Where(c => c.Id == request.Id).FirstOrDefaultAsync(cancellationToken);
        
        if (customer == null)
        {
            return Result.Failure("Customer not found.");
        }
        
        var existingCustomerWithEmail = await dbContext.Customer
            .Where(c => c.Email == request.Email && c.Id != request.Id)
            .FirstOrDefaultAsync(cancellationToken);
        
        if (existingCustomerWithEmail != null) 
        {
            return Result.Failure("Another customer with the same email already exists.");
        }
        
        customer.Name = request.Name ?? customer.Name;
        customer.Email = request.Email ?? customer.Email;
        customer.ContactNo = request.ContactNo ?? customer.ContactNo;
        customer.Country = request.Country ?? customer.Country;
        customer.DateOfBirth = request.DateOfBirth ?? customer.DateOfBirth;
        customer.Gender = request.Gender ?? customer.Gender;
        customer.LastModifiedBy = request.UpdatedBy;
        customer.LastModifiedAt = DateTime.Now;
        
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success("Customer updated successfully.");
    }
}