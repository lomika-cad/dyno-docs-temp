using System.Security.Claims;
using Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Infrastructure.Services;

public class TenantService : ITenantService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    // Hardcoded fallback for Phase 1 (before login is implemented)
    private static readonly Guid HardcodedTenantId = Guid.Parse("00000000-0000-0000-0000-000000000001");

    public TenantService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid TenantId
    {
        get
        {
            // First try to get from HttpContext.Items (set by TenantMiddleware)
            if (_httpContextAccessor.HttpContext?.Items.TryGetValue("TenantId", out var tenantIdObj) == true 
                && tenantIdObj is Guid tenantIdFromItems)
            {
                return tenantIdFromItems;
            }

            // Then try to get from JWT claims
            var tenantIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst("TenantId")?.Value;
            if (Guid.TryParse(tenantIdClaim, out var tenantId))
            {
                return tenantId;
            }

            // Fallback to hardcoded tenant for Phase 1
            return HardcodedTenantId;
        }
    }
}

