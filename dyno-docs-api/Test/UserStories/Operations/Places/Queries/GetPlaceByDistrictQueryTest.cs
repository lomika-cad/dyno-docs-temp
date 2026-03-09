using Application.UserStories.Operations.Places.Queries;
using Test.Common;
using Xunit;

namespace Test.UserStories.Operations.Places.Queries;

public class GetPlaceByDistrictQueryTest
{
    [Fact]
    public async Task Handle_ShouldReturnPlaces_FilteredByDistrictAndTenant()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId1 = Guid.NewGuid();
        var tenantId2 = Guid.NewGuid();

        var places = new List<Domain.Entities.Operations.Place>
        {
            new()
            {
                Name = "Place A1",
                AverageVisitDuration = "2 hours",
                District = "District A",
                City = "City A1",
                TenantId = tenantId1,
                CreatedAt = DateTime.Now,
                CreatedBy = "TestUser"
            },
            new()
            {
                Name = "Place A2",
                AverageVisitDuration = "3 hours",
                District = "District A",
                City = "City A2",
                TenantId = tenantId1,
                CreatedAt = DateTime.Now,
                CreatedBy = "TestUser"
            },
            new()
            {
                Name = "Place B1",
                AverageVisitDuration = "1 hour",
                District = "District B",
                City = "City B1",
                TenantId = tenantId1,
                CreatedAt = DateTime.Now,
                CreatedBy = "TestUser"
            },
            new()
            {
                Name = "Place A3",
                AverageVisitDuration = "4 hours",
                District = "District A",
                City = "City A3",
                TenantId = tenantId2, // Different tenant
                CreatedAt = DateTime.Now,
                CreatedBy = "TestUser"
            }
        };

        foreach (var place in places)
        {
            context.Places.Add(place);
        }
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetPlaceByNameQueryHandler(context);
        var query = new GetPlaceByDistrictQuery
        {
            TenantId = tenantId1,
            District = "District A"
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Contains(result, p => p.Name == "Place A1");
        Assert.Contains(result, p => p.Name == "Place A2");
        // Should not contain places from different tenant or district
        Assert.DoesNotContain(result, p => p.Name == "Place B1");
        Assert.DoesNotContain(result, p => p.Name == "Place A3");
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNoMatch()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid();

        var place = new Domain.Entities.Operations.Place
        {
            Name = "Place A",
            AverageVisitDuration = "2 hours",
            District = "District A",
            City = "City A",
            TenantId = tenantId,
            CreatedAt = DateTime.Now,
            CreatedBy = "TestUser"
        };
        context.Places.Add(place);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetPlaceByNameQueryHandler(context);
        var query = new GetPlaceByDistrictQuery
        {
            TenantId = tenantId,
            District = "NonExistentDistrict" // District that doesn't exist
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}
