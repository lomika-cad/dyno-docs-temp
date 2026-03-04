using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Dashboard.Queries;

public class GetBirthdayReminders : IRequest<List<BirthdayReminderDto>>
{
    public Guid TenantId { get; set; }
}

public class BirthdayReminderDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public DateTime UpcomingBirthday { get; set; }
    public int DaysRemaining { get; set; }
}

public class GetBirthdayRemindersHandler : IRequestHandler<GetBirthdayReminders, List<BirthdayReminderDto>>
{
    private readonly IApplicationDbContext _dbContext;

    public GetBirthdayRemindersHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<BirthdayReminderDto>> Handle(GetBirthdayReminders request, CancellationToken cancellationToken)
    {
        var today = DateTime.Today;
        var endDate = today.AddDays(14);

        var customers = await _dbContext.Customer
            .Where(c => c.TenantId == request.TenantId && c.DateOfBirth.HasValue)
            .ToListAsync(cancellationToken);

        var result = customers
            .Select(c =>
            {
                var dob = c.DateOfBirth!.Value;

                var upcoming = new DateTime(today.Year, dob.Month, dob.Day);

                if (upcoming < today)
                    upcoming = upcoming.AddYears(1);

                return new BirthdayReminderDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    DateOfBirth = dob,
                    UpcomingBirthday = upcoming,
                    DaysRemaining = (upcoming - today).Days
                };
            })
            .Where(x => x.UpcomingBirthday >= today && x.UpcomingBirthday <= endDate)
            .OrderBy(x => x.UpcomingBirthday)
            .ToList();

        return result;
    }
}