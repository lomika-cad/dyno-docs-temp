using System.ComponentModel.DataAnnotations;
using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Places.Commands;

public class UpdatePlaceCommand : IRequest<Result>
{
    public Guid Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public required string Name { get; set; }

    [Required]
    [MaxLength(255)]
    public required string AverageVisitDuration { get; set; }

    [MaxLength(500)]
    public string? Description { get; set; }

    public string? FunFact { get; set; }

    [Required]
    [MaxLength(225)]
    public required string District { get; set; }

    [Required]
    [MaxLength(225)]
    public required string City { get; set; }
}

public class UpdatePlaceCommandHandler : IRequestHandler<UpdatePlaceCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public UpdatePlaceCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(UpdatePlaceCommand request, CancellationToken cancellationToken)
    {
        var place = await _context.Places
            .FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);

        if (place == null)
        {
            return Result.Failure("Place not found.");
        }

        place.Name = request.Name;
        place.AverageVisitDuration = request.AverageVisitDuration;
        place.Description = request.Description;
        place.FunFact = request.FunFact;
        place.District = request.District;
        place.City = request.City;

        await _context.SaveChangesAsync(cancellationToken);
        return Result.Success("Place updated successfully.");
    }
}
