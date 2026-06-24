using backend.Data;
using backend.DTOs;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using backend.Services;


namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly EmailService _emailService;

   public AuthController(AppDbContext context, IConfiguration configuration, EmailService emailService)
{
    _context = context;
    _configuration = configuration;
    _emailService = emailService;
}

        [HttpPost("register")]
        public IActionResult Register(RegisterDto registerDto)
        {
            var user = new User
            {
                FullName = registerDto.FullName,
                Email = registerDto.Email,
                Password = registerDto.Password,
                Role = registerDto.Role,
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            var existingUser = _context.Users.FirstOrDefault(u => u.Email == user.Email);

            if (existingUser != null)
            {
                return BadRequest("Email already exists");
            }

            _context.Users.Add(user);
            _context.SaveChanges();

            return Ok("User registered successfully");
        }

        [HttpPost("login")]
public IActionResult Login(LoginDto loginDto)
{
    var user = _context.Users.FirstOrDefault(u =>
        u.Email == loginDto.Email &&
        u.Password == loginDto.Password);

    if (user == null)
    {
        return Unauthorized("Invalid email or password");
    }

    if (!user.IsActive)
    {
        return Unauthorized("This account has been deactivated.");
    }

    string token = CreateToken(user);

    return Ok(new
    {
        userId = user.Id,
        fullName = user.FullName,
        role = user.Role,
        token = token
    });
}



[HttpPost("forgot-password")]
public IActionResult ForgotPassword(ForgotPasswordDto forgotPasswordDto)
{
    var user = _context.Users.FirstOrDefault(u => u.Email == forgotPasswordDto.Email);

    if (user == null)
    {
        return NotFound("Email not found.");
    }

    var resetCode = new Random().Next(100000, 999999).ToString();

    user.ResetCode = resetCode;
    user.ResetCodeExpiry = DateTime.Now.AddMinutes(10);

    _context.SaveChanges();

    string emailToSend = string.IsNullOrWhiteSpace(user.NotificationEmail)
        ? user.Email
        : user.NotificationEmail;

    _emailService.SendEmail(
        emailToSend,
        "SupportOps - Password Reset Code",
        $@"
        <div style='font-family: Arial, sans-serif; background-color:#f4f7fb; padding:30px;'>
            <div style='max-width:600px; margin:auto; background-color:#ffffff; border-radius:14px; overflow:hidden; border:1px solid #e5e7eb;'>

                <div style='background-color:#2563eb; color:white; padding:22px 28px;'>
                    <h1 style='margin:0; font-size:24px;'>SupportOps</h1>
                    <p style='margin:6px 0 0; font-size:14px;'>Enterprise IT Help Desk</p>
                </div>

                <div style='padding:28px; color:#111827;'>
                    <h2 style='margin-top:0;'>Password Reset Request</h2>

                    <p>Hello <strong>{user.FullName}</strong>,</p>

                    <p>You requested to reset your SupportOps password.</p>

                    <div style='background-color:#f9fafb; border:1px solid #e5e7eb; border-radius:12px; padding:20px; text-align:center; margin:22px 0;'>
                        <p style='margin:0 0 10px; color:#6b7280;'>Your reset code is:</p>
                        <h1 style='letter-spacing:6px; margin:0; color:#2563eb;'>{resetCode}</h1>
                    </div>

                    <p>This code will expire in <strong>10 minutes</strong>.</p>

                    <p>If you did not request this reset, you can ignore this email.</p>

                    <p style='margin-top:28px;'>Regards,<br/><strong>SupportOps Team</strong></p>
                </div>

                <div style='background-color:#f9fafb; color:#6b7280; font-size:12px; padding:16px 28px; text-align:center;'>
                    This is an automated email from SupportOps. Please do not reply.
                </div>
            </div>
        </div>
        "
    );

    return Ok("Password reset code sent successfully.");
}

[HttpPost("reset-password")]
public IActionResult ResetPassword(ResetPasswordDto resetPasswordDto)
{
    var user = _context.Users.FirstOrDefault(u => u.Email == resetPasswordDto.Email);

    if (user == null)
    {
        return NotFound("Email not found.");
    }

    if (user.ResetCode == null || user.ResetCodeExpiry == null)
    {
        return BadRequest("No reset code was requested.");
    }

    if (user.ResetCode != resetPasswordDto.ResetCode)
    {
        return BadRequest("Invalid reset code.");
    }

    if (user.ResetCodeExpiry < DateTime.Now)
    {
        return BadRequest("Reset code has expired.");
    }

    if (resetPasswordDto.NewPassword != resetPasswordDto.ConfirmPassword)
    {
        return BadRequest("Passwords do not match.");
    }

    user.Password = resetPasswordDto.NewPassword;
    user.ResetCode = null;
    user.ResetCodeExpiry = null;

    _context.SaveChanges();

    return Ok("Password reset successfully.");
}
        private string CreateToken(User user)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.FullName),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role)
            };

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!)
            );

            var credentials = new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
