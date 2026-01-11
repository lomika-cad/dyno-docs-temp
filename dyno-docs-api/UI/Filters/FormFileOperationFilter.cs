using System.Linq; // Ensure necessary using directives are included
using System.Collections.Generic;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace UI.Filters;

public class FormFileOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        // Use ApiDescription.ParameterDescriptions which correctly represents binding sources
        var apiParams = context.ApiDescription.ParameterDescriptions;

        var formParams = apiParams
            .Where(p => p.Source == BindingSource.Form || p.Type == typeof(IFormFile) || p.Type == typeof(IFormFile[]) || p.Type == typeof(IEnumerable<IFormFile>))
            .ToList();

        if (!formParams.Any())
            return;

        // Build properties for the multipart/form-data schema
        var props = new Dictionary<string, OpenApiSchema>();

        foreach (var p in apiParams)
        {
            var name = p.Name ?? string.Empty;

            if (p.Type == typeof(IFormFile))
            {
                props[name] = new OpenApiSchema { Type = "string", Format = "binary" };
                continue;
            }

            if (p.Type == typeof(IFormFile[]) || p.Type == typeof(IEnumerable<IFormFile>))
            {
                props[name] = new OpenApiSchema
                {
                    Type = "array",
                    Items = new OpenApiSchema { Type = "string", Format = "binary" }
                };
                continue;
            }

            // Default to string for simple form fields
            props[name] = new OpenApiSchema { Type = "string" };
        }

        operation.RequestBody = new OpenApiRequestBody
        {
            Content =
            {
                ["multipart/form-data"] = new OpenApiMediaType
                {
                    Schema = new OpenApiSchema
                    {
                        Type = "object",
                        Properties = props
                    }
                }
            }
        };

        // Remove any parameters that were added to the operation for form/file parameters
        if (operation.Parameters != null)
        {
            operation.Parameters = operation.Parameters
                .Where(p => !formParams.Any(fp => fp.Name == p.Name))
                .ToList();
        }
    }
}
