using Application.Common.Interfaces;
using Application.UserStories.Operations.Places;
using Infrastructure.Persistence;
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

        // Core Services
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<ITenantService, TenantService>();

        // Application Services
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IDropBoxService, DropBoxService>();

        // CRUD Services
        services.AddScoped<IPlaceService, PlaceService>();
        
        // Excel Services
        services.AddScoped<PlaceExcelService>();

        return services;
    }
}