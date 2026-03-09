using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Templates.Commands;

public class DeleteTemplateCommand : IRequest<Result>
{
    public Guid TemplateId { get; set; }
}

public class DeleteTemplateCommandHandler(IApplicationDbContext dbContext): IRequestHandler<DeleteTemplateCommand, Result>
{
    public async Task<Result> Handle(DeleteTemplateCommand request, CancellationToken cancellationToken)
    {
        var existingTemplate = await dbContext.Template.Where(t => t.Id == request.TemplateId).FirstOrDefaultAsync(cancellationToken);
        
        if (existingTemplate == null)
        {
            return Result.Failure("Template not found.");
        }
        
        dbContext.Template.Remove(existingTemplate);
        await dbContext.SaveChangesAsync(cancellationToken);
        
        return Result.Success("Template deleted successfully.");
    }
}