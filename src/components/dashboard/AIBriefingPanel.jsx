import React, { useEffect, useState, useMemo } from 'react';
import { BrainCircuit, Sparkles, RefreshCw, AlertCircle, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useAiAnalysis from '@/hooks/useAiAnalysis';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { cn } from '@/utils/helpers';

const AIBriefingPanel = ({ sessionId }) => {
  const { summary, loading, error, lastUpdated, fetchDashboardSummary } = useAiAnalysis(sessionId);

  useEffect(() => {
    if (sessionId) fetchDashboardSummary();
  }, [fetchDashboardSummary, sessionId]);

  const sentences = useMemo(() => {
    if (!summary) return [];
    // Split by period but keep the period, and filter out empty strings
    return summary.split(/(?<=\.)\s+/).filter(s => s.trim().length > 0);
  }, [summary]);

  const renderText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-text-primary">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  if (loading && !summary) {
    return (
      <Card className="p-0 overflow-hidden border-brand/20 bg-brand/5">
        <div className="p-6 flex flex-col md:flex-row items-start md:items-center gap-6 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-brand/10 flex-shrink-0" />
          <div className="flex-1 space-y-3 w-full">
            <div className="h-4 w-1/4 bg-brand/10 rounded" />
            <div className="space-y-2">
              <div className="h-3 w-full bg-brand/10 rounded" />
              <div className="h-3 w-5/6 bg-brand/10 rounded" />
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (error && !summary) {
    return (
      <Card className="p-4 border-red-100 bg-red-50 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <AlertCircle className="text-red-600" size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-red-900">Briefing unavailable</p>
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={fetchDashboardSummary} 
          icon={RefreshCw}
          className="bg-white border-red-200 text-red-700 hover:bg-red-50"
        >
          Retry
        </Button>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="relative overflow-hidden border-brand/20 bg-white shadow-xl shadow-brand/5 group">
        {/* Subtle Decorative Elements */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-brand/5 rounded-full blur-3xl group-hover:bg-brand/10 transition-colors duration-700" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-64 h-64 bg-brand/5 rounded-full blur-3xl group-hover:bg-brand/10 transition-colors duration-700" />
        
        <div className="relative z-10 flex flex-col md:flex-row gap-6 p-6">
          {/* Left Side: Icon & Meta */}
          <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-4 flex-shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-brand blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
              <div className="relative bg-gradient-to-br from-brand to-brand-dark p-3 rounded-2xl shadow-lg shadow-brand/20">
                <BrainCircuit size={28} className="text-white" />
              </div>
            </div>
            
            <div className="hidden md:flex flex-col gap-1 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Live AI</span>
              </div>
              {lastUpdated && (
                <span className="text-[9px] text-text-muted font-medium">
                  {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>

          {/* Right Side: Content */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="blue" className="bg-brand/10 text-brand border-brand/20 font-bold px-2 py-0.5">
                  <Sparkles size={10} className="mr-1" /> DAILY BRIEFING
                </Badge>
                <span className="text-[10px] font-bold text-text-muted hidden sm:inline-block">
                  {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              
              <button 
                onClick={fetchDashboardSummary} 
                className={cn(
                  "p-1.5 text-text-muted hover:text-brand hover:bg-brand/5 rounded-lg transition-all",
                  loading && "animate-spin text-brand bg-brand/5"
                )}
                title="Refresh Briefing"
              >
                <RefreshCw size={14} />
              </button>
            </div>

            <div className="space-y-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={summary}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  {sentences.length > 1 ? (
                    <ul className="space-y-2.5">
                      {sentences.map((sentence, idx) => (
                        <li key={idx} className="flex gap-3 text-text-primary leading-relaxed text-sm md:text-base">
                          <div className="mt-2 w-1.5 h-1.5 rounded-full bg-brand/30 shrink-0" />
                          <p className={cn(idx === 0 ? "font-semibold text-text-primary" : "text-text-secondary")}>
                            {renderText(sentence)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm md:text-base font-medium leading-relaxed text-text-primary">
                      {renderText(summary)}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="pt-4 border-t border-border-base/50 flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-text-muted">
                <Calendar size={12} className="text-brand/60" />
                Session Active: <span className="text-text-primary font-bold">2024-25</span>
              </div>
              <p className="text-[10px] font-bold text-brand/60 uppercase tracking-widest ml-auto italic">
                Quantum Intelligence Engine v2.4
              </p>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default AIBriefingPanel;
