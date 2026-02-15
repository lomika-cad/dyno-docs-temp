using Application.Common;
using Application.UserStories.Operations.UserSubscriptions.Commands;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UI.Controllers.Operations;

[ApiController]
[Route("api/operations/user-subscriptions")]
[Authorize]
public class UserSubscriptionController (IMediator mediator) : ControllerBase
{
    [HttpPut]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result>> UpdateSubscription([FromBody] UpdateUserSubscriptionCommand command)
    {
        var res = await mediator.Send(command);
        if (res.Succeeded)
        {
            return Ok(res);
        }
        return BadRequest(res);
    }
}