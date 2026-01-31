using Application.Common.Interfaces;
using Domain.Entities.Operations;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.Templates.Queries;

public class GetTemplatesQuery : IRequest<List<Template>>{}

public class GetTemplatesQueryHandler : IRequestHandler<GetTemplatesQuery, List<Template>>
{
    private readonly IApplicationDbContext _dbContext;

    public GetTemplatesQueryHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<List<Template>> Handle(GetTemplatesQuery request, CancellationToken cancellationToken)
    {
        return await _dbContext.Template.ToListAsync(cancellationToken);
    }
}