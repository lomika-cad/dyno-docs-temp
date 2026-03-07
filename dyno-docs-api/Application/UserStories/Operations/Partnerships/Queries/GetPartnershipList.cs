using Application.Common.Interfaces;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Partnerships.Queries;

public class GetPartnershipList : IRequest<List<Partnership>> {}

public class GetPartnershipListHandler(IApplicationDbContext dbContext) : IRequestHandler<GetPartnershipList, List<Partnership>>
{
    public async Task<List<Partnership>> Handle(GetPartnershipList request, CancellationToken cancellationToken)
    {
        var partnerships = await dbContext.Partnership.ToListAsync(cancellationToken);
        return partnerships;
    }
}