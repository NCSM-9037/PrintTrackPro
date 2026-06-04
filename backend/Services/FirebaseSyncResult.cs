namespace PrintTrackPro.Backend.Services
{
    public class FirebaseSyncResult
    {
        public int FirebaseStudentsSeen { get; set; }
        public int BatchesCreated { get; set; }
        public int StudentsCreated { get; set; }
        public int StudentsUpdated { get; set; }
        public int StudentsSkipped { get; set; }
    }
}
