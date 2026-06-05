namespace backend.Models
{
    public class Priority
    {
        public int Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public int Level { get; set; }

        public string? Description { get; set; }
    }
}