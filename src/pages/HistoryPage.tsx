import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Eye,
  Download,
  Share2,
  Search,
  AlertCircle,
  CheckCircle,
  Trash2,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUser } from "@clerk/clerk-react"; 
import { getScans, clearScans, ScanRecord } from '@/lib/scanStorage'; 
import jsPDF from "jspdf";
import "jspdf-autotable";

const HistoryPage: React.FC = () => {
  const { user, isLoaded } = useUser();
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDisease, setFilterDisease] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const { toast } = useToast();
  const { t } = useLanguage();

  // 1. Load History (Safe for Guests)
  useEffect(() => { 
    if (isLoaded) {
      const userId = user ? user.id : "guest";
      const data = getScans(userId);
      setHistory(data);
      setLoading(false);
    }
  }, [user, isLoaded]);

  // 2. Filter Logic
  useEffect(() => { filterAndSortHistory(); }, [history, searchTerm, filterDisease, sortOrder]);

  const normalizeDisease = (s?: string | null) => (s ? String(s).toLowerCase() : '');

  const filterAndSortHistory = () => {
    let filtered = history.filter(item => {
      const disease = normalizeDisease(item.prediction);
      const matchesSearch =
        (item.prediction || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
        || (item.timestamp || '').toString().toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterDisease === 'all' || disease === filterDisease;
      return matchesSearch && matchesFilter;
    });
    
    filtered.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    setFilteredHistory(filtered);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Unknown" : date.toLocaleDateString();
  };

  const getDiseaseVariant = (disease: string) => {
    const d = normalizeDisease(disease);
    return d === 'normal' ? 'secondary' : 'destructive';
  };

  const getDiseaseIcon = (disease: string) => (normalizeDisease(disease) === 'normal' ? CheckCircle : AlertCircle);

  const getUniqueDiseases = () => Array.from(new Set(history.map(i => normalizeDisease(i.prediction)))).filter(Boolean);

  // --- RESTORED FEATURES ---

  // 1. Statistics
  const stats = {
    total: history.length,
    normal: history.filter(i => normalizeDisease(i.prediction) === 'normal').length,
    abnormal: history.filter(i => normalizeDisease(i.prediction) !== 'normal').length,
    avgConf: history.length > 0 
      ? (history.reduce((acc, i) => acc + Number(i.probability), 0) / history.length * 100).toFixed(1) 
      : '0'
  };

  // 2. Batch PDF Export
  const downloadBatchPDF = () => {
    if (filteredHistory.length === 0) {
      return toast({ title: "No data", description: "Nothing to export.", variant: "destructive" });
    }
    const doc = new jsPDF();
    doc.text("Eye Scan History Report", 14, 16);
    
    const tableRows = filteredHistory.map(item => [
      formatDate(item.timestamp),
      item.prediction.replace(/_/g, ' '),
      (Number(item.probability) * 100).toFixed(1) + "%"
    ]);

    (doc as any).autoTable({
      head: [["Date", "Condition", "Confidence"]],
      body: tableRows,
      startY: 24,
    });
    
    doc.save(`Scan_History_${new Date().toISOString().slice(0,10)}.pdf`);
    toast({ title: "Export Complete", description: "History PDF downloaded." });
  };

  // 3. Single Scan PDF Export
  const downloadSinglePDF = (item: ScanRecord) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Clarity Scan Aid - Single Report", 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Date: ${formatDate(item.timestamp)}`, 14, 30);
    doc.text(`Diagnosis: ${item.prediction}`, 14, 40);
    doc.text(`Confidence: ${(Number(item.probability) * 100).toFixed(1)}%`, 14, 50);

    if (item.notes) {
        doc.text("Notes:", 14, 60);
        doc.setFontSize(10);
        doc.text(item.notes, 14, 66);
    }

    // If we have the image data, add it
    if (item.imageDataUrl) {
        try {
            // Fit image in a 100x100 box
            doc.addImage(item.imageDataUrl, "JPEG", 14, 80, 100, 100);
        } catch (e) {
            console.warn("Could not add image to PDF", e);
        }
    }
    
    doc.save(`Report_${item.id.slice(0,8)}.pdf`);
  };

  // 4. Share Functionality
  const shareScan = (item: ScanRecord) => {
    const shareText = `Eye Scan Result: ${item.prediction} (${(Number(item.probability)*100).toFixed(1)}%) - ${formatDate(item.timestamp)}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Eye Scan Result',
        text: shareText,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText);
      toast({ title: "Copied", description: "Result copied to clipboard." });
    }
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to delete all history? This cannot be undone.")) {
       const userId = user ? user.id : "guest";
       clearScans(userId);
       setHistory([]);
       toast({ title: "History Cleared", description: "All records have been deleted." });
    }
  };

  if(loading) return (
    <div className="container mx-auto px-4 py-8 flex justify-center items-center min-h-[50vh]">
      <div className="text-center space-y-4">
        <Eye className="h-12 w-12 animate-pulse text-blue-600 mx-auto"/>
        <p className="text-gray-500">Loading scan history...</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.6}} className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t('history') || 'Scan History'}</h1>
            <p className="text-gray-500">Your personal record of AI analyses.</p>
          </div>
          <div className="flex gap-2">
             {history.length > 0 && (
                <>
                  <Button variant="outline" onClick={downloadBatchPDF}>
                    <FileText className="h-4 w-4 mr-2" /> Export PDF
                  </Button>
                  <Button variant="destructive" onClick={handleClearHistory}>
                    <Trash2 className="h-4 w-4 mr-2" /> Clear All
                  </Button>
                </>
             )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-6 text-center"><div className="text-2xl font-bold">{stats.total}</div><div className="text-xs text-gray-500">Total Scans</div></CardContent></Card>
          <Card><CardContent className="p-6 text-center"><div className="text-2xl font-bold text-green-600">{stats.normal}</div><div className="text-xs text-gray-500">Normal</div></CardContent></Card>
          <Card><CardContent className="p-6 text-center"><div className="text-2xl font-bold text-red-600">{stats.abnormal}</div><div className="text-xs text-gray-500">Issues Found</div></CardContent></Card>
          <Card><CardContent className="p-6 text-center"><div className="text-2xl font-bold text-blue-600">{stats.avgConf}%</div><div className="text-xs text-gray-500">Avg. Confidence</div></CardContent></Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search date or disease..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)} 
                className="pl-10"
              />
            </div>
            <Select value={filterDisease} onValueChange={setFilterDisease}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Filter" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {getUniqueDiseases().map(d => (
                  <SelectItem key={d} value={d} className="capitalize">{d.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as any)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* List */}
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
            <p className="text-gray-500">No scans found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredHistory.map((item) => (
              <motion.div key={item.id} initial={{opacity:0}} animate={{opacity:1}}>
                <Card className="hover:shadow-md transition-all">
                  <CardContent className="p-4 flex items-center gap-4">
                    
                    <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 border flex-shrink-0">
                      <img src={item.imageDataUrl} alt="Scan" className="h-full w-full object-cover" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getDiseaseVariant(item.prediction)} className="capitalize">
                          {item.prediction.replace(/_/g, ' ')}
                        </Badge>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Calendar size={10} /> {formatDate(item.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Confidence: {(Number(item.probability)*100).toFixed(1)}%</p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" onClick={() => shareScan(item)} title="Share">
                        <Share2 className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => downloadSinglePDF(item)} title="Download PDF">
                        <Download className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>

                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default HistoryPage;
