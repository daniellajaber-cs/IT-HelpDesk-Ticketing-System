namespace backend.DTOs
{
    public class KnowledgeBaseArticleDto
    {
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public int CreatedByUserId { get; set; }
    }
}