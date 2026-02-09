using Application.Common;
using Application.UserStories.Operations.Partnerships.Commands;
using Application.UserStories.Operations.Partnerships.Queries;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace UI.Controllers.Operations;

[ApiController]
[Route("api/operations/partnerships")]
public class PartnershipController(IMediator mediator) : ControllerBase
{
    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePartnership([FromForm] CreatePartnershipCommand command)
    {
        var res = await mediator.Send(command);
        return Ok(res);
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<Partnership>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPartnerships()
    {
        var res = await mediator.Send(new GetPartnerships());
        return Ok(res);
    }

    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdatePartnership(Guid id, [FromBody] UpdatePartnershipCommand command)
    {
        if (id != command.Id)
        {
            return BadRequest(Result.Failure("Mismatched Partnership ID"));
        }

        var res = await mediator.Send(command);
        return Ok(res);
    }

    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> DeletePartnership(Guid id)
    {
        var command = new DeletePartnershipCommand { Id = id };
        var res = await mediator.Send(command);
        return Ok(res);
    }
}