$job = Get-WmiObject Win32_PrintJob
if ($job -is [array]) {
    $job = $job[0]
}
if ($job) {
    Write-Host "Resuming job: $($job.Name)"
    $job.Resume()
}
