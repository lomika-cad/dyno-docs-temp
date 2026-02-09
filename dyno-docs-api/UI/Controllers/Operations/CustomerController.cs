using Application.Common;
using Application.UserStories.Operations.Customers.Commands;
using Application.UserStories.Operations.Customers.Queries;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.AspNetCore.Mvc;

namespace UI.Controllers.Operations;

[ApiController]
[Route("api/operations/customers")]
public class CustomerController (IMediator mediator) : ControllerBase
{
    [HttpPost]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    public async Task<ActionResult<Result>> CreateCustomer([FromBody] CreateCustomerCommand command)
    {
        var res = await mediator.Send(command);
        if (res.Succeeded)
        {
            return Ok(res);
        }
        return BadRequest(res);
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<Customer>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<Customer>>> GetCustomers()
    {
        var query = new GetCustomersQuery();
        var customers = await mediator.Send(query);
        return Ok(customers);
    }

    [HttpPut]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result>> UpdateCustomer([FromBody] UpdateCustomerCommand command)
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
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result>> DeleteCustomer(Guid id)
    {
        var res = await mediator.Send(new DeleteCustomerCommand { Id = id });
        if (res.Succeeded)
        {
            return Ok(res);
        }
        return BadRequest(res);
    }
}