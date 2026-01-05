using System.Linq; // Ensure necessary using directives are included
using Microsoft.AspNetCore.Mvc;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace UI.Filters;

public class FileUploadOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var fileParameters = context.ApiDescription.ParameterDescriptions
            .Where(p => p.Type == typeof(IFormFile) || p.Type == typeof(IFormFile[]))
            .ToList();

        if (!fileParameters.Any())
            return;

        // Clear existing parameters that are file uploads
        foreach (var param in fileParameters)
        {
            var paramToRemove = operation.Parameters?.FirstOrDefault(p => p.Name == param.Name);
            if (paramToRemove != null) // Add null check to avoid potential null reference
            {
                operation.Parameters.Remove(paramToRemove);
            }
        }

        operation.RequestBody = new OpenApiRequestBody
        {
            Required = true,
            Content = new Dictionary<string, OpenApiMediaType>
            {
                ["multipart/form-data"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema
                    {
                        Type = "object",
                        Properties = fileParameters.ToDictionary(
                            p => p.Name,
                            p => new OpenApiSchema
                            {
                                Type = "string",
                                Format = "binary"
                            }
                        ),
                        Required = fileParameters.Select(p => p.Name).ToHashSet()
                    }
                }
            }
        };
    }
}
