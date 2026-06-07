using System.Windows;

namespace PrintTrackPro.Desktop
{
    public partial class PasswordInputDialog : Window
    {
        public string Password { get; private set; } = string.Empty;

        public PasswordInputDialog()
        {
            InitializeComponent();
            TxtPassword.Focus();
        }

        private void BtnConfirm_Click(object sender, RoutedEventArgs e)
        {
            Password = TxtPassword.Password;
            DialogResult = true;
            Close();
        }

        private void BtnCancel_Click(object sender, RoutedEventArgs e)
        {
            DialogResult = false;
            Close();
        }
    }
}
