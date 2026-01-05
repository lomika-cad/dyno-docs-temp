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

    public async Task<Result> UploadExcelAsync(IFormFile file, CancellationToken cancellationToken = default)
    {
        return await _placeExcelService.ProcessExcelFileAsync(file, cancellationToken);
    }
}

