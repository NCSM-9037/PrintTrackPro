using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintTrackPro.Backend.Data;
using System.Linq;
using System.Threading.Tasks;

namespace PrintTrackPro.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("students")]
        public async Task<IActionResult> GetStudentReports()
        {
            // We want to return a list of students with their aggregated totals.
            // Since EF Core can do this efficiently, we will do a GroupBy or select directly.

            var studentReports = await _context.Students
                .Include(s => s.Batch)
                .Select(s => new
                {
                    StudentId = s.Id,
                    StudentName = s.Name,
                    BatchId = s.BatchId,
                    BatchName = s.Batch.BatchName,
                    
                    // Sum of all pages printed in transactions by this student
                    TotalPagesPrinted = _context.Transactions
                        .Where(t => t.StudentId == s.Id)
                        .Sum(t => (int?)t.Pages) ?? 0,
                        
                    // Sum of all TotalAmounts in transactions
                    TotalCost = _context.Transactions
                        .Where(t => t.StudentId == s.Id)
                        .Sum(t => (decimal?)t.TotalAmount) ?? 0m,
                        
                    // Debt (Unpaid) from the Debts table
                    TotalDebt = _context.Debts
                        .Where(d => d.StudentId == s.Id)
                        .Select(d => d.Amount)
                        .FirstOrDefault(),

                    // Sum of Cash Payments
                    TotalCashPaid = _context.Payments
                        .Where(p => p.Transaction.StudentId == s.Id)
                        .Sum(p => (decimal?)p.CashAmount) ?? 0m,
                        
                    // Sum of GPay Payments
                    TotalGPayPaid = _context.Payments
                        .Where(p => p.Transaction.StudentId == s.Id)
                        .Sum(p => (decimal?)p.GooglePayAmount) ?? 0m
                })
                .ToListAsync();

            return Ok(studentReports);
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardReport()
        {
            // Total Income (Cash + GPay)
            decimal totalCash = await _context.Payments.SumAsync(p => (decimal?)p.CashAmount) ?? 0m;
            decimal totalGPay = await _context.Payments.SumAsync(p => (decimal?)p.GooglePayAmount) ?? 0m;
            decimal totalIncome = totalCash + totalGPay;

            // Total To Get (Sum of all positive debts)
            decimal totalToGet = await _context.Debts
                .Where(d => d.Amount > 0)
                .SumAsync(d => (decimal?)d.Amount) ?? 0m;

            // Total To Give Others (Sum of all negative debts/credits)
            decimal totalToGive = await _context.Debts
                .Where(d => d.Amount < 0)
                .SumAsync(d => (decimal?)d.Amount) ?? 0m;
            totalToGive = Math.Abs(totalToGive); // Convert to positive for display

            // Total Pages Printed (Sum of all Pages across all Transactions)
            int totalPages = await _context.Transactions.SumAsync(t => (int?)t.Pages) ?? 0;

            return Ok(new
            {
                TotalIncome = totalIncome,
                TotalCash = totalCash,
                TotalGPay = totalGPay,
                TotalToGet = totalToGet,
                TotalToGiveOthers = totalToGive,
                TotalPagesPrinted = totalPages
            });
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetDetailedTransactions()
        {
            var txs = await _context.Transactions
                .Include(t => t.Student)
                .Select(t => new
                {
                    TransactionId = t.Id,
                    StudentId = t.StudentId,
                    StudentName = t.Student.Name,
                    Date = t.Date,
                    Description = t.Description,
                    Pages = t.Pages,
                    TotalAmount = t.TotalAmount,
                    // Get first payment attached to this transaction
                    CashAmount = _context.Payments.Where(p => p.TransactionId == t.Id).Select(p => p.CashAmount).FirstOrDefault(),
                    GPayAmount = _context.Payments.Where(p => p.TransactionId == t.Id).Select(p => p.GooglePayAmount).FirstOrDefault()
                })
                .OrderByDescending(t => t.Date)
                .ToListAsync();

            return Ok(txs);
        }
    }
}
