using System;
using System.Management;

class Program
{
    static void Main()
    {
        try 
        {
            uint _jobId = 2; // Hardcoded for test
            string query = $"SELECT * FROM Win32_PrintJob WHERE JobId = {_jobId}";
            using (var searcher = new ManagementObjectSearcher(query))
            {
                foreach (ManagementObject job in searcher.Get())
                {
                    Console.WriteLine("Resuming job...");
                    object result = job.InvokeMethod("Resume", null);
                    Console.WriteLine("Resume result: " + result);
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);
        }
    }
}
