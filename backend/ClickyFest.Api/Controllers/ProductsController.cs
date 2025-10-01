// ProductsController.cs - VERSIÓN FINAL CON PAGINACIÓN

using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClickyFest.Api.Data;
using ClickyFest.Api.Models;
using ClickyFest.Api.DTOS;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Data.SqlClient;

namespace ClickyFest.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly ClickyFestDbContext _context;

        public ProductsController(ClickyFestDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PagedResult<Product>>> GetProducts(
            [FromQuery] int? categoryId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10)
        {
            var query = _context.Products
                .Include(p => p.Category)       // Incluir categoría para mostrar el nombre en el admin
                .Include(p => p.ProductImages)
                .AsQueryable();

            if (categoryId.HasValue && categoryId > 0)
            {
                // Filtrar por categoría
                query = query.Where(p => p.CategoryID == categoryId.Value);

                // Ordenar por CategoryDisplayOrder, luego por GlobalDisplayOrder y por ID para estabilidad.
                query = query
                    .OrderBy(p => p.CategoryDisplayOrder)
                    .ThenBy(p => p.GlobalDisplayOrder)
                    .ThenBy(p => p.ProductID);
            }
            else
            {
                // Vista "Todos": usar el orden global y un orden estable por ID
                query = query
                    .OrderBy(p => p.GlobalDisplayOrder)
                    .ThenBy(p => p.ProductID);
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var pagedResult = new PagedResult<Product>(items, totalCount, page, pageSize);

            return Ok(pagedResult);
        }

        // GET: api/products/5 (Este método no cambia)
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.ProductImages)
                .FirstOrDefaultAsync(p => p.ProductID == id);

            if (product == null)
            {
                return NotFound();
            }

            return Ok(product);
        }

        [HttpPost]
        [Authorize]
        public async Task<ActionResult<Product>> CreateProduct([FromBody] Product product)
        {
            if (product == null)
            {
                return BadRequest("Invalid payload.");
            }

            // Normalizar colecciones para evitar referencias nulas
            product.ProductImages ??= new List<ProductImage>();

            // Validar categoría
            if (product.CategoryID <= 0)
            {
                return BadRequest("CategoryID es requerido.");
            }

            var categoryExists = await _context.Categories.AnyAsync(c => c.CategoryID == product.CategoryID);
            if (!categoryExists)
            {
                return BadRequest($"La categoría {product.CategoryID} no existe.");
            }

            try
            {
                // Calcular órdenes
                var maxGlobal = await _context.Products
                    .Select(p => (int?)p.GlobalDisplayOrder)
                    .MaxAsync() ?? 0;

                var maxCategory = await _context.Products
                    .Where(p => p.CategoryID == product.CategoryID)
                    .Select(p => (int?)p.CategoryDisplayOrder)
                    .MaxAsync() ?? 0;

                // Construir una nueva entidad explícitamente para evitar que EF ignore columnas en INSERT
                var newProduct = new Product
                {
                    Name = product.Name,
                    Description = product.Description,
                    Price = product.Price,
                    DiscountPrice = product.DiscountPrice,
                    DiscountEndDate = product.DiscountEndDate,
                    DemoUrl = product.DemoUrl,
                    CategoryID = product.CategoryID,
                    GlobalDisplayOrder = maxGlobal + 1,
                    CategoryDisplayOrder = maxCategory + 1,
                    ProductImages = new List<ProductImage>() // no se crean imágenes en el POST de producto
                };

                _context.Products.Add(newProduct);

                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetProduct), new { id = newProduct.ProductID }, newProduct);
            }
            catch (DbUpdateException ex)
            {
                return Problem(
                    detail: ex.InnerException?.Message ?? ex.Message,
                    statusCode: 400,
                    title: "Error al crear el producto (DbUpdateException)"
                );
            }
            catch (SqlException ex)
            {
                // Típicamente cuando faltan columnas en la BD (Invalid column name ...)
                return Problem(
                    detail: ex.Message,
                    statusCode: 500,
                    title: "Error de SQL al crear el producto. Verifica que la BD tenga GlobalDisplayOrder y CategoryDisplayOrder"
                );
            }
            catch (Exception ex)
            {
                return Problem(
                    detail: ex.InnerException?.Message ?? ex.Message,
                    statusCode: 500,
                    title: "Error inesperado al crear el producto"
                );
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateProduct(int id, Product product)
        {
            if (id != product.ProductID)
            {
                return BadRequest();
            }

            var existingProduct = await _context.Products
                .Include(p => p.ProductImages)
                .FirstOrDefaultAsync(p => p.ProductID == id);

            if (existingProduct == null)
            {
                return NotFound();
            }

            // Preservar órdenes actuales para no sobreescribirlas desde el formulario
            var oldGlobalOrder = existingProduct.GlobalDisplayOrder;
            var oldCategoryOrder = existingProduct.CategoryDisplayOrder;

            // Actualizar propiedades escalares del producto
            _context.Entry(existingProduct).CurrentValues.SetValues(product);

            // Restaurar órdenes
            existingProduct.GlobalDisplayOrder = oldGlobalOrder;
            existingProduct.CategoryDisplayOrder = oldCategoryOrder;

            // Actualizar el estado de IsFeatured en las imágenes
            if (product.ProductImages != null && existingProduct.ProductImages != null)
            {
                var incomingImages = product.ProductImages.ToDictionary(img => img.ProductImageID);
                foreach (var dbImage in existingProduct.ProductImages)
                {
                    if (incomingImages.TryGetValue(dbImage.ProductImageID, out var incomingImage))
                    {
                        if (dbImage.IsFeatured != incomingImage.IsFeatured)
                        {
                            dbImage.IsFeatured = incomingImage.IsFeatured;
                            _context.Entry(dbImage).State = EntityState.Modified;
                        }
                    }
                }
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        [Authorize]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Reordenamiento global: actualiza GlobalDisplayOrder para los productos enviados
        [HttpPost("reorder/global")]
        [Authorize]
        public async Task<IActionResult> ReorderGlobal([FromBody] List<ReorderItemDto> items)
        {
            if (items == null || items.Count == 0)
                return BadRequest("No items provided.");

            var ids = items.Select(i => i.ProductId).ToList();
            var products = await _context.Products
                .Where(p => ids.Contains(p.ProductID))
                .ToListAsync();

            var map = items.ToDictionary(i => i.ProductId, i => i.Order);

            foreach (var p in products)
            {
                if (map.TryGetValue(p.ProductID, out var order))
                {
                    p.GlobalDisplayOrder = order;
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // Reordenamiento por categoría: actualiza CategoryDisplayOrder para los productos de esa categoría
        [HttpPost("reorder/category/{categoryId}")]
        [Authorize]
        public async Task<IActionResult> ReorderCategory(int categoryId, [FromBody] List<ReorderItemDto> items)
        {
            if (categoryId <= 0)
                return BadRequest("Invalid category.");
            if (items == null || items.Count == 0)
                return BadRequest("No items provided.");

            var ids = items.Select(i => i.ProductId).ToList();
            var products = await _context.Products
                .Where(p => p.CategoryID == categoryId && ids.Contains(p.ProductID))
                .ToListAsync();

            var map = items.ToDictionary(i => i.ProductId, i => i.Order);

            foreach (var p in products)
            {
                if (map.TryGetValue(p.ProductID, out var order))
                {
                    p.CategoryDisplayOrder = order;
                }
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool ProductExists(int id)
        {
            return _context.Products.Any(e => e.ProductID == id);
        }
    }
}