using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Templates.Commands;

public class UpdateTemplateCommand : IRequest<Result>
{
    public Guid TemplateId { get; set; }
    public string TemplateName { get; set; }
    public IFormFile TemplateThumbnail { get; set; }
    public string TemplateDesign { get; set; }
    public bool isPaid { get; set; }
    public decimal? Price { get; set; }
}

public class UpdateTemplateCommandHandler (IApplicationDbContext dbContext) : IRequestHandler<UpdateTemplateCommand, Result>
{
    public async Task<Result> Handle(UpdateTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = await dbContext.Template.Where(t => t.Id == request.TemplateId).FirstOrDefaultAsync(cancellationToken);
        if (template == null)
        {
            return Result.Failure("Template not found");
        }
        
        byte[] thumbnailBytes;
        using (var ms = new MemoryStream())
        {
            await request.TemplateThumbnail.CopyToAsync(ms, cancellationToken);
            thumbnailBytes = ms.ToArray();
        }

        template.TemplateName = request.TemplateName;
        template.TemplateDesign = request.TemplateDesign;
        template.TemplateThumbnail = thumbnailBytes;
        template.isPaid = request.isPaid;
        template.Price = request.Price;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Result.Success("Template updated successfully");
    }
}