using Application.Common;

namespace Application.Common.Interfaces;

public interface IBaseCrudService<TEntity, TRequest, TResponse>
    where TEntity : class
    where TRequest : class
    where TResponse : class
{
    Task<IEnumerable<TResponse>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<TResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Result> CreateAsync(TRequest request, CancellationToken cancellationToken = default);
    Task<Result> UpdateAsync(Guid id, TRequest request, CancellationToken cancellationToken = default);
    Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}

