import React from 'react';
import { User, AlertCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/utils/helpers';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useStudentRisk } from '@/hooks/useStudentRisk';

const RiskScoreWidget = ({ limit = 5 }) => {
  const { students, isLoading } = useStudentRisk();

  if (isLoading) {
    return (
      <Card className="animate-pulse bg-surface p-6">
        <div className="h-6 w-32 bg-surface-raised rounded mb-6" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-raised" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-surface-raised rounded" />
                <div className="h-3 w-1/4 bg-surface-raised rounded" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (students.length === 0) return null;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
          <AlertCircle size={20} className="text-red-500" /> High-Risk Students
        </h3>
        <Badge variant="red" size="sm">{students.length} Total</Badge>
      </div>

      <div className="space-y-4">
        {students.slice(0, limit).map((student) => (
          <div key={student.id} className="group relative flex items-center gap-4 p-3 rounded-xl hover:bg-surface-raised transition-all border border-transparent hover:border-border-base">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shrink-0",
              student.riskScore > 70 ? "bg-red-500 shadow-lg shadow-red-500/20" : 
              student.riskScore > 40 ? "bg-amber-500 shadow-lg shadow-amber-500/20" : "bg-blue-500 shadow-lg shadow-blue-500/20"
            )}>
              {student.riskScore}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-text-primary truncate">{student.name}</h4>
              <p className="text-[11px] text-text-secondary truncate">
                {student.class_name} • Adm: {student.admission_no}
              </p>
              <p className="text-[10px] font-medium text-text-muted mt-1 italic truncate">
                {student.recommendation}
              </p>
            </div>

            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="flex gap-1">
                <RiskDot label="Att" score={student.breakdown.attendance} />
                <RiskDot label="Fee" score={student.breakdown.fees} />
                <RiskDot label="Acad" score={student.breakdown.academics} />
              </div>
              <ChevronRight size={14} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>

      {students.length > limit && (
        <button className="w-full mt-4 py-2 text-xs font-bold text-brand hover:bg-brand/5 rounded-lg transition-colors flex items-center justify-center gap-1">
          View All At-Risk Students <ChevronRight size={14} />
        </button>
      )}
    </Card>
  );
};

const RiskDot = ({ label, score }) => (
  <div className="flex flex-col items-center">
    <div className={cn(
      "w-2 h-2 rounded-full",
      score > 70 ? "bg-red-500" : score > 40 ? "bg-amber-500" : score > 20 ? "bg-blue-500" : "bg-green-500"
    )} title={`${label}: ${score}% risk`} />
    <span className="text-[8px] text-text-muted mt-0.5">{label}</span>
  </div>
);

export default RiskScoreWidget;
