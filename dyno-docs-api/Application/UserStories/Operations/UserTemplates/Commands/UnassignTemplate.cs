using Application.Common;
using Application.Common.Interfaces;
using Application.UserStories.Operations.UserSubscriptions.Commands;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneOf.Types;

namespace Application.UserStories.Operations.UserTemplates.Commands;

public class UnassignTemplate : IRequest<Result>
{
    public Guid TemplateId { get; set; }
    public Guid UserId { get; set; }
    public Guid TenantId { get; set; }
}

public class UnassignTemplateHandler(IApplicationDbContext context, IMediator mediator)
    : IRequestHandler<UnassignTemplate, Result>
{
    public async Task<Result> Handle(UnassignTemplate request, CancellationToken cancellationToken)
    {
        var userTemplate = await context.UserTemplate
            .FirstOrDefaultAsync(ut => ut.TemplateId == request.TemplateId && ut.UserId == request.UserId, cancellationToken);

        if (userTemplate == null)
        {
            return Result.Failure("Template assignment not found for the specified user.");
        }

        context.UserTemplate.Remove(userTemplate);

        var query = new UpdateTemplateLimitCommand()
        {
            TenantId = request.TenantId,
            ActionType = "Unassign",
        };
        
        await mediator.Send(query, cancellationToken);
        
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success("Template unassigned from user successfully.");
    }
}