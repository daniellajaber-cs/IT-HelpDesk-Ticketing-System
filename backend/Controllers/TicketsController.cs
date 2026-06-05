using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TicketsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult GetTickets()
        {
            var tickets = _context.Tickets.ToList();
            return Ok(tickets);
        }

        [HttpGet("{id}")]
        public IActionResult GetTicketById(int id)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            return Ok(ticket);
        }

        [HttpPost]
        public IActionResult CreateTicket(CreateTicketDto request)
        {
            var ticket = new Ticket
            {
                TicketNumber = "TCK-" + DateTime.Now.ToString("yyyyMMddHHmmss"),
                Title = request.Title,
                Description = request.Description,
                CreatedByUserId = request.CreatedByUserId,
                CategoryId = request.CategoryId,
                PriorityId = request.PriorityId,
                StatusId = 1,
                CreatedAt = DateTime.Now
            };

            _context.Tickets.Add(ticket);
            _context.SaveChanges();

            return Ok(ticket);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateTicket(int id, UpdateTicketDto request)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            if (ticket.StatusId == 2)
            {
                return BadRequest("Cannot edit ticket because it is already In Progress.");
            }

            ticket.Title = request.Title;
            ticket.Description = request.Description;
            ticket.CategoryId = request.CategoryId;
            ticket.PriorityId = request.PriorityId;
            ticket.StatusId = request.StatusId;
            ticket.UpdatedAt = DateTime.Now;

            _context.SaveChanges();

            return Ok(ticket);
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteTicket(int id)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            if (ticket.AssignedToUserId != null)
            {
                return BadRequest("Cannot delete ticket because it is already assigned.");
            }

            _context.Tickets.Remove(ticket);
            _context.SaveChanges();

            return Ok("Ticket deleted successfully");
        }
    }
}