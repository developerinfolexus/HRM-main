import React from "react";
import { FaBuilding, FaUsers, FaProjectDiagram, FaChartPie } from "react-icons/fa";

const glass = {
    background: "#ffffff",
    borderRadius: 24,
    border: "1px solid #E6C7E6",
    padding: 24,
    boxShadow: "0 10px 30px -10px rgba(102, 51, 153, 0.1)",
};

export default function DivisionAllocation() {
    const divisions = [
        { name: "Engineering", capacity: 85, projects: 12, employees: 45, color: "#663399" },
        { name: "Product Design", capacity: 60, projects: 5, employees: 18, color: "#ec4899" },
        { name: "Marketing", capacity: 45, projects: 3, employees: 12, color: "#f59e0b" },
        { name: "Sales", capacity: 50, projects: 4, employees: 20, color: "#10b981" },
        { name: "Operations", capacity: 30, projects: 2, employees: 8, color: "#3b82f6" },
    ];

    return (
        <div style={glass} className="shadow-sm">
            <div className="d-flex align-items-center gap-3 mb-5">
                <div className="p-2 rounded-xl" style={{ backgroundColor: '#E6C7E6', color: '#663399' }}>
                    <FaBuilding size={20} />
                </div>
                <div>
                    <h5 className="fw-bold m-0" style={{ color: '#2E1A47' }}>Division Resource Allocation</h5>
                    <p className="m-0 small text-muted">Real-time resource distribution across organizational verticals</p>
                </div>
            </div>

            <div className="row g-4">
                {/* Left Col: list */}
                <div className="col-lg-7">
                    <div className="d-flex flex-column gap-3">
                        {divisions.map((div, i) => (
                            <div key={i} className="p-3 rounded-4 border transition-hover" style={{ backgroundColor: '#ffffff', borderColor: '#f1f5f9' }}>
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div className="d-flex align-items-center gap-2">
                                        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: div.color }}></div>
                                        <span className="fw-bold" style={{ color: '#2E1A47' }}>{div.name}</span>
                                    </div>
                                    <span className="fw-bold small" style={{ color: div.color }}>{div.capacity}% Utilized</span>
                                </div>

                                <div className="progress mb-3" style={{ height: 8, borderRadius: 10, backgroundColor: 'rgba(241, 245, 249, 1)' }}>
                                    <div
                                        className="progress-bar"
                                        role="progressbar"
                                        style={{ width: `${div.capacity}%`, backgroundColor: div.color, borderRadius: 10 }}
                                    ></div>
                                </div>

                                <div className="d-flex gap-4">
                                    <div className="d-flex align-items-center gap-2 small text-muted">
                                        <FaProjectDiagram size={12} />
                                        <span>{div.projects} Projects</span>
                                    </div>
                                    <div className="d-flex align-items-center gap-2 small text-muted">
                                        <FaUsers size={12} />
                                        <span>{div.employees} Employees</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Col: Summary */}
                <div className="col-lg-5">
                    <div className="p-4 rounded-4" style={{ backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1' }}>
                        <h6 className="fw-bold mb-4 d-flex align-items-center gap-2" style={{ color: '#2E1A47' }}>
                            <FaChartPie /> Allocation Summary
                        </h6>

                        <div className="d-flex justify-content-between align-items-center mb-4 pb-4 border-bottom">
                            <div>
                                <div className="small text-muted mb-1">Total Active Projects</div>
                                <div className="h3 fw-bold m-0" style={{ color: '#663399' }}>26</div>
                            </div>
                            <div className="text-end">
                                <div className="small text-muted mb-1">Total Manpower</div>
                                <div className="h3 fw-bold m-0" style={{ color: '#2E1A47' }}>103</div>
                            </div>
                        </div>

                        <div className="alert custom-alert p-3 rounded-3" style={{ backgroundColor: '#eef2ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
                            <strong>Insight:</strong> Engineering division is approaching max capacity (85%). Consider reallocating tickets or hiring contract support.
                        </div>

                        <button className="btn w-100 mt-2 fw-bold py-2" style={{ backgroundColor: '#ffffff', color: '#663399', border: '1px solid #E6C7E6', borderRadius: 12 }}>
                            Generate Capacity Report
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        .transition-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
          border-color: #E6C7E6 !important;
          transition: all 0.3s ease;
        }
      `}</style>
        </div>
    );
}
