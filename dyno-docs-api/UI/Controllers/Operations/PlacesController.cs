using Application.Common;
using Application.UserStories.Operations.Places;
using Application.UserStories.Operations.Places.Requests;
using Application.UserStories.Operations.Places.Responses;
using Microsoft.AspNetCore.Mvc;

namespace UI.Controllers.Operations;

[ApiController]
[Route("api/operations/places")]
public class PlacesController : ControllerBase
{
    private readonly IPlaceService _placeService;

    public PlacesController(IPlaceService placeService)
    {
        _placeService = placeService;
    }

    /// <summary>
    /// Create a new place
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(Result), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result>> Create([FromBody] PlaceRequest request, CancellationToken cancellationToken)
    {
        var result = await _placeService.CreateAsync(request, cancellationToken);

        if (result.Succeeded)
        {
            return StatusCode(StatusCodes.Status201Created, result);
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
        var places = await _placeService.GetAllAsync(cancellationToken);
        return Ok(places.ToList());
    }

    /// <summary>
    /// Get place by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(PlaceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<PlaceResponse>> GetById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var place = await _placeService.GetByIdAsync(id, cancellationToken);

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
    public async Task<ActionResult<Result>> Update([FromRoute] Guid id, [FromBody] PlaceRequest request, CancellationToken cancellationToken)
    {
        var result = await _placeService.UpdateAsync(id, request, cancellationToken);

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
        var result = await _placeService.DeleteAsync(id, cancellationToken);

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
    public async Task<ActionResult<Result>> UploadExcel(
        [FromForm] UploadPlacesExcelRequest request,
        CancellationToken cancellationToken)
    {
        if (request.File.Length == 0)
        {
            return BadRequest(Result.Failure("No file uploaded"));
        }

        var result = await _placeService.UploadExcelAsync(request.File, cancellationToken);

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
}

