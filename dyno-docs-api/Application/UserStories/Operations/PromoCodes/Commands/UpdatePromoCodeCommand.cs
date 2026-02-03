using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.PromoCodes.Commands;

public class UpdatePromoCodeCommand : IRequest<Result>
{
    public Guid Id { get; set; }
    public required string Code { get; set; }
    public string? Description { get; set; }
    public decimal DiscountPercentage { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal? MinimumPurchaseAmount { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
    public int? MaxUsageCount { get; set; }
    public bool IsActive { get; set; }
}

public class UpdatePromoCodeCommandHandler : IRequestHandler<UpdatePromoCodeCommand, Result>
{
    private readonly IApplicationDbContext _dbContext;

    public UpdatePromoCodeCommandHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result> Handle(UpdatePromoCodeCommand request, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.PromoCode
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (entity == null)
        {
            return Result.Failure("Promo code not found");
        }

        entity.Code = request.Code.ToUpperInvariant();
        entity.Description = request.Description;
        entity.DiscountPercentage = request.DiscountPercentage;
        entity.DiscountAmount = request.DiscountAmount;
        entity.MinimumPurchaseAmount = request.MinimumPurchaseAmount;
        entity.MaxDiscountAmount = request.MaxDiscountAmount;
        entity.ValidFrom = request.ValidFrom;
        entity.ValidTo = request.ValidTo;
        entity.MaxUsageCount = request.MaxUsageCount;
        entity.IsActive = request.IsActive;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success("Promo code updated successfully");
    }
}
