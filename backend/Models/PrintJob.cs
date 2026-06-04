using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PrintTrackPro.Backend.Models
{
    public class PrintJob
    {
        [Key]
        public int Id { get; set; }
        
        [ForeignKey("Printer")]
        public int PrinterId { get; set; }
        public Printer? Printer { get; set; }
        
        public int Pages { get; set; }
        public bool IsColor { get; set; }
        public string ComputerName { get; set; } = string.Empty;
        public DateTime PrintTime { get; set; } = DateTime.UtcNow;
        
        [ForeignKey("Transaction")]
        public int? TransactionId { get; set; }
        public Transaction? Transaction { get; set; }
    }
}
