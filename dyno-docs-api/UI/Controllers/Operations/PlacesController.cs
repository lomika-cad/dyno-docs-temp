using Application.Common;
using Application.UserStories.Operations.Places.Commands;
using Application.UserStories.Operations.Places.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using UI.Requests;

namespace UI.Controllers.Operations;

[ApiController]
[Route("api/operations/places")]
[Authorize]
public class PlacesController : ControllerBase
{
    private readonly IMediator _mediator;

    public PlacesController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Create a new place
    /// </summary>
    [HttpPost]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result>> Create([FromForm] PlaceFormRequest request, CancellationToken cancellationToken)
    {
        var command = await MapToCreatePlaceCommand(request);
        var result = await _mediator.Send(command, cancellationToken);

        if (result.Succeeded)
        {
            return StatusCode(StatusCodes.Status200OK, result);
        }

        return BadRequest(result);
    }

    /// <summary>
    /// Get all places
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(List<PlaceResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<PlaceResponse>>> GetAll(CancellationToken cancellationToken)
    {
        var places = await _mediator.Send(new GetPlacesQuery(), cancellationToken);
        return Ok(places);
    }

    /// <summary>
    /// Get place by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(PlaceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PlaceResponse>> GetById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var place = await _mediator.Send(new GetPlaceByIdQuery(id), cancellationToken);

        if (place == null)
        {
            return NotFound();
        }

        return Ok(place);
    }

    /// <summary>
    /// Update a place
    /// </summary>
    [HttpPut("{id}")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result>> Update([FromRoute] Guid id, [FromBody] PlaceRequestUpdate request,
        CancellationToken cancellationToken)
    {
        var command = new UpdatePlaceCommand
        {
            Id = id,
            Name = request.Name,
            AverageVisitDuration = request.AverageVisitDuration,
            Description = request.Description,
            FunFact = request.FunFact,
            District = request.District,
            City = request.City
        };

        var result = await _mediator.Send(command, cancellationToken);

        if (result.Succeeded)
        {
            return Ok(result);
        }

        return BadRequest(result);
    }

    /// <summary>
    /// Delete a place
    /// </summary>
    [HttpDelete("{id}")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result>> Delete([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var command = new DeletePlaceCommand { Id = id };
        var result = await _mediator.Send(command, cancellationToken);

        if (result.Succeeded)
        {
            return Ok(result);
        }

        return BadRequest(result);
    }

    /// <summary>
    /// Upload places from Excel file
    /// </summary>
    [HttpPost("upload-excel")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result>> UploadExcel([FromForm] UploadPlacesExcelRequest file, CancellationToken cancellationToken)
    {
        var command = new UploadPlacesExcelCommand { File = file.File };
        var result = await _mediator.Send(command, cancellationToken);

        if (result.Succeeded)
        {
            return Ok(result);
        }

        return BadRequest(result);
    }

    /// <summary>
    /// Download Excel template for places
    /// </summary>
    [HttpGet("download-template")]
    [ProducesResponseType(typeof(FileResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult DownloadTemplate()
    {
        var templatePath = Path.Combine(Directory.GetCurrentDirectory(), "Templates", "places.xlsx");

        if (!System.IO.File.Exists(templatePath))
        {
            return NotFound("Template file not found");
        }

        var fileBytes = System.IO.File.ReadAllBytes(templatePath);
        return File(fileBytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "places_template.xlsx");
    }

    private static async Task<CreatePlaceCommand> MapToCreatePlaceCommand(PlaceFormRequest form)
    {
        async Task<byte[]?> ReadAllBytes(IFormFile? file)
        {
            if (file == null || file.Length == 0) return null;
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            return ms.ToArray();
        }

        return new CreatePlaceCommand
        {
            Name = form.Name,
            AverageVisitDuration = form.AverageVisitDuration,
            Description = form.Description,
            FunFact = form.FunFact,
            District = form.District,
            City = form.City,
            Image1 = await ReadAllBytes(form.Image1),
            Image2 = await ReadAllBytes(form.Image2),
            Image3 = await ReadAllBytes(form.Image3),
            Image4 = await ReadAllBytes(form.Image4),
            Image5 = await ReadAllBytes(form.Image5)
        };
    }
    
    public class UploadPlacesExcelRequest
    {
        public IFormFile File { get; set; } = default!;
    }
}
