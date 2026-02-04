using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities.Operations;
using Domain.Entities.Identity;
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
    public DbSet<PricingPlan> PricingPlan => Set<PricingPlan>();
    public DbSet<Partnership> Partnership => Set<Partnership>();
    public DbSet<Template> Template => Set<Template>();
    public DbSet<PromoCode> PromoCode => Set<PromoCode>();
    public DbSet<UserTemplate> UserTemplate => Set<UserTemplate>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Tenant> Tenants => Set<Tenant>();
    public DbSet<Subscription> Subscriptions => Set<Subscription>();
    
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
        
        modelBuilder.Entity<Template>()
            .Property(t => t.TemplateDesign)
            .HasColumnType("LONGTEXT");
            
        // Configure Tenant logo as large binary
        modelBuilder.Entity<Tenant>()
            .Property(t => t.AgencyLogo)
            .HasColumnType("LONGBLOB");
            
        // Configure Tenant as key
        modelBuilder.Entity<Tenant>()
            .HasKey(t => t.Id);
            
        // Configure one-to-one relationship between Tenant and Subscription
        modelBuilder.Entity<Tenant>()
            .HasOne(t => t.Subscription)
            .WithOne(s => s.Tenant)
            .HasForeignKey<Subscription>(s => s.TenantId);
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
            if (entry.Entity is BaseEntity baseEntity && entry.State == EntityState.Added && baseEntity.TenantId == Guid.Empty)
            {
                baseEntity.TenantId = tenantId;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}