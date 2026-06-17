using backend.Data;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
public IActionResult GetStats()
{
    var totalTickets = _context.Tickets.Count();

    var openTickets = _context.Tickets.Count(t => t.StatusId == 1);
    var inProgressTickets = _context.Tickets.Count(t => t.StatusId == 2);
    var pendingTickets = _context.Tickets.Count(t => t.StatusId == 3);
    var resolvedTickets = _context.Tickets.Count(t => t.StatusId == 4);
    var closedTickets = _context.Tickets.Count(t => t.StatusId == 5);

    return Ok(new
    {
        totalTickets,
        openTickets,
        inProgressTickets,
        pendingTickets,
        resolvedTickets,
        closedTickets
    });
}

[HttpGet("tickets-by-status")]
public IActionResult GetTicketsByStatus()
{
    var data = _context.Statuses
        .Select(status => new
        {
            status = status.Name,
            count = _context.Tickets.Count(t => t.StatusId == status.Id)
        })
        .ToList();

    return Ok(data);
}

[HttpGet("tickets-by-category")]
public IActionResult GetTicketsByCategory()
{
    var data = _context.Categories
        .Select(category => new
        {
            category = category.Name,
            count = _context.Tickets.Count(t => t.CategoryId == category.Id)
        })
        .ToList();

    return Ok(data);
}

[HttpGet("tickets-by-priority")]
public IActionResult GetTicketsByPriority()
{
    var data = _context.Priorities
        .Select(priority => new
        {
            priority = priority.Name,
            count = _context.Tickets.Count(t => t.PriorityId == priority.Id)
        })
        .ToList();

    return Ok(data);
}

[HttpGet("recent-tickets")]
public IActionResult GetRecentTickets()
{
    var recentTickets = _context.Tickets
        .OrderByDescending(t => t.CreatedAt)
        .Take(5)
        .Select(ticket => new
        {
            id = ticket.Id,
            ticketNumber = ticket.TicketNumber,
            title = ticket.Title,
            createdByUserId = ticket.CreatedByUserId,
            assignedToUserId = ticket.AssignedToUserId,
            categoryId = ticket.CategoryId,
            priorityId = ticket.PriorityId,
            statusId = ticket.StatusId,
            createdAt = ticket.CreatedAt
        })
        .ToList();

    return Ok(recentTickets);
}
    }
}