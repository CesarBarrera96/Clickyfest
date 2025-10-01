using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace ClickyFest.Api.Models
{
    public class Product
    {
        public int ProductID { get; set; }
        public string Name { get; set; }  = default!; 
        public string? Description { get; set; } // El '?' indica que puede ser nulo
        public decimal Price { get; set; }
        public decimal? DiscountPrice { get; set; }
        public DateTime? DiscountEndDate { get; set; }
        public string? DemoUrl { get; set; }

        // Orden personalizado (no nulos para alinear con la restricción en BD)
        [Column("GlobalDisplayOrder")]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int GlobalDisplayOrder { get; set; }

        [Column("CategoryDisplayOrder")]
        [DatabaseGenerated(DatabaseGeneratedOption.None)]
        public int CategoryDisplayOrder { get; set; }

        // Relación con Category
        public int CategoryID { get; set; }
        public Category? Category { get; set; }
        
        // Relación con ProductImages
        public ICollection<ProductImage> ProductImages { get; set; } = new List<ProductImage>();
    }
}