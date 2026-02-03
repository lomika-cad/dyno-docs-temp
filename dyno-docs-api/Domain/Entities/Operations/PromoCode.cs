using System.ComponentModel.DataAnnotations;
using Domain.Common;

namespace Domain.Entities.Operations;

public class PromoCode : BaseEntity
{
    [Required]
    [MaxLength(50)]
    public required string Code { get; set; }
    
    [MaxLength(255)]
    public string? Description { get; set; }
    
    /// <summary>
    /// Discount percentage (0-100)
    /// </summary>
    [Range(0, 100)]
    public decimal DiscountPercentage { get; set; }
    
    /// <summary>
    /// Fixed discount amount (alternative to percentage)
    /// </summary>
    public decimal? DiscountAmount { get; set; }
    
    /// <summary>
    /// Minimum purchase amount required to use this promo code
    /// </summary>
    public decimal? MinimumPurchaseAmount { get; set; }
    
    /// <summary>
    /// Maximum discount amount that can be applied
    /// </summary>
    public decimal? MaxDiscountAmount { get; set; }
    
    /// <summary>
    /// Start date when the promo code becomes valid
    /// </summary>
    public DateTime ValidFrom { get; set; }
    
    /// <summary>
    /// End date when the promo code expires
    /// </summary>
    public DateTime ValidTo { get; set; }
    
    /// <summary>
    /// Maximum number of times this promo code can be used (null = unlimited)
    /// </summary>
    public int? MaxUsageCount { get; set; }
    
    /// <summary>
    /// Current number of times this promo code has been used
    /// </summary>
    public int CurrentUsageCount { get; set; } = 0;
    
    /// <summary>
    /// Whether the promo code is currently active
    /// </summary>
    public bool IsActive { get; set; } = true;
}
