namespace backend.Models
{
    public class TicketAttachment
    {
        public int Id { get; set; }

        public int TicketId { get; set; }

        public int UploadedByUserId { get; set; }

        public string FileName { get; set; } = string.Empty;

        public string FilePath { get; set; } = string.Empty;

        public string FileType { get; set; } = string.Empty;

        public int FileSize { get; set; }

        public string? Description { get; set; }

        public DateTime UploadedAt { get; set; } = DateTime.Now;
    }
}