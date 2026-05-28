import React from "react";
import { FaChartLine, FaExclamationTriangle, FaShieldAlt, FaMoneyBillWave } from "react-icons/fa";

const glass = {
  background: "#ffffff",
  borderRadius: 24,
  border: "1px solid #E6C7E6",
  padding: 30,
  boxShadow: "0 10px 30px -10px rgba(102, 51, 153, 0.1)",
};

const CardMetric = ({ title, value, sub, icon: Icon, color, bg }) => (
  <div className="p-4 rounded-4 d-flex flex-column gap-2" style={{ backgroundColor: bg, border: `1px solid ${color}30` }}>
    <div className="d-flex justify-content-between align-items-start">
      <span className="fw-bold" style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase' }}>{title}</span>
      <div className="p-2 rounded-3" style={{ backgroundColor: '#ffffff', color: color }}>
        <Icon size={18} />
      </div>
    </div>
    <div className="h2 fw-bold m-0" style={{ color: '#2E1A47' }}>{value}</div>
    <div className="small fw-medium" style={{ color: color }}>{sub}</div>
  </div>
);

export default function StrategicOverview() {
  const risks = [
    { id: 1, title: "Budget Variance - Mobile App", severity: "High", desc: "Development costs exceeding projections by 15% due to scope creep." },
    { id: 2, title: "Resource Shortage - Q3", severity: "Medium", desc: "Need 2 more Senior Backend devs for upcoming infrastructure migration." },
  ];

  return (
    <div style={glass} className="shadow-sm">
      <div className="d-flex justify-content-between align-items-end mb-5">
        <div>
          <h4 className="fw-bold m-0" style={{ color: '#2E1A47' }}>Strategic Portfolio Overview</h4>
          <div className="small fw-medium" style={{ color: '#A3779D' }}>High-level health metrics and risk assessment</div>
        </div>
        <button className="btn btn-sm px-4 py-2 fw-bold" style={{ backgroundColor: '#663399', color: '#ffffff', borderRadius: '12px' }}>Download Executive Report</button>
      </div>

      {/* Metrics Row */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <CardMetric
            title="Total Portfolio Value"
            value="$1,250,000"
            sub="+12% vs last quarter"
            icon={FaMoneyBillWave}
            color="#059669"
            bg="#ecfdf5"
          />
        </div>
        <div className="col-md-4">
          <CardMetric
            title="Overall Health Score"
            value="88/100"
            sub="Stable condition"
            icon={FaChartLine}
            color="#3b82f6"
            bg="#eff6ff"
          />
        </div>
        <div className="col-md-4">
          <CardMetric
            title="Aggregate Risk Index"
            value="Low-Med"
            sub="2 Active Risks Identified"
            icon={FaShieldAlt}
            color="#d97706"
            bg="#fffbeb"
          />
        </div>
      </div>

      {/* Risk Assessment */}
      <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#2E1A47' }}>
        <FaExclamationTriangle className="text-danger" /> Critical Risk Assessment
      </h6>
      <div className="d-flex flex-column gap-3">
        {risks.map(r => (
          <div key={r.id} className="p-3 rounded-3 d-flex justify-content-between align-items-center border-start border-5"
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #f1f5f9',
              borderLeftColor: r.severity === 'High' ? '#ef4444' : '#f59e0b',
              boxShadow: '0 4px 6px -4px rgba(0,0,0,0.05)'
            }}>
            <div>
              <div className="fw-bold fs-6" style={{ color: '#334155' }}>{r.title}</div>
              <div className="small text-muted">{r.desc}</div>
            </div>
            <span className={`badge px-3 py-2 rounded-pill`} style={{
              backgroundColor: r.severity === 'High' ? '#fef2f2' : '#fffbeb',
              color: r.severity === 'High' ? '#dc2626' : '#b45309',
              fontSize: '11px', fontWeight: 700
            }}>
              {r.severity.toUpperCase()} PRIORITY
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
