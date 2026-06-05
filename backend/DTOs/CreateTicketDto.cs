namespace backend.DTOs
{
    public class CreateTicketDto
    {
        public string Title { get; set; } = string.Empty;

        public string Description { get; set; } = string.Empty;

        public int CreatedByUserId { get; set; }

        public int CategoryId { get; set; }

        public int PriorityId { get; set; }
    }
}