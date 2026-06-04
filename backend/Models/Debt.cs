using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PrintTrackPro.Backend.Models
{
    public class Debt
    {
        [Key]
        public int Id { get; set; }
        
        [ForeignKey("Student")]
        public int StudentId { get; set; }
        public Student? Student { get; set; }
        
        public decimal Amount { get; set; }
        public string Status { get; set; } = "Pending";
        public DateTime LastPrintDate { get; set; } = DateTime.UtcNow;
    }
}
