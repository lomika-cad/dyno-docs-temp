using Application.Common;
using Application.Common.Interfaces;
using Application.UserStories.Operations.Places.Requests;
using Application.UserStories.Operations.Places.Responses;
using Microsoft.AspNetCore.Http;

namespace Application.UserStories.Operations.Places;

public interface IPlaceService : IBaseCrudService<Domain.Entities.Operations.Place, PlaceRequest, PlaceResponse>
{
    Task<Result> UploadExcelAsync(IFormFile file, CancellationToken cancellationToken = default);
}

