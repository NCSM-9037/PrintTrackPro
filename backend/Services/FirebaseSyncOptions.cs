namespace PrintTrackPro.Backend.Services
{
    public class FirebaseSyncOptions
    {
        public bool Enabled { get; set; } = true;
        public string ProjectId { get; set; } = string.Empty;
        public string CredentialsPath { get; set; } = string.Empty;
        public string CredentialsJson { get; set; } = string.Empty;
        public string CredentialsJsonBase64 { get; set; } = string.Empty;
        public string CollectionName { get; set; } = "students";
        public string ManualSyncKey { get; set; } = string.Empty;
        public int IntervalMinutes { get; set; } = 5;
        public string DefaultYear { get; set; } = "2024";
        public string DefaultDepartment { get; set; } = "Unknown";
    }
}
