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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Chat → ChatMessage (one-to-many via ChatId)
        modelBuilder.Entity<ChatMessage>()
            .HasOne<Chat>()
            .WithMany(c => c.Messages)
            .HasForeignKey(cm => cm.ChatId)
            .OnDelete(DeleteBehavior.Cascade);

        // Chat → ChatbotCommands (one-to-many via ChatId)
        modelBuilder.Entity<ChatbotCommands>()
            .HasOne<Chat>()
            .WithMany(c => c.BotCommands)
            .HasForeignKey(cc => cc.ChatId)
            .OnDelete(DeleteBehavior.Cascade);

        // Chat → ChatUser (one-to-many via TenantId)
        modelBuilder.Entity<ChatUser>()
            .HasOne<Chat>()
            .WithMany(c => c.ChatUsers)
            .HasForeignKey(cu => cu.TenantId)
            .HasPrincipalKey(c => c.TenantId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique index on Chat.TenantId (1:1 with Tenant)
        modelBuilder.Entity<Chat>()
            .HasIndex(c => c.TenantId)
            .IsUnique();

        // ChatMessage → ChatUser (many-to-one via ChatUserId)
        modelBuilder.Entity<ChatMessage>()
            .HasOne(cm => cm.ChatUser)
            .WithMany()
            .HasForeignKey(cm => cm.ChatUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // Index on ChatMessage.ChatId
        modelBuilder.Entity<ChatMessage>()
            .HasIndex(cm => cm.ChatId);

        // Index on ChatUser.TenantId
        modelBuilder.Entity<ChatUser>()
            .HasIndex(cu => cu.TenantId);
    }
}
