using Domain.Entities.Operations;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;

namespace Application.Common.Interfaces;

public interface IApplicationDbContext
{
    #region DbSets

    DbSet<Place> Places { get; }
    DbSet<PricingPlan> PricingPlan { get; }

    #endregion

    #region Methods

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);

    #endregion

    DatabaseFacade Database { get; }
}