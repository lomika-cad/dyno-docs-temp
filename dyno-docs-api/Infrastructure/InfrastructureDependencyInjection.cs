using Application.Common.Interfaces;
using Infrastructure.Persistence;
using Application.Common.Interfaces;
using Domain.Common.Interfaces;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Infrastructure;

public static class InfrastructureDependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Database
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseMySql(
                configuration.GetConnectionString("DefaultConnection"),
                ServerVersion.AutoDetect(configuration.GetConnectionString("DefaultConnection"))));

        services.AddScoped<IApplicationDbContext>(provider => provider.GetRequiredService<ApplicationDbContext>());

        // Core Services - register both Application and Domain interface aliases
        services.AddScoped<CurrentUserService>();
        services.AddScoped<Application.Common.Interfaces.ICurrentUserService>(p => p.GetRequiredService<CurrentUserService>());
        services.AddScoped<Domain.Common.Interfaces.ICurrentUserService>(p => p.GetRequiredService<CurrentUserService>());

        services.AddScoped<TenantService>();
        services.AddScoped<Application.Common.Interfaces.ITenantService>(p => p.GetRequiredService<TenantService>());
        services.AddScoped<Domain.Common.Interfaces.ITenantService>(p => p.GetRequiredService<TenantService>());

        // Application Services
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IDropBoxService, DropBoxService>();

        // Excel Services
        services.AddScoped<IPlaceExcelService,PlaceExcelService>();

        return services;
    }
}