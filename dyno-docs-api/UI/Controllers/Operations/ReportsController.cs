using Application.Common;
using Application.UserStories.Operations.Reports.Commands;
using Application.UserStories.Operations.Reports.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UI.Controllers.Operations;

[ApiController]
[Route("api/reports")]
[Authorize]
public class ReportsController (IMediator mediator) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportCommand command)
    {
        var result = await mediator.Send(command);
        if (result.Succeeded == true)
        {
            return Ok(result.Message);
        }
        return BadRequest(result.Message);
    }
    
    [HttpPut]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateReport([FromBody] UpdateReportCommand command)
    {
        var result = await mediator.Send(command);
        if (result.Succeeded == true)
        {
            return Ok(result.Message);
        }
        return BadRequest(result.Message);
    }
    
    [HttpGet("{tenantId}")]
    [ProducesResponseType(typeof(List<ReportsDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetReports(Guid tenantId)
    {
        var query = new GetReportsQuery { TenantId = tenantId };
        var reports = await mediator.Send(query);
        return Ok(reports);
    }
}