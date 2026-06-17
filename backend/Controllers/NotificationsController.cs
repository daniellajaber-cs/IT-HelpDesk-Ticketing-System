using backend.Data;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("user/{userId}")]
        public IActionResult GetUserNotifications(int userId)
        {
            var notifications = _context.Notifications
                .Where(n => n.UserId == userId)
                .OrderByDescending(n => n.CreatedAt)
                .ToList();

            return Ok(notifications);
        }

        [HttpGet("user/{userId}/unread-count")]
public IActionResult GetUnreadCount(int userId)
{
    var count = _context.Notifications
        .Count(n => n.UserId == userId && n.IsRead == false);

    return Ok(new { count = count });
}

        [HttpPut("{id}/read")]
        public IActionResult MarkAsRead(int id)
        {
            var notification = _context.Notifications.FirstOrDefault(n => n.Id == id);

            if (notification == null)
            {
                return NotFound("Notification not found");
            }

            notification.IsRead = true;
            _context.SaveChanges();

            return Ok(notification);
        }
    }
}