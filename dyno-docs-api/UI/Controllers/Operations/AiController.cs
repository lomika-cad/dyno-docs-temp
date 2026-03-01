using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace UI.Controllers.Operations
{
    [ApiController]
    [Route("api/ai")]
    public class AiController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _config;

        public AiController(IHttpClientFactory httpClientFactory, IConfiguration config)
        {
            _httpClientFactory = httpClientFactory;
            _config = config;
        }

        // Backward compatible: still supports { "transcript": "..." }
        // New: supports { "chat": "..." } or { "chat": [ { "role": "user", "content": "hi" }, ... ] }
        public record SummarizeRequest(string? Transcript = null, JsonElement? Chat = null);
        public record SummarizeResponse(string Summary);

        private record GroqMessage(string role, string content);
        private record GroqChatRequest(string model, List<GroqMessage> messages, double temperature = 0.2);
        private record GroqChoice(GroqMessage message);
        private record GroqChatResponse(List<GroqChoice> choices);

        [HttpPost("summarize")]
        public async Task<ActionResult<SummarizeResponse>> Summarize([FromBody] SummarizeRequest request)
        {
            if (request == null)
                return BadRequest("Request body is required.");

            var transcript = BuildTranscript(request);
            if (string.IsNullOrWhiteSpace(transcript))
                return BadRequest("Either 'chat' or 'transcript' is required.");

            var apiKey = _config["Ai:GroqApiKey"];
            var model = _config["Ai:GroqModel"] ?? "llama-3.1-8b-instant";

            if (string.IsNullOrWhiteSpace(apiKey))
                return StatusCode(500, "Groq API key not configured in appsettings.");

            var systemPrompt =
@"Summarize this chat conversation.

Return:
1) 5-10 bullet summary
2) Decisions
3) Action items
4) Open questions

Keep it concise.";

            var groqRequest = new GroqChatRequest(
                model,
                new List<GroqMessage>
                {
                    new("system", systemPrompt),
                    new("user", transcript)
                },
                0.2
            );

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", apiKey);

            var json = JsonSerializer.Serialize(groqRequest,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync(
                "https://api.groq.com/openai/v1/chat/completions",
                content
            );

            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, responseBody);

            var parsed = JsonSerializer.Deserialize<GroqChatResponse>(
                responseBody,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            var summary = parsed?.choices?.FirstOrDefault()?.message?.content?.Trim();

            if (string.IsNullOrWhiteSpace(summary))
                return StatusCode(500, "No summary returned.");

            return Ok(new SummarizeResponse(summary));
        }

        public record GenerateDayDescriptionRequest(
            int DayNumber,
            string? Date,
            string[] Places,
            string[] VisitingPlaces,
            string[] Services
        );
        public record GenerateDayDescriptionResponse(string Description);

        [HttpPost("generate-day-description")]
        public async Task<ActionResult<GenerateDayDescriptionResponse>> GenerateDayDescription([FromBody] GenerateDayDescriptionRequest request)
        {
            if (request == null)
                return BadRequest("Request body is required.");

            var apiKey = _config["Ai:GroqApiKey"];
            var model = _config["Ai:GroqModel"] ?? "llama-3.1-8b-instant";

            if (string.IsNullOrWhiteSpace(apiKey))
                return StatusCode(500, "Groq API key not configured in appsettings.");

            var systemPrompt =
@"You are a professional travel itinerary writer for a tourism agency.
Generate an engaging day description for a travel itinerary as bullet points.
Use '•' for each bullet point. Each bullet should be concise and informative (1-2 sentences max).
Focus on: places to explore, scenic highlights, activities, transport arrangements, and accommodation.
Keep the tone professional, exciting, and enticing for travellers.
Generate exactly 6-9 bullet points. Do not include headings or extra formatting — just the bullet points.";

            var placesInfo = request.Places?.Length > 0
                ? string.Join(", ", request.Places)
                : "Not specified";
            var regionsInfo = request.VisitingPlaces?.Length > 0
                ? string.Join(", ", request.VisitingPlaces)
                : "Not specified";
            var servicesInfo = request.Services?.Length > 0
                ? string.Join(", ", request.Services)
                : "None";

            var userMessage = $@"Generate bullet point descriptions for Day {request.DayNumber}{(string.IsNullOrWhiteSpace(request.Date) ? "" : $" ({request.Date})")} of the travel itinerary.

Regions/Districts visited: {regionsInfo}
Places to visit: {placesInfo}
Transport & activity services: {servicesInfo}

Write 6-9 engaging bullet points for this day.";

            var groqRequest = new GroqChatRequest(
                model,
                new List<GroqMessage>
                {
                    new("system", systemPrompt),
                    new("user", userMessage)
                },
                0.7
            );

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", apiKey);

            var json = JsonSerializer.Serialize(groqRequest,
                new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

            var content = new StringContent(json, Encoding.UTF8, "application/json");

            var response = await client.PostAsync(
                "https://api.groq.com/openai/v1/chat/completions",
                content
            );

            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
                return StatusCode((int)response.StatusCode, responseBody);

            var parsed = JsonSerializer.Deserialize<GroqChatResponse>(
                responseBody,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true }
            );

            var description = parsed?.choices?.FirstOrDefault()?.message?.content?.Trim();

            if (string.IsNullOrWhiteSpace(description))
                return StatusCode(500, "No description returned.");

            return Ok(new GenerateDayDescriptionResponse(description));
        }

        private static string BuildTranscript(SummarizeRequest request)
        {
            // Prefer `chat` when provided
            if (request.Chat is JsonElement el && el.ValueKind != JsonValueKind.Null && el.ValueKind != JsonValueKind.Undefined)
            {
                // If chat is provided as a plain string
                if (el.ValueKind == JsonValueKind.String)
                    return el.GetString() ?? string.Empty;

                // If chat is provided as an array of { role, content }
                if (el.ValueKind == JsonValueKind.Array)
                {
                    var sb = new StringBuilder();
                    foreach (var item in el.EnumerateArray())
                    {
                        if (item.ValueKind != JsonValueKind.Object) continue;

                        var role = item.TryGetProperty("role", out var r) && r.ValueKind == JsonValueKind.String
                            ? r.GetString()
                            : "user";

                        var content = item.TryGetProperty("content", out var c) && c.ValueKind == JsonValueKind.String
                            ? c.GetString()
                            : null;

                        if (string.IsNullOrWhiteSpace(content)) continue;

                        sb.Append('[').Append(role).Append("] ").AppendLine(content);
                    }
                    return sb.ToString().Trim();
                }

                // If chat is provided as an object like { transcript: "..." }
                if (el.ValueKind == JsonValueKind.Object)
                {
                    if (el.TryGetProperty("transcript", out var t) && t.ValueKind == JsonValueKind.String)
                        return t.GetString() ?? string.Empty;

                    if (el.TryGetProperty("chat", out var nested))
                    {
                        var nestedReq = new SummarizeRequest(null, nested);
                        return BuildTranscript(nestedReq);
                    }
                }
            }

            return request.Transcript?.Trim() ?? string.Empty;
        }
    }
}