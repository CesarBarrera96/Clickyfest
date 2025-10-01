using System.ComponentModel.DataAnnotations;

namespace ClickyFest.Api.DTOS
{
    public class LoginRequestDto
    {
        [Required]
        public string? Username { get; set; }

        [Required]
        public string? Password { get; set; }
    }
}
