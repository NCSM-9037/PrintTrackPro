using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PrintTrackPro.Backend.Data;

namespace PrintTrackPro.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DashboardController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            var today = DateTime.UtcNow.Date;
            var startOfMonth = new DateTime(today.Year, today.Month, 1);
            var startOfYear = new DateTime(today.Year, 1, 1);

            var totalStudents = await _context.Students.CountAsync();
            var totalPrints = await _context.PrintJobs.CountAsync();
            var totalPages = await _context.PrintJobs.SumAsync(p => (int?)p.Pages) ?? 0;

            var totalIncome = await _context.Transactions.SumAsync(t => (decimal?)t.TotalAmount) ?? 0;
            var totalCash = await _context.Payments.SumAsync(p => (decimal?)p.CashAmount) ?? 0;
            var totalGPay = await _context.Payments.SumAsync(p => (decimal?)p.GooglePayAmount) ?? 0;
            
            var pendingDebt = await _context.Debts.Where(d => d.Amount > 0).SumAsync(d => (decimal?)d.Amount) ?? 0;

            var todayIncome = await _context.Payments
                .Where(p => p.Date >= today)
                .SumAsync(p => (decimal?)(p.CashAmount + p.GooglePayAmount)) ?? 0;

            var monthlyIncome = await _context.Payments
                .Where(p => p.Date >= startOfMonth)
                .SumAsync(p => (decimal?)(p.CashAmount + p.GooglePayAmount)) ?? 0;

            var yearlyIncome = await _context.Payments
                .Where(p => p.Date >= startOfYear)
                .SumAsync(p => (decimal?)(p.CashAmount + p.GooglePayAmount)) ?? 0;

            return Ok(new
            {
                TotalStudents = totalStudents,
                TotalPrints = totalPrints,
                TotalPages = totalPages,
                TotalIncome = totalIncome,
                TotalCash = totalCash,
                TotalGooglePay = totalGPay,
                TotalDebtPending = pendingDebt,
                TodayIncome = todayIncome,
                MonthlyIncome = monthlyIncome,
                YearlyIncome = yearlyIncome
            });
        }
    }
}
