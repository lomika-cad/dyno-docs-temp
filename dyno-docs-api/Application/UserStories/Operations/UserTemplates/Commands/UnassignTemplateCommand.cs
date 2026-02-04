using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneOf.Types;

namespace Application.UserStories.Operations.UserTemplates.Commands;

public class UnassignTemplateCommand : IRequest<Result>
{
    public Guid TemplateId { get; set; }
    public Guid UserId { get; set; }
}

public class UnassignTemplateCommandHandler : IRequestHandler<UnassignTemplateCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public UnassignTemplateCommandHandler(IApplicationDbContext context)
    {
        _context = context;
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
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success("Template unassigned from user successfully.");
    }
}