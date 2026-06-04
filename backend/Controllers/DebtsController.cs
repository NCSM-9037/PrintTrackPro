using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintTrackPro.Backend.Data;
using PrintTrackPro.Backend.Models;

namespace PrintTrackPro.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DebtsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DebtsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Debt>>> GetDebts()
        {
            return await _context.Debts
                .Include(d => d.Student)
                .ThenInclude(s => s!.Batch)
                .Where(d => d.Amount > 0)
                .OrderByDescending(d => d.LastPrintDate)
                .ToListAsync();
        }

        [HttpPost("{studentId}/pay")]
        public async Task<IActionResult> PayDebt(int studentId, [FromBody] PayDebtDto request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var debt = await _context.Debts.FirstOrDefaultAsync(d => d.StudentId == studentId);
                if (debt == null || debt.Amount <= 0)
                {
                    return BadRequest("No outstanding debt found for this student.");
                }

                decimal totalPayment = request.CashAmount + request.GooglePayAmount;
                if (totalPayment <= 0)
                {
                    return BadRequest("Payment amount must be greater than zero.");
                }

                if (totalPayment > debt.Amount)
                {
                    return BadRequest("Payment amount exceeds the outstanding debt.");
                }

                // 1. Update Debt
                debt.Amount -= totalPayment;
                if (debt.Amount == 0)
                {
                    debt.Status = "Paid";
                }
                _context.Debts.Update(debt);

                // 2. Create a "Debt Payment" Transaction record
                var newTx = new Transaction
                {
                    StudentId = studentId,
                    BatchId = request.BatchId, // Passed from frontend or derived from student
                    TotalAmount = totalPayment,
                    Description = "Debt Payment",
                    Date = DateTime.UtcNow
                };
                _context.Transactions.Add(newTx);
                await _context.SaveChangesAsync(); // save to get newTx.Id

                // 3. Create Payment record
                var payment = new Payment
                {
                    TransactionId = newTx.Id,
                    CashAmount = request.CashAmount,
                    GooglePayAmount = request.GooglePayAmount,
                    Date = DateTime.UtcNow
                };
                _context.Payments.Add(payment);

                // 4. Create Audit Log
                var audit = new AuditLog
                {
                    Action = "PayDebt",
                    Entity = "Debt",
                    EntityId = debt.Id,
                    Details = $"Paid {totalPayment} towards debt (Cash: {request.CashAmount}, GPay: {request.GooglePayAmount})"
                };
                _context.AuditLogs.Add(audit);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(debt);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }

    public class PayDebtDto
    {
        public int BatchId { get; set; }
        public decimal CashAmount { get; set; }
        public decimal GooglePayAmount { get; set; }
    }
}
