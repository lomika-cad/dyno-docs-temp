using ChatApp.Models;

namespace ChatApp.Interfaces;

public interface IJwtService
{
    string GenerateToken(ChatUser user);
    string? ValidateToken(string token);
    Guid? GetUserIdFromToken(string token);
    Guid? GetTenantIdFromToken(string token);
}
