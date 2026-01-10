using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Places.Queries;

public record GetPlacesQuery : IRequest<List<PlaceResponse>>;

public class GetPlacesQueryHandler : IRequestHandler<GetPlacesQuery, List<PlaceResponse>>
{
    private readonly IApplicationDbContext _context;

    public GetPlacesQueryHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<PlaceResponse>> Handle(GetPlacesQuery request, CancellationToken cancellationToken)
    {
        var places = await _context.Places
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

        return places;
    }
}

public class PlaceResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string AverageVisitDuration { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? FunFact { get; set; }
    public string District { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string? Image1Url { get; set; }
    public string? Image2Url { get; set; }
    public string? Image3Url { get; set; }
    public string? Image4Url { get; set; }
    public string? Image5Url { get; set; }
    public DateTime CreatedAt { get; set; }
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime? LastModifiedAt { get; set; }
    public string? LastModifiedBy { get; set; }
}
