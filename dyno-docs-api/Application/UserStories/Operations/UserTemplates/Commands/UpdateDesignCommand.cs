using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using OneOf.Types;

namespace Application.UserStories.Operations.UserTemplates.Commands;

public class UpdateDesignCommand : IRequest<Result>
{
    public Guid UserId { get; set; }
    public Guid TemplateId { get; set; }
    public string TemplateDesign { get; set; } = string.Empty;
}

public class UpdateDesignCommandHandler : IRequestHandler<UpdateDesignCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public UpdateDesignCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(UpdateDesignCommand request, CancellationToken cancellationToken)
    {
        var userTemplate = await _context.UserTemplate
            .Where(ut => ut.UserId == request.UserId && ut.TemplateId == request.TemplateId)
            .FirstOrDefaultAsync(cancellationToken);

        if (userTemplate == null)
        {
            return Result.Failure("User template not found.");
        }

        userTemplate.TemplateDesign = request.TemplateDesign;

        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success("Template design updated successfully.");
    }
}