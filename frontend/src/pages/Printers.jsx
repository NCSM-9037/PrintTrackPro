import { useState } from 'react';
import { Settings, Printer as PrinterIcon, Power, PowerOff } from 'lucide-react';

export default function Printers() {
  const [printers, setPrinters] = useState([
    { id: 1, printerName: 'Canon LBP2900', location: 'Lab 1', blackWhiteRate: 2, colorRate: 10, monitoringEnabled: true },
    { id: 2, printerName: 'Epson L3250', location: 'Lab 2', blackWhiteRate: 2, colorRate: 15, monitoringEnabled: true },
    { id: 3, printerName: 'Microsoft Print to PDF', location: 'Virtual', blackWhiteRate: 0, colorRate: 0, monitoringEnabled: false },
  ]);

  const toggleMonitoring = (id) => {
    setPrinters(printers.map(p => 
      p.id === id ? { ...p, monitoringEnabled: !p.monitoringEnabled } : p
    ));
    // Here we would also call the API to update the backend
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Printer Settings</h1>
          <p className="text-gray-500">Configure printing rates and monitoring status for installed printers.</p>
        </div>
        <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors border border-gray-300">
          <Settings className="w-5 h-5" />
          <span>Scan For Printers</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {printers.map(printer => (
          <div key={printer.id} className={`rounded-xl shadow-sm border p-6 transition-all ${printer.monitoringEnabled ? 'bg-white border-blue-100 border-t-4 border-t-blue-500' : 'bg-gray-50 border-gray-200 border-t-4 border-t-gray-300'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${printer.monitoringEnabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                  <PrinterIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{printer.printerName}</h3>
                  <p className="text-xs text-gray-500">{printer.location}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4 border border-gray-100">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">B&W Rate:</span>
                <span className="font-medium text-gray-900">₹{printer.blackWhiteRate}/page</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Color Rate:</span>
                <span className="font-medium text-gray-900">₹{printer.colorRate}/page</span>
              </div>
            </div>
            
            <button 
              onClick={() => toggleMonitoring(printer.id)}
              className={`w-full py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors font-medium text-sm
                ${printer.monitoringEnabled 
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200' 
                  : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                }`}
            >
              {printer.monitoringEnabled ? (
                <><PowerOff className="w-4 h-4" /> <span>Disable Monitoring</span></>
              ) : (
                <><Power className="w-4 h-4" /> <span>Enable Monitoring</span></>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
