using ChatApp.Models;

namespace ChatApp.Interfaces;

public interface IChatService
{
    Task<Chat> CreateChatAsync(Guid tenantId, string chatName);
    Task<Chat?> GetChatByIdAsync(Guid chatId);
    Task<IEnumerable<Chat>> GetChatsByTenantAsync(Guid tenantId);
    Task<bool> UpdateChatStatusAsync(Guid chatId, bool isActive);
}
