namespace ClickyFest.Api.Models
{
    public class Category
    {
        public int CategoryID { get; set; }
        public string CategoryName { get; set; }  = default!; 
        // Podríamos añadir una relación a los productos aquí si fuera necesario
    }
}