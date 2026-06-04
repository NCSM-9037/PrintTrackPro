using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Linq;

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

        private async void BtnSubmit_Click(object sender, RoutedEventArgs e)
        {
            if (ComboStudents.SelectedValue == null)
            {
                TxtStatus.Text = "Please select a student.";
                return;
            }

            if (!int.TryParse(TxtPages.Text, out int pages) || !decimal.TryParse(TxtCost.Text, out decimal cost))
            {
                TxtStatus.Text = "Please enter valid numbers for Pages and Cost.";
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
                }
            }
            catch (Exception ex)
            {
                TxtStatus.Text = "Error saving data. " + ex.Message;
            }
        }
    }

    public class Batch { public int Id { get; set; } public string BatchName { get; set; } }
    public class Student { public int Id { get; set; } public string Name { get; set; } public int BatchId { get; set; } }
}
