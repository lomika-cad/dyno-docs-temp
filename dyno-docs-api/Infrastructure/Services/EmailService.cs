using System.Net;
using System.Net.Mail;
using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Services;

public class EmailService(IApplicationDbContext context, IConfiguration configuration) : IEmailService
{
    private SmtpSettings GetSmtpSettings() =>
        configuration.GetSection("SmtpSettings").Get<SmtpSettings>()
        ?? throw new InvalidOperationException("SmtpSettings is not configured.");

    public async Task SendBirthdayEmailAsync(Guid id)
    {
        var customer = await context.Customer.FirstOrDefaultAsync(c => c.Id == id);

        if (customer is null)
            throw new KeyNotFoundException($"Customer with ID '{id}' was not found.");

        if (string.IsNullOrWhiteSpace(customer.Email))
            throw new InvalidOperationException($"Customer '{customer.Name}' does not have an email address.");
      
        
        
        var agencyName = await context.Tenants.Where(c => c.Id == customer.TenantId)
            .Select(c => c.AgencyName)
            .FirstOrDefaultAsync() ?? "DynoDocs";
        

        var smtp = GetSmtpSettings();
        var html = BuildBirthdayHtml(customer.Name ?? "Valued Customer", customer.DateOfBirth,agencyName);

        using var message = new MailMessage(smtp.SenderEmail, customer.Email,
            $"🎂 Happy Birthday, {customer.Name ?? "Friend"}! 🎉", html)
        {
            IsBodyHtml = true,
            From = new MailAddress(smtp.SenderEmail, $"{agencyName} 🎉")
        };

        using var client = new SmtpClient(smtp.Host, smtp.Port)
        {
            EnableSsl = smtp.EnableSsl,
            Credentials = new NetworkCredential(smtp.Username, smtp.Password)
        };

        await client.SendMailAsync(message);
    }

    private static string BuildBirthdayHtml(string name, DateOnly? dob,string agencyName)
    {
        var age = dob.HasValue
            ? (int)((DateTime.Today - dob.Value.ToDateTime(TimeOnly.MinValue)).TotalDays / 365.25)
            : (int?)null;

        var ageLine = age.HasValue
            ? $"<p style=\"margin:0 0 8px 0;font-size:16px;color:#555;\">Celebrating <strong style=\"color:#ff7b2e;\">{age} amazing years</strong> 🥳</p>"
            : string.Empty;

        return $"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Happy Birthday!</title>
</head>
<body style="margin:0;padding:0;background-color:#f4ece4;font-family:'Segoe UI',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4ece4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(255,123,46,0.15);">

          <!-- ===== HEADER BAND ===== -->
          <tr>
            <td style="background-color:#ff7b2e;padding:36px 40px;text-align:center;">
              <p style="margin:0;font-size:44px;letter-spacing:4px;">🎂🎉🎁🎈</p>
              <h1 style="margin:12px 0 0 0;font-size:36px;font-weight:800;color:#ffffff;
                          letter-spacing:1px;text-shadow:0 2px 6px rgba(0,0,0,0.15);">
                Happy Birthday!
              </h1>
              <p style="margin:6px 0 0 0;font-size:15px;color:#ffe5d0;font-weight:500;">
                From all of us at {agencyName} ❤️
              </p>
            </td>
          </tr>

          <!-- ===== GIF BANNER ===== -->
          <tr>
            <td style="background-color:#ff7b2e;padding:0 0 0 0;text-align:center;">
              <img src="https://media.giphy.com/media/g5R9dok94mrIvplmZd/giphy.gif"
                   alt="Birthday Celebration"
                   width="600"
                   style="width:100%;max-width:600px;display:block;" />
            </td>
          </tr>

          <!-- ===== MAIN BODY ===== -->
          <tr>
            <td style="background-color:#fffaf6;padding:44px 48px 32px 48px;">

              <!-- Greeting -->
              <h2 style="margin:0 0 16px 0;font-size:26px;color:#ff7b2e;font-weight:700;">
                Dear {name}, 🌟
              </h2>

              {ageLine}

              <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;color:#4a3728;">
                Today is <strong>YOUR</strong> special day and we couldn't be more excited to celebrate
                it with you! 🎊 Wishing you a day filled with laughter, love, and all the things that
                make your heart sing. 💛
              </p>

              <p style="margin:0 0 18px 0;font-size:16px;line-height:1.7;color:#4a3728;">
                May this birthday bring you closer to everything you've ever dreamed of — big adventures,
                wonderful surprises, and memories that last forever. 🎁✨
              </p>

              <!-- Divider -->
              <hr style="border:none;border-top:2px solid #ffe0cc;margin:24px 0;" />

              <!-- Quote card -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:#fff3eb;border-left:5px solid #ff7b2e;
                              border-radius:8px;padding:18px 22px;">
                    <p style="margin:0;font-size:15px;font-style:italic;color:#ff7b2e;font-weight:600;">
                      "The more you celebrate your life, the more there is in life to celebrate." 🎂
                    </p>
                    <p style="margin:8px 0 0 0;font-size:13px;color:#999;">— Oprah Winfrey</p>
                  </td>
                </tr>
              </table>

              <!-- Spacer -->
              <p style="margin:28px 0 0 0;font-size:16px;line-height:1.7;color:#4a3728;">
                Once again, <strong style="color:#ff7b2e;">Happy Birthday, {name}!</strong> 🎈🎈🎈<br/>
                Have a fantastic day and an even better year ahead!
              </p>

              <!-- CTA Button -->
              <!-- 
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;">
                <tr>
                  <td align="center">
                    <a href="https://dynodocs.online"
                       style="display:inline-block;background-color:#ff7b2e;color:#ffffff;
                              text-decoration:none;padding:14px 40px;border-radius:50px;
                              font-size:16px;font-weight:700;letter-spacing:0.5px;
                              box-shadow:0 4px 14px rgba(255,123,46,0.4);">
                      Celebrate with {agencyName} 🎉
                    </a>
                  </td>
                </tr>
              </table>
              -->

            </td>
          </tr>

          <!-- ===== FOOTER ===== -->
          <tr>
            <td style="background-color:#fff3eb;padding:24px 48px;text-align:center;
                        border-top:2px solid #ffe0cc;">
              <p style="margin:0;font-size:13px;color:#b07a5a;line-height:1.6;">
                🧡 Sent with love by <strong style="color:#ff7b2e;">DynoDocs</strong><br/>
                You're receiving this because you're part of our amazing community.<br/>
                <a href="https://dynodocs.com" style="color:#ff7b2e;text-decoration:none;">
                  dynodocs.online
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
""";
    }
}
