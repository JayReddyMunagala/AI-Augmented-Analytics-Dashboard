import React, { useState } from 'react';
import { Download, FileText, Mail, Share2, Calendar, CheckCircle, Loader2, Users, Plus, X, Send } from 'lucide-react';
import { SalesData, MetricCard, AIInsight } from '../types/dashboard';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import emailjs from '@emailjs/browser';

interface Props {
  filteredData: SalesData[];
  metrics: MetricCard[];
  insights: AIInsight[];
}

interface EmailRecipient {
  id: string;
  email: string;
  name: string;
  role: string;
  addedDate: Date;
}

// EmailJS configuration - In production, these should be environment variables
const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_your_service_id', // Replace with your EmailJS service ID
  TEMPLATE_ID: 'template_your_template_id', // Replace with your EmailJS template ID
  PUBLIC_KEY: 'your_public_key' // Replace with your EmailJS public key
};

export const ExportPanel: React.FC<Props> = ({ filteredData, metrics, insights }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);
  const [scheduledFrequency, setScheduledFrequency] = useState('');
  
  // Email recipients management
  const [emailRecipients, setEmailRecipients] = useState<EmailRecipient[]>([
    {
      id: '1',
      email: 'demo@company.com',
      name: 'John Smith',
      role: 'CEO',
      addedDate: new Date()
    },
    {
      id: '2', 
      email: 'sales@company.com',
      name: 'Sarah Johnson',
      role: 'Sales Director',
      addedDate: new Date()
    }
  ]);
  
  const [newRecipient, setNewRecipient] = useState({
    email: '',
    name: '',
    role: ''
  });
  
  const [showAddRecipient, setShowAddRecipient] = useState(false);
  const [isSendingEmails, setIsSendingEmails] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);

  // Initialize EmailJS (you need to set up your EmailJS account and get these keys)
  React.useEffect(() => {
    // For demo purposes, we'll use a mock configuration
    // In production, replace with your actual EmailJS configuration
    emailjs.init('demo_public_key');
  }, []);

  const generateReportData = () => {
    const totalSales = filteredData.reduce((sum, item) => sum + item.sales, 0);
    const averageDailySales = totalSales / (filteredData.length || 1);
    const topRegion = filteredData.reduce((acc, item) => {
      acc[item.region] = (acc[item.region] || 0) + item.sales;
      return acc;
    }, {} as Record<string, number>);
    
    const bestRegion = Object.entries(topRegion).sort(([,a], [,b]) => b - a)[0];
    
    const topProduct = filteredData.reduce((acc, item) => {
      acc[item.product] = (acc[item.product] || 0) + item.sales;
      return acc;
    }, {} as Record<string, number>);
    
    const bestProduct = Object.entries(topProduct).sort(([,a], [,b]) => b - a)[0];

    return {
      summary: {
        reportGenerated: new Date().toISOString(),
        dateRange: {
          start: Math.min(...filteredData.map(d => new Date(d.date).getTime())),
          end: Math.max(...filteredData.map(d => new Date(d.date).getTime()))
        },
        totalRecords: filteredData.length,
        totalSales: totalSales,
        averageDailySales: averageDailySales,
        topRegion: bestRegion ? { name: bestRegion[0], sales: bestRegion[1] } : null,
        topProduct: bestProduct ? { name: bestProduct[0], sales: bestProduct[1] } : null
      },
      metrics: metrics,
      insights: insights,
      rawData: filteredData.slice(0, 1000), // Limit for performance
      regionalBreakdown: Object.entries(topRegion).map(([region, sales]) => ({ region, sales })),
      productBreakdown: Object.entries(topProduct).map(([product, sales]) => ({ product, sales }))
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const addEmailRecipient = () => {
    if (!newRecipient.email || !newRecipient.name) {
      alert('Please fill in email and name fields.');
      return;
    }

    if (!newRecipient.email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    const recipient: EmailRecipient = {
      id: Date.now().toString(),
      email: newRecipient.email.toLowerCase(),
      name: newRecipient.name,
      role: newRecipient.role || 'Team Member',
      addedDate: new Date()
    };

    setEmailRecipients(prev => [...prev, recipient]);
    setNewRecipient({ email: '', name: '', role: '' });
    setShowAddRecipient(false);
    setLastExport(`${newRecipient.name} added to report recipients`);
    
    setTimeout(() => setLastExport(null), 3000);
  };

  const removeEmailRecipient = (id: string) => {
    const recipient = emailRecipients.find(r => r.id === id);
    setEmailRecipients(prev => prev.filter(r => r.id !== id));
    setLastExport(`${recipient?.name} removed from recipients`);
    setTimeout(() => setLastExport(null), 3000);
  };

  const sendEmailToRecipient = async (recipient: EmailRecipient, reportData: any) => {
    const emailContent = {
      to_name: recipient.name,
      to_email: recipient.email,
      from_name: 'Analytics Dashboard',
      reply_to: 'noreply@company.com',
      subject: `Analytics Dashboard Report - ${format(new Date(), 'PP')}`,
      message: `Hi ${recipient.name},

Please find the latest analytics dashboard report:

📊 EXECUTIVE SUMMARY
• Total Sales: ${formatCurrency(reportData.summary.totalSales)}
• Average Daily Sales: ${formatCurrency(reportData.summary.averageDailySales)}
• Data Points: ${reportData.summary.totalRecords.toLocaleString()}
• Top Region: ${reportData.summary.topRegion?.name || 'N/A'} (${formatCurrency(reportData.summary.topRegion?.sales || 0)})
• Best Product: ${reportData.summary.topProduct?.name || 'N/A'} (${formatCurrency(reportData.summary.topProduct?.sales || 0)})

📈 KEY METRICS
${reportData.metrics.map((metric: MetricCard) => 
  `• ${metric.title}: ${metric.value} (${metric.changeType === 'positive' ? '↑' : metric.changeType === 'negative' ? '↓' : '→'} ${Math.abs(metric.change)}%)`
).join('\n')}

🤖 TOP AI INSIGHTS
${reportData.insights.slice(0, 3).map((insight: AIInsight, i: number) => 
  `${i + 1}. ${insight.title} (${insight.confidence}% confidence)
   ${insight.summary.slice(0, 150)}...`
).join('\n\n')}

📊 REGIONAL PERFORMANCE
${reportData.regionalBreakdown.slice(0, 5).map((item: any) => 
  `• ${item.region}: ${formatCurrency(item.sales)}`
).join('\n')}

For detailed charts and interactive analysis, access the full dashboard:
${window.location.href}

Best regards,
Analytics Dashboard System

---
Report generated on ${format(new Date(), 'PPpp')}
Delivered to ${recipient.role} | ${recipient.email}`
    };

    try {
      // For demo purposes, we'll simulate the email sending
      // In production, you would use your actual EmailJS service configuration
      
      // This is how you would send with actual EmailJS:
      // const response = await emailjs.send(
      //   EMAILJS_CONFIG.SERVICE_ID,
      //   EMAILJS_CONFIG.TEMPLATE_ID,
      //   emailContent,
      //   EMAILJS_CONFIG.PUBLIC_KEY
      // );

      // For now, we'll simulate a successful send
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      return { success: true, recipientName: recipient.name };
    } catch (error) {
      console.error('Failed to send email to', recipient.email, error);
      return { success: false, recipientName: recipient.name, error };
    }
  };

  const sendReportToRecipients = async () => {
    if (emailRecipients.length === 0) {
      alert('No email recipients added. Please add recipients first.');
      return;
    }

    setIsSendingEmails(true);
    setEmailStatus('Preparing emails...');
    
    try {
      const reportData = generateReportData();
      const sendPromises = emailRecipients.map(recipient => 
        sendEmailToRecipient(recipient, reportData)
      );

      setEmailStatus('Sending emails...');
      const results = await Promise.all(sendPromises);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      if (failureCount === 0) {
        setEmailStatus(`✅ Successfully sent reports to all ${successCount} recipients!`);
        setLastExport(`Reports sent to ${successCount} recipient${successCount !== 1 ? 's' : ''}`);
      } else {
        setEmailStatus(`⚠️ Sent to ${successCount} recipients, ${failureCount} failed`);
        setLastExport(`Partial success: ${successCount}/${results.length} emails sent`);
      }
      
      // Clear status after 5 seconds
      setTimeout(() => {
        setEmailStatus(null);
        setLastExport(null);
      }, 5000);
      
    } catch (error) {
      console.error('Failed to send emails:', error);
      setEmailStatus('❌ Failed to send emails. Please try again.');
      setTimeout(() => setEmailStatus(null), 3000);
    } finally {
      setIsSendingEmails(false);
    }
  };

  const handleExport = async (type: string) => {
    setIsExporting(true);
    
    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
      const filename = `analytics-report-${timestamp}`;
      const reportData = generateReportData();

      if (type === 'json') {
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        downloadFile(blob, `${filename}.json`);
      } 
      else if (type === 'csv') {
        const csvContent = generateCSV(reportData);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        downloadFile(blob, `${filename}.csv`);
      }
      else if (type === 'pdf') {
        await generatePDF(reportData, filename);
      }
      
      setLastExport(`${type.toUpperCase()} exported at ${format(new Date(), 'HH:mm')}`);
      
      // Clear success message after 3 seconds
      setTimeout(() => setLastExport(null), 3000);
      
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (reportData: any) => {
    const headers = [
      'Date', 'Sales', 'Region', 'Product', 'Category'
    ];
    
    const rows = reportData.rawData.map((item: SalesData) => [
      item.date,
      item.sales,
      item.region,
      item.product,
      item.category
    ]);

    const summaryRows = [
      ['=== SUMMARY ==='],
      ['Total Sales', formatCurrency(reportData.summary.totalSales)],
      ['Average Daily Sales', formatCurrency(reportData.summary.averageDailySales)],
      ['Total Records', reportData.summary.totalRecords],
      ['Top Region', reportData.summary.topRegion?.name || 'N/A'],
      ['Top Product', reportData.summary.topProduct?.name || 'N/A'],
      [''],
      ['=== DETAILED DATA ==='],
      headers
    ];

    return [...summaryRows, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  };

  const generatePDF = async (reportData: any, filename: string) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Analytics Dashboard Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Generation date
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Generated: ${format(new Date(), 'PPpp')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 20;

    // Summary section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Executive Summary', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    const summaryText = [
      `Total Sales: ${formatCurrency(reportData.summary.totalSales)}`,
      `Average Daily Sales: ${formatCurrency(reportData.summary.averageDailySales)}`,
      `Data Points Analyzed: ${reportData.summary.totalRecords.toLocaleString()}`,
      `Top Performing Region: ${reportData.summary.topRegion?.name || 'N/A'}`,
      `Best Selling Product: ${reportData.summary.topProduct?.name || 'N/A'}`
    ];

    summaryText.forEach(text => {
      pdf.text(text, 20, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Metrics section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Metrics', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    reportData.metrics.forEach((metric: MetricCard) => {
      const changeText = metric.changeType === 'positive' ? '↑' : metric.changeType === 'negative' ? '↓' : '→';
      pdf.text(`${metric.title}: ${metric.value} (${changeText} ${Math.abs(metric.change)}%)`, 20, yPosition);
      yPosition += 8;
    });

    // New page for insights if needed
    if (yPosition > pageHeight - 60) {
      pdf.addPage();
      yPosition = 20;
    } else {
      yPosition += 10;
    }

    // AI Insights section
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('AI-Generated Insights', 20, yPosition);
    yPosition += 15;

    pdf.setFontSize(12);
    reportData.insights.forEach((insight: AIInsight, index: number) => {
      if (yPosition > pageHeight - 40) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${insight.title}`, 20, yPosition);
      yPosition += 8;

      pdf.setFont('helvetica', 'normal');
      const splitText = pdf.splitTextToSize(insight.summary, pageWidth - 40);
      pdf.text(splitText, 20, yPosition);
      yPosition += splitText.length * 6 + 5;

      pdf.setFont('helvetica', 'italic');
      pdf.text(`Confidence: ${insight.confidence}% | ${insight.timestamp}`, 20, yPosition);
      yPosition += 12;
    });

    // Try to capture dashboard screenshot for the last page
    try {
      const dashboardElement = document.querySelector('#root');
      if (dashboardElement) {
        const canvas = await html2canvas(dashboardElement as HTMLElement, {
          scale: 0.5,
          useCORS: true,
          allowTaint: true
        });
        
        pdf.addPage();
        pdf.text('Dashboard Overview', pageWidth / 2, 20, { align: 'center' });
        
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (imgHeight < pageHeight - 40) {
          pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
        }
      }
    } catch (error) {
      console.warn('Could not capture dashboard screenshot:', error);
    }

    pdf.save(`${filename}.pdf`);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
    const reportData = generateReportData();
    const subject = `Analytics Dashboard Report - ${format(new Date(), 'PP')}`;
    const body = `
Hi,

Please find the key insights from our analytics dashboard:

📊 EXECUTIVE SUMMARY
• Total Sales: ${formatCurrency(reportData.summary.totalSales)}
• Average Daily Sales: ${formatCurrency(reportData.summary.averageDailySales)}
• Top Region: ${reportData.summary.topRegion?.name || 'N/A'}
• Best Product: ${reportData.summary.topProduct?.name || 'N/A'}

🤖 AI INSIGHTS
${reportData.insights.slice(0, 3).map((insight, i) => 
  `${i + 1}. ${insight.title}\n   ${insight.summary.slice(0, 100)}...`
).join('\n\n')}

For the complete report with detailed data and visualizations, please export the full report from the dashboard.

Dashboard Link: ${window.location.href}

Best regards,
Analytics Team
    `;
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Analytics Dashboard Report',
      text: `Check out our latest business analytics insights - Total sales: ${formatCurrency(generateReportData().summary.totalSales)}`,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Fallback to clipboard
        fallbackShare();
      }
    } else {
      fallbackShare();
    }
  };

  const fallbackShare = () => {
    const reportData = generateReportData();
    const shareText = `Analytics Dashboard Report (${format(new Date(), 'PP')})\n\nKey Metrics:\n• Total Sales: ${formatCurrency(reportData.summary.totalSales)}\n• Top Region: ${reportData.summary.topRegion?.name || 'N/A'}\n\nView full dashboard: ${window.location.href}`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      alert('Report summary copied to clipboard!');
    }).catch(() => {
      alert('Dashboard URL: ' + window.location.href);
    });
  };

  const handleScheduledReport = () => {
    if (!scheduledFrequency) {
      alert('Please select a frequency for scheduled reports.');
      return;
    }
    
    if (emailRecipients.length === 0) {
      alert('Please add email recipients before setting up scheduled reports.');
      return;
    }
    
    // In a real app, this would send the schedule to a backend service
    alert(`Scheduled ${scheduledFrequency} reports have been set up for ${emailRecipients.length} recipient${emailRecipients.length !== 1 ? 's' : ''}! They'll receive automated email reports.`);
    setScheduledFrequency('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center space-x-2">
        <Download className="h-5 w-5" />
        <span>Export & Share</span>
      </h3>
      
      {lastExport && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700">{lastExport}</span>
        </div>
      )}

      {emailStatus && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center space-x-2">
          <Mail className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-blue-700">{emailStatus}</span>
        </div>
      )}
      
      <div className="space-y-6">
        {/* Email Recipients Management */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Email Recipients ({emailRecipients.length})</span>
          </h4>
          
          {/* Send to All Recipients */}
          {emailRecipients.length > 0 && (
            <button
              onClick={sendReportToRecipients}
              disabled={isSendingEmails}
              className="w-full mb-3 flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isSendingEmails ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="text-sm font-medium">
                {isSendingEmails ? 'Sending Reports...' : 'Send Report to All Recipients'}
              </span>
            </button>
          )}

          {/* Recipients List */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {emailRecipients.map((recipient) => (
              <div key={recipient.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {recipient.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {recipient.email} • {recipient.role}
                  </p>
                </div>
                <button
                  onClick={() => removeEmailRecipient(recipient.id)}
                  className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors rounded"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Recipient */}
          {!showAddRecipient ? (
            <button
              onClick={() => setShowAddRecipient(true)}
              className="w-full mt-2 flex items-center justify-center space-x-2 px-4 py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="text-sm font-medium">Add Recipient</span>
            </button>
          ) : (
            <div className="mt-3 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email address"
                  value={newRecipient.email}
                  onChange={(e) => setNewRecipient({ ...newRecipient, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Full name"
                  value={newRecipient.name}
                  onChange={(e) => setNewRecipient({ ...newRecipient, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Role (optional)"
                  value={newRecipient.role}
                  onChange={(e) => setNewRecipient({ ...newRecipient, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex space-x-2">
                  <button
                    onClick={addEmailRecipient}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    Add Recipient
                  </button>
                  <button
                    onClick={() => {
                      setShowAddRecipient(false);
                      setNewRecipient({ email: '', name: '', role: '' });
                    }}
                    className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Export Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Export Report</h4>
          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              <span className="text-sm font-medium">PDF Report</span>
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleExport('json')}
                disabled={isExporting}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                <span className="text-sm font-medium">JSON</span>
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={isExporting}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                <span className="text-sm font-medium">CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sharing Options */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">Share Report</h4>
          <div className="space-y-2">
            <button
              onClick={handleEmail}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Mail className="h-4 w-4" />
              <span className="text-sm font-medium">Email Summary</span>
            </button>
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm font-medium">Share Dashboard</span>
            </button>
          </div>
        </div>

        {/* Scheduled Reports */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
            <Calendar className="h-4 w-4" />
            <span>Scheduled Reports</span>
          </h4>
          <div className="space-y-3">
            <select 
              value={scheduledFrequency}
              onChange={(e) => setScheduledFrequency(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select frequency...</option>
              <option value="daily">Daily at 9:00 AM</option>
              <option value="weekly">Weekly on Mondays</option>
              <option value="monthly">Monthly on 1st</option>
              <option value="quarterly">Quarterly</option>
            </select>
            {scheduledFrequency && (
              <button
                onClick={handleScheduledReport}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Schedule {scheduledFrequency.charAt(0).toUpperCase() + scheduledFrequency.slice(1)} Reports
              </button>
            )}
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="pt-4 border-t border-gray-100">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <h5 className="text-sm font-medium text-yellow-800 mb-1">📧 Email Setup</h5>
            <p className="text-xs text-yellow-700">
              The email system is currently in demo mode. To enable actual email delivery, you'll need to:
            </p>
            <ul className="text-xs text-yellow-700 mt-1 space-y-0.5">
              <li>• Set up an EmailJS account</li>
              <li>• Configure your email service</li>
              <li>• Update the configuration keys</li>
            </ul>
          </div>
        </div>

        {/* Data Summary */}
        <div className="pt-2">
          <div className="text-xs text-gray-500 space-y-1">
            <p>📊 {filteredData.length.toLocaleString()} records in current view</p>
            <p>💰 {formatCurrency(filteredData.reduce((sum, item) => sum + item.sales, 0))} total sales</p>
            <p>🎯 {insights.length} AI insights available</p>
            <p>📧 {emailRecipients.length} email recipient{emailRecipients.length !== 1 ? 's' : ''} configured</p>
          </div>
        </div>
      </div>
    </div>
  );
};