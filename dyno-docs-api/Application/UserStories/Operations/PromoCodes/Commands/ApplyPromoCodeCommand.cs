using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.PromoCodes.Commands;

public class ApplyPromoCodeCommand : IRequest<Result>
{
    public Guid PromoCodeId { get; set; }
}

public class ApplyPromoCodeCommandHandler : IRequestHandler<ApplyPromoCodeCommand, Result>
{
    private readonly IApplicationDbContext _dbContext;

    public ApplyPromoCodeCommandHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result> Handle(ApplyPromoCodeCommand request, CancellationToken cancellationToken)
    {
        var promoCode = await _dbContext.PromoCode
            .FirstOrDefaultAsync(p => p.Id == request.PromoCodeId, cancellationToken);

        if (promoCode == null)
        {
            return Result.Failure("Promo code not found");
        }

        if (!promoCode.IsActive)
        {
            return Result.Failure("Promo code is not active");
        }

        if (promoCode.MaxUsageCount.HasValue && promoCode.CurrentUsageCount >= promoCode.MaxUsageCount.Value)
        {
            return Result.Failure("Promo code usage limit has been reached");
        }

        promoCode.CurrentUsageCount++;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success("Promo code applied successfully");
    }
}
