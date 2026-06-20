namespace backend.Models
{
    public class KnowledgeBaseArticle
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;

        public string Content { get; set; } = string.Empty;

        public int CategoryId { get; set; }

        public int CreatedByUserId { get; set; }

        public bool IsPublished { get; set; } = true;

        public int Views { get; set; } = 0;

        public string Tags { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.Now;

        public DateTime? UpdatedAt { get; set; }
    }
}