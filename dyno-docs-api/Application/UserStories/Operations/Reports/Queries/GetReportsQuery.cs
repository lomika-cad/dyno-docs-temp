using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Reports.Queries;

public class GetReportsQuery : IRequest<List<ReportsDto>>
{
    public Guid TenantId { get; set; }
}

public class GetReportsQueryHandler (IApplicationDbContext dbContext) : IRequestHandler<GetReportsQuery, List<ReportsDto>>
{
    public async Task<List<ReportsDto>> Handle(GetReportsQuery request, CancellationToken cancellationToken)
    {
        return await dbContext.Report
            .Where(r => r.TenantId == request.TenantId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new ReportsDto
            {
                Id = r.Id,
                TenantId = r.TenantId,
                CustomerName = r.CustomerName,
                CustomerEmail = r.CustomerEmail,
                GeneratedReport = r.GeneratedReport
            })
            .ToListAsync(cancellationToken);
    }
}