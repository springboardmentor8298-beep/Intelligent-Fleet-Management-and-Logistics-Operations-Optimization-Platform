import React, { useState } from 'react';

export default function AnalyticsPage() {
  const [exporting, setExporting] = useState(false);

  const handleExport = (format) => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      alert(`Export generated successfully: FleetFlow_Logistics_Report_${new Date().toISOString().split('T')[0]}.${format.toLowerCase()}`);
    }, 1200);
  };

  return (
    <div style={analyticsStyles.page}>
      <div style={analyticsStyles.headerRow}>
        <div>
          <div style={analyticsStyles.subtitle}>ANALYTICS & EXECUTIVE REPORTS</div>
          <h1 style={analyticsStyles.title}>Logistics Operations Analytics & Export</h1>
          <p style={analyticsStyles.desc}>
            Fleet utilization indices, dynamic fuel burn rates, on-time delivery efficiency, and executive reporting.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => handleExport('PDF')} disabled={exporting} style={analyticsStyles.exportPdfBtn}>
            📄 {exporting ? 'Generating...' : 'Export PDF Report'}
          </button>
          <button onClick={() => handleExport('XLSX')} disabled={exporting} style={analyticsStyles.exportExcelBtn}>
            📊 {exporting ? 'Exporting...' : 'Export Excel Data'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={analyticsStyles.kpiGrid}>
        <div style={analyticsStyles.kpiCard}>
          <div style={analyticsStyles.kpiLabel}>On-Time Delivery Rate</div>
          <div style={{ ...analyticsStyles.kpiVal, color: '#34d399' }}>96.8%</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>+2.4% vs last month</div>
        </div>
        <div style={analyticsStyles.kpiCard}>
          <div style={analyticsStyles.kpiLabel}>Avg Fleet Fuel Efficiency</div>
          <div style={{ ...analyticsStyles.kpiVal, color: '#38bdf8' }}>0.26 <span style={{ fontSize: '14px', color: '#64748b' }}>L/km</span></div>
          <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>Optimized via Eco-Routing</div>
        </div>
        <div style={analyticsStyles.kpiCard}>
          <div style={analyticsStyles.kpiLabel}>Average Transit Duration</div>
          <div style={{ ...analyticsStyles.kpiVal, color: '#fbbf24' }}>42.5 <span style={{ fontSize: '14px', color: '#64748b' }}>min</span></div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Traffic avoidance enabled</div>
        </div>
        <div style={analyticsStyles.kpiCard}>
          <div style={analyticsStyles.kpiLabel}>Incident & Delay Rate</div>
          <div style={{ ...analyticsStyles.kpiVal, color: '#f87171' }}>1.2%</div>
          <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>Lowest in commercial sector</div>
        </div>
      </div>

      {/* Analytics Breakdown Visuals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {/* Utilization Breakdown */}
        <div style={analyticsStyles.card}>
          <h3 style={analyticsStyles.cardTitle}>Fleet Utilization Distribution</h3>
          <p style={analyticsStyles.cardSub}>Operational allocation across vehicle asset categories</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
            {[
              { label: 'Heavy Haul Trucks', pct: 82, color: '#38bdf8' },
              { label: 'Delivery Vans (Urban)', pct: 94, color: '#34d399' },
              { label: 'Container Trailers', pct: 68, color: '#818cf8' },
              { label: 'Refrigerated Cold Chain', pct: 75, color: '#fbbf24' }
            ].map(item => (
              <div key={item.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ color: '#cbd5e1' }}>{item.label}</span>
                  <span style={{ color: item.color, fontWeight: '700', fontFamily: 'JetBrains Mono' }}>{item.pct}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${item.pct}%`, height: '100%', background: item.color, borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Route Optimization Savings */}
        <div style={analyticsStyles.card}>
          <h3 style={analyticsStyles.cardTitle}>Algorithmic Optimization Gains</h3>
          <p style={analyticsStyles.cardSub}>Mileage, emissions, and cost savings compared to non-optimized dispatch</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '20px' }}>
            <div style={analyticsStyles.gainBox}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Fuel Saved This Month</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#34d399', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>2,480 L</div>
              <div style={{ fontSize: '11px', color: '#34d399', marginTop: '4px' }}>~$4,210 cost reduction</div>
            </div>
            <div style={analyticsStyles.gainBox}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Transit Hours Cut</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#38bdf8', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>340 hrs</div>
              <div style={{ fontSize: '11px', color: '#38bdf8', marginTop: '4px' }}>Dynamic congestion bypass</div>
            </div>
            <div style={analyticsStyles.gainBox}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>CO2 Carbon Offset</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#fbbf24', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>6.4 Tons</div>
              <div style={{ fontSize: '11px', color: '#fbbf24', marginTop: '4px' }}>Green Fleet initiative</div>
            </div>
            <div style={analyticsStyles.gainBox}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Fleet Availability</div>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#f8fafc', marginTop: '4px', fontFamily: 'JetBrains Mono' }}>99.2%</div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>High operational uptime</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const analyticsStyles = {
  page: { maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '24px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' },
  subtitle: { fontSize: '11px', fontWeight: '800', color: '#c084fc', letterSpacing: '1px', marginBottom: '4px' },
  title: { margin: 0, fontSize: '26px', fontWeight: '800', color: '#f8fafc' },
  desc: { margin: '6px 0 0 0', fontSize: '13px', color: '#94a3b8' },
  exportPdfBtn: { background: '#162030', color: '#f87171', border: '1px solid rgba(248, 113, 113, 0.4)', padding: '10px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  exportExcelBtn: { background: '#162030', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.4)', padding: '10px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' },
  kpiCard: { background: '#0d131f', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' },
  kpiLabel: { fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  kpiVal: { fontSize: '28px', fontWeight: '800', color: '#f8fafc', marginTop: '4px', fontFamily: 'JetBrains Mono' },
  card: { background: '#0d131f', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' },
  cardTitle: { margin: 0, fontSize: '16px', fontWeight: '700', color: '#f8fafc' },
  cardSub: { margin: '4px 0 0 0', fontSize: '12px', color: '#94a3b8' },
  gainBox: { background: '#070a0f', border: '1px solid #1e293b', padding: '16px', borderRadius: '10px' }
};
