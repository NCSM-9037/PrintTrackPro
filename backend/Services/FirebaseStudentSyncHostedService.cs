using Microsoft.Extensions.Options;

namespace PrintTrackPro.Backend.Services
{
    public class FirebaseStudentSyncHostedService : BackgroundService
    {
        private readonly IFirebaseStudentSyncService _syncService;
        private readonly FirebaseSyncOptions _options;
        private readonly ILogger<FirebaseStudentSyncHostedService> _logger;

        public FirebaseStudentSyncHostedService(
            IFirebaseStudentSyncService syncService,
            IOptions<FirebaseSyncOptions> options,
            ILogger<FirebaseStudentSyncHostedService> logger)
        {
            _syncService = syncService;
            _options = options.Value;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            if (!_options.Enabled)
            {
                _logger.LogInformation("Firebase student sync is disabled.");
                return;
            }

            var interval = TimeSpan.FromMinutes(Math.Max(1, _options.IntervalMinutes));

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await _syncService.SyncAsync(stoppingToken);
                }
                catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
                {
                    break;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Firebase student sync failed.");
                }

                await Task.Delay(interval, stoppingToken);
            }
        }
    }
}
