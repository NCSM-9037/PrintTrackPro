using System.ComponentModel.DataAnnotations;

namespace PrintTrackPro.Backend.Models
{
    public class AuditLog
    {
        [Key]
        public int Id { get; set; }
        public int? UserId { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Entity { get; set; } = string.Empty;
        public int? EntityId { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Details { get; set; } = string.Empty;
    }
}
