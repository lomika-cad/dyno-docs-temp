using Application.Common.Interfaces;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Partnerships.Queries;

public class GetPartnerships : IRequest<List<Partnership>> {}

public class GetPartnershipsHandler(IApplicationDbContext dbContext) : IRequestHandler<GetPartnerships, List<Partnership>>
{
    public async Task<List<Partnership>> Handle(GetPartnerships request, CancellationToken cancellationToken)
    {
        var partnerships = await dbContext.Partnership.ToListAsync(cancellationToken);
        return partnerships;
    }
}