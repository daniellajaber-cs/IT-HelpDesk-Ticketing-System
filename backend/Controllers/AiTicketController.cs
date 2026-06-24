using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AiTicketController : ControllerBase
    {
        [HttpPost("analyze")]
        public IActionResult Analyze(AiTicketAnalysisRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.ProblemText))
            {
                return BadRequest("Problem description is required.");
            }

            string problemText = request.ProblemText;
            string text = problemText.ToLowerInvariant();

            string categoryName = "Other";

            if (ContainsAny(text, "phishing", "malware", "virus", "suspicious", "hacked", "breach", "security"))
            {
                categoryName = "Other";
            }
            else if (ContainsAny(text, "password", "login", "account", "permission", "access", "mfa", "authentication", "username"))
            {
                categoryName = "Access Request";
            }
            else if (ContainsAny(text, "vpn", "wifi", "wi-fi", "internet", "network", "dns", "ethernet", "router", "connection"))
            {
                categoryName = "Network";
            }
            else if (ContainsAny(text, "outlook", "email", "mail", "inbox", "smtp"))
            {
                categoryName = "Email";
            }
            else if (ContainsAny(text, "outlook", "teams", "word", "excel", "browser", "app", "application", "install", "update", "software"))
            {
                categoryName = "Software";
            }
            else if (ContainsAny(text, "laptop", "keyboard", "mouse", "monitor", "screen", "printer", "charger", "battery", "device"))
            {
                categoryName = "Hardware";
            }

            string priorityName;

            if (ContainsAny(text, "server down", "system down", "all users", "everyone", "production", "outage", "data loss"))
            {
                priorityName = "Critical";
            }
            else if (ContainsAny(text, "urgent", "cannot work", "blocked", "deadline", "vpn not working", "no internet", "security"))
            {
                priorityName = "High";
            }
            else if (ContainsAny(text, "not working", "issue", "error", "problem", "unable"))
            {
                priorityName = "Medium";
            }
            else if (ContainsAny(text, "request", "question", "information", "minor", "slow"))
            {
                priorityName = "Low";
            }
            else
            {
                priorityName = "Medium";
            }

            string title = categoryName switch
            {
                "Network" => "Network connectivity issue",
                "Email" => "Email access or delivery issue",
                "Software" => "Software application issue",
                "Hardware" => "Hardware support request",
                "Access Request" => "Account access issue",
                _ => "IT support request"
            };

            return Ok(new AiTicketAnalysisResponse
            {
                Title = title,
                Description = problemText,
                CategoryName = categoryName,
                PriorityName = priorityName,
                Reason = $"Detected keywords suggest {categoryName} with {priorityName} priority."
            });
        }

        private static bool ContainsAny(string text, params string[] keywords)
        {
            return keywords.Any(keyword => text.Contains(keyword));
        }
    }

    public class AiTicketAnalysisRequest
    {
        public string ProblemText { get; set; } = string.Empty;
    }

    public class AiTicketAnalysisResponse
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string PriorityName { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
    }
}
