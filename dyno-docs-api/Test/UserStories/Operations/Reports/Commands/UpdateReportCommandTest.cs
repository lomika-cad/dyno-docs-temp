using Application.UserStories.Operations.Reports.Commands;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.Reports.Commands;

public class UpdateReportCommandTest
{
    [Fact]
    public async Task Handle_ShouldUpdateReport_WhenExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var existingReport = new Domain.Entities.Operations.Report
        {
            CustomerName = "John Doe",
            CustomerEmail = "john.doe@example.com",
            GeneratedReport = "Original report content",
            CreatedAt = DateTime.Now
        };
        context.Report.Add(existingReport);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new UpdateReportCommandHandler(context);
        var command = new UpdateReportCommand
        {
            ReportId = existingReport.Id,
            NewReportContent = "Updated report content"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Report updated successfully.", result.Message);

        var updatedReport = await context.Report.FirstOrDefaultAsync(r => r.Id == existingReport.Id);
        Assert.NotNull(updatedReport);
        Assert.Equal(command.NewReportContent, updatedReport.GeneratedReport);
        Assert.NotNull(updatedReport.LastModifiedAt);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenReportNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new UpdateReportCommandHandler(context);
        var command = new UpdateReportCommand
        {
            ReportId = Guid.NewGuid(), // Non-existent ID
            NewReportContent = "Updated report content"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Report not found.", result.Message);
    }
}
