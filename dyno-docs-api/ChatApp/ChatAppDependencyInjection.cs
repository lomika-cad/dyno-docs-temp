using ChatApp.Interfaces;
using ChatApp.Models;
using ChatApp.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ChatApp;

public static class ChatAppDependencyInjection
{
    public static IServiceCollection AddChatApp(this IServiceCollection services, IConfiguration configuration)
    {
        // Separate ChatBot Database
        services.AddDbContext<ChatBotDbContext>(options =>
            options.UseMySql(
                configuration.GetConnectionString("ChatBotConnection"),
                ServerVersion.AutoDetect(configuration.GetConnectionString("ChatBotConnection"))));

        // Chat-specific Services only (ITenantService, ICurrentUserService are from main app)
        services.AddScoped<IChatService, ChatService>();
        services.AddScoped<IChatBotEngine, ChatBotEngine>();

        // Client JWT — generates tokens for ChatUser (tourists), not main app users
        services.AddScoped<IChatJwtService, ChatJwtService>();

        return services;
    }
}
