using Application.UserStories.Operations.UserTemplates.Commands;
using Test.Common;
using Xunit;
using Moq;
using Microsoft.EntityFrameworkCore;
using MediatR;

namespace Test.UserStories.Operations.UserTemplates.Commands;

public class AssignTemplateTest
{
    [Fact]
    public async Task Handle_ShouldAssignTemplate_WhenValid()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var mockMediator = new Mock<IMediator>();
        var userId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();

        // Set up user subscription with available templates
        var userSubscription = new Domain.Entities.Operations.UserSubscription
        {
            TenantId = tenantId,
            PlanId = 2,
            PlanName = "Professional",
            TemplatesLimit = 5,
            IsActive = true,
            CreatedAt = DateTime.Now
        };
        context.UserSubscription.Add(userSubscription);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new AssignTemplateHandler(context, mockMediator.Object);
        var command = new AssignTemplate
        {
            UserId = userId,
            TemplateId = templateId,
            TemplateDesign = "<html>Custom design</html>",
            TenantId = tenantId
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Template assigned to user successfully.", result.Message);

        var userTemplate = await context.UserTemplate.FirstOrDefaultAsync(ut => ut.UserId == userId && ut.TemplateId == templateId);
        Assert.NotNull(userTemplate);
        Assert.Equal(command.TemplateDesign, userTemplate.TemplateDesign);

        // Verify mediator was called to update template limit
        mockMediator.Verify(m => m.Send(It.IsAny<Application.UserStories.Operations.UserSubscriptions.Commands.UpdateTemplateLimitCommand>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenTemplateLimitReached()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var mockMediator = new Mock<IMediator>();
        var userId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();

        // Set up user subscription with no available templates
        var userSubscription = new Domain.Entities.Operations.UserSubscription
        {
            TenantId = tenantId,
            PlanId = 1,
            PlanName = "Free",
            TemplatesLimit = 0, // No templates available
            IsActive = true,
            CreatedAt = DateTime.Now
        };
        context.UserSubscription.Add(userSubscription);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new AssignTemplateHandler(context, mockMediator.Object);
        var command = new AssignTemplate
        {
            UserId = userId,
            TemplateId = templateId,
            TemplateDesign = "<html>Custom design</html>",
            TenantId = tenantId
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("User has reached the maximum number of assigned templates.", result.Message);

        // Verify no user template was created
        var userTemplateCount = await context.UserTemplate.CountAsync();
        Assert.Equal(0, userTemplateCount);

        // Verify mediator was not called
        mockMediator.Verify(m => m.Send(It.IsAny<Application.UserStories.Operations.UserSubscriptions.Commands.UpdateTemplateLimitCommand>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenAlreadyAssigned()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var mockMediator = new Mock<IMediator>();
        var userId = Guid.NewGuid();
        var templateId = Guid.NewGuid();
        var tenantId = Guid.NewGuid();

        // Set up existing user template assignment
        var existingUserTemplate = new Domain.Entities.Operations.UserTemplate
        {
            UserId = userId,
            TemplateId = templateId,
            TemplateDesign = "<html>Existing design</html>"
        };
        context.UserTemplate.Add(existingUserTemplate);

        // Set up user subscription with available templates
        var userSubscription = new Domain.Entities.Operations.UserSubscription
        {
            TenantId = tenantId,
            PlanId = 2,
            PlanName = "Professional",
            TemplatesLimit = 5,
            IsActive = true,
            CreatedAt = DateTime.Now
        };
        context.UserSubscription.Add(userSubscription);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new AssignTemplateHandler(context, mockMediator.Object);
        var command = new AssignTemplate
        {
            UserId = userId,
            TemplateId = templateId, // Same template already assigned
            TemplateDesign = "<html>New design</html>",
            TenantId = tenantId
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Template is already assigned to the user.", result.Message);

        // Verify mediator was not called
        mockMediator.Verify(m => m.Send(It.IsAny<Application.UserStories.Operations.UserSubscriptions.Commands.UpdateTemplateLimitCommand>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
