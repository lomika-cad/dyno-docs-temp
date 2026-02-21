using Domain.Common.Interfaces;
using ChatApp.Interfaces;
using ChatApp.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Services;

public class ChatService : IChatService
{
    private readonly ChatBotDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ChatService(ChatBotDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<Chat> CreateChatAsync(Guid tenantId, string chatName)
    {
        var chat = new Chat
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Name = chatName,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserName ?? "system",
            LastModifiedAt = DateTime.UtcNow,
            LastModifiedBy = _currentUserService.UserName ?? "system"
        };

        _context.Chats.Add(chat);
        await _context.SaveChangesAsync();

        return chat;
    }

    public async Task<Chat?> GetChatByIdAsync(Guid chatId)
    {
        return await _context.Chats
            .FirstOrDefaultAsync(c => c.Id == chatId);
    }

    public async Task<IEnumerable<Chat>> GetChatsByTenantAsync(Guid tenantId)
    {
        return await _context.Chats
            .Where(c => c.TenantId == tenantId)
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<bool> UpdateChatStatusAsync(Guid chatId, bool isActive)
    {
        var chat = await _context.Chats.FindAsync(chatId);
        if (chat == null) return false;

        chat.IsActive = isActive;
        chat.LastModifiedAt = DateTime.UtcNow;
        chat.LastModifiedBy = _currentUserService.UserName ?? "system";

        await _context.SaveChangesAsync();
        return true;
    }
}
