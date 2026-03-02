using Application.Common;
using Application.Common.Interfaces;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Reports.Commands;

public class CreateReportCommand : IRequest<Result>
{
    public Guid TenantId { get; set; }
    public required string CustomerName { get; set; }
    public required string CustomerEmail { get; set; }
    public required string GeneratedReport { get; set; }
}

public class CreateReportCommandHandler(IApplicationDbContext context, ITenantService tenantService) : IRequestHandler<CreateReportCommand, Result>
{
    public async Task<Result> Handle(CreateReportCommand request, CancellationToken cancellationToken)
    {
        var report = new Report
        {
            Id = Guid.NewGuid(),
            CustomerName = request.CustomerName,
            CustomerEmail = request.CustomerEmail,
            GeneratedReport = request.GeneratedReport,
            CreatedAt = DateTime.Now,
        };

        context.Report.Add(report);
        
        var existingUserSubscriptions = await context.UserSubscription
            .Where(us => us.TenantId == request.TenantId)
            .FirstOrDefaultAsync(cancellationToken);
        
        if (existingUserSubscriptions == null)
        {
            return Result.Failure("No user subscriptions found for the tenant.");
        }
        
        if (existingUserSubscriptions.ReportsLimit <= 0)
        {
            return Result.Failure("Report limit reached for the tenant.");
        }
        
        existingUserSubscriptions.ReportsLimit -= 1;
        
        context.UserSubscription.Update(existingUserSubscriptions);
        
        await context.SaveChangesAsync(cancellationToken);

        return Result.Success("Report created successfully.");
    }
}