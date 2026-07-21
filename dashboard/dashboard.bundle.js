/* SmartAlert Round 4 — Executive Dashboard & Management Analytics
 * Build: 2026.07.22-round4-hotfix2-dense-layout-v1
 */
(function (window, document) {
  'use strict';

  const CONFIG = Object.freeze({
    API_BASE: 'https://smartalert.somchaibutphon.workers.dev',
    TOKEN_KEY: 'alertvendor_access_token_v2',
    LOGIN_URL: '../login.html',
    MODULE_URL: '../module.html?id=vendors',
    REFRESH_MS: 60000,
    API_TIMEOUT_MS: 120000,
    MAX_TABLE_ROWS: 8,
    MAX_ALERT_ROWS: 6,
    MAX_SEGMENT_SECONDS: 7 * 24 * 60 * 60,
    THAI_MONTHS: [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ]
  });

  const COLORS = Object.freeze({
    purple: '#8a5dd0', blue: '#3374dd', teal: '#17a591', green: '#2fac72',
    red: '#e04444', orange: '#ef8c22', slate: '#667987', navy: '#07506a',
    lightBlue: '#d9e8fb', grid: '#e6edf1', text: '#607587'
  });

  const STAGE_ORDER = [
    'WAITING_INBOUND_DOCUMENT', 'WAITING_RECEIVING', 'WAITING_DOCUMENT_RETURN',
    'WAITING_GATE_OUT', 'DATA_CONFLICT', 'COMPLETED', 'CANCELLED'
  ];

  const STAGE_LABELS = Object.freeze({
    WAITING_INBOUND_DOCUMENT: 'รอยื่นเอกสาร',
    WAITING_RECEIVING: 'รอรับสินค้า',
    WAITING_DOCUMENT_RETURN: 'รอคืนเอกสาร',
    WAITING_GATE_OUT: 'รอออกจากพื้นที่',
    DATA_CONFLICT: 'ข้อมูลต้องตรวจสอบ',
    COMPLETED: 'ปิดงานแล้ว',
    CANCELLED: 'ยกเลิก'
  });

  const PROFILE_LABELS = Object.freeze({
    FULL_INBOUND: 'เต็มขั้นตอน',
    FULL_INBOUND_LEGACY: 'เต็มขั้นตอน',
    SUBMIT_ONLY: 'เฉพาะยื่นเอกสาร',
    RETURN_ONLY: 'เฉพาะคืนเอกสาร',
    BYPASS_INBOUND: 'ข้าม Inbound'
  });

  const state = {
    moduleId: new URLSearchParams(window.location.search).get('id') || 'vendors',
    user: null,
    board: null,
    analytics: null,
    records: [],
    filtered: [],
    calendarMonth: null,
    selectedDate: null,
    charts: {},
    timer: null,
    loading: false,
    initialized: false
  };

  const byId = (id) => document.getElementById(id);
  const text = (value) => value === null || value === undefined ? '' : String(value).trim();
  const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  const escapeHtml = (value) => text(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');

  class APIError extends Error {
    constructor(message, code, status, details) {
      super(message || 'เกิดข้อผิดพลาดในการเรียกข้อมูล');
      this.name = 'APIError';
      this.code = code || 'API_ERROR';
      this.status = Number(status) || 0;
      this.details = details || null;
    }
  }

  function token() {
    try { return text(window.sessionStorage.getItem(CONFIG.TOKEN_KEY)); }
    catch (error) { return ''; }
  }

  function clearSession() {
    try {
      [CONFIG.TOKEN_KEY, 'alertvendor_access_token', 'alertvendor_access_token_v1']
        .forEach((key) => window.sessionStorage.removeItem(key));
    } catch (error) {}
  }

  async function apiGet(path, query) {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT_MS);
    const url = new URL(CONFIG.API_BASE.replace(/\/$/, '') + path);
    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
    const headers = new Headers({Accept: 'application/json'});
    if (token()) headers.set('Authorization', 'Bearer ' + token());

    try {
      const response = await fetch(url.toString(), {
        method: 'GET', headers, cache: 'no-store', credentials: 'omit', signal: controller.signal
      });
      const raw = await response.text();
      let payload;
      try { payload = JSON.parse(raw); }
      catch (error) { throw new APIError('API ส่งข้อมูลที่อ่านไม่ได้', 'INVALID_JSON', response.status); }
      if (!response.ok || payload.success !== true) {
        const apiError = payload.error || {};
        if (response.status === 401) clearSession();
        throw new APIError(apiError.message || 'ระบบตอบกลับไม่สำเร็จ', apiError.code, response.status, apiError.details);
      }
      return payload.data;
    } catch (error) {
      if (error && error.name === 'AbortError') {
        throw new APIError('ระบบใช้เวลาตอบกลับนานเกินกำหนด', 'REQUEST_TIMEOUT', 408);
      }
      if (error instanceof APIError) throw error;
      throw new APIError(
        window.navigator.onLine ? 'เชื่อมต่อ Worker ไม่สำเร็จ' : 'อุปกรณ์ไม่มีอินเทอร์เน็ต',
        'NETWORK_ERROR', 0
      );
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function apiMe() { return apiGet('/api/auth/me'); }
  function apiBoard(forceRefresh) {
    return apiGet('/api/modules/' + encodeURIComponent(state.moduleId) + '/operational-board', {
      limit: 3000,
      forceRefresh: forceRefresh === true ? 'true' : ''
    });
  }

  function parseDateTime(value) {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const valueText = text(value);
    const thai = valueText.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
    if (thai) {
      const parsed = new Date(`${thai[3]}-${thai[2]}-${thai[1]}T${thai[4]}:${thai[5]}:${thai[6] || '00'}+07:00`);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(valueText);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function isoDay(date) {
    const d = date instanceof Date ? date : new Date(date);
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(d).reduce((result, part) => {
      result[part.type] = part.value; return result;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  function monthKey(date) {
    const key = isoDay(date);
    return key.slice(0, 7);
  }

  function thaiDate(date) {
    return new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }).format(date instanceof Date ? date : new Date(date));
  }

  function shortThaiDate(dayKey) {
    const date = new Date(dayKey + 'T12:00:00+07:00');
    return new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric'
    }).format(date);
  }

  function timeOnly(value) {
    const date = parseDateTime(value);
    if (!date) return '-';
    return new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', hour12: false
    }).format(date);
  }

  function durationLabel(seconds) {
    const total = Math.max(0, Math.floor(number(seconds)));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (hours > 0) return `${hours} ชม. ${minutes} นาที`;
    return `${minutes} นาที`;
  }

  function setText(id, value) {
    const element = byId(id);
    if (element) element.textContent = value;
  }

  function setLoading(active) {
    state.loading = active;
    byId('dashboardLoading')?.classList.toggle('is-hidden', !active);
    if (byId('refreshButton')) byId('refreshButton').disabled = active;
  }

  function showError(error) {
    const message = error && error.message ? error.message : 'ไม่สามารถโหลด Dashboard ได้';
    window.Swal?.fire({
      icon: 'error', title: 'เปิด Dashboard ไม่สำเร็จ', text: message,
      confirmButtonText: 'ลองใหม่', showCancelButton: true, cancelButtonText: 'กลับหน้า Module'
    }).then((result) => {
      if (result.isConfirmed) loadDashboard(true);
      else if (result.dismiss) window.location.href = CONFIG.MODULE_URL;
    });
  }

  function fallbackAnalytics(board) {
    const records = Array.isArray(board && board.records) ? board.records.map((record) => ({
      canonicalRecordId: record.canonicalRecordId || record.recordId || '',
      autoId: record.autoId || record.sourceAutoId || '',
      appointmentNumber: record.appointmentNumber || '', companyName: record.companyName || '',
      vehicleRegistration: record.vehicleRegistration || '', driverName: '',
      gateInAt: record.timestampIn || '', gateInEpochMs: number(record.timestampInEpochMs),
      gateOutAt: record.timestampOut || '', gateOutEpochMs: number(record.timestampOutEpochMs, null),
      latestAt: record.statusStartedAt || record.timestampIn || '',
      latestEpochMs: number(record.statusStartedAtEpochMs || record.timestampInEpochMs),
      totalSeconds: Math.max(0, Math.floor((Date.now() - number(record.timestampInEpochMs)) / 1000)),
      isActive: true, isCompleted: false, isCancelled: false, cancelReason: '',
      stageCode: record.operationalStage || 'DATA_CONFLICT',
      stageLabel: record.operationalStageLabel || STAGE_LABELS[record.operationalStage] || '',
      statusCode: record.statusCode || 'INCOMPLETE', statusLabel: record.statusLabel || '',
      statusElapsedSeconds: number(record.statusElapsedSeconds),
      isOverdue: record.statusCode === 'OVERDUE', isWarning: record.statusCode === 'WARNING',
      isIncomplete: record.statusCode === 'INCOMPLETE' || record.dataConflict === true,
      profileCode: record.workflowProfileCode || 'FULL_INBOUND_LEGACY',
      profileLabel: PROFILE_LABELS[record.workflowProfileCode] || 'เต็มขั้นตอน',
      shiftCode: record.entryShiftCode || 'OUTSIDE_SHIFT', shiftName: record.entryShift?.name || 'นอกกะ',
      entryDayKey: isoDay(number(record.timestampInEpochMs)), entryMonthKey: monthKey(number(record.timestampInEpochMs)),
      segments: {}
    })) : [];
    return {
      version: 'FALLBACK_ACTIVE_ONLY', generatedAt: board?.generatedAt || '', records,
      targets: [], calendar: {month: monthKey(new Date()), days: []}, alerts: records,
      historyWindow: {truncated: true, recordCount: records.length}, dataQuality: {truncated: true}
    };
  }

  async function loadDashboard(forceRefresh) {
    if (state.loading) return;
    setLoading(!state.initialized);
    setText('connectionText', 'กำลังเชื่อมต่อ');
    try {
      const [user, board] = await Promise.all([apiMe(), apiBoard(forceRefresh)]);
      state.user = user || {};
      if (!state.user.authenticated) {
        clearSession();
        window.location.replace(CONFIG.LOGIN_URL);
        return;
      }
      const sessionUser = state.user.user || state.user;
      const role = text(sessionUser.role).toUpperCase();
      if (role === 'INBOUND') {
        window.location.replace('../inbound.html');
        return;
      }
      state.board = board || {};
      state.analytics = board?.dashboard?.analyticsV4 || fallbackAnalytics(board);
      state.records = Array.isArray(state.analytics.records) ? state.analytics.records : [];
      initializeDates();
      populateFilters();
      applyFiltersAndRender();
      setText('connectionText', 'ออนไลน์');
      state.initialized = true;
      startAutoRefresh();
    } catch (error) {
      setText('connectionText', window.navigator.onLine ? 'เชื่อมต่อไม่สำเร็จ' : 'ออฟไลน์');
      if (error.status === 401 || error.status === 403) {
        clearSession();
        window.location.replace(CONFIG.LOGIN_URL);
        return;
      }
      showError(error);
    } finally {
      setLoading(false);
    }
  }

  function initializeDates() {
    const today = isoDay(new Date());
    const minLoaded = state.records.reduce((min, record) => {
      return record.entryDayKey && (!min || record.entryDayKey < min) ? record.entryDayKey : min;
    }, '');
    if (!byId('dateFrom').value) byId('dateFrom').value = today;
    if (!byId('dateTo').value) byId('dateTo').value = today;
    if (minLoaded) byId('dateFrom').min = minLoaded;
    byId('dateFrom').max = today;
    byId('dateTo').min = minLoaded || '';
    byId('dateTo').max = today;
    if (!state.selectedDate) state.selectedDate = today;
    if (!state.calendarMonth) state.calendarMonth = today.slice(0, 7);
  }

  function populateFilters() {
    const shifts = new Map();
    const profiles = new Map();
    state.records.forEach((record) => {
      shifts.set(record.shiftCode || 'OUTSIDE_SHIFT', record.shiftName || 'นอกกะ');
      profiles.set(record.profileCode || 'FULL_INBOUND_LEGACY', record.profileLabel || PROFILE_LABELS[record.profileCode] || 'เต็มขั้นตอน');
    });
    fillSelect(byId('shiftFilter'), shifts, 'ทั้งหมด');
    fillSelect(byId('profileFilter'), profiles, 'ทั้งหมด');
  }

  function fillSelect(select, values, allLabel) {
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value="">${escapeHtml(allLabel)}</option>` +
      Array.from(values.entries()).sort((a, b) => a[1].localeCompare(b[1], 'th'))
        .map(([value, label]) => `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
    if (Array.from(select.options).some((option) => option.value === current)) select.value = current;
  }

  function applyFiltersAndRender() {
    const from = byId('dateFrom').value || isoDay(new Date());
    const to = byId('dateTo').value || from;
    if (from > to) byId('dateTo').value = from;
    const shift = byId('shiftFilter').value;
    const profile = byId('profileFilter').value;
    const status = byId('statusFilter').value;
    const query = text(byId('searchInput').value).toLowerCase();

    state.filtered = state.records.filter((record) => {
      if (!record.entryDayKey || record.entryDayKey < from || record.entryDayKey > (byId('dateTo').value || to)) return false;
      if (shift && record.shiftCode !== shift) return false;
      if (profile && record.profileCode !== profile) return false;
      if (status === 'ACTIVE' && !record.isActive) return false;
      if (status === 'COMPLETED' && !record.isCompleted) return false;
      if (status === 'OVERDUE' && !record.isOverdue) return false;
      if (status === 'CANCELLED' && !record.isCancelled) return false;
      if (status === 'INCOMPLETE' && !record.isIncomplete) return false;
      if (query) {
        const haystack = [record.autoId, record.appointmentNumber, record.companyName, record.vehicleRegistration, record.driverName]
          .map(text).join(' ').toLowerCase();
        if (!haystack.includes(query)) return false;
      }
      return true;
    });

    renderHeaderMeta();
    renderKpis();
    renderStatusChart();
    renderAlerts();
    renderHourlyChart();
    renderStageTimeChart();
    renderCalendar();
    renderSelectedDay();
    renderCompanyRanking();
    renderTrackingTable();
    renderShiftSummary();
    fitFullscreen();
    scheduleChartResize();
  }

  function renderHeaderMeta() {
    const board = state.board || {};
    const module = board.module || {};
    document.title = `Dashboard ภาพรวม ${module.name || 'Vendor / Receiving'}`;
    setText('dataRevision', `ข้อมูลชุด ${text(board.snapshotId || board.dataRevision).slice(0, 18) || '-'}`);
    setText('lastUpdated', `อัปเดตล่าสุด ${board.generatedAt || state.analytics?.generatedAt || '-'}`);
    const truncated = state.analytics?.historyWindow?.truncated === true;
    setText('autoRefreshLabel', truncated ? 'ข้อมูลย้อนหลังถึงขีดจำกัด โปรดตรวจคุณภาพข้อมูล' : 'อัปเดตอัตโนมัติทุก 60 วินาที');
  }

  function previousPeriodRecords() {
    const from = new Date(byId('dateFrom').value + 'T00:00:00+07:00');
    const to = new Date((byId('dateTo').value || byId('dateFrom').value) + 'T23:59:59+07:00');
    const span = Math.max(1, Math.round((to - from) / 86400000) + 1);
    const previousEnd = new Date(from.getTime() - 1000);
    const previousStart = new Date(previousEnd.getTime() - (span - 1) * 86400000);
    const startKey = isoDay(previousStart); const endKey = isoDay(previousEnd);
    return state.records.filter((record) => record.entryDayKey >= startKey && record.entryDayKey <= endKey);
  }

  function renderKpis() {
    const rows = state.filtered;
    const previous = previousPeriodRecords();
    const active = rows.filter((record) => record.isActive);
    const valueMap = {
      kpiGateIn: rows.length,
      kpiCompleted: rows.filter((record) => record.isCompleted).length,
      kpiBacklog: active.length,
      kpiOverdue: active.filter((record) => record.isOverdue).length,
      kpiWaitingDocument: active.filter((record) => record.stageCode === 'WAITING_INBOUND_DOCUMENT').length,
      kpiWaitingReceiving: active.filter((record) => record.stageCode === 'WAITING_RECEIVING').length,
      kpiWaitingReturn: active.filter((record) => record.stageCode === 'WAITING_DOCUMENT_RETURN').length,
      kpiCancelled: rows.filter((record) => record.isCancelled).length
    };
    Object.entries(valueMap).forEach(([id, value]) => setText(id, value.toLocaleString('th-TH')));
    renderDelta('deltaGateIn', rows.length - previous.length, 'จากช่วงก่อน');
    renderDelta('deltaCompleted', rows.filter((r) => r.isCompleted).length - previous.filter((r) => r.isCompleted).length, 'จากช่วงก่อน');
    renderDelta('deltaOverdue', active.filter((r) => r.isOverdue).length - previous.filter((r) => r.isOverdue).length, 'จากช่วงก่อน');
    renderDelta('deltaCancelled', rows.filter((r) => r.isCancelled).length - previous.filter((r) => r.isCancelled).length, 'จากช่วงก่อน');
  }

  function renderDelta(id, delta, suffix) {
    const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '•';
    setText(id, `${arrow} ${Math.abs(delta)} ${suffix}`);
  }

  function statusDistribution() {
    const map = new Map(STAGE_ORDER.map((code) => [code, 0]));
    state.filtered.forEach((record) => map.set(record.stageCode, (map.get(record.stageCode) || 0) + 1));
    return STAGE_ORDER.map((code) => ({code, label: STAGE_LABELS[code], value: map.get(code) || 0}))
      .filter((item) => item.value > 0);
  }

  function renderStatusChart() {
    const data = statusDistribution();
    const colorMap = {
      WAITING_INBOUND_DOCUMENT: COLORS.purple, WAITING_RECEIVING: COLORS.blue,
      WAITING_DOCUMENT_RETURN: COLORS.teal, WAITING_GATE_OUT: COLORS.orange,
      DATA_CONFLICT: '#d58a00', COMPLETED: COLORS.green, CANCELLED: COLORS.slate
    };
    setText('statusChartTotal', state.filtered.length.toLocaleString('th-TH'));
    setText('statusTotalLabel', `รวม ${state.filtered.length.toLocaleString('th-TH')} คัน`);
    byId('statusLegend').innerHTML = data.length ? data.map((item) => {
      const percent = state.filtered.length ? (item.value / state.filtered.length * 100).toFixed(1) : '0.0';
      return `<div class="legend-row"><i style="background:${colorMap[item.code]}"></i><span>${escapeHtml(item.label)}</span><b>${item.value} (${percent}%)</b></div>`;
    }).join('') : '<div class="empty-row">ไม่มีข้อมูล</div>';
    createChart('statusChart', 'doughnut', {
      labels: data.map((item) => item.label),
      datasets: [{data: data.map((item) => item.value), backgroundColor: data.map((item) => colorMap[item.code]), borderWidth: 1, borderColor: '#fff'}]
    }, {cutout: '68%', plugins: {legend: {display: false}, tooltip: {callbacks: {label: (context) => `${context.label}: ${context.raw} คัน`}}}, maintainAspectRatio: false});
  }

  function trackingPriority(record) {
    const weights = {OVERDUE: 5, INCOMPLETE: 4, WARNING: 3, NORMAL: 1};
    return (weights[record.statusCode] || 0) * 100000000 + number(record.statusElapsedSeconds);
  }

  function activeFilteredRecords() {
    return state.filtered.filter((record) => record.isActive).sort((a, b) => trackingPriority(b) - trackingPriority(a));
  }

  function renderAlerts() {
    const rows = activeFilteredRecords().filter((record) => record.statusCode !== 'NORMAL' || record.isIncomplete)
      .slice(0, CONFIG.MAX_ALERT_ROWS);
    const container = byId('alertList');
    if (!rows.length) {
      container.innerHTML = '<div class="empty-row">ไม่มีรายการเตือนในช่วงที่เลือก</div>';
      return;
    }
    container.innerHTML = rows.map((record) => {
      const className = record.isOverdue ? 'state-overdue' : record.isWarning ? 'state-warning' : record.isIncomplete ? 'state-incomplete' : 'state-normal';
      const stateLabel = record.isOverdue
        ? `เกินเวลา ${Math.max(1, Math.round(number(record.statusElapsedSeconds) / 60))} นาที`
        : record.isWarning ? 'ใกล้เกินเวลา' : record.isIncomplete ? 'ข้อมูลไม่ครบ' : 'ปกติ';
      return `<button type="button" class="alert-item" data-record-id="${escapeHtml(record.canonicalRecordId)}"><span class="alert-icon">${record.isOverdue ? '🔺' : record.isWarning ? '⚠️' : 'ℹ️'}</span><span class="alert-copy"><strong>${escapeHtml(record.companyName || '-')}</strong><span>${escapeHtml(record.appointmentNumber || record.autoId || '-')}</span></span><span class="alert-state ${className}">${escapeHtml(stateLabel)}</span><span>›</span></button>`;
    }).join('');
  }

  function hourlyBuckets(rows) {
    const buckets = Array.from({length: 24}, (_, hour) => ({hour, gateIn: 0, completed: 0, backlog: 0}));
    rows.forEach((record) => {
      if (record.gateInEpochMs) {
        const hour = Number(new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Bangkok', hour: '2-digit', hour12: false}).format(new Date(record.gateInEpochMs))) % 24;
        buckets[hour].gateIn += 1;
      }
      if (record.gateOutEpochMs) {
        const hour = Number(new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Bangkok', hour: '2-digit', hour12: false}).format(new Date(record.gateOutEpochMs))) % 24;
        buckets[hour].completed += 1;
      }
      if (record.isActive && record.gateInEpochMs) {
        const startHour = Number(new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Bangkok', hour: '2-digit', hour12: false}).format(new Date(record.gateInEpochMs))) % 24;
        for (let hour = startHour; hour < 24; hour += 1) buckets[hour].backlog += 1;
      }
    });
    const nonZero = buckets.filter((bucket) => bucket.gateIn || bucket.completed || bucket.backlog);
    return nonZero.length ? buckets.slice(Math.max(0, nonZero[0].hour - 1), Math.min(24, nonZero[nonZero.length - 1].hour + 2)) : buckets.slice(6, 15);
  }

  function renderHourlyChart() {
    const buckets = hourlyBuckets(state.filtered);
    const from = byId('dateFrom').value; const to = byId('dateTo').value;
    setText('hourlyRangeLabel', from === to ? shortThaiDate(from) : `${shortThaiDate(from)} – ${shortThaiDate(to)}`);
    createChart('hourlyChart', 'line', {
      labels: buckets.map((bucket) => `${String(bucket.hour).padStart(2, '0')}:00`),
      datasets: [
        {label: 'รถเข้า', data: buckets.map((b) => b.gateIn), borderColor: COLORS.blue, backgroundColor: 'rgba(51,116,221,.10)', fill: true, tension: .28, pointRadius: 2},
        {label: 'ปิดงานแล้ว', data: buckets.map((b) => b.completed), borderColor: COLORS.green, backgroundColor: 'rgba(47,172,114,.08)', fill: true, tension: .28, pointRadius: 2},
        {label: 'คงค้าง', data: buckets.map((b) => b.backlog), borderColor: COLORS.orange, backgroundColor: 'rgba(239,140,34,.05)', fill: false, tension: .28, pointRadius: 2}
      ]
    }, chartOptions({legend: true, yTitle: 'คัน'}));
  }

  function stageAverages(rows) {
    const targets = Array.isArray(state.analytics?.targets) ? state.analytics.targets : [];
    return targets.map((target) => {
      const values = rows
        .map((record) => record.segments && record.segments[target.code])
        .map(Number)
        .filter((value) => (
          Number.isFinite(value) &&
          value >= 0 &&
          value <= CONFIG.MAX_SEGMENT_SECONDS
        ));
      return {
        code: target.code,
        label: target.label || STAGE_LABELS[target.code] || target.code,
        average: values.length
          ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length / 60)
          : 0,
        target: number(target.targetMinutes),
        count: values.length
      };
    });
  }

  function renderStageTimeChart() {
    const stages = stageAverages(state.filtered);
    createChart('stageTimeChart', 'bar', {
      labels: stages.map((stage) => stage.label),
      datasets: [
        {label: 'เวลาเฉลี่ย', data: stages.map((stage) => stage.average), backgroundColor: COLORS.blue, borderRadius: 5, barThickness: 14},
        {label: 'เป้าหมายเวลา', data: stages.map((stage) => stage.target), backgroundColor: 'rgba(96,117,135,.18)', borderColor: COLORS.slate, borderWidth: 1, borderRadius: 5, barThickness: 6}
      ]
    }, chartOptions({legend: true, horizontal: true, xTitle: 'นาที'}));
  }

  function recordsForDay(dayKey) {
    return state.records.filter((record) => record.entryDayKey === dayKey);
  }

  function renderCalendar() {
    const [year, month] = state.calendarMonth.split('-').map(Number);
    setText('calendarMonthLabel', `${CONFIG.THAI_MONTHS[month - 1]} ${year + 543}`);
    const first = new Date(`${state.calendarMonth}-01T12:00:00+07:00`);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const prevDays = new Date(year, month - 1, 0).getDate();
    const cells = [];
    for (let index = 0; index < 42; index += 1) {
      let cellYear = year; let cellMonth = month; let day; let other = false;
      if (index < startDay) { day = prevDays - startDay + index + 1; cellMonth = month - 1; other = true; if (cellMonth === 0) {cellMonth = 12; cellYear -= 1;} }
      else if (index >= startDay + daysInMonth) { day = index - startDay - daysInMonth + 1; cellMonth = month + 1; other = true; if (cellMonth === 13) {cellMonth = 1; cellYear += 1;} }
      else day = index - startDay + 1;
      const key = `${cellYear}-${String(cellMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const rows = recordsForDay(key);
      cells.push(`<button type="button" class="calendar-day ${other ? 'other-month' : ''} ${rows.length ? 'has-data' : ''} ${key === state.selectedDate ? 'selected' : ''} ${key === isoDay(new Date()) ? 'today' : ''}" data-calendar-date="${key}"><span>${day}</span>${rows.length ? `<b class="day-count">${rows.length}</b>` : ''}</button>`);
    }
    byId('calendarGrid').innerHTML = cells.join('');
  }

  function renderSelectedDay() {
    const rows = recordsForDay(state.selectedDate);
    setText('selectedDateLabel', `ข้อมูลวันที่เลือก (${shortThaiDate(state.selectedDate)})`);
    setText('dayGateIn', rows.length.toLocaleString('th-TH'));
    setText('dayCompleted', rows.filter((r) => r.isCompleted).length.toLocaleString('th-TH'));
    setText('dayBacklog', rows.filter((r) => r.isActive).length.toLocaleString('th-TH'));
    setText('dayOverdue', rows.filter((r) => r.isOverdue).length.toLocaleString('th-TH'));
  }

  function companyRankingRows() {
    const rows = recordsForDay(state.selectedDate).filter((record) => record.companyName && record.totalSeconds > 0);
    const map = new Map();
    rows.forEach((record) => {
      const current = map.get(record.companyName) || {name: record.companyName, seconds: 0, count: 0};
      current.seconds += number(record.totalSeconds); current.count += 1; map.set(record.companyName, current);
    });
    return Array.from(map.values()).map((item) => ({
      name: item.name, minutes: Math.round(item.seconds / item.count / 60), count: item.count
    })).sort((a, b) => b.minutes - a.minutes).slice(0, 5);
  }

  function renderCompanyRanking() {
    const rows = companyRankingRows();
    const max = Math.max(1, ...rows.map((row) => row.minutes));
    byId('companyRanking').innerHTML = rows.length ? rows.map((row, index) =>
      `<div class="ranking-row"><b>${index + 1}</b><span class="ranking-name" title="${escapeHtml(row.name)}">${escapeHtml(row.name)}</span><span class="ranking-track"><i style="width:${Math.max(4, row.minutes / max * 100)}%"></i></span><span class="ranking-value">${row.minutes} นาที</span></div>`
    ).join('') : '<div class="empty-row">ยังไม่มีข้อมูลบริษัทในวันที่เลือก</div>';
  }

  function statusPill(record) {
    if (record.isCancelled) return ['ยกเลิก', 'pill-cancelled'];
    if (record.isCompleted) return ['ปิดงานแล้ว', 'pill-completed'];
    if (record.isOverdue) return ['เกินเวลา', 'pill-overdue'];
    if (record.isWarning) return ['ใกล้เกิน', 'pill-warning'];
    if (record.isIncomplete) return ['ข้อมูลไม่ครบ', 'pill-incomplete'];
    return ['ปกติ', 'pill-normal'];
  }

  function renderTrackingTable() {
    const rows = activeFilteredRecords().slice(0, CONFIG.MAX_TABLE_ROWS);
    setText('trackingCount', `${activeFilteredRecords().length.toLocaleString('th-TH')} รายการ`);
    byId('trackingTableBody').innerHTML = rows.length ? rows.map((record) => {
      const pill = statusPill(record);
      return `<tr data-record-id="${escapeHtml(record.canonicalRecordId)}"><td>${escapeHtml(record.appointmentNumber || record.autoId || '-')}</td><td title="${escapeHtml(record.companyName)}">${escapeHtml(record.companyName || '-')}</td><td>${escapeHtml(record.stageLabel || STAGE_LABELS[record.stageCode] || '-')}</td><td>${escapeHtml(timeOnly(record.gateInAt))}</td><td>${escapeHtml(timeOnly(record.latestAt))}</td><td>${escapeHtml(durationLabel(record.totalSeconds))}</td><td><span class="status-pill ${pill[1]}">${pill[0]}</span></td></tr>`;
    }).join('') : '<tr><td colspan="7" class="empty-row">ไม่มีรายการที่ต้องติดตาม</td></tr>';
  }

  function renderShiftSummary() {
    const board = state.board || {};
    const current = board.currentShift || null;
    const summaries = Array.isArray(board.shiftSummaries) ? board.shiftSummaries : [];
    const currentSummary = current ? summaries.find((item) => item.code === current.code || item.ShiftCode === current.code) : null;
    setText('currentShiftName', current ? (current.name || `กะ ${current.code}`) : 'นอกกะ');
    setText('currentShiftTime', current ? `${current.start || timeOnly(current.startAt)} – ${current.end || timeOnly(current.endAt)}` : 'ไม่อยู่ในช่วงกะ');
    setText('shiftGateIn', number(currentSummary?.gateIn || currentSummary?.GateIn).toLocaleString('th-TH'));
    setText('shiftCompleted', number(currentSummary?.gateOutActual || currentSummary?.GateOutActual).toLocaleString('th-TH'));
    setText('shiftCarryOver', number(currentSummary?.closingBalance || currentSummary?.CarryOverToNextShift || board.handover?.summary?.snapshotMetrics?.carryOver).toLocaleString('th-TH'));
    setText('outsideShiftCount', state.filtered.filter((record) => record.shiftCode === 'OUTSIDE_SHIFT').length.toLocaleString('th-TH'));
    setText('shiftStatusLabel', board.handover?.automaticOnly === true ? 'ส่งต่ออัตโนมัติ' : 'อัตโนมัติ');
  }

  function createChart(canvasId, type, data, options) {
    const canvas = byId(canvasId);
    if (!canvas || !window.Chart) return;
    if (state.charts[canvasId]) state.charts[canvasId].destroy();
    state.charts[canvasId] = new window.Chart(canvas, {type, data, options});
  }

  function chartOptions(config) {
    const horizontal = config.horizontal === true;
    const compactAxis = (value) => {
      const numeric = Number(value);
      if (!Number.isFinite(numeric)) return value;
      if (Math.abs(numeric) < 1000) return numeric.toLocaleString('th-TH');
      return new Intl.NumberFormat('th-TH', {
        notation: 'compact',
        maximumFractionDigits: 1
      }).format(numeric);
    };
    return {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 120,
      normalized: true,
      indexAxis: horizontal ? 'y' : 'x',
      animation: {duration: 220},
      plugins: {
        legend: {
          display: config.legend === true,
          position: 'top',
          labels: {boxWidth: 11, boxHeight: 6, padding: 8, font: {size: 8}, color: COLORS.text}
        },
        tooltip: {backgroundColor: '#073d55', titleFont: {size: 10}, bodyFont: {size: 9}}
      },
      scales: {
        x: {
          beginAtZero: horizontal,
          grid: {color: COLORS.grid},
          ticks: {
            font: {size: 8},
            color: COLORS.text,
            maxTicksLimit: horizontal ? 7 : 14,
            callback: horizontal ? compactAxis : undefined
          },
          title: {display: Boolean(config.xTitle), text: config.xTitle, font: {size: 8}}
        },
        y: {
          beginAtZero: true,
          grid: {color: COLORS.grid},
          ticks: {font: {size: 8}, color: COLORS.text, maxTicksLimit: horizontal ? 8 : 7},
          title: {display: Boolean(config.yTitle), text: config.yTitle, font: {size: 8}}
        }
      }
    };
  }

  function findRecord(id) {
    return state.records.find((record) => record.canonicalRecordId === id) || null;
  }

  function showRecordDetail(record) {
    if (!record || !window.Swal) return;
    const segmentRows = [
      ['เข้า → ยื่นเอกสาร', record.segments?.WAITING_INBOUND_DOCUMENT, record.submitRequired],
      ['ยื่นเอกสาร → รับสินค้า', record.segments?.WAITING_RECEIVING, true],
      ['รับสินค้า → คืนเอกสาร', record.segments?.WAITING_DOCUMENT_RETURN, record.returnRequired],
      ['คืนเอกสาร → ออก', record.segments?.WAITING_GATE_OUT, true]
    ];
    window.Swal.fire({
      title: record.appointmentNumber || record.autoId || 'รายละเอียดงาน',
      width: 760,
      html: `<div style="text-align:left;display:grid;gap:10px"><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px"><div><b>บริษัท</b><br>${escapeHtml(record.companyName || '-')}</div><div><b>ทะเบียนรถ</b><br>${escapeHtml(record.vehicleRegistration || '-')}</div><div><b>Auto ID</b><br>${escapeHtml(record.autoId || '-')}</div><div><b>รูปแบบงาน</b><br>${escapeHtml(record.profileLabel || PROFILE_LABELS[record.profileCode] || '-')}</div><div><b>กะ</b><br>${escapeHtml(record.shiftName || 'นอกกะ')}</div><div><b>สถานะ</b><br>${escapeHtml(record.stageLabel || '-')} · ${escapeHtml(record.statusLabel || '-')}</div></div><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr><th style="text-align:left;padding:7px;border-bottom:1px solid #ddd">ช่วงเวลา</th><th style="text-align:right;padding:7px;border-bottom:1px solid #ddd">ผล</th></tr></thead><tbody>${segmentRows.map(([label, value, applicable]) => `<tr><td style="padding:7px;border-bottom:1px solid #eee">${label}</td><td style="padding:7px;text-align:right;border-bottom:1px solid #eee">${applicable === false ? 'ไม่ใช้ขั้นตอนนี้' : Number.isFinite(Number(value)) ? durationLabel(value) : 'ยังไม่มีข้อมูล'}</td></tr>`).join('')}</tbody></table><div><b>เวลาเข้า:</b> ${escapeHtml(record.gateInAt || '-')}<br><b>เวลาล่าสุด:</b> ${escapeHtml(record.latestAt || '-')}<br><b>เวลารวม:</b> ${escapeHtml(durationLabel(record.totalSeconds))}</div>${record.cancelReason ? `<div><b>เหตุผลยกเลิก:</b> ${escapeHtml(record.cancelReason)}</div>` : ''}</div>`,
      confirmButtonText: 'ปิด'
    });
  }

  function showAllAlerts() {
    const rows = activeFilteredRecords().filter((record) => record.statusCode !== 'NORMAL' || record.isIncomplete);
    window.Swal?.fire({
      title: `เตือนสำคัญ ${rows.length} รายการ`, width: 900,
      html: rows.length ? `<div style="max-height:60vh;overflow:auto;text-align:left">${rows.map((record) => `<button type="button" data-alert-modal-id="${escapeHtml(record.canonicalRecordId)}" style="width:100%;display:grid;grid-template-columns:1fr 1fr auto;gap:8px;padding:10px;border:0;border-bottom:1px solid #e5e7eb;background:#fff;text-align:left"><b>${escapeHtml(record.appointmentNumber || record.autoId || '-')}</b><span>${escapeHtml(record.companyName || '-')}</span><strong>${escapeHtml(record.statusLabel || record.stageLabel || '-')}</strong></button>`).join('')}</div>` : '<p>ไม่มีรายการเตือน</p>',
      confirmButtonText: 'ปิด', didOpen: () => {
        document.querySelectorAll('[data-alert-modal-id]').forEach((button) => button.addEventListener('click', () => showRecordDetail(findRecord(button.dataset.alertModalId))));
      }
    });
  }

  function csvEscape(value) {
    const stringValue = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(stringValue) ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
  }

  function downloadCsv(filename, rows) {
    const csv = '\uFEFF' + rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], {type: 'text/csv;charset=utf-8'}));
    const link = document.createElement('a'); link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  }

  function exportMenu() {
    window.Swal?.fire({
      title: 'ส่งออกข้อมูล',
      input: 'select',
      inputOptions: {DETAIL: 'รายละเอียดงานตามตัวกรอง', DAILY: 'สรุปรายวัน', SHIFT: 'สรุปตามกะ'},
      inputPlaceholder: 'เลือกรูปแบบรายงาน', showCancelButton: true,
      confirmButtonText: 'ดาวน์โหลด CSV', cancelButtonText: 'ยกเลิก',
      inputValidator: (value) => value ? undefined : 'กรุณาเลือกรูปแบบรายงาน'
    }).then((result) => {
      if (!result.isConfirmed) return;
      if (result.value === 'DETAIL') exportDetail();
      if (result.value === 'DAILY') exportDaily();
      if (result.value === 'SHIFT') exportShift();
    });
  }

  function exportDetail() {
    const rows = [['Auto ID','เลขนัดหมาย','บริษัท','ทะเบียนรถ','กะ','รูปแบบงาน','สถานะ','เวลาเข้า','เวลายื่นเอกสาร','เวลารับสินค้าเสร็จ','เวลาคืนเอกสาร','เวลาออก','เวลารวม','ผลเวลา']];
    state.filtered.forEach((record) => rows.push([
      record.autoId, record.appointmentNumber, record.companyName, record.vehicleRegistration,
      record.shiftName, record.profileLabel, record.stageLabel, record.gateInAt,
      record.documentSubmittedAt, record.receivingCompleteAt, record.documentReturnedAt,
      record.gateOutAt, durationLabel(record.totalSeconds), record.statusLabel
    ]));
    downloadCsv(`SmartAlert_Detail_${byId('dateFrom').value}_${byId('dateTo').value}.csv`, rows);
  }

  function exportDaily() {
    const days = new Map();
    state.filtered.forEach((record) => {
      const item = days.get(record.entryDayKey) || {date: record.entryDayKey, gateIn:0, completed:0, active:0, overdue:0, cancelled:0, seconds:0};
      item.gateIn += 1; if (record.isCompleted) item.completed += 1; if (record.isActive) item.active += 1;
      if (record.isOverdue) item.overdue += 1; if (record.isCancelled) item.cancelled += 1; item.seconds += number(record.totalSeconds);
      days.set(record.entryDayKey, item);
    });
    const rows = [['วันที่','รถเข้า','ปิดงานแล้ว','คงค้าง','เกินเวลา','ยกเลิก','เวลาเฉลี่ยรวม']];
    Array.from(days.values()).sort((a,b)=>a.date.localeCompare(b.date)).forEach((item) => rows.push([
      shortThaiDate(item.date), item.gateIn, item.completed, item.active, item.overdue, item.cancelled,
      durationLabel(item.gateIn ? item.seconds / item.gateIn : 0)
    ]));
    downloadCsv(`SmartAlert_Daily_${byId('dateFrom').value}_${byId('dateTo').value}.csv`, rows);
  }

  function exportShift() {
    const summaries = Array.isArray(state.board?.shiftSummaries) ? state.board.shiftSummaries : [];
    const rows = [['วันที่ธุรกิจ','กะ','เวลาเริ่ม','เวลาสิ้นสุด','ยอดยกมา','รถเข้า','ปิดงาน','คงค้าง','เกินเวลา','ส่งต่ออัตโนมัติ']];
    summaries.forEach((item) => rows.push([
      item.businessDate || item.BusinessDate || '', item.name || item.ShiftName || item.code || item.ShiftCode || '',
      item.startAt || item.ShiftStartAt || '', item.endAt || item.ShiftEndAt || '',
      number(item.openingBalance || item.OpeningBalance), number(item.gateIn || item.GateIn),
      number(item.gateOutActual || item.GateOutActual), number(item.closingBalance || item.ClosingBalance),
      number(item.overdueActive || item.OverdueAtEnd), number(item.carryOut || item.CarryOverToNextShift)
    ]));
    downloadCsv(`SmartAlert_Shift_${isoDay(new Date())}.csv`, rows);
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }

  function fitFullscreen() {
    document.body.classList.toggle('is-fullscreen', Boolean(document.fullscreenElement));
    setText('fullscreenButton', document.fullscreenElement ? '⛶ ออกจากเต็มจอ' : '⛶ เปิดเต็มจอ');
    Object.values(state.charts).forEach((chart) => chart && chart.resize());
  }

  function scheduleChartResize() {
    window.clearTimeout(state.chartResizeTimer);
    state.chartResizeTimer = window.setTimeout(() => {
      Object.values(state.charts).forEach((chart) => chart && chart.resize());
    }, 160);
  }

  function resetFilters() {
    const today = isoDay(new Date());
    byId('dateFrom').value = today; byId('dateTo').value = today;
    byId('shiftFilter').value = ''; byId('profileFilter').value = '';
    byId('statusFilter').value = ''; byId('searchInput').value = '';
    state.selectedDate = today; state.calendarMonth = today.slice(0, 7);
    applyFiltersAndRender();
  }

  function shiftCalendarMonth(offset) {
    const [year, month] = state.calendarMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + offset, 1, 12, 0, 0);
    state.calendarMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    renderCalendar();
  }

  function startAutoRefresh() {
    if (state.timer) window.clearInterval(state.timer);
    state.timer = window.setInterval(() => loadDashboard(false), CONFIG.REFRESH_MS);
  }

  function updateClock() {
    const now = new Date();
    setText('currentDate', thaiDate(now));
    setText('currentTime', new Intl.DateTimeFormat('th-TH', {
      timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    }).format(now));
  }

  function bindEvents() {
    byId('backButton').addEventListener('click', () => { window.location.href = CONFIG.MODULE_URL; });
    byId('refreshButton').addEventListener('click', () => loadDashboard(true));
    byId('fullscreenButton').addEventListener('click', toggleFullscreen);
    byId('exportButton').addEventListener('click', exportMenu);
    byId('resetButton').addEventListener('click', resetFilters);
    window.addEventListener('resize', scheduleChartResize);
    ['dateFrom','dateTo','shiftFilter','profileFilter','statusFilter'].forEach((id) => byId(id).addEventListener('change', applyFiltersAndRender));
    let searchTimer = null;
    byId('searchInput').addEventListener('input', () => {
      window.clearTimeout(searchTimer); searchTimer = window.setTimeout(applyFiltersAndRender, 220);
    });
    byId('calendarPrev').addEventListener('click', () => shiftCalendarMonth(-1));
    byId('calendarNext').addEventListener('click', () => shiftCalendarMonth(1));
    byId('calendarGrid').addEventListener('click', (event) => {
      const button = event.target.closest('[data-calendar-date]');
      if (!button) return;
      state.selectedDate = button.dataset.calendarDate;
      state.calendarMonth = state.selectedDate.slice(0, 7);
      renderCalendar(); renderSelectedDay(); renderCompanyRanking();
    });
    byId('alertList').addEventListener('click', (event) => {
      const button = event.target.closest('[data-record-id]'); if (button) showRecordDetail(findRecord(button.dataset.recordId));
    });
    byId('trackingTableBody').addEventListener('click', (event) => {
      const row = event.target.closest('[data-record-id]'); if (row) showRecordDetail(findRecord(row.dataset.recordId));
    });
    byId('showAllAlerts').addEventListener('click', showAllAlerts);
    document.addEventListener('fullscreenchange', fitFullscreen);
    window.addEventListener('resize', fitFullscreen);
    window.addEventListener('online', () => setText('connectionText', 'ออนไลน์'));
    window.addEventListener('offline', () => setText('connectionText', 'ออฟไลน์'));
  }

  function observeDashboardLayout() {
    if (!('ResizeObserver' in window)) return;
    const stage = byId('dashboardStage');
    if (!stage) return;
    state.layoutObserver = new ResizeObserver(() => scheduleChartResize());
    state.layoutObserver.observe(stage);
  }

  function initialize() {
    if (!token()) {
      window.location.replace(CONFIG.LOGIN_URL); return;
    }
    bindEvents();
    observeDashboardLayout();
    updateClock();
    window.setInterval(updateClock, 1000);
    loadDashboard(false);
  }

  document.addEventListener('DOMContentLoaded', initialize, {once: true});
})(window, document);
