import React from 'react';
import { 
  BrainCircuit, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Lightbulb,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/utils/helpers';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import { useAIInsights } from '@/hooks/useAIInsights';

const AIInsightsCard = () => {
  const { data, isLoading } = useAIInsights();

  if (isLoading) {
    return (
      <Card className="animate-pulse bg-surface p-6">
        <div className="h-6 w-48 bg-surface-raised rounded mb-4" />
        <div className="space-y-3">
          <div className="h-4 w-full bg-surface-raised rounded" />
          <div className="h-4 w-full bg-surface-raised rounded" />
          <div className="h-4 w-2/3 bg-surface-raised rounded" />
        </div>
      </Card>
    );
  }

  if (!data) return null;

  const { summary, trends, anomalies, recommendations } = data;

  return (
    <div className="space-y-4">
      <Card className="bg-brand/5 border-brand/20 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <BrainCircuit size={80} className="text-brand" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Badge variant="blue" className="bg-brand text-white border-none">
              <BrainCircuit size={12} className="mr-1" /> AI Insights
            </Badge>
          </div>

          <h3 className="text-lg font-bold text-text-primary mb-2">System Analysis Summary</h3>
          <p className="text-text-secondary leading-relaxed mb-6 italic">
            "{summary}"
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-surface p-4 rounded-xl border border-border-base">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-muted uppercase">Attendance Trend</span>
                {trends.attendance.trend >= 0 ? (
                  <TrendingUp size={16} className="text-green-500" />
                ) : (
                  <TrendingDown size={16} className="text-red-500" />
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-text-primary">
                  {trends.attendance.value.toFixed(1)}%
                </span>
                <span className={cn(
                  "text-xs font-bold",
                  trends.attendance.trend >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {trends.attendance.trend >= 0 ? '+' : ''}{trends.attendance.trend.toFixed(1)}%
                </span>
              </div>
            </div>

            <div className="bg-surface p-4 rounded-xl border border-border-base">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-text-muted uppercase">Fee Collection</span>
                <TrendingUp size={16} className="text-brand" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-text-primary">
                  {trends.fees.value.toFixed(0)}%
                </span>
                <span className="text-xs text-text-muted">Target: 100%</span>
              </div>
            </div>
          </div>

          {anomalies.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" /> Statistical Anomalies
              </h4>
              <div className="flex flex-wrap gap-2">
                {anomalies.map((anomaly, idx) => (
                  <Badge key={idx} variant="warning" className="bg-amber-50 text-amber-700 border-amber-200">
                    {anomaly.label}: {anomaly.value.toFixed(1)}% ({anomaly.zScore > 0 ? '+' : ''}{anomaly.zScore.toFixed(1)}σ)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2">
              <Lightbulb size={16} className="text-brand" /> Recommendations
            </h4>
            <div className="space-y-2">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 bg-surface/50 p-3 rounded-lg border border-border-base/50">
                  <div className={cn(
                    "mt-1 w-1.5 h-1.5 rounded-full shrink-0",
                    rec.type === 'critical' ? "bg-red-500" : rec.type === 'warning' ? "bg-amber-500" : "bg-blue-500"
                  )} />
                  <p className="text-xs text-text-secondary">{rec.message}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIInsightsCard;
