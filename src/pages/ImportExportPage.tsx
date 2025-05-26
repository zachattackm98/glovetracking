import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useRole } from '../hooks/useRole';
import { useAssets } from '../hooks/useAssets';
import PageLayout from '../components/layout/PageLayout';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import CsvImporter from '../components/import-export/CsvImporter';
import CsvExporter from '../components/import-export/CsvExporter';
import { File, Upload, FileDown } from 'lucide-react';

const ImportExportPage: React.FC = () => {
  const { isAdmin } = useRole();
  const { importAssets, exportAssets } = useAssets();
  const [importSuccess, setImportSuccess] = useState(false);
  const [importCount, setImportCount] = useState(0);
  
  // Only allow admins to access this page
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  const handleImport = (assets: any[]) => {
    importAssets(assets);
    setImportSuccess(true);
    setImportCount(assets.length);
    
    // Reset success message after 5 seconds
    setTimeout(() => {
      setImportSuccess(false);
    }, 5000);
  };
  
  return (
    <PageLayout title="Import / Export" description="Manage your asset data">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Import section */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <Upload className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Import Assets</h3>
            </div>
          </CardHeader>
          <CardContent>
            <CsvImporter onImport={handleImport} />
            
            {importSuccess && (
              <div className="mt-4 bg-success-50 border border-success-200 text-success-700 p-4 rounded-md animate-fade-in">
                <div className="flex">
                  <File className="h-5 w-5 text-success-500 mr-2" />
                  <p>Successfully imported {importCount} assets!</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Export section */}
        <Card>
          <CardHeader>
            <div className="flex items-center">
              <FileDown className="h-5 w-5 text-gray-400 mr-2" />
              <h3 className="text-lg font-medium text-gray-900">Export Assets</h3>
            </div>
          </CardHeader>
          <CardContent>
            <CsvExporter onExport={exportAssets} />
          </CardContent>
        </Card>
      </div>
      
      {/* Information section */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-medium text-gray-900">Data Format Information</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-medium text-gray-800">CSV Import Format</h4>
                <p className="text-sm text-gray-600 mt-1">
                  When importing assets, your CSV file should include the following columns:
                </p>
                
                <div className="mt-3 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Column</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Required</th>
                        <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-3 py-2 text-sm text-gray-900">serial_number</td>
                        <td className="px-3 py-2 text-sm text-gray-900">Yes</td>
                        <td className="px-3 py-2 text-sm text-gray-500">Unique identifier for the asset</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-sm text-gray-900">asset_class</td>
                        <td className="px-3 py-2 text-sm text-gray-900">Yes</td>
                        <td className="px-3 py-2 text-sm text-gray-500">Class type (e.g., "Class 0", "Class 1")</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-sm text-gray-900">assigned_user_id</td>
                        <td className="px-3 py-2 text-sm text-gray-900">No</td>
                        <td className="px-3 py-2 text-sm text-gray-500">User ID of assigned technician</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-sm text-gray-900">issue_date</td>
                        <td className="px-3 py-2 text-sm text-gray-900">No</td>
                        <td className="px-3 py-2 text-sm text-gray-500">Date issued (YYYY-MM-DD format)</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-sm text-gray-900">last_certification_date</td>
                        <td className="px-3 py-2 text-sm text-gray-900">Yes</td>
                        <td className="px-3 py-2 text-sm text-gray-500">Last certification date (YYYY-MM-DD format)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-base font-medium text-gray-800">Example CSV</h4>
                <pre className="mt-2 bg-gray-50 p-3 rounded-md text-xs text-gray-700 overflow-x-auto">
                  serial_number,asset_class,assigned_user_id,issue_date,last_certification_date{'\n'}
                  G-12345,Class 1,2,2023-01-15,2023-05-10{'\n'}
                  G-67890,Class 2,,2022-12-10,2022-12-15{'\n'}
                  G-54321,Class 0,2,2023-04-05,2023-06-01
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ImportExportPage;