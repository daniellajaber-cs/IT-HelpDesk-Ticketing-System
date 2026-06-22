using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UsersController(AppDbContext context)
        {
            _context = context;
        }

 [HttpGet]
public IActionResult GetUsers()
{
    var users = _context.Users
        .Select(user => new
        {
            user.Id,
            user.FullName,
            user.Email,
            user.Role,
            user.Department,
            user.IsActive,
            user.CreatedAt
        })
        .ToList();

    return Ok(users);
}

        [HttpGet("{id}")]
public IActionResult GetUserById(int id)
{
    var user = _context.Users.FirstOrDefault(u => u.Id == id);

    if (user == null)
    {
        return NotFound("User not found");
    }

    return Ok(user);
}


[HttpPost]
public IActionResult CreateUser(User user)
{
    var existingUser = _context.Users.FirstOrDefault(u => u.Email == user.Email);

    if (existingUser != null)
    {
        return BadRequest("Email already exists.");
    }

    user.CreatedAt = DateTime.Now;
    user.IsActive = true;

    _context.Users.Add(user);
    _context.SaveChanges();

    return Ok(user);
}


[HttpPut("{id}")]
public IActionResult UpdateUser(int id, User updatedUser)
{
    var user = _context.Users.FirstOrDefault(u => u.Id == id);

    if (user == null)
    {
        return NotFound("User not found");
    }

    var emailExists = _context.Users.Any(u =>
        u.Email == updatedUser.Email &&
        u.Id != id);

    if (emailExists)
    {
        return BadRequest("Email already exists.");
    }

    user.FullName = updatedUser.FullName;
    user.Email = updatedUser.Email;
    user.Role = updatedUser.Role;
    user.Department = updatedUser.Department;
    user.IsActive = updatedUser.IsActive;

    if (!string.IsNullOrWhiteSpace(updatedUser.Password))
    {
        user.Password = updatedUser.Password;
    }

    _context.SaveChanges();

    return Ok(user);
}

[HttpPut("{id}/activate")]
public IActionResult ActivateUser(int id)
{
    var user = _context.Users.FirstOrDefault(u => u.Id == id);

    if (user == null)
    {
        return NotFound("User not found");
    }

    user.IsActive = true;
    _context.SaveChanges();

    return Ok(user);
}

[HttpPut("{id}/deactivate")]
public IActionResult DeactivateUser(int id)
{
    var user = _context.Users.FirstOrDefault(u => u.Id == id);

    if (user == null)
    {
        return NotFound("User not found");
    }

    user.IsActive = false;
    _context.SaveChanges();

    return Ok(user);
}

[HttpDelete("{id}")]
public IActionResult DeleteUser(int id)
{
    var user = _context.Users.FirstOrDefault(u => u.Id == id);

    if (user == null)
    {
        return NotFound("User not found");
    }

    var adminCount = _context.Users.Count(u => u.Role == "Admin" && u.IsActive);

    if (user.Role == "Admin" && adminCount <= 1)
    {
        return BadRequest("Cannot delete the last active Admin user.");
    }

    user.IsActive = false;
    _context.SaveChanges();

    return Ok("User deactivated instead of permanently deleted.");
}
    }
}
