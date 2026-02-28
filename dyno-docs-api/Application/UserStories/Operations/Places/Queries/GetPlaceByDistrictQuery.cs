using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Places.Queries;

public record GetPlaceByDistrictQuery : IRequest<List<PlaceResponse?>>
{
    public required Guid TenantId { get; set; }
    public required string District { get; set; }
}

public class GetPlaceByNameQueryHandler (IApplicationDbContext _context) : IRequestHandler<GetPlaceByDistrictQuery, List<PlaceResponse>?>
{
    public async Task<List<PlaceResponse>?> Handle(GetPlaceByDistrictQuery request, CancellationToken cancellationToken)
    {
        var place = await _context.Places
            .Where(p => p.TenantId == request.TenantId && p.District == request.District)
            .Select(p => new PlaceResponse
            {
                Id = p.Id,
                Name = p.Name,
                AverageVisitDuration = p.AverageVisitDuration,
                Description = p.Description,
                FunFact = p.FunFact,
                District = p.District,
                City = p.City,
                Image1Url = p.Image1 != null ? Convert.ToBase64String(p.Image1) : null,
                Image2Url = p.Image2 != null ? Convert.ToBase64String(p.Image2) : null,
                Image3Url = p.Image3 != null ? Convert.ToBase64String(p.Image3) : null,
                Image4Url = p.Image4 != null ? Convert.ToBase64String(p.Image4) : null,
                Image5Url = p.Image5 != null ? Convert.ToBase64String(p.Image5) : null,
                CreatedAt = p.CreatedAt,
                CreatedBy = p.CreatedBy,
                LastModifiedAt = p.LastModifiedAt,
                LastModifiedBy = p.LastModifiedBy
            })
            .ToListAsync(cancellationToken);

        return place;
    }
}
