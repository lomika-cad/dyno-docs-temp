using Application.Common;
using Application.Common.Interfaces;
using ChatApp.Models;
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
    private readonly ChatBotDbContext _chatContext;

    public LoginCommandHandler(
        IApplicationDbContext context,
        IJwtService jwtService,
        ChatBotDbContext chatContext)
    {
        _context = context;
        _jwtService = jwtService;
        _chatContext = chatContext;
    }

    public async Task<LoginResponse> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        // Find user by email
        var user = await _context.Users
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);


        user.ThrowIfNull("Invalid email or password.");


        // Check password (plain text for now)
        if (user.Password != request.Password)
        {
            throw new Exception("Invalid password.");
        }

        // Get tenant
        var tenant = await _context.Tenants
            .FirstOrDefaultAsync(t => t.Id == user.TenantId, cancellationToken);

        tenant.ThrowIfNull("Invalid tenant.");

        // Generate main app token (same token works for chat — TenantId & UserId are in claims)
        var token = _jwtService.GenerateToken(user);

        // Ensure ChatUser exists for this agency owner
        var chatUser = await _chatContext.ChatUsers
            .FirstOrDefaultAsync(cu => cu.Email == user.Email && cu.TenantId == user.TenantId, cancellationToken);

        if (chatUser == null)
        {
            // Create chat user if doesn't exist
            chatUser = new ChatUser
            {
                Id = Guid.NewGuid(),
                TenantId = user.TenantId,
                Email = user.Email,
                Name = user.FullName,
                Role = UserRole.Admin, // Agency owners are Admins in chat
                IsBotOn = false,
                IsOnline = false,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "system"
            };

            _chatContext.ChatUsers.Add(chatUser);
            await _chatContext.SaveChangesAsync(cancellationToken);
        }

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