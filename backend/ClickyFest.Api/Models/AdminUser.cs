// En Models/AdminUser.cs
using System.ComponentModel.DataAnnotations;
namespace ClickyFest.Api.Models
{
    public class AdminUser
    {
        [Key]
        public int UserID { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public DateTime DateCreated { get; set; }
    }
}