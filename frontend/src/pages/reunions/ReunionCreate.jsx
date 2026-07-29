import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
    Plus, X, Calendar, MapPin, PartyPopper, 
    Users, Clock, AlertCircle 
} from 'lucide-react';

export default function ReunionCreate() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        proposedDates: ['', ''],
        venueOptions: [
            { name: '', address: '', mapLink: '' },
            { name: '', address: '', mapLink: '' }
        ]
    });

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const addProposedDate = () => {
        if (formData.proposedDates.length < 4) {
            setFormData(prev => ({
                ...prev,
                proposedDates: [...prev.proposedDates, '']
            }));
        }
    };

    const removeProposedDate = (index) => {
        if (formData.proposedDates.length > 2) {
            setFormData(prev => ({
                ...prev,
                proposedDates: prev.proposedDates.filter((_, i) => i !== index)
            }));
        }
    };

    const updateProposedDate = (index, value) => {
        setFormData(prev => ({
            ...prev,
            proposedDates: prev.proposedDates.map((date, i) => i === index ? value : date)
        }));
    };

    const addVenueOption = () => {
        if (formData.venueOptions.length < 4) {
            setFormData(prev => ({
                ...prev,
                venueOptions: [...prev.venueOptions, { name: '', address: '', mapLink: '' }]
            }));
        }
    };

    const removeVenueOption = (index) => {
        if (formData.venueOptions.length > 2) {
            setFormData(prev => ({
                ...prev,
                venueOptions: prev.venueOptions.filter((_, i) => i !== index)
            }));
        }
    };

    const updateVenueOption = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            venueOptions: prev.venueOptions.map((venue, i) => 
                i === index ? { ...venue, [field]: value } : venue
            )
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Validate form
            if (!formData.title.trim() || !formData.description.trim()) {
                throw new Error('Title and description are required');
            }

            const validDates = formData.proposedDates.filter(date => date.trim());
            if (validDates.length < 2) {
                throw new Error('Please provide at least 2 proposed dates');
            }

            const validVenues = formData.venueOptions.filter(venue => venue.name.trim() && venue.address.trim());
            if (validVenues.length < 2) {
                throw new Error('Please provide at least 2 venue options with name and address');
            }

            const token = localStorage.getItem('token');
            const response = await fetch('http://localhost:3001/api/reunions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.title.trim(),
                    description: formData.description.trim(),
                    proposedDates: validDates,
                    venueOptions: validVenues
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Failed to create reunion');
            }

            const reunion = await response.json();
            navigate(`/reunions/${reunion.id}`);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Check if user is verified alumni (coordinators should be verified alumni)
    if (user?.role !== 'ALUMNI' || !user?.alumniProfile?.isVerified) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-950 p-8">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-amber-400" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-3">Access Restricted</h2>
                    <p className="text-surface-400 mb-6">
                        Only verified alumni who are batch coordinators can create reunions.
                    </p>
                    <button 
                        onClick={() => navigate('/reunions')} 
                        className="btn-secondary"
                    >
                        View Reunions
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-950 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
                        <PartyPopper className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-white">Create Batch Reunion</h1>
                        <p className="text-surface-400">
                            Organize a memorable get-together for your graduating batch
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Basic Details */}
                    <div className="card">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                            <Users className="w-5 h-5 text-primary-400" />
                            Basic Details
                        </h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">
                                    Reunion Title *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    placeholder="e.g., Class of 2020 - 5 Year Reunion"
                                    className="input-field"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">
                                    Description *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleInputChange('description', e.target.value)}
                                    placeholder="Share what makes this reunion special, what to expect, dress code, etc."
                                    rows={4}
                                    className="input-field"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Proposed Dates */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <Calendar className="w-5 h-5 text-accent-400" />
                                Proposed Dates
                            </h3>
                            {formData.proposedDates.length < 4 && (
                                <button
                                    type="button"
                                    onClick={addProposedDate}
                                    className="btn-secondary text-sm flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Date
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-4">
                            {formData.proposedDates.map((date, index) => (
                                <div key={index} className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <input
                                            type="datetime-local"
                                            value={date}
                                            onChange={(e) => updateProposedDate(index, e.target.value)}
                                            className="input-field"
                                            required
                                        />
                                    </div>
                                    {formData.proposedDates.length > 2 && (
                                        <button
                                            type="button"
                                            onClick={() => removeProposedDate(index)}
                                            className="w-10 h-10 rounded-lg border border-surface-700 hover:border-red-500 
                                                     text-surface-400 hover:text-red-400 transition-colors flex items-center justify-center"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <p className="text-xs text-surface-500 mt-4">
                            Provide 2-4 date options. Your batchmates will vote on their preference.
                        </p>
                    </div>

                    {/* Venue Options */}
                    <div className="card">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                <MapPin className="w-5 h-5 text-green-400" />
                                Venue Options
                            </h3>
                            {formData.venueOptions.length < 4 && (
                                <button
                                    type="button"
                                    onClick={addVenueOption}
                                    className="btn-secondary text-sm flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Venue
                                </button>
                            )}
                        </div>
                        
                        <div className="space-y-6">
                            {formData.venueOptions.map((venue, index) => (
                                <div key={index} className="border border-surface-700 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-medium text-surface-300">
                                            Venue Option {index + 1}
                                        </h4>
                                        {formData.venueOptions.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeVenueOption(index)}
                                                className="text-surface-400 hover:text-red-400 transition-colors"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-surface-400 mb-2">
                                                Venue Name *
                                            </label>
                                            <input
                                                type="text"
                                                value={venue.name}
                                                onChange={(e) => updateVenueOption(index, 'name', e.target.value)}
                                                placeholder="e.g., Grand Ballroom Hotel"
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-xs font-medium text-surface-400 mb-2">
                                                Address *
                                            </label>
                                            <input
                                                type="text"
                                                value={venue.address}
                                                onChange={(e) => updateVenueOption(index, 'address', e.target.value)}
                                                placeholder="Full address"
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                        
                                        <div className="md:col-span-2">
                                            <label className="block text-xs font-medium text-surface-400 mb-2">
                                                Map Link (Optional)
                                            </label>
                                            <input
                                                type="url"
                                                value={venue.mapLink}
                                                onChange={(e) => updateVenueOption(index, 'mapLink', e.target.value)}
                                                placeholder="Google Maps or other map link"
                                                className="input-field"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <p className="text-xs text-surface-500 mt-4">
                            Provide 2-4 venue options. Your batchmates will vote after the date is finalized.
                        </p>
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="flex items-center justify-end gap-4 pt-6">
                        <button
                            type="button"
                            onClick={() => navigate('/reunions')}
                            className="btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary flex items-center gap-2"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <PartyPopper className="w-4 h-4" />
                                    Create Reunion
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}