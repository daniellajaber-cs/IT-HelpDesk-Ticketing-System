namespace backend.Models
{
    public class ActivityLog
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        public int? TicketId { get; set; }

        public string Action { get; set; } = string.Empty;

        public string? Details { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}