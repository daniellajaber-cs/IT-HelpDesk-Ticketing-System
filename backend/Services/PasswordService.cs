using backend.Models;
using Microsoft.AspNetCore.Identity;

namespace backend.Services
{
    public class PasswordService
    {
        private readonly PasswordHasher<User> _passwordHasher = new();

        public string HashPassword(User user, string password)
        {
            return _passwordHasher.HashPassword(user, password);
        }

      public bool VerifyPassword(User user, string password)
{
    if (IsPlainTextPassword(user.Password))
    {
        return user.Password == password;
    }

    var result = _passwordHasher.VerifyHashedPassword(user, user.Password, password);

    return result == PasswordVerificationResult.Success ||
           result == PasswordVerificationResult.SuccessRehashNeeded;
}

        public bool IsPlainTextPassword(string password)
        {
            return !password.StartsWith("AQAAAA");
        }
    }
}