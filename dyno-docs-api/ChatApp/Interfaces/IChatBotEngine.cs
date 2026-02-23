using ChatApp.Models;
using ChatApp.Models.Dtos;

namespace ChatApp.Interfaces;

public interface IChatBotEngine
{
    Task<Guid> CreateChatBotAsync(Guid tenantId, CreateChatbotDto dto);
    Task<ChatbotCommands?> ProcessUserMessageAsync(Guid chatId, string userMessage);
    Task<ChatbotCommands> GetNextBotCommandAsync(Guid chatId, int currentIndex);
    Task<IEnumerable<ChatbotCommands>> GetBotCommandsByChatAsync(Guid chatId);
    Task<ChatbotCommands> AddBotCommandAsync(Guid tenantId, CreateChatbotCommandDto dto);
    Task<ChatbotCommands?> UpdateBotCommandAsync(Guid commandId, Guid tenantId, UpdateChatbotCommandDto dto);
    Task<bool> DeleteBotCommandAsync(Guid commandId, Guid tenantId);
    Task<string> GetBotNameAsync(Guid chatId);
}
