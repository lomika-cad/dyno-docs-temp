using Application.UserStories.Identity.Commands;
using FluentValidation;

namespace Application.UserStories.Identity.Commands;

public class RegisterAgencyCommandValidator : AbstractValidator<RegisterAgencyCommand>
{
    public RegisterAgencyCommandValidator()
    {
        RuleFor(x => x.AgencyName)
            .NotEmpty().WithMessage("Agency name is required.")
            .MaximumLength(255).WithMessage("Agency name must not exceed 255 characters.");

        RuleFor(x => x.BusinessRegNo)
            .NotEmpty().WithMessage("Business registration number is required.")
            .MaximumLength(100).WithMessage("Business registration number must not exceed 100 characters.");

        RuleFor(x => x.ContactNo)
            .NotEmpty().WithMessage("Contact number is required.")
            .MaximumLength(25).WithMessage("Contact number must not exceed 25 characters.");

        RuleFor(x => x.Country)
            .NotEmpty().WithMessage("Country is required.")
            .MaximumLength(100).WithMessage("Country must not exceed 100 characters.");

        RuleFor(x => x.State)
            .NotEmpty().WithMessage("State is required.")
            .MaximumLength(100).WithMessage("State must not exceed 100 characters.");

        RuleFor(x => x.City)
            .NotEmpty().WithMessage("City is required.")
            .MaximumLength(100).WithMessage("City must not exceed 100 characters.");

        RuleFor(x => x.AgencyAddress)
            .NotEmpty().WithMessage("Agency address is required.")
            .MaximumLength(500).WithMessage("Agency address must not exceed 500 characters.");

        RuleFor(x => x.AgencyLogo)
            .NotNull().WithMessage("Agency logo is required.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("Full name is required.")
            .MaximumLength(255).WithMessage("Full name must not exceed 255 characters.");

        RuleFor(x => x.NICNo)
            .NotEmpty().WithMessage("NIC number is required.")
            .MaximumLength(25).WithMessage("NIC number must not exceed 25 characters.");

        RuleFor(x => x.MobileNo)
            .NotEmpty().WithMessage("Mobile number is required.")
            .MaximumLength(25).WithMessage("Mobile number must not exceed 25 characters.");

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email format.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(6).WithMessage("Password must be at least 6 characters long.");

        RuleFor(x => x)
            .Must(x => x.Password == x.ConfirmPassword).WithMessage("Password and confirm password do not match.");
    }
}
