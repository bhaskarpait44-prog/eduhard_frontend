import { useEffect } from 'react'
import {
  ShieldCheck, User, Phone, BookOpen, Award,
  MessageSquare, Heart, MapPin, GraduationCap, Users, KeyRound, Pencil, Mail,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import EmptyState from '@/components/ui/EmptyState'
import AchievementBadge from '@/components/student/AchievementBadge'
import usePageTitle from '@/hooks/usePageTitle'
import useStudentProfile from '@/hooks/useStudentProfile'
import useToast from '@/hooks/useToast'
import { ROUTES } from '@/constants/app'
import { formatDate } from '@/utils/helpers'

const MyProfile = () => {
  usePageTitle('My Profile')
  const navigate = useNavigate()
  const { toastError } = useToast()
  const { profile, sharedRemarks, achievements, loading, error } = useStudentProfile()

  useEffect(() => { if (error) toastError(error) }, [error, toastError])

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="h-40 animate-pulse rounded-[28px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-5">
            <div className="h-64 animate-pulse rounded-[28px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
            <div className="h-64 animate-pulse rounded-[28px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          </div>
          <div className="space-y-5">
            <div className="h-96 animate-pulse rounded-[28px]" style={{ backgroundColor: 'var(--color-surface-raised)' }} />
          </div>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <EmptyState icon={ShieldCheck} title="Profile unavailable" description="Your profile details could not be loaded right now." />
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-20">
      {/* ── Compact Profile Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', flexWrap: 'wrap' }}>
        {/* Left: Avatar + Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <div style={{
            display: 'flex', height: '52px', width: '52px', alignItems: 'center', justifyContent: 'center',
            borderRadius: '16px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            fontSize: '18px', fontWeight: 800, color: '#fff', flexShrink: 0, letterSpacing: '-0.02em',
          }}>
            {profile?.full_name?.split(' ').map((p) => p[0]).slice(0, 2).join('') || 'S'}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1 }}>My Profile</p>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '2px 0 0 0', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profile.full_name}
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--color-text-secondary)', margin: '3px 0 0', lineHeight: 1.4 }}>
              Adm: {profile.admission_no} &nbsp;·&nbsp; {profile.class_name} {profile.section_name} &nbsp;·&nbsp; Roll {profile.roll_number || '--'}
            </p>
          </div>
        </div>
        {/* Right: Badges + Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', flexShrink: 0 }}>
          <Badge variant="blue">{profile.session_name}</Badge>
          {profile.blood_group && <Badge variant="red">{profile.blood_group}</Badge>}
          {profile.is_active === false ? (
            <Badge variant="red">Suspended</Badge>
          ) : (
            <Badge variant={profile.status === 'active' ? 'green' : 'amber'}>
              {String(profile.status || 'Active').charAt(0).toUpperCase() + String(profile.status || 'Active').slice(1)}
            </Badge>
          )}
          <Button variant="secondary" icon={Pencil} size="sm" onClick={() => navigate(ROUTES.STUDENT_PROFILE_CORRECTION)}>Correct</Button>
          <Button variant="primary" icon={KeyRound} size="sm" onClick={() => navigate(ROUTES.STUDENT_PROFILE_PASSWORD)}>Password</Button>
        </div>
      </div>

      {/* Quick info strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
        <MiniInfo icon={Phone} label="Phone" value={profile.phone || '--'} />
        <MiniInfo icon={Mail} label="Email" value={profile.email || '--'} />
        <MiniInfo icon={MapPin} label="City" value={profile.city || '--'} />
        <MiniInfo icon={GraduationCap} label="Teacher" value={profile.class_teacher_name || '--'} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        {/* ── Left Column ── */}
        <div className="space-y-5">
          <Panel title="Identity Details" icon={User}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow label="Date of Birth" value={formatDate(profile.date_of_birth, 'long')} />
              <DetailRow label="Gender" value={profile.gender} />
              <DetailRow label="Blood Group" value={profile.blood_group} />
              <DetailRow label="Joining Date" value={formatDate(profile.joined_date, 'long')} />
              <DetailRow label="Joining Type" value={profile.joining_type} className="sm:col-span-2" />
              <DetailRow label="Medical Notes" value={profile.medical_notes} className="sm:col-span-2" />
            </div>
          </Panel>

          <Panel title="Parent & Family Info" icon={Users}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Father's Details</p>
                <DetailRow label="Name" value={profile.father_name} />
                <DetailRow label="Phone" value={profile.father_phone} />
                <DetailRow label="Occupation" value={profile.father_occupation} />
              </div>
              <div className="space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Mother's Details</p>
                <DetailRow label="Name" value={profile.mother_name} />
                <DetailRow label="Phone" value={profile.mother_phone} />
                <DetailRow label="Email" value={profile.mother_email} />
              </div>
              <div className="sm:col-span-2 border-t pt-4" style={{ borderColor: 'var(--color-border)' }}>
                <DetailRow label="Emergency Contact" value={profile.emergency_contact} />
              </div>
            </div>
          </Panel>

          <Panel title="Contact & Address" icon={Phone}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailRow label="Personal Phone" value={profile.phone} />
              <DetailRow label="Personal Email" value={profile.email} />
              <DetailRow label="City" value={profile.city} />
              <DetailRow label="State" value={profile.state} />
              <DetailRow label="Pincode" value={profile.pincode} />
              <DetailRow label="Full Address" value={profile.address} className="sm:col-span-2" />
            </div>
          </Panel>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-5">

          <Panel title="Achievements" icon={Award}>
            {achievements.length ? (
              <div className="grid grid-cols-1 gap-3">
                {achievements.map((a) => (
                  <AchievementBadge key={a.id} achievement={a} />
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-sm text-[var(--color-text-muted)] italic">
                No achievement badges earned yet.
              </p>
            )}
          </Panel>

          <Panel title="Shared Remarks" icon={MessageSquare}>
            {sharedRemarks.length ? (
              <div className="space-y-3">
                {sharedRemarks.map((remark) => (
                  <div
                    key={remark.id}
                    className="rounded-2xl border p-4"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="blue" className="text-[10px] uppercase">
                        {String(remark.remark_type || 'general').replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        {formatDate(remark.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
                      "{remark.remark_text}"
                    </p>
                    <p className="mt-2 text-[11px] font-bold text-right" style={{ color: 'var(--color-text-secondary)' }}>
                      — {remark.teacher_name || 'Teacher'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-4 text-sm text-[var(--color-text-muted)] italic">
                No remarks shared by teachers yet.
              </p>
            )}
          </Panel>

          <div className="rounded-[28px] border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
            <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
              To request changes to your details, contact your class teacher or use the <strong>correction request</strong> feature.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

const Panel = ({ title, icon: Icon, children }) => (
  <section className="rounded-[28px] border p-5 sm:p-6" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
    <div className="mb-5 flex items-center gap-2">
      <Icon size={18} style={{ color: 'var(--color-text-secondary)' }} />
      <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h2>
    </div>
    {children}
  </section>
)

const MiniInfo = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl px-4 py-3" style={{ backgroundColor: 'var(--color-surface-raised)' }}>
    <div className="flex items-center gap-2">
      <Icon size={14} className="text-indigo-600" />
      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
    </div>
    <p className="mt-1 text-sm font-bold truncate text-[var(--color-text-primary)]">{value || '--'}</p>
  </div>
)

const DetailRow = ({ label, value, className = '' }) => (
  <div className={`space-y-1 ${className}`}>
    <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--color-text-muted)]">{label}</p>
    <p className="text-sm font-medium text-[var(--color-text-primary)]">{value || 'Not provided'}</p>
  </div>
)

export default MyProfile