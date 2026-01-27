using Application.Common;
using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.AspNetCore.Http;
using OneOf.Types;

namespace Application.UserStories.Operations.Partnerships.Commands;

public class CreatePartnershipCommand : IRequest<Result>
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? District { get; set; }
    public PartnershipTypes PartnershipType { get; set; }
    public IFormFile[]? Images { get; set; }
}

public class CreatePartnershipCommandHandler (IApplicationDbContext dbContext) : IRequestHandler<CreatePartnershipCommand, Result>
{
    public async Task<Result> Handle(CreatePartnershipCommand request, CancellationToken cancellationToken)
    {
        byte[][] imageBytes = null;
        if (request.Images != null)
        {
            var files = request.Images.Take(5).ToArray();
            imageBytes = new byte[files.Length][];
            for (int i = 0; i < files.Length; i++)
            {
                using (var ms = new MemoryStream())
                {
                    await files[i].CopyToAsync(ms, cancellationToken);
                    imageBytes[i] = ms.ToArray();
                }
            }
        }
        
        var entity = new Partnership()
        {
            Name = request.Name,
            Description = request.Description,
            District = request.District,
            PartnershipType = request.PartnershipType,
            Images = imageBytes,
            CreatedAt = DateTime.Now
        };

        dbContext.Partnership.Add(entity);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success("Partnership created successfully");
    }
}