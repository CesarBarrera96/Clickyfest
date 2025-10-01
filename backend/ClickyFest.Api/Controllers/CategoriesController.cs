using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClickyFest.Api.Data;
using ClickyFest.Api.Models;

namespace ClickyFest.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly ClickyFestDbContext _context;

        public CategoriesController(ClickyFestDbContext context)
        {
            _context = context;
        }

        // GET: api/categories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            return await _context.Categories.ToListAsync();
        }
    }
}
