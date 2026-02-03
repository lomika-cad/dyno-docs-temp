using Application.Common.Interfaces;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.PromoCodes.Queries;

public class GetActivePromoCodesQuery : IRequest<List<PromoCode>> { }

public class GetActivePromoCodesQueryHandler : IRequestHandler<GetActivePromoCodesQuery, List<PromoCode>>
{
    private readonly IApplicationDbContext _dbContext;

    public GetActivePromoCodesQueryHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<PromoCode>> Handle(GetActivePromoCodesQuery request, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        
        return await _dbContext.PromoCode
            .Where(p => p.IsActive 
                && p.ValidFrom <= now 
                && p.ValidTo >= now
                && (!p.MaxUsageCount.HasValue || p.CurrentUsageCount < p.MaxUsageCount.Value))
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
