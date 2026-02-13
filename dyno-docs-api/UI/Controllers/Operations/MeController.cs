using Application.UserStories.Operations.UserSubscriptions.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UI.Controllers.Operations;

[ApiController]
[Route("api/me")]
[Authorize]
public class MeController (IMediator mediator) : ControllerBase
{
    [HttpGet("{tenantId}")]
    [ProducesResponseType(typeof(object), 200)]
    public async Task<IActionResult> GetMe(Guid tenantId, CancellationToken cancellationToken)
    {
        var query = new GetUserSubscriptionByTenantId()
        {
            TenantId = tenantId
        };
        var result = await mediator.Send(query, cancellationToken);
        return Ok(result);
    }
}