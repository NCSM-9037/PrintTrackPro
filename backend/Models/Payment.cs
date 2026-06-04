using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PrintTrackPro.Backend.Models
{
    public class Payment
    {
        [Key]
        public int Id { get; set; }
        
        [ForeignKey("Transaction")]
        public int TransactionId { get; set; }
        public Transaction? Transaction { get; set; }
        
        public decimal CashAmount { get; set; }
        public decimal GooglePayAmount { get; set; }
        public DateTime Date { get; set; } = DateTime.UtcNow;
    }
}
