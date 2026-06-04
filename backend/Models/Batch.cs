using System.ComponentModel.DataAnnotations;

namespace PrintTrackPro.Backend.Models
{
    public class Batch
    {
        [Key]
        public int Id { get; set; }
        public string BatchName { get; set; } = string.Empty;
        public string Year { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        
        public ICollection<Student> Students { get; set; } = new List<Student>();
    }
}
