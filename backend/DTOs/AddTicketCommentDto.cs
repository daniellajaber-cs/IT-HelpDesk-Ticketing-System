namespace backend.DTOs
{
    public class AddTicketCommentDto
    {
        public int UserId { get; set; }

        public string CommentText { get; set; } = string.Empty;
    }
}
