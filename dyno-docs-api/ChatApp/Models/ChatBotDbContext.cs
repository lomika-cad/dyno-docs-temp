using Microsoft.EntityFrameworkCore;

namespace ChatApp.Models;

public class ChatBotDbContext : DbContext
{
    public ChatBotDbContext(DbContextOptions<ChatBotDbContext> options)
        : base(options)
    {
    }

    public DbSet<Chat> Chats { get; set; }
    public DbSet<ChatUser> ChatUsers { get; set; }
    public DbSet<ChatMessage> ChatMessages { get; set; }
    public DbSet<ChatbotCommands> ChatbotCommands { get; set; }
}
