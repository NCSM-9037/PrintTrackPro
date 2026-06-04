using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Google.Apis.Auth.OAuth2;
using Google.Cloud.Firestore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PrintTrackPro.Backend.Data;
using PrintTrackPro.Backend.Models;

namespace PrintTrackPro.Backend.Services
{
    public class FirebaseStudentSyncService : IFirebaseStudentSyncService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly FirebaseSyncOptions _options;
        private readonly ILogger<FirebaseStudentSyncService> _logger;

        public FirebaseStudentSyncService(
            IServiceScopeFactory scopeFactory,
            IOptions<FirebaseSyncOptions> options,
            ILogger<FirebaseStudentSyncService> logger)
        {
            _scopeFactory = scopeFactory;
            _options = options.Value;
            _logger = logger;
        }

        public async Task<FirebaseSyncResult> SyncAsync(CancellationToken cancellationToken = default)
        {
            var result = new FirebaseSyncResult();
            var firestore = CreateFirestoreDb();
            if (firestore == null)
            {
                _logger.LogWarning("Firebase student sync skipped because Firebase credentials/project are not configured.");
                return result;
            }

            var snapshot = await firestore.Collection(_options.CollectionName).GetSnapshotAsync(cancellationToken);

            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            foreach (var document in snapshot.Documents)
            {
                cancellationToken.ThrowIfCancellationRequested();
                result.FirebaseStudentsSeen++;

                var name = GetString(document, "student_name", "name", "studentName");
                var batchName = GetString(document, "batch", "batchName");

                if (string.IsNullOrWhiteSpace(name) || string.IsNullOrWhiteSpace(batchName))
                {
                    result.StudentsSkipped++;
                    continue;
                }

                name = name.Trim();
                batchName = batchName.Trim();

                var batch = await db.Batches
                    .FirstOrDefaultAsync(b => b.BatchName.ToLower() == batchName.ToLower(), cancellationToken);

                if (batch == null)
                {
                    batch = new Batch
                    {
                        BatchName = batchName,
                        Year = GetString(document, "year") ?? _options.DefaultYear,
                        Department = GetString(document, "department") ?? _options.DefaultDepartment
                    };

                    db.Batches.Add(batch);
                    await db.SaveChangesAsync(cancellationToken);
                    result.BatchesCreated++;
                }

                var sourceStudentId = GetString(document, "studentId", "student_id", "admissionNumber", "admission_no", "rollNo", "roll_no");
                var studentId = string.IsNullOrWhiteSpace(sourceStudentId)
                    ? CreateStableStudentId(document.Id, name, batchName)
                    : sourceStudentId.Trim();

                var existingStudent = await db.Students
                    .Include(s => s.Batch)
                    .FirstOrDefaultAsync(s =>
                        s.StudentId == studentId ||
                        (s.Name.ToLower() == name.ToLower() && s.BatchId == batch.Id),
                        cancellationToken);

                var phoneNumber = GetString(document, "phoneNumber", "phone", "mobile") ?? string.Empty;
                var email = GetString(document, "email") ?? string.Empty;
                var status = GetString(document, "status") ?? "Active";

                if (existingStudent == null)
                {
                    db.Students.Add(new Student
                    {
                        StudentId = studentId,
                        Name = name,
                        BatchId = batch.Id,
                        PhoneNumber = phoneNumber,
                        Email = email,
                        Status = status,
                        CreatedAt = DateTime.UtcNow
                    });
                    result.StudentsCreated++;
                    continue;
                }

                var changed = false;
                changed |= SetIfDifferent(existingStudent.Name, name, value => existingStudent.Name = value);
                changed |= SetIfDifferent(existingStudent.StudentId, studentId, value => existingStudent.StudentId = value);
                changed |= SetIfDifferent(existingStudent.PhoneNumber, phoneNumber, value => existingStudent.PhoneNumber = value);
                changed |= SetIfDifferent(existingStudent.Email, email, value => existingStudent.Email = value);
                changed |= SetIfDifferent(existingStudent.Status, status, value => existingStudent.Status = value);

                if (existingStudent.BatchId != batch.Id)
                {
                    existingStudent.BatchId = batch.Id;
                    changed = true;
                }

                if (changed)
                {
                    result.StudentsUpdated++;
                }
                else
                {
                    result.StudentsSkipped++;
                }
            }

            await db.SaveChangesAsync(cancellationToken);
            _logger.LogInformation(
                "Firebase student sync complete. Seen: {Seen}, batches created: {BatchesCreated}, students created: {StudentsCreated}, updated: {StudentsUpdated}, skipped: {StudentsSkipped}",
                result.FirebaseStudentsSeen,
                result.BatchesCreated,
                result.StudentsCreated,
                result.StudentsUpdated,
                result.StudentsSkipped);

            return result;
        }

        private FirestoreDb? CreateFirestoreDb()
        {
            var credentialsJson = GetCredentialsJson();
            var credentialsPath = GetCredentialsPath();
            var projectId = !string.IsNullOrWhiteSpace(_options.ProjectId)
                ? _options.ProjectId
                : !string.IsNullOrWhiteSpace(credentialsJson)
                    ? TryReadProjectIdFromJson(credentialsJson)
                    : TryReadProjectIdFromFile(credentialsPath);

            if (string.IsNullOrWhiteSpace(projectId))
            {
                return null;
            }

            var credential = !string.IsNullOrWhiteSpace(credentialsJson)
                ? GoogleCredential.FromJson(credentialsJson)
                : !string.IsNullOrWhiteSpace(credentialsPath) && File.Exists(credentialsPath)
                    ? GoogleCredential.FromFile(credentialsPath)
                    : null;

            if (credential == null)
            {
                return null;
            }

            return new FirestoreDbBuilder
            {
                ProjectId = projectId,
                Credential = credential
            }.Build();
        }

        private string GetCredentialsJson()
        {
            if (!string.IsNullOrWhiteSpace(_options.CredentialsJson))
            {
                return _options.CredentialsJson;
            }

            if (string.IsNullOrWhiteSpace(_options.CredentialsJsonBase64))
            {
                return string.Empty;
            }

            try
            {
                var bytes = Convert.FromBase64String(_options.CredentialsJsonBase64);
                return Encoding.UTF8.GetString(bytes);
            }
            catch (FormatException ex)
            {
                _logger.LogWarning(ex, "Firebase CredentialsJsonBase64 is not valid Base64.");
                return string.Empty;
            }
        }

        private string GetCredentialsPath()
        {
            if (!string.IsNullOrWhiteSpace(_options.CredentialsPath))
            {
                return _options.CredentialsPath;
            }

            return Environment.GetEnvironmentVariable("GOOGLE_APPLICATION_CREDENTIALS") ?? string.Empty;
        }

        private static string? TryReadProjectIdFromJson(string credentialsJson)
        {
            if (string.IsNullOrWhiteSpace(credentialsJson))
            {
                return null;
            }

            using var document = JsonDocument.Parse(credentialsJson);
            return document.RootElement.TryGetProperty("project_id", out var projectId)
                ? projectId.GetString()
                : null;
        }

        private static string? TryReadProjectIdFromFile(string credentialsPath)
        {
            if (string.IsNullOrWhiteSpace(credentialsPath) || !File.Exists(credentialsPath))
            {
                return null;
            }

            using var stream = File.OpenRead(credentialsPath);
            using var document = JsonDocument.Parse(stream);
            return document.RootElement.TryGetProperty("project_id", out var projectId)
                ? projectId.GetString()
                : null;
        }

        private static string? GetString(DocumentSnapshot document, params string[] fieldNames)
        {
            foreach (var fieldName in fieldNames)
            {
                if (document.TryGetValue<string>(fieldName, out var value) && !string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }

            return null;
        }

        private static string CreateStableStudentId(string documentId, string name, string batchName)
        {
            var raw = string.IsNullOrWhiteSpace(documentId) ? $"{name}:{batchName}" : documentId;
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(raw));
            var suffix = Convert.ToHexString(hash)[..10];
            return $"FB-{suffix}";
        }

        private static bool SetIfDifferent(string currentValue, string newValue, Action<string> setter)
        {
            if (currentValue == newValue)
            {
                return false;
            }

            setter(newValue);
            return true;
        }
    }
}
