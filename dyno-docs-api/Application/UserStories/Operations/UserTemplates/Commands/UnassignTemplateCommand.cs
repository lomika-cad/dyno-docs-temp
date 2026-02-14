using Application.Common;
using Application.Common.Interfaces;
using Application.UserStories.Operations.UserSubscriptions.Commands;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneOf.Types;

namespace Application.UserStories.Operations.UserTemplates.Commands;

public class UnassignTemplateCommand : IRequest<Result>
{
    public Guid TemplateId { get; set; }
    public Guid UserId { get; set; }
    public Guid TenantId { get; set; }
}

public class UnassignTemplateCommandHandler : IRequestHandler<UnassignTemplateCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly IMediator _mediator;

    public UnassignTemplateCommandHandler(IApplicationDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task<Result> Handle(UnassignTemplateCommand request, CancellationToken cancellationToken)
    {
        var userTemplate = await _context.UserTemplate
            .FirstOrDefaultAsync(ut => ut.TemplateId == request.TemplateId && ut.UserId == request.UserId, cancellationToken);

        if (userTemplate == null)
        {
            return Result.Failure("Template assignment not found for the specified user.");
        }

        _context.UserTemplate.Remove(userTemplate);

        var query = new UpdateTemplateLimitCommand()
        {
            TenantId = request.TenantId,
            ActionType = "Unassign",
        };
        
        await _mediator.Send(query, cancellationToken);
        
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success("Template unassigned from user successfully.");
    }
}