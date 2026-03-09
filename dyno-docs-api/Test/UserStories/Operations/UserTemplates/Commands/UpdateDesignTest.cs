using Application.UserStories.Operations.UserTemplates.Commands;
using Test.Common;
using Xunit;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.UserTemplates.Commands;

public class UpdateDesignTest
{
    [Fact]
    public async Task Handle_ShouldUpdateDesign_WhenExists()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        var templateId = Guid.NewGuid();

        // Set up existing user template assignment
        var userTemplate = new Domain.Entities.Operations.UserTemplate
        {
            UserId = userId,
            TemplateId = templateId,
            TemplateDesign = "<html>Original design</html>"
        };
        context.UserTemplate.Add(userTemplate);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new UpdateDesignHandler(context);
        var command = new UpdateDesign
        {
            UserId = userId,
            TemplateId = templateId,
            TemplateDesign = "<html>Updated design</html>"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Template design updated successfully.", result.Message);

        var updatedUserTemplate = await context.UserTemplate.FirstOrDefaultAsync(ut => ut.UserId == userId && ut.TemplateId == templateId);
        Assert.NotNull(updatedUserTemplate);
        Assert.Equal(command.TemplateDesign, updatedUserTemplate.TemplateDesign);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenUserTemplateNotFound()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();
        var templateId = Guid.NewGuid();

        // No user template assignment exists

        var handler = new UpdateDesignHandler(context);
        var command = new UpdateDesign
        {
            UserId = userId,
            TemplateId = templateId,
            TemplateDesign = "<html>Updated design</html>"
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("User template not found.", result.Message);
    }
}
