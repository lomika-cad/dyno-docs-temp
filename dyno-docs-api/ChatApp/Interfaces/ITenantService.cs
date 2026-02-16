namespace ChatApp.Interfaces;

public interface ITenantService
{
    Guid TenantId { get; }
    bool IsMultiTenantEnabled { get; }
}
