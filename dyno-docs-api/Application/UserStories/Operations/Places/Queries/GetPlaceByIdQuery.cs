using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Places.Queries;

public record GetPlaceByIdQuery(Guid Id) : IRequest<PlaceResponse?>;

public class GetPlaceByIdQueryHandler : IRequestHandler<GetPlaceByIdQuery, PlaceResponse?>
{
    private readonly IApplicationDbContext _context;

    public GetPlaceByIdQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PlaceResponse?> Handle(GetPlaceByIdQuery request, CancellationToken cancellationToken)
    {
        var place = await _context.Places
            .Where(p => p.Id == request.Id)
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
            .FirstOrDefaultAsync(cancellationToken);

        return place;
    }
}
