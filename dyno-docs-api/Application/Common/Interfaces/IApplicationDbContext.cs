using Microsoft.EntityFrameworkCore.Infrastructure;

namespace Application.Common.Interfaces;

public interface IApplicationDbContext
{
 
    
    #region Methods

    Task<int> SaveChangesAsync(CancellationToken cancellationToken);

    #endregion

    
    
    DatabaseFacade Database { get; }
}