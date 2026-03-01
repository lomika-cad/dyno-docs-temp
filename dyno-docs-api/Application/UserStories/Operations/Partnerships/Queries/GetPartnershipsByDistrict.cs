using Application.Common.Interfaces;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Partnerships.Queries;

public class GetPartnershipsByDistrict : IRequest<List<Partnership>>
{
    public required Guid TenantId { get; set; }
    public required string District { get; set; }
}

public class GetPartnershipsByDistrictHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetPartnershipsByDistrict, List<Partnership>>
{
    public async Task<List<Partnership>> Handle(GetPartnershipsByDistrict request, CancellationToken cancellationToken)
    {
        return await dbContext.Partnership
            .Where(p => p.TenantId == request.TenantId && p.District == request.District)
            .ToListAsync(cancellationToken);
    }
}