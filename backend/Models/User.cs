using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace PrintTrackPro.Backend.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        
        [JsonIgnore]
        public string PasswordHash { get; set; } = string.Empty;
        public string Role { get; set; } = "Admin";
    }
}
