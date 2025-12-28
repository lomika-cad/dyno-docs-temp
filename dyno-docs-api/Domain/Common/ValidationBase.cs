using System.ComponentModel.DataAnnotations;
using Domain.Common;
using Throw;
using Domain.Extensions;


namespace UI.Common;

public class ValidationBase
{
    public void ValidateModel()
    {
        ICollection<ValidationResult> results;
        var valid = DataAnnotationValidator.Validate(this, out results);
        if (!valid)
            Console.WriteLine(results.Select(o => o.ErrorMessage).ToJson());

        valid.Throw($"Validation error occured : {results.Select(o => o.ErrorMessage).ToJson()}").IfFalse();
    }
}