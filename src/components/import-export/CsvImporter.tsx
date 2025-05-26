import React, { useState, useRef } from 'react';
import { Upload, AlertCircle, Check, X } from 'lucide-react';
import Button from '../ui/Button';
import { Asset } from '../../types';

interface CsvImporterProps {
  onImport: (assets: Partial<Asset>[]) => void;
}

const CsvImporter: React.FC<CsvImporterProps> = ({ onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please select a CSV file');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };
  
  const parseCSV = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const parsedLines = lines.map(line => 
          line.split(',').map(cell => cell.trim())
        );
        
        if (parsedLines.length < 2) {
          throw new Error('CSV file must contain header row and at least one data row');
        }
        
        setPreview(parsedLines.slice(0, 6)); // Show first 5 rows plus header
        setIsLoading(false);
      } catch (err) {
        console.error('Error parsing CSV:', err);
        setError('Failed to parse CSV file');
        setFile(null);
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read file');
      setFile(null);
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  const processImport = () => {
    if (!file) return;
    
    setIsLoading(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
        
        // Validate required columns
        const requiredColumns = ['serialnumber', 'assetclass', 'lastcertificationdate'];
        const missingColumns = requiredColumns.filter(col => !headers.includes(col));
        
        if (missingColumns.length > 0) {
          throw new Error(`Missing required columns: ${missingColumns.join(', ')}`);
        }
        
        // Parse data rows
        const assets: Partial<Asset>[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(value => value.trim());
          if (values.length !== headers.length) continue;
          
          const asset: Record<string, any> = {};
          
          headers.forEach((header, index) => {
            // Map CSV headers to asset properties
            switch (header) {
              case 'serialnumber':
                asset.serial_number = values[index];
                break;
              case 'assetclass':
                asset.asset_class = values[index];
                break;
              case 'assigneduserid':
                asset.assigned_user_id = values[index] || null;
                break;
              case 'issuedate':
                asset.issue_date = values[index];
                break;
              case 'lastcertificationdate':
                asset.last_certification_date = values[index];
                break;
              default:
                // Handle any additional columns
                break;
            }
          });
          
          assets.push(asset as Partial<Asset>);
        }
        
        onImport(assets);
        
        // Reset state
        setFile(null);
        setPreview([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err: any) {
        console.error('Error importing CSV:', err);
        setError(err.message || 'Failed to import CSV file');
      } finally {
        setIsLoading(false);
      }
    };
    
    reader.onerror = () => {
      setError('Failed to read file');
      setIsLoading(false);
    };
    
    reader.readAsText(file);
  };
  
  const resetFile = () => {
    setFile(null);
    setPreview([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="space-y-6">
      {!file ? (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
          <div className="flex flex-col items-center justify-center space-y-2">
            <Upload className="h-10 w-10 text-gray-400" />
            <div className="text-center">
              <p className="text-sm text-gray-500">
                Upload a CSV file with the following columns:
              </p>
              <p className="text-xs text-gray-400 mt-1">
                serial_number, asset_class, assigned_user_id (optional), issue_date (optional), last_certification_date
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="mt-2"
            >
              Select CSV File
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-primary-50 rounded-lg mr-3">
                <Upload className="h-5 w-5 text-primary-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFile}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {preview.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {preview[0].map((header, i) => (
                      <th 
                        key={i} 
                        className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.slice(1).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td 
                          key={cellIndex} 
                          className="px-3 py-2 whitespace-nowrap text-xs text-gray-500"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 5 && (
                <div className="text-center py-2 text-xs text-gray-500 bg-gray-50 border-t border-gray-200">
                  Preview showing {preview.length - 1} of {file ? file.name : ''} rows
                </div>
              )}
            </div>
          )}
          
          {error && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Error</p>
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={resetFile}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={processImport}
              isLoading={isLoading}
              disabled={isLoading || !!error}
              leftIcon={<Check className="h-4 w-4" />}
            >
              Import Data
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsvImporter;