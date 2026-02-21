using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ChatApp.Interfaces;
using ChatApp.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace ChatApp.Services;

public class ChatJwtService : IChatJwtService
{
    private readonly IConfiguration _configuration;

    public ChatJwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(ChatUser chatUser)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["JwtSettings:SecretKey"]
                ?? "your-32-characters-long-secret-key-here"));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, chatUser.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, chatUser.Email),
            new Claim(JwtRegisteredClaimNames.Name, chatUser.Name),
            new Claim("TenantId", chatUser.TenantId.ToString()),
            new Claim("UserRole", chatUser.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
                double.Parse(_configuration["JwtSettings:ExpiryInMinutes"] ?? "1440")),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
