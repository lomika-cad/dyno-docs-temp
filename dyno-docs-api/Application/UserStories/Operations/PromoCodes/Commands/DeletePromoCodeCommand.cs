using Application.Common;
using Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.UserStories.Operations.PromoCodes.Commands;

public class DeletePromoCodeCommand : IRequest<Result>
{
    public Guid Id { get; set; }
}

public class DeletePromoCodeCommandHandler : IRequestHandler<DeletePromoCodeCommand, Result>
{
    private readonly IApplicationDbContext _dbContext;

    public DeletePromoCodeCommandHandler(IApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<Result> Handle(DeletePromoCodeCommand request, CancellationToken cancellationToken)
    {
        var entity = await _dbContext.PromoCode
            .FirstOrDefaultAsync(p => p.Id == request.Id, cancellationToken);

        if (entity == null)
        {
            return Result.Failure("Promo code not found");
        }

        _dbContext.PromoCode.Remove(entity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Result.Success("Promo code deleted successfully");
    }
}
