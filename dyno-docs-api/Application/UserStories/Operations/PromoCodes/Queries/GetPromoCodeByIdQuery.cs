using Application.Common.Interfaces;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.PromoCodes.Queries;

public class GetPromoCodeByIdQuery : IRequest<PromoCode?>
{
    public Guid Id { get; set; }
}

public class GetPromoCodeByIdQueryHandler : IRequestHandler<GetPromoCodeByIdQuery, PromoCode?>
{
    private readonly IApplicationDbContext _dbContext;

    public GetPromoCodeByIdQueryHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<PromoCode?> Handle(GetPromoCodeByIdQuery request, CancellationToken cancellationToken)
    {
        return await _dbContext.PromoCode
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);
    }
}
