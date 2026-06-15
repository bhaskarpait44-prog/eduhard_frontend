import { useEffect, useState, useCallback } from 'react'
import {
  Calendar,
  MapPin,
  Clock,
  Plus,
  MoreVertical,
  CalendarHeart,
  Search,
  Filter,
  Edit,
  Trash2,
  ChevronRight,
} from 'lucide-react'

import { alumniApi } from '@/api'
import { ROLES } from '@/constants/app'
import useAuth from '@/hooks/useAuth'
import usePageTitle from '@/hooks/usePageTitle'
import useToast from '@/hooks/useToast'
import { cn } from '@/utils/helpers'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import AlumniEventFormModal from '@/components/alumni/AlumniEventFormModal'

const AlumniEventsPage = () => {
  usePageTitle('Alumni Events')
  const { user } = useAuth()
  const { toastError, toastSuccess } = useToast()
  const isAdmin = user?.role === ROLES.ADMIN

  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFormModal, setShowFormModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [filter, setFilter] = useState({ status: '', type: '' })

  const fetchEvents = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await alumniApi.listAlumniEvents(filter)
      setEvents(res.data)
    } catch (err) {
      toastError('Failed to fetch events')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [filter, toastError])

  useEffect(() => {
    fetchEvents()
  }, [fetchEvents])

  const handleAddEvent = () => {
    setSelectedEvent(null)
    setShowFormModal(true)
  }

  const handleEditEvent = (event) => {
    setSelectedEvent(event)
    setShowFormModal(true)
  }

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return
    try {
      await alumniApi.deleteAlumniEvent(id)
      toastSuccess('Event deleted successfully')
      fetchEvents()
    } catch (err) {
      toastError('Failed to delete event')
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Alumni Events</h1>
          <p className="text-sm text-text-secondary">Organize and track alumni reunions and activities.</p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={handleAddEvent}
            size="sm"
          >
            Create Event
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-surface border border-border-base rounded-2xl p-4 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-raised rounded-xl border border-border-base">
          <Filter size={16} className="text-text-muted" />
          <span className="text-xs font-bold text-text-secondary">Filters:</span>
        </div>

        <select
          value={filter.status}
          onChange={(e) => setFilter({ ...filter, status: e.target.value })}
          className="px-4 py-2 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20"
        >
          <option value="">All Statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={filter.type}
          onChange={(e) => setFilter({ ...filter, type: e.target.value })}
          className="px-4 py-2 bg-surface-raised border border-border-base rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand/20"
        >
          <option value="">All Types</option>
          <option value="reunion">Reunion</option>
          <option value="seminar">Seminar</option>
          <option value="felicitation">Felicitation</option>
          <option value="networking">Networking</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Events Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-surface border border-border-base rounded-2xl p-5 animate-pulse h-[250px]" />
          ))}
        </div>
      ) : events.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onEdit={() => handleEditEvent(event)}
              onDelete={() => handleDeleteEvent(event.id)}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-surface border border-dashed border-border-base rounded-2xl">
          <CalendarHeart size={48} className="mx-auto text-text-muted mb-4 opacity-20" />
          <h3 className="text-lg font-bold text-text-primary">No events found</h3>
          <p className="text-text-secondary text-sm">Create your first alumni event to get started.</p>
        </div>
      )}

      {showFormModal && (
        <AlumniEventFormModal
          event={selectedEvent}
          onClose={() => setShowFormModal(false)}
          onSuccess={() => {
            setShowFormModal(false)
            fetchEvents()
          }}
        />
      )}
    </div>
  )
}

const EventCard = ({ event, onEdit, onDelete, isAdmin }) => {
  const statusColors = {
    upcoming: 'green',
    completed: 'grey',
    cancelled: 'red'
  }

  const typeIcons = {
    reunion: '🎉',
    seminar: '📚',
    felicitation: '🏆',
    networking: '🤝',
    other: '📍'
  }

  return (
    <div className="bg-surface border border-border-base rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full group">
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-12 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-2xl">
          {typeIcons[event.type] || '📍'}
        </div>
        <div className="flex gap-2">
          <Badge variant={statusColors[event.status] || 'grey'} size="sm" className="capitalize">
            {event.status}
          </Badge>
          {isAdmin && (
            <div className="flex gap-1">
              <button
                onClick={onEdit}
                className="p-1.5 rounded-lg hover:bg-brand/10 text-text-muted hover:text-brand transition-colors"
                title="Edit Event"
              >
                <Edit size={14} />
              </button>
              <button
                onClick={onDelete}
                className="p-1.5 rounded-lg hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors"
                title="Delete Event"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-lg font-bold text-text-primary mb-2 leading-tight group-hover:text-brand transition-colors">
          {event.title}
        </h3>
        <p className="text-xs text-text-secondary line-clamp-3 mb-4 leading-relaxed">
          {event.description || 'No description provided.'}
        </p>
      </div>

      <div className="space-y-3 pt-4 border-t border-border-base mt-auto">
        <div className="flex items-center gap-2 text-xs text-text-primary font-bold">
          <Calendar size={14} className="text-brand" />
          {new Date(event.event_date).toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>
        {event.event_time && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Clock size={14} className="text-text-muted" />
            {event.event_time}
          </div>
        )}
        {event.venue && (
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <MapPin size={14} className="text-text-muted shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        )}
      </div>

      {/* Decoration */}
      <div className="absolute bottom-0 right-0 w-16 h-1 bg-brand/40 group-hover:w-full transition-all duration-500" />
    </div>
  )
}

export default AlumniEventsPage
