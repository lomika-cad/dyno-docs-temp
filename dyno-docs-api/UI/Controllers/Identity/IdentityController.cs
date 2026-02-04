using Application.UserStories.Identity.Commands;
using Application.UserStories.Identity.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using UI.Requests;

namespace UI.Controllers.Identity;

[ApiController]
[AllowAnonymous]
[Route("api/identity")]
public class IdentityController(IMediator mediator) : ControllerBase
{
    [HttpPost("register-agency")]
    [ProducesResponseType(typeof(Guid), 200)]
    [ProducesResponseType(typeof(string), 400)]
    public async Task<IActionResult> RegisterAgency([FromForm] AgencyRegistrationRequest request,
        CancellationToken cancellationToken)
    {
        var command = new RegisterAgencyCommand
        {
            AgencyName = request.AgencyName,
            BusinessRegNo = request.BusinessRegNo,
            ContactNo = request.ContactNo,
            Country = request.Country,
            State = request.State,
            City = request.City,
            AgencyAddress = request.AgencyAddress,
            AgencyLogo = request.AgencyLogo,
            FullName = request.FullName,
            NICNo = request.NICNo,
            MobileNo = request.MobileNo,
            Email = request.Email,
            Password = request.Password,
            ConfirmPassword = request.ConfirmPassword
        };

        var result = await mediator.Send(command, cancellationToken);
        return Ok(result);
    }


    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponse), 200)]
    [ProducesResponseType(typeof(string), 400)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var command = new LoginCommand
            {
                Email = request.Email,
                Password = request.Password
            };

            var response = await mediator.Send(command, cancellationToken);
            return Ok(response);
        }
        catch (Exception ex)
        {
            return BadRequest(ex.Message);
        }
    }
    
    [HttpGet("{tenantId}")]
    [ProducesResponseType(typeof(Domain.Entities.Identity.Tenant), 200)]
    [ProducesResponseType(typeof(string), 404)]
    public async Task<IActionResult> GetBusinessDetailsByTenantId([FromRoute] Guid tenantId,
        CancellationToken cancellationToken)
    {
        try
        {
            var query = new GetBusinessDetailsByTenantId
            {
                TenantId = tenantId
            };

            var tenant = await mediator.Send(query, cancellationToken);
            return Ok(tenant);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ex.Message);
        }
    }
}