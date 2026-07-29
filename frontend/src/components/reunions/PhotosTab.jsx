import { useState, useRef } from 'react';
import { Camera, Upload, X, User, ZoomIn } from 'lucide-react';

export default function PhotosTab({ reunion, user, isCoordinator, onReunionUpdate }) {
    const [uploading, setUploading] = useState(false);
    const [caption, setCaption] = useState('');
    const [lightboxPhoto, setLightboxPhoto] = useState(null);
    const [lightboxIdx, setLightboxIdx] = useState(-1);
    const fileInputRef = useRef(null);

    const photos = reunion.photos || [];

    const handleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            formData.append('photo', file);
            if (caption.trim()) formData.append('caption', caption.trim());

            const res = await fetch(`http://localhost:3001/api/reunions/${reunion.id}/photos`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                setCaption('');
                onReunionUpdate();
            }
        } catch (err) { console.error(err); }
        finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const openLightbox = (photo, idx) => {
        setLightboxPhoto(photo);
        setLightboxIdx(idx);
    };

    const closeLightbox = () => {
        setLightboxPhoto(null);
        setLightboxIdx(-1);
    };

    const navigateLightbox = (dir) => {
        const newIdx = lightboxIdx + dir;
        if (newIdx >= 0 && newIdx < photos.length) {
            setLightboxPhoto(photos[newIdx]);
            setLightboxIdx(newIdx);
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                        <Camera className="w-5 h-5 text-pink-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Photos</h2>
                        <p className="text-sm text-surface-400">{photos.length} photo{photos.length !== 1 ? 's' : ''} shared</p>
                    </div>
                </div>
            </div>

            {/* Upload Section */}
            <div className="card mb-8 border-pink-500/10">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-surface-400 mb-2">Caption (optional)</label>
                        <input type="text" value={caption} onChange={e => setCaption(e.target.value)}
                            placeholder="Say something about this photo..." className="input-field text-sm" />
                    </div>
                    <div className="shrink-0">
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" id="photo-upload" />
                        <label htmlFor="photo-upload"
                            className={`btn-primary text-sm flex items-center gap-2 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                        >
                            <Upload className="w-4 h-4" />
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                        </label>
                    </div>
                </div>
            </div>

            {/* Photo Grid */}
            {photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {photos.map((photo, idx) => (
                        <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-surface-700/50 bg-surface-800/30 cursor-pointer aspect-square"
                            onClick={() => openLightbox(photo, idx)} role="button" tabIndex={0} aria-label={`View photo ${idx + 1}`}
                            onKeyDown={e => e.key === 'Enter' && openLightbox(photo, idx)}
                        >
                            <img src={`http://localhost:3001${photo.photoUrl}`} alt={photo.caption || 'Reunion photo'}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" loading="lazy" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                    {photo.caption && <p className="text-xs text-white font-medium truncate">{photo.caption}</p>}
                                    <p className="text-[10px] text-white/60 flex items-center gap-1 mt-1">
                                        <User className="w-2.5 h-2.5" /> {photo.uploadedBy?.name}
                                    </p>
                                </div>
                                <div className="absolute top-2 right-2">
                                    <ZoomIn className="w-5 h-5 text-white/70" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <div className="w-16 h-16 rounded-full bg-pink-500/10 border border-pink-500/20 flex items-center justify-center mx-auto mb-4">
                        <Camera className="w-7 h-7 text-pink-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No Photos Yet</h3>
                    <p className="text-surface-400 text-sm max-w-sm mx-auto">
                        Be the first to share a memory! Upload photos from your reunion.
                    </p>
                </div>
            )}

            {/* Lightbox */}
            {lightboxPhoto && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeLightbox}
                    role="dialog" aria-label="Photo lightbox"
                >
                    <button onClick={closeLightbox} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
                        aria-label="Close lightbox"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {lightboxIdx > 0 && (
                        <button onClick={e => { e.stopPropagation(); navigateLightbox(-1); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
                            aria-label="Previous photo"
                        >
                            ←
                        </button>
                    )}
                    {lightboxIdx < photos.length - 1 && (
                        <button onClick={e => { e.stopPropagation(); navigateLightbox(1); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10"
                            aria-label="Next photo"
                        >
                            →
                        </button>
                    )}

                    <div className="max-w-4xl max-h-[85vh] flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <img src={`http://localhost:3001${lightboxPhoto.photoUrl}`} alt={lightboxPhoto.caption || 'Reunion photo'}
                            className="max-w-full max-h-[75vh] object-contain rounded-xl" />
                        <div className="mt-4 text-center">
                            {lightboxPhoto.caption && <p className="text-sm text-white font-medium">{lightboxPhoto.caption}</p>}
                            <p className="text-xs text-white/50 mt-1">
                                Uploaded by {lightboxPhoto.uploadedBy?.name} • {new Date(lightboxPhoto.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
