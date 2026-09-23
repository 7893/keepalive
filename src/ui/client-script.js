import { GLOBAL_POPS } from "../config.js";

const POP_MAP = Object.fromEntries(
  GLOBAL_POPS.map(({ colo, city, country }) => [colo, { city, country }])
);

export const CLIENT_SCRIPT = String.raw`
async function goToPage(serviceKey, targetPage) {
  const tbody = document.getElementById('tbody-' + serviceKey);
  const footer = document.getElementById('footer-' + serviceKey);
  if (!tbody || !footer) return;

  tbody.classList.add('table-loading');
  try {
    const response = await fetch('/api/data?service=' + encodeURIComponent(serviceKey) + '&page=' + targetPage);
    if (!response.ok) throw new Error('Network error');
    const data = await response.json();
    tbody.innerHTML = renderClientRows(data.rows);

    const badge = document.getElementById('badge-' + serviceKey);
    if (badge && data.count !== undefined) badge.textContent = data.count + ' pings';
    if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
    footer.innerHTML = renderClientPagination(data.page, data.totalPages, data.count);
  } catch (error) {
    console.error(error);
    alert('加载第 ' + targetPage + ' 页数据失败，请重试');
  } finally {
    tbody.classList.remove('table-loading');
  }
}

function clientFlag(code) {
  if (!code || code.length !== 2) return '🌐';
  return String.fromCodePoint(...code.toUpperCase().split('').map(char => char.charCodeAt(0) + 127397));
}

function escapeClientHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, char => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]
  ));
}

const POP_MAP = ${JSON.stringify(POP_MAP)};

function clientLocation(row) {
  if (!row || (!row.colo && !row.country)) return '—';
  let country = row.country;
  let city = row.city;
  if (city === 'Edge' || !city || country === 'XX' || (row.colo === 'SIN' && country === 'US')) {
    if (POP_MAP[row.colo]) {
      city = POP_MAP[row.colo].city;
      country = POP_MAP[row.colo].country;
    }
  }
  return clientFlag(country) + ' ' + (city || country || '') + (row.colo ? ' (' + row.colo + ')' : '');
}

function clientHKT(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  const hkt = new Date(date.getTime() + 8 * 3600000);
  const pad = number => String(number).padStart(2, '0');
  return pad(hkt.getUTCMonth() + 1) + '-' + pad(hkt.getUTCDate()) + ' ' + pad(hkt.getUTCHours()) + ':' + pad(hkt.getUTCMinutes()) + ':' + pad(hkt.getUTCSeconds());
}

function renderClientRows(rows) {
  if (!rows || rows.length === 0) return '<tr><td colspan="4" class="empty">No records yet</td></tr>';
  return rows.map(row => {
    const ok = row.status === 'SUCCESS';
    return '<tr>' +
      '<td class="col-time">' + escapeClientHtml(clientHKT(row.ping_time)) + '</td>' +
      '<td class="col-status"><div class="status-badge"><span class="status-dot ' + (ok ? 'ok' : 'fail') + '"></span><span class="status-text">' + (ok ? 'Success' : 'Failed') + '</span></div></td>' +
      '<td class="col-loc">' + escapeClientHtml(clientLocation(row)) + '</td>' +
      '<td class="col-ip"><code>' + escapeClientHtml(row.ip || '—') + '</code></td>' +
    '</tr>';
  }).join('');
}

function renderClientPagination(page, totalPages, totalCount) {
  if (!totalCount) return '';
  const current = Math.min(10000, Math.max(1, parseInt(page) || 1));
  const total = Math.min(10000, Math.max(1, parseInt(totalPages) || 1));
  const visible = Array.from(new Set([1, current - 1, current, current + 1, total]))
    .filter(value => value >= 1 && value <= total)
    .sort((left, right) => left - right);

  let pages = '';
  let previous = 0;
  for (const value of visible) {
    if (previous && value - previous > 1) pages += '<span class="page-ellipsis">…</span>';
    pages += '<a href="javascript:void(0)" class="page-num' + (value === current ? ' active' : '') + '" data-page="' + value + '">' + value + '</a>';
    previous = value;
  }
  return '<div class="pagination">' +
    '<div class="pagination-info">第 <span class="cur-page">' + current + '</span> / <span class="total-pages">' + total + '</span> 页 <span class="total-count">（共 ' + totalCount + ' 条）</span></div>' +
    '<div class="pagination-controls">' +
      '<a href="javascript:void(0)" class="page-btn' + (current > 1 ? '' : ' disabled') + '" ' + (current > 1 ? 'data-page="' + (current - 1) + '"' : 'tabindex="-1" aria-disabled="true"') + '>上一页</a>' +
      '<div class="page-numbers">' + pages + '</div>' +
      '<a href="javascript:void(0)" class="page-btn' + (current < total ? '' : ' disabled') + '" ' + (current < total ? 'data-page="' + (current + 1) + '"' : 'tabindex="-1" aria-disabled="true"') + '>下一页</a>' +
    '</div></div>';
}

document.addEventListener('click', event => {
  const button = event.target.closest('.page-btn, .page-num');
  if (!button || button.classList.contains('disabled') || button.classList.contains('active')) return;
  const card = button.closest('.card');
  const targetPage = parseInt(button.getAttribute('data-page'));
  if (!card || Number.isNaN(targetPage)) return;
  event.preventDefault();
  goToPage(card.id.replace('card-', ''), targetPage);
});

if (window.location.search) window.history.replaceState(null, '', window.location.pathname);
`;
