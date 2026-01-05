using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities.Operations;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class ApplicationDbContext : DbContext, IApplicationDbContext
{
    private readonly ICurrentUserService _currentUserService;
    private readonly ITenantService _tenantService;

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ICurrentUserService currentUserService,
        ITenantService tenantService)
        : base(options)
    {
        _currentUserService = currentUserService;
        _tenantService = tenantService;
    }

    #region DbSets

    public DbSet<Place> Places => Set<Place>();

    #endregion

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply global query filter for multi-tenancy on all entities inheriting from BaseEntity
        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            if (typeof(BaseEntity).IsAssignableFrom(entityType.ClrType))
            {
                var method = typeof(ApplicationDbContext)
                    .GetMethod(nameof(ApplyTenantQueryFilter), System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance)!
                    .MakeGenericMethod(entityType.ClrType);

                method.Invoke(this, new object[] { modelBuilder });
            }
        }
    }

    private void ApplyTenantQueryFilter<TEntity>(ModelBuilder modelBuilder) where TEntity : BaseEntity
    {
        modelBuilder.Entity<TEntity>().HasQueryFilter(e => e.TenantId == _tenantService.TenantId);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var currentTime = DateTime.UtcNow;
        var currentUser = _currentUserService.UserName ?? "system";
        var tenantId = _tenantService.TenantId;

        foreach (var entry in ChangeTracker.Entries())
        {
            // Handle AuditableEntity (CreatedAt, CreatedBy, LastModifiedAt, LastModifiedBy)
            if (entry.Entity is AuditableEntity auditableEntity)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        auditableEntity.CreatedAt = currentTime;
                        auditableEntity.CreatedBy = currentUser;
                        auditableEntity.LastModifiedAt = currentTime;
                        auditableEntity.LastModifiedBy = currentUser;
                        break;

                    case EntityState.Modified:
                        auditableEntity.LastModifiedAt = currentTime;
                        auditableEntity.LastModifiedBy = currentUser;
                        break;
                }
            }

            // Handle BaseEntity (TenantId)
            if (entry.Entity is BaseEntity baseEntity && entry.State == EntityState.Added)
            {
                baseEntity.TenantId = tenantId;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}