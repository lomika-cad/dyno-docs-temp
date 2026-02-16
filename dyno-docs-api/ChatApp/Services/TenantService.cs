using ChatApp.Interfaces;
using System.Security.Claims;

namespace ChatApp.Services;

public class TenantService : ITenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public TenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid TenantId
    {
        get
        {
            // Try to get from JWT token claims first
            var tenantIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("TenantId")?.Value;
            if (Guid.TryParse(tenantIdClaim, out var tenantId))
            {
                return tenantId;
            }

            // Fallback to default tenant for development
            return Guid.Parse("00000000-0000-0000-0000-000000000001");
        }
    }

    public bool IsMultiTenantEnabled => true;
}
