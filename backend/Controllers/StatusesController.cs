using backend.Data;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatusesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StatusesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetStatuses()
        {
            var statuses = _context.Statuses.ToList();
            return Ok(statuses);
        }
    }
}