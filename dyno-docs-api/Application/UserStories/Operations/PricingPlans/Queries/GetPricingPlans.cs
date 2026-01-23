using Application.Common.Interfaces;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.PricingPlans.Queries;

public class GetPricingPlans : IRequest<List<PricingPlan>> {}

public class GetPricingPlansHandler(IApplicationDbContext context) : IRequestHandler<GetPricingPlans, List<PricingPlan>>
{
    public async Task<List<PricingPlan>> Handle(GetPricingPlans request, CancellationToken cancellationToken)
    {
        return await context.PricingPlan.ToListAsync(cancellationToken);
    }
}