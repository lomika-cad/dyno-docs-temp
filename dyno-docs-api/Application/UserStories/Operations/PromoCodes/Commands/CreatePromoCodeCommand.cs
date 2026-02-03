using Application.Common;
using Application.Common.Interfaces;
using Domain.Entities.Operations;
using MediatR;

namespace Application.UserStories.Operations.PromoCodes.Commands;

public class CreatePromoCodeCommand : IRequest<Result>
{
    public required string Code { get; set; }
    public string? Description { get; set; }
    public decimal DiscountPercentage { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal? MinimumPurchaseAmount { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public DateTime ValidFrom { get; set; }
    public DateTime ValidTo { get; set; }
    public int? MaxUsageCount { get; set; }
    public bool IsActive { get; set; } = true;
}

public class CreatePromoCodeCommandHandler : IRequestHandler<CreatePromoCodeCommand, Result>
{
    private readonly IApplicationDbContext _dbContext;

    public CreatePromoCodeCommandHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result> Handle(CreatePromoCodeCommand request, CancellationToken cancellationToken)
    {
        var entity = new PromoCode
        {
            Code = request.Code.ToUpperInvariant(),
            Description = request.Description,
            DiscountPercentage = request.DiscountPercentage,
            DiscountAmount = request.DiscountAmount,
            MinimumPurchaseAmount = request.MinimumPurchaseAmount,
            MaxDiscountAmount = request.MaxDiscountAmount,
            ValidFrom = request.ValidFrom,
            ValidTo = request.ValidTo,
            MaxUsageCount = request.MaxUsageCount,
            IsActive = request.IsActive,
            CurrentUsageCount = 0
        };

        _dbContext.PromoCode.Add(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success("Promo code created successfully");
    }
}
