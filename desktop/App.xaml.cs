using System.Configuration;
using System.Data;
using System.Windows;

namespace PrintTrackPro.Desktop;

/// <summary>
/// Interaction logic for App.xaml
/// </summary>
public partial class App : Application
{
    protected override void OnStartup(StartupEventArgs e)
    {
        base.OnStartup(e);
        
        AppDomain.CurrentDomain.UnhandledException += (s, args) =>
        {
            System.IO.File.WriteAllText("crash_log.txt", args.ExceptionObject.ToString());
            MessageBox.Show("Fatal Error: " + args.ExceptionObject.ToString());
        };
        
        this.DispatcherUnhandledException += (s, args) =>
        {
            System.IO.File.WriteAllText("crash_log.txt", args.Exception.ToString());
            MessageBox.Show("UI Error: " + args.Exception.ToString());
            args.Handled = true;
        };
    }
}

