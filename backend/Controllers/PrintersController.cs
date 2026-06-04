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
    public class PrintersController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PrintersController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Printer>>> GetPrinters()
        {
            return await _context.Printers.ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Printer>> GetPrinter(int id)
        {
            var printer = await _context.Printers.FindAsync(id);

            if (printer == null)
            {
                return NotFound();
            }

            return printer;
        }

        [HttpPost]
        public async Task<ActionResult<Printer>> PostPrinter(Printer printer)
        {
            _context.Printers.Add(printer);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPrinter), new { id = printer.Id }, printer);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> PutPrinter(int id, Printer printer)
        {
            if (id != printer.Id)
            {
                return BadRequest();
            }

            _context.Entry(printer).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!PrinterExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePrinter(int id)
        {
            var printer = await _context.Printers.FindAsync(id);
            if (printer == null)
            {
                return NotFound();
            }

            _context.Printers.Remove(printer);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool PrinterExists(int id)
        {
            return _context.Printers.Any(e => e.Id == id);
        }
    }
}
