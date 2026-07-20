/*
 * AlertVendor Consolidated Bundle
 * Output: github-pages/dashboard/dashboard.bundle.js
 * Build: 20260720-consolidated-bundle-r1
 * Generated: 2026-07-20 00:02:45
 * Mode: concatenate-only / no business logic rewrite
 */


/* ============================================================
 * SOURCE 01: dashboard-config(6).js
 * ============================================================ */
/**
 * dashboard-config.js
 * PHASE 4A — Dashboard Single Snapshot + Reconciliation
 */
(function (window) {
  'use strict';

  window.DASHBOARD_CONFIG = Object.freeze({
    API_BASE:
      'https://smartalert.somchaibutphon.workers.dev',

    TOKEN_STORAGE_KEY:
      'alertvendor_access_token_v2',

    LOGIN_URL:
      'https://smartdcs2026.github.io/smartalert/login.html',

    MODULE_URL:
      'https://smartdcs2026.github.io/smartalert/module.html',

    INBOUND_URL:
      'https://smartdcs2026.github.io/smartalert/inbound.html',

    API_TIMEOUT_MS:
      60000,

    GET_RETRY_COUNT:
      2,

    GET_RETRY_BASE_MS:
      700,

    REFRESH_SECONDS:
      15,

    OPERATIONAL_BOARD_LIMIT:
      3000,

    LAST_GOOD_SNAPSHOT_TTL_MS:
      15 * 60 * 1000,

    SNAPSHOT_STALE_AFTER_MS:
      90 * 1000
  });
})(window);


/* ============================================================
 * SOURCE 02: dashboard-api(6).js
 * ============================================================ */
/**
 * dashboard-api.js
 * PHASE 4A HOTFIX 3 — CORS preflight-safe GET retry
 */
(function (window) {
  'use strict';

  const CONFIG = window.DASHBOARD_CONFIG || {};
  const API_BASE = String(CONFIG.API_BASE || '').replace(/\/+$/, '');
  const TOKEN_STORAGE_KEY = String(
    CONFIG.TOKEN_STORAGE_KEY || 'alertvendor_access_token_v2'
  );

  class DashboardAPIError extends Error {
    constructor(message, code, status, details, requestId) {
      super(message || 'เกิดข้อผิดพลาดในการเรียก Dashboard API');
      this.name = 'DashboardAPIError';
      this.code = code || 'DASHBOARD_API_ERROR';
      this.status = Number(status) || 0;
      this.details = details || null;
      this.requestId = requestId || '';
    }
  }

  function getAccessToken() {
    try {
      return String(
        window.sessionStorage.getItem(TOKEN_STORAGE_KEY) || ''
      ).trim();
    } catch (error) {
      return '';
    }
  }

  function clearSession() {
    try {
      [
        TOKEN_STORAGE_KEY,
        'alertvendor_access_token',
        'alertvendor_access_token_v1'
      ].forEach((key) => window.sessionStorage.removeItem(key));
    } catch (error) {
      console.warn('ล้าง Session ไม่สำเร็จ', error);
    }
  }

  function createRequestId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === 'function'
    ) {
      return window.crypto.randomUUID();
    }

    return (
      'dashboard-' +
      Date.now().toString(36) +
      '-' +
      Math.random().toString(36).slice(2, 10)
    );
  }

  function buildUrl(path, query) {
    const cleanPath = String(path || '').startsWith('/')
      ? String(path)
      : '/' + String(path || '');
    const url = new URL(API_BASE + cleanPath);

    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  function sleep(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function retryDelay(attempt) {
    const base = Math.max(200, Number(CONFIG.GET_RETRY_BASE_MS) || 700);
    const jitter = Math.floor(Math.random() * Math.max(100, base / 3));
    return Math.min(5000, base * Math.pow(2, attempt) + jitter);
  }

  function shouldRetry(error, attempt, maxRetries) {
    if (attempt >= maxRetries) {
      return false;
    }

    if (!error || error.status === 401 || error.status === 403) {
      return false;
    }

    return (
      error.code === 'NETWORK_ERROR' ||
      error.code === 'REQUEST_TIMEOUT' ||
      error.status === 408 ||
      error.status === 429 ||
      error.status >= 500
    );
  }

  async function executeGet(path, config, logicalRequestId, attempt) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      Number(CONFIG.API_TIMEOUT_MS) || 60000
    );
    const headers = new Headers({
      Accept: 'application/json',
      'X-Request-Id': logicalRequestId
    });
    const token = getAccessToken();

    if (token) {
      headers.set('Authorization', 'Bearer ' + token);
    }

    try {
      const response = await fetch(
        buildUrl(path, config.query),
        {
          method: 'GET',
          headers,
          cache: 'no-store',
          credentials: 'omit',
          signal: controller.signal
        }
      );
      const text = await response.text();
      let payload;

      try {
        payload = JSON.parse(text);
      } catch (error) {
        throw new DashboardAPIError(
          'API ส่งข้อมูลที่ไม่ใช่ JSON',
          'INVALID_JSON_RESPONSE',
          response.status
        );
      }

      if (!response.ok || payload.success !== true) {
        const apiError = payload.error || {};

        if (response.status === 401) {
          clearSession();
        }

        throw new DashboardAPIError(
          apiError.message || 'เกิดข้อผิดพลาดจากระบบ',
          apiError.code || 'API_ERROR',
          response.status,
          apiError.details || null,
          payload.requestId || ''
        );
      }

      return payload.data;
    } catch (error) {
      if (error && error.name === 'AbortError') {
        throw new DashboardAPIError(
          'ระบบใช้เวลาตอบกลับนานเกินกำหนด',
          'REQUEST_TIMEOUT',
          408
        );
      }

      if (error instanceof DashboardAPIError) {
        throw error;
      }

      throw new DashboardAPIError(
        window.navigator.onLine
          ? 'เบราว์เซอร์เชื่อมต่อ Worker ไม่สำเร็จ'
          : 'อุปกรณ์ไม่มีอินเทอร์เน็ต',
        'NETWORK_ERROR',
        0,
        {
          online: window.navigator.onLine === true,
          apiBase: API_BASE,
          path: String(path || ''),
          hint:
            'ตรวจ CORS preflight, ALLOWED_ORIGINS และ Access-Control-Allow-Headers'
        },
        logicalRequestId
      );
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async function request(path, options) {
    if (!API_BASE) {
      throw new DashboardAPIError(
        'ยังไม่ได้ตั้งค่า API_BASE',
        'API_BASE_MISSING',
        0
      );
    }

    const config = options && typeof options === 'object' ? options : {};
    const maxRetries = Math.max(
      0,
      Number.isFinite(Number(config.retries))
        ? Number(config.retries)
        : Number(CONFIG.GET_RETRY_COUNT) || 0
    );
    const logicalRequestId = createRequestId();
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      try {
        return await executeGet(path, config, logicalRequestId, attempt);
      } catch (error) {
        lastError = error;

        if (!shouldRetry(error, attempt, maxRetries)) {
          throw error;
        }

        await sleep(retryDelay(attempt));
      }
    }

    throw lastError || new DashboardAPIError(
      'เชื่อมต่อระบบไม่สำเร็จ',
      'NETWORK_ERROR',
      0
    );
  }

  window.DashboardAPI = Object.freeze({
    Error: DashboardAPIError,
    clearSession,

    me() {
      return request('/api/auth/me', {retries: 1});
    },

    getOperationalBoard(moduleId, options) {
      const config = options && typeof options === 'object' ? options : {};

      return request(
        '/api/modules/' +
          encodeURIComponent(moduleId) +
          '/operational-board',
        {
          query: {
            limit:
              Number(config.limit) ||
              Number(CONFIG.OPERATIONAL_BOARD_LIMIT) ||
              3000,
            forceRefresh: config.forceRefresh === true ? 'true' : ''
          }
        }
      );
    },

    // คง API เดิมสำหรับหน้า Shift/การย้อนกลับเฉพาะกิจ
    getModule(moduleId) {
      return request('/api/modules/' + encodeURIComponent(moduleId));
    },

    getActiveRecords(moduleId) {
      return request(
        '/api/modules/' + encodeURIComponent(moduleId) + '/records',
        {query: {mode: 'active', limit: 5000}}
      );
    },

    getMovementSummary(moduleId) {
      return request(
        '/api/modules/' + encodeURIComponent(moduleId) + '/movement-summary',
        {query: {mode: 'all'}}
      );
    },

    getReceivingFlow(moduleId) {
      return request(
        '/api/modules/' + encodeURIComponent(moduleId) + '/receiving-flow',
        {query: {mode: 'ACTIVE'}}
      );
    },

    getShiftDashboard(moduleId, options) {
      const config = options && typeof options === 'object' ? options : {};

      return request(
        '/api/modules/' + encodeURIComponent(moduleId) + '/shift-dashboard',
        {query: {date: config.date || ''}}
      );
    }
  });
})(window);


/* ============================================================
 * SOURCE 03: dashboard(8).js
 * ============================================================ */
/**
 * dashboard.js
 * PHASE 4C HOTFIX 3 — Native Fullscreen Professional Layout
 *
 * แก้กรณี Backend ตอบ Error ระหว่าง Initial Load แล้ว Loading Overlay
 * มี z-index สูงกว่า SweetAlert ทำให้ผู้ใช้มองไม่เห็น/กดปุ่ม Error ไม่ได้
 */
(function (window, document) {
  'use strict';

  const CONFIG = window.DASHBOARD_CONFIG || {};
  const API = window.DashboardAPI;

  const COLORS = Object.freeze({
    green: '#0f9d7a',
    amber: '#e88709',
    red: '#e33434',
    blue: '#2369d8',
    purple: '#7c3aed',
    slate: '#7b91a0',
    navy: '#0b4868',
    grid: '#e5edf2',
    text: '#516b7d'
  });

  const state = {
    moduleId: '',
    session: null,
    module: {},
    records: [],
    movement: {},
    receiving: {
      enabled: false,
      summary: {},
      records: []
    },
    receivingByRecordId: new Map(),
    snapshot: null,
    snapshotMode: 'BLOCKED',
    snapshotStoredAtMs: 0,
    reconciliation: {},
    dataQuality: {},
    period: 'ROLLING_24',
    searchText: '',
    statusFilter: 'ALL',
    stageFilter: 'ALL',
    serverOffsetMs: 0,
    signature: '',
    refreshInProgress: false,
    refreshTimer: null,
    clockTimer: null,
    charts: {
      hourly: null,
      status: null,
      activeTrend: null,
      longestWaiting: null
    },
    destroyed: false,
    mobileChart: 'hourly',
    mobileRecordView: 'COMPACT',
    mobileRecordLimit: 12,
    responsiveMobile: null,
    initialLoadCompleted: false
  };

  let fullscreenFitTimer = null;
  let fullscreenFitChartTimer = null;
  let fullscreenFitApplying = false;
  let fullscreenFitLastScale = 1;
  let fullscreenFitLastView = '';

  const doughnutCenterPlugin = {
    id: 'dashboardDoughnutCenter',

    afterDraw(chart) {
      if (
        chart.canvas.id !== 'statusDistributionChart' ||
        !chart.chartArea
      ) {
        return;
      }

      const {ctx, chartArea} = chart;
      const total = state.records.length;
      const x = (chartArea.left + chartArea.right) / 2;
      const y = (chartArea.top + chartArea.bottom) / 2;

      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.fillStyle = '#6a8190';
      ctx.font = '700 9px system-ui';
      ctx.fillText('รวม', x, y - 13);

      ctx.fillStyle = '#10283a';
      ctx.font = '900 23px system-ui';
      ctx.fillText(String(total), x, y + 4);

      ctx.fillStyle = '#6a8190';
      ctx.font = '700 8px system-ui';
      ctx.fillText('รายการ', x, y + 20);

      ctx.restore();
    }
  };

  document.addEventListener(
    'DOMContentLoaded',
    initializeDashboard
  );

  window.addEventListener(
    'beforeunload',
    destroyDashboard
  );

  async function initializeDashboard() {
    bindEvents();
    initializeFullscreenOnePageFit();
    startClock();
    showLoading(true);

    try {
      if (!API) {
        throw new Error('ไม่พบ dashboard-api.js');
      }

      if (typeof window.Chart === 'undefined') {
        throw new Error('ไม่พบ Chart.js');
      }

      Chart.register(doughnutCenterPlugin);

      state.moduleId = getModuleIdFromUrl();

      if (!state.moduleId) {
        throw new Error('ไม่พบรหัส Module');
      }

      state.session = await API.me();

      if (
        !state.session ||
        !state.session.authenticated
      ) {
        redirectToLogin();
        return;
      }

      if (!isDashboardAllowedRole(state.session)) {
        if (getSessionRole(state.session) === 'INBOUND') {
          redirectToInbound();
          return;
        }

        redirectToLogin();
        return;
      }

      renderUserIdentity();
      syncResponsiveDashboard();

      await refreshDashboard({
        silent: false,
        initial: true
      });
    } catch (error) {
      /*
       * สำคัญ: ซ่อน Loading Overlay ก่อนเปิด SweetAlert
       * มิฉะนั้น Overlay (z-index สูง) จะทับกล่อง Error และเกิดหน้าค้าง
       */
      showLoading(false);

      if (isAuthenticationError(error)) {
        redirectToLogin();
        return;
      }

      await showError(
        error,
        'เปิด Dashboard ไม่สำเร็จ'
      );
    } finally {
      state.initialLoadCompleted = true;
      showLoading(false);
    }
  }

  function bindEvents() {
    window.addEventListener('online', () => {
      setConnectionState('LOADING', 'กำลังเชื่อมต่อ');
      void refreshDashboard({silent: true, forceRefresh: true});
    });

    window.addEventListener('offline', () => {
      if (state.snapshot) {
        state.snapshotMode = 'STALE';
        renderSnapshotState();
        setConnectionState('STALE', 'OFFLINE');
      } else {
        setConnectionState('ERROR', 'OFFLINE');
      }
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void refreshDashboard({silent: true});
      }
    });

    byId('dashboardBackButton')
      ?.addEventListener('click', goBackToModule);

    byId('dashboardRefreshButton')
      ?.addEventListener(
        'click',
        () => void refreshDashboard({silent: false})
      );

    byId('dashboardFullscreenButton')
      ?.addEventListener('click', toggleFullscreen);

    byId('dashboardPeriodGroup')
      ?.addEventListener(
        'click',
        (event) => {
          const button = event.target.closest('[data-period]');

          if (!button) {
            return;
          }

          state.period = String(
            button.dataset.period || 'ROLLING_24'
          ).toUpperCase();

          document
            .querySelectorAll('[data-period]')
            .forEach(
              (item) => item.classList.toggle(
                'is-active',
                item === button
              )
            );

          renderPeriodDependentData(false);
        }
      );

    byId('dashboardSearchInput')
      ?.addEventListener(
        'input',
        debounce(
          (event) => {
            state.searchText = String(
              event.target.value || ''
            ).trim().toLowerCase();

            renderRecordTable();
          },
          130
        )
      );

    byId('dashboardStatusFilter')
      ?.addEventListener(
        'change',
        (event) => {
          state.statusFilter = String(
            event.target.value || 'ALL'
          ).toUpperCase();

          renderRecordTable();
        }
      );

    byId('dashboardStageFilter')
      ?.addEventListener(
        'change',
        (event) => {
          state.stageFilter = String(
            event.target.value || 'ALL'
          ).toUpperCase();

          renderRecordTable();
        }
      );

    byId('dashboardResetFilters')
      ?.addEventListener(
        'click',
        resetRecordFilters
      );

    byId('mobileAnalyticsTabs')
      ?.addEventListener(
        'click',
        handleMobileChartTab
      );

    document
      .querySelector('.mobile-view-switch')
      ?.addEventListener(
        'click',
        handleMobileRecordView
      );

    byId('mobileLoadMoreRecords')
      ?.addEventListener(
        'click',
        () => {
          state.mobileRecordLimit += 12;
          renderRecordTable();
        }
      );

    document.addEventListener(
      'click',
      handleDashboardClick
    );

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'visible') {
          void refreshDashboard({silent: true});
        }
      }
    );

    window.addEventListener(
      'online',
      () => void refreshDashboard({silent: true})
    );

    window.addEventListener(
      'resize',
      debounce(
        () => {
          syncResponsiveDashboard();
          resizeCharts();
          scheduleFullscreenOnePageFit();
        },
        120
      )
    );

    document.addEventListener(
      'fullscreenchange',
      syncFullscreenButton
    );

    document.addEventListener(
      'dashboard:content-ready',
      scheduleFullscreenOnePageFit
    );

    document.addEventListener(
      'dashboard:view-changed',
      scheduleFullscreenOnePageFit
    );
  }



  function handleMobileRecordView(event) {
    const button =
      event.target.closest(
        '[data-mobile-view]'
      );

    if (!button) {
      return;
    }

    const mode =
      String(
        button.dataset.mobileView ||
        'COMPACT'
      ).toUpperCase();

    state.mobileRecordView =
      mode === 'DETAIL'
        ? 'DETAIL'
        : 'COMPACT';

    state.mobileRecordLimit = 12;

    document.body.dataset.mobileRecordView =
      state.mobileRecordView;

    const recordsPanel =
      document.querySelector(
        '.records-panel'
      );

    if (recordsPanel) {
      recordsPanel.classList.toggle(
        'is-compact-view',
        state.mobileRecordView ===
          'COMPACT'
      );

      recordsPanel.classList.toggle(
        'is-detail-view',
        state.mobileRecordView ===
          'DETAIL'
      );
    }

    document
      .querySelectorAll(
        '[data-mobile-view]'
      )
      .forEach(
        (item) => item.classList.toggle(
          'is-active',
          item === button
        )
      );

    renderRecordTable();
  }


  function showMobileRecordDetails(recordId) {
    const record =
      state.records.find(
        (item) =>
          String(
            item.recordId ||
            ''
          ) ===
          String(
            recordId ||
            ''
          )
      );

    if (!record) {
      return;
    }

    const receiving =
      state.receivingByRecordId.get(
        String(
          record.recordId ||
          ''
        )
      );

    const dimensions =
      extractRecordDimensions(
        record
      );

    const stageCode =
      receiving &&
      receiving.stageCode ||
      'ACTIVE';

    const stageLabel =
      receiving &&
      receiving.stageLabel ||
      'อยู่ในพื้นที่';

    const canonicalValues =
      new Set(
        [
          dimensions.company,
          dimensions.appointment,
          dimensions.identifier,
          dimensions.driver,
          record.timestampIn,
          formatDuration(
            record.durationSeconds
          ),
          getStatusLabel(
            record.statusCode
          ),
          stageLabel
        ]
          .map(
            (value) =>
              normalizeText(
                value
              )
          )
          .filter(Boolean)
      );

    const ignoredLabels = [
      'บริษัท',
      'หน่วยงาน',
      'vendor',
      'company',
      'เลขนัดหมาย',
      'นัดหมาย',
      'appointment',
      'booking',
      'ทะเบียน',
      'ทะเบียนรถ',
      'registration',
      'plate',
      'ชื่อคนขับ',
      'ชื่อผู้ขับ',
      'พนักงานขับรถ',
      'driver'
    ]
      .map(
        normalizeText
      );

    const seen =
      new Set();

    const extraDetails =
      (
        Array.isArray(
          record.fields
        )
          ? record.fields
          : []
      )
        .filter(
          (field) => {
            if (
              !field ||
              field.primary
            ) {
              return false;
            }

            const label =
              normalizeText(
                field.label ||
                field.header ||
                field.name ||
                field.key ||
                ''
              );

            const value =
              String(
                field.value ??
                field.displayValue ??
                ''
              ).trim();

            if (!value) {
              return false;
            }

            if (
              ignoredLabels.some(
                (pattern) =>
                  label.includes(
                    pattern
                  )
              )
            ) {
              return false;
            }

            const normalizedValue =
              normalizeText(
                value
              );

            if (
              canonicalValues.has(
                normalizedValue
              )
            ) {
              return false;
            }

            const signature =
              label +
              '\u0000' +
              normalizedValue;

            if (
              seen.has(
                signature
              )
            ) {
              return false;
            }

            seen.add(
              signature
            );

            return true;
          }
        )
        .slice(
          0,
          6
        )
        .map(
          (field) => `
            <div class="record-inspector-extra">
              <span>
                ${escapeHtml(
                  field.label ||
                  field.header ||
                  field.name ||
                  field.key ||
                  'ข้อมูลเพิ่มเติม'
                )}
              </span>

              <strong>
                ${escapeHtml(
                  formatDashboardDisplayDateTime(
                    field.value ??
                    field.displayValue ??
                    '-'
                  )
                )}
              </strong>
            </div>
          `
        )
        .join('');

    const driverCard =
      dimensions.driver
        ? `
            <div class="record-inspector-info">
              <span>ชื่อผู้ขับ</span>

              <strong>
                ${escapeHtml(
                  dimensions.driver
                )}
              </strong>
            </div>
          `
        : '';

    window.Swal?.fire({
      html: `
        <div class="record-inspector">
          <header class="record-inspector-hero">
            <small>
              ACTIVE VEHICLE RECORD
            </small>

            <h2>
              ${escapeHtml(
                dimensions.company
              )}
            </h2>

            <div class="record-inspector-statuses">
              <span
                class="status-badge"
                data-status="${escapeHtml(
                  record.statusCode ||
                  'INCOMPLETE'
                )}"
              >
                ${escapeHtml(
                  getStatusLabel(
                    record.statusCode
                  )
                )}
              </span>

              <span
                class="stage-badge"
                data-stage="${escapeHtml(
                  stageCode
                )}"
              >
                ${escapeHtml(
                  stageLabel
                )}
              </span>
            </div>
          </header>

          <section class="record-inspector-appointment-panel">
            <span>เลขนัดหมาย</span>

            <strong>
              ${escapeHtml(
                dimensions.appointment
              )}
            </strong>
          </section>

          <section class="record-inspector-info-grid">
            <div class="record-inspector-info record-inspector-info--plate">
              <span>ทะเบียนรถ / หมายเลขตู้</span>

              <strong>
                ${escapeHtml(
                  dimensions.identifier
                )}
              </strong>
            </div>

            <div class="record-inspector-info">
              <span>เวลาเข้า Gate In</span>

              <strong>
                ${escapeHtml(
                  record.timestampIn ||
                  '-'
                )}
              </strong>
            </div>

            <div class="record-inspector-info">
              <span>ระยะเวลาปัจจุบัน</span>

              <strong class="record-inspector-duration">
                ${escapeHtml(
                  formatDuration(
                    record.durationSeconds
                  )
                )}
              </strong>
            </div>

            ${driverCard}
          </section>

          ${
            extraDetails
              ? `
                  <section class="record-inspector-details">
                    <header>
                      ข้อมูลประกอบ
                    </header>

                    ${extraDetails}
                  </section>
                `
              : ''
          }
        </div>
      `,
      showConfirmButton:
        true,
      confirmButtonText:
        'ปิด',
      width:
        620,
      padding:
        '0',
      customClass: {
        popup:
          'record-inspector-popup',
        htmlContainer:
          'record-inspector-html',
        confirmButton:
          'record-inspector-close'
      }
    });
  }

  function handleMobileChartTab(event) {
    const button =
      event.target.closest(
        '[data-chart-tab]'
      );

    if (!button) {
      return;
    }

    setMobileChartTab(
      String(
        button.dataset.chartTab ||
        'hourly'
      )
    );
  }


  function setMobileChartTab(chartKey) {
    const safeKey =
      [
        'hourly',
        'status',
        'trend',
        'waiting',
        'flow'
      ].includes(chartKey)
        ? chartKey
        : 'hourly';

    state.mobileChart =
      safeKey;

    document
      .querySelectorAll(
        '[data-chart-tab]'
      )
      .forEach(
        (button) => {
          const active =
            button.dataset.chartTab ===
            safeKey;

          button.classList.toggle(
            'is-active',
            active
          );

          button.setAttribute(
            'aria-selected',
            String(active)
          );
        }
      );

    document
      .querySelectorAll(
        '[data-chart-panel]'
      )
      .forEach(
        (panel) => {
          panel.classList.toggle(
            'is-mobile-active',
            panel.dataset.chartPanel ===
              safeKey
          );
        }
      );

    window.setTimeout(
      resizeCharts,
      80
    );
  }


  function syncResponsiveDashboard() {
    const mobile =
      window.matchMedia(
        '(max-width: 760px)'
      ).matches;

    const breakpointChanged =
      state.responsiveMobile !==
      mobile;

    state.responsiveMobile =
      mobile;

    document.body.classList.toggle(
      'is-mobile-dashboard',
      mobile
    );

    const recordView =
      state.mobileRecordView ||
      'COMPACT';

    document.body.dataset.mobileRecordView =
      recordView;

    const recordsPanel =
      document.querySelector(
        '.records-panel'
      );

    if (recordsPanel) {
      recordsPanel.classList.toggle(
        'is-compact-view',
        recordView === 'COMPACT'
      );

      recordsPanel.classList.toggle(
        'is-detail-view',
        recordView === 'DETAIL'
      );
    }

    if (mobile) {
      setMobileChartTab(
        state.mobileChart ||
        'hourly'
      );
    }

    if (
      breakpointChanged &&
      state.records.length > 0
    ) {
      renderRecordTable();
    }
  }

  function handleDashboardClick(event) {
    const mobileRecord =
      event.target.closest(
        '[data-mobile-record-id]'
      );

    if (
      mobileRecord &&
      window.matchMedia(
        '(max-width: 760px)'
      ).matches
    ) {
      showMobileRecordDetails(
        mobileRecord.dataset.mobileRecordId
      );
      return;
    }

    const statusButton =
      event.target.closest('[data-status-filter]');

    if (statusButton) {
      state.statusFilter = String(
        statusButton.dataset.statusFilter || 'ALL'
      ).toUpperCase();

      const select = byId('dashboardStatusFilter');

      if (select) {
        select.value = state.statusFilter;
      }

      renderRecordTable();
      focusRecordsPanel();
      return;
    }

    const stageButton =
      event.target.closest('[data-stage-filter]');

    if (stageButton) {
      state.stageFilter = String(
        stageButton.dataset.stageFilter || 'ALL'
      ).toUpperCase();

      const select = byId('dashboardStageFilter');

      if (select) {
        select.value = state.stageFilter;
      }

      renderRecordTable();
      focusRecordsPanel();
      return;
    }

    const recordButton =
      event.target.closest('[data-focus-record]');

    if (recordButton) {
      const value = String(
        recordButton.dataset.focusRecord || ''
      );

      state.searchText = value.toLowerCase();

      const search = byId('dashboardSearchInput');

      if (search) {
        search.value = value;
      }

      renderRecordTable();
      focusRecordsPanel();
    }
  }

  async function refreshDashboard(options) {
    if (state.refreshInProgress || state.destroyed) {
      return;
    }

    const config = options && typeof options === 'object' ? options : {};
    const silent = config.silent === true;
    state.refreshInProgress = true;

    if (!silent) {
      setConnectionState('LOADING', 'กำลังอัปเดต');
      setRefreshButtonLoading(true);
    }

    try {
      if (!API || typeof API.getOperationalBoard !== 'function') {
        throw new Error('ไม่พบ API Operational Board สำหรับ Dashboard');
      }

      const board = await API.getOperationalBoard(
        state.moduleId,
        {
          limit: Number(CONFIG.OPERATIONAL_BOARD_LIMIT) || 3000,
          forceRefresh: config.forceRefresh === true
        }
      );
      const snapshot = normalizeOperationalBoardSnapshot(board);

      applyOperationalBoardSnapshot(snapshot, {
        mode: snapshot.reconciliation.success === true
          ? 'LIVE'
          : 'INTEGRITY_ERROR',
        silent,
        initial: config.initial === true
      });

      if (snapshot.reconciliation.success === true) {
        saveLastGoodDashboardSnapshot(board);
      }
    } catch (error) {
      /*
       * Initial load ยังมี Full-screen Overlay อยู่ ขณะที่ฟังก์ชันนี้
       * จัดการ Error ภายในเอง จึงต้องซ่อนก่อนเรียก SweetAlert ทุกกรณี
       */
      if (!silent) {
        showLoading(false);
      }

      if (isAuthenticationError(error)) {
        redirectToLogin();
        return;
      }

      const fallback = loadLastGoodDashboardSnapshot();

      if (fallback) {
        const snapshot = normalizeOperationalBoardSnapshot(fallback.board);
        applyOperationalBoardSnapshot(snapshot, {
          mode: 'STALE',
          silent: true,
          initial: config.initial === true
        });
        setConnectionState('STALE', navigator.onLine ? 'STALE' : 'OFFLINE');

        if (!silent) {
          await showSnapshotFallbackWarning(error, fallback.ageMs);
        }
      } else if (!silent) {
        state.snapshotMode = 'BLOCKED';
        renderSnapshotState();
        setConnectionState('ERROR', 'ERROR');
        await showError(error, 'โหลด Dashboard ไม่สำเร็จ');
      } else {
        state.snapshotMode = state.snapshot ? 'STALE' : 'BLOCKED';
        renderSnapshotState();
        setConnectionState(
          state.snapshot ? 'STALE' : 'ERROR',
          state.snapshot ? 'STALE' : 'ERROR'
        );
        console.warn('Dashboard silent refresh ไม่สำเร็จ', error);
      }
    } finally {
      state.refreshInProgress = false;

      if (!silent) {
        setRefreshButtonLoading(false);
      }

      scheduleRefresh();
    }
  }

  function normalizeOperationalBoardSnapshot(board) {
    if (!board || typeof board !== 'object') {
      throw new Error('Operational Board ไม่ได้ส่ง Snapshot กลับมา');
    }

    const dashboard = board.dashboard && typeof board.dashboard === 'object'
      ? board.dashboard
      : null;
    const reconciliation = board.reconciliation ||
      dashboard && dashboard.reconciliation || {};

    if (
      !dashboard ||
      !dashboard.movement ||
      !Array.isArray(board.records) ||
      !board.snapshotId
    ) {
      const error = new Error(
        'Backend ที่ใช้งานอยู่ยังไม่ส่ง Snapshot Schema ของ Phase 4A ' +
        '(ต้องมี snapshotId, dashboard.movement และ records) ' +
        'กรุณาวางทับ ModuleOperationalBoardService.gs แล้ว Deploy Apps Script เวอร์ชันใหม่'
      );
      error.code = 'DASHBOARD_SNAPSHOT_SCHEMA_MISSING';
      throw error;
    }

    return {
      board,
      snapshotId: String(board.snapshotId || dashboard.snapshotId || ''),
      generatedAt: String(board.generatedAt || dashboard.generatedAt || ''),
      generatedAtEpochMs:
        Number(board.generatedAtEpochMs || dashboard.generatedAtEpochMs) || 0,
      module: board.module || {},
      records: board.records,
      movement: dashboard.movement || {},
      receiving: createDashboardReceivingFromBoard(board, dashboard),
      reconciliation: {
        ...reconciliation,
        success: reconciliation.success === true &&
          board.integrity && board.integrity.success === true
      },
      dataQuality: board.dataQuality || dashboard.dataQuality || {},
      cached: board.cached === true,
      servedAt: board.servedAt || board.generatedAt || ''
    };
  }

  function createDashboardReceivingFromBoard(board, dashboard) {
    const records = (Array.isArray(board.records) ? board.records : [])
      .map((record) => normalizeDashboardReceivingRecord(record));
    const summary = dashboard.receiving || {};

    return {
      enabled: board.module && board.module.receivingEnabled === true,
      generatedAt: board.generatedAt || dashboard.generatedAt || '',
      summary: {
        ...summary,
        activeTotal: records.length,
        waitingInboundDocument: Number(summary.waitingInboundDocument) || 0,
        waitingReceiving: Number(summary.waitingReceiving) || 0,
        waitingDocumentReturn: Number(summary.waitingDocumentReturn) || 0,
        waitingGateOut: Number(summary.waitingGateOut) || 0,
        dataConflict: Number(summary.dataConflict) || 0
      },
      records
    };
  }

  function applyOperationalBoardSnapshot(snapshot, options) {
    const config = options && typeof options === 'object' ? options : {};
    state.snapshot = snapshot;
    state.snapshotMode = String(config.mode || 'LIVE');
    state.snapshotStoredAtMs = Date.now();
    state.module = snapshot.module || {};
    state.records = Array.isArray(snapshot.records) ? snapshot.records : [];
    state.movement = snapshot.movement || {};
    state.receiving = snapshot.receiving || {
      enabled: false,
      summary: {},
      records: []
    };
    state.reconciliation = snapshot.reconciliation || {};
    state.dataQuality = snapshot.dataQuality || {};

    rebuildReceivingIndex();
    updateServerOffset(snapshot.generatedAt);
    recalculateRecords();

    const nextSignature = buildStableSignature();
    const changed = nextSignature !== state.signature;
    state.signature = nextSignature;

    if (changed || config.initial === true) {
      renderDashboard(config.silent === true);
    } else {
      updateLiveDurations();
      renderSnapshotState();
    }

    const generatedAt = snapshot.generatedAt ||
      formatBangkokDateTime(getServerNow());
    setText('dashboardLastUpdated', 'อัปเดตล่าสุด ' + generatedAt);
    setText('summaryLastUpdate', generatedAt);

    if (state.snapshotMode === 'LIVE') {
      setConnectionState('ONLINE', snapshot.cached ? 'LIVE · CACHE' : 'LIVE');
    } else if (state.snapshotMode === 'INTEGRITY_ERROR') {
      setConnectionState('ERROR', 'DATA ERROR');
    }
  }

  function dashboardSnapshotStorageKey() {
    return 'alertvendor_dashboard_snapshot_v1:' + String(state.moduleId || '');
  }

  function saveLastGoodDashboardSnapshot(board) {
    try {
      const payload = JSON.stringify({
        moduleId: state.moduleId,
        storedAtMs: Date.now(),
        board
      });
      const maxBytes = 4 * 1024 * 1024;

      if (payload.length > maxBytes) {
        console.warn('Snapshot ใหญ่เกินกำหนด จึงไม่เก็บ Last-known-good');
        return;
      }

      window.sessionStorage.setItem(dashboardSnapshotStorageKey(), payload);
    } catch (error) {
      console.warn('เก็บ Last-known-good Dashboard Snapshot ไม่สำเร็จ', error);
    }
  }

  function loadLastGoodDashboardSnapshot() {
    try {
      const raw = window.sessionStorage.getItem(dashboardSnapshotStorageKey());

      if (!raw) {
        return null;
      }

      const value = JSON.parse(raw);
      const ageMs = Math.max(0, Date.now() - Number(value.storedAtMs || 0));
      const ttlMs = Number(CONFIG.LAST_GOOD_SNAPSHOT_TTL_MS) || 15 * 60 * 1000;

      if (
        value.moduleId !== state.moduleId ||
        !value.board ||
        ageMs > ttlMs
      ) {
        window.sessionStorage.removeItem(dashboardSnapshotStorageKey());
        return null;
      }

      const reconciliation = value.board.reconciliation ||
        value.board.dashboard && value.board.dashboard.reconciliation || {};
      const integrity = value.board.integrity || {};

      if (reconciliation.success !== true || integrity.success !== true) {
        window.sessionStorage.removeItem(dashboardSnapshotStorageKey());
        return null;
      }

      return {
        board: value.board,
        ageMs
      };
    } catch (error) {
      console.warn('อ่าน Last-known-good Dashboard Snapshot ไม่สำเร็จ', error);
      return null;
    }
  }

  async function showSnapshotFallbackWarning(error, ageMs) {
    showLoading(false);

    if (!window.Swal) {
      return;
    }

    await window.Swal.fire({
      icon: 'warning',
      title: 'กำลังแสดงข้อมูลล่าสุดที่เก็บไว้',
      text:
        'เชื่อมต่อข้อมูลสดไม่สำเร็จ ข้อมูลนี้เก่าประมาณ ' +
        Math.max(1, Math.round(Number(ageMs || 0) / 60000)) +
        ' นาที กรุณาตรวจสอบอินเทอร์เน็ตและกดรีเฟรช',
      confirmButtonText: 'รับทราบ',
      footer: error && error.message ? escapeHtml(error.message) : ''
    });
  }

  function normalizeDashboardReceivingFlow(
    flow
  ) {
    if (
      !flow ||
      typeof flow !== 'object'
    ) {
      return flow;
    }

    const records =
      (
        Array.isArray(flow.records)
          ? flow.records
          : []
      ).map(
        normalizeDashboardReceivingRecord
      );

    const active =
      records.filter(
        (record) =>
          record.isCurrentlyInArea ===
            true
      );

    return {
      ...flow,
      records:
        records,
      summary: {
        ...(flow.summary || {}),
        activeTotal:
          active.length,
        waitingReceiving:
          active.filter(
            (record) =>
              record.stageCode ===
                'WAITING_RECEIVING'
          ).length,
        waitingGateOut:
          active.filter(
            (record) =>
              record.stageCode ===
                'WAITING_GATE_OUT'
          ).length
      }
    };
  }


  function normalizeDashboardReceivingRecord(
    sourceRecord
  ) {
    const record =
      sourceRecord &&
      typeof sourceRecord === 'object'
        ? sourceRecord
        : {};

    const operationalStage = String(
      record.operationalStage || ''
    ).trim().toUpperCase();

    if (operationalStage) {
      const stageStartMs = operationalStageStartEpochMs(record, operationalStage);
      const nowMs = Date.now() + state.serverOffsetMs;

      return {
        ...record,
        stageCode: operationalStage,
        stageLabel:
          record.operationalStageLabel ||
          getOperationalStageLabel(operationalStage),
        currentStageSeconds: Number.isFinite(stageStartMs)
          ? Math.max(0, Math.floor((nowMs - stageStartMs) / 1000))
          : Number(record.durationSeconds) || 0
      };
    }

    const isActive =
      record.isCurrentlyInArea ===
        true;

    const hasReceiving =
      Boolean(
        record.receivingCompleteEpochMs ||
        record.receivingCompleteAt
      );

    const timestampOutEpochMs =
      Number(
        record.timestampOutEpochMs
      );

    const hasTimestampOut =
      Number.isFinite(
        timestampOutEpochMs
      ) &&
      timestampOutEpochMs > 0;

    const gateOutSource =
      String(
        record.gateOutSource ||
        ''
      ).toUpperCase();

    if (isActive) {
      const nowMs =
        Date.now() +
        state.serverOffsetMs;

      const timestampInEpochMs =
        Number(
          record.timestampInEpochMs
        );

      const receivingEpochMs =
        Number(
          record.receivingCompleteEpochMs
        );

      const currentStageSeconds =
        hasReceiving &&
        Number.isFinite(
          receivingEpochMs
        )
          ? Math.max(
              0,
              Math.floor(
                (
                  nowMs -
                  receivingEpochMs
                ) /
                1000
              )
            )
          : Number.isFinite(
                timestampInEpochMs
              )
            ? Math.max(
                0,
                Math.floor(
                  (
                    nowMs -
                    timestampInEpochMs
                  ) /
                  1000
                )
              )
            : Number(
                record.currentStageSeconds
              ) || 0;

      return {
        ...record,
        stageCode:
          hasReceiving
            ? 'WAITING_GATE_OUT'
            : 'WAITING_RECEIVING',
        stageLabel:
          hasReceiving
            ? 'รับสินค้าเสร็จ รอ Gate Out'
            : 'รอรับสินค้าเสร็จ',
        isExited:
          false,
        timestampOut:
          '',
        timestampOutEpochMs:
          null,
        gateOutSource:
          'PENDING',
        gateOutSourceLabel:
          'ยังไม่มีการสแกน Gate Out',
        currentStageSeconds:
          currentStageSeconds
      };
    }

    const hasAutoClose =
      hasTimestampOut &&
      gateOutSource ===
        'AUTO_CLOSE';

    const hasRealGateOut =
      hasTimestampOut &&
      gateOutSource ===
        'SCANNER';

    if (hasAutoClose) {
      return {
        ...record,
        stageCode:
          hasReceiving
            ? 'AUTO_CLOSED_AFTER_RECEIVING'
            : 'AUTO_CLOSED_WITHOUT_RECEIVING',
        stageLabel:
          hasReceiving
            ? 'รับสินค้าเสร็จแล้ว แต่ไม่พบ Gate Out จริง — ระบบเคลียร์ข้อมูล'
            : 'ระบบเคลียร์ข้อมูล โดยไม่มีข้อมูลรับสินค้าเสร็จ'
      };
    }

    if (hasRealGateOut) {
      return {
        ...record,
        stageCode:
          hasReceiving
            ? 'EXITED_AFTER_RECEIVING'
            : 'EXITED_WITHOUT_RECEIVING',
        stageLabel:
          hasReceiving
            ? 'Gate Out จริงแล้ว — กระบวนการสมบูรณ์'
            : 'Gate Out จริงแล้ว โดยไม่มีข้อมูลรับสินค้าเสร็จ'
      };
    }

    return {
      ...record,
      stageCode:
        'INACTIVE_WITHOUT_GATE_OUT_TIME',
      stageLabel:
        'รายการไม่ Active แต่ไม่พบเวลา Gate Out ที่ยืนยันได้'
    };
  }

  function rebuildReceivingIndex() {
    state.receivingByRecordId = new Map();

    (
      Array.isArray(state.receiving.records)
        ? state.receiving.records
        : []
    ).forEach(
      (record) => {
        if (record && record.recordId) {
          state.receivingByRecordId.set(
            String(record.recordId),
            record
          );
        }
      }
    );
  }

  function renderDashboard(silent) {
    renderSnapshotState();
    renderModuleHeader();
    renderThresholds();
    renderSituation();
    renderCurrentStatus();
    renderReceiving();
    renderOverdueList();
    renderActionQueue();
    renderRecordTable();
    renderPeriodDependentData(silent);
    renderStatusChart(silent);
    renderLongestWaitingChart(silent);
    renderSystemSummary();
    scheduleFullscreenOnePageFit();
  }

  function renderPeriodDependentData(silent) {
    renderFlowSummary();
    renderHourlyChart(silent);
    renderActiveTrendChart(silent);
    renderProcessFunnel();
    renderSystemSummary();
  }

  function renderModuleHeader() {
    setText(
      'dashboardModuleTitle',
      state.module.name ||
      state.module.moduleName ||
      state.moduleId
    );

    setText(
      'dashboardModuleDescription',
      state.module.description ||
      'ติดตามรถและตู้สินค้าในพื้นที่แบบเรียลไทม์'
    );
  }

  function renderUserIdentity() {
    const user =
      state.session &&
      (
        state.session.user ||
        state.session
      ) ||
      {};

    setText(
      'dashboardUserName',
      user.displayName ||
      user.name ||
      user.username ||
      'ผู้ใช้งาน'
    );

    setText(
      'dashboardUserRole',
      String(user.role || 'Dashboard').toUpperCase()
    );
  }

  function renderThresholds() {
    const thresholds = getThresholds();

    setText(
      'dashboardWarningThreshold',
      thresholds.warningMinutes
    );

    setText(
      'dashboardOverdueThreshold',
      thresholds.redMinutes
    );

    setText(
      'dashboardAutoCloseThreshold',
      thresholds.autoCloseHours
    );
  }

  function renderSituation() {
    const counts = countStatuses();
    const receivingSummary = state.receiving.summary || {};
    const reconciliation = state.reconciliation || {};
    let code = 'NORMAL';
    let count = 0;
    let label = 'สถานการณ์ปกติ';
    let message = 'ไม่มีรายการที่ต้องเร่งสั่งการ';

    if (
      state.snapshotMode === 'INTEGRITY_ERROR' ||
      reconciliation.success !== true
    ) {
      code = 'DATA';
      count = Array.isArray(reconciliation.failedCheckIds)
        ? reconciliation.failedCheckIds.length
        : 1;
      label = 'ข้อมูลยังไม่ Reconcile';
      message = 'ตัวเลขและรายการไม่สมดุล ให้ Admin ตรวจสอบก่อนใช้ตัดสินใจ';
    } else if (Number(receivingSummary.dataConflict) > 0) {
      code = 'CRITICAL';
      count = Number(receivingSummary.dataConflict);
      label = 'พบข้อมูลขัดแย้ง';
      message = count + ' รายการต้องให้ Admin ตรวจสอบ';
    } else if (counts.OVERDUE > 0) {
      code = 'CRITICAL';
      count = counts.OVERDUE;
      label = 'ต้องเร่งดำเนินการ';
      message = count + ' รายการเกินเวลา';
    } else if (
      Number(receivingSummary.waitingDocumentReturn) > 0 ||
      Number(receivingSummary.waitingGateOut) > 0
    ) {
      code = 'ACTION';
      count =
        Number(receivingSummary.waitingDocumentReturn || 0) +
        Number(receivingSummary.waitingGateOut || 0);
      label = 'ติดตามขั้นตอนปลายทาง';
      message = count + ' รายการรอเอกสารคืนหรือ Gate Out';
    } else if (counts.WARNING > 0) {
      code = 'WATCH';
      count = counts.WARNING;
      label = 'ติดตามใกล้ชิด';
      message = count + ' รายการใกล้เกินเวลา';
    } else if (counts.INCOMPLETE > 0) {
      code = 'DATA';
      count = counts.INCOMPLETE;
      label = 'ตรวจสอบข้อมูล';
      message = count + ' รายการข้อมูลไม่สมบูรณ์';
    }

    const panel = byId('dashboardSituation');

    if (panel) {
      panel.dataset.state = code;
    }

    setText('dashboardSituationCount', count);
    setText('dashboardSituationLabel', label);
    setText('dashboardSituationMessage', message);
  }

  function renderCurrentStatus() {
    const counts = countStatuses();

    setText('kpiActive', state.records.length);
    setText('kpiNormal', counts.NORMAL);
    setText('kpiWarning', counts.WARNING);
    setText('kpiOverdue', counts.OVERDUE);
    setText('kpiIncomplete', counts.INCOMPLETE);
  }

  function renderFlowSummary() {
    const selected = getSelectedMovement();

    setText(
      'dashboardFlowPeriodLabel',
      state.period === 'TODAY'
        ? 'วันนี้'
        : 'ย้อนหลัง 24 ชั่วโมง'
    );

    setText(
      'summaryGateIn',
      Number(selected.in) || 0
    );

    setText(
      'summaryGateOut',
      Number(selected.outReal) || 0
    );

    setText(
      'summaryActive',
      state.records.length
    );

    setText('summaryModuleCount', 1);
  }

  function renderReceiving() {
    const section = byId('dashboardReceivingSection');
    const stageFilter = byId('dashboardStageFilter');

    if (!state.receiving || !Array.isArray(state.receiving.records)) {
      section?.classList.add('is-hidden');
      section?.setAttribute('aria-hidden', 'true');
      stageFilter?.classList.add('is-hidden');
      state.stageFilter = 'ALL';
      return;
    }

    section?.classList.remove('is-hidden');
    section?.removeAttribute('aria-hidden');
    stageFilter?.classList.remove('is-hidden');

    const summary = state.receiving.summary || {};

    setText(
      'kpiWaitingInboundDocument',
      Number(summary.waitingInboundDocument) || 0
    );
    setText(
      'kpiWaitingReceiving',
      Number(summary.waitingReceiving) || 0
    );
    setText(
      'kpiWaitingDocumentReturn',
      Number(summary.waitingDocumentReturn) || 0
    );
    setText(
      'kpiWaitingGateOut',
      Number(summary.waitingGateOut) || 0
    );
    setText(
      'kpiAverageStageOne',
      durationResultText(summary.averageArrivalToReceiving)
    );
    setText(
      'kpiAverageStageTwo',
      durationResultText(summary.averageReceivingToGateOut)
    );
  }

  function renderOverdueList() {
    const container = byId('dashboardOverdueList');

    if (!container) {
      return;
    }

    const items = state.records
      .filter(
        (record) =>
          record.statusCode === 'OVERDUE' ||
          record.statusCode === 'WARNING'
      )
      .sort(
        (left, right) =>
          statusPriority(left.statusCode) -
            statusPriority(right.statusCode) ||
          Number(right.durationSeconds) -
            Number(left.durationSeconds)
      )
      .slice(0, 7);

    const overdueCount = state.records.filter(
      (record) => record.statusCode === 'OVERDUE'
    ).length;

    setText(
      'dashboardOverdueListCount',
      overdueCount + ' รายการ'
    );

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          ไม่มีรายการเกินเวลาหรือเฝ้าระวัง
        </div>
      `;
      return;
    }

    container.innerHTML = items.map(
      (record, index) => {
        const dimensions =
          extractRecordDimensions(record);

        return `
          <button
            type="button"
            class="overdue-item"
            data-tone="${escapeHtml(record.statusCode)}"
            data-focus-record="${escapeHtml(dimensions.title)}"
          >
            <span class="overdue-item__rank">
              ${index + 1}
            </span>

            <span class="overdue-item__main">
              <strong>${escapeHtml(dimensions.title)}</strong>
              <span>${escapeHtml(dimensions.company)}</span>
            </span>

            <span class="overdue-item__time">
              ${escapeHtml(formatDuration(record.durationSeconds))}
            </span>
          </button>
        `;
      }
    ).join('');
  }

  function renderActionQueue() {
    const container = byId('dashboardActionQueue');

    if (!container) {
      return;
    }

    const queue = state.records
      .map(buildActionItem)
      .filter(Boolean)
      .sort(
        (left, right) =>
          left.priority - right.priority ||
          right.seconds - left.seconds
      )
      .slice(0, 8);

    setText(
      'dashboardActionCount',
      queue.length + ' รายการ'
    );

    if (queue.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          ไม่มีรายการที่ต้องสั่งการ
        </div>
      `;
      return;
    }

    container.innerHTML = queue.map(
      (item, index) => `
        <button
          type="button"
          class="action-item"
          data-priority="${escapeHtml(item.code)}"
          data-focus-record="${escapeHtml(item.title)}"
        >
          <span class="action-item__rank">
            ${index + 1}
          </span>

          <span class="action-item__main">
            <strong>${escapeHtml(item.title)}</strong>
            <small>${escapeHtml(item.action)}</small>
          </span>

          <span class="action-item__time">
            ${escapeHtml(formatDuration(item.seconds))}
          </span>
        </button>
      `
    ).join('');
  }

  function buildActionItem(record) {
    const receiving = state.receivingByRecordId.get(
      String(record.recordId || '')
    );
    const dimensions = extractRecordDimensions(record);
    const stageCode = receiving && receiving.stageCode || '';

    if (stageCode === 'DATA_CONFLICT') {
      return {
        priority: 0,
        code: 'DATA_CONFLICT',
        title: dimensions.title,
        action: 'ข้อมูลขัดแย้ง ให้ Admin ตรวจสอบ',
        seconds: Number(receiving.currentStageSeconds) || 0
      };
    }

    if (record.statusCode === 'OVERDUE') {
      return {
        priority: 1,
        code: 'OVERDUE',
        title: dimensions.title,
        action: 'เกิน SLA ต้องเร่งติดตาม',
        seconds: Number(record.durationSeconds) || 0
      };
    }

    const stageActions = {
      WAITING_INBOUND_DOCUMENT: 'รอ พขร.ยื่นเอกสารที่ห้อง Inbound',
      WAITING_RECEIVING: 'ยื่นเอกสารแล้ว รอบันทึกรับสินค้าเสร็จ',
      WAITING_DOCUMENT_RETURN: 'รับสินค้าเสร็จแล้ว รอห้อง Inbound คืนเอกสาร',
      WAITING_GATE_OUT: 'รับเอกสารคืนแล้ว รอ Gate Out จริง'
    };
    const priorities = {
      WAITING_GATE_OUT: 2,
      WAITING_DOCUMENT_RETURN: 3,
      WAITING_RECEIVING: 5,
      WAITING_INBOUND_DOCUMENT: 6
    };

    if (stageActions[stageCode]) {
      return {
        priority: priorities[stageCode],
        code: stageCode,
        title: dimensions.title,
        action: stageActions[stageCode],
        seconds: Number(receiving.currentStageSeconds) || 0
      };
    }

    if (record.statusCode === 'INCOMPLETE') {
      return {
        priority: 4,
        code: 'INCOMPLETE',
        title: dimensions.title,
        action: 'ตรวจสอบข้อมูลต้นทาง',
        seconds: Number(record.durationSeconds) || 0
      };
    }

    if (record.statusCode === 'WARNING') {
      return {
        priority: 7,
        code: 'WARNING',
        title: dimensions.title,
        action: 'ใกล้ถึงเกณฑ์เกินเวลา',
        seconds: Number(record.durationSeconds) || 0
      };
    }

    return null;
  }


  function resetRecordFilters() {
    state.searchText = '';
    state.statusFilter = 'ALL';
    state.stageFilter = 'ALL';

    const search =
      byId(
        'dashboardSearchInput'
      );

    const status =
      byId(
        'dashboardStatusFilter'
      );

    const stage =
      byId(
        'dashboardStageFilter'
      );

    if (search) {
      search.value = '';
    }

    if (status) {
      status.value = 'ALL';
    }

    if (stage) {
      stage.value = 'ALL';
    }

    renderRecordTable();
  }

  function renderRecordTable() {
    const tbody =
      byId(
        'dashboardRecordTableBody'
      );

    const mobileGrid =
      byId(
        'mobileRecordGrid'
      );

    if (
      !tbody ||
      !mobileGrid
    ) {
      return;
    }

    const allRecords =
      state.records
        .filter(
          recordMatchesFilters
        )
        .sort(
          compareRecords
        );

    const mobileRecords =
      allRecords.slice(
        0,
        state.mobileRecordLimit
      );

    const isMobile =
      window.matchMedia(
        '(max-width: 760px)'
      ).matches;

    setText(
      'dashboardRecordTotal',
      allRecords.length +
      ' รายการ'
    );

    updateMobileRecordControls(
      allRecords.length,
      mobileRecords.length,
      isMobile
    );

    byId(
      'dashboardRecordEmpty'
    )?.classList.toggle(
      'is-hidden',
      allRecords.length > 0
    );

    byId(
      'mobileRecordEmpty'
    )?.classList.toggle(
      'is-hidden',
      allRecords.length > 0
    );

    renderDesktopRecordTable(
      tbody,
      allRecords
    );

    renderMobileRecordCards(
      mobileGrid,
      mobileRecords
    );
  }


  function updateMobileRecordControls(
    total,
    visible,
    isMobile
  ) {
    const remaining =
      Math.max(
        0,
        total - visible
      );

    const counter =
      byId(
        'mobileRecordCounter'
      );

    if (counter) {
      counter.textContent =
        'แสดง ' +
        visible +
        '/' +
        total;
    }

    const loadMore =
      byId(
        'mobileLoadMoreRecords'
      );

    if (!loadMore) {
      return;
    }

    loadMore.classList.toggle(
      'is-hidden',
      !isMobile ||
      remaining <= 0
    );

    loadMore.textContent =
      remaining > 0
        ? 'เพิ่มอีก ' +
          Math.min(
            12,
            remaining
          )
        : 'ครบแล้ว';
  }


  function getRecordPresentation(
    record
  ) {
    const recordId =
      String(
        record.recordId ||
        ''
      );

    const receiving =
      state.receivingByRecordId.get(
        recordId
      );

    const dimensions =
      extractRecordDimensions(
        record
      );

    const stageCode =
      receiving &&
      receiving.stageCode ||
      'ACTIVE';

    const stageLabel =
      receiving &&
      receiving.stageLabel ||
      'อยู่ในพื้นที่';

    const stageSeconds =
      receiving &&
      (
        [
          'WAITING_INBOUND_DOCUMENT',
          'WAITING_RECEIVING',
          'WAITING_DOCUMENT_RETURN',
          'WAITING_GATE_OUT',
          'DATA_CONFLICT'
        ].includes(receiving.stageCode)
      )
        ? Number(
            receiving.currentStageSeconds
          ) || 0
        : Number(
            record.durationSeconds
          ) || 0;

    return {
      recordId,
      dimensions,
      stageCode,
      stageLabel,
      stageSeconds
    };
  }


  function renderDesktopRecordTable(
    tbody,
    records
  ) {
    tbody.innerHTML = '';

    const fragment =
      document.createDocumentFragment();

    records.forEach(
      (record, index) => {
        const view =
          getRecordPresentation(
            record
          );

        const row =
          document.createElement(
            'tr'
          );

        row.dataset.status =
          record.statusCode ||
          'INCOMPLETE';

        row.innerHTML = `
          <td>${index + 1}</td>

          <td>
            <span class="record-main">
              <strong>
                ${escapeHtml(
                  view.dimensions.company
                )}
              </strong>

              <small class="record-appointment">
                นัดหมาย
                ${escapeHtml(
                  view.dimensions.appointment
                )}
              </small>
            </span>
          </td>

          <td>
            <strong>
              ${escapeHtml(
                view.dimensions.identifier
              )}
            </strong>
          </td>

          <td>
            ${escapeHtml(
              formatDashboardDisplayDateTime(
                record.timestampIn
              )
            )}
          </td>

          <td>
            <strong
              class="record-duration"
              data-live-record="${escapeHtml(
                view.recordId
              )}"
            >
              ${escapeHtml(
                formatDuration(
                  view.stageSeconds
                )
              )}
            </strong>
          </td>

          <td>
            <span
              class="status-badge"
              data-status="${escapeHtml(
                record.statusCode ||
                'INCOMPLETE'
              )}"
            >
              ${escapeHtml(
                getStatusLabel(
                  record.statusCode
                )
              )}
            </span>
          </td>

          <td>
            <span
              class="stage-badge"
              data-stage="${escapeHtml(
                view.stageCode
              )}"
            >
              ${escapeHtml(
                view.stageLabel
              )}
            </span>
          </td>
        `;

        fragment.appendChild(
          row
        );
      }
    );

    tbody.appendChild(
      fragment
    );
  }


  function renderMobileRecordCards(
    mobileGrid,
    records
  ) {
    mobileGrid.innerHTML = '';

    const fragment =
      document.createDocumentFragment();

    records.forEach(
      (record, index) => {
        const view =
          getRecordPresentation(
            record
          );

        const card =
          document.createElement(
            'article'
          );

        card.className =
          'mobile-active-card';

        card.dataset.mobileRecordId =
          view.recordId;

        card.dataset.status =
          record.statusCode ||
          'INCOMPLETE';

        card.setAttribute(
          'role',
          'button'
        );

        card.setAttribute(
          'tabindex',
          '0'
        );

        card.setAttribute(
          'aria-label',
          'ดูรายละเอียด ' +
          view.dimensions.company +
          ' เลขนัดหมาย ' +
          view.dimensions.appointment
        );

        card.innerHTML = `
          <header class="mobile-active-card__header">
            <div>
              <small>บริษัท / Vendor</small>

              <h3>
                ${escapeHtml(
                  view.dimensions.company
                )}
              </h3>
            </div>

            <span class="mobile-active-card__rank">
              ${index + 1}
            </span>
          </header>

          <section class="mobile-active-card__appointment">
            <span>เลขนัดหมาย</span>

            <strong>
              ${escapeHtml(
                view.dimensions.appointment
              )}
            </strong>
          </section>

          <section class="mobile-active-card__information">
            <div class="mobile-active-card__field mobile-active-card__field--plate">
              <span>ทะเบียนรถ / หมายเลขตู้</span>

              <strong>
                ${escapeHtml(
                  view.dimensions.identifier
                )}
              </strong>
            </div>

            <div class="mobile-active-card__field mobile-active-card__field--gate-in">
              <span>เวลาเข้า Gate In</span>

              <strong>
                ${escapeHtml(
                  record.timestampIn ||
                  '-'
                )}
              </strong>
            </div>

            <div class="mobile-active-card__field mobile-active-card__field--duration">
              <span>ระยะเวลา</span>

              <strong
                data-live-record="${escapeHtml(
                  view.recordId
                )}"
              >
                ${escapeHtml(
                  formatDuration(
                    view.stageSeconds
                  )
                )}
              </strong>
            </div>

            ${
              view.dimensions.driver
                ? `
                    <div class="mobile-active-card__field mobile-active-card__field--driver">
                      <span>ชื่อผู้ขับ</span>

                      <strong>
                        ${escapeHtml(
                          view.dimensions.driver
                        )}
                      </strong>
                    </div>
                  `
                : ''
            }
          </section>

          <footer class="mobile-active-card__footer">
            <span
              class="status-badge"
              data-status="${escapeHtml(
                record.statusCode ||
                'INCOMPLETE'
              )}"
            >
              ${escapeHtml(
                getStatusLabel(
                  record.statusCode
                )
              )}
            </span>

            <span
              class="stage-badge"
              data-stage="${escapeHtml(
                view.stageCode
              )}"
            >
              ${escapeHtml(
                view.stageLabel
              )}
            </span>

            <span class="mobile-active-card__hint">
              แตะเพื่อดูข้อมูลเต็ม
            </span>
          </footer>
        `;

        card.addEventListener(
          'keydown',
          (event) => {
            if (
              event.key === 'Enter' ||
              event.key === ' '
            ) {
              event.preventDefault();

              showMobileRecordDetails(
                view.recordId
              );
            }
          }
        );

        fragment.appendChild(
          card
        );
      }
    );

    mobileGrid.appendChild(
      fragment
    );
  }

  function recordMatchesFilters(record) {
    if (
      state.statusFilter !== 'ALL' &&
      record.statusCode !== state.statusFilter
    ) {
      return false;
    }

    const receiving =
      state.receivingByRecordId.get(
        String(record.recordId || '')
      );

    if (
      state.stageFilter !== 'ALL' &&
      (
        !receiving ||
        receiving.stageCode !== state.stageFilter
      )
    ) {
      return false;
    }

    if (!state.searchText) {
      return true;
    }

    const dimensions =
      extractRecordDimensions(record);

    return [
      dimensions.title,
      dimensions.company,
      dimensions.identifier,
      record.searchText || '',
      receiving && receiving.stageLabel || ''
    ]
      .join(' ')
      .toLowerCase()
      .includes(state.searchText);
  }

  function renderHourlyChart(silent) {
    const canvas = byId('hourlyMovementChart');

    if (!canvas) {
      return;
    }

    const hours = getHourlyRows();

    byId('hourlyMovementEmpty')
      ?.classList.toggle(
        'is-hidden',
        hours.length > 0
      );

    canvas.classList.toggle(
      'is-hidden',
      hours.length === 0
    );

    if (hours.length === 0) {
      destroyChart('hourly');
      return;
    }

    const data = {
      labels: hours.map(getHourLabel),
      datasets: [
        {
          label: 'Gate In',
          data: hours.map(
            (hour) => Number(hour.in) || 0
          ),
          backgroundColor: COLORS.green,
          borderRadius: 3,
          barPercentage: .78,
          categoryPercentage: .78
        },
        {
          label: 'Gate Out จริง',
          data: hours.map(
            (hour) => Number(hour.outReal) || 0
          ),
          backgroundColor: COLORS.blue,
          borderRadius: 3,
          barPercentage: .78,
          categoryPercentage: .78
        },
        {
          label: 'ระบบเคลียร์อัตโนมัติ',
          data: hours.map(
            (hour) => Number(hour.outAuto) || 0
          ),
          backgroundColor: COLORS.purple,
          borderRadius: 3,
          barPercentage: .78,
          categoryPercentage: .78
        }
      ]
    };

    state.charts.hourly = upsertChart(
      state.charts.hourly,
      canvas,
      {
        type: 'bar',
        data: data,
        options: createCartesianOptions({
          silent: silent,
          stacked: false,
          legend: true,
          maxTicks: 12
        })
      }
    );
  }

  function renderStatusChart(silent) {
    const canvas =
      byId('statusDistributionChart');

    if (!canvas) {
      return;
    }

    const counts = countStatuses();

    const data = {
      labels: [
        'ปกติ',
        'เฝ้าระวัง',
        'เกินเวลา',
        'ข้อมูลไม่สมบูรณ์'
      ],
      datasets: [
        {
          data: [
            counts.NORMAL,
            counts.WARNING,
            counts.OVERDUE,
            counts.INCOMPLETE
          ],
          backgroundColor: [
            COLORS.green,
            COLORS.amber,
            COLORS.red,
            COLORS.purple
          ],
          borderColor: '#ffffff',
          borderWidth: 2,
          hoverOffset: 2
        }
      ]
    };

    state.charts.status = upsertChart(
      state.charts.status,
      canvas,
      {
        type: 'doughnut',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: silent
            ? false
            : {duration: 250},
          cutout: '62%',
          plugins: {
            legend: {
              position: 'right',
              labels: {
                usePointStyle: true,
                pointStyle: 'circle',
                boxWidth: 7,
                boxHeight: 7,
                padding: 8,
                color: COLORS.text,
                font: {
                  size: 8,
                  weight: '700'
                },
                generateLabels(chart) {
                  const safeLabels =
                    Array.isArray(
                      chart.data.labels
                    )
                      ? chart.data.labels
                      : [];

                  const dataset =
                    chart.data.datasets &&
                    chart.data.datasets[0]
                      ? chart.data.datasets[0]
                      : {};

                  const values =
                    Array.isArray(
                      dataset.data
                    )
                      ? dataset.data
                      : [];

                  const backgroundColors =
                    Array.isArray(
                      dataset.backgroundColor
                    )
                      ? dataset.backgroundColor
                      : [];

                  const borderColors =
                    Array.isArray(
                      dataset.borderColor
                    )
                      ? dataset.borderColor
                      : [];

                  const fallbackLabels = [
                    'ปกติ',
                    'เฝ้าระวัง',
                    'เกินเวลา',
                    'ข้อมูลไม่สมบูรณ์'
                  ];

                  const total =
                    values.reduce(
                      (sum, value) =>
                        sum +
                        (
                          Number(value) ||
                          0
                        ),
                      0
                    );

                  const itemCount =
                    Math.max(
                      safeLabels.length,
                      values.length,
                      fallbackLabels.length
                    );

                  return Array
                    .from({
                      length:
                        itemCount
                    })
                    .map(
                      (_, index) => {
                        const rawLabel =
                          safeLabels[index] ??
                          fallbackLabels[index] ??
                          'ไม่ทราบสถานะ';

                        const label =
                          String(
                            rawLabel ===
                              undefined ||
                            rawLabel ===
                              null ||
                            rawLabel ===
                              ''
                              ? (
                                  fallbackLabels[index] ||
                                  'ไม่ทราบสถานะ'
                                )
                              : rawLabel
                          );

                        const value =
                          Number(
                            values[index]
                          ) || 0;

                        const percent =
                          total > 0
                            ? (
                                value /
                                total *
                                100
                              ).toFixed(
                                1
                              )
                            : '0.0';

                        const fillColor =
                          backgroundColors[index] ||
                          COLORS.slate;

                        const strokeColor =
                          borderColors[index] ||
                          (
                            typeof dataset.borderColor ===
                              'string'
                              ? dataset.borderColor
                              : '#ffffff'
                          );

                        return {
                          text:
                            label +
                            ' ' +
                            value +
                            ' (' +
                            percent +
                            '%)',

                          fillStyle:
                            fillColor,

                          strokeStyle:
                            strokeColor,

                          lineWidth:
                            Number(
                              dataset.borderWidth
                            ) || 0,

                          hidden:
                            typeof chart
                              .getDataVisibility ===
                              'function'
                              ? !chart
                                  .getDataVisibility(
                                    index
                                  )
                              : false,

                          index:
                            index,

                          datasetIndex:
                            0,

                          pointStyle:
                            'circle'
                        };
                      }
                    );
                }
              }
            },
            tooltip: {
              callbacks: {
                label(context) {
                  const total =
                    context.dataset.data.reduce(
                      (sum, value) =>
                        sum + Number(value),
                      0
                    );

                  const value =
                    Number(context.raw) || 0;

                  const percent = total > 0
                    ? (
                        value / total * 100
                      ).toFixed(1)
                    : '0.0';

                  const fallbackLabels = [
                    'ปกติ',
                    'เฝ้าระวัง',
                    'เกินเวลา',
                    'ข้อมูลไม่สมบูรณ์'
                  ];

                  const safeLabel =
                    String(
                      context.label ||
                      fallbackLabels[
                        context.dataIndex
                      ] ||
                      'ไม่ทราบสถานะ'
                    );

                  return (
                    safeLabel +
                    ': ' +
                    value +
                    ' รายการ (' +
                    percent +
                    '%)'
                  );
                }
              }
            }
          }
        }
      }
    );
  }

  function renderActiveTrendChart(silent) {
    const canvas = byId('activeTrendChart');

    if (!canvas) {
      return;
    }

    const hours = getHourlyRows();

    const data = {
      labels: hours.map(getHourLabel),
      datasets: [
        {
          label: 'รายการ Active',
          data: deriveActiveTrend(
            hours,
            state.records.length
          ),
          borderColor: COLORS.blue,
          backgroundColor:
            'rgba(35, 105, 216, .14)',
          fill: true,
          tension: .32,
          pointRadius: 1.8,
          pointHoverRadius: 4,
          borderWidth: 2
        }
      ]
    };

    state.charts.activeTrend = upsertChart(
      state.charts.activeTrend,
      canvas,
      {
        type: 'line',
        data: data,
        options: createCartesianOptions({
          silent: silent,
          legend: false,
          maxTicks: 8
        })
      }
    );
  }

  function renderLongestWaitingChart(silent) {
    const canvas = byId('longestWaitingChart');

    if (!canvas) {
      return;
    }

    const groups = aggregateLongestWaiting();

    const data = {
      labels: groups.map(
        (item) => truncateText(item.label, 24)
      ),
      datasets: [
        {
          label: 'เวลารอสูงสุด',
          data: groups.map(
            (item) => Number(
              (item.seconds / 3600).toFixed(2)
            )
          ),
          backgroundColor: COLORS.blue,
          borderRadius: 4,
          barPercentage: .62
        }
      ]
    };

    const options = createCartesianOptions({
      silent: silent,
      legend: false,
      maxTicks: 6,
      horizontal: true
    });

    options.scales.x.ticks.callback =
      (value) => value + ' ชม.';

    options.plugins.tooltip = {
      callbacks: {
        label(context) {
          return (
            'เวลารอสูงสุด: ' +
            formatDuration(
              Number(context.raw) * 3600
            )
          );
        }
      }
    };

    state.charts.longestWaiting = upsertChart(
      state.charts.longestWaiting,
      canvas,
      {
        type: 'bar',
        data: data,
        options: options
      }
    );
  }

  function renderProcessFunnel() {
    const today =
      state.movement.today || {};

    const receivingSummary =
      state.receiving.summary || {};

    const gateIn =
      Number(
        today.in
      ) || 0;

    const receiving =
      Number(
        receivingSummary
          .receivingCompletedToday
      ) || 0;

    const gateOut =
      Number(
        today.outReal
      ) || 0;

    const missingReceiving =
      Number(
        receivingSummary
          .exitedWithoutReceivingToday
      ) || 0;

    const autoClose =
      Number(
        today.outAuto
      ) || 0;

    setText(
      'funnelGateIn',
      gateIn
    );

    setText(
      'funnelReceiving',
      receiving
    );

    setText(
      'funnelGateOut',
      gateOut
    );

    setText(
      'funnelMissingReceiving',
      missingReceiving
    );

    setText(
      'funnelAutoClose',
      autoClose
    );

    const percentOfGateIn =
      (value) =>
        gateIn > 0
          ? Math.round(
              Number(value) /
              gateIn *
              100
            )
          : 0;

    setText(
      'funnelGateInPercent',
      gateIn > 0
        ? '100%'
        : '0%'
    );

    setText(
      'funnelReceivingPercent',
      percentOfGateIn(
        receiving
      ) + '%'
    );

    setText(
      'funnelGateOutPercent',
      percentOfGateIn(
        gateOut
      ) + '%'
    );

    setText(
      'funnelMissingPercent',
      percentOfGateIn(
        missingReceiving
      ) + '%'
    );

    setText(
      'funnelAutoPercent',
      percentOfGateIn(
        autoClose
      ) + '%'
    );

    setText(
      'funnelCompletionRate',
      percentOfGateIn(
        gateOut
      ) + '%'
    );
  }

  function renderSystemSummary() {
    const selected = getSelectedMovement();

    const incomplete =
      state.records.filter(
        (record) =>
          record.statusCode === 'INCOMPLETE'
      ).length;

    const backendQuality = Number(state.dataQuality && state.dataQuality.score);
    const quality = Number.isFinite(backendQuality)
      ? Math.max(0, Math.min(100, Math.round(backendQuality)))
      : state.records.length > 0
        ? Math.max(
            0,
            Math.round(
              (
                state.records.length -
                incomplete
              ) /
              state.records.length *
              100
            )
          )
        : 100;

    setText(
      'summaryGateIn',
      Number(selected.in) || 0
    );

    setText(
      'summaryGateOut',
      Number(selected.outReal) || 0
    );

    setText(
      'summaryActive',
      state.records.length
    );

    setText(
      'summaryDataQuality',
      quality + '%'
    );
  }

  function recalculateRecords() {
    const nowMs = getServerNow().getTime();
    const thresholds = getThresholds();

    state.records.forEach(
      (record) => {
        const timestampInMs =
          Number(record.timestampInEpochMs);

        if (
          !record.isCurrentlyInArea ||
          !Number.isFinite(timestampInMs)
        ) {
          record.durationSeconds = 0;
          record.statusCode = 'INCOMPLETE';
          return;
        }

        record.durationSeconds = Math.max(
          0,
          Math.floor(
            (nowMs - timestampInMs) / 1000
          )
        );

        record.statusCode =
          record.durationSeconds >=
            thresholds.redSeconds
            ? 'OVERDUE'
            : record.durationSeconds >=
                thresholds.warningSeconds
              ? 'WARNING'
              : 'NORMAL';
      }
    );
  }

  function updateLiveDurations() {
    const nowMs = getServerNow().getTime();

    document
      .querySelectorAll('[data-live-record]')
      .forEach(
        (element) => {
          const recordId = String(
            element.dataset.liveRecord || ''
          );

          const record = state.records.find(
            (item) =>
              String(item.recordId || '') ===
              recordId
          );

          if (!record) {
            return;
          }

          const receiving =
            state.receivingByRecordId.get(recordId);

          let startMs = receiving
            ? operationalStageStartEpochMs(record, receiving.stageCode)
            : Number(record.timestampInEpochMs);

          const seconds =
            Number.isFinite(startMs)
              ? Math.max(
                  0,
                  Math.floor(
                    (nowMs - startMs) / 1000
                  )
                )
              : 0;

          element.textContent =
            formatDuration(seconds);
        }
      );
  }

  function renderSnapshotState() {
    const banner = byId('dashboardSnapshotBanner');

    if (!banner) {
      return;
    }

    const snapshot = state.snapshot || {};
    const reconciliation = state.reconciliation || {};
    const quality = state.dataQuality || {};
    const mode = state.snapshotMode || 'BLOCKED';
    const labels = {
      LIVE: 'ข้อมูลสดและ Reconcile แล้ว',
      STALE: 'ข้อมูลสำรองแบบอ่านอย่างเดียว',
      INTEGRITY_ERROR: 'ข้อมูลไม่สมดุล ห้ามใช้ตัดสินใจ',
      BLOCKED: 'ยังไม่มี Snapshot ที่เชื่อถือได้'
    };

    banner.dataset.state = mode;
    banner.classList.remove('is-hidden');
    setText('dashboardSnapshotState', labels[mode] || labels.BLOCKED);
    setText('dashboardSnapshotId', snapshot.snapshotId || '-');
    setText(
      'dashboardSnapshotReconciliation',
      reconciliation.success === true
        ? 'Source Active = Board = Stage (' +
          Number(reconciliation.boardActive || 0) + ')'
        : 'ไม่ผ่าน: ' +
          (Array.isArray(reconciliation.failedCheckIds)
            ? reconciliation.failedCheckIds.join(', ')
            : 'UNKNOWN')
    );
    setText(
      'dashboardSnapshotQuality',
      Number.isFinite(Number(quality.score))
        ? String(Math.round(Number(quality.score))) + '%'
        : '--'
    );
  }

  function operationalStageStartEpochMs(record, stageCode) {
    const code = String(stageCode || '').toUpperCase();
    const candidates = {
      WAITING_INBOUND_DOCUMENT: [record.timestampInEpochMs, record.timestampIn],
      WAITING_RECEIVING: [
        record.documentSubmittedEpochMs,
        record.documentSubmittedAt,
        record.timestampInEpochMs,
        record.timestampIn
      ],
      WAITING_DOCUMENT_RETURN: [
        record.receivingCompleteEpochMs,
        record.receivingCompleteAt,
        record.timestampInEpochMs,
        record.timestampIn
      ],
      WAITING_GATE_OUT: [
        record.documentReturnedEpochMs,
        record.documentReturnedAt,
        record.receivingCompleteEpochMs,
        record.receivingCompleteAt
      ],
      DATA_CONFLICT: [
        record.workflowUpdatedAt,
        record.timestampInEpochMs,
        record.timestampIn
      ]
    }[code] || [record.timestampInEpochMs, record.timestampIn];

    for (const value of candidates) {
      const numeric = Number(value);

      if (Number.isFinite(numeric) && numeric > 0) {
        return numeric;
      }

      const date = parseSystemDateTime(value);

      if (date) {
        return date.getTime();
      }
    }

    return NaN;
  }

  function getOperationalStageLabel(code) {
    return {
      WAITING_INBOUND_DOCUMENT: 'รอ พขร.ยื่นเอกสาร',
      WAITING_RECEIVING: 'รอรับสินค้าเสร็จ',
      WAITING_DOCUMENT_RETURN: 'พขร.รอรับเอกสารคืน',
      WAITING_GATE_OUT: 'รอ Gate Out',
      DATA_CONFLICT: 'ข้อมูลขัดแย้ง'
    }[String(code || '').toUpperCase()] || 'ไม่ทราบขั้นตอน';
  }

  function getThresholds() {
    const thresholds =
      state.movement.thresholds || {};

    const warningMinutes =
      Number(thresholds.warningStartMinutes) ||
      Number(state.module.warningStartMinutes) ||
      45;

    const redMinutes =
      Number(thresholds.redStartMinutes) ||
      Number(state.module.redStartMinutes) ||
      60;

    const autoCloseHours =
      Number(thresholds.autoCloseHours) ||
      36;

    return {
      warningMinutes,
      redMinutes,
      autoCloseHours,
      warningSeconds: warningMinutes * 60,
      redSeconds: redMinutes * 60
    };
  }

  function getSelectedMovement() {
    const selected =
      state.period === 'TODAY'
        ? state.movement.today
        : state.movement.rolling24;

    return selected &&
      typeof selected === 'object'
        ? selected
        : state.movement.currentRound || {};
  }

  function getHourlyRows() {
    const hours = state.movement.hours || {};

    return state.period === 'TODAY'
      ? (
          Array.isArray(hours.today)
            ? hours.today
            : []
        )
      : (
          Array.isArray(hours.rolling24)
            ? hours.rolling24
            : []
        );
  }

  function countStatuses() {
    const result = {
      NORMAL: 0,
      WARNING: 0,
      OVERDUE: 0,
      INCOMPLETE: 0
    };

    state.records.forEach(
      (record) => {
        const code = String(
          record.statusCode || 'INCOMPLETE'
        ).toUpperCase();

        if (
          Object.prototype.hasOwnProperty.call(
            result,
            code
          )
        ) {
          result[code] += 1;
        } else {
          result.INCOMPLETE += 1;
        }
      }
    );

    return result;
  }

  function statusPriority(code) {
    return {
      OVERDUE: 0,
      WARNING: 1,
      INCOMPLETE: 2,
      NORMAL: 3
    }[String(code || '')] ?? 9;
  }

  function compareRecords(left, right) {
    return (
      statusPriority(left.statusCode) -
      statusPriority(right.statusCode)
    ) || (
      Number(right.durationSeconds) -
      Number(left.durationSeconds)
    );
  }

  function extractRecordDimensions(record) {
    const fields =
      Array.isArray(record.fields)
        ? record.fields
        : [];

    const primary =
      String(
        record.primaryValue ||
        ''
      ).trim();

    const company =
      findFieldValue(
        fields,
        [
          'บริษัท',
          'ชื่อบริษัท',
          'vendor',
          'company',
          'ผู้รับบริการ',
          'ลูกค้า',
          'ผู้ขนส่ง',
          'หน่วยงาน'
        ]
      ) ||
      primary ||
      'ไม่ระบุบริษัท';

    const appointment =
      findFieldValue(
        fields,
        [
          'เลขนัดหมาย',
          'หมายเลขนัดหมาย',
          'นัดหมาย',
          'appointment',
          'booking',
          'เลข booking',
          'booking no',
          'เลขที่นัดหมาย'
        ]
      ) ||
      inferAppointmentNumber(
        fields,
        record
      );

    const identifier =
      findFieldValue(
        fields,
        [
          'ทะเบียน',
          'ทะเบียนรถ',
          'registration',
          'plate',
          'หมายเลขรถ',
          'เลขตู้',
          'container'
        ]
      ) ||
      '-';

    const driver =
      findFieldValue(
        fields,
        [
          'ชื่อคนขับ',
          'ชื่อผู้ขับ',
          'พนักงานขับรถ',
          'ผู้ขับ',
          'driver',
          'ชื่อ'
        ]
      );

    return {
      title:
        company,

      company:
        company,

      appointment:
        appointment || '-',

      identifier:
        identifier || '-',

      driver:
        driver || ''
    };
  }


  function inferAppointmentNumber(
    fields,
    record
  ) {
    const candidates =
      fields
        .filter(
          (field) =>
            field &&
            !field.primary
        )
        .map(
          (field) => ({
            label:
              normalizeText(
                field.label ||
                field.header ||
                field.name ||
                field.key ||
                ''
              ),

            value:
              String(
                field.value ??
                field.displayValue ??
                ''
              ).trim()
          })
        )
        .filter(
          (item) =>
            item.value &&
            /^\d{5,12}$/.test(
              item.value
            ) &&
            !item.label.includes(
              'โทร'
            ) &&
            !item.label.includes(
              'เบอร์'
            )
        );

    if (candidates.length > 0) {
      return candidates[0].value;
    }

    const sourceId =
      sourceRowIdentifier(
        record.recordId
      );

    return /^\d{5,12}$/.test(
      sourceId
    )
      ? sourceId
      : '';
  }

  function findFieldValue(fields, patterns) {
    const normalizedPatterns =
      patterns.map(normalizeText);

    for (const field of fields) {
      if (!field || field.primary) {
        continue;
      }

      const label = normalizeText(
        field.label ||
        field.header ||
        field.name ||
        field.key ||
        ''
      );

      const value = String(
        field.value ??
        field.displayValue ??
        ''
      ).trim();

      if (!value) {
        continue;
      }

      if (
        normalizedPatterns.some(
          (pattern) =>
            label.includes(pattern)
        )
      ) {
        return value;
      }
    }

    return '';
  }

  function firstSecondaryValue(fields) {
    const field = fields.find(
      (item) =>
        item &&
        !item.primary &&
        String(
          item.value ??
          item.displayValue ??
          ''
        ).trim()
    );

    return field
      ? String(
          field.value ??
          field.displayValue
        ).trim()
      : '';
  }

  function sourceRowIdentifier(recordId) {
    const text = String(recordId || '');
    const index = text.lastIndexOf(':');

    return index >= 0
      ? text.slice(index + 1)
      : text;
  }

  function aggregateLongestWaiting() {
    const groups = new Map();

    state.records.forEach(
      (record) => {
        const dimensions =
          extractRecordDimensions(record);

        const key =
          dimensions.company ||
          dimensions.title;

        const seconds =
          Number(record.durationSeconds) || 0;

        const current = groups.get(key);

        if (
          !current ||
          seconds > current.seconds
        ) {
          groups.set(
            key,
            {
              label: key,
              seconds: seconds
            }
          );
        }
      }
    );

    return Array.from(groups.values())
      .sort(
        (left, right) =>
          right.seconds - left.seconds
      )
      .slice(0, 5);
  }

  function deriveActiveTrend(
    hours,
    currentActive
  ) {
    if (
      !Array.isArray(hours) ||
      hours.length === 0
    ) {
      return [];
    }

    const netChanges = hours.map(
      (hour) =>
        (Number(hour.in) || 0) -
        (Number(hour.outReal) || 0) -
        (Number(hour.outAuto) || 0)
    );

    const totalNet = netChanges.reduce(
      (sum, value) => sum + value,
      0
    );

    let running = Math.max(
      0,
      Number(currentActive) - totalNet
    );

    return netChanges.map(
      (change) => {
        running = Math.max(
          0,
          running + change
        );

        return running;
      }
    );
  }

  function createCartesianOptions(options) {
    const config = options || {};
    const horizontal =
      config.horizontal === true;

    const indexAxis =
      horizontal ? 'y' : 'x';

    const valueAxis =
      horizontal ? 'x' : 'y';

    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: config.silent
        ? false
        : {duration: 220},
      indexAxis: indexAxis,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: config.legend !== false,
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'rectRounded',
            boxWidth: 7,
            boxHeight: 7,
            padding: 8,
            color: COLORS.text,
            font: {
              size: 7,
              weight: '700'
            }
          }
        },
        tooltip: {
          displayColors: true,
          bodyFont: {size: 9},
          titleFont: {size: 9}
        }
      },
      scales: {
        [indexAxis]: {
          stacked: config.stacked === true,
          grid: {
            display: horizontal,
            color: COLORS.grid
          },
          ticks: {
            color: COLORS.text,
            font: {size: 7},
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: config.maxTicks || 10
          },
          border: {display: false}
        },
        [valueAxis]: {
          stacked: config.stacked === true,
          beginAtZero: true,
          grid: {color: COLORS.grid},
          ticks: {
            color: COLORS.text,
            precision: 0,
            font: {size: 7}
          },
          border: {display: false}
        }
      }
    };
  }

  /************************************************************
   * ROUND 74 — Chart lifecycle guard
   *
   * แก้ปัญหา:
   * Canvas is already in use. Chart with ID '0'
   * must be destroyed before the canvas can be reused.
   *
   * สาเหตุ:
   * บางครั้ง DOM / CSS mobile layout / silent refresh ทำให้ state.charts
   * ไม่ตรงกับ Chart instance ที่ Chart.js ผูกอยู่กับ canvas จริง
   ************************************************************/

  function upsertChart(
    existingChart,
    canvas,
    config
  ) {
    if (
      !canvas ||
      typeof window.Chart === 'undefined'
    ) {
      return null;
    }

    const canvasChart =
      getChartOnCanvas(
        canvas
      );

    const reusableChart =
      existingChart &&
      existingChart.canvas === canvas &&
      existingChart.ctx
        ? existingChart
        : canvasChart;

    if (
      reusableChart &&
      reusableChart.canvas === canvas &&
      reusableChart.ctx
    ) {
      reusableChart.data =
        config.data;

      reusableChart.options =
        config.options;

      try {
        reusableChart.update(
          'none'
        );
      } catch (error) {
        safeDestroyChartInstance(
          reusableChart
        );

        return createFreshChart(
          canvas,
          config
        );
      }

      return reusableChart;
    }

    if (
      existingChart &&
      existingChart !== canvasChart
    ) {
      safeDestroyChartInstance(
        existingChart
      );
    }

    if (canvasChart) {
      safeDestroyChartInstance(
        canvasChart
      );
    }

    return createFreshChart(
      canvas,
      config
    );
  }


  function createFreshChart(
    canvas,
    config
  ) {
    const currentChart =
      getChartOnCanvas(
        canvas
      );

    if (currentChart) {
      safeDestroyChartInstance(
        currentChart
      );
    }

    return new Chart(
      canvas,
      config
    );
  }


  function getChartOnCanvas(
    canvas
  ) {
    if (
      !canvas ||
      typeof window.Chart === 'undefined' ||
      typeof window.Chart.getChart !== 'function'
    ) {
      return null;
    }

    try {
      return (
        window.Chart.getChart(
          canvas
        ) || null
      );
    } catch (error) {
      return null;
    }
  }


  function safeDestroyChartInstance(
    chart
  ) {
    if (!chart) {
      return;
    }

    try {
      if (
        typeof chart.destroy === 'function'
      ) {
        chart.destroy();
      }
    } catch (error) {
      console.warn(
        'ทำลาย Chart เดิมไม่สำเร็จ',
        error
      );
    }
  }


  function destroyChart(name) {
    const chart =
      state.charts[name];

    safeDestroyChartInstance(
      chart
    );

    state.charts[name] =
      null;

    const canvasIdMap = {
      hourly:
        'hourlyMovementChart',

      status:
        'statusDistributionChart',

      activeTrend:
        'activeTrendChart',

      longestWaiting:
        'longestWaitingChart'
    };

    const canvasId =
      canvasIdMap[name];

    if (canvasId) {
      const canvas =
        byId(
          canvasId
        );

      const canvasChart =
        getChartOnCanvas(
          canvas
        );

      safeDestroyChartInstance(
        canvasChart
      );
    }
  }

  function resizeCharts() {
    Object.values(state.charts)
      .forEach(
        (chart) => chart?.resize()
      );
  }

  function startClock() {
    updateClock();

    state.clockTimer = window.setInterval(
      () => {
        updateClock();
        updateLiveDurations();
      },
      1000
    );
  }

  function updateClock() {
    setText(
      'dashboardCurrentDateTime',
      formatBangkokDateTime(
        getServerNow()
      )
    );
  }

  function scheduleRefresh() {
    if (state.destroyed) {
      return;
    }

    if (state.refreshTimer) {
      window.clearTimeout(
        state.refreshTimer
      );
    }

    const seconds = Math.max(
      10,
      Math.min(
        60,
        Number(state.module.refreshSeconds) ||
        Number(CONFIG.REFRESH_SECONDS) ||
        15
      )
    );

    state.refreshTimer = window.setTimeout(
      () => {
        if (
          document.visibilityState === 'visible'
        ) {
          void refreshDashboard({silent: true});
        } else {
          scheduleRefresh();
        }
      },
      seconds * 1000
    );
  }

  function buildStableSignature() {
    return JSON.stringify({
      snapshotId: state.snapshot && state.snapshot.snapshotId || '',
      snapshotMode: state.snapshotMode,
      reconciliation: state.reconciliation || {},
      module: {
        id:
          state.module.id ||
          state.module.moduleId,
        name: state.module.name,
        description:
          state.module.description,
        refreshSeconds:
          state.module.refreshSeconds
      },

      records: state.records.map(
        (record) => ({
          id: record.recordId,
          status: record.statusCode,
          timestampIn:
            record.timestampInEpochMs,
          timestampOut:
            record.timestampOutEpochMs,
          primary: record.primaryValue,
          stage: record.operationalStage || '',
          dataHealth: record.dataHealthCode || ''
        })
      ),

      movement: {
        thresholds:
          state.movement.thresholds || {},
        currentState:
          state.movement.currentState || {},
        today:
          stableMetric(
            state.movement.today
          ),
        rolling24:
          stableMetric(
            state.movement.rolling24
          ),
        todayHours:
          stableHours(
            state.movement.hours &&
            state.movement.hours.today
          ),
        rollingHours:
          stableHours(
            state.movement.hours &&
            state.movement.hours.rolling24
          )
      },

      receiving: {
        enabled:
          state.receiving.enabled,
        summary:
          state.receiving.summary,
        records: (
          state.receiving.records || []
        ).map(
          (record) => ({
            id: record.recordId,
            stage: record.stageCode,
            receiving:
              record.receivingCompleteEpochMs,
            out:
              record.timestampOutEpochMs
          })
        )
      }
    });
  }

  function stableMetric(metric) {
    const source =
      metric &&
      typeof metric === 'object'
        ? metric
        : {};

    return {
      in: Number(source.in) || 0,
      outReal: Number(source.outReal) || 0,
      outAuto: Number(source.outAuto) || 0,
      outTotal: Number(source.outTotal) || 0,
      movementTotal:
        Number(source.movementTotal) || 0,
      net: Number(source.net) || 0
    };
  }

  function stableHours(hours) {
    return (
      Array.isArray(hours)
        ? hours
        : []
    ).map(
      (hour) => ({
        label: getHourLabel(hour),
        in: Number(hour.in) || 0,
        outReal:
          Number(hour.outReal) || 0,
        outAuto:
          Number(hour.outAuto) || 0,
        outTotal:
          Number(hour.outTotal) || 0
      })
    );
  }

  function updateServerOffset(value) {
    const date = parseSystemDateTime(value);

    if (date) {
      state.serverOffsetMs =
        date.getTime() -
        Date.now();
    }
  }

  function formatDashboardDisplayDateTime(
    value
  ) {
    const text =
      String(value || '')
        .trim();

    if (!text) {
      return '-';
    }

    if (
      /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(text)
    ) {
      return text;
    }

    const parsedBySystem =
      parseSystemDateTime(
        text
      );

    if (parsedBySystem) {
      return formatBangkokDateTime(
        parsedBySystem
      );
    }

    const nativeDate =
      new Date(text);

    if (
      !Number.isNaN(
        nativeDate.getTime()
      )
    ) {
      return formatBangkokDateTime(
        nativeDate
      );
    }

    const isoMatch =
      text.match(
        /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/
      );

    if (isoMatch) {
      const date =
        new Date(
          isoMatch[1] + '-' +
          isoMatch[2] + '-' +
          isoMatch[3] + 'T' +
          isoMatch[4] + ':' +
          isoMatch[5] + ':' +
          isoMatch[6] + '+07:00'
        );

      if (
        !Number.isNaN(
          date.getTime()
        )
      ) {
        return formatBangkokDateTime(
          date
        );
      }
    }

    return text;
  }


  function parseSystemDateTime(value) {
    const text = String(value || '').trim();

    const match = text.match(
      /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/
    );

    if (!match) {
      return null;
    }

    const date = new Date(
      match[3] + '-' +
      match[2] + '-' +
      match[1] + 'T' +
      match[4] + ':' +
      match[5] + ':' +
      match[6] + '+07:00'
    );

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  function getServerNow() {
    return new Date(
      Date.now() +
      state.serverOffsetMs
    );
  }

  function formatBangkokDateTime(date) {
    const parts =
      new Intl.DateTimeFormat(
        'en-GB',
        {
          timeZone: 'Asia/Bangkok',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }
      )
        .formatToParts(date)
        .reduce(
          (result, part) => {
            result[part.type] =
              part.value;
            return result;
          },
          {}
        );

    return (
      parts.day + '/' +
      parts.month + '/' +
      parts.year + ' ' +
      parts.hour + ':' +
      parts.minute + ':' +
      parts.second
    );
  }

  function formatDuration(seconds) {
    const total = Math.max(
      0,
      Math.floor(Number(seconds) || 0)
    );

    const hours = Math.floor(total / 3600);
    const minutes = Math.floor(
      (total % 3600) / 60
    );
    const remaining = total % 60;

    return (
      String(hours).padStart(2, '0') +
      ':' +
      String(minutes).padStart(2, '0') +
      ':' +
      String(remaining).padStart(2, '0')
    );
  }

  function durationResultText(result) {
    return result && result.display
      ? result.display
      : '--:--:--';
  }

  function getStatusLabel(code) {
    return {
      NORMAL: 'ปกติ',
      WARNING: 'เฝ้าระวัง',
      OVERDUE: 'เกินเวลา',
      INCOMPLETE: 'ข้อมูลไม่สมบูรณ์'
    }[String(code || '')] ||
      'ไม่ทราบสถานะ';
  }

  function getHourLabel(hour) {
    return String(
      hour.label ||
      hour.hourLabel ||
      hour.hour ||
      '--:00'
    );
  }

  function normalizeText(value) {
    return String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
  }

  function truncateText(value, maxLength) {
    const text = String(value || '');

    return text.length > maxLength
      ? text.slice(0, maxLength - 1) + '…'
      : text;
  }

  function setConnectionState(code, text) {
    const element = byId('dashboardConnection');

    if (element) {
      element.dataset.state = code;
      element.textContent = text;
    }
  }

  function setRefreshButtonLoading(loading) {
    const button = byId('dashboardRefreshButton');

    if (!button) {
      return;
    }

    button.disabled = loading;

    const label = button.querySelector('span');

    if (label) {
      label.textContent = loading
        ? 'กำลังอัปเดต'
        : 'รีเฟรช';
    }
  }

  function showLoading(show) {
    byId('dashboardLoading')
      ?.classList.toggle(
        'is-hidden',
        !show
      );
  }

  async function showError(error, title) {
    /* Guard กลาง: ห้าม Modal ถูก Loading Overlay บัง */
    showLoading(false);

    const message =
      error && error.message ||
      'เกิดข้อผิดพลาด';
    const detailParts = [];

    if (error && error.code) {
      detailParts.push('Code: ' + String(error.code));
    }

    if (error && error.requestId) {
      detailParts.push('Request ID: ' + String(error.requestId));
    }

    if (!window.Swal) {
      window.alert(
        (title || 'เกิดข้อผิดพลาด') +
        '\n' + message +
        (detailParts.length ? '\n' + detailParts.join(' | ') : '')
      );
      return;
    }

    await window.Swal.fire({
      icon: 'error',
      title: title,
      text: message,
      footer: detailParts.length
        ? escapeHtml(detailParts.join(' | '))
        : '',
      confirmButtonText: 'ตกลง',
      allowOutsideClick: false
    });
  }

  function isAuthenticationError(error) {
    return Boolean(
      error &&
      (
        error.status === 401 ||
        [
          'AUTH_REQUIRED',
          'SESSION_EXPIRED',
          'INVALID_SESSION'
        ].includes(error.code)
      )
    );
  }

  function getSessionRole(session) {
    const user =
      session &&
      session.user &&
      typeof session.user === 'object'
        ? session.user
        : session || {};

    return String(
      user.role ||
      'USER'
    )
      .trim()
      .toUpperCase();
  }

  function isDashboardAllowedRole(session) {
    const role =
      getSessionRole(session);

    return (
      role === 'USER' ||
      role === 'ADMIN'
    );
  }

  function redirectToInbound() {
    window.location.replace(
      String(
        CONFIG.INBOUND_URL ||
        '../inbound.html'
      )
    );
  }

  function redirectToLogin() {
    API?.clearSession?.();

    window.location.replace(
      String(
        CONFIG.LOGIN_URL ||
        '../login.html'
      )
    );
  }

  function goBackToModule() {
    window.location.href =
      String(
        CONFIG.MODULE_URL ||
        '../module.html'
      ) +
      '?id=' +
      encodeURIComponent(
        state.moduleId
      );
  }

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement
        .requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }

  function syncFullscreenButton() {
    const label =
      document.querySelector(
        '[data-fullscreen-label]'
      );

    const button =
      byId('dashboardFullscreenButton');

    if (label) {
      label.textContent =
        document.fullscreenElement
          ? 'ออกเต็มจอ'
          : 'เต็มจอ';
    }

    button?.setAttribute(
      'aria-pressed',
      String(
        Boolean(
          document.fullscreenElement
        )
      )
    );

    window.setTimeout(
      resizeCharts,
      80
    );

    scheduleFullscreenOnePageFit(true);
  }


  function initializeFullscreenOnePageFit() {
    /*
     * ห้ามใช้ ResizeObserver/MutationObserver กับ .control-main
     * เพราะ Fullscreen Fit เปลี่ยนขนาดและ class ของพื้นที่เดียวกัน
     * ทำให้เกิด feedback loop และหน้าจอกระพริบต่อเนื่อง
     *
     * การคำนวณจะเกิดเฉพาะ:
     * - เข้า/ออก Fullscreen
     * - เปลี่ยนหน้า LIVE/SHIFT/DAILY
     * - Render ข้อมูลชุดใหม่เสร็จ
     * - ขนาดหน้าต่างเปลี่ยนจริง
     */
    if (
      document.fonts &&
      document.fonts.ready
    ) {
      document.fonts.ready
        .then(
          () => {
            scheduleFullscreenOnePageFit(true);
          }
        )
        .catch(
          () => {}
        );
    }

    scheduleFullscreenOnePageFit(true);
  }


  function scheduleFullscreenOnePageFit(
    immediate
  ) {
    if (state.destroyed) {
      return;
    }

    if (fullscreenFitTimer) {
      window.clearTimeout(
        fullscreenFitTimer
      );
    }

    fullscreenFitTimer =
      window.setTimeout(
        () => {
          fullscreenFitTimer =
            null;

          window.requestAnimationFrame(
            applyFullscreenOnePageFit
          );
        },
        immediate === true
          ? 0
          : 180
      );
  }


  function applyFullscreenOnePageFit() {
    if (fullscreenFitApplying) {
      return;
    }

    const target =
      document.querySelector(
        '.control-main'
      );

    const isDesktopFullscreen =
      Boolean(
        document.fullscreenElement
      ) &&
      window.innerWidth >= 1000 &&
      window.innerHeight >= 620;

    if (
      !target ||
      !isDesktopFullscreen
    ) {
      resetFullscreenOnePageFit();
      return;
    }

    fullscreenFitApplying = true;

    try {
      document.body.classList.add(
        'dashboard-one-page-fullscreen'
      );

      const snapshotBanner =
        document.getElementById(
          'dashboardSnapshotBanner'
        );

      if (
        snapshotBanner &&
        snapshotBanner.open
      ) {
        snapshotBanner.open =
          false;
      }

      /*
       * ห้ามย่อทั้ง Dashboard ด้วย transform: scale()
       * เพราะทำให้:
       * - Font และ Icon เสียสัดส่วน
       * - การ์ดภายในคำนวณความสูงผิด
       * - Canvas Chart ถูกตัดหรือเบลอ
       *
       * Fullscreen ใช้ Native CSS Grid ตาม viewport จริงแทน
       */
      document.documentElement
        .style.setProperty(
          '--dashboard-fullscreen-scale',
          '1'
        );

      target.dataset.fullscreenFit =
        'NATIVE';

      target.dataset.fullscreenScale =
        '1.000';

      const view =
        document.body
          .dataset
          .dashboardView ||
        'LIVE';

      const viewChanged =
        view !==
        fullscreenFitLastView;

      fullscreenFitLastScale =
        1;

      fullscreenFitLastView =
        view;

      if (
        viewChanged ||
        !fullscreenFitChartTimer
      ) {
        if (fullscreenFitChartTimer) {
          window.clearTimeout(
            fullscreenFitChartTimer
          );
        }

        fullscreenFitChartTimer =
          window.setTimeout(
            () => {
              fullscreenFitChartTimer =
                null;

              resizeCharts();
            },
            120
          );
      }

    } finally {
      fullscreenFitApplying =
        false;
    }
  }


  function resetFullscreenOnePageFit() {
    const target =
      document.querySelector(
        '.control-main'
      );

    document.body.classList.remove(
      'dashboard-one-page-fullscreen'
    );

    document.documentElement
      .style.removeProperty(
        '--dashboard-fullscreen-scale'
      );

    if (target) {
      delete target.dataset
        .fullscreenFit;
      delete target.dataset
        .fullscreenScale;
    }

    fullscreenFitLastScale =
      1;

    fullscreenFitLastView =
      '';
  }


  function focusRecordsPanel() {
    const panel =
      document.querySelector(
        '.records-panel'
      );

    if (
      panel &&
      window.innerWidth < 1180
    ) {
      panel.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }

  function setText(id, value) {
    const element = byId(id);

    if (element) {
      element.textContent = String(
        value === null ||
        value === undefined
          ? ''
          : value
      );
    }
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(
      value === null ||
      value === undefined
        ? ''
        : value
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getModuleIdFromUrl() {
    return String(
      new URL(
        window.location.href
      ).searchParams.get('module') || ''
    ).trim();
  }

  function debounce(fn, wait) {
    let timer;

    return function (...args) {
      window.clearTimeout(timer);

      timer = window.setTimeout(
        () => fn(...args),
        wait
      );
    };
  }

  function destroyDashboard() {
    state.destroyed = true;

    if (state.refreshTimer) {
      window.clearTimeout(
        state.refreshTimer
      );
    }

    if (state.clockTimer) {
      window.clearInterval(
        state.clockTimer
      );
    }

    if (fullscreenFitTimer) {
      window.clearTimeout(
        fullscreenFitTimer
      );
    }

    if (fullscreenFitChartTimer) {
      window.clearTimeout(
        fullscreenFitChartTimer
      );
    }

    resetFullscreenOnePageFit();

    Object.keys(state.charts)
      .forEach(destroyChart);
  }

})(window, document);


/* ============================================================
 * SOURCE 04: dashboard-shift-context(5).js
 * ============================================================ */
/**
 * dashboard-shift-context.js
 * PHASE 4D HOTFIX 7 — Expanded Daily History
 */
(function (window, document) {
  'use strict';

  const API =
    window.DashboardAPI;

  const state = {
    moduleId:
      '',

    view:
      'LIVE',

    selectedDate:
      '',

    followCurrentBusinessDate:
      true,

    data:
      null,

    loading:
      false,

    requestToken:
      0,

    refreshTimer:
      null,

    layoutTimer:
      null,

    resizeObserver:
      null,

    charts: {
      flow:
        null,

      sla:
        null,

      history:
        null,

      processShare:
        null,

      processSla:
        null
    }
  };


  document.addEventListener(
    'DOMContentLoaded',
    initialize
  );


  function initialize() {
    state.moduleId =
      getModuleId();

    state.selectedDate =
      normalizeBusinessDateValue(
        todayIso()
      );

    const dateInput =
      byId(
        'dashboardShiftDate'
      );

    if (dateInput) {
      dateInput.value =
        state.selectedDate;

      dateInput.max =
        todayIso();
    }

    document.body.dataset
      .dashboardView =
        'LIVE';

    bindEvents();
    bindLayoutObservers();
    syncViewportMetrics();
  }


  function bindEvents() {
    byId(
      'dashboardViewToolbar'
    )?.addEventListener(
      'click',
      (event) => {
        const button =
          event.target.closest(
            '[data-dashboard-view]'
          );

        if (!button) {
          return;
        }

        setView(
          button.dataset
            .dashboardView
        );
      }
    );

    byId(
      'dashboardShiftCalendarButton'
    )?.addEventListener(
      'click',
      openHistoricalCalendar
    );

    byId(
      'dashboardShiftDate'
    )?.addEventListener(
      'change',
      (event) => {
        state.selectedDate =
          normalizeBusinessDateValue(
            event.target.value ||
            todayIso()
          );

        state.followCurrentBusinessDate =
          false;

        state.data =
          null;

        if (
          state.view ===
          'LIVE'
        ) {
          setView(
            'DAILY'
          );

          return;
        }

        loadShiftDashboard();
      }
    );

    byId(
      'dashboardShiftPreviousDate'
    )?.addEventListener(
      'click',
      () => {
        changeDate(-1);
      }
    );

    byId(
      'dashboardShiftNextDate'
    )?.addEventListener(
      'click',
      () => {
        changeDate(1);
      }
    );

    byId(
      'dashboardShiftToday'
    )?.addEventListener(
      'click',
      () => {
        state.followCurrentBusinessDate =
          true;

        state.selectedDate =
          todayIso();

        state.data =
          null;

        syncDateInput();
        loadShiftDashboard();
      }
    );

    byId(
      'dashboardRefreshButton'
    )?.addEventListener(
      'click',
      () => {
        if (
          state.view !==
          'LIVE'
        ) {
          loadShiftDashboard(
            true
          );
        }
      }
    );

    document.addEventListener(
      'click',
      (event) => {
        const metricButton =
          event.target.closest(
            '[data-metric-info]'
          );

        if (metricButton) {
          openMetricInformation(
            metricButton.dataset
              .metricInfo,
            metricButton.dataset
              .shiftCode ||
              ''
          );

          return;
        }

        const button =
          event.target.closest(
            '[data-dashboard-info]'
          );

        if (button) {
          openDashboardInfo(
            button.dataset
              .dashboardInfo
          );
        }
      }
    );

    window.addEventListener(
      'beforeunload',
      destroy
    );
  }


  function setView(
    view
  ) {
    const next =
      String(
        view ||
        'LIVE'
      ).toUpperCase();

    state.view =
      [
        'LIVE',
        'SHIFT',
        'DAILY',
        'PROCESS'
      ].includes(next)
        ? next
        : 'LIVE';

    document.body.dataset
      .dashboardView =
        state.view;

    document.dispatchEvent(
      new CustomEvent(
        'dashboard:view-changed',
        {
          detail: {
            view:
              state.view
          }
        }
      )
    );

    document
      .querySelectorAll(
        '[data-dashboard-view]'
      )
      .forEach(
        (button) => {
          button.classList.toggle(
            'is-active',
            button.dataset
              .dashboardView ===
              state.view
          );
        }
      );

    const controls =
      byId(
        'dashboardShiftDateControls'
      );

    const workspace =
      byId(
        'dashboardShiftWorkspace'
      );

    if (controls) {
      controls.hidden =
        false;

      controls.dataset.mode =
        state.view ===
          'LIVE'
          ? 'HISTORY'
          : state.view;
    }

    if (workspace) {
      workspace.hidden =
        state.view ===
        'LIVE';
    }

    if (
      state.view ===
      'LIVE'
    ) {
      stopRefreshTimer();
      return;
    }

    if (!state.data) {
      loadShiftDashboard();
    } else {
      render();
    }

    scheduleRefresh();
    scheduleLayoutRefresh();
  }


  async function loadShiftDashboard(
    force
  ) {
    if (
      state.loading ||
      state.view ===
        'LIVE' ||
      !state.moduleId ||
      !API ||
      typeof API
        .getShiftDashboard !==
        'function'
    ) {
      return;
    }

    const token =
      ++state.requestToken;

    state.loading =
      true;

    const loadingMessage =
      force === true
        ? 'กำลังอัปเดตข้อมูลล่าสุด'
        : state.view === 'PROCESS'
          ? 'กำลังวิเคราะห์วงจรรถและเอกสาร'
          : state.view === 'DAILY'
            ? 'กำลังสรุปข้อมูลรายวัน'
            : 'กำลังวิเคราะห์ข้อมูลตามกะ';

    if (state.data) {
      setWorkspaceBusy(
        true,
        loadingMessage
      );
    } else {
      renderLoading(
        loadingMessage
      );
    }

    try {
      const data =
        await API
          .getShiftDashboard(
            state.moduleId,
            state.followCurrentBusinessDate
              ? {}
              : {
                  date:
                    state.selectedDate
                }
          );

      if (
        token !==
        state.requestToken
      ) {
        return;
      }

      state.data =
        data || null;

      if (
        state.followCurrentBusinessDate &&
        data &&
        data.businessDate
      ) {
        state.selectedDate =
          normalizeBusinessDateValue(
            data.businessDate
          );

        syncDateInput();
      }

      render();

    } catch (error) {
      if (
        token !==
        state.requestToken
      ) {
        return;
      }

      renderError(
        error
      );

    } finally {
      if (
        token ===
        state.requestToken
      ) {
        state.loading =
          false;

        setWorkspaceBusy(
          false
        );
      }

      scheduleRefresh();
    }
  }


  function render() {
    const workspace =
      byId(
        'dashboardShiftWorkspace'
      );

    if (
      !workspace ||
      !state.data
    ) {
      return;
    }

    destroyCharts();

    if (
      state.data.enabled !==
      true
    ) {
      workspace.innerHTML =
        disabledHtml();

      return;
    }

    workspace.innerHTML =
      state.view === 'DAILY'
        ? dailyHtml(
            state.data
          )
        : state.view === 'PROCESS'
          ? processHtml(
              state.data
            )
          : shiftHtml(
              state.data
            );

    if (
      state.view === 'DAILY'
    ) {
      renderHistoryChart(
        state.data
      );
    } else if (
      state.view === 'PROCESS'
    ) {
      renderProcessCharts(
        state.data
      );
    } else {
      renderFlowChart(
        state.data
      );

      renderSlaChart(
        state.data
      );
    }

    bindWorkspaceEvents();
    scheduleLayoutRefresh();

    document.dispatchEvent(
      new CustomEvent(
        'dashboard:content-ready',
        {
          detail: {
            view:
              state.view,
            businessDate:
              state.selectedDate
          }
        }
      )
    );
  }


  function shiftHtml(
    data
  ) {
    const cards =
      Array.isArray(
        data.shifts
      )
        ? data.shifts
        : [];

    const daily =
      data.daily ||
      {};

    const metric =
      daily.metrics ||
      {};

    const executive =
      data.executive ||
      {};

    const method =
      data.methodology ||
      {};

    const referenceCount =
      cards.reduce(
        (maximum, card) =>
          Math.max(
            maximum,
            Number(
              card.context &&
              card.context
                .historicalSampleCount
            ) || 0
          ),
        0
      );

    return `
      <header class="shift-executive-header">
        <div>
          <small>
            การวิเคราะห์ตามบริบทภาระงาน
          </small>

          <div class="shift-title-line">
            <h2>
              ผลงานตามกะ
            </h2>

            <button
              type="button"
              class="dashboard-info-button"
              data-dashboard-info="shift"
              aria-label="อธิบายการวิเคราะห์ตามกะ"
            >
              i
            </button>
          </div>

          <p>
            วันปฏิบัติงาน
            <strong>
              ${escapeHtml(
                data.businessDate ||
                '-'
              )}
            </strong>

            · เกณฑ์รายคัน
            <strong>
              ${formatNumber(
                method.redMinutes
              )}
              นาที
            </strong>

            · อ้างอิงย้อนหลังสูงสุด
            <strong>
              ${formatNumber(
                referenceCount
              )}
              กะ
            </strong>
          </p>

          <div class="shift-methodology-note">
            ไม่ใช้เปอร์เซ็นต์เป้าหมายตายตัว
            · พิจารณาจำนวนจริง ภาระงาน คงค้าง และช่วงข้อมูลย้อนหลังร่วมกัน
          </div>
        </div>

        <div class="shift-executive-badges">
          ${
            executive.currentShiftCode
              ? `
                  <span class="is-live">
                    กะปัจจุบัน
                    ${escapeHtml(
                      executive.currentShiftCode
                    )}
                  </span>
                `
              : ''
          }

          ${
            executive.highestWorkloadShiftCode
              ? `
                  <span class="is-workload">
                    ภาระงานสูงสุด
                    ${escapeHtml(
                      executive
                        .highestWorkloadShiftCode
                    )}
                  </span>
                `
              : ''
          }

          ${
            executive.backlogReductionShiftCode
              ? `
                  <span class="is-best">
                    ลดคงค้างมากสุด
                    ${escapeHtml(
                      executive
                        .backlogReductionShiftCode
                    )}
                  </span>
                `
              : ''
          }

          ${
            executive.highWaitShiftCode
              ? `
                  <span class="is-attention">
                    เวลารอสูงสุด
                    ${escapeHtml(
                      executive
                        .highWaitShiftCode
                    )}
                  </span>
                `
              : ''
          }
        </div>
      </header>

      <section class="shift-executive-kpis">
        ${executiveKpi(
          'เข้าพื้นที่',
          metric.gateIn,
          'รายการ',
          '',
          'gateIn'
        )}

        ${executiveKpi(
          'ออกจริง',
          metric.gateOutActual,
          'รายการ',
          '',
          'gateOut'
        )}

        ${executiveKpi(
          'คงค้างเปลี่ยนแปลง',
          signed(
            metricBacklogChange(
              metric
            )
          ),
          'รายการ',
          Number(
            metricBacklogChange(
              metric
            )
          ) > 0
            ? 'is-danger'
            : '',
          'backlogChange'
        )}

        ${executiveKpi(
          'เกินเกณฑ์',
          `${metricOverCount(
            metric
          )} / ${metricEvaluated(
            metric
          )}`,
          `${formatPercent(
            metricOverPercent(
              metric
            )
          )} ของฐานคำนวณ`,
          metricOverCount(
            metric
          ) > 0
            ? 'is-danger'
            : '',
          'overThreshold'
        )}

        ${executiveKpi(
          'ค่ากลางเวลา',
          formatMinutes(
            metricMedian(
              metric
            )
          ),
          '',
          '',
          'median'
        )}

        ${executiveKpi(
          'เวลาส่วนใหญ่',
          formatMinutes(
            metric
              .p90DwellMinutes
          ),
          '',
          '',
          'p90'
        )}
      </section>

      <section class="shift-comparison-grid">
        ${
          cards.length
            ? cards
                .map(
                  (card) =>
                    shiftCardHtml(
                      card,
                      executive,
                      data
                    )
                )
                .join('')
            : emptyPanel(
                'ยังไม่มีข้อมูลกะ'
              )
        }
      </section>

      <section class="shift-dashboard-analysis">
        <article class="shift-analysis-panel">
          <header>
            <div>
              <small>
                ปริมาณและการไหล
              </small>

              <div class="shift-panel-title-line">
                <h3>
                  เข้า ออก และคงค้างแยกตามกะ
                </h3>

                <button
                  type="button"
                  class="dashboard-info-button is-small"
                  data-metric-info="flow"
                  aria-label="อธิบายการไหลของรถ"
                >
                  i
                </button>
              </div>
            </div>
          </header>

          <div class="shift-chart-wrap">
            <canvas
              id="shiftFlowComparisonChart"
            ></canvas>
          </div>
        </article>

        <article class="shift-analysis-panel">
          <header>
            <div>
              <small>
                ฐานการคำนวณเวลา
              </small>

              <div class="shift-panel-title-line">
                <h3>
                  จำนวนภายในและเกินเกณฑ์
                </h3>

                <button
                  type="button"
                  class="dashboard-info-button is-small"
                  data-metric-info="overThreshold"
                  aria-label="อธิบายจำนวนเกินเกณฑ์"
                >
                  i
                </button>
              </div>
            </div>
          </header>

          <div class="shift-chart-wrap">
            <canvas
              id="shiftSlaComparisonChart"
            ></canvas>
          </div>
        </article>
      </section>

      <section class="shift-dashboard-lower">
        <article class="shift-analysis-panel">
          <header>
            <div>
              <small>
                งานค้างข้ามกะ
              </small>

              <div class="shift-panel-title-line">
                <h3>
                  การส่งต่องานระหว่างกะ
                </h3>

                <button
                  type="button"
                  class="dashboard-info-button is-small"
                  data-metric-info="handover"
                  aria-label="อธิบายการส่งต่องาน"
                >
                  i
                </button>
              </div>
            </div>
          </header>

          <div class="shift-handover-flow">
            ${handoverHtml(
              data.handover
            )}
          </div>
        </article>

        <article class="shift-analysis-panel">
          <header>
            <div>
              <small>
                ข้อยกเว้นที่ควรตรวจสอบ
              </small>

              <h3>
                รายการที่ต้องติดตาม
              </h3>
            </div>

            <div class="shift-panel-actions">
              <span class="shift-panel-count">
                ${
                  Array.isArray(
                    data.exceptions
                  )
                    ? data.exceptions
                        .length
                    : 0
                }
                รายการ
              </span>

              ${
                Array.isArray(
                  data.exceptions
                ) &&
                data.exceptions.length > 5
                  ? `
                      <button
                        type="button"
                        class="shift-view-all-button"
                        data-view-all-exceptions
                      >
                        ดูทั้งหมด
                      </button>
                    `
                  : ''
              }
            </div>
          </header>

          <div class="shift-exception-list">
            ${exceptionListHtml(
              data.exceptions
            )}
          </div>
        </article>
      </section>

      <footer class="shift-dashboard-footer">
        <span>
          อัปเดต
          ${escapeHtml(
            dashboardDisplayDateTime(
              data.generatedAt
            )
          )}
        </span>

        <span>
          ${
            executive
              .comparisonMode ===
              'MATCHED_ELAPSED'
              ? 'กะปัจจุบันเทียบกับช่วงเวลาที่ผ่านไปเท่ากันของวันก่อน'
              : 'กะที่จบแล้วเทียบกับกะเดียวกันของวันก่อน'
          }
        </span>
      </footer>
    `;
  }


  function processHtml(
    data
  ) {
    const process =
      data &&
      data.processAnalytics &&
      typeof data.processAnalytics ===
        'object'
        ? data.processAnalytics
        : null;

    if (
      !process ||
      process.available !== true
    ) {
      return `
        <div class="shift-dashboard-message is-error">
          <strong>
            ยังไม่สามารถแสดงประสิทธิภาพกระบวนการ
          </strong>

          <span>
            ${escapeHtml(
              process &&
              process.message ||
              'Backend ยังไม่มี Process Analytics'
            )}
          </span>
        </div>
      `;
    }

    const overall =
      process.overall ||
      {};

    const funnel =
      process.funnel ||
      {};

    const stages =
      Array.isArray(
        process.stages
      )
        ? process.stages
        : [];

    const rules =
      process.rules ||
      {};

    const coverage =
      process.coverage ||
      {};

    return `
      <header class="process-executive-header">
        <div>
          <small>
            PROCESS CONTROL TOWER
          </small>

          <div class="shift-title-line">
            <h2>
              ประสิทธิภาพวงจรรถและเอกสาร
            </h2>
          </div>

          <p>
            รถที่ Gate In ในวันปฏิบัติงาน
            <strong>
              ${escapeHtml(
                process.businessDate ||
                data.businessDate ||
                '-'
              )}
            </strong>
            ·
            ${escapeHtml(
              process.range &&
              process.range.startAt ||
              '-'
            )}
            –
            ${escapeHtml(
              process.range &&
              process.range.endAt ||
              '-'
            )}
          </p>
        </div>

        <div class="process-config-badges">
          <span data-state="ADMIN">
            เกณฑ์จาก Admin
          </span>

          <span
            data-state="${
              rules.complete === true
                ? 'READY'
                : 'WARNING'
            }"
          >
            ${
              rules.complete === true
                ? 'ตั้งค่าครบ 4 ช่วง'
                : `ขาดเกณฑ์ ${formatNumber(
                    rules.missingRuleCount
                  )} ช่วง`
            }
          </span>

          <span data-state="QUALITY">
            Data ${formatPercent(
              overall.dataCompletenessPercent
            )}
          </span>

          <span
            data-state="${
              Number(
                coverage.workflowMissingCount
              ) > 0
                ? 'WARNING'
                : 'READY'
            }"
            title="ต้นทาง Gate In เทียบกับข้อมูล Workflow"
          >
            ต้นทาง ${formatNumber(
              coverage.sourceRecordCount
            )}
            · Workflow ${formatNumber(
              coverage.workflowMatchedCount
            )}
          </span>
        </div>
      </header>

      <section class="process-kpi-grid">
        ${processKpiHtml(
          'รถเข้า',
          process.recordCount,
          'รายการ',
          ''
        )}

        ${processKpiHtml(
          'ปิดวงจร',
          overall.completedLifecycleCount,
          `Gate Out จริง ${formatNumber(
            overall.actualGateOutCount
          )}`,
          ''
        )}

        ${processKpiHtml(
          'SLA ผ่าน',
          overall.slaCompliancePercent === null
            ? '-'
            : formatPercent(
                overall.slaCompliancePercent
              ),
          `${formatNumber(
            overall.slaEvaluatedCount
          )} จุดประเมิน`,
          Number(
            overall.slaCriticalCount
          ) > 0
            ? 'is-warning'
            : ''
        )}

        ${processKpiHtml(
          'P90 รวมจริง',
          formatMinutes(
            overall.p90LifecycleMinutes
          ),
          'ไม่รวม Auto Close',
          ''
        )}

        ${processKpiHtml(
          'คอขวด',
          overall.bottleneckStageLabel ||
          '-',
          formatMinutes(
            overall.bottleneckP90Minutes
          ),
          'is-focus'
        )}

        ${processKpiHtml(
          'ยังไม่ปิดวงจร',
          overall.openLifecycleCount,
          `ข้อมูลไม่ครบ ${formatNumber(
            overall.incompleteRecordCount
          )}`,
          Number(
            overall.openLifecycleCount
          ) > 0
            ? 'is-danger'
            : ''
        )}
      </section>

      <section class="process-stage-grid">
        ${
          stages.length
            ? stages
                .map(
                  processStageCardHtml
                )
                .join('')
            : emptyPanel(
                'ยังไม่มีข้อมูลช่วงกระบวนการ'
              )
        }
      </section>

      <section class="process-analysis-grid">
        <article class="shift-analysis-panel process-time-panel">
          <header>
            <div>
              <small>
                TIME COMPOSITION
              </small>

              <h3>
                สัดส่วนเวลาเฉลี่ยในแต่ละช่วง
              </h3>
            </div>
          </header>

          <div class="process-chart-wrap">
            <canvas id="processTimeShareChart"></canvas>
          </div>
        </article>

        <article class="shift-analysis-panel process-sla-panel">
          <header>
            <div>
              <small>
                ADMIN SLA CONTROL
              </small>

              <h3>
                ภายในเกณฑ์ เฝ้าระวัง และเกินเวลา
              </h3>
            </div>
          </header>

          <div class="process-chart-wrap">
            <canvas id="processSlaChart"></canvas>
          </div>
        </article>

        <article class="shift-analysis-panel process-funnel-panel">
          <header>
            <div>
              <small>
                LIFECYCLE FUNNEL
              </small>

              <h3>
                ความครบถ้วนของวงจรรถและเอกสาร
              </h3>
            </div>
          </header>

          <div class="process-lifecycle-funnel">
            ${processFunnelHtml(
              funnel
            )}
          </div>
        </article>

        <article class="shift-analysis-panel process-exception-panel">
          <header>
            <div>
              <small>
                BOTTLENECK EXCEPTIONS
              </small>

              <h3>
                รายการที่เกินเงื่อนไขสูงสุด
              </h3>
            </div>

            <span class="shift-panel-count">
              ${formatNumber(
                Array.isArray(
                  process.exceptions
                )
                  ? process.exceptions.length
                  : 0
              )}
              รายการ
            </span>
          </header>

          <div class="process-exception-list">
            ${processExceptionListHtml(
              process.exceptions
            )}
          </div>
        </article>
      </section>

      <footer class="shift-dashboard-footer">
        <span>
          อัปเดต
          ${escapeHtml(
            dashboardDisplayDateTime(
              process.generatedAt ||
              data.generatedAt
            )
          )}
        </span>

        <span>
          เกณฑ์อ้างอิงจากชีท
          ${escapeHtml(
            rules.sourceSheet ||
            'กฎเวลาแจ้งเตือนงานเอกสาร'
          )}
          เท่านั้น
        </span>
      </footer>
    `;
  }


  function processKpiHtml(
    label,
    value,
    note,
    className
  ) {
    return `
      <article class="process-kpi ${escapeHtml(
        className ||
        ''
      )}">
        <span>
          ${escapeHtml(label)}
        </span>

        <strong>
          ${escapeHtml(
            value ??
            '-'
          )}
        </strong>

        <small>
          ${escapeHtml(
            note ||
            ''
          )}
        </small>
      </article>
    `;
  }




  function processStageTone_(
    stage
  ) {
    const item =
      stage ||
      {};

    const text = [
      item.stageKey,
      item.key,
      item.code,
      item.shortLabel,
      item.label
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    if (
      text.indexOf('return_document_to_gate_out') >= 0 ||
      (text.indexOf('คืน') >= 0 && text.indexOf('ออก') >= 0)
    ) {
      return 'return-out';
    }

    if (
      text.indexOf('receiving_to_return_document') >= 0 ||
      (text.indexOf('รับเสร็จ') >= 0 && text.indexOf('คืน') >= 0)
    ) {
      return 'receive-return';
    }

    if (
      text.indexOf('document_to_receiving') >= 0 ||
      ((text.indexOf('ยื่น') >= 0 || text.indexOf('เอกสาร') >= 0) && text.indexOf('รับเสร็จ') >= 0)
    ) {
      return 'document-receive';
    }

    if (
      text.indexOf('gate_in_to_document') >= 0 ||
      ((text.indexOf('เข้า') >= 0 || text.indexOf('gate in') >= 0) && (text.indexOf('ยื่น') >= 0 || text.indexOf('เอกสาร') >= 0))
    ) {
      return 'gate-document';
    }

    return 'default';
  }

  function processStageCardHtml(
    stage
  ) {
    const item =
      stage ||
      {};

    const rule =
      item.rule ||
      {};

    const stageTone =
      processStageTone_(
        item
      );

    const ruleText =
      rule.configured === true
        ? `เหลือง ${formatMinutes(
            rule.warningMinutes
          )} · แดง ${formatMinutes(
            rule.redMinutes
          )}`
        : 'ยังไม่ตั้งเกณฑ์ใน Admin';

    return `
      <article
        class="process-stage-card"
        data-rule-state="${
          rule.configured === true
            ? 'READY'
            : 'MISSING'
        }"
        data-stage-tone="${escapeHtml(
          stageTone
        )}"
      >
        <header>
          <span>
            ${escapeHtml(
              item.shortLabel ||
              item.label ||
              '-'
            )}
          </span>

          <em>
            ${escapeHtml(
              rule.source === 'MODULE'
                ? 'Module'
                : rule.source === 'DEFAULT'
                  ? 'Default'
                  : 'ไม่มีเกณฑ์'
            )}
          </em>
        </header>

        <div class="process-stage-card__metrics">
          <div>
            <span>เฉลี่ย</span>
            <strong>${formatMinutes(
              item.averageMinutes
            )}</strong>
          </div>

          <div>
            <span>P90</span>
            <strong>${formatMinutes(
              item.p90Minutes
            )}</strong>
          </div>

          <div>
            <span>เกินแดง</span>
            <strong>${formatNumber(
              item.criticalCount
            )} / ${formatNumber(
              item.evaluatedCount
            )}</strong>
          </div>
        </div>

        <footer>
          <span>
            ${escapeHtml(ruleText)}
          </span>

          <strong>
            ${formatPercent(
              item.averageSharePercent
            )}
            ของเวลาเฉลี่ย
          </strong>
        </footer>
      </article>
    `;
  }


  function processFunnelHtml(
    funnel
  ) {
    const data =
      funnel ||
      {};

    const base =
      Math.max(
        1,
        Number(
          data.gateIn
        ) ||
        0
      );

    const steps = [
      ['Gate In', data.gateIn],
      ['ยื่นเอกสาร', data.documentSubmitted],
      ['รับสินค้าเสร็จ', data.receivingCompleted],
      ['รับเอกสารคืน', data.documentReturned],
      ['Gate Out จริง', data.gateOutActual]
    ];

    return `
      <div class="process-funnel-steps">
        ${steps.map(
          function (step, index) {
            const count =
              Number(
                step[1]
              ) ||
              0;

            const percent =
              Math.max(
                7,
                Math.min(
                  100,
                  (
                    count /
                    base
                  ) *
                  100
                )
              );

            return `
              <div class="process-funnel-step">
                <span>
                  ${escapeHtml(step[0])}
                </span>

                <i style="width:${escapeHtml(
                  String(percent)
                )}%"></i>

                <strong>
                  ${formatNumber(count)}
                </strong>
              </div>
            `;
          }
        ).join('')}
      </div>

      <div class="process-funnel-summary">
        <span>
          Auto Close
          <strong>${formatNumber(
            data.autoClose
          )}</strong>
        </span>

        <span>
          ยังเปิดอยู่
          <strong>${formatNumber(
            data.open
          )}</strong>
        </span>

        <span>
          ยกเลิก
          <strong>${formatNumber(
            data.cancelled
          )}</strong>
        </span>
      </div>
    `;
  }


  function processExceptionListHtml(
    exceptions
  ) {
    const rows =
      Array.isArray(exceptions)
        ? exceptions
        : [];

    if (!rows.length) {
      return `
        <div class="shift-empty-state">
          ไม่พบรายการเกินเกณฑ์แดง
        </div>
      `;
    }

    return rows
      .slice(0, 10)
      .map(
        function (item, index) {
          return `
            <article class="process-exception-item">
              <b>${index + 1}</b>

              <div>
                <strong>
                  ${escapeHtml(
                    item.company ||
                    item.appointmentNumber ||
                    item.autoId ||
                    '-'
                  )}
                </strong>

                <span>
                  ${escapeHtml(
                    item.stageLabel ||
                    '-'
                  )}
                  ·
                  ${escapeHtml(
                    item.registration ||
                    item.autoId ||
                    '-'
                  )}
                </span>
              </div>

              <div class="process-exception-time">
                <strong>
                  ${formatMinutes(
                    item.elapsedMinutes
                  )}
                </strong>

                <span>
                  เกิน ${formatMinutes(
                    item.overMinutes
                  )}
                </span>
              </div>
            </article>
          `;
        }
      )
      .join('');
  }


  function dailyHtml(
    data
  ) {
    const daily =
      data.daily ||
      {};

    const metric =
      daily.metrics ||
      {};

    const context =
      daily.context ||
      {};

    const executive =
      data.executive ||
      {};

    const history =
      dailyHistoryRows(
        data
      );

    const workload =
      context.workload ||
      {};

    return `
      <header class="shift-executive-header">
        <div>
          <small>
            สรุปตามวันปฏิบัติงาน
          </small>

          <div class="shift-title-line">
            <h2>
              สรุปรายวัน
            </h2>

            <button
              type="button"
              class="dashboard-info-button"
              data-dashboard-info="daily"
              aria-label="อธิบายข้อมูลรายวัน"
            >
              i
            </button>
          </div>

          <p>
            ${escapeHtml(
              dashboardDisplayDateTime(
                daily.businessDayStart
              )
            )}
            –
            ${escapeHtml(
              dashboardDisplayDateTime(
                daily.businessDayEnd
              )
            )}

            ${
              isCrossDayWindow(
                daily.businessDayStart,
                daily.businessDayEnd
              )
                ? `
                    <em class="shift-cross-day-badge is-business-day">
                      วันปฏิบัติงานข้ามวัน
                    </em>
                  `
                : ''
            }

            ·
            <strong>
              ${escapeHtml(
                daily.statusLabel ||
                '-'
              )}
            </strong>
          </p>

          <div class="shift-methodology-note">
            ${
              daily.status === 'LIVE'
                ? 'ข้อมูลระหว่างวันยังไม่ใช้ตัดสินระดับภาระงาน จนกว่าจะจบวันปฏิบัติงาน'
                : `${escapeHtml(
                    workload.label ||
                    'รอข้อมูลอ้างอิง'
                  )} · อ้างอิงวันย้อนหลัง ${
                    formatNumber(
                      context
                        .historicalSampleCount
                    )
                  } วัน`
            }
          </div>
        </div>

        <div class="shift-executive-badges">
          <span class="${
            daily.status === 'LIVE'
              ? 'is-live'
              : 'is-neutral'
          }">
            ${escapeHtml(
              daily.statusLabel ||
              daily.status ||
              '-'
            )}
          </span>

          ${
            executive.highestWorkloadShiftCode
              ? `
                  <span class="is-workload">
                    ภาระงานสูงสุด
                    ${escapeHtml(
                      executive
                        .highestWorkloadShiftCode
                    )}
                  </span>
                `
              : ''
          }

          ${
            executive.backlogReductionShiftCode
              ? `
                  <span class="is-best">
                    ลดคงค้างมากสุด
                    ${escapeHtml(
                      executive
                        .backlogReductionShiftCode
                    )}
                  </span>
                `
              : ''
          }

          ${
            executive.highWaitShiftCode
              ? `
                  <span class="is-attention">
                    เวลารอสูงสุด
                    ${escapeHtml(
                      executive
                        .highWaitShiftCode
                    )}
                  </span>
                `
              : ''
          }
        </div>
      </header>

      <section class="daily-summary-grid">
        ${dailyMetricHtml(
          'คงค้างต้นวัน',
          metric.openingBalance,
          '',
          'openingBalance'
        )}

        ${dailyMetricHtml(
          'เข้าพื้นที่',
          metric.gateIn,
          '',
          'gateIn'
        )}

        ${dailyMetricHtml(
          'ออกจริง',
          metric.gateOutActual,
          '',
          'gateOut'
        )}

        ${dailyMetricHtml(
          'ปิดอัตโนมัติ',
          metric.autoClose,
          '',
          'autoClose'
        )}

        ${dailyMetricHtml(
          'คงค้างปลายวัน',
          metric.closingBalance,
          '',
          'closingBalance'
        )}

        ${dailyMetricHtml(
          'คงค้างเปลี่ยนแปลง',
          signed(
            metricBacklogChange(
              metric
            )
          ),
          Number(
            metricBacklogChange(
              metric
            )
          ) > 0
            ? 'is-danger'
            : '',
          'backlogChange'
        )}

        ${dailyMetricHtml(
          'สูงสุดในพื้นที่',
          metric.peakActive,
          '',
          'peakActive'
        )}

        ${dailyMetricHtml(
          'เกินเกณฑ์',
          `${metricOverCount(
            metric
          )} / ${metricEvaluated(
            metric
          )}`,
          metricOverCount(
            metric
          ) > 0
            ? 'is-danger'
            : '',
          'overThreshold',
          formatPercent(
            metricOverPercent(
              metric
            )
          )
        )}

        ${dailyMetricHtml(
          'ค่ากลางเวลา',
          formatMinutes(
            metricMedian(
              metric
            )
          ),
          '',
          'median'
        )}

        ${dailyMetricHtml(
          'เวลาเฉลี่ย',
          formatMinutes(
            metric
              .averageDwellMinutes
          ),
          '',
          'average'
        )}

        ${dailyMetricHtml(
          'เวลาส่วนใหญ่',
          formatMinutes(
            metric
              .p90DwellMinutes
          ),
          '',
          'p90'
        )}

        ${dailyMetricHtml(
          'ความครบถ้วนข้อมูล',
          formatPercent(
            metric
              .dataCompletenessPercent
          ),
          '',
          'dataCompleteness'
        )}
      </section>

      <section class="daily-dashboard-analysis">
        <article class="shift-analysis-panel daily-trend-panel">
          <header>
            <div>
              <small>
                แนวโน้มย้อนหลัง
              </small>

              <div class="shift-panel-title-line">
                <h3>
                  เข้า ออก และคงค้าง
                </h3>

                <button
                  type="button"
                  class="dashboard-info-button is-small"
                  data-dashboard-info="dailyTrend"
                  aria-label="อธิบายแนวโน้มรายวัน"
                >
                  i
                </button>
              </div>
            </div>
          </header>

          <div class="daily-history-chart-wrap">
            <canvas
              id="dailyShiftHistoryChart"
            ></canvas>
          </div>
        </article>

        <article class="shift-analysis-panel daily-history-panel">
          <header>
            <div>
              <small>
                ข้อมูลย้อนหลัง
              </small>

              <h3>
                รายละเอียดรายวันย้อนหลัง
              </h3>
            </div>

            <span class="shift-panel-count">
              ${history.length}
              วัน
            </span>
          </header>

          <div class="daily-history-table-wrap">
            ${dailyHistoryTable(
              history
            )}
          </div>
        </article>

      </section>

      <footer class="shift-dashboard-footer">
        <span>
          อัปเดต
          ${escapeHtml(
            dashboardDisplayDateTime(
              data.generatedAt
            )
          )}
        </span>

        <span>
          FINAL คือ Snapshot หลังจบวัน
          · LIVE คือข้อมูลระหว่างวัน
        </span>
      </footer>
    `;
  }

  function shiftCardHtml(
    card,
    executive,
    data
  ) {
    const metric =
      card.metrics ||
      {};

    const comparison =
      card.comparison ||
      {};

    const context =
      card.context ||
      {};

    const workload =
      context.workload ||
      {};

    const signal =
      context.signals &&
      context.signals.p90Dwell
        ? context.signals.p90Dwell
        : null;

    return `
      <article
        class="shift-performance-card
          ${
            card.status === 'LIVE'
              ? 'is-live'
              : ''
          }
          ${
            signal &&
            (
              signal.status === 'HIGH' ||
              signal.status === 'ABOVE'
            )
              ? 'is-attention'
              : ''
          }"
        data-shift-code="${escapeHtml(
          card.code
        )}"
      >
        <header>
          <div class="shift-code-block">
            <strong>
              ${escapeHtml(
                card.code
              )}
            </strong>

            <div>
              <span>
                ${escapeHtml(
                  card.name
                )}
              </span>

              <small
                title="${escapeHtml(
                  shiftRangeTitle(
                    card
                  )
                )}"
              >
                ${escapeHtml(
                  card.start
                )}
                –
                ${escapeHtml(
                  card.end
                )}

                ${
                  card.crossesMidnight ===
                    true
                    ? `
                        <em class="shift-cross-day-badge">
                          ข้ามวัน
                        </em>
                      `
                    : ''
                }
              </small>
            </div>
          </div>

          <div class="shift-card-header-actions">
            <button
              type="button"
              class="dashboard-info-button is-small"
              data-metric-info="shiftCard"
              data-shift-code="${escapeHtml(
                card.code
              )}"
              aria-label="อธิบายข้อมูลกะ"
            >
              i
            </button>

            <span
              class="shift-status-badge"
              data-status="${escapeHtml(
                card.status
              )}"
            >
              ${escapeHtml(
                card.statusLabel
              )}
            </span>
          </div>
        </header>

        <div class="shift-card-flow">
          ${shiftCardMetric(
            'ต้นกะ',
            metric.openingBalance
          )}

          ${shiftCardMetric(
            'เข้าพื้นที่',
            metric.gateIn
          )}

          ${shiftCardMetric(
            'ออกจริง',
            metric.gateOutActual
          )}

          ${shiftCardMetric(
            'ปลายกะ',
            metric.closingBalance
          )}
        </div>

        <div class="shift-card-performance">
          ${shiftCardMetric(
            'คงค้างเปลี่ยน',
            signed(
              metricBacklogChange(
                metric
              )
            ),
            Number(
              metricBacklogChange(
                metric
              )
            ) > 0
              ? 'is-negative'
              : 'is-positive'
          )}

          ${shiftCardMetric(
            'ค่ากลาง',
            formatMinutes(
              metricMedian(
                metric
              )
            )
          )}

          ${shiftCardMetric(
            'เฉลี่ย',
            formatMinutes(
              metric
                .averageDwellMinutes
            )
          )}

          ${shiftCardMetric(
            'เวลาส่วนใหญ่',
            formatMinutes(
              metric
                .p90DwellMinutes
            ),
            signal &&
            (
              signal.status === 'HIGH' ||
              signal.status === 'ABOVE'
            )
              ? 'is-negative'
              : ''
          )}
        </div>

        <div class="shift-context-row">
          <div>
            <span>
              ระดับภาระงาน
            </span>

            <strong data-level="${escapeHtml(
              workload.level ||
              'INSUFFICIENT'
            )}">
              ${escapeHtml(
                workload.label ||
                'ข้อมูลอ้างอิงยังน้อย'
              )}
            </strong>

            <small>
              ${
                workload.preliminary
                  ? `ประมาณการจาก ${
                      formatNumber(
                        workload.elapsedHours
                      )
                    } ชม. แรก`
                  : `อ้างอิง ${
                      formatNumber(
                        context
                          .historicalSampleCount
                      )
                    } กะ`
              }
            </small>
          </div>

          <div>
            <span>
              เกินเกณฑ์
            </span>

            <strong class="${
              metricOverCount(
                metric
              ) > 0
                ? 'is-negative'
                : ''
            }">
              ${metricOverCount(
                metric
              )}
              /
              ${metricEvaluated(
                metric
              )}
            </strong>

            <small>
              ${formatPercent(
                metricOverPercent(
                  metric
                )
              )}
              ของฐานคำนวณ
            </small>
          </div>

          <div>
            <span>
              เทียบภาระใกล้เคียง
            </span>

            <strong data-signal="${
              signal
                ? escapeHtml(
                    signal.status
                  )
                : 'INSUFFICIENT'
            }">
              ${
                signal
                  ? escapeHtml(
                      signal.label
                    )
                  : 'ข้อมูลยังไม่พอ'
              }
            </strong>

            <small>
              ใช้
              ${formatNumber(
                context
                  .similarSampleCount
              )}
              กะอ้างอิง
            </small>
          </div>
        </div>

        <div class="shift-card-comparison">
          <span>
            ${
              comparison.mode ===
                'MATCHED_ELAPSED'
                ? `เทียบ ${
                    formatNumber(
                      comparison.hours
                    )
                  } ชม. เท่ากันกับวันก่อน`
                : 'เทียบกะเดียวกันของวันก่อน'
            }
          </span>

          ${
            comparison.available
              ? `
                  <div class="shift-compare-line">
                    <span>
                      รถเข้า
                      <strong>
                        ${signed(
                          comparison
                            .delta
                            .gateIn
                        )}
                      </strong>
                    </span>

                    <span>
                      คงค้าง
                      <strong class="${
                        Number(
                          comparison
                            .delta
                            .closingBalance
                        ) <= 0
                          ? 'is-positive'
                          : 'is-negative'
                      }">
                        ${signed(
                          comparison
                            .delta
                            .closingBalance
                        )}
                      </strong>
                    </span>

                    <span>
                      เวลาเฉลี่ย
                      <strong class="${
                        Number(
                          comparison
                            .delta
                            .averageDwellMinutes
                        ) <= 0
                          ? 'is-positive'
                          : 'is-negative'
                      }">
                        ${signed(
                          comparison
                            .delta
                            .averageDwellMinutes
                        )}
                        นาที
                      </strong>
                    </span>
                  </div>
                `
              : `
                  <small>
                    ยังไม่มีข้อมูลวันก่อนสำหรับเปรียบเทียบ
                  </small>
                `
          }
        </div>

        <button
          type="button"
          class="shift-card-detail-button"
          data-open-shift-detail="${escapeHtml(
            card.code
          )}"
        >
          ดูรายละเอียดกะ
        </button>
      </article>
    `;
  }

  function handoverHtml(
    handover
  ) {
    const items =
      Array.isArray(
        handover
      )
        ? handover.filter(
            (item) =>
              item.toShift
          )
        : [];

    if (!items.length) {
      return emptyPanel(
        'ยังไม่มีข้อมูลส่งต่องาน'
      );
    }

    return items
      .map(
        (item) => `
          <div
            class="shift-handover-item
              ${
                item.reconciled
                  ? ''
                  : 'is-mismatch'
              }"
          >
            <div>
              <span>
                กะ
                ${escapeHtml(
                  item.fromShift
                )}
              </span>

              <strong>
                ${formatNumber(
                  item.closingBalance
                )}
              </strong>

              <small>
                ปลายกะ
              </small>
            </div>

            <i aria-hidden="true">
              →
            </i>

            <div>
              <span>
                กะ
                ${escapeHtml(
                  item.toShift
                )}
              </span>

              <strong>
                ${formatNumber(
                  item.nextOpeningBalance
                )}
              </strong>

              <small>
                รับต้นกะ
              </small>
            </div>

            <em>
              ${
                item.overdueAtEnd > 0
                  ? `เกิน SLA ส่งต่อ ${
                      formatNumber(
                        item.overdueAtEnd
                      )
                    }`
                  : 'ไม่มีรายการเกิน SLA ส่งต่อ'
              }
            </em>
          </div>
        `
      )
      .join('');
  }


  function exceptionListHtml(
    exceptions
  ) {
    const items =
      Array.isArray(
        exceptions
      )
        ? exceptions
        : [];

    if (!items.length) {
      return emptyPanel(
        'ไม่พบรายการผิดปกติ'
      );
    }

    return items
      .slice(
        0,
        5
      )
      .map(
        (item, index) => `
          <button
            type="button"
            class="shift-exception-item"
            data-exception-index="${index}"
          >
            <b>
              ${index + 1}
            </b>

            <div>
              <strong>
                ${escapeHtml(
                  item.company ||
                  'ไม่ระบุบริษัท'
                )}
              </strong>

              <span>
                กะ
                ${escapeHtml(
                  item.shiftCode ||
                  '-'
                )}
                · นัดหมาย
                ${escapeHtml(
                  item
                    .appointmentNumber ||
                  '-'
                )}
              </span>

              <small>
                ${escapeHtml(
                  exceptionLabel(
                    item.type
                  )
                )}
              </small>
            </div>

            <em>
              ${
                Number(
                  item.overdueMinutes
                ) > 0
                  ? `${formatNumber(
                      item.overdueMinutes
                    )} นาที`
                  : escapeHtml(
                      item.type ||
                      '-'
                    )
              }
            </em>
          </button>
        `
      )
      .join('');
  }


  function dailyHistoryRows(
    data
  ) {
    const history =
      Array.isArray(
        data &&
        data.history
      )
        ? data.history.slice()
        : [];

    const currentDate =
      String(
        data &&
        data.businessDate ||
        ''
      );

    const exists =
      history.some(
        (item) =>
          String(
            item.businessDate ||
            ''
          ) ===
          currentDate
      );

    if (
      !exists &&
      data &&
      data.daily &&
      data.daily.metrics
    ) {
      const metric =
        data.daily.metrics;

      history.unshift({
        businessDate:
          currentDate,

        gateIn:
          metric.gateIn,

        gateOutActual:
          metric.gateOutActual,

        autoClose:
          metric.autoClose,

        closingBalance:
          metric.closingBalance,

        overdue:
          metric.overdueAtEnd,

        averageDwellMinutes:
          metric.averageDwellMinutes,

        medianDwellMinutes:
          metricMedian(
            metric
          ),

        overThresholdRecords:
          metricOverCount(
            metric
          ),

        overThresholdPercent:
          metricOverPercent(
            metric
          ),

        evaluatedRecords:
          metricEvaluated(
            metric
          ),

        backlogChange:
          metricBacklogChange(
            metric
          ),

        p90DwellMinutes:
          metric.p90DwellMinutes,

        slaCompliancePercent:
          metric.slaCompliancePercent,

        dataCompletenessPercent:
          metric.dataCompletenessPercent,

        bestShiftCode:
          data.daily
            .bestShiftCode,

        attentionShiftCode:
          data.daily
            .attentionShiftCode,

        status:
          data.daily.status
      });
    }

    return history;
  }


  function dailyHistoryTable(
    history
  ) {
    if (!history.length) {
      return emptyPanel(
        'ยังไม่มี Snapshot รายวัน'
      );
    }

    return `
      <table class="daily-history-table">
        <thead>
          <tr>
            <th>วันปฏิบัติงาน</th>
            <th>เข้า</th>
            <th>ออกจริง</th>
            <th>ปลายวัน</th>
            <th>เกินเกณฑ์</th>
            <th>ค่ากลาง</th>
            <th>เฉลี่ย</th>
            <th>สถานะ</th>
          </tr>
        </thead>

        <tbody>
          ${history
            .map(
              (row) => {
                const over =
                  row.overThresholdRecords !==
                    undefined
                    ? Number(
                        row
                          .overThresholdRecords
                      ) || 0
                    : Math.max(
                        0,
                        Math.round(
                          (
                            Number(
                              row.evaluatedRecords
                            ) || 0
                          ) *
                          (
                            1 -
                            (
                              Number(
                                row
                                  .slaCompliancePercent
                              ) || 100
                            ) /
                            100
                          )
                        )
                      );

                const evaluated =
                  Number(
                    row.evaluatedRecords
                  ) ||
                  Math.max(
                    0,
                    Number(
                      row.gateOutActual
                    ) +
                    Number(
                      row.autoClose
                    ) +
                    Number(
                      row.closingBalance
                    )
                  );

                return `
                  <tr>
                    <td>
                      ${escapeHtml(
                        dashboardDisplayDateTime(
                        row.businessDate
                      )
                      )}
                    </td>

                    <td>
                      ${formatNumber(
                        row.gateIn
                      )}
                    </td>

                    <td>
                      ${formatNumber(
                        row.gateOutActual
                      )}
                    </td>

                    <td>
                      ${formatNumber(
                        row.closingBalance
                      )}
                    </td>

                    <td>
                      <strong class="${
                        over > 0
                          ? 'is-negative'
                          : ''
                      }">
                        ${formatNumber(
                          over
                        )}
                        /
                        ${formatNumber(
                          evaluated
                        )}
                      </strong>
                    </td>

                    <td>
                      ${formatMinutes(
                        row
                          .medianDwellMinutes
                      )}
                    </td>

                    <td>
                      ${formatMinutes(
                        row
                          .averageDwellMinutes
                      )}
                    </td>

                    <td>
                      ${escapeHtml(
                        historyStatusLabel(
                          row.status
                        )
                      )}
                    </td>
                  </tr>
                `;
              }
            )
            .join('')}
        </tbody>
      </table>
    `;
  }

  function bindWorkspaceEvents() {
    byId(
      'dashboardShiftWorkspace'
    )
      ?.querySelectorAll(
        '[data-open-shift-detail]'
      )
      .forEach(
        (button) => {
          button.addEventListener(
            'click',
            () => {
              openShiftDetail(
                button.dataset
                  .openShiftDetail
              );
            }
          );
        }
      );

    byId(
      'dashboardShiftWorkspace'
    )
      ?.querySelectorAll(
        '[data-exception-index]'
      )
      .forEach(
        (button) => {
          button.addEventListener(
            'click',
            () => {
              openExceptionDetail(
                Number(
                  button.dataset
                    .exceptionIndex
                )
              );
            }
          );
        }
      );

    byId(
      'dashboardShiftWorkspace'
    )
      ?.querySelector(
        '[data-view-all-exceptions]'
      )
      ?.addEventListener(
        'click',
        openAllExceptions
      );
  }


  function openShiftDetail(
    shiftCode
  ) {
    const card =
      (
        state.data
          ?.shifts ||
        []
      ).find(
        (item) =>
          item.code ===
          shiftCode
      );

    if (
      !card ||
      !window.Swal
    ) {
      return;
    }

    const metric =
      card.metrics ||
      {};

    const comparison =
      card.comparison ||
      {};

    window.Swal.fire({
      title:
        `กะ ${escapeHtml(
          card.code
        )} · ${escapeHtml(
          card.name
        )}`,

      html: `
        <div class="shift-detail-modal">
          <p>
            ${escapeHtml(
              dashboardDisplayDateTime(
                card.rangeStart
              )
            )}
            –
            ${escapeHtml(
              dashboardDisplayDateTime(
                card.rangeEnd
              )
            )}
          </p>

          <div>
            ${detailItem(
              'ต้นกะ',
              metric.openingBalance
            )}

            ${detailItem(
              'เข้าพื้นที่',
              metric.gateIn
            )}

            ${detailItem(
              'ออกจริง',
              metric.gateOutActual
            )}

            ${detailItem(
              'ปิดอัตโนมัติ',
              metric.autoClose
            )}

            ${detailItem(
              'คงค้าง',
              metric.closingBalance
            )}

            ${detailItem(
              'สูงสุดในพื้นที่',
              metric.peakActive
            )}

            ${detailItem(
              'เกินเกณฑ์สูงสุด',
              metric.peakOverdue
            )}

            ${detailItem(
              'เกินเกณฑ์ปลายกะ',
              metric.overdueAtEnd
            )}

            ${detailItem(
              'ผ่านเกณฑ์',
              formatPercent(
                metric
                  .slaCompliancePercent
              )
            )}

            ${detailItem(
              'เวลาเฉลี่ย',
              formatMinutes(
                metric
                  .averageDwellMinutes
              )
            )}

            ${detailItem(
              'เวลาส่วนใหญ่',
              formatMinutes(
                metric
                  .p90DwellMinutes
              )
            )}

            ${detailItem(
              'นานที่สุด',
              formatMinutes(
                metric
                  .maxDwellMinutes
              )
            )}
          </div>

          ${
            comparison.available
              ? `
                  <section>
                    <strong>
                      เปรียบเทียบวันก่อน
                    </strong>

                    <span>
                      Gate In
                      ${signed(
                        comparison
                          .delta
                          .gateIn
                      )}
                      · คงค้าง
                      ${signed(
                        comparison
                          .delta
                          .closingBalance
                      )}
                      · SLA
                      ${signed(
                        comparison
                          .delta
                          .slaCompliancePercent
                      )}%
                    </span>
                  </section>
                `
              : ''
          }
        </div>
      `,

      confirmButtonText:
        'ปิด',

      width:
        'min(620px, calc(100vw - 14px))',

      customClass: {
        popup:
          'shift-detail-popup'
      }
    });
  }


  function openAllExceptions() {
    const items =
      Array.isArray(
        state.data &&
        state.data.exceptions
      )
        ? state.data.exceptions
        : [];

    if (
      !items.length ||
      !window.Swal
    ) {
      return;
    }

    window.Swal.fire({
      title:
        'รายการที่ต้องติดตามทั้งหมด',

      html: `
        <div class="shift-all-exceptions">
          ${items
            .map(
              (item, index) => `
                <button
                  type="button"
                  data-all-exception-index="${index}"
                >
                  <b>
                    ${index + 1}
                  </b>

                  <div>
                    <strong>
                      ${escapeHtml(
                        item.company ||
                        'ไม่ระบุบริษัท'
                      )}
                    </strong>

                    <span>
                      นัดหมาย
                      ${escapeHtml(
                        item.appointmentNumber ||
                        '-'
                      )}
                      · กะ
                      ${escapeHtml(
                        item.shiftCode ||
                        '-'
                      )}
                    </span>
                  </div>

                  <em>
                    ${
                      Number(
                        item.overdueMinutes
                      ) > 0
                        ? `${formatNumber(
                            item.overdueMinutes
                          )} นาที`
                        : escapeHtml(
                            exceptionLabel(
                              item.type
                            )
                          )
                    }
                  </em>
                </button>
              `
            )
            .join('')}
        </div>
      `,

      confirmButtonText:
        'ปิด',

      width:
        'min(760px, calc(100vw - 18px))',

      didOpen:
        (popup) => {
          popup
            .querySelectorAll(
              '[data-all-exception-index]'
            )
            .forEach(
              (button) => {
                button.addEventListener(
                  'click',
                  () => {
                    const index =
                      Number(
                        button.dataset
                          .allExceptionIndex
                      );

                    window.Swal.close();

                    window.setTimeout(
                      () => {
                        openExceptionDetail(
                          index
                        );
                      },
                      120
                    );
                  }
                );
              }
            );
        }
    });
  }


  function openExceptionDetail(
    index
  ) {
    const item =
      state.data
        ?.exceptions
        ?.[index];

    if (
      !item ||
      !window.Swal
    ) {
      return;
    }

    window.Swal.fire({
      title:
        'รายละเอียดรายการผิดปกติ',

      html: `
        <div class="shift-exception-detail">
          ${detailItem(
            'บริษัท / Vendor',
            item.company
          )}

          ${detailItem(
            'เลขนัดหมาย',
            item
              .appointmentNumber
          )}

          ${detailItem(
            'ทะเบียน / หมายเลขตู้',
            item.registration
          )}

          ${detailItem(
            'กะ',
            item.shiftCode
          )}

          ${detailItem(
            'ประเภท',
            exceptionLabel(
              item.type
            )
          )}

          ${detailItem(
            'เวลา Gate In',
            dashboardDisplayDateTime(
              item.gateIn
            )
          )}

          ${detailItem(
            'ระยะเวลา',
            formatMinutes(
              item.durationMinutes
            )
          )}

          ${detailItem(
            'เกินเกณฑ์',
            formatMinutes(
              item.overdueMinutes
            )
          )}
        </div>
      `,

      confirmButtonText:
        'ปิด',

      width:
        'min(560px, calc(100vw - 14px))',

      customClass: {
        popup:
          'shift-detail-popup'
      }
    });
  }


  function openDashboardInfo(
    key
  ) {
    openMetricInformation(
      key ||
      'overview',
      ''
    );
  }


  function openMetricInformation(
    key,
    shiftCode
  ) {
    if (
      !window.Swal ||
      typeof window.Swal.fire !==
        'function'
    ) {
      return;
    }

    const data =
      state.data ||
      {};

    const card =
      shiftCode
        ? (
            data.shifts ||
            []
          ).find(
            (item) =>
              item.code ===
              shiftCode
          )
        : null;

    const metric =
      card
        ? card.metrics ||
          {}
        : data.daily &&
          data.daily.metrics
          ? data.daily.metrics
          : {};

    const context =
      card
        ? card.context ||
          {}
        : data.daily &&
          data.daily.context
          ? data.daily.context
          : {};

    const definition =
      metricDefinition(
        key,
        metric,
        context,
        card,
        data
      );

    window.Swal.fire({
      title:
        definition.title,

      html: `
        <div class="metric-info-center">
          ${metricContextHeader(
            data,
            card,
            context
          )}

          ${metricInfoSection(
            'ความหมาย',
            definition.meaning
          )}

          ${metricInfoSection(
            'วิธีคำนวณ',
            definition.formula,
            'is-formula'
          )}

          ${metricInfoSection(
            'ตัวอย่างจากข้อมูลที่เลือก',
            definition.example
          )}

          ${metricInfoSection(
            'วิธีแปลผล',
            definition.interpretation
          )}

          ${metricInfoSection(
            'แหล่งข้อมูล',
            definition.source
          )}

          ${metricInfoSection(
            'ข้อจำกัดและข้อควรระวัง',
            definition.limitations,
            'is-warning'
          )}
        </div>
      `,

      confirmButtonText:
        'เข้าใจแล้ว',

      width:
        'min(840px, calc(100vw - 16px))',

      customClass: {
        popup:
          'metric-info-popup'
      }
    });
  }


  function metricDefinition(
    key,
    metric,
    context,
    card,
    data
  ) {
    const method =
      data.methodology ||
      {};

    const redMinutes =
      Number(
        method.redMinutes
      ) || 60;

    const over =
      metricOverCount(
        metric
      );

    const evaluated =
      metricEvaluated(
        metric
      );

    const overPercent =
      metricOverPercent(
        metric
      );

    const backlog =
      metricBacklogChange(
        metric
      );

    const workload =
      context.workload ||
      {};

    const common = {
      overview: {
        title:
          'หลักการอ่าน Dashboard',
        meaning:
          'Dashboard นี้ไม่ใช้เปอร์เซ็นต์เป้าหมายตายตัว เพราะจำนวนรถ งานค้าง ประเภทสินค้า และช่วงเวลาที่รถเข้ามาแตกต่างกันในแต่ละกะและแต่ละวัน',
        formula:
          'ใช้จำนวนจริง + สัดส่วนที่มีฐานคำนวณ + การเปลี่ยนคงค้าง + ค่ากลาง/ค่าเฉลี่ย/เวลาส่วนใหญ่ + ข้อมูลย้อนหลังที่มีภาระงานใกล้เคียงกัน',
        example:
          `เกินเกณฑ์ ${over} จาก ${evaluated} รายการ (${formatPercent(
            overPercent
          )}) เป็นข้อมูลสถานการณ์ ไม่ใช่คะแนนผลงาน`,
        interpretation:
          'พิจารณาหลายตัวชี้วัดร่วมกัน และแยกปัจจัยที่กะควบคุมได้ออกจากปัจจัยภายนอก',
        source:
          'เวลาเข้าพื้นที่ เวลาออกจริง สถานะปิดอัตโนมัติ การตั้งค่ากะ และ Snapshot ย้อนหลัง',
        limitations:
          'ปัจจัยภายนอก เช่น รถเข้ากระจุกตัว ประเภทสินค้า ช่องรับสินค้า และเหตุขัดข้อง อาจทำให้เวลาเพิ่มขึ้นโดยไม่ใช่สิ่งที่กะควบคุมได้'
      },

      shift: {
        title:
          'วิธีวิเคราะห์ผลงานตามกะ',
        meaning:
          'สรุปปริมาณงาน การไหล คงค้าง เวลา และรายการเกินเกณฑ์ของแต่ละกะ โดยแยกงานที่รับต่อจากกะก่อนออกจากงานที่เข้ามาใหม่',
        formula:
          'คงค้างเปลี่ยนแปลง = คงค้างปลายกะ − คงค้างต้นกะ\nผลต่างการไหล = ออกจริง + ปิดอัตโนมัติ − เข้าพื้นที่',
        example:
          card
            ? `กะ ${card.code}: ต้นกะ ${metric.openingBalance || 0} + เข้า ${metric.gateIn || 0} − ออกจริง ${metric.gateOutActual || 0} − ปิดอัตโนมัติ ${metric.autoClose || 0} = ปลายกะ ${metric.closingBalance || 0}`
            : 'เลือกการ์ดกะเพื่อดูตัวอย่างจากกะนั้น',
        interpretation:
          'คงค้างลดลงแสดงว่ากะช่วยระบายงานเดิม แต่ยังต้องดูเวลารอและรายการเกินเกณฑ์ประกอบ',
        source:
          'Gate In, Gate Out, Auto Close และสถานะ Active ณ ต้นและปลายกะ',
        limitations:
          'กะปัจจุบันยังไม่จบ ข้อมูลและระดับภาระงานจึงเป็นค่าระหว่างกะหรือค่าประมาณเบื้องต้น'
      },

      daily: {
        title:
          'วิธีสรุปรายวัน',
        meaning:
          'วันปฏิบัติงานเป็นช่วง 24 ชั่วโมงตามเวลาที่ Admin กำหนด เช่น 06:00 ถึง 06:00 ของวันถัดไป',
        formula:
          'คงค้างปลายวัน = คงค้างต้นวัน + เข้าพื้นที่ − ออกจริง − ปิดอัตโนมัติ ± รายการแก้ไขข้อมูล',
        example:
          `ต้นวัน ${metric.openingBalance || 0} + เข้า ${metric.gateIn || 0} − ออกจริง ${metric.gateOutActual || 0} − ปิดอัตโนมัติ ${metric.autoClose || 0} = ปลายวัน ${metric.closingBalance || 0}`,
        interpretation:
          'ใช้ดูภาระงานทั้งวัน การระบายออก และการสะสมคงค้าง',
        source:
          'ผลรวมของทุกกะในวันปฏิบัติงาน และ Daily Snapshot เมื่อปิดวันแล้ว',
        limitations:
          'ข้อมูล LIVE ระหว่างวันยังไม่ควรเปรียบเทียบตรงกับวัน FINAL ที่ครบ 24 ชั่วโมง'
      },

      gateIn: {
        title:
          'เข้าพื้นที่',
        meaning:
          'จำนวนรายการที่มีเวลา Gate In อยู่ภายในกะหรือวันปฏิบัติงานที่เลือก',
        formula:
          'นับรายการที่ Gate In ≥ เวลาเริ่มช่วง และ Gate In < เวลาสิ้นสุดช่วง',
        example:
          `พบรายการเข้าพื้นที่ ${formatNumber(
            metric.gateIn
          )} รายการ`,
        interpretation:
          'เป็นตัวบอกปริมาณงาน ไม่ใช่คะแนนประสิทธิภาพ เพราะปริมาณรถไม่สามารถควบคุมได้ทั้งหมด',
        source:
          'Timestamp In ของฐานข้อมูล Module',
        limitations:
          'รถเข้ากระจุกตัวอาจสร้างภาระสูงกว่าจำนวนรวมที่เท่ากันแต่กระจายตลอดช่วง'
      },

      gateOut: {
        title:
          'ออกจริง',
        meaning:
          'จำนวนรายการที่มี Gate Out จริงในช่วงที่เลือก โดยแยกจากรายการปิดอัตโนมัติ',
        formula:
          'นับ Timestamp Out ที่อยู่ในช่วง และตรวจว่าไม่ใช่ Auto Close',
        example:
          `ออกจริง ${formatNumber(
            metric.gateOutActual
          )} รายการ · ปิดอัตโนมัติ ${formatNumber(
            metric.autoClose
          )} รายการ`,
        interpretation:
          'ควรดูร่วมกับรถเข้าและคงค้างต้นช่วง เพื่อทราบว่าระบายงานได้มากเพียงใด',
        source:
          'Timestamp Out และดัชนี Auto Close',
        limitations:
          'หากไม่ได้บันทึก Gate Out ระบบอาจปิดอัตโนมัติภายหลัง จึงไม่ควรนับเป็นออกจริง'
      },

      openingBalance: {
        title:
          'คงค้างต้นช่วง',
        meaning:
          'รถหรือตู้ที่เข้าก่อนเวลาเริ่มกะหรือวัน และยังไม่ออกเมื่อช่วงเริ่มต้น',
        formula:
          'Gate In < เวลาเริ่มช่วง และ Gate Out ว่างหรือ Gate Out ≥ เวลาเริ่มช่วง',
        example:
          `คงค้างต้นช่วง ${formatNumber(
            metric.openingBalance
          )} รายการ`,
        interpretation:
          'เป็นภาระที่รับต่อมาจากช่วงก่อน ไม่ควรถือว่าเป็นรถเข้าของกะปัจจุบัน',
        source:
          'เวลา Gate In และ Gate Out ของรายการทั้งหมด',
        limitations:
          'Gate Out ที่บันทึกล่าช้าอาจทำให้คงค้างต้นช่วงสูงกว่าความเป็นจริง'
      },

      closingBalance: {
        title:
          'คงค้างปลายช่วง',
        meaning:
          'รถหรือตู้ที่ยังอยู่ในพื้นที่เมื่อสิ้นสุดกะ วัน หรือ ณ เวลาปัจจุบัน',
        formula:
          'ต้นช่วง + เข้า − ออกจริง − ปิดอัตโนมัติ ± การแก้ไขข้อมูล',
        example:
          `${formatNumber(
            metric.openingBalance
          )} + ${formatNumber(
            metric.gateIn
          )} − ${formatNumber(
            metric.gateOutActual
          )} − ${formatNumber(
            metric.autoClose
          )} = ${formatNumber(
            metric.closingBalance
          )}`,
        interpretation:
          'ปลายช่วงลดลงหมายถึงงานค้างถูกระบายออก แต่ต้องดูรายการเกินเกณฑ์และคุณภาพข้อมูลประกอบ',
        source:
          'สถานะ Active ณ เวลาสิ้นสุดช่วง',
        limitations:
          'ไม่สามารถบอกสาเหตุของการค้างได้เอง ต้องตรวจบริษัท ขั้นตอนรับสินค้า และข้อยกเว้นเพิ่มเติม'
      },

      backlogChange: {
        title:
          'คงค้างเปลี่ยนแปลง',
        meaning:
          'แสดงว่าระหว่างช่วงที่เลือก จำนวนรถค้างเพิ่มขึ้นหรือลดลงเท่าไร',
        formula:
          'คงค้างเปลี่ยนแปลง = คงค้างปลายช่วง − คงค้างต้นช่วง',
        example:
          `${formatNumber(
            metric.closingBalance
          )} − ${formatNumber(
            metric.openingBalance
          )} = ${signed(
            backlog
          )} รายการ`,
        interpretation:
          backlog > 0
            ? 'ค่าบวกหมายถึงคงค้างเพิ่มขึ้น ควรตรวจว่ารถเข้ากระจุกตัวหรือการระบายช้าลง'
            : backlog < 0
              ? 'ค่าลบหมายถึงสามารถลดงานค้างจากต้นช่วงได้'
              : 'คงค้างต้นและปลายช่วงเท่ากัน',
        source:
          'คงค้างต้นช่วงและคงค้างปลายช่วง',
        limitations:
          'ไม่ควรใช้ค่าเดียวตัดสินกะ เพราะกะที่รับรถเข้ามากอาจมีคงค้างเพิ่มแม้ทำงานได้ตามสภาพภาระ'
      },

      overThreshold: {
        title:
          'รายการเกินเกณฑ์เวลา',
        meaning:
          `จำนวนรายการที่อยู่ในพื้นที่ตั้งแต่ ${redMinutes} นาทีขึ้นไป เกณฑ์นี้ใช้จำแนกสถานะรายคัน ไม่ใช่เป้าหมายของทั้งกะ`,
        formula:
          'สัดส่วนเกินเกณฑ์ = จำนวนเกินเกณฑ์ ÷ จำนวนรายการที่เข้าเกณฑ์คำนวณ × 100',
        example:
          `${over} ÷ ${evaluated || 0} × 100 = ${formatPercent(
            overPercent
          )}`,
        interpretation:
          'ต้องอ่านจำนวนจริงและสัดส่วนพร้อมกัน เช่น 2 จาก 5 ต่างจาก 20 จาก 50 แม้เปอร์เซ็นต์ใกล้กัน',
        source:
          'ระยะเวลาตั้งแต่ Gate In ถึง Gate Out หรือถึงเวลาสิ้นสุดช่วงสำหรับรถที่ยังอยู่',
        limitations:
          'สัดส่วนนี้ไม่ใช่คะแนนผ่าน/ไม่ผ่าน และได้รับผลจากชนิดสินค้า รถค้างเดิม การเข้ากระจุกตัว และข้อจำกัดพื้นที่'
      },

      median: {
        title:
          'ค่ากลางเวลา (Median)',
        meaning:
          'ค่าที่แบ่งรายการออกเป็นสองส่วนใกล้เคียงกัน ครึ่งหนึ่งใช้เวลาไม่เกินค่านี้',
        formula:
          'เรียงระยะเวลาจากน้อยไปมาก แล้วเลือกค่ากลางของชุดข้อมูล',
        example:
          `ค่ากลางเวลาปัจจุบัน ${formatMinutes(
            metricMedian(
              metric
            )
          )}`,
        interpretation:
          'เหมาะสำหรับดูเวลาของรายการทั่วไป เพราะได้รับผลจากรายการค้างนานผิดปกติน้อยกว่าค่าเฉลี่ย',
        source:
          'ระยะเวลาของรายการที่ถูกนำเข้าเกณฑ์คำนวณ',
        limitations:
          'Snapshot เก่าที่สร้างก่อนรอบนี้อาจยังไม่มี Median จนกว่าจะคำนวณ Snapshot ใหม่'
      },

      average: {
        title:
          'เวลาเฉลี่ย',
        meaning:
          'ผลรวมระยะเวลาของรายการทั้งหมด หารด้วยจำนวนรายการที่เข้าเกณฑ์คำนวณ',
        formula:
          'เวลาเฉลี่ย = ผลรวมระยะเวลา ÷ จำนวนรายการที่ประเมิน',
        example:
          `เวลาเฉลี่ย ${formatMinutes(
            metric.averageDwellMinutes
          )} จากฐาน ${evaluated} รายการ`,
        interpretation:
          'รายการค้างนานเพียงไม่กี่รายการสามารถดึงค่าเฉลี่ยให้สูงขึ้นได้',
        source:
          'รถที่ออกแล้วและรถที่ยังอยู่ตามหลักคำนวณของระบบ',
        limitations:
          'ควรอ่านร่วมกับ Median และเวลาส่วนใหญ่ เพื่อแยก Outlier ออกจากรายการทั่วไป'
      },

      p90: {
        title:
          'เวลาส่วนใหญ่ (P90)',
        meaning:
          'เวลาที่ประมาณ 90% ของรายการใช้ไม่เกินค่านี้ และประมาณ 10% ใช้เวลานานกว่า',
        formula:
          'เรียงระยะเวลาทั้งหมด แล้วหาค่าที่ตำแหน่งเปอร์เซ็นไทล์ 90',
        example:
          `เวลาส่วนใหญ่ ${formatMinutes(
            metric.p90DwellMinutes
          )}`,
        interpretation:
          'หากสูงกว่า Median มาก แสดงว่ามีรายการกลุ่มหนึ่งใช้เวลานานผิดปกติ',
        source:
          'ชุดระยะเวลาของรายการที่ประเมินในช่วงที่เลือก',
        limitations:
          'ไม่ใช่เวลาสูงสุด และต้องมีจำนวนข้อมูลเพียงพอจึงจะเสถียร'
      },

      autoClose: {
        title:
          'ปิดอัตโนมัติ',
        meaning:
          'รายการที่ระบบกำหนดเวลาออกให้อัตโนมัติเมื่อไม่มีการบันทึก Gate Out ภายในระยะเวลาที่ตั้งไว้',
        formula:
          `ตรวจรายการที่ยังไม่ออกและมีอายุถึง ${formatNumber(
            method.autoCloseHours
          )} ชั่วโมง`,
        example:
          `พบปิดอัตโนมัติ ${formatNumber(
            metric.autoClose
          )} รายการ`,
        interpretation:
          'จำนวนสูงอาจสะท้อนการไม่ได้บันทึกออก ความคลาดเคลื่อนข้อมูล หรือรถอยู่เกินเวลานาน',
        source:
          'การตั้งค่า Auto Close และดัชนีรายการที่ระบบปิด',
        limitations:
          'ไม่ควรนำไปรวมกับ Gate Out จริงโดยไม่แยกประเภท'
      },

      peakActive: {
        title:
          'จำนวนสูงสุดในพื้นที่',
        meaning:
          'จำนวนรถหรือตู้ Active สูงที่สุดที่ระบบพบภายในวันปฏิบัติงาน',
        formula:
          'คำนวณยอด Active หลังจบแต่ละช่วงเวลา แล้วเลือกค่าสูงสุด',
        example:
          `สูงสุดในพื้นที่ ${formatNumber(
            metric.peakActive
          )} รายการ`,
        interpretation:
          'ใช้ดูแรงกดดันต่อพื้นที่ในช่วงพีค',
        source:
          'สรุปรายชั่วโมงและยอด Active',
        limitations:
          'ไม่บอกความจุพื้นที่สูงสุดที่รองรับได้ เว้นแต่มีข้อมูล Capacity เพิ่มเติม'
      },

      dataCompleteness: {
        title:
          'ความครบถ้วนของข้อมูล',
        meaning:
          'สัดส่วนแถวข้อมูลที่มีเวลาและข้อมูลสำคัญเพียงพอสำหรับการคำนวณ',
        formula:
          'ความครบถ้วน = จำนวนแถวที่ใช้ได้ ÷ จำนวนแถวที่ตรงเงื่อนไข × 100',
        example:
          `ความครบถ้วน ${formatPercent(
            metric.dataCompletenessPercent
          )}`,
        interpretation:
          'หากต่ำ ควรระวังการใช้ตัวเลขเวลาและคงค้างในการตัดสินใจ',
        source:
          'ผลตรวจรูปแบบ Timestamp และข้อมูลที่จำเป็นในแถวต้นทาง',
        limitations:
          '100% หมายถึงผ่านเงื่อนไขทางเทคนิค ไม่ได้ยืนยันว่าข้อมูลหน้างานถูกต้องทุกกรณี'
      },

      workload: {
        title:
          'ระดับภาระงาน',
        meaning:
          'จัดระดับจากปริมาณรถของ Module และกะเดียวกันในอดีต ไม่ใช้จำนวนรถตายตัวร่วมกันทุกคลัง',
        formula:
          'ต่ำ ≤ P25 · ช่วงปกติ P25–P75 · สูง P75–P90 · สูงมาก > P90 ของข้อมูลย้อนหลัง',
        example:
          `${escapeHtml(
            workload.label ||
            'ข้อมูลอ้างอิงยังไม่เพียงพอ'
          )} · ตัวอย่างย้อนหลัง ${formatNumber(
            workload.referenceSampleCount ||
            context.historicalSampleCount
          )} กะ`,
        interpretation:
          'ใช้บอกบริบทของภาระงาน ไม่ได้แปลว่าภาระสูงคือผลงานไม่ดี',
        source:
          'Snapshot กะย้อนหลังของ Module และรหัสกะเดียวกัน',
        limitations:
          workload.preliminary
            ? 'กะยังไม่จบ จึงเป็นค่าประมาณจากอัตรารถเข้าปัจจุบัน'
            : 'ต้องมีข้อมูลย้อนหลังหลายกะและรูปแบบการทำงานควรใกล้เคียงกัน'
      },

      handover: {
        title:
          'การส่งต่องานระหว่างกะ',
        meaning:
          'เปรียบเทียบคงค้างปลายกะก่อนกับคงค้างต้นกะถัดไป',
        formula:
          'ค่าที่ควรสอดคล้องกัน: ปลายกะก่อน = ต้นกะถัดไป',
        example:
          'หากตัวเลขไม่ตรง ระบบจะแสดงเป็นรายการที่ควรตรวจสอบรอยต่อกะ',
        interpretation:
          'ช่วยแยกงานที่กะรับต่อมาออกจากงานที่เกิดขึ้นใหม่ในกะ',
        source:
          'Snapshot ปลายกะและต้นกะตามลำดับเวลา',
        limitations:
          'การแก้ข้อมูลย้อนหลังหรือ Auto Close ในช่วงรอยต่ออาจทำให้ตัวเลขเปลี่ยน'
      },

      flow: {
        title:
          'การไหลของรถ',
        meaning:
          'เปรียบเทียบจำนวนเข้าพื้นที่ ออกจริง และคงค้างของแต่ละกะ',
        formula:
          'ผลต่างการไหล = ออกจริง + ปิดอัตโนมัติ − เข้าพื้นที่',
        example:
          `เข้า ${formatNumber(
            metric.gateIn
          )} · ออกจริง ${formatNumber(
            metric.gateOutActual
          )} · คงค้าง ${formatNumber(
            metric.closingBalance
          )}`,
        interpretation:
          'ออกมากกว่าเข้าอาจช่วยลดคงค้าง แต่ต้องตรวจว่ามี Auto Close ปะปนหรือไม่',
        source:
          'Gate In, Gate Out, Auto Close และ Active Balance',
        limitations:
          'กราฟปริมาณไม่อธิบายเหตุผลของความล่าช้า ต้องดูเวลาและข้อยกเว้นร่วมกัน'
      },

      shiftCard: {
        title:
          card
            ? `คำอธิบายกะ ${card.code}`
            : 'คำอธิบายข้อมูลกะ',
        meaning:
          'การ์ดแยกปริมาณ การเปลี่ยนคงค้าง เวลา ระดับภาระงาน และการเทียบกับข้อมูลอ้างอิง',
        formula:
          'คงค้างเปลี่ยน = ปลายกะ − ต้นกะ\nสัดส่วนเกินเกณฑ์ = จำนวนเกินเกณฑ์ ÷ ฐานคำนวณ × 100',
        example:
          card
            ? `กะ ${card.code}: คงค้างเปลี่ยน ${signed(
                backlog
              )} · เกินเกณฑ์ ${over}/${evaluated} · ${escapeHtml(
                workload.label ||
                'ข้อมูลอ้างอิงยังน้อย'
              )}`
            : 'กดปุ่ม i บนการ์ดกะที่ต้องการ',
        interpretation:
          'ไม่มีคะแนนรวมดีที่สุดแบบตายตัว แต่แยกให้เห็นกะภาระสูง กะลดคงค้าง และกะที่มีเวลารอสูง',
        source:
          'สรุปกะ ข้อมูลย้อนหลังของกะเดียวกัน และการเปรียบเทียบวันก่อน',
        limitations:
          'ปัจจัยที่กะควบคุมไม่ได้ต้องพิจารณาจากข้อมูลหน้างานเพิ่มเติม'
      },

      dailyTrend: {
        title:
          'แนวโน้มรายวัน',
        meaning:
          'แสดงจำนวนเข้า ออกจริง และคงค้างปลายวันย้อนหลัง',
        formula:
          'อ่านค่าจาก Daily Snapshot ของแต่ละวันปฏิบัติงาน',
        example:
          'ใช้ดูทิศทางเพิ่มขึ้นหรือลดลง ไม่ใช้เป็นเส้นเป้าหมาย',
        interpretation:
          'ควรดูร่วมกับระดับภาระงานและสถานะ LIVE/FINAL ของแต่ละวัน',
        source:
          'ชีทสรุปรายวัน',
        limitations:
          'จำนวนวันย้อนหลังน้อยอาจยังไม่เพียงพอสำหรับสรุปแนวโน้มระยะยาว'
      }
    };

    return (
      common[key] ||
      common.overview
    );
  }


  function metricContextHeader(
    data,
    card,
    context
  ) {
    const method =
      data.methodology ||
      {};

    return `
      <div class="metric-info-context">
        <div>
          <span>Module</span>
          <strong>
            ${escapeHtml(
              data.module &&
              data.module.name ||
              state.moduleId ||
              '-'
            )}
          </strong>
        </div>

        <div>
          <span>วันปฏิบัติงาน</span>
          <strong>
            ${escapeHtml(
              data.businessDate ||
              '-'
            )}
          </strong>
        </div>

        <div>
          <span>ขอบเขต</span>
          <strong>
            ${
              card
                ? `กะ ${escapeHtml(
                    card.code
                  )} ${escapeHtml(
                    card.start
                  )}–${escapeHtml(
                    card.end
                  )}`
                : 'รวมทั้งวัน'
            }
          </strong>
        </div>

        <div>
          <span>เกณฑ์เวลา</span>
          <strong>
            เฝ้าระวัง
            ${formatNumber(
              method.warningMinutes
            )}
            · เกิน
            ${formatNumber(
              method.redMinutes
            )}
            นาที
          </strong>
        </div>

        <div>
          <span>ข้อมูลย้อนหลัง</span>
          <strong>
            ${formatNumber(
              context
                .historicalSampleCount
            )}
            ช่วง
          </strong>
        </div>

        <div>
          <span>ภาระใกล้เคียง</span>
          <strong>
            ${formatNumber(
              context
                .similarSampleCount
            )}
            ช่วง
          </strong>
        </div>
      </div>
    `;
  }


  function metricInfoSection(
    title,
    content,
    className
  ) {
    return `
      <section class="metric-info-section ${
        className ||
        ''
      }">
        <h4>
          ${escapeHtml(
            title
          )}
        </h4>

        <div>
          ${formatInfoText(
            content
          )}
        </div>
      </section>
    `;
  }


  function formatInfoText(
    value
  ) {
    return escapeHtml(
      String(
        value ||
        '-'
      )
    )
      .replace(
        /\n/g,
        '<br>'
      );
  }


  function renderProcessCharts(
    data
  ) {
    if (
      typeof window.Chart ===
      'undefined'
    ) {
      return;
    }

    const process =
      data &&
      data.processAnalytics ||
      {};

    const stages =
      Array.isArray(
        process.stages
      )
        ? process.stages
        : [];

    renderProcessShareChart(
      stages
    );

    renderProcessSlaChart(
      stages
    );
  }


  function renderProcessShareChart(
    stages
  ) {
    const canvas =
      byId(
        'processTimeShareChart'
      );

    if (!canvas) {
      return;
    }

    const values =
      stages.map(
        function (stage) {
          return Math.max(
            0,
            Number(
              stage.averageMinutes
            ) ||
            0
          );
        }
      );

    const hasData =
      values.some(
        function (value) {
          return value > 0;
        }
      );

    state.charts.processShare =
      new window.Chart(
        canvas,
        {
          type:
            'doughnut',
          data: {
            labels:
              stages.map(
                function (stage) {
                  return stage.shortLabel ||
                    stage.label;
                }
              ),
            datasets: [
              {
                data:
                  hasData
                    ? values
                    : stages.map(
                        function () {
                          return 1;
                        }
                      ),
                backgroundColor: [
                  '#0f9d7a',
                  '#2369d8',
                  '#7c3aed',
                  '#e88709'
                ],
                borderColor:
                  '#ffffff',
                borderWidth:
                  3
              }
            ]
          },
          options: {
            responsive:
              true,
            maintainAspectRatio:
              false,
            cutout:
              '58%',
            plugins: {
              legend: {
                position:
                  'right',
                labels: {
                  usePointStyle:
                    true,
                  boxWidth:
                    8,
                  color:
                    '#294b5e',
                  font: {
                    size:
                      11,
                    weight:
                      '700'
                  },
                  generateLabels:
                    function (chart) {
                      return chart.data.labels.map(
                        function (label, index) {
                          return {
                            text:
                              label +
                              ' · ' +
                              formatMinutes(
                                values[index]
                              ),
                            fillStyle:
                              chart.data.datasets[0]
                                .backgroundColor[index],
                            strokeStyle:
                              '#ffffff',
                            lineWidth:
                              1,
                            hidden:
                              false,
                            index:
                              index,
                            pointStyle:
                              'circle'
                          };
                        }
                      );
                    }
                }
              },
              tooltip: {
                callbacks: {
                  label:
                    function (context) {
                      const stage =
                        stages[
                          context.dataIndex
                        ] ||
                        {};

                      return [
                        'เฉลี่ย ' +
                        formatMinutes(
                          stage.averageMinutes
                        ),
                        'สัดส่วน ' +
                        formatPercent(
                          stage.averageSharePercent
                        )
                      ];
                    }
                }
              }
            }
          }
        }
      );
  }


  function renderProcessSlaChart(
    stages
  ) {
    const canvas =
      byId(
        'processSlaChart'
      );

    if (!canvas) {
      return;
    }

    const options =
      chartOptions(
        true
      );

    options.indexAxis =
      'y';

    options.scales = {
      x: {
        stacked:
          true,
        beginAtZero:
          true,
        grid: {
          color:
            '#e5edf1'
        },
        ticks: {
          precision:
            0,
          color:
            '#607784'
        }
      },
      y: {
        stacked:
          true,
        grid: {
          display:
            false
        },
        ticks: {
          color:
            '#294b5e',
          font: {
            size:
              10,
            weight:
              '700'
          }
        }
      }
    };

    state.charts.processSla =
      new window.Chart(
        canvas,
        {
          type:
            'bar',
          data: {
            labels:
              stages.map(
                function (stage) {
                  return stage.shortLabel ||
                    stage.label;
                }
              ),
            datasets: [
              {
                label:
                  'ภายในเกณฑ์',
                data:
                  stages.map(
                    function (stage) {
                      return Number(
                        stage.withinCount
                      ) || 0;
                    }
                  ),
                backgroundColor:
                  '#0f9d7a',
                borderRadius:
                  4
              },
              {
                label:
                  'เฝ้าระวัง',
                data:
                  stages.map(
                    function (stage) {
                      return Number(
                        stage.warningCount
                      ) || 0;
                    }
                  ),
                backgroundColor:
                  '#e8a20a',
                borderRadius:
                  4
              },
              {
                label:
                  'เกินเวลา',
                data:
                  stages.map(
                    function (stage) {
                      return Number(
                        stage.criticalCount
                      ) || 0;
                    }
                  ),
                backgroundColor:
                  '#d93636',
                borderRadius:
                  4
              }
            ]
          },
          options:
            options
        }
      );
  }


  function renderFlowChart(
    data
  ) {
    if (
      typeof window.Chart ===
      'undefined'
    ) {
      return;
    }

    const canvas =
      byId(
        'shiftFlowComparisonChart'
      );

    if (!canvas) {
      return;
    }

    const cards =
      data.shifts || [];

    state.charts.flow =
      new window.Chart(
        canvas,
        {
          type:
            'bar',

          data: {
            labels:
              cards.map(
                (card) =>
                  `กะ ${card.code}`
              ),

            datasets: [
              {
                label:
                  'เข้าพื้นที่',

                data:
                  cards.map(
                    (card) =>
                      card.metrics
                        .gateIn
                  ),

                backgroundColor:
                  '#0f9d7a',

                borderRadius:
                  4
              },

              {
                label:
                  'ออกจริง',

                data:
                  cards.map(
                    (card) =>
                      card.metrics
                        .gateOutActual
                  ),

                backgroundColor:
                  '#2369d8',

                borderRadius:
                  4
              },

              {
                label:
                  'คงค้าง',

                data:
                  cards.map(
                    (card) =>
                      card.metrics
                        .closingBalance
                  ),

                backgroundColor:
                  '#e88709',

                borderRadius:
                  4
              }
            ]
          },

          options:
            chartOptions(
              false
            )
        }
      );
  }


  function renderSlaChart(
    data
  ) {
    if (
      typeof window.Chart ===
      'undefined'
    ) {
      return;
    }

    const canvas =
      byId(
        'shiftSlaComparisonChart'
      );

    if (!canvas) {
      return;
    }

    const cards =
      data.shifts ||
      [];

    const options =
      chartOptions(
        true
      );

    options.scales = {
      x: {
        stacked:
          true,
        grid: {
          display:
            false
        },
        ticks: {
          color:
            '#334f61',
          font: {
            size:
              13,
            weight:
              '700'
          }
        }
      },
      y: {
        stacked:
          true,
        beginAtZero:
          true,
        grid: {
          color:
            '#e3ebef'
        },
        ticks: {
          precision:
            0,
          color:
            '#607784',
          font: {
            size:
              12,
            weight:
              '600'
          }
        }
      }
    };

    state.charts.sla =
      new window.Chart(
        canvas,
        {
          type:
            'bar',

          data: {
            labels:
              cards.map(
                (card) =>
                  `กะ ${card.code}`
              ),

            datasets: [
              {
                label:
                  'อยู่ภายในเกณฑ์',

                data:
                  cards.map(
                    (card) =>
                      metricWithinCount(
                        card.metrics
                      )
                  ),

                backgroundColor:
                  '#2d7f9d',

                borderRadius:
                  4
              },

              {
                label:
                  'เกินเกณฑ์',

                data:
                  cards.map(
                    (card) =>
                      metricOverCount(
                        card.metrics
                      )
                  ),

                backgroundColor:
                  '#d86b32',

                borderRadius:
                  4
              }
            ]
          },

          options:
            options
        }
      );
  }

  function renderHistoryChart(
    data
  ) {
    if (
      typeof window.Chart ===
      'undefined'
    ) {
      return;
    }

    const canvas =
      byId(
        'dailyShiftHistoryChart'
      );

    if (!canvas) {
      return;
    }

    const history =
      dailyHistoryRows(
        data
      )
        .slice(
          0,
          10
        )
        .reverse();

    state.charts.history =
      new window.Chart(
        canvas,
        {
          type:
            'line',

          data: {
            labels:
              history.map(
                (item) =>
                  item.businessDate
              ),

            datasets: [
              {
                label:
                  'เข้าพื้นที่',

                data:
                  history.map(
                    (item) =>
                      item.gateIn
                  ),

                borderColor:
                  '#0f9d7a',

                backgroundColor:
                  'rgba(15,157,122,.12)',

                tension:
                  .28,

                fill:
                  false
              },

              {
                label:
                  'ออกจริง',

                data:
                  history.map(
                    (item) =>
                      item.gateOutActual
                  ),

                borderColor:
                  '#2369d8',

                backgroundColor:
                  'rgba(35,105,216,.12)',

                tension:
                  .28,

                fill:
                  false
              },

              {
                label:
                  'คงค้าง',

                data:
                  history.map(
                    (item) =>
                      item.closingBalance
                  ),

                borderColor:
                  '#e88709',

                backgroundColor:
                  'rgba(232,135,9,.12)',

                tension:
                  .28,

                fill:
                  false
              }
            ]
          },

          options:
            chartOptions(
              isMobileChart()
            )
        }
      );
  }


  function isMobileChart() {
    return Boolean(
      window.matchMedia &&
      window.matchMedia(
        '(max-width: 920px)'
      ).matches
    );
  }


  function chartOptions(
    compact
  ) {
    return {
      responsive:
        true,

      maintainAspectRatio:
        false,

      devicePixelRatio:
        Math.min(
          window.devicePixelRatio ||
          1,
          2
        ),

      animation: {
        duration:
          260
      },

      interaction: {
        mode:
          'index',

        intersect:
          false
      },

      layout: {
        padding: {
          top:
            8,

          right:
            8,

          bottom:
            2,

          left:
            4
        }
      },

      plugins: {
        legend: {
          position:
            'bottom',

          labels: {
            usePointStyle:
              true,

            pointStyle:
              'rectRounded',

            boxWidth:
              compact
                ? 8
                : 11,

            boxHeight:
              compact
                ? 8
                : 11,

            padding:
              compact
                ? 8
                : 16,

            color:
              '#385365',

            font: {
              size:
                compact
                  ? 10
                  : 13,

              weight:
                '700',

              family:
                'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }
          }
        },

        tooltip: {
          enabled:
            true,

          titleFont: {
            size:
              compact
                ? 11
                : 13
          },

          bodyFont: {
            size:
              compact
                ? 11
                : 13
          },

          padding:
            compact
              ? 8
              : 10,

          displayColors:
            true
        }
      },

      scales: {
        y: {
          beginAtZero:
            true,

          grid: {
            color:
              '#e3ebef'
          },

          border: {
            display:
              false
          },

          ticks: {
            precision:
              0,

            maxTicksLimit:
              compact
                ? 5
                : 8,

            color:
              '#607784',

            font: {
              size:
                compact
                  ? 10
                  : 12,

              weight:
                '600'
            }
          }
        },

        x: {
          grid: {
            display:
              false
          },

          border: {
            display:
              false
          },

          ticks: {
            autoSkip:
              true,

            maxRotation:
              0,

            minRotation:
              0,

            maxTicksLimit:
              compact
                ? 5
                : 10,

            color:
              '#334f61',

            font: {
              size:
                compact
                  ? 10
                  : 13,

              weight:
                '750'
            }
          }
        }
      }
    };
  }

  function destroyCharts() {
    Object.keys(
      state.charts
    ).forEach(
      (key) => {
        if (
          state.charts[key]
        ) {
          state.charts[key]
            .destroy();

          state.charts[key] =
            null;
        }
      }
    );
  }


  function setWorkspaceBusy(
    active,
    message
  ) {
    const workspace =
      byId(
        'dashboardShiftWorkspace'
      );

    if (!workspace) {
      return;
    }

    workspace.classList.toggle(
      'is-refreshing',
      active === true
    );

    let badge =
      workspace.querySelector(
        '.shift-refresh-badge'
      );

    if (
      active === true &&
      !badge
    ) {
      badge =
        document.createElement(
          'div'
        );

      badge.className =
        'shift-refresh-badge';

      workspace.appendChild(
        badge
      );
    }

    if (badge) {
      badge.innerHTML = active
        ? `
            <i></i>
            <span>
              ${escapeHtml(
                message ||
                'กำลังอัปเดต'
              )}
            </span>
          `
        : '';

      badge.hidden =
        active !==
        true;
    }
  }


  function renderLoading(
    message
  ) {
    const workspace =
      byId(
        'dashboardShiftWorkspace'
      );

    if (!workspace) {
      return;
    }

    workspace.innerHTML = `
      <div class="shift-professional-loading">
        <div class="shift-loading-title">
          <span></span>

          <div>
            <strong>
              ${escapeHtml(
                message
              )}
            </strong>

            <small>
              กำลังจัดทำข้อมูลสำหรับผู้บริหาร
            </small>
          </div>
        </div>

        <div class="shift-loading-kpis">
          ${Array.from(
            { length: 6 },
            () => '<i></i>'
          ).join('')}
        </div>

        <div class="shift-loading-cards">
          ${Array.from(
            { length: 3 },
            () => '<i></i>'
          ).join('')}
        </div>

        <div class="shift-loading-panels">
          <i></i>
          <i></i>
        </div>
      </div>
    `;
  }

  function renderError(
    error
  ) {
    const workspace =
      byId(
        'dashboardShiftWorkspace'
      );

    if (!workspace) {
      return;
    }

    workspace.innerHTML = `
      <div class="shift-dashboard-message is-error">
        <strong>
          โหลดข้อมูลตามกะไม่สำเร็จ
        </strong>

        <span>
          ${escapeHtml(
            error?.message ||
            'เกิดข้อผิดพลาด'
          )}
        </span>

        <button
          type="button"
          id="retryShiftDashboard"
        >
          ลองใหม่
        </button>
      </div>
    `;

    byId(
      'retryShiftDashboard'
    )?.addEventListener(
      'click',
      () => {
        loadShiftDashboard(
          true
        );
      }
    );
  }


  function disabledHtml() {
    return `
      <div class="shift-dashboard-message">
        <strong>
          Module นี้ยังไม่ได้เปิดการคำนวณตามกะ
        </strong>

        <span>
          ผู้ดูแลระบบสามารถเปิดใช้งานและกำหนดเวลากะจากหน้า Shift Admin
        </span>

        <a href="../shift-admin.html">
          เปิดหน้าตั้งค่ากะ
        </a>
      </div>
    `;
  }


  function executiveKpi(
    label,
    value,
    unit,
    className,
    infoKey
  ) {
    return `
      <div class="${className || ''}">
        <span class="metric-label-line">
          ${escapeHtml(
            label
          )}

          ${
            infoKey
              ? `
                  <button
                    type="button"
                    data-metric-info="${escapeHtml(
                      infoKey
                    )}"
                    aria-label="อธิบาย ${escapeHtml(
                      label
                    )}"
                  >
                    i
                  </button>
                `
              : ''
          }
        </span>

        <strong>
          ${escapeHtml(
            String(
              value ??
              0
            )
          )}
        </strong>

        ${
          unit
            ? `
                <small>
                  ${escapeHtml(
                    unit
                  )}
                </small>
              `
            : ''
        }
      </div>
    `;
  }


  function dailyMetricHtml(
    label,
    value,
    className,
    infoKey,
    subtext
  ) {
    return `
      <div class="${className || ''}">
        <span class="metric-label-line">
          ${escapeHtml(
            label
          )}

          ${
            infoKey
              ? `
                  <button
                    type="button"
                    data-metric-info="${escapeHtml(
                      infoKey
                    )}"
                    aria-label="อธิบาย ${escapeHtml(
                      label
                    )}"
                  >
                    i
                  </button>
                `
              : ''
          }
        </span>

        <strong>
          ${escapeHtml(
            String(
              value ??
              0
            )
          )}
        </strong>

        ${
          subtext
            ? `
                <small>
                  ${escapeHtml(
                    subtext
                  )}
                </small>
              `
            : ''
        }
      </div>
    `;
  }


  function shiftCardMetric(
    label,
    value,
    className
  ) {
    return `
      <div>
        <span>
          ${escapeHtml(
            label
          )}
        </span>

        <strong class="${
          className ||
          ''
        }">
          ${escapeHtml(
            String(
              value ??
              0
            )
          )}
        </strong>
      </div>
    `;
  }


  function dailyInsightItem(
    label,
    value,
    description
  ) {
    return `
      <div>
        <span>
          ${escapeHtml(
            label
          )}
        </span>

        <strong>
          ${escapeHtml(
            String(
              value === null ||
              value === undefined ||
              String(value).trim() === ''
                ? '-'
                : value
            )
          )}
        </strong>

        <small>
          ${escapeHtml(
            description ||
            ''
          )}
        </small>
      </div>
    `;
  }

  function deltaBadge(
    label,
    value,
    lowerIsBetter,
    suffix
  ) {
    const numeric =
      Number(value) || 0;

    const good =
      numeric === 0
        ? null
        : lowerIsBetter
          ? numeric < 0
          : numeric > 0;

    return `
      <span class="${
        good === null
          ? 'is-neutral'
          : good
            ? 'is-positive'
            : 'is-negative'
      }">
        ${escapeHtml(
          label
        )}
        ${signed(
          numeric
        )}${suffix || ''}
      </span>
    `;
  }


  function detailItem(
    label,
    value
  ) {
    return `
      <div>
        <span>
          ${escapeHtml(
            label
          )}
        </span>

        <strong>
          ${escapeHtml(
            String(
              value ??
              '-'
            )
          )}
        </strong>
      </div>
    `;
  }


  function exceptionLabel(
    type
  ) {
    const map = {
      OVERDUE:
        'เกินเกณฑ์',
      AUTO_CLOSE:
        'ระบบ Auto Close',
      MISSING_RECEIVING:
        'ไม่มีข้อมูลรับสินค้าเสร็จ',
      INCOMPLETE_DATA:
        'ข้อมูลไม่สมบูรณ์',
      CARRY_OVER_OVERDUE:
        'เกิน SLA และส่งต่อกะ'
    };

    return (
      map[
        String(
          type ||
          ''
        ).toUpperCase()
      ] ||
      String(
        type ||
        'รายการผิดปกติ'
      )
    );
  }


  function slaTone(
    value
  ) {
    return '';
  }

  function formatNumber(
    value
  ) {
    const numeric =
      Number(value);

    if (!Number.isFinite(numeric)) {
      return '0';
    }

    return new Intl.NumberFormat(
      'th-TH',
      {
        maximumFractionDigits:
          2
      }
    ).format(numeric);
  }


  function formatPercent(
    value
  ) {
    return (
      formatNumber(
        value
      ) +
      '%'
    );
  }


  function formatMinutes(
    value
  ) {
    return (
      formatNumber(
        value
      ) +
      ' นาที'
    );
  }


  function metricEvaluated(
    metric
  ) {
    const explicit =
      Number(
        metric &&
        metric.evaluatedRecords
      );

    if (
      Number.isFinite(
        explicit
      ) &&
      explicit >= 0
    ) {
      return Math.round(
        explicit
      );
    }

    return Math.max(
      0,
      Math.round(
        Number(
          metric &&
          metric.gateOutActual
        ) +
        Number(
          metric &&
          metric.autoClose
        ) +
        Number(
          metric &&
          metric.closingBalance
        )
      )
    );
  }


  function metricOverCount(
    metric
  ) {
    const explicit =
      Number(
        metric &&
        metric.overThresholdRecords
      );

    if (
      Number.isFinite(
        explicit
      ) &&
      explicit >= 0
    ) {
      return Math.round(
        explicit
      );
    }

    const evaluated =
      metricEvaluated(
        metric
      );

    const compliance =
      Number(
        metric &&
        metric.slaCompliancePercent
      );

    return Math.max(
      0,
      Math.round(
        evaluated *
        (
          1 -
          (
            Number.isFinite(
              compliance
            )
              ? compliance
              : 100
          ) /
          100
        )
      )
    );
  }


  function metricWithinCount(
    metric
  ) {
    const explicit =
      Number(
        metric &&
        metric.withinThresholdRecords
      );

    if (
      Number.isFinite(
        explicit
      ) &&
      explicit >= 0
    ) {
      return Math.round(
        explicit
      );
    }

    return Math.max(
      0,
      metricEvaluated(
        metric
      ) -
      metricOverCount(
        metric
      )
    );
  }


  function metricOverPercent(
    metric
  ) {
    const explicit =
      Number(
        metric &&
        metric.overThresholdPercent
      );

    if (
      Number.isFinite(
        explicit
      ) &&
      explicit >= 0
    ) {
      return explicit;
    }

    const evaluated =
      metricEvaluated(
        metric
      );

    return evaluated > 0
      ? (
          metricOverCount(
            metric
          ) /
          evaluated
        ) *
        100
      : 0;
  }


  function metricBacklogChange(
    metric
  ) {
    const explicit =
      Number(
        metric &&
        metric.backlogChange
      );

    if (
      Number.isFinite(
        explicit
      )
    ) {
      return explicit;
    }

    return (
      Number(
        metric &&
        metric.closingBalance
      ) -
      Number(
        metric &&
        metric.openingBalance
      )
    );
  }


  function metricMedian(
    metric
  ) {
    const value =
      Number(
        metric &&
        metric.medianDwellMinutes
      );

    return Number.isFinite(
      value
    )
      ? value
      : 0;
  }


  function historyStatusLabel(
    status
  ) {
    const labels = {
      LIVE:
        'ระหว่างวัน',
      FINAL:
        'ปิดวันแล้ว',
      CALCULATED:
        'คำนวณแล้ว',
      RECALCULATED:
        'คำนวณใหม่',
      PROVISIONAL:
        'สรุปเบื้องต้น'
    };

    return (
      labels[
        String(
          status ||
          ''
        ).toUpperCase()
      ] ||
      status ||
      '-'
    );
  }


  function signed(
    value
  ) {
    const numeric =
      Number(value) || 0;

    if (numeric > 0) {
      return (
        '+' +
        formatNumber(
          numeric
        )
      );
    }

    return formatNumber(
      numeric
    );
  }



  function normalizeBusinessDateValue(
    value
  ) {
    const text =
      String(
        value ||
        ''
      ).trim();

    const isoMatch =
      text.match(
        /^(\d{4})-(\d{2})-(\d{2})/
      );

    if (isoMatch) {
      return (
        isoMatch[1] + '-' +
        isoMatch[2] + '-' +
        isoMatch[3]
      );
    }

    const dmyMatch =
      text.match(
        /^(\d{2})\/(\d{2})\/(\d{4})/
      );

    if (dmyMatch) {
      return (
        dmyMatch[3] + '-' +
        dmyMatch[2] + '-' +
        dmyMatch[1]
      );
    }

    return todayIso();
  }


  function shiftRangeTitle(
    card
  ) {
    const item =
      card &&
      typeof card ===
        'object'
        ? card
        : {};

    const start =
      dashboardDisplayDateTime(
        item.rangeStart
      );

    const end =
      dashboardDisplayDateTime(
        item.rangeEnd
      );

    if (
      start !== '-' &&
      end !== '-'
    ) {
      return (
        'ช่วงจริง ' +
        start +
        ' – ' +
        end +
        (
          item.crossesMidnight ===
            true
            ? ' (ข้ามวัน)'
            : ''
        )
      );
    }

    return (
      String(
        item.start ||
        ''
      ) +
      ' – ' +
      String(
        item.end ||
        ''
      )
    ).trim();
  }


  function isCrossDayWindow(
    startValue,
    endValue
  ) {
    const startText =
      dashboardDisplayDateTime(
        startValue
      );

    const endText =
      dashboardDisplayDateTime(
        endValue
      );

    const startDate =
      startText.match(
        /^(\d{2}\/\d{2}\/\d{4})/
      );

    const endDate =
      endText.match(
        /^(\d{2}\/\d{2}\/\d{4})/
      );

    return Boolean(
      startDate &&
      endDate &&
      startDate[1] !==
        endDate[1]
    );
  }


 function dashboardDisplayDateTime(
  value
) {
  const text =
    String(value || '')
      .trim();

  if (!text) {
    return '-';
  }

  if (
    /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(text)
  ) {
    return text;
  }

  /*
   * ต้องตรวจ dd/MM/yyyy ก่อน new Date()
   * เพื่อป้องกัน Browser ตีความ 04/07/2026 เป็น MM/DD/YYYY
   */
  const dmyMatch =
    text.match(
      /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/
    );

  if (dmyMatch) {
    return (
      dmyMatch[1] + '/' +
      dmyMatch[2] + '/' +
      dmyMatch[3] + ' ' +
      String(dmyMatch[4] || '00')
        .padStart(2, '0') + ':' +
      String(dmyMatch[5] || '00')
        .padStart(2, '0') + ':' +
      String(dmyMatch[6] || '00')
        .padStart(2, '0')
    );
  }

  const isoMatch =
    text.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}):(\d{2}))?$/
    );

  if (isoMatch) {
    const date =
      new Date(
        isoMatch[1] + '-' +
        isoMatch[2] + '-' +
        isoMatch[3] + 'T' +
        String(isoMatch[4] || '00')
          .padStart(2, '0') + ':' +
        String(isoMatch[5] || '00')
          .padStart(2, '0') + ':' +
        String(isoMatch[6] || '00')
          .padStart(2, '0') +
        '+07:00'
      );

    if (
      !Number.isNaN(
        date.getTime()
      )
    ) {
      return formatBangkokDateTimeFromDate(
        date
      );
    }
  }

  const nativeDate =
    new Date(text);

  if (
    !Number.isNaN(
      nativeDate.getTime()
    )
  ) {
    return formatBangkokDateTimeFromDate(
      nativeDate
    );
  }

  return text;
}


  function formatBangkokDateTimeFromDate(
    date
  ) {
    const parts =
      new Intl.DateTimeFormat(
        'en-GB',
        {
          timeZone:
            'Asia/Bangkok',
          day:
            '2-digit',
          month:
            '2-digit',
          year:
            'numeric',
          hour:
            '2-digit',
          minute:
            '2-digit',
          second:
            '2-digit',
          hour12:
            false
        }
      )
        .formatToParts(date)
        .reduce(
          (result, part) => {
            result[part.type] =
              part.value;

            return result;
          },
          {}
        );

    return (
      parts.day + '/' +
      parts.month + '/' +
      parts.year + ' ' +
      parts.hour + ':' +
      parts.minute + ':' +
      parts.second
    );
  }


  function shortDateTime(
    value
  ) {
    const text =
      String(
        value ||
        '-'
      );

    return text
      .replace(
        /:00$/,
        ''
      );
  }


  function emptyPanel(
    message
  ) {
    return `
      <div class="shift-empty-panel">
        ${escapeHtml(
          message
        )}
      </div>
    `;
  }


  function changeDate(
    days
  ) {
    const date =
      parseIsoDate(
        state.selectedDate
      );

    date.setDate(
      date.getDate() +
      days
    );

    const today =
      parseIsoDate(
        todayIso()
      );

    if (
      date.getTime() >
      today.getTime()
    ) {
      return;
    }

    state.selectedDate =
      isoFromDate(
        date
      );

    state.followCurrentBusinessDate =
      false;

    state.data =
      null;

    syncDateInput();

    if (
      state.view ===
      'LIVE'
    ) {
      setView(
        'DAILY'
      );

      return;
    }

    loadShiftDashboard();
  }


  function openHistoricalCalendar() {
    const input =
      byId(
        'dashboardShiftDate'
      );

    if (!input) {
      return;
    }

    input.max =
      todayIso();

    if (
      typeof input.showPicker ===
      'function'
    ) {
      try {
        input.showPicker();
        return;
      } catch (error) {
        console.warn(
          'เปิดปฏิทินด้วย showPicker ไม่สำเร็จ',
          error
        );
      }
    }

    input.focus();
    input.click();
  }


  function syncDateInput() {
    const input =
      byId(
        'dashboardShiftDate'
      );

    if (input) {
      state.selectedDate =
        normalizeBusinessDateValue(
          state.selectedDate
        );

      input.value =
        state.selectedDate;
    }
  }


  function scheduleRefresh() {
    stopRefreshTimer();

    if (
      state.view ===
      'LIVE'
    ) {
      return;
    }

    state.refreshTimer =
      window.setTimeout(
        () => {
          if (
            state.followCurrentBusinessDate ||
            state.selectedDate ===
              todayIso()
          ) {
            loadShiftDashboard(
              true
            );
          } else {
            scheduleRefresh();
          }
        },
        120000
      );
  }


  function stopRefreshTimer() {
    if (
      state.refreshTimer
    ) {
      window.clearTimeout(
        state.refreshTimer
      );

      state.refreshTimer =
        null;
    }
  }


  function bindLayoutObservers() {
    const handler =
      scheduleLayoutRefresh;

    document.addEventListener(
      'fullscreenchange',
      handler
    );

    window.addEventListener(
      'resize',
      handler,
      {
        passive:
          true
      }
    );

    window.addEventListener(
      'orientationchange',
      handler,
      {
        passive:
          true
      }
    );

  }


  function scheduleLayoutRefresh() {
    if (
      state.layoutTimer
    ) {
      window.clearTimeout(
        state.layoutTimer
      );
    }

    window.requestAnimationFrame(
      () => {
        syncViewportMetrics();

        state.layoutTimer =
          window.setTimeout(
            () => {
              syncViewportMetrics();
              resizeCharts();
            },
            180
          );
      }
    );
  }


  function syncViewportMetrics() {
    const header =
      document.querySelector(
        '.control-header'
      );

    const measuredHeaderHeight =
      header
        ? Math.ceil(
            header
              .getBoundingClientRect()
              .height
          )
        : 76;

    const isSmallScreen =
      window.matchMedia &&
      window.matchMedia(
        '(max-width: 920px)'
      ).matches;

    /*
     * ROUND 80:
     * desktop ต้องใช้ค่ามาตรฐาน เพื่อกัน header สูงค้าง
     * หลังจากย่อหน้าต่างเข้า breakpoint มือถือแล้วขยายกลับ
     */
    const headerHeight =
      isSmallScreen
        ? measuredHeaderHeight
        : 76;

    document.documentElement
      .style.setProperty(
        '--shift-dashboard-header-height',
        `${headerHeight}px`
      );

    document.documentElement
      .style.setProperty(
        '--shift-dashboard-viewport-height',
        `${window.innerHeight}px`
      );

    document.body.classList.toggle(
      'is-dashboard-fullscreen',
      Boolean(
        document.fullscreenElement
      )
    );
  }


  function resizeCharts() {
    Object.values(
      state.charts
    ).forEach(
      (chart) => {
        if (
          chart &&
          typeof chart.resize ===
            'function'
        ) {
          chart.resize();
        }
      }
    );
  }


  function destroy() {
    stopRefreshTimer();
    destroyCharts();

    if (
      state.layoutTimer
    ) {
      window.clearTimeout(
        state.layoutTimer
      );
    }

  }


  function getModuleId() {
    return (
      new URLSearchParams(
        window.location.search
      ).get('module') ||
      new URLSearchParams(
        window.location.search
      ).get('id') ||
      ''
    ).trim();
  }


  function todayIso() {
    return isoFromDate(
      new Date()
    );
  }


  function parseIsoDate(
    value
  ) {
    const parts =
      String(
        value ||
        todayIso()
      ).split('-');

    return new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    );
  }


  function isoFromDate(
    date
  ) {
    return [
      date.getFullYear(),
      String(
        date.getMonth() + 1
      ).padStart(
        2,
        '0'
      ),
      String(
        date.getDate()
      ).padStart(
        2,
        '0'
      )
    ].join('-');
  }


  function byId(
    id
  ) {
    return document
      .getElementById(id);
  }


  function escapeHtml(
    value
  ) {
    return String(
      value ??
      ''
    )
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#039;'
      );
  }

})(window, document);


/* ============================================================
 * SOURCE 05: dashboard-executive-clean(5).js
 * ============================================================ */
/************************************************************
 * dashboard-executive-clean.js
 * ROUND 80 — Executive Clean Layout Controller
 ************************************************************/

(function (window, document) {
  'use strict';

  const DATE_TIME_FULL =
    /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/;

  const RAW_DATE_PATTERNS = [
    /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+GMT[+-]\d{4}(?:\s*\([^)]+\))?/gi,
    /\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b/g,
    /\b\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}\b/g
  ];

  let layoutTimer = 0;
  let observer = null;
  let swalPatched = false;

  function init() {
    document.body.classList.add(
      'r65-dashboard-clean'
    );

    syncMode();
    syncHeights();
    patchSweetAlert();
    normalizeDateTimes(document.body);
    bindEvents();
    startObserver();

    scheduleLayout();
  }

  function bindEvents() {
    document.addEventListener(
      'click',
      (event) => {
        if (
          event.target.closest(
            '[data-dashboard-view]'
          )
        ) {
          window.setTimeout(
            scheduleLayout,
            80
          );
        }
      },
      true
    );

    document.addEventListener(
      'fullscreenchange',
      scheduleLayout
    );

    window.addEventListener(
      'resize',
      scheduleLayout,
      {
        passive:
          true
      }
    );

    window.addEventListener(
      'orientationchange',
      scheduleLayout,
      {
        passive:
          true
      }
    );
  }

  function syncMode() {
    const active =
      document.querySelector(
        '.dashboard-view-tabs [data-dashboard-view].is-active'
      );

    let mode =
      active &&
      active.dataset
        ? active.dataset.dashboardView
        : '';

    const workspace =
      document.getElementById(
        'dashboardShiftWorkspace'
      );

    if (!mode) {
      mode =
        workspace &&
        workspace.hidden === false
          ? 'SHIFT'
          : 'LIVE';
    }

    document.body.dataset.dashboardView =
      mode || 'LIVE';
  }

  function syncHeights() {
    const header =
      document.querySelector(
        '.control-header'
      );

    const toolbar =
      document.getElementById(
        'dashboardViewToolbar'
      );

    const isSmallScreen =
      window.matchMedia &&
      window.matchMedia(
        '(max-width: 920px)'
      ).matches;

    const measuredHeaderHeight =
      header
        ? Math.ceil(
            header.getBoundingClientRect()
              .height
          )
        : 76;

    const measuredToolbarHeight =
      toolbar
        ? Math.ceil(
            toolbar.getBoundingClientRect()
              .height
          )
        : 54;

    /*
     * ROUND 80:
     * ห้ามนำค่าความสูง header ตอนจอเล็กไปค้างใช้บน desktop
     * เพราะตอน mobile header ถูกจัดเป็นหลายแถว ทำให้สูงกว่าปกติ
     * เมื่อขยายกลับ desktop จึงเกิดอาการแถบด้านบนใหญ่ผิดปกติ
     */
    const headerHeight =
      isSmallScreen
        ? measuredHeaderHeight
        : 76;

    const toolbarHeight =
      isSmallScreen
        ? measuredToolbarHeight
        : 54;

    document.documentElement
      .style.setProperty(
        '--r65-header-h',
        headerHeight + 'px'
      );

    document.documentElement
      .style.setProperty(
        '--r65-toolbar-h',
        toolbarHeight + 'px'
      );

    document.documentElement
      .style.setProperty(
        '--r65-vh',
        window.innerHeight + 'px'
      );

    document.documentElement
      .style.setProperty(
        '--shift-dashboard-header-height',
        headerHeight + 'px'
      );

    document.documentElement
      .style.setProperty(
        '--shift-dashboard-viewport-height',
        window.innerHeight + 'px'
      );
  }

  function scheduleLayout() {
    if (layoutTimer) {
      window.clearTimeout(layoutTimer);
    }

    syncMode();
    syncHeights();

    layoutTimer =
      window.setTimeout(
        () => {
          syncMode();
          syncHeights();
          normalizeDateTimes(document.body);
          resizeCharts();
        },
        160
      );
  }

  function resizeCharts() {
    if (!window.Chart) {
      return;
    }

    const instances =
      window.Chart.instances
        ? Object.values(
            window.Chart.instances
          )
        : [];

    instances.forEach(
      (chart) => {
        if (
          chart &&
          typeof chart.resize ===
            'function'
        ) {
          try {
            chart.resize();
          } catch (error) {
            /* no-op */
          }
        }
      }
    );
  }

  function startObserver() {
    if (
      typeof MutationObserver !==
        'function'
    ) {
      return;
    }

    if (observer) {
      observer.disconnect();
    }

    observer =
      new MutationObserver(
        (mutations) => {
          let shouldRun =
            false;

          for (const mutation of mutations) {
            if (
              mutation.type ===
                'childList' ||
              mutation.type ===
                'characterData' ||
              (
                mutation.type ===
                  'attributes' &&
                mutation.attributeName ===
                  'class'
              )
            ) {
              shouldRun = true;
              break;
            }
          }

          if (shouldRun) {
            scheduleLayout();
          }
        }
      );

    observer.observe(
      document.body,
      {
        childList:
          true,
        subtree:
          true,
        characterData:
          true,
        attributes:
          true,
        attributeFilter: [
          'class',
          'hidden'
        ]
      }
    );
  }

  function patchSweetAlert() {
    if (
      swalPatched ||
      !window.Swal ||
      typeof window.Swal.fire !==
        'function'
    ) {
      if (!swalPatched) {
        window.setTimeout(
          patchSweetAlert,
          120
        );
      }

      return;
    }

    swalPatched = true;

    const originalFire =
      window.Swal.fire.bind(
        window.Swal
      );

    window.Swal.fire =
      function round65SwalFire(
        options,
        ...rest
      ) {
        if (
          options &&
          typeof options ===
            'object'
        ) {
          const originalDidOpen =
            options.didOpen;

          options.didOpen =
            function round65DidOpen(
              popup
            ) {
              normalizeDateTimes(
                popup
              );

              if (
                typeof originalDidOpen ===
                  'function'
              ) {
                originalDidOpen(
                  popup
                );
              }
            };
        }

        const result =
          originalFire(
            options,
            ...rest
          );

        window.setTimeout(
          () => {
            const popup =
              document.querySelector(
                '.swal2-popup'
              );

            if (popup) {
              normalizeDateTimes(
                popup
              );
            }
          },
          80
        );

        return result;
      };
  }

  function normalizeDateTimes(root) {
    if (!root) {
      return;
    }

    const walker =
      document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const text =
              node.nodeValue || '';

            if (
              !mightContainDate(text)
            ) {
              return NodeFilter
                .FILTER_REJECT;
            }

            const parent =
              node.parentElement;

            if (
              parent &&
              [
                'SCRIPT',
                'STYLE',
                'TEXTAREA',
                'INPUT'
              ].includes(
                parent.tagName
              )
            ) {
              return NodeFilter
                .FILTER_REJECT;
            }

            return NodeFilter
              .FILTER_ACCEPT;
          }
        }
      );

    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(
        walker.currentNode
      );
    }

    nodes.forEach(
      (node) => {
        const next =
          normalizeDateText(
            node.nodeValue || ''
          );

        if (
          next &&
          next !==
            node.nodeValue
        ) {
          node.nodeValue =
            next;
        }
      }
    );
  }

  function mightContainDate(text) {
    return (
      /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+/.test(text) ||
      /\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/.test(text) ||
      /\b\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}\b/.test(text)
    );
  }

  function normalizeDateText(text) {
    let result =
      String(text || '');

    RAW_DATE_PATTERNS.forEach(
      (pattern) => {
        result =
          result.replace(
            pattern,
            (match) => {
              const formatted =
                formatDateTime(
                  match
                );

              return formatted ||
                match;
            }
          );
      }
    );

    return result;
  }

  function formatDateTime(value) {
    const text =
      String(value || '')
        .trim();

    if (!text) {
      return '';
    }

    if (
      DATE_TIME_FULL.test(text)
    ) {
      return text;
    }

    const nativeDate =
      new Date(text);

    if (
      !Number.isNaN(
        nativeDate.getTime()
      )
    ) {
      return formatBangkok(
        nativeDate
      );
    }

    const isoMatch =
      text.match(
        /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):(\d{2})/
      );

    if (isoMatch) {
      const parsed =
        new Date(
          isoMatch[1] +
          '-' +
          isoMatch[2] +
          '-' +
          isoMatch[3] +
          'T' +
          isoMatch[4] +
          ':' +
          isoMatch[5] +
          ':' +
          isoMatch[6] +
          '+07:00'
        );

      if (
        !Number.isNaN(
          parsed.getTime()
        )
      ) {
        return formatBangkok(
          parsed
        );
      }
    }

    return '';
  }

  function formatBangkok(date) {
    const parts =
      new Intl.DateTimeFormat(
        'en-GB',
        {
          timeZone:
            'Asia/Bangkok',
          day:
            '2-digit',
          month:
            '2-digit',
          year:
            'numeric',
          hour:
            '2-digit',
          minute:
            '2-digit',
          second:
            '2-digit',
          hour12:
            false
        }
      )
        .formatToParts(date)
        .reduce(
          (result, part) => {
            result[part.type] =
              part.value;

            return result;
          },
          {}
        );

    return (
      parts.day + '/' +
      parts.month + '/' +
      parts.year + ' ' +
      parts.hour + ':' +
      parts.minute + ':' +
      parts.second
    );
  }

  if (
    document.readyState ===
      'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      init
    );
  } else {
    init();
  }
})(window, document);


/* ============================================================
 * SOURCE 06: dashboard-executive-readability(5).js
 * ============================================================ */
/************************************************************
 * dashboard-executive-readability.js
 * ROUND 66 — Executive Readability Fix
 ************************************************************/

(function (window, document) {
  'use strict';

  const DATE_FULL =
    /^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/;

  let timer = 0;
  let observer = null;

  function init() {
    document.body.classList.add(
      'r66-executive-readability'
    );

    moveGlobalInfoToContext();
    prepareDatePickerDisplay();
    shortenDailyHistoryHeaders();
    normalizeVisibleDates(document.body);
    bindEvents();
    startObserver();
    scheduleRefresh();
  }

  function bindEvents() {
    document.addEventListener(
      'click',
      (event) => {
        if (
          event.target.closest(
            '[data-dashboard-view]'
          )
        ) {
          window.setTimeout(
            scheduleRefresh,
            80
          );
        }
      },
      true
    );

    const input =
      document.getElementById(
        'dashboardShiftDate'
      );

    if (input) {
      input.addEventListener(
        'change',
        () => {
          updateDateDisplay();
          window.setTimeout(
            scheduleRefresh,
            120
          );
        }
      );
    }

    document.addEventListener(
      'fullscreenchange',
      scheduleRefresh
    );

    window.addEventListener(
      'resize',
      scheduleRefresh,
      {
        passive:
          true
      }
    );
  }

  function scheduleRefresh() {
    if (timer) {
      window.clearTimeout(timer);
    }

    timer =
      window.setTimeout(
        () => {
          moveGlobalInfoToContext();
          prepareDatePickerDisplay();
          updateDateDisplay();
          shortenDailyHistoryHeaders();
          normalizeVisibleDates(document.body);
          resizeCharts();
        },
        140
      );
  }

  function moveGlobalInfoToContext() {
    const liveHeading =
      document.querySelector(
        '#dashboardSituation .panel-heading h2'
      );

    if (
      liveHeading &&
      !liveHeading.querySelector(
        '.r66-context-info'
      )
    ) {
      const button =
        document.createElement(
          'button'
        );

      button.type =
        'button';
      button.className =
        'r66-context-info';
      button.dataset.dashboardInfo =
        'overview';
      button.setAttribute(
        'aria-label',
        'อธิบายสถานการณ์สด'
      );
      button.textContent =
        'i';

      liveHeading.appendChild(
        button
      );
    }
  }

  function prepareDatePickerDisplay() {
    const input =
      document.getElementById(
        'dashboardShiftDate'
      );

    if (!input) {
      return;
    }

    input.classList.add(
      'r66-native-date'
    );

    const label =
      input.closest('label');

    if (
      label &&
      !label.querySelector(
        '.r66-date-display'
      )
    ) {
      const display =
        document.createElement(
          'span'
        );

      display.className =
        'r66-date-display';
      display.id =
        'dashboardShiftDateDisplay';

      label.appendChild(
        display
      );

      label.addEventListener(
        'click',
        () => {
          if (
            typeof input.showPicker ===
              'function'
          ) {
            try {
              input.showPicker();
            } catch (error) {
              input.focus();
            }
          } else {
            input.focus();
          }
        }
      );
    }

    updateDateDisplay();
  }

  function updateDateDisplay() {
    const input =
      document.getElementById(
        'dashboardShiftDate'
      );

    const display =
      document.getElementById(
        'dashboardShiftDateDisplay'
      );

    if (
      !input ||
      !display
    ) {
      return;
    }

    display.textContent =
      dateInputToDisplay(
        input.value
      );
  }

  function dateInputToDisplay(value) {
    const text =
      String(value || '')
        .trim();

    const match =
      text.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (!match) {
      return '--/--/---- 00:00:00';
    }

    return (
      match[3] + '/' +
      match[2] + '/' +
      match[1] +
      ' 00:00:00'
    );
  }

  function shortenDailyHistoryHeaders() {
    const table =
      document.querySelector(
        '.daily-history-table'
      );

    if (!table) {
      return;
    }

    const labels = [
      'วัน',
      'เข้า',
      'ออก',
      'ปลาย',
      'เกิน',
      'กลาง',
      'เฉลี่ย',
      'สถานะ'
    ];

    table
      .querySelectorAll('thead th')
      .forEach(
        (cell, index) => {
          if (labels[index]) {
            cell.textContent =
              labels[index];
          }
        }
      );

    table
      .querySelectorAll(
        'tbody tr'
      )
      .forEach(
        (row) => {
          const first =
            row.children[0];

          if (first) {
            first.textContent =
              normalizeDateOnlyToFull(
                first.textContent
              );
          }
        }
      );
  }

  function normalizeDateOnlyToFull(value) {
    const text =
      String(value || '')
        .trim();

    if (DATE_FULL.test(text)) {
      return text;
    }

    const dmy =
      text.match(
        /^(\d{2})\/(\d{2})\/(\d{4})$/
      );

    if (dmy) {
      return (
        dmy[1] + '/' +
        dmy[2] + '/' +
        dmy[3] +
        ' 00:00:00'
      );
    }

    const iso =
      text.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
      );

    if (iso) {
      return (
        iso[3] + '/' +
        iso[2] + '/' +
        iso[1] +
        ' 00:00:00'
      );
    }

    return text;
  }

  function startObserver() {
    if (
      typeof MutationObserver !==
        'function'
    ) {
      return;
    }

    if (observer) {
      observer.disconnect();
    }

    observer =
      new MutationObserver(
        () => {
          scheduleRefresh();
        }
      );

    observer.observe(
      document.body,
      {
        childList:
          true,
        subtree:
          true,
        characterData:
          true,
        attributes:
          true,
        attributeFilter: [
          'class',
          'hidden',
          'value'
        ]
      }
    );
  }

  function normalizeVisibleDates(root) {
    if (!root) {
      return;
    }

    const walker =
      document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            const text =
              node.nodeValue || '';

            if (
              !hasDateCandidate(text)
            ) {
              return NodeFilter
                .FILTER_REJECT;
            }

            const parent =
              node.parentElement;

            if (
              parent &&
              [
                'SCRIPT',
                'STYLE',
                'TEXTAREA',
                'INPUT'
              ].includes(
                parent.tagName
              )
            ) {
              return NodeFilter
                .FILTER_REJECT;
            }

            return NodeFilter
              .FILTER_ACCEPT;
          }
        }
      );

    const nodes = [];

    while (walker.nextNode()) {
      nodes.push(
        walker.currentNode
      );
    }

    nodes.forEach(
      (node) => {
        const next =
          normalizeDateText(
            node.nodeValue
          );

        if (
          next &&
          next !== node.nodeValue
        ) {
          node.nodeValue =
            next;
        }
      }
    );
  }

  function hasDateCandidate(text) {
    return (
      /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+/.test(text) ||
      /\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}/.test(text) ||
      /\b\d{4}-\d{2}-\d{2}\b/.test(text) ||
      /\b\d{2}\/\d{2}\/\d{4}\b/.test(text)
    );
  }

  function normalizeDateText(text) {
    let result =
      String(text || '');

    result =
      result.replace(
        /\b(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2}\s+\d{4}\s+\d{2}:\d{2}:\d{2}\s+GMT[+-]\d{4}(?:\s*\([^)]+\))?/gi,
        (match) =>
          formatDateTime(match) ||
          match
      );

    result =
      result.replace(
        /\b\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?\b/g,
        (match) =>
          formatDateTime(match) ||
          match
      );

    result =
      result.replace(
        /\b\d{4}-\d{2}-\d{2}\b/g,
        (match) =>
          normalizeDateOnlyToFull(match)
      );

    result =
      result.replace(
        /\b\d{2}\/\d{2}\/\d{4}(?!\s+\d{2}:\d{2}:\d{2})\b/g,
        (match) =>
          normalizeDateOnlyToFull(match)
      );

    return result;
  }

  function formatDateTime(value) {
    const text =
      String(value || '')
        .trim();

    if (!text) {
      return '';
    }

    if (DATE_FULL.test(text)) {
      return text;
    }

    const nativeDate =
      new Date(text);

    if (
      !Number.isNaN(
        nativeDate.getTime()
      )
    ) {
      return formatBangkok(
        nativeDate
      );
    }

    return '';
  }

  function formatBangkok(date) {
    const parts =
      new Intl.DateTimeFormat(
        'en-GB',
        {
          timeZone:
            'Asia/Bangkok',
          day:
            '2-digit',
          month:
            '2-digit',
          year:
            'numeric',
          hour:
            '2-digit',
          minute:
            '2-digit',
          second:
            '2-digit',
          hour12:
            false
        }
      )
        .formatToParts(date)
        .reduce(
          (result, part) => {
            result[part.type] =
              part.value;

            return result;
          },
          {}
        );

    return (
      parts.day + '/' +
      parts.month + '/' +
      parts.year + ' ' +
      parts.hour + ':' +
      parts.minute + ':' +
      parts.second
    );
  }

  function resizeCharts() {
    if (!window.Chart) {
      return;
    }

    const charts =
      window.Chart.instances
        ? Object.values(
            window.Chart.instances
          )
        : [];

    charts.forEach(
      (chart) => {
        if (
          chart &&
          typeof chart.resize ===
            'function'
        ) {
          try {
            chart.resize();
          } catch (error) {
            /* no-op */
          }
        }
      }
    );
  }

  if (
    document.readyState ===
      'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      init
    );
  } else {
    init();
  }
})(window, document);


/* ============================================================
 * SOURCE 07: dashboard-mobile-hotfix(5).js
 * ============================================================ */
/************************************************************
 * dashboard-mobile-hotfix.js
 * ROUND 78 — Mobile View + Date + Loading Stabilizer
 * โหลดเป็น JS ตัวสุดท้ายของ dashboard/index.html
 ************************************************************/
(function (window, document) {
  'use strict';

  const BODY_CLASS = 'r78-mobile-stable';
  const LEGACY_BODY_CLASS = 'r77-mobile-stable';
  const DATE_INPUT_ID = 'dashboardShiftDate';
  const DATE_DISPLAY_ID = 'dashboardShiftDateDisplay';
  const MOBILE_QUERY = '(max-width: 920px)';

  let observer = null;
  let timer = 0;
  let lastKickAt = 0;
  let kickCount = 0;

  document.addEventListener('DOMContentLoaded', initialize);
  window.addEventListener('load', () => scheduleStabilize(120));

  function initialize() {
    if (!document.body) {
      return;
    }

    document.body.classList.add(BODY_CLASS, LEGACY_BODY_CLASS);
    bindEvents();
    startObserver();
    stabilizeNow({forceKick: true});

    [250, 700, 1400, 2400].forEach(
      (delay) => window.setTimeout(
        () => stabilizeNow({forceKick: true}),
        delay
      )
    );
  }

  function bindEvents() {
    document.addEventListener(
      'click',
      (event) => {
        const viewButton = event.target.closest('[data-dashboard-view]');

        if (viewButton) {
          const view = normalizeView(viewButton.dataset.dashboardView);

          window.setTimeout(
            () => {
              setBodyView(view);
              stabilizeNow({forceKick: view !== 'LIVE'});
            },
            0
          );

          window.setTimeout(
            () => stabilizeNow({forceKick: view !== 'LIVE'}),
            180
          );

          window.setTimeout(
            () => stabilizeNow({forceKick: view !== 'LIVE'}),
            650
          );
        }

        if (event.target.closest('#dashboardShiftToday')) {
          setDateInputValue(todayIsoBangkok(), true);
          window.setTimeout(
            () => stabilizeNow({forceKick: true}),
            80
          );
        }
      },
      true
    );

    document.addEventListener(
      'change',
      (event) => {
        if (event.target && event.target.id === DATE_INPUT_ID) {
          ensureDateInputValue(false);
          updateDateDisplay();
          scheduleStabilize(120);
        }
      },
      true
    );

    window.addEventListener(
      'resize',
      () => scheduleStabilize(120),
      {passive: true}
    );

    window.addEventListener(
      'orientationchange',
      () => scheduleStabilize(250),
      {passive: true}
    );

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState === 'visible') {
          scheduleStabilize(160);
        }
      }
    );
  }

  function startObserver() {
    if (typeof MutationObserver !== 'function') {
      return;
    }

    if (observer) {
      observer.disconnect();
    }

    observer = new MutationObserver(() => scheduleStabilize(120));

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['hidden', 'class']
      }
    );
  }

  function scheduleStabilize(delay) {
    if (timer) {
      window.clearTimeout(timer);
    }

    timer = window.setTimeout(
      () => {
        timer = 0;
        stabilizeNow({forceKick: false});
      },
      Number(delay) || 80
    );
  }

  function stabilizeNow(options) {
    if (!document.body) {
      return;
    }

    const config = options && typeof options === 'object' ? options : {};
    const view = getActiveView();

    document.body.classList.add(BODY_CLASS, LEGACY_BODY_CLASS);
    setBodyView(view);
    moveToolbarBeforeWorkspace();
    forceViewVisibility(view);
    ensureDateDisplayElement();

    if (view !== 'LIVE') {
      ensureDateInputValue(config.forceKick === true);
      updateDateDisplay();
      kickShiftDailyIfNeeded(config.forceKick === true);
    } else {
      updateDateDisplay();
    }

    clearMobileGhostStyles();
  }

  function getActiveView() {
    const active = document.querySelector('.dashboard-view-tabs [data-dashboard-view].is-active');

    if (active) {
      return normalizeView(active.dataset.dashboardView);
    }

    const bodyView = normalizeView(document.body.dataset.dashboardView);

    if (bodyView) {
      return bodyView;
    }

    return 'LIVE';
  }

  function normalizeView(value) {
    const text = String(value || '').trim().toUpperCase();

    return ['LIVE', 'SHIFT', 'DAILY'].includes(text)
      ? text
      : 'LIVE';
  }

  function setBodyView(view) {
    const safeView = normalizeView(view);

    document.body.dataset.dashboardView = safeView;
    document.body.classList.toggle('is-live-dashboard', safeView === 'LIVE');
    document.body.classList.toggle('is-shift-dashboard', safeView === 'SHIFT');
    document.body.classList.toggle('is-daily-dashboard', safeView === 'DAILY');
  }

  function forceViewVisibility(view) {
    const safeView = normalizeView(view);
    const workspace = document.getElementById('dashboardShiftWorkspace');
    const dateControls = document.getElementById('dashboardShiftDateControls');
    const liveSections = [
      '.command-row',
      '.operations-row',
      '#mobileAnalyticsTabs',
      '.analytics-row',
      '.mobile-system-title',
      '.system-summary'
    ];

    if (dateControls) {
      if (safeView === 'LIVE') {
        dateControls.hidden = true;
        dateControls.setAttribute('hidden', '');
      } else {
        dateControls.hidden = false;
        dateControls.removeAttribute('hidden');
      }
    }

    if (workspace) {
      if (safeView === 'LIVE') {
        workspace.hidden = true;
        workspace.setAttribute('hidden', '');
      } else {
        workspace.hidden = false;
        workspace.removeAttribute('hidden');
      }
    }

    liveSections.forEach(
      (selector) => {
        document.querySelectorAll(selector).forEach(
          (element) => {
            if (safeView === 'LIVE') {
              element.hidden = false;
              element.removeAttribute('hidden');
            } else {
              element.hidden = true;
              element.setAttribute('hidden', '');
            }
          }
        );
      }
    );
  }

  function moveToolbarBeforeWorkspace() {
    const main = document.querySelector('.control-main');
    const toolbar = document.getElementById('dashboardViewToolbar');
    const workspace = document.getElementById('dashboardShiftWorkspace');

    if (!main || !toolbar || !workspace) {
      return;
    }

    if (toolbar.parentElement !== main || toolbar.nextElementSibling !== workspace) {
      main.insertBefore(toolbar, workspace);
    }
  }

  function ensureDateInputValue(fireChange) {
    const input = document.getElementById(DATE_INPUT_ID);

    if (!input) {
      return '';
    }

    const current = normalizeIsoDate(input.value);

    if (current) {
      input.dataset.lastGoodDate = current;
      return current;
    }

    const fallback =
      normalizeIsoDate(input.dataset.lastGoodDate) ||
      todayIsoBangkok();

    setDateInputValue(fallback, fireChange === true);
    return fallback;
  }

  function setDateInputValue(isoDate, fireChange) {
    const input = document.getElementById(DATE_INPUT_ID);
    const value = normalizeIsoDate(isoDate) || todayIsoBangkok();

    if (!input) {
      return;
    }

    const changed = input.value !== value;

    input.value = value;
    input.setAttribute('value', value);
    input.dataset.lastGoodDate = value;

    updateDateDisplay();

    if (fireChange === true) {
      dispatchDateEvents(input, changed);
    }
  }

  function dispatchDateEvents(input, changed) {
    if (!input) {
      return;
    }

    input.dispatchEvent(new Event('input', {bubbles: true}));
    input.dispatchEvent(new Event('change', {bubbles: true}));

    if (!changed) {
      input.dispatchEvent(new CustomEvent('alertvendor:date-refresh', {bubbles: true}));
    }
  }

  function ensureDateDisplayElement() {
    const input = document.getElementById(DATE_INPUT_ID);

    if (!input) {
      return null;
    }

    input.classList.add('r66-native-date');

    const label = input.closest('label');

    if (!label) {
      return null;
    }

    let display = document.getElementById(DATE_DISPLAY_ID);

    if (!display) {
      display = document.createElement('span');
      display.id = DATE_DISPLAY_ID;
      display.className = 'r78-date-display r66-date-display';
      label.appendChild(display);
    }

    return display;
  }

  function updateDateDisplay() {
    const input = document.getElementById(DATE_INPUT_ID);
    const display = ensureDateDisplayElement();

    if (!input || !display) {
      return;
    }

    const value =
      normalizeIsoDate(input.value) ||
      normalizeIsoDate(input.dataset.lastGoodDate) ||
      todayIsoBangkok();

    display.textContent = isoToDisplayDateTime(value);
  }

  function kickShiftDailyIfNeeded(force) {
    if (!isMobile()) {
      return;
    }

    const view = getActiveView();

    if (view === 'LIVE') {
      kickCount = 0;
      return;
    }

    const input = document.getElementById(DATE_INPUT_ID);
    const workspace = document.getElementById('dashboardShiftWorkspace');

    if (!input || !workspace) {
      return;
    }

    const hasRealContent = Boolean(
      workspace.querySelector(
        '.shift-executive-header, .shift-executive-kpis, .shift-comparison-grid, .daily-summary-grid, .daily-dashboard-analysis, .shift-dashboard-analysis'
      )
    );

    const hasLoading = Boolean(
      workspace.querySelector('.shift-dashboard-loading')
    );

    if (hasRealContent && !hasLoading) {
      kickCount = 0;
      return;
    }

    const now = Date.now();
    const canKick = force === true || (now - lastKickAt > 1400 && kickCount < 6);

    if (!canKick) {
      return;
    }

    lastKickAt = now;
    kickCount += 1;

    const value = ensureDateInputValue(false);
    input.value = value;
    input.setAttribute('value', value);
    updateDateDisplay();

    window.setTimeout(
      () => dispatchDateEvents(input, false),
      30
    );
  }

  function clearMobileGhostStyles() {
    const selectors = [
      '#dashboardShiftWorkspace',
      '#dashboardViewToolbar',
      '#dashboardShiftDateControls',
      '.shift-dashboard-loading',
      '.shift-executive-header',
      '.shift-executive-kpis',
      '.shift-comparison-grid',
      '.shift-dashboard-analysis',
      '.shift-dashboard-lower',
      '.daily-summary-grid',
      '.daily-dashboard-analysis'
    ];

    selectors.forEach(
      (selector) => {
        document.querySelectorAll(selector).forEach(
          (element) => {
            element.style.opacity = '';
            element.style.filter = '';
            element.style.transform = '';
          }
        );
      }
    );
  }

  function normalizeIsoDate(value) {
    const text = String(value || '').trim();

    let match = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (match) {
      return match[1] + '-' + match[2] + '-' + match[3];
    }

    match = text.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+\d{2}:\d{2}:\d{2})?$/);

    if (match) {
      return match[3] + '-' + match[2] + '-' + match[1];
    }

    return '';
  }

  function isoToDisplayDateTime(value) {
    const iso = normalizeIsoDate(value) || todayIsoBangkok();
    const parts = iso.split('-');

    return parts[2] + '/' + parts[1] + '/' + parts[0] + ' 00:00:00';
  }

  function todayIsoBangkok() {
    const parts = new Intl.DateTimeFormat(
      'en-GB',
      {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }
    )
      .formatToParts(new Date())
      .reduce(
        (result, part) => {
          result[part.type] = part.value;
          return result;
        },
        {}
      );

    return parts.year + '-' + parts.month + '-' + parts.day;
  }

  function isMobile() {
    return window.matchMedia(MOBILE_QUERY).matches;
  }
})(window, document);
