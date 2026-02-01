using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace Domain.Common;

public class User : BaseEntity
{

    [MaxLength(255)] public required string UserName { get; set; }

    public required string FullName { get; set; }
    
    [EmailAddress] 
    public required string Email { get; set; }
    
    [MaxLength(25)]
    public required string MobileNo { get; set; }
    
    public required string NICNo { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    
    public required string Password { get; set; }
}