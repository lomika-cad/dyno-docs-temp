using Application.Common;
using Application.UserStories.Operations.Places;
using Application.UserStories.Operations.Places.Requests;
using Application.UserStories.Operations.Places.Responses;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using UI.Requests;

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
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result>> Create([FromForm] PlaceFormRequest request, CancellationToken cancellationToken)
    {
        var appRequest = await MapToPlaceRequest(request);

        var result = await _placeService.CreateAsync(appRequest, cancellationToken);

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
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(Result), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Result), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<Result>> Update([FromRoute] Guid id, [FromBody] PlaceRequestUpdate request,
        CancellationToken cancellationToken)
    {
        var appRequest = new PlaceRequest
        {
            Name = request.Name,
            AverageVisitDuration = request.AverageVisitDuration,
            Description = request.Description,
            FunFact = request.FunFact,
            District = request.District,
            City = request.City
        };

        var result = await _placeService.UpdateAsync(id, appRequest, cancellationToken);

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

    private static async Task<PlaceRequest> MapToPlaceRequest(PlaceFormRequest form)
    {
        byte[]? ToBytes(IFormFile? file) => file == null || file.Length == 0 ? null : ReadAllBytes(file).GetAwaiter().GetResult();

        async Task<byte[]?> ReadAllBytes(IFormFile? file)
        {
            if (file == null || file.Length == 0) return null;
            using var ms = new MemoryStream();
            await file.CopyToAsync(ms);
            return ms.ToArray();
        }

        return new PlaceRequest
        {
            Name = form.Name,
            AverageVisitDuration = form.AverageVisitDuration,
            Description = form.Description,
            FunFact = form.FunFact,
            District = form.District,
            City = form.City,
            Image1 = ToBytes(form.Image1),
            Image2 = ToBytes(form.Image2),
            Image3 = ToBytes(form.Image3),
            Image4 = ToBytes(form.Image4),
            Image5 = ToBytes(form.Image5)
        };
    }
}
