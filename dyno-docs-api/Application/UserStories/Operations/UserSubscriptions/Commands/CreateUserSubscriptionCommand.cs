using Application.Common;
using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.UserSubscriptions.Commands;

public class CreateUserSubscriptionCommand : IRequest<Result>
{
    public Guid TenantId { get; set; }
    public int PlanId { get; set; }
    public string PlanName { get; set; } = string.Empty;
    public PlanType PlanType { get; set; }
}

public class CreateUserSubscriptionCommandHandler : IRequestHandler<CreateUserSubscriptionCommand, Result>
{
    private readonly IApplicationDbContext _context;

    public CreateUserSubscriptionCommandHandler(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result> Handle(CreateUserSubscriptionCommand request, CancellationToken cancellationToken)
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
        
        var paymentPlan = await _context.PricingPlan.Where(p => p.Id == request.PlanId).FirstOrDefaultAsync(cancellationToken);

        if (paymentPlan == null)
        {
            return Result.Failure("Payment plan not found");
        }

        if (paymentPlan.PlanName == "Free")
        {
            reportsLimit = 10;
            templatesLimit = 5;
            discountPercentage = 0;
        } 
        else if (paymentPlan.PlanName == "Professional")
        {
            reportsLimit = 50;
            templatesLimit = 15;
            discountPercentage = 5;
        } 
        else if (paymentPlan.PlanName == "Enterprise")
        {
            reportsLimit = -1;
            templatesLimit = -1;
            discountPercentage = 100;
        }
        
        var userSubscription = new UserSubscription
        {
            TenantId = request.TenantId,
            PlanId = request.PlanId,
            PlanName = request.PlanName,
            StartDate = DateTime.Now,
            EndDate = DateTime.Now.AddMonths(type == 0 ? 1 : 12),
            IsActive = true,
            ReportsLimit = reportsLimit,
            TemplatesLimit = templatesLimit,
            DiscountPercentage = discountPercentage
        };

        _context.UserSubscription.Add(userSubscription);
        await _context.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}