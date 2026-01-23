using Application.Common.Interfaces;
using Domain.Entities.Operations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace UI.Controllers.Operations;

[ApiController]
[Route("api/operations/seed")]
public class SeedController : ControllerBase
{
    private readonly IApplicationDbContext _dbContext;

    public SeedController(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }
    
    [HttpPost("pricing-plan")]
    [ProducesResponseType(typeof(object), 200)]
    public async Task<IActionResult> Seed(CancellationToken cancellationToken)
    {
        var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var existing = await _dbContext.PricingPlan.ToListAsync(cancellationToken);
            
            if(existing.Any())
            {
                return Ok(new { Seeded = 0, Message = "Pricing plans already exist." });
            }

            var plans = new List<PricingPlan>
            {
                new PricingPlan
                {
                    PlanName = "Free",
                    Description = "Great for trying out DynoDocs component and templates.",
                    MonthlyPrice = 0m,
                    YearlyPrice = 0m,
                    Features = new[] { "Design Guidelines", "10 Reports Generation", "5 Templates Usage Limit" }
                },
                new PricingPlan
                {
                    PlanName = "Professional",
                    Description = "Best for professional freelancers and small teams.",
                    MonthlyPrice = 14.99m,
                    YearlyPrice = 125.91m,
                    Features = new[] { "Everything in Free", "50 Report Generation", "15 Templates Usage Limit", "5% Discount For Templates", "Enhanced Security" }
                },
                new PricingPlan
                {
                    PlanName = "Enterprise",
                    Description = "Best for growing large company or enterprise design team.",
                    MonthlyPrice = 99.99m,
                    YearlyPrice = 840.24m,
                    Features = new[] { "Everything in Free", "Unlimited Report Generation", "Unlimited Templates Usage", "100% Discount For Templates", "Priority Security" }
                }
            };

            _dbContext.PricingPlan.AddRange(plans);
            await _dbContext.SaveChangesAsync(cancellationToken);

            await transaction.CommitAsync(cancellationToken);

            return Ok(new { Seeded = plans.Count });
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken);
            throw;
        }
    }
}