using Application.UserStories.Operations.Partnerships.Queries;
using Domain.Common;
using Test.Common;
using Xunit;

namespace Test.UserStories.Operations.Partnerships.Queries;

public class GetPartnershipListTest
{
    [Fact]
    public async Task Handle_ShouldReturnAllPartnerships()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var partnerships = new List<Domain.Entities.Operations.Partnership>
        {
            new()
            {
                Name = "Hotel Partnership",
                Description = "Hotel partnership description",
                District = "District A",
                PartnershipType = PartnershipTypes.Hotels,
                CreatedAt = DateTime.Now
            },
            new()
            {
                Name = "Transport Partnership",
                Description = "Transport partnership description",
                District = "District B",
                PartnershipType = PartnershipTypes.Transport,
                CreatedAt = DateTime.Now
            }
        };

        foreach (var partnership in partnerships)
        {
            context.Partnership.Add(partnership);
        }
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetPartnershipListHandler(context);
        var query = new GetPartnershipList();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Contains(result, p => p.Name == "Hotel Partnership");
        Assert.Contains(result, p => p.Name == "Transport Partnership");
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNone()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var handler = new GetPartnershipListHandler(context);
        var query = new GetPartnershipList();

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}
