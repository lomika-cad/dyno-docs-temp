using Application.Common.Interfaces;
using Application.UserStories.Operations.Places.Requests;
using Application.UserStories.Operations.Places.Responses;
using AutoMapper;
using ClosedXML.Excel;
using Domain.Entities.Operations;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class PlaceExcelService : BaseExcelService<Place, PlaceRequest, PlaceResponse>
{
    public PlaceExcelService(
        IApplicationDbContext dbContext,
        IMapper mapper,
        ICurrentUserService currentUserService)
        : base(dbContext, mapper, currentUserService)
    {
    }

    protected override DbSet<Place> DbSet => DbContext.Places;

    protected override PlaceRequest? ParseRowToRequest(IXLRow row, List<byte[]> images)
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

            var request = new PlaceRequest
            {
                District = district,
                City = city,
                Name = name,
                AverageVisitDuration = averageVisitDuration,
                Description = string.IsNullOrWhiteSpace(description) ? null : description,
                FunFact = string.IsNullOrWhiteSpace(funFact) ? null : funFact
            };

            // Assign images (up to 5)
            if (images.Count > 0) request.Image1 = images[0];
            if (images.Count > 1) request.Image2 = images[1];
            if (images.Count > 2) request.Image3 = images[2];
            if (images.Count > 3) request.Image4 = images[3];
            if (images.Count > 4) request.Image5 = images[4];

            return request;
        }
        catch
        {
            return null;
        }
    }
}

