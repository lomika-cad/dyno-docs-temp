using ChatApp.Models;

namespace ChatApp.Interfaces;

public interface IChatBotEngine
{
    Task<ChatbotCommands?> ProcessUserMessageAsync(Guid chatId, string userMessage);
    Task<ChatbotCommands> GetNextBotCommandAsync(Guid chatId, int currentIndex);
    Task<bool> CreateBotCommandsForChatAsync(Guid chatId, Guid tenantId);
    Task<IEnumerable<ChatbotCommands>> GetBotCommandsByChatAsync(Guid chatId);
}
