import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Card,
  Table,
  Button,
  Select as AntSelect,
  Input as AntInput,
  ConfigProvider,
  Tag,
  Avatar,
  Empty,
  Skeleton,
  theme as antdTheme
} from 'antd'
import {
  SearchOutlined,
  SlidersOutlined
} from '@ant-design/icons'
import usePageTitle from '@/hooks/usePageTitle'
import useTeacherStudents from '@/hooks/useTeacherStudents'
import { formatCurrency, formatDate, getInitials } from '@/utils/helpers'
import useUiStore from '@/store/uiStore'
import { ROUTES } from '@/constants/app'

const StudentList = () => {
  usePageTitle('Student List')

  const location = useLocation()
  const navigate = useNavigate()
  const { theme: storeTheme } = useUiStore()
  const { students, sections, subjects, loadingList } = useTeacherStudents()
  
  const [search, setSearch] = useState('')
  const [sectionKey, setSectionKey] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [gender, setGender] = useState('')
  const [attendanceRange, setAttendanceRange] = useState('')
  const [resultStatus, setResultStatus] = useState('')

  const isDark = storeTheme === 'dark' || (storeTheme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)

  useEffect(() => {
    const classId = location.state?.class_id
    const sectionId = location.state?.section_id
    if (!classId || !sectionId) return
    setSectionKey(`${classId}:${sectionId}`)
  }, [location.state?.class_id, location.state?.section_id])

  const filteredStudents = useMemo(() => students.filter((student) => {
    const searchText = `${student.first_name} ${student.last_name} ${student.roll_number || ''}`.toLowerCase()
    const matchesSearch = !search.trim() || searchText.includes(search.trim().toLowerCase())
    const matchesSection = !sectionKey || `${student.class_id}:${student.section_id}` === sectionKey
    
    const studentSubjectIds = (student.subject_ids || '').split(',').map(Number)
    const matchesSubject = !subjectId || studentSubjectIds.includes(Number(subjectId))

    const matchesGender = !gender || student.gender === gender
    const attendanceValue = Number(student.attendance_percentage || 0)
    const resultValue = Number(student.last_result_percentage || 0)
    const matchesAttendance = !attendanceRange || (
      attendanceRange === 'below75' ? attendanceValue < 75 :
      attendanceRange === '75to90' ? attendanceValue >= 75 && attendanceValue < 90 :
      attendanceValue >= 90
    )
    const matchesResult = !resultStatus || (
      resultStatus === 'good' ? resultValue >= 60 :
      resultStatus === 'warning' ? resultValue >= 40 && resultValue < 60 :
      resultValue < 40
    )

    return matchesSearch && matchesSection && matchesSubject && matchesGender && matchesAttendance && matchesResult
  }), [students, search, sectionKey, subjectId, gender, attendanceRange, resultStatus])

  const tableColumns = [
    {
      title: 'Student',
      dataIndex: 'student',
      key: 'student',
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <div className="relative">
            <Avatar 
              size="large"
              className="bg-teal-100 text-teal-800 font-extrabold dark:bg-teal-950/40 dark:text-teal-300 border border-teal-200/20"
            >
              {getInitials(`${record.first_name} ${record.last_name}`)}
            </Avatar>
            {record.is_online && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse shadow-sm" />
            )}
          </div>
          <div>
            <div className="text-sm font-extrabold text-gray-800 dark:text-gray-100 flex items-center gap-1.5">
              {record.first_name} {record.last_name}
              {record.is_online && (
                <Tag color="processing" className="text-[9px] font-black uppercase tracking-wider border-0 rounded px-1.5 py-0 m-0">Online</Tag>
              )}
            </div>
            <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5">
              Roll: {record.roll_number || '--'} • {record.class_name} {record.section_name}
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Gender',
      dataIndex: 'gender',
      key: 'gender',
      render: (text) => <span className="text-xs font-bold text-gray-500 dark:text-gray-400 capitalize">{text || '--'}</span>
    },
    {
      title: 'Attendance',
      dataIndex: 'attendance_percentage',
      key: 'attendance_percentage',
      render: (val) => {
        const attendance = Number(val || 0)
        const className = attendance < 75 
          ? 'text-rose-600 dark:text-rose-400 font-extrabold text-xs'
          : 'text-emerald-600 dark:text-emerald-400 font-extrabold text-xs'
        return <span className={className}>{val ? `${attendance.toFixed(0)}%` : '--'}</span>
      }
    },
    {
      title: 'Last Result',
      dataIndex: 'last_result_percentage',
      key: 'last_result_percentage',
      render: (val) => <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{val != null ? `${Number(val).toFixed(0)}%` : '--'}</span>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (_, record) => {
        const attendance = Number(record.attendance_percentage || 0)
        const isWarning = attendance < 75
        return (
          <Tag color={isWarning ? 'red' : 'green'} className="rounded-full font-black text-[10px] uppercase border-0 px-2.5 py-0.5">
            {isWarning ? 'Warning' : 'Good'}
          </Tag>
        )
      }
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <Button
          type="primary"
          size="middle"
          className="rounded-xl font-bold text-xs border-0"
          onClick={() => navigate(ROUTES.TEACHER_STUDENT_DETAIL.replace(':id', String(record.id)))}
        >
          View Profile
        </Button>
      )
    }
  ]

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#2563eb',
          borderRadius: 16,
          fontFamily: 'inherit',
        },
      }}
    >
      <div className="max-w-[1400px] mx-auto space-y-6 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Student List
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              View students from your assigned sections. Class teachers get full student context, while subject teachers stay limited to their teaching scope.
            </p>
          </div>
        </div>

        {/* Filter Card */}
        <Card 
          className="rounded-2xl shadow-sm border-gray-100 dark:border-gray-800"
          styles={{ body: { padding: '24px' } }}
        >

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Search</label>
              <AntInput
                placeholder="Search by name or roll..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                prefix={<SearchOutlined className="text-gray-400" />}
                allowClear
                className="rounded-xl font-semibold text-xs h-[38px]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Section</label>
              <AntSelect
                placeholder="All sections"
                value={sectionKey || undefined}
                onChange={(val) => setSectionKey(val || '')}
                options={sections}
                allowClear
                className="w-full rounded-xl text-xs h-[38px]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Subject</label>
              <AntSelect
                placeholder="All subjects"
                value={subjectId || undefined}
                onChange={(val) => setSubjectId(val || '')}
                options={subjects}
                allowClear
                className="w-full rounded-xl text-xs h-[38px]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Gender</label>
              <AntSelect
                placeholder="All genders"
                value={gender || undefined}
                onChange={(val) => setGender(val || '')}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]}
                allowClear
                className="w-full rounded-xl text-xs h-[38px]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Attendance</label>
              <AntSelect
                placeholder="All ranges"
                value={attendanceRange || undefined}
                onChange={(val) => setAttendanceRange(val || '')}
                options={[
                  { value: 'below75', label: 'Below 75%' },
                  { value: '75to90', label: '75% to 89%' },
                  { value: '90plus', label: '90% and above' },
                ]}
                allowClear
                className="w-full rounded-xl text-xs h-[38px]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Result Status</label>
              <AntSelect
                placeholder="All statuses"
                value={resultStatus || undefined}
                onChange={(val) => setResultStatus(val || '')}
                options={[
                  { value: 'good', label: 'Good' },
                  { value: 'warning', label: 'Warning' },
                  { value: 'critical', label: 'Critical' },
                ]}
                allowClear
                className="w-full rounded-xl text-xs h-[38px]"
              />
            </div>
          </div>
        </Card>

        {/* Results List Card */}
        <Card
          className="rounded-2xl shadow-sm border-gray-100 dark:border-gray-800 overflow-hidden"
          styles={{ header: { borderBottom: '1px solid rgba(0,0,0,0.06)' }, body: { padding: '0px' } }}
          title={
            <div className="flex items-center justify-between py-1">
              <div>
                <span className="text-base font-black text-gray-900 dark:text-white tracking-tight">My Students</span>
                <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold block mt-0.5">
                  {filteredStudents.length} student(s) match current filter criteria.
                </span>
              </div>
              <Tag icon={<SlidersOutlined />} color="default" className="font-extrabold uppercase text-[10px] rounded-full px-3 py-0.5">
                Filtered View
              </Tag>
            </div>
          }
        >
          {loadingList ? (
            <div className="p-6"><Skeleton active paragraph={{ rows: 8 }} /></div>
          ) : filteredStudents.length === 0 ? (
            <div className="py-12">
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No students match selected filter criteria" />
            </div>
          ) : (
            <Table
              dataSource={filteredStudents}
              columns={tableColumns}
              rowKey="enrollment_id"
              pagination={false}
              size="middle"
              className="premium-table"
              rowClassName="hover:bg-blue-50/10 dark:hover:bg-blue-950/10 transition-colors"
            />
          )}
        </Card>
      </div>
    </ConfigProvider>
  )
}

export default StudentList
