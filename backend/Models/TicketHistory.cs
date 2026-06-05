namespace backend.Models
{
    public class TicketHistory
    {
        public int Id { get; set; }

        public int TicketId { get; set; }

        public string Action { get; set; } = string.Empty;

        public string? OldValue { get; set; }

        public string? NewValue { get; set; }

        public int PerformedByUserId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}