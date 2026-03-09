using Application.Common.Interfaces;
using Application.UserStories.Operations.Places.Commands;
using Test.Common;
using Xunit;
using Microsoft.AspNetCore.Http;
using Moq;

namespace Test.UserStories.Operations.Places.Commands;

public class UploadPlacesExcelCommandTest
{
    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenFileIsEmpty()
    {
        // Arrange
        var mockExcelService = new Mock<IPlaceExcelService>();
        var handler = new UploadPlacesExcelCommandHandler(mockExcelService.Object);

        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(0); // Empty file
        mockFile.Setup(f => f.FileName).Returns("test.xlsx");

        var command = new UploadPlacesExcelCommand
        {
            File = mockFile.Object
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("No file uploaded", result.Message);
        mockExcelService.Verify(s => s.ProcessExcelFileAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldReturnFailure_WhenFileIsNotXlsx()
    {
        // Arrange
        var mockExcelService = new Mock<IPlaceExcelService>();
        var handler = new UploadPlacesExcelCommandHandler(mockExcelService.Object);

        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(100);
        mockFile.Setup(f => f.FileName).Returns("test.txt"); // Wrong extension

        var command = new UploadPlacesExcelCommand
        {
            File = mockFile.Object
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.False(result.Succeeded);
        Assert.Equal("Invalid file format. Only .xlsx files are supported", result.Message);
        mockExcelService.Verify(s => s.ProcessExcelFileAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Handle_ShouldProcessFile_WhenValidXlsx()
    {
        // Arrange
        var mockExcelService = new Mock<IPlaceExcelService>();
        mockExcelService.Setup(s => s.ProcessExcelFileAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((5, 2, new List<string> { "Error 1", "Error 2" })); // 5 success, 2 skipped, 2 errors

        var handler = new UploadPlacesExcelCommandHandler(mockExcelService.Object);

        var mockFile = new Mock<IFormFile>();
        mockFile.Setup(f => f.Length).Returns(1000);
        mockFile.Setup(f => f.FileName).Returns("places.xlsx");
        mockFile.Setup(f => f.CopyToAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()))
            .Callback<Stream, CancellationToken>((stream, token) =>
            {
                // Simulate copying file content
                var data = new byte[] { 1, 2, 3, 4, 5 };
                stream.Write(data, 0, data.Length);
            });

        var command = new UploadPlacesExcelCommand
        {
            File = mockFile.Object
        };

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        Assert.True(result.Succeeded);
        Assert.Equal("Processed 7 rows. Success: 5, Skipped: 2", result.Message);

        var data = result.GetData<dynamic>();
        Assert.NotNull(data);
        Assert.Equal(5, data.SuccessCount);
        Assert.Equal(2, data.SkippedCount);
        Assert.Equal(2, data.Errors.Length);

        mockExcelService.Verify(s => s.ProcessExcelFileAsync(It.IsAny<Stream>(), It.IsAny<CancellationToken>()), Times.Once);
    }
}
