import { useEffect, useState, useMemo } from 'react'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import useStaffAttendanceStore from '@/store/staffAttendanceStore'
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Save,
  UserCheck,
  FileDown
} from 'lucide-react'
import { pdf } from '@react-pdf/renderer'
import { StaffAttendancePDF } from '@/pdf/StaffAttendancePDF'
import { getSettings } from '@/api/settingsApi'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import EmptyState from '@/components/ui/EmptyState'
import Input from '@/components/ui/Input'
import { formatDate } from '@/utils/helpers'

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', color: 'green', icon: CheckCircle2 },
  { value: 'absent',  label: 'Absent',  color: 'red',   icon: XCircle },
  { value: 'late',    label: 'Late',    color: 'amber', icon: Clock },
  { value: 'half_day', label: 'Half Day', color: 'blue',  icon: Clock },
  { value: 'leave',   label: 'Leave',   color: 'purple', icon: Calendar },
]

const localToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function StaffAttendancePage() {
  usePageTitle('Staff Attendance')
  const { toastSuccess, toastError } = useToast()
  const { 
    dailyAttendance, 
    fetchDailyAttendance, 
    markBulk, 
    registerData, 
    fetchMonthlyRegister, 
    isLoading 
  } = useStaffAttendanceStore()

  const [activeTab, setActiveTab] = useState('daily') // 'daily' | 'register'
  const [selectedDate, setSelectedDate] = useState(localToday())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [searchQuery, setSearchQuery] = useState('')
  const [localRecords, setLocalRecords] = useState([])

  // Load data based on tab
  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyAttendance(selectedDate)
    } else {
      fetchMonthlyRegister(selectedMonth, selectedYear)
    }
  }, [activeTab, selectedDate, selectedMonth, selectedYear, fetchDailyAttendance, fetchMonthlyRegister])

  // Sync local records when daily attendance is fetched
  useEffect(() => {
    if (dailyAttendance) {
      setLocalRecords(dailyAttendance.map(s => ({
        staff_id: s.staff_id,
        type: s.type,
        status: s.status || 'present',
        remarks: s.remarks || ''
      })))
    }
  }, [dailyAttendance]) // eslint-disable-line react-hooks/exhaustive-deps

  const filteredStaff = useMemo(() => {
    const data = activeTab === 'daily' ? dailyAttendance : registerData
    if (!searchQuery.trim()) return data
    return data.filter(s => 
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employee_id?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [dailyAttendance, registerData, searchQuery, activeTab])

  const handleStatusChange = (staffId, type, status) => {
    setLocalRecords(prev => prev.map(r => 
      (r.staff_id === staffId && r.type === type) ? { ...r, status } : r
    ))
  }

  const handleRemarksChange = (staffId, type, remarks) => {
    setLocalRecords(prev => prev.map(r => 
      (r.staff_id === staffId && r.type === type) ? { ...r, remarks } : r
    ))
  }

  const handleSave = async () => {
    try {
      await markBulk(selectedDate, localRecords)
      toastSuccess('Staff attendance saved successfully.')
      fetchDailyAttendance(selectedDate)
    } catch (err) {
      toastError(err.message || 'Failed to save attendance.')
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const settingsRes = await getSettings()
      const schoolData = {
        name: settingsRes.data?.school_name,
        email: settingsRes.data?.school_email,
        phone: settingsRes.data?.school_phone,
        address: settingsRes.data?.school_address,
        logo_url: settingsRes.data?.logo_url,
      }

      let pdfDoc;
      let filename;

      if (activeTab === 'daily') {
        const recordsToExport = dailyAttendance.map((s) => {
          const localRec = localRecords.find(r => r.staff_id === s.staff_id && r.type === s.type) || { status: 'present', remarks: '' };
          return {
            ...s,
            status: localRec.status,
            remarks: localRec.remarks
          };
        });
        
        pdfDoc = (
          <StaffAttendancePDF
            mode="daily"
            data={recordsToExport}
            school={schoolData}
            dateStr={formatDate(selectedDate, 'long')}
          />
        );
        filename = `Staff_Attendance_${selectedDate}.pdf`;
      } else {
        const monthName = new Date(selectedYear, selectedMonth - 1).toLocaleString('default', { month: 'long' });
        const registerToExport = filteredStaff.map((s) => {
          const stats = s.records.reduce((acc, r) => {
            acc[r.status] = (acc[r.status] || 0) + 1;
            return acc;
          }, {});
          return {
            ...s,
            present: stats.present || 0,
            absent: stats.absent || 0,
            late: stats.late || 0,
            half_day: stats.half_day || 0,
            leave: stats.leave || 0,
          };
        });

        pdfDoc = (
          <StaffAttendancePDF
            mode="register"
            data={registerToExport}
            school={schoolData}
            monthName={monthName}
            year={selectedYear}
          />
        );
        filename = `Staff_Register_${monthName}_${selectedYear}.pdf`;
      }

      const blob = await pdf(pdfDoc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toastSuccess('PDF downloaded successfully.')
    } catch (err) {
      toastError('Failed to download PDF.')
    }
  }

  const handlePrevDate = () => {
    const parts = selectedDate.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2] - 1)
    const prev = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    setSelectedDate(prev)
  }

  const handleNextDate = () => {
    const parts = selectedDate.split('-').map(Number)
    const d = new Date(parts[0], parts[1] - 1, parts[2] + 1)
    const next = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (next <= localToday()) setSelectedDate(next)
  }

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex p-1 bg-gray-50 dark:bg-gray-800 rounded-2xl w-fit">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'daily' 
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Daily Marking
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'register' 
                ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Attendance Register
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 w-full sm:w-64"
            />
          </div>
          <Button
            variant="secondary"
            icon={FileDown}
            onClick={handleDownloadPdf}
            className="rounded-2xl"
          >
            Download PDF
          </Button>
          {activeTab === 'daily' && (
            <Button 
              icon={Save} 
              onClick={handleSave} 
              loading={isLoading}
              className="rounded-2xl"
            >
              Save
            </Button>
          )}
        </div>
      </div>

      {/* Daily Marking View */}
      {activeTab === 'daily' && (
        <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {/* Date Picker Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
                <UserCheck className="text-indigo-600 dark:text-indigo-400" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Staff Attendance</h2>
                <p className="text-sm text-gray-500">{formatDate(selectedDate, 'long')}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-2xl">
              <button onClick={handlePrevDate} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all shadow-none hover:shadow-sm">
                <ChevronLeft size={18} />
              </button>
              <Input
                type="date"
                value={selectedDate}
                max={localToday()}
                onChange={e => setSelectedDate(e.target.value)}
                className="!text-sm !font-bold !bg-transparent"
                containerClassName="!w-[130px] !gap-0"
                style={{
                  height: '32px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  boxShadow: 'none',
                }}
              />
              <button onClick={handleNextDate} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-all shadow-none hover:shadow-sm">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* Staff List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">Staff Member</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan="3" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-sm font-medium text-gray-400">Loading staff attendance...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredStaff.length > 0 ? (
                  filteredStaff.map((s) => {
                    const localRec = localRecords.find(r => r.staff_id === s.staff_id && r.type === s.type) || { status: 'present', remarks: '' }
                    return (
                      <tr key={`${s.type}-${s.staff_id}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                              {s.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-gray-900 dark:text-white">{s.name}</p>
                              <p className="text-xs text-gray-500">{s.employee_id} • {s.designation}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl w-fit">
                            {STATUS_OPTIONS.map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => handleStatusChange(s.staff_id, s.type, opt.value)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                  localRec.status === opt.value
                                    ? `bg-white dark:bg-gray-700 shadow-sm text-${opt.color}-600 dark:text-${opt.color}-400`
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                              >
                                <opt.icon size={14} strokeWidth={2.5} />
                                <span className={localRec.status === opt.value ? 'block' : 'hidden md:block'}>
                                  {opt.label}
                                </span>
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="Add note..."
                            value={localRec.remarks}
                            onChange={e => handleRemarksChange(s.staff_id, s.type, e.target.value)}
                            className="w-full bg-transparent border-none text-sm focus:ring-0 text-gray-600 dark:text-gray-400 placeholder:text-gray-300"
                          />
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="3" className="py-12">
                      <EmptyState 
                        title="No staff members found" 
                        description="Try adjusting your search query." 
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Monthly Register View */}
      {activeTab === 'register' && (
        <div className="bg-white dark:bg-gray-900 rounded-[28px] border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          {/* Month/Year Picker Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-50 dark:border-gray-800">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl">
                <FileSpreadsheet className="text-indigo-600 dark:text-indigo-400" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Attendance Register</h2>
                <p className="text-sm text-gray-500">Monthly overview of staff attendance</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500/20"
              >
                {Array.from(
                  { length: new Date().getFullYear() - 2023 + 1 },
                  (_, i) => 2024 + i
                ).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Matrix View */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead className="bg-gray-50/50 dark:bg-gray-800/50 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-black uppercase tracking-widest text-gray-400 sticky left-0 bg-white dark:bg-gray-900 z-10">Staff</th>
                  {Array.from({ length: new Date(selectedYear, selectedMonth, 0).getDate() }, (_, i) => (
                    <th key={i + 1} className="px-2 py-4 text-center text-[10px] font-black text-gray-400 w-8">
                      {i + 1}
                    </th>
                  ))}
                  <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-widest text-gray-400">Stats</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {isLoading ? (
                  <tr>
                    <td colSpan="35" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                        <p className="text-sm font-medium text-gray-400">Loading register data...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredStaff.length > 0 ? (
                  filteredStaff.map((s) => {
                    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate()
                    const stats = s.records.reduce((acc, r) => {
                      acc[r.status] = (acc[r.status] || 0) + 1
                      return acc
                    }, {})
                  
                    return (
                      <tr key={`${s.type}-${s.staff_id}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <td className="px-6 py-3 sticky left-0 bg-white dark:bg-gray-900 z-10">
                          <div>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{s.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{s.employee_id}</p>
                          </div>
                        </td>
                        {Array.from({ length: daysInMonth }, (_, i) => {
                          const day = i + 1
                          const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                          const record = s.records.find(r => r.date === dateStr)
                          
                          let color = 'text-gray-200 dark:text-gray-700'
                          let char = '·'
                          
                          if (record?.status === 'present') { color = 'text-emerald-500'; char = 'P' }
                          if (record?.status === 'absent') { color = 'text-red-500'; char = 'A' }
                          if (record?.status === 'late') { color = 'text-amber-500'; char = 'L' }
                          if (record?.status === 'half_day') { color = 'text-blue-500'; char = '½' }
                          if (record?.status === 'leave') { color = 'text-purple-500'; char = 'V' }

                          return (
                            <td key={day} className={`px-2 py-3 text-center text-[11px] font-black ${color}`}>
                              {char}
                            </td>
                          )
                        })}
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <Badge variant="green" size="sm" title="Present">{stats.present || 0}P</Badge>
                            <Badge variant="red" size="sm" title="Absent">{stats.absent || 0}A</Badge>
                            <Badge variant="amber" size="sm" title="Late">{stats.late || 0}L</Badge>
                            <Badge variant="blue" size="sm" title="Half Day">{stats.half_day || 0}½</Badge>
                            <Badge variant="purple" size="sm" title="Leave">{stats.leave || 0}V</Badge>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                ) : (
                  <tr>
                    <td colSpan="35" className="py-24 text-center">
                      <EmptyState 
                        title="No records found" 
                        description="Try adjusting your search query or month/year selection." 
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
