import { GLOBAL_POPS, MAX_PAGE } from "../config.js";
import { escapeHtml, parseBoundedInt } from "../http.js";

function countryFlag(code) {
  if (!code || code.length !== 2) return "🌐";
  const offset = 127397;
  return String.fromCodePoint(...code.toUpperCase().split("").map(char => char.charCodeAt(0) + offset));
}

function formatLocation(row) {
  if (!row?.colo && !row?.country) return "—";
  let country = row.country;
  let city = row.city;
  const pop = GLOBAL_POPS.find(item => item.colo === row.colo);
  if (pop && (city === "Edge" || !city || country === "XX" || (row.colo === "SIN" && country === "US"))) {
    city = pop.city;
    country = pop.country;
  }
  return `${countryFlag(country)} ${city || country || ""}${row.colo ? ` (${row.colo})` : ""}`;
}

function toHKT(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const hkt = new Date(date.getTime() + 8 * 3600000);
  const pad = number => String(number).padStart(2, "0");
  return `${pad(hkt.getUTCMonth() + 1)}-${pad(hkt.getUTCDate())} ${pad(hkt.getUTCHours())}:${pad(hkt.getUTCMinutes())}:${pad(hkt.getUTCSeconds())}`;
}

function renderPagination(serviceKey, page, totalPages, totalCount) {
  if (!totalCount) return "";
  const current = parseBoundedInt(page, 1, 1, MAX_PAGE);
  const total = parseBoundedInt(totalPages, 1, 1, MAX_PAGE);
  const visible = [...new Set([1, current - 1, current, current + 1, total])]
    .filter(value => value >= 1 && value <= total)
    .sort((left, right) => left - right);

  let pages = "";
  let previous = 0;
  for (const value of visible) {
    if (previous && value - previous > 1) pages += '<span class="page-ellipsis">…</span>';
    const active = value === current ? " active" : "";
    pages += `<a href="javascript:void(0)" class="page-num${active}" data-page="${value}">${value}</a>`;
    previous = value;
  }

  const previousLink = current > 1
    ? `data-page="${current - 1}"`
    : 'tabindex="-1" aria-disabled="true"';
  const nextLink = current < total
    ? `data-page="${current + 1}"`
    : 'tabindex="-1" aria-disabled="true"';
  return `<div class="pagination">
    <div class="pagination-info">第 <span class="cur-page">${current}</span> / <span class="total-pages">${total}</span> 页 <span class="total-count">（共 ${totalCount} 条）</span></div>
    <div class="pagination-controls">
      <a href="javascript:void(0)" class="page-btn${current > 1 ? "" : " disabled"}" ${previousLink}>上一页</a>
      <div class="page-numbers">${pages}</div>
      <a href="javascript:void(0)" class="page-btn${current < total ? "" : " disabled"}" ${nextLink}>下一页</a>
    </div>
  </div>`;
}

export function renderServiceTable(serviceKey, title, data) {
  const count = data?.count ?? 0;
  const rows = data?.rows || [];
  const page = data?.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const body = data?.ok === false
    ? `<tr><td colspan="4" class="empty">Unable to load data (${escapeHtml(data.error || "upstream_error")})</td></tr>`
    : rows.length === 0
      ? '<tr><td colspan="4" class="empty">No records yet</td></tr>'
      : rows.map(row => {
          const ok = row.status === "SUCCESS";
          return `<tr>
            <td class="col-time">${escapeHtml(toHKT(row.ping_time))}</td>
            <td class="col-status"><div class="status-badge"><span class="status-dot ${ok ? "ok" : "fail"}"></span><span class="status-text">${ok ? "Success" : "Failed"}</span></div></td>
            <td class="col-loc">${escapeHtml(formatLocation(row))}</td>
            <td class="col-ip"><code>${escapeHtml(row.ip || "—")}</code></td>
          </tr>`;
        }).join("");

  return `<div class="card" id="card-${escapeHtml(serviceKey)}">
    <div class="card-head">
      <h2 class="card-title">${escapeHtml(title)}</h2>
      <span class="card-badge" id="badge-${escapeHtml(serviceKey)}">${escapeHtml(count)} pings</span>
    </div>
    <div class="table-container"><table>
      <thead><tr><th class="col-time">Timestamp (HKT)</th><th class="col-status">Status</th><th class="col-loc">Location</th><th class="col-ip">IP Address</th></tr></thead>
      <tbody id="tbody-${escapeHtml(serviceKey)}">${body}</tbody>
    </table></div>
    <div class="card-footer" id="footer-${escapeHtml(serviceKey)}">${renderPagination(serviceKey, page, totalPages, count)}</div>
  </div>`;
}
