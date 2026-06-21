using backend.Data;
using backend.Models;
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
                return NotFound("Article not found");

            article.Views += 1;
            _context.SaveChanges();

            return Ok(article);
        }

        [HttpGet("articles/search")]
        public IActionResult SearchArticles(string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest("Keyword is required");

            var articles = _context.KnowledgeBaseArticles
                .Where(a => a.IsPublished &&
                       (a.Title.Contains(keyword) ||
                        a.Content.Contains(keyword) ||
                        a.Tags.Contains(keyword)))
                .OrderByDescending(a => a.CreatedAt)
                .ToList();

            return Ok(articles);
        }

        [HttpGet("articles/category/{categoryId}")]
        public IActionResult GetArticlesByCategory(int categoryId)
        {
            var articles = _context.KnowledgeBaseArticles
                .Where(a => a.IsPublished && a.CategoryId == categoryId)
                .OrderByDescending(a => a.CreatedAt)
                .ToList();

            return Ok(articles);
        }

        [HttpPut("articles/{id}/publish")]
        public IActionResult PublishArticle(int id)
        {
            var article = _context.KnowledgeBaseArticles.FirstOrDefault(a => a.Id == id);

            if (article == null)
                return NotFound("Article not found");

            article.IsPublished = true;
            _context.SaveChanges();

            return Ok("Article published successfully.");
        }

        [HttpPut("articles/{id}/unpublish")]
        public IActionResult UnpublishArticle(int id)
        {
            var article = _context.KnowledgeBaseArticles.FirstOrDefault(a => a.Id == id);

            if (article == null)
                return NotFound("Article not found");

            article.IsPublished = false;
            _context.SaveChanges();

            return Ok("Article unpublished successfully.");
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

            var categories = new List<KnowledgeBaseCategory>
            {
                new KnowledgeBaseCategory
                {
                    Name = "Account Access",
                    Description = "SSO configuration, password resets, MFA, and user permissions.",
                    Icon = "lock"
                },
                new KnowledgeBaseCategory
                {
                    Name = "Network Issues",
                    Description = "VPN connectivity, Wi-Fi, DNS, and internet troubleshooting.",
                    Icon = "network"
                },
                new KnowledgeBaseCategory
                {
                    Name = "Software Tools",
                    Description = "Microsoft Office, Outlook, Teams, browser, and app support.",
                    Icon = "terminal"
                },
                new KnowledgeBaseCategory
                {
                    Name = "Hardware Support",
                    Description = "Laptop, keyboard, printer, monitor, and peripheral support.",
                    Icon = "laptop"
                },
                new KnowledgeBaseCategory
                {
                    Name = "Security",
                    Description = "Phishing, suspicious emails, malware prevention, and safe access.",
                    Icon = "shield"
                },
                new KnowledgeBaseCategory
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

            var articles = new List<KnowledgeBaseArticle>
            {
                new KnowledgeBaseArticle
                {
                    Title = "How to Reset Your Company Password",
                    CategoryId = accountAccess,
                    CreatedByUserId = adminUserId,
                    Tags = "password, account, reset, login",
                    Views = 120,
                    IsPublished = true,
                    CreatedAt = DateTime.Now,
                    Content = "If you cannot log in to your company account, go to the password reset portal, enter your company email, verify your identity using MFA, and create a new password. Your password must include uppercase letters, lowercase letters, numbers, and a special character. If you cannot receive the MFA code, contact IT Support."
                },
                new KnowledgeBaseArticle
                {
                    Title = "How to Set Up Multi-Factor Authentication",
                    CategoryId = accountAccess,
                    CreatedByUserId = adminUserId,
                    Tags = "mfa, authentication, security, login",
                    Views = 95,
                    IsPublished = true,
                    CreatedAt = DateTime.Now,
                    Content = "Multi-Factor Authentication adds an extra layer of security to your account. Install the authenticator app on your phone, scan the QR code from the company login portal, and confirm the verification code. Keep your recovery codes in a safe place."
                },
                new KnowledgeBaseArticle
                {
                    Title = "Troubleshooting VPN Connection Problems",
                    CategoryId = network,
                    CreatedByUserId = adminUserId,
                    Tags = "vpn, network, remote access, connection",
                    Views = 210,
                    IsPublished = true,
                    CreatedAt = DateTime.Now,
                    Content = "If the VPN is not connecting, first check your internet connection. Restart the VPN client and try signing in again. Make sure your username and password are correct. If the VPN shows a timeout error, restart your laptop and try a different network. If the issue continues, create a support ticket and include a screenshot of the error."
                },
                new KnowledgeBaseArticle
                {
                    Title = "Outlook Email Not Syncing",
                    CategoryId = software,
                    CreatedByUserId = adminUserId,
                    Tags = "outlook, email, sync, mailbox",
                    Views = 185,
                    IsPublished = true,
                    CreatedAt = DateTime.Now,
                    Content = "If Outlook is not syncing, check that you are connected to the internet. Open Outlook, go to Send/Receive, and click Update Folder. If the issue continues, restart Outlook and check your account settings. You can also remove and re-add the mailbox profile if syncing does not resume."
                },
                new KnowledgeBaseArticle
                {
                    Title = "Laptop Keyboard Not Working",
                    CategoryId = hardware,
                    CreatedByUserId = adminUserId,
                    Tags = "keyboard, laptop, hardware, keys",
                    Views = 88,
                    IsPublished = true,
                    CreatedAt = DateTime.Now,
                    Content = "If your laptop keyboard is not working, restart the laptop first. Check if an external keyboard works. Update the keyboard driver from Device Manager. If only some keys are not working, clean the keyboard gently and check for stuck keys. If the issue continues, submit a hardware support ticket."
                },
                new KnowledgeBaseArticle
                {
                    Title = "How to Report a Phishing Email",
                    CategoryId = security,
                    CreatedByUserId = adminUserId,
                    Tags = "phishing, security, email, suspicious",
                    Views = 140,
                    IsPublished = true,
                    CreatedAt = DateTime.Now,
                    Content = "If you receive a suspicious email, do not click any links or download attachments. Use the Report Phishing button in Outlook if available. Forward the email to the IT security team and delete it from your inbox. If you clicked a suspicious link, change your password immediately and notify IT Support."
                },
                new KnowledgeBaseArticle
                {
                    Title = "New Employee IT Setup Checklist",
                    CategoryId = onboarding,
                    CreatedByUserId = adminUserId,
                    Tags = "onboarding, new employee, setup, account",
                    Views = 75,
                    IsPublished = true,
                    CreatedAt = DateTime.Now,
                    Content = "New employees should receive a company email account, temporary password, laptop, VPN access, and access to required applications. On the first day, sign in to your account, reset your password, enable MFA, connect to Wi-Fi, and test access to email and shared drives."
                }
            };

            _context.KnowledgeBaseArticles.AddRange(articles);

            var videos = new List<KnowledgeBaseVideo>
            {
                new KnowledgeBaseVideo
                {
                    Title = "How to Use Microsoft Outlook",
                    Description = "Basic Outlook email and calendar tutorial.",
                    YouTubeUrl = "https://www.youtube.com/watch?v=edABo0VnHK8",
                    CategoryId = software,
                    Duration = "8:00",
                    CreatedAt = DateTime.Now
                },
                new KnowledgeBaseVideo
                {
                    Title = "What is Multi-Factor Authentication?",
                    Description = "Simple explanation of MFA and why it matters.",
                    YouTubeUrl = "https://www.youtube.com/watch?v=0mvCeNsTa1g",
                    CategoryId = security,
                    Duration = "3:00",
                    CreatedAt = DateTime.Now
                },
                new KnowledgeBaseVideo
                {
                    Title = "VPN Explained",
                    Description = "Basic explanation of VPN connections.",
                    YouTubeUrl = "https://www.youtube.com/watch?v=_wQTRMBAvzg",
                    CategoryId = network,
                    Duration = "5:00",
                    CreatedAt = DateTime.Now
                }
            };

            _context.KnowledgeBaseVideos.AddRange(videos);
            _context.SaveChanges();

            return Ok("Knowledge Base seeded successfully.");
        }

        [HttpGet("articles/popular")]
public IActionResult GetPopularArticles()
{
    var articles = _context.KnowledgeBaseArticles
        .Where(a => a.IsPublished)
        .OrderByDescending(a => a.Views)
        .Take(5)
        .ToList();

    return Ok(articles);
}

[HttpGet("articles/recent")]
public IActionResult GetRecentArticles()
{
    var articles = _context.KnowledgeBaseArticles
        .Where(a => a.IsPublished)
        .OrderByDescending(a => a.CreatedAt)
        .Take(5)
        .ToList();

    return Ok(articles);
}


[HttpPost("articles")]
public IActionResult CreateArticle(backend.Models.KnowledgeBaseArticle article)
{
    article.CreatedAt = DateTime.Now;
    article.Views = 0;
    article.IsPublished = true;

    _context.KnowledgeBaseArticles.Add(article);
    _context.SaveChanges();

    return Ok(article);
}


[HttpPut("articles/{id}")]
public IActionResult UpdateArticle(int id, backend.Models.KnowledgeBaseArticle updatedArticle)
{
    var article = _context.KnowledgeBaseArticles.FirstOrDefault(a => a.Id == id);

    if (article == null)
    {
        return NotFound("Article not found");
    }

    article.Title = updatedArticle.Title;
    article.Content = updatedArticle.Content;
    article.CategoryId = updatedArticle.CategoryId;
    article.Tags = updatedArticle.Tags;
    article.IsPublished = updatedArticle.IsPublished;
    article.UpdatedAt = DateTime.Now;

    _context.SaveChanges();

    return Ok(article);
}


[HttpDelete("articles/{id}")]
public IActionResult DeleteArticle(int id)
{
    var article = _context.KnowledgeBaseArticles.FirstOrDefault(a => a.Id == id);

    if (article == null)
    {
        return NotFound("Article not found");
    }

    _context.KnowledgeBaseArticles.Remove(article);
    _context.SaveChanges();

    return Ok("Article deleted successfully.");
}


[HttpPost("categories")]
public IActionResult CreateCategory(backend.Models.KnowledgeBaseCategory category)
{
    category.CreatedAt = DateTime.Now;

    _context.KnowledgeBaseCategories.Add(category);
    _context.SaveChanges();

    return Ok(category);
}

[HttpPost("videos")]
public IActionResult CreateVideo(backend.Models.KnowledgeBaseVideo video)
{
    video.CreatedAt = DateTime.Now;

    _context.KnowledgeBaseVideos.Add(video);
    _context.SaveChanges();

    return Ok(video);
}


[HttpPut("categories/{id}")]
public IActionResult UpdateCategory(int id, backend.Models.KnowledgeBaseCategory updatedCategory)
{
    var category = _context.KnowledgeBaseCategories.FirstOrDefault(c => c.Id == id);

    if (category == null)
    {
        return NotFound("Category not found");
    }

    category.Name = updatedCategory.Name;
    category.Description = updatedCategory.Description;
    category.Icon = updatedCategory.Icon;

    _context.SaveChanges();

    return Ok(category);
}

[HttpDelete("categories/{id}")]
public IActionResult DeleteCategory(int id)
{
    var category = _context.KnowledgeBaseCategories.FirstOrDefault(c => c.Id == id);

    if (category == null)
    {
        return NotFound("Category not found");
    }

    var hasArticles = _context.KnowledgeBaseArticles.Any(a => a.CategoryId == id);
    var hasVideos = _context.KnowledgeBaseVideos.Any(v => v.CategoryId == id);

    if (hasArticles || hasVideos)
    {
        return BadRequest("Cannot delete category because it has articles or videos.");
    }

    _context.KnowledgeBaseCategories.Remove(category);
    _context.SaveChanges();

    return Ok("Category deleted successfully.");
}

[HttpPut("videos/{id}")]
public IActionResult UpdateVideo(int id, backend.Models.KnowledgeBaseVideo updatedVideo)
{
    var video = _context.KnowledgeBaseVideos.FirstOrDefault(v => v.Id == id);

    if (video == null)
    {
        return NotFound("Video not found");
    }

    video.Title = updatedVideo.Title;
    video.Description = updatedVideo.Description;
    video.YouTubeUrl = updatedVideo.YouTubeUrl;
    video.CategoryId = updatedVideo.CategoryId;
    video.Duration = updatedVideo.Duration;

    _context.SaveChanges();

    return Ok(video);
}


[HttpDelete("videos/{id}")]
public IActionResult DeleteVideo(int id)
{
    var video = _context.KnowledgeBaseVideos.FirstOrDefault(v => v.Id == id);

    if (video == null)
    {
        return NotFound("Video not found");
    }

    _context.KnowledgeBaseVideos.Remove(video);
    _context.SaveChanges();

    return Ok("Video deleted successfully.");
}

    }
}