using Application.Common;
using Application.Common.Interfaces;
using Domain.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.UserSubscriptions.Commands;

public class UpdateUserSubscriptionCommand : IRequest<Result>
{
    public Guid TenantId { get; set; }
    public int PlanId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public PlanType PlanType { get; set; }
}

public class UpdateUserSubscriptionCommandHandler : IRequestHandler<UpdateUserSubscriptionCommand, Result>
{
    private readonly IApplicationDbContext _dbContext;

    public UpdateUserSubscriptionCommandHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result> Handle(UpdateUserSubscriptionCommand request, CancellationToken cancellationToken)
    {
        var type = 0;
        var reportsLimit = 0;
        var templatesLimit = 0;
        var discountPercentage = 0;
        
        switch (request.PlanType)
        {
            case PlanType.Monthly:
                type = 0;
                break;
            case PlanType.Yearly:
                type = 1;
                break;
        }
        
        var paymentPlan = await _dbContext.PricingPlan.Where(p => p.Id == request.PlanId).FirstOrDefaultAsync(cancellationToken);

        if (paymentPlan == null)
        {
            return Result.Failure("Payment plan not found");
        }

        if (paymentPlan.PlanName == "Free")
        {
            reportsLimit = 10;
            templatesLimit = 5;
            discountPercentage = 0;
            type = 0;
        } 
        else if (paymentPlan.PlanName == "Professional")
        {
            reportsLimit = type == 1 ? 50*12 : 50;
            templatesLimit = type == 1 ? 50*12 : 50;
            discountPercentage = 5;
        } 
        else if (paymentPlan.PlanName == "Enterprise")
        {
            reportsLimit = -1;
            templatesLimit = -1;
            discountPercentage = 100;
        }
        
        var subscription = await _dbContext.UserSubscription
            .FirstOrDefaultAsync(s => s.TenantId == request.TenantId, cancellationToken);

        if (subscription == null)
        {
            return Result.Failure($"User subscription with tenant id {request.TenantId} was not found");
        }

        subscription.PlanId = request.PlanId;
        subscription.PlanName = request.PlanName;
        subscription.StartDate = DateTime.Now;
        subscription.EndDate = DateTime.Now.AddMonths(type == 0 ? 1 : 12);
        subscription.IsActive = true;
        subscription.ReportsLimit = reportsLimit;
        subscription.TemplatesLimit = templatesLimit;
        subscription.DiscountPercentage = discountPercentage;
        subscription.LastModifiedAt = DateTime.Now;

        _dbContext.UserSubscription.Update(subscription);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success("User subscription updated successfully");
    }
}