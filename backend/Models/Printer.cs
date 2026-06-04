using System.ComponentModel.DataAnnotations;

namespace PrintTrackPro.Backend.Models
{
    public class Printer
    {
        [Key]
        public int Id { get; set; }
        public string PrinterName { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty;
        public decimal BlackWhiteRate { get; set; } = 2.0m;
        public decimal ColorRate { get; set; } = 10.0m;
        public bool MonitoringEnabled { get; set; } = true;
    }
}
