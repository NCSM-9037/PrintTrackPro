namespace PrintTrackPro.Backend.Services
{
    public interface IFirebaseStudentSyncService
    {
        Task<FirebaseSyncResult> SyncAsync(CancellationToken cancellationToken = default);
    }
}
