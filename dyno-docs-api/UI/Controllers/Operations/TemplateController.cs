using Application.Common;
using Application.UserStories.Operations.Templates.Commands;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace UI.Controllers.Operations;

[ApiController]
[Route("api/operations/templates")]
public class TemplateController (IMediator mediator) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(Result), StatusCodes.Status201Created)]
    public async Task<ActionResult<Result>> CreateTemplate([FromForm] CreateTemplateCommand command)
    {
        var res = await mediator.Send(command);
        if (res.Succeeded)
        {
            return StatusCode(StatusCodes.Status201Created, res);
        }
        return BadRequest(res);
    }
}