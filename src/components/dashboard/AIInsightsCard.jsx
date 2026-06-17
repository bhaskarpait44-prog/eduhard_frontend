import React from 'react';
import { 
  BrainCircuit, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb,
  ArrowRight,
  Target,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/helpers';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { useAIInsights } from '@/hooks/useAIInsights';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const AIInsightsCard = ({ sessionId }) => {
  const { data, isLoading, error, refetch } = useAIInsights(sessionId);

  if (isLoading) {
    return (
      <Card className="animate-pulse bg-white border-brand/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-brand/10" />
          <div className="h-4 w-48 bg-brand/10 rounded" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="h-24 bg-brand/5 rounded-xl" />
          <div className="h-24 bg-brand/5 rounded-xl" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-full bg-brand/5 rounded" />
          <div className="h-4 w-3/4 bg-brand/5 rounded" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-100 p-8 flex flex-col items-center justify-center text-center gap-4">
        <div className="p-3 bg-red-100 rounded-full text-red-500">
          <AlertTriangle size={32} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-red-900">AI Analysis Interrupted</h3>
          <p className="text-sm text-red-700 mt-1 max-w-xs mx-auto">
            We encountered a technical hitch while processing the latest school metrics.
          </p>
        </div>
        <button 
          onClick={refetch}
          className="px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors shadow-sm"
        >
          Try Again
        </button>
      </Card>
    );
  }

  if (!data) return null;

  const { summary, trends, anomalies, recommendations } = data;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-100px" }}
      className="space-y-4"
    >
      <Card className="bg-white border-brand/10 p-0 overflow-hidden relative shadow-xl shadow-brand/5">
        {/* Subtle Gradient Glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand/5 rounded-full blur-3xl" />
        
        <div className="p-6 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-brand/10 rounded-xl text-brand">
                <BrainCircuit size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary tracking-tight">Advanced System Insights</h3>
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Statistical Analysis Engine</p>
              </div>
            </div>
            <Badge variant="blue" className="bg-brand/5 text-brand border-brand/10 font-bold px-3">
              Experimental
            </Badge>
          </div>

          <motion.div variants={item} className="bg-brand/5 rounded-2xl p-5 border border-brand/10 mb-8">
            <div className="flex gap-4">
              <Lightbulb className="text-brand shrink-0 mt-1" size={20} />
              <p className="text-sm md:text-base text-text-primary leading-relaxed font-medium italic">
                "{summary}"
              </p>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <motion.div variants={item} className="bg-surface p-5 rounded-2xl border border-border-base hover:border-brand/30 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Activity size={14} />
                  </div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Attendance Rate</span>
                </div>
                {trends.attendance.trend >= 0 ? (
                  <TrendingUp size={16} className="text-emerald-500" />
                ) : (
                  <TrendingDown size={16} className="text-red-500" />
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-text-primary tracking-tight">
                  {trends.attendance.value.toFixed(1)}%
                </span>
                <span className={cn(
                  "text-xs font-bold px-1.5 py-0.5 rounded-md",
                  trends.attendance.trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                  {trends.attendance.trend >= 0 ? '+' : ''}{trends.attendance.trend.toFixed(1)}%
                </span>
              </div>
              {trends.attendance.forecast && (
                <div className="mt-4 pt-3 border-t border-border-base flex items-center justify-between text-[10px]">
                  <span className="text-text-muted font-medium">Next Week Forecast</span>
                  <span className="font-bold text-brand">{trends.attendance.forecast}%</span>
                </div>
              )}
            </motion.div>

            <motion.div variants={item} className="bg-surface p-5 rounded-2xl border border-border-base hover:border-brand/30 transition-colors group">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Target size={14} />
                  </div>
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Fee Collection</span>
                </div>
                {trends.fees.trend >= 0 ? (
                  <TrendingUp size={16} className="text-emerald-500" />
                ) : (
                  <TrendingDown size={16} className="text-red-500" />
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-text-primary tracking-tight">
                  {trends.fees.value.toFixed(1)}%
                </span>
                <span className={cn(
                  "text-xs font-bold px-1.5 py-0.5 rounded-md",
                  trends.fees.trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                  {trends.fees.trend >= 0 ? '+' : ''}{trends.fees.trend.toFixed(1)}%
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-border-base text-[10px] text-text-muted font-medium">
                Target performance compared to previous month
              </div>
            </motion.div>
          </div>

          {anomalies.length > 0 && (
            <motion.div variants={item} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px flex-1 bg-border-base" />
                <h4 className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em] px-4">
                  Statistical Anomalies Detected
                </h4>
                <div className="h-px flex-1 bg-border-base" />
              </div>
              <div className="flex flex-wrap gap-2">
                {anomalies.map((anomaly, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-amber-50/50 border border-amber-100 px-3 py-1.5 rounded-full">
                    <AlertTriangle size={12} className="text-amber-600" />
                    <span className="text-[11px] font-bold text-amber-900">{anomaly.label}:</span>
                    <span className="text-[11px] text-amber-700">{anomaly.value.toFixed(1)}%</span>
                    <Badge variant="warning" className="text-[9px] py-0 px-1.5 bg-amber-100 border-amber-200 text-amber-800">
                      {anomaly.zScore > 0 ? '+' : ''}{anomaly.zScore.toFixed(1)}σ
                    </Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {recommendations.length > 0 ? (
            <motion.div variants={item}>
              <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2">
                <ArrowRight size={18} className="text-brand" /> Strategic Recommendations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-surface p-4 rounded-xl border border-border-base hover:border-brand/20 transition-all hover:shadow-sm">
                    <div className={cn(
                      "mt-1.5 w-2 h-2 rounded-full shrink-0",
                      rec.type === 'critical' ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" : 
                      rec.type === 'warning' ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : 
                      "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    )} />
                    <p className="text-xs text-text-secondary leading-relaxed font-medium">{rec.message}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div variants={item} className="text-center py-6 bg-surface rounded-2xl border border-dashed border-border-base">
              <p className="text-sm text-text-muted font-medium">All metrics within normal range.</p>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default AIInsightsCard;
