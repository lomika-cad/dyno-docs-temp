using ChatApp.Interfaces;
using ChatApp.Models;
using ChatApp.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IJwtService _jwtService;
    private readonly ChatBotDbContext _context;
    private readonly ITenantService _tenantService;

    public AuthController(IJwtService jwtService, ChatBotDbContext context, ITenantService tenantService)
    {
        _jwtService = jwtService;
        _context = context;
        _tenantService = tenantService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            // Check if user already exists
            var existingUser = await _context.ChatUsers
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.TenantId == _tenantService.TenantId);

            if (existingUser != null)
            {
                return BadRequest(new { message = "User already exists" });
            }

            // Create new user
            var user = new ChatUser
            {
                Id = Guid.NewGuid(),
                TenantId = _tenantService.TenantId,
                Email = request.Email,
                Name = request.Name,
                Role = request.Role,
                IsBotOn = request.Role == UserRole.Client, // Clients start with bot on
                IsOnline = false,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "system"
            };

            _context.ChatUsers.Add(user);
            await _context.SaveChangesAsync();

            // Generate JWT token
            var token = _jwtService.GenerateToken(user);

            return Ok(new
            {
                user = new
                {
                    user.Id,
                    user.Email,
                    user.Name,
                    user.Role,
                    user.IsBotOn
                },
                token
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Registration failed", error = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        try
        {
            var user = await _context.ChatUsers
                .FirstOrDefaultAsync(u => u.Email == request.Email && u.TenantId == _tenantService.TenantId);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid credentials" });
            }

            // Generate JWT token
            var token = _jwtService.GenerateToken(user);

            return Ok(new
            {
                user = new
                {
                    user.Id,
                    user.Email,
                    user.Name,
                    user.Role,
                    user.IsBotOn
                },
                token
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { message = "Login failed", error = ex.Message });
        }
    }
}

public class RegisterRequest
{
    public string Email { get; set; }
    public string Name { get; set; }
    public UserRole Role { get; set; }
}

public class LoginRequest
{
    public string Email { get; set; }
}
