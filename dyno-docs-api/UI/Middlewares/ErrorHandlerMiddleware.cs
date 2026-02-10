using System.Net;
using System.Text.Json;
using Application.Common;
using Microsoft.EntityFrameworkCore;

namespace UI.Middlewares;

public class ErrorHandlerMiddleware
{
    private readonly RequestDelegate _next;
         private readonly ILogger<ErrorHandlerMiddleware> _logger;

        public ErrorHandlerMiddleware(RequestDelegate next, ILogger<ErrorHandlerMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            var response = context.Response;

            var result = string.Empty;

            try
            {
                await _next(context);
            }
            catch (ArgumentException error)
            {
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                result = JsonSerializer.Serialize(Result.Failure(error.Message), new JsonSerializerOptions()
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                _logger.LogError("Exception : {@Error}", error);
                response.ContentType = "application/json";
                await response.WriteAsync(result);
            }
            catch (DbUpdateException error)
            {
                response.StatusCode = (int)HttpStatusCode.BadRequest;
                result = JsonSerializer.Serialize(Result.Failure(error.Message), new JsonSerializerOptions()
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                var traceCode = Guid.NewGuid();
                //_logger.LogError("Exception : {@TraceCode} {@Error} ", traceCode ,error.Message);
                //_logger.LogError("Exception : {@TraceCode} {Error} ", traceCode ,error);

                response.ContentType = "application/json";
                await response.WriteAsync(result);
            }
            catch (UnauthorizedAccessException error)
            {
                response.StatusCode = (int)HttpStatusCode.Forbidden;
                result = JsonSerializer.Serialize(Result.Failure(error.Message), new JsonSerializerOptions()
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                _logger.LogError("Exception : {@Error}", error);
                response.ContentType = "application/json";
                await response.WriteAsync(result);
            }
            catch (Application.Common.Exceptions.ForbiddenException error)
            {
                response.StatusCode = (int)HttpStatusCode.Forbidden;
                result = JsonSerializer.Serialize(Result.Failure(error.Message), new JsonSerializerOptions()
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });
                _logger.LogError("Exception : {@Error}", error);
                response.ContentType = "application/json";
                await response.WriteAsync(result);
            }
            catch (Exception error)
            {
                response.StatusCode = (int)HttpStatusCode.InternalServerError;

                result = JsonSerializer.Serialize(Result.Failure(error.Message), new JsonSerializerOptions()
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                });

                _logger.LogError("Exception : {@Error}", error);
                response.ContentType = "application/json";
                await response.WriteAsync(result);
            }
        }
}