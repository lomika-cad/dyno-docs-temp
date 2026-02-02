using System;
using Application.Common;
using Application.Common.Interfaces;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.UserTemplates.Commands;

public class AssignTemplateCommand : IRequest<Result>
{
    public Guid UserId { get; set; }
    public Guid TemplateId { get; set; }
    public string TemplateDesign { get; set; } = string.Empty;
}

public class AssignTemplateCommandHandler : IRequestHandler<AssignTemplateCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public AssignTemplateCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(AssignTemplateCommand request, CancellationToken cancellationToken)
    {
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
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success("Template assigned to user successfully.");
    }
}