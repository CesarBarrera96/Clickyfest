using Microsoft.AspNetCore.Mvc;
using ClickyFest.Api.Data;
using ClickyFest.Api.Models;
using Microsoft.AspNetCore.Hosting;
using System.IO;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using ClickyFest.Api.Services;

namespace ClickyFest.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ImagesController : ControllerBase
    {
        private readonly ClickyFestDbContext _context;
        private readonly IWebHostEnvironment _hostEnvironment;
        private readonly ImageUploadService _imageUploadService;

        public ImagesController(ClickyFestDbContext context, IWebHostEnvironment hostEnvironment, ImageUploadService imageUploadService)
        {
            _context = context;
            _hostEnvironment = hostEnvironment;
            _imageUploadService = imageUploadService;
        }

        [HttpPost("upload/{productId}")]
        public async Task<ActionResult<ProductImage>> UploadImage(int productId, IFormFile file)
        {
            if (productId <= 0)
            {
                return BadRequest("Product ID is invalid.");
            }

            var product = await _context.Products.FindAsync(productId);
            if (product == null)
            {
                return NotFound("Product not found.");
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest("No file uploaded.");
            }

            // Upload image to Azure Blob Storage
            var imageUrl = await _imageUploadService.UploadImageAsync(file, "product-images"); // Using 'product-images' as container name

            // Create ProductImage entry
            var productImage = new ProductImage
            {
                ProductID = productId,
                ImageUrl = imageUrl
            };

            _context.ProductImages.Add(productImage);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(UploadImage), new { id = productImage.ProductImageID }, productImage);
        }

        [HttpDelete("{imageId}")]
        [Authorize]
        public async Task<IActionResult> DeleteImage(int imageId)
        {
            var productImage = await _context.ProductImages.FindAsync(imageId);
            if (productImage == null)
            {
                return NotFound("Image not found.");
            }

            // Delete image from Azure Blob Storage
            var uri = new Uri(productImage.ImageUrl);
            var fileName = Path.GetFileName(uri.LocalPath);
            await _imageUploadService.DeleteImageAsync("product-images", fileName);

            // Remove from database
            _context.ProductImages.Remove(productImage);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}