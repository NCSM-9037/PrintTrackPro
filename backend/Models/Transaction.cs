using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PrintTrackPro.Backend.Models
{
    public class Transaction
    {
        [Key]
        public int Id { get; set; }
        
        [ForeignKey("Student")]
        public int StudentId { get; set; }
        public Student? Student { get; set; }
        
        [ForeignKey("Batch")]
        public int BatchId { get; set; }
        public Batch? Batch { get; set; }
        
        public string Description { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public int Pages { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;
    }
}
