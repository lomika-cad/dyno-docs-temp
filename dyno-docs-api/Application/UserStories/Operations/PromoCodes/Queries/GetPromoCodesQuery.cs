using Application.Common.Interfaces;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.PromoCodes.Queries;

public class GetPromoCodesQuery : IRequest<List<PromoCode>> { }

public class GetPromoCodesQueryHandler : IRequestHandler<GetPromoCodesQuery, List<PromoCode>>
{
    private readonly IApplicationDbContext _dbContext;

    public GetPromoCodesQueryHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<PromoCode>> Handle(GetPromoCodesQuery request, CancellationToken cancellationToken)
    {
        return await _dbContext.PromoCode
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
