namespace ChatApp.Interfaces;

public interface IChatJwtService
{
    string GenerateToken(Models.ChatUser chatUser);
}
