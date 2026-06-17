using Microsoft.AspNetCore.Http;

namespace backend.DTOs
{
    public class UploadAttachmentDto
    {
        public IFormFile File { get; set; } = default!;

        public int UploadedByUserId { get; set; }
    }
}
