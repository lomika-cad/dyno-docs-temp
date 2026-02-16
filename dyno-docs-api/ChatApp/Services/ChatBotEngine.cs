using ChatApp.Interfaces;
using ChatApp.Models;
using Microsoft.EntityFrameworkCore;

namespace ChatApp.Services;

public class ChatBotEngine : IChatBotEngine
{
    private readonly ChatBotDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public ChatBotEngine(ChatBotDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<ChatbotCommands?> ProcessUserMessageAsync(Guid chatId, string userMessage)
    {
        // Simple keyword matching for tourism queries
        var keywords = userMessage.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);

        // Find matching bot commands based on keywords
        var matchingCommand = await _context.ChatbotCommands
            .Where(c => c.ChatId == chatId)
            .Where(c => keywords.Any(k => c.Keywords.ToLower().Contains(k)))
            .OrderBy(c => c.Index)
            .FirstOrDefaultAsync();

        return matchingCommand;
    }

    public async Task<ChatbotCommands> GetNextBotCommandAsync(Guid chatId, int currentIndex)
    {
        return await _context.ChatbotCommands
            .Where(c => c.ChatId == chatId && c.Index > currentIndex)
            .OrderBy(c => c.Index)
            .FirstOrDefaultAsync() ?? await GetDefaultWelcomeCommandAsync(chatId);
    }

    public async Task<bool> CreateBotCommandsForChatAsync(Guid chatId, Guid tenantId)
    {
        // Create default tourism bot commands for a new chat
        var commands = new List<ChatbotCommands>
        {
            new ChatbotCommands
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ChatId = chatId,
                Index = 0,
                Message = new[] { "Hello! Welcome to our tourism service! 🌴", "Hi there! Ready to plan your dream vacation?" },
                Reply = new[] { "Get Started", "Browse Destinations", "Speak to Agent" },
                Type = CommandType.Selection,
                Keywords = "hello,hi,welcome,start",
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserName ?? "system"
            },
            new ChatbotCommands
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ChatId = chatId,
                Index = 1,
                Message = new[] { "Which destination interests you?", "Where would you like to travel?" },
                Reply = new[] { "Colombo", "Kandy", "Galle", "Ella", "Nuwara Eliya", "Other" },
                Type = CommandType.Selection,
                Keywords = "destination,place,where,travel",
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserName ?? "system"
            },
            new ChatbotCommands
            {
                Id = Guid.NewGuid(),
                TenantId = tenantId,
                ChatId = chatId,
                Index = 2,
                Message = new[] { "How many days are you planning?", "What's your preferred trip duration?" },
                Reply = new[] { "1-3 days", "4-7 days", "1-2 weeks", "More than 2 weeks" },
                Type = CommandType.Selection,
                Keywords = "days,duration,time,long,how many",
                CreatedAt = DateTime.UtcNow,
                CreatedBy = _currentUserService.UserName ?? "system"
            }
        };

        _context.ChatbotCommands.AddRange(commands);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<IEnumerable<ChatbotCommands>> GetBotCommandsByChatAsync(Guid chatId)
    {
        return await _context.ChatbotCommands
            .Where(c => c.ChatId == chatId)
            .OrderBy(c => c.Index)
            .ToListAsync();
    }

    private async Task<ChatbotCommands> GetDefaultWelcomeCommandAsync(Guid chatId)
    {
        return await _context.ChatbotCommands
            .Where(c => c.ChatId == chatId && c.Index == 0)
            .FirstOrDefaultAsync() ?? new ChatbotCommands
            {
                Message = new[] { "How can I help you today?" },
                Reply = new[] { "Start Over", "Speak to Agent" },
                Type = CommandType.Selection
            };
    }
}
