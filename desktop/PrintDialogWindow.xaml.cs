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

namespace PrintTrackPro.Desktop
{
    public partial class PrintDialogWindow : Window
    {
        private static readonly HttpClient client = new HttpClient { BaseAddress = new Uri("https://printtrack-pro-api.onrender.com/api/") };
        private List<Batch> allBatches = new();
        private List<Student> allStudents = new();
        
        public string DocumentName { get; set; }
        public int AutoPages { get; set; }

        public PrintDialogWindow(string documentName, int pages)
        {
            InitializeComponent();
            DocumentName = documentName;
            AutoPages = pages;
            
            DocumentNameText.Text = $"Document: {DocumentName}";
            TxtPages.Text = AutoPages > 0 ? AutoPages.ToString() : "";
            TxtDescription.Text = DocumentName;
            
            RecalculateCost(); // Initial calculation
        }

        private async void BtnCharge_Click(object sender, RoutedEventArgs e)
        {
            GatekeeperPanel.Visibility = Visibility.Collapsed;
            BillingPanel.Visibility = Visibility.Visible;
            TxtStatus.Text = "Loading batches...";
            
            try
            {
                allBatches = await client.GetFromJsonAsync<List<Batch>>("batches") ?? new List<Batch>();
                allStudents = await client.GetFromJsonAsync<List<Student>>("students") ?? new List<Student>();
                
                ComboBatches.ItemsSource = allBatches;
                TxtStatus.Text = "";
            }
            catch (Exception ex)
            {
                TxtStatus.Text = "Error connecting to server. Make sure internet is active.";
            }
        }

        private void BtnNoFees_Click(object sender, RoutedEventArgs e)
        {
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

            if (ComboStudents.SelectedValue == null)
            {
                TxtStatus.Text = "Please select a student.";
                if (sender is Button b) b.IsEnabled = true;
                return;
            }

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
                
                var response = await client.PostAsJsonAsync("transactions/process", transactionDto);
                
                if (response.IsSuccessStatusCode)
                {
                    MessageBox.Show("Saved successfully to the cloud!", "Success", MessageBoxButton.OK, MessageBoxImage.Information);
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
}
