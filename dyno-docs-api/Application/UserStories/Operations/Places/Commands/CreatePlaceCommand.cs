using System.ComponentModel.DataAnnotations;
using Application.Common;
using Application.Common.Interfaces;
using Domain.Entities.Operations;
using MediatR;

namespace Application.UserStories.Operations.Places.Commands;

public class CreatePlaceCommand : IRequest<Result>
{
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

    public byte[]? Image1 { get; set; }
    public byte[]? Image2 { get; set; }
    public byte[]? Image3 { get; set; }
    public byte[]? Image4 { get; set; }
    public byte[]? Image5 { get; set; }
}

public class CreatePlaceCommandHandler : IRequestHandler<CreatePlaceCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public CreatePlaceCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(CreatePlaceCommand request, CancellationToken cancellationToken)
    {
        var place = new Place
        {
            Name = request.Name,
            AverageVisitDuration = request.AverageVisitDuration,
            Description = request.Description,
            FunFact = request.FunFact,
            District = request.District,
            City = request.City,
            Image1 = request.Image1,
            Image2 = request.Image2,
            Image3 = request.Image3,
            Image4 = request.Image4,
            Image5 = request.Image5
        };

        _context.Places.Add(place);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success("Place created successfully.");
    }
}
