import { useState } from 'react';
import { X, ShieldCheck, ShieldAlert, ShieldX, Sparkles, CheckCircle2, Loader2, Link as LinkIcon, FileText, GraduationCap, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import api from '../services/api';

export default function VerificationModal({ isOpen, onClose, initialData = {}, onVerificationSuccess }) {
    const [step, setStep] = useState('FORM'); // 'FORM' | 'SUBMITTING' | 'RESULT'
    const [formData, setFormData] = useState({
        registerNumber: initialData.registerNumber || '',
        department: initialData.department || 'Computer Science',
        degree: initialData.degree || 'B.Tech',
        graduationYear: initialData.graduationYear || 2022,
        linkedinUrl: initialData.linkedinUrl || '',
        currentCompany: initialData.currentCompany || '',
        currentDesignation: initialData.currentDesignation || '',
        bio: initialData.bio || '',
        resumeText: '',
        links: '',
        imageUrl: '',
    });

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [result, setResult] = useState(null);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        // Check that AT LEAST ONE credential input is provided (none are strictly mandatory individually!)
        const hasReg = !!formData.registerNumber.trim();
        const hasLinkedin = !!formData.linkedinUrl.trim();
        const hasResume = !!formData.resumeText.trim();
        const hasLinks = !!formData.links.trim();
        const hasImage = !!selectedFile || !!formData.imageUrl.trim();
        const hasDetails = !!formData.department.trim() && !!formData.graduationYear;

        if (!hasReg && !hasLinkedin && !hasResume && !hasLinks && !hasImage && !hasDetails) {
            setErrorMsg('Please provide at least one credential (e.g. Register Number, LinkedIn URL, ID Picture upload, Resume summary, or Links).');
            return;
        }

        setLoading(true);
        setErrorMsg('');
        setStep('SUBMITTING');

        try {
            const data = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] !== null && formData[key] !== undefined) {
                    data.append(key, formData[key]);
                }
            });

            if (selectedFile) {
                data.append('image', selectedFile);
            }

            const res = await api.post('/api/ai-verification/submit', data);

            setResult(res.data);
            setStep('RESULT');
        } catch (err) {
            console.error('Verification submission error:', err);
            setErrorMsg(err.response?.data?.detail || 'Failed to analyze verification credentials. Please try again.');
            setStep('FORM');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-950/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-surface-700 bg-surface-900 shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-800 bg-surface-900/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">AI Alumni Verification</h2>
                            <p className="text-xs text-surface-400">Submit credentials or proof picture for AI Risk Score evaluation</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-800 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">

                    {errorMsg && (
                        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center justify-between">
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {step === 'FORM' && (
                        <form onSubmit={handleSubmit} className="space-y-6">

                            <div className="p-3 rounded-xl bg-primary-500/10 border border-primary-500/20 text-xs text-primary-300">
                                💡 <strong>Note:</strong> Fields are optional. Entering or uploading <strong>any one</strong> credential (Register No, LinkedIn, Picture Upload, Resume, or Links) is enough to initiate verification!
                            </div>

                            {/* Picture / ID Proof File Upload */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-accent-400 uppercase tracking-wider flex items-center gap-2">
                                    <ImageIcon className="w-4 h-4" /> Upload ID Proof or Degree Certificate Picture
                                </h3>

                                {previewUrl ? (
                                    <div className="relative p-3 rounded-xl border border-surface-700 bg-surface-800/50 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <img src={previewUrl} alt="Upload preview" className="w-16 h-16 object-cover rounded-lg border border-surface-600" />
                                            <div>
                                                <p className="text-xs font-bold text-white">{selectedFile?.name}</p>
                                                <p className="text-[10px] text-surface-400">{(selectedFile?.size / 1024).toFixed(1)} KB · Ready to verify</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removeFile}
                                            className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="border-2 border-dashed border-surface-700 hover:border-accent-500 rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface-800/30 hover:bg-surface-800/60">
                                        <Upload className="w-8 h-8 text-accent-400 mb-2" />
                                        <span className="text-xs font-medium text-surface-200">Click to select ID Card / Degree Certificate Picture</span>
                                        <span className="text-[10px] text-surface-500 mt-1">Supports PNG, JPG, WEBP or PDF (Max 10MB)</span>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            {/* Academic Credentials */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-primary-400 uppercase tracking-wider flex items-center gap-2">
                                    <GraduationCap className="w-4 h-4" /> Academic Credentials (Optional)
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-surface-300 mb-1">
                                            Register Number / Student ID
                                        </label>
                                        <input
                                            type="text"
                                            name="registerNumber"
                                            value={formData.registerNumber}
                                            onChange={handleChange}
                                            placeholder="e.g. CSE2019001"
                                            className="input-field text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-surface-300 mb-1">Department</label>
                                        <input
                                            type="text"
                                            name="department"
                                            value={formData.department}
                                            onChange={handleChange}
                                            placeholder="Computer Science"
                                            className="input-field text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-surface-300 mb-1">Degree</label>
                                        <input
                                            type="text"
                                            name="degree"
                                            value={formData.degree}
                                            onChange={handleChange}
                                            placeholder="B.Tech"
                                            className="input-field text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-surface-300 mb-1">Graduation Year</label>
                                        <input
                                            type="number"
                                            name="graduationYear"
                                            value={formData.graduationYear}
                                            onChange={handleChange}
                                            placeholder="2022"
                                            className="input-field text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Verification Data & Links */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-accent-400 uppercase tracking-wider flex items-center gap-2">
                                    <LinkIcon className="w-4 h-4" /> Professional & Social Links (Optional)
                                </h3>
                                <div>
                                    <label className="block text-xs font-medium text-surface-300 mb-1">
                                        LinkedIn Profile URL
                                    </label>
                                    <input
                                        type="url"
                                        name="linkedinUrl"
                                        value={formData.linkedinUrl}
                                        onChange={handleChange}
                                        placeholder="https://linkedin.com/in/username"
                                        className="input-field text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-surface-300 mb-1">
                                        Additional Links (Portfolio, GitHub, Company Site)
                                    </label>
                                    <input
                                        type="text"
                                        name="links"
                                        value={formData.links}
                                        onChange={handleChange}
                                        placeholder="https://github.com/username, https://myportfolio.com"
                                        className="input-field text-sm"
                                    />
                                </div>
                            </div>

                            {/* Resume / Summary */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Resume & Work Experience Text (Optional)
                                </h3>
                                <div>
                                    <label className="block text-xs font-medium text-surface-300 mb-1">
                                        Paste Resume Text or Summary
                                    </label>
                                    <textarea
                                        name="resumeText"
                                        value={formData.resumeText}
                                        onChange={handleChange}
                                        rows={3}
                                        placeholder="Paste text from your resume or work summary..."
                                        className="input-field text-sm resize-y"
                                    />
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="pt-4 border-t border-surface-800 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="btn-secondary text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary text-sm flex items-center gap-2 shadow-lg shadow-primary-500/20"
                                >
                                    <Sparkles className="w-4 h-4" /> Verify Credentials with AI
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'SUBMITTING' && (
                        <div className="py-16 text-center space-y-4">
                            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto shadow-xl shadow-primary-500/30 animate-pulse">
                                <Loader2 className="w-8 h-8 text-white animate-spin" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Running AI Verification Model...</h3>
                            <p className="text-xs text-surface-400 max-w-sm mx-auto">
                                Evaluating provided credentials against university database records and computing risk score...
                            </p>
                        </div>
                    )}

                    {step === 'RESULT' && result && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Result Banner */}
                            <div className={`p-6 rounded-2xl border ${(result.isVerified || result.classification === 'VERIFIED' || result.classification === 'LOW_RISK')
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                    : 'bg-red-500/10 border-red-500/30 text-red-300'
                                } flex flex-col sm:flex-row items-center justify-between gap-4`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-surface-900/50 backdrop-blur-sm">
                                        {(result.isVerified || result.classification === 'VERIFIED' || result.classification === 'LOW_RISK') ? (
                                            <ShieldCheck className="w-7 h-7 text-emerald-400" />
                                        ) : (
                                            <ShieldX className="w-7 h-7 text-red-400" />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold">
                                            {(result.isVerified || result.classification === 'VERIFIED' || result.classification === 'LOW_RISK')
                                                ? 'Fully Verified Alumni Profile'
                                                : 'Verification Unsuccessful — High Risk Detected'}
                                        </h3>
                                        <p className="text-xs text-surface-400 mt-0.5">
                                            {(result.isVerified || result.classification === 'VERIFIED' || result.classification === 'LOW_RISK')
                                                ? 'Your profile credentials have been verified by our AI model! A verified badge is now assigned to your profile.'
                                                : 'Our AI model detected high risk factors with the submitted credentials. Please upload valid proof or update details.'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-center sm:text-right flex-shrink-0">
                                    <div className="text-2xl font-black text-white">
                                        {result.riskScore?.toFixed(1) || '0.0'} <span className="text-xs font-normal text-surface-400">/ 100</span>
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider text-surface-400 font-medium">
                                        Risk Score
                                    </div>
                                </div>
                            </div>

                            {/* Feature Breakdown */}
                            <div className="card space-y-3">
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">AI Model Evaluation Breakdown</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                    <div className="p-2.5 rounded-lg bg-surface-800/50 border border-surface-700">
                                        <span className="text-surface-400 block text-[10px]">Name Similarity</span>
                                        <span className="font-bold text-white">
                                            {result?.features?.name_similarity !== undefined ? `${(result.features.name_similarity * 100).toFixed(0)}%` : 'Verified'}
                                        </span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-surface-800/50 border border-surface-700">
                                        <span className="text-surface-400 block text-[10px]">Dept Match</span>
                                        <span className="font-bold text-white">
                                            {result?.features?.department_match === 1 ? 'Match' : 'Checked'}
                                        </span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-surface-800/50 border border-surface-700">
                                        <span className="text-surface-400 block text-[10px]">Degree Match</span>
                                        <span className="font-bold text-white">
                                            {result?.features?.degree_match === 1 ? 'Match' : 'Checked'}
                                        </span>
                                    </div>
                                    <div className="p-2.5 rounded-lg bg-surface-800/50 border border-surface-700">
                                        <span className="text-surface-400 block text-[10px]">LinkedIn / Proof</span>
                                        <span className="font-bold text-white">
                                            {result?.features?.linkedin_valid > 0 ? 'Provided' : 'Optional'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-[10px] text-surface-400 text-right">
                                    Model: <span className="text-primary-400 font-semibold">{result?.algorithm || 'CatBoost/RandomForest ML'}</span>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    onClick={() => {
                                        if (onVerificationSuccess) {
                                            onVerificationSuccess(result);
                                        }
                                        onClose();
                                    }}
                                    className="btn-primary text-sm shadow-lg"
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
