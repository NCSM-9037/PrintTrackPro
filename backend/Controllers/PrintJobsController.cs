using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintTrackPro.Backend.Data;
using PrintTrackPro.Backend.Models;

namespace PrintTrackPro.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // [Authorize]
    public class PrintJobsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PrintJobsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<PrintJob>>> GetPrintJobs()
        {
            return await _context.PrintJobs
                .Include(p => p.Printer)
                .Include(p => p.Transaction)
                .OrderByDescending(p => p.PrintTime)
                .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PrintJob>> GetPrintJob(int id)
        {
            var printJob = await _context.PrintJobs
                .Include(p => p.Printer)
                .Include(p => p.Transaction)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (printJob == null)
            {
                return NotFound();
            }

            return printJob;
        }

        [HttpPost]
        public async Task<ActionResult<PrintJob>> PostPrintJob(PrintJob printJob)
        {
            printJob.PrintTime = DateTime.UtcNow;
            _context.PrintJobs.Add(printJob);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPrintJob), new { id = printJob.Id }, printJob);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePrintJob(int id)
        {
            var printJob = await _context.PrintJobs.FindAsync(id);
            if (printJob == null)
            {
                return NotFound();
            }

            _context.PrintJobs.Remove(printJob);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
