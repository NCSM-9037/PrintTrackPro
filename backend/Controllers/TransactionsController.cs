using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintTrackPro.Backend.Data;
using PrintTrackPro.Backend.Models;

namespace PrintTrackPro.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TransactionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public TransactionsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Transaction>>> GetTransactions()
        {
            return await _context.Transactions
                .Include(t => t.Student)
                .Include(t => t.Batch)
                .OrderByDescending(t => t.Date)
                .ToListAsync();
        }

        [HttpPost("process")]
        public async Task<IActionResult> ProcessTransaction([FromBody] ProcessTransactionDto request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 1. Create the Transaction
                var newTx = new Transaction
                {
                    StudentId = request.StudentId,
                    BatchId = request.BatchId,
                    TotalAmount = request.TotalAmount,
                    Pages = request.Pages,
                    Description = request.Description,
                    Date = DateTime.UtcNow
                };

                _context.Transactions.Add(newTx);
                await _context.SaveChangesAsync();

                // 2. Create the Payment
                var newPayment = new Payment
                {
                    TransactionId = newTx.Id,
                    CashAmount = request.CashAmount,
                    GooglePayAmount = request.GooglePayAmount,
                    Date = DateTime.UtcNow
                };

                _context.Payments.Add(newPayment);

                // 3. Calculate Debt
                decimal totalPaid = request.CashAmount + request.GooglePayAmount;
                decimal remainingDebt = request.TotalAmount - totalPaid;

                if (remainingDebt != 0)
                {
                    var existingDebt = await _context.Debts.FirstOrDefaultAsync(d => d.StudentId == request.StudentId);
                    if (existingDebt != null)
                    {
                        existingDebt.Amount += remainingDebt;
                        existingDebt.LastPrintDate = DateTime.UtcNow;
                        existingDebt.Status = "Pending";
                        _context.Debts.Update(existingDebt);
                    }
                    else
                    {
                        var debt = new Debt
                        {
                            StudentId = request.StudentId,
                            Amount = remainingDebt,
                            LastPrintDate = DateTime.UtcNow,
                            Status = "Pending"
                        };
                        _context.Debts.Add(debt);
                    }
                }

                // 4. Create Audit Log
                var audit = new AuditLog
                {
                    Action = "ProcessTransaction",
                    Entity = "Transaction",
                    EntityId = newTx.Id,
                    Details = $"Processed {request.TotalAmount} (Cash: {request.CashAmount}, GPay: {request.GooglePayAmount}, Debt: {remainingDebt})"
                };
                _context.AuditLogs.Add(audit);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(newTx);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }

        [HttpPut("{id}/payment")]
        public async Task<IActionResult> UpdateTransactionPayment(int id, [FromBody] UpdatePaymentDto request)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var tx = await _context.Transactions.FindAsync(id);
                if (tx == null) return NotFound("Transaction not found");

                var payment = await _context.Payments.FirstOrDefaultAsync(p => p.TransactionId == id);
                if (payment == null) return NotFound("Payment record not found");

                // 1. Revert old debt effect
                decimal oldTotalPaid = payment.CashAmount + payment.GooglePayAmount;
                decimal oldDebtEffect = tx.TotalAmount - oldTotalPaid;
                
                var existingDebt = await _context.Debts.FirstOrDefaultAsync(d => d.StudentId == tx.StudentId);
                if (existingDebt != null)
                {
                    existingDebt.Amount -= oldDebtEffect; // Revert
                }

                // 2. Update payment amounts
                decimal newCashAmount = request.CashAmount - request.GivenBackAmount;
                decimal newGpayAmount = request.GooglePayAmount;

                payment.CashAmount = newCashAmount;
                payment.GooglePayAmount = newGpayAmount;
                _context.Payments.Update(payment);

                // 3. Apply new debt effect
                decimal newTotalPaid = newCashAmount + newGpayAmount;
                decimal newDebtEffect = tx.TotalAmount - newTotalPaid;

                if (existingDebt != null)
                {
                    existingDebt.Amount += newDebtEffect;
                    _context.Debts.Update(existingDebt);
                }
                else if (newDebtEffect != 0)
                {
                    var debt = new Debt
                    {
                        StudentId = tx.StudentId,
                        Amount = newDebtEffect,
                        LastPrintDate = DateTime.UtcNow,
                        Status = "Pending"
                    };
                    _context.Debts.Add(debt);
                }

                // 4. Create Audit Log
                var audit = new AuditLog
                {
                    Action = "UpdatePayment",
                    Entity = "Transaction",
                    EntityId = tx.Id,
                    Details = $"Updated payment to Cash: {newCashAmount}, GPay: {newGpayAmount} (Given back: {request.GivenBackAmount})"
                };
                _context.AuditLogs.Add(audit);

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(payment);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, $"Internal server error: {ex.Message}");
            }
        }
    }

    public class ProcessTransactionDto
    {
        public int StudentId { get; set; }
        public int BatchId { get; set; }
        public decimal TotalAmount { get; set; }
        public int Pages { get; set; }
        public string Description { get; set; } = string.Empty;
        public decimal CashAmount { get; set; }
        public decimal GooglePayAmount { get; set; }
    }

    public class UpdatePaymentDto
    {
        public decimal CashAmount { get; set; }
        public decimal GooglePayAmount { get; set; }
        public decimal GivenBackAmount { get; set; }
    }
}
