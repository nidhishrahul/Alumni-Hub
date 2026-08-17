import { useEffect, useState } from 'react';
import { Calendar, CheckCircle2, Clock, MapPin, Star, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const allEvents = [
    { id: 1, title: 'AI & Machine Learning Workshop', description: 'Hands-on workshop on building ML models with Python and TensorFlow.', date: 'Aug 8, 2026', time: '10:00 AM - 4:00 PM', location: 'Seminar Hall A', type: 'Workshop', organizer: 'Dr. Priya Sharma', attendees: 45, maxAttendees: 60, predictedAttendance: 92 },
    { id: 2, title: 'Alumni Networking Meetup 2026', description: 'Annual networking event for alumni and current students.', date: 'Aug 12, 2026', time: '6:00 PM - 9:00 PM', location: 'Grand Auditorium', type: 'Networking', organizer: 'Alumni Association', attendees: 120, maxAttendees: 200, predictedAttendance: 85 },
    { id: 3, title: 'Industry Talk: Cloud Architecture', description: 'Learn about modern cloud architecture patterns from industry experts.', date: 'Aug 14, 2026', time: '2:00 PM - 4:00 PM', location: 'Virtual (Zoom)', type: 'Webinar', organizer: 'Rahul Verma', attendees: 78, maxAttendees: 150, predictedAttendance: 70 },
    { id: 4, title: 'Hackathon: Smart India 2026 Prep', description: 'Practice hackathon to prepare teams for Smart India Hackathon.', date: 'Aug 15, 2026', time: '9:00 AM - 9:00 PM', location: 'CS Lab Complex', type: 'Hackathon', organizer: 'CSE Department', attendees: 90, maxAttendees: 100, predictedAttendance: 95 },
    { id: 5, title: 'Career Guidance Seminar', description: 'Alumni-led session on career planning and industry trends.', date: 'Aug 10, 2026', time: '11:00 AM - 1:00 PM', location: 'Main Hall', type: 'Seminar', organizer: 'Placement Cell', attendees: 200, maxAttendees: 300, predictedAttendance: 78 },
];

const typeColors = {
    Workshop: 'badge-primary', Networking: 'badge-accent', Webinar: 'badge-warning',
    Hackathon: 'badge-danger', Seminar: 'badge-success',
};

export default function Events() {
    const { user } = useAuth();
    const [filter, setFilter] = useState('all');
    const [registeredIds, setRegisteredIds] = useState(new Set());
    const [message, setMessage] = useState('');
    const storageKey = `event-registrations-${user?.id || 'guest'}`;
    const types = ['all', ...new Set(allEvents.map((event) => event.type))];
    const filtered = allEvents.filter((event) => filter === 'all' || event.type === filter);

    useEffect(() => {
        try {
            setRegisteredIds(new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')));
        } catch {
            setRegisteredIds(new Set());
        }
    }, [storageKey]);

    const toggleRegistration = (event) => {
        setRegisteredIds((current) => {
            const next = new Set(current);
            if (next.has(event.id)) {
                next.delete(event.id);
                setMessage(`Registration cancelled for ${event.title}.`);
            } else {
                next.add(event.id);
                setMessage(`You are registered for ${event.title}.`);
            }
            localStorage.setItem(storageKey, JSON.stringify([...next]));
            return next;
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                    <h1 className="flex items-center gap-2 text-2xl font-black text-white"><Calendar className="h-7 w-7 text-primary-400" /> Events & Activities</h1>
                    <p className="mt-1 text-sm text-surface-400">Register for upcoming learning and networking events</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {types.map((type) => (
                        <button key={type} type="button" onClick={() => setFilter(type)} className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-all ${filter === type ? 'border-primary-500 bg-primary-600/20 text-primary-400' : 'border-surface-700 bg-surface-800/30 text-surface-400 hover:border-surface-500'}`}>{type}</button>
                    ))}
                </div>
            </div>

            {message && <div className="flex items-center gap-2 rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-300"><CheckCircle2 className="h-4 w-4" />{message}</div>}

            <div className="grid gap-6 md:grid-cols-2">
                {filtered.map((event) => {
                    const registered = registeredIds.has(event.id);
                    const attendeeCount = Math.min(event.maxAttendees, event.attendees + (registered ? 1 : 0));
                    return (
                        <article key={event.id} className="card group transition-all hover:border-primary-500/30">
                            <div className="mb-3 flex items-start justify-between">
                                <span className={`badge ${typeColors[event.type]}`}>{event.type}</span>
                                <div className="flex items-center gap-1 text-xs text-surface-400"><Star className="h-3 w-3 text-amber-400" /><span>{event.predictedAttendance}% predicted</span></div>
                            </div>
                            <h2 className="mb-2 text-lg font-bold text-white transition-colors group-hover:text-primary-400">{event.title}</h2>
                            <p className="mb-2 text-xs font-medium text-primary-400">Organized by {event.organizer}</p>
                            <p className="mb-4 text-sm text-surface-400">{event.description}</p>
                            <div className="mb-4 flex flex-wrap gap-3 text-xs text-surface-400">
                                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{event.date}</span>
                                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{event.time}</span>
                                <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{event.location}</span>
                            </div>
                            <div className="flex flex-col gap-3 border-t border-surface-800/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-surface-500" />
                                    <span className="text-xs text-surface-400">{attendeeCount}/{event.maxAttendees}</span>
                                    <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-700"><div className="h-full rounded-full gradient-primary" style={{ width: `${attendeeCount / event.maxAttendees * 100}%` }} /></div>
                                </div>
                                <button type="button" onClick={() => toggleRegistration(event)} className={registered ? 'btn-secondary px-4 py-1.5 text-xs text-green-300' : 'btn-primary px-4 py-1.5 text-xs'}>{registered ? 'Cancel registration' : 'Register'}</button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
