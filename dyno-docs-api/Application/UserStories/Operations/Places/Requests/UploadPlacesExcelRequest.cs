using Microsoft.AspNetCore.Http;

namespace Application.UserStories.Operations.Places.Requests;

public class UploadPlacesExcelRequest
{
    public IFormFile File { get; set; } = default!;
}