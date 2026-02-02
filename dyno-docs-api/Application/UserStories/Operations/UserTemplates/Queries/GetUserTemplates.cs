using System;
using System.Linq;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.UserTemplates.Queries;

public class GetUserTemplates : IRequest<List<UserTemplateDto>>
{
    public Guid UserId { get; set; }
}

public class GetUserTemplatesHandler(IApplicationDbContext dbContext)
    : IRequestHandler<GetUserTemplates, List<UserTemplateDto>>
{
    public async Task<List<UserTemplateDto>> Handle(GetUserTemplates request, CancellationToken cancellationToken)
    {
        // First materialize the raw data (including the byte[] thumbnail) into memory
        var raw = await (from ut in dbContext.UserTemplate
            join t in dbContext.Template on ut.TemplateId equals t.Id
            where ut.UserId == request.UserId
            select new
            {
                t.Id,
                t.TemplateName,
                t.TemplateThumbnail,
                ut.TemplateDesign
            }).ToListAsync(cancellationToken);

        // Convert the thumbnail bytes to base64 data URLs in-memory
        var userTemplates = raw.Select(x => new UserTemplateDto
        {
            TemplateId = x.Id,
            TemplateName = x.TemplateName,
            TemplateThumbnail = x.TemplateThumbnail != null && x.TemplateThumbnail.Length > 0
                ? $"data:image/png;base64,{Convert.ToBase64String(x.TemplateThumbnail)}"
                : string.Empty,
            TemplateDesign = x.TemplateDesign
        }).ToList();

        return userTemplates;
    }
}

public class UserTemplateDto
{
    public Guid TemplateId { get; set; }
    public string TemplateName { get; set; } = string.Empty;
    public string TemplateThumbnail { get; set; } = string.Empty;
    public string TemplateDesign { get; set; } = string.Empty;
}