import React, { useState } from "react";
import ProjectForm from "./ProjectForm";
import { FaUserCircle, FaBatteryThreeQuarters, FaBatteryQuarter, FaBriefcase } from "react-icons/fa";

const glass = {
  background: "#ffffff",
  borderRadius: 24,
  border: "1px solid #E6C7E6",
  padding: 24,
  boxShadow: "0 10px 30px -10px rgba(102, 51, 153, 0.1)",
};

export default function ResourceStatus() {
  const [resources, setResources] = useState([
    { id: 1, name: "Anita Sharma", role: "Senior Architect", project: "Strategic Website", load: 95, status: "Active" },
    { id: 2, name: "John Doe", role: "Frontend Lead", project: "Main App Refactor", load: 80, status: "Active" },
    { id: 3, name: "Emily Clark", role: "UI Designer", project: "Marketing Assets", load: 60, status: "Active" },
    { id: 4, name: "Rajesh Kumar", role: "Backend Dev", project: "--", load: 0, status: "Bench" },
    { id: 5, name: "Sophie Turner", role: "QA Engineer", project: "--", load: 5, status: "Bench" },
  ]);

  return (
    <div style={glass} className="shadow-sm">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div className="d-flex align-items-center gap-2">
          <div style={{ width: 4, height: 20, backgroundColor: '#663399', borderRadius: 4 }}></div>
          <h5 className="fw-bold m-0" style={{ color: '#2E1A47' }}>Human Resource Status Registry</h5>
        </div>
        <div className="d-flex gap-2">
          <span className="badge px-3 py-2 rounded-pill d-flex align-items-center gap-2" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }}></div> Active: 18
          </span>
          <span className="badge px-3 py-2 rounded-pill d-flex align-items-center gap-2" style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626' }}></div> Bench: 3
          </span>
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead>
            <tr style={{ backgroundColor: '#f8fafc' }}>
              <th className="px-4 py-3 border-0" style={{ color: '#663399', fontSize: '0.85rem', fontWeight: 600, borderRadius: '12px 0 0 12px' }}>Employee</th>
              <th className="px-4 py-3 border-0" style={{ color: '#663399', fontSize: '0.85rem', fontWeight: 600 }}>Role</th>
              <th className="px-4 py-3 border-0" style={{ color: '#663399', fontSize: '0.85rem', fontWeight: 600 }}>Current Assignment</th>
              <th className="px-4 py-3 border-0" style={{ color: '#663399', fontSize: '0.85rem', fontWeight: 600 }}>Workload</th>
              <th className="px-4 py-3 border-0 text-end" style={{ color: '#663399', fontSize: '0.85rem', fontWeight: 600, borderRadius: '0 12px 12px 0' }}>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr style={{ height: '12px' }}></tr>
            {resources.map((r) => (
              <tr key={r.id} className="border-bottom-hover">
                <td className="px-4 py-3 fw-bold" style={{ color: '#2E1A47' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="d-flex justify-content-center align-items-center rounded-circle" style={{ width: 32, height: 32, backgroundColor: '#E6C7E6', color: '#663399' }}>
                      <FaUserCircle size={18} />
                    </div>
                    {r.name}
                  </div>
                </td>
                <td className="px-4 py-3" style={{ color: '#64748b' }}>{r.role}</td>
                <td className="px-4 py-3" style={{ color: '#663399' }}>
                  <div className="d-flex align-items-center gap-2">
                    <FaBriefcase className="opacity-50" /> {r.project}
                  </div>
                </td>
                <td className="px-4 py-3" style={{ width: '200px' }}>
                  <div className="d-flex align-items-center gap-2">
                    <div className="progress flex-grow-1" style={{ height: 6, borderRadius: 10, backgroundColor: '#f1f5f9' }}>
                      <div
                        className="progress-bar"
                        style={{
                          width: `${r.load}%`,
                          backgroundColor: r.load > 85 ? "#dc2626" : r.load < 20 ? "#94a3b8" : "#16a34a",
                          borderRadius: 10
                        }}
                      ></div>
                    </div>
                    <span className="small fw-bold" style={{ color: '#64748b' }}>{r.load}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-end">
                  <span className={`badge px-3 py-1 rounded-pill`} style={{
                    backgroundColor: r.status === 'Active' ? '#f0fdf4' : '#fff1f2',
                    color: r.status === 'Active' ? '#16a34a' : '#e11d48',
                    fontSize: '11px', fontWeight: 700
                  }}>
                    {r.status.toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <style>{`
        .border-bottom-hover:hover { background-color: #fdfbff !important; transition: all 0.2s ease; }
      `}</style>
    </div>
  );
}
