using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

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
            int lastTicketId = 0;

            if (_context.Tickets.Any())
            {
                lastTicketId = _context.Tickets.Max(t => t.Id);
            }

            int nextTicketNumber = lastTicketId + 1;

            var ticket = new Ticket
            {
                TicketNumber = $"TCK-{nextTicketNumber:D4}",
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

            var history = new TicketHistory
            {
                TicketId = ticket.Id,
                Action = "Ticket Created",
                OldValue = null,
                NewValue = ticket.Title,
                PerformedByUserId = ticket.CreatedByUserId,
                CreatedAt = DateTime.Now
            };

            _context.TicketHistories.Add(history);
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

        [HttpPut("{id}/assign")]
        public IActionResult AssignTicket(int id, AssignTicketDto request)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            string oldAssignedUserName = "Unassigned";

            if (ticket.AssignedToUserId != null)
            {
                var oldAssignedUser = _context.Users.FirstOrDefault(u => u.Id == ticket.AssignedToUserId);

                if (oldAssignedUser != null)
                {
                    oldAssignedUserName = oldAssignedUser.FullName;
                }
            }

            var newAssignedUser = _context.Users.FirstOrDefault(u => u.Id == request.AssignedToUserId);

            if (newAssignedUser == null)
            {
                return BadRequest("Assigned user not found");
            }

            ticket.AssignedToUserId = request.AssignedToUserId;
            ticket.UpdatedAt = DateTime.Now;

            var history = new TicketHistory
            {
                TicketId = ticket.Id,
                Action = "Ticket Assigned",
                OldValue = oldAssignedUserName,
                NewValue = newAssignedUser.FullName,
                PerformedByUserId = GetCurrentUserId() ?? request.AssignedToUserId,
                CreatedAt = DateTime.Now
            };

            _context.TicketHistories.Add(history);
            _context.SaveChanges();

            return Ok(ticket);
        }

        [HttpPut("{id}/status")]
        public IActionResult UpdateTicketStatus(int id, UpdateTicketStatusDto request)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            var oldStatus = _context.Statuses.FirstOrDefault(s => s.Id == ticket.StatusId);
            var status = _context.Statuses.FirstOrDefault(s => s.Id == request.StatusId);

            if (status == null)
            {
                return BadRequest("Status not found");
            }

            ticket.StatusId = request.StatusId;
            ticket.UpdatedAt = DateTime.Now;

            if (status.Name.ToLower() == "resolved")
            {
                ticket.ResolvedAt = DateTime.Now;
            }

            if (status.Name.ToLower() == "closed")
            {
                ticket.ClosedAt = DateTime.Now;
            }

            var history = new TicketHistory
            {
                TicketId = ticket.Id,
                Action = "Status Changed",
                OldValue = oldStatus != null ? oldStatus.Name : "Unknown",
                NewValue = status.Name,
                PerformedByUserId = GetCurrentUserId() ?? ticket.CreatedByUserId,
                CreatedAt = DateTime.Now
            };

            _context.TicketHistories.Add(history);
            _context.SaveChanges();

            return Ok(ticket);
        }

        [HttpGet("{id}/history")]
        public IActionResult GetTicketHistory(int id)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            var history = _context.TicketHistories
                .Where(item => item.TicketId == id)
                .OrderByDescending(item => item.CreatedAt)
                .ToList();

            return Ok(history);
        }

        [HttpGet("{id}/comments")]
        public IActionResult GetTicketComments(int id)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            var comments = _context.TicketComments
                .Where(comment => comment.TicketId == id)
                .OrderBy(comment => comment.CreatedAt)
                .Select(comment => new
                {
                    comment.Id,
                    comment.TicketId,
                    comment.UserId,
                    comment.CommentText,
                    comment.CreatedAt,
                    UserFullName = _context.Users
                        .Where(user => user.Id == comment.UserId)
                        .Select(user => user.FullName)
                        .FirstOrDefault(),
                    UserRole = _context.Users
                        .Where(user => user.Id == comment.UserId)
                        .Select(user => user.Role)
                        .FirstOrDefault()
                })
                .ToList();

            return Ok(comments);
        }

        [HttpPost("{id}/comments")]
        public IActionResult AddTicketComment(int id, AddTicketCommentDto request)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            var user = _context.Users.FirstOrDefault(u => u.Id == request.UserId);

            if (user == null)
            {
                return BadRequest("User not found");
            }

            bool isAdmin = user.Role == "Admin";
            bool isManager = user.Role == "Manager";
            bool isTicketCreator = user.Role == "Employee" && ticket.CreatedByUserId == user.Id;
            bool isAssignedAgent = user.Role == "IT Support Agent" && ticket.AssignedToUserId == user.Id;

            if (!isAdmin && !isManager && !isTicketCreator && !isAssignedAgent)
            {
                return Unauthorized("You are not allowed to comment on this ticket.");
            }

            var comment = new TicketComment
            {
                TicketId = id,
                UserId = request.UserId,
                CommentText = request.CommentText,
                CreatedAt = DateTime.Now
            };

            _context.TicketComments.Add(comment);
            _context.TicketHistories.Add(new TicketHistory
            {
                TicketId = ticket.Id,
                Action = "Comment Added",
                OldValue = null,
                NewValue = comment.CommentText,
                PerformedByUserId = comment.UserId,
                CreatedAt = DateTime.Now
            });
            _context.SaveChanges();

            return Ok(new
            {
                comment.Id,
                comment.TicketId,
                comment.UserId,
                comment.CommentText,
                comment.CreatedAt,
                UserFullName = user.FullName,
                UserRole = user.Role
            });
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

        private int? GetCurrentUserId()
        {
            string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(userId, out int parsedUserId))
            {
                return parsedUserId;
            }

            return null;
        }
    }
}
