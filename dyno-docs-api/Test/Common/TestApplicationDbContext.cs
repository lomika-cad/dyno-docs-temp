using Application.Common.Interfaces;
using Domain.Common;
using Domain.Entities.Operations;
using Domain.Entities.Identity;
using Microsoft.EntityFrameworkCore;

namespace Test.Common;

public class TestApplicationDbContext : DbContext, IApplicationDbContext
{
    public TestApplicationDbContext(DbContextOptions<TestApplicationDbContext> options)
        : base(options)
    {
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
    public DbSet<UserSubscription> UserSubscription => Set<UserSubscription>();
    public DbSet<Customer> Customer => Set<Customer>();
    public DbSet<Report> Report => Set<Report>();

    #endregion

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

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

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var currentTime = DateTime.UtcNow;
        const string testUser = "test-user";
        var testTenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");

        foreach (var entry in ChangeTracker.Entries())
        {
            // Handle AuditableEntity (CreatedAt, CreatedBy, LastModifiedAt, LastModifiedBy)
            if (entry.Entity is AuditableEntity auditableEntity)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        auditableEntity.CreatedAt = currentTime;
                        auditableEntity.CreatedBy = testUser;
                        auditableEntity.LastModifiedAt = currentTime;
                        auditableEntity.LastModifiedBy = testUser;
                        break;
                    case EntityState.Modified:
                        auditableEntity.LastModifiedAt = currentTime;
                        auditableEntity.LastModifiedBy = testUser;
                        break;
                }
            }

            // Handle BaseEntity (TenantId)
            if (entry.Entity is BaseEntity baseEntity && entry.State == EntityState.Added && baseEntity.TenantId == Guid.Empty)
            {
                baseEntity.TenantId = testTenantId;
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}
