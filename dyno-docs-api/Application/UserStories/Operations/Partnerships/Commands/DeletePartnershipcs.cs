using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Partnerships.Commands;

public class DeletePartnership : IRequest<Result>
{
    public Guid Id { get; set; }
}

public class DeletePartnershipHandler(IApplicationDbContext dbContext)
    : IRequestHandler<DeletePartnership, Result>
{
    public async Task<Result> Handle(DeletePartnership request, CancellationToken cancellationToken)
    {
        var partnership = await dbContext.Partnership.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
        if (partnership == null)
        {
            return Result.Failure("Partnership not found");
        }

        dbContext.Partnership.Remove(partnership);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success("Partnership deleted successfully");
    }
}