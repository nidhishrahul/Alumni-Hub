import { useState } from 'react';
import { Calendar, MapPin, Clock, Users, Plus, Filter, ChevronRight, Star } from 'lucide-react';

const allEvents = [
    { id: 1, title: 'AI & Machine Learning Workshop', description: 'Hands-on workshop on building ML models with Python and TensorFlow.', date: 'Jul 20, 2026', time: '10:00 AM - 4:00 PM', location: 'Seminar Hall A', type: 'Workshop', organizer: 'Dr. Priya Sharma', attendees: 45, maxAttendees: 60, registered: true, predictedAttendance: 92 },
    { id: 2, title: 'Alumni Networking Meetup 2026', description: 'Annual networking event for alumni and current students.', date: 'Aug 5, 2026', time: '6:00 PM - 9:00 PM', location: 'Grand Auditorium', type: 'Networking', organizer: 'Alumni Association', attendees: 120, maxAttendees: 200, registered: false, predictedAttendance: 85 },
    { id: 3, title: 'Industry Talk: Cloud Architecture', description: 'Learn about modern cloud architecture patterns from industry experts.', date: 'Jul 25, 2026', time: '2:00 PM - 4:00 PM', location: 'Virtual (Zoom)', type: 'Webinar', organizer: 'Rahul Verma', attendees: 78, maxAttendees: 150, registered: false, predictedAttendance: 70 },
    { id: 4, title: 'Hackathon: Smart India 2026 Prep', description: 'Practice hackathon to prepare teams for Smart India Hackathon.', date: 'Aug 15, 2026', time: '9:00 AM - 9:00 PM', location: 'CS Lab Complex', type: 'Hackathon', organizer: 'CSE Department', attendees: 90, maxAttendees: 100, registered: true, predictedAttendance: 95 },
    { id: 5, title: 'Career Guidance Seminar', description: 'Alumni-led session on career planning and industry trends.', date: 'Aug 10, 2026', time: '11:00 AM - 1:00 PM', location: 'Main Hall', type: 'Seminar', organizer: 'Placement Cell', attendees: 200, maxAttendees: 300, registered: false, predictedAttendance: 78 },
];

const typeColors = {
    Workshop: 'badge-primary', Networking: 'badge-accent', Webinar: 'badge-warning',
    Hackathon: 'badge-danger', Seminar: 'badge-success',
};

export default function Events() {
    const [filter, setFilter] = useState('all');
    const types = ['all', ...new Set(allEvents.map(e => e.type))];
    const filtered = allEvents.filter(e => filter === 'all' || e.type === filter);

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-white flex items-center gap-2">
                        <Calendar className="w-7 h-7 text-primary-400" /> Events & Activities
                    </h1>
                    <p className="text-sm text-surface-400 mt-1">AI-recommended events with attendance prediction</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                        {types.map(t => (
                            <button key={t} onClick={() => setFilter(t)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all border
                  ${filter === t ? 'bg-primary-600/20 border-primary-500 text-primary-400' : 'bg-surface-800/30 border-surface-700 text-surface-400 hover:border-surface-500'}`}
                            >{t}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                {filtered.map(event => (
                    <div key={event.id} className="card hover:border-primary-500/30 transition-all group">
                        <div className="flex items-start justify-between mb-3">
                            <span className={`badge ${typeColors[event.type]}`}>{event.type}</span>
                            <div className="flex items-center gap-1 text-xs text-surface-400">
                                <Star className="w-3 h-3 text-amber-400" />
                                <span>{event.predictedAttendance}% predicted</span>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary-400 transition-colors">{event.title}</h3>
                        <p className="text-sm text-surface-400 mb-4">{event.description}</p>

                        <div className="flex flex-wrap gap-3 text-xs text-surface-400 mb-4">
                            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {event.date}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {event.time}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {event.location}</span>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-surface-800/50">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-surface-500" />
                                <span className="text-xs text-surface-400">{event.attendees}/{event.maxAttendees}</span>
                                <div className="w-20 h-1.5 bg-surface-700 rounded-full overflow-hidden">
                                    <div className="h-full gradient-primary rounded-full" style={{ width: `${(event.attendees / event.maxAttendees) * 100}%` }} />
                                </div>
                            </div>
                            {event.registered ? (
                                <span className="badge badge-success">Registered ✓</span>
                            ) : (
                                <button className="btn-primary text-xs py-1.5 px-4">Register</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
