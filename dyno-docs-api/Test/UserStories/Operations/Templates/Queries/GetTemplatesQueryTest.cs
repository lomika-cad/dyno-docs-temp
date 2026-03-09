using Application.UserStories.Operations.Templates.Queries;
using Test.Common;
using Xunit;

namespace Test.UserStories.Operations.Templates.Queries;

public class GetTemplatesQueryTest
{
    [Fact]
    public async Task Handle_ShouldReturnAllTemplates()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var templates = new List<Domain.Entities.Operations.Template>
        {
            new()
            {
                TemplateName = "Free Template",
                TemplateThumbnail = new byte[] { 1, 2, 3 },
                TemplateDesign = "<html>Free design</html>",
                isPaid = false,
                Price = null,
                CreatedAt = DateTime.Now,
                CreatedBy = "System"
            },
            new()
            {
                TemplateName = "Paid Template",
                TemplateThumbnail = new byte[] { 4, 5, 6 },
                TemplateDesign = "<html>Paid design</html>",
                isPaid = true,
                Price = 19.99m,
                CreatedAt = DateTime.Now,
                CreatedBy = "System"
            }
        };

        foreach (var template in templates)
        {
            context.Template.Add(template);
        }
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetTemplatesQueryHandler(context);
        var query = new GetTemplatesQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Contains(result, t => t.TemplateName == "Free Template");
        Assert.Contains(result, t => t.TemplateName == "Paid Template");

        var freeTemplate = result.FirstOrDefault(t => t.TemplateName == "Free Template");
        Assert.NotNull(freeTemplate);
        Assert.False(freeTemplate.isPaid);
        Assert.Null(freeTemplate.Price);

        var paidTemplate = result.FirstOrDefault(t => t.TemplateName == "Paid Template");
        Assert.NotNull(paidTemplate);
        Assert.True(paidTemplate.isPaid);
        Assert.Equal(19.99m, paidTemplate.Price);
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNone()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new GetTemplatesQueryHandler(context);
        var query = new GetTemplatesQuery();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}
