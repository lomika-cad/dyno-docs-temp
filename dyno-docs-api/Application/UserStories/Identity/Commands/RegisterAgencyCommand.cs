using Application.Common;
using Application.Common.Interfaces;
using Application.UserStories.Operations.UserSubscriptions.Commands;
using ChatApp.Interfaces;
using ChatApp.Models;
using Domain.Common;
using Domain.Entities.Identity;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Identity.Commands;

public record RegisterAgencyCommand : IRequest<Result>
{
    public required string AgencyName { get; init; }
    public required string BusinessRegNo { get; init; }
    public required string ContactNo { get; init; }
    public required string Country { get; init; }
    public required string State { get; init; }
    public required string City { get; init; }
    public required string AgencyAddress { get; init; }
    public required IFormFile AgencyLogo { get; init; }

    public required string FullName { get; init; }
    public required string NICNo { get; init; }
    public required string MobileNo { get; init; }
    public required string Email { get; init; }
    public required string Password { get; init; }
    public required string ConfirmPassword { get; init; }
    public required int PlanId { get; init; }
    public required string PlanName { get; init; }
    public required PlanType PlanType { get; init; }
}

public class RegisterAgencyCommandHandler : IRequestHandler<RegisterAgencyCommand, Result>
{
    private readonly IApplicationDbContext _context;
    public  readonly IMediator _mediator;
    private readonly ChatBotDbContext _chatContext;
    private readonly IChatService _chatService;

    public RegisterAgencyCommandHandler(
        IApplicationDbContext context, 
        IMediator mediator,
        ChatBotDbContext chatContext,
        IChatService chatService)
    {
        _context = context;
        _mediator = mediator;
        _chatContext = chatContext;
        _chatService = chatService;
    }

    public async Task<Result> Handle(RegisterAgencyCommand request, CancellationToken cancellationToken)
    {
        // Validate logo file size (5MB max)
        const long maxFileSize = 5 * 1024 * 1024; // 5MB
        if (request.AgencyLogo.Length > maxFileSize)
        {
            return Result.Failure("Agency logo file size exceeds 5MB limit.");
        }

        // Check if email already exists
        if (await _context.Users.IgnoreQueryFilters().AnyAsync(u => u.Email == request.Email, cancellationToken))
        {
            return Result.Failure("Email already exists.");
        }

        // Convert logo to byte array
        byte[]? logoBytes = null;
        if (request.AgencyLogo.Length > 0)
        {
            using var memoryStream = new MemoryStream();
            await request.AgencyLogo.CopyToAsync(memoryStream, cancellationToken);
            logoBytes = memoryStream.ToArray();
        }

        // Create Tenant (Agency)
        var tenant = new Tenant
        {
            Id = Guid.NewGuid(),
            AgencyName = request.AgencyName,
            BusinessRegNo = request.BusinessRegNo,
            ContactNo = request.ContactNo,
            Country = request.Country,
            State = request.State,
            City = request.City,
            AgencyAddress = request.AgencyAddress,
            AgencyLogo = logoBytes
        };

        // Add tenant first to get Id
        await _context.Tenants.AddAsync(tenant, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        // Create User
        var user = new Domain.Common.User
        {
            UserName = request.Email, // Use email as username
            FullName = request.FullName,
            Email = request.Email,
            MobileNo = request.MobileNo,
            NICNo = request.NICNo,
            Password = request.Password, // Note: In production, hash the password
            IsActive = true,
            TenantId = tenant.Id // Set tenant id
        };

        // Create Subscription
        var subscription = new Subscription
        {
            CurrentToken = 100,
            AvailableToken = 100,
            TenantId = tenant.Id, // Set tenant id
            Tenant = tenant
        };

        // Set relationships
        tenant.User = user;
        tenant.Subscription = subscription;

        // Add user and subscription
        await _context.Users.AddAsync(user, cancellationToken);
        await _context.Subscriptions.AddAsync(subscription, cancellationToken);
        
        var userSubscription = new CreateUserSubscriptionCommand()
        {
            TenantId = tenant.Id,
            PlanId = request.PlanId,
            PlanName = request.PlanName,
            PlanType = request.PlanType
        };
        
        await _mediator.Send(userSubscription, cancellationToken);

        // Save changes
        await _context.SaveChangesAsync(cancellationToken);

        // Create Chat for the tenant
        try
        {
            // Create Chat entity (1:1 with Tenant)
            var chat = await _chatService.CreateChatAsync(tenant.Id, $"{tenant.AgencyName} Chat");
            
            // Create ChatUser for the agency admin
            var chatUser = new ChatUser
            {
                Id = Guid.NewGuid(),
                TenantId = tenant.Id,
                Email = user.Email,
                Name = user.FullName,
                Role = UserRole.Admin, // Agency owner is Admin in chat
                IsBotOn = false, // Admins don't start with bot
                IsOnline = false,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = "system"
            };

            _chatContext.ChatUsers.Add(chatUser);
            await _chatContext.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            // Log error but don't fail registration if chat creation fails
            // In production, you might want to implement retry logic or notifications
            Console.WriteLine($"Failed to create chat for tenant {tenant.Id}: {ex.Message}");
        }

        var result = Result.Success("Agency registered successfully.");
        result.SetData(tenant.Id);
        return result;
    }
}