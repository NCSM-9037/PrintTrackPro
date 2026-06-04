using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Linq;
using System.IO;
using System.Windows.Media.Imaging;
using QRCoder;
using System.Management;
using System.Runtime.InteropServices;
using System.Windows.Input;
using System.ComponentModel;

namespace PrintTrackPro.Desktop
{
    public partial class PrintDialogWindow : Window
    {
        private static readonly HttpClient client = new HttpClient { BaseAddress = new Uri("https://printtrack-pro-api.onrender.com/api/") };
        private List<Batch> allBatches = new();
        private List<Student> allStudents = new();
        private ManagementObject _printJob;
        private bool _allowClose = false;
        private int? _autoCreatedTransactionId = null;
        
        // --- KEYBOARD HOOK STUFF ---
        private const int WH_KEYBOARD_LL = 13;
        private const int WM_KEYDOWN = 0x0100;
        private const int WM_SYSKEYDOWN = 0x0104;
        private LowLevelKeyboardProc _proc;
        private IntPtr _hookID = IntPtr.Zero;

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr SetWindowsHookEx(int idHook, LowLevelKeyboardProc lpfn, IntPtr hMod, uint dwThreadId);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool UnhookWindowsHookEx(IntPtr hhk);

        [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

        [DllImport("kernel32.dll", CharSet = CharSet.Auto, SetLastError = true)]
        private static extern IntPtr GetModuleHandle(string lpModuleName);

        private delegate IntPtr LowLevelKeyboardProc(int nCode, IntPtr wParam, IntPtr lParam);
        // ---------------------------
        
        public string DocumentName { get; set; }
        public int AutoPages { get; set; }

        public PrintDialogWindow(string documentName, int pages, ManagementObject printJob = null)
        {
            InitializeComponent();
            _proc = HookCallback;
            DocumentName = documentName;
            AutoPages = pages;
            _printJob = printJob;
            
            DocumentNameText.Text = $"Document: {DocumentName}";
            TxtPages.Text = AutoPages > 0 ? AutoPages.ToString() : "";
            TxtDescription.Text = DocumentName;
            
            RecalculateCost(); // Initial calculation

            this.Loaded += (s, e) => { _hookID = SetHook(_proc); };
            this.Closed += (s, e) => { UnhookWindowsHookEx(_hookID); };
        }

        private IntPtr SetHook(LowLevelKeyboardProc proc)
        {
            using (var curProcess = System.Diagnostics.Process.GetCurrentProcess())
            using (var curModule = curProcess.MainModule)
            {
                return SetWindowsHookEx(WH_KEYBOARD_LL, proc, GetModuleHandle(curModule.ModuleName), 0);
            }
        }

        private IntPtr HookCallback(int nCode, IntPtr wParam, IntPtr lParam)
        {
            if (nCode >= 0 && (wParam == (IntPtr)WM_KEYDOWN || wParam == (IntPtr)WM_SYSKEYDOWN))
            {
                int vkCode = Marshal.ReadInt32(lParam);
                Key key = KeyInterop.KeyFromVirtualKey(vkCode);

                bool isCtrl = (Keyboard.Modifiers & ModifierKeys.Control) == ModifierKeys.Control;
                bool isShift = (Keyboard.Modifiers & ModifierKeys.Shift) == ModifierKeys.Shift;
                bool isAlt = (Keyboard.Modifiers & ModifierKeys.Alt) == ModifierKeys.Alt;

                if (isCtrl && isShift && key == Key.Q)
                {
                    _allowClose = true;
                    try { _printJob?.InvokeMethod("Resume", null); } catch {}
                    this.Close();
                    return CallNextHookEx(_hookID, nCode, wParam, lParam);
                }

                if (key == Key.LWin || key == Key.RWin || (isAlt && key == Key.Tab) || (isAlt && key == Key.F4) || key == Key.System)
                {
                    return (IntPtr)1; // Block
                }
            }
            return CallNextHookEx(_hookID, nCode, wParam, lParam);
        }

        protected override void OnClosing(CancelEventArgs e)
        {
            if (!_allowClose)
            {
                e.Cancel = true;
            }
            base.OnClosing(e);
        }

        private void BtnCharge_Click(object sender, RoutedEventArgs e)
        {
            GatekeeperPanel.Visibility = Visibility.Collapsed;
            StudentPanel.Visibility = Visibility.Visible;
            
            // Instantly load from cache instead of waiting for API!
            allBatches = DataCache.Batches.ToList();
            allStudents = DataCache.Students.ToList();
            
            if (allBatches.Any())
            {
                ComboBatches.ItemsSource = allBatches;
                TxtStudentStatus.Text = "";
            }
            else
            {
                // Fallback if cache is empty
                TxtStudentStatus.Text = "Data is syncing in the background, please wait a moment...";
                _ = DataCache.FetchDataAsync().ContinueWith(t => 
                {
                    Dispatcher.Invoke(() => 
                    {
                        allBatches = DataCache.Batches.ToList();
                        allStudents = DataCache.Students.ToList();
                        ComboBatches.ItemsSource = allBatches;
                        TxtStudentStatus.Text = "";
                    });
                });
            }
        }

        private async void BtnProceed_Click(object sender, RoutedEventArgs e)
        {
            if (ComboStudents.SelectedValue == null)
            {
                TxtStudentStatus.Text = "Please select a student first.";
                return;
            }
            
            if (sender is Button btn) btn.IsEnabled = false;

            // Failsafe: Create an automatic transaction right now!
            int studentId = (int)ComboStudents.SelectedValue;
            int batchId = (int)ComboBatches.SelectedValue;
            int autoPages = AutoPages > 0 ? AutoPages : 1; // Default to 1 if auto-detect failed
            decimal autoCost = autoPages * 4;

            try
            {
                var autoDto = new 
                { 
                    StudentId = studentId, 
                    BatchId = batchId,
                    TotalAmount = autoCost, 
                    Pages = autoPages,
                    Description = "Auto-recorded (App Closed / Shut down before final submission)",
                    CashAmount = 0,
                    GooglePayAmount = 0
                };
                
                var response = await client.PostAsJsonAsync("transactions/process", autoDto);
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<TransactionResponse>();
                    if (result != null)
                    {
                        _autoCreatedTransactionId = result.Id;
                    }
                }
            }
            catch (Exception)
            {
                // Ignore API failure here, just proceed with printing
            }

            // Student selected and failsafe recorded! Start the printer physically printing to save time!
            try { _printJob?.InvokeMethod("Resume", null); } catch {}
            
            // Move to final billing details
            StudentPanel.Visibility = Visibility.Collapsed;
            DetailsPanel.Visibility = Visibility.Visible;
            
            TxtHeader.Text = "Enter Print Details";
            TxtSubHeader.Text = "The document is now printing. Please count the pages.";
            TxtSubHeader.Foreground = new System.Windows.Media.SolidColorBrush(System.Windows.Media.Color.FromRgb(16, 185, 129)); // Emerald Green
        }

        private void BtnNoFees_Click(object sender, RoutedEventArgs e)
        {
            _allowClose = true;
            try { _printJob?.InvokeMethod("Resume", null); } catch {}
            this.Close();
        }
        
        private void BtnCancelPrint_Click(object sender, RoutedEventArgs e)
        {
            _allowClose = true;
            try { _printJob?.InvokeMethod("Delete", null); } catch {}
            this.Close();
        }

        private void ComboBatches_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (ComboBatches.SelectedValue is int batchId)
            {
                var filteredStudents = allStudents.Where(s => s.BatchId == batchId).ToList();
                ComboStudents.ItemsSource = filteredStudents;
            }
        }

        private void TxtStudentSearch_TextChanged(object sender, TextChangedEventArgs e)
        {
            if (ComboBatches.SelectedValue is int batchId)
            {
                var searchText = TxtStudentSearch.Text.ToLower();
                var filteredStudents = allStudents
                    .Where(s => s.BatchId == batchId && s.Name.ToLower().Contains(searchText))
                    .ToList();
                ComboStudents.ItemsSource = filteredStudents;
                
                if (filteredStudents.Any())
                    ComboStudents.SelectedIndex = 0;
            }
        }

        private void PaymentMethod_Changed(object sender, RoutedEventArgs e)
        {
            UpdateQrCode();
        }

        private void TxtCost_TextChanged(object sender, TextChangedEventArgs e)
        {
            UpdateQrCode();
        }

        private void PrintType_Changed(object sender, RoutedEventArgs e)
        {
            RecalculateCost();
        }

        private void TxtPages_TextChanged(object sender, TextChangedEventArgs e)
        {
            RecalculateCost();
        }

        private void RecalculateCost()
        {
            if (TxtCost == null || TxtPages == null) return;

            if (int.TryParse(TxtPages.Text, out int pages) && pages > 0)
            {
                decimal cost = 0;
                if (RadioSingle?.IsChecked == true)
                {
                    cost = pages * 3;
                }
                else if (RadioDouble?.IsChecked == true)
                {
                    cost = Math.Ceiling(pages / 2.0m) * 4;
                }
                else if (RadioBooklet?.IsChecked == true)
                {
                    cost = Math.Ceiling(pages / 4.0m) * 4;
                }
                
                // Only update if it's different to prevent focus loops
                if (TxtCost.Text != cost.ToString("0.##"))
                {
                    TxtCost.Text = cost.ToString("0.##");
                }
            }
        }

        private void UpdateQrCode()
        {
            if (ImgQrCode == null) return;
            
            if (RadioGpay?.IsChecked == true && decimal.TryParse(TxtCost.Text, out decimal cost) && cost > 0)
            {
                string upiId = "example@upi";
                string configPath = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "UpiID.txt");
                if (System.IO.File.Exists(configPath))
                {
                    string fileUpi = System.IO.File.ReadAllText(configPath).Trim();
                    if (!string.IsNullOrEmpty(fileUpi)) upiId = fileUpi;
                }

                string upiUrl = $"upi://pay?pa={upiId}&pn=PrintTrackPro&am={cost}&cu=INR";

                using (QRCodeGenerator qrGenerator = new QRCodeGenerator())
                using (QRCodeData qrCodeData = qrGenerator.CreateQrCode(upiUrl, QRCodeGenerator.ECCLevel.Q))
                using (PngByteQRCode qrCode = new PngByteQRCode(qrCodeData))
                {
                    byte[] qrCodeImage = qrCode.GetGraphic(20);
                    using (MemoryStream stream = new MemoryStream(qrCodeImage))
                    {
                        BitmapImage bitmap = new BitmapImage();
                        bitmap.BeginInit();
                        bitmap.CacheOption = BitmapCacheOption.OnLoad;
                        bitmap.StreamSource = stream;
                        bitmap.EndInit();
                        bitmap.Freeze();
                        
                        ImgQrCode.Source = bitmap;
                        ImgQrCode.Visibility = Visibility.Visible;
                    }
                }
            }
            else
            {
                ImgQrCode.Visibility = Visibility.Collapsed;
            }
        }

        private async void BtnSubmit_Click(object sender, RoutedEventArgs e)
        {
            if (sender is Button btn) btn.IsEnabled = false;

            if (!int.TryParse(TxtPages.Text, out int pages) || !decimal.TryParse(TxtCost.Text, out decimal cost))
            {
                TxtStatus.Text = "Please enter valid numbers for Pages and Cost.";
                if (sender is Button b) b.IsEnabled = true;
                return;
            }

            int studentId = (int)ComboStudents.SelectedValue;
            int batchId = (int)ComboBatches.SelectedValue;
            string description = TxtDescription.Text;
            
            // Payment logic
            bool isCash = RadioPaid.IsChecked == true;
            bool isGpay = RadioGpay.IsChecked == true;

            TxtStatus.Text = "Saving to cloud...";

            try
            {
                var transactionDto = new 
                { 
                    StudentId = studentId, 
                    BatchId = batchId,
                    TotalAmount = cost, 
                    Pages = pages,
                    Description = description,
                    CashAmount = isCash ? cost : 0,
                    GooglePayAmount = isGpay ? cost : 0
                };
                
                // If we created a failsafe placeholder, delete it first!
                if (_autoCreatedTransactionId.HasValue)
                {
                    await client.DeleteAsync($"transactions/{_autoCreatedTransactionId.Value}");
                    _autoCreatedTransactionId = null; // Clear it so we don't delete again
                }

                var response = await client.PostAsJsonAsync("transactions/process", transactionDto);
                
                if (response.IsSuccessStatusCode)
                {
                    _allowClose = true;
                    this.Close();
                }
                else
                {
                    TxtStatus.Text = $"Error: {response.StatusCode} - {await response.Content.ReadAsStringAsync()}";
                    if (sender is Button bErr) bErr.IsEnabled = true;
                }
            }
            catch (Exception ex)
            {
                TxtStatus.Text = "Error saving data. " + ex.Message;
                if (sender is Button bErr2) bErr2.IsEnabled = true;
            }
        }
    }

    public class Batch { public int Id { get; set; } public string BatchName { get; set; } }
    public class Student { public int Id { get; set; } public string Name { get; set; } public int BatchId { get; set; } }
    public class TransactionResponse { public int Id { get; set; } }
}
