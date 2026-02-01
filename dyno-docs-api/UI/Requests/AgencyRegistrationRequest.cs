using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace UI.Requests;

public class AgencyRegistrationRequest
{
    // Agency details
    [Required]
    [MaxLength(255)]
    public required string AgencyName { get; set; }

    [Required]
    [MaxLength(100)]
    public required string BusinessRegNo { get; set; }

    [Required]
    [MaxLength(25)]
    public required string ContactNo { get; set; }

    [Required]
    [MaxLength(100)]
    public required string Country { get; set; }

    [Required]
    [MaxLength(100)]
    public required string State { get; set; }

    [Required]
    [MaxLength(100)]
    public required string City { get; set; }

    [Required]
    [MaxLength(500)]
    public required string AgencyAddress { get; set; }

    [Required]
    public IFormFile AgencyLogo { get; set; }

    // User details
    [Required]
    [MaxLength(255)]
    public required string FullName { get; set; }

    [Required]
    [MaxLength(25)]
    public required string NICNo { get; set; }

    [Required]
    [MaxLength(25)]
    public required string MobileNo { get; set; }

    [Required]
    [EmailAddress]
    public required string Email { get; set; }

    [Required]
    [MinLength(6)]
    public required string Password { get; set; }

    [Required]
    [Compare("Password")]
    public required string ConfirmPassword { get; set; }
}
