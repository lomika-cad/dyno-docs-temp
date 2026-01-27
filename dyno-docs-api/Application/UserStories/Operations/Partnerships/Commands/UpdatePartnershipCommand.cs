using Application.Common;
using Application.Common.Interfaces;
using Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneOf.Types;

namespace Application.UserStories.Operations.Partnerships.Commands;

public class UpdatePartnershipCommand : IRequest<Result>
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? District { get; set; }
    public PartnershipTypes PartnershipType { get; set; }
}

public class UpdatePartnershipCommandHandler(IApplicationDbContext dbContext) : IRequestHandler<UpdatePartnershipCommand, Result>
{
    public async Task<Result> Handle(UpdatePartnershipCommand request, CancellationToken cancellationToken)
    {
        var entity = await dbContext.Partnership.FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
        if (entity == null)
        {
            return Result.Failure("Partnership not found");
        }

        entity.Name = request.Name ?? entity.Name;
        entity.Description = request.Description ?? entity.Description;
        entity.District = request.District ?? entity.District;
        entity.PartnershipType = request.PartnershipType;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success("Partnership updated successfully");
    }
}