using Application.UserStories.Operations.Partnerships.Commands;
using Domain.Common;
using Test.Common;
using Xunit;
using Microsoft.AspNetCore.Http;
using Moq;
using Microsoft.EntityFrameworkCore;

namespace Test.UserStories.Operations.Partnerships.Commands;

public class CreatePartnershipTest
{
    [Fact]
    public async Task Handle_ShouldCreatePartnership_WhenValidRequest()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new CreatePartnershipHandler(context);
        var command = new CreatePartnership
        {
            Name = "Test Partnership",
            Description = "A test partnership",
            District = "Test District",
            PartnershipType = PartnershipTypes.Hotels,
            Images = null // No images
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Partnership created successfully", result.Message);

        var partnership = await context.Partnership.FirstOrDefaultAsync(p => p.Name == command.Name);
        Assert.NotNull(partnership);
        Assert.Equal(command.Name, partnership.Name);
        Assert.Equal(command.Description, partnership.Description);
        Assert.Equal(command.District, partnership.District);
        Assert.Equal(command.PartnershipType, partnership.PartnershipType);
        Assert.Null(partnership.Images);
    }

    [Fact]
    public async Task Handle_ShouldCreatePartnership_WithImages()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new CreatePartnershipHandler(context);

        // Mock IFormFile
        var mockImage1 = new Mock<IFormFile>();
        var mockImage2 = new Mock<IFormFile>();
        var imageData1 = new byte[] { 1, 2, 3, 4, 5 };
        var imageData2 = new byte[] { 6, 7, 8, 9, 10 };

        mockImage1.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .Callback<Stream, CancellationToken>((stream, token) =>
            {
                stream.Write(imageData1, 0, imageData1.Length);
            });

        mockImage2.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .Callback<Stream, CancellationToken>((stream, token) =>
            {
                stream.Write(imageData2, 0, imageData2.Length);
            });

        var command = new CreatePartnership
        {
            Name = "Partnership with Images",
            Description = "A partnership with images",
            District = "Image District",
            PartnershipType = PartnershipTypes.Transport,
            Images = new[] { mockImage1.Object, mockImage2.Object }
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Partnership created successfully", result.Message);

        var partnership = await context.Partnership.FirstOrDefaultAsync(p => p.Name == command.Name);
        Assert.NotNull(partnership);
        Assert.Equal(command.Name, partnership.Name);
        Assert.NotNull(partnership.Images);
        Assert.Equal(2, partnership.Images.Length);
        Assert.Equal(imageData1, partnership.Images[0]);
        Assert.Equal(imageData2, partnership.Images[1]);
    }
}
