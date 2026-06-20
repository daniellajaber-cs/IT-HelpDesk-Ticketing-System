using backend.Data;
using Microsoft.AspNetCore.Mvc;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KnowledgeBaseController : ControllerBase
    {
        private readonly AppDbContext _context;

        public KnowledgeBaseController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("categories")]
        public IActionResult GetCategories()
        {
            var categories = _context.KnowledgeBaseCategories
                .OrderBy(c => c.Name)
                .ToList();

            return Ok(categories);
        }

        [HttpGet("articles")]
        public IActionResult GetArticles()
        {
            var articles = _context.KnowledgeBaseArticles
                .Where(a => a.IsPublished)
                .OrderByDescending(a => a.CreatedAt)
                .ToList();

            return Ok(articles);
        }

        [HttpGet("articles/{id}")]
        public IActionResult GetArticleById(int id)
        {
            var article = _context.KnowledgeBaseArticles.FirstOrDefault(a => a.Id == id);

            if (article == null)
            {
                return NotFound("Article not found");
            }

            article.Views += 1;
            _context.SaveChanges();

            return Ok(article);
        }

        [HttpGet("videos")]
        public IActionResult GetVideos()
        {
            var videos = _context.KnowledgeBaseVideos
                .OrderByDescending(v => v.CreatedAt)
                .ToList();

            return Ok(videos);
        }

        [HttpPost("seed")]
public IActionResult SeedKnowledgeBase()
{
    if (_context.KnowledgeBaseCategories.Any())
    {
        return BadRequest("Knowledge Base data already exists.");
    }

    var categories = new List<backend.Models.KnowledgeBaseCategory>
    {
        new backend.Models.KnowledgeBaseCategory
        {
            Name = "Account Access",
            Description = "SSO configuration, password resets, MFA, and user permissions.",
            Icon = "lock"
        },
        new backend.Models.KnowledgeBaseCategory
        {
            Name = "Network Issues",
            Description = "VPN connectivity, Wi-Fi, DNS, and internet troubleshooting.",
            Icon = "network"
        },
        new backend.Models.KnowledgeBaseCategory
        {
            Name = "Software Tools",
            Description = "Microsoft Office, Outlook, Teams, browser, and app support.",
            Icon = "terminal"
        },
        new backend.Models.KnowledgeBaseCategory
        {
            Name = "Hardware Support",
            Description = "Laptop, keyboard, printer, monitor, and peripheral support.",
            Icon = "laptop"
        },
        new backend.Models.KnowledgeBaseCategory
        {
            Name = "Security",
            Description = "Phishing, suspicious emails, malware prevention, and safe access.",
            Icon = "shield"
        },
        new backend.Models.KnowledgeBaseCategory
        {
            Name = "Onboarding",
            Description = "New employee setup, accounts, devices, and first-day IT access.",
            Icon = "users"
        }
    };

    _context.KnowledgeBaseCategories.AddRange(categories);
    _context.SaveChanges();

    var adminUserId = _context.Users.FirstOrDefault(u => u.Role == "Admin")?.Id ?? 1;

    var accountAccess = categories.First(c => c.Name == "Account Access").Id;
    var network = categories.First(c => c.Name == "Network Issues").Id;
    var software = categories.First(c => c.Name == "Software Tools").Id;
    var hardware = categories.First(c => c.Name == "Hardware Support").Id;
    var security = categories.First(c => c.Name == "Security").Id;
    var onboarding = categories.First(c => c.Name == "Onboarding").Id;

    var articles = new List<backend.Models.KnowledgeBaseArticle>
    {
        new backend.Models.KnowledgeBaseArticle
        {
            Title = "How to Reset Your Company Password",
            CategoryId = accountAccess,
            CreatedByUserId = adminUserId,
            Tags = "password, account, reset, login",
            Views = 120,
            Content = "If you cannot log in to your company account, go to the password reset portal, enter your company email, verify your identity using MFA, and create a new password. Your password must include uppercase letters, lowercase letters, numbers, and a special character. If you cannot receive the MFA code, contact IT Support."
        },
        new backend.Models.KnowledgeBaseArticle
        {
            Title = "How to Set Up Multi-Factor Authentication",
            CategoryId = accountAccess,
            CreatedByUserId = adminUserId,
            Tags = "mfa, authentication, security, login",
            Views = 95,
            Content = "Multi-Factor Authentication adds an extra layer of security to your account. Install the authenticator app on your phone, scan the QR code from the company login portal, and confirm the verification code. Keep your recovery codes in a safe place."
        },
        new backend.Models.KnowledgeBaseArticle
        {
            Title = "Troubleshooting VPN Connection Problems",
            CategoryId = network,
            CreatedByUserId = adminUserId,
            Tags = "vpn, network, remote access, connection",
            Views = 210,
            Content = "If the VPN is not connecting, first check your internet connection. Restart the VPN client and try signing in again. Make sure your username and password are correct. If the VPN shows a timeout error, restart your laptop and try a different network. If the issue continues, create a support ticket and include a screenshot of the error."
        },
        new backend.Models.KnowledgeBaseArticle
        {
            Title = "Outlook Email Not Syncing",
            CategoryId = software,
            CreatedByUserId = adminUserId,
            Tags = "outlook, email, sync, mailbox",
            Views = 185,
            Content = "If Outlook is not syncing, check that you are connected to the internet. Open Outlook, go to Send/Receive, and click Update Folder. If the issue continues, restart Outlook and check your account settings. You can also remove and re-add the mailbox profile if syncing does not resume."
        },
        new backend.Models.KnowledgeBaseArticle
        {
            Title = "Laptop Keyboard Not Working",
            CategoryId = hardware,
            CreatedByUserId = adminUserId,
            Tags = "keyboard, laptop, hardware, keys",
            Views = 88,
            Content = "If your laptop keyboard is not working, restart the laptop first. Check if an external keyboard works. Update the keyboard driver from Device Manager. If only some keys are not working, clean the keyboard gently and check for stuck keys. If the issue continues, submit a hardware support ticket."
        },
        new backend.Models.KnowledgeBaseArticle
        {
            Title = "How to Report a Phishing Email",
            CategoryId = security,
            CreatedByUserId = adminUserId,
            Tags = "phishing, security, email, suspicious",
            Views = 140,
            Content = "If you receive a suspicious email, do not click any links or download attachments. Use the Report Phishing button in Outlook if available. Forward the email to the IT security team and delete it from your inbox. If you clicked a suspicious link, change your password immediately and notify IT Support."
        },
        new backend.Models.KnowledgeBaseArticle
        {
            Title = "New Employee IT Setup Checklist",
            CategoryId = onboarding,
            CreatedByUserId = adminUserId,
            Tags = "onboarding, new employee, setup, account",
            Views = 75,
            Content = "New employees should receive a company email account, temporary password, laptop, VPN access, and access to required applications. On the first day, sign in to your account, reset your password, enable MFA, connect to Wi-Fi, and test access to email and shared drives."
        }
    };

    _context.KnowledgeBaseArticles.AddRange(articles);

    var videos = new List<backend.Models.KnowledgeBaseVideo>
    {
        new backend.Models.KnowledgeBaseVideo
        {
            Title = "How to Use Microsoft Outlook",
            Description = "Basic Outlook email and calendar tutorial.",
            YouTubeUrl = "https://www.youtube.com/watch?v=edABo0VnHK8",
            CategoryId = software,
            Duration = "8:00"
        },
        new backend.Models.KnowledgeBaseVideo
        {
            Title = "What is Multi-Factor Authentication?",
            Description = "Simple explanation of MFA and why it matters.",
            YouTubeUrl = "https://www.youtube.com/watch?v=0mvCeNsTa1g",
            CategoryId = security,
            Duration = "3:00"
        },
        new backend.Models.KnowledgeBaseVideo
        {
            Title = "VPN Explained",
            Description = "Basic explanation of VPN connections.",
            YouTubeUrl = "https://www.youtube.com/watch?v=_wQTRMBAvzg",
            CategoryId = network,
            Duration = "5:00"
        }
    };

    _context.KnowledgeBaseVideos.AddRange(videos);
    _context.SaveChanges();

    return Ok("Knowledge Base seeded successfully.");
}
    }
}