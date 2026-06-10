using Microsoft.EntityFrameworkCore;

namespace backend.Models
{
    public class ActivityLog
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int? TicketId { get; set; }

        public string Action { get; set; } = string.Empty;

        public string? Details { get; set; }

        [Precision(18, 2)]
        public decimal DurationHours { get; set; }

        public DateTime LogDate { get; set; } = DateTime.Now;

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}
