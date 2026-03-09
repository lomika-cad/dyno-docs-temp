using Application.UserStories.Operations.Partnerships.Queries;
using Domain.Common;
using Test.Common;
using Xunit;

namespace Test.UserStories.Operations.Partnerships.Queries;

public class GetPartnershipsByDistrictTest
{
    [Fact]
    public async Task Handle_ShouldReturnPartnerships_FilteredByDistrictAndTenant()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId1 = Guid.NewGuid();
        var tenantId2 = Guid.NewGuid();

        var partnerships = new List<Domain.Entities.Operations.Partnership>
        {
            new()
            {
                Name = "Hotel A",
                Description = "Hotel in District A",
                District = "District A",
                PartnershipType = PartnershipTypes.Hotels,
                TenantId = tenantId1,
                CreatedAt = DateTime.Now
            },
            new()
            {
                Name = "Transport A",
                Description = "Transport in District A",
                District = "District A",
                PartnershipType = PartnershipTypes.Transport,
                TenantId = tenantId1,
                CreatedAt = DateTime.Now
            },
            new()
            {
                Name = "Hotel B",
                Description = "Hotel in District B",
                District = "District B",
                PartnershipType = PartnershipTypes.Hotels,
                TenantId = tenantId1,
                CreatedAt = DateTime.Now
            },
            new()
            {
                Name = "Hotel A Tenant 2",
                Description = "Hotel in District A for tenant 2",
                District = "District A",
                PartnershipType = PartnershipTypes.Hotels,
                TenantId = tenantId2,
                CreatedAt = DateTime.Now
            }
        };

        foreach (var partnership in partnerships)
        {
            context.Partnership.Add(partnership);
        }
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetPartnershipsByDistrictHandler(context);
        var query = new GetPartnershipsByDistrict
        {
            TenantId = tenantId1,
            District = "District A"
        };

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count);
        Assert.Contains(result, p => p.Name == "Hotel A");
        Assert.Contains(result, p => p.Name == "Transport A");
        // Should not contain partnerships from different tenant or district
        Assert.DoesNotContain(result, p => p.Name == "Hotel B");
        Assert.DoesNotContain(result, p => p.Name == "Hotel A Tenant 2");
    }

    [Fact]
    public async Task Handle_ShouldReturnEmptyList_WhenNoMatch()
    {
        // Arrange
        var context = TestDbContextFactory.Create();
        var tenantId = Guid.NewGuid();

        var partnership = new Domain.Entities.Operations.Partnership
        {
            Name = "Hotel A",
            Description = "Hotel in District A",
            District = "District A",
            PartnershipType = PartnershipTypes.Hotels,
            TenantId = tenantId,
            CreatedAt = DateTime.Now
        };
        context.Partnership.Add(partnership);
        await context.SaveChangesAsync(CancellationToken.None);

        var handler = new GetPartnershipsByDistrictHandler(context);
        var query = new GetPartnershipsByDistrict
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
