using Application.Common;
using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Customers.Commands;

public class CreateCustomerCommand : IRequest<Result>
{
    public string? Name { get; set; }
    public string? Email { get; set; }
    public string? ContactNo { get; set; }
    public string? Country { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public Gender? Gender { get; set; }
    public string? CreatedBy { get; set; }
}

public class CreateCustomerCommandHandler : IRequestHandler<CreateCustomerCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public CreateCustomerCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(CreateCustomerCommand request, CancellationToken cancellationToken)
    {
        
        var existingCustomer = await _context.Customer
            .FirstOrDefaultAsync(x => x.Email == request.Email, cancellationToken);
        
        if (existingCustomer != null)
        {
            return Result.Failure("A customer with the same email already exists.");
        }
        
        var customer = new Customer
        {
            Name = request.Name,
            Email = request.Email,
            ContactNo = request.ContactNo,
            Country = request.Country,
            DateOfBirth = request.DateOfBirth,
            Gender = request.Gender,
            CreatedBy = request.CreatedBy,
            CreatedAt = DateTime.Now
        };

        _context.Customer.Add(customer);
        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success("Customer created successfully.");
    }
}
            