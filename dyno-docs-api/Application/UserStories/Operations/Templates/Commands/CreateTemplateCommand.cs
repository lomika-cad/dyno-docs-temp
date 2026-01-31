using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using OneOf.Types;

namespace Application.UserStories.Operations.Templates.Commands;

public class CreateTemplateCommand : IRequest<Result>
{
    public string TemplateName { get; set; }
    public IFormFile TemplateThumbnail { get; set; }
    public string TemplateDesign { get; set; }
    public bool isPaid { get; set; }
    public decimal? Price { get; set; }
}

public class CreateTemplateCommandHandler : IRequestHandler<CreateTemplateCommand, Result>
{
    private readonly IApplicationDbContext _dbContext;

    public CreateTemplateCommandHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result> Handle(CreateTemplateCommand request, CancellationToken cancellationToken)
    {
        byte[] thumbnailBytes;
        using (var ms = new MemoryStream())
        {
            await request.TemplateThumbnail.CopyToAsync(ms, cancellationToken);
            thumbnailBytes = ms.ToArray();
        }

        var entity = new Domain.Entities.Operations.Template
        {
            TemplateName = request.TemplateName,
            TemplateThumbnail = thumbnailBytes,
            TemplateDesign = request.TemplateDesign,
            isPaid = request.isPaid,
            Price = request.Price,
            CreatedAt = DateTime.Now
        };

        _dbContext.Template.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success("Template created successfully");
    }
}