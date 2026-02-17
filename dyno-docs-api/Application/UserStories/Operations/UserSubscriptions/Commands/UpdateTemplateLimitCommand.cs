using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.UserSubscriptions.Commands;

public class UpdateTemplateLimitCommand : IRequest<Result>
{
    public Guid TenantId { get; set; }
    public string ActionType { get; set; }
}

public class UpdateTemplateLimitCommandHandler (IApplicationDbContext dbContext) : IRequestHandler<UpdateTemplateLimitCommand, Result>
{
    public async Task<Result> Handle(UpdateTemplateLimitCommand request, CancellationToken cancellationToken)
    {
        var existingSubscription = await dbContext.UserSubscription
            .FirstOrDefaultAsync(us => us.TenantId == request.TenantId, cancellationToken);

        if (existingSubscription == null)
        {
            return Result.Failure("UserSubscription not found");
        }
        
        if (request.ActionType == "Assign")
        {
            if (existingSubscription.TemplatesLimit <= 0)
            {
                return Result.Failure("No templates available to assign");
            }
            if (existingSubscription.PlanName != "Enterprise")
            {
                existingSubscription.TemplatesLimit -= 1;
            }
        }
        else if (request.ActionType == "Unassign")
        {
            if (existingSubscription.PlanName != "Enterprise")
            {
                existingSubscription.TemplatesLimit += 1;
            }
        }
        else
        {
            return Result.Failure("Invalid ActionType");
        }
        
        dbContext.UserSubscription.Update(existingSubscription);
        await dbContext.SaveChangesAsync(cancellationToken);
        
        return Result.Success("Template limit updated successfully");
    }
}