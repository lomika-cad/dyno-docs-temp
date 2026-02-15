using System;
using Application.Common;
using Application.Common.Interfaces;
using Application.UserStories.Operations.UserSubscriptions.Commands;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.UserTemplates.Commands;

public class AssignTemplateCommand : IRequest<Result>
{
    public Guid UserId { get; set; }
    public Guid TemplateId { get; set; }
    public string TemplateDesign { get; set; } = string.Empty;
    public Guid TenantId { get; set; }
}

public class AssignTemplateCommandHandler : IRequestHandler<AssignTemplateCommand, Result>
{
    private readonly IApplicationDbContext _context;
    private readonly IMediator _mediator;

    public AssignTemplateCommandHandler(IApplicationDbContext context, IMediator mediator)
    {
        _context = context;
        _mediator = mediator;
    }

    public async Task<Result> Handle(AssignTemplateCommand request, CancellationToken cancellationToken)
    {
        var templateLimit = await _context.UserSubscription
            .Where(us => us.TenantId == request.TenantId)
            .Select(us => us.TemplatesLimit)
            .FirstOrDefaultAsync(cancellationToken);

        if (templateLimit == 0)
        {
            return Result.Failure("User has reached the maximum number of assigned templates.");
        }
        
        var existingAssignment = await _context.UserTemplate.Where(u => u.UserId == request.UserId && u.TemplateId == request.TemplateId)
            .FirstOrDefaultAsync(cancellationToken);
        
        if (existingAssignment != null)
        {
            return Result.Failure("Template is already assigned to the user.");
        }
        
        var userTemplate = new UserTemplate
        {
            UserId = request.UserId,
            TemplateId = request.TemplateId,
            TemplateDesign = request.TemplateDesign
        };

        _context.UserTemplate.Add(userTemplate);

        var query = new UpdateTemplateLimitCommand()
        {
            TenantId = request.TenantId,
            ActionType = "Assign",
        };
        
        await _mediator.Send(query, cancellationToken);
        
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success("Template assigned to user successfully.");
    }
}