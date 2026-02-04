using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

using Throw;

namespace Application.UserStories.Identity.Commands;

public record LoginCommand : IRequest<LoginResponse>
{
    public required string Email { get; init; }
    public required string Password { get; init; }
}

public record LoginResponse
{
    public required string Token { get; init; }
    public required string FullName { get; init; }
    public required string Email { get; init; }
    public required string MobileNo { get; init; }
    public required string AgencyName { get; init; }
    public required Guid TenantId { get; init; }
    public required Guid UserId { get; init; }
}

public class LoginCommandHandler : IRequestHandler<LoginCommand, LoginResponse>
{
    private readonly IApplicationDbContext _context;
    private readonly IJwtService _jwtService;

    public LoginCommandHandler(IApplicationDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        // Find user by email
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (user == null)
        {
            user.ThrowIfNull("Invalid email or password.");
        }

        // Check password (plain text for now)
        if (user.Password != request.Password)
        {
            throw new Exception("Invalid password.");
        }

        // Get tenant
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Id == user.TenantId, cancellationToken);

        tenant.ThrowIfNull("Invalid tenant.");

        // Generate token
        var token = _jwtService.GenerateToken(user);

        var response = new LoginResponse
        {
            Token = token,
            FullName = user.FullName,
            Email = user.Email,
            MobileNo = user.MobileNo,
            AgencyName = tenant.AgencyName,
            TenantId = user.TenantId,
            UserId = user.Id
        };

        return response;
    }
}
