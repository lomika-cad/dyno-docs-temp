using Microsoft.AspNetCore.Http;

namespace Application.Common.Interfaces;

public interface IDropBoxService
{
    Task<string> UploadImageAsync(IFormFile file, string folderPath);
    
    Task<Result> DeleteImageAsync(string imageUrl);
}