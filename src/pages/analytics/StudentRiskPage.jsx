import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, User, ChevronRight, Filter, Download } from 'lucide-react';
import { useStudentRisk } from '@/hooks/useStudentRisk';
import useSessionStore from '@/store/sessionStore';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { cn } from '@/utils/helpers';
import { ROUTES } from '@/constants/app';

const StudentRiskPage = () => {
  const navigate = useNavigate();
  const { currentSession } = useSessionStore();
  const [page, setPage] = React.useState(1);
  const { students, pagination, isLoading } = useStudentRisk(page, 20, currentSession?.id);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand border-t-transparent" />
        <p className="text-sm font-medium text-text-secondary">Analyzing student risk factors...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => navigate(-1)} />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Student Risk Analysis</h1>
            <p className="text-sm text-text-secondary mt-0.5">AI-driven identification of students requiring attention</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="High Risk (>70)" 
          value={students.filter(s => s.riskScore > 70).length} 
          color="red" 
          icon={AlertCircle}
        />
        <StatCard 
          label="Medium Risk (40-70)" 
          value={students.filter(s => s.riskScore > 40 && s.riskScore <= 70).length} 
          color="amber" 
          icon={AlertCircle}
        />
        <StatCard 
          label="Low Risk (20-40)" 
          value={students.filter(s => s.riskScore <= 40).length} 
          color="blue" 
          icon={AlertCircle}
        />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-extrabold text-text-muted uppercase tracking-wider border-b border-border-base">
                <th className="px-6 py-4">Student Info</th>
                <th className="px-6 py-4">Risk Score</th>
                <th className="px-6 py-4">Risk Breakdown</th>
                <th className="px-6 py-4">AI Recommendation</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-base">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-surface-raised transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-soft flex items-center justify-center text-brand font-bold text-sm">
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-bold text-text-primary">{student.name}</p>
                        <p className="text-xs text-text-secondary">{student.class_name} • {student.admission_no}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white",
                        student.riskScore > 70 ? "bg-red-500" : student.riskScore > 40 ? "bg-amber-500" : "bg-blue-500"
                      )}>
                        {student.riskScore}
                      </div>
                      <Badge variant={student.riskScore > 70 ? 'red' : student.riskScore > 40 ? 'amber' : 'blue'}>
                        {student.riskScore > 70 ? 'Critical' : student.riskScore > 40 ? 'Warning' : 'Elevated'}
                      </Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-4">
                      <RiskIndicator label="Attendance" score={student.breakdown.attendance} />
                      <RiskIndicator label="Fees" score={student.breakdown.fees} />
                      <RiskIndicator label="Academics" score={student.breakdown.academics} />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs font-medium text-text-primary max-w-xs italic">
                      "{student.recommendation}"
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={ChevronRight} 
                      onClick={() => navigate(ROUTES.STUDENT_DETAIL.replace(':id', student.id))}
                    >
                      View Profile
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border-base flex items-center justify-between">
            <p className="text-xs text-text-muted">
              Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} students
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={page === pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

const StatCard = ({ label, value, color, icon: Icon }) => {
  const colors = {
    red: "bg-red-50 text-red-600 border-red-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100"
  };

  return (
    <Card className={cn("p-5 border flex items-center gap-4", colors[color])}>
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0", colors[color].replace('bg-', 'bg-opacity-20 bg-'))}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-widest opacity-70">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
      </div>
    </Card>
  );
};

const RiskIndicator = ({ label, score }) => (
  <div className="flex flex-col gap-1">
    <span className="text-[9px] font-extrabold text-text-muted uppercase tracking-tighter">{label}</span>
    <div className="flex items-center gap-1.5">
      <div className="w-16 h-1.5 bg-surface-raised rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full rounded-full",
            score > 70 ? "bg-red-500" : score > 40 ? "bg-amber-500" : score > 20 ? "bg-blue-500" : "bg-green-500"
          )} 
          style={{ width: `${score}%` }} 
        />
      </div>
      <span className="text-[10px] font-bold text-text-secondary">{score}%</span>
    </div>
  </div>
);

export default StudentRiskPage;
