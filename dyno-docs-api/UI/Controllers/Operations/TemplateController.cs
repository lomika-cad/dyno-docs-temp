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
[Route("api/operations/templates")]
public class TemplateController (IMediator mediator) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    public async Task<ActionResult<Result>> CreateTemplate([FromForm] CreateTemplateCommand command)
    {
        var res = await mediator.Send(command);
        if (res.Succeeded)
        {
            return StatusCode(StatusCodes.Status200OK, res);
        }
        return BadRequest(res);
    }
    
    [HttpGet]
    [ProducesResponseType(typeof(List<Template>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<Template>>> GetTemplates()
    {
        var query = new GetTemplatesQuery();
        var templates = await mediator.Send(query);
        return Ok(templates);
    }
    
    [HttpPut]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    public async Task<ActionResult<Result>> UpdateTemplate([FromForm] UpdateTemplateCommand command)
    {
        var res = await mediator.Send(command);
        if (res.Succeeded)
        {
            return Ok(res);
        }
        return BadRequest(res);
    }
    
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    public async Task<ActionResult<Result>> DeleteTemplate([FromRoute] Guid id)
    {
        var command = new DeleteTemplateCommand() { TemplateId = id };
        var res = await mediator.Send(command);
        if (res.Succeeded)
        {
            return Ok(res);
        }
        return BadRequest(res);
    }
    
    [HttpPost("assign-to-user")]
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