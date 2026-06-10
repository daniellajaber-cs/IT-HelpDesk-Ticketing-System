namespace backend.DTOs
{
    public class AddActionLogDto
    {
        public int UserId { get; set; }

        public string Description { get; set; } = string.Empty;

        public string Type { get; set; } = string.Empty;

        public decimal DurationHours { get; set; }

        public DateTime LogDate { get; set; }
    }
}
