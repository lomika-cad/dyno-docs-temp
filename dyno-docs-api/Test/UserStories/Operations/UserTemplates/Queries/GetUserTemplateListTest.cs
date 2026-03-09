using Application.UserStories.Operations.UserTemplates.Queries;
using Test.Common;
using Xunit;

namespace Test.UserStories.Operations.UserTemplates.Queries;

public class GetUserTemplateListTest
{
    [Fact]
    public async Task Handle_ShouldReturnUserTemplates_WithBase64Thumbnails()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var userId = Guid.NewGuid();

        // Set up templates
        var template1 = new Domain.Entities.Operations.Template
        {
            TemplateName = "Template 1",
            TemplateThumbnail = new byte[] { 1, 2, 3 },
            TemplateDesign = "<html>Template 1 design</html>",
            CreatedAt = DateTime.Now,
            CreatedBy = "System"
        };
        var template2 = new Domain.Entities.Operations.Template
        {
            TemplateName = "Template 2",
            TemplateThumbnail = new byte[] { 4, 5, 6 },
            TemplateDesign = "<html>Template 2 design</html>",
            CreatedAt = DateTime.Now,
            CreatedBy = "System"
        };
        context.Template.Add(template1);
        context.Template.Add(template2);

        // Set up user template assignments
        var userTemplate1 = new Domain.Entities.Operations.UserTemplate
        {
            UserId = userId,
            TemplateId = template1.Id,
            TemplateDesign = "<html>Custom design 1</html>"
        };
        var userTemplate2 = new Domain.Entities.Operations.UserTemplate
        {
            UserId = userId,
            TemplateId = template2.Id,
            TemplateDesign = "<html>Custom design 2</html>"
        };
        context.UserTemplate.Add(userTemplate1);
        context.UserTemplate.Add(userTemplate2);

        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetUserTemplateListHandler(context);
        var query = new GetUserTemplateList
        {
            UserId = userId
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);

        var dto1 = result.FirstOrDefault(dto => dto.TemplateId == template1.Id);
        Assert.NotNull(dto1);
        Assert.Equal("Template 1", dto1.TemplateName);
        Assert.Equal($"data:image/png;base64,{Convert.ToBase64String(new byte[] { 1, 2, 3 })}", dto1.TemplateThumbnail);
        Assert.Equal("<html>Custom design 1</html>", dto1.TemplateDesign);

        var dto2 = result.FirstOrDefault(dto => dto.TemplateId == template2.Id);
        Assert.NotNull(dto2);
        Assert.Equal("Template 2", dto2.TemplateName);
        Assert.Equal($"data:image/png;base64,{Convert.ToBase64String(new byte[] { 4, 5, 6 })}", dto2.TemplateThumbnail);
        Assert.Equal("<html>Custom design 2</html>", dto2.TemplateDesign);
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNoAssignments()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var userId = Guid.NewGuid(); // User with no template assignments

        var handler = new GetUserTemplateListHandler(context);
        var query = new GetUserTemplateList
        {
            UserId = userId
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}
