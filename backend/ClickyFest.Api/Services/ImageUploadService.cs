using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

namespace ClickyFest.Api.Services
{
    public class ImageUploadService
    {
        private readonly IConfiguration _configuration;

        public ImageUploadService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task<string> UploadImageAsync(IFormFile file, string containerName)
        {
            var connectionString = _configuration["AzureBlobStorage:ConnectionString"];
            var blobServiceClient = new BlobServiceClient(connectionString);

            var blobContainerClient = blobServiceClient.GetBlobContainerClient(containerName);
            await blobContainerClient.CreateIfNotExistsAsync();
            await blobContainerClient.SetAccessPolicyAsync(PublicAccessType.Blob);

            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            var blobClient = blobContainerClient.GetBlobClient(fileName);

            await using (var stream = file.OpenReadStream())
            {
                var blobUploadOptions = new BlobUploadOptions
                {
                    HttpHeaders = new BlobHttpHeaders { ContentType = file.ContentType }
                };
                await blobClient.UploadAsync(stream, blobUploadOptions);
            }

            return blobClient.Uri.ToString();
        }

        public async Task DeleteImageAsync(string containerName, string fileName)
        {
            var connectionString = _configuration["AzureBlobStorage:ConnectionString"];
            var blobServiceClient = new BlobServiceClient(connectionString);

            var blobContainerClient = blobServiceClient.GetBlobContainerClient(containerName);

            var blobClient = blobContainerClient.GetBlobClient(fileName);

            await blobClient.DeleteIfExistsAsync();
        }
    }
}
