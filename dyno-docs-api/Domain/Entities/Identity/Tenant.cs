using Domain.Common;
using Microsoft.AspNetCore.Http;

namespace Domain.Entities.Identity;

public class Tenant
{
    public Guid Id { get; set; }
    
    // Agency details
    public required string AgencyName { get; set; }
    public required string BusinessRegNo { get; set; }
    public required string ContactNo { get; set; }
    public required string Country { get; set; }
    public required string State { get; set; }
    public required string City { get; set; }
    public required string AgencyAddress { get; set; }
    public byte[]? AgencyLogo { get; set; }
    
    // Navigation properties
    public virtual User? User { get; set; }
    public virtual Subscription? Subscription { get; set; }
}