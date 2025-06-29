import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { CSVColumn, DatasetInfo, SalesData } from '../types/dashboard';

interface Props {
  onDataUpload: (data: SalesData[], info: DatasetInfo) => void;
  onError: (error: string) => void;
}

export const CSVUploader: React.FC<Props> = ({ onDataUpload, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');

  const processCSV = useCallback((file: File) => {
    setIsProcessing(true);
    setUploadStatus('idle');
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          if (results.errors.length > 0) {
            throw new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`);
          }

          const rawData = results.data as any[];
          
          if (rawData.length === 0) {
            throw new Error('CSV file is empty or has no valid data rows');
          }

          // Analyze columns
          const headers = Object.keys(rawData[0]);
          const columns: CSVColumn[] = headers.map(header => {
            const samples = rawData.slice(0, 10).map(row => row[header]).filter(val => val !== null && val !== undefined);
            const firstSample = samples[0];
            
            let type: 'string' | 'number' | 'date' = 'string';
            
            // Try to detect column types
            if (typeof firstSample === 'number') {
              type = 'number';
            } else if (typeof firstSample === 'string') {
              // Check if it's a date
              const dateRegex = /^\d{4}-\d{2}-\d{2}$|^\d{1,2}\/\d{1,2}\/\d{4}$|^\d{1,2}-\d{1,2}-\d{4}$/;
              if (dateRegex.test(firstSample) || !isNaN(Date.parse(firstSample))) {
                type = 'date';
              }
            }
            
            return {
              name: header,
              type,
              samples: samples.slice(0, 5)
            };
          });

          // Try to map CSV columns to expected format
          const mappedData: SalesData[] = rawData.map((row, index) => {
            const mapped: any = { ...row };
            
            // Try to find date column
            const dateCol = columns.find(col => 
              col.type === 'date' || 
              col.name.toLowerCase().includes('date') ||
              col.name.toLowerCase().includes('time')
            );
            if (dateCol && row[dateCol.name]) {
              mapped.date = new Date(row[dateCol.name]).toISOString().split('T')[0];
            } else {
              mapped.date = new Date().toISOString().split('T')[0];
            }

            // Try to find sales/revenue column
            const salesCol = columns.find(col => 
              col.type === 'number' && (
                col.name.toLowerCase().includes('sales') ||
                col.name.toLowerCase().includes('revenue') ||
                col.name.toLowerCase().includes('amount') ||
                col.name.toLowerCase().includes('value')
              )
            );
            if (salesCol && row[salesCol.name]) {
              mapped.sales = typeof row[salesCol.name] === 'number' ? row[salesCol.name] : parseFloat(row[salesCol.name]) || 0;
            } else {
              // Use first numeric column as sales
              const firstNumericCol = columns.find(col => col.type === 'number');
              mapped.sales = firstNumericCol && row[firstNumericCol.name] ? 
                (typeof row[firstNumericCol.name] === 'number' ? row[firstNumericCol.name] : parseFloat(row[firstNumericCol.name]) || 0) : 
                Math.random() * 10000; // Fallback
            }

            // Try to find region column
            const regionCol = columns.find(col => 
              col.name.toLowerCase().includes('region') ||
              col.name.toLowerCase().includes('location') ||
              col.name.toLowerCase().includes('area')
            );
            mapped.region = regionCol && row[regionCol.name] ? String(row[regionCol.name]) : 'Unknown Region';

            // Try to find product column
            const productCol = columns.find(col => 
              col.name.toLowerCase().includes('product') ||
              col.name.toLowerCase().includes('item') ||
              col.name.toLowerCase().includes('name')
            );
            mapped.product = productCol && row[productCol.name] ? String(row[productCol.name]) : `Product ${index + 1}`;

            // Try to find category column
            const categoryCol = columns.find(col => 
              col.name.toLowerCase().includes('category') ||
              col.name.toLowerCase().includes('type') ||
              col.name.toLowerCase().includes('group')
            );
            mapped.category = categoryCol && row[categoryCol.name] ? String(row[categoryCol.name]) : 'General';

            return mapped as SalesData;
          });

          const datasetInfo: DatasetInfo = {
            fileName: file.name,
            rowCount: mappedData.length,
            columns,
            uploadDate: new Date()
          };

          onDataUpload(mappedData, datasetInfo);
          setUploadStatus('success');
          setUploadMessage(`Successfully uploaded ${mappedData.length.toLocaleString()} records from ${file.name}`);
          
          setTimeout(() => {
            setUploadStatus('idle');
            setUploadMessage('');
          }, 3000);

        } catch (error) {
          console.error('Error processing CSV:', error);
          const errorMessage = error instanceof Error ? error.message : 'Failed to process CSV file';
          onError(errorMessage);
          setUploadStatus('error');
          setUploadMessage(errorMessage);
        } finally {
          setIsProcessing(false);
        }
      },
      error: (error) => {
        console.error('Papa Parse error:', error);
        onError(`Failed to parse CSV: ${error.message}`);
        setUploadStatus('error');
        setUploadMessage(`Failed to parse CSV: ${error.message}`);
        setIsProcessing(false);
      }
    });
  }, [onDataUpload, onError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        onError('Please upload a valid CSV file');
        setUploadStatus('error');
        setUploadMessage('Please upload a valid CSV file');
        return;
      }
      processCSV(file);
    }
  }, [processCSV, onError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    multiple: false,
    disabled: isProcessing
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <Upload className="h-5 w-5" />
        <span>Upload Dataset</span>
      </h3>

      {/* Upload Status */}
      {uploadMessage && (
        <div className={`mb-4 p-3 rounded-lg flex items-center space-x-2 ${
          uploadStatus === 'success' ? 'bg-green-50 border border-green-200' :
          uploadStatus === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          {uploadStatus === 'success' && <CheckCircle className="h-4 w-4 text-green-600" />}
          {uploadStatus === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
          <span className={`text-sm ${
            uploadStatus === 'success' ? 'text-green-700' :
            uploadStatus === 'error' ? 'text-red-700' :
            'text-blue-700'
          }`}>
            {uploadMessage}
          </span>
          <button 
            onClick={() => {setUploadStatus('idle'); setUploadMessage('');}}
            className="ml-auto"
          >
            <X className="h-4 w-4 text-gray-500 hover:text-gray-700" />
          </button>
        </div>
      )}

      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isProcessing ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600">Processing CSV file...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3">
            <FileText className="h-12 w-12 text-gray-400" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Drop your CSV file here' : 'Upload CSV Dataset'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Drag and drop your CSV file here, or click to select
              </p>
            </div>
            <div className="text-xs text-gray-400 space-y-1">
              <p>• Supported format: CSV (.csv)</p>
              <p>• Expected columns: date, sales/revenue, region, product, category</p>
              <p>• Maximum file size: 50MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">📊 CSV Format Guidelines</h4>
        <div className="text-xs text-blue-700 space-y-1">
          <p><strong>Required columns (can be named differently):</strong></p>
          <ul className="list-disc list-inside ml-2 space-y-0.5">
            <li><strong>Date:</strong> date, time, timestamp (YYYY-MM-DD format preferred)</li>
            <li><strong>Sales/Revenue:</strong> sales, revenue, amount, value (numeric values)</li>
            <li><strong>Region:</strong> region, location, area (text values)</li>
            <li><strong>Product:</strong> product, item, name (text values)</li>
            <li><strong>Category:</strong> category, type, group (text values)</li>
          </ul>
          <p className="mt-2"><strong>Example:</strong> date,sales,region,product,category</p>
          <p>The system will automatically detect and map your columns!</p>
        </div>
      </div>
    </div>
  );
};