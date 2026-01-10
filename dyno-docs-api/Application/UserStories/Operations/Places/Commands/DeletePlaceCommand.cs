using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Places.Commands;

public class DeletePlaceCommand : IRequest<Result>
{
    public Guid Id { get; set; }
}

public class DeletePlaceCommandHandler : IRequestHandler<DeletePlaceCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public DeletePlaceCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(DeletePlaceCommand request, CancellationToken cancellationToken)
    {
        var place = await _context.Places
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (place == null)
        {
            return Result.Failure("Place not found.");
        }

        _context.Places.Remove(place);
        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success("Place deleted successfully.");
    }
}
