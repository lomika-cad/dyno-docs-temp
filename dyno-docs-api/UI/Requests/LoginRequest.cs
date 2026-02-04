using System.ComponentModel.DataAnnotations;

namespace UI.Requests;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    [MinLength(6)]
    public required string Password { get; set; }
}
