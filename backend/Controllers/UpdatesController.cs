using Microsoft.AspNetCore.Mvc;

namespace PrintTrackPro.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UpdatesController : ControllerBase
    {
        [HttpGet("latest")]
        public IActionResult GetLatestUpdate()
        {
            return Ok(new UpdateInfo
            {
                Version = "1.0.7",
                DownloadUrl = "https://github.com/NCSM-9037/PrintTrackPro/raw/main/ReleaseBuild.zip"
            });
        }
    }

    public class UpdateInfo
    {
        public string Version { get; set; } = string.Empty;
        public string DownloadUrl { get; set; } = string.Empty;
    }
}
