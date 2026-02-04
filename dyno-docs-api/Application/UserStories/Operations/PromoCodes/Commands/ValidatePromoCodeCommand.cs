using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.PromoCodes.Commands;

public class ValidatePromoCodeCommand : IRequest<ValidatePromoCodeResult>
{
    public required string Code { get; set; }
    public decimal? PurchaseAmount { get; set; }
}

public class ValidatePromoCodeResult
{
    public bool IsValid { get; set; }
    public string? Message { get; set; }
    public decimal? DiscountPercentage { get; set; }
    public decimal? DiscountAmount { get; set; }
    public decimal? CalculatedDiscount { get; set; }
    public Guid? PromoCodeId { get; set; }
}

public class ValidatePromoCodeCommandHandler : IRequestHandler<ValidatePromoCodeCommand, ValidatePromoCodeResult>
{
    private readonly IApplicationDbContext _dbContext;

    public ValidatePromoCodeCommandHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ValidatePromoCodeResult> Handle(ValidatePromoCodeCommand request, CancellationToken cancellationToken)
    {
        var code = request.Code.ToUpperInvariant();
        var promoCode = await _dbContext.PromoCode
            .FirstOrDefaultAsync(p => p.Code == code, cancellationToken);

        if (promoCode == null)
        {
            return new ValidatePromoCodeResult
            {
                IsValid = false,
                Message = "Promo code not found"
            };
        }

        if (!promoCode.IsActive)
        {
            return new ValidatePromoCodeResult
            {
                IsValid = false,
                Message = "Promo code is not active"
            };
        }

        var now = DateTime.UtcNow;
        if (now < promoCode.ValidFrom)
        {
            return new ValidatePromoCodeResult
            {
                IsValid = false,
                Message = "Promo code is not yet valid"
            };
        }

        if (now > promoCode.ValidTo)
        {
            return new ValidatePromoCodeResult
            {
                IsValid = false,
                Message = "Promo code has expired"
            };
        }

        if (promoCode.MaxUsageCount.HasValue && promoCode.CurrentUsageCount >= promoCode.MaxUsageCount.Value)
        {
            return new ValidatePromoCodeResult
            {
                IsValid = false,
                Message = "Promo code usage limit has been reached"
            };
        }

        if (promoCode.MinimumPurchaseAmount.HasValue && request.PurchaseAmount.HasValue 
            && request.PurchaseAmount.Value < promoCode.MinimumPurchaseAmount.Value)
        {
            return new ValidatePromoCodeResult
            {
                IsValid = false,
                Message = $"Minimum purchase amount of {promoCode.MinimumPurchaseAmount:C} is required"
            };
        }

        // Calculate discount
        decimal? calculatedDiscount = null;
        if (request.PurchaseAmount.HasValue)
        {
            if (promoCode.DiscountAmount.HasValue)
            {
                calculatedDiscount = promoCode.DiscountAmount.Value;
            }
            else if (promoCode.DiscountPercentage > 0)
            {
                calculatedDiscount = request.PurchaseAmount.Value * (promoCode.DiscountPercentage / 100);
            }

            // Apply max discount cap if set
            if (calculatedDiscount.HasValue && promoCode.MaxDiscountAmount.HasValue 
                && calculatedDiscount.Value > promoCode.MaxDiscountAmount.Value)
            {
                calculatedDiscount = promoCode.MaxDiscountAmount.Value;
            }
        }

        return new ValidatePromoCodeResult
        {
            IsValid = true,
            Message = "Promo code is valid",
            DiscountPercentage = promoCode.DiscountPercentage,
            DiscountAmount = promoCode.DiscountAmount,
            CalculatedDiscount = calculatedDiscount,
            PromoCodeId = promoCode.Id
        };
    }
}
