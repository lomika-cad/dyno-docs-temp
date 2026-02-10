using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Application.Common.Exceptions;

namespace UI.Middlewares;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;


    public TenantMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var endpoint = context.GetEndpoint();
        if (endpoint?.Metadata.GetMetadata<IAuthorizeData>() != null)
        {
            Guid tenantId;

            // Try to get TenantId from JWT claims
            var tenantIdClaim = context.User?.FindFirstValue("TenantId");
            if (Guid.TryParse(tenantIdClaim, out var parsedTenantId))
            {
                tenantId = parsedTenantId;
            }
            else
            {
                throw new ForbiddenException("TenantId claim is missing or invalid in the JWT token.");
            }

            // Store in HttpContext.Items for downstream access
            context.Items["TenantId"] = tenantId;
        }

        await _next(context);
    }
}