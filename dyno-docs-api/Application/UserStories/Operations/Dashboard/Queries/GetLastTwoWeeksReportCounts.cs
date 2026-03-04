using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Dashboard.Queries;

public record DayCountDto(DateOnly Date, int Count);

public class GetLastTwoWeeksReportCounts : IRequest<List<DayCountDto>>
{
    public Guid TenantId { get; set; }
}

public class GetLastTwoWeeksReportCountsHandler : IRequestHandler<GetLastTwoWeeksReportCounts, List<DayCountDto>>
{
    private readonly IApplicationDbContext _dbContext;

    public GetLastTwoWeeksReportCountsHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<DayCountDto>> Handle(GetLastTwoWeeksReportCounts request, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
        var start = today.AddDays(-13);

        var dbCounts = await _dbContext.Report
            .Where(r =>
                r.TenantId == request.TenantId &&
                r.CreatedAt >= start.ToDateTime(TimeOnly.MinValue) &&
                r.CreatedAt < today.AddDays(1).ToDateTime(TimeOnly.MinValue))
            .GroupBy(r => DateOnly.FromDateTime(r.CreatedAt))
            .Select(g => new DayCountDto(g.Key, g.Count()))
            .ToListAsync(cancellationToken);

        var dict = dbCounts.ToDictionary(x => x.Date, x => x.Count);

        var result = Enumerable.Range(0, 14)
            .Select(i =>
            {
                var date = start.AddDays(i);
                return new DayCountDto(date, dict.TryGetValue(date, out var c) ? c : 0);
            })
            .ToList();

        return result;
    }
}