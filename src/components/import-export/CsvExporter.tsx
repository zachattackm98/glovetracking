import React, { useState } from 'react';
import { FileDown, Check } from 'lucide-react';
import Button from '../ui/Button';

interface CsvExporterProps {
  onExport: () => string;
  fileName?: string;
}

const CsvExporter: React.FC<CsvExporterProps> = ({ 
  onExport,
  fileName = 'safeguard-assets-export.csv'
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  const handleExport = () => {
    setIsExporting(true);
    setSuccessMessage('');
    
    try {
      // Get CSV content
      const csvContent = onExport();
      
      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setSuccessMessage('Export completed successfully!');
    } catch (error) {
      console.error('Export failed:', error);
      setSuccessMessage('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="mb-3 sm:mb-0">
          <h3 className="text-base font-medium text-gray-900">Export Assets</h3>
          <p className="text-sm text-gray-500">
            Download a CSV file with all your asset data for backup or reporting.
          </p>
        </div>
        <Button
          onClick={handleExport}
          isLoading={isExporting}
          disabled={isExporting}
          leftIcon={<FileDown className="h-4 w-4" />}
        >
          Export to CSV
        </Button>
      </div>
      
      {successMessage && (
        <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded-lg flex items-center animate-fade-in">
          <Check className="h-5 w-5 mr-2 flex-shrink-0" />
          <p className="text-sm font-medium">{successMessage}</p>
        </div>
      )}
    </div>
  );
};

export default CsvExporter;