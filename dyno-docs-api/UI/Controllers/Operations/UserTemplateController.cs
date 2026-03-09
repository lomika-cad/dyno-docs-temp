using Application.Common;
using Application.UserStories.Operations.Templates.Commands;
using Application.UserStories.Operations.Templates.Queries;
using Application.UserStories.Operations.UserTemplates.Commands;
using Application.UserStories.Operations.UserTemplates.Queries;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UI.Controllers.Operations;

[ApiController]
[Route("api/operations/user-templates")]
public class UserTemplateController (IMediator mediator) : ControllerBase
{
    [HttpPost("assign")]
    [Authorize]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    public async Task<ActionResult<Result>> AssignTemplateToUser([FromBody] AssignTemplate command)
    {
        var res = await mediator.Send(command);
        if (res.Succeeded)
        {
            return Ok(res);
        }
        return BadRequest(res);
    }
    
    [HttpGet("user-templates/{userId}")]
    [Authorize]
    [ProducesResponseType(typeof(List<UserTemplate>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<UserTemplate>>> GetUserTemplates([FromRoute] Guid userId)
    {
        var query = new GetUserTemplateList() { UserId = userId };
        var userTemplates = await mediator.Send(query);
        return Ok(userTemplates);
    }
    
    [HttpPost("unassign-from-user")]
    [Authorize]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    public async Task<ActionResult<Result>> UnassignTemplateFromUser([FromBody] UnassignTemplate command)
    {
        var res = await mediator.Send(command);
        if (res.Succeeded)
        {
            return Ok(res);
        }
        return BadRequest(res);
    }

    [HttpPut("update-design")]
    [Authorize]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    public async Task<ActionResult<Result>> UpdateTemplateDesign([FromBody] UpdateDesign command)
    {
        var res = await mediator.Send(command);
        if (res.Succeeded)
        {
            return Ok(res);
        }
        return BadRequest(res);
    }
}