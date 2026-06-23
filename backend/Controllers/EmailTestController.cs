using backend.Services;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmailTestController : ControllerBase
    {
        private readonly EmailService _emailService;

        public EmailTestController(EmailService emailService)
        {
            _emailService = emailService;
        }

        [HttpPost("send-test")]
        public IActionResult SendTestEmail(string toEmail)
        {
            _emailService.SendEmail(
                toEmail,
                "SupportOps Test Email",
                "<h2>SupportOps Email Service</h2><p>Email notifications are working successfully.</p>"
            );

            return Ok("Test email sent successfully.");
        }
    }
}