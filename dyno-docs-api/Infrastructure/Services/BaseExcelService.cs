using Application.Common;
using Application.Common.Interfaces;
using AutoMapper;
using ClosedXML.Excel;
using Domain.Common;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public abstract class BaseExcelService<TEntity, TRequest, TResponse> : IBaseExcelService<TEntity, TRequest, TResponse>
    where TEntity : BaseEntity
    where TRequest : class
    where TResponse : class
{
    protected readonly IApplicationDbContext DbContext;
    protected readonly IMapper Mapper;
    protected readonly ICurrentUserService CurrentUserService;

    protected BaseExcelService(
        IApplicationDbContext dbContext,
        IMapper mapper,
        ICurrentUserService currentUserService)
    {
        DbContext = dbContext;
        Mapper = mapper;
        CurrentUserService = currentUserService;
    }

    protected abstract DbSet<TEntity> DbSet { get; }

    public async Task<Result> ProcessExcelFileAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        if (file.Length == 0)
        {
            return Result.Failure("File is empty");
        }

        if (!file.FileName.EndsWith(".xlsx", StringComparison.OrdinalIgnoreCase))
        {
            return Result.Failure("Invalid file format. Only .xlsx files are supported");
        }

        var errors = new List<string>();
        var successCount = 0;
        var skippedCount = 0;

        try
        {
            using var stream = new MemoryStream();
            await file.CopyToAsync(stream, cancellationToken);
            stream.Position = 0;

            using var workbook = new XLWorkbook(stream);
            var worksheet = workbook.Worksheet(1);

            // Extract images from worksheet mapped by row number
            var imagesByRow = ExtractImagesFromWorksheet(worksheet);

            var firstRowUsed = worksheet.FirstRowUsed();
            var lastRowUsed = worksheet.LastRowUsed();

            if (firstRowUsed == null || lastRowUsed == null)
            {
                return Result.Failure("Excel file is empty");
            }

            // Skip header row (assuming row 1 is header)
            var dataRows = worksheet.RowsUsed().Skip(1);

            var entitiesToAdd = new List<TEntity>();
            const int batchSize = 100;

            foreach (var row in dataRows)
            {
                try
                {
                    var rowNumber = row.RowNumber();
                    var images = imagesByRow.ContainsKey(rowNumber) ? imagesByRow[rowNumber] : new List<byte[]>();

                    var request = ParseRowToRequest(row, images);
                    
                    if (request != null)
                    {
                        var entity = Mapper.Map<TEntity>(request);
                        entity.Id = Guid.NewGuid();
                        entitiesToAdd.Add(entity);
                        successCount++;

                        // Batch insert
                        if (entitiesToAdd.Count >= batchSize)
                        {
                            await DbSet.AddRangeAsync(entitiesToAdd, cancellationToken);
                            await DbContext.SaveChangesAsync(cancellationToken);
                            entitiesToAdd.Clear();
                        }
                    }
                    else
                    {
                        skippedCount++;
                        errors.Add($"Row {rowNumber}: Invalid data or missing required fields");
                    }
                }
                catch (Exception ex)
                {
                    skippedCount++;
                    errors.Add($"Row {row.RowNumber()}: {ex.Message}");
                }
            }

            // Insert remaining entities
            if (entitiesToAdd.Any())
            {
                await DbSet.AddRangeAsync(entitiesToAdd, cancellationToken);
                await DbContext.SaveChangesAsync(cancellationToken);
            }

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

    /// <summary>
    /// Extract all images from worksheet and map them by row number
    /// </summary>
    protected Dictionary<int, List<byte[]>> ExtractImagesFromWorksheet(IXLWorksheet worksheet)
    {
        var imagesByRow = new Dictionary<int, List<byte[]>>();

        try
        {
            foreach (var picture in worksheet.Pictures)
            {
                var topLeftRow = picture.TopLeftCell.Address.RowNumber;
                
                using var memoryStream = new MemoryStream();
                picture.ImageStream.CopyTo(memoryStream);
                var imageBytes = memoryStream.ToArray();

                if (!imagesByRow.ContainsKey(topLeftRow))
                {
                    imagesByRow[topLeftRow] = new List<byte[]>();
                }

                imagesByRow[topLeftRow].Add(imageBytes);
            }
        }
        catch (Exception ex)
        {
            // Log error but continue processing
            Console.WriteLine($"Error extracting images: {ex.Message}");
        }

        return imagesByRow;
    }

    /// <summary>
    /// Parse a single Excel row to a request object
    /// </summary>
    /// <param name="row">The Excel row to parse</param>
    /// <param name="images">List of images associated with this row</param>
    /// <returns>Request object or null if row is invalid</returns>
    protected abstract TRequest? ParseRowToRequest(IXLRow row, List<byte[]> images);
}

