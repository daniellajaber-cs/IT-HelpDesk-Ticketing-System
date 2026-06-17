using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TicketsController : ControllerBase
    {
        private const long MaxAttachmentFileSize = 10 * 1024 * 1024;
        private const string InvalidAttachmentTypeMessage = "Invalid file type. Only PNG, JPG, JPEG, PDF, DOC, DOCX, XLS, XLSX, PPT, and PPTX files are allowed.";
        private const string AttachmentSizeExceededMessage = "File size exceeds the maximum allowed size of 10 MB.";
        private static readonly HashSet<string> AllowedAttachmentExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".png",
            ".jpg",
            ".jpeg",
            ".pdf",
            ".doc",
            ".docx",
            ".xls",
            ".xlsx",
            ".ppt",
            ".pptx"
        };

        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public TicketsController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        [HttpGet]
        public IActionResult GetTickets()
        {
            var tickets = _context.Tickets.ToList();
            return Ok(tickets);
        }

        [HttpGet("{id}")]
        public IActionResult GetTicketById(int id)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            return Ok(ticket);
        }

        [HttpPost]
        public IActionResult CreateTicket(CreateTicketDto request)
        {
            int lastTicketId = 0;

            if (_context.Tickets.Any())
            {
                lastTicketId = _context.Tickets.Max(t => t.Id);
            }

            int nextTicketNumber = lastTicketId + 1;

            var ticket = new Ticket
            {
                TicketNumber = $"TCK-{nextTicketNumber:D4}",
                Title = request.Title,
                Description = request.Description,
                CreatedByUserId = request.CreatedByUserId,
                CategoryId = request.CategoryId,
                PriorityId = request.PriorityId,
                StatusId = 1,
                CreatedAt = DateTime.Now
            };

            _context.Tickets.Add(ticket);
            _context.SaveChanges();

            var history = new TicketHistory
            {
                TicketId = ticket.Id,
                Action = "Ticket Created",
                OldValue = null,
                NewValue = ticket.Title,
                PerformedByUserId = ticket.CreatedByUserId,
                CreatedAt = DateTime.Now
            };

            _context.TicketHistories.Add(history);
            _context.SaveChanges();

            return Ok(ticket);
        }

        [HttpPut("{id}")]
        public IActionResult UpdateTicket(int id, UpdateTicketDto request)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            ticket.Title = request.Title;
            ticket.Description = request.Description;
            ticket.CategoryId = request.CategoryId;
            ticket.PriorityId = request.PriorityId;
            ticket.StatusId = request.StatusId;
            ticket.UpdatedAt = DateTime.Now;

            _context.SaveChanges();

            return Ok(ticket);
        }

        [HttpPut("{id}/assign")]
        public IActionResult AssignTicket(int id, AssignTicketDto request)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            string oldAssignedUserName = "Unassigned";

            if (ticket.AssignedToUserId != null)
            {
                var oldAssignedUser = _context.Users.FirstOrDefault(u => u.Id == ticket.AssignedToUserId);

                if (oldAssignedUser != null)
                {
                    oldAssignedUserName = oldAssignedUser.FullName;
                }
            }

            var newAssignedUser = _context.Users.FirstOrDefault(u => u.Id == request.AssignedToUserId);

            if (newAssignedUser == null)
            {
                return BadRequest("Assigned user not found");
            }

            ticket.AssignedToUserId = request.AssignedToUserId;

            CreateNotification(
    request.AssignedToUserId,
    ticket.Id,
    "Ticket Assigned",
    $"Ticket {ticket.TicketNumber} has been assigned to you."
);
            ticket.UpdatedAt = DateTime.Now;

            var history = new TicketHistory
            {
                TicketId = ticket.Id,
                Action = "Ticket Assigned",
                OldValue = oldAssignedUserName,
                NewValue = newAssignedUser.FullName,
                PerformedByUserId = GetCurrentUserId() ?? request.AssignedToUserId,
                CreatedAt = DateTime.Now
            };

            _context.TicketHistories.Add(history);
            _context.SaveChanges();

            return Ok(ticket);
        }

        [HttpPut("{id}/status")]
        public IActionResult UpdateTicketStatus(int id, UpdateTicketStatusDto request)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            var oldStatus = _context.Statuses.FirstOrDefault(s => s.Id == ticket.StatusId);
            var status = _context.Statuses.FirstOrDefault(s => s.Id == request.StatusId);

            if (status == null)
            {
                return BadRequest("Status not found");
            }

            ticket.StatusId = request.StatusId;
            ticket.UpdatedAt = DateTime.Now;

            if (status.Name.ToLower() == "resolved")
            {
                ticket.ResolvedAt = DateTime.Now;
            }

            if (status.Name.ToLower() == "closed")
            {
                ticket.ClosedAt = DateTime.Now;
            }

            var history = new TicketHistory
            {
                TicketId = ticket.Id,
                Action = "Status Changed",
                OldValue = oldStatus != null ? oldStatus.Name : "Unknown",
                NewValue = status.Name,
                PerformedByUserId = GetCurrentUserId() ?? ticket.CreatedByUserId,
                CreatedAt = DateTime.Now
            };

            _context.TicketHistories.Add(history);
          
          CreateNotification(
    ticket.CreatedByUserId,
    ticket.Id,
    "Ticket Status Updated",
    $"Ticket {ticket.TicketNumber} status changed from {oldStatus?.Name ?? "Unknown"} to {status.Name}."
);

if (ticket.AssignedToUserId != null)
{
    CreateNotification(
        ticket.AssignedToUserId.Value,
        ticket.Id,
        "Ticket Status Updated",
        $"Ticket {ticket.TicketNumber} status changed from {oldStatus?.Name ?? "Unknown"} to {status.Name}."
    );
}
            _context.SaveChanges();

            return Ok(ticket);
        }

        [HttpGet("{id}/history")]
        public IActionResult GetTicketHistory(int id)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            var history = _context.TicketHistories
                .Where(item => item.TicketId == id)
                .OrderByDescending(item => item.CreatedAt)
                .ToList();

            return Ok(history);
        }

        [HttpGet("{id}/comments")]
        public IActionResult GetTicketComments(int id)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            var comments = _context.TicketComments
                .Where(comment => comment.TicketId == id)
                .OrderBy(comment => comment.CreatedAt)
                .Select(comment => new
                {
                    comment.Id,
                    comment.TicketId,
                    comment.UserId,
                    comment.CommentText,
                    comment.CreatedAt,
                    UserFullName = _context.Users
                        .Where(user => user.Id == comment.UserId)
                        .Select(user => user.FullName)
                        .FirstOrDefault(),
                    UserRole = _context.Users
                        .Where(user => user.Id == comment.UserId)
                        .Select(user => user.Role)
                        .FirstOrDefault()
                })
                .ToList();

            return Ok(comments);
        }

        [HttpPost("{id}/comments")]
        public IActionResult AddTicketComment(int id, AddTicketCommentDto request)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            var user = _context.Users.FirstOrDefault(u => u.Id == request.UserId);

            if (user == null)
            {
                return BadRequest("User not found");
            }

            bool isAdmin = user.Role == "Admin";
            bool isManager = user.Role == "Manager";
            bool isTicketCreator = user.Role == "Employee" && ticket.CreatedByUserId == user.Id;
            bool isAssignedAgent = user.Role == "IT Support Agent" && ticket.AssignedToUserId == user.Id;

            if (!isAdmin && !isManager && !isTicketCreator && !isAssignedAgent)
            {
                return Unauthorized("You are not allowed to comment on this ticket.");
            }

            var comment = new TicketComment
            {
                TicketId = id,
                UserId = request.UserId,
                CommentText = request.CommentText,
                CreatedAt = DateTime.Now
            };

            _context.TicketComments.Add(comment);
            _context.TicketHistories.Add(new TicketHistory
            {
                TicketId = ticket.Id,
                Action = "Comment Added",
                OldValue = null,
                NewValue = comment.CommentText,
                PerformedByUserId = comment.UserId,
                CreatedAt = DateTime.Now
            });

CreateNotification(
    ticket.CreatedByUserId,
    ticket.Id,
    "New Comment",
    $"A new comment was added to Ticket {ticket.TicketNumber}."
);

            _context.SaveChanges();

            return Ok(new
            {
                comment.Id,
                comment.TicketId,
                comment.UserId,
                comment.CommentText,
                comment.CreatedAt,
                UserFullName = user.FullName,
                UserRole = user.Role
            });
        }

        [HttpGet("{id}/attachments")]
        public IActionResult GetTicketAttachments(int id)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            var attachments = _context.TicketAttachments
                .Where(attachment => attachment.TicketId == id)
                .OrderByDescending(attachment => attachment.UploadedAt)
                .Select(attachment => new
                {
                    attachment.Id,
                    attachment.TicketId,
                    attachment.UploadedByUserId,
                    attachment.FileName,
                    attachment.FilePath,
                    attachment.FileType,
                    attachment.FileSize,
                    attachment.UploadedAt,
                    UploadedByFullName = _context.Users
                        .Where(user => user.Id == attachment.UploadedByUserId)
                        .Select(user => user.FullName)
                        .FirstOrDefault()
                })
                .ToList();

            return Ok(attachments);
        }

        [HttpPost("{id}/attachments")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UploadTicketAttachment(int id, [FromForm] UploadAttachmentDto request)
        {
            var file = request.File;
            var uploadedByUserId = request.UploadedByUserId;

            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            var user = _context.Users.FirstOrDefault(u => u.Id == uploadedByUserId);

            if (user == null)
            {
                return BadRequest("User not found");
            }

            if (file == null || file.Length == 0)
            {
                return BadRequest("Please choose a file to upload.");
            }

            string originalFileName = Path.GetFileName(file.FileName);
            string fileExtension = Path.GetExtension(originalFileName);

            if (string.IsNullOrWhiteSpace(fileExtension) || !AllowedAttachmentExtensions.Contains(fileExtension))
            {
                return BadRequest(InvalidAttachmentTypeMessage);
            }

            if (file.Length > MaxAttachmentFileSize)
            {
                return BadRequest(AttachmentSizeExceededMessage);
            }

            string webRootPath = _environment.WebRootPath;

            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            string uploadFolder = Path.Combine(webRootPath, "uploads");
            Directory.CreateDirectory(uploadFolder);

            string storedFileName = $"{Guid.NewGuid()}_{originalFileName}";
            string savedFilePath = Path.Combine(uploadFolder, storedFileName);

            using (var stream = new FileStream(savedFilePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var attachment = new TicketAttachment
            {
                TicketId = id,
                UploadedByUserId = uploadedByUserId,
                FileName = originalFileName,
                FilePath = $"/uploads/{storedFileName}",
                FileType = string.IsNullOrWhiteSpace(file.ContentType) ? "application/octet-stream" : file.ContentType,
                FileSize = (int)file.Length,
                UploadedAt = DateTime.Now
            };

            _context.TicketAttachments.Add(attachment);
            _context.TicketHistories.Add(new TicketHistory
            {
                TicketId = ticket.Id,
                Action = "Attachment Uploaded",
                OldValue = null,
                NewValue = attachment.FileName,
                PerformedByUserId = uploadedByUserId,
                CreatedAt = DateTime.Now
            });

CreateNotification(
    ticket.CreatedByUserId,
    ticket.Id,
    "New Attachment",
    $"A new attachment was uploaded to Ticket {ticket.TicketNumber}."
);


            _context.SaveChanges();

            return Ok(new
            {
                attachment.Id,
                attachment.TicketId,
                attachment.UploadedByUserId,
                attachment.FileName,
                attachment.FilePath,
                attachment.FileType,
                attachment.FileSize,
                attachment.UploadedAt,
                UploadedByFullName = user.FullName
            });
        }

        [HttpGet("attachments/{attachmentId}/download")]
        public IActionResult DownloadTicketAttachment(int attachmentId)
        {
            var attachment = _context.TicketAttachments.FirstOrDefault(item => item.Id == attachmentId);

            if (attachment == null)
            {
                return NotFound("Attachment not found");
            }

            string webRootPath = _environment.WebRootPath;

            if (string.IsNullOrWhiteSpace(webRootPath))
            {
                webRootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            }

            string storedFileName = Path.GetFileName(attachment.FilePath);
            string filePath = Path.Combine(webRootPath, "uploads", storedFileName);

            if (!System.IO.File.Exists(filePath))
            {
                return NotFound("Attachment file not found");
            }

            string contentType = string.IsNullOrWhiteSpace(attachment.FileType) ? "application/octet-stream" : attachment.FileType;

            return PhysicalFile(filePath, contentType, attachment.FileName);
        }

        [HttpGet("{id}/action-logs")]
        public IActionResult GetTicketActionLogs(int id)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            var actionLogs = _context.ActivityLogs
                .Where(log => log.TicketId == id)
                .OrderByDescending(log => log.LogDate)
                .ThenByDescending(log => log.CreatedAt)
                .Select(log => new
                {
                    log.Id,
                    log.TicketId,
                    log.UserId,
                    UserFullName = _context.Users
                        .Where(user => user.Id == log.UserId)
                        .Select(user => user.FullName)
                        .FirstOrDefault(),
                    Type = log.Action,
                    Description = log.Details,
                    log.DurationHours,
                    log.LogDate,
                    log.CreatedAt
                })
                .ToList();

            return Ok(actionLogs);
        }

        [HttpPost("{id}/action-logs")]
        public IActionResult AddTicketActionLog(int id, AddActionLogDto request)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            var user = _context.Users.FirstOrDefault(u => u.Id == request.UserId);

            if (user == null)
            {
                return BadRequest("User not found");
            }

            bool canAddActionLog =
                user.Role == "Admin" ||
                user.Role == "Manager" ||
                (user.Role == "IT Support Agent" && ticket.AssignedToUserId == user.Id);

            if (!canAddActionLog)
            {
                return Unauthorized("You are not allowed to add action logs to this ticket.");
            }

            if (request.DurationHours <= 0)
            {
                return BadRequest("Duration hours must be greater than 0.");
            }

            if (string.IsNullOrWhiteSpace(request.Description))
            {
                return BadRequest("Description is required.");
            }

            if (string.IsNullOrWhiteSpace(request.Type))
            {
                return BadRequest("Type is required.");
            }

            var actionLog = new ActivityLog
            {
                TicketId = id,
                UserId = request.UserId,
                Action = request.Type,
                Details = request.Description,
                DurationHours = request.DurationHours,
                LogDate = request.LogDate,
                CreatedAt = DateTime.Now
            };

            _context.ActivityLogs.Add(actionLog);
            _context.SaveChanges();

            return Ok(new
            {
                actionLog.Id,
                actionLog.TicketId,
                actionLog.UserId,
                UserFullName = user.FullName,
                Type = actionLog.Action,
                Description = actionLog.Details,
                actionLog.DurationHours,
                actionLog.LogDate,
                actionLog.CreatedAt
            });
        }

        [HttpGet("{id}/internal-notes")]
        public IActionResult GetTicketInternalNotes(int id, [FromQuery] int userId)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            var user = _context.Users.FirstOrDefault(u => u.Id == userId);

            if (user == null)
            {
                return BadRequest("User not found");
            }

            if (!CanAccessInternalNotes(user))
            {
                return Unauthorized("You are not allowed to view internal notes.");
            }

            var notes = _context.InternalNotes
                .Where(note => note.TicketId == id)
                .OrderByDescending(note => note.CreatedAt)
                .Select(note => new
                {
                    note.Id,
                    note.TicketId,
                    note.UserId,
                    UserFullName = _context.Users
                        .Where(userItem => userItem.Id == note.UserId)
                        .Select(userItem => userItem.FullName)
                        .FirstOrDefault(),
                    note.Note,
                    note.CreatedAt
                })
                .ToList();

            return Ok(notes);
        }

        [HttpPost("{id}/internal-notes")]
        public IActionResult AddTicketInternalNote(int id, AddInternalNoteDto request)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            var user = _context.Users.FirstOrDefault(u => u.Id == request.UserId);

            if (user == null)
            {
                return BadRequest("User not found");
            }

            if (!CanAccessInternalNotes(user))
            {
                return Unauthorized("You are not allowed to add internal notes.");
            }

            if (string.IsNullOrWhiteSpace(request.Note))
            {
                return BadRequest("Note is required.");
            }

            var note = new InternalNote
            {
                TicketId = id,
                UserId = request.UserId,
                Note = request.Note,
                CreatedAt = DateTime.Now
            };

            _context.InternalNotes.Add(note);
            _context.SaveChanges();

            return Ok(new
            {
                note.Id,
                note.TicketId,
                note.UserId,
                UserFullName = user.FullName,
                note.Note,
                note.CreatedAt
            });
        }

        [HttpDelete("{id}")]
        public IActionResult DeleteTicket(int id)
        {
            var ticket = _context.Tickets.FirstOrDefault(t => t.Id == id);

            if (ticket == null)
            {
                return NotFound("Ticket not found");
            }

            if (ticket.AssignedToUserId != null)
            {
                return BadRequest("Cannot delete ticket because it is already assigned.");
            }

            _context.Tickets.Remove(ticket);
            _context.SaveChanges();

            return Ok("Ticket deleted successfully");
        }

        private int? GetCurrentUserId()
        {
            string? userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (int.TryParse(userId, out int parsedUserId))
            {
                return parsedUserId;
            }

            return null;
        }

        private static bool CanAccessInternalNotes(User user)
        {
            return user.Role == "Admin" || user.Role == "Manager" || user.Role == "IT Support Agent";
        }
private void CreateNotification(int userId, int? ticketId, string title, string message)
{
    var notification = new Notification
    {
        UserId = userId,
        TicketId = ticketId,
        Title = title,
        Message = message,
        IsRead = false,
        CreatedAt = DateTime.Now
    };

    _context.Notifications.Add(notification);
}


    }

}
