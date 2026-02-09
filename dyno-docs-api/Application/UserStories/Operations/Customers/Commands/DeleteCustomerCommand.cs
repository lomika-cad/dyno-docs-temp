using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Customers.Commands;

public class DeleteCustomerCommand : IRequest<Result>
{
    public Guid? Id { get; set; }
}

public class DeleteCustomerCommandHandler : IRequestHandler<DeleteCustomerCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DeleteCustomerCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeleteCustomerCommand request, CancellationToken cancellationToken)
    {
        var customer = await _context.Customer.Where(c => c.Id == request.Id).FirstOrDefaultAsync(cancellationToken);
        
        if (customer == null)
        {
            return Result.Failure("Customer not found.");
        }

        _context.Customer.Remove(customer);
        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success("Customer deleted successfully.");
    }
}