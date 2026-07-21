/* ADMIN_SAVED_STATE_HOTFIX4_BUILD: 2026.07.22 */
/* ADMIN_PREVIEW_SCOPE_HOTFIX2_BUILD: 2026.07.22 */
/* PROFILE_AWARE_TIMING_R1_BUILD: 2026.07.21 */
/* SMARTALERT BASELINE 2 FINAL HOTFIX 5 — ADMIN WORKFLOW PROFILE
 * Build: 2026.07.21-baseline2-final-hotfix5-optional-inbound-v1
 * Admin controls optional submit/return Inbound steps with versioned effective settings.
 */

/* SMARTALERT MODULE VALIDATION INLINE-ONLY PATCH
 * Build: 2026.07.20-module-validation-inline-only-r1
 * Validation errors stay inside Module Editor; no duplicate SweetAlert.
 */

/*
 * AlertVendor Consolidated Bundle
 * Output: github-pages/admin.bundle.js
 * Build: 20260720-structural-editor-r1-clean-editor-rebuild-r2
 * Generated: 2026-07-20 00:02:45
 * Mode: concatenate-only / no business logic rewrite
 */


/* ============================================================
 * SOURCE 01: config(11).js
 * ============================================================ */
/**
 * config.js
 * การตั้งค่าฝั่ง Frontend
 *
 * ห้ามใส่ Secret ทุกชนิดในไฟล์นี้
 * R3R4 HOTFIX 02: Restore APP_CONFIG + canonical Inbound bootstrap
 */
(function (window) {
  'use strict';

  const API_BASE =
    'https://smartalert.somchaibutphon.workers.dev';

  const CONFIG = Object.freeze({
    APP_NAME:
      'ระบบติดตามสถานะรถและตู้สินค้า',

    API_BASE:
      String(API_BASE || '').replace(/\/+$/, ''),

    PUBLIC_BASE_URL:
      'https://smartdcs2026.github.io/smartalert/',

    LOGIN_URL:
      'https://smartdcs2026.github.io/smartalert/login.html',

    DASHBOARD_URL:
      'https://smartdcs2026.github.io/smartalert/index.html',

    INBOUND_URL:
      'https://smartdcs2026.github.io/smartalert/inbound.html',

    /*
     * หน้า Inbound ต้องใช้แหล่งข้อมูลเดียวกันทั้ง ADMIN และ INBOUND
     * โดยยึดโมดูลหน้างานจริง: Vendor ทั่วไป
     */
    INBOUND_FORCE_CANONICAL_MODULE:
      true,

    /*
     * รหัส Module หลักที่หน้า Inbound ใช้งาน
     * ใช้เป็น Public Routing ID เท่านั้น ไม่ใช่ Secret
     */
    INBOUND_DEFAULT_MODULE_ID:
      'vendors',

    INBOUND_CANONICAL_MODULE_NAME:
      'สถานะรถ Vendor ทั่วไป',

    INBOUND_CANONICAL_MODULE_KEYWORDS:
      [
        'VENDOR',
        'ทั่วไป'
      ],

    /*
     * ROUND 03:
     * Frontend ไม่มีสิทธิ์กำหนดเกณฑ์ SLA ทางธุรกิจ
     * ทุกหน้าต้องใช้ effectiveSlaRules / rulesRevision จาก Server Response เท่านั้น
     */
    INBOUND_SLA_SOURCE:
      'SERVER_ONLY',

    /*
     * Phase 2A: Durable Pending Queue สำหรับหน้า Inbound
     * เก็บเฉพาะข้อมูลคำสั่งงาน ไม่เก็บ Token หรือ Secret
     */
    INBOUND_QUEUE_ENABLED:
      true,

    INBOUND_QUEUE_MAX_ITEMS:
      500,

    INBOUND_QUEUE_MAX_ATTEMPTS:
      12,

    INBOUND_QUEUE_RETRY_BASE_MS:
      3000,

    INBOUND_QUEUE_RETRY_MAX_MS:
      300000,

    INBOUND_QUEUE_AUTO_FLUSH_MS:
      15000,

    INBOUND_QUEUE_COMMITTED_RETENTION_HOURS:
      24,

    INBOUND_QUEUE_FAILED_RETENTION_DAYS:
      7,

    TOKEN_STORAGE_KEY:
      'alertvendor_access_token_v2',

    SESSION_POLICY:
      'WINDOW_ISOLATED',

    API_TIMEOUT_MS:
      60000,

    AUTH_TIMEOUT_MS:
      45000,

    TIMEZONE:
      'Asia/Bangkok',

    DATE_TIME_FORMAT:
      'dd/MM/yyyy HH:mm:ss'
  });

  window.APP_CONFIG = CONFIG;
})(window);


/* ============================================================
 * SOURCE 02: api(11).js
 * ============================================================ */
/**
 * api.js
 * ROUND 05 — Foreground Throughput + Performance Telemetry
 * ตัวกลางเรียก Cloudflare Worker API
 *
 * Session:
 * - เก็บ Signed Session Token ใน sessionStorage
 * - ส่งผ่าน Authorization: Bearer <token>
 * - ไม่พึ่ง Third-party Cookie ระหว่าง github.io กับ workers.dev
 * - Production R18: Gate Out stable request + commit verification
 */
(function (window) {
  'use strict';

  const RECEIVING_COMMAND_API_BUILD = '2026.07.20-round11-revision2-receiving-command-api-v1';

  const CONFIG =
    window.APP_CONFIG || {};

  /*
   * Production fail-safe:
   * API URL ไม่ใช่ Secret และใช้เฉพาะเมื่อ config.js โหลดไม่สำเร็จ
   * เพื่อไม่ให้หน้า Login ล้มทั้งระบบด้วย API_BASE_MISSING
   */
  const PRODUCTION_API_BASE =
    'https://smartalert.somchaibutphon.workers.dev';

  const configuredApiBase =
    String(CONFIG.API_BASE || '').trim();

  const canUseProductionFallback =
    window.location &&
    String(window.location.hostname || '').toLowerCase().endsWith('github.io');

  const API_BASE =
    String(
      configuredApiBase ||
      (canUseProductionFallback ? PRODUCTION_API_BASE : '')
    ).replace(/\/+$/, '');

  const API_BASE_SOURCE =
    configuredApiBase
      ? 'APP_CONFIG'
      : (
          canUseProductionFallback
            ? 'PRODUCTION_FAILSAFE'
            : 'MISSING'
        );

  const TOKEN_STORAGE_KEY =
    String(
      CONFIG.TOKEN_STORAGE_KEY ||
      'alertvendor_access_token_v2'
    ).trim() ||
    'alertvendor_access_token_v2';

  const LEGACY_TOKEN_STORAGE_KEYS =
    Object.freeze(
      [
        'alertvendor_access_token',
        'alertvendor_access_token_v1',
        'alertvendor_token',
        'alertvendorAccessToken',
        'access_token',
        'accessToken',
        'token',
        'sessionToken',
        'authToken',
        'vehicle_status_access_token',
        'vehicle_access_token'
      ].filter(
        (key) => key !== TOKEN_STORAGE_KEY
      )
    );

  const LEGACY_ROUTE_USER_KEYS =
    Object.freeze([
      'alertvendor_user',
      'alertvendor_current_user',
      'currentUser',
      'auth_user',
      'user',
      'vehicle_status_user',
      'alertvendor_session'
    ]);

  const LEGACY_ROUTE_FLAG_KEYS =
    Object.freeze([
      'vcw_inbound_only'
    ]);

  const inFlightGetRequests =
    new Map();

  const API_PERFORMANCE_EVENT =
    'alertvendor:api-performance';

  const API_PERFORMANCE_STORAGE_KEY =
    'alertvendor:api-performance:v1';

  const API_PERFORMANCE_MAX_ITEMS = 60;

  const foregroundWriteCoordinator =
    createForegroundWriteCoordinator();

  window.AlertVendorForegroundWrite =
    foregroundWriteCoordinator;

  const RETRYABLE_ERROR_CODES =
    new Set([
      'NETWORK_ERROR',
      'REQUEST_TIMEOUT',
      'GAS_TIMEOUT',
      'GAS_CONNECTION_FAILED',
      'GAS_HTTP_ERROR'
    ]);

  if (!API_BASE) {
    console.error('ไม่พบ APP_CONFIG.API_BASE และไม่สามารถใช้ Production fail-safe ได้');
  } else if (API_BASE_SOURCE === 'PRODUCTION_FAILSAFE') {
    console.warn('config.js ไม่พร้อม ระบบใช้ Production API fail-safe ชั่วคราว');
  }

  class VehicleAPIError extends Error {
    constructor(
      message,
      code,
      status,
      details,
      requestId
    ) {
      super(
        message ||
        'เกิดข้อผิดพลาดในการเรียก API'
      );

      this.name =
        'VehicleAPIError';

      this.code =
        code ||
        'API_ERROR';

      this.status =
        Number(status) || 0;

      this.details =
        details || null;

      this.requestId =
        requestId || '';

      this.retryable = Boolean(
        details && details.retryable === true
      );

      this.committed =
        details && Object.prototype.hasOwnProperty.call(details, 'committed')
          ? details.committed
          : null;

      this.verificationRequired = Boolean(
        details && details.verificationRequired === true
      );

      this.clientPerformance = null;
    }
  }

  function createForegroundWriteCoordinator() {
    const activeTokens = new Map();
    let sequence = 0;

    function snapshot() {
      return {
        active: activeTokens.size > 0,
        count: activeTokens.size,
        reasons: Array.from(activeTokens.values()).map((item) => item.reason),
        updatedAt: Date.now()
      };
    }

    function emit() {
      const detail = snapshot();
      try {
        window.dispatchEvent(
          new CustomEvent('alertvendor:foreground-write-change', { detail })
        );
      } catch (error) {
        /* Telemetry ห้ามกระทบงานหลัก */
      }
      return detail;
    }

    return {
      begin(reason, meta) {
        sequence += 1;
        const token = 'FGW-' + Date.now() + '-' + sequence;
        activeTokens.set(token, {
          reason: String(reason || 'WRITE'),
          meta: meta && typeof meta === 'object' ? { ...meta } : {},
          startedAt: Date.now()
        });
        emit();
        return token;
      },

      end(token) {
        if (token) activeTokens.delete(token);
        return emit();
      },

      isActive() {
        return activeTokens.size > 0;
      },

      snapshot
    };
  }

  function performanceNow() {
    return window.performance && typeof window.performance.now === 'function'
      ? window.performance.now()
      : Date.now();
  }

  function recordApiPerformance(item) {
    const safeItem = item && typeof item === 'object' ? item : {};

    try {
      const existing = JSON.parse(
        window.sessionStorage.getItem(API_PERFORMANCE_STORAGE_KEY) || '[]'
      );
      const list = Array.isArray(existing) ? existing : [];
      list.push(safeItem);
      window.sessionStorage.setItem(
        API_PERFORMANCE_STORAGE_KEY,
        JSON.stringify(list.slice(-API_PERFORMANCE_MAX_ITEMS))
      );
    } catch (error) {
      /* Telemetry ห้ามกระทบงานหลัก */
    }

    try {
      window.dispatchEvent(
        new CustomEvent(API_PERFORMANCE_EVENT, { detail: safeItem })
      );
    } catch (error) {
      /* Telemetry ห้ามกระทบงานหลัก */
    }
  }

  function attachClientPerformance(payload, meta) {
    const details = meta && typeof meta === 'object' ? meta : {};
    const clientPerformance = {
      clientTotalMs: Math.max(0, Math.round(Number(details.clientTotalMs) || 0)),
      requestAttempt: Math.max(1, Number(details.requestAttempt) || 1),
      verificationCount: Math.max(0, Number(details.verificationCount) || 0),
      method: String(details.method || ''),
      path: String(details.path || ''),
      requestId: String(details.requestId || ''),
      ok: details.ok === true,
      status: Number(details.status) || 0,
      finishedAtEpochMs: Date.now()
    };

    if (payload && payload.data && typeof payload.data === 'object') {
      payload.data.clientPerformance = Object.assign(
        {},
        payload.data.clientPerformance || {},
        clientPerformance
      );
    }

    recordApiPerformance(Object.assign({}, clientPerformance, {
      workerPerformance:
        payload && payload.data && payload.data.workerPerformance || null,
      appsScriptPerformance:
        payload && payload.data && payload.data.performance || null
    }));

    return payload;
  }

  /************************************************************
   * Token Storage
   ************************************************************/

  function readStorageToken(
    storage,
    key
  ) {
    try {
      return String(
        storage.getItem(key) || ''
      ).trim();
    } catch (error) {
      return '';
    }
  }

  function removeStorageKey(
    storage,
    key
  ) {
    try {
      storage.removeItem(key);
    } catch (error) {
      /* Storage อาจถูก Browser Policy ปิดไว้ */
    }
  }

  function purgeLegacyRouteArtifacts(
    removeSessionLegacyTokens
  ) {
    const storages = [
      window.sessionStorage,
      window.localStorage
    ];

    storages.forEach((storage) => {
      LEGACY_ROUTE_USER_KEYS.forEach(
        (key) => removeStorageKey(storage, key)
      );

      LEGACY_ROUTE_FLAG_KEYS.forEach(
        (key) => removeStorageKey(storage, key)
      );
    });

    /*
     * Token รุ่นเก่าใน localStorage เป็นสาเหตุสำคัญที่ Route Guard รุ่นเก่า
     * อ่านบัญชี INBOUND ค้างจากรอบก่อน แล้วพา USER/ADMIN ไป inbound.html
     * ระบบปัจจุบันใช้เฉพาะ TOKEN_STORAGE_KEY ใน sessionStorage เท่านั้น
     */
    LEGACY_TOKEN_STORAGE_KEYS.forEach((key) => {
      removeStorageKey(window.localStorage, key);

      if (removeSessionLegacyTokens === true) {
        removeStorageKey(window.sessionStorage, key);
      }
    });
  }

  /* ล้างข้อมูล Role/Token รุ่นเก่าที่ไม่ใช่ Session ปัจจุบันทันที */
  purgeLegacyRouteArtifacts(false);

  function getAccessToken() {
    let token =
      readStorageToken(
        window.sessionStorage,
        TOKEN_STORAGE_KEY
      );

    if (token) {
      purgeLegacyRouteArtifacts(true);
      return token;
    }

    /*
     * ย้าย Session รุ่นเก่าเข้าสู่ key ปัจจุบันแบบครั้งเดียว
     * ไม่อ่านจาก localStorage เพื่อคงนโยบาย WINDOW_ISOLATED
     */
    for (const legacyKey of LEGACY_TOKEN_STORAGE_KEYS) {
      token =
        readStorageToken(
          window.sessionStorage,
          legacyKey
        );

      if (!token) {
        continue;
      }

      try {
        window.sessionStorage.setItem(
          TOKEN_STORAGE_KEY,
          token
        );
      } catch (error) {
        /* ใช้ token ที่อ่านได้ต่อ แม้ migrate ไม่สำเร็จ */
      }

      purgeLegacyRouteArtifacts(true);

      return token;
    }

    return '';
  }

  function setAccessToken(
    token
  ) {
    const cleanToken =
      String(
        token || ''
      ).trim();

    if (!cleanToken) {
      clearAccessToken();
      return;
    }

    try {
      window.sessionStorage
        .setItem(
          TOKEN_STORAGE_KEY,
          cleanToken
        );

      LEGACY_TOKEN_STORAGE_KEYS.forEach(
        (key) => removeStorageKey(
          window.sessionStorage,
          key
        )
      );

    } catch (error) {
      throw new VehicleAPIError(
        'เบราว์เซอร์ไม่อนุญาตให้บันทึก Session',
        'SESSION_STORAGE_FAILED',
        0,
        {
          originalMessage:
            error &&
            error.message
              ? error.message
              : String(error),
          retryable: false,
          committed: false,
          verificationRequired: false
        }
      );
    }
  }

  function clearAccessToken() {
    const keys =
      [
        TOKEN_STORAGE_KEY,
        ...LEGACY_TOKEN_STORAGE_KEYS
      ];

    keys.forEach((key) => {
      removeStorageKey(
        window.sessionStorage,
        key
      );

      /* ล้างของเก่าที่อาจเคยถูกเก็บข้ามหน้าต่าง */
      removeStorageKey(
        window.localStorage,
        key
      );
    });

    inFlightGetRequests.clear();
  }

  function updateTokenFromData(
    data
  ) {
    const token =
      data &&
      data.accessToken
        ? String(
            data.accessToken
          ).trim()
        : '';

    if (token) {
      setAccessToken(
        token
      );
    }

    return token;
  }

  /************************************************************
   * Request helpers
   ************************************************************/

  function createRequestId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID ===
        'function'
    ) {
      return window.crypto.randomUUID();
    }

    return (
      'req-' +
      Date.now().toString(36) +
      '-' +
      Math.random()
        .toString(36)
        .slice(2, 12)
    );
  }

  function buildUrl(
    path,
    query
  ) {
    const cleanPath =
      String(
        path || ''
      ).startsWith('/')
        ? String(path)
        : '/' + String(path || '');

    const url =
      new URL(
        API_BASE + cleanPath
      );

    if (
      query &&
      typeof query === 'object'
    ) {
      Object.entries(query)
        .forEach(
          ([key, value]) => {
            if (
              value === undefined ||
              value === null ||
              value === ''
            ) {
              return;
            }

            url.searchParams.set(
              key,
              String(value)
            );
          }
        );
    }

    return url.toString();
  }

  async function parseResponse(
    response
  ) {
    const text =
      await response.text();

    if (!text.trim()) {
      throw new VehicleAPIError(
        'API ไม่ได้ส่งข้อมูลกลับมา',
        'EMPTY_RESPONSE',
        response.status,
        null,
        response.headers.get(
          'X-Request-Id'
        ) || ''
      );
    }

    let payload;

    try {
      payload =
        JSON.parse(text);

    } catch (error) {
      throw new VehicleAPIError(
        'API ไม่ได้ส่ง JSON ที่ถูกต้องกลับมา',
        'INVALID_JSON_RESPONSE',
        response.status,
        {
          preview:
            text.slice(
              0,
              300
            )
        },
        response.headers.get(
          'X-Request-Id'
        ) || ''
      );
    }

    const requestId =
      String(
        payload.requestId ||
        response.headers.get(
          'X-Request-Id'
        ) ||
        ''
      );

    if (
      !response.ok ||
      payload.success !== true
    ) {
      const apiError =
        payload &&
        payload.error
          ? payload.error
          : {};

      if (
        response.status === 401 ||
        [
          'AUTH_REQUIRED',
          'SESSION_EXPIRED',
          'INVALID_SESSION',
          'INVALID_SESSION_SIGNATURE',
          'INVALID_SESSION_PAYLOAD',
          'SESSION_VERSION_EXPIRED'
        ].includes(
          apiError.code
        )
      ) {
        clearAccessToken();
      }

      throw new VehicleAPIError(
        apiError.message ||
        'เกิดข้อผิดพลาดจากระบบ',
        apiError.code ||
        'API_ERROR',
        response.status,
        apiError.details || null,
        requestId
      );
    }

    return payload;
  }

  async function request(
    path,
    options
  ) {
    const config =
      options &&
      typeof options === 'object'
        ? {
            ...options
          }
        : {};

    const method =
      String(
        config.method || 'GET'
      ).toUpperCase();

    config.requestId = String(
      config.requestId || createRequestId()
    ).trim();

    const requestKey =
      method === 'GET' &&
      config.dedupe !== false
        ? buildUrl(
            path,
            config.query
          )
        : '';

    if (
      requestKey &&
      inFlightGetRequests.has(
        requestKey
      )
    ) {
      return inFlightGetRequests.get(
        requestKey
      );
    }

    const foregroundToken =
      method !== 'GET' && config.foreground !== false
        ? foregroundWriteCoordinator.begin(
            config.foregroundReason || method + ' ' + path,
            { method, path, requestId: config.requestId }
          )
        : '';

    const promise =
      requestWithRetry(
        path,
        config
      );

    if (requestKey) {
      inFlightGetRequests.set(
        requestKey,
        promise
      );
    }

    try {
      return await promise;

    } finally {
      if (requestKey) {
        inFlightGetRequests.delete(
          requestKey
        );
      }

      if (foregroundToken) {
        foregroundWriteCoordinator.end(foregroundToken);
      }
    }
  }

  async function requestWithRetry(
    path,
    config
  ) {
    const method =
      String(
        config.method || 'GET'
      ).toUpperCase();

    const maximumRetries =
      method === 'GET'
        ? clampInteger(
            config.retries,
            0,
            3,
            2
          )
        : 0;

    let attempt = 0;

    while (true) {
      try {
        return await requestOnce(
          path,
          config,
          attempt + 1
        );

      } catch (error) {
        if (
          attempt >=
            maximumRetries ||
          !shouldRetryRequest(
            error,
            method
          )
        ) {
          throw error;
        }

        const waitMs =
          calculateRetryDelayMs(
            error,
            attempt
          );

        await delay(waitMs);

        attempt += 1;
      }
    }
  }

  async function requestOnce(
    path,
    config,
    attemptNumber
  ) {
    if (!API_BASE) {
      throw new VehicleAPIError(
        'ยังไม่ได้ตั้งค่า API_BASE',
        'API_BASE_MISSING',
        0
      );
    }

    const method =
      String(
        config.method || 'GET'
      ).toUpperCase();

    const requestStartedAt = performanceNow();
    const stableRequestId = String(
      config.requestId || createRequestId()
    ).trim();

    const useAuthentication =
      config.auth !== false;

    const timeoutMs =
      Math.max(
        5000,
        Number(
          config.timeoutMs ||
          CONFIG.API_TIMEOUT_MS ||
          60000
        )
      );

    const controller =
      new AbortController();

    const timeoutId =
      window.setTimeout(
        () => {
          controller.abort();
        },
        timeoutMs
      );

    const headers =
      new Headers(
        config.headers || {}
      );

    headers.set(
      'Accept',
      'application/json'
    );

    headers.set(
      'X-Request-Id',
      stableRequestId
    );

    headers.set(
      'X-Client-Attempt',
      String(Math.max(1, Number(attemptNumber) || 1))
    );

    if (useAuthentication) {
      const token =
        getAccessToken();

      if (token) {
        headers.set(
          'Authorization',
          'Bearer ' + token
        );
      }
    }

    const fetchOptions = {
      method,
      headers,
      credentials:
        'omit',
      cache:
        'no-store',
      redirect:
        'follow',
      signal:
        controller.signal
    };

    if (
      config.body !== undefined
    ) {
      headers.set(
        'Content-Type',
        'application/json; charset=UTF-8'
      );

      fetchOptions.body =
        JSON.stringify(
          config.body
        );
    }

    try {
      const response =
        await fetch(
          buildUrl(
            path,
            config.query
          ),
          fetchOptions
        );

      const payload = await parseResponse(
        response
      );

      return attachClientPerformance(payload, {
        clientTotalMs: performanceNow() - requestStartedAt,
        requestAttempt: attemptNumber,
        verificationCount:
          payload && payload.data && payload.data.workerPerformance &&
          Number(payload.data.workerPerformance.verificationCount || 0) || 0,
        method,
        path,
        requestId: stableRequestId,
        ok: true,
        status: response.status
      });

    } catch (error) {
      if (
        error &&
        error.name === 'AbortError'
      ) {
        const timeoutError = new VehicleAPIError(
          'ระบบใช้เวลาตอบกลับนานเกินกำหนด',
          'REQUEST_TIMEOUT',
          408,
          {
            retryable: true,
            committed: null,
            verificationRequired: method !== 'GET'
          },
          stableRequestId
        );
        timeoutError.clientPerformance = {
          clientTotalMs: Math.max(0, Math.round(performanceNow() - requestStartedAt)),
          requestAttempt: Math.max(1, Number(attemptNumber) || 1),
          verificationCount: 0,
          method,
          path,
          requestId: stableRequestId,
          ok: false,
          status: 408
        };
        recordApiPerformance(timeoutError.clientPerformance);
        throw timeoutError;
      }

      if (
        error instanceof
        VehicleAPIError
      ) {
        error.clientPerformance = error.clientPerformance || {
          clientTotalMs: Math.max(0, Math.round(performanceNow() - requestStartedAt)),
          requestAttempt: Math.max(1, Number(attemptNumber) || 1),
          verificationCount: 0,
          method,
          path,
          requestId: stableRequestId,
          ok: false,
          status: Number(error.status) || 0
        };
        recordApiPerformance(error.clientPerformance);
        throw error;
      }

      const networkError = new VehicleAPIError(
        navigator.onLine
          ? 'ไม่สามารถเชื่อมต่อระบบได้'
          : 'อุปกรณ์ไม่ได้เชื่อมต่ออินเทอร์เน็ต',
        'NETWORK_ERROR',
        0,
        {
          originalMessage:
            error &&
            error.message
              ? error.message
              : String(error),
          retryable: true,
          committed: null,
          verificationRequired: method !== 'GET'
        },
        stableRequestId
      );

      networkError.clientPerformance = {
        clientTotalMs: Math.max(
          0,
          Math.round(
            performanceNow() - requestStartedAt
          )
        ),
        requestAttempt: Math.max(
          1,
          Number(attemptNumber) || 1
        ),
        verificationCount: 0,
        method,
        path,
        requestId: stableRequestId,
        ok: false,
        status: 0
      };

      recordApiPerformance(
        networkError.clientPerformance
      );

      throw networkError;

    } finally {
      window.clearTimeout(
        timeoutId
      );
    }
  }

  function shouldRetryRequest(
    error,
    method
  ) {
    if (method !== 'GET') {
      return false;
    }

    if (!error) {
      return false;
    }

    if (
      RETRYABLE_ERROR_CODES.has(
        error.code
      )
    ) {
      return true;
    }

    return [
      502,
      503,
      504
    ].includes(
      Number(error.status)
    );
  }

  function calculateRetryDelayMs(
    error,
    attempt
  ) {
    const retryAfterSeconds =
      Number(
        error &&
        error.details &&
        error.details.retryAfterSeconds
      );

    if (
      Number.isFinite(
        retryAfterSeconds
      ) &&
      retryAfterSeconds > 0
    ) {
      return Math.min(
        retryAfterSeconds *
          1000,
        10000
      );
    }

    return Math.min(
      700 *
        Math.pow(
          2,
          attempt
        ) +
        Math.floor(
          Math.random() *
          250
        ),
      5000
    );
  }

  function delay(
    milliseconds
  ) {
    return new Promise(
      (resolve) => {
        window.setTimeout(
          resolve,
          milliseconds
        );
      }
    );
  }

  function clampInteger(
    value,
    minimum,
    maximum,
    fallback
  ) {
    const number =
      Number(value);

    if (
      !Number.isFinite(number)
    ) {
      return fallback;
    }

    return Math.min(
      Math.max(
        Math.floor(number),
        minimum
      ),
      maximum
    );
  }

  function requireApiText(
    value,
    code,
    message
  ) {
    const text =
      String(value || '').trim();

    if (!text) {
      throw new VehicleAPIError(
        message,
        code,
        400
      );
    }

    return text;
  }

  function workflowBasePath(
    moduleId
  ) {
    const cleanModuleId =
      requireApiText(
        moduleId,
        'MODULE_ID_REQUIRED',
        'กรุณาระบุรหัส Module'
      );

    return (
      '/api/workflow/modules/' +
      encodeURIComponent(cleanModuleId)
    );
  }

  function workflowPayload(
    payload,
    defaultMethod
  ) {
    const source =
      payload &&
      typeof payload === 'object' &&
      !Array.isArray(payload)
        ? { ...payload }
        : {};

    const entryCode =
      String(
        source.entryCode ||
        source.autoId ||
        source.code ||
        source.qrText ||
        source.recordId ||
        ''
      ).trim();

    const clientRequestId =
      String(
        source.clientRequestId ||
        source.requestId ||
        createRequestId()
      ).trim();

    return {
      ...source,
      entryCode,
      qrText:
        String(
          source.qrText ||
          source.rawQrText ||
          entryCode
        ).trim(),
      lookupMethod:
        String(
          source.lookupMethod ||
          source.method ||
          defaultMethod ||
          'MANUAL'
        ).trim().toUpperCase(),
      clientRequestId,
      requestId:
        String(
          source.requestId ||
          clientRequestId
        ).trim()
    };
  }

  function getClientDiagnostics() {
    let storageAvailable =
      true;

    try {
      const probeKey =
        '__alertvendor_probe__';

      window.sessionStorage
        .setItem(
          probeKey,
          '1'
        );

      window.sessionStorage
        .removeItem(
          probeKey
        );

    } catch (error) {
      storageAvailable =
        false;
    }

    return {
      status:
        navigator.onLine &&
        storageAvailable &&
        Boolean(
          getAccessToken()
        )
          ? 'PASS'
          : 'FAIL',

      checkedAt:
        new Date()
          .toISOString(),

      online:
        navigator.onLine,

      origin:
        window.location.origin,

      page:
        window.location.pathname,

      storageAvailable:
        storageAvailable,

      sessionTokenPresent:
        Boolean(
          getAccessToken()
        ),

      apiBase:
        API_BASE
    };
  }

  async function getClientProductionDiagnostics() {
    const base = getClientDiagnostics();
    const startedAt = performanceNow();
    const results = await Promise.all([
      inspectInboundQueueStorage(),
      inspectWorkerHealth()
    ]);
    const queue = results[0];
    const worker = results[1];
    const performance = summarizeClientPerformance(
      readClientPerformanceTrace()
    );
    const foregroundWrite =
      foregroundWriteCoordinator &&
      typeof foregroundWriteCoordinator.snapshot === 'function'
        ? foregroundWriteCoordinator.snapshot()
        : { active: false, count: 0, reasons: [] };

    return {
      ...base,
      diagnosticsVersion: '2026.07.19-round7-hotfix3-acceptance-accuracy-v1',
      queue,
      worker,
      performance,
      foregroundWrite,
      diagnosticsDurationMs: Math.max(
        0,
        Math.round(performanceNow() - startedAt)
      )
    };
  }

  async function inspectWorkerHealth() {
    const startedAt = performanceNow();

    try {
      const response = await request('/api/health', {
        auth: false,
        timeoutMs: 20000,
        retries: 0
      });
      const health = response && response.data && typeof response.data === 'object'
        ? response.data
        : {};
      return {
        available: true,
        status: 'PASS',
        buildVersion:
          health && health.worker && health.worker.buildVersion || '',
        health,
        latencyMs: Math.max(
          0,
          Math.round(performanceNow() - startedAt)
        ),
        checkedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        available: false,
        status: 'FAIL',
        buildVersion: '',
        health: {},
        latencyMs: Math.max(
          0,
          Math.round(performanceNow() - startedAt)
        ),
        errorCode: error && error.code || 'WORKER_HEALTH_FAILED',
        error: error && error.message ? error.message : String(error),
        checkedAt: new Date().toISOString()
      };
    }
  }

  function readClientPerformanceTrace() {
    try {
      const parsed = JSON.parse(
        window.sessionStorage.getItem(API_PERFORMANCE_STORAGE_KEY) || '[]'
      );
      return Array.isArray(parsed) ? parsed.slice() : [];
    } catch (error) {
      return [];
    }
  }

  function percentile(values, percentileValue) {
    const list = (Array.isArray(values) ? values : [])
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value) && value >= 0)
      .sort((left, right) => left - right);

    if (!list.length) return 0;
    const position = Math.max(
      0,
      Math.min(
        list.length - 1,
        Math.ceil((Number(percentileValue) || 0) * list.length) - 1
      )
    );
    return Math.round(list[position]);
  }

  function classifyForegroundBusinessWrite(item) {
    const method = String(item && item.method || '').toUpperCase();
    const path = String(item && item.path || '').split('?')[0].toLowerCase();
    if (method === 'GET' || !path) return '';

    const rules = [
      [/\/process-scan$/, 'INBOUND_PROCESS_SCAN'],
      [/\/receiving-complete$/, 'RECEIVING_COMPLETE'],
      [/\/return-document$/, 'DOCUMENT_RETURN'],
      [/\/submit-document$/, 'DOCUMENT_SUBMIT'],
      [/\/complete-receiving$/, 'WORKFLOW_RECEIVING_COMPLETE'],
      [/\/checkout$/, 'GATE_OUT'],
      [/\/cancel$/, 'WORKFLOW_CANCEL']
    ];

    for (const rule of rules) {
      if (rule[0].test(path)) return rule[1];
    }
    return '';
  }

  function summarizeClientPerformance(items) {
    const trace = Array.isArray(items) ? items.slice(-API_PERFORMANCE_MAX_ITEMS) : [];
    const classified = trace.map((item) => ({
      item: item || {},
      operation: classifyForegroundBusinessWrite(item)
    }));
    const businessSamples = classified.filter((entry) => Boolean(entry.operation));
    const list = businessSamples.map((entry) => entry.item);
    const durations = list.map((item) => Number(item && item.clientTotalMs || 0));
    const failed = list.filter((item) => item && item.ok !== true);
    const retried = list.filter((item) => Number(item && item.requestAttempt || 1) > 1);
    const verified = list.filter((item) => Number(item && item.verificationCount || 0) > 0);
    const workerGasValues = list
      .map((item) => Number(item && item.workerPerformance && item.workerPerformance.gasMs || 0))
      .filter((value) => value > 0);
    const appsLockValues = list
      .map((item) => Number(item && item.appsScriptPerformance && item.appsScriptPerformance.lockHeldMs || 0))
      .filter((value) => value >= 0);
    const operationCounts = businessSamples.reduce((counts, entry) => {
      counts[entry.operation] = Number(counts[entry.operation] || 0) + 1;
      return counts;
    }, {});
    const slowestSamples = businessSamples
      .map((entry) => ({
        operation: entry.operation,
        path: String(entry.item && entry.item.path || ''),
        clientTotalMs: Number(entry.item && entry.item.clientTotalMs || 0),
        ok: entry.item && entry.item.ok === true,
        requestAttempt: Number(entry.item && entry.item.requestAttempt || 1),
        verificationCount: Number(entry.item && entry.item.verificationCount || 0)
      }))
      .sort((left, right) => right.clientTotalMs - left.clientTotalMs)
      .slice(0, 5);

    return {
      available: true,
      sampleScope: 'FOREGROUND_BUSINESS_WRITES_ONLY',
      sampleCount: list.length,
      writeCount: list.length,
      totalTraceCount: trace.length,
      excludedTraceCount: trace.length - list.length,
      operationCounts,
      successCount: list.length - failed.length,
      errorCount: failed.length,
      errorRate: list.length ? failed.length / list.length : 0,
      retryCount: retried.length,
      retryRate: list.length ? retried.length / list.length : 0,
      verificationCount: verified.length,
      verificationRate: list.length ? verified.length / list.length : 0,
      p50ClientMs: percentile(durations, 0.50),
      p95ClientMs: percentile(durations, 0.95),
      p50WriteMs: percentile(durations, 0.50),
      p95WriteMs: percentile(durations, 0.95),
      p50ForegroundBusinessWriteMs: percentile(durations, 0.50),
      p95ForegroundBusinessWriteMs: percentile(durations, 0.95),
      p95WorkerGasMs: percentile(workerGasValues, 0.95),
      p95AppsLockHeldMs: percentile(appsLockValues, 0.95),
      maxClientMs: durations.length ? Math.max(...durations) : 0,
      slowestSamples,
      lastFinishedAtEpochMs: list.length
        ? Number(list[list.length - 1].finishedAtEpochMs || 0)
        : 0,
      inspectedAt: new Date().toISOString()
    };
  }

  async function inspectInboundQueueStorage() {
    const fallbackKey = 'ALERT_VENDOR_INBOUND_PENDING_QUEUE_V2';
    const dbName = 'alertvendor_inbound_pending_queue_v2';
    const storeName = 'operations';
    const recoverableCodes = new Set([
      'INVALID_LOOKUP_METHOD',
      'NETWORK_ERROR',
      'REQUEST_TIMEOUT',
      'GAS_TIMEOUT',
      'GAS_CONNECTION_FAILED',
      'RECEIVING_BUSY',
      'WORKFLOW_SYNC_PENDING',
      'STATE_CHANGED'
    ]);

    function summarize(items, mode) {
      const counts = {
        pending: 0,
        failed: 0,
        paused: 0,
        committed: 0,
        recoverableFailed: 0,
        terminalFailed: 0,
        legacyContractCount: 0
      };
      let oldestPendingAt = 0;

      (items || []).forEach((item) => {
        const status = String(item && item.status || '').toUpperCase();
        const payload = item && item.payload && typeof item.payload === 'object'
          ? item.payload
          : {};
        const lookupMethod = String(
          payload.lookupMethod || item && item.lookupMethod || ''
        ).toUpperCase();
        const errorCode = String(
          item && (item.lastErrorCode || item.errorCode) ||
          item && item.lastError && item.lastError.code ||
          ''
        ).toUpperCase();
        const createdAt = Number(
          item && (item.createdAtEpochMs || item.createdAt || item.queuedAtEpochMs) || 0
        );

        if (lookupMethod.indexOf('QUEUE_') === 0) {
          counts.legacyContractCount += 1;
        }

        if (['PENDING', 'SENDING', 'RETRY_WAIT', 'UNKNOWN'].includes(status)) {
          counts.pending += 1;
          if (createdAt > 0 && (!oldestPendingAt || createdAt < oldestPendingAt)) {
            oldestPendingAt = createdAt;
          }
        } else if (status === 'FAILED') {
          counts.failed += 1;
          if (recoverableCodes.has(errorCode)) {
            counts.recoverableFailed += 1;
          } else {
            counts.terminalFailed += 1;
          }
        } else if (['PAUSED_AUTH', 'PAUSED_ACTOR'].includes(status)) {
          counts.paused += 1;
        } else if (status === 'COMMITTED') {
          counts.committed += 1;
        }
      });

      return {
        available: true,
        storageMode: mode,
        total: (items || []).length,
        ...counts,
        oldestPendingAgeMs: oldestPendingAt
          ? Math.max(0, Date.now() - oldestPendingAt)
          : 0,
        autoRecoveryExpected:
          counts.terminalFailed === 0 &&
          (counts.pending > 0 || counts.recoverableFailed > 0 || counts.legacyContractCount > 0),
        inspectedAt: new Date().toISOString()
      };
    }

    try {
      if (window.indexedDB) {
        const databases = typeof indexedDB.databases === 'function'
          ? await indexedDB.databases()
          : null;
        const exists = !databases || databases.some((item) => item && item.name === dbName);
        if (exists) {
          const items = await new Promise((resolve, reject) => {
            const request = indexedDB.open(dbName, 1);
            request.onerror = () => reject(request.error || new Error('INDEXEDDB_OPEN_FAILED'));
            request.onsuccess = () => {
              const db = request.result;
              if (!db.objectStoreNames.contains(storeName)) {
                db.close();
                resolve([]);
                return;
              }
              const transaction = db.transaction(storeName, 'readonly');
              const getAllRequest = transaction.objectStore(storeName).getAll();
              getAllRequest.onerror = () => reject(getAllRequest.error || new Error('INDEXEDDB_READ_FAILED'));
              getAllRequest.onsuccess = () => {
                db.close();
                resolve(Array.isArray(getAllRequest.result) ? getAllRequest.result : []);
              };
            };
          });
          return summarize(items, 'INDEXED_DB');
        }
      }

      const raw = window.localStorage.getItem(fallbackKey);
      const items = raw ? JSON.parse(raw) : [];
      return summarize(Array.isArray(items) ? items : [], 'LOCAL_STORAGE');
    } catch (error) {
      return {
        available: false,
        storageMode: '',
        total: 0,
        pending: 0,
        failed: 0,
        paused: 0,
        committed: 0,
        recoverableFailed: 0,
        terminalFailed: 0,
        legacyContractCount: 0,
        oldestPendingAgeMs: 0,
        autoRecoveryExpected: false,
        error: error && error.message ? error.message : String(error),
        inspectedAt: new Date().toISOString()
      };
    }
  }

  /************************************************************
   * Public API
   ************************************************************/

  const VehicleAPI = {
    Error:
      VehicleAPIError,

    request,

    getAccessToken,

    clearSession:
      clearAccessToken,

    getClientDiagnostics,

    getClientProductionDiagnostics,

    hasSession() {
      return Boolean(
        getAccessToken()
      );
    },

    async health() {
      const response =
        await request(
          '/api/health',
          {
            auth:
              false,

            timeoutMs:
              CONFIG.AUTH_TIMEOUT_MS
          }
        );

      return response.data;
    },

    async login(
      username,
      password
    ) {
      /*
       * ล้าง Token เก่าก่อน Login ใหม่
       */
      clearAccessToken();

      const response =
        await request(
          '/api/auth/login',
          {
            method:
              'POST',

            auth:
              false,

            timeoutMs:
              CONFIG.AUTH_TIMEOUT_MS,

            body: {
              username:
                String(
                  username || ''
                ).trim(),

              password:
                String(
                  password || ''
                )
            }
          }
        );

      if (
        !response ||
        typeof response !== 'object'
      ) {
        throw new VehicleAPIError(
          'ระบบเข้าสู่ระบบไม่ได้รับคำตอบที่ถูกต้อง กรุณาลองใหม่',
          'GAS_INVALID_RESPONSE',
          502,
          {
            retryable: true,
            committed: false,
            verificationRequired: false
          },
          ''
        );
      }

      const data =
        response.data &&
        typeof response.data === 'object'
          ? response.data
          : {};

      const token =
        updateTokenFromData(
          data
        );

      if (!token) {
        throw new VehicleAPIError(
          'ระบบเข้าสู่ระบบสำเร็จ แต่ไม่ได้รับ Session Token',
          'ACCESS_TOKEN_MISSING',
          502,
          null,
          response.requestId || ''
        );
      }

      return data;
    },

    async me() {
      const response =
        await request(
          '/api/auth/me',
          {
            timeoutMs:
              CONFIG.AUTH_TIMEOUT_MS
          }
        );

      return response.data;
    },

    async logout() {
      try {
        const response =
          await request(
            '/api/auth/logout',
            {
              method:
                'POST',

              timeoutMs:
                CONFIG.AUTH_TIMEOUT_MS,

              body:
                {}
            }
          );

        return response.data;

      } finally {
        /*
         * Logout ฝั่ง Client ต้องลบ Token เสมอ
         */
        clearAccessToken();
      }
    },

    async changePassword(
      currentPassword,
      newPassword
    ) {
      const response =
        await request(
          '/api/auth/change-password',
          {
            method:
              'POST',

            timeoutMs:
              CONFIG.AUTH_TIMEOUT_MS,

            body: {
              currentPassword:
                String(
                  currentPassword || ''
                ),

              newPassword:
                String(
                  newPassword || ''
                )
            }
          }
        );

      const data =
        response.data || {};

      /*
       * Worker ส่ง Token ใหม่หลังเปลี่ยนรหัสผ่าน
       */
      updateTokenFromData(
        data
      );

      return data;
    },

    async getModules() {
      const response =
        await request(
          '/api/modules'
        );

      return response.data;
    },

    async getModule(
      moduleId
    ) {
      const response =
        await request(
          '/api/modules/' +
          encodeURIComponent(
            moduleId
          )
        );

      return response.data;
    },

    async getRecords(
      moduleId,
      options
    ) {
      const response =
        await request(
          '/api/modules/' +
          encodeURIComponent(
            moduleId
          ) +
          '/records',
          {
            query:
              options || {}
          }
        );

      return response.data;
    },

    async getOperationalBoard(
      moduleId,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/modules/' +
          encodeURIComponent(
            moduleId
          ) +
          '/operational-board',
          {
            query: {
              limit:
                config.limit ||
                1500,

              forceRefresh:
                config.forceRefresh === true
                  ? 'true'
                  : '',

              revisionOnly:
                config.revisionOnly === true
                  ? 'true'
                  : '',

              knownRevision:
                config.knownRevision ||
                ''
            }
          }
        );

      return response.data;
    },

    async updateShiftHandover(
      moduleId,
      action,
      payload
    ) {
      const body =
        payload &&
        typeof payload === 'object'
          ? payload
          : {};

      const response =
        await request(
          '/api/modules/' +
          encodeURIComponent(
            moduleId
          ) +
          '/shift-handover',
          {
            method: 'POST',
            body: {
              handoverAction:
                String(
                  action || ''
                ).trim().toUpperCase(),
              snapshotKey:
                String(
                  body.snapshotKey || ''
                ).trim(),
              note:
                String(
                  body.note || ''
                ).trim()
            }
          }
        );

      return response.data;
    },

    async getMovementSummary(
      moduleId,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/modules/' +
          encodeURIComponent(
            moduleId
          ) +
          '/movement-summary',
          {
            query: {
              mode:
                config.mode ||
                'all',

              date:
                config.date ||
                '',

              scope:
                config.scope ||
                '',

              shift:
                config.shift ||
                config.shiftCode ||
                ''
            }
          }
        );

      return response.data;
    },



    async getShiftConfig(
      moduleId,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/modules/' +
          encodeURIComponent(
            moduleId
          ) +
          '/shift-config',
          {
            query: {
              date:
                config.date ||
                ''
            }
          }
        );

      return response.data;
    },


    async getMovementScope(
      moduleId,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/modules/' +
          encodeURIComponent(
            moduleId
          ) +
          '/movement-scope',
          {
            query: {
              scope:
                config.scope ||
                'ROLLING_4H',

              date:
                config.date ||
                '',

              shift:
                config.shift ||
                config.shiftCode ||
                ''
            }
          }
        );

      return response.data;
    },


    async getAdminShiftConfig(
      moduleId,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/admin/modules/' +
          encodeURIComponent(
            moduleId
          ) +
          '/shift-config',
          {
            query: {
              date:
                config.date ||
                ''
            }
          }
        );

      return response.data;
    },


    async saveAdminShiftConfig(
      moduleId,
      payload
    ) {
      const response =
        await request(
          '/api/admin/modules/' +
          encodeURIComponent(
            moduleId
          ) +
          '/shift-config',
          {
            method:
              'POST',

            body:
              payload || {}
          }
        );

      return response.data;
    },


    async getAdminWorkflowSlaRules(
      moduleId
    ) {
      const response =
        await request(
          '/api/admin/modules/' +
          encodeURIComponent(
            moduleId
          ) +
          '/sla-rules'
        );

      return response.data;
    },


    async saveAdminWorkflowSlaRules(
      moduleId,
      payload
    ) {
      const body =
        payload &&
        typeof payload === 'object' &&
        !Array.isArray(payload)
          ? { ...payload }
          : {};
      const clientRequestId = String(
        body.clientRequestId ||
        body.requestId ||
        createRequestId()
      );
      body.clientRequestId = clientRequestId;
      body.requestId = clientRequestId;

      const response =
        await request(
          '/api/admin/modules/' +
          encodeURIComponent(
            moduleId
          ) +
          '/sla-rules',
          {
            method:
              'POST',
            requestId:
              clientRequestId,
            body:
              body
          }
        );

      return response.data;
    },


    async setupAdminWorkflowSlaRules() {
      const response =
        await request(
          '/api/admin/sla-rules/setup',
          {
            method:
              'POST',

            body: {}
          }
        );

      return response.data;
    },


    async getAdminAlertEngineStatus() {
      const response = await request('/api/admin/alert-engine/status');
      return response.data;
    },

    async setupAdminAlertEngine(options) {
      const response = await request('/api/admin/alert-engine/setup', { method: 'POST', body: options || {} });
      return response.data;
    },

    async enableAdminAlertEngine(options) {
      const response = await request('/api/admin/alert-engine/enable', { method: 'POST', body: options || {} });
      return response.data;
    },

    async disableAdminAlertEngine() {
      const response = await request('/api/admin/alert-engine/disable', { method: 'POST', body: {} });
      return response.data;
    },

    async runAdminAlertEngine(options) {
      const response = await request('/api/admin/alert-engine/run', { method: 'POST', timeoutMs: 120000, body: options || {} });
      return response.data;
    },

    async getAdminAlertDeliveries(options) {
      const config = options && typeof options === 'object' ? options : {};
      const response = await request('/api/admin/alert-engine/deliveries', { query: { limit: clampInteger(config.limit, 1, 500, 100), moduleId: config.moduleId || '' } });
      return response.data;
    },

    async setupAdminShiftSystem() {
      const response =
        await request(
          '/api/admin/shifts/setup',
          {
            method:
              'POST',

            body: {}
          }
        );

      return response.data;
    },


    async runAdminShiftSnapshots(
      options
    ) {
      const response =
        await request(
          '/api/admin/shifts/run-snapshots',
          {
            method:
              'POST',

            body:
              options || {}
          }
        );

      return response.data;
    },


    async getAdminShiftStatistics(
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/admin/shifts/statistics',
          {
            query: {
              moduleId:
                config.moduleId ||
                '',

              startDate:
                config.startDate ||
                '',

              endDate:
                config.endDate ||
                '',

              shift:
                config.shift ||
                '',

              limit:
                config.limit ||
                100
            }
          }
        );

      return response.data;
    },


    async getReceivingFlow(
      moduleId,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/modules/' +
          encodeURIComponent(moduleId) +
          '/receiving-flow',
          {
            query: {
              mode: config.mode || 'ACTIVE'
            }
          }
        );

      return response.data;
    },
    async completeReceiving(
      moduleId,
      record
    ) {
      const response =
        await request(
          '/api/modules/' +
          encodeURIComponent(
            moduleId
          ) +
          '/receiving-complete',
          {
            method:
              'POST',

            /* Command Journal รับคำสั่งอย่างเดียว Browser จัดการ retry ด้วย Request ID เดิม */
            timeoutMs:
              Math.min(
                Number(CONFIG.API_TIMEOUT_MS || 30000),
                8000
              ),

            requestId:
              String(record && (record.clientRequestId || record.requestId) || ''),

            foreground: false,

            body:
              record ||
              {}
          }
        );

      return response.data;
    },


    async getReceivingCommitStatus(
      moduleId,
      record
    ) {
      const response =
        await request(
          '/api/modules/' +
          encodeURIComponent(
            moduleId
          ) +
          '/receiving-status',
          {
            method:
              'POST',

            timeoutMs:
              Math.min(
                Number(
                  CONFIG.API_TIMEOUT_MS ||
                  30000
                ),
                30000
              ),

            requestId:
              String(record && (record.clientRequestId || record.requestId) || ''),

            foreground: false,

            body:
              record ||
              {}
          }
        );

      return response.data;
    },


    async syncReceivingWorkflow(
      moduleId,
      record
    ) {
      const response = await request(
        '/api/modules/' +
        encodeURIComponent(moduleId) +
        '/receiving-workflow-sync',
        {
          method: 'POST',
          timeoutMs: Math.min(
            Number(CONFIG.SAVE_TIMEOUT_MS || 60000),
            45000
          ),
          requestId: String(
            record && (record.clientRequestId || record.requestId) || ''
          ),
          foreground: false,
          body: record || {}
        }
      );

      return response.data;
    },


    /**********************************************************
     * Inbound Workflow API
     **********************************************************/

    async processInboundWorkflowScan(
      moduleId,
      payload
    ) {
      const body = workflowPayload(
        payload,
        'SCAN'
      );

      requireApiText(
        body.entryCode,
        'ENTRY_CODE_REQUIRED',
        'กรุณาระบุ Auto ID ก่อนประมวลผล'
      );

      const response = await request(
        workflowBasePath(moduleId) +
        '/process-scan',
        {
          method: 'POST',
          timeoutMs:
            CONFIG.SAVE_TIMEOUT_MS ||
            90000,
          requestId:
            body.clientRequestId,
          body
        }
      );
      return response.data && typeof response.data === 'object'
        ? response.data
        : {};
    },

    async lookupInboundWorkflow(
      moduleId,
      entryCode,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const cleanEntryCode =
        requireApiText(
          entryCode ||
          config.entryCode ||
          config.autoId ||
          config.code,
          'ENTRY_CODE_REQUIRED',
          'กรุณาระบุ Auto ID หรือรหัสเข้าพื้นที่'
        );

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/lookup',
          {
            dedupe: false,
            query: {
              entryCode:
                cleanEntryCode,
              method:
                config.lookupMethod ||
                config.method ||
                'MANUAL',
              _:
                config.cacheBust ||
                ''
            }
          }
        );

      return response.data;
    },

    async getInboundWorkflowState(
      moduleId,
      entryCode,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const cleanEntryCode =
        requireApiText(
          entryCode ||
          config.entryCode ||
          config.autoId ||
          config.code,
          'ENTRY_CODE_REQUIRED',
          'กรุณาระบุ Auto ID หรือรหัสเข้าพื้นที่'
        );

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/state/' +
          encodeURIComponent(cleanEntryCode),
          {
            dedupe: false,
            query: {
              method:
                config.lookupMethod ||
                config.method ||
                'MANUAL',
              _:
                config.cacheBust ||
                ''
            }
          }
        );

      return response.data;
    },

    async submitInboundDocument(
      moduleId,
      payload
    ) {
      const body =
        workflowPayload(
          payload,
          'SCAN'
        );

      requireApiText(
        body.entryCode,
        'ENTRY_CODE_REQUIRED',
        'กรุณาระบุ Auto ID ก่อนบันทึกยื่นเอกสาร'
      );

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/submit-document',
          {
            method: 'POST',
            timeoutMs:
              CONFIG.SAVE_TIMEOUT_MS ||
              90000,
            requestId:
              body.clientRequestId,
            body
          }
        );

      return response.data;
    },

    async completeInboundWorkflowReceiving(
      moduleId,
      payload
    ) {
      const body =
        workflowPayload(
          payload,
          'MANUAL'
        );

      requireApiText(
        body.entryCode,
        'ENTRY_CODE_REQUIRED',
        'ไม่พบ Auto ID สำหรับ Sync สถานะตรวจรับเสร็จ'
      );

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/complete-receiving',
          {
            method: 'POST',
            timeoutMs:
              CONFIG.SAVE_TIMEOUT_MS ||
              90000,
            requestId:
              body.clientRequestId,
            body
          }
        );

      return response.data;
    },

    async returnInboundDocument(
      moduleId,
      payload
    ) {
      const body =
        workflowPayload(
          payload,
          'SCAN'
        );

      requireApiText(
        body.entryCode,
        'ENTRY_CODE_REQUIRED',
        'กรุณาระบุ Auto ID ก่อนบันทึกรับเอกสารคืน'
      );

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/return-document',
          {
            method: 'POST',
            timeoutMs:
              CONFIG.SAVE_TIMEOUT_MS ||
              90000,
            requestId:
              body.clientRequestId,
            body
          }
        );

      return response.data;
    },

    async cancelInboundWorkflow(
      moduleId,
      payload
    ) {
      const source =
        workflowPayload(
          payload,
          'MANUAL'
        );

      const body = {
        ...source,
        reason:
          String(
            source.reason ||
            source.cancelReason ||
            source.note ||
            ''
          ).trim(),
        stageCode:
          String(
            source.stageCode ||
            source.statusCode ||
            ''
          ).trim()
      };

      if (!body.entryCode && !body.eventId) {
        throw new VehicleAPIError(
          'กรุณาระบุ Auto ID หรือรหัสเหตุการณ์ที่ต้องการยกเลิก',
          'ENTRY_CODE_OR_EVENT_ID_REQUIRED',
          400
        );
      }

      requireApiText(
        body.reason,
        'CANCEL_REASON_REQUIRED',
        'กรุณาระบุเหตุผลการยกเลิก'
      );

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/cancel-event',
          {
            method: 'POST',
            timeoutMs:
              CONFIG.SAVE_TIMEOUT_MS ||
              90000,
            requestId:
              body.clientRequestId,
            body
          }
        );

      return response.data;
    },

    async getInboundWorkflowDashboard(
      moduleId,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/dashboard',
          {
            dedupe:
              !config.cacheBust,
            query: {
              limit:
                clampInteger(
                  config.limit,
                  1,
                  1000,
                  500
                ),
              revisionOnly:
                config.revisionOnly === true
                  ? 'true'
                  : '',
              knownRevision:
                config.knownRevision ||
                '',
              _:
                config.cacheBust ||
                ''
            }
          }
        );

      return response.data;
    },

    async getInboundWorkflowSlaAlerts(
      moduleId,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/sla-alerts',
          {
            query: {
              limit:
                clampInteger(
                  config.limit,
                  1,
                  200,
                  50
                ),
              sinceEpochMs:
                Math.max(0, Number(config.sinceEpochMs) || 0),
              evaluate:
                config.evaluate === false
                  ? 'false'
                  : 'true'
            }
          }
        );

      return response.data;
    },

    async setupInboundWorkflowDefaultSlaRules(
      moduleId
    ) {
      const response =
        await request(
          workflowBasePath(moduleId) +
          '/sla-alerts/setup-default',
          {
            method: 'POST',
            body: {}
          }
        );

      return response.data;
    },

    async getInboundWorkflowReport(
      moduleId,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/report',
          {
            query: {
              date:
                config.date ||
                config.reportDate ||
                '',
              limit:
                clampInteger(
                  config.limit,
                  1,
                  5000,
                  500
                )
            }
          }
        );

      return response.data;
    },

    async getInboundWorkflowAudit(
      moduleId,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/audit',
          {
            query: {
              date:
                config.date ||
                config.reportDate ||
                '',
              limit:
                clampInteger(
                  config.limit,
                  1,
                  1000,
                  300
                )
            }
          }
        );

      return response.data;
    },

    async exportInboundWorkflowCsv(
      moduleId,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/export/csv',
          {
            method: 'POST',
            timeoutMs: 120000,
            body: {
              date: config.date || config.reportDate || '',
              status: config.status || config.statusCode || '',
              query: config.query || config.search || '',
              limit: clampInteger(config.limit, 1, 5000, 500)
            }
          }
        );

      return response.data;
    },

    async syncInboundWorkflowGateOut(
      moduleId,
      payload
    ) {
      const body =
        workflowPayload(
          payload,
          'MANUAL'
        );

      requireApiText(
        body.entryCode,
        'ENTRY_CODE_REQUIRED',
        'กรุณาระบุ Auto ID สำหรับ Sync Gate Out'
      );

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/sync-gate-out',
          {
            method: 'POST',
            body
          }
        );

      return response.data;
    },

    async previewInboundGateOutSync(
      moduleId,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/gate-out-sync/preview',
          {
            query: {
              limit:
                clampInteger(
                  config.limit,
                  1,
                  100,
                  30
                )
            }
          }
        );

      return response.data;
    },

    async runInboundGateOutSync(
      moduleId,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/gate-out-sync/run',
          {
            method: 'POST',
            timeoutMs: 120000,
            body: {
              limit:
                clampInteger(
                  config.limit,
                  1,
                  100,
                  30
                )
            }
          }
        );

      return response.data;
    },

    async getInboundAutoGateOutStatus(
      moduleId
    ) {
      const response =
        await request(
          workflowBasePath(moduleId) +
          '/gate-out-sync/auto/status'
        );

      return response.data;
    },

    async enableInboundAutoGateOut(
      moduleId,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/gate-out-sync/auto/enable',
          {
            method: 'POST',
            body: {
              limit:
                clampInteger(
                  config.limit,
                  1,
                  100,
                  30
                ),
              intervalMinutes:
                Number(
                  config.intervalMinutes
                ) || 10
            }
          }
        );

      return response.data;
    },

    async disableInboundAutoGateOut(
      moduleId
    ) {
      const response =
        await request(
          workflowBasePath(moduleId) +
          '/gate-out-sync/auto/disable',
          {
            method: 'POST',
            body: {}
          }
        );

      return response.data;
    },

    async runInboundAutoGateOutNow(
      moduleId,
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          workflowBasePath(moduleId) +
          '/gate-out-sync/auto/run-now',
          {
            method: 'POST',
            timeoutMs: 120000,
            body: {
              limit:
                clampInteger(
                  config.limit,
                  1,
                  100,
                  30
                )
            }
          }
        );

      return response.data;
    },


    async getCalendar(
      moduleId,
      month,
      year
    ) {
      const response =
        await request(
          '/api/modules/' +
          encodeURIComponent(
            moduleId
          ) +
          '/calendar',
          {
            query: {
              month,
              year
            }
          }
        );

      return response.data;
    },

    async getDailySummary(
      moduleId,
      date
    ) {
      const response =
        await request(
          '/api/modules/' +
          encodeURIComponent(
            moduleId
          ) +
          '/daily-summary',
          {
            query: {
              date
            }
          }
        );

      return response.data;
    },

    async previewCheckout(
      moduleId,
      record
    ) {
      const body = record && typeof record === 'object'
        ? { ...record }
        : {};
      const clientRequestId = String(
        body.clientRequestId || body.requestId || createRequestId()
      ).trim();
      body.clientRequestId = clientRequestId;
      body.requestId = clientRequestId;

      const response = await request(
        '/api/modules/' +
        encodeURIComponent(moduleId) +
        '/checkout/preview',
        {
          method: 'POST',
          requestId: clientRequestId,
          body
        }
      );

      return response.data;
    },

    async getCheckoutCommitStatus(
      moduleId,
      record
    ) {
      const body = record && typeof record === 'object'
        ? { ...record }
        : {};
      const clientRequestId = String(
        body.clientRequestId || body.requestId || createRequestId()
      ).trim();
      body.clientRequestId = clientRequestId;
      body.requestId = clientRequestId;

      const response = await request(
        '/api/modules/' +
        encodeURIComponent(moduleId) +
        '/checkout/status',
        {
          method: 'POST',
          timeoutMs: Math.min(
            Number(CONFIG.API_TIMEOUT_MS || 30000),
            30000
          ),
          requestId: clientRequestId,
          body
        }
      );

      return response.data;
    },

    async checkout(
      moduleId,
      record
    ) {
      const body = record && typeof record === 'object'
        ? { ...record }
        : {};
      const clientRequestId = String(
        body.clientRequestId || body.requestId || createRequestId()
      ).trim();
      body.clientRequestId = clientRequestId;
      body.requestId = clientRequestId;

      const response = await request(
        '/api/modules/' +
        encodeURIComponent(moduleId) +
        '/checkout',
        {
          method: 'POST',
          timeoutMs: Math.min(
            Number(CONFIG.SAVE_TIMEOUT_MS || 60000),
            45000
          ),
          requestId: clientRequestId,
          body
        }
      );

      return response.data;
    },

    async getAdminDashboard(
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/admin/dashboard',
          {
            query: {
              auditLimit:
                config.auditLimit || 30
            }
          }
        );

      return response.data;
    },

    async getAdminUiSchema() {
      const response =
        await request(
          '/api/admin/ui-schema'
        );

      return response.data;
    },

    async getAdminNewModuleTemplate() {
      const response =
        await request(
          '/api/admin/modules/new-template'
        );

      return response.data;
    },

    async getAdminModuleBundle(
      moduleId
    ) {
      const response =
        await request(
          '/api/admin/modules/' +
          encodeURIComponent(
            moduleId
          )
        );

      return response.data;
    },

    async inspectAdminSource(
      payload
    ) {
      const response =
        await request(
          '/api/admin/source-metadata',
          {
            method:
              'POST',

            body:
              payload || {}
          }
        );

      return response.data;
    },

    async saveAdminModuleBundle(
      payload
    ) {
      const response =
        await request(
          '/api/admin/modules/save',
          {
            method:
              'POST',

            body:
              payload || {}
          }
        );

      return response.data;
    },

    async duplicateAdminModule(
      payload
    ) {
      const response =
        await request(
          '/api/admin/modules/duplicate',
          {
            method:
              'POST',

            body:
              payload || {}
          }
        );

      return response.data;
    },

    async archiveAdminModule(
      moduleId
    ) {
      const response =
        await request(
          '/api/admin/modules/archive',
          {
            method:
              'POST',

            body: {
              moduleId
            }
          }
        );

      return response.data;
    },

    async getAdminUsers() {
      const response =
        await request(
          '/api/admin/users'
        );

      return response.data;
    },

    async saveAdminUser(
      payload
    ) {
      const response =
        await request(
          '/api/admin/users/save',
          {
            method:
              'POST',

            body:
              payload || {}
          }
        );

      return response.data;
    },

    async resetAdminUserPassword(
      payload
    ) {
      const response =
        await request(
          '/api/admin/users/reset-password',
          {
            method:
              'POST',

            body:
              payload || {}
          }
        );

      return response.data;
    },

    async unlockAdminUser(
      userId
    ) {
      const response =
        await request(
          '/api/admin/users/unlock',
          {
            method:
              'POST',

            body: {
              userId
            }
          }
        );

      return response.data;
    },

    async saveAdminSettings(
      payload
    ) {
      const source =
        payload &&
        typeof payload === 'object' &&
        !Array.isArray(payload)
          ? payload
          : {};
      const body =
        source.settings &&
        typeof source.settings === 'object'
          ? { ...source }
          : {
              settings: source
            };
      const clientRequestId = String(
        body.clientRequestId ||
        body.requestId ||
        createRequestId()
      );
      body.clientRequestId = clientRequestId;
      body.requestId = clientRequestId;

      const response =
        await request(
          '/api/admin/settings',
          {
            method:
              'POST',
            requestId:
              clientRequestId,
            body:
              body
          }
        );

      return response.data;
    },

    async getAdminAudit(
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/admin/audit',
          {
            query: {
              limit:
                config.limit || 50,

              username:
                config.username || '',

              moduleId:
                config.moduleId || '',

              action:
                config.action || ''
            }
          }
        );

      return response.data;
    },


    async getAdminAutoCloseStatus() {
      const response =
        await request(
          '/api/admin/auto-close/status'
        );

      return response.data;
    },

    async previewAdminAutoClose(
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/admin/auto-close/preview',
          {
            method:
              'POST',

            timeoutMs:
              120000,

            body: {
              moduleId:
                config.moduleId || '',

              maxClose:
                config.maxClose || 200
            }
          }
        );

      return response.data;
    },

    async runAdminAutoClose(
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/admin/auto-close/run',
          {
            method:
              'POST',

            timeoutMs:
              180000,

            body: {
              moduleId:
                config.moduleId || '',

              maxClose:
                config.maxClose || 200
            }
          }
        );

      return response.data;
    },

    async getAdminAutoCloseHistory(
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/admin/auto-close/history',
          {
            query: {
              limit:
                config.limit || 50,

              moduleId:
                config.moduleId || '',

              result:
                config.result || '',

              requestId:
                config.requestId || ''
            }
          }
        );

      return response.data;
    },


    async getAdminWorkflowSyncStatus(
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/admin/workflow-sync/status',
          {
            query: {
              moduleId:
                config.moduleId || '',

              limit:
                config.limit || 300,

              forceRefresh:
                config.forceRefresh === true
                  ? 'true'
                  : ''
            },

            timeoutMs:
              120000
          }
        );

      return response.data;
    },


    async previewAdminWorkflowSync(
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/admin/workflow-sync/preview',
          {
            method:
              'POST',

            timeoutMs:
              120000,

            body: {
              moduleId:
                config.moduleId || '',

              limit:
                config.limit || 300,

              eventIds:
                Array.isArray(config.eventIds)
                  ? config.eventIds
                  : [],

              includeSynced:
                config.includeSynced === true,

              includeBlocked:
                config.includeBlocked !== false,

              includeErrors:
                config.includeErrors !== false
            }
          }
        );

      return response.data;
    },


    async repairAdminWorkflowSync(
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/admin/workflow-sync/repair',
          {
            method:
              'POST',

            timeoutMs:
              240000,

            body: {
              moduleId:
                config.moduleId || '',

              eventIds:
                Array.isArray(config.eventIds)
                  ? config.eventIds
                  : [],

              maxRepair:
                config.maxRepair || 20,

              scanLimit:
                config.scanLimit || 300
            }
          }
        );

      return response.data;
    },


    async getAdminWorkflowSyncHistory(
      options
    ) {
      const config =
        options &&
        typeof options === 'object'
          ? options
          : {};

      const response =
        await request(
          '/api/admin/workflow-sync/history',
          {
            query: {
              moduleId:
                config.moduleId || '',

              result:
                config.result || '',

              limit:
                config.limit || 50
            },

            timeoutMs:
              120000
          }
        );

      return response.data;
    },


    async getManagementReportingConfig(moduleId) {
      const response = await request('/api/admin/management-report/config/' + encodeURIComponent(moduleId));
      return response.data;
    },

    async createManagementReportPackage(moduleId, options) {
      const response = await request('/api/admin/management-report/create/' + encodeURIComponent(moduleId), {
        method: 'POST', timeoutMs: 240000, body: options || {}
      });
      return response.data;
    },

    async createAllWorkflowStagesExport(moduleId, options) {
      const response = await request('/api/admin/management-report/all-stages/' + encodeURIComponent(moduleId), {
        method: 'POST', timeoutMs: 300000, body: options || {}
      });
      return response.data;
    },

    async getManagementReportJobStatus(jobId) {
      const response = await request(
        '/api/admin/management-report/job/' + encodeURIComponent(jobId),
        { timeoutMs: 60000 }
      );
      return response.data;
    },

    async getManagementReportDownloadMeta(
      exportId
    ) {
      const response =
        await request(
          '/api/admin/management-report/download/' +
          encodeURIComponent(
            exportId
          ) +
          '/meta',
          {
            timeoutMs:
              60000
          }
        );

      return response.data;
    },


    async getManagementReportDownloadChunk(
      exportId,
      offset,
      size
    ) {
      const response =
        await request(
          '/api/admin/management-report/download/' +
          encodeURIComponent(
            exportId
          ) +
          '/chunk',
          {
            query: {
              offset:
                Number(
                  offset ||
                  0
                ),

              size:
                Number(
                  size ||
                  524288
                )
            },

            timeoutMs:
              90000
          }
        );

      return response.data;
    },


    async downloadManagementReportFile(
      exportId,
      options
    ) {
      const config =
        options &&
        typeof options ===
          'object'
          ? options
          : {};

      const meta =
        await this
          .getManagementReportDownloadMeta(
            exportId
          );

      const chunkSize =
        Number(
          meta.chunkSize ||
          524288
        );

      const sizeBytes =
        Number(
          meta.sizeBytes ||
          0
        );

      const chunks = [];
      let offset =
        0;

      while (
        offset <
        sizeBytes
      ) {
        const data =
          await this
            .getManagementReportDownloadChunk(
              exportId,
              offset,
              chunkSize
            );

        const binary =
          window.atob(
            String(
              data.base64 ||
              ''
            )
          );

        const bytes =
          new Uint8Array(
            binary.length
          );

        for (
          let index = 0;
          index <
            binary.length;
          index += 1
        ) {
          bytes[index] =
            binary.charCodeAt(
              index
            );
        }

        chunks.push(
          bytes
        );

        const nextOffset =
          Number(
            data.nextOffset
          );

        if (
          !Number.isFinite(
            nextOffset
          ) ||
          nextOffset <=
            offset
        ) {
          throw new VehicleAPIError(
            'ระบบดาวน์โหลดส่งตำแหน่งไฟล์ไม่ถูกต้อง',
            'DOWNLOAD_PROGRESS_INVALID',
            0,
            {
              offset:
                offset,
              nextOffset:
                nextOffset
            }
          );
        }

        offset =
          nextOffset;

        if (
          typeof config.onProgress ===
            'function'
        ) {
          config.onProgress({
            loadedBytes:
              offset,

            totalBytes:
              sizeBytes,

            percent:
              sizeBytes > 0
                ? Math.min(
                    100,
                    Math.round(
                      (
                        offset /
                        sizeBytes
                      ) *
                      100
                    )
                  )
                : 100
          });
        }
      }

      const blob =
        new Blob(
          chunks,
          {
            type:
              meta.mimeType ||
              'application/octet-stream'
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      const anchor =
        document.createElement(
          'a'
        );

      anchor.href =
        url;

      anchor.download =
        meta.filename ||
        'AlertVendor-Export';

      document.body.appendChild(
        anchor
      );

      anchor.click();
      anchor.remove();

      window.setTimeout(
        () =>
          URL.revokeObjectURL(
            url
          ),
        5000
      );

      return {
        ...meta,
        downloaded:
          true
      };
    },


    async listManagementReportExports(moduleId, options) {
      const config = options && typeof options === 'object' ? options : {};
      const response = await request('/api/admin/management-report/exports/' + encodeURIComponent(moduleId), {
        query: { limit: clampInteger(config.limit, 1, 100, 20) }, timeoutMs: 120000
      });
      return response.data;
    },

    async cleanupManagementReportFiles() {
      const response = await request('/api/admin/management-report/cleanup', { method: 'POST', body: {}, timeoutMs: 120000 });
      return response.data;
    },

    async getVcwRouterCleanupStatus() {
      const response = await request(
        '/api/admin/diagnostics/router-cleanup',
        { timeoutMs: 60000 }
      );
      return response.data;
    },

    async enableVcwRouterStrictMode(options) {
      const response = await request(
        '/api/admin/diagnostics/router-cleanup/enable',
        {
          method: 'POST',
          timeoutMs: 60000,
          body: options || {}
        }
      );
      return response.data;
    },

    async disableVcwRouterStrictMode(options) {
      const response = await request(
        '/api/admin/diagnostics/router-cleanup/disable',
        {
          method: 'POST',
          timeoutMs: 60000,
          body: options || {}
        }
      );
      return response.data;
    },

    async resetVcwFallbackCounters(options) {
      const response = await request(
        '/api/admin/diagnostics/router-cleanup/reset',
        {
          method: 'POST',
          timeoutMs: 60000,
          body: options || {}
        }
      );
      return response.data;
    },

    async runProductionAcceptance(options) {
      const response=await request('/api/admin/diagnostics/acceptance',{method:'POST',timeoutMs:180000,body:{options:options||{}}});return response.data;
    },

    async runProductionConcurrencyProbe(payload) {
      const response=await request('/api/admin/diagnostics/concurrency',{method:'POST',timeoutMs:60000,body:payload||{}});return response.data;
    },

    async finalizeProductionConcurrencyProbe(probeId) {
      const response=await request('/api/admin/diagnostics/concurrency/finalize',{method:'POST',timeoutMs:60000,body:{probeId:String(probeId||'').trim()}});return response.data;
    },

    async runProductionDiagnostics(
      options
    ) {
      const response =
        await request(
          '/api/admin/diagnostics',
          {
            method:
              'POST',

            timeoutMs:
              120000,

            body: {
              options:
                options || {}
            }
          }
        );

      return response.data;
    },

    getClientPerformanceTrace() {
      return readClientPerformanceTrace();
    },

    clearClientPerformanceTrace() {
      try {
        window.sessionStorage.removeItem(API_PERFORMANCE_STORAGE_KEY);
      } catch (error) {
        /* Diagnostics only */
      }
      return { success: true };
    },

    getForegroundWriteState() {
      return foregroundWriteCoordinator.snapshot();
    },

    async validateAdminSystem() {
      const response =
        await request(
          '/api/admin/validate',
          {
            method:
              'POST',

            body:
              {}
          }
        );

      return response.data;
    }
  };

  window.VehicleAPI =
    VehicleAPI;

})(window);


/* ============================================================
 * SOURCE 03: admin(9).js
 * ============================================================ */
/**
 * admin.js
 * หน้า Admin สำหรับจัดการโมดูล Vendor ผู้ใช้งาน การตั้งค่า และ Audit
 *
 * ปรับปรุง:
 * - ตรวจข้อมูลโมดูลครบทุกข้อก่อนส่ง
 * - แสดงข้อผิดพลาดหลายรายการผ่าน SweetAlert2
 * - ป้องกันกดบันทึกโมดูลซ้ำ
 * - รองรับรายละเอียด Validation จาก Apps Script/Worker
 * - เลื่อนไปยังช่องที่ต้องแก้ไขโดยอัตโนมัติ
 * - รักษาการเลื่อนภายใน Module Editor
 * - รองรับตัวเลือก “อื่นๆ” และกรอกเวลา Auto Close เอง
 * - รองรับเวลา Auto Close แบบกำหนดเองตั้งแต่ 1–168 ชั่วโมง
 * - Admin เปิด/ปิด Receiving Flow แยกตาม Module
 * - Dashboard Admin รีเฟรชเงียบโดยไม่รบกวนผู้ใช้
 */
(function (window, document) {
  'use strict';

  const CONFIG = window.APP_CONFIG || {};
  const API = window.VehicleAPI;
  const ADMIN_SETTINGS_CACHE_KEY = 'SMARTALERT_ADMIN_AUTHORITATIVE_SETTINGS_V2';
  const ADMIN_SETTINGS_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
  const ADMIN_WORKFLOW_SETTING_KEYS = Object.freeze([
    'INBOUND_WORKFLOW_ENABLED',
    'INBOUND_SUBMIT_SCAN_REQUIRED',
    'INBOUND_RETURN_SCAN_REQUIRED'
  ]);

  const state = {
    session: null,
    dashboard: null,
    schema: null,
    currentTab: 'overview',
    currentBundle: null,
    currentExpectedUpdatedAt: '',
    sourceMetadata: null,
    clockTimer: null,
    silentRefreshTimer: null,
    dashboardSignature: '',
    destroyed: false,
    loading: false,
    moduleSaving: false,
    slaLoading: false,
    slaSaving: false,
    slaLoadedModuleId: '',
    slaData: null,
    alertEngineLoading: false,
    alertEngineActionRunning: false,
    alertEngineData: null,
    diagnosticsRunning: false,
    vcwCleanupStatus: null,
    diagnosticsResult: null,
    moduleValidationTouched: false,
    moduleValidationTimer: null,
    moduleValidationRunning: false,
    settingsDirty: false,
    settingsSaveInFlight: false,
    settingsSource: 'SERVER',
    settingsLastConfirmedAt: '',
    savedSettingsSignature: ''
  };

  const LABELS = {
    moduleStatus: {
      DRAFT: 'ฉบับร่าง',
      ADMIN_ONLY: 'เฉพาะ Admin',
      PUBLISHED: 'เปิดใช้งาน'
    },

    operators: {
      EQUALS: 'เท่ากับ',
      NOT_EQUALS: 'ไม่เท่ากับ',
      CONTAINS: 'มีคำว่า',
      NOT_CONTAINS: 'ไม่มีคำว่า',
      STARTS_WITH: 'ขึ้นต้นด้วย',
      ENDS_WITH: 'ลงท้ายด้วย',
      IS_EMPTY: 'ว่าง',
      IS_NOT_EMPTY: 'ไม่ว่าง'
    },

    fieldTypes: {
      TEXT: 'ข้อความ',
      CONCAT: 'รวมหลายคอลัมน์',
      PHONE: 'เบอร์โทรศัพท์',
      DATE_TIME: 'วันที่และเวลา',
      NUMBER: 'ตัวเลข',
      DURATION: 'ระยะเวลา',
      STATUS: 'สถานะ'
    },

    fieldPositions: {
      HEADER: 'ส่วนหัว',
      BODY: 'เนื้อหาการ์ด',
      FOOTER: 'ส่วนท้าย',
      HIDDEN: 'ซ่อน'
    },

    roles: {
      ADMIN: 'ผู้ดูแลระบบ',
      USER: 'ผู้ใช้งานทั่วไป',
      INBOUND: 'ห้อง Inbound'
    }
  };

  document.addEventListener('DOMContentLoaded', initializeAdminPage);
  window.addEventListener('beforeunload', handleAdminBeforeUnload);
  window.addEventListener('beforeunload', destroyAdminPage);

  async function initializeAdminPage() {
    if (!API || typeof Swal === 'undefined') {
      window.alert('ไม่พบไฟล์ระบบที่จำเป็น');
      return;
    }

    bindStaticEvents();
    startClock();
    showPageLoading(true);

    try {
      const session = await withAdminBootTimeout(
        API.me(),
        18000,
        'ตรวจสอบ Session ผู้ดูแลระบบนานเกินไป'
      );

      if (
        !session ||
        !session.authenticated ||
        !session.user ||
        session.user.role !== 'ADMIN'
      ) {
        throw createLocalError(
          'ADMIN_REQUIRED',
          'หน้านี้สำหรับผู้ดูแลระบบเท่านั้น'
        );
      }

      state.session = session;
      setText(
        'adminCurrentUser',
        session.user.displayName || session.user.username || 'Admin'
      );

      const [schemaResult, dashboardResult] = await Promise.allSettled([
        withAdminBootTimeout(
          API.getAdminUiSchema(),
          20000,
          'โหลดโครงสร้างหน้า Admin นานเกินไป'
        ),
        withAdminBootTimeout(
          API.getAdminDashboard({ auditLimit: 20 }),
          22000,
          'โหลดข้อมูลหน้า Admin นานเกินไป'
        )
      ]);

      state.schema =
        schemaResult.status === 'fulfilled'
          ? schemaResult.value
          : buildAdminBootFallbackSchema();

      state.dashboard =
        dashboardResult.status === 'fulfilled'
          ? dashboardResult.value
          : buildAdminBootFallbackDashboard(session);

      initializeAuthoritativeAdminSettings(
        state.dashboard,
        dashboardResult.status === 'fulfilled'
      );

      state.dashboardSignature =
        buildAdminDashboardSignature(
          state.dashboard
        );

      renderAll();

      if (
        schemaResult.status !== 'fulfilled' ||
        dashboardResult.status !== 'fulfilled'
      ) {
        toast(
          'เปิดหน้า Admin แบบกู้คืนชั่วคราวได้แล้ว กรุณากดรีเฟรชอีกครั้งหลัง Deploy เสร็จ',
          'warning'
        );
      }

      startSilentDashboardRefresh();
      loadVcwCleanupStatus(false).catch(() => {});
    } catch (error) {
      showPageLoading(false);
      await handleFatalError(error);
      return;
    } finally {
      showPageLoading(false);
    }
  }


  function withAdminBootTimeout(promise, timeoutMs, message) {
    return new Promise((resolve, reject) => {
      let settled = false;

      const timer = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        reject(
          createLocalError(
            'ADMIN_BOOT_TIMEOUT',
            message || 'โหลดข้อมูลหลังบ้านนานเกินไป'
          )
        );
      }, Math.max(5000, Number(timeoutMs) || 15000));

      Promise.resolve(promise)
        .then((value) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          resolve(value);
        })
        .catch((error) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timer);
          reject(error);
        });
    });
  }


  function buildAdminBootFallbackSchema() {
    return {
      version: 'frontend-fallback-2026.07.20',
      enums: {
        userRoles: ['USER', 'INBOUND', 'ADMIN'],
        moduleStatuses: ['DRAFT', 'PUBLISHED', 'DISABLED', 'ADMIN_ONLY', 'ARCHIVED'],
        currentStatusMethods: [
          'TIMESTAMP_OUT_EMPTY',
          'TIMESTAMP_OUT_EMPTY_AND_DURATION_EMPTY',
          'CUSTOM_COLUMN'
        ],
        filterOperators: [
          'EQUALS',
          'NOT_EQUALS',
          'CONTAINS',
          'NOT_CONTAINS',
          'STARTS_WITH',
          'ENDS_WITH',
          'EMPTY',
          'NOT_EMPTY'
        ],
        filterConnectors: ['AND', 'OR'],
        fieldTypes: ['TEXT', 'NUMBER', 'DATETIME', 'DATE', 'TIME', 'BADGE', 'DURATION'],
        fieldPositions: ['PRIMARY', 'SECONDARY', 'DETAIL', 'FOOTER', 'HIDDEN']
      },
      defaults: {
        moduleId: 'vendors',
        sourceSheetName: 'Sheet1',
        headerRow: 1,
        timestampInColumn: 'B',
        timestampOutColumn: 'O',
        durationColumn: 'P',
        warningStartMinutes: 60,
        redStartMinutes: 120,
        alertRepeatMinutes: 10,
        refreshSeconds: 15,
        historyMonths: 12
      }
    };
  }


  function buildAdminBootFallbackDashboard(session) {
    const user =
      session &&
      session.user
        ? session.user
        : {};

    return {
      version: 'frontend-fallback-2026.07.20',
      generatedAt: formatBangkokDateTime(new Date()),
      actor: {
        username: user.username || 'admin',
        role: 'ADMIN'
      },
      capabilities: {
        moduleManagement: true,
        userManagement: true,
        settingsManagement: true,
        auditViewer: true,
        sourceInspector: true,
        permanentModuleDelete: false
      },
      settings: {
        SYSTEM_NAME: { value: 'SmartAlert Vendor Workflow', updatedAt: '', updatedBy: 'SYSTEM' },
        AUTO_CLOSE_HOURS: { value: 36, updatedAt: '', updatedBy: 'SYSTEM' },
        DEFAULT_REFRESH_SECONDS: { value: 15, updatedAt: '', updatedBy: 'SYSTEM' },
        SESSION_TIMEOUT_MINUTES: { value: 720, updatedAt: '', updatedBy: 'SYSTEM' },
        MAX_LOGIN_FAILURES: { value: 5, updatedAt: '', updatedBy: 'SYSTEM' },
        LOGIN_LOCK_MINUTES: { value: 15, updatedAt: '', updatedBy: 'SYSTEM' },
        SWEETALERT_ENABLED: { value: true, updatedAt: '', updatedBy: 'SYSTEM' },
        INBOUND_WORKFLOW_ENABLED: { value: true, updatedAt: '', updatedBy: 'SYSTEM', revision: 'WF-PROFILE-LEGACY-FULL' },
        INBOUND_SUBMIT_SCAN_REQUIRED: { value: true, updatedAt: '', updatedBy: 'SYSTEM', revision: 'WF-PROFILE-LEGACY-FULL' },
        INBOUND_RETURN_SCAN_REQUIRED: { value: true, updatedAt: '', updatedBy: 'SYSTEM', revision: 'WF-PROFILE-LEGACY-FULL' }
      },
      modules: [],
      users: [
        {
          userId: user.userId || '',
          username: user.username || 'admin',
          displayName: user.displayName || 'ผู้ดูแลระบบ',
          role: 'ADMIN',
          active: true,
          mustChangePassword: false,
          lastLoginAt: '',
          failedLoginCount: 0,
          lockedAt: '',
          updatedAt: ''
        }
      ],
      recentAudit: [],
      structure: {
        success: false,
        sheets: [
          {
            sheetName: 'กำลังรอข้อมูลจาก Apps Script',
            exists: true,
            rowCount: 0,
            columnCount: 0,
            missingHeaders: []
          }
        ]
      }
    };
  }


  function bindStaticEvents() {
    document.querySelectorAll('[data-admin-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        switchTab(button.dataset.adminTab || 'overview');
      });
    });

    document.querySelectorAll('[data-go-tab]').forEach((button) => {
      button.addEventListener('click', () => {
        switchTab(button.dataset.goTab || 'overview');
      });
    });

    byId('adminRefreshButton')?.addEventListener('click', refreshDashboard);
    byId('adminLogoutButton')?.addEventListener('click', logout);
    byId('adminValidateQuickButton')?.addEventListener('click', () => validateSystem('QUICK'));
    byId('adminDiagnosticsQuickButton')?.addEventListener('click', () => validateSystem('QUICK'));
    byId('adminValidateSystemButton')?.addEventListener('click', () => validateSystem('DEEP'));
    byId('adminAcceptanceButton')?.addEventListener('click', runProductionAcceptance);
    byId('adminDiagnosticsExportButton')?.addEventListener('click', exportProductionDiagnosticReport);
    byId('adminVcwCleanupRefreshButton')?.addEventListener('click', () => loadVcwCleanupStatus(true));
    byId('adminVcwFallbackResetButton')?.addEventListener('click', resetVcwFallbackCounters);
    byId('adminVcwStrictEnableButton')?.addEventListener('click', enableVcwStrictMode);
    byId('adminVcwStrictDisableButton')?.addEventListener('click', disableVcwStrictMode);
    byId('adminCreateModuleButton')?.addEventListener('click', createNewModule);
    byId('adminCreateUserButton')?.addEventListener('click', () => openUserDialog(null));
    byId('adminSettingsForm')?.addEventListener('submit', saveSettings);
    byId('adminSettingsDiscardButton')?.addEventListener(
      'click',
      discardAdminSettingsDraft
    );
    byId('adminSettingsFields')?.addEventListener(
      'change',
      handleAdminSettingFieldChange
    );
    byId('adminSlaModuleSelect')?.addEventListener(
      'change',
      () => loadAdminSlaRules(true)
    );
    byId('adminSlaReloadButton')?.addEventListener(
      'click',
      () => loadAdminSlaRules(true)
    );
    byId('adminSlaSetupButton')?.addEventListener(
      'click',
      setupAdminSlaRules
    );
    byId('adminSlaSaveButton')?.addEventListener(
      'click',
      saveAdminSlaRules
    );
    byId('adminSlaRuleGrid')?.addEventListener(
      'change',
      handleAdminSlaRuleChange
    );
    byId('adminAlertEngineSetupButton')?.addEventListener('click', setupAdminAlertEngine);
    byId('adminAlertEngineToggleButton')?.addEventListener('click', toggleAdminAlertEngine);
    byId('adminAlertEngineRunButton')?.addEventListener('click', runAdminAlertEngineNow);
    byId('adminAlertEngineRefreshButton')?.addEventListener('click', () => loadAdminAlertEngine(true));
    byId('adminAuditFilterForm')?.addEventListener('submit', loadAuditFromFilter);

    byId('adminCloseModuleEditorButton')?.addEventListener('click', closeModuleEditor);
    byId('adminCancelModuleButton')?.addEventListener('click', closeModuleEditor);
    byId('adminEditorBackdrop')?.addEventListener('click', closeModuleEditor);
    const moduleForm =
      byId('adminModuleForm');

    moduleForm?.addEventListener(
      'submit',
      saveModule
    );

    moduleForm?.addEventListener(
      'input',
      handleModuleValidationInput
    );

    moduleForm?.addEventListener(
      'change',
      handleModuleValidationInput
    );

    moduleForm?.addEventListener(
      'click',
      handleModuleValidationSummaryClick
    );

    byId('adminAddFilterButton')?.addEventListener('click', () => addFilterRow());
    byId('adminAddFieldButton')?.addEventListener('click', () => addFieldRow());
    byId('adminInspectSourceButton')?.addEventListener('click', inspectSource);

    byId('adminModuleList')?.addEventListener('click', handleModuleListClick);
    byId('adminUserList')?.addEventListener('click', handleUserListClick);
    byId('adminFilterRows')?.addEventListener('click', handleDynamicRowClick);
    byId('adminFieldRows')?.addEventListener('click', handleDynamicRowClick);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !byId('adminModuleEditor')?.classList.contains('is-hidden')) {
        closeModuleEditor();
      }
    });
  }

  function renderAll() {
    const dashboard = state.dashboard || {};

    setText(
      'adminGeneratedAt',
      dashboard.generatedAt
        ? 'โหลดข้อมูลล่าสุด ' + dashboard.generatedAt
        : 'โหลดข้อมูลแล้ว'
    );

    renderOverview();
    renderModules();
    renderUsers();
    renderSettings();
    renderAdminSlaModuleOptions();
    renderAudit(dashboard.recentAudit || [], 'adminRecentAudit');
    renderAudit(dashboard.recentAudit || [], 'adminAuditList');
  }

  function renderOverview() {
    const dashboard = state.dashboard || {};
    const modules = Array.isArray(dashboard.modules) ? dashboard.modules : [];
    const users = Array.isArray(dashboard.users) ? dashboard.users : [];
    const structure = dashboard.structure || {};

    setText('adminModuleCount', String(modules.length));
    setText(
      'adminPublishedCount',
      String(modules.filter((item) => item.status === 'PUBLISHED').length)
    );
    setText('adminUserCount', String(users.length));
    setText('adminStructureStatus', structure.success ? 'พร้อม' : 'ต้องแก้ไข');

    const container = byId('adminStructureList');
    if (!container) return;

    const sheets = Array.isArray(structure.sheets) ? structure.sheets : [];

    if (sheets.length === 0) {
      container.innerHTML = emptyHtml('ไม่พบข้อมูลโครงสร้างระบบ');
      return;
    }

    container.innerHTML = sheets.map((item) => {
      const ok = item.exists && (!item.missingHeaders || item.missingHeaders.length === 0);
      const detail = !item.exists
        ? 'ไม่พบชีต'
        : item.missingHeaders && item.missingHeaders.length
          ? 'ขาด: ' + item.missingHeaders.join(', ')
          : (Number(item.rowCount || 0) + ' แถวข้อมูล');

      return `
        <div class="admin-status-item" data-status="${ok ? 'OK' : 'ERROR'}">
          <span class="admin-status-dot"></span>
          <div>
            <strong>${escapeHtml(item.sheetName || '-')}</strong>
            <small>${escapeHtml(detail)}</small>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderModules() {
    const container = byId('adminModuleList');
    if (!container) return;

    const modules = Array.isArray(state.dashboard?.modules)
      ? state.dashboard.modules
      : [];

    if (modules.length === 0) {
      container.innerHTML = emptyHtml('ยังไม่มีโมดูล', 'กด “สร้างโมดูลใหม่” เพื่อเพิ่ม Vendor หรือประเภทรถ');
      return;
    }

    container.innerHTML = modules.map((item) => {
      const statusLabel = LABELS.moduleStatus[item.status] || item.status || '-';
      return `
        <article class="admin-module-card" data-module-id="${escapeHtml(item.moduleId)}">
          <div class="admin-module-card__head">
            <div>
              <span class="admin-badge" data-status="${escapeHtml(item.status || 'DRAFT')}">
                ${escapeHtml(statusLabel)}
              </span>
              <h3>${escapeHtml(item.name || item.moduleId || '-')}</h3>
              <p>${escapeHtml(item.description || 'ไม่มีคำอธิบาย')}</p>
            </div>
            <strong class="admin-module-card__id">${escapeHtml(item.moduleId || '-')}</strong>
          </div>

          <div class="admin-module-card__source">
            <span>แหล่งข้อมูล</span>
            <strong>${escapeHtml(item.sourceSheetName || '-')}</strong>
            <small>${escapeHtml(shortId(item.sourceSpreadsheetId || ''))}</small>
          </div>

          <div class="admin-module-card__stats">
            <div><span>เงื่อนไข</span><strong>${Number(item.filterCount || 0)}</strong></div>
            <div><span>ฟิลด์</span><strong>${Number(item.fieldCount || 0)}</strong></div>
            <div><span>สีส้ม</span><strong>${Number(item.warningStartMinutes || 0)} นาที</strong></div>
            <div><span>สีแดง</span><strong>${Number(item.redStartMinutes || 0)} นาที</strong></div>
          </div>

          <div class="admin-module-card__flags">
            ${flagHtml('User', item.showToUsers)}
            ${flagHtml('Alert', item.alertEnabled)}
            ${flagHtml('Checkout', item.checkoutEnabled)}
            ${flagHtml('Receiving', item.receivingEnabled)}
            ${flagHtml('Calendar', item.calendarEnabled)}
          </div>

          <div class="admin-module-card__meta">
            แก้ไข ${escapeHtml(item.updatedAt || '-')} โดย ${escapeHtml(item.updatedBy || '-')}
          </div>

          <div class="admin-module-card__actions">
            <button class="button button--primary button--compact" type="button" data-module-action="edit">
              แก้ไข
            </button>
            <button class="button button--secondary button--compact" type="button" data-module-action="duplicate">
              คัดลอก
            </button>
            <button class="button button--danger-ghost button--compact" type="button" data-module-action="archive">
              เก็บเป็นร่าง
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderUsers() {
    const container = byId('adminUserList');
    if (!container) return;

    const users = Array.isArray(state.dashboard?.users)
      ? state.dashboard.users
      : [];

    if (users.length === 0) {
      container.innerHTML = emptyHtml('ยังไม่มีข้อมูลผู้ใช้งาน');
      return;
    }

    container.innerHTML = users.map((user) => `
      <article class="admin-user-card" data-user-id="${escapeHtml(user.userId || '')}">
        <div class="admin-user-card__identity">
          <div class="admin-user-avatar">
            ${escapeHtml((user.displayName || user.username || '?').slice(0, 1).toUpperCase())}
          </div>
          <div>
            <h3>${escapeHtml(user.displayName || user.username || '-')}</h3>
            <span>${escapeHtml(user.username || '-')}</span>
          </div>
        </div>

        <div class="admin-user-card__badges">
          <span class="admin-badge" data-role="${escapeHtml(user.role || 'USER')}">
            ${escapeHtml(LABELS.roles[user.role] || user.role || '-')}
          </span>
          <span class="admin-badge" data-active="${user.active ? 'TRUE' : 'FALSE'}">
            ${user.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
          </span>
          ${user.mustChangePassword ? '<span class="admin-badge" data-warning="TRUE">ต้องเปลี่ยนรหัส</span>' : ''}
          ${user.lockedAt ? '<span class="admin-badge" data-danger="TRUE">ถูกล็อก</span>' : ''}
        </div>

        <div class="admin-user-card__detail">
          <span>เข้าสู่ระบบล่าสุด <strong>${escapeHtml(user.lastLoginAt || '-')}</strong></span>
          <span>กรอกรหัสผิด <strong>${Number(user.failedLoginCount || 0)} ครั้ง</strong></span>
          <span>แก้ไขล่าสุด <strong>${escapeHtml(user.updatedAt || '-')}</strong></span>
        </div>

        <div class="admin-user-card__actions">
          <button class="button button--secondary button--compact" type="button" data-user-action="edit">
            แก้ไข
          </button>
          <button class="button button--secondary button--compact" type="button" data-user-action="reset-password">
            รีเซ็ตรหัสผ่าน
          </button>
          <button class="button button--secondary button--compact" type="button" data-user-action="unlock" ${user.lockedAt || Number(user.failedLoginCount || 0) > 0 ? '' : 'disabled'}>
            ปลดล็อก
          </button>
        </div>
      </article>
    `).join('');
  }

  /* BASELINE 2 FINAL HOTFIX 5 REVISION 1 — Workflow Profile + Profile-aware Timing UI */
  function syncAdminWorkflowProfileControls() {
    const master = document.querySelector('[data-setting-key="INBOUND_WORKFLOW_ENABLED"]');
    const submit = document.querySelector('[data-setting-key="INBOUND_SUBMIT_SCAN_REQUIRED"]');
    const returned = document.querySelector('[data-setting-key="INBOUND_RETURN_SCAN_REQUIRED"]');
    if (!master || !submit || !returned) return;
    const enabled = master.checked === true;
    submit.disabled = !enabled;
    returned.disabled = !enabled;
    if (!enabled) {
      submit.checked = false;
      returned.checked = false;
    }
  }

  function renderAdminWorkflowProfilePreview() {
    const container = document.getElementById('adminSettingsFields');
    if (!container) return;
    syncAdminWorkflowProfileControls();
    const master = document.querySelector('[data-setting-key="INBOUND_WORKFLOW_ENABLED"]');
    const submit = document.querySelector('[data-setting-key="INBOUND_SUBMIT_SCAN_REQUIRED"]');
    const returned = document.querySelector('[data-setting-key="INBOUND_RETURN_SCAN_REQUIRED"]');
    if (!master || !submit || !returned) return;
    const enabled = master.checked === true;
    const submitRequired = enabled && submit.checked === true;
    const returnRequired = enabled && returned.checked === true;
    let code = 'BYPASS_INBOUND';
    if (submitRequired && returnRequired) code = 'FULL_INBOUND';
    else if (submitRequired) code = 'SUBMIT_ONLY';
    else if (returnRequired) code = 'RETURN_ONLY';
    const steps = ['Gate In'];
    if (submitRequired) steps.push('สแกนยื่นเอกสาร');
    steps.push('รับสินค้าเสร็จ');
    if (returnRequired) steps.push('สแกนคืนเอกสาร');
    steps.push('Gate Out');
    let preview = document.getElementById('adminWorkflowProfilePreview');
    if (!preview) {
      preview = document.createElement('section');
      preview.id = 'adminWorkflowProfilePreview';
      preview.className = 'admin-workflow-profile-preview';
      container.prepend(preview);
    }
    preview.innerHTML = `
      <div class="admin-workflow-profile-preview__header">
        <div><small>WORKFLOW PROFILE</small><strong>${escapeHtml(code)}</strong></div>
        <span>${
          state.settingsDirty
            ? 'ตัวอย่างที่ยังไม่ได้บันทึก'
            : (enabled ? 'ค่าที่บันทึกแล้ว · ใช้กับ Gate In ใหม่' : 'ค่าที่บันทึกแล้ว · ปิด Inbound รถใหม่')
        }</span>
      </div>
      <div class="admin-workflow-profile-preview__flow">${steps.map((step) => `<b>${escapeHtml(step)}</b>`).join('<i>→</i>')}</div>
      <div class="admin-workflow-profile-preview__timing">
        <span><b>เวลารอ Receiving</b> เริ่มจาก ${submitRequired ? 'เวลายื่นเอกสาร' : 'Gate In'}</span>
        <span><b>เวลารอ Gate Out</b> เริ่มจาก ${returnRequired ? 'เวลารับเอกสารคืน' : 'เวลารับสินค้าเสร็จ'}</span>
        <span><b>ขั้นตอนที่ปิด</b> แสดงเป็น NOT_APPLICABLE และไม่รวม SLA/Alert/ค่าเฉลี่ย</span>
      </div>
      <p>รถที่อยู่กลางกระบวนการจะใช้ Profile เดิมจนปิดงาน ระบบไม่ย้ายสถานะย้อนหลัง</p>
    `;
  }


  function adminSettingComparable(value) {
    if (value === true || value === false) return String(value);
    if (value === null || value === undefined) return '';
    if (typeof value === 'number') {
      return Number.isFinite(value) ? String(value) : '';
    }
    return String(value).trim();
  }

  function cloneAdminSettings(settings) {
    const source = settings && typeof settings === 'object' ? settings : {};
    try {
      return JSON.parse(JSON.stringify(source));
    } catch (error) {
      return Object.assign({}, source);
    }
  }

  function buildAdminSettingsSignature(settings) {
    const source = settings && typeof settings === 'object' ? settings : {};
    return JSON.stringify(
      Object.keys(source)
        .sort()
        .map((key) => [
          key,
          adminSettingComparable(source[key] && source[key].value),
          String(source[key] && source[key].revision || ''),
          String(source[key] && source[key].effectiveAt || '')
        ])
    );
  }

  function collectAdminSettingsFormValues() {
    const settings = collectAdminSettingsFormValues();

    return settings;
  }

  function adminSettingsMatchExpected(serverSettings, expectedValues) {
    const source = serverSettings && typeof serverSettings === 'object'
      ? serverSettings
      : {};
    const expected = expectedValues && typeof expectedValues === 'object'
      ? expectedValues
      : {};

    return Object.keys(expected).every((key) => (
      adminSettingComparable(source[key] && source[key].value) ===
      adminSettingComparable(expected[key])
    ));
  }

  function persistAuthoritativeAdminSettings(settings, meta) {
    const source = settings && typeof settings === 'object' ? settings : {};
    if (!Object.keys(source).length) return;

    try {
      window.localStorage.setItem(
        ADMIN_SETTINGS_CACHE_KEY,
        JSON.stringify({
          version: 2,
          savedAtMs: Date.now(),
          savedAt: formatBangkokDateTime(new Date()),
          source: String(meta && meta.source || 'SERVER'),
          settings: cloneAdminSettings(source)
        })
      );
    } catch (error) {
      console.warn('บันทึก Cache การตั้งค่า Admin ไม่สำเร็จ', error);
    }
  }

  function restoreAuthoritativeAdminSettings(dashboard) {
    try {
      const raw = window.localStorage.getItem(ADMIN_SETTINGS_CACHE_KEY);
      if (!raw) return false;

      const cached = JSON.parse(raw);
      const savedAtMs = Number(cached && cached.savedAtMs || 0);
      const settings = cached && cached.settings;

      if (
        !savedAtMs ||
        Date.now() - savedAtMs > ADMIN_SETTINGS_CACHE_MAX_AGE_MS ||
        !settings ||
        typeof settings !== 'object'
      ) {
        window.localStorage.removeItem(ADMIN_SETTINGS_CACHE_KEY);
        return false;
      }

      const hasWorkflowSettings = ADMIN_WORKFLOW_SETTING_KEYS.every(
        (key) => Object.prototype.hasOwnProperty.call(settings, key)
      );
      if (!hasWorkflowSettings) return false;

      dashboard.settings = Object.assign(
        {},
        dashboard.settings || {},
        cloneAdminSettings(settings)
      );
      state.settingsSource = 'CACHE';
      state.settingsLastConfirmedAt = String(cached.savedAt || '');
      return true;
    } catch (error) {
      console.warn('อ่าน Cache การตั้งค่า Admin ไม่สำเร็จ', error);
      return false;
    }
  }

  function initializeAuthoritativeAdminSettings(dashboard, authoritative) {
    if (!dashboard || typeof dashboard !== 'object') return;

    if (authoritative) {
      state.settingsSource = 'SERVER';
      state.settingsLastConfirmedAt =
        dashboard.generatedAt || formatBangkokDateTime(new Date());
      persistAuthoritativeAdminSettings(dashboard.settings || {}, {
        source: 'SERVER_BOOT'
      });
    } else if (!restoreAuthoritativeAdminSettings(dashboard)) {
      state.settingsSource = 'FALLBACK';
      state.settingsLastConfirmedAt = '';
    }

    state.savedSettingsSignature =
      buildAdminSettingsSignature(dashboard.settings || {});
    state.settingsDirty = false;
  }

  function updateAdminSettingsSaveBar() {
    const bar = byId('adminSettingsSaveBar');
    const status = byId('adminSettingsSaveStatus');
    const detail = byId('adminSettingsSaveDetail');
    const discard = byId('adminSettingsDiscardButton');
    const save = byId('adminSettingsStickySaveButton');

    if (!bar) return;

    bar.dataset.dirty = state.settingsDirty ? 'TRUE' : 'FALSE';
    bar.dataset.source = state.settingsSource || 'SERVER';

    if (discard) discard.disabled = !state.settingsDirty || state.settingsSaveInFlight;
    if (save) {
      save.disabled = !state.settingsDirty || state.settingsSaveInFlight;
      save.textContent = state.settingsSaveInFlight
        ? 'กำลังบันทึกและตรวจอ่านกลับ...'
        : 'บันทึกและเริ่มใช้';
    }

    if (state.settingsDirty) {
      if (status) status.textContent = 'มีค่าที่เปลี่ยนแต่ยังไม่ได้บันทึก';
      if (detail) {
        detail.textContent =
          'Preview ด้านบนเป็นเพียงค่าร่าง ระบบจริงยังใช้ค่าที่บันทึกครั้งล่าสุด';
      }
      return;
    }

    if (state.settingsSource === 'CACHE') {
      if (status) status.textContent = 'แสดงค่าที่บันทึกล่าสุดจากเครื่อง';
      if (detail) {
        detail.textContent =
          'Backend เปิดไม่ทัน ระบบจึงใช้ค่าที่เคยตรวจยืนยันแล้วชั่วคราว · กดรีเฟรชเพื่อตรวจฐานจริง';
      }
      return;
    }

    if (state.settingsSource === 'FALLBACK') {
      if (status) status.textContent = 'ยังตรวจค่าที่บันทึกจาก Backend ไม่สำเร็จ';
      if (detail) {
        detail.textContent =
          'ห้ามถือค่าที่เห็นเป็นค่าจริงจนกว่าจะกดรีเฟรชและ Backend ตอบสำเร็จ';
      }
      return;
    }

    if (status) status.textContent = 'กำลังแสดงค่าที่บันทึกในระบบ';
    if (detail) {
      detail.textContent = state.settingsLastConfirmedAt
        ? 'ตรวจยืนยันล่าสุด ' + state.settingsLastConfirmedAt
        : 'ค่าปัจจุบันถูกโหลดจาก Backend';
    }
  }

  function refreshAdminSettingsDirtyState() {
    const formValues = collectAdminSettingsFormValues();
    state.settingsDirty = !adminSettingsMatchExpected(
      state.dashboard && state.dashboard.settings,
      formValues
    );
    updateAdminSettingsSaveBar();
  }

  function discardAdminSettingsDraft() {
    if (!state.settingsDirty || state.settingsSaveInFlight) return;
    renderSettings();
    toast('คืนค่าที่บันทึกครั้งล่าสุดแล้ว', 'success');
  }

  function handleAdminBeforeUnload(event) {
    if (!state.settingsDirty || state.settingsSaveInFlight) return;
    event.preventDefault();
    event.returnValue = '';
  }

  async function verifyAdminSettingsReadback(expectedValues) {
    const delays = [0, 350, 1100];

    for (let index = 0; index < delays.length; index += 1) {
      if (delays[index] > 0) {
        await new Promise((resolve) => window.setTimeout(resolve, delays[index]));
      }

      try {
        const dashboard = await API.getAdminDashboard({
          auditLimit: 30,
          cacheBust: Date.now()
        });

        if (
          dashboard &&
          adminSettingsMatchExpected(dashboard.settings, expectedValues)
        ) {
          return dashboard;
        }
      } catch (error) {
        if (index === delays.length - 1) {
          console.warn('ตรวจอ่านค่าการตั้งค่ากลับไม่สำเร็จ', error);
        }
      }
    }

    return null;
  }

  function renderSettings() {
    const container = byId('adminSettingsFields');
    if (!container) return;

    const settings = state.dashboard?.settings || {};
    const definitions = [
      {
        key: 'INBOUND_WORKFLOW_ENABLED',
        label: 'เปิดใช้งานขั้นตอน Inbound',
        type: 'boolean',
        help: 'สวิตช์หลักสำหรับเปิด/ปิดงานสแกนรับและคืนเอกสาร',
        featured: true
      },
      {
        key: 'INBOUND_SUBMIT_SCAN_REQUIRED',
        label: 'ต้องสแกนรับ/ยื่นเอกสาร',
        type: 'boolean',
        help: 'ปิดแล้วรถ Gate In ใหม่จะส่งตรงไปหน้า Module เพื่อรอรับสินค้า'
      },
      {
        key: 'INBOUND_RETURN_SCAN_REQUIRED',
        label: 'ต้องสแกนคืนเอกสาร',
        type: 'boolean',
        help: 'ปิดแล้วหลังรับสินค้าเสร็จ รถจะไปรอ Gate Out ทันที'
      },
      {
        key: 'SYSTEM_NAME',
        label: 'ชื่อระบบ',
        type: 'text',
        help: 'ชื่อที่ใช้แสดงในระบบ'
      },
      {
        key: 'AUTO_CLOSE_HOURS',
        label: 'เวลาเคลียร์รายการอัตโนมัติ',
        type: 'select',
        help: 'ค่ากลางทุก Module สำหรับรายการที่ยังไม่มีเวลาออก',
        featured: true,
        options: [1, 4, 8, 12, 24, 36, 48, 72, 96, 120, 168],
        allowCustom: true,
        minimum: 1,
        maximum: 168
      },
      {
        key: 'DEFAULT_REFRESH_SECONDS',
        label: 'รีเฟรชเริ่มต้น (วินาที)',
        type: 'number',
        help: '10–3600 วินาที'
      },
      {
        key: 'SESSION_TIMEOUT_MINUTES',
        label: 'อายุ Session (นาที)',
        type: 'number',
        help: '15–10080 นาที'
      },
      {
        key: 'MAX_LOGIN_FAILURES',
        label: 'จำนวนครั้งรหัสผิดสูงสุด',
        type: 'number',
        help: 'ก่อนล็อกบัญชี'
      },
      {
        key: 'LOGIN_LOCK_MINUTES',
        label: 'ระยะเวลาล็อกบัญชี (นาที)',
        type: 'number',
        help: '1–1440 นาที'
      },
      {
        key: 'SWEETALERT_ENABLED',
        label: 'เปิด SweetAlert2',
        type: 'boolean',
        help: 'ใช้แจ้งเตือนทุกจุด'
      }
    ];

    container.innerHTML = definitions.map((definition) => {
      const key = definition.key;
      const current = settings[key]?.value;
      const updated = settings[key]?.updatedAt || '-';
      const updatedBy = settings[key]?.updatedBy || '-';
      const revision = settings[key]?.revision || '';
      const effectiveAt = settings[key]?.effectiveAt || '';
      const changeReason = settings[key]?.changeReason || '';
      const governanceMeta = [
        revision ? `Revision ${revision}` : 'ยังไม่มี Revision',
        effectiveAt ? `เริ่มใช้ ${effectiveAt}` : '',
        changeReason ? `เหตุผล: ${changeReason}` : ''
      ].filter(Boolean).join(' · ');
      const featuredClass = definition.featured
        ? ' admin-setting-item--featured'
        : '';

      if (definition.type === 'boolean') {
        return `
          <label class="admin-setting-item admin-setting-item--toggle${featuredClass}">
            <div>
              <strong>${escapeHtml(definition.label)}</strong>
              <small>${escapeHtml(definition.help)}</small>
              <em>แก้ไข ${escapeHtml(updated)} โดย ${escapeHtml(updatedBy)}<br>${escapeHtml(governanceMeta)}</em>
            </div>
            <input
              type="checkbox"
              data-setting-key="${key}"
              ${toBoolean(current) ? 'checked' : ''}
            >
          </label>
        `;
      }

      if (definition.type === 'select') {
        const currentNumber = Number(current);
        const hasCurrentNumber = Number.isInteger(currentNumber);
        const options = Array.isArray(definition.options)
          ? definition.options.slice()
          : [];

        const isPresetValue =
          hasCurrentNumber && options.includes(currentNumber);

        const minimum =
          Number(definition.minimum || 1);

        const maximum =
          Number(definition.maximum || 168);

        return `
          <label class="admin-setting-item${featuredClass}">
            <span>${escapeHtml(definition.label)}</span>

            <select
              data-setting-key="${key}"
              data-setting-number="TRUE"
              data-setting-select-custom="${
                definition.allowCustom ? 'TRUE' : 'FALSE'
              }"
            >
              ${options.map((hours) => `
                <option
                  value="${Number(hours)}"
                  ${
                    Number(hours) === currentNumber
                      ? 'selected'
                      : ''
                  }
                >
                  ${Number(hours)} ชั่วโมง
                </option>
              `).join('')}

              ${
                definition.allowCustom
                  ? `
                    <option
                      value="CUSTOM"
                      ${isPresetValue ? '' : 'selected'}
                    >
                      อื่นๆ — กำหนดเวลาเอง
                    </option>
                  `
                  : ''
              }
            </select>

            ${
              definition.allowCustom
                ? `
                  <div
                    class="admin-custom-time-control"
                    data-custom-setting-container="${key}"
                    data-active="${isPresetValue ? 'FALSE' : 'TRUE'}"
                  >
                    <span>
                      กำหนดจำนวนชั่วโมง
                    </span>

                    <div class="admin-custom-time-input">
                      <input
                        type="number"
                        inputmode="numeric"
                        min="${minimum}"
                        max="${maximum}"
                        step="1"
                        value="${hasCurrentNumber ? escapeHtml(String(currentNumber)) : ''}"
                        data-setting-custom-for="${key}"
                        aria-label="กำหนดจำนวนชั่วโมงสำหรับ Auto Close"
                      >

                      <strong>
                        ชั่วโมง
                      </strong>
                    </div>

                    <small>
                      กรอกจำนวนเต็มตั้งแต่
                      ${minimum}–${maximum}
                      ชั่วโมง
                    </small>
                  </div>
                `
                : ''
            }

            <small>${escapeHtml(definition.help)}</small>

            <div class="admin-setting-impact">
              รายการที่ยังไม่มีเวลาออกจะถูกปิดเมื่อครบเวลาที่เลือก
            </div>

            <em>แก้ไข ${escapeHtml(updated)} โดย ${escapeHtml(updatedBy)}<br>${escapeHtml(governanceMeta)}</em>
          </label>
        `;
      }

      return `
        <label class="admin-setting-item${featuredClass}">
          <span>${escapeHtml(definition.label)}</span>
          <input
            type="${definition.type}"
            data-setting-key="${key}"
            value="${escapeHtml(current ?? '')}"
          >
          <small>${escapeHtml(definition.help)}</small>
          <em>แก้ไข ${escapeHtml(updated)} โดย ${escapeHtml(updatedBy)}<br>${escapeHtml(governanceMeta)}</em>
        </label>
      `;
    }).join('');

    state.savedSettingsSignature =
      buildAdminSettingsSignature(settings);
    state.settingsDirty = false;
    renderAdminWorkflowProfilePreview();
    syncAdminCustomSettingControls();
    updateAdminSettingsSaveBar();
  }


  function handleAdminSettingFieldChange(event) {
    if (event.target?.matches?.('[data-setting-key^="INBOUND_"]')) {
      syncAdminWorkflowProfileControls();
    }

    refreshAdminSettingsDirtyState();
    renderAdminWorkflowProfilePreview();
    const select = event.target?.closest?.(
      '[data-setting-select-custom="TRUE"]'
    );

    if (!select) return;

    syncAdminCustomSettingControls(select);
  }


  function syncAdminCustomSettingControls(changedSelect) {
    const selects = changedSelect
      ? [changedSelect]
      : Array.from(
          document.querySelectorAll(
            '[data-setting-select-custom="TRUE"]'
          )
        );

    selects.forEach((select) => {
      const key =
        String(select.dataset.settingKey || '').trim();

      if (!key) return;

      const customContainer =
        document.querySelector(
          `[data-custom-setting-container="${cssEscape(key)}"]`
        );

      const customInput =
        document.querySelector(
          `[data-setting-custom-for="${cssEscape(key)}"]`
        );

      const isCustom =
        String(select.value || '').toUpperCase() === 'CUSTOM';

      if (customContainer) {
        customContainer.dataset.active =
          isCustom ? 'TRUE' : 'FALSE';
      }

      if (customInput) {
        customInput.disabled = !isCustom;

        if (isCustom) {
          window.setTimeout(() => {
            customInput.focus();
            customInput.select();
          }, 0);
        }
      }
    });
  }


  function renderAudit(items, containerId) {
    const container = byId(containerId);
    if (!container) return;

    const list = Array.isArray(items) ? items : [];

    if (list.length === 0) {
      container.innerHTML = emptyHtml('ไม่พบประวัติการทำรายการ');
      return;
    }

    container.innerHTML = list.map((item) => `
      <article class="admin-audit-item" data-result="${escapeHtml(item.result || '')}">
        <div class="admin-audit-item__head">
          <strong>${escapeHtml(item.action || '-')}</strong>
          <span>${escapeHtml(item.timestamp || '-')}</span>
        </div>
        <div class="admin-audit-item__detail">
          <span>ผู้ใช้: <strong>${escapeHtml(item.username || '-')}</strong></span>
          <span>โมดูล: <strong>${escapeHtml(item.moduleId || '-')}</strong></span>
          <span>ผล: <strong>${escapeHtml(item.result || '-')}</strong></span>
        </div>
        <p>${escapeHtml(item.details || 'ไม่มีรายละเอียด')}</p>
        ${item.requestId ? `<small>Request ID: ${escapeHtml(item.requestId)}</small>` : ''}
      </article>
    `).join('');
  }

  async function refreshDashboard() {
    if (state.loading) return;

    if (state.settingsDirty) {
      const confirmation = await Swal.fire({
        icon: 'warning',
        title: 'มีค่าที่ยังไม่ได้บันทึก',
        text: 'การรีเฟรชจะคืนค่าแบบฟอร์มกลับเป็นค่าที่บันทึกไว้ในระบบ',
        showCancelButton: true,
        confirmButtonText: 'รีเฟรชและทิ้งค่าร่าง',
        cancelButtonText: 'กลับไปบันทึก',
        reverseButtons: true
      });
      if (!confirmation.isConfirmed) return;
      state.settingsDirty = false;
    }

    const button = byId('adminRefreshButton');
    setButtonLoading(button, true, 'กำลังรีเฟรช...');
    state.loading = true;

    try {
      state.dashboard = await API.getAdminDashboard({
        auditLimit: 30,
        cacheBust: Date.now()
      });
      state.settingsSource = 'SERVER';
      state.settingsLastConfirmedAt =
        state.dashboard.generatedAt || formatBangkokDateTime(new Date());
      state.savedSettingsSignature =
        buildAdminSettingsSignature(state.dashboard.settings || {});
      state.settingsDirty = false;
      persistAuthoritativeAdminSettings(state.dashboard.settings || {}, {
        source: 'SERVER_MANUAL_REFRESH'
      });
      state.dashboardSignature =
        buildAdminDashboardSignature(
          state.dashboard
        );
      renderAll();
      toast('รีเฟรชข้อมูลแล้ว', 'success');
    } catch (error) {
      await showApiError(error, 'รีเฟรชข้อมูลไม่สำเร็จ');
    } finally {
      state.loading = false;
      setButtonLoading(button, false);
    }
  }


  function startSilentDashboardRefresh() {
    if (state.silentRefreshTimer) {
      window.clearInterval(
        state.silentRefreshTimer
      );
    }

    state.silentRefreshTimer =
      window.setInterval(
        refreshDashboardSilently,
        30000
      );

    document.addEventListener(
      'visibilitychange',
      handleAdminVisibilityChange
    );
  }


  function handleAdminVisibilityChange() {
    if (
      document.visibilityState ===
        'visible'
    ) {
      void refreshDashboardSilently();
    }
  }


  async function refreshDashboardSilently() {
    if (
      state.destroyed ||
      state.loading ||
      state.moduleSaving ||
      state.settingsDirty ||
      state.settingsSaveInFlight ||
      document.visibilityState !==
        'visible'
    ) {
      return;
    }

    const editor =
      byId(
        'adminModuleEditor'
      );

    if (
      editor &&
      !editor.classList.contains(
        'is-hidden'
      )
    ) {
      return;
    }

    try {
      const nextDashboard =
        await API.getAdminDashboard({
          auditLimit:
            30
        });

      const nextSignature =
        buildAdminDashboardSignature(
          nextDashboard
        );

      if (
        nextSignature ===
        state.dashboardSignature
      ) {
        setText(
          'adminGeneratedAt',
          nextDashboard.generatedAt
            ? 'ข้อมูลล่าสุด ' +
              nextDashboard.generatedAt
            : 'ข้อมูลเป็นปัจจุบัน'
        );

        return;
      }

      const previousScrollY =
        window.scrollY;

      const previousTab =
        state.currentTab;

      state.dashboard =
        nextDashboard;

      state.settingsSource = 'SERVER';
      state.settingsLastConfirmedAt =
        nextDashboard.generatedAt || formatBangkokDateTime(new Date());
      state.savedSettingsSignature =
        buildAdminSettingsSignature(nextDashboard.settings || {});
      state.settingsDirty = false;
      persistAuthoritativeAdminSettings(nextDashboard.settings || {}, {
        source: 'SERVER_SILENT_REFRESH'
      });

      state.dashboardSignature =
        nextSignature;

      renderAll();
      switchTab(
        previousTab
      );

      window.requestAnimationFrame(
        () => {
          window.scrollTo({
            top:
              previousScrollY,

            behavior:
              'auto'
          });
        }
      );

    } catch (error) {
      /*
       * Silent Refresh ห้ามแสดง Popup, Toast หรือ Loading
       */
      console.warn(
        'Silent Admin Dashboard Refresh ไม่สำเร็จ',
        error
      );
    }
  }


  function buildAdminDashboardSignature(
    dashboard
  ) {
    const source =
      dashboard &&
      typeof dashboard ===
        'object'
        ? dashboard
        : {};

    return JSON.stringify({
      modules:
        source.modules || [],

      users:
        source.users || [],

      settings:
        source.settings || [],

      structure:
        source.structure || {},

      recentAudit:
        source.recentAudit || []
    });
  }


  function destroyAdminPage() {
    state.destroyed =
      true;

    if (state.silentRefreshTimer) {
      window.clearInterval(
        state.silentRefreshTimer
      );
    }

    document.removeEventListener(
      'visibilitychange',
      handleAdminVisibilityChange
    );
  }

  function switchTab(tab) {
    state.currentTab = tab;

    document.querySelectorAll('[data-admin-tab]').forEach((button) => {
      button.classList.toggle('is-active', button.dataset.adminTab === tab);
    });

    document.querySelectorAll('[data-admin-panel]').forEach((panel) => {
      panel.classList.toggle('is-hidden', panel.dataset.adminPanel !== tab);
    });

    if (tab === 'audit' && byId('adminAuditList')?.children.length === 0) {
      loadAudit({ limit: 50 });
    }

    if (tab === 'sla') {
      loadAdminSlaRules(false);
      loadAdminAlertEngine(false);
    }
  }


  function renderAdminSlaModuleOptions() {
    const select =
      byId(
        'adminSlaModuleSelect'
      );

    if (!select) {
      return;
    }

    const modules =
      Array.isArray(
        state.dashboard &&
        state.dashboard.modules
      )
        ? state.dashboard.modules
        : [];

    const previous =
      select.value ||
      state.slaLoadedModuleId ||
      'DEFAULT';

    select.innerHTML =
      [
        {
          moduleId:
            'DEFAULT',
          name:
            'ค่าเริ่มต้นทุก Module'
        }
      ]
        .concat(
          modules
            .filter(
              (item) =>
                item &&
                item.moduleId
            )
            .map(
              (item) => ({
                moduleId:
                  item.moduleId,
                name:
                  item.name ||
                  item.moduleId
              })
            )
        )
        .map(
          (item) => `
            <option
              value="${escapeHtml(
                item.moduleId
              )}"
            >
              ${
                item.moduleId ===
                'DEFAULT'
                  ? 'DEFAULT — '
                  : ''
              }${escapeHtml(
                item.name
              )}
            </option>
          `
        )
        .join('');

    const canRestore =
      Array.from(
        select.options
      ).some(
        (option) =>
          option.value ===
          previous
      );

    select.value =
      canRestore
        ? previous
        : 'DEFAULT';
  }


  async function loadAdminSlaRules(
    force
  ) {
    const select =
      byId(
        'adminSlaModuleSelect'
      );

    const moduleId =
      String(
        select &&
        select.value ||
        'DEFAULT'
      ).trim();

    if (
      !moduleId ||
      state.slaLoading
    ) {
      return;
    }

    if (
      force !== true &&
      state.slaData &&
      state.slaLoadedModuleId ===
        moduleId
    ) {
      renderAdminSlaRules(
        state.slaData
      );
      return;
    }

    state.slaLoading =
      true;

    setText(
      'adminSlaStatus',
      'กำลังโหลด'
    );

    const status =
      byId(
        'adminSlaStatus'
      );

    if (status) {
      status.dataset.status =
        'LOADING';
    }

    const grid =
      byId(
        'adminSlaRuleGrid'
      );

    if (grid) {
      grid.innerHTML =
        '<div class="admin-sla-loading">กำลังโหลดเกณฑ์รายขั้นตอน...</div>';
    }

    try {
      const result =
        await API
          .getAdminWorkflowSlaRules(
            moduleId
          );

      state.slaData =
        result || null;

      state.slaLoadedModuleId =
        moduleId;

      renderAdminSlaRules(
        result
      );

    } catch (error) {
      if (grid) {
        grid.innerHTML = `
          <div class="admin-sla-loading">
            โหลดเกณฑ์ไม่สำเร็จ:
            ${escapeHtml(
              error &&
              error.message ||
              'ไม่ทราบสาเหตุ'
            )}
          </div>
        `;
      }

      setText(
        'adminSlaStatus',
        'โหลดไม่สำเร็จ'
      );

      if (status) {
        status.dataset.status =
          'ERROR';
      }

    } finally {
      state.slaLoading =
        false;
    }
  }


  function renderAdminSlaRules(
    data
  ) {
    const result =
      data &&
      typeof data ===
        'object'
        ? data
        : {};

    const stages =
      Array.isArray(
        result.stages
      )
        ? result.stages
        : [];

    const grid =
      byId(
        'adminSlaRuleGrid'
      );

    if (!grid) {
      return;
    }

    if (
      result.setupRequired ===
        true
    ) {
      grid.innerHTML = `
        <div class="admin-sla-loading">
          ยังไม่พบตารางเกณฑ์เวลา กรุณากด “เตรียมตารางเกณฑ์”
        </div>
      `;

      setText(
        'adminSlaStatus',
        'ต้องเตรียมตาราง'
      );

      const status =
        byId(
          'adminSlaStatus'
        );

      if (status) {
        status.dataset.status =
          'WARNING';
      }

      const setupApplicableCount = stages.filter((stage) => stage.applicable !== false).length || 4;
      setText(
        'adminSlaConfiguredCount',
        '0 / ' + setupApplicableCount + ' ช่วงที่ใช้งาน'
      );

      setText(
        'adminSlaUpdatedAt',
        '-'
      );

      return;
    }

    grid.innerHTML =
      stages
        .map(
          (stage, index) => `
            <article
              class="admin-sla-rule-card"
              data-sla-rule="${escapeHtml(
                stage.key
              )}"
              data-configured="${
                stage.configured
                  ? 'TRUE'
                  : 'FALSE'
              }"
              data-applicable="${stage.applicable === false ? 'FALSE' : 'TRUE'}"
            >
              <header class="admin-sla-rule-card__header">
                <div class="admin-sla-rule-card__title">
                  <span>
                    ขั้นตอน ${index + 1}
                  </span>

                  <strong>
                    ${escapeHtml(
                      stage.effectiveLabel ||
                      stage.label ||
                      stage.key
                    )}
                  </strong>
                </div>

                <span
                  class="admin-sla-source-badge"
                  data-source="${escapeHtml(
                    stage.source ||
                    'MISSING'
                  )}"
                >
                  ${escapeHtml(
                    adminSlaSourceLabel(
                      stage.source
                    )
                  )}
                </span>
              </header>

              <div class="admin-sla-flow">
                <span>
                  ${escapeHtml(
                    stage.fromStatusLabel ||
                    stage.fromStatus ||
                    '-'
                  )}
                </span>

                <b aria-hidden="true">
                  →
                </b>

                <span>
                  ${escapeHtml(
                    stage.toStatusLabel ||
                    stage.toStatus ||
                    '-'
                  )}
                </span>
              </div>

              ${stage.applicable === false ? `
                <div class="admin-sla-not-applicable">
                  <strong>ไม่ใช้ใน Workflow Profile ${escapeHtml(result.workflowProfile?.code || '')}</strong>
                  <span>${escapeHtml(stage.notApplicableReason || 'ขั้นตอนนี้ถูกตัดออกจาก SLA และ Alert')}</span>
                </div>
              ` : ''}

              <div class="admin-sla-fields">
                <label>
                  <span>
                    เฝ้าระวัง (นาที)
                  </span>

                  <input
                    type="number"
                    min="0"
                    max="10080"
                    step="1"
                    data-sla-warning
                    ${stage.applicable === false ? 'disabled' : ''}
                    value="${escapeHtml(
                      stage.warningMinutes ??
                      ''
                    )}"
                  >
                </label>

                <label>
                  <span>
                    เกินเวลา (นาที)
                  </span>

                  <input
                    type="number"
                    min="1"
                    max="10080"
                    step="1"
                    data-sla-red
                    ${stage.applicable === false ? 'disabled' : ''}
                    value="${escapeHtml(
                      stage.redMinutes ??
                      ''
                    )}"
                  >
                </label>

                <label>
                  <span>
                    แจ้งซ้ำทุก (นาที)
                  </span>

                  <input
                    type="number"
                    min="1"
                    max="1440"
                    step="1"
                    data-sla-repeat
                    ${stage.applicable === false ? 'disabled' : ''}
                    value="${escapeHtml(
                      stage.repeatMinutes ??
                      10
                    )}"
                    ${
                      stage.alertEnabled
                        ? ''
                        : 'disabled'
                    }
                  >
                </label>
              </div>

              <div class="admin-sla-toggles">
                <label class="admin-sla-toggle">
                  <input
                    type="checkbox"
                    data-sla-enabled
                    ${stage.applicable === false ? 'disabled' : ''}
                    ${
                      stage.enabled !==
                        false
                        ? 'checked'
                        : ''
                    }
                  >

                  <span>
                    เปิดใช้เกณฑ์ขั้นตอนนี้
                  </span>
                </label>

                <label class="admin-sla-toggle">
                  <input
                    type="checkbox"
                    data-sla-alert
                    ${stage.applicable === false ? 'disabled' : ''}
                    ${
                      stage.alertEnabled
                        ? 'checked'
                        : ''
                    }
                  >

                  <span>
                    เปิดการแจ้งเตือนและแจ้งซ้ำ
                  </span>
                </label>
              </div>

              <footer class="admin-sla-rule-card__meta">
                <span>
                  ${escapeHtml(
                    stage.updatedBy
                      ? 'แก้ไขโดย ' +
                        stage.updatedBy
                      : 'ยังไม่มีผู้แก้ไข'
                  )}
                </span>

                <span>
                  ${escapeHtml(
                    stage.updatedAt ||
                    '-'
                  )}
                </span>

                <span>
                  ${escapeHtml(
                    stage.revision
                      ? 'Revision ' + stage.revision
                      : 'ยังไม่มี Revision'
                  )}
                </span>

                <span>
                  ${escapeHtml(
                    stage.effectiveAt
                      ? 'เริ่มใช้ ' + stage.effectiveAt
                      : ''
                  )}
                </span>

                ${
                  stage.changeReason
                    ? `<span>${escapeHtml('เหตุผล: ' + stage.changeReason)}</span>`
                    : ''
                }
              </footer>
            </article>
          `
        )
        .join('');

    const applicableStages = stages.filter((stage) => stage.applicable !== false);
    const configuredCount = applicableStages.filter((stage) => stage.configured).length;

    setText(
      'adminSlaConfiguredCount',
      configuredCount +
      ' / ' +
      applicableStages.length +
      ' ช่วงที่ใช้งาน'
    );

    setText(
      'adminSlaUpdatedAt',
      result.updatedAt ||
      '-'
    );

    setText(
      'adminSlaStatus',
      configuredCount ===
        applicableStages.length
        ? 'พร้อมใช้งาน'
        : 'ยังตั้งค่าไม่ครบ'
    );

    const status =
      byId(
        'adminSlaStatus'
      );

    if (status) {
      status.dataset.status =
        configuredCount ===
          stages.length
          ? 'READY'
          : 'WARNING';
    }
  }


  function adminSlaSourceLabel(
    source
  ) {
    const value =
      String(
        source ||
        ''
      ).toUpperCase();

    if (value === 'MODULE') {
      return 'ค่าของ Module';
    }

    if (value === 'DEFAULT') {
      return 'ใช้ค่า DEFAULT';
    }

    return 'ยังไม่ตั้งค่า';
  }


  function handleAdminSlaRuleChange(
    event
  ) {
    const card =
      event.target.closest(
        '[data-sla-rule]'
      );

    if (!card) {
      return;
    }

    if (
      event.target.matches(
        '[data-sla-alert]'
      )
    ) {
      const repeat =
        card.querySelector(
          '[data-sla-repeat]'
        );

      if (repeat) {
        repeat.disabled =
          !event.target.checked;
      }
    }

    validateAdminSlaRules(
      false
    );
  }


  function collectAdminSlaRules() {
    return Array.from(
      document.querySelectorAll(
        '#adminSlaRuleGrid [data-sla-rule]'
      )
    ).map(
      (card) => ({
        key:
          card.dataset.slaRule ||
          '',
        warningMinutes:
          Number(
            card.querySelector(
              '[data-sla-warning]'
            )?.value
          ),
        redMinutes:
          Number(
            card.querySelector(
              '[data-sla-red]'
            )?.value
          ),
        repeatMinutes:
          Number(
            card.querySelector(
              '[data-sla-repeat]'
            )?.value
          ),
        enabled:
          Boolean(
            card.querySelector(
              '[data-sla-enabled]'
            )?.checked
          ),
        alertEnabled:
          Boolean(
            card.querySelector(
              '[data-sla-alert]'
            )?.checked
          )
      })
    );
  }


  function validateAdminSlaRules(
    showDialog
  ) {
    const rules =
      collectAdminSlaRules();

    const errors = [];

    if (rules.length !== 4) {
      errors.push(
        'ต้องมีเกณฑ์ครบทั้ง 4 ขั้นตอน'
      );
    }

    rules.forEach(
      (rule, index) => {
        const label =
          'ขั้นตอน ' +
          (index + 1);

        if (
          !Number.isFinite(
            rule.warningMinutes
          ) ||
          rule.warningMinutes < 0 ||
          rule.warningMinutes > 10080
        ) {
          errors.push(
            label +
            ': เวลาเฝ้าระวังต้องอยู่ระหว่าง 0–10,080 นาที'
          );
        }

        if (
          !Number.isFinite(
            rule.redMinutes
          ) ||
          rule.redMinutes < 1 ||
          rule.redMinutes > 10080
        ) {
          errors.push(
            label +
            ': เวลาเกินต้องอยู่ระหว่าง 1–10,080 นาที'
          );
        }

        if (
          Number.isFinite(
            rule.warningMinutes
          ) &&
          Number.isFinite(
            rule.redMinutes
          ) &&
          rule.redMinutes <=
            rule.warningMinutes
        ) {
          errors.push(
            label +
            ': เวลาเกินต้องมากกว่าเวลาเฝ้าระวัง'
          );
        }

        if (
          rule.alertEnabled &&
          (
            !Number.isFinite(
              rule.repeatMinutes
            ) ||
            rule.repeatMinutes < 1 ||
            rule.repeatMinutes > 1440
          )
        ) {
          errors.push(
            label +
            ': เวลาแจ้งซ้ำต้องอยู่ระหว่าง 1–1,440 นาที'
          );
        }
      }
    );

    const hint =
      byId(
        'adminSlaSaveHint'
      );

    if (hint) {
      hint.textContent =
        errors.length
          ? errors[0]
          : 'ข้อมูลครบ พร้อมบันทึกทั้ง 4 ขั้นตอน';

      hint.dataset.status =
        errors.length
          ? 'ERROR'
          : 'READY';
    }

    if (
      errors.length &&
      showDialog === true
    ) {
      showValidationErrors(
        errors,
        'ตรวจเกณฑ์เวลาอีกครั้ง'
      );
    }

    return {
      valid:
        errors.length === 0,
      errors:
        errors,
      rules:
        rules
    };
  }


  async function saveAdminSlaRules() {
    if (state.slaSaving) return;

    const validation = validateAdminSlaRules(true);
    if (!validation.valid) return;

    const moduleId = String(
      byId('adminSlaModuleSelect')?.value || 'DEFAULT'
    ).trim();

    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'บันทึกเกณฑ์รายขั้นตอน?',
      html: `
        <div class="admin-confirm-box">
          <strong>${escapeHtml(moduleId)}</strong>
          <span>บันทึกเกณฑ์และการแจ้งเตือนครบ 4 ขั้นตอน</span>
        </div>
      `,
      input: 'textarea',
      inputLabel: 'เหตุผลการเปลี่ยน',
      inputPlaceholder: 'เช่น ปรับตามผลการประชุมประจำเดือน',
      inputAttributes: {
        maxlength: '500',
        'aria-label': 'เหตุผลการเปลี่ยนเกณฑ์ SLA'
      },
      inputValidator: (value) => {
        const reason = String(value || '').trim();
        if (reason.length < 5) {
          return 'กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร';
        }
        return undefined;
      },
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      focusConfirm: false
    });

    if (!confirmation.isConfirmed) return;

    state.slaSaving = true;
    const button = byId('adminSlaSaveButton');
    if (button) button.disabled = true;

    showLoading(
      'กำลังบันทึกเกณฑ์',
      'ระบบกำลังตรวจ Revision และบันทึกประวัติทั้ง 4 ขั้นตอน'
    );

    try {
      const result = await API.saveAdminWorkflowSlaRules(
        moduleId,
        {
          rules: validation.rules,
          expectedRevision: state.slaData?.editRevision || '',
          changeReason: String(confirmation.value || '').trim(),
          effectiveAt: new Date().toISOString()
        }
      );

      Swal.close();
      state.slaData = result || null;
      state.slaLoadedModuleId = moduleId;
      renderAdminSlaRules(result);

      await success(
        (result?.message || 'บันทึกเกณฑ์เวลาและการแจ้งเตือนแล้ว') +
        (result?.revision ? ` · ${result.revision}` : '')
      );
    } catch (error) {
      Swal.close();

      if (String(error?.code || '').toUpperCase() === 'CONFIG_REVISION_CONFLICT') {
        await Swal.fire({
          icon: 'warning',
          title: 'ข้อมูลถูกแก้ไขจากหน้าจออื่น',
          text: error.message || 'กรุณาโหลดเกณฑ์ล่าสุดก่อนบันทึกอีกครั้ง',
          confirmButtonText: 'โหลดข้อมูลล่าสุด'
        });
        state.slaData = null;
        state.slaLoadedModuleId = '';
        await loadAdminSlaRules(true);
      } else {
        await Swal.fire({
          icon: 'error',
          title: 'บันทึกไม่สำเร็จ',
          text: error?.message || 'เกิดข้อผิดพลาด'
        });
      }
    } finally {
      state.slaSaving = false;
      if (button) button.disabled = false;
    }
  }


  async function setupAdminSlaRules() {
    const confirm =
      await Swal.fire({
        icon:
          'question',
        title:
          'เตรียมตารางเกณฑ์เวลา?',
        text:
          'ระบบจะสร้างหัวตารางและค่า DEFAULT เริ่มต้นหากยังไม่มี',
        showCancelButton:
          true,
        confirmButtonText:
          'ดำเนินการ',
        cancelButtonText:
          'ยกเลิก'
      });

    if (!confirm.isConfirmed) {
      return;
    }

    showLoading(
      'กำลังเตรียมตาราง',
      'ไม่แก้ข้อมูลโมดูลหรือข้อมูลรถ'
    );

    try {
      await API
        .setupAdminWorkflowSlaRules();

      Swal.close();

      state.slaData =
        null;

      state.slaLoadedModuleId =
        '';

      await loadAdminSlaRules(
        true
      );

      await success(
        'ตารางเกณฑ์เวลาพร้อมใช้งานแล้ว'
      );

    } catch (error) {
      Swal.close();

      await Swal.fire({
        icon:
          'error',
        title:
          'เตรียมตารางไม่สำเร็จ',
        text:
          error &&
          error.message ||
          'เกิดข้อผิดพลาด'
      });
    }
  }


  async function loadAdminAlertEngine(force) {
    if (state.alertEngineLoading) return;
    if (!force && state.alertEngineData) { renderAdminAlertEngine(state.alertEngineData); return; }
    state.alertEngineLoading = true;
    try {
      const results = await Promise.all([API.getAdminAlertEngineStatus(), API.getAdminAlertDeliveries({ limit: 80 })]);
      state.alertEngineData = { status: results[0] || {}, deliveries: results[1] || {} };
      renderAdminAlertEngine(state.alertEngineData);
    } catch (error) {
      setText('adminAlertEngineStatus', 'โหลดไม่สำเร็จ');
      const el = byId('adminAlertEngineStatus'); if (el) el.dataset.status = 'ERROR';
      const list = byId('adminAlertDeliveryList'); if (list) list.innerHTML = '<div class="admin-sla-loading">' + escapeHtml(error && error.message || 'โหลดข้อมูลไม่สำเร็จ') + '</div>';
    } finally { state.alertEngineLoading = false; }
  }

  function renderAdminAlertEngine(data) {
    const status = data && data.status || {};
    const trigger = status.trigger || {};
    setText('adminAlertEngineStatus', status.enabled ? 'กำลังทำงาน' : 'ปิดใช้งาน');
    const statusEl = byId('adminAlertEngineStatus'); if (statusEl) statusEl.dataset.status = status.enabled ? 'READY' : 'DISABLED';
    setText('adminAlertEngineTrigger', trigger.installed ? ('ทุก ' + (status.triggerMinutes || trigger.minutes || '-') + ' นาที') : 'ยังไม่มี Trigger');
    setText('adminAlertEngineActive', String(status.activeAlertCount || 0));
    setText('adminAlertEngineOverdue', String(status.overdueCount || 0));
    setText('adminAlertEngineDeliveryCount', String(status.deliveryCount || 0));
    const lastRun = status.lastRun || {};
    setText('adminAlertEngineLastRun', lastRun.finishedAt || lastRun.checkedAt || '-');
    const toggle = byId('adminAlertEngineToggleButton'); if (toggle) toggle.textContent = status.enabled ? 'ปิดใช้งาน' : 'เปิดใช้งาน';
    setText('adminAlertEngineNotice', 'In-App: พร้อม · Webhook: ' + (status.webhookConfigured ? 'ตั้งค่าแล้ว' : 'ยังไม่ตั้ง') + ' · Sheet: ' + (status.sheetsReady ? 'พร้อม' : 'ต้องเตรียมระบบ'));
    const list = byId('adminAlertDeliveryList'); if (!list) return;
    const rows = data && data.deliveries && Array.isArray(data.deliveries.rows) ? data.deliveries.rows : [];
    list.innerHTML = rows.length ? rows.map((row) => `
      <div class="admin-alert-delivery-item" data-severity="${escapeHtml(row['ระดับ'] || '')}">
        <strong>${escapeHtml(row['ระดับ'] || '-')}</strong>
        <span>${escapeHtml((row['รหัสโมดูล'] || '-') + ' · ' + (row['ขั้นตอน'] || '-'))}</span>
        <small>${escapeHtml(row['ข้อความ'] || '-')}</small>
        <time>${escapeHtml(row['วันที่เวลาส่งสำเร็จ'] || row['วันที่เวลาพยายามส่ง'] || '-')}</time>
      </div>`).join('') : '<div class="admin-sla-loading">ยังไม่มีประวัติการส่ง</div>';
  }

  async function alertEngineAction(action, title) {
    if (state.alertEngineActionRunning) return;
    state.alertEngineActionRunning = true;
    showLoading(title, 'ระบบกำลังอัปเดต Alert Engine');
    try {
      let result;
      if (action === 'SETUP') result = await API.setupAdminAlertEngine({ installTrigger: true, enable: true });
      else if (action === 'ENABLE') result = await API.enableAdminAlertEngine({});
      else if (action === 'DISABLE') result = await API.disableAdminAlertEngine();
      else result = await API.runAdminAlertEngine({});
      Swal.close();
      state.alertEngineData = null;
      await loadAdminAlertEngine(true);
      await success(title + 'สำเร็จ');
      return result;
    } catch (error) {
      Swal.close();
      await Swal.fire({ icon: 'error', title: title + 'ไม่สำเร็จ', text: error && error.message || 'เกิดข้อผิดพลาด' });
      return null;
    } finally { state.alertEngineActionRunning = false; }
  }

  async function setupAdminAlertEngine() { return alertEngineAction('SETUP', 'เตรียมระบบแจ้งเตือน'); }
  async function toggleAdminAlertEngine() {
    const enabled = Boolean(state.alertEngineData && state.alertEngineData.status && state.alertEngineData.status.enabled);
    return alertEngineAction(enabled ? 'DISABLE' : 'ENABLE', enabled ? 'ปิด Alert Engine' : 'เปิด Alert Engine');
  }
  async function runAdminAlertEngineNow() { return alertEngineAction('RUN', 'ประมวลผลแจ้งเตือน'); }

  async function handleModuleListClick(event) {
    const actionButton = event.target.closest('[data-module-action]');
    if (!actionButton) return;

    const card = actionButton.closest('[data-module-id]');
    const moduleId = card?.dataset.moduleId || '';
    const action = actionButton.dataset.moduleAction;

    if (action === 'edit') {
      await editModule(moduleId);
    } else if (action === 'duplicate') {
      await duplicateModule(moduleId);
    } else if (action === 'archive') {
      await archiveModule(moduleId);
    }
  }

  async function createNewModule() {
    showLoading('กำลังเตรียมแบบฟอร์ม', 'กรุณารอสักครู่');

    try {
      const result = await API.getAdminNewModuleTemplate();
      Swal.close();
      openModuleEditor(result.bundle, result.expectedUpdatedAt || '', true);
    } catch (error) {
      Swal.close();
      await showApiError(error, 'เปิดแบบฟอร์มไม่สำเร็จ');
    }
  }

  async function editModule(moduleId) {
    showLoading('กำลังโหลดโมดูล', moduleId);

    try {
      const result = await API.getAdminModuleBundle(moduleId);
      Swal.close();
      openModuleEditor(result.bundle, result.expectedUpdatedAt || '', false);
    } catch (error) {
      Swal.close();
      await showApiError(error, 'โหลดโมดูลไม่สำเร็จ');
    }
  }

  function openModuleEditor(bundle, expectedUpdatedAt, isNew) {
    state.currentBundle = clone(bundle || {});
    state.currentExpectedUpdatedAt = expectedUpdatedAt || '';
    state.sourceMetadata = null;

    const module = bundle?.module || {};
    const filters = Array.isArray(bundle?.filters) ? bundle.filters : [];
    const fields = Array.isArray(bundle?.fields) ? bundle.fields : [];

    setValue('adminExpectedUpdatedAt', expectedUpdatedAt || '');
    setValue('adminModuleId', module.moduleId || '');
    setValue('adminModuleName', module.name || '');
    setValue('adminModuleDescription', module.description || '');
    setValue('adminModuleStatus', module.status || 'DRAFT');
    setValue('adminModuleDisplayOrder', module.displayOrder ?? 100);
    setValue('adminSourceSpreadsheetId', module.sourceSpreadsheetId || '');
    setValue('adminSourceSheetName', module.sourceSheetName || '');
    setValue('adminHeaderRow', module.headerRow ?? 1);
    setValue('adminTimestampInColumn', module.timestampInColumn || 'B');
    setValue('adminTimestampOutColumn', module.timestampOutColumn || '');
    setValue('adminDurationColumn', module.durationColumn || '');
    setValue('adminCheckoutUserColumn', module.checkoutUserColumn || '');
    setValue('adminCurrentStatusMethod', module.currentStatusMethod || 'TIMESTAMP_OUT_EMPTY_AND_DURATION_EMPTY');
    setValue('adminCustomStatusColumn', module.customStatusColumn || '');
    setValue('adminCustomStatusOperator', module.customStatusOperator || '');
    setValue('adminCustomStatusValue', module.customStatusValue || '');
    setValue('adminGreenStartMinutes', module.greenStartMinutes ?? 0);
    setValue('adminWarningStartMinutes', module.warningStartMinutes ?? 45);
    setValue('adminRedStartMinutes', module.redStartMinutes ?? 60);
    setValue('adminAlertRepeatMinutes', module.alertRepeatMinutes ?? 10);
    setValue('adminRefreshSeconds', module.refreshSeconds ?? 30);
    setValue('adminHistoryMonths', module.historyMonths ?? 12);
    setValue('adminCalendarGroupBy', module.calendarGroupBy || 'TIMESTAMP_IN');
    setValue('adminAfterCheckoutStatusColumn', module.afterCheckoutStatusColumn || '');
    setValue('adminAfterCheckoutStatusValue', module.afterCheckoutStatusValue || '');

    setChecked('adminAlertEnabled', module.alertEnabled !== false);
    setChecked('adminCheckoutEnabled', module.checkoutEnabled !== false);
    setChecked('adminReceivingEnabled', Boolean(module.receivingEnabled));
    setChecked('adminShowToUsers', Boolean(module.showToUsers));
    setChecked('adminHistoryEnabled', module.historyEnabled !== false);
    setChecked('adminCalendarEnabled', module.calendarEnabled !== false);
    setChecked('adminShowCalendarToUsers', Boolean(module.showCalendarToUsers));
    setChecked('adminDailySummaryEnabled', module.dailySummaryEnabled !== false);
    setChecked('adminSoundEnabled', module.soundEnabled !== false);
    setChecked('adminVibrationEnabled', module.vibrationEnabled !== false);

    const moduleIdInput = byId('adminModuleId');
    if (moduleIdInput) moduleIdInput.disabled = !isNew;

    setText('adminModuleEditorTitle', isNew ? 'สร้างโมดูลใหม่' : 'แก้ไขโมดูล');
    setText(
      'adminModuleEditorStatus',
      isNew ? 'ยังไม่ได้บันทึก' : ('แก้ไขล่าสุด ' + (expectedUpdatedAt || '-'))
    );
    setText('adminSourceInspectStatus', 'ยังไม่ได้ตรวจสอบแหล่งข้อมูล');

    byId('adminFilterRows').innerHTML = '';
    byId('adminFieldRows').innerHTML = '';

    filters.forEach(addFilterRow);
    fields.forEach(addFieldRow);

    if (fields.length === 0) addFieldRow({ primary: true, visible: true, searchable: true });

    updateDynamicCounts();

    state.moduleValidationTouched =
      false;

    if (state.moduleValidationTimer) {
      window.clearTimeout(
        state.moduleValidationTimer
      );

      state.moduleValidationTimer =
        null;
    }

    ensureModuleValidationSummary();
    clearModuleValidationFeedback();

    byId('adminModuleEditor')?.classList.remove('is-hidden');
    document.body.classList.add('admin-editor-open');

    window.requestAnimationFrame(() => {
      const editorBody =
        byId('adminModuleForm');

      if (editorBody) {
        editorBody.scrollTop = 0;
      }

      const firstInput =
        byId('adminModuleId');

      if (
        isNew &&
        firstInput &&
        typeof firstInput.focus === 'function'
      ) {
        firstInput.focus({
          preventScroll: true
        });
      }
    });
  }

  function closeModuleEditor() {
    byId('adminModuleEditor')?.classList.add('is-hidden');
    document.body.classList.remove('admin-editor-open');

    if (state.moduleValidationTimer) {
      window.clearTimeout(
        state.moduleValidationTimer
      );

      state.moduleValidationTimer =
        null;
    }

    clearModuleValidationFeedback();

    state.moduleValidationTouched =
      false;

    state.currentBundle = null;
    state.sourceMetadata = null;
  }

  async function saveModule(event) {
    event.preventDefault();

    if (state.moduleSaving) {
      return;
    }

    const saveButton =
      byId('adminSaveModuleButton');

    let payload;
    let validation;

    try {
      payload =
        readModulePayload();

      validation =
        validateModulePayload(
          payload
        );

      state.moduleValidationTouched =
        true;

      applyModuleValidationFeedback(
        validation,
        {
          force:
            true
        }
      );

    } catch (error) {
      const messages =
        collectErrorMessages(
          error
        );

      const target =
        error &&
        error.focusTarget
          ? error.focusTarget
          : '#adminModuleId';

      const inlineValidation = {
        valid: false,
        errors: messages,
        warnings: [],
        issues: messages.map(
          (message) => ({
            severity: 'error',
            message: String(message || 'ข้อมูลโมดูลไม่ถูกต้อง'),
            target
          })
        ),
        firstTarget: target
      };

      state.moduleValidationTouched =
        true;

      applyModuleValidationFeedback(
        inlineValidation,
        {
          force: true
        }
      );

      focusValidationTarget(
        target
      );

      return;
    }

    if (
      validation.errors.length >
      0
    ) {
      focusValidationTarget(
        validation.firstTarget
      );

      return;
    }

    let sourceValidation;

    setButtonLoading(
      saveButton,
      true,
      'กำลังตรวจสอบแหล่งข้อมูล...'
    );

    try {
      sourceValidation =
        await validateModuleSourceBeforeSave(
          payload
        );

    } catch (error) {
      setButtonLoading(
        saveButton,
        false
      );

      const sourceError =
        createSourceValidationFailure(
          error
        );

      applyModuleValidationFeedback(
        sourceError,
        {
          force:
            true
        }
      );

      focusValidationTarget(
        sourceError.firstTarget
      );

      return;
    }

    setButtonLoading(
      saveButton,
      false
    );

    validation =
      mergeModuleValidationResults(
        validation,
        sourceValidation
      );

    applyModuleValidationFeedback(
      validation,
      {
        force:
          true
      }
    );

    if (
      validation.errors.length >
      0
    ) {
      focusValidationTarget(
        validation.firstTarget
      );

      return;
    }

    const warningHtml =
      validation.warnings.length
        ? `
          <div class="admin-source-warning">
            <strong>คำเตือนก่อนบันทึก</strong>
            <ul class="admin-warning-list">
              ${validation.warnings
                .map(
                  (item) =>
                    `<li>${escapeHtml(item)}</li>`
                )
                .join('')}
            </ul>
          </div>
        `
        : '';

    const confirmation =
      await Swal.fire({
        icon:
          validation.warnings.length
            ? 'warning'
            : 'question',

        title:
          'ยืนยันบันทึกโมดูล',

        html: `
          <div class="admin-confirm-box">
            <strong>${escapeHtml(payload.module.name)}</strong>
            <span>รหัส: ${escapeHtml(payload.module.moduleId)}</span>
            <span>
              ${payload.filters.length} เงื่อนไข
              •
              ${payload.fields.length} ฟิลด์
            </span>
            <span>
              Receiving Flow:
              <strong>
                ${payload.module.receivingEnabled ? 'เปิด' : 'ปิด'}
              </strong>
            </span>
          </div>
          ${warningHtml}
        `,

        showCancelButton:
          true,

        confirmButtonText:
          'บันทึก',

        cancelButtonText:
          'ยกเลิก',

        reverseButtons:
          true,

        focusCancel:
          validation.warnings.length >
          0
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    state.moduleSaving =
      true;

    setButtonLoading(
      saveButton,
      true,
      'กำลังบันทึก...'
    );

    showLoading(
      'กำลังบันทึกโมดูล',
      'ระบบกำลังตรวจสอบข้อมูลต้นทางและบันทึกทุกส่วน'
    );

    try {
      const result =
        await API.saveAdminModuleBundle(
          payload
        );

      Swal.close();

      closeModuleEditor();

      const serverWarnings =
        Array.isArray(
          result &&
          result.validation &&
          result.validation.warnings
        )
          ? result.validation.warnings
          : [];

      await Swal.fire({
        icon:
          serverWarnings.length
            ? 'warning'
            : 'success',

        title:
          result.message ||
          'บันทึกโมดูลแล้ว',

        html:
          serverWarnings.length
            ? `
              <div class="swal-error-content">
                <div>
                  บันทึกสำเร็จ แต่มีคำเตือน
                </div>
                <ul class="admin-warning-list">
                  ${serverWarnings
                    .map(
                      (item) =>
                        `<li>${escapeHtml(item)}</li>`
                    )
                    .join('')}
                </ul>
              </div>
            `
            : '',

        confirmButtonText:
          'ตกลง'
      });

      await refreshDashboard();

    } catch (error) {
      Swal.close();

      await showApiError(
        error,
        'บันทึกโมดูลไม่สำเร็จ'
      );

    } finally {
      state.moduleSaving =
        false;

      setButtonLoading(
        saveButton,
        false
      );
    }
  }

  function readModulePayload() {
    const module = {
      moduleId: value('adminModuleId').toLowerCase(),
      name: value('adminModuleName'),
      description: value('adminModuleDescription'),
      status: value('adminModuleStatus'),
      sourceSpreadsheetId: extractSpreadsheetId(value('adminSourceSpreadsheetId')),
      sourceSheetName: value('adminSourceSheetName'),
      headerRow: numberValue('adminHeaderRow', 1),
      timestampInColumn: columnValue('adminTimestampInColumn'),
      timestampOutColumn: columnValue('adminTimestampOutColumn'),
      durationColumn: columnValue('adminDurationColumn'),
      currentStatusMethod: value('adminCurrentStatusMethod'),
      customStatusColumn: columnValue('adminCustomStatusColumn'),
      customStatusOperator: value('adminCustomStatusOperator'),
      customStatusValue: value('adminCustomStatusValue'),
      checkoutUserColumn: columnValue('adminCheckoutUserColumn'),
      afterCheckoutStatusColumn: columnValue('adminAfterCheckoutStatusColumn'),
      afterCheckoutStatusValue: value('adminAfterCheckoutStatusValue'),
      greenStartMinutes: numberValue('adminGreenStartMinutes', 0),
      warningStartMinutes: numberValue('adminWarningStartMinutes', 45),
      redStartMinutes: numberValue('adminRedStartMinutes', 60),
      alertEnabled: checked('adminAlertEnabled'),
      alertRepeatMinutes: numberValue('adminAlertRepeatMinutes', 10),
      refreshSeconds: numberValue('adminRefreshSeconds', 30),
      checkoutEnabled: checked('adminCheckoutEnabled'),
      receivingEnabled: checked('adminReceivingEnabled'),
      showToUsers: checked('adminShowToUsers'),
      historyEnabled: checked('adminHistoryEnabled'),
      calendarEnabled: checked('adminCalendarEnabled'),
      showCalendarToUsers: checked('adminShowCalendarToUsers'),
      historyMonths: numberValue('adminHistoryMonths', 12),
      calendarGroupBy: value('adminCalendarGroupBy'),
      dailySummaryEnabled: checked('adminDailySummaryEnabled'),
      soundEnabled: checked('adminSoundEnabled'),
      vibrationEnabled: checked('adminVibrationEnabled'),
      displayOrder: numberValue('adminModuleDisplayOrder', 100)
    };

    const filters = Array.from(document.querySelectorAll('#adminFilterRows [data-filter-row]'))
      .map((row, index) => ({
        filterId: row.dataset.filterId || '',
        order: index + 1,
        column: normalizeColumn(row.querySelector('[data-filter-column]')?.value),
        operator: row.querySelector('[data-filter-operator]')?.value || 'EQUALS',
        value: String(row.querySelector('[data-filter-value]')?.value || '').trim(),
        connector: row.querySelector('[data-filter-connector]')?.value || 'AND',
        ignoreCase: Boolean(row.querySelector('[data-filter-ignore-case]')?.checked),
        trim: Boolean(row.querySelector('[data-filter-trim]')?.checked),
        active: Boolean(row.querySelector('[data-filter-active]')?.checked)
      }));

    const fields = Array.from(document.querySelectorAll('#adminFieldRows [data-field-row]'))
      .map((row, index) => ({
        fieldRowId: row.dataset.fieldRowId || '',
        fieldId: String(row.querySelector('[data-field-id]')?.value || '').trim(),
        displayName: String(row.querySelector('[data-field-name]')?.value || '').trim(),
        sourceColumns: String(row.querySelector('[data-field-columns]')?.value || '')
          .split(',')
          .map(normalizeColumn)
          .filter(Boolean)
          .filter(
            (column, columnIndex, columns) =>
              columns.indexOf(column) ===
              columnIndex
          ),
        type: row.querySelector('[data-field-type]')?.value || 'TEXT',
        separator: String(row.querySelector('[data-field-separator]')?.value || ''),
        position: row.querySelector('[data-field-position]')?.value || 'BODY',
        order: index + 1,
        visible: Boolean(row.querySelector('[data-field-visible]')?.checked),
        adminOnly: Boolean(row.querySelector('[data-field-admin-only]')?.checked),
        searchable: Boolean(row.querySelector('[data-field-searchable]')?.checked),
        primary: Boolean(row.querySelector('[data-field-primary]')?.checked)
      }));

    return {
      expectedUpdatedAt: value('adminExpectedUpdatedAt'),
      module,
      filters,
      fields
    };
  }

  function validateModulePayload(payload) {
    const module =
      payload &&
      payload.module
        ? payload.module
        : {};

    const filters =
      Array.isArray(
        payload &&
        payload.filters
      )
        ? payload.filters
        : [];

    const fields =
      Array.isArray(
        payload &&
        payload.fields
      )
        ? payload.fields
        : [];

    const errors = [];
    const warnings = [];
    const issues = [];

    let firstTarget = '';

    const addError = (
      message,
      target
    ) => {
      const cleanMessage =
        String(
          message || ''
        ).trim();

      errors.push(
        cleanMessage
      );

      issues.push({
        severity:
          'error',

        message:
          cleanMessage,

        target:
          String(
            target || ''
          )
      });

      if (
        !firstTarget &&
        target
      ) {
        firstTarget =
          target;
      }
    };

    const addWarning = (
      message,
      target
    ) => {
      const cleanMessage =
        String(
          message || ''
        ).trim();

      warnings.push(
        cleanMessage
      );

      issues.push({
        severity:
          'warning',

        message:
          cleanMessage,

        target:
          String(
            target || ''
          )
      });
    };

    const limits =
      state.schema &&
      state.schema.limits
        ? state.schema.limits
        : {};

    const minRefreshSeconds =
      positiveInteger(
        limits.minRefreshSeconds,
        10
      );

    const maxRefreshSeconds =
      positiveInteger(
        limits.maxRefreshSeconds,
        3600
      );

    const maxHistoryMonths =
      positiveInteger(
        limits.maxHistoryMonths,
        120
      );

    const maxFilters =
      positiveInteger(
        limits.maxFiltersPerModule,
        50
      );

    const maxFields =
      positiveInteger(
        limits.maxFieldsPerModule,
        50
      );

    if (
      !/^[a-z0-9][a-z0-9_-]{1,49}$/
        .test(
          module.moduleId || ''
        )
    ) {
      addError(
        'รหัสโมดูลต้องยาว 2–50 ตัว และใช้เฉพาะ a-z, 0-9, _ หรือ -',
        '#adminModuleId'
      );
    }

    if (!module.name) {
      addError(
        'กรุณาระบุชื่อโมดูล',
        '#adminModuleName'
      );
    }

    if (
      String(
        module.name || ''
      ).length > 200
    ) {
      addError(
        'ชื่อโมดูลต้องไม่เกิน 200 ตัวอักษร',
        '#adminModuleName'
      );
    }

    if (
      String(
        module.description || ''
      ).length > 2000
    ) {
      addError(
        'คำอธิบายต้องไม่เกิน 2,000 ตัวอักษร',
        '#adminModuleDescription'
      );
    }

    if (
      !/^[A-Za-z0-9_-]{20,}$/
        .test(
          module.sourceSpreadsheetId ||
          ''
        )
    ) {
      addError(
        'กรุณาระบุ Google Spreadsheet ID ต้นทางให้ถูกต้อง',
        '#adminSourceSpreadsheetId'
      );
    }

    if (!module.sourceSheetName) {
      addError(
        'กรุณาระบุชื่อชีตต้นทาง',
        '#adminSourceSheetName'
      );
    }

    if (
      !Number.isInteger(
        module.headerRow
      ) ||
      module.headerRow < 1 ||
      module.headerRow > 100
    ) {
      addError(
        'แถวหัวตารางต้องเป็นจำนวนเต็มระหว่าง 1–100',
        '#adminHeaderRow'
      );
    }

    if (!module.timestampInColumn) {
      addError(
        'กรุณาระบุคอลัมน์เวลาเข้า',
        '#adminTimestampInColumn'
      );
    }

    if (
      module.greenStartMinutes < 0
    ) {
      addError(
        'นาทีเริ่มสีเขียวต้องไม่น้อยกว่า 0',
        '#adminGreenStartMinutes'
      );
    }

    if (
      module.warningStartMinutes <
      module.greenStartMinutes
    ) {
      addError(
        'นาทีเริ่มสีส้มต้องไม่น้อยกว่านาทีเริ่มสีเขียว',
        '#adminWarningStartMinutes'
      );
    }

    if (
      module.redStartMinutes <=
      module.warningStartMinutes
    ) {
      addError(
        'นาทีเริ่มสีแดงต้องมากกว่านาทีเริ่มสีส้ม',
        '#adminRedStartMinutes'
      );
    }

    if (
      module.alertEnabled &&
      (
        !Number.isInteger(
          module.alertRepeatMinutes
        ) ||
        module.alertRepeatMinutes < 1 ||
        module.alertRepeatMinutes > 1440
      )
    ) {
      addError(
        'นาทีแจ้งเตือนซ้ำต้องอยู่ระหว่าง 1–1,440 นาที',
        '#adminAlertRepeatMinutes'
      );
    }

    if (
      !Number.isInteger(
        module.refreshSeconds
      ) ||
      module.refreshSeconds <
        minRefreshSeconds ||
      module.refreshSeconds >
        maxRefreshSeconds
    ) {
      addError(
        `วินาทีรีเฟรชต้องอยู่ระหว่าง ${minRefreshSeconds}–${maxRefreshSeconds} วินาที`,
        '#adminRefreshSeconds'
      );
    }

    if (
      !Number.isInteger(
        module.historyMonths
      ) ||
      module.historyMonths < 1 ||
      module.historyMonths >
        maxHistoryMonths
    ) {
      addError(
        `เดือนย้อนหลังต้องอยู่ระหว่าง 1–${maxHistoryMonths} เดือน`,
        '#adminHistoryMonths'
      );
    }

    if (
      !Number.isInteger(
        module.displayOrder
      ) ||
      module.displayOrder < 1 ||
      module.displayOrder > 9999
    ) {
      addError(
        'ลำดับแสดงต้องเป็นจำนวนเต็มระหว่าง 1–9,999',
        '#adminModuleDisplayOrder'
      );
    }

    if (
      module.currentStatusMethod ===
      'TIMESTAMP_OUT_EMPTY_AND_DURATION_EMPTY'
    ) {
      if (!module.timestampOutColumn) {
        addError(
          'วิธีตรวจสถานะนี้ต้องระบุคอลัมน์เวลาออก',
          '#adminTimestampOutColumn'
        );
      }

      if (!module.durationColumn) {
        addError(
          'วิธีตรวจสถานะนี้ต้องระบุคอลัมน์ระยะเวลา',
          '#adminDurationColumn'
        );
      }
    }

    if (
      module.currentStatusMethod ===
        'TIMESTAMP_OUT_EMPTY' &&
      !module.timestampOutColumn
    ) {
      addError(
        'วิธีตรวจสถานะนี้ต้องระบุคอลัมน์เวลาออก',
        '#adminTimestampOutColumn'
      );
    }

    if (
      module.currentStatusMethod ===
      'CUSTOM'
    ) {
      if (!module.customStatusColumn) {
        addError(
          'สถานะกำหนดเองต้องระบุคอลัมน์สถานะ',
          '#adminCustomStatusColumn'
        );
      }

      if (!module.customStatusOperator) {
        addError(
          'สถานะกำหนดเองต้องระบุตัวดำเนินการ',
          '#adminCustomStatusOperator'
        );
      }

      if (
        module.customStatusOperator &&
        ![
          'IS_EMPTY',
          'IS_NOT_EMPTY'
        ].includes(
          module.customStatusOperator
        ) &&
        !module.customStatusValue
      ) {
        addError(
          'สถานะกำหนดเองต้องระบุค่าที่ใช้ตรวจสอบ',
          '#adminCustomStatusValue'
        );
      }
    }

    if (
      module.checkoutEnabled &&
      !module.timestampOutColumn
    ) {
      addError(
        'เมื่อเปิดบันทึกออก ต้องระบุคอลัมน์เวลาออก',
        '#adminTimestampOutColumn'
      );
    }

    if (
      module.checkoutEnabled &&
      !module.durationColumn
    ) {
      addError(
        'เมื่อเปิดบันทึกออก ต้องระบุคอลัมน์ระยะเวลา',
        '#adminDurationColumn'
      );
    }

    if (
      module.afterCheckoutStatusColumn &&
      !module.afterCheckoutStatusValue
    ) {
      addError(
        'เมื่อระบุคอลัมน์สถานะหลังออก ต้องระบุค่าสถานะหลังออก',
        '#adminAfterCheckoutStatusValue'
      );
    }

    if (
      module.afterCheckoutStatusValue &&
      !module.afterCheckoutStatusColumn
    ) {
      addError(
        'เมื่อระบุค่าสถานะหลังออก ต้องระบุคอลัมน์สถานะหลังออก',
        '#adminAfterCheckoutStatusColumn'
      );
    }

    const coreColumns = [
      [
        'คอลัมน์เวลาเข้า',
        module.timestampInColumn
      ],
      [
        'คอลัมน์เวลาออก',
        module.timestampOutColumn
      ],
      [
        'คอลัมน์ระยะเวลา',
        module.durationColumn
      ]
    ].filter(
      (item) =>
        Boolean(item[1])
    );

    const duplicateCoreColumns =
      findDuplicateValues(
        coreColumns.map(
          (item) =>
            item[1]
        )
      );

    if (
      duplicateCoreColumns.length >
      0
    ) {
      addError(
        'คอลัมน์เวลาเข้า เวลาออก และระยะเวลา ต้องไม่ใช้คอลัมน์เดียวกัน',
        '#adminTimestampInColumn'
      );
    }

    if (
      module.showCalendarToUsers &&
      !module.calendarEnabled
    ) {
      addError(
        'ต้องเปิดปฏิทินก่อน จึงจะแสดงปฏิทินแก่ User ได้',
        '#adminCalendarEnabled'
      );
    }

    if (
      module.status ===
        'PUBLISHED' &&
      !module.showToUsers
    ) {
      addWarning(
        'สถานะเป็น “เปิดใช้งาน” แต่ยังปิดการแสดงแก่ User'
      );
    }

    if (
      module.showToUsers &&
      module.status ===
        'DRAFT'
    ) {
      addWarning(
        'เปิดแสดงแก่ User แล้ว แต่สถานะโมดูลยังเป็นฉบับร่าง จึงยังไม่แสดงในหน้าผู้ใช้'
      );
    }

    if (
      filters.length >
      maxFilters
    ) {
      addError(
        `เงื่อนไขมีได้ไม่เกิน ${maxFilters} รายการ`,
        '#adminFilterRows'
      );
    }

    const activeFilters =
      filters.filter(
        (filter) =>
          filter.active
      );

    if (
      activeFilters.length ===
      0
    ) {
      addWarning(
        'ยังไม่มีเงื่อนไขที่เปิดใช้งาน โมดูลจะอ่านข้อมูลทุกแถวจากชีตต้นทาง'
      );
    }

    filters.forEach(
      (filter, index) => {
        const rowSelector =
          `#adminFilterRows [data-filter-row]:nth-child(${index + 1})`;

        if (!filter.column) {
          addError(
            `เงื่อนไขที่ ${index + 1} ยังไม่ระบุคอลัมน์`,
            `${rowSelector} [data-filter-column]`
          );
        }

        if (
          !Object.prototype
            .hasOwnProperty
            .call(
              LABELS.operators,
              filter.operator
            )
        ) {
          addError(
            `เงื่อนไขที่ ${index + 1} มีตัวดำเนินการไม่ถูกต้อง`,
            `${rowSelector} [data-filter-operator]`
          );
        }

        if (
          filter.active &&
          ![
            'IS_EMPTY',
            'IS_NOT_EMPTY'
          ].includes(
            filter.operator
          ) &&
          !filter.value
        ) {
          addError(
            `เงื่อนไขที่ ${index + 1} ยังไม่ระบุค่าที่ใช้กรอง`,
            `${rowSelector} [data-filter-value]`
          );
        }

        if (
          ![
            'AND',
            'OR'
          ].includes(
            filter.connector
          )
        ) {
          addError(
            `เงื่อนไขที่ ${index + 1} มีตัวเชื่อมไม่ถูกต้อง`,
            `${rowSelector} [data-filter-connector]`
          );
        }
      }
    );

    if (
      fields.length >
      maxFields
    ) {
      addError(
        `ฟิลด์มีได้ไม่เกิน ${maxFields} รายการ`,
        '#adminFieldRows'
      );
    }

    if (
      fields.length ===
      0
    ) {
      addError(
        'ต้องมีฟิลด์แสดงผลอย่างน้อย 1 รายการ',
        '#adminFieldRows'
      );
    }

    const fieldIds =
      fields.map(
        (field) =>
          String(
            field.fieldId || ''
          ).toLowerCase()
      );

    const duplicateFieldIds =
      findDuplicateValues(
        fieldIds.filter(Boolean)
      );

    if (
      duplicateFieldIds.length >
      0
    ) {
      addError(
        'พบรหัสฟิลด์ซ้ำ: ' +
        duplicateFieldIds.join(', '),
        '#adminFieldRows'
      );
    }

    const visibleFields =
      fields.filter(
        (field) =>
          field.visible &&
          field.position !==
            'HIDDEN'
      );

    if (
      visibleFields.length ===
      0
    ) {
      addError(
        'ต้องเปิดแสดงผลอย่างน้อย 1 ฟิลด์',
        '#adminFieldRows'
      );
    }

    const primaryFields =
      fields.filter(
        (field) =>
          field.primary &&
          field.visible &&
          field.position !==
            'HIDDEN'
      );

    if (
      primaryFields.length !==
      1
    ) {
      addError(
        'ต้องกำหนดฟิลด์ข้อมูลหลักที่แสดงบนหัวการ์ดจำนวน 1 รายการเท่านั้น',
        '#adminFieldRows'
      );
    }

    if (
      primaryFields.length ===
        1 &&
      primaryFields[0].adminOnly &&
      module.showToUsers
    ) {
      addError(
        'ฟิลด์ข้อมูลหลักต้องไม่เป็นข้อมูลเฉพาะ Admin เมื่อโมดูลแสดงแก่ User',
        '#adminFieldRows'
      );
    }

    fields.forEach(
      (field, index) => {
        const rowSelector =
          `#adminFieldRows [data-field-row]:nth-child(${index + 1})`;

        if (!field.fieldId) {
          addError(
            `ฟิลด์ที่ ${index + 1} ยังไม่ระบุรหัสฟิลด์`,
            `${rowSelector} [data-field-id]`
          );
        }

        if (!field.displayName) {
          addError(
            `ฟิลด์ที่ ${index + 1} ยังไม่ระบุชื่อที่แสดง`,
            `${rowSelector} [data-field-name]`
          );
        }

        if (
          field.sourceColumns.length ===
          0
        ) {
          addError(
            `ฟิลด์ที่ ${index + 1} ยังไม่ระบุคอลัมน์ต้นทาง`,
            `${rowSelector} [data-field-columns]`
          );
        }

        if (
          field.type !==
            'CONCAT' &&
          field.sourceColumns.length >
            1
        ) {
          addError(
            `ฟิลด์ “${field.displayName || index + 1}” ใช้หลายคอลัมน์ ต้องเลือกประเภท “รวมหลายคอลัมน์”`,
            `${rowSelector} [data-field-type]`
          );
        }

        if (
          !Object.prototype
            .hasOwnProperty
            .call(
              LABELS.fieldTypes,
              field.type
            )
        ) {
          addError(
            `ฟิลด์ที่ ${index + 1} มีประเภทข้อมูลไม่ถูกต้อง`,
            `${rowSelector} [data-field-type]`
          );
        }

        if (
          !Object.prototype
            .hasOwnProperty
            .call(
              LABELS.fieldPositions,
              field.position
            )
        ) {
          addError(
            `ฟิลด์ที่ ${index + 1} มีตำแหน่งแสดงไม่ถูกต้อง`,
            `${rowSelector} [data-field-position]`
          );
        }

        if (
          field.primary &&
          (
            !field.visible ||
            field.position ===
              'HIDDEN'
          )
        ) {
          addError(
            `ฟิลด์ข้อมูลหลักลำดับ ${index + 1} ต้องเปิดแสดงผลและห้ามอยู่ในตำแหน่งซ่อน`,
            `${rowSelector} [data-field-visible]`
          );
        }
      }
    );

    return {
      valid:
        errors.length ===
        0,

      errors,
      warnings,
      issues,
      firstTarget
    };
  }

  async function inspectSource() {
    const spreadsheetId = extractSpreadsheetId(value('adminSourceSpreadsheetId'));
    const sheetName = value('adminSourceSheetName');
    const headerRow = numberValue('adminHeaderRow', 1);

    if (!spreadsheetId) {
      await warning('กรุณาระบุ Spreadsheet ID ต้นทาง');
      return;
    }

    const button = byId('adminInspectSourceButton');
    setButtonLoading(button, true, 'กำลังตรวจสอบ...');

    try {
      if (!sheetName) {
        const result = await API.inspectAdminSource({ spreadsheetId });
        populateSheetOptions(result.sheets || []);
        setText(
          'adminSourceInspectStatus',
          `พบ ${result.sheets?.length || 0} ชีตใน ${result.spreadsheetName || 'Spreadsheet'}`
        );

        await Swal.fire({
          icon: 'success',
          title: 'อ่านรายชื่อชีตแล้ว',
          html: createSheetListHtml(result.sheets || []),
          confirmButtonText: 'ปิด',
          didOpen: () => {
            document
              .querySelectorAll('[data-select-sheet]')
              .forEach((sheetButton) => {
                sheetButton.addEventListener('click', () => {
                  setValue(
                    'adminSourceSheetName',
                    sheetButton.dataset.selectSheet || ''
                  );
                  Swal.close();
                });
              });
          }
        });
        return;
      }

      const result = await API.inspectAdminSource({
        spreadsheetId,
        sheetName,
        headerRow,
        sampleRows: 3
      });

      state.sourceMetadata = result;
      populateColumnOptions(result.headers || []);
      setText(
        'adminSourceInspectStatus',
        `ตรวจแล้ว ${result.lastRow || 0} แถว • ${result.lastColumn || 0} คอลัมน์ • ${result.checkedAt || ''}`
      );

      await Swal.fire({
        icon: result.duplicateHeaders?.length ? 'warning' : 'success',
        title: 'ตรวจสอบแหล่งข้อมูลสำเร็จ',
        html: createSourceMetadataHtml(result),
        confirmButtonText: 'ตกลง',
        width: 900
      });
    } catch (error) {
      await showApiError(error, 'ตรวจสอบแหล่งข้อมูลไม่สำเร็จ');
    } finally {
      setButtonLoading(button, false);
    }
  }

  function populateSheetOptions(sheets) {
    const datalist = byId('adminSourceSheetOptions');
    if (!datalist) return;
    datalist.innerHTML = sheets.map((sheet) => (
      `<option value="${escapeHtml(sheet.name || '')}">${Number(sheet.rowCount || 0)} แถว</option>`
    )).join('');
  }

  function populateColumnOptions(headers) {
    const datalist = byId('adminSourceColumnOptions');
    if (!datalist) return;
    datalist.innerHTML = headers.map((item) => (
      `<option value="${escapeHtml(item.column || '')}">${escapeHtml(item.header || '(ไม่มีหัวคอลัมน์)')}</option>`
    )).join('');
  }

  function addFilterRow(filter = {}) {
    const container = byId('adminFilterRows');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'admin-dynamic-row admin-filter-row';
    row.dataset.filterRow = 'true';
    row.dataset.filterId = filter.filterId || '';

    row.innerHTML = `
      <div class="admin-dynamic-row__number"></div>
      <label class="row-field row-field--column"><span>คอลัมน์</span><input data-filter-column list="adminSourceColumnOptions" maxlength="3" value="${escapeHtml(filter.column || '')}"></label>
      <label class="row-field row-field--operator"><span>ตัวดำเนินการ</span><select data-filter-operator>${operatorOptions(filter.operator || 'EQUALS')}</select></label>
      <label class="row-field row-field--value"><span>ค่าที่ใช้กรอง</span><input data-filter-value value="${escapeHtml(filter.value || '')}"></label>
      <label class="row-field row-field--connector"><span>เชื่อมด้วย</span><select data-filter-connector><option value="AND" ${filter.connector !== 'OR' ? 'selected' : ''}>AND</option><option value="OR" ${filter.connector === 'OR' ? 'selected' : ''}>OR</option></select></label>
      <div class="admin-dynamic-checks">
        ${miniCheck('ไม่สนตัวพิมพ์', 'data-filter-ignore-case', filter.ignoreCase !== false)}
        ${miniCheck('ตัดช่องว่าง', 'data-filter-trim', filter.trim !== false)}
        ${miniCheck('ใช้งาน', 'data-filter-active', filter.active !== false)}
      </div>
      <button class="admin-remove-row" type="button" data-remove-row>ลบ</button>
    `;

    container.appendChild(row);
    updateDynamicCounts();
  }

  function addFieldRow(field = {}) {
    const container = byId('adminFieldRows');
    if (!container) return;

    const row = document.createElement('div');
    row.className = 'admin-dynamic-row admin-field-row';
    row.dataset.fieldRow = 'true';
    row.dataset.fieldRowId = field.fieldRowId || '';

    row.innerHTML = `
      <div class="admin-dynamic-row__number"></div>
      <label class="row-field row-field--field-id"><span>รหัสฟิลด์</span><input data-field-id maxlength="100" value="${escapeHtml(field.fieldId || '')}"></label>
      <label class="row-field row-field--field-name"><span>ชื่อที่แสดง</span><input data-field-name maxlength="150" value="${escapeHtml(field.displayName || '')}"></label>
      <label class="row-field row-field--field-columns"><span>คอลัมน์ต้นทาง (คั่นด้วย ,)</span><input data-field-columns list="adminSourceColumnOptions" value="${escapeHtml((field.sourceColumns || []).join(','))}"></label>
      <label class="row-field row-field--field-type"><span>ประเภท</span><select data-field-type>${fieldTypeOptions(field.type || 'TEXT')}</select></label>
      <label class="row-field row-field--field-position"><span>ตำแหน่ง</span><select data-field-position>${fieldPositionOptions(field.position || 'BODY')}</select></label>
      <label class="row-field row-field--field-separator"><span>ตัวคั่น</span><input data-field-separator maxlength="20" value="${escapeHtml(field.separator ?? ' ')}"></label>
      <div class="admin-dynamic-checks">
        ${miniCheck('แสดงผล', 'data-field-visible', field.visible !== false)}
        ${miniCheck('เฉพาะ Admin', 'data-field-admin-only', Boolean(field.adminOnly))}
        ${miniCheck('ค้นหาได้', 'data-field-searchable', field.searchable !== false)}
        ${miniCheck('ข้อมูลหลัก', 'data-field-primary', Boolean(field.primary))}
      </div>
      <button class="admin-remove-row" type="button" data-remove-row>ลบ</button>
    `;

    const primaryCheckbox =
      row.querySelector(
        '[data-field-primary]'
      );

    const visibleCheckbox =
      row.querySelector(
        '[data-field-visible]'
      );

    const positionSelect =
      row.querySelector(
        '[data-field-position]'
      );

    primaryCheckbox?.addEventListener(
      'change',
      (event) => {
        if (!event.target.checked) {
          return;
        }

        document
          .querySelectorAll(
            '#adminFieldRows [data-field-primary]'
          )
          .forEach(
            (checkbox) => {
              if (
                checkbox !==
                event.target
              ) {
                checkbox.checked =
                  false;
              }
            }
          );

        if (visibleCheckbox) {
          visibleCheckbox.checked =
            true;
        }

        if (
          positionSelect &&
          positionSelect.value ===
            'HIDDEN'
        ) {
          positionSelect.value =
            'HEADER';
        }
      }
    );

    positionSelect?.addEventListener(
      'change',
      () => {
        if (
          positionSelect.value !==
          'HIDDEN'
        ) {
          return;
        }

        if (visibleCheckbox) {
          visibleCheckbox.checked =
            false;
        }

        if (primaryCheckbox) {
          primaryCheckbox.checked =
            false;
        }
      }
    );

    visibleCheckbox?.addEventListener(
      'change',
      () => {
        if (
          visibleCheckbox.checked
        ) {
          return;
        }

        if (primaryCheckbox) {
          primaryCheckbox.checked =
            false;
        }
      }
    );

    container.appendChild(row);
    updateDynamicCounts();
  }

  function handleDynamicRowClick(event) {
    const button = event.target.closest('[data-remove-row]');
    if (!button) return;
    button.closest('.admin-dynamic-row')?.remove();
    updateDynamicCounts();
  }

  function updateDynamicCounts() {
    document.querySelectorAll('#adminFilterRows [data-filter-row]').forEach((row, index) => {
      const number = row.querySelector('.admin-dynamic-row__number');
      if (number) number.textContent = String(index + 1);
    });

    document.querySelectorAll('#adminFieldRows [data-field-row]').forEach((row, index) => {
      const number = row.querySelector('.admin-dynamic-row__number');
      if (number) number.textContent = String(index + 1);
    });

    setText(
      'adminFilterCount',
      document.querySelectorAll('#adminFilterRows [data-filter-row]').length + ' เงื่อนไข'
    );
    setText(
      'adminFieldCount',
      document.querySelectorAll('#adminFieldRows [data-field-row]').length + ' ฟิลด์'
    );

    if (
      state.moduleValidationTouched &&
      !state.moduleValidationRunning
    ) {
      scheduleModuleValidation();
    }
  }

  async function duplicateModule(moduleId) {
    const result = await Swal.fire({
      icon: 'question',
      title: 'คัดลอกโมดูล',
      html: `
        <div class="swal-form">
          <label class="swal-form-field"><span>รหัสโมดูลใหม่</span><input id="duplicateModuleId" class="swal2-input" placeholder="vendor-new"></label>
          <label class="swal-form-field"><span>ชื่อโมดูลใหม่</span><input id="duplicateModuleName" class="swal2-input" placeholder="สถานะรถ Vendor ใหม่"></label>
          <label class="swal-form-field"><span>คำอธิบาย</span><input id="duplicateModuleDescription" class="swal2-input" placeholder="ไม่บังคับ"></label>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'คัดลอก',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      focusConfirm: false,
      preConfirm: () => {
        const newModuleId = String(byId('duplicateModuleId')?.value || '').trim().toLowerCase();
        const newModuleName = String(byId('duplicateModuleName')?.value || '').trim();
        const description = String(byId('duplicateModuleDescription')?.value || '').trim();

        if (!/^[a-z0-9][a-z0-9_-]{1,49}$/.test(newModuleId)) {
          Swal.showValidationMessage('รหัสโมดูลใหม่ไม่ถูกต้อง');
          return false;
        }
        if (!newModuleName) {
          Swal.showValidationMessage('กรุณาระบุชื่อโมดูลใหม่');
          return false;
        }
        return { sourceModuleId: moduleId, newModuleId, newModuleName, description };
      }
    });

    if (!result.isConfirmed) return;
    showLoading('กำลังคัดลอกโมดูล', 'โมดูลใหม่จะเริ่มเป็นฉบับร่าง');

    try {
      const response = await API.duplicateAdminModule(result.value);
      Swal.close();
      await success(response.message || 'คัดลอกโมดูลแล้ว');
      await refreshDashboard();
    } catch (error) {
      Swal.close();
      await showApiError(error, 'คัดลอกโมดูลไม่สำเร็จ');
    }
  }

  async function archiveModule(moduleId) {
    const confirmation = await Swal.fire({
      icon: 'warning',
      title: 'เก็บโมดูลเป็นฉบับร่าง?',
      text: 'โมดูลจะไม่แสดงแก่ผู้ใช้ แต่ข้อมูลและการตั้งค่าจะไม่ถูกลบ',
      showCancelButton: true,
      confirmButtonText: 'เก็บเป็นร่าง',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (!confirmation.isConfirmed) return;
    showLoading('กำลังปรับสถานะโมดูล', moduleId);

    try {
      const response = await API.archiveAdminModule(moduleId);
      Swal.close();
      await success(response.message || 'เก็บโมดูลเป็นฉบับร่างแล้ว');
      await refreshDashboard();
    } catch (error) {
      Swal.close();
      await showApiError(error, 'ปรับสถานะโมดูลไม่สำเร็จ');
    }
  }

  async function handleUserListClick(event) {
    const button = event.target.closest('[data-user-action]');
    if (!button) return;

    const card = button.closest('[data-user-id]');
    const userId = card?.dataset.userId || '';
    const user = (state.dashboard?.users || []).find((item) => item.userId === userId);
    if (!user) return;

    if (button.dataset.userAction === 'edit') {
      await openUserDialog(user);
    } else if (button.dataset.userAction === 'reset-password') {
      await resetUserPassword(user);
    } else if (button.dataset.userAction === 'unlock') {
      await unlockUser(user);
    }
  }

  function buildUserRoleOptions(selectedRole) {
    const schemaRoles =
      Array.isArray(state.schema?.enums?.userRoles) &&
      state.schema.enums.userRoles.length > 0
        ? state.schema.enums.userRoles
        : ['USER', 'INBOUND', 'ADMIN'];

    const cleanSelected =
      String(selectedRole || 'USER')
        .trim()
        .toUpperCase();

    return schemaRoles
      .map((role) => {
        const value =
          String(role || '')
            .trim()
            .toUpperCase();

        if (!value) {
          return '';
        }

        const label =
          LABELS.roles[value]
            ? value + ' - ' + LABELS.roles[value]
            : value;

        return `
          <option
            value="${escapeHtml(value)}"
            ${value === cleanSelected ? 'selected' : ''}
          >
            ${escapeHtml(label)}
          </option>
        `;
      })
      .join('');
  }

  async function openUserDialog(user) {
    const isEdit = Boolean(user);
    const generatedPassword = generateTemporaryPassword();

    const result = await Swal.fire({
      width: 650,
      title: isEdit ? 'แก้ไขผู้ใช้งาน' : 'สร้างผู้ใช้งาน',
      html: `
        <div class="swal-form">
          <label class="swal-form-field"><span>ชื่อผู้ใช้</span><input id="userUsername" class="swal2-input" value="${escapeHtml(user?.username || '')}" ${isEdit ? 'disabled' : ''}></label>
          <label class="swal-form-field"><span>ชื่อแสดงผล</span><input id="userDisplayName" class="swal2-input" value="${escapeHtml(user?.displayName || '')}"></label>
          <label class="swal-form-field"><span>สิทธิ์</span><select id="userRole" class="swal2-select">${buildUserRoleOptions(user?.role || 'USER')}</select></label>
          ${!isEdit ? `<label class="swal-form-field"><span>รหัสผ่านชั่วคราว</span><input id="userTemporaryPassword" class="swal2-input" value="${escapeHtml(generatedPassword)}"></label>` : ''}
          <label class="swal-switch-row"><input id="userActive" type="checkbox" ${user?.active !== false ? 'checked' : ''}><span>เปิดใช้งานบัญชี</span></label>
          <label class="swal-switch-row"><input id="userMustChange" type="checkbox" ${user?.mustChangePassword !== false ? 'checked' : ''}><span>บังคับเปลี่ยนรหัสผ่าน</span></label>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      focusConfirm: false,
      preConfirm: () => {
        const payload = {
          userId: user?.userId || '',
          username: String(byId('userUsername')?.value || '').trim().toLowerCase(),
          displayName: String(byId('userDisplayName')?.value || '').trim(),
          role: byId('userRole')?.value || 'USER',
          active: Boolean(byId('userActive')?.checked),
          mustChangePassword: Boolean(byId('userMustChange')?.checked)
        };

        if (!isEdit) payload.temporaryPassword = String(byId('userTemporaryPassword')?.value || '');
        if (!/^[a-z0-9][a-z0-9._-]{2,79}$/.test(payload.username)) {
          Swal.showValidationMessage('ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัว และใช้ a-z, 0-9, ., _, -');
          return false;
        }
        if (!payload.displayName) {
          Swal.showValidationMessage('กรุณาระบุชื่อแสดงผล');
          return false;
        }
        if (!isEdit && !validatePassword(payload.temporaryPassword, payload.username)) {
          Swal.showValidationMessage('รหัสผ่านต้องยาวอย่างน้อย 10 ตัว มีตัวอักษรและตัวเลข และไม่มีชื่อผู้ใช้');
          return false;
        }
        return payload;
      }
    });

    if (!result.isConfirmed) return;
    showLoading('กำลังบันทึกผู้ใช้งาน', 'กรุณารอสักครู่');

    try {
      const response = await API.saveAdminUser(result.value);
      Swal.close();
      await success(response.message || 'บันทึกผู้ใช้งานแล้ว');
      await refreshDashboard();
    } catch (error) {
      Swal.close();
      await showApiError(error, 'บันทึกผู้ใช้งานไม่สำเร็จ');
    }
  }

  async function resetUserPassword(user) {
    const suggested = generateTemporaryPassword();

    const result = await Swal.fire({
      icon: 'warning',
      title: 'รีเซ็ตรหัสผ่าน',
      html: `
        <div class="swal-form">
          <div class="admin-confirm-box"><strong>${escapeHtml(user.displayName || user.username)}</strong><span>${escapeHtml(user.username)}</span></div>
          <label class="swal-form-field"><span>รหัสผ่านใหม่</span><input id="resetPasswordValue" class="swal2-input" value="${escapeHtml(suggested)}"></label>
          <label class="swal-switch-row"><input id="resetMustChange" type="checkbox" checked><span>บังคับเปลี่ยนรหัสผ่านเมื่อเข้าสู่ระบบ</span></label>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'รีเซ็ตรหัสผ่าน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      focusConfirm: false,
      preConfirm: () => {
        const newPassword = String(byId('resetPasswordValue')?.value || '');
        if (!validatePassword(newPassword, user.username)) {
          Swal.showValidationMessage('รหัสผ่านต้องยาวอย่างน้อย 10 ตัว มีตัวอักษรและตัวเลข และไม่มีชื่อผู้ใช้');
          return false;
        }
        return {
          userId: user.userId,
          newPassword,
          mustChangePassword: Boolean(byId('resetMustChange')?.checked)
        };
      }
    });

    if (!result.isConfirmed) return;
    showLoading('กำลังรีเซ็ตรหัสผ่าน', 'กรุณารอสักครู่');

    try {
      const response = await API.resetAdminUserPassword(result.value);
      Swal.close();
      await Swal.fire({
        icon: 'success',
        title: response.message || 'รีเซ็ตรหัสผ่านแล้ว',
        html: `<div class="admin-password-result"><span>รหัสผ่านใหม่</span><strong>${escapeHtml(result.value.newPassword)}</strong><small>คัดลอกและส่งให้ผู้ใช้งานผ่านช่องทางที่ปลอดภัย</small></div>`,
        confirmButtonText: 'ปิด',
        allowOutsideClick: false
      });
      await refreshDashboard();
    } catch (error) {
      Swal.close();
      await showApiError(error, 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
    }
  }

  async function unlockUser(user) {
    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'ปลดล็อกบัญชี?',
      text: user.displayName || user.username,
      showCancelButton: true,
      confirmButtonText: 'ปลดล็อก',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (!confirmation.isConfirmed) return;
    showLoading('กำลังปลดล็อกบัญชี', 'กรุณารอสักครู่');

    try {
      const response = await API.unlockAdminUser(user.userId);
      Swal.close();
      await success(response.message || 'ปลดล็อกบัญชีแล้ว');
      await refreshDashboard();
    } catch (error) {
      Swal.close();
      await showApiError(error, 'ปลดล็อกบัญชีไม่สำเร็จ');
    }
  }

  async function saveSettings(event) {
    event.preventDefault();

    const settings = {};

    document.querySelectorAll('[data-setting-key]').forEach((input) => {
      const key = input.dataset.settingKey;

      if (
        input.dataset.settingSelectCustom === 'TRUE' &&
        String(input.value || '').toUpperCase() === 'CUSTOM'
      ) {
        const customInput = document.querySelector(
          `[data-setting-custom-for="${cssEscape(key)}"]`
        );
        settings[key] = Number(customInput?.value);
        return;
      }

      if (input.type === 'checkbox') {
        settings[key] = input.checked;
      } else if (
        input.type === 'number' ||
        input.dataset.settingNumber === 'TRUE'
      ) {
        settings[key] = Number(input.value);
      } else {
        settings[key] = String(input.value || '').trim();
      }
    });

    if (settings.INBOUND_WORKFLOW_ENABLED === false) {
      settings.INBOUND_SUBMIT_SCAN_REQUIRED = false;
      settings.INBOUND_RETURN_SCAN_REQUIRED = false;
    }

    const autoCloseHours = Number(settings.AUTO_CLOSE_HOURS);

    if (
      !Number.isInteger(autoCloseHours) ||
      autoCloseHours < 1 ||
      autoCloseHours > 168
    ) {
      const select = document.querySelector(
        '[data-setting-key="AUTO_CLOSE_HOURS"]'
      );
      const customInput = document.querySelector(
        '[data-setting-custom-for="AUTO_CLOSE_HOURS"]'
      );

      if (select) {
        select.value = 'CUSTOM';
        syncAdminCustomSettingControls(select);
      }

      await Swal.fire({
        icon: 'warning',
        title: 'เวลาที่กำหนดไม่ถูกต้อง',
        text: 'กรุณากรอกจำนวนเต็มตั้งแต่ 1 ถึง 168 ชั่วโมง',
        confirmButtonText: 'แก้ไข'
      });
      customInput?.focus();
      customInput?.select();
      return;
    }

    const currentSettings = state.dashboard?.settings || {};
    const changedKeys = Object.keys(settings).filter((key) => (
      adminSettingComparable(currentSettings[key]?.value) !==
      adminSettingComparable(settings[key])
    ));

    if (changedKeys.length === 0) {
      await Swal.fire({
        icon: 'info',
        title: 'ไม่มีค่าที่เปลี่ยนแปลง',
        confirmButtonText: 'ปิด'
      });
      return;
    }

    const currentAutoCloseValue = currentSettings.AUTO_CLOSE_HOURS?.value;
    const currentAutoCloseHours = Number(currentAutoCloseValue);
    const hasCurrentAutoClose = Number.isInteger(currentAutoCloseHours);
    const nextAutoCloseHours = Number(settings.AUTO_CLOSE_HOURS);
    const autoCloseChanged = changedKeys.includes('AUTO_CLOSE_HOURS');
    const impactMessage = autoCloseChanged
      ? `
        <div class="admin-setting-confirm">
          <div>
            <span>ค่าปัจจุบัน</span>
            <strong>${
              hasCurrentAutoClose
                ? escapeHtml(String(currentAutoCloseHours)) + ' ชั่วโมง'
                : 'ยังไม่ได้กำหนด'
            }</strong>
          </div>
          <div>
            <span>ค่าใหม่</span>
            <strong>${escapeHtml(String(nextAutoCloseHours))} ชั่วโมง</strong>
          </div>
        </div>
        <p class="admin-setting-confirm-note">
          ${
            hasCurrentAutoClose && nextAutoCloseHours < currentAutoCloseHours
              ? 'รายการที่ยังไม่มีเวลาออกและมีอายุเกินค่าใหม่ อาจถูกเคลียร์ในรอบทำงานถัดไป'
              : 'ค่าใหม่จะใช้กับทุก Module ในรอบ Auto Close ถัดไป'
          }
        </p>
      `
      : `<p>กำลังเปลี่ยนการตั้งค่า ${changedKeys.length} รายการ</p>`;

    const confirmation = await Swal.fire({
      icon: autoCloseChanged ? 'warning' : 'question',
      title: 'บันทึกการตั้งค่าระบบ?',
      html: impactMessage,
      input: 'textarea',
      inputLabel: 'เหตุผลการเปลี่ยน',
      inputPlaceholder: 'ระบุเหตุผลอย่างน้อย 5 ตัวอักษร',
      inputAttributes: {
        maxlength: '500',
        'aria-label': 'เหตุผลการเปลี่ยนการตั้งค่า'
      },
      inputValidator: (value) => {
        const reason = String(value || '').trim();
        if (reason.length < 5) {
          return 'กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร';
        }
        return undefined;
      },
      showCancelButton: true,
      confirmButtonText: 'บันทึก',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      focusConfirm: false
    });

    if (!confirmation.isConfirmed) return;

    showLoading(
      'กำลังบันทึกการตั้งค่า',
      'ระบบกำลังสร้าง Revision และตรวจอ่านค่ากลับจากฐานข้อมูล'
    );
    state.settingsSaveInFlight = true;
    updateAdminSettingsSaveBar();

    try {
      const response = await API.saveAdminSettings({
        settings,
        changeReason: String(confirmation.value || '').trim(),
        effectiveAt: new Date().toISOString()
      });

      const verifiedDashboard = await verifyAdminSettingsReadback(settings);
      let readbackVerified = false;

      if (verifiedDashboard) {
        state.dashboard = verifiedDashboard;
        state.settingsSource = 'SERVER';
        state.settingsLastConfirmedAt =
          verifiedDashboard.generatedAt || formatBangkokDateTime(new Date());
        readbackVerified = true;
      } else if (
        response &&
        response.settings &&
        adminSettingsMatchExpected(response.settings, settings)
      ) {
        if (!state.dashboard) state.dashboard = {};
        state.dashboard.settings = response.settings;
        state.settingsSource = 'SERVER_RESPONSE';
        state.settingsLastConfirmedAt = formatBangkokDateTime(new Date());
      } else {
        throw createLocalError(
          'SETTINGS_READBACK_MISMATCH',
          'Backend รับคำสั่งแล้ว แต่ค่าที่อ่านกลับยังไม่ตรง กรุณากดรีเฟรชก่อนเปลี่ยนค่าเพิ่มเติม'
        );
      }

      state.savedSettingsSignature =
        buildAdminSettingsSignature(state.dashboard.settings || {});
      state.settingsDirty = false;
      persistAuthoritativeAdminSettings(state.dashboard.settings || {}, {
        source: readbackVerified ? 'SERVER_READBACK' : 'SERVER_SAVE_RESPONSE'
      });
      state.dashboardSignature =
        buildAdminDashboardSignature(state.dashboard);

      Swal.close();
      renderSettings();

      await success(
        (response.message || 'บันทึกการตั้งค่าแล้ว') +
        (response.revision ? ` · ${response.revision}` : '') +
        (readbackVerified ? ' · ตรวจอ่านกลับแล้ว' : ' · บันทึกแล้ว รอตรวจรอบถัดไป')
      );
    } catch (error) {
      Swal.close();
      await showApiError(error, 'บันทึกการตั้งค่าไม่สำเร็จ');
    } finally {
      state.settingsSaveInFlight = false;
      updateAdminSettingsSaveBar();
    }
  }

  async function loadAuditFromFilter(event) {
    event.preventDefault();
    await loadAudit({
      username: value('adminAuditUsername'),
      moduleId: value('adminAuditModuleId'),
      action: value('adminAuditAction'),
      limit: numberValue('adminAuditLimit', 50)
    });
  }

  async function loadAudit(options) {
    const container = byId('adminAuditList');
    if (container) container.innerHTML = loadingHtml('กำลังโหลดประวัติ');

    try {
      const list = await API.getAdminAudit(options || {});
      renderAudit(list, 'adminAuditList');
    } catch (error) {
      if (container) container.innerHTML = emptyHtml('โหลดประวัติไม่สำเร็จ', buildErrorMessage(error));
      await showApiError(error, 'โหลดประวัติไม่สำเร็จ');
    }
  }

  async function loadVcwCleanupStatus(showFeedback) {
    if (!API || typeof API.getVcwRouterCleanupStatus !== 'function') return null;
    try {
      const status = await API.getVcwRouterCleanupStatus();
      state.vcwCleanupStatus = status;
      renderVcwCleanupStatus(status);
      if (showFeedback) {
        await Swal.fire({
          icon: status.strictMode ? 'success' : status.canEnableStrictMode ? 'info' : 'warning',
          title: status.strictMode ? 'Strict Mode ทำงานอยู่' : 'ตรวจสถานะ Router แล้ว',
          text: status.recommendation || '',
          confirmButtonText: 'รับทราบ'
        });
      }
      return status;
    } catch (error) {
      if (showFeedback) await showApiError(error, 'ตรวจ Router Cleanup ไม่สำเร็จ');
      throw error;
    }
  }

  function renderVcwCleanupStatus(status) {
    const data = status && typeof status === 'object' ? status : {};
    const fallback = data.fallback && typeof data.fallback === 'object' ? data.fallback : {};
    const readiness = data.readiness && typeof data.readiness === 'object' ? data.readiness : {};
    setText('adminVcwRouterMode', data.mode || '-');
    setText('adminVcwStrictMode', data.strictMode ? 'เปิดใช้งาน' : 'Compatibility');
    setText('adminVcwFallbackCount', Number(fallback.total || 0).toLocaleString('th-TH'));
    setText('adminVcwFallbackLastUsed', fallback.lastUsedAt || 'ไม่พบ');
    setText('adminVcwMissingActions', Array.isArray(readiness.missingActions) && readiness.missingActions.length ? readiness.missingActions.join(', ') : 'ไม่มี');
    setText('adminVcwPhysicalRemoval', data.physicalRemovalEligible ? 'พร้อม' : 'ยังไม่พร้อม');
    setText('adminVcwCleanupRecommendation', data.recommendation || '-');
    const enable = byId('adminVcwStrictEnableButton');
    const disable = byId('adminVcwStrictDisableButton');
    const reset = byId('adminVcwFallbackResetButton');
    if (enable) enable.disabled = data.strictMode === true || data.canEnableStrictMode !== true;
    if (disable) disable.disabled = data.strictMode !== true;
    if (reset) reset.disabled = data.strictMode === true || Number(fallback.total || 0) === 0;
  }

  async function resetVcwFallbackCounters() {
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'รีเซ็ต Deprecated Fallback Counter?',
      text: 'ใช้เมื่อวาง Router ครบแล้ว จากนั้นควรทดสอบระบบจริงอีกครั้งก่อนเปิด Strict Mode',
      showCancelButton: true,
      confirmButtonText: 'รีเซ็ต Counter',
      cancelButtonText: 'ยกเลิก',
      focusCancel: true
    });
    if (!confirm.isConfirmed) return;
    showLoading('กำลังรีเซ็ต Counter', 'ไม่แก้ข้อมูลรถหรือ Workflow Event');
    try {
      const status = await API.resetVcwFallbackCounters({ confirmed: true });
      Swal.close();
      state.vcwCleanupStatus = status;
      renderVcwCleanupStatus(status);
      await Swal.fire({ icon: 'success', title: 'รีเซ็ตแล้ว', text: 'ให้ทดลอง Fast Scan, Receiving และ Dashboard ก่อนเปิด Strict Mode', confirmButtonText: 'รับทราบ' });
    } catch (error) {
      Swal.close();
      await showApiError(error, 'รีเซ็ต Counter ไม่สำเร็จ');
    }
  }

  async function enableVcwStrictMode() {
    const status = state.vcwCleanupStatus || await loadVcwCleanupStatus(false);
    if (!status || status.canEnableStrictMode !== true) {
      await Swal.fire({ icon: 'warning', title: 'ยังเปิด Strict Mode ไม่ได้', text: status && status.recommendation || 'กรุณาตรวจ Acceptance และ Fallback Counter', confirmButtonText: 'รับทราบ' });
      return;
    }
    const confirm = await Swal.fire({
      icon: 'warning',
      title: 'เปิด Central Router Strict Mode?',
      html: '<p>Direct Fallback จะหยุดทำงาน หาก Router กลางหายระบบจะหยุดพร้อม Error ชัดเจนแทนการวิ่งเส้นทางเก่า</p><p><strong>ควรทำหลัง Production Acceptance ผ่านเท่านั้น</strong></p>',
      showCancelButton: true,
      confirmButtonText: 'ยืนยันเปิด Strict Mode',
      cancelButtonText: 'ยกเลิก',
      focusCancel: true
    });
    if (!confirm.isConfirmed) return;
    showLoading('กำลังเปิด Strict Mode', 'ตรวจ Router และ Action ซ้ำก่อนบันทึก');
    try {
      const result = await API.enableVcwRouterStrictMode({ confirmed: true });
      Swal.close();
      state.vcwCleanupStatus = result;
      renderVcwCleanupStatus(result);
      await Swal.fire({ icon: 'success', title: 'เปิด Strict Mode แล้ว', text: 'ทดลอง Inbound, Receiving และ Dashboard ทันที หากมีปัญหาสามารถกลับ Compatibility ได้', confirmButtonText: 'รับทราบ' });
    } catch (error) {
      Swal.close();
      await showApiError(error, 'เปิด Strict Mode ไม่สำเร็จ');
    }
  }

  async function disableVcwStrictMode() {
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'กลับไป Compatibility Mode?',
      text: 'Direct Fallback จะกลับมาเป็นทางสำรองชั่วคราว โดยไม่กระทบข้อมูลธุรกิจ',
      showCancelButton: true,
      confirmButtonText: 'กลับ Compatibility',
      cancelButtonText: 'ยกเลิก'
    });
    if (!confirm.isConfirmed) return;
    showLoading('กำลังเปลี่ยนโหมด', 'เปิด Compatibility Fallback ชั่วคราว');
    try {
      const result = await API.disableVcwRouterStrictMode({ confirmed: true });
      Swal.close();
      state.vcwCleanupStatus = result;
      renderVcwCleanupStatus(result);
      await Swal.fire({ icon: 'success', title: 'กลับ Compatibility แล้ว', confirmButtonText: 'รับทราบ' });
    } catch (error) {
      Swal.close();
      await showApiError(error, 'เปลี่ยนโหมดไม่สำเร็จ');
    }
  }

  async function validateSystem(mode) {
    if(state.diagnosticsRunning)return;state.diagnosticsRunning=true;setDiagnosticButtons(true);showLoading('กำลังตรวจสอบระบบ','ตรวจ Frontend, Queue, Revision, SLA, Alert, Trigger และ Export');
    try{const client=await getProductionClientDiagnostics();const result=await API.runProductionDiagnostics({mode:String(mode||'DEEP').toUpperCase(),includeReadProbe:mode!=='QUICK',includeExportProbe:mode!=='QUICK',clientDiagnostics:client});mergeClientDiagnostics(result,client);Swal.close();state.diagnosticsResult=result;renderValidation(result);updateDiagnosticMeta(result,client);switchTab('system');await diagnosticDone(result,'ตรวจระบบ');}
    catch(error){Swal.close();await showApiError(error,'ตรวจสอบระบบไม่สำเร็จ');}finally{state.diagnosticsRunning=false;setDiagnosticButtons(false);}
  }

  async function runProductionAcceptance(){
    if(state.diagnosticsRunning)return;state.diagnosticsRunning=true;setDiagnosticButtons(true);showLoading('กำลังทดสอบ Production Acceptance','รวม Concurrency 6 คำขอพร้อมกัน');
    try{const client=await getProductionClientDiagnostics();const result=await API.runProductionAcceptance({includeReadProbe:true,includeExportProbe:true,clientDiagnostics:client});mergeClientDiagnostics(result,client);const concurrency=await runConcurrency();result.concurrency=concurrency;result.checks=[buildConcurrencyCheck(concurrency),...(Array.isArray(result.checks)?result.checks:[])];result.summary=summarizeDiagnostics(result.checks);result.success=result.summary.failed===0;Swal.close();state.diagnosticsResult=result;renderValidation(result);updateDiagnosticMeta(result,client);switchTab('system');await diagnosticDone(result,'Production Acceptance');}
    catch(error){Swal.close();await showApiError(error,'Production Acceptance ไม่สำเร็จ');}finally{state.diagnosticsRunning=false;setDiagnosticButtons(false);}
  }

  async function getProductionClientDiagnostics(){return typeof API.getClientProductionDiagnostics==='function'?await API.getClientProductionDiagnostics():API.getClientDiagnostics();}

  async function runConcurrency(){
    const probeId='ACCEPT-'+Date.now()+'-'+Math.random().toString(36).slice(2,9), ids=Array.from({length:6},(_,i)=>'P'+String(i+1).padStart(2,'0'));
    const settled=await Promise.allSettled(ids.map((participantId)=>API.runProductionConcurrencyProbe({probeId,participantId,holdMs:220})));
    let final=null;try{final=await API.finalizeProductionConcurrencyProbe(probeId);}catch(e){final={success:false,error:e.message};}
    const ok=settled.filter(x=>x.status==='fulfilled').map(x=>x.value),bad=settled.filter(x=>x.status==='rejected').map(x=>x.reason&&x.reason.message||String(x.reason)),accepted=ok.filter(x=>x&&x.accepted===true),replayed=ok.filter(x=>x&&x.replayed===true);
    return {success:accepted.length===1&&ok.length===6&&!bad.length,probeId,participants:6,fulfilled:ok.length,accepted:accepted.length,replayed:replayed.length,rejected:bad,winnerParticipantId:accepted[0]&&accepted[0].winnerParticipantId||'',finalRecord:final&&final.record||null,cleaned:Boolean(final&&final.cleaned)};
  }

  function mergeClientDiagnostics(result,client){if(!result||!client)return;result.client=client;const checks=(Array.isArray(result.checks)?result.checks:[]).filter(x=>x.id!=='frontend-client'&&x.id!=='client-offline-queue');result.checks=[buildClientDiagnosticCheck(client),buildQueueCheck(client.queue),...checks];result.summary=summarizeDiagnostics(result.checks);result.success=result.summary.failed===0;}
  function buildQueueCheck(q){q=q&&typeof q==='object'?q:{};const terminalFailed=Number(q.terminalFailed||0),recoverableFailed=Number(q.recoverableFailed||0),legacyContract=Number(q.legacyContractCount||0),paused=Number(q.paused||0),pending=Number(q.pending||0),status=q.available!==true||terminalFailed?'FAIL':pending||paused||recoverableFailed||legacyContract?'WARN':'PASS';return {id:'client-offline-queue',group:'Inbound Queue',label:'ตรวจ Durable Queue และ Auto Recovery',status,message:status==='PASS'?'Queue พร้อมและไม่มีงานค้าง':status==='WARN'?'Queue กำลังกู้คืนอัตโนมัติ':'Queue ไม่พร้อมหรือมีงานที่กู้คืนไม่ได้',durationMs:0,details:q};}
  function buildConcurrencyCheck(c){return {id:'parallel-concurrency-idempotency',group:'Concurrency & Idempotency',label:'ยิง 6 คำขอพร้อมกันด้วย Probe ID เดียว',status:c&&c.success?'PASS':'FAIL',message:c&&c.success?'Accepted 1 คำขอ ที่เหลือ Replay':'Concurrency Probe ไม่ผ่าน',durationMs:0,details:c||{}};}
  function setDiagnosticButtons(loading){['adminValidateQuickButton','adminDiagnosticsQuickButton','adminValidateSystemButton','adminAcceptanceButton'].forEach(id=>{const b=byId(id);if(b)b.disabled=Boolean(loading);});}
  async function diagnosticDone(result,label){const s=result&&result.summary||{},cleanup=result&&result.acceptance&&result.acceptance.legacyRemovalEligible===true;await Swal.fire({icon:s.failed?'error':s.warnings?'warning':'success',title:label+(s.failed?' ไม่ผ่าน':s.warnings?' ผ่านพร้อมคำเตือน':' ผ่าน'),text:'ผ่าน '+Number(s.passed||0)+' · เตือน '+Number(s.warnings||0)+' · ไม่ผ่าน '+Number(s.failed||0)+(cleanup?' · Legacy พร้อมเข้าสู่รอบ Cleanup':''),confirmButtonText:'ดูรายละเอียด'});}
  function updateDiagnosticMeta(result,client){const p=result&&result.phase4e||result&&result.appsScript&&result.appsScript.phase4e||{};setText('adminDiagnosticModuleId',result&&result.moduleId||p.moduleId||'-');setText('adminDiagnosticDataRevision',p.boardDataRevision||'-');setText('adminDiagnosticRulesRevision',p.rulesRevision||'-');const a=findCheck(result,'alert-engine-trigger'),e=findCheck(result,'admin-export-contract'),f=findCheck(result,'fast-scan-transaction'),r=findCheck(result,'router-cache-ownership'),q=client&&client.queue||{},w=client&&client.worker||{},perf=client&&client.performance||{};setText('adminDiagnosticAlertStatus',a?diagnosticStatusText(a.status):'-');setText('adminDiagnosticQueueStatus',q.available?'รอ '+Number(q.pending||0)+' · กู้คืน '+Number(q.recoverableFailed||0)+' · ผิดพลาด '+Number(q.terminalFailed||0):'อ่านไม่ได้');setText('adminDiagnosticExportStatus',e?diagnosticStatusText(e.status):'ไม่ได้ตรวจ');setText('adminDiagnosticWorkerBuild',w&&w.buildVersion||'-');const businessP95=Number(perf.p95ForegroundBusinessWriteMs||perf.p95WriteMs||0);setText('adminDiagnosticClientP95',businessP95>0?businessP95.toLocaleString('th-TH')+' ms':'ยังไม่มี Business Write Sample');setText('adminDiagnosticFastScanStatus',f?diagnosticStatusText(f.status):'-');setText('adminDiagnosticFallbackStatus',r&&r.details&&Number(r.details.deprecatedFallbackCount||0)>0?'พบ '+Number(r.details.deprecatedFallbackCount||0)+' ครั้ง':r?'พร้อมลบหลัง Acceptance':'-');const b=byId('adminDiagnosticsExportButton');if(b)b.disabled=!state.diagnosticsResult;const cleanup=result&&result.acceptance&&result.acceptance.routerCleanupStatus||result&&result.appsScript&&result.appsScript.acceptance&&result.appsScript.acceptance.routerCleanupStatus;if(cleanup){state.vcwCleanupStatus=cleanup;renderVcwCleanupStatus(cleanup);}}
  function findCheck(result,id){return (Array.isArray(result&&result.checks)?result.checks:[]).find(x=>x.id===id)||null;}
  function exportProductionDiagnosticReport(){const r=state.diagnosticsResult;if(!r)return;const rows=[['กลุ่ม','รหัส','รายการ','ผล','ข้อความ','ระยะเวลา(ms)','รายละเอียด'],...(r.checks||[]).map(c=>[c.group||'',c.id||'',c.label||'',c.status||'',c.message||'',c.durationMs||0,JSON.stringify(c.details||{})])];const csv='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n'),blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='alertvendor-production-acceptance-'+new Date().toISOString().replace(/[:.]/g,'-')+'.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}

  function buildClientDiagnosticCheck(
    client
  ) {
    const valid =
      client &&
      client.online &&
      client.storageAvailable &&
      client.sessionTokenPresent;

    return {
      id:
        'frontend-client',

      group:
        'Frontend',

      label:
        'ตรวจเว็บและ Session ในเบราว์เซอร์',

      status:
        valid
          ? 'PASS'
          : 'FAIL',

      message:
        valid
          ? 'Frontend เชื่อมต่ออินเทอร์เน็ตและพบ Session Token'
          : 'Frontend หรือ Session ในเบราว์เซอร์ไม่พร้อมใช้งาน',

      durationMs:
        0,

      details:
        client || {}
    };
  }

  function summarizeDiagnostics(
    checks
  ) {
    const list =
      Array.isArray(checks)
        ? checks
        : [];

    const passed =
      list.filter(
        (item) =>
          item.status === 'PASS'
      ).length;

    const warnings =
      list.filter(
        (item) =>
          item.status === 'WARN'
      ).length;

    const failed =
      list.filter(
        (item) =>
          item.status === 'FAIL'
      ).length;

    return {
      total:
        list.length,

      passed,

      warnings,

      failed,

      status:
        failed > 0
          ? 'NOT_READY'
          : warnings > 0
            ? 'READY_WITH_WARNINGS'
            : 'READY'
    };
  }


  function diagnosticInlineDetails(check) {
    const details = check && check.details && typeof check.details === 'object'
      ? check.details
      : {};
    const parts = [];
    const missing = [];

    [
      details.missingFunctions,
      details.missingCoreFunctions,
      details.missingRouteFunctions,
      details.missingOptionalFunctions,
      details.missingSelfHealingFunctions
    ].forEach((items) => {
      (Array.isArray(items) ? items : []).forEach((item) => {
        const text = String(item || '').trim();
        if (text && !missing.includes(text)) missing.push(text);
      });
    });

    if (missing.length) {
      parts.push('ขาด/ไม่พบ: ' + missing.join(', '));
    }

    const warningModules = Array.isArray(details.warningModules)
      ? details.warningModules
      : [];
    if (warningModules.length) {
      const moduleText = warningModules.map((moduleItem) => {
        const moduleId = String(moduleItem && (moduleItem.moduleId || moduleItem.id || moduleItem.name) || 'module');
        const warnings = Array.isArray(moduleItem && moduleItem.warnings)
          ? moduleItem.warnings.map((warning) => String(warning && (warning.message || warning.code) || warning)).filter(Boolean)
          : [];
        return moduleId + (warnings.length ? ': ' + warnings.join(' / ') : '');
      });
      parts.push('คำเตือนโมดูล: ' + moduleText.join(' | '));
    }

    if (details.sampleScope === 'FOREGROUND_BUSINESS_WRITES_ONLY') {
      parts.push(
        'Performance ใช้เฉพาะงานหน้างาน ' +
        Number(details.sampleCount || 0) +
        ' ตัวอย่าง (ตัด Diagnostics/Acceptance ออก ' +
        Number(details.excludedTraceCount || 0) +
        ' รายการ)'
      );
    }

    if (Array.isArray(details.requiredSelfHealingFunctions) && details.missingSelfHealingFunctions && details.missingSelfHealingFunctions.length) {
      parts.push('Self-healing ที่ต้องติดตั้ง: ' + details.missingSelfHealingFunctions.join(', '));
    }

    return parts.join(' · ');
  }

  function renderValidation(result) {
    state.diagnosticsResult = result || null;

    const container =
      byId(
        'adminValidationResult'
      );

    if (!container) {
      return;
    }

    const checks =
      Array.isArray(
        result &&
        result.checks
      )
        ? result.checks
        : [];

    const summary =
      result &&
      result.summary
        ? result.summary
        : summarizeDiagnostics(
            checks
          );

    const statusLabel =
      summary.status === 'READY'
        ? 'พร้อมใช้งาน'
        : summary.status ===
            'READY_WITH_WARNINGS'
          ? 'พร้อมใช้ มีคำเตือน'
          : 'ต้องแก้ไข';

    setText(
      'adminDiagnosticStatus',
      statusLabel
    );

    setText(
      'adminDiagnosticPassed',
      String(
        summary.passed || 0
      )
    );

    setText(
      'adminDiagnosticWarnings',
      String(
        summary.warnings || 0
      )
    );

    setText(
      'adminDiagnosticFailed',
      String(
        summary.failed || 0
      )
    );

    const groupedChecks =
      checks.reduce(
        (groups, check) => {
          const groupName =
            String(
              check.group ||
              'ระบบ'
            );

          if (!groups[groupName]) {
            groups[groupName] =
              [];
          }

          groups[groupName].push(
            check
          );

          return groups;
        },
        {}
      );

    const checksHtml =
      Object.entries(
        groupedChecks
      )
        .map(
          ([groupName, groupChecks]) => `
            <section class="admin-card admin-diagnostic-group">
              <h3>${escapeHtml(groupName)}</h3>

              <div class="admin-diagnostic-checks">
                ${groupChecks.map((check) => `
                  <article
                    class="admin-diagnostic-check"
                    data-status="${escapeHtml(check.status || 'FAIL')}"
                  >
                    <div class="admin-diagnostic-check__head">
                      <strong>${escapeHtml(check.label || check.id || '-')}</strong>
                      <span>${diagnosticStatusText(check.status)}</span>
                    </div>

                    <p>${escapeHtml(check.message || '-')}</p>

                    ${Number.isFinite(Number(check.durationMs))
                      ? `<small>ใช้เวลา ${escapeHtml(String(check.durationMs))} ms</small>`
                      : ''}
                    ${diagnosticInlineDetails(check)
                      ? `<p><small><strong>รายละเอียด:</strong> ${escapeHtml(diagnosticInlineDetails(check))}</small></p>`
                      : ''}
                    ${check.details && Object.keys(check.details).length ? `<details><summary>ดูรายละเอียดทั้งหมด</summary><pre>${escapeHtml(JSON.stringify(check.details, null, 2))}</pre></details>` : ''}
                  </article>
                `).join('')}
              </div>
            </section>
          `
        )
        .join('');

    const validation =
      result &&
      result.validation
        ? result.validation
        : (
            result &&
            result.appsScript &&
            result.appsScript.validation
              ? result.appsScript.validation
              : result
          );

    const structureSheets =
      Array.isArray(
        validation &&
        validation.structure &&
        validation.structure.sheets
      )
        ? validation.structure.sheets
        : [];

    const modules =
      Array.isArray(
        validation &&
        validation.modules
      )
        ? validation.modules
        : [];

    const structureHtml =
      structureSheets
        .map((item) => {
          const valid =
            item.exists &&
            (
              !item.missingHeaders ||
              item.missingHeaders.length ===
              0
            );

          return `
            <div
              class="admin-validation-item"
              data-valid="${valid ? 'TRUE' : 'FALSE'}"
            >
              <strong>${escapeHtml(item.sheetName || '-')}</strong>
              <span>${valid
                ? 'พร้อมใช้งาน'
                : !item.exists
                  ? 'ไม่พบชีต'
                  : 'ขาดหัวคอลัมน์: ' +
                    item.missingHeaders.join(', ')
              }</span>
            </div>
          `;
        })
        .join('');

    const moduleHtml =
      modules
        .map((item) => `
          <article
            class="admin-validation-module"
            data-valid="${item.valid ? 'TRUE' : 'FALSE'}"
          >
            <div>
              <strong>${escapeHtml(item.moduleId || '-')}</strong>
              <span>${item.valid ? 'ผ่านการตรวจสอบ' : 'ต้องแก้ไข'}</span>
            </div>

            ${(item.errors || []).length
              ? `<ul>${item.errors.map((errorText) => `<li>${escapeHtml(errorText)}</li>`).join('')}</ul>`
              : ''}

            ${(item.warnings || []).length
              ? `<ul class="admin-warning-list">${item.warnings.map((warningText) => `<li>${escapeHtml(warningText)}</li>`).join('')}</ul>`
              : ''}
          </article>
        `)
        .join('');

    container.innerHTML = `
      <div
        class="admin-validation-head"
        data-valid="${summary.failed === 0 ? 'TRUE' : 'FALSE'}"
      >
        <strong>${escapeHtml(statusLabel)}</strong>
        <span>
          ตรวจล่าสุด ${escapeHtml(result.checkedAt || '-')}
          • ${escapeHtml(String(result.durationMs || 0))} ms
        </span>
      </div>

      ${checksHtml || emptyHtml('ไม่พบผลการตรวจแต่ละชั้น')}

      <section class="admin-card">
        <h3>โครงสร้างชีตหลังบ้าน</h3>
        <div class="admin-validation-grid">
          ${structureHtml || emptyHtml('ไม่พบข้อมูลโครงสร้างชีต')}
        </div>
      </section>

      <section class="admin-card">
        <h3>โมดูลทั้งหมด</h3>
        <div class="admin-validation-modules">
          ${moduleHtml || emptyHtml('ยังไม่มีโมดูล')}
        </div>
      </section>
    `;
  }

  function diagnosticStatusText(
    status
  ) {
    if (status === 'PASS') {
      return 'ผ่าน';
    }

    if (status === 'WARN') {
      return 'คำเตือน';
    }

    return 'ไม่ผ่าน';
  }

  async function logout() {
    const confirmation = await Swal.fire({
      icon: 'question',
      title: 'ออกจากระบบ?',
      showCancelButton: true,
      confirmButtonText: 'ออกจากระบบ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (!confirmation.isConfirmed) return;

    try {
      await API.logout();
    } catch (error) {
      console.warn(error);
    }

    window.location.replace(CONFIG.LOGIN_URL || './login.html');
  }

  async function handleFatalError(error) {
    const isAuth = error && (
      error.status === 401 ||
      ['AUTH_REQUIRED', 'SESSION_EXPIRED', 'INVALID_SESSION'].includes(error.code)
    );

    await Swal.fire({
      icon: 'error',
      title: isAuth ? 'กรุณาเข้าสู่ระบบ' : 'เปิดหน้าหลังบ้านไม่สำเร็จ',
      text: buildErrorMessage(error),
      confirmButtonText: isAuth ? 'ไปหน้าเข้าสู่ระบบ' : 'กลับหน้าหลัก',
      allowOutsideClick: false
    });

    window.location.replace(
      isAuth
        ? (CONFIG.LOGIN_URL || './login.html')
        : (CONFIG.DASHBOARD_URL || './index.html')
    );
  }

  function startClock() {
    updateClock();
    state.clockTimer = window.setInterval(updateClock, 1000);
  }

  function updateClock() {
    setText('adminCurrentDateTime', formatBangkokDateTime(new Date()));
  }

  function formatBangkokDateTime(date) {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: CONFIG.TIMEZONE || 'Asia/Bangkok',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23'
    });

    const parts = {};
    formatter.formatToParts(date).forEach((part) => {
      parts[part.type] = part.value;
    });

    return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`;
  }

  function operatorOptions(selected) {
    return Object.entries(LABELS.operators).map(([value, label]) => (
      `<option value="${value}" ${selected === value ? 'selected' : ''}>${escapeHtml(label)}</option>`
    )).join('');
  }

  function fieldTypeOptions(selected) {
    return Object.entries(LABELS.fieldTypes).map(([value, label]) => (
      `<option value="${value}" ${selected === value ? 'selected' : ''}>${escapeHtml(label)}</option>`
    )).join('');
  }

  function fieldPositionOptions(selected) {
    return Object.entries(LABELS.fieldPositions).map(([value, label]) => (
      `<option value="${value}" ${selected === value ? 'selected' : ''}>${escapeHtml(label)}</option>`
    )).join('');
  }

  function miniCheck(label, attribute, checkedValue) {
    return `<label><input type="checkbox" ${attribute} ${checkedValue ? 'checked' : ''}><span>${escapeHtml(label)}</span></label>`;
  }

  function flagHtml(label, enabled) {
    const isReceiving =
      String(label || '') ===
      'Receiving';

    return `
      <span
        data-enabled="${enabled ? 'TRUE' : 'FALSE'}"
        ${isReceiving ? 'data-feature="RECEIVING"' : ''}
      >
        ${escapeHtml(label)}
      </span>
    `;
  }

  function createSheetListHtml(sheets) {
    if (!sheets.length) return '<div class="daily-empty">ไม่พบชีต</div>';
    return `<div class="admin-sheet-list">${sheets.map((sheet) => `
      <button type="button" data-select-sheet="${escapeHtml(sheet.name || '')}">
        <strong>${escapeHtml(sheet.name || '-')}</strong>
        <span>${Number(sheet.rowCount || 0)} แถว • ${Number(sheet.columnCount || 0)} คอลัมน์</span>
      </button>
    `).join('')}</div>`;
  }

  function createSourceMetadataHtml(result) {
    const headers = Array.isArray(result.headers) ? result.headers : [];
    const samples = Array.isArray(result.samples) ? result.samples : [];

    return `
      <div class="admin-source-result">
        <div class="admin-source-summary">
          <span>Spreadsheet: <strong>${escapeHtml(result.spreadsheetName || '-')}</strong></span>
          <span>ชีต: <strong>${escapeHtml(result.sheetName || '-')}</strong></span>
          <span>ข้อมูล: <strong>${Number(result.lastRow || 0)} แถว / ${Number(result.lastColumn || 0)} คอลัมน์</strong></span>
        </div>
        ${result.duplicateHeaders?.length ? `<div class="admin-source-warning">พบหัวคอลัมน์ซ้ำ: ${escapeHtml(result.duplicateHeaders.join(', '))}</div>` : ''}
        <div class="admin-source-columns">
          ${headers.map((item) => `<span><strong>${escapeHtml(item.column)}</strong>${escapeHtml(item.header || '(ว่าง)')}</span>`).join('')}
        </div>
        ${samples.length ? `<div class="admin-source-samples">${samples.map((sample) => `<div><strong>แถว ${sample.rowNumber}</strong><span>${escapeHtml(Object.entries(sample.values || {}).slice(0, 8).map(([column, text]) => `${column}: ${text}`).join(' | '))}</span></div>`).join('')}</div>` : ''}
      </div>
    `;
  }

  function showLoading(title, text) {
    Swal.fire({
      title,
      text: text || '',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading()
    });
  }

  function toast(message, icon = 'success') {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title: message,
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true
    });
  }

  function success(message) {
    return Swal.fire({
      icon: 'success',
      title: message,
      confirmButtonText: 'ตกลง'
    });
  }

  function warning(message) {
    return Swal.fire({
      icon:
        'warning',

      title:
        'ข้อมูลยังไม่ครบ',

      text:
        message,

      confirmButtonText:
        'ตกลง'
    });
  }


  function handleModuleValidationInput(
    event
  ) {
    if (
      !event ||
      event.target?.closest(
        '[data-validation-target]'
      )
    ) {
      return;
    }

    state.moduleValidationTouched =
      true;

    scheduleModuleValidation();
  }


  function scheduleModuleValidation() {
    if (state.moduleValidationTimer) {
      window.clearTimeout(
        state.moduleValidationTimer
      );
    }

    state.moduleValidationTimer =
      window.setTimeout(
        runLiveModuleValidation,
        380
      );
  }


  function runLiveModuleValidation() {
    state.moduleValidationTimer =
      null;

    if (
      !state.moduleValidationTouched ||
      byId('adminModuleEditor')
        ?.classList
        .contains('is-hidden')
    ) {
      return;
    }

    state.moduleValidationRunning =
      true;

    try {
      const payload =
        readModulePayload();

      const validation =
        validateModulePayload(
          payload
        );

      applyModuleValidationFeedback(
        validation,
        {
          force:
            false
        }
      );

    } catch (error) {
      console.warn(
        'Live module validation failed',
        error
      );

    } finally {
      state.moduleValidationRunning =
        false;
    }
  }


  function ensureModuleValidationSummary() {
    const form =
      byId('adminModuleForm');

    if (!form) {
      return null;
    }

    let summary =
      byId(
        'adminModuleValidationSummary'
      );

    if (summary) {
      return summary;
    }

    /*
     * Fallback only:
     * admin.html รุ่นนี้มี summary อยู่แล้วตั้งแต่โหลดหน้า
     * หาก HTML ถูกแก้หรือ element หาย ให้สร้างใหม่และ prepend
     * เข้า container จริงโดยไม่ใช้ legacy DOM insertion
     */
    const contentContainer =
      form.querySelector(
        '.admin-editor__scroll'
      ) ||
      form;

    summary =
      document.createElement(
        'section'
      );

    summary.id =
      'adminModuleValidationSummary';

    summary.className =
      'admin-module-validation-summary is-hidden';

    summary.setAttribute(
      'aria-live',
      'polite'
    );

    contentContainer.prepend(
      summary
    );

    return summary;
  }


  function clearModuleValidationFeedback() {
    document
      .querySelectorAll(
        '#adminModuleForm .is-validation-error, ' +
        '#adminModuleForm .is-validation-warning, ' +
        '#adminModuleForm .has-validation-error, ' +
        '#adminModuleForm .has-validation-warning'
      )
      .forEach(
        (element) => {
          element.classList.remove(
            'is-validation-error',
            'is-validation-warning',
            'has-validation-error',
            'has-validation-warning'
          );

          element.removeAttribute(
            'aria-invalid'
          );
        }
      );

    document
      .querySelectorAll(
        '#adminModuleForm .admin-inline-validation, ' +
        '#adminModuleForm .admin-section-validation-badge'
      )
      .forEach(
        (element) =>
          element.remove()
      );

    const summary =
      byId(
        'adminModuleValidationSummary'
      );

    if (summary) {
      summary.classList.add(
        'is-hidden'
      );

      summary.innerHTML =
        '';
    }
  }


  function applyModuleValidationFeedback(
    validation,
    options
  ) {
    const force =
      Boolean(
        options &&
        options.force
      );

    if (
      !force &&
      !state.moduleValidationTouched
    ) {
      return;
    }

    clearModuleValidationFeedback();

    const summary =
      ensureModuleValidationSummary();

    const issues =
      Array.isArray(
        validation &&
        validation.issues
      )
        ? validation.issues
        : [];

    const errors =
      issues.filter(
        (issue) =>
          issue.severity ===
          'error'
      );

    const warnings =
      issues.filter(
        (issue) =>
          issue.severity ===
          'warning'
      );

    const groupedByTarget =
      new Map();

    issues.forEach(
      (issue) => {
        const target =
          String(
            issue.target || ''
          );

        if (!target) {
          return;
        }

        const list =
          groupedByTarget.get(
            target
          ) || [];

        list.push(
          issue
        );

        groupedByTarget.set(
          target,
          list
        );
      }
    );

    groupedByTarget.forEach(
      (targetIssues, selector) => {
        markModuleValidationTarget(
          selector,
          targetIssues
        );
      }
    );

    markModuleValidationSections(
      issues
    );

    if (
      !summary ||
      (
        errors.length ===
          0 &&
        warnings.length ===
          0
      )
    ) {
      return;
    }

    summary.classList.remove(
      'is-hidden'
    );

    summary.classList.toggle(
      'has-errors',
      errors.length > 0
    );

    summary.classList.toggle(
      'has-warnings',
      errors.length === 0 &&
      warnings.length > 0
    );

    const visibleIssues =
      issues.slice(
        0,
        12
      );

    summary.innerHTML = `
      <div class="admin-module-validation-summary__header">
        <div>
          <strong>
            ${
              errors.length
                ? `พบจุดที่ต้องแก้ ${errors.length} จุด`
                : `มีคำเตือน ${warnings.length} จุด`
            }
          </strong>
          <span>
            กดรายการเพื่อเลื่อนไปยังช่องที่ต้องตรวจสอบ
          </span>
        </div>
        <div class="admin-module-validation-summary__counts">
          ${
            errors.length
              ? `<span class="count-error">${errors.length} ผิดพลาด</span>`
              : ''
          }
          ${
            warnings.length
              ? `<span class="count-warning">${warnings.length} คำเตือน</span>`
              : ''
          }
        </div>
      </div>

      <div class="admin-module-validation-summary__items">
        ${visibleIssues
          .map(
            (issue, index) => `
              <button
                type="button"
                class="admin-validation-jump admin-validation-jump--${escapeHtml(issue.severity)}"
                data-validation-target="${escapeHtml(issue.target || '')}"
              >
                <span>${index + 1}</span>
                <strong>${escapeHtml(issue.message)}</strong>
              </button>
            `
          )
          .join('')}
      </div>

      ${
        issues.length >
          visibleIssues.length
          ? `
            <div class="admin-module-validation-summary__more">
              และอีก ${issues.length - visibleIssues.length} รายการ
            </div>
          `
          : ''
      }
    `;
  }


  function markModuleValidationTarget(
    selector,
    targetIssues
  ) {
    let element;

    try {
      element =
        document.querySelector(
          selector
        );

    } catch (error) {
      console.warn(
        'Invalid validation selector',
        selector,
        error
      );

      return;
    }

    if (!element) {
      return;
    }

    const hasError =
      targetIssues.some(
        (issue) =>
          issue.severity ===
          'error'
      );

    const severity =
      hasError
        ? 'error'
        : 'warning';

    element.classList.add(
      severity === 'error'
        ? 'is-validation-error'
        : 'is-validation-warning'
    );

    if (severity === 'error') {
      element.setAttribute(
        'aria-invalid',
        'true'
      );
    }

    const wrapper =
      element.closest(
        '.admin-field, ' +
        '.row-field, ' +
        '.admin-toggle, ' +
        '.admin-dynamic-row'
      ) ||
      element;

    wrapper.classList.add(
      severity === 'error'
        ? 'has-validation-error'
        : 'has-validation-warning'
    );

    if (
      element.matches(
        'input, select, textarea'
      )
    ) {
      const message =
        document.createElement(
          'small'
        );

      message.className =
        `admin-inline-validation admin-inline-validation--${severity}`;

      message.textContent =
        targetIssues
          .map(
            (issue) =>
              issue.message
          )
          .join(' • ');

      wrapper.appendChild(
        message
      );
    }
  }


  function markModuleValidationSections(
    issues
  ) {
    const sectionMap =
      new Map();

    issues.forEach(
      (issue) => {
        if (!issue.target) {
          return;
        }

        let target;

        try {
          target =
            document.querySelector(
              issue.target
            );
        } catch (error) {
          return;
        }

        const section =
          target?.closest(
            '.admin-editor-section'
          );

        if (!section) {
          return;
        }

        const current =
          sectionMap.get(
            section
          ) || {
            errors:
              0,

            warnings:
              0
          };

        if (
          issue.severity ===
          'error'
        ) {
          current.errors +=
            1;
        } else {
          current.warnings +=
            1;
        }

        sectionMap.set(
          section,
          current
        );
      }
    );

    sectionMap.forEach(
      (counts, section) => {
        section.classList.add(
          counts.errors
            ? 'has-validation-error'
            : 'has-validation-warning'
        );

        const title =
          section.querySelector(
            '.admin-editor-section__title'
          );

        if (!title) {
          return;
        }

        const badge =
          document.createElement(
            'span'
          );

        badge.className =
          'admin-section-validation-badge';

        badge.textContent =
          counts.errors
            ? `${counts.errors} จุดต้องแก้`
            : `${counts.warnings} คำเตือน`;

        title.appendChild(
          badge
        );
      }
    );
  }


  function handleModuleValidationSummaryClick(
    event
  ) {
    const button =
      event.target.closest(
        '[data-validation-target]'
      );

    if (!button) {
      return;
    }

    const selector =
      String(
        button.dataset
          .validationTarget ||
        ''
      );

    if (selector) {
      focusValidationTarget(
        selector
      );
    }
  }


  async function validateModuleSourceBeforeSave(
    payload
  ) {
    const module =
      payload.module || {};

    const result =
      await API.inspectAdminSource({
        spreadsheetId:
          module.sourceSpreadsheetId,

        sheetName:
          module.sourceSheetName,

        headerRow:
          module.headerRow,

        sampleRows:
          1
      });

    state.sourceMetadata =
      result;

    populateColumnOptions(
      result.headers || []
    );

    setText(
      'adminSourceInspectStatus',
      `ตรวจอัตโนมัติแล้ว ${result.lastRow || 0} แถว • ${result.lastColumn || 0} คอลัมน์ • ${result.checkedAt || ''}`
    );

    const errors =
      [];

    const warnings =
      [];

    const issues =
      [];

    let firstTarget =
      '';

    const addError = (
      message,
      target
    ) => {
      const cleanMessage =
        String(
          message || ''
        ).trim();

      errors.push(
        cleanMessage
      );

      issues.push({
        severity:
          'error',

        message:
          cleanMessage,

        target:
          String(
            target || ''
          )
      });

      if (
        !firstTarget &&
        target
      ) {
        firstTarget =
          target;
      }
    };

    const addWarning = (
      message,
      target
    ) => {
      const cleanMessage =
        String(
          message || ''
        ).trim();

      warnings.push(
        cleanMessage
      );

      issues.push({
        severity:
          'warning',

        message:
          cleanMessage,

        target:
          String(
            target || ''
          )
      });
    };

    const headers =
      Array.isArray(
        result.headers
      )
        ? result.headers
        : [];

    const availableColumns =
      new Set(
        headers
          .map(
            (item) =>
              normalizeColumn(
                item &&
                item.column
              )
          )
          .filter(Boolean)
      );

    if (
      headers.length ===
      0
    ) {
      addError(
        'ไม่พบหัวคอลัมน์ในแถวหัวตารางที่กำหนด กรุณาตรวจชื่อชีตและแถวหัวตาราง',
        '#adminHeaderRow'
      );
    }

    if (
      Number(
        result.lastRow || 0
      ) <=
      Number(
        module.headerRow || 1
      )
    ) {
      addWarning(
        'ชีตต้นทางยังไม่มีแถวข้อมูลใต้หัวตาราง',
        '#adminSourceSheetName'
      );
    }

    if (
      Array.isArray(
        result.duplicateHeaders
      ) &&
      result.duplicateHeaders.length
    ) {
      addWarning(
        'พบชื่อหัวคอลัมน์ซ้ำในชีตต้นทาง: ' +
        result.duplicateHeaders.join(', '),
        '#adminSourceSheetName'
      );
    }

    const references =
      [];

    const addReference = (
      label,
      column,
      target
    ) => {
      const normalized =
        normalizeColumn(
          column
        );

      if (!normalized) {
        return;
      }

      references.push({
        label,
        column:
          normalized,
        target
      });
    };

    addReference(
      'คอลัมน์เวลาเข้า',
      module.timestampInColumn,
      '#adminTimestampInColumn'
    );

    addReference(
      'คอลัมน์เวลาออก',
      module.timestampOutColumn,
      '#adminTimestampOutColumn'
    );

    addReference(
      'คอลัมน์ระยะเวลา',
      module.durationColumn,
      '#adminDurationColumn'
    );

    addReference(
      'คอลัมน์ผู้บันทึกออก',
      module.checkoutUserColumn,
      '#adminCheckoutUserColumn'
    );

    addReference(
      'คอลัมน์สถานะกำหนดเอง',
      module.customStatusColumn,
      '#adminCustomStatusColumn'
    );

    addReference(
      'คอลัมน์สถานะหลังออก',
      module.afterCheckoutStatusColumn,
      '#adminAfterCheckoutStatusColumn'
    );

    payload.filters.forEach(
      (filter, index) => {
        addReference(
          `เงื่อนไขที่ ${index + 1}`,
          filter.column,
          `#adminFilterRows [data-filter-row]:nth-child(${index + 1}) [data-filter-column]`
        );
      }
    );

    payload.fields.forEach(
      (field, index) => {
        field.sourceColumns.forEach(
          (column) => {
            addReference(
              `ฟิลด์ “${field.displayName || field.fieldId || index + 1}”`,
              column,
              `#adminFieldRows [data-field-row]:nth-child(${index + 1}) [data-field-columns]`
            );
          }
        );
      }
    );

    references.forEach(
      (reference) => {
        if (
          !availableColumns.has(
            reference.column
          )
        ) {
          addError(
            `${reference.label} ระบุคอลัมน์ ${reference.column} แต่คอลัมน์นี้ไม่มีอยู่ในชีตต้นทาง`,
            reference.target
          );
        }
      }
    );

    if (
      String(
        module.moduleId || ''
      ).toLowerCase() ===
      'vendors'
    ) {
      if (
        String(
          module.sourceSheetName ||
          ''
        ).trim() !==
        'Sheet1'
      ) {
        addError(
          'โมดูล vendors ต้องใช้ชีตต้นทางชื่อ Sheet1 ตามสัญญาข้อมูล Gate In/Gate Out',
          '#adminSourceSheetName'
        );
      }

      [
        [
          'คอลัมน์เวลาเข้า',
          module.timestampInColumn,
          'B',
          '#adminTimestampInColumn'
        ],
        [
          'คอลัมน์เวลาออก',
          module.timestampOutColumn,
          'O',
          '#adminTimestampOutColumn'
        ],
        [
          'คอลัมน์ระยะเวลา',
          module.durationColumn,
          'P',
          '#adminDurationColumn'
        ]
      ].forEach(
        (item) => {
          if (
            normalizeColumn(
              item[1]
            ) !==
            item[2]
          ) {
            addError(
              `โมดูล vendors ต้องตั้ง ${item[0]} เป็นคอลัมน์ ${item[2]} ตามโครงสร้าง Sheet1`,
              item[3]
            );
          }
        }
      );
    }

    return {
      valid:
        errors.length ===
        0,

      errors,
      warnings,
      issues,
      firstTarget
    };
  }


  function mergeModuleValidationResults(
    first,
    second
  ) {
    const errors = [
      ...(
        Array.isArray(
          first &&
          first.errors
        )
          ? first.errors
          : []
      ),
      ...(
        Array.isArray(
          second &&
          second.errors
        )
          ? second.errors
          : []
      )
    ];

    const warnings = [
      ...(
        Array.isArray(
          first &&
          first.warnings
        )
          ? first.warnings
          : []
      ),
      ...(
        Array.isArray(
          second &&
          second.warnings
        )
          ? second.warnings
          : []
      )
    ];

    const issues = [
      ...(
        Array.isArray(
          first &&
          first.issues
        )
          ? first.issues
          : []
      ),
      ...(
        Array.isArray(
          second &&
          second.issues
        )
          ? second.issues
          : []
      )
    ];

    return {
      valid:
        errors.length ===
        0,

      errors:
        Array.from(
          new Set(
            errors
          )
        ),

      warnings:
        Array.from(
          new Set(
            warnings
          )
        ),

      issues,
      firstTarget:
        first &&
        first.firstTarget
          ? first.firstTarget
          : (
              second &&
              second.firstTarget
                ? second.firstTarget
                : ''
            )
    };
  }


  function createSourceValidationFailure(
    error
  ) {
    const message =
      'ไม่สามารถตรวจสอบ Spreadsheet/Sheet ต้นทางได้: ' +
      buildErrorMessage(
        error
      );

    return {
      valid:
        false,

      errors: [
        message
      ],

      warnings:
        [],

      issues: [
        {
          severity:
            'error',

          message,

          target:
            '#adminSourceSpreadsheetId'
        }
      ],

      firstTarget:
        '#adminSourceSpreadsheetId'
    };
  }


  function showValidationErrors(
    messages,
    title
  ) {
    const list =
      Array.isArray(messages)
        ? messages
            .map(
              (item) =>
                String(item || '').trim()
            )
            .filter(Boolean)
        : [];

    return Swal.fire({
      icon:
        'warning',

      title:
        title ||
        'ข้อมูลยังไม่ครบ',

      html:
        list.length
          ? `
            <div class="swal-error-content">
              <ul class="admin-error-list">
                ${list
                  .map(
                    (item) =>
                      `<li>${escapeHtml(item)}</li>`
                  )
                  .join('')}
              </ul>
            </div>
          `
          : '',

      confirmButtonText:
        'ตกลง',

      width:
        680
    });
  }

  function showApiError(
    error,
    title
  ) {
    const messages =
      collectErrorMessages(
        error
      );

    const warnings =
      collectErrorWarnings(
        error
      );

    const requestId =
      String(
        error &&
        (
          error.requestId ||
          error.details
            ?.upstreamRequestId ||
          error.details
            ?.requestId
        ) ||
        ''
      ).trim();

    const detailsHtml =
      messages.length
        ? `
          <ul class="admin-error-list">
            ${messages
              .map(
                (item) =>
                  `<li>${escapeHtml(item)}</li>`
              )
              .join('')}
          </ul>
        `
        : '';

    const warningsHtml =
      warnings.length
        ? `
          <div class="admin-source-warning">
            <strong>คำเตือน</strong>
            <ul class="admin-warning-list">
              ${warnings
                .map(
                  (item) =>
                    `<li>${escapeHtml(item)}</li>`
                )
                .join('')}
            </ul>
          </div>
        `
        : '';

    const requestIdHtml =
      requestId
        ? `
          <div class="request-id">
            รหัสอ้างอิง:
            ${escapeHtml(requestId)}
          </div>
        `
        : '';

    return Swal.fire({
      icon:
        'error',

      title:
        title ||
        'เกิดข้อผิดพลาด',

      html: `
        <div class="swal-error-content">
          <div>
            ${escapeHtml(
              buildErrorMessage(
                error
              )
            )}
          </div>
          ${detailsHtml}
          ${warningsHtml}
          ${requestIdHtml}
        </div>
      `,

      confirmButtonText:
        'ตกลง',

      width:
        720
    });
  }

  function collectErrorMessages(
    error
  ) {
    const candidates = [
      error &&
      error.details &&
      error.details.errors,

      error &&
      error.details &&
      error.details.validation &&
      error.details.validation.errors,

      error &&
      error.details &&
      error.details.upstreamDetails &&
      error.details.upstreamDetails.errors,

      error &&
      error.details &&
      error.details.details &&
      error.details.details.errors,

      error &&
      error.errors
    ];

    const result = [];

    candidates.forEach(
      (candidate) => {
        if (
          !Array.isArray(
            candidate
          )
        ) {
          return;
        }

        candidate.forEach(
          (item) => {
            const text =
              String(
                item || ''
              ).trim();

            if (
              text &&
              !result.includes(
                text
              )
            ) {
              result.push(
                text
              );
            }
          }
        );
      }
    );

    if (
      result.length ===
        0 &&
      error &&
      error.message
    ) {
      result.push(
        String(
          error.message
        )
      );
    }

    return result;
  }

  function collectErrorWarnings(
    error
  ) {
    const candidates = [
      error &&
      error.details &&
      error.details.warnings,

      error &&
      error.details &&
      error.details.validation &&
      error.details.validation.warnings,

      error &&
      error.details &&
      error.details.upstreamDetails &&
      error.details.upstreamDetails.warnings,

      error &&
      error.details &&
      error.details.details &&
      error.details.details.warnings
    ];

    const result = [];

    candidates.forEach(
      (candidate) => {
        if (
          !Array.isArray(
            candidate
          )
        ) {
          return;
        }

        candidate.forEach(
          (item) => {
            const text =
              String(
                item || ''
              ).trim();

            if (
              text &&
              !result.includes(
                text
              )
            ) {
              result.push(
                text
              );
            }
          }
        );
      }
    );

    return result;
  }

  function buildErrorMessage(error) {
    const messages = {
      ADMIN_REQUIRED: 'หน้านี้สำหรับผู้ดูแลระบบเท่านั้น',
      AUTH_REQUIRED: 'กรุณาเข้าสู่ระบบ',
      SESSION_EXPIRED: 'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่',
      MODULE_CONCURRENT_UPDATE: 'ข้อมูลโมดูลถูกแก้ไขจากที่อื่น กรุณาปิดแบบฟอร์มแล้วเปิดใหม่',
      MODULE_VALIDATION_FAILED: 'ข้อมูลโมดูลยังไม่สมบูรณ์',
      ADMIN_WRITE_BUSY: 'มีผู้ดูแลระบบคนอื่นกำลังบันทึกข้อมูล กรุณาลองใหม่',
      SOURCE_SPREADSHEET_UNAVAILABLE: 'ไม่สามารถเปิด Spreadsheet ต้นทางได้',
      SOURCE_SHEET_NOT_FOUND: 'ไม่พบชีตต้นทาง',
      USERNAME_ALREADY_EXISTS: 'มีชื่อผู้ใช้นี้อยู่แล้ว',
      CANNOT_DISABLE_SELF: 'ไม่สามารถลดสิทธิ์หรือปิดบัญชีที่กำลังใช้งานอยู่ได้',
      LAST_ADMIN_REQUIRED: 'ระบบต้องมี Admin ที่เปิดใช้งานอย่างน้อย 1 บัญชี',
      NETWORK_ERROR: 'ไม่สามารถเชื่อมต่อระบบได้ กรุณาตรวจสอบอินเทอร์เน็ต',
      REQUEST_TIMEOUT: 'ระบบใช้เวลาตอบกลับนานเกินกำหนด',
      MODULE_FORM_INVALID: 'ข้อมูลโมดูลยังไม่สมบูรณ์',
      SOURCE_SHEET_EMPTY: 'ชีตต้นทางไม่มีข้อมูลหัวตารางในแถวที่กำหนด',
      MODULE_LIMIT_REACHED: 'จำนวนโมดูลถึงขีดจำกัดของระบบแล้ว',
      MODULE_ALREADY_EXISTS: 'มีรหัสโมดูลนี้อยู่แล้ว',
      MODULE_ID_DUPLICATE: 'รหัสโมดูลใหม่ซ้ำกับโมดูลเดิม',
      SERVICE_FUNCTION_MISSING: 'ระบบหลังบ้านยังติดตั้งไม่ครบ'
    };

    return messages[error?.code] || error?.message || 'เกิดข้อผิดพลาดจากระบบ';
  }

  function generateTemporaryPassword() {
    const random = Math.random().toString(36).slice(2, 8);
    return `Vendor${Date.now().toString().slice(-4)}${random}9A`;
  }

  function validatePassword(password, username) {
    return (
      password.length >= 10 &&
      /[A-Za-zก-๙]/.test(password) &&
      /\d/.test(password) &&
      !password.toLowerCase().includes(String(username || '').toLowerCase())
    );
  }

  function focusValidationTarget(
    selector
  ) {
    if (!selector) {
      return;
    }

    const element =
      document.querySelector(
        selector
      );

    if (!element) {
      return;
    }

    window.setTimeout(
      () => {
        try {
          element.scrollIntoView({
            behavior:
              'smooth',

            block:
              'center',

            inline:
              'nearest'
          });

          if (
            typeof element.focus ===
            'function'
          ) {
            element.focus({
              preventScroll:
                true
            });
          }

        } catch (error) {
          console.warn(
            'ไม่สามารถเลื่อนไปยังช่องที่ผิดได้',
            error
          );
        }
      },
      120
    );
  }

  function positiveInteger(
    input,
    fallback
  ) {
    const number =
      Number(input);

    if (
      Number.isInteger(number) &&
      number > 0
    ) {
      return number;
    }

    return fallback;
  }

  function findDuplicateValues(
    values
  ) {
    const seen =
      new Set();

    const duplicates =
      new Set();

    values.forEach(
      (valueItem) => {
        const cleanValue =
          String(
            valueItem || ''
          ).trim();

        if (!cleanValue) {
          return;
        }

        if (
          seen.has(
            cleanValue
          )
        ) {
          duplicates.add(
            cleanValue
          );
        }

        seen.add(
          cleanValue
        );
      }
    );

    return Array.from(
      duplicates
    );
  }

  function extractSpreadsheetId(input) {
    const text = String(input || '').trim();
    const match = text.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : text;
  }

  function normalizeColumn(valueText) {
    const rawText =
      String(
        valueText ||
        ''
      )
        .trim();

    const text =
      rawText
        .toUpperCase();

    if (!text) {
      return '';
    }

    /*
     * SmartAlert Sheet1 helper:
     * ให้ Admin พิมพ์ชื่อหัวคอลัมน์ได้ เช่น Timestamp / Timestamp Out / Duration
     * แล้วแปลงกลับเป็นตัวอักษรคอลัมน์ เพื่อให้ backend เดิมยังทำงานครบ
     */
    const sheet1AliasMap = {
      'AUTO ID': 'A',
      'AUTOID': 'A',
      'TIMESTAMP': 'B',
      'คำนำหน้า': 'C',
      'ชื่อ': 'D',
      'สกุล': 'E',
      'เลขนัดหมาย': 'F',
      'ชื่อบริษัท': 'G',
      'บริษัท': 'G',
      'เบอร์โทร': 'H',
      'ทะเบียนรถ': 'I',
      'ทะเบียน': 'I',
      'จังหวัด': 'J',
      'ประเภทรถ': 'K',
      '60MIN': 'L',
      '60 MIN': 'L',
      '120MIN': 'M',
      '120 MIN': 'M',
      'NOTIFIED': 'N',
      'TIMESTAMP OUT': 'O',
      'TIMESTAMPOUT': 'O',
      'DURATION': 'P',
      'ระยะเวลา': 'P'
    };

    if (sheet1AliasMap[text]) {
      return sheet1AliasMap[text];
    }

    /*
     * รองรับทั้งตัวอักษรคอลัมน์ เช่น O, P
     * และหมายเลขคอลัมน์ เช่น 15, 16
     */
    if (/^\d+$/.test(text)) {
      return columnNumberToLetter(
        Number(text)
      );
    }

    const letters =
      text.replace(
        /[^A-Z]/g,
        ''
      );

    return /^[A-Z]{1,3}$/
      .test(letters)
        ? letters
        : '';
  }


  function columnNumberToLetter(
    input
  ) {
    let number =
      Number(input);

    if (
      !Number.isInteger(number) ||
      number < 1 ||
      number > 18278
    ) {
      return '';
    }

    let result = '';

    while (number > 0) {
      number -= 1;

      result =
        String.fromCharCode(
          65 +
          (
            number % 26
          )
        ) +
        result;

      number =
        Math.floor(
          number / 26
        );
    }

    return result;
  }

  function columnValue(id) {
    return normalizeColumn(value(id));
  }

  function shortId(text) {
    const valueText = String(text || '');
    if (valueText.length <= 20) return valueText;
    return valueText.slice(0, 8) + '…' + valueText.slice(-8);
  }

  function emptyHtml(title, text = '') {
    return `<div class="empty-state"><strong>${escapeHtml(title)}</strong>${text ? `<span>${escapeHtml(text)}</span>` : ''}</div>`;
  }

  function loadingHtml(text) {
    return `<div class="inline-loading"><div class="spinner spinner--small"></div><span>${escapeHtml(text)}</span></div>`;
  }

  function showPageLoading(show) {
    byId('adminPageLoading')?.classList.toggle('is-hidden', !show);
  }

  function setButtonLoading(button, loading, text) {
    if (!button) return;
    if (loading) {
      if (!button.dataset.originalText) button.dataset.originalText = button.textContent;
      button.disabled = true;
      button.textContent = text || 'กำลังดำเนินการ...';
    } else {
      button.disabled = false;
      if (button.dataset.originalText) button.textContent = button.dataset.originalText;
    }
  }

  function cssEscape(value) {
    const text = String(value || '');

    if (
      window.CSS &&
      typeof window.CSS.escape === 'function'
    ) {
      return window.CSS.escape(text);
    }

    return text.replace(
      /[^a-zA-Z0-9_-]/g,
      (character) =>
        '\\' +
        character.charCodeAt(0).toString(16) +
        ' '
    );
  }


  function byId(id) {
    return document.getElementById(id);
  }

  function value(id) {
    return String(byId(id)?.value || '').trim();
  }

  function numberValue(id, fallback) {
    const number = Number(byId(id)?.value);
    return Number.isFinite(number) ? number : fallback;
  }

  function checked(id) {
    return Boolean(byId(id)?.checked);
  }

  function setValue(id, inputValue) {
    const element = byId(id);
    if (element) element.value = inputValue ?? '';
  }

  function setChecked(id, inputValue) {
    const element = byId(id);
    if (element) element.checked = Boolean(inputValue);
  }

  function setText(id, text) {
    const element = byId(id);
    if (element) element.textContent = text;
  }

  function toBoolean(input) {
    if (input === true || input === false) return input;
    return ['TRUE', '1', 'YES', 'ON', 'เปิด', 'ใช้งาน'].includes(String(input || '').trim().toUpperCase());
  }

  function clone(valueObject) {
    return JSON.parse(JSON.stringify(valueObject || {}));
  }

  function createLocalError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function escapeHtml(input) {
    return String(input ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})(window, document);


/* ============================================================
 * SOURCE 04: admin-shift-panel(9).js
 * ============================================================ */
/**
 * admin-shift-panel.js
 * ROUND 1 — Package Integrity Recovery
 *
 * หน้าที่:
 * - จัดการแท็บกะใน admin.html
 * - ใช้ Module จาก Admin Dashboard ก่อน ไม่โหลดซ้ำโดยไม่จำเป็น
 * - มี Timeout/Error Code และไม่ค้างที่ Loading
 */
(function (window, document) {
  'use strict';

  const BUILD_VERSION =
    '2026.07.17-round1-admin-shift-package-integrity';

  const state = {
    initialized: false,
    initializing: false,
    moduleId: '',
    modules: [],
    config: null,
    shifts: [],
    statistics: [],
    requestToken: 0
  };

  document.addEventListener('DOMContentLoaded', initialize);

  function initialize() {
    bindEvents();
    observePanel();

    const requestedTab = new URLSearchParams(
      window.location.search
    ).get('tab');

    if (requestedTab === 'shifts' || window.location.hash === '#shifts') {
      window.setTimeout(function () {
        document.querySelector('[data-admin-tab="shifts"]')?.click();
      }, 300);
    }
  }

  function bindEvents() {
    document.querySelector('[data-admin-tab="shifts"]')
      ?.addEventListener('click', function () {
        updateLocation();
        ensureInitialized();
      });

    byId('adminShiftModuleSelect')?.addEventListener('change', function (event) {
      state.moduleId = text(event.target.value);
      loadModuleData();
    });

    byId('adminShiftReloadButton')?.addEventListener('click', function () {
      loadModules(true);
    });

    byId('adminShiftAddButton')?.addEventListener('click', addShift);
    byId('adminShiftSaveButton')?.addEventListener('click', saveConfiguration);
    byId('adminShiftSetupButton')?.addEventListener('click', setupShiftSystem);
    byId('adminShiftSnapshotButton')?.addEventListener('click', runSnapshot);
    byId('adminShiftStatsRefreshButton')?.addEventListener('click', loadStatistics);
    byId('adminShiftMessageRetry')?.addEventListener('click', function () {
      state.initialized = false;
      state.initializing = false;
      ensureInitialized();
    });

    byId('adminShiftRows')?.addEventListener('input', updateShiftFromEvent);
    byId('adminShiftRows')?.addEventListener('change', updateShiftFromEvent);
    byId('adminShiftRows')?.addEventListener('click', removeShiftFromEvent);
  }

  async function ensureInitialized() {
    if (state.initialized || state.initializing) return;

    state.initializing = true;
    showMessage('กำลังเตรียมข้อมูล Module', 'LOADING', false);

    try {
      const adminReady = await waitForAdminReady();
      assertApi();
      await loadModules(false);
      state.initialized = true;
      hideMessage();

      if (adminReady === false) {
        console.warn('[Admin Shift] initialized with fallback admin-ready mode');
      }
    } catch (error) {
      renderLoadFailure(error);
      showMessage(errorMessage(error), 'ERROR', true);
      await showError(error, 'โหลดระบบกะไม่สำเร็จ');
    } finally {
      state.initializing = false;
    }
  }

  function assertApi() {
    const API = window.VehicleAPI;
    const required = [
      'getAdminShiftConfig',
      'saveAdminShiftConfig',
      'setupAdminShiftSystem',
      'runAdminShiftSnapshots',
      'getAdminShiftStatistics'
    ];

    if (!API) {
      throw codedError('VEHICLE_API_MISSING', 'ไม่พบ VehicleAPI');
    }

    const missing = required.filter(function (name) {
      return typeof API[name] !== 'function';
    });

    if (missing.length) {
      throw codedError(
        'SHIFT_API_METHOD_MISSING',
        'api.js ขาดฟังก์ชัน: ' + missing.join(', ')
      );
    }
  }

  async function loadModules(forceReload) {
    const button = byId('adminShiftReloadButton');
    setButtonLoading(button, true, 'กำลังโหลด');

    try {
      let modules = forceReload ? [] : readModulesFromAdminPage();

      if (!modules.length && typeof window.VehicleAPI.getAdminDashboard === 'function') {
        try {
          const dashboard = await withTimeout(
            window.VehicleAPI.getAdminDashboard({auditLimit: 1}),
            20000,
            'ADMIN_DASHBOARD_TIMEOUT'
          );
          modules = Array.isArray(dashboard?.modules) ? dashboard.modules : [];
        } catch (error) {
          console.warn('[Admin Shift] dashboard module fallback failed', error);
        }
      }

      if (!modules.length && typeof window.VehicleAPI.getModules === 'function') {
        const data = await withTimeout(
          window.VehicleAPI.getModules(),
          15000,
          'MODULE_LIST_TIMEOUT'
        );
        modules = Array.isArray(data) ? data : data?.modules || [];
      }

      state.modules = normalizeModules(modules);
      renderModuleOptions();

      if (!state.modules.length) {
        throw codedError('SHIFT_MODULES_EMPTY', 'ไม่พบ Module สำหรับตั้งค่ากะ');
      }

      await loadModuleData();
    } finally {
      setButtonLoading(button, false);
    }
  }

  function readModulesFromAdminPage() {
    return Array.from(
      document.querySelectorAll('#adminModuleList [data-module-id]')
    ).map(function (card) {
      return {
        moduleId: text(card.dataset.moduleId),
        name: text(card.querySelector('h3')?.textContent) ||
          text(card.dataset.moduleId)
      };
    }).filter(function (item) {
      return item.moduleId;
    });
  }

  function normalizeModules(modules) {
    const map = new Map();

    (Array.isArray(modules) ? modules : []).forEach(function (module) {
      const moduleId = text(module?.moduleId || module?.id);
      if (!moduleId || map.has(moduleId)) return;
      map.set(moduleId, {
        moduleId: moduleId,
        name: text(module?.name || module?.moduleName) || moduleId
      });
    });

    return Array.from(map.values());
  }

  function renderModuleOptions() {
    const select = byId('adminShiftModuleSelect');
    if (!select) return;

    if (!state.modules.length) {
      select.innerHTML = '<option value="">ไม่พบ Module</option>';
      state.moduleId = '';
      return;
    }

    select.innerHTML = state.modules.map(function (module) {
      return '<option value="' + escapeHtml(module.moduleId) + '">' +
        escapeHtml(module.name) + ' (' + escapeHtml(module.moduleId) + ')' +
        '</option>';
    }).join('');

    if (!state.modules.some(function (item) {
      return item.moduleId === state.moduleId;
    })) {
      state.moduleId = state.modules[0].moduleId;
    }

    select.value = state.moduleId;
  }

  async function loadModuleData() {
    if (!state.moduleId) return;

    const token = ++state.requestToken;
    setConfigLoading(true);
    showMessage('กำลังโหลดการตั้งค่ากะ', 'LOADING', false);

    try {
      const results = await Promise.all([
        withTimeout(
          window.VehicleAPI.getAdminShiftConfig(state.moduleId),
          25000,
          'SHIFT_CONFIG_TIMEOUT'
        ),
        withTimeout(
          window.VehicleAPI.getAdminShiftStatistics({
            moduleId: state.moduleId,
            limit: 50
          }),
          25000,
          'SHIFT_STATISTICS_TIMEOUT'
        )
      ]);

      if (token !== state.requestToken) return;

      state.config = results[0] || {};
      state.shifts = Array.isArray(state.config.shifts)
        ? state.config.shifts.map(normalizeShift)
        : defaultShifts();
      state.statistics = Array.isArray(results[1]?.shiftSummaries)
        ? results[1].shiftSummaries
        : [];

      renderConfiguration();
      renderStatistics();
      hideMessage();
    } catch (error) {
      if (token === state.requestToken) {
        showMessage(errorMessage(error), 'ERROR', true);
        renderLoadFailure(error);
      }
      await showError(error, 'โหลดข้อมูลกะไม่สำเร็จ');
    } finally {
      if (token === state.requestToken) setConfigLoading(false);
    }
  }

  function normalizeShift(shift) {
    return {
      code: text(shift?.code).toUpperCase(),
      name: text(shift?.name),
      start: validTime(shift?.start) ? text(shift.start) : '00:00',
      end: validTime(shift?.end) ? text(shift.end) : '00:00',
      active: shift?.active !== false
    };
  }

  function renderConfiguration() {
    const config = state.config || {};
    setChecked('adminShiftEnabled', config.enabled === true);
    setValue('adminShiftTimezone', config.timezone || 'Asia/Bangkok');
    setValue('adminShiftBusinessStart', config.businessDayStart || '06:00');
    setValue('adminShiftEffectiveDate', dateToIso(config.effectiveFrom) || todayIso());
    setText('adminShiftVersion', config.version || 'DEFAULT');
    setText(
      'adminShiftUpdatedAt',
      [config.updatedAt || '-', config.updatedBy ? 'โดย ' + config.updatedBy : '']
        .filter(Boolean)
        .join(' ')
    );

    const badge = byId('adminShiftStatusBadge');
    if (badge) {
      badge.textContent = config.enabled === true ? 'เปิดใช้งาน' : 'ปิดใช้งาน';
      badge.dataset.status = config.enabled === true ? 'ENABLED' : 'DISABLED';
    }

    renderShiftRows();
  }

  function renderShiftRows() {
    const container = byId('adminShiftRows');
    if (!container) return;
    if (!state.shifts.length) state.shifts = defaultShifts();

    container.innerHTML = state.shifts.map(function (shift, index) {
      return [
        '<div class="admin-shift-row" data-shift-index="' + index + '">',
        shiftInput('รหัสกะ', 'code', shift.code, 'text', 8),
        shiftInput('ชื่อกะ', 'name', shift.name, 'text', 60),
        shiftInput('เวลาเริ่ม', 'start', shift.start, 'time'),
        shiftInput('เวลาสิ้นสุด', 'end', shift.end, 'time'),
        '<label class="admin-shift-active-toggle">',
        '<input type="checkbox" data-shift-field="active" ' +
          (shift.active ? 'checked' : '') + '>',
        '<span>ใช้งาน</span></label>',
        '<button class="admin-shift-remove" type="button" data-remove-shift="' +
          index + '" ' + (state.shifts.length <= 2 ? 'disabled' : '') + '>ลบ</button>',
        '</div>'
      ].join('');
    }).join('');

    updateValidation();
  }

  function shiftInput(label, field, value, type, maxlength) {
    return '<label class="admin-field"><span>' + escapeHtml(label) + '</span>' +
      '<input type="' + type + '" data-shift-field="' + field + '" ' +
      (maxlength ? 'maxlength="' + maxlength + '" ' : '') +
      'value="' + escapeHtml(value) + '"></label>';
  }

  function updateShiftFromEvent(event) {
    const input = event.target.closest('[data-shift-field]');
    const row = input?.closest('[data-shift-index]');
    const index = Number(row?.dataset.shiftIndex);
    const shift = state.shifts[index];
    if (!input || !shift) return;

    shift[input.dataset.shiftField] = input.type === 'checkbox'
      ? input.checked
      : input.value;
    updateValidation();
  }

  function removeShiftFromEvent(event) {
    const button = event.target.closest('[data-remove-shift]');
    if (!button || state.shifts.length <= 2) return;
    state.shifts.splice(Number(button.dataset.removeShift), 1);
    renderShiftRows();
  }

  function addShift() {
    if (state.shifts.length >= 4) {
      showError(codedError('SHIFT_LIMIT_REACHED', 'กำหนดได้ไม่เกิน 4 กะ'), 'เพิ่มกะไม่ได้');
      return;
    }

    const used = new Set(state.shifts.map(function (shift) {
      return text(shift.code).toUpperCase();
    }));
    const code = ['A', 'B', 'C', 'D'].find(function (item) {
      return !used.has(item);
    }) || 'S' + (state.shifts.length + 1);

    state.shifts.push({
      code: code,
      name: 'กะ ' + code,
      start: '00:00',
      end: '00:00',
      active: true
    });
    renderShiftRows();
  }

  function validateShifts(shifts) {
    if (shifts.length < 2 || shifts.length > 4) {
      return invalid('ต้องกำหนด 2–4 กะ');
    }

    const active = shifts.filter(function (shift) { return shift.active; });
    if (active.length < 2) return invalid('ต้องเปิดใช้งานอย่างน้อย 2 กะ');

    const codes = new Set();
    for (const shift of shifts) {
      const code = text(shift.code).toUpperCase();
      if (!code) return invalid('กรุณาระบุรหัสกะให้ครบ');
      if (codes.has(code)) return invalid('รหัสกะห้ามซ้ำกัน');
      codes.add(code);
      if (!text(shift.name)) return invalid('กรุณาระบุชื่อกะให้ครบ');
      if (!validTime(shift.start) || !validTime(shift.end)) {
        return invalid('เวลาเริ่มหรือเวลาสิ้นสุดไม่ถูกต้อง');
      }
      if (shift.start === shift.end) return invalid('เวลาเริ่มและสิ้นสุดห้ามเท่ากัน');
    }

    const occupied = new Array(1440).fill('');
    for (const shift of active) {
      let cursor = timeMinutes(shift.start);
      const end = timeMinutes(shift.end);
      let count = 0;
      while (cursor !== end && count < 1440) {
        if (occupied[cursor]) {
          return invalid('ช่วงกะ ' + shift.code + ' ทับกับกะ ' + occupied[cursor]);
        }
        occupied[cursor] = shift.code;
        cursor = (cursor + 1) % 1440;
        count += 1;
      }
    }

    const coverageMinutes = occupied.filter(Boolean).length;
    return {
      valid: true,
      coverageMinutes: coverageMinutes,
      coverageHours: coverageMinutes / 60,
      message: coverageMinutes === 1440
        ? 'ช่วงเวลาไม่ทับกันและครบ 24 ชั่วโมง'
        : 'ช่วงเวลาไม่ทับกัน แต่ยังมีช่วงว่าง'
    };
  }

  function invalid(message) {
    return {valid: false, coverageMinutes: 0, coverageHours: 0, message: message};
  }

  function updateValidation() {
    const result = validateShifts(state.shifts);
    setText(
      'adminShiftCoverage',
      result.coverageHours.toFixed(1) + ' ชั่วโมง' +
        (result.coverageMinutes === 1440 ? ' · ครบ 24 ชั่วโมง' : ' · ยังไม่ครบ 24 ชั่วโมง')
    );

    const status = byId('adminShiftValidationStatus');
    if (status) {
      status.textContent = result.message;
      status.dataset.status = result.valid
        ? (result.coverageMinutes === 1440 ? 'VALID' : 'WARNING')
        : 'ERROR';
    }

    setText(
      'adminShiftSaveHint',
      result.valid
        ? (result.coverageMinutes === 1440
          ? 'พร้อมบันทึกการตั้งค่ากะ'
          : 'บันทึกได้ แต่ช่วงว่างจะไม่ถูกจัดเข้ากะ')
        : result.message
    );

    return result;
  }

  async function saveConfiguration() {
    if (!state.moduleId) return;
    syncRowsFromDom();
    const validation = updateValidation();

    if (!validation.valid) {
      await showError(codedError('SHIFT_CONFIG_INVALID', validation.message), 'ยังบันทึกไม่ได้');
      return;
    }

    if (validation.coverageMinutes !== 1440) {
      const confirmation = await window.Swal.fire({
        icon: 'warning',
        title: 'ช่วงกะยังไม่ครบ 24 ชั่วโมง',
        text: 'ข้อมูลในช่วงเวลาว่างจะไม่ถูกระบุกะ ต้องการบันทึกต่อหรือไม่',
        showCancelButton: true,
        confirmButtonText: 'บันทึกต่อ',
        cancelButtonText: 'กลับไปแก้ไข',
        reverseButtons: true
      });
      if (!confirmation.isConfirmed) return;
    }

    const button = byId('adminShiftSaveButton');
    setButtonLoading(button, true, 'กำลังบันทึก');

    try {
      const result = await window.VehicleAPI.saveAdminShiftConfig(
        state.moduleId,
        {
          config: {
            enabled: byId('adminShiftEnabled')?.checked === true,
            timezone: text(byId('adminShiftTimezone')?.value) || 'Asia/Bangkok',
            businessDayStart: byId('adminShiftBusinessStart')?.value || '06:00',
            effectiveFrom: byId('adminShiftEffectiveDate')?.value || todayIso(),
            shifts: state.shifts.map(function (shift, index) {
              return {
                code: text(shift.code).toUpperCase(),
                name: text(shift.name),
                start: shift.start,
                end: shift.end,
                active: shift.active === true,
                order: index + 1
              };
            })
          }
        }
      );

      await window.Swal.fire({
        icon: 'success',
        title: 'บันทึกการตั้งค่ากะแล้ว',
        text: 'เวอร์ชัน ' + text(result?.version || '-'),
        confirmButtonText: 'รับทราบ'
      });
      await loadModuleData();
    } catch (error) {
      await showError(error, 'บันทึกการตั้งค่ากะไม่สำเร็จ');
    } finally {
      setButtonLoading(button, false);
    }
  }

  async function setupShiftSystem() {
    const button = byId('adminShiftSetupButton');
    setButtonLoading(button, true, 'กำลังเตรียมชีท');
    try {
      const result = await window.VehicleAPI.setupAdminShiftSystem();
      await window.Swal.fire({
        icon: result?.success === false ? 'warning' : 'success',
        title: 'เตรียมระบบกะแล้ว',
        text: 'ตรวจสอบชีท ' + (Array.isArray(result?.sheets) ? result.sheets.length : 0) + ' รายการ',
        confirmButtonText: 'รับทราบ'
      });
      await loadModules(true);
    } catch (error) {
      await showError(error, 'เตรียมระบบกะไม่สำเร็จ');
    } finally {
      setButtonLoading(button, false);
    }
  }

  async function runSnapshot() {
    if (!state.moduleId) return;

    const confirmation = await window.Swal.fire({
      icon: 'question',
      title: 'บันทึก Snapshot ตอนนี้',
      text: 'ประมวลผล Module ' + state.moduleId,
      showCancelButton: true,
      confirmButtonText: 'เริ่มประมวลผล',
      cancelButtonText: 'ยกเลิก'
    });
    if (!confirmation.isConfirmed) return;

    const button = byId('adminShiftSnapshotButton');
    setButtonLoading(button, true, 'กำลังประมวลผล');
    try {
      const result = await window.VehicleAPI.runAdminShiftSnapshots({
        moduleId: state.moduleId
      });
      await window.Swal.fire({
        icon: result?.success === false ? 'warning' : 'success',
        title: 'ประมวลผล Snapshot แล้ว',
        html: '<div class="admin-shift-result">' +
          metric('สรุปกะ', result?.shiftSnapshots) +
          metric('สรุปรายวัน', result?.dailySnapshots) +
          metric('รายชั่วโมง', result?.hourlyRows) +
          metric('ข้อยกเว้น', result?.exceptionRows) +
          '</div>',
        confirmButtonText: 'รับทราบ'
      });
      await loadStatistics();
    } catch (error) {
      await showError(error, 'สร้าง Snapshot ไม่สำเร็จ');
    } finally {
      setButtonLoading(button, false);
    }
  }

  function metric(label, value) {
    return '<span>' + escapeHtml(label) + '<strong>' + formatNumber(value) + '</strong></span>';
  }

  async function loadStatistics() {
    if (!state.moduleId) return;
    const button = byId('adminShiftStatsRefreshButton');
    setButtonLoading(button, true, 'กำลังโหลด');
    try {
      const data = await window.VehicleAPI.getAdminShiftStatistics({
        moduleId: state.moduleId,
        limit: 50
      });
      state.statistics = Array.isArray(data?.shiftSummaries)
        ? data.shiftSummaries
        : [];
      renderStatistics();
    } catch (error) {
      await showError(error, 'โหลดสถิติกะไม่สำเร็จ');
    } finally {
      setButtonLoading(button, false);
    }
  }

  function renderStatistics() {
    const rows = state.statistics || [];
    setText('adminShiftSnapshotCount', formatNumber(rows.length));
    setText('adminShiftFinalCount', formatNumber(rows.filter(function (row) {
      return text(row.SnapshotStatus).toUpperCase() === 'FINAL';
    }).length));
    setText('adminShiftLatestDate', rows.length ? displayDate(rows[0].BusinessDate) : '-');
    setText('adminShiftLatestCode', rows.length ? text(rows[0].ShiftCode) || '-' : '-');

    const body = byId('adminShiftStatsBody');
    if (!body) return;
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="10">ยังไม่มี Snapshot ของ Module นี้</td></tr>';
      return;
    }

    body.innerHTML = rows.map(function (row) {
      const status = text(row.SnapshotStatus).toUpperCase() || '-';
      return '<tr>' +
        '<td>' + escapeHtml(displayDate(row.BusinessDate)) + '</td>' +
        '<td><strong>' + escapeHtml(row.ShiftCode || '-') + '</strong><small>' +
          escapeHtml(row.ShiftName || '') + '</small></td>' +
        '<td><span class="admin-shift-table-status" data-status="' +
          escapeHtml(status) + '">' + escapeHtml(statusLabel(status)) + '</span></td>' +
        '<td>' + formatNumber(row.GateIn) + '</td>' +
        '<td>' + formatNumber(row.GateOutActual) + '</td>' +
        '<td>' + formatNumber(row.AutoClose) + '</td>' +
        '<td>' + formatNumber(row.ClosingBalance) + '</td>' +
        '<td><strong class="' + (Number(row.OverdueAtEnd) > 0 ? 'admin-shift-danger-text' : '') + '">' +
          formatNumber(row.OverdueAtEnd) + '</strong></td>' +
        '<td>' + formatNumber(row.SLACompliancePercent) + '%</td>' +
        '<td>' + formatNumber(row.AverageDwellMinutes) + ' นาที</td>' +
        '</tr>';
    }).join('');
  }

  function syncRowsFromDom() {
    document.querySelectorAll('#adminShiftRows [data-shift-index]')
      .forEach(function (row) {
        const shift = state.shifts[Number(row.dataset.shiftIndex)];
        if (!shift) return;
        row.querySelectorAll('[data-shift-field]').forEach(function (input) {
          shift[input.dataset.shiftField] = input.type === 'checkbox'
            ? input.checked
            : input.value;
        });
      });
  }

  function setConfigLoading(loading) {
    if (loading) {
      const rows = byId('adminShiftRows');
      if (rows) rows.innerHTML = '<div class="admin-shift-loading"><span></span>กำลังโหลดการตั้งค่า</div>';
    }
    ['adminShiftSaveButton', 'adminShiftSnapshotButton', 'adminShiftStatsRefreshButton']
      .forEach(function (id) {
        const element = byId(id);
        if (element) element.disabled = loading;
      });
  }

  function renderLoadFailure(error) {
    const rows = byId('adminShiftRows');
    if (rows) {
      rows.innerHTML = '<div class="admin-shift-loading admin-shift-load-error">' +
        '<strong>ไม่สามารถโหลดการตั้งค่ากะได้</strong><span>' +
        escapeHtml(errorMessage(error)) + '</span></div>';
    }
  }

  function showMessage(message, status, retryVisible) {
    const box = byId('adminShiftMessage');
    if (!box) return;
    box.hidden = false;
    box.dataset.status = status || 'INFO';
    setText('adminShiftMessageText', message);
    const retry = byId('adminShiftMessageRetry');
    if (retry) retry.hidden = retryVisible !== true;
  }

  function hideMessage() {
    const box = byId('adminShiftMessage');
    if (box) box.hidden = true;
    const retry = byId('adminShiftMessageRetry');
    if (retry) retry.hidden = true;
  }

  function observePanel() {
    const panel = byId('adminPanelShifts');
    if (!panel) return;
    const check = function () {
      if (isVisible(panel)) ensureInitialized();
    };
    new MutationObserver(check).observe(panel, {
      attributes: true,
      attributeFilter: ['class', 'hidden', 'style']
    });
    window.setTimeout(check, 500);
  }

  async function waitForAdminReady() {
    const started = Date.now();
    while (Date.now() - started < 8000) {
      const loading = byId('adminPageLoading');
      const user = text(byId('adminCurrentUser')?.textContent);
      const tabsReady = document.querySelectorAll('[data-admin-tab]').length > 0;
      const shiftPanel = byId('adminPanelShifts');

      if (((!loading || !isVisible(loading)) && tabsReady) || (user && user !== 'กำลังโหลด...')) {
        return true;
      }

      if (shiftPanel && tabsReady && document.readyState === 'complete') {
        return true;
      }

      await delay(150);
    }

    const API = window.VehicleAPI;
    if (API && typeof API.me === 'function') {
      try {
        const session = await withTimeout(
          API.me(),
          7000,
          'ADMIN_READY_SESSION_TIMEOUT'
        );

        if (
          session &&
          session.authenticated &&
          session.user &&
          String(session.user.role || '').trim().toUpperCase() === 'ADMIN'
        ) {
          const currentUser = byId('adminCurrentUser');
          if (currentUser && !text(currentUser.textContent)) {
            currentUser.textContent = session.user.displayName || session.user.username || 'Admin';
          }
          return false;
        }
      } catch (error) {
        console.warn('[Admin Shift] fallback session check failed', error);
      }
    }

    console.warn('[Admin Shift] continue without strict admin-ready state');
    return false;
  }

  function isVisible(element) {
    if (!element || element.hidden || element.classList.contains('is-hidden')) return false;
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  }

  function updateLocation() {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', 'shifts');
      url.hash = 'shifts';
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      console.warn('[Admin Shift] update URL failed', error);
    }
  }

  function defaultShifts() {
    return [
      {code: 'A', name: 'กะ A', start: '06:00', end: '14:00', active: true},
      {code: 'B', name: 'กะ B', start: '14:00', end: '22:00', active: true},
      {code: 'C', name: 'กะ C', start: '22:00', end: '06:00', active: true}
    ];
  }

  function validTime(value) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(text(value));
  }

  function timeMinutes(value) {
    const parts = text(value).split(':').map(Number);
    return parts[0] * 60 + parts[1];
  }

  function todayIso() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function dateToIso(value) {
    const source = text(value);
    let match = source.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) return match[3] + '-' + match[2] + '-' + match[1];
    match = source.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? match[1] + '-' + match[2] + '-' + match[3] : '';
  }

  function displayDate(value) {
    const source = text(value);
    const match = source.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? match[3] + '/' + match[2] + '/' + match[1] : source || '-';
  }

  function statusLabel(status) {
    if (status === 'FINAL') return 'ปิดกะแล้ว';
    if (status === 'PROVISIONAL') return 'ชั่วคราว';
    if (status === 'DRAFT') return 'ร่าง';
    return status || '-';
  }

  function setButtonLoading(button, loading, label) {
    if (!button) return;
    if (loading) {
      button.dataset.originalText = button.textContent;
      button.textContent = label || 'กำลังดำเนินการ';
      button.disabled = true;
    } else {
      button.textContent = button.dataset.originalText || button.textContent;
      button.disabled = false;
      delete button.dataset.originalText;
    }
  }

  async function showError(error, title) {
    const code = text(error?.code || error?.apiCode);
    const message = errorMessage(error);
    if (window.Swal?.fire) {
      await window.Swal.fire({
        icon: 'error',
        title: title || 'เกิดข้อผิดพลาด',
        html: '<div>' + escapeHtml(message) + '</div>' +
          (code ? '<small>รหัส: ' + escapeHtml(code) + '</small>' : ''),
        confirmButtonText: 'รับทราบ'
      });
    } else {
      window.alert((title || 'เกิดข้อผิดพลาด') + '\n' + message + (code ? '\n' + code : ''));
    }
  }

  function withTimeout(promise, timeoutMs, code) {
    let timer;
    return Promise.race([
      Promise.resolve(promise),
      new Promise(function (_resolve, reject) {
        timer = window.setTimeout(function () {
          reject(codedError(code || 'REQUEST_TIMEOUT', 'การเชื่อมต่อใช้เวลานานเกินกำหนด'));
        }, timeoutMs);
      })
    ]).finally(function () {
      window.clearTimeout(timer);
    });
  }

  function codedError(code, message) {
    const error = new Error(message);
    error.code = code;
    return error;
  }

  function errorMessage(error) {
    return text(error?.message) || 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
  }

  function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number)
      ? new Intl.NumberFormat('th-TH', {maximumFractionDigits: 2}).format(number)
      : '0';
  }

  function byId(id) { return document.getElementById(id); }
  function setText(id, value) { const el = byId(id); if (el) el.textContent = value; }
  function setValue(id, value) { const el = byId(id); if (el) el.value = value; }
  function setChecked(id, value) { const el = byId(id); if (el) el.checked = value === true; }
  function delay(ms) { return new Promise(function (resolve) { window.setTimeout(resolve, ms); }); }
  function text(value) { return value === null || value === undefined ? '' : String(value).trim(); }
  function escapeHtml(value) {
    return text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.AlertVendorAdminShift = Object.freeze({
    version: BUILD_VERSION,
    reload: function () { return loadModules(true); }
  });
})(window, document);


/* ============================================================
 * SOURCE 05: admin-inbound-export(5).js
 * ============================================================ */
/**
 * admin-inbound-export.js
 * ROUND 10 HOTFIX 1 — Automatic Log Retention + Safe Archive Cleanup
 * Monthly Excel + Sheet Registry + Backup + Two-step Cleanup
 */
(function (
  window,
  document
) {
  'use strict';

  const API =
    window.VehicleAPI;

  const state = {
    session:
      null,

    modules:
      [],

    moduleId:
      '',

    config:
      null,

    loading:
      false,

    downloading:
      false,

    activeJobId:
      '',

    polling:
      false,

    dateMode:
      'MONTH',

    preview:
      null,

    cleanupPreview:
      null,

    logPreview:
      null,

    automaticRetention:
      null
  };

  const ACTIVE_JOB_KEY =
    'alertvendor_management_export_active_job_v2';

  document.addEventListener(
    'DOMContentLoaded',
    initialize
  );


  async function initialize() {
    bindEvents();

    try {
      if (
        !API ||
        typeof API.me !==
          'function'
      ) {
        return;
      }

      const session =
        await API.me();

      state.session =
        session;

      if (!isAdmin(session)) {
        hideExportTab();
        return;
      }

      await loadModules();
      await loadConfig();
      await loadAutomaticRetentionStatus();
      setDateMode(
        'MONTH'
      );
      await resumeActiveExportJob();

    } catch (error) {
      console.warn(
        'simple export init failed',
        error
      );

      setSummary(
        'โหลดระบบส่งออกไม่สำเร็จ: ' +
        errorMessage(
          error
        )
      );
    }
  }


  function bindEvents() {
    byId(
      'adminInboundExportRefreshButton'
    )?.addEventListener(
      'click',
      loadConfig
    );

    byId(
      'adminManagementCleanupButton'
    )?.addEventListener(
      'click',
      cleanupExpiredFiles
    );

    byId(
      'adminInboundExportButton'
    )?.addEventListener(
      'click',
      createAndDownload
    );

    byId(
      'adminMonthlyPreviewButton'
    )?.addEventListener(
      'click',
      previewMonthlyData
    );

    byId('adminMonthlyCleanupPreviewButton')?.addEventListener(
      'click',
      previewMonthlyCleanup
    );

    byId('adminMonthlyPrepareCleanupButton')?.addEventListener(
      'click',
      prepareAndExecuteMonthlyCleanup
    );

    byId('adminLogCleanupPreviewButton')?.addEventListener(
      'click',
      previewSystemLogs
    );

    byId('adminLogCleanupExecuteButton')?.addEventListener(
      'click',
      prepareAndExecuteSystemLogs
    );

    byId('adminAutoLogRetentionStatusButton')?.addEventListener(
      'click',
      loadAutomaticRetentionStatus
    );

    byId('adminAutoLogRetentionEnableButton')?.addEventListener(
      'click',
      enableAutomaticLogRetention
    );

    byId('adminAutoLogRetentionRunButton')?.addEventListener(
      'click',
      runAutomaticLogRetentionNow
    );

    byId('adminAutoLogRetentionDisableButton')?.addEventListener(
      'click',
      disableAutomaticLogRetention
    );

    byId(
      'adminInboundExportModuleSelect'
    )?.addEventListener(
      'change',
      async (
        event
      ) => {
        state.moduleId =
          text(
            event.target.value
          );

        await loadConfig();
      }
    );

    byId(
      'adminManagementFileFormat'
    )?.addEventListener(
      'change',
      updatePrimaryButton
    );

    document
      .querySelectorAll(
        '[data-export-date-mode]'
      )
      .forEach(
        (button) => {
          button.addEventListener(
            'click',
            () =>
              setDateMode(
                button.getAttribute(
                  'data-export-date-mode'
                )
              )
          );
        }
      );

    byId(
      'adminManagementExportHistory'
    )?.addEventListener(
      'click',
      async (
        event
      ) => {
        const button =
          event.target.closest(
            '[data-secure-export-id]'
          );

        if (!button) {
          return;
        }

        await downloadExport(
          button.getAttribute(
            'data-secure-export-id'
          ),
          button
        );
      }
    );

    byId(
      'adminInboundExportPreview'
    )?.addEventListener(
      'click',
      async (
        event
      ) => {
        const button =
          event.target.closest(
            '[data-secure-export-id]'
          );

        if (!button) {
          return;
        }

        await downloadExport(
          button.getAttribute(
            'data-secure-export-id'
          ),
          button
        );
      }
    );
  }


  function hideExportTab() {
    document
      .querySelector(
        '[data-admin-tab="exports"]'
      )
      ?.classList.add(
        'is-hidden'
      );

    byId(
      'adminPanelExports'
    )?.classList.add(
      'is-hidden'
    );
  }


  async function loadModules() {
    const data =
      await API.getModules();

    const list =
      Array.isArray(
        data
      )
        ? data
        : Array.isArray(
            data &&
            data.modules
          )
          ? data.modules
          : [];

    state.modules =
      list
        .map(
          (
            item
          ) => ({
            moduleId:
              text(
                item.moduleId ||
                item.id
              ),

            name:
              text(
                item.name ||
                item.moduleName ||
                item.moduleId ||
                item.id
              )
          })
        )
        .filter(
          (
            item
          ) =>
            item.moduleId
        );

    const preferred =
      state.modules.find(
        (
          item
        ) =>
          item.moduleId
            .toLowerCase() ===
          'vendors'
      );

    state.moduleId =
      (
        preferred ||
        state.modules[0] ||
        {}
      ).moduleId ||
      '';

    renderModules();
  }


  function renderModules() {
    const select =
      byId(
        'adminInboundExportModuleSelect'
      );

    if (!select) {
      return;
    }

    select.innerHTML =
      state.modules.length
        ? state.modules.map(
            (
              item
            ) => `
              <option
                value="${escapeHtml(item.moduleId)}"
                ${item.moduleId === state.moduleId ? 'selected' : ''}
              >
                ${escapeHtml(item.name || item.moduleId)}
              </option>
            `
          ).join(
            ''
          )
        : '<option value="">ไม่พบ Module</option>';
  }


  async function loadConfig() {
    if (
      !state.moduleId ||
      state.loading
    ) {
      return;
    }

    state.loading =
      true;

    setSummary(
      'กำลังตรวจสอบชีตและประวัติไฟล์...'
    );

    try {
      const data =
        await API
          .getManagementReportingConfig(
            state.moduleId
          );

      state.config =
        data;

      applyDefaults(
        data
      );

      renderConfig(
        data
      );

      setSummary(
        'พร้อมส่งออกจากชีตที่เกี่ยวข้อง'
      );

    } catch (error) {
      setSummary(
        'โหลดข้อมูลไม่สำเร็จ: ' +
        errorMessage(
          error
        )
      );

    } finally {
      state.loading =
        false;

      updatePrimaryButton();
    }
  }


  function applyDefaults(
    data
  ) {
    const range =
      data &&
      data.defaultRange
        ? data.defaultRange
        : {};

    const today =
      new Date()
        .toISOString()
        .slice(
          0,
          10
        );

    const start =
      byId(
        'adminManagementStartDate'
      );

    const end =
      byId(
        'adminManagementEndDate'
      );

    if (
      start &&
      !start.value
    ) {
      start.value =
        today;
    }

    if (
      end &&
      !end.value
    ) {
      end.value =
        today;
    }

    const month =
      byId(
        'adminManagementMonth'
      );

    if (
      month &&
      !month.value
    ) {
      month.value =
        String(
          range.endDate ||
          today
        ).slice(
          0,
          7
        );
    }
  }


  function renderConfig(
    data
  ) {
    const governance =
      data &&
      data.governance
        ? data.governance
        : {};

    setText(
      'adminManagementDataRevision',
      governance.dataRevision ||
      '-'
    );

    setText(
      'adminManagementRulesRevision',
      governance.rulesRevision ||
      '-'
    );

    setText(
      'adminManagementShiftVersion',
      governance.shiftVersion ||
      '-'
    );

    setText(
      'adminManagementKpiVersion',
      governance.kpiVersion ||
      '-'
    );

    setText(
      'adminManagementRetention',
      String(
        data.retentionHours ||
        24
      ) +
      ' ชั่วโมง'
    );

    renderSourceSheets(
      data.sourceSheets ||
      []
    );

    renderKpis(
      data.kpis ||
      []
    );

    renderHistory(
      data.recentExports ||
      []
    );

    renderMonthlyPackageContents(
      data.monthlyDataControl &&
      data.monthlyDataControl.workbookSheets
        ? data.monthlyDataControl.workbookSheets
        : []
    );

    renderSheetRegistry(
      data.sheetRegistry ||
      []
    );

    const safeCleanup = data.safeArchiveCleanup || {};
    setSafeCleanupStatus(safeCleanup.enabled ? 'ระบบสำรองก่อนลบพร้อมใช้งาน' : 'ยังไม่ได้ติดตั้ง SafeArchiveCleanupService.gs');
  }


  function renderSourceSheets(
    sources
  ) {
    const element =
      byId(
        'adminManagementSources'
      );

    if (!element) {
      return;
    }

    const names =
      sources
        .map(
          (
            source
          ) => {
            const label =
              text(
                source.label
              );

            const sheet =
              text(
                source.sheetName
              );

            return (
              label +
              (
                sheet
                  ? ' [' +
                    sheet +
                    ']'
                  : ''
              )
            );
          }
        )
        .filter(
          Boolean
        );

    element.textContent =
      names.length
        ? (
            'ใช้ข้อมูลจริงจาก: ' +
            names.join(
              ' · '
            )
          )
        : 'ใช้ข้อมูลรถ/ตู้, สถานะล่าสุดรถ และเกณฑ์ SLA จาก Admin';
  }


  function renderKpis(
    items
  ) {
    setText(
      'adminManagementKpiCount',
      items.length +
      ' KPI'
    );

    const element =
      byId(
        'adminManagementKpiList'
      );

    if (!element) {
      return;
    }

    element.innerHTML =
      items.length
        ? items.map(
            (
              item
            ) => `
              <article class="admin-management-kpi">
                <header>
                  <strong>
                    ${escapeHtml(item['ชื่อ KPI'] || '-')}
                  </strong>

                  <code>
                    ${escapeHtml(item['รหัส KPI'] || '-')}
                  </code>
                </header>

                <p>
                  ${escapeHtml(item['นิยาม'] || '')}
                </p>

                <small>
                  ${escapeHtml(item['สูตร/ฐานคำนวณ'] || '')}
                  ·
                  ${escapeHtml(item['หน่วย'] || '')}
                </small>
              </article>
            `
          ).join(
            ''
          )
        : '<div class="empty-state">ยังไม่มีนิยาม KPI</div>';
  }


  function renderHistory(
    items
  ) {
    const element =
      byId(
        'adminManagementExportHistory'
      );

    if (!element) {
      return;
    }

    element.innerHTML =
      items.length
        ? items.map(
            (
              item
            ) => `
              <article class="admin-management-history-item">
                <div>
                  <strong>
                    ${escapeHtml(item.filename || '-')}
                  </strong>

                  <span>
                    ${escapeHtml(item.startDate || '')}
                    →
                    ${escapeHtml(item.endDate || '')}
                    ·
                    ${escapeHtml(item.fileFormat || '-')}
                    ·
                    ${Number(item.vehicleCount || 0)} แถว
                  </span>

                  <small>
                    สร้าง ${escapeHtml(item.createdAt || '-')}
                    · หมดอายุ ${escapeHtml(item.expiresAt || '-')}
                  </small>
                </div>

                ${
                  item.secureDownload &&
                  item.exportId
                    ? `
                      <button
                        class="button button--secondary button--compact"
                        type="button"
                        data-secure-export-id="${escapeAttribute(item.exportId)}"
                      >
                        ดาวน์โหลด
                      </button>
                    `
                    : ''
                }
              </article>
            `
          ).join(
            ''
          )
        : '<div class="empty-state">ยังไม่มีไฟล์ส่งออก</div>';
  }


  function setDateMode(
    mode
  ) {
    const normalized =
      [
        'TODAY',
        'RANGE',
        'MONTH'
      ].includes(
        String(
          mode ||
          ''
        ).toUpperCase()
      )
        ? String(
            mode
          ).toUpperCase()
        : 'MONTH';

    state.dateMode =
      normalized;

    const input =
      byId(
        'adminManagementDateMode'
      );

    if (input) {
      input.value =
        normalized;
    }

    document
      .querySelectorAll(
        '[data-export-date-mode]'
      )
      .forEach(
        (
          button
        ) => {
          button.classList.toggle(
            'is-active',
            button.getAttribute(
              'data-export-date-mode'
            ) === normalized
          );
        }
      );

    byId(
      'adminManagementRangeFields'
    )?.classList.toggle(
      'is-hidden',
      normalized !==
        'RANGE'
    );

    byId(
      'adminManagementMonthField'
    )?.classList.toggle(
      'is-hidden',
      normalized !==
        'MONTH'
    );

    const formatSelect = byId('adminManagementFileFormat');
    if (formatSelect) {
      if (normalized === 'MONTH') formatSelect.value = 'XLSX';
      formatSelect.disabled = normalized === 'MONTH';
    }

    updatePrimaryButton();
  }


  function collectSelection() {
    const dateMode =
      state.dateMode ||
      'MONTH';

    const selection = {
      dateMode:
        dateMode,

      includeActive:
        Boolean(
          byId(
            'adminManagementIncludeActive'
          )?.checked
        )
    };

    if (
      dateMode ===
      'MONTH'
    ) {
      selection.month =
        value(
          'adminManagementMonth'
        );

      if (!selection.month) {
        throw new Error(
          'กรุณาเลือกเดือน'
        );
      }

    } else if (
      dateMode ===
      'RANGE'
    ) {
      selection.startDate =
        value(
          'adminManagementStartDate'
        );

      selection.endDate =
        value(
          'adminManagementEndDate'
        );

      if (
        !selection.startDate ||
        !selection.endDate
      ) {
        throw new Error(
          'กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด'
        );
      }
    }

    return selection;
  }


  async function createAndDownload() {
    if (!state.moduleId || state.loading || state.downloading) return;

    let selection;
    try {
      selection = collectSelection();
    } catch (error) {
      toast(errorMessage(error), 'warning');
      return;
    }

    const fileFormat = value('adminManagementFileFormat') || 'XLSX';
    const isMonthly = selection.dateMode === 'MONTH';
    state.loading = true;
    setButtonBusy(true, isMonthly ? 'กำลังสร้าง Excel รายเดือน...' : 'กำลังเตรียมงาน...');
    setSummary(isMonthly ? 'กำลังรวมข้อมูลรถ/ตู้ กิจกรรม SLA งานค้าง และบัญชีชีต...' : 'กำลังอ่านข้อมูลจากชีตและสร้างไฟล์...');

    try {
      if (isMonthly) {
        const result = await API.createManagementReportPackage(
          state.moduleId,
          {
            ...selection,
            fileFormat: 'XLSX',
            reportProfile: 'MONTHLY_DATA_PACKAGE'
          }
        );

        renderMonthlyReadyResult(result);
        renderMonthlyPreview(result);
        setText('adminManagementLatestFile', result.filename || '-');
        await loadHistoryOnly();
        await downloadExport(result.exportId, null, true);
      } else {
        const result = await API.createAllWorkflowStagesExport(
          state.moduleId,
          { ...selection, fileFormat: fileFormat }
        );

        if (!result || !result.jobId) throw new Error('ระบบไม่ส่ง Job ID กลับมา');
        saveActiveJob(result.jobId, state.moduleId);
        const ready = await monitorExportJob(result.jobId, result);
        renderReadyResult(ready);
        setText('adminManagementLatestFile', ready.filename || '-');
        clearActiveJob();
        await loadHistoryOnly();
        await downloadExport(ready.exportId || ready.jobId, null, true);
      }
    } catch (error) {
      setSummary('ส่งออกไม่สำเร็จ: ' + errorMessage(error));
      toast(errorMessage(error), 'error');
    } finally {
      state.loading = false;
      setButtonBusy(false);
    }
  }


  async function previewMonthlyData() {
    if (!state.moduleId || state.loading) return;

    let selection;
    try {
      selection = collectSelection();
      if (selection.dateMode !== 'MONTH') {
        throw new Error('กรุณาเลือกโหมด “เลือกเดือน” ก่อนตรวจข้อมูลรายเดือน');
      }
    } catch (error) {
      toast(errorMessage(error), 'warning');
      return;
    }

    state.loading = true;
    setPreviewButtonBusy(true);
    setSummary('กำลังตรวจจำนวนรถ/ตู้ กิจกรรม งานค้าง และชีตที่เกี่ยวข้อง...');

    try {
      const result = await API.createManagementReportPackage(
        state.moduleId,
        {
          ...selection,
          fileFormat: 'XLSX',
          reportProfile: 'MONTHLY_DATA_PACKAGE',
          dryRun: true
        }
      );
      state.preview = result;
      renderMonthlyPreview(result);
      if (Array.isArray(result.sheetRegistry)) renderSheetRegistry(result.sheetRegistry);
      setSummary('ตรวจข้อมูลเดือน ' + (result.month || selection.month) + ' แล้ว · รอบนี้ยังไม่ลบข้อมูลจริง');
      toast('ตรวจข้อมูลรายเดือนสำเร็จ', 'success');
    } catch (error) {
      setSummary('ตรวจข้อมูลไม่สำเร็จ: ' + errorMessage(error));
      toast(errorMessage(error), 'error');
    } finally {
      state.loading = false;
      setPreviewButtonBusy(false);
      updatePrimaryButton();
    }
  }


  async function previewMonthlyCleanup() {
    if (!state.moduleId || state.loading) return;
    let selection;
    try {
      selection = collectSelection();
      if (selection.dateMode !== 'MONTH') throw new Error('กรุณาเลือกเดือนก่อนตรวจการเคลียร์ข้อมูล');
    } catch (error) {
      toast(errorMessage(error), 'warning');
      return;
    }

    state.loading = true;
    setCleanupButtonBusy(true, 'กำลังตรวจ...');
    setSafeCleanupStatus('กำลังตรวจไฟล์ Excel รถที่ปิดงาน และจำนวนแถวที่จะเก็บถาวร...');
    try {
      const result = await API.createManagementReportPackage(state.moduleId, {
        ...selection,
        reportProfile: 'MONTHLY_CLEANUP_PREVIEW'
      });
      state.cleanupPreview = result;
      renderSafeCleanupPlan(result);
      toast(result.canPrepare ? 'ข้อมูลพร้อมสร้าง Backup' : 'ยังไม่พร้อมเคลียร์ข้อมูล', result.canPrepare ? 'success' : 'warning');
    } catch (error) {
      setSafeCleanupStatus('ตรวจไม่สำเร็จ: ' + errorMessage(error));
      toast(errorMessage(error), 'error');
    } finally {
      state.loading = false;
      setCleanupButtonBusy(false);
    }
  }


  async function prepareAndExecuteMonthlyCleanup() {
    if (!state.moduleId || state.loading) return;
    let selection;
    try {
      selection = collectSelection();
      if (selection.dateMode !== 'MONTH') throw new Error('กรุณาเลือกเดือนก่อน');
    } catch (error) {
      toast(errorMessage(error), 'warning');
      return;
    }

    const proceed = await simpleConfirm(
      'เตรียม Backup ก่อนเคลียร์ข้อมูล',
      'ระบบจะยังไม่ลบข้อมูลในขั้นตอนนี้ และจะสำรอง Spreadsheet พร้อมเก็บ Excel ไว้ถาวรก่อน',
      'เตรียม Backup'
    );
    if (!proceed) return;

    state.loading = true;
    setCleanupButtonBusy(true, 'กำลังสำรอง...');
    setSafeCleanupStatus('กำลังสร้าง Backup และเก็บไฟล์ Excel ไว้ใน Archive...');
    try {
      const prepared = await API.createManagementReportPackage(state.moduleId, {
        ...selection,
        reportProfile: 'MONTHLY_CLEANUP_PREPARE'
      });
      const confirmation = await askCleanupConfirmation(prepared, 'monthly');
      if (!confirmation) {
        setSafeCleanupStatus('สร้าง Backup แล้ว แต่ยังไม่ได้ลบข้อมูล');
        toast('ยกเลิกการลบ ข้อมูลยังอยู่ครบ', 'info');
        return;
      }

      setSafeCleanupStatus('กำลังตรวจข้อมูลซ้ำและลบเฉพาะรายการที่ปิดงานแล้ว...');
      const result = await API.createManagementReportPackage(state.moduleId, {
        ...selection,
        reportProfile: 'MONTHLY_CLEANUP_EXECUTE',
        cleanupToken: prepared.cleanupToken,
        confirmationText: confirmation.confirmationText,
        reason: confirmation.reason
      });
      renderCleanupCompleted(result);
      toast('เก็บถาวรและเคลียร์ข้อมูลสำเร็จ', 'success');
      state.cleanupPreview = null;
      await loadConfig();
    } catch (error) {
      setSafeCleanupStatus('ดำเนินการไม่สำเร็จ: ' + errorMessage(error));
      toast(errorMessage(error), 'error');
    } finally {
      state.loading = false;
      setCleanupButtonBusy(false);
    }
  }


  async function loadAutomaticRetentionStatus() {
    if (!state.moduleId) return;
    try {
      const result = await API.createManagementReportPackage(state.moduleId, {
        dateMode: 'MONTH',
        month: value('adminManagementMonth') || new Date().toISOString().slice(0, 7),
        reportProfile: 'SYSTEM_LOG_RETENTION_STATUS'
      });
      state.automaticRetention = result;
      renderAutomaticRetentionStatus(result);
    } catch (error) {
      setAutomaticRetentionStatus('ตรวจสถานะไม่สำเร็จ: ' + errorMessage(error));
    }
  }


  async function enableAutomaticLogRetention() {
    if (!state.moduleId || state.loading) return;
    const proceed = await simpleConfirm(
      'เปิดการล้าง Log อัตโนมัติ',
      'ระบบจะหยุดบันทึก Auto Close ที่ไม่มีการเปลี่ยนข้อมูล และสำรอง Log ก่อนลบทุกวันประมาณ 02:30 น.',
      'เปิดใช้งาน'
    );
    if (!proceed) return;

    state.loading = true;
    setAutomaticRetentionBusy(true, 'กำลังเปิด...');
    try {
      const result = await API.createManagementReportPackage(state.moduleId, {
        dateMode: 'MONTH',
        month: value('adminManagementMonth') || new Date().toISOString().slice(0, 7),
        reportProfile: 'SYSTEM_LOG_RETENTION_ENABLE'
      });
      state.automaticRetention = result;
      renderAutomaticRetentionStatus(result);
      toast('เปิดการล้าง Log อัตโนมัติแล้ว', 'success');
    } catch (error) {
      setAutomaticRetentionStatus('เปิดใช้งานไม่สำเร็จ: ' + errorMessage(error));
      toast(errorMessage(error), 'error');
    } finally {
      state.loading = false;
      setAutomaticRetentionBusy(false);
    }
  }


  async function disableAutomaticLogRetention() {
    if (!state.moduleId || state.loading) return;
    const proceed = await simpleConfirm(
      'หยุดการล้าง Log อัตโนมัติ',
      'ระบบจะหยุด Trigger อัตโนมัติ แต่ไฟล์ Archive เดิมจะไม่ถูกลบ',
      'หยุดใช้งาน'
    );
    if (!proceed) return;

    state.loading = true;
    setAutomaticRetentionBusy(true, 'กำลังหยุด...');
    try {
      const result = await API.createManagementReportPackage(state.moduleId, {
        dateMode: 'MONTH',
        month: value('adminManagementMonth') || new Date().toISOString().slice(0, 7),
        reportProfile: 'SYSTEM_LOG_RETENTION_DISABLE'
      });
      state.automaticRetention = result;
      renderAutomaticRetentionStatus(result);
      toast('หยุดการล้าง Log อัตโนมัติแล้ว', 'info');
    } catch (error) {
      setAutomaticRetentionStatus('หยุดใช้งานไม่สำเร็จ: ' + errorMessage(error));
      toast(errorMessage(error), 'error');
    } finally {
      state.loading = false;
      setAutomaticRetentionBusy(false);
    }
  }


  async function runAutomaticLogRetentionNow() {
    if (!state.moduleId || state.loading) return;
    const proceed = await simpleConfirm(
      'สำรองและล้าง Log ตอนนี้',
      'ระบบจะสร้างไฟล์ CSV ใน Google Drive ก่อน แล้วจึงลบเฉพาะ Log ที่ลบได้ ครั้งละไม่เกิน 8,000 แถว',
      'เริ่มทำงาน'
    );
    if (!proceed) return;

    state.loading = true;
    setAutomaticRetentionBusy(true, 'กำลังสำรอง...');
    setAutomaticRetentionStatus('กำลังสำรองและล้าง Log ที่ซ้ำหรือเก่า...');
    try {
      const result = await API.createManagementReportPackage(state.moduleId, {
        dateMode: 'MONTH',
        month: value('adminManagementMonth') || new Date().toISOString().slice(0, 7),
        reportProfile: 'SYSTEM_LOG_RETENTION_RUN_NOW'
      });
      renderAutomaticRetentionRun(result);
      await loadAutomaticRetentionStatus();
      toast(result.deletedRows ? 'ล้าง Log สำเร็จ ' + Number(result.deletedRows).toLocaleString('th-TH') + ' แถว' : 'ไม่มี Log ที่ต้องล้าง', 'success');
    } catch (error) {
      setAutomaticRetentionStatus('ดำเนินการไม่สำเร็จ: ' + errorMessage(error));
      toast(errorMessage(error), 'error');
    } finally {
      state.loading = false;
      setAutomaticRetentionBusy(false);
    }
  }


  async function previewSystemLogs() {
    if (!state.moduleId || state.loading) return;
    const retentionDays = Number(value('adminLogRetentionDays') || 180);
    state.loading = true;
    setLogCleanupBusy(true, 'กำลังตรวจ...');
    setLogCleanupStatus('กำลังตรวจ Log เก่าที่พ้นระยะเก็บรักษา...');
    try {
      const result = await API.createManagementReportPackage(state.moduleId, {
        dateMode: 'MONTH',
        month: value('adminManagementMonth') || new Date().toISOString().slice(0, 7),
        reportProfile: 'SYSTEM_LOG_CLEANUP_PREVIEW',
        retentionDays: retentionDays
      });
      state.logPreview = result;
      renderLogCleanupPlan(result);
      toast(result.canPrepare ? 'พบ Log เก่าที่เคลียร์ได้' : 'ไม่พบ Log เก่า', result.canPrepare ? 'success' : 'info');
    } catch (error) {
      setLogCleanupStatus('ตรวจ Log ไม่สำเร็จ: ' + errorMessage(error));
      toast(errorMessage(error), 'error');
    } finally {
      state.loading = false;
      setLogCleanupBusy(false);
    }
  }


  async function prepareAndExecuteSystemLogs() {
    if (!state.moduleId || state.loading) return;
    const retentionDays = Number(value('adminLogRetentionDays') || 180);
    const proceed = await simpleConfirm(
      'สำรองก่อนล้าง Log เก่า',
      'ระบบจะสร้างสำเนา Spreadsheet ทั้งไฟล์ก่อนลบ Log ที่เก่ากว่าระยะที่เลือก',
      'เตรียม Backup'
    );
    if (!proceed) return;

    state.loading = true;
    setLogCleanupBusy(true, 'กำลังสำรอง...');
    try {
      const prepared = await API.createManagementReportPackage(state.moduleId, {
        dateMode: 'MONTH',
        month: value('adminManagementMonth') || new Date().toISOString().slice(0, 7),
        reportProfile: 'SYSTEM_LOG_CLEANUP_PREPARE',
        retentionDays: retentionDays
      });
      const confirmation = await askCleanupConfirmation(prepared, 'logs');
      if (!confirmation) {
        setLogCleanupStatus('สร้าง Backup แล้ว แต่ยังไม่ได้ลบ Log');
        return;
      }
      const result = await API.createManagementReportPackage(state.moduleId, {
        dateMode: 'MONTH',
        month: value('adminManagementMonth') || new Date().toISOString().slice(0, 7),
        reportProfile: 'SYSTEM_LOG_CLEANUP_EXECUTE',
        cleanupToken: prepared.cleanupToken,
        confirmationText: confirmation.confirmationText,
        reason: confirmation.reason,
        retentionDays: retentionDays
      });
      renderLogCleanupCompleted(result);
      toast('ล้าง Log เก่าสำเร็จ', 'success');
      await loadConfig();
    } catch (error) {
      setLogCleanupStatus('ล้าง Log ไม่สำเร็จ: ' + errorMessage(error));
      toast(errorMessage(error), 'error');
    } finally {
      state.loading = false;
      setLogCleanupBusy(false);
    }
  }


  async function simpleConfirm(title, message, confirmText) {
    if (!window.Swal) return window.confirm(message);
    const result = await Swal.fire({
      icon: 'warning',
      title: title,
      text: message,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });
    return Boolean(result.isConfirmed);
  }


  async function askCleanupConfirmation(prepared, mode) {
    const expected = text(prepared && prepared.confirmationText);
    if (!expected) throw new Error('ระบบไม่ส่งข้อความยืนยันกลับมา');
    if (!window.Swal) {
      const typed = window.prompt('พิมพ์ข้อความนี้ให้ตรง:\n' + expected, '');
      if (typed === null) return null;
      const reason = window.prompt('ระบุเหตุผลในการเคลียร์ข้อมูล', 'เก็บถาวรข้อมูลตามรอบเดือน');
      if (reason === null) return null;
      return { confirmationText: typed.trim(), reason: reason.trim() };
    }

    const label = mode === 'logs' ? 'Log เก่า' : 'ข้อมูลรถ/ตู้ที่ปิดงานแล้ว';
    const result = await Swal.fire({
      icon: 'warning',
      title: 'ยืนยันลบ ' + label,
      html: `
        <div style="text-align:left;line-height:1.55">
          <p><strong>Backup:</strong> ${escapeHtml(prepared.backupFileName || '-')}</p>
          ${prepared.archivedExportFileName ? `<p><strong>Excel Archive:</strong> ${escapeHtml(prepared.archivedExportFileName)}</p>` : ''}
          <p><strong>จำนวนแถว:</strong> ${Number(prepared.rowsToDelete || 0).toLocaleString('th-TH')}</p>
          <p>พิมพ์ข้อความนี้ให้ตรง:</p>
          <code style="display:block;padding:10px;background:#f3f4f6;border-radius:8px;word-break:break-all">${escapeHtml(expected)}</code>
          <input id="round09ConfirmText" class="swal2-input" placeholder="ข้อความยืนยัน">
          <textarea id="round09Reason" class="swal2-textarea" placeholder="เหตุผล เช่น เก็บถาวรข้อมูลเดือนที่ปิดงานแล้ว"></textarea>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'ยืนยันและลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      focusConfirm: false,
      preConfirm: () => {
        const confirmationText = text(document.getElementById('round09ConfirmText')?.value);
        const reason = text(document.getElementById('round09Reason')?.value);
        if (confirmationText !== expected) {
          Swal.showValidationMessage('ข้อความยืนยันไม่ตรง');
          return false;
        }
        if (reason.length < 5) {
          Swal.showValidationMessage('กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร');
          return false;
        }
        return { confirmationText, reason };
      }
    });
    return result.isConfirmed ? result.value : null;
  }


  function renderSafeCleanupPlan(result) {
    const element = byId('adminSafeCleanupResult');
    if (!element) return;
    const sheets = Array.isArray(result && result.sheets) ? result.sheets : [];
    element.innerHTML = `
      <div class="admin-management-result__facts">
        <span>${Number(result.eligibleVehicles || 0).toLocaleString('th-TH')} รถ/ตู้พร้อมเก็บ</span>
        <span>${Number(result.totalRows || 0).toLocaleString('th-TH')} แถว</span>
        <span>${Number(result.blockedVehicles || 0).toLocaleString('th-TH')} รายการเก็บไว้</span>
      </div>
      <p>${result.exportReady ? 'พบไฟล์ Excel แล้ว: ' + escapeHtml(result.exportFileName || '-') : 'ยังไม่พบไฟล์ Excel ของเดือนนี้'}</p>
      ${sheets.map((item) => `<div class="admin-cleanup-preview-row"><strong>${escapeHtml(item.sheetName || '-')}</strong><span>${Number(item.rows || 0).toLocaleString('th-TH')} แถว</span></div>`).join('')}
      ${(result.blockedReasons || []).length ? `<p>${escapeHtml(result.blockedReasons.join(' · '))}</p>` : ''}
    `;
    const button = byId('adminMonthlyPrepareCleanupButton');
    if (button) button.disabled = !result.canPrepare;
    setSafeCleanupStatus(result.canPrepare ? 'พร้อมสร้าง Backup และยืนยันการเคลียร์' : 'ยังไม่พร้อมเคลียร์ข้อมูล');
  }


  function renderCleanupCompleted(result) {
    const element = byId('adminSafeCleanupResult');
    if (!element) return;
    element.innerHTML = `
      <h4>เก็บถาวรและเคลียร์ข้อมูลสำเร็จ</h4>
      <p>ลบ ${Number(result.deletedRows || 0).toLocaleString('th-TH')} แถว · เก็บรายการที่ยังไม่ปิดงาน ${Number(result.blockedVehiclesKept || 0).toLocaleString('th-TH')} รายการ</p>
      <p>Backup: ${escapeHtml(result.backupFileName || '-')}</p>
      <p>Excel Archive: ${escapeHtml(result.archivedExportFileName || '-')}</p>
    `;
    setSafeCleanupStatus('เสร็จแล้ว ข้อมูลที่ยังใช้งานอยู่ไม่ได้ถูกลบ');
  }


  function renderAutomaticRetentionStatus(result) {
    const element = byId('adminAutoLogRetentionResult');
    if (!element) return;
    const enabled = Boolean(result && result.enabled);
    const lastRun = result && result.lastRun ? result.lastRun : null;
    element.innerHTML = `
      <div class="admin-management-result__facts">
        <span>${enabled ? 'เปิดอัตโนมัติ' : 'ปิดอัตโนมัติ'}</span>
        <span>${Number(result && result.currentRows || 0).toLocaleString('th-TH')} แถวปัจจุบัน</span>
        <span>${Number(result && result.eligibleRows || 0).toLocaleString('th-TH')} แถวที่จัดการได้</span>
      </div>
      <p>เวลาทำงาน: ${escapeHtml(result && result.scheduleText || 'ทุกวันประมาณ 02:30 น.')}</p>
      <p>สำรองไว้ที่: ${escapeHtml(result && result.archiveFolderName || 'AlertVendor_Log_Archive')}</p>
      ${lastRun ? `<p>ครั้งล่าสุด: ${escapeHtml(lastRun.finishedAt || lastRun.failedAt || '-')} · ลบ ${Number(lastRun.deletedRows || 0).toLocaleString('th-TH')} แถว</p>` : '<p>ยังไม่เคยทำงาน</p>'}
    `;
    setAutomaticRetentionStatus(enabled ? 'ระบบล้าง Log อัตโนมัติทำงานอยู่' : 'ระบบล้าง Log อัตโนมัติยังปิดอยู่');
    const enableButton = byId('adminAutoLogRetentionEnableButton');
    const disableButton = byId('adminAutoLogRetentionDisableButton');
    if (enableButton) enableButton.disabled = enabled;
    if (disableButton) disableButton.disabled = !enabled;
  }


  function renderAutomaticRetentionRun(result) {
    const element = byId('adminAutoLogRetentionResult');
    if (!element) return;
    const files = Array.isArray(result && result.archiveFiles) ? result.archiveFiles : [];
    element.innerHTML = `
      <h4>${Number(result && result.deletedRows || 0) > 0 ? 'สำรองและล้าง Log สำเร็จ' : 'ไม่มี Log ที่ต้องล้าง'}</h4>
      <p>ลบ ${Number(result && result.deletedRows || 0).toLocaleString('th-TH')} แถว · เหลือรอจัดการ ${Number(result && result.remainingEligibleRows || 0).toLocaleString('th-TH')} แถว</p>
      ${files.map((file) => `<p>Archive: ${escapeHtml(file.fileName || '-')} · ${Number(file.rowCount || 0).toLocaleString('th-TH')} แถว</p>`).join('')}
    `;
    setAutomaticRetentionStatus(result && result.status === 'PARTIAL_CLEANUP' ? 'ยังมีข้อมูลค้าง ระบบจะทำต่ออัตโนมัติทุก 1 ชั่วโมง' : 'เสร็จแล้ว');
  }


  function setAutomaticRetentionStatus(message) {
    const element = byId('adminAutoLogRetentionStatus');
    if (element) element.textContent = message;
  }


  function setAutomaticRetentionBusy(busy, label) {
    const ids = [
      'adminAutoLogRetentionStatusButton',
      'adminAutoLogRetentionEnableButton',
      'adminAutoLogRetentionRunButton',
      'adminAutoLogRetentionDisableButton'
    ];
    ids.forEach((id) => {
      const button = byId(id);
      if (button) button.disabled = Boolean(busy);
    });
    const runButton = byId('adminAutoLogRetentionRunButton');
    if (runButton) runButton.textContent = busy ? (label || 'กำลังทำงาน...') : 'สำรองและล้างตอนนี้';
    if (!busy && state.automaticRetention) {
      const enabled = Boolean(state.automaticRetention.enabled);
      const enableButton = byId('adminAutoLogRetentionEnableButton');
      const disableButton = byId('adminAutoLogRetentionDisableButton');
      if (enableButton) enableButton.disabled = enabled;
      if (disableButton) disableButton.disabled = !enabled;
    }
  }


  function renderLogCleanupPlan(result) {
    const element = byId('adminLogCleanupResult');
    if (!element) return;
    const sheets = Array.isArray(result && result.sheets) ? result.sheets : [];
    element.innerHTML = `
      <div class="admin-management-result__facts">
        <span>${Number(result.totalRows || 0).toLocaleString('th-TH')} แถว</span>
        <span>เก็บย้อนหลัง ${Number(result.retentionDays || 0)} วัน</span>
      </div>
      ${sheets.map((item) => `<div class="admin-cleanup-preview-row"><strong>${escapeHtml(item.sheetName || '-')}</strong><span>${Number(item.rows || 0).toLocaleString('th-TH')} แถว</span></div>`).join('') || '<p>ไม่พบ Log เก่า</p>'}
    `;
    const button = byId('adminLogCleanupExecuteButton');
    if (button) button.disabled = !result.canPrepare;
    setLogCleanupStatus(result.canPrepare ? 'พร้อมสร้าง Backup และล้าง Log เก่า' : 'ไม่มี Log ที่ต้องล้าง');
  }


  function renderLogCleanupCompleted(result) {
    const element = byId('adminLogCleanupResult');
    if (!element) return;
    element.innerHTML = `<h4>ล้าง Log เก่าสำเร็จ</h4><p>ลบ ${Number(result.deletedRows || 0).toLocaleString('th-TH')} แถว</p><p>Backup: ${escapeHtml(result.backupFileName || '-')}</p>`;
    setLogCleanupStatus('เสร็จแล้ว');
  }


  function setSafeCleanupStatus(message) {
    const element = byId('adminSafeCleanupStatus');
    if (element) element.textContent = message;
  }


  function setLogCleanupStatus(message) {
    const element = byId('adminLogCleanupStatus');
    if (element) element.textContent = message;
  }


  function setCleanupButtonBusy(busy, label) {
    const preview = byId('adminMonthlyCleanupPreviewButton');
    const execute = byId('adminMonthlyPrepareCleanupButton');
    if (preview) preview.disabled = Boolean(busy);
    if (execute) execute.disabled = Boolean(busy) || !(state.cleanupPreview && state.cleanupPreview.canPrepare);
    if (execute) execute.textContent = busy ? (label || 'กำลังทำงาน...') : 'สำรองและเคลียร์เดือนนี้';
  }


  function setLogCleanupBusy(busy, label) {
    const preview = byId('adminLogCleanupPreviewButton');
    const execute = byId('adminLogCleanupExecuteButton');
    if (preview) preview.disabled = Boolean(busy);
    if (execute) execute.disabled = Boolean(busy) || !(state.logPreview && state.logPreview.canPrepare);
    if (execute) execute.textContent = busy ? (label || 'กำลังทำงาน...') : 'สำรองและล้าง Log เก่า';
  }


  async function monitorExportJob(
    jobId,
    initial
  ) {
    if (state.polling) {
      throw new Error(
        'มีงานส่งออกกำลังทำงานอยู่'
      );
    }

    state.polling =
      true;

    state.activeJobId =
      jobId;

    let latest =
      initial ||
      {};

    const started =
      Date.now();

    try {
      while (
        Date.now() -
          started <
        45 *
          60 *
          1000
      ) {
        latest =
          await API
            .getManagementReportJobStatus(
              jobId
            );

        renderJobProgress(
          latest
        );

        const status =
          text(
            latest.status
          ).toUpperCase();

        if (
          status ===
          'READY'
        ) {
          return latest;
        }

        if (
          status ===
          'FAILED'
        ) {
          clearActiveJob();

          throw new Error(
            latest.errorMessage ||
            'งานส่งออกล้มเหลว'
          );
        }

        if (
          status ===
          'CANCELLED'
        ) {
          clearActiveJob();

          throw new Error(
            'งานส่งออกถูกยกเลิก'
          );
        }

        await sleep(
          4000
        );
      }

      throw new Error(
        'งานยังประมวลผลอยู่ สามารถกลับมาตรวจสอบภายหลังได้'
      );

    } finally {
      state.polling =
        false;

      state.activeJobId =
        '';
    }
  }


  function renderJobProgress(
    job
  ) {
    const progress =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            job.progressPercent ||
            0
          )
        )
      );

    setSummary(
      'กำลังสร้างไฟล์ ' +
      progress +
      '% · ตรวจแล้ว ' +
      Number(
        job.processedSourceRows ||
        0
      ) +
      ' แถว · ส่งออก ' +
      Number(
        job.rowCount ||
        0
      ) +
      ' แถว'
    );

    const element =
      byId(
        'adminInboundExportPreview'
      );

    if (!element) {
      return;
    }

    element.classList.add(
      'is-ready'
    );

    element.innerHTML = `
      <h4>
        กำลังสร้างไฟล์
      </h4>

      <p>
        <strong>
          ${escapeHtml(job.filename || job.jobId || '-')}
        </strong>
      </p>

      <div class="admin-management-result__facts">
        <span>
          ${progress}%
        </span>

        <span>
          ตรวจ ${Number(job.processedSourceRows || 0)} แถว
        </span>

        <span>
          ส่งออก ${Number(job.rowCount || 0)} แถว
        </span>
      </div>

      <p>
        ระบบทำงานเบื้องหลัง ไม่ต้องเปิดลิงก์ Google Drive
      </p>
    `;
  }


  function renderReadyResult(
    result
  ) {
    const element =
      byId(
        'adminInboundExportPreview'
      );

    if (!element) {
      return;
    }

    const exportId =
      result.exportId ||
      result.jobId ||
      '';

    element.classList.add(
      'is-ready'
    );

    element.innerHTML = `
      <h4>
        ไฟล์สรุป Timeline พร้อมดาวน์โหลด
      </h4>

      <p>
        <strong>
          ${escapeHtml(result.filename || '-')}
        </strong>
      </p>

      <div class="admin-management-result__facts">
        <span>
          ${escapeHtml(result.fileFormat || '-')}
        </span>

        <span>
          ${Number(result.rowCount || 0)} แถว
        </span>

        <span>
          ${Number(result.columnCount || 44)} คอลัมน์
        </span>
      </div>

      <p>
        ช่วง ${escapeHtml(result.startDate || '')}
        →
        ${escapeHtml(result.endDate || '')}
      </p>

      ${
        exportId
          ? `
            <button
              class="button button--primary"
              type="button"
              data-secure-export-id="${escapeAttribute(exportId)}"
            >
              ดาวน์โหลดไฟล์
            </button>
          `
          : ''
      }
    `;
  }


  async function downloadExport(
    exportId,
    button,
    automatic
  ) {
    const cleanExportId =
      text(
        exportId
      );

    if (
      !cleanExportId ||
      state.downloading
    ) {
      return;
    }

    state.downloading =
      true;

    const originalText =
      button
        ? button.textContent
        : '';

    if (button) {
      button.disabled =
        true;

      button.textContent =
        'กำลังดาวน์โหลด...';
    }

    try {
      const result =
        await API
          .downloadManagementReportFile(
            cleanExportId,
            {
              onProgress:
                (
                  progress
                ) => {
                  setSummary(
                    'กำลังดาวน์โหลด ' +
                    Number(
                      progress.percent ||
                      0
                    ) +
                    '%'
                  );
                }
            }
          );

      setSummary(
        'ดาวน์โหลดแล้ว: ' +
        (
          result.filename ||
          'ไฟล์รายงาน'
        )
      );

      toast(
        'ดาวน์โหลดไฟล์สำเร็จ',
        'success'
      );

    } catch (error) {
      setSummary(
        'ดาวน์โหลดไม่สำเร็จ: ' +
        errorMessage(
          error
        )
      );

      if (!automatic) {
        toast(
          errorMessage(
            error
          ),
          'error'
        );
      }

    } finally {
      state.downloading =
        false;

      if (button) {
        button.disabled =
          false;

        button.textContent =
          originalText ||
          'ดาวน์โหลด';
      }
    }
  }


  async function resumeActiveExportJob() {
    const saved =
      readActiveJob();

    if (
      !saved ||
      !saved.jobId ||
      saved.moduleId !==
        state.moduleId ||
      state.loading
    ) {
      return;
    }

    state.loading =
      true;

    setButtonBusy(
      true,
      'กำลังติดตามงานเดิม...'
    );

    try {
      const result =
        await monitorExportJob(
          saved.jobId,
          {
            jobId:
              saved.jobId
          }
        );

      renderReadyResult(
        result
      );

      setText(
        'adminManagementLatestFile',
        result.filename ||
        '-'
      );

      clearActiveJob();

      await loadHistoryOnly();

    } catch (error) {
      setSummary(
        'ติดตามงานเดิมไม่สำเร็จ: ' +
        errorMessage(
          error
        )
      );

    } finally {
      state.loading =
        false;

      setButtonBusy(
        false
      );
    }
  }


  function renderMonthlyPackageContents(items) {
    const element = byId('adminMonthlyPackageContents');
    if (!element) return;
    element.innerHTML = Array.isArray(items) && items.length
      ? items.map((item) => `
          <article class="admin-monthly-package-item">
            <strong>${escapeHtml(item.name || '-')}</strong>
            <span>${escapeHtml(item.purpose || '')}</span>
          </article>
        `).join('')
      : '<div class="empty-state">กำลังโหลดรายการชีตในไฟล์ Excel...</div>';
  }


  function renderSheetRegistry(items) {
    const element = byId('adminDataSheetRegistry');
    if (!element) return;
    const rows = Array.isArray(items) ? items : [];
    element.innerHTML = rows.length
      ? `
        <table>
          <thead>
            <tr>
              <th>ที่ตั้ง</th>
              <th>ชื่อชีต</th>
              <th>แถว</th>
              <th>กลุ่มข้อมูล</th>
              <th>หน้าที่</th>
              <th>กฎการเคลียร์</th>
              <th>ช่วงข้อมูลโดยประมาณ</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((item) => `
              <tr>
                <td>${escapeHtml(item.location || '-')}</td>
                <td><strong>${escapeHtml(item.sheetName || '-')}</strong><br><small>${escapeHtml(item.spreadsheetName || '')}</small></td>
                <td>${Number(item.rowCount || 0).toLocaleString('th-TH')}</td>
                <td data-category="${escapeAttribute(item.category || '')}">${escapeHtml(item.categoryLabel || item.category || '-')}</td>
                <td>${escapeHtml(item.purpose || '-')}</td>
                <td>${escapeHtml(item.cleanupRule || '-')}</td>
                <td>${escapeHtml(item.oldestDate || '-')} → ${escapeHtml(item.newestDate || '-')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : '<div class="empty-state">ยังไม่พบบัญชีชีตระบบ</div>';
  }


  function renderMonthlyPreview(result) {
    const counts = result && result.counts ? result.counts : {};
    const cleanup = result && result.cleanupPreview ? result.cleanupPreview : {};
    setText('adminMonthlyStartedCount', Number(counts.vehiclesStarted || 0).toLocaleString('th-TH'));
    setText('adminMonthlyClosedCount', Number(counts.vehiclesClosed || 0).toLocaleString('th-TH'));
    setText('adminMonthlyActiveCount', Number(counts.vehiclesActive || 0).toLocaleString('th-TH'));
    setText('adminMonthlyActivityCount', Number(counts.activitiesInMonth || 0).toLocaleString('th-TH'));
    setText('adminMonthlyCleanupCandidateCount', Number(cleanup.totalCandidateRows || 0).toLocaleString('th-TH'));
    setText('adminMonthlyBlockedCount', Number(cleanup.totalBlockedRows || cleanup.activeVehiclesBlocked || 0).toLocaleString('th-TH'));

    const element = byId('adminMonthlyCleanupPreview');
    if (!element) return;
    const items = Array.isArray(cleanup.candidates) ? cleanup.candidates : [];
    element.innerHTML = items.length
      ? items.map((item) => `
          <article class="admin-cleanup-preview-row">
            <strong>${escapeHtml(item.sheetName || '-')}</strong>
            <span>เตรียมเก็บถาวร ${Number(item.candidateRows || 0).toLocaleString('th-TH')} แถว</span>
            <span>บล็อก ${Number(item.blockedRows || 0).toLocaleString('th-TH')} แถว</span>
            <span>${escapeHtml(item.actionInRound09 || '')}</span>
          </article>
        `).join('') + `
          <div class="admin-data-control-note">
            <strong>Preview เท่านั้น</strong>
            <span>${escapeHtml((cleanup.blockedReasons || []).join(' · '))}</span>
          </div>
        `
      : '<div class="empty-state">ยังไม่มีแถวที่พร้อมเก็บถาวร หรือยังไม่ได้กดตรวจข้อมูล</div>';
  }


  function renderMonthlyReadyResult(result) {
    const element = byId('adminInboundExportPreview');
    if (!element) return;
    element.classList.add('is-ready');
    element.innerHTML = `
      <h4>ไฟล์ Excel ประจำเดือนพร้อมดาวน์โหลด</h4>
      <p><strong>${escapeHtml(result.filename || '-')}</strong></p>
      <div class="admin-management-result__facts">
        <span>${Number(result.workbookSheetCount || 9)} ชีต</span>
        <span>${Number(result.counts && result.counts.vehiclesStarted || 0).toLocaleString('th-TH')} รถ/ตู้</span>
        <span>${Number(result.counts && result.counts.activitiesInMonth || 0).toLocaleString('th-TH')} กิจกรรม</span>
      </div>
      <p>เดือน ${escapeHtml(result.month || '')} · ใช้ไฟล์นี้เป็นหลักฐานก่อนกดเก็บถาวร</p>
      ${result.exportId ? `
        <button class="button button--primary" type="button" data-secure-export-id="${escapeAttribute(result.exportId)}">ดาวน์โหลดไฟล์ Excel</button>
      ` : ''}
    `;
  }


  function setPreviewButtonBusy(busy) {
    const button = byId('adminMonthlyPreviewButton');
    if (!button) return;
    button.disabled = Boolean(busy);
    button.textContent = busy ? 'กำลังตรวจข้อมูล...' : 'ตรวจข้อมูลเดือนนี้ก่อน';
  }


  async function loadHistoryOnly() {
    try {
      const data =
        await API
          .listManagementReportExports(
            state.moduleId,
            {
              limit:
                20
            }
          );

      renderHistory(
        data.exports ||
        []
      );

    } catch (error) {
      console.warn(
        error
      );
    }
  }


  async function cleanupExpiredFiles() {
    if (state.loading) {
      return;
    }

    state.loading =
      true;

    try {
      const result =
        await API
          .cleanupManagementReportFiles();

      toast(
        'ตรวจ ' +
        Number(
          result.checked ||
          0
        ) +
        ' ไฟล์ · ลบ ' +
        Number(
          result.trashed ||
          0
        ) +
        ' ไฟล์',
        'success'
      );

      await loadHistoryOnly();

    } catch (error) {
      toast(
        errorMessage(
          error
        ),
        'error'
      );

    } finally {
      state.loading =
        false;
    }
  }


  function updatePrimaryButton() {
    const button =
      byId(
        'adminInboundExportButton'
      );

    if (
      !button ||
      state.loading
    ) {
      return;
    }

    const format =
      value(
        'adminManagementFileFormat'
      ) ||
      'XLSX';

    button.textContent =
      state.dateMode === 'MONTH'
        ? 'สร้างไฟล์ Excel ประจำเดือน'
        : 'สร้างและดาวน์โหลด ' +
          (format === 'CSV' ? 'CSV' : 'Excel');
  }


  function setButtonBusy(
    busy,
    label
  ) {
    const button =
      byId(
        'adminInboundExportButton'
      );

    if (!button) {
      return;
    }

    button.disabled =
      Boolean(
        busy
      );

    if (busy) {
      button.textContent =
        label ||
        'กำลังสร้างไฟล์...';

    } else {
      updatePrimaryButton();
    }
  }


  function saveActiveJob(
    jobId,
    moduleId
  ) {
    try {
      localStorage.setItem(
        ACTIVE_JOB_KEY,
        JSON.stringify({
          jobId:
            jobId,

          moduleId:
            moduleId,

          storedAt:
            Date.now()
        })
      );
    } catch (error) {
      // Browser อาจปิด localStorage
    }
  }


  function readActiveJob() {
    try {
      return JSON.parse(
        localStorage.getItem(
          ACTIVE_JOB_KEY
        ) ||
        'null'
      );

    } catch (error) {
      return null;
    }
  }


  function clearActiveJob() {
    try {
      localStorage.removeItem(
        ACTIVE_JOB_KEY
      );
    } catch (error) {
      // Browser อาจปิด localStorage
    }
  }


  function setSummary(
    value
  ) {
    setText(
      'adminInboundExportSummary',
      value
    );
  }


  function setText(
    id,
    value
  ) {
    const element =
      byId(
        id
      );

    if (element) {
      element.textContent =
        value;
    }
  }


  function value(
    id
  ) {
    return text(
      byId(
        id
      )?.value
    );
  }


  function byId(
    id
  ) {
    return document
      .getElementById(
        id
      );
  }


  function text(
    value
  ) {
    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    return String(
      value
    ).trim();
  }


  function errorMessage(
    error
  ) {
    return (
      error &&
      error.message
    )
      ? error.message
      : String(
          error ||
          'เกิดข้อผิดพลาด'
        );
  }


  function isAdmin(
    session
  ) {
    const user =
      session &&
      session.user
        ? session.user
        : session ||
          {};

    return (
      text(
        user.role
      ).toUpperCase() ===
      'ADMIN'
    );
  }


  function escapeHtml(
    value
  ) {
    return text(
      value
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


  function escapeAttribute(
    value
  ) {
    return escapeHtml(
      value
    );
  }


  function toast(
    title,
    icon
  ) {
    if (!window.Swal) {
      return;
    }

    Swal.fire({
      toast:
        true,

      position:
        'top-end',

      timer:
        3200,

      showConfirmButton:
        false,

      icon:
        icon ||
        'info',

      title:
        title
    });
  }


  function sleep(
    milliseconds
  ) {
    return new Promise(
      (
        resolve
      ) =>
        window.setTimeout(
          resolve,
          milliseconds
        )
    );
  }



})(
  window,
  document
);
