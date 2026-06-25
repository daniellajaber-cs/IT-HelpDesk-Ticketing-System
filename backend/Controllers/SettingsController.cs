using backend.Data;
using Microsoft.AspNetCore.Mvc;
using backend.Services;
namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly PasswordService _passwordService;

        public SettingsController(AppDbContext context, PasswordService passwordService)
        {
            _context = context;
            _passwordService = passwordService;
        }

        [HttpGet("profile/{userId}")]
        public IActionResult GetProfile(int userId)
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("User not found");
            }

            return Ok(new
            {
                user.Id,
                user.FullName,
                user.Email,
                user.Role,
                user.Department,
                user.IsActive,
                user.CreatedAt
            });
        }

        [HttpPut("profile/{userId}")]
        public IActionResult UpdateProfile(int userId, backend.Models.User updatedUser)
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("User not found");
            }

            user.FullName = updatedUser.FullName;
            user.Email = updatedUser.Email;
            user.Department = updatedUser.Department;

            _context.SaveChanges();

            return Ok(user);
        }

        [HttpPut("change-password/{userId}")]
        public IActionResult ChangePassword(int userId, ChangePasswordRequest request)
        {
            var user = _context.Users.FirstOrDefault(u => u.Id == userId);

            if (user == null)
            {
                return NotFound("User not found");
            }

          if (!_passwordService.VerifyPassword(user, request.CurrentPassword))
{
    return BadRequest("Current password is incorrect.");
}

            if (request.NewPassword != request.ConfirmPassword)
            {
                return BadRequest("New password and confirmation do not match.");
            }

            user.Password = _passwordService.HashPassword(user, request.NewPassword);
            _context.SaveChanges();

            return Ok("Password changed successfully.");
        }

        [HttpGet("system")]
        public IActionResult GetSystemSettings()
        {
            var settings = _context.SystemSettings.FirstOrDefault();

            if (settings == null)
            {
                settings = new backend.Models.SystemSetting();
                _context.SystemSettings.Add(settings);
                _context.SaveChanges();
            }

            return Ok(settings);
        }

        [HttpPut("system")]
        public IActionResult UpdateSystemSettings(backend.Models.SystemSetting updatedSettings)
        {
            var settings = _context.SystemSettings.FirstOrDefault();

            if (settings == null)
            {
                settings = new backend.Models.SystemSetting();
                _context.SystemSettings.Add(settings);
            }

            settings.ApplicationName = updatedSettings.ApplicationName;
            settings.SupportEmail = updatedSettings.SupportEmail;
            settings.DefaultPriority = updatedSettings.DefaultPriority;
            settings.EmailNotificationsEnabled = updatedSettings.EmailNotificationsEnabled;
            settings.MaintenanceMode = updatedSettings.MaintenanceMode;
            settings.SessionTimeoutHours = updatedSettings.SessionTimeoutHours;
            settings.UpdatedAt = DateTime.Now;

            _context.SaveChanges();

            return Ok(settings);
        }
    }

    public class ChangePasswordRequest
    {
        public string CurrentPassword { get; set; } = "";

        public string NewPassword { get; set; } = "";

        public string ConfirmPassword { get; set; } = "";
    }
}