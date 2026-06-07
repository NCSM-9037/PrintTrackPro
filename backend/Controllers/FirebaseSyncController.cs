using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using PrintTrackPro.Backend.Services;

namespace PrintTrackPro.Backend.Controllers
{
    [ApiController]
    [Route("api/firebase-sync")]
    public class FirebaseSyncController : ControllerBase
    {
        private readonly IFirebaseStudentSyncService _syncService;
        private readonly FirebaseSyncOptions _options;
        private readonly IWebHostEnvironment _environment;

        public FirebaseSyncController(
            IFirebaseStudentSyncService syncService,
            IOptions<FirebaseSyncOptions> options,
            IWebHostEnvironment environment)
        {
            _syncService = syncService;
            _options = options.Value;
            _environment = environment;
        }

        [HttpPost("students")]
        public async Task<ActionResult<FirebaseSyncResult>> SyncStudents(CancellationToken cancellationToken)
        {
            if (!_environment.IsDevelopment() && !string.IsNullOrWhiteSpace(_options.ManualSyncKey))
            {
                var providedKey = Request.Headers["X-Sync-Key"].FirstOrDefault();
                if (!string.Equals(providedKey, _options.ManualSyncKey, StringComparison.Ordinal))
                {
                    return Unauthorized();
                }
            }

            var result = await _syncService.SyncAsync(cancellationToken);
            return Ok(result);
        }
    }
}
