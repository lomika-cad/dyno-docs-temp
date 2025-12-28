using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Application.Common;
using Application.Common.Interfaces;
using Dropbox.Api;
using Dropbox.Api.Files;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Services;

public class DropBoxService(IConfiguration configuration) : IDropBoxService
{
    public async Task<string> UploadImageAsync(IFormFile file, string folderPath)
    {
        if (file == null || file.Length == 0)
            throw new ArgumentException("File is empty or null.");

        string accessToken = await RefreshAccessTokenAsync(); 

        using var memoryStream = new MemoryStream();
        await file.CopyToAsync(memoryStream);
        memoryStream.Position = 0;

        string uniqueId = Guid.NewGuid().ToString();
        string fileName = Path.GetFileName(file.FileName);
        string newFileName = Path.GetFileNameWithoutExtension(fileName) + "_" + uniqueId + Path.GetExtension(fileName);
        string dropboxPath = $"/{folderPath}/{newFileName}";

        using var dbx = new DropboxClient(accessToken);
        try
        {
            await dbx.Files.UploadAsync(
                dropboxPath,
                WriteMode.Overwrite.Instance,
                body: memoryStream);

            var sharedLink = await dbx.Sharing.CreateSharedLinkWithSettingsAsync(dropboxPath);
            return sharedLink.Url;
        }
        catch (Exception ex)
        {
            throw new Exception("Error uploading to Dropbox: " + ex.Message);
        }
    }

    public async Task<Result> DeleteImageAsync(string imageUrl)
    {
        if (string.IsNullOrEmpty(imageUrl))
            throw new ArgumentException("Image URL is null or empty.");

        string accessToken = await RefreshAccessTokenAsync();

        using var dbx = new DropboxClient(accessToken);
        try
        {
            // Get metadata from the shared link to retrieve the path
            var sharedLinkMetadata = await dbx.Sharing.GetSharedLinkMetadataAsync(imageUrl);

            // Extract the path from metadata
            string dropboxPath = sharedLinkMetadata.AsFile.PathLower;
            await dbx.Files.DeleteV2Async(dropboxPath);
        }
        catch (Exception ex)
        {
            throw new Exception("Error deleting image from Dropbox: " + ex.Message);
        }
        
        return Result.Success("Image deleted successfully.");
    }
    
    
    private async Task<string> RefreshAccessTokenAsync()
    {
        var refreshToken = configuration["DropBoxServices:RefreshToken"];
        var appKey = configuration["DropBoxServices:AppKey"];
        var appSecret = configuration["DropBoxServices:AppSecret"];

        var client = new HttpClient();
        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.dropbox.com/oauth2/token");
        request.Headers.Authorization = new AuthenticationHeaderValue(
            "Basic", Convert.ToBase64String(Encoding.UTF8.GetBytes($"{appKey}:{appSecret}")));

        if (refreshToken != null)
            request.Content = new FormUrlEncodedContent(new[]
            {
                new KeyValuePair<string, string>("grant_type", "refresh_token"),
                new KeyValuePair<string, string>("refresh_token", refreshToken)
            });

        var response = await client.SendAsync(request);
        if (!response.IsSuccessStatusCode)
        {
            throw new Exception("Failed to refresh Dropbox access token.");
        }

        var json = await response.Content.ReadAsStringAsync();
        var tokenResponse = JsonSerializer.Deserialize<DropboxTokenResponse>(json);
        return tokenResponse!.AccessToken;
    }

    private class DropboxTokenResponse
    {
        [JsonPropertyName("access_token")]
        public string AccessToken { get; set; }
    }
}