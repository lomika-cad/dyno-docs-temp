using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Dashboard.Queries;

public class GetStatsQuery : IRequest<object>
{
    public Guid TenantId { get; set; }
}

public class GetStatsQueryHandler(IApplicationDbContext dbContext) : IRequestHandler<GetStatsQuery, object>
{
    public async Task<object> Handle(GetStatsQuery request, CancellationToken cancellationToken)
    {
        var totalReports = await dbContext.Report.Where(r => r.TenantId == request.TenantId).CountAsync(cancellationToken);
        var customer = await dbContext.Customer.Where(c => c.TenantId == request.TenantId).CountAsync(cancellationToken);
        var userSubscription = await dbContext.UserSubscription.Where(u => u.TenantId == request.TenantId).FirstOrDefaultAsync(cancellationToken);
        var availableTemplateCount = userSubscription?.TemplatesLimit;
        var availableReportCount = userSubscription?.ReportsLimit;
        
        return new
        {
            TotalReports = totalReports,
            TotalCustomers = customer,
            AvailableTemplates = availableTemplateCount,
            AvailableReports = availableReportCount
        };
    }
}