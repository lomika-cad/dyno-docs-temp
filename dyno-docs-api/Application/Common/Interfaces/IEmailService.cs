namespace Application.Common.Interfaces;

public interface IEmailService
{
    Task SendBirthdayEmailAsync(Guid id);
}
