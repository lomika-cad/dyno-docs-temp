using Application.Common.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Test.Common;

public class TestDbContextFactory
{
    public static IApplicationDbContext Create()
    {
        var options = new DbContextOptionsBuilder<TestApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new TestApplicationDbContext(options);
        return context;
    }

    public static async Task InitializeDbForTests(IApplicationDbContext context)
    {
        // Seed any common test data here if needed
        await context.SaveChangesAsync(CancellationToken.None);
    }
}
