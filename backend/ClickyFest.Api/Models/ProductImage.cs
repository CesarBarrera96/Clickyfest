namespace ClickyFest.Api.Models
{
    public class ProductImage
    {
        public int ProductImageID { get; set; }
        public string ImageUrl { get; set; }  = default!; 
        public int ProductID { get; set; }
        public bool IsFeatured { get; set; } 
        // Relación con Product
        public Product? Product { get; set; }
    }
}