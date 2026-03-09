using Application.UserStories.Operations.UserTemplates.Commands;
using Test.Common;
using Xunit;
using Moq;
using Microsoft.EntityFrameworkCore;
using MediatR;

namespace Test.UserStories.Operations.UserTemplates.Commands;

public class UnassignTemplateTest
{
    [Fact]
    public async Task Handle_ShouldUnassignTemplate_WhenExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var mockMediator = new Mock<IMediator>();
        var userId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();

        // Set up existing user template assignment
        var userTemplate = new Domain.Entities.Operations.UserTemplate
        {
            UserId = userId,
            TemplateId = templateId,
            TemplateDesign = "<html>Existing design</html>"
        };
        context.UserTemplate.Add(userTemplate);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new UnassignTemplateHandler(context, mockMediator.Object);
        var command = new UnassignTemplate
        {
            TemplateId = templateId,
            UserId = userId,
            TenantId = tenantId
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Template unassigned from user successfully.", result.Message);

        var deletedUserTemplate = await context.UserTemplate.FirstOrDefaultAsync(ut => ut.UserId == userId && ut.TemplateId == templateId);
        Assert.Null(deletedUserTemplate);

        // Verify mediator was called to update template limit
        mockMediator.Verify(m => m.Send(It.IsAny<Application.UserStories.Operations.UserSubscriptions.Commands.UpdateTemplateLimitCommand>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenAssignmentNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var mockMediator = new Mock<IMediator>();
        var userId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();

        // No user template assignment exists

        var handler = new UnassignTemplateHandler(context, mockMediator.Object);
        var command = new UnassignTemplate
        {
            TemplateId = templateId,
            UserId = userId,
            TenantId = tenantId
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Template assignment not found for the specified user.", result.Message);

        // Verify mediator was not called
        mockMediator.Verify(m => m.Send(It.IsAny<Application.UserStories.Operations.UserSubscriptions.Commands.UpdateTemplateLimitCommand>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
