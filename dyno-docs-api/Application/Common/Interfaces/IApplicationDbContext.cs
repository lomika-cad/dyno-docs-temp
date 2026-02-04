using Domain.Common;
using Domain.Entities.Identity;
using Domain.Entities.Operations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace Application.Common.Interfaces;

public interface IApplicationDbContext
{
    #region DbSets

    DbSet<Place> Places { get; }
    DbSet<PricingPlan> PricingPlan { get; }
    DbSet<Partnership> Partnership { get; }
    DbSet<Template> Template { get; }
    DbSet<PromoCode> PromoCode { get; }
    DbSet<UserTemplate> UserTemplate { get; }
    DbSet<User> Users { get; }
    DbSet<Tenant> Tenants { get; }
    DbSet<Subscription> Subscriptions { get; }

    #endregion

    #region Methods

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);

    #endregion

    DatabaseFacade Database { get; }
}