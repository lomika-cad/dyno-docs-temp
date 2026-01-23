using Domain.Entities.Operations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UI.Controllers.Operations;

[ApiController]
[AllowAnonymous]
[Route("api/operations/pricing-plans")]
public class PricingPlanController (IMediator mediator) : ControllerBase
{
    [HttpGet]
    [ProducesResponseType(typeof(List<PricingPlan>), 200)]
    public async Task<IActionResult> GetAll(CancellationToken cancellationToken)
    {
        var plans = await mediator.Send(new Application.UserStories.Operations.PricingPlans.Queries.GetPricingPlans(), cancellationToken);
        return Ok(plans);
    }
}