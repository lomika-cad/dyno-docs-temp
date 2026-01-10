namespace Application.Common.Interfaces;

public interface IPlaceExcelService
{
    Task<(int successCount, int skippedCount, List<string> errors)> ProcessExcelFileAsync(Stream stream, CancellationToken cancellationToken);
}