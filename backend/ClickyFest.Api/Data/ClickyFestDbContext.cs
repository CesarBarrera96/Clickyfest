using Microsoft.EntityFrameworkCore;
using ClickyFest.Api.Models;

namespace ClickyFest.Api.Data
{
    public class ClickyFestDbContext : DbContext
    {
        public ClickyFestDbContext(DbContextOptions<ClickyFestDbContext> options) : base(options)
        {
        }

        public DbSet<Category> Categories { get; set; }
        public DbSet<Product> Products { get; set; }
        public DbSet<ProductImage> ProductImages { get; set; }
        public DbSet<AdminUser> AdminUsers { get; set; }
    }
}