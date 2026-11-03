'use client';

import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Filter, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { apiClient } from '@/lib/api';
import { CalendarEvent, GeneratedContent } from '@/types';

export default function ContentCalendarPage() {
  const { showToast } = useApp();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [contents, setContents] = useState<GeneratedContent[]>([]);
  const [scheduleModal, setScheduleModal] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState('');
  const [scheduledDate, setScheduledDate] = useState('2026-11-15T10:00');
  const [platform, setPlatform] = useState('Blog');
  const [notes, setNotes] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');

  const fetchEvents = async () => {
    try {
      const data = await apiClient.getCalendarEvents(platformFilter || undefined);
      setEvents(data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchEvents();
    async function loadContents() {
      try {
        const c = await apiClient.getContentList();
        setContents(c);
        if (c.length > 0) {
          setSelectedContentId(c[0].id);
          setPlatform(c[0].platform);
        }
      } catch (e) {}
    }
    loadContents();
  }, [platformFilter]);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContentId || !scheduledDate) return;
    try {
      await apiClient.scheduleCalendar({
        content_id: selectedContentId,
        scheduled_date: new Date(scheduledDate).toISOString(),
        platform,
        notes: notes || undefined
      });
      showToast('Scheduled to content calendar', 'success');
      setScheduleModal(false);
      await fetchEvents();
    } catch (err: any) {
      showToast('Failed to schedule item', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.deleteCalendarEvent(id);
      showToast('Calendar entry removed', 'info');
      await fetchEvents();
    } catch (e) {
      showToast('Failed to delete event', 'error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Content Planning Calendar
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 4 }}>
            Organize multi-channel publishing schedules and track statuses from idea to published.
          </p>
        </div>
        <button onClick={() => setScheduleModal(true)} className="btn-primary">
          <Plus size={16} />
          <span>Schedule Content</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {['All', 'Blog', 'LinkedIn', 'Instagram', 'Twitter', 'Facebook'].map((p) => {
          const isSelected = (p === 'All' && !platformFilter) || platformFilter === p;
          return (
            <button
              key={p}
              onClick={() => setPlatformFilter(p === 'All' ? '' : p)}
              className={isSelected ? 'btn-primary' : 'btn-ghost'}
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              {p}
            </button>
          );
        })}
      </div>

      {/* Calendar Scheduled Events List */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        {events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
            <CalendarIcon size={44} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>No Content Scheduled</h4>
            <p style={{ fontSize: '0.85rem', marginTop: 4, marginBottom: 16 }}>
              Add articles or social campaigns to your publication timeline.
            </p>
            <button onClick={() => setScheduleModal(true)} className="btn-primary" style={{ fontSize: '0.85rem' }}>
              Schedule First Post
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {events.map((evt) => {
              const d = new Date(evt.scheduled_date);
              const formattedDate = d.toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
              });
              return (
                <div
                  key={evt.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 20px', borderRadius: 10, border: '1px solid #e2e8f0',
                    background: '#f8fafc'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#eef2ff', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                      <CalendarIcon size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span className="badge badge-primary">{evt.platform}</span>
                        <span className="badge badge-success">{evt.status}</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{formattedDate}</span>
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                        {evt.content_title || 'Untitled Post'}
                      </h3>
                      {evt.notes && <p style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 2 }}>Note: {evt.notes}</p>}
                    </div>
                  </div>

                  <button onClick={() => handleDelete(evt.id)} className="btn-ghost" style={{ color: '#ef4444' }} title="Remove">
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {scheduleModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 999, padding: 20
        }}>
          <div style={{ background: 'white', borderRadius: 16, width: '100%', maxWidth: 480, padding: 28 }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 16, color: '#0f172a' }}>
              Schedule Content for Publishing
            </h3>
            <form onSubmit={handleSchedule} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Select Content *</label>
                <select
                  style={{ width: '100%' }}
                  value={selectedContentId}
                  onChange={(e) => {
                    setSelectedContentId(e.target.value);
                    const sel = contents.find((c) => c.id === e.target.value);
                    if (sel) setPlatform(sel.platform);
                  }}
                  required
                >
                  {contents.map((c) => (
                    <option key={c.id} value={c.id}>[{c.platform}] {c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Date & Time *</label>
                <input
                  type="datetime-local"
                  style={{ width: '100%' }}
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: 6 }}>Notes</label>
                <textarea
                  style={{ width: '100%', minHeight: 60 }}
                  placeholder="e.g. Needs approval from Legal before social blast..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button type="button" onClick={() => setScheduleModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Confirm Schedule</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

