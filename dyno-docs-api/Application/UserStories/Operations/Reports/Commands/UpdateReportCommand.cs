using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Reports.Commands;

public class UpdateReportCommand : IRequest<Result>
{
    public Guid ReportId { get; set; }
    public string? NewReportContent { get; set; }
}

public class UpdateReportCommandHandler(IApplicationDbContext context) : IRequestHandler<UpdateReportCommand, Result>
{
    public async Task<Result> Handle(UpdateReportCommand request, CancellationToken cancellationToken)
    {
        var report = await context.Report.Where(r => r.Id == request.ReportId).FirstOrDefaultAsync(cancellationToken);
        if (report == null)
        {
            return Result.Failure("Report not found.");
        }

        report.GeneratedReport = request.NewReportContent;
        report.LastModifiedAt = DateTime.Now;
        
        context.Report.Update(report);
        await context.SaveChangesAsync(cancellationToken);
        return Result.Success("Report updated successfully.");
    }
}