using Application.Common.Interfaces;
using ClosedXML.Excel;
using Domain.Entities.Operations;

namespace Infrastructure.Services;

public class PlaceExcelService : IPlaceExcelService
{
    private readonly IApplicationDbContext _dbContext;

    public PlaceExcelService(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<(int successCount, int skippedCount, List<string> errors)> ProcessExcelFileAsync(
        Stream fileStream, 
        CancellationToken cancellationToken = default)
    {
        var errors = new List<string>();
        var successCount = 0;
        var skippedCount = 0;

        try
        {
            using var workbook = new XLWorkbook(fileStream);
            var worksheet = workbook.Worksheet(1);

            // Extract images from worksheet mapped by row number
            var imagesByRow = ExtractImagesFromWorksheet(worksheet);

            var firstRowUsed = worksheet.FirstRowUsed();
            var lastRowUsed = worksheet.LastRowUsed();

            if (firstRowUsed == null || lastRowUsed == null)
            {
                errors.Add("Excel file is empty");
                return (0, 0, errors);
            }

            // Skip header row (assuming row 1 is header)
            var dataRows = worksheet.RowsUsed().Skip(1);

            var entitiesToAdd = new List<Place>();
            const int batchSize = 100;

            foreach (var row in dataRows)
            {
                try
                {
                    var rowNumber = row.RowNumber();
                    var images = imagesByRow.ContainsKey(rowNumber) ? imagesByRow[rowNumber] : new List<byte[]>();

                    var placeData = ParseRowToPlace(row, images);
                    
                    if (placeData != null)
                    {
                        entitiesToAdd.Add(placeData);
                        successCount++;

                        // Batch insert
                        if (entitiesToAdd.Count >= batchSize)
                        {
                            await _dbContext.Places.AddRangeAsync(entitiesToAdd, cancellationToken);
                            await _dbContext.SaveChangesAsync(cancellationToken);
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
                await _dbContext.Places.AddRangeAsync(entitiesToAdd, cancellationToken);
                await _dbContext.SaveChangesAsync(cancellationToken);
            }

            return (successCount, skippedCount, errors);
        }
        catch (Exception ex)
        {
            errors.Add($"Failed to process Excel file: {ex.Message}");
            return (0, 0, errors);
        }
    }

    /// <summary>
    /// Extract all images from worksheet and map them by row number
    /// </summary>
    private Dictionary<int, List<byte[]>> ExtractImagesFromWorksheet(IXLWorksheet worksheet)
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
    /// Parse a single Excel row to a Place entity
    /// </summary>
    /// <param name="row">The Excel row to parse</param>
    /// <param name="images">List of images associated with this row</param>
    /// <returns>Place entity or null if row is invalid</returns>
    private Place? ParseRowToPlace(IXLRow row, List<byte[]> images)
    {
        try
        {
            // Excel Column Order: District(A) | City(B) | Name(C) | Average Visit Duration(D) | Description(E) | Fun Fact(F) | Images(G)
            var district = row.Cell(1).GetString().Trim();
            var city = row.Cell(2).GetString().Trim();
            var name = row.Cell(3).GetString().Trim();
            var averageVisitDuration = row.Cell(4).GetString().Trim();
            var description = row.Cell(5).GetString().Trim();
            var funFact = row.Cell(6).GetString().Trim();

            // Validate required fields
            if (string.IsNullOrWhiteSpace(district) || 
                string.IsNullOrWhiteSpace(city) || 
                string.IsNullOrWhiteSpace(name) || 
                string.IsNullOrWhiteSpace(averageVisitDuration))
            {
                return null;
            }

            var place = new Place
            {
                Id = Guid.NewGuid(),
                District = district,
                City = city,
                Name = name,
                AverageVisitDuration = averageVisitDuration,
                Description = string.IsNullOrWhiteSpace(description) ? null : description,
                FunFact = string.IsNullOrWhiteSpace(funFact) ? null : funFact
            };

            // Assign images (up to 5)
            if (images.Count > 0) place.Image1 = images[0];
            if (images.Count > 1) place.Image2 = images[1];
            if (images.Count > 2) place.Image3 = images[2];
            if (images.Count > 3) place.Image4 = images[3];
            if (images.Count > 4) place.Image5 = images[4];

            return place;
        }
        catch
        {
            return null;
        }
    }
}
