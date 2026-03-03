using Application.UserStories.Operations.Dashboard.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UI.Controllers.Operations;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public class DashboardController (IMediator mediator) : ControllerBase
{
    [HttpGet("stats/{tenantId}")]
    public async Task<IActionResult> GetStats(Guid tenantId, CancellationToken cancellationToken)
    {
        var query = new GetStatsQuery { TenantId = tenantId };
        var result = await mediator.Send(query, cancellationToken);
        return Ok(result);
    }
}