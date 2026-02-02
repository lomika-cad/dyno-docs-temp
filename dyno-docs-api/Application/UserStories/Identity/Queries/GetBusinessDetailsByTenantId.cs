using Application.Common.Interfaces;
using Domain.Entities.Identity;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Identity.Queries;

public class GetBusinessDetailsByTenantId : IRequest<Tenant>
{
    public Guid TenantId { get; set; }
}

public class GetBusinessDetailsByTenantIdHandler : IRequestHandler<GetBusinessDetailsByTenantId, Tenant>
{
    private readonly IApplicationDbContext _dbContext;

    public GetBusinessDetailsByTenantIdHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Tenant> Handle(GetBusinessDetailsByTenantId request, CancellationToken cancellationToken)
    {
        var tenant = await _dbContext.Tenants
            .Where(t => t.Id == request.TenantId).FirstOrDefaultAsync(cancellationToken);

        if (tenant == null)
        {
            throw new KeyNotFoundException("Tenant not found");
        }

        return tenant;
    }
}