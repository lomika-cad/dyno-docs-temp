using Application.Common;
using Application.Common.Interfaces;
using AutoMapper;
using Domain.Common;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Services;

public class BaseCrudService<TEntity, TRequest, TResponse> : IBaseCrudService<TEntity, TRequest, TResponse>
    where TEntity : BaseEntity
    where TRequest : class
    where TResponse : class
{
    protected readonly IApplicationDbContext DbContext;
    protected readonly IMapper Mapper;
    protected readonly ICurrentUserService CurrentUserService;
    protected readonly ITenantService TenantService;

    public BaseCrudService(
        IApplicationDbContext dbContext,
        IMapper mapper,
        ICurrentUserService currentUserService,
        ITenantService tenantService)
    {
        DbContext = dbContext;
        Mapper = mapper;
        CurrentUserService = currentUserService;
        TenantService = tenantService;
    }

    protected virtual DbSet<TEntity> DbSet => DbContext.GetType().GetProperty(typeof(TEntity).Name + "s")?.GetValue(DbContext) as DbSet<TEntity>
        ?? throw new InvalidOperationException($"DbSet for {typeof(TEntity).Name} not found");

    public virtual async Task<IEnumerable<TResponse>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var entities = await DbSet.ToListAsync(cancellationToken);
        return Mapper.Map<IEnumerable<TResponse>>(entities);
    }

    public virtual async Task<TResponse?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var entity = await DbSet.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
        return entity == null ? null : Mapper.Map<TResponse>(entity);
    }

    public virtual async Task<Result> CreateAsync(TRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = Mapper.Map<TEntity>(request);
            entity.Id = Guid.NewGuid();

            await DbSet.AddAsync(entity, cancellationToken);
            await DbContext.SaveChangesAsync(cancellationToken);

            var response = Mapper.Map<TResponse>(entity);
            var result = Result.Success($"{typeof(TEntity).Name} created successfully");
            result.SetData(response);
            return result;
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to create {typeof(TEntity).Name}", ex.Message);
        }
    }

    public virtual async Task<Result> UpdateAsync(Guid id, TRequest request, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await DbSet.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
            if (entity == null)
            {
                return Result.Failure($"{typeof(TEntity).Name} not found");
            }

            Mapper.Map(request, entity);
            await DbContext.SaveChangesAsync(cancellationToken);

            var response = Mapper.Map<TResponse>(entity);
            var result = Result.Success($"{typeof(TEntity).Name} updated successfully");
            result.SetData(response);
            return result;
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to update {typeof(TEntity).Name}", ex.Message);
        }
    }

    public virtual async Task<Result> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var entity = await DbSet.FirstOrDefaultAsync(e => e.Id == id, cancellationToken);
            if (entity == null)
            {
                return Result.Failure($"{typeof(TEntity).Name} not found");
            }

            DbSet.Remove(entity);
            await DbContext.SaveChangesAsync(cancellationToken);

            return Result.Success($"{typeof(TEntity).Name} deleted successfully");
        }
        catch (Exception ex)
        {
            return Result.Failure($"Failed to delete {typeof(TEntity).Name}", ex.Message);
        }
    }
}

