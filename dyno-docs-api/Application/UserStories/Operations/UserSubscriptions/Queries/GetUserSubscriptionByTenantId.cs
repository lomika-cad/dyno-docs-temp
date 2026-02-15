using Application.Common.Interfaces;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.UserSubscriptions.Queries;

public class GetUserSubscriptionByTenantId : IRequest<UserSubscription>
{
    public Guid TenantId { get; set; }
}

public class GetUserSubscriptionByTenantIdHandler : IRequestHandler<GetUserSubscriptionByTenantId, UserSubscription>
{
    private readonly IApplicationDbContext _dbContext;

    public GetUserSubscriptionByTenantIdHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<UserSubscription> Handle(GetUserSubscriptionByTenantId request, CancellationToken cancellationToken)
    {
        var subscriptions = await _dbContext.UserSubscription
            .Where(s => s.EndDate < DateTime.UtcNow && s.IsActive) 
            .ToListAsync(cancellationToken);

        foreach (var s in subscriptions)
        {
            s.IsActive = false;
            _dbContext.UserSubscription.Update(s);
        }
        
        await _dbContext.SaveChangesAsync(cancellationToken);
        
        var subscription = await _dbContext.UserSubscription
            .FirstOrDefaultAsync(s => s.TenantId == request.TenantId, cancellationToken);

        if (subscription == null)
        {
            throw new ApplicationException($"User subscription with id {request.TenantId} was not found");
        }

        return subscription;
    }
}