using System.ComponentModel.DataAnnotations;
using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;

namespace Application.UserStories.Operations.Places.Commands;

public class UploadPlacesExcelCommand : IRequest<Result>
{
    [Required]
    public required IFormFile File { get; set; }
}

public class UploadPlacesExcelCommandHandler : IRequestHandler<UploadPlacesExcelCommand, Result>
{
    private readonly IPlaceExcelService _placeExcelService;

    public UploadPlacesExcelCommandHandler(IPlaceExcelService placeExcelService)
    {
        _placeExcelService = placeExcelService;
    }

    public async Task<Result> Handle(UploadPlacesExcelCommand request, CancellationToken cancellationToken)
    {
        if (request.File.Length == 0)
        {
            return Result.Failure("No file uploaded");
        }

        if (!request.File.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
        {
            return Result.Failure("Invalid file format. Only .xlsx files are supported");
        }

        try
        {
            using var stream = new MemoryStream();
            await request.File.CopyToAsync(stream, cancellationToken);
            stream.Position = 0;

            var (successCount, skippedCount, errors) = await _placeExcelService.ProcessExcelFileAsync(stream, cancellationToken);

            var message = $"Processed {successCount + skippedCount} rows. Success: {successCount}, Skipped: {skippedCount}";
            var result = Result.Success(message);
            
            if (errors.Any())
            {
                result.SetData(new { SuccessCount = successCount, SkippedCount = skippedCount, Errors = errors });
            }
            else
            {
                result.SetData(new { SuccessCount = successCount, SkippedCount = skippedCount });
            }

            return result;
        }
        catch (Exception ex)
        {
            return Result.Failure("Failed to process Excel file", ex.Message);
        }
    }
}
