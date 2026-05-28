import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    PlusCircle,
    PencilLine,
    Trash2,
    FileText,
    Target,
    Layers,
    CheckCircle2,
    Copy,
    X,
    ClipboardList,
    Link as LinkIcon,
    Settings // Added
} from "lucide-react";
import "../../css/Candidate.css"; // Reusing Candidate CSS for consistency
import jobDescriptionService from "../../services/jobDescriptionService";

export default function JobDescriptions() {
    const [jds, setJds] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    const [form, setForm] = useState({
        id: null,
        title: "",
        role: "",
        requiredSkills: "", // Comma separated for input
        experience: "",
        status: "Active"
    });

    const [showFormBuilder, setShowFormBuilder] = useState(false);
    const [selectedJobForForm, setSelectedJobForForm] = useState(null); // Just controls default selection
    const [activeTab, setActiveTab] = useState('roles'); // 'roles' or 'forms'
    const [formBuilderFields, setFormBuilderFields] = useState([]);
    const [generatedLink, setGeneratedLink] = useState("");

    // New state for dropdown in modal
    const [modalSelectedJobId, setModalSelectedJobId] = useState("");

    const openFormBuilder = (jd = null) => {
        setSelectedJobForForm(jd);
        setModalSelectedJobId(jd ? jd._id : ""); // Initialize dropdown
        setFormBuilderFields(jd?.customFields || []);
        setShowFormBuilder(true);
        setGeneratedLink("");
    };

    const handleModalJobChange = (e) => {
        const newId = e.target.value;
        setModalSelectedJobId(newId);
        const job = jds.find(j => j._id === newId);
        if (job) {
            setFormBuilderFields(job.customFields || []);
            setSelectedJobForForm(job);
        } else {
            setFormBuilderFields([]);
            setSelectedJobForForm(null);
        }
        setGeneratedLink("");
    };

    const closeFormBuilder = () => {
        setShowFormBuilder(false);
        setSelectedJobForForm(null);
        setModalSelectedJobId("");
        setFormBuilderFields([]);
        setGeneratedLink("");
    };

    const addCustomField = () => {
        setFormBuilderFields(prev => [...prev, { label: "", type: "text", required: false, options: [] }]);
    };

    const updateCustomField = (index, field, value) => {
        const updated = [...formBuilderFields];
        updated[index][field] = value;
        setFormBuilderFields(updated);
    };

    const removeCustomField = (index) => {
        setFormBuilderFields(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveForm = async () => {
        try {
            if (!modalSelectedJobId) {
                alert("Please select a Job Role to save this form configuration.");
                return;
            }

            setIsLoading(true);

            // Clean options for dropdowns
            const cleanedFields = formBuilderFields.map(f => ({
                ...f,
                options: Array.isArray(f.options) ? f.options.map(o => o.trim()).filter(o => o) : []
            }));

            // Find the job to update
            const jobToUpdate = jds.find(j => j._id === modalSelectedJobId);
            // We must merge existing JD fields, but ensure we don't accidentally overwrite unrelated fields if jobToUpdate is stale
            // Actually, we should just update `customFields`. The API likely handles partial updates or expects full object.
            // Our service likely expects full object? Let's assume standard PUT/PATCH

            // IMPORTANT: reusing the `jobToUpdate` ensures we keep its title, role etc.
            const payload = { ...jobToUpdate, customFields: cleanedFields };

            await jobDescriptionService.updateJobDescription(modalSelectedJobId, payload);

            // Generate Link
            const link = `${window.location.origin}/apply/${modalSelectedJobId}`;
            setGeneratedLink(link);

            // Refresh JDs to keep state in sync
            loadJds();

        } catch (error) {
            console.error("Save Form Error", error);
            alert("Failed to save form configuration.");
        } finally {
            setIsLoading(false);
        }
    };

    const copyLink = (id) => {
        const link = `${window.location.origin}/apply/${id}`;
        navigator.clipboard.writeText(link);
        alert("Application link copied to clipboard: " + link);
    };

    useEffect(() => {
        loadJds();
    }, []);

    const loadJds = async () => {
        try {
            setIsLoading(true);
            const data = await jobDescriptionService.getAllJobDescriptions();
            setJds(data);
        } catch (error) {
            console.error("Failed to load JDs", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const payload = {
                ...form,
                requiredSkills: form.requiredSkills.split(',').map(s => s.trim()).filter(s => s)
                // customFields NOT included here for creation, separate flow
            };

            if (isEditing) {
                await jobDescriptionService.updateJobDescription(form.id, payload);
            } else {
                await jobDescriptionService.createJobDescription(payload);
            }

            alert(`Job Description ${isEditing ? 'updated' : 'created'} successfully!`);
            resetForm();
            loadJds();
        } catch (error) {
            console.error("Save error:", error);
            alert("Failed to save: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };


    const handleEdit = (jd) => {
        setForm({
            id: jd._id,
            title: jd.title,
            role: jd.role,
            requiredSkills: jd.requiredSkills.join(', '),
            experience: jd.experience,
            status: jd.status,
            customFields: [] // Reset custom fields in local add/edit state
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleDelete = async (id) => {
        if (window.confirm("Delete this Job Description?")) {
            try {
                await jobDescriptionService.deleteJobDescription(id);
                setJds(prev => prev.filter(jd => jd._id !== id));
            } catch (error) {
                console.error("Delete error:", error);
            }
        }
    };

    const resetForm = () => {
        setForm({
            id: null, title: "", role: "", requiredSkills: "", experience: "", status: "Active"
        });
        setIsEditing(false);
    };

    return (
        <div className="candidate-page" style={{ background: '#fdfbff', minHeight: '100vh' }}>
            <div className="container py-8">

                {/* BACK BUTTON */}
                <div className="mb-6">
                    <Link to="/recruitment" className="d-inline-flex align-items-center gap-2 text-[#663399] fw-bold text-decoration-none hover:translate-x-[-4px] transition-transform">
                        <ArrowLeft size={18} /> Back to Command
                    </Link>
                </div>

                <div className="mb-10">
                    <div className="d-flex align-items-center gap-3 mb-2">
                        <div style={{ width: 4, height: 28, backgroundColor: '#663399', borderRadius: 4 }}></div>
                        <h2 className="mb-0 fw-black text-[#2E1A47] tracking-tight" style={{ fontSize: '2.5rem', fontWeight: 900 }}>Mission Role Specifications</h2>
                    </div>
                    <p className="text-[#A3779D] fw-bold" style={{ fontSize: '1.1rem' }}>Define mission requirements and skill parameters for ATS clearance</p>
                </div>

                {/* TABS - Sub Categories Style */}
                <div className="d-flex border-bottom mb-4">
                    <button
                        className={`btn me-4 pb-2 fw-bold ${activeTab === 'roles' ? 'text-primary border-bottom border-primary border-3' : 'text-muted'}`}
                        style={{ borderRadius: 0 }}
                        onClick={() => setActiveTab('roles')}
                    >
                        Job Roles
                    </button>
                    <button
                        className={`btn pb-2 fw-bold ${activeTab === 'forms' ? 'text-primary border-bottom border-primary border-3' : 'text-muted'}`}
                        style={{ borderRadius: 0 }}
                        onClick={() => setActiveTab('forms')}
                    >
                        Application Forms
                    </button>
                </div>

                {activeTab === 'roles' && (
                    <>
                        {/* FORM */}
                        <form className="form-card mb-5" onSubmit={handleSubmit}>
                            <h4 className="form-title">{isEditing ? "Edit JD" : "Create New JD"}</h4>
                            <div className="form-grid">
                                <div className="form-item">
                                    <label className="label">Job Title</label>
                                    <input className="control" name="title" value={form.title} onChange={handleChange} placeholder="e.g. Senior Backend Engineer" required />
                                </div>

                                <div className="form-item">
                                    <label className="label">Role Key (Matches 'Applied Role')</label>
                                    <input className="control" name="role" value={form.role} onChange={handleChange} placeholder="e.g. Backend Developer" required />
                                </div>

                                <div className="form-item full-width">
                                    <label className="label">Required Skills (Comma Separated)</label>
                                    <input className="control" name="requiredSkills" value={form.requiredSkills} onChange={handleChange} placeholder="e.g. Node.js, MongoDB, AWS, Docker" required />
                                </div>

                                <div className="form-item">
                                    <label className="label">Experience (Years)</label>
                                    <input className="control" type="text" name="experience" value={form.experience} onChange={handleChange} placeholder="e.g. 1-3" />
                                </div>

                                <div className="form-item">
                                    <label className="label">Status</label>
                                    <select className="control" name="status" value={form.status} onChange={handleChange}>
                                        <option>Active</option>
                                        <option>Inactive</option>
                                        <option>Draft</option>
                                    </select>
                                </div>

                                {/* REMOVED INLINE FORM BUILDER FROM HERE */}

                                {/* ... */}
                            </div>

                            <div className="form-actions">
                                <button className="btn primary" disabled={isLoading}>{isLoading ? 'Saving...' : 'Save JD'}</button>
                                <button type="button" className="btn reset" onClick={resetForm}>Cancel</button>
                            </div>
                        </form>

                        {/* LIST */}
                        <div className="list-section">
                            <div className="list-header">
                                <h3 className="list-title">Defined Roles</h3>
                            </div>
                            <div className="table-responsive">
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Role Match Key</th>
                                            <th>Skills</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {jds.map(jd => (
                                            <tr key={jd._id}>
                                                <td>{jd.title}</td>
                                                <td>{jd.role}</td>
                                                <td>
                                                    <div style={{ maxWidth: '300px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                        {jd.requiredSkills.slice(0, 5).map(s => (
                                                            <span key={s} style={{ fontSize: '0.7rem', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>{s}</span>
                                                        ))}
                                                        {jd.requiredSkills.length > 5 && <span style={{ fontSize: '0.7rem', color: '#64748b' }}>+{jd.requiredSkills.length - 5} more</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-badge ${jd.status === 'Active' ? 'badge-success' : 'badge-default'}`}>
                                                        {jd.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="d-flex gap-2">
                                                        <button className="btn p-2 border-0" style={{ color: '#663399', background: '#f3e8ff', borderRadius: '10px' }} onClick={() => handleEdit(jd)}>
                                                            <PencilLine size={18} />
                                                        </button>
                                                        <button className="btn p-2 border-0" style={{ color: '#dc2626', background: '#fee2e2', borderRadius: '10px' }} onClick={() => handleDelete(jd._id)}>
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {jds.length === 0 && <tr><td colSpan="5" className="empty-state">No Job Descriptions defined.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'forms' && (
                    <div className="list-section">
                        {/* Main Career Page Link */}
                        <div className="card border-0 shadow-sm p-4 mb-5" style={{ background: '#f8fafc', borderRadius: '16px' }}>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="fw-bold text-dark mb-1">Company Career Page</h5>
                                    <p className="text-muted small mb-0">Share this single link for candidates to browse and apply for any open position.</p>
                                </div>
                                <button
                                    className="btn btn-primary d-flex align-items-center gap-2"
                                    onClick={() => {
                                        const link = `${window.location.origin}/apply`;
                                        navigator.clipboard.writeText(link);
                                        alert("Career page link copied: " + link);
                                    }}
                                >
                                    <Copy size={16} /> Copy Main Page Link
                                </button>
                            </div>
                        </div>

                        <div className="list-header mb-4">
                            <h3 className="list-title">Specific Role Configurations</h3>
                            <p className="text-muted small">Customize application questions for specific roles or grab direct links.</p>
                        </div>

                        <div className="row g-4">
                            {/* Standard Form Builder Card */}
                            <div className="col-12">
                                <div className="card border-primary border-2 border-dashed p-4 text-center cursor-pointer hover-bg-light"
                                    onClick={() => openFormBuilder(null)}
                                    style={{ background: '#f0f9ff' }}
                                >
                                    <div className="d-flex flex-column align-items-center gap-2">
                                        <div className="p-3 bg-white rounded-circle text-primary shadow-sm">
                                            <Settings size={32} />
                                        </div>
                                        <h5 className="fw-bold text-primary mb-0">Configure Application Form</h5>
                                        <p className="text-muted small mb-0">Customize the application form for any job role. View standard fields and add custom questions.</p>
                                    </div>
                                </div>
                            </div>

                            {jds.map(jd => (
                                <div className="col-md-6 col-lg-4" key={jd._id}>
                                    <div className="card h-100 border-0 shadow-sm p-4 hover-shadow transition-all" style={{ background: '#fff', borderRadius: '16px' }}>
                                        <div className="d-flex justify-content-between align-items-start mb-3">
                                            <div className="p-3 bg-light rounded-circle text-primary">
                                                <ClipboardList size={24} />
                                            </div>
                                            <span className={`badge ${jd.status === 'Active' ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'}`}>
                                                {jd.status}
                                            </span>
                                        </div>
                                        <h5 className="fw-bold text-dark mb-1">{jd.title}</h5>
                                        <p className="text-muted small mb-4">{jd.role}</p>

                                        <div className="mt-auto d-flex flex-column gap-2">
                                            <button
                                                className="btn btn-outline-primary fw-bold w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                                                onClick={() => openFormBuilder(jd)}
                                            >
                                                <PencilLine size={16} /> Customize Form
                                            </button>
                                            <button
                                                className="btn btn-light text-muted w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                                                onClick={() => copyLink(jd._id)}
                                            >
                                                <Copy size={16} /> Copy Link
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {jds.length === 0 && (
                                <div className="col-12 text-center p-5 text-muted">
                                    No job roles defined. Switch to the "Job Roles" tab to create one first.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* SEPARATE FORM BUILDER MODAL */}
                {showFormBuilder && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                        <div className="bg-white rounded-lg shadow-xl p-6 w-100 max-w-4xl" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
                            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                                <div>
                                    <h3 className="h4 mb-1 text-dark fw-bold">Application Form Builder</h3>
                                    <p className="text-muted small mb-0">Configure standard and custom fields for candidate applications.</p>
                                </div>
                                <button className="btn btn-light rounded-circle p-2" onClick={closeFormBuilder}>
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Job Selection Dropdown */}
                            <div className="mb-4 bg-light p-3 rounded">
                                <label className="fw-bold mb-2">Select Job Role to Configure <span className="text-danger">*</span></label>
                                <select
                                    className="form-select form-select-lg border-secondary"
                                    value={modalSelectedJobId}
                                    onChange={handleModalJobChange}
                                >
                                    <option value="">-- Choose a Job Role --</option>
                                    {jds.map(jd => (
                                        <option key={jd._id} value={jd._id}>{jd.title} ({jd.role})</option>
                                    ))}
                                </select>
                                <div className="form-text">Note: Custom fields saved here will appear only for the selected job.</div>
                            </div>

                            {generatedLink ? (
                                <div className="alert alert-success d-flex flex-column align-items-center mb-4 text-center p-4" style={{ background: '#ecfdf5', borderColor: '#d1fae5' }}>
                                    <CheckCircle2 size={48} className="text-success mb-3" />
                                    <h4 className="fw-bold text-success mb-2">Form Saved & Link Generated!</h4>
                                    <p className="text-muted mb-4">You can now share this URL with candidates.</p>

                                    <div className="d-flex align-items-center gap-2 bg-white border rounded p-2 w-100" style={{ maxWidth: 500 }}>
                                        <LinkIcon size={16} className="text-muted" />
                                        <input className="form-control border-0 bg-transparent shadow-none" readOnly value={generatedLink} />
                                        <button className="btn btn-sm btn-primary" onClick={() => copyLink(modalSelectedJobId)}>
                                            Copy Link
                                        </button>
                                    </div>
                                    <button className="btn btn-link mt-3 text-muted" onClick={() => setGeneratedLink("")}>Continue Editing</button>
                                </div>
                            ) : (
                                <div>
                                    {/* STANDARD FIELDS PREVIEW */}
                                    <div className="mb-5">
                                        <h5 className="fw-bold mb-3 border-bottom pb-2">Standard Fields (Always Included)</h5>
                                        <div className="row g-3 opacity-75">
                                            {['Full Name', 'Email Address', 'Address', 'Phone Number', 'Current Location', 'Applying For (Role)', 'Experience (Years)', 'LinkedIn Profile', 'Expected CTC', 'Current CTC', 'Resume Upload', 'Comments'].map(f => (
                                                <div className="col-md-6 col-lg-4" key={f}>
                                                    <div className="p-2 border rounded bg-light text-muted d-flex align-items-center gap-2">
                                                        <CheckCircle2 size={16} className="text-success" /> {f}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                        <h5 className="fw-bold mb-0">Custom Questions / Fields</h5>
                                        <button type="button" onClick={addCustomField} className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2">
                                            <PlusCircle size={14} /> Add New Field
                                        </button>
                                    </div>

                                    {formBuilderFields.length === 0 && (
                                        <div className="text-center p-5 bg-light rounded border border-dashed text-muted mb-4">
                                            <ClipboardList size={32} className="mb-2 opacity-50" />
                                            <p>No custom fields added yet.</p>
                                            <p className="small">Click "Add New Field" to ask specific questions (e.g. Portfolio Link, Expected CTC).</p>
                                        </div>
                                    )}

                                    <div className="d-flex flex-column gap-3 mb-4">
                                        {formBuilderFields.map((field, idx) => (
                                            <div key={idx} className="card p-3 shadow-sm border-0 bg-light">
                                                <div className="row g-2 align-items-center">
                                                    <div className="col-md-4">
                                                        <label className="small text-muted mb-1">Field Questions</label>
                                                        <input className="form-control" placeholder="e.g. GitHub Profile URL"
                                                            value={field.label} onChange={e => updateCustomField(idx, 'label', e.target.value)} />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="small text-muted mb-1">Input Type</label>
                                                        <select className="form-select" value={field.type} onChange={e => updateCustomField(idx, 'type', e.target.value)}>
                                                            <option value="text">Short Text</option>
                                                            <option value="number">Number</option>
                                                            <option value="textarea">Long Description</option>
                                                            <option value="dropdown">Dropdown Selection</option>
                                                            <option value="file">File Upload</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <label className="small text-muted mb-1">Validation</label>
                                                        <div className="form-check pt-1">
                                                            <input className="form-check-input" type="checkbox" checked={field.required}
                                                                onChange={e => updateCustomField(idx, 'required', e.target.checked)}
                                                                id={`req-${idx}`} />
                                                            <label className="form-check-label" htmlFor={`req-${idx}`}>Required</label>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-1 d-flex align-items-end">
                                                        <button type="button" className="btn btn-light text-danger hover-bg-danger" onClick={() => removeCustomField(idx)} title="Remove Field">
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                                {field.type === 'dropdown' && (
                                                    <div className="mt-2">
                                                        <label className="small text-muted mb-1">Dropdown Options</label>
                                                        <input className="form-control" placeholder="Option 1, Option 2, Option 3"
                                                            value={field.options.join(', ')}
                                                            onChange={e => updateCustomField(idx, 'options', e.target.value.split(','))} />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="d-flex justify-content-end gap-3 border-top pt-3">
                                        <button className="btn btn-light" onClick={closeFormBuilder}>Cancel</button>
                                        <button className="btn btn-primary d-flex align-items-center gap-2"
                                            onClick={handleSaveForm} disabled={isLoading}>
                                            {isLoading ? 'Saving...' : 'Save & Generate Form Link'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
