using System.Security.Claims;

namespace UI.Middlewares;

public class TenantMiddleware
{
    private readonly RequestDelegate _next;

    // Hardcoded fallback for Phase 1 (before login is implemented)
    private static readonly Guid HardcodedTenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public TenantMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
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
            // Fallback to hardcoded tenant for Phase 1
            tenantId = HardcodedTenantId;
        }

        // Store in HttpContext.Items for downstream access
        context.Items["TenantId"] = tenantId;

        await _next(context);
    }
}

