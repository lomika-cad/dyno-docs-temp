using Application.Common;
using Application.UserStories.Operations.PromoCodes.Commands;
using Application.UserStories.Operations.PromoCodes.Queries;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace UI.Controllers.Operations;

[ApiController]
[Route("api/operations/promo-codes")]
public class PromoCodeController(IMediator mediator) : ControllerBase
{
    /// <summary>
    /// Get all promo codes
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<PromoCode>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<PromoCode>>> GetAll(CancellationToken cancellationToken)
    {
        var query = new GetPromoCodesQuery();
        var promoCodes = await mediator.Send(query, cancellationToken);
        return Ok(promoCodes);
    }

    /// <summary>
    /// Get all active and valid promo codes
    /// </summary>
    [HttpGet("active")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(List<PromoCode>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<PromoCode>>> GetActive(CancellationToken cancellationToken)
    {
        var query = new GetActivePromoCodesQuery();
        var promoCodes = await mediator.Send(query, cancellationToken);
        return Ok(promoCodes);
    }

    /// <summary>
    /// Get a promo code by ID
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(PromoCode), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PromoCode>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var query = new GetPromoCodeByIdQuery { Id = id };
        var promoCode = await mediator.Send(query, cancellationToken);
        
        if (promoCode == null)
        {
            return NotFound();
        }
        
        return Ok(promoCode);
    }

    /// <summary>
    /// Create a new promo code
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Result), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result>> Create([FromBody] CreatePromoCodeCommand command, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        
        if (result.Succeeded)
        {
            return StatusCode(StatusCodes.Status201Created, result);
        }
        
        return BadRequest(result);
    }

    /// <summary>
    /// Update an existing promo code
    /// </summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Result>> Update(Guid id, [FromBody] UpdatePromoCodeCommand command, CancellationToken cancellationToken)
    {
        command.Id = id;
        var result = await mediator.Send(command, cancellationToken);
        
        if (!result.Succeeded && result.Message == "Promo code not found")
        {
            return NotFound(result);
        }
        
        if (result.Succeeded)
        {
            return Ok(result);
        }
        
        return BadRequest(result);
    }

    /// <summary>
    /// Delete a promo code
    /// </summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<Result>> Delete(Guid id, CancellationToken cancellationToken)
    {
        var command = new DeletePromoCodeCommand { Id = id };
        var result = await mediator.Send(command, cancellationToken);
        
        if (!result.Succeeded && result.Message == "Promo code not found")
        {
            return NotFound(result);
        }
        
        return Ok(result);
    }

    /// <summary>
    /// Validate a promo code
    /// </summary>
    [HttpPost("validate")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ValidatePromoCodeResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<ValidatePromoCodeResult>> Validate([FromBody] ValidatePromoCodeCommand command, CancellationToken cancellationToken)
    {
        var result = await mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Apply a promo code (increment usage count)
    /// </summary>
    [HttpPost("{id:guid}/apply")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result>> Apply(Guid id, CancellationToken cancellationToken)
    {
        var command = new ApplyPromoCodeCommand { PromoCodeId = id };
        var result = await mediator.Send(command, cancellationToken);
        
        if (result.Succeeded)
        {
            return Ok(result);
        }
        
        return BadRequest(result);
    }
}
