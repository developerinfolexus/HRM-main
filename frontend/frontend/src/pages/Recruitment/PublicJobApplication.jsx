/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Upload, CheckCircle, AlertCircle, Briefcase, ChevronDown } from 'lucide-react';

export default function PublicJobApplication() {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const [jobs, setJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState(jobId || '');
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        phone: '',
        currentLocation: '',
        experienceLevel: '', // "Fresher", "1-3", etc.
        experience: '', // Numeric if needed, we'll derived from level or ask
        linkedin: '',
        expectedCtc: '',
        currentCtc: '',
        resumeBase64: '',
        comments: '',
        customResponses: []
    });

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    // Fetch all active jobs on mount
    useEffect(() => {
        fetchJobs();
    }, []);

    // Update selected job when URL param changes
    useEffect(() => {
        if (jobId) setSelectedJobId(jobId);
    }, [jobId]);

    // Fetch job details when a job is selected
    useEffect(() => {
        if (selectedJobId) {
            fetchJobDetails(selectedJobId);
        } else {
            setJob(null);
            setLoading(false);
        }
    }, [selectedJobId]);

    const fetchJobs = async () => {
        try {
            const res = await axios.get(`${apiUrl}/public/recruitment/jobs`);
            setJobs(res.data.data.jobs);
        } catch (err) {
            console.error(err);
            setError('Failed to load career opportunities.');
        } finally {
            setPageLoading(false);
        }
    };

    const fetchJobDetails = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`${apiUrl}/public/recruitment/job/${id}`);
            setJob(res.data.data.job);

            // Initialize custom responses - ONLY if switching to a new job
            const fields = res.data.data.job.customFields || [];
            const initialResponses = fields.map(field => ({
                label: field.label,
                answer: ''
            }));

            // Preserve form data, just reset custom responses
            setFormData(prev => ({ ...prev, customResponses: initialResponses }));

        } catch (err) {
            console.error(err);
            setError('Job not found or no longer active.');
            setJob(null);
        } finally {
            setLoading(false);
        }
    };

    const handleJobSelect = (e) => {
        const newId = e.target.value;
        setSelectedJobId(newId);
        if (newId) {
            navigate(`/apply/${newId}`, { replace: true });
        } else {
            navigate(`/apply`, { replace: true });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCustomChange = (index, value) => {
        const updated = [...formData.customResponses];
        updated[index] = { ...updated[index], answer: value };
        setFormData(prev => ({ ...prev, customResponses: updated }));
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, resumeBase64: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        if (!selectedJobId) {
            setError("Please select a position to apply for.");
            setSubmitting(false);
            return;
        }

        // Parse experience numeric value from dropdown if possible, else 0
        let expNum = 0;
        if (formData.experienceLevel === 'Fresher') expNum = 0;
        else if (formData.experienceLevel === '1-3') expNum = 2;
        else if (formData.experienceLevel === '3-5') expNum = 4;
        else if (formData.experienceLevel === '5-10') expNum = 7;
        else if (formData.experienceLevel === '10+') expNum = 10;
        else if (formData.experienceLevel === 'Other') expNum = parseInt(formData.experience) || 0; // Fallback to manual input if we show it

        const payload = {
            jobId: selectedJobId,
            ...formData,
            experience: expNum // Send numeric approximation for sorting
        };

        try {
            await axios.post(`${apiUrl}/public/recruitment/apply`, payload);
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit application.');
        } finally {
            setSubmitting(false);
        }
    };

    if (pageLoading) return <div className="text-center p-5">Loading opportunities...</div>;

    if (success) return (
        <div className="container d-flex justify-content-center align-items-center vh-100" style={{ background: '#f8fafc' }}>
            <div className="card shadow-lg p-5 text-center border-0" style={{ maxWidth: 500, borderRadius: 20 }}>
                <div className="mb-4 text-success d-flex justify-content-center"><CheckCircle size={64} /></div>
                <h2 className="mb-3 fw-bold text-dark">Application Submitted!</h2>
                <p className="text-muted mb-4">Thank you for applying to <strong>{job?.title}</strong>. We have received your details and will get back to you soon.</p>
                <button className="btn btn-outline-primary" onClick={() => window.location.reload()}>Submit Another Application</button>
            </div>
        </div>
    );

    return (
        <div style={{ background: '#F0EBF8', minHeight: '100vh', padding: '20px' }}>
            <div className="container" style={{ maxWidth: '770px' }}>

                {/* Google Form Style Main Card */}
                <div className="card shadow-sm border-0 rounded-3 overflow-hidden" style={{ borderTop: '10px solid #673ab7' }}>
                    <div className="card-body p-4 p-md-5">
                        {/* Title Section */}
                        <div className="mb-4">
                            <h1 className="fw-bold text-dark mb-2" style={{ fontSize: '32px' }}>Job Application Form</h1>
                            <p className="text-muted">Fill out the details below to apply for open positions. Required fields are marked with *</p>
                        </div>
                        <hr className="my-4" />

                        {/* 1. Job Selection Dropdown */}
                        <div className="mb-5">
                            <label className="form-label fw-bold mb-2">Applying For Role <span className="text-danger">*</span></label>
                            <div className="position-relative">
                                <select
                                    className="form-select form-select-lg bg-white border shadow-sm py-3"
                                    value={selectedJobId}
                                    onChange={handleJobSelect}
                                    style={{ fontWeight: '600' }}
                                >
                                    <option value="">-- Select a Position --</option>
                                    {jobs.map(j => (
                                        <option key={j._id} value={j._id}>{j.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {!selectedJobId ? (
                            <div className="text-center py-5 text-muted bg-light rounded-3 border border-dashed">
                                <Briefcase size={32} className="mb-2 opacity-50" />
                                <p className="mb-0">Please select a position above to fill out the application.</p>
                            </div>
                        ) : loading ? (
                            <div className="text-center py-5">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="mt-2 text-muted">Loading role details...</p>
                            </div>
                        ) : job ? (
                            <form onSubmit={handleSubmit}>
                                {/* Job Details Brief */}
                                <div className="alert alert-light border mb-4">
                                    <h5 className="fw-bold text-dark">{job.title}</h5>
                                    <p className="small text-muted mb-0">{job.description}</p>
                                </div>

                                {/* SECTION 1: Personal Details */}
                                <div className="row g-4 mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Name <span className="text-danger">*</span></label>
                                        <input type="text" className="form-control form-control-lg bg-light border-0"
                                            name="name" value={formData.name} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                                        <input type="email" className="form-control form-control-lg bg-light border-0"
                                            name="email" value={formData.email} onChange={handleChange} required />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-semibold">Address <span className="text-danger">*</span></label>
                                        <textarea className="form-control form-control-lg bg-light border-0" rows="2"
                                            name="address" value={formData.address} onChange={handleChange} required></textarea>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Phone number</label>
                                        <input type="tel" className="form-control form-control-lg bg-light border-0"
                                            name="phone" value={formData.phone} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Current Location</label>
                                        <input type="text" className="form-control form-control-lg bg-light border-0"
                                            name="currentLocation" value={formData.currentLocation} onChange={handleChange} />
                                    </div>
                                </div>

                                {/* SECTION 2: Professional Details */}
                                <div className="row g-4 mb-4">
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Experience (Years) <span className="text-danger">*</span></label>
                                        <select className="form-select form-select-lg bg-light border-0"
                                            name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} required>
                                            <option value="">Select Experience</option>
                                            <option value="Fresher">Fresher</option>
                                            <option value="1-3">1-3 Years</option>
                                            <option value="3-5">3-5 Years</option>
                                            <option value="5-10">5-10 Years</option>
                                            <option value="10+">10+ Years</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        {formData.experienceLevel === 'Other' && (
                                            <input type="text" className="form-control mt-2" placeholder="Specify years"
                                                name="experience" value={formData.experience} onChange={handleChange} />
                                        )}
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">LinkedIn Profile URL <span className="text-danger">*</span></label>
                                        <input type="url" className="form-control form-control-lg bg-light border-0"
                                            name="linkedin" value={formData.linkedin} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Expected CTC <span className="text-danger">*</span></label>
                                        <input type="number" className="form-control form-control-lg bg-light border-0"
                                            name="expectedCtc" value={formData.expectedCtc} onChange={handleChange} required />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-semibold">Current CTC <span className="text-danger">*</span></label>
                                        <input type="number" className="form-control form-control-lg bg-light border-0"
                                            name="currentCtc" value={formData.currentCtc} onChange={handleChange} required />
                                    </div>
                                </div>

                                {/* SECTION 3: Resume */}
                                <div className="mb-4">
                                    <label className="form-label fw-semibold">Upload your Resume / CV <span className="text-danger">*</span></label>
                                    <div className="d-flex align-items-center gap-3">
                                        <input type="file" className="form-control form-control-lg bg-light border-0" accept=".pdf,.doc,.docx" onChange={handleFileChange} required />
                                    </div>
                                    <div className="form-text mt-2">Accepted formats: PDF, DOC, DOCX</div>
                                </div>

                                {/* SECTION 4: Custom Fields */}
                                {job.customFields && job.customFields.length > 0 && (
                                    <>
                                        <h5 className="fw-bold mb-3 border-top pt-4">Additional Questions</h5>
                                        <div className="row g-4 mb-4">
                                            {job.customFields.map((field, idx) => (
                                                <div className="col-12" key={idx}>
                                                    <label className="form-label fw-semibold">{field.label} {field.required && <span className="text-danger">*</span>}</label>
                                                    {field.type === 'textarea' ? (
                                                        <textarea className="form-control form-control-lg bg-light border-0" rows="3"
                                                            value={formData.customResponses[idx]?.answer || ''}
                                                            onChange={e => handleCustomChange(idx, e.target.value)}
                                                            required={field.required}
                                                        ></textarea>
                                                    ) : field.type === 'dropdown' ? (
                                                        <select className="form-select form-select-lg bg-light border-0"
                                                            value={formData.customResponses[idx]?.answer || ''}
                                                            onChange={e => handleCustomChange(idx, e.target.value)}
                                                            required={field.required}
                                                        >
                                                            <option value="">Select an option</option>
                                                            {field.options && field.options.map((opt, i) => (
                                                                <option key={i} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : field.type === 'file' ? (
                                                        <>
                                                            <input type="file" className="form-control form-control-lg bg-light border-0"
                                                                onChange={e => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        const reader = new FileReader();
                                                                        reader.onloadend = () => {
                                                                            handleCustomChange(idx, reader.result); // Save Base64
                                                                        };
                                                                        reader.readAsDataURL(file);
                                                                    }
                                                                }}
                                                                required={field.required}
                                                            />
                                                            <small className="text-muted">Max size: 5MB</small>
                                                        </>
                                                    ) : (
                                                        <input type={field.type} className="form-control form-control-lg bg-light border-0"
                                                            value={formData.customResponses[idx]?.answer || ''}
                                                            onChange={e => handleCustomChange(idx, e.target.value)}
                                                            required={field.required}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {/* SECTION 5: Comments */}
                                <div className="mb-5">
                                    <label className="form-label fw-semibold">Comments</label>
                                    <textarea className="form-control form-control-lg bg-light border-0" rows="3"
                                        name="comments" value={formData.comments} onChange={handleChange}></textarea>
                                </div>

                                <div className="d-grid">
                                    <button type="submit" className="btn btn-primary btn-lg py-3 fw-bold shadow-sm" disabled={submitting}
                                        style={{ background: '#2563eb', border: 'none' }}>
                                        {submitting ? 'Submitting Application...' : 'Submit Application'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="text-center text-danger p-4">
                                Failed to load job details. Please try again or select another role.
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
