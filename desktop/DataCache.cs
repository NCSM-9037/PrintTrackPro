using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading;
using System.Threading.Tasks;

namespace PrintTrackPro.Desktop
{
    public static class DataCache
    {
        public static List<Batch> Batches { get; private set; } = new List<Batch>();
        public static List<Student> Students { get; private set; } = new List<Student>();
        
        private static Timer _refreshTimer;
        private static readonly HttpClient _client = new HttpClient { BaseAddress = new Uri("https://printtrack-pro-api.onrender.com/api/") };
        
        public static void StartAutoRefresh()
        {
            // Fetch immediately
            _ = FetchDataAsync();
            
            // Ping Render API every 5 minutes (300,000 ms) to keep it awake and refresh cache
            _refreshTimer = new Timer(async _ => await FetchDataAsync(), null, 300000, 300000);
        }

        public static async Task FetchDataAsync()
        {
            try
            {
                var newBatches = await _client.GetFromJsonAsync<List<Batch>>("batches");
                if (newBatches != null) Batches = newBatches;

                var newStudents = await _client.GetFromJsonAsync<List<Student>>("students");
                if (newStudents != null) Students = newStudents;
            }
            catch (Exception ex)
            {
                Console.WriteLine("Background fetch failed: " + ex.Message);
            }
        }
    }
}
