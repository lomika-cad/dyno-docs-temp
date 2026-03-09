using Application.UserStories.Operations.Templates.Commands;
using Test.Common;
using Xunit;
using Microsoft.AspNetCore.Http;
using Moq;
using Microsoft.EntityFrameworkCore;
using System.IO;

namespace Test.UserStories.Operations.Templates.Commands;

public class CreateTemplateCommandTest
{
    [Fact]
    public async Task Handle_ShouldCreateTemplate_WhenValidRequest()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new CreateTemplateCommandHandler(context);

        // Mock IFormFile
        var mockThumbnail = new Mock<IFormFile>();
        var thumbnailData = new byte[] { 1, 2, 3, 4, 5 };
        mockThumbnail.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .Callback<Stream, CancellationToken>((stream, token) =>
            {
                stream.Write(thumbnailData, 0, thumbnailData.Length);
            });

        var command = new CreateTemplateCommand
        {
            TemplateName = "Test Template",
            TemplateThumbnail = mockThumbnail.Object,
            TemplateDesign = "<html>Test design</html>",
            isPaid = true,
            Price = 9.99m
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Template created successfully", result.Message);

        var template = await context.Template.FirstOrDefaultAsync(t => t.TemplateName == command.TemplateName);
        Assert.NotNull(template);
        Assert.Equal(command.TemplateName, template.TemplateName);
        Assert.Equal(command.TemplateDesign, template.TemplateDesign);
        Assert.Equal(command.isPaid, template.isPaid);
        Assert.Equal(command.Price, template.Price);
        Assert.Equal("System", template.CreatedBy);
        Assert.Equal(thumbnailData, template.TemplateThumbnail);
    }
}
