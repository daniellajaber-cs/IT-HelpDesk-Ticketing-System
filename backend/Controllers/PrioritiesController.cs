using backend.Data;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PrioritiesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PrioritiesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetPriorities()
        {
            var priorities = _context.Priorities.ToList();
            return Ok(priorities);
        }
    }
}