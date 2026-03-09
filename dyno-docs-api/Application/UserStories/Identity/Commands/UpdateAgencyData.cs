using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Identity.Commands;

public class UpdateAgencyData : IRequest<Result>
{
    public Guid TenantId { get; set; }
    public string AgencyName { get; set; } = string.Empty;
    public string ContactNo { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}

public class UpdateAgencyDataHandler (IApplicationDbContext dbContext) : IRequestHandler<UpdateAgencyData, Result>
{
    public async Task<Result> Handle(UpdateAgencyData request, CancellationToken cancellationToken)
    {
        var tenant = await dbContext.Tenants.Where(t => t.Id == request.TenantId).FirstOrDefaultAsync(cancellationToken);
        if (tenant == null)
        {
            return Result.Failure("Tenant not found.");
        }

        tenant.AgencyName = request.AgencyName;
        tenant.ContactNo = request.ContactNo;
        tenant.AgencyAddress = request.Address;

        dbContext.Tenants.Update(tenant);
        await dbContext.SaveChangesAsync(cancellationToken);
        
        return Result.Success("Agency data updated successfully.");
    }
}