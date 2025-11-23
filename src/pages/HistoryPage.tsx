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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { getHistory, HistoryItem } from '@/lib/api';
import jsPDF from "jspdf";
import "jspdf-autotable";

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDisease, setFilterDisease] = useState('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => { loadHistory(); }, []);
  useEffect(() => { filterAndSortHistory(); }, [history, searchTerm, filterDisease, sortOrder]);

  const getTimestamp = (item: any) => item.timestamp || item.created_at || item.time || null;

  const safeParseProbabilities = (item: any): Record<string, number> | null => {
    try {
      const p = item.probabilities;
      if (p == null) return null;
      if (typeof p === 'object') return p as Record<string, number>;
      if (typeof p === 'string') {
        const trimmed = p.trim();
        if (!trimmed) return null;
        try {
          return JSON.parse(trimmed);
        } catch {
          return null;
        }
      }
      try {
        return JSON.parse(String(p));
      } catch {
        return null;
      }
    } catch (err) {
      console.warn("safeParseProbabilities failed for item:", item, err);
      return null;
    }
  };

  const normalizeDisease = (s?: string|null) => (s ? String(s).toLowerCase() : '');

  const loadHistory = async () => {
    try {
      const data = await getHistory();
      const arr = Array.isArray(data) ? data : [data];
      setHistory(arr);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load history.",
        variant: "destructive",
      });
    } finally { setLoading(false); }
  };

  const filterAndSortHistory = () => {
    let filtered = history.filter(item => {
      const disease = normalizeDisease(item.predicted_disease);
      const matchesSearch =
        (item.predicted_disease || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
        || (getTimestamp(item) || '').toString().toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterDisease === 'all' || disease === filterDisease;
      return matchesSearch && matchesFilter;
    });
    filtered.sort((a, b) => {
      const dateA = new Date(getTimestamp(a) || 0).getTime();
      const dateB = new Date(getTimestamp(b) || 0).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    setFilteredHistory(filtered);
  };

  const formatDate = (dateString: string | undefined | null) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return String(dateString);
    return date.toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  };

  const getDiseaseVariant = (disease: string | undefined) => {
    const d = normalizeDisease(disease);
    switch(d){
      case 'normal': return 'secondary';
      case 'cataract': return 'outline';
      case 'glaucoma':
      case 'diabetic_retinopathy':
      case 'diabetic retinopathy': return 'destructive';
      default: return 'secondary';
    }
  };

  const getDiseaseIcon = (disease: string | undefined) => (normalizeDisease(disease) === 'normal' ? CheckCircle : AlertCircle);

  const getUniqueDiseasesFromHistory = () => {
    const set = new Set(history.map(item => normalizeDisease(item.predicted_disease)));
    return Array.from(set).filter(Boolean);
  };

  const getStats = () => {
    const totalScans = history.length;
    const normalScans = history.filter(item => normalizeDisease(item.predicted_disease) === 'normal').length;
    const abnormalScans = totalScans - normalScans;
    const avgConfidence = history.length > 0
      ? (history.reduce((sum, item) => sum + (Number(item.confidence) || 0), 0)/history.length*100).toFixed(1)
      : '0';
    return { totalScans, normalScans, abnormalScans, avgConfidence };
  };

  const stats = getStats();

  const downloadPDF = () => {
    if (filteredHistory.length === 0) {
      return toast({ title: "No data to export", variant: "destructive" });
    }
    const doc = new jsPDF();
    const title = filterDisease === 'all'
      ? "Eye Scan History - All Conditions"
      : `Eye Scan History - ${filterDisease.replace(/_/g,' ').replace(/\b\w/g, l => l.toUpperCase())}`;

    doc.text(title, 14, 16);

    const tableColumn = ["ID", "Disease", "Confidence", "Date"];
    const tableRows = filteredHistory.map(item => {
      const id = (item.id ?? item.filename ?? '-').toString();
      const disease = (item.predicted_disease ?? '').replace(/_/g,' ');
      const conf = (((Number(item.confidence) || 0) * 100)).toFixed(1) + "%";
      const date = formatDate(getTimestamp(item));
      return [id, disease, conf, date];
    });

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 24,
    });
    doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
  };

  const downloadPDFForScan = (item: HistoryItem) => {
    const doc = new jsPDF();
    const diseaseLabel = (item.predicted_disease ?? '').replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase());
    const title = `Eye Scan Result - ${diseaseLabel}`;
    doc.text(title, 14, 16);

    const parsed = safeParseProbabilities(item) || {};
    const tableRows = Object.entries(parsed).map(([d,p]) => [d.replace(/_/g,' '), (Number(p) * 100).toFixed(1) + "%"]);

    (doc as any).autoTable({
      head: [["Disease","Confidence"]],
      body: tableRows,
      startY: 24,
    });

    doc.text(`Scan Date: ${formatDate(getTimestamp(item))}`, 14, (tableRows.length + 6) * 8);
    doc.save(`${title.replace(/\s+/g,'_').toLowerCase()}.pdf`);
  };

  const shareScan = (item: HistoryItem) => {
    const parsed = safeParseProbabilities(item) || {};
    let shareText = `Eye Scan Result:\nPredicted Disease: ${(item.predicted_disease ?? '').replace(/_/g,' ')}\nConfidence: ${((Number(item.confidence)||0)*100).toFixed(1)}%\nProbabilities:\n`;
    Object.entries(parsed).forEach(([d,prob]) => {
      shareText += `- ${d.replace(/_/g,' ')}: ${(Number(prob)*100).toFixed(1)}%\n`;
    });
    shareText += `Scan Date: ${formatDate(getTimestamp(item))}`;

    if ((navigator as any).share) {
      (navigator as any).share({ title: 'Eye Scan Result', text: shareText }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        toast({ title: "Copied to clipboard", description: "Scan details copied successfully." });
      }).catch(() => {
        toast({ title: "Copy failed", variant: "destructive" });
      });
    }
  };

  if(loading) return (
    <div className="container mx-auto px-4 py-8 max-w-6xl flex items-center justify-center min-h-96">
      <div className="text-center space-y-4">
        <Eye className="h-12 w-12 animate-pulse text-primary mx-auto"/>
        <p className="text-muted-foreground">Loading your scan history...</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.6}} className="space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold">{t('history')}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">Track your eye health over time with detailed analysis history and trends.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardContent className="p-6 text-center"><div className="text-2xl font-bold text-primary">{stats.totalScans}</div><div className="text-sm text-muted-foreground">Total Scans</div></CardContent></Card>
          <Card><CardContent className="p-6 text-center"><div className="text-2xl font-bold text-success">{stats.normalScans}</div><div className="text-sm text-muted-foreground">Normal Results</div></CardContent></Card>
          <Card><CardContent className="p-6 text-center"><div className="text-2xl font-bold text-warning">{stats.abnormalScans}</div><div className="text-sm text-muted-foreground">Abnormal Results</div></CardContent></Card>
          <Card><CardContent className="p-6 text-center"><div className="text-2xl font-bold text-primary">{stats.avgConfidence}%</div><div className="text-sm text-muted-foreground">Avg. Confidence</div></CardContent></Card>
        </div>

        <Card>
          <CardContent className="p-6 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by disease or date..." value={searchTerm} onChange={(e:any)=>setSearchTerm(e.target.value)} className="pl-10"/>
            </div>
            <Select value={filterDisease} onValueChange={(v)=>setFilterDisease(v)}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filter by disease" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Conditions</SelectItem>
                {getUniqueDiseasesFromHistory().map(d => <SelectItem key={d} value={d}>{d.replace(/_/g,' ').replace(/\b\w/g,l=>l.toUpperCase())}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(v)=>setSortOrder(v as 'newest'|'oldest')}>
              <SelectTrigger className="w-full sm:w-32"><SelectValue/></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {filteredHistory.length===0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Eye className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
              <h3 className="text-lg font-semibold mb-2">No scan history found</h3>
              <p className="text-muted-foreground mb-4">{history.length===0 ? "You haven't performed any eye scans yet." : "No results match your current filters."}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Scan History ({filteredHistory.length} results)</h2>
              <Button variant="outline" size="sm" onClick={downloadPDF}>
                <Download className="h-4 w-4 mr-2"/> Export PDF
              </Button>
            </div>
            <div className="space-y-4">
              {filteredHistory.map((item,index)=>{
                const DiseaseIcon = getDiseaseIcon(item.predicted_disease);
                const probabilities = safeParseProbabilities(item) || {};
                return (
                  <motion.div key={item.id ?? item.filename ?? index} initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.4, delay:index*0.05}}>
                    <Card className="hover:shadow-medical transition-all duration-300">
                      <CardContent className="p-6 flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${normalizeDisease(item.predicted_disease)==='normal'?'bg-success/10':'bg-warning/10'}`}>
                            <DiseaseIcon className={`h-6 w-6 ${normalizeDisease(item.predicted_disease)==='normal'?'text-success':'text-warning'}`}/>
                          </div>
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant={getDiseaseVariant(item.predicted_disease)} className="capitalize">{(item.predicted_disease ?? '').replace(/_/g,' ')}</Badge>
                              <Badge variant="outline">{(((Number(item.confidence) || 0))*100).toFixed(1)}% confidence</Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4"/>
                              <span>{formatDate(getTimestamp(item))}</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                              {Object.entries(probabilities).length === 0 ? (
                                <div className="text-xs text-muted-foreground">Probabilities: N/A</div>
                              ) : (
                                Object.entries(probabilities).map(([d,p])=>(
                                  <div key={d} className="flex justify-between">
                                    <span className="capitalize text-muted-foreground">{d.replace(/_/g,' ')}:</span>
                                    <span className="font-medium">{(Number(p)*100).toFixed(1)}%</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" onClick={()=>shareScan(item)}><Share2 className="h-4 w-4"/></Button>
                          <Button variant="outline" size="sm" onClick={() => downloadPDFForScan(item)}>
                            <Download className="h-4 w-4 mr-2"/> Export PDF
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default HistoryPage;
