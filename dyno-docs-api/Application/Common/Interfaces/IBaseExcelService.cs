using Microsoft.AspNetCore.Http;

namespace Application.Common.Interfaces;

public interface IBaseExcelService<TEntity, TRequest, TResponse>
    where TEntity : class
    where TRequest : class
    where TResponse : class
{
    Task<Result> ProcessExcelFileAsync(IFormFile file, CancellationToken cancellationToken = default);
}

