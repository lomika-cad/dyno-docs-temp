using System.Security.Claims;
using Application.Common.Interfaces;
using Microsoft.AspNetCore.Http;

namespace Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    // Hardcoded fallback for Phase 1 (before login is implemented)
    private static readonly Guid HardcodedUserId = Guid.Parse("00000000-0000-0000-0000-000000000001");
    private const string HardcodedUserName = "system";

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var userIdClaim = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            // Fallback to hardcoded user for Phase 1
            return HardcodedUserId;
        }
    }

    public string? UserName
    {
        get
        {
            var userName = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.Name)?.Value;
            // Fallback to hardcoded user for Phase 1
            return userName ?? HardcodedUserName;
        }
    }
}
