using Application.Common;
using Application.Common.Interfaces;
using Application.UserStories.Operations.Places;
using Application.UserStories.Operations.Places.Requests;
using Application.UserStories.Operations.Places.Responses;
using AutoMapper;
using Domain.Entities.Operations;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class PlaceService : BaseCrudService<Place, PlaceRequest, PlaceResponse>, IPlaceService
{
    private readonly PlaceExcelService _placeExcelService;

    public PlaceService(
        IApplicationDbContext dbContext,
        IMapper mapper,
        ICurrentUserService currentUserService,
        ITenantService tenantService,
        PlaceExcelService placeExcelService)
        : base(dbContext, mapper, currentUserService, tenantService)
    {
        _placeExcelService = placeExcelService;
    }

    protected override DbSet<Place> DbSet => DbContext.Places;

    public override async Task<Result> UpdateAsync(Guid id, PlaceRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await DbSet.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
            if (entity == null)
            {
                return Result.Failure($"{typeof(Place).Name} not found");
            }

            var preservedRequest = new PlaceRequest
            {
                Name = request.Name,
                AverageVisitDuration = request.AverageVisitDuration,
                Description = request.Description,
                FunFact = request.FunFact,
                District = request.District,
                City = request.City,
                Image1 = request.Image1 ?? entity.Image1,
                Image2 = request.Image2 ?? entity.Image2,
                Image3 = request.Image3 ?? entity.Image3,
                Image4 = request.Image4 ?? entity.Image4,
                Image5 = request.Image5 ?? entity.Image5
            };

            Mapper.Map(preservedRequest, entity);
            await DbContext.SaveChangesAsync(cancellationToken);

            var response = Mapper.Map<PlaceResponse>(entity);
            var result = Result.Success($"{typeof(Place).Name} updated successfully");
            result.SetData(response);
            return result;
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to update {typeof(Place).Name}", ex.Message);
        }
    }

    public async Task<Result> UploadExcelAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        return await _placeExcelService.ProcessExcelFileAsync(file, cancellationToken);
    }
}

