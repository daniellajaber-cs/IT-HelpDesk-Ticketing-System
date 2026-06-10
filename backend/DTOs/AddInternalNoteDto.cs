namespace backend.DTOs
{
    public class AddInternalNoteDto
    {
        public int UserId { get; set; }

        public string Note { get; set; } = string.Empty;
    }
}
