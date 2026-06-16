import React, { useEffect } from 'react';
import { BrainCircuit, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';
import useAiAnalysis from '@/hooks/useAiAnalysis';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { cn } from '@/utils/helpers';

const AIBriefingPanel = ({ sessionId }) => {
  const { summary, loading, error, fetchDashboardSummary } = useAiAnalysis(sessionId);

  useEffect(() => {
    if (sessionId) fetchDashboardSummary();
  }, [fetchDashboardSummary, sessionId]);

  if (loading && !summary) {
    return (
      <Card className="p-5 border-dashed border-brand/30 bg-brand/5 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand/20" />
          <div className="h-4 w-32 bg-brand/20 rounded" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-brand/10 rounded" />
          <div className="h-3 w-4/5 bg-brand/10 rounded" />
        </div>
      </Card>
    );
  }

  if (error && !summary) {
    return (
      <Card className="p-4 border-red-100 bg-red-50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-xs font-medium text-red-800">Briefing unavailable: {error}</p>
        </div>
        <Button variant="ghost" size="xs" onClick={fetchDashboardSummary} icon={RefreshCw}>Retry</Button>
      </Card>
    );
  }

  if (!summary) return null;

  // Split summary into sentences for better rendering if needed, 
  // but aiService already joins them with spaces. 
  // Let's highlight some keywords if possible.
  
  return (
    <Card className="relative overflow-hidden border-none bg-gradient-to-br from-brand to-brand-dark p-6 text-white shadow-xl shadow-brand/20">
      <div className="absolute -right-4 -top-4 opacity-10">
        <BrainCircuit size={120} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-white/80">Daily AI Briefing</span>
          </div>
          <button 
            onClick={fetchDashboardSummary} 
            className={cn("p-1 hover:bg-white/10 rounded-full transition-colors", loading && "animate-spin")}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        <p className="text-sm md:text-base font-medium leading-relaxed text-white/95">
          {summary}
        </p>

        <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-4">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-6 h-6 rounded-full border-2 border-brand bg-white/20 backdrop-blur-sm flex items-center justify-center text-[8px] font-bold">
                AI
              </div>
            ))}
          </div>
          <p className="text-[10px] font-bold text-white/60 uppercase tracking-wider">
            Generated from real-time school metrics
          </p>
        </div>
      </div>
    </Card>
  );
};

export default AIBriefingPanel;
