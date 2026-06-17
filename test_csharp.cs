using System;
using System.Management;

class Program
{
    static void Main()
    {
        try 
        {
            var searcher = new ManagementObjectSearcher("SELECT * FROM Win32_PrintJob");
            foreach (ManagementObject job in searcher.Get())
            {
                Console.WriteLine("JobId Property: " + job["JobId"]);
                uint jobId = 0;
                if (job["JobId"] != null)
                {
                    bool success = uint.TryParse(job["JobId"].ToString(), out jobId);
                    Console.WriteLine("Parsed: " + success + " Value: " + jobId);
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex);
        }
    }
}
