using Domain.Common.Interfaces;
using ChatApp.Interfaces;
using ChatApp.Models;
using ChatApp.Models.Dtos;
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
        var keywords = userMessage.ToLower().Split(' ', StringSplitOptions.RemoveEmptyEntries);

        return await _context.ChatbotCommands
            .Where(c => c.ChatId == chatId)
            .Where(c => keywords.Any(k => c.Keywords.ToLower().Contains(k)))
            .OrderBy(c => c.Index)
            .FirstOrDefaultAsync();
    }

    public async Task<ChatbotCommands> GetNextBotCommandAsync(Guid chatId, int currentIndex)
    {
        return await _context.ChatbotCommands
            .Where(c => c.ChatId == chatId && c.Index > currentIndex)
            .OrderBy(c => c.Index)
            .FirstOrDefaultAsync() ?? await GetDefaultWelcomeCommandAsync(chatId);
    }

    public async Task<IEnumerable<ChatbotCommands>> GetBotCommandsByChatAsync(Guid chatId)
    {
        return await _context.ChatbotCommands
            .Where(c => c.ChatId == chatId)
            .OrderBy(c => c.Index)
            .ToListAsync();
    }

    public async Task<ChatbotCommands> AddBotCommandAsync(Guid tenantId, CreateChatbotCommandDto dto)
    {
        var command = new ChatbotCommands
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            ChatId = dto.ChatId,
            Index = dto.Index,
            Message = dto.Message,
            Reply = dto.Reply,
            Type = dto.Type,
            Keywords = dto.Keywords,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserName ?? "system"
        };

        _context.ChatbotCommands.Add(command);
        await _context.SaveChangesAsync();

        return command;
    }

    public async Task<ChatbotCommands?> UpdateBotCommandAsync(Guid commandId, Guid tenantId, UpdateChatbotCommandDto dto)
    {
        var command = await _context.ChatbotCommands
            .FirstOrDefaultAsync(c => c.Id == commandId && c.TenantId == tenantId);

        if (command == null) return null;

        if (dto.Index.HasValue)    command.Index    = dto.Index.Value;
        if (dto.Message != null)   command.Message  = dto.Message;
        if (dto.Reply != null)     command.Reply    = dto.Reply;
        if (dto.Type.HasValue)     command.Type     = dto.Type.Value;
        if (dto.Keywords != null)  command.Keywords = dto.Keywords;

        command.LastModifiedAt = DateTime.UtcNow;
        command.LastModifiedBy = _currentUserService.UserName ?? "system";

        await _context.SaveChangesAsync();

        return command;
    }

    public async Task<bool> DeleteBotCommandAsync(Guid commandId, Guid tenantId)
    {
        var command = await _context.ChatbotCommands
            .FirstOrDefaultAsync(c => c.Id == commandId && c.TenantId == tenantId);

        if (command == null) return false;

        _context.ChatbotCommands.Remove(command);
        await _context.SaveChangesAsync();

        return true;
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
    
}
