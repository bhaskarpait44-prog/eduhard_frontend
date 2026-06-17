import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, AlertCircle, ChevronRight, Activity, Calendar, Wallet, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/helpers';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import { useStudentRisk } from '@/hooks/useStudentRisk';
import { ROUTES } from '@/constants/app';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const item = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 }
};

const RiskScoreWidget = ({ limit = 5, sessionId }) => {
  const navigate = useNavigate();
  const { students, pagination, isLoading } = useStudentRisk(1, 50, sessionId);

  if (isLoading) {
    return (
      <Card className="animate-pulse bg-white border-brand/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="h-5 w-32 bg-brand/5 rounded" />
          <div className="h-5 w-16 bg-brand/5 rounded" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand/5" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 bg-brand/5 rounded" />
                <div className="h-3 w-1/3 bg-brand/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (students.length === 0) return null;

  return (
    <Card className="p-0 overflow-hidden border-brand/10 shadow-xl shadow-brand/5">
      <div className="p-5 border-b border-border-base flex items-center justify-between bg-surface-raised/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-red-50 text-red-500 rounded-lg">
            <AlertCircle size={18} />
          </div>
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            High-Risk Students
          </h3>
        </div>
        <Badge variant="red" className="bg-red-500 text-white border-none font-bold px-2 py-0.5">
          {pagination?.total || students.length}
        </Badge>
      </div>

      <motion.div 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="divide-y divide-border-base"
      >
        {students.slice(0, limit).map((student) => (
          <motion.div 
            key={student.id} 
            variants={item}
            className="group relative flex items-center gap-4 p-4 hover:bg-brand/[0.02] transition-colors cursor-pointer"
            onClick={() => navigate(ROUTES.STUDENT_DETAIL.replace(':id', student.id))}
          >
            <div className="relative shrink-0">
              <svg className="w-14 h-14 -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-border-base"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={150.7}
                  strokeDashoffset={150.7 - (150.7 * student.riskScore) / 100}
                  className={cn(
                    "transition-all duration-1000",
                    student.riskScore > 70 ? "text-red-500" : 
                    student.riskScore > 40 ? "text-amber-500" : "text-brand"
                  )}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-text-primary">{student.riskScore}%</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-text-primary truncate text-sm">{student.name}</h4>
              <p className="text-[11px] text-text-muted font-medium truncate mb-1">
                {student.class_name} • #{student.admission_no}
              </p>
              <div className="flex items-center gap-1.5 text-[10px] text-red-600/80 font-bold italic truncate">
                <Activity size={10} />
                {student.recommendation}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex gap-1.5">
                <RiskIndicator icon={Calendar} score={student.breakdown.attendance} color="blue" />
                <RiskIndicator icon={Wallet} score={student.breakdown.fees} color="amber" />
                <RiskIndicator icon={GraduationCap} score={student.breakdown.academics} color="purple" />
              </div>
              <ChevronRight size={14} className="text-text-muted group-hover:translate-x-1 transition-all" />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {students.length > limit && (
        <div className="p-3 bg-surface-raised/30 border-t border-border-base">
          <button 
            className="w-full py-2 text-[10px] font-bold text-brand hover:bg-brand/5 rounded-lg transition-colors flex items-center justify-center gap-1 uppercase tracking-widest"
            onClick={() => navigate(ROUTES.AI_RISK_ANALYSIS)}
          >
            Review All Analytics <ChevronRight size={14} />
          </button>
        </div>
      )}
    </Card>
  );
};

const RiskIndicator = ({ icon: Icon, score, color }) => {
  const colorMap = {
    blue: "text-blue-500 bg-blue-50",
    amber: "text-amber-500 bg-amber-50",
    purple: "text-purple-500 bg-purple-50",
  };
  
  return (
    <div className={cn(
      "p-1.5 rounded-lg border border-transparent transition-colors",
      score > 60 ? "bg-red-50 text-red-500 border-red-100" : colorMap[color]
    )} title={`Risk factor: ${score}%`}>
      <Icon size={12} strokeWidth={2.5} />
    </div>
  );
};

export default RiskScoreWidget;
