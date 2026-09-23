export const STYLES = String.raw`
:root {
  --bg: #f9fafb;
  --card-bg: #ffffff;
  --text-main: #111827;
  --text-muted: #6b7280;
  --border: #e5e7eb;
  --accent: #3b82f6;
  --ok: #10b981;
  --fail: #ef4444;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: var(--bg);
  color: var(--text-main);
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  padding: 48px 20px;
}

.page { max-width: 800px; margin: 0 auto; }

.header {
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.header h1 {
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.02em;
}

.system-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: #dcfce7;
  color: #166534;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.system-status .pulse {
  width: 6px;
  height: 6px;
  background-color: #16a34a;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0.4); }
  70% { box-shadow: 0 0 0 4px rgba(22, 163, 74, 0); }
  100% { box-shadow: 0 0 0 0 rgba(22, 163, 74, 0); }
}

.card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  margin-bottom: 24px;
  overflow: hidden;
}

.card-head {
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f9fafb;
}

.card-title { font-size: 14px; font-weight: 600; }

.card-badge {
  font-size: 12px;
  color: var(--text-muted);
  background: var(--card-bg);
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid var(--border);
}

.table-container { overflow-x: auto; }

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th, td {
  padding: 12px 20px;
  font-size: 13px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

th {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  background: #ffffff;
}

tr:last-child td { border-bottom: none; }
tbody tr:hover { background-color: #f9fafb; }

.col-time { width: 140px; color: var(--text-muted); }
.col-status { width: 100px; }
.col-loc { width: 180px; }
.col-ip { width: auto; }

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-dot.ok { background: var(--ok); box-shadow: 0 0 4px rgba(16, 185, 129, 0.4); }
.status-dot.fail { background: var(--fail); box-shadow: 0 0 4px rgba(239, 68, 68, 0.4); }

.status-text {
  font-size: 12px;
  color: var(--text-main);
  font-weight: 500;
}

.col-ip code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
}

.empty {
  text-align: center;
  padding: 32px;
  color: var(--text-muted);
  font-style: italic;
}

.card-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  background: #fafafa;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.pagination-info {
  font-size: 13px;
  color: var(--text-muted);
  font-weight: 400;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.page-numbers {
  display: flex;
  align-items: center;
  gap: 4px;
}

.page-btn, .page-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-main);
  background: #ffffff;
  border: 1px solid var(--border);
  border-radius: 6px;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
}

.page-num { padding: 0 8px; min-width: 28px; }

.page-btn:hover:not(.disabled), .page-num:hover:not(.active) {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.page-btn.disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
  background: #f9fafb;
}

.page-num.active {
  background: var(--text-main);
  color: #ffffff;
  border-color: var(--text-main);
  font-weight: 600;
}

.page-ellipsis {
  font-size: 12px;
  color: var(--text-muted);
  padding: 0 4px;
  user-select: none;
}

.table-loading {
  opacity: 0.4;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

@media (max-width: 640px) {
  body { padding: 24px 12px; }
  th, td { padding: 12px 14px; }
  .card-footer { padding: 10px 14px; }
  .page-numbers { display: none; }
  .pagination { justify-content: space-between; }
  .page-btn { padding: 0 8px; font-size: 11px; height: 28px; }
  .pagination-info { font-size: 11px; }
}
`;
