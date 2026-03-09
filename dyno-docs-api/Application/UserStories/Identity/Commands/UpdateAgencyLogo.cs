using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace Application.UserStories.Identity.Commands;

public class UpdateAgencyLogo : IRequest<Result>
{
    public Guid TenantId { get; set; }
    public required IFormFile Logo { get; set; }
}

public class UpdateAgencyLogoHandler (IApplicationDbContext dbContext) : IRequestHandler<UpdateAgencyLogo, Result>
{
    public async Task<Result> Handle(UpdateAgencyLogo request, CancellationToken cancellationToken)
    {
        var existingTenant = await dbContext.Tenants.Where(t => t.Id == request.TenantId).FirstOrDefaultAsync(cancellationToken);
        
        if (existingTenant == null)
        {
            return Result.Failure("Tenant not found.");
        }

        const long maxFileSize = 5 * 1024 * 1024; // 5MB
        if (request.Logo.Length == 0)
        {
            return Result.Failure("No logo file provided.");
        }

        if (request.Logo.Length > maxFileSize)
        {
            return Result.Failure("Logo file size exceeds 5MB limit.");
        }

        byte[] logoBytes;
        using (var memoryStream = new MemoryStream())
        {
            await request.Logo.CopyToAsync(memoryStream, cancellationToken);
            logoBytes = memoryStream.ToArray();
        }

        existingTenant.AgencyLogo = logoBytes;

        await dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success("Agency logo updated successfully.");
    }
}