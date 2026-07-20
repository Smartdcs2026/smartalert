/* SMARTALERT BASELINE 1 — Canonical Workflow Status Compatibility
 * Build: 2026.07.21-baseline1
 */

/*
 * AlertVendor Consolidated Bundle
 * Output: github-pages/inbound.bundle.js
 * Build: 20260720-consolidated-bundle-r1
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
 * SOURCE 03: inbound-offline-queue(3).js
 * ============================================================ */
/**
 * inbound-offline-queue.js
 * Phase 2A — Durable Inbound Pending Queue
 *
 * เป้าหมาย:
 * - เก็บงาน Workflow ที่ยังยืนยันผลไม่ได้ไว้ในเครื่องแบบ Durable
 * - Retry ด้วย requestId เดิม เพื่อให้ Backend Idempotency ป้องกันการเขียนซ้ำ
 * - ไม่เก็บ Access Token หรือ Secret ลง IndexedDB/localStorage
 * - ผูกงานกับผู้ใช้งานที่สร้างรายการ ป้องกันบัญชีอื่นส่งงานแทน
 * - ใช้ IndexedDB เป็นหลัก และ fallback เป็น localStorage เมื่อ Browser ปิด IndexedDB
 */
(function (window) {
  'use strict';

  const VERSION = '2026.07.19-round5-revision1-fast-scan-auto-recovery-v1';
  const DB_NAME = 'alertvendor_inbound_pending_queue_v2';
  const DB_VERSION = 1;
  const STORE_NAME = 'operations';
  const FALLBACK_STORAGE_KEY = 'ALERT_VENDOR_INBOUND_PENDING_QUEUE_V2';
  const LEASE_STORAGE_KEY = 'ALERT_VENDOR_INBOUND_QUEUE_LEASE_V2';

  const STATUS = Object.freeze({
    PENDING: 'PENDING',
    SENDING: 'SENDING',
    RETRY_WAIT: 'RETRY_WAIT',
    UNKNOWN: 'UNKNOWN',
    FAILED: 'FAILED',
    PAUSED_AUTH: 'PAUSED_AUTH',
    PAUSED_ACTOR: 'PAUSED_ACTOR',
    COMMITTED: 'COMMITTED'
  });

  const KIND = Object.freeze({
    RESOLVE_SCAN: 'RESOLVE_SCAN',
    SUBMIT_DOCUMENT: 'SUBMIT_DOCUMENT',
    RETURN_DOCUMENT: 'RETURN_DOCUMENT',
    CANCEL_STAGE: 'CANCEL_STAGE'
  });

  const LEGACY_QUEUE_LOOKUP_METHODS = new Set([
    'QUEUE_REPLAY',
    'QUEUE_UNKNOWN_COMMIT_VERIFY',
    'QUEUE_RECONCILE'
  ]);

  const VALID_TRANSPORT_LOOKUP_METHODS = new Set([
    'MANUAL',
    'SCAN',
    'QR',
    'CAMERA'
  ]);

  const ACTIVE_DEDUPE_STATUSES = new Set([
    STATUS.PENDING,
    STATUS.SENDING,
    STATUS.RETRY_WAIT,
    STATUS.UNKNOWN,
    STATUS.PAUSED_AUTH,
    STATUS.PAUSED_ACTOR,
    STATUS.FAILED
  ]);

  const TRANSIENT_CODES = new Set([
    'NETWORK_ERROR',
    'REQUEST_TIMEOUT',
    'GAS_TIMEOUT',
    'GAS_CONNECTION_FAILED',
    'GAS_HTTP_ERROR',
    'GAS_INVALID_RESPONSE',
    'UPSTREAM_TIMEOUT',
    'SERVICE_UNAVAILABLE',
    'TOO_MANY_REQUESTS',
    'WORKER_INTERNAL_ERROR',
    'API_ERROR'
  ]);

  const AUTH_CODES = new Set([
    'AUTH_REQUIRED',
    'SESSION_EXPIRED',
    'INVALID_SESSION',
    'INVALID_SESSION_SIGNATURE',
    'INVALID_SESSION_PAYLOAD',
    'SESSION_VERSION_EXPIRED',
    'MUST_CHANGE_PASSWORD'
  ]);

  const DUPLICATE_OR_ADVANCED_CODES = new Set([
    'DOCUMENT_ALREADY_SUBMITTED',
    'DOCUMENT_ALREADY_RETURNED',
    'RECEIVING_ALREADY_COMPLETED',
    'WORKFLOW_STAGE_ORDER_INVALID',
    'WORKFLOW_ALREADY_GATE_OUT',
    'WORKFLOW_ALREADY_CANCELLED',
    'INBOUND_CANCEL_ALREADY_CANCELLED',
    'INBOUND_CANCEL_NO_INBOUND_STAGE'
  ]);

  const state = {
    initialized: false,
    api: null,
    getActor: null,
    adapter: null,
    adapterMode: '',
    listeners: new Set(),
    flushPromise: null,
    autoFlushTimer: 0,
    instanceId: createUuid(),
    config: {
      maxItems: 500,
      maxAttempts: 12,
      retryBaseMs: 3000,
      retryMaxMs: 5 * 60 * 1000,
      autoFlushMs: 15000,
      sendingStaleMs: 2 * 60 * 1000,
      committedRetentionMs: 24 * 60 * 60 * 1000,
      failedRetentionMs: 7 * 24 * 60 * 60 * 1000,
      leaseMs: 45000,
      maxBatch: 30
    }
  };

  class QueueError extends Error {
    constructor(code, message, details) {
      super(message || code || 'Queue error');
      this.name = 'InboundQueueError';
      this.code = code || 'INBOUND_QUEUE_ERROR';
      this.details = details || null;
    }
  }

  /************************************************************
   * Public API
   ************************************************************/

  const service = {
    VERSION,
    STATUS,
    KIND,
    QueueError,

    async init(options) {
      const config = isObject(options) ? options : {};

      if (!config.api) {
        throw new QueueError(
          'QUEUE_API_REQUIRED',
          'ไม่พบ VehicleAPI สำหรับระบบรอส่ง'
        );
      }

      state.api = config.api;
      state.getActor = typeof config.getActor === 'function'
        ? config.getActor
        : function () { return null; };

      state.config = Object.assign(
        {},
        state.config,
        normalizeConfig(config.config || {})
      );

      state.adapter = await createAdapter();
      state.adapterMode = state.adapter.mode;
      state.initialized = true;

      await recoverInterruptedOperations();
      const legacyMigration = await migrateLegacyQueueLookupMethods();
      await cleanupExpiredOperations();
      await emitChange();

      return {
        success: true,
        version: VERSION,
        storageMode: state.adapterMode,
        legacyMigration,
        migratedLegacyCount: legacyMigration.migratedCount,
        revivedLegacyCount: legacyMigration.revivedCount,
        initializedAt: new Date().toISOString()
      };
    },

    subscribe(listener) {
      if (typeof listener !== 'function') {
        return function () {};
      }

      state.listeners.add(listener);

      return function unsubscribe() {
        state.listeners.delete(listener);
      };
    },

    async enqueueResolveScan(moduleId, autoId, payload) {
      return enqueueOperation({
        kind: KIND.RESOLVE_SCAN,
        moduleId,
        autoId,
        payload
      });
    },

    async enqueueSubmitDocument(moduleId, autoId, payload) {
      return enqueueOperation({
        kind: KIND.SUBMIT_DOCUMENT,
        moduleId,
        autoId,
        payload
      });
    },

    async enqueueReturnDocument(moduleId, autoId, payload) {
      return enqueueOperation({
        kind: KIND.RETURN_DOCUMENT,
        moduleId,
        autoId,
        payload
      });
    },

    async enqueueCancelStage(moduleId, autoId, payload) {
      return enqueueOperation({
        kind: KIND.CANCEL_STAGE,
        moduleId,
        autoId,
        payload
      });
    },

    async flush(options) {
      ensureInitialized();

      if (state.flushPromise) {
        return state.flushPromise;
      }

      const config = isObject(options) ? options : {};
      state.flushPromise = flushInternal(config)
        .finally(function () {
          state.flushPromise = null;
        });

      return state.flushPromise;
    },

    async retryAll(options) {
      ensureInitialized();
      const config = isObject(options) ? options : {};
      const moduleId = cleanText(config.moduleId);
      const actor = currentActor();
      const operations = await state.adapter.getAll();
      let updated = 0;

      for (const operation of operations) {
        if (moduleId && normalizeModuleId(operation.moduleId) !== normalizeModuleId(moduleId)) {
          continue;
        }

        if (![
          STATUS.FAILED,
          STATUS.UNKNOWN,
          STATUS.RETRY_WAIT,
          STATUS.PAUSED_AUTH,
          STATUS.PAUSED_ACTOR
        ].includes(operation.status)) {
          continue;
        }

        if (operation.actorUsername && actor.username && operation.actorUsername !== actor.username) {
          continue;
        }

        operation.status = STATUS.PENDING;
        operation.nextAttemptAt = 0;
        operation.updatedAt = Date.now();
        operation.lastError = null;
        operation.manualRetryCount = Number(operation.manualRetryCount || 0) + 1;
        await state.adapter.put(operation);
        updated += 1;
      }

      await emitChange();

      if (config.flush !== false) {
        await service.flush({ force: true, moduleId });
      }

      return {
        success: true,
        updated
      };
    },

    async list(options) {
      ensureInitialized();
      const config = isObject(options) ? options : {};
      const moduleId = cleanText(config.moduleId);
      const statuses = Array.isArray(config.statuses)
        ? new Set(config.statuses.map(normalizeStatus))
        : null;
      const operations = await state.adapter.getAll();

      return operations
        .filter(function (operation) {
          if (moduleId && normalizeModuleId(operation.moduleId) !== normalizeModuleId(moduleId)) {
            return false;
          }

          if (statuses && !statuses.has(operation.status)) {
            return false;
          }

          return true;
        })
        .sort(function (left, right) {
          return Number(left.createdAt || 0) - Number(right.createdAt || 0);
        })
        .map(publicOperation);
    },

    async getSummary(options) {
      ensureInitialized();
      return buildSummary(options);
    },

    async removeFailed(operationId) {
      ensureInitialized();
      const operation = await state.adapter.get(cleanText(operationId));

      if (!operation) {
        return { success: true, removed: false };
      }

      if (![STATUS.FAILED, STATUS.COMMITTED].includes(operation.status)) {
        throw new QueueError(
          'QUEUE_OPERATION_NOT_REMOVABLE',
          'ลบได้เฉพาะรายการที่ล้มเหลวหรือส่งสำเร็จแล้ว'
        );
      }

      await state.adapter.delete(operation.id);
      await emitChange();

      return { success: true, removed: true };
    },

    async clearCommitted() {
      ensureInitialized();
      const operations = await state.adapter.getAll();
      let removed = 0;

      for (const operation of operations) {
        if (operation.status === STATUS.COMMITTED) {
          await state.adapter.delete(operation.id);
          removed += 1;
        }
      }

      await emitChange();
      return { success: true, removed };
    },

    startAutoFlush() {
      ensureInitialized();
      service.stopAutoFlush();

      const intervalMs = Math.max(5000, Number(state.config.autoFlushMs) || 15000);
      state.autoFlushTimer = window.setInterval(function () {
        if (window.navigator && window.navigator.onLine === false) {
          return;
        }

        void service.flush({ reason: 'AUTO_TIMER' });
      }, intervalMs);

      return { success: true, intervalMs };
    },

    stopAutoFlush() {
      if (state.autoFlushTimer) {
        window.clearInterval(state.autoFlushTimer);
        state.autoFlushTimer = 0;
      }
    },

    isTransientError,
    isAuthError,
    createRequestId: createUuid,
    getStorageMode: function () { return state.adapterMode; }
  };

  /************************************************************
   * Enqueue
   ************************************************************/

  async function enqueueOperation(input) {
    ensureInitialized();

    const kind = normalizeKind(input.kind);
    const moduleId = cleanText(input.moduleId);
    const autoId = normalizeAutoId(input.autoId);
    const payload = isObject(input.payload) ? Object.assign({}, input.payload) : {};
    const actor = currentActor();

    if (!moduleId) {
      throw new QueueError('MODULE_ID_REQUIRED', 'กรุณาระบุ Module ก่อนเก็บงานรอส่ง');
    }

    if (!autoId) {
      throw new QueueError('AUTO_ID_REQUIRED', 'กรุณาระบุ Auto ID ก่อนเก็บงานรอส่ง');
    }

    if (!actor.username) {
      throw new QueueError('QUEUE_ACTOR_REQUIRED', 'ไม่พบผู้ใช้งานสำหรับผูกงานรอส่ง');
    }

    const dedupeKey = buildDedupeKey(moduleId, autoId);
    const all = await state.adapter.getAll();
    const existing = all
      .filter(function (operation) {
        return operation.dedupeKey === dedupeKey &&
          ACTIVE_DEDUPE_STATUSES.has(operation.status);
      })
      .sort(function (left, right) {
        return Number(right.updatedAt || 0) - Number(left.updatedAt || 0);
      })[0] || null;

    if (existing) {
      if (existing.status === STATUS.FAILED) {
        existing.kind = kind;
        existing.payload = mergePayload(existing.payload, payload);
        existing.status = STATUS.PENDING;
        existing.nextAttemptAt = 0;
        existing.updatedAt = Date.now();
        existing.lastError = null;
        existing.actorUsername = actor.username;
        existing.actorRole = actor.role;
        await state.adapter.put(existing);
        await emitChange();
        return {
          queued: true,
          revived: true,
          duplicate: false,
          operation: publicOperation(existing)
        };
      }

      return {
        queued: false,
        revived: false,
        duplicate: true,
        operation: publicOperation(existing)
      };
    }

    const now = Date.now();
    const requestId = cleanText(
      payload.clientRequestId ||
      payload.requestId ||
      createUuid()
    );

    payload.entryCode = cleanText(payload.entryCode || payload.autoId || autoId);
    payload.autoId = cleanText(payload.autoId || autoId);
    payload.clientRequestId = requestId;
    payload.requestId = requestId;

    const operation = {
      id: 'IQ-' + createUuid(),
      version: VERSION,
      kind,
      moduleId,
      autoId,
      dedupeKey,
      payload,
      clientRequestId: requestId,
      requestId,
      actorUsername: actor.username,
      actorRole: actor.role,
      status: STATUS.PENDING,
      attempts: 0,
      manualRetryCount: 0,
      createdAt: now,
      updatedAt: now,
      lastAttemptAt: 0,
      nextAttemptAt: 0,
      committedAt: 0,
      lastError: null,
      resultSummary: null,
      source: cleanText(payload.scanSource || payload.source || 'INBOUND')
    };

    await ensureCapacity();
    await state.adapter.put(operation);
    await emitChange();
    notifyOperation('QUEUED', operation, null);

    return {
      queued: true,
      revived: false,
      duplicate: false,
      operation: publicOperation(operation)
    };
  }

  /************************************************************
   * Flush
   ************************************************************/

  async function flushInternal(options) {
    const config = isObject(options) ? options : {};
    const force = config.force === true;
    const moduleId = cleanText(config.moduleId);

    if (window.navigator && window.navigator.onLine === false && !force) {
      const summary = await buildSummary({ moduleId });
      return {
        success: true,
        skipped: true,
        reason: 'OFFLINE',
        summary
      };
    }

    const lease = acquireLease();
    if (!lease.acquired) {
      return {
        success: true,
        skipped: true,
        reason: 'ANOTHER_TAB_FLUSHING',
        leaseOwner: lease.owner || ''
      };
    }

    const startedAt = Date.now();
    let processed = 0;
    let committed = 0;
    let failed = 0;
    let deferred = 0;

    try {
      await recoverInterruptedOperations();
      const operations = await state.adapter.getAll();
      const flushActor = currentActor();
      const due = operations
        .filter(function (operation) {
          if (moduleId && normalizeModuleId(operation.moduleId) !== normalizeModuleId(moduleId)) {
            return false;
          }

          if (![STATUS.PENDING, STATUS.RETRY_WAIT, STATUS.UNKNOWN, STATUS.PAUSED_AUTH, STATUS.PAUSED_ACTOR].includes(operation.status)) {
            return false;
          }

          if (
            operation.status === STATUS.PAUSED_ACTOR &&
            operation.actorUsername &&
            operation.actorUsername !== flushActor.username
          ) {
            return false;
          }

          if (
            operation.status === STATUS.PAUSED_AUTH &&
            !flushActor.username
          ) {
            return false;
          }

          if (!force && Number(operation.nextAttemptAt || 0) > Date.now()) {
            return false;
          }

          return true;
        })
        .sort(function (left, right) {
          return Number(left.createdAt || 0) - Number(right.createdAt || 0);
        })
        .slice(0, Math.max(1, Number(state.config.maxBatch) || 30));

      for (const operation of due) {
        renewLease();
        processed += 1;

        const actorCheck = validateActor(operation);
        if (!actorCheck.valid) {
          operation.status = actorCheck.status;
          operation.updatedAt = Date.now();
          operation.lastError = {
            code: actorCheck.code,
            message: actorCheck.message,
            at: Date.now()
          };
          await state.adapter.put(operation);
          deferred += 1;
          continue;
        }

        if (window.navigator && window.navigator.onLine === false && !force) {
          deferred += 1;
          break;
        }

        if (operation.status === STATUS.UNKNOWN) {
          const preflight = await reconcileUnknownOperation(operation);
          if (preflight.committed) {
            operation.status = STATUS.COMMITTED;
            operation.committedAt = Date.now();
            operation.updatedAt = operation.committedAt;
            operation.nextAttemptAt = 0;
            operation.lastError = null;
            operation.resultSummary = sanitizeResult(preflight.result);
            await state.adapter.put(operation);
            committed += 1;
            notifyOperation('COMMITTED',operation,preflight.result);
            continue;
          }
        }

        operation.status = STATUS.SENDING;
        operation.attempts = Number(operation.attempts || 0) + 1;
        operation.lastAttemptAt = Date.now();
        operation.updatedAt = Date.now();
        await state.adapter.put(operation);
        await emitChange();
        notifyOperation('SENDING', operation, null);

        try {
          const result = await executeOperation(operation);
          operation.status = STATUS.COMMITTED;
          operation.committedAt = Date.now();
          operation.updatedAt = operation.committedAt;
          operation.nextAttemptAt = 0;
          operation.lastError = null;
          operation.resultSummary = sanitizeResult(result);
          await state.adapter.put(operation);
          committed += 1;
          notifyOperation('COMMITTED', operation, result);
        } catch (error) {
          const reconciled = await tryReconcileAdvancedState(operation, error);

          if (reconciled.committed) {
            operation.status = STATUS.COMMITTED;
            operation.committedAt = Date.now();
            operation.updatedAt = operation.committedAt;
            operation.nextAttemptAt = 0;
            operation.lastError = null;
            operation.resultSummary = sanitizeResult(reconciled.result);
            await state.adapter.put(operation);
            committed += 1;
            notifyOperation('COMMITTED', operation, reconciled.result);
            continue;
          }

          const queueError = normalizeError(error);
          operation.lastError = queueError;
          operation.updatedAt = Date.now();

          if (isAuthError(error)) {
            operation.status = STATUS.PAUSED_AUTH;
            operation.nextAttemptAt = 0;
            deferred += 1;
          } else if (isTransientError(error)) {
            /*
             * Fast Scan Mode: ปัญหา Network/Timeout ห้ามกลายเป็นงานค้างที่ผู้ใช้ต้องกดเอง
             * Queue จะรอและลองใหม่อัตโนมัติด้วย clientRequestId เดิมต่อไป
             */
            const cooldownReached =
              operation.attempts >= Number(state.config.maxAttempts || 12);
            operation.status = isUnknownCommitError(error)
              ? STATUS.UNKNOWN
              : STATUS.RETRY_WAIT;
            operation.nextAttemptAt = Date.now() + (
              cooldownReached
                ? Number(state.config.retryMaxMs || 60000)
                : calculateRetryDelay(operation.attempts)
            );
            operation.lastError = Object.assign({}, queueError, {
              autoRetry: true,
              cooldownReached: cooldownReached,
              message: 'ระบบจะตรวจสอบและลองส่งคำขอเดิมให้อัตโนมัติ',
              originalMessage: queueError.message
            });
            deferred += 1;
            notifyOperation('DEFERRED', operation, error);
          } else {
            operation.status = STATUS.FAILED;
            operation.nextAttemptAt = 0;
            failed += 1;
            notifyOperation('FAILED', operation, error);
          }

          await state.adapter.put(operation);
        }
      }

      await cleanupExpiredOperations();
      const summary = await emitChange();

      return {
        success: failed === 0,
        skipped: false,
        processed,
        committed,
        failed,
        deferred,
        durationMs: Math.max(0, Date.now() - startedAt),
        summary
      };
    } finally {
      releaseLease();
    }
  }

  async function executeOperation(operation) {
    const rawPayload = Object.assign({}, operation.payload || {}, {
      entryCode: operation.autoId,
      autoId: operation.autoId,
      clientRequestId: operation.clientRequestId,
      requestId: operation.requestId
    });
    const lookupMethod = resolveTransportLookupMethod(
      rawPayload,
      operation.source
    );
    const payload = Object.assign({}, rawPayload, {
      lookupMethod,
      method: lookupMethod,
      scanSource: cleanText(
        rawPayload.scanSource ||
        rawPayload.source ||
        operation.source ||
        'QUEUE_REPLAY'
      ),
      queueReplaySource: cleanText(
        rawPayload.queueReplaySource ||
        'QUEUE_REPLAY'
      )
    });

    if (operation.kind === KIND.RESOLVE_SCAN) {
      const lookup = await state.api.lookupInboundWorkflow(
        operation.moduleId,
        operation.autoId,
        {
          entryCode: operation.autoId,
          autoId: operation.autoId,
          lookupMethod,
          method: lookupMethod,
          qrText: payload.qrText || operation.autoId,
          cacheBust: Date.now()
        }
      );

      const action = deriveWorkflowAction(lookup);
      const expectation = validateReplayExpectation(
        operation,
        lookup,
        action
      );

      if (expectation.safeToWrite !== true) {
        return {
          action: 'NO_WRITE_REQUIRED',
          noWrite: true,
          reconciled: true,
          stateChanged: expectation.stateChanged === true,
          message: expectation.message,
          lookup
        };
      }

      const enrichedPayload = enrichPayloadFromLookup(payload, lookup);

      if (action === KIND.SUBMIT_DOCUMENT) {
        const result = await state.api.submitInboundDocument(
          operation.moduleId,
          Object.assign({}, enrichedPayload, {
            note: payload.note || 'ส่งซ้ำจากคิว Inbound หลังเครือข่ายกลับมา',
            scanSource: 'QUEUE_REPLAY',
            originalScanSource: cleanText(
              payload.originalScanSource ||
              payload.source ||
              operation.source ||
              'SCAN'
            )
          })
        );
        return { action, lookup, result };
      }

      if (action === KIND.RETURN_DOCUMENT) {
        const result = await state.api.returnInboundDocument(
          operation.moduleId,
          Object.assign({}, enrichedPayload, {
            note: payload.note || 'ส่งซ้ำจากคิว Inbound หลังเครือข่ายกลับมา',
            scanSource: 'QUEUE_REPLAY',
            originalScanSource: cleanText(
              payload.originalScanSource ||
              payload.source ||
              operation.source ||
              'SCAN'
            )
          })
        );
        return { action, lookup, result };
      }

      return {
        action: 'NO_WRITE_REQUIRED',
        noWrite: true,
        lookup
      };
    }

    if (operation.kind === KIND.SUBMIT_DOCUMENT) {
      return state.api.submitInboundDocument(operation.moduleId, payload);
    }

    if (operation.kind === KIND.RETURN_DOCUMENT) {
      return state.api.returnInboundDocument(operation.moduleId, payload);
    }

    if (operation.kind === KIND.CANCEL_STAGE) {
      return state.api.cancelInboundWorkflow(operation.moduleId, payload);
    }

    throw new QueueError(
      'QUEUE_KIND_NOT_SUPPORTED',
      'ไม่รองรับชนิดงานรอส่ง ' + operation.kind
    );
  }

  async function reconcileUnknownOperation(operation) {
    if (!operation || !state.api || typeof state.api.lookupInboundWorkflow !== 'function') {
      return { committed:false, result:null };
    }

    try {
      const lookup = await state.api.lookupInboundWorkflow(
        operation.moduleId,
        operation.autoId,
        {
          cacheBust: Date.now(),
          lookupMethod: resolveTransportLookupMethod(
            operation.payload || {},
            operation.source
          ),
          scanSource: 'QUEUE_UNKNOWN_COMMIT_VERIFY',
          clientRequestId: operation.clientRequestId,
          requestId: operation.requestId
        }
      );
      const publicLookup = unwrapLookup(lookup);
      const workflow = publicLookup.state || {};
      const record = publicLookup.record || {};
      const status = cleanText(workflow.statusCode).toUpperCase();

      if (operation.kind === KIND.SUBMIT_DOCUMENT) {
        const committed = Boolean(
          workflow.documentSubmittedAt ||
          ['DOCUMENT_SUBMITTED','RECEIVING_COMPLETED','DOCUMENT_RETURNED','GATE_OUT_COMPLETED'].includes(status)
        );
        return committed
          ? { committed:true, result:{ reconciled:true, lookup, noWrite:true } }
          : { committed:false, result:null };
      }

      if (operation.kind === KIND.RETURN_DOCUMENT) {
        const committed = Boolean(
          workflow.documentReturnedAt ||
          ['DOCUMENT_RETURNED','GATE_OUT_COMPLETED'].includes(status)
        );
        return committed
          ? { committed:true, result:{ reconciled:true, lookup, noWrite:true } }
          : { committed:false, result:null };
      }

      if (operation.kind === KIND.RESOLVE_SCAN) {
        const action = deriveWorkflowAction(lookup);
        return action === 'NO_WRITE_REQUIRED'
          ? { committed:true, result:{ reconciled:true, lookup, noWrite:true } }
          : { committed:false, result:null };
      }

      if (operation.kind === KIND.CANCEL_STAGE) {
        return workflow.cancelled || status === 'CANCELLED'
          ? { committed:true, result:{ reconciled:true, lookup, noWrite:true } }
          : { committed:false, result:null };
      }

      return { committed:false, result:null };
    } catch (error) {
      if (isAuthError(error)) throw error;
      return { committed:false, result:null };
    }
  }

  async function tryReconcileAdvancedState(operation, error) {
    const code = cleanText(error && error.code).toUpperCase();

    if (!DUPLICATE_OR_ADVANCED_CODES.has(code)) {
      return { committed: false, result: null };
    }

    if (operation.kind === KIND.CANCEL_STAGE && code === 'INBOUND_CANCEL_ALREADY_CANCELLED') {
      return {
        committed: true,
        result: {
          noWrite: true,
          message: 'รายการถูกยกเลิกแล้วก่อนการส่งซ้ำ'
        }
      };
    }

    try {
      const lookup = await state.api.lookupInboundWorkflow(
        operation.moduleId,
        operation.autoId,
        {
          cacheBust: Date.now(),
          lookupMethod: resolveTransportLookupMethod(
            operation.payload || {},
            operation.source
          ),
          scanSource: 'QUEUE_RECONCILE'
        }
      );
      const publicLookup = unwrapLookup(lookup);
      const workflow = publicLookup.state || {};
      const record = publicLookup.record || {};
      const status = cleanText(workflow.statusCode).toUpperCase();

      if (operation.kind === KIND.SUBMIT_DOCUMENT) {
        const advanced = Boolean(
          workflow.documentSubmittedAt ||
          ['DOCUMENT_SUBMITTED', 'RECEIVING_COMPLETED', 'DOCUMENT_RETURNED', 'GATE_OUT_COMPLETED'].includes(status) ||
          record.timestampOut ||
          workflow.gateOutAt ||
          workflow.cancelled
        );

        return advanced
          ? { committed: true, result: { noWrite: true, reconciled: true, lookup } }
          : { committed: false, result: null };
      }

      if (operation.kind === KIND.RETURN_DOCUMENT) {
        const advanced = Boolean(
          workflow.documentReturnedAt ||
          ['DOCUMENT_RETURNED', 'GATE_OUT_COMPLETED'].includes(status) ||
          record.timestampOut ||
          workflow.gateOutAt ||
          workflow.cancelled
        );

        return advanced
          ? { committed: true, result: { noWrite: true, reconciled: true, lookup } }
          : { committed: false, result: null };
      }

      if (operation.kind === KIND.RESOLVE_SCAN) {
        const action = deriveWorkflowAction(lookup);
        return action === 'NO_WRITE_REQUIRED'
          ? { committed: true, result: { noWrite: true, reconciled: true, lookup } }
          : { committed: false, result: null };
      }
    } catch (lookupError) {
      return { committed: false, result: null };
    }

    return { committed: false, result: null };
  }

  function resolveTransportLookupMethod(payload, operationSource) {
    const source = isObject(payload) ? payload : {};
    const raw = cleanText(
      source.lookupMethod ||
      source.method ||
      source.originalLookupMethod ||
      source.originalScanSource ||
      source.scanSource ||
      source.source ||
      operationSource ||
      'SCAN'
    ).toUpperCase();

    if (raw === 'MANUAL') {
      return 'MANUAL';
    }

    if (
      VALID_TRANSPORT_LOOKUP_METHODS.has(raw) ||
      LEGACY_QUEUE_LOOKUP_METHODS.has(raw)
    ) {
      return raw === 'MANUAL' ? 'MANUAL' : 'SCAN';
    }

    return 'SCAN';
  }

  function validateReplayExpectation(operation, input, resolvedAction) {
    const payload = isObject(operation && operation.payload)
      ? operation.payload
      : {};
    const lookup = unwrapLookup(input);
    const workflow = isObject(lookup.state) ? lookup.state : {};
    const currentStatus = cleanText(workflow.statusCode).toUpperCase();
    const expectedStatus = cleanText(payload.expectedStatusCode).toUpperCase();
    const expectedAction = cleanText(payload.expectedActionCode).toUpperCase();
    const action = cleanText(resolvedAction).toUpperCase();

    if (action === 'NO_WRITE_REQUIRED') {
      return {
        safeToWrite: false,
        stateChanged: Boolean(
          expectedAction && expectedAction !== 'NO_WRITE_REQUIRED'
        ),
        message: 'สถานะล่าสุดไม่ต้องบันทึกซ้ำ ระบบปิดรายการค้างให้แล้ว'
      };
    }

    if (expectedAction && expectedAction !== action) {
      return {
        safeToWrite: false,
        stateChanged: true,
        message:
          'สถานะรายการเปลี่ยนจากตอนที่เก็บคิว ระบบไม่ทำขั้นตอนใหม่อัตโนมัติ'
      };
    }

    if (
      expectedStatus &&
      currentStatus &&
      expectedStatus !== currentStatus
    ) {
      return {
        safeToWrite: false,
        stateChanged: true,
        message:
          'สถานะรายการเปลี่ยนแล้ว ระบบยืนยันข้อมูลล่าสุดและปิดรายการค้าง'
      };
    }

    /*
     * คิวรุ่นเก่าที่ไม่มี Expected Action สามารถส่งยื่นเอกสารได้เมื่อยังเป็น
     * Gate In เท่านั้น แต่ห้ามทำ Return Document อัตโนมัติ เพราะอาจเป็น
     * ขั้นตอนใหม่ที่เกิดขึ้นหลังจากรายการถูกเก็บไว้ในคิว
     */
    if (!expectedAction && action === KIND.RETURN_DOCUMENT) {
      return {
        safeToWrite: false,
        stateChanged: true,
        message:
          'รายการเดินไปขั้นตอนใหม่แล้ว กรุณาสแกนอีกครั้งเพื่อรับเอกสารคืน'
      };
    }

    return {
      safeToWrite: true,
      stateChanged: false,
      message: ''
    };
  }

  async function migrateLegacyQueueLookupMethods() {
    if (!state.adapter) {
      return {
        success: true,
        scannedCount: 0,
        migratedCount: 0,
        revivedCount: 0
      };
    }

    const operations = await state.adapter.getAll();
    let migratedCount = 0;
    let revivedCount = 0;

    for (const operation of operations) {
      const payload = isObject(operation.payload)
        ? Object.assign({}, operation.payload)
        : {};
      const rawMethod = cleanText(
        payload.lookupMethod || payload.method
      ).toUpperCase();
      const lastErrorCode = cleanText(
        operation.lastError && operation.lastError.code
      ).toUpperCase();
      const lastErrorMessage = cleanText(
        operation.lastError && operation.lastError.message
      );
      const legacyMethod = LEGACY_QUEUE_LOOKUP_METHODS.has(rawMethod);
      const invalidMethodFailure =
        lastErrorCode === 'INVALID_LOOKUP_METHOD' ||
        lastErrorMessage.indexOf('วิธีค้นหารหัสเข้าพื้นที่ไม่ถูกต้อง') >= 0;

      if (!legacyMethod && !invalidMethodFailure) {
        continue;
      }

      const normalizedMethod = resolveTransportLookupMethod(
        payload,
        operation.source
      );
      payload.originalLookupMethod = rawMethod || payload.originalLookupMethod || '';
      payload.lookupMethod = normalizedMethod;
      payload.method = normalizedMethod;
      payload.originalScanSource = cleanText(
        payload.originalScanSource ||
        payload.scanSource ||
        payload.source ||
        operation.source ||
        'SCAN'
      );
      payload.scanSource = 'QUEUE_REPLAY';
      payload.queueReplaySource = 'LEGACY_QUEUE_MIGRATION';
      operation.payload = payload;
      operation.version = VERSION;
      operation.updatedAt = Date.now();
      operation.legacyLookupMethodMigrated = true;

      if (
        operation.status === STATUS.FAILED &&
        invalidMethodFailure
      ) {
        operation.status = STATUS.PENDING;
        operation.nextAttemptAt = 0;
        operation.lastError = null;
        operation.recoveredFromErrorCode = 'INVALID_LOOKUP_METHOD';
        revivedCount += 1;
      }

      await state.adapter.put(operation);
      migratedCount += 1;
    }

    return {
      success: true,
      scannedCount: operations.length,
      migratedCount,
      revivedCount
    };
  }

  /************************************************************
   * Workflow helpers
   ************************************************************/

  function deriveWorkflowAction(input) {
    const lookup = unwrapLookup(input);
    const record = isObject(lookup.record) ? lookup.record : {};
    const workflow = isObject(lookup.state) ? lookup.state : {};
    const status = cleanText(workflow.statusCode).toUpperCase();

    if (!normalizeAutoId(record.autoId || lookup.autoId)) {
      return 'NO_WRITE_REQUIRED';
    }

    if (record.timestampOut || workflow.gateOutAt || workflow.cancelled || status === 'CANCELLED') {
      return 'NO_WRITE_REQUIRED';
    }

    if (
      !workflow.documentSubmittedAt &&
      !['DOCUMENT_SUBMITTED', 'RECEIVING_COMPLETED', 'DOCUMENT_RETURNED', 'GATE_OUT_COMPLETED'].includes(status)
    ) {
      return KIND.SUBMIT_DOCUMENT;
    }

    if (workflow.receivingCompletedAt && !workflow.documentReturnedAt) {
      return KIND.RETURN_DOCUMENT;
    }

    return 'NO_WRITE_REQUIRED';
  }

  function enrichPayloadFromLookup(payload, input) {
    const lookup = unwrapLookup(input);
    const record = isObject(lookup.record) ? lookup.record : {};

    return Object.assign({}, payload, {
      entryCode: normalizeAutoId(record.autoId || payload.entryCode || payload.autoId),
      autoId: normalizeAutoId(record.autoId || payload.autoId || payload.entryCode),
      canonicalRecordId: cleanText(record.canonicalRecordId || payload.canonicalRecordId),
      sourceRowNumber: Number(record.sourceRowNumber || payload.sourceRowNumber || 0) || '',
      expectedTimestampIn: cleanText(record.timestampIn || payload.expectedTimestampIn),
      expectedTimestampInEpochMs: Number(record.timestampInEpochMs || payload.expectedTimestampInEpochMs || 0) || '',
      expectedPrimaryValue: cleanText(record.primaryValue || payload.expectedPrimaryValue),
      clientRequestId: cleanText(payload.clientRequestId),
      requestId: cleanText(payload.requestId || payload.clientRequestId)
    });
  }

  function unwrapLookup(input) {
    if (isObject(input) && isObject(input.result)) {
      return unwrapLookup(input.result);
    }

    if (isObject(input) && isObject(input.lookup)) {
      return unwrapLookup(input.lookup);
    }

    if (isObject(input) && isObject(input.data) && !input.record && !input.state) {
      return unwrapLookup(input.data);
    }

    return isObject(input) ? input : {};
  }

  /************************************************************
   * Recovery / Cleanup / Summary
   ************************************************************/

  async function recoverInterruptedOperations() {
    if (!state.adapter) {
      return;
    }

    const operations = await state.adapter.getAll();
    const now = Date.now();

    for (const operation of operations) {
      if (
        operation.status === STATUS.SENDING &&
        now - Number(operation.lastAttemptAt || operation.updatedAt || 0) >= Number(state.config.sendingStaleMs || 120000)
      ) {
        operation.status = STATUS.UNKNOWN;
        operation.nextAttemptAt = now;
        operation.updatedAt = now;
        operation.lastError = {
          code: 'INTERRUPTED_DURING_SEND',
          message: 'หน้าเว็บถูกปิดหรือรีโหลดระหว่างส่ง ระบบจะตรวจซ้ำด้วย requestId เดิม',
          at: now
        };
        await state.adapter.put(operation);
      }
    }
  }

  async function cleanupExpiredOperations() {
    if (!state.adapter) {
      return;
    }

    const operations = await state.adapter.getAll();
    const now = Date.now();

    for (const operation of operations) {
      const age = now - Number(operation.updatedAt || operation.createdAt || now);

      if (
        operation.status === STATUS.COMMITTED &&
        age >= Number(state.config.committedRetentionMs)
      ) {
        await state.adapter.delete(operation.id);
        continue;
      }

      if (
        operation.status === STATUS.FAILED &&
        age >= Number(state.config.failedRetentionMs)
      ) {
        await state.adapter.delete(operation.id);
      }
    }
  }

  async function ensureCapacity() {
    const operations = await state.adapter.getAll();
    const maximum = Math.max(20, Number(state.config.maxItems) || 500);

    if (operations.length < maximum) {
      return;
    }

    const removable = operations
      .filter(function (operation) {
        return [STATUS.COMMITTED, STATUS.FAILED].includes(operation.status);
      })
      .sort(function (left, right) {
        return Number(left.updatedAt || 0) - Number(right.updatedAt || 0);
      });

    while (operations.length >= maximum && removable.length > 0) {
      const operation = removable.shift();
      await state.adapter.delete(operation.id);
      operations.splice(operations.indexOf(operation), 1);
    }

    if (operations.length >= maximum) {
      throw new QueueError(
        'QUEUE_CAPACITY_REACHED',
        'คิวรอส่งเต็ม กรุณาเชื่อมต่ออินเทอร์เน็ตและส่งรายการค้างก่อนสแกนต่อ',
        { maximum }
      );
    }
  }

  async function buildSummary(options) {
    const config = isObject(options) ? options : {};
    const moduleId = cleanText(config.moduleId);
    const operations = await state.adapter.getAll();
    const filtered = operations.filter(function (operation) {
      return !moduleId || normalizeModuleId(operation.moduleId) === normalizeModuleId(moduleId);
    });

    const counts = {};
    Object.keys(STATUS).forEach(function (key) {
      counts[STATUS[key]] = 0;
    });

    filtered.forEach(function (operation) {
      counts[operation.status] = Number(counts[operation.status] || 0) + 1;
    });

    const pending =
      counts[STATUS.PENDING] +
      counts[STATUS.SENDING] +
      counts[STATUS.RETRY_WAIT] +
      counts[STATUS.UNKNOWN];

    const paused = counts[STATUS.PAUSED_AUTH] + counts[STATUS.PAUSED_ACTOR];

    return {
      version: VERSION,
      storageMode: state.adapterMode,
      total: filtered.length,
      pending,
      failed: counts[STATUS.FAILED],
      paused,
      committed: counts[STATUS.COMMITTED],
      counts,
      online: !(window.navigator && window.navigator.onLine === false),
      oldestPendingAt: oldestPendingAt(filtered),
      checkedAt: new Date().toISOString()
    };
  }

  async function emitChange() {
    if (!state.initialized || !state.adapter) {
      return null;
    }

    const summary = await buildSummary({});

    state.listeners.forEach(function (listener) {
      try {
        listener(summary);
      } catch (error) {
        console.warn('Inbound queue listener failed', error);
      }
    });

    try {
      window.dispatchEvent(new CustomEvent('inboundqueuechange', {
        detail: summary
      }));
    } catch (error) {}

    return summary;
  }

  function notifyOperation(type, operation, resultOrError) {
    try {
      window.dispatchEvent(new CustomEvent('inboundqueueoperation', {
        detail: {
          type,
          operation: publicOperation(operation),
          result: type === 'COMMITTED' ? resultOrError : null,
          error: type === 'FAILED' || type === 'DEFERRED'
            ? normalizeError(resultOrError)
            : null
        }
      }));
    } catch (error) {}
  }

  /************************************************************
   * Actor / Error / Retry
   ************************************************************/

  function currentActor() {
    const actor = typeof state.getActor === 'function'
      ? state.getActor()
      : null;
    const source = isObject(actor) ? actor : {};

    return {
      username: cleanText(source.username || source.actorUsername),
      role: cleanText(source.role || source.viewerRole).toUpperCase()
    };
  }

  function validateActor(operation) {
    const actor = currentActor();

    if (!actor.username) {
      return {
        valid: false,
        status: STATUS.PAUSED_AUTH,
        code: 'QUEUE_CURRENT_ACTOR_MISSING',
        message: 'รอเข้าสู่ระบบก่อนส่งรายการค้าง'
      };
    }

    if (operation.actorUsername && operation.actorUsername !== actor.username) {
      return {
        valid: false,
        status: STATUS.PAUSED_ACTOR,
        code: 'QUEUE_ACTOR_MISMATCH',
        message: 'รายการนี้ถูกสร้างโดย ' + operation.actorUsername + ' ต้องเข้าสู่ระบบด้วยบัญชีเดิมเพื่อส่ง'
      };
    }

    return { valid: true };
  }

  function isTransientError(error) {
    const code = cleanText(error && error.code).toUpperCase();
    const status = Number(error && error.status) || 0;

    if (TRANSIENT_CODES.has(code)) {
      return true;
    }

    return [0, 408, 425, 429, 500, 502, 503, 504].includes(status);
  }

  function isAuthError(error) {
    const code = cleanText(error && error.code).toUpperCase();
    const status = Number(error && error.status) || 0;
    return status === 401 || AUTH_CODES.has(code);
  }

  function isUnknownCommitError(error) {
    const code = cleanText(error && error.code).toUpperCase();
    const status = Number(error && error.status) || 0;
    return ['NETWORK_ERROR', 'REQUEST_TIMEOUT', 'GAS_TIMEOUT', 'GAS_CONNECTION_FAILED'].includes(code) ||
      [0, 408, 502, 504].includes(status);
  }

  function normalizeError(error) {
    return {
      code: cleanText(error && error.code) || 'QUEUE_SEND_FAILED',
      message: cleanText(error && error.message) || String(error || 'ส่งรายการไม่สำเร็จ'),
      status: Number(error && error.status) || 0,
      requestId: cleanText(error && error.requestId),
      at: Date.now()
    };
  }

  function calculateRetryDelay(attempts) {
    const base = Math.max(1000, Number(state.config.retryBaseMs) || 3000);
    const maximum = Math.max(base, Number(state.config.retryMaxMs) || 300000);
    const exponent = Math.max(0, Number(attempts || 1) - 1);
    const raw = Math.min(maximum, base * Math.pow(2, exponent));
    const jitter = raw * (Math.random() * 0.3);
    return Math.floor(raw + jitter);
  }

  /************************************************************
   * Lease
   ************************************************************/

  function acquireLease() {
    const now = Date.now();
    const leaseMs = Math.max(15000, Number(state.config.leaseMs) || 45000);

    try {
      const current = JSON.parse(window.localStorage.getItem(LEASE_STORAGE_KEY) || 'null');

      if (
        current &&
        current.owner &&
        current.owner !== state.instanceId &&
        Number(current.expiresAt || 0) > now
      ) {
        return { acquired: false, owner: current.owner };
      }

      const next = {
        owner: state.instanceId,
        expiresAt: now + leaseMs
      };
      window.localStorage.setItem(LEASE_STORAGE_KEY, JSON.stringify(next));
      const verify = JSON.parse(window.localStorage.getItem(LEASE_STORAGE_KEY) || 'null');
      return {
        acquired: Boolean(verify && verify.owner === state.instanceId),
        owner: verify && verify.owner
      };
    } catch (error) {
      return { acquired: true, owner: state.instanceId, fallback: true };
    }
  }

  function renewLease() {
    try {
      window.localStorage.setItem(LEASE_STORAGE_KEY, JSON.stringify({
        owner: state.instanceId,
        expiresAt: Date.now() + Math.max(15000, Number(state.config.leaseMs) || 45000)
      }));
    } catch (error) {}
  }

  function releaseLease() {
    try {
      const current = JSON.parse(window.localStorage.getItem(LEASE_STORAGE_KEY) || 'null');
      if (current && current.owner === state.instanceId) {
        window.localStorage.removeItem(LEASE_STORAGE_KEY);
      }
    } catch (error) {}
  }

  /************************************************************
   * Storage adapters
   ************************************************************/

  async function createAdapter() {
    if (window.indexedDB) {
      try {
        const db = await openDatabase();
        return indexedDbAdapter(db);
      } catch (error) {
        console.warn('IndexedDB unavailable, using localStorage queue', error);
      }
    }

    return localStorageAdapter();
  }

  function openDatabase() {
    return new Promise(function (resolve, reject) {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = function (event) {
        const db = event.target.result;
        let store;

        if (!db.objectStoreNames.contains(STORE_NAME)) {
          store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        } else {
          store = event.target.transaction.objectStore(STORE_NAME);
        }

        ensureIndex(store, 'status', 'status');
        ensureIndex(store, 'dedupeKey', 'dedupeKey');
        ensureIndex(store, 'moduleId', 'moduleId');
        ensureIndex(store, 'nextAttemptAt', 'nextAttemptAt');
        ensureIndex(store, 'createdAt', 'createdAt');
      };

      request.onsuccess = function () {
        resolve(request.result);
      };

      request.onerror = function () {
        reject(request.error || new Error('open IndexedDB failed'));
      };

      request.onblocked = function () {
        reject(new Error('IndexedDB upgrade blocked'));
      };
    });
  }

  function ensureIndex(store, name, keyPath) {
    if (!store.indexNames.contains(name)) {
      store.createIndex(name, keyPath, { unique: false });
    }
  }

  function indexedDbAdapter(db) {
    return {
      mode: 'INDEXED_DB',
      get: function (id) {
        return idbRequest(db, 'readonly', function (store) {
          return store.get(id);
        });
      },
      getAll: function () {
        return idbRequest(db, 'readonly', function (store) {
          return store.getAll();
        }).then(function (result) {
          return Array.isArray(result) ? result : [];
        });
      },
      put: function (operation) {
        return idbRequest(db, 'readwrite', function (store) {
          return store.put(operation);
        }).then(function () { return operation; });
      },
      delete: function (id) {
        return idbRequest(db, 'readwrite', function (store) {
          return store.delete(id);
        });
      }
    };
  }

  function idbRequest(db, mode, requestFactory) {
    return new Promise(function (resolve, reject) {
      const transaction = db.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);
      let request;
      let result;
      let settled = false;

      function fail(error) {
        if (settled) return;
        settled = true;
        reject(error);
      }

      try {
        request = requestFactory(store);
      } catch (error) {
        fail(error);
        return;
      }

      request.onsuccess = function () {
        result = request.result;
      };

      request.onerror = function () {
        fail(request.error || transaction.error || new Error('IndexedDB request failed'));
      };

      transaction.oncomplete = function () {
        if (settled) return;
        settled = true;
        resolve(result);
      };

      transaction.onerror = function () {
        fail(transaction.error || new Error('IndexedDB transaction failed'));
      };

      transaction.onabort = function () {
        fail(transaction.error || new Error('IndexedDB transaction aborted'));
      };
    });
  }

  function localStorageAdapter() {
    function readAll() {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(FALLBACK_STORAGE_KEY) || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function writeAll(items) {
      window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(items));
    }

    return {
      mode: 'LOCAL_STORAGE_FALLBACK',
      get: async function (id) {
        return readAll().find(function (item) { return item.id === id; }) || null;
      },
      getAll: async function () {
        return readAll();
      },
      put: async function (operation) {
        const items = readAll();
        const index = items.findIndex(function (item) { return item.id === operation.id; });
        if (index >= 0) items[index] = operation;
        else items.push(operation);
        writeAll(items);
        return operation;
      },
      delete: async function (id) {
        writeAll(readAll().filter(function (item) { return item.id !== id; }));
      }
    };
  }

  /************************************************************
   * Generic helpers
   ************************************************************/

  function ensureInitialized() {
    if (!state.initialized || !state.adapter) {
      throw new QueueError(
        'QUEUE_NOT_INITIALIZED',
        'ระบบรอส่งยังไม่พร้อมใช้งาน'
      );
    }
  }

  function normalizeConfig(config) {
    const source = isObject(config) ? config : {};
    const result = {};

    const numericKeys = [
      'maxItems',
      'maxAttempts',
      'retryBaseMs',
      'retryMaxMs',
      'autoFlushMs',
      'sendingStaleMs',
      'committedRetentionMs',
      'failedRetentionMs',
      'leaseMs',
      'maxBatch'
    ];

    numericKeys.forEach(function (key) {
      const value = Number(source[key]);
      if (Number.isFinite(value) && value > 0) {
        result[key] = Math.floor(value);
      }
    });

    return result;
  }

  function normalizeKind(value) {
    const kind = cleanText(value).toUpperCase();
    if (!Object.values(KIND).includes(kind)) {
      throw new QueueError('QUEUE_KIND_INVALID', 'ชนิดงานรอส่งไม่ถูกต้อง: ' + kind);
    }
    return kind;
  }

  function normalizeStatus(value) {
    const status = cleanText(value).toUpperCase();
    return Object.values(STATUS).includes(status) ? status : STATUS.PENDING;
  }

  function buildDedupeKey(moduleId, autoId) {
    return normalizeModuleId(moduleId) + '|' + normalizeAutoId(autoId);
  }

  function normalizeModuleId(value) {
    return cleanText(value).toLowerCase();
  }

  function normalizeAutoId(value) {
    return cleanText(value).replace(/\s+/g, '').toUpperCase();
  }

  function mergePayload(left, right) {
    return Object.assign({}, isObject(left) ? left : {}, isObject(right) ? right : {});
  }

  function publicOperation(operation) {
    return {
      id: operation.id,
      kind: operation.kind,
      moduleId: operation.moduleId,
      autoId: operation.autoId,
      status: operation.status,
      attempts: Number(operation.attempts || 0),
      manualRetryCount: Number(operation.manualRetryCount || 0),
      createdAt: Number(operation.createdAt || 0),
      updatedAt: Number(operation.updatedAt || 0),
      lastAttemptAt: Number(operation.lastAttemptAt || 0),
      nextAttemptAt: Number(operation.nextAttemptAt || 0),
      committedAt: Number(operation.committedAt || 0),
      actorUsername: operation.actorUsername || '',
      actorRole: operation.actorRole || '',
      source: operation.source || '',
      clientRequestId: operation.clientRequestId || '',
      lastError: operation.lastError || null,
      resultSummary: operation.resultSummary || null
    };
  }

  function sanitizeResult(input) {
    const source = isObject(input) ? input : {};
    const lookup = unwrapLookup(source);
    const record = isObject(lookup.record) ? lookup.record : {};
    const workflow = isObject(lookup.state) ? lookup.state : {};

    return {
      action: cleanText(source.action || source.mode || lookup.mode),
      noWrite: source.noWrite === true || lookup.noWrite === true,
      message: cleanText(source.message || lookup.message),
      autoId: normalizeAutoId(record.autoId),
      statusCode: cleanText(workflow.statusCode),
      documentSubmittedAt: cleanText(workflow.documentSubmittedAt),
      receivingCompletedAt: cleanText(workflow.receivingCompletedAt),
      documentReturnedAt: cleanText(workflow.documentReturnedAt),
      gateOutAt: cleanText(workflow.gateOutAt || record.timestampOut)
    };
  }

  function oldestPendingAt(operations) {
    const candidates = operations
      .filter(function (operation) {
        return [STATUS.PENDING, STATUS.SENDING, STATUS.RETRY_WAIT, STATUS.UNKNOWN].includes(operation.status);
      })
      .map(function (operation) { return Number(operation.createdAt || 0); })
      .filter(function (value) { return value > 0; });

    return candidates.length ? Math.min.apply(null, candidates) : 0;
  }

  function createUuid() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (character) {
      const random = Math.random() * 16 | 0;
      const value = character === 'x' ? random : (random & 0x3 | 0x8);
      return value.toString(16);
    });
  }

  function cleanText(value) {
    return value === null || value === undefined ? '' : String(value).trim();
  }

  function isObject(value) {
    return Boolean(value && typeof value === 'object' && !Array.isArray(value));
  }

  window.InboundPendingQueue = service;
})(window);


/* ============================================================
 * SOURCE 04: inbound-scanner(5).js
 * ============================================================ */
/************************************************************
 * inbound-scanner.js
 * ROUND 05 HOTFIX 05 — Camera standby scanner engine
 * Native BarcodeDetector + ZXing fallback
 ************************************************************/
(function (window) {
  'use strict';

  class InboundScanner {
    constructor(options) {
      const config = options && typeof options === 'object' ? options : {};
      this.video = config.video || null;
      this.onScan = typeof config.onScan === 'function' ? config.onScan : function () {};
      this.onStatus = typeof config.onStatus === 'function' ? config.onStatus : function () {};
      this.onError = typeof config.onError === 'function' ? config.onError : function () {};
      this.scanIntervalMs = Number(config.scanIntervalMs) || 90;
      this.pauseAfterScanMs = Number(config.pauseAfterScanMs) || 900;
      this.sameCodeBlockMs = Number(config.sameCodeBlockMs) || 15000;
      this.stream = null;
      this.detector = null;
      this.zxingReader = null;
      this.engine = '';
      this.running = false;
      this.pausedUntil = 0;
      this.lastText = '';
      this.lastTextAt = 0;
      this.loopTimer = 0;
    }

    async start() {
      if (this.running) {
        return {started: true, reused: true, engine: this.engine};
      }
      if (!this.video) {
        throw scannerError('SCANNER_VIDEO_MISSING', 'ไม่พบพื้นที่แสดงภาพกล้อง');
      }
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        throw scannerError('CAMERA_NOT_SUPPORTED', 'เบราว์เซอร์นี้ไม่รองรับการเปิดกล้อง ให้ใช้ช่องกรอกรหัสหรือเครื่องสแกนแทน');
      }

      if (typeof window.BarcodeDetector === 'function') {
        try {
          return await this.startNative_();
        } catch (error) {
          console.warn('Native scanner failed; fallback to ZXing', error);
          this.stop();
        }
      }

      if (window.ZXing && typeof window.ZXing.BrowserMultiFormatReader === 'function') {
        return await this.startZxing_();
      }

      throw scannerError('SCANNER_ENGINE_NOT_AVAILABLE', 'เครื่องนี้ไม่มีตัวอ่าน QR อัตโนมัติ ให้ใช้เครื่องสแกนหรือกรอกรหัสเอง');
    }

    async startNative_() {
      try {
        this.detector = new window.BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'itf']
        });
      } catch (error) {
        throw scannerError('BARCODE_DETECTOR_NOT_READY', 'BarcodeDetector ไม่พร้อมใช้งาน');
      }

      this.stream = await navigator.mediaDevices.getUserMedia(cameraConstraints());
      this.video.srcObject = this.stream;
      this.video.setAttribute('playsinline', 'playsinline');
      this.video.muted = true;
      await this.video.play();

      this.engine = 'BARCODE_DETECTOR';
      this.running = true;
      this.onStatus('READY', 'กล้องพร้อมสแกน');
      this.scheduleLoop_(80);
      return {started: true, reused: false, engine: this.engine};
    }

    async startZxing_() {
      this.engine = 'ZXING';
      this.running = true;
      this.zxingReader = new window.ZXing.BrowserMultiFormatReader();
      this.onStatus('READY', 'กล้องพร้อมสแกน');

      await this.zxingReader.decodeFromConstraints(
        cameraConstraints(),
        this.video,
        (result) => {
          if (!this.running || Date.now() < this.pausedUntil) return;
          if (!result) return;
          const text = String(typeof result.getText === 'function' ? result.getText() : result.text || '').trim();
          if (text) this.handleText_(text, 'CAMERA_ZXING');
        }
      );

      return {started: true, reused: false, engine: this.engine};
    }

    scheduleLoop_(delay) {
      window.clearTimeout(this.loopTimer);
      this.loopTimer = window.setTimeout(() => this.nativeLoop_(), Number(delay) || this.scanIntervalMs);
    }

    async nativeLoop_() {
      if (!this.running || !this.detector || !this.video) return;
      try {
        if (Date.now() >= this.pausedUntil && this.video.readyState >= 2) {
          const codes = await this.detector.detect(this.video);
          if (Array.isArray(codes) && codes.length > 0) {
            const rawValue = String(codes[0].rawValue || '').trim();
            if (rawValue) this.handleText_(rawValue, 'CAMERA_NATIVE');
          }
        }
      } catch (error) {
        // keep loop alive; transient camera decode errors are normal
      } finally {
        if (this.running) this.scheduleLoop_(this.scanIntervalMs);
      }
    }

    handleText_(text, source) {
      const cleanText = normalizeScanText(text);
      if (!cleanText) return;
      const now = Date.now();
      if (cleanText === this.lastText && now - this.lastTextAt < this.sameCodeBlockMs) {
        this.onStatus('DUPLICATE', 'กันสแกนซ้ำ ' + cleanText);
        return;
      }
      this.lastText = cleanText;
      this.lastTextAt = now;
      this.pause(this.pauseAfterScanMs);
      this.onScan(cleanText, {source: source || 'CAMERA', rawText: text, engine: this.engine});
    }

    pause(ms) {
      this.pausedUntil = Math.max(this.pausedUntil, Date.now() + (Number(ms) || this.pauseAfterScanMs));
    }

    blockText(text, ms) {
      this.lastText = normalizeScanText(text);
      this.lastTextAt = Date.now() - Math.max(0, this.sameCodeBlockMs - (Number(ms) || this.sameCodeBlockMs));
      this.pausedUntil = Math.max(this.pausedUntil, Date.now() + 250);
    }

    stop() {
      this.running = false;
      window.clearTimeout(this.loopTimer);
      this.loopTimer = 0;

      if (this.zxingReader && typeof this.zxingReader.reset === 'function') {
        try { this.zxingReader.reset(); } catch (error) {}
      }
      this.zxingReader = null;

      if (this.stream) {
        this.stream.getTracks().forEach((track) => {
          try { track.stop(); } catch (error) {}
        });
      }
      this.stream = null;
      if (this.video) {
        try { this.video.pause(); } catch (error) {}
        this.video.srcObject = null;
      }
      this.onStatus('STOPPED', 'ปิดกล้องแล้ว');
    }
  }

  function cameraConstraints() {
    return {
      video: {
        facingMode: {ideal: 'environment'},
        width: {ideal: 1280},
        height: {ideal: 720},
        frameRate: {ideal: 30, max: 60}
      },
      audio: false
    };
  }

  function normalizeScanText(value) {
    return String(value || '')
      .trim()
      .replace(/^https?:\/\/[^?]+\?/i, '')
      .replace(/^.*(?:autoId|entryCode|code)=/i, '')
      .split(/[&#\s]/)[0]
      .trim()
      .toUpperCase();
  }

  function scannerError(code, message) {
    const error = new Error(message || 'เปิดระบบสแกนไม่ได้');
    error.code = code || 'SCANNER_ERROR';
    return error;
  }

  window.InboundScanner = InboundScanner;
})(window);


/* ============================================================
 * SOURCE 05: inbound(5).js
 * ============================================================ */
/************************************************************
 * inbound.js
 * ROUND 05 REVISION 1 2026-07-19 — High-throughput Fast Scan Mode
 ************************************************************/
(function (window, document) {
  'use strict';

  const CONFIG = window.APP_CONFIG || {};
  const API = window.VehicleAPI;
  const PENDING_QUEUE = window.InboundPendingQueue;
  const BUILD = '2026.07.19-round5-revision1-fast-scan-mode-v1';
  const FAST_SCAN_MODE = true;
  const FAST_QUEUE_FLUSH_DELAY_MS = 35;
  const FAST_QUEUE_RETRY_BASE_MS = 1200;
  const FAST_QUEUE_RETRY_MAX_MS = 60000;
  const FAST_QUEUE_AUTO_FLUSH_MS = 1800;
  const DUPLICATE_BLOCK_MS = 45000;
  const HARD_BLOCK_AFTER_SAVE_MS = 120000;
  const INPUT_DEBOUNCE_MS = 250;
  const MIN_CODE_LENGTH = 12;
  const DASHBOARD_LIMIT = 1000;
  const DASHBOARD_POLL_MS = 8000;
  const FOCUS_SUPPRESS_MS = 18000;
  const DASHBOARD_CACHE_PREFIX = 'ALERT_VENDOR_INBOUND_DASHBOARD_CACHE_V11_';
  const DASHBOARD_CACHE_MAX_ITEMS = 800;

  const state = {
    session: null,
    moduleId: '',
    modules: [],
    scanner: null,
    clockTimer: 0,
    inputTimer: 0,
    loading: false,
    currentLookup: null,
    dashboardItems: [],
    dashboardQuery: '',
    statusFilter: 'ALL',
    inFlightCodes: new Set(),
    recentCodes: new Map(),
    recentDuplicateNotices: new Map(),
    hardwareScanBuffer: '',
    hardwareScanTimer: 0,
    hardwareScannerBound: false,
    keyboardCaptureActive: false,
    audioContext: null,
    audioUnlocked: false,
    suppressFocusUntil: 0,
    cameraWanted: false,
    tablePage: 1,
    tablePageSize: 'AUTO',
    computedPageSize: 20,
    filteredTotal: 0,
    dashboardLoadedAt: '',
    dashboardCacheRestored: false,
    dashboardRequestToken: 0,
    dashboardRevision: '',
    rulesRevision: '',
    dashboardTotalRows: 0,
    dashboardSummary: null,
    effectiveSlaRules: {},
    dashboardPollTimer: 0,
    dashboardPollBusy: false,
    foregroundWriteActive: false,
    postWriteRevisionTimer: 0,
    queueReady: false,
    queueSummary: {
      pending: 0,
      failed: 0,
      paused: 0,
      committed: 0,
      online: navigator.onLine !== false,
      storageMode: ''
    },
    queueRefreshTimer: 0,
    fastQueueFlushTimer: 0,
    fastQueueFlushRunning: false,
    fastQueueFlushAgain: false,
    queueUnsubscribe: null,
    slaSummary: {
      normal: 0,
      warning: 0,
      critical: 0
    }
  };

  document.addEventListener('DOMContentLoaded', initialize);
  window.addEventListener('beforeunload', destroy);

  async function initialize() {
    startClock();
    if (document.body) document.body.dataset.inboundUiBuild = BUILD;
    bindEvents();
    showLoading(true);

    try {
      if (!API || typeof API.me !== 'function') {
        throw createClientError('API_NOT_READY', 'ไม่พบ api.js หรือ VehicleAPI.me');
      }

      const session = await API.me();
      if (!session || session.authenticated !== true) {
        redirectToLogin();
        return;
      }

      state.session = session;
      const user = session.user || {};
      const role = normalizeRole(user.role);

      if (role !== 'INBOUND' && role !== 'ADMIN') {
        await showAlert('ไม่มีสิทธิ์เข้าใช้งานห้อง Inbound', 'บัญชีนี้ไม่ใช่สิทธิ์ INBOUND', 'warning');
        window.location.replace(CONFIG.DASHBOARD_URL || './index.html');
        return;
      }

      setConnection(role === 'ADMIN' ? 'ADMIN MODE' : 'INBOUND ONLINE', 'READY');
      setText('inboundUser', (user.displayName || user.username || '-') + ' · ' + role);

      await loadModules();
      await setupPendingQueue();
      restoreDashboardCache({silent: true});
      createScanner();
      await loadWorkflowDashboard(true, {cacheFirst: false});
      startDashboardPolling();
      focusCodeInput();

      // คอมพิวเตอร์ที่เสียบเครื่องสแกนจะพร้อมรับรหัสทันที
      setScanMessage('พร้อมสแกน · ยิงรหัสแล้วสแกนรายการถัดไปได้ทันที', 'SUCCESS');

      // พยายามเปิดกล้องแบบเงียบ หาก Browser ไม่ยอมก็ยังใช้ช่องกรอก/เครื่องสแกนได้
      window.setTimeout(() => {
        if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;
        void startCamera({silent: true});
      }, 600);
    } catch (error) {
      setConnection('ระบบไม่พร้อม', 'ERROR');
      setScanMessage(errorMessage(error), 'ERROR');
      await showAlert('เปิดหน้า Inbound ไม่สำเร็จ', errorMessage(error), 'error');
    } finally {
      showLoading(false);
    }
  }

  function bindEvents() {
    byId('inboundLogoutButton')?.addEventListener('click', logout);
    byId('inboundRefreshButton')?.addEventListener('click', () => void loadWorkflowDashboard(false, {manual: true}));
    byId('inboundFullscreenButton')?.addEventListener('click', () => void toggleInboundFullscreen());
    byId('inboundQueueButton')?.addEventListener('click', () => void openPendingQueueDialog());
    byId('inboundFailedQueueButton')?.addEventListener('click', () => void openPendingQueueDialog({failedFirst: true}));
    byId('inboundRetryQueueButton')?.addEventListener('click', () => void retryPendingQueueNow());
    byId('startCameraButton')?.addEventListener('click', () => void startCamera({silent: false}));
    byId('stopCameraButton')?.addEventListener('click', stopCamera);
    byId('clearCodeButton')?.addEventListener('click', () => {
      clearInput();
      clearCurrentResult();
      focusCodeInput(true);
    });
    byId('closeSelectedPanel')?.addEventListener('click', () => {
      const panel = byId('selectedRecordPanel');
      if (panel) panel.hidden = true;
      focusCodeInput(true);
    });

    byId('manualLookupForm')?.addEventListener('submit', (event) => {
      event.preventDefault();
      const code = getEntryCode();
      if (code) {
        void processCode(code, {source: 'KEYBOARD_ENTER', rawText: code});
      } else {
        beep('warn');
        setScanMessage('กรุณากรอก Auto ID ก่อนค้นหา', 'WARN');
        focusCodeInput(true);
      }
    });

    const input = byId('entryCodeInput');
    if (input) {
      input.addEventListener('focus', unlockAudio);
      input.addEventListener('click', unlockAudio);
      input.addEventListener('keydown', (event) => {
        unlockAudio();

        /*
         * Hotfix 34:
         * เครื่องสแกน QR/Barcode แบบ Keyboard Wedge จะยิงตัวอักษรลง input ก่อน
         * และมักปิดท้ายด้วย Enter หรือ Tab
         * ให้ input รับตัวอักษรตามธรรมชาติ ห้ามดักระหว่างยิง
         */
        if (event.key === 'Enter' || event.key === 'Tab') {
          event.preventDefault();
          event.stopPropagation();

          window.clearTimeout(state.inputTimer);

          /*
           * หน่วง 0 ms เพื่อให้ browser commit ค่าใน input ให้ครบก่อนอ่าน
           */
          window.setTimeout(() => {
            const code = getEntryCode();
            if (code) {
              void processCode(code, {
                source: event.key === 'Tab'
                  ? 'KEYBOARD_SCANNER_TAB'
                  : 'KEYBOARD_SCANNER_ENTER',
                rawText: code
              });
            }
          }, 0);
        }
      });

      input.addEventListener('input', () => {
        unlockAudio();

        /*
         * อย่า process เร็วเกินไป เพราะ scanner บางรุ่นยิงตัวอักษรช้ากว่า 45ms
         * ถ้า process ตอนรหัสยังไม่ครบ จะ clear input แล้วทำให้ดูเหมือนสแกนไม่เข้า
         */
        window.clearTimeout(state.inputTimer);
        state.inputTimer = window.setTimeout(() => {
          const code = getEntryCode();
          if (looksLikeCompleteCode(code)) {
            void processCode(code, {source: 'KEYBOARD_SCAN_NATIVE_IDLE', rawText: code});
          }
        }, INPUT_DEBOUNCE_MS);
      });

      input.addEventListener('paste', () => {
        unlockAudio();
        window.setTimeout(() => {
          const code = getEntryCode();
          if (looksLikeCompleteCode(code)) {
            void processCode(code, {source: 'HARDWARE_SCANNER_PASTE', rawText: code});
          }
        }, 20);
      });
    }


    bindHardwareScannerCapture();

    byId('inboundModuleSelect')?.addEventListener('change', async (event) => {
      if (CONFIG.INBOUND_FORCE_CANONICAL_MODULE) {
        const canonical = findCanonicalInboundModule();
        if (canonical) {
          state.moduleId = canonical.moduleId;
          event.target.value = canonical.moduleId;
        }
        setScanMessage('หน้า Inbound ใช้แหล่งข้อมูลเดียวกับหน้างานจริงเท่านั้น', 'WARN');
        focusCodeInput(true);
        return;
      }

      state.moduleId = String(event.target.value || '').trim();
      state.dashboardRevision = '';
      state.rulesRevision = '';
      state.dashboardSummary = null;
      state.dashboardTotalRows = 0;
      state.effectiveSlaRules = {};
      clearCurrentResult();
      restoreDashboardCache({replace: true, silent: true});
      await refreshQueueSummary();
      await loadWorkflowDashboard(false, {cacheFirst: false, moduleChanged: true});
      if (state.queueReady && navigator.onLine !== false) {
        void PENDING_QUEUE.flush({moduleId: state.moduleId, reason: 'MODULE_CHANGED'});
      }
      focusCodeInput(true);
    });

    const searchInput = byId('workflowSearchInput');
    searchInput?.addEventListener('focus', pauseScanFocus);
    searchInput?.addEventListener('input', (event) => {
      pauseScanFocus();
      state.dashboardQuery = String(event.target.value || '').trim().toLowerCase();
      resetWorkflowPage();
      renderWorkflowTable();
    });

    byId('workflowPageSizeSelect')?.addEventListener('change', (event) => {
      pauseScanFocus();
      state.tablePageSize = String(event.target.value || 'AUTO').toUpperCase();
      resetWorkflowPage();
      renderWorkflowTable();
    });

    byId('workflowPrevPage')?.addEventListener('click', () => {
      pauseScanFocus();
      state.tablePage = Math.max(1, state.tablePage - 1);
      renderWorkflowTable();
    });

    byId('workflowNextPage')?.addEventListener('click', () => {
      pauseScanFocus();
      const totalPages = getWorkflowTotalPages();
      state.tablePage = Math.min(totalPages, state.tablePage + 1);
      renderWorkflowTable();
    });

    document.querySelector('.status-strip')?.addEventListener('click', (event) => {
      const button = event.target.closest('[data-status-filter]');
      if (!button) return;
      state.statusFilter = String(button.dataset.statusFilter || 'ALL').toUpperCase();
      document.querySelectorAll('[data-status-filter]').forEach((item) => {
        item.classList.toggle('is-active', item === button);
      });
      resetWorkflowPage();
      renderWorkflowTable();
    });

    byId('workflowTableBody')?.addEventListener('click', (event) => {
      const row = event.target.closest('[data-auto-id]');
      if (!row) return;
      const autoId = row.dataset.autoId || '';
      const item = state.dashboardItems.find((entry) => entry.autoId === autoId);
      pauseScanFocus();
      if (item) {
        void openRecordDetailAlert(item);
      }
    });

    document.addEventListener('click', unlockAudio, {capture: true});
    document.addEventListener('pointerdown', handlePointerIntent, {capture: true});
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        keepCameraStandby();
        focusCodeInput(false);
        refreshAutoPageSize();
        void loadWorkflowDashboard(true, {cacheFirst: false});
        if (state.queueReady && navigator.onLine !== false) {
          void PENDING_QUEUE.flush({moduleId: state.moduleId, reason: 'PAGE_VISIBLE'});
        }
      }
    });

    window.addEventListener('online', handleNetworkOnline);
    window.addEventListener('offline', handleNetworkOffline);
    window.addEventListener('inboundqueueoperation', handleQueueOperationEvent);
    window.addEventListener(
      'alertvendor:foreground-write-change',
      handleForegroundWriteChange
    );

    window.addEventListener('resize', debounce(() => {
      refreshAutoPageSize();
      renderWorkflowTable();
    }, 140), {passive: true});

    document.addEventListener('fullscreenchange', syncFullscreenButton);
    document.addEventListener('webkitfullscreenchange', syncFullscreenButton);
    document.addEventListener('msfullscreenchange', syncFullscreenButton);
  }

  async function toggleInboundFullscreen() {
    const root = document.documentElement;

    try {
      const fullscreenElement =
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement ||
        null;

      if (fullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
        syncFullscreenButton();
        return;
      }

      if (root.requestFullscreen) await root.requestFullscreen();
      else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen();
      else if (root.msRequestFullscreen) root.msRequestFullscreen();
      else {
        await showAlert(
          'ไม่รองรับเต็มจอ',
          'เบราว์เซอร์นี้ไม่อนุญาตให้เปิดโหมดเต็มจอจากหน้าเว็บ',
          'info'
        );
        return;
      }

      syncFullscreenButton();
      window.setTimeout(() => {
        refreshAutoPageSize();
        renderWorkflowTable();
        focusCodeInput(false);
      }, 160);

    } catch (error) {
      await showAlert(
        'เปิดเต็มจอไม่สำเร็จ',
        errorMessage(error) || 'กรุณากดปุ่มอีกครั้ง หรือใช้ปุ่ม F11 ของคีย์บอร์ด',
        'warning'
      );
    }
  }

  function syncFullscreenButton() {
    const isFullscreen = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );

    document.body.classList.toggle('inbound-is-fullscreen', isFullscreen);

    const button = byId('inboundFullscreenButton');
    if (button) {
      button.textContent = isFullscreen ? 'ออกเต็มจอ' : 'เต็มจอ';
      button.title = isFullscreen ? 'ออกจากเต็มจอ' : 'เปิดเต็มจอ';
      button.setAttribute('aria-label', isFullscreen ? 'ออกจากเต็มจอ' : 'เปิดเต็มจอ');
    }
  }

  async function loadModules() {
    const params = new URLSearchParams(window.location.search);
    const requested = String(
      params.get('module') ||
      params.get('id') ||
      ''
    ).trim();

    /*
     * HOTFIX 2026-07-17 — Canonical Inbound Bootstrap
     *
     * หน้า Inbound ถูกกำหนดให้ใช้ Module หน้างานจริงเพียง Module เดียว
     * จึงไม่ควรเรียก Generic GET /api/modules ซึ่งถูกสงวนไว้ให้ USER/ADMIN
     * ตามนโยบายสิทธิ์ของระบบ
     *
     * วิธีนี้ไม่ลดสิทธิ์ฝั่ง Worker และไม่สร้าง API/ไฟล์เสริมใหม่:
     * - INBOUND ยังเข้าได้เฉพาะ inbound.html
     * - งาน Workflow ยังคงเรียก /api/workflow/modules/:moduleId/...
     * - Worker และ Apps Script ยังตรวจ Session/Role ทุกคำขอ
     */
    if (CONFIG.INBOUND_FORCE_CANONICAL_MODULE === true) {
      const canonicalModuleId = String(
        CONFIG.INBOUND_DEFAULT_MODULE_ID ||
        requested ||
        'vendors'
      ).trim();

      if (!canonicalModuleId) {
        throw createClientError(
          'INBOUND_MODULE_ID_MISSING',
          'ไม่พบรหัส Module หลักสำหรับห้อง Inbound'
        );
      }

      const canonicalModuleName = String(
        CONFIG.INBOUND_CANONICAL_MODULE_NAME ||
        'สถานะรถ Vendor ทั่วไป'
      ).trim();

      state.modules = [{
        moduleId: canonicalModuleId,
        id: canonicalModuleId,
        name: canonicalModuleName || canonicalModuleId,
        moduleName: canonicalModuleName || canonicalModuleId,
        status: 'PUBLISHED',
        accessScope: 'INBOUND_CANONICAL'
      }];

      state.moduleId = canonicalModuleId;
      renderModuleSelect();
      return;
    }

    if (!API || typeof API.getModules !== 'function') {
      throw createClientError(
        'MODULE_API_NOT_READY',
        'ไม่พบ API สำหรับโหลดรายการ Module'
      );
    }

    const data = await API.getModules();
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data && data.modules)
        ? data.modules
        : [];

    state.modules = list
      .map((item) => ({
        moduleId: String(item.moduleId || item.id || '').trim(),
        name: String(item.name || item.moduleName || item.moduleId || item.id || '').trim(),
        status: String(item.status || '').trim()
      }))
      .filter((item) => item.moduleId);

    const canonical = findCanonicalInboundModule();

    if (requested && moduleExists(requested)) {
      state.moduleId = requested;
    } else if (
      CONFIG.INBOUND_DEFAULT_MODULE_ID &&
      moduleExists(CONFIG.INBOUND_DEFAULT_MODULE_ID)
    ) {
      state.moduleId = CONFIG.INBOUND_DEFAULT_MODULE_ID;
    } else if (canonical) {
      state.moduleId = canonical.moduleId;
    } else {
      state.moduleId = (state.modules[0] && state.modules[0].moduleId) || '';
    }

    renderModuleSelect();
  }

  function renderModuleSelect() {
    const select = byId('inboundModuleSelect');
    if (!select) return;
    if (!state.modules.length) {
      select.innerHTML = '<option value="">ไม่พบ Module</option>';
      return;
    }

    select.innerHTML = state.modules.map((module) => `
      <option value="${escapeHtml(module.moduleId)}" ${module.moduleId === state.moduleId ? 'selected' : ''}>
        ${escapeHtml(module.name || module.moduleId)}
      </option>
    `).join('');

    if (!state.moduleId) state.moduleId = select.value;

    if (CONFIG.INBOUND_FORCE_CANONICAL_MODULE) {
      select.disabled = true;
      select.title = 'ล็อกแหล่งข้อมูลเดียวกับหน้างาน Inbound';
    } else {
      select.disabled = false;
      select.title = '';
    }
  }

  function moduleExists(moduleId) {
    const id = String(moduleId || '').trim();
    return state.modules.some((module) => module.moduleId === id);
  }

  function findCanonicalInboundModule() {
    if (!state.modules.length) {
      return null;
    }

    const exactName =
      normalizeSearchText(CONFIG.INBOUND_CANONICAL_MODULE_NAME || '');

    if (exactName) {
      const exact = state.modules.find((module) => (
        normalizeSearchText(module.name) === exactName ||
        normalizeSearchText(module.moduleId) === exactName
      ));

      if (exact) return exact;
    }

    const keywords =
      Array.isArray(CONFIG.INBOUND_CANONICAL_MODULE_KEYWORDS)
        ? CONFIG.INBOUND_CANONICAL_MODULE_KEYWORDS
        : [];

    const cleanKeywords = keywords
      .map((keyword) => normalizeSearchText(keyword))
      .filter(Boolean);

    if (cleanKeywords.length) {
      const matched = state.modules.find((module) => {
        const haystack = normalizeSearchText(
          (module.name || '') + ' ' + (module.moduleId || '')
        );
        return cleanKeywords.every((keyword) => haystack.includes(keyword));
      });

      if (matched) return matched;
    }

    return state.modules[0] || null;
  }

  function normalizeSearchText(value) {
    return String(value || '')
      .trim()
      .toUpperCase()
      .replace(/\s+/g, ' ');
  }

  function createScanner() {
    if (!window.InboundScanner) {
      setScannerStatus('ใช้เครื่องสแกนหรือกรอกรหัส', 'IDLE');
      return;
    }
    state.scanner = new window.InboundScanner({
      video: byId('inboundVideo'),
      scanIntervalMs: 70,
      pauseAfterScanMs: 250,
      sameCodeBlockMs: DUPLICATE_BLOCK_MS,
      onScan: (text, meta) => {
        beep('scan');
        void processCode(text, meta || {source: 'CAMERA'});
      },
      onStatus: (stateCode, message) => {
        if (stateCode === 'READY') setScannerStatus(message || 'กล้องพร้อม', 'READY');
        else if (stateCode === 'DUPLICATE') setScannerStatus(message || 'กันสแกนซ้ำ', 'BUSY');
        else setScannerStatus(message || 'พร้อมรับรหัส', 'IDLE');
      },
      onError: (error) => {
        setScannerStatus('ใช้ช่องกรอกรหัสแทน', 'ERROR');
        setScanMessage(errorMessage(error), 'WARN');
      }
    });
  }

  async function startCamera(options) {
    const config = options && typeof options === 'object' ? options : {};
    unlockAudio();
    if (!state.scanner) createScanner();
    if (!state.scanner) return;
    state.cameraWanted = true;
    try {
      setScannerStatus('กำลังเปิดกล้อง', 'BUSY');
      await state.scanner.start();
      setScannerStatus('กล้องสแตนด์บายพร้อมสแกน', 'READY');
      if (!config.silent) setScanMessage('กล้องเปิดสแตนด์บายแล้ว วาง QR / Barcode ในกรอบ ระบบจะบันทึกให้อัตโนมัติ', 'SUCCESS');
    } catch (error) {
      state.cameraWanted = false;
      setScannerStatus('ใช้ช่องกรอกรหัสแทน', 'ERROR');
      if (!config.silent) {
        beep('warn');
        setScanMessage(errorMessage(error), 'WARN');
      }
    } finally {
      if (config.keepFocus !== false) focusCodeInput(true);
    }
  }

  function stopCamera() {
    state.cameraWanted = false;
    if (state.scanner) state.scanner.stop();
    setScannerStatus('ปิดกล้องแล้ว ใช้ช่องกรอกรหัสแทน', 'IDLE');
    focusCodeInput(true);
  }

  function keepCameraStandby() {
    if (!state.cameraWanted || !state.scanner) return;
    if (state.scanner.running) {
      setScannerStatus('กล้องสแตนด์บายพร้อมสแกน', 'READY');
      return;
    }
    window.setTimeout(() => {
      if (state.cameraWanted && state.scanner && !state.scanner.running) {
        void startCamera({silent: true, keepFocus: false});
      }
    }, 250);
  }

  async function processCode(rawCode, meta) {
    const cleanCode = normalizeCode(rawCode);
    const source = meta && meta.source ? String(meta.source) : 'SCAN';
    const requestId = createStableRequestId();
    const workflowExpectation = getWorkflowExpectation(cleanCode);

    if (!cleanCode) {
      beep('warn');
      setScanMessage('อ่านรหัสไม่ได้ กรุณาสแกนใหม่', 'WARN');
      resetForNextScan();
      return;
    }

    if (!state.moduleId) {
      beep('warn');
      setScanMessage('กรุณาเลือก Module ก่อนสแกน', 'WARN');
      resetForNextScan();
      return;
    }

    if (isDuplicateBlocked(cleanCode)) {
      beep('duplicate');
      setScanMessage('กันสแกนซ้ำ ไม่ยิงข้อมูลซ้ำ: ' + cleanCode, 'WARN');
      resetForNextScan();
      return;
    }

    if (state.inFlightCodes.has(cleanCode)) return;

    state.inFlightCodes.add(cleanCode);
    blockDuplicate(cleanCode, DUPLICATE_BLOCK_MS);
    if (state.scanner && typeof state.scanner.pause === 'function') state.scanner.pause(300);

    setScannerStatus('กำลังตรวจสอบ', 'BUSY');
    setScanMessage('กำลังค้นหาและตรวจสถานะ ' + cleanCode, 'BUSY');
    clearInput();
    setScannerStatus('รับรหัสแล้ว · พร้อมสแกนรายการถัดไป', 'READY');
    focusCodeInput(false);

    try {
      beep('scan');

      /*
       * FAST SCAN MODE
       * รับรหัสเข้า Durable Queue ก่อนเสมอ แล้วปล่อยให้ Queue ส่ง/ยืนยันผลด้านหลัง
       * ผู้ใช้จึงสแกนรายการถัดไปได้ทันทีโดยไม่ต้องรอ Google Sheets ตอบกลับ
       */
      if (FAST_SCAN_MODE && state.queueReady) {
        const accepted = await queueResolveScan(
          cleanCode,
          source,
          requestId,
          meta
        );

        if (accepted) {
          blockDuplicate(cleanCode, HARD_BLOCK_AFTER_SAVE_MS);
          setScanMessage(
            navigator.onLine === false
              ? 'รับรหัสแล้ว · เก็บไว้ในเครื่องและจะส่งอัตโนมัติ: ' + cleanCode
              : 'รับรหัสแล้ว · กำลังส่งอัตโนมัติ: ' + cleanCode,
            navigator.onLine === false ? 'WARN' : 'SUCCESS'
          );

          if (navigator.onLine !== false) {
            scheduleFastQueueFlush(FAST_QUEUE_FLUSH_DELAY_MS);
          }
          return;
        }
      }

      if (navigator.onLine === false) {
        const queued = await queueResolveScan(cleanCode, source, requestId, meta);
        if (queued) {
          beep('warn');
          blockDuplicate(cleanCode, HARD_BLOCK_AFTER_SAVE_MS);
          setScanMessage('ออฟไลน์ · เก็บรายการไว้ในเครื่องแล้ว: ' + cleanCode, 'WARN');
          return;
        }
      }

      if (API && typeof API.processInboundWorkflowScan === 'function') {
        try {
          const result = await API.processInboundWorkflowScan(
            state.moduleId,
            {
              entryCode: cleanCode,
              autoId: cleanCode,
              qrText: meta && meta.rawText ? meta.rawText : cleanCode,
              lookupMethod: source === 'MANUAL' ? 'MANUAL' : 'SCAN',
              method: source === 'MANUAL' ? 'MANUAL' : 'SCAN',
              scanSource: source,
              expectedStatusCode: workflowExpectation.expectedStatusCode,
              expectedActionCode: workflowExpectation.expectedActionCode,
              note: 'ประมวลผลอัตโนมัติจากหน้า Inbound',
              clientRequestId: requestId,
              requestId
            }
          );
          handleProcessScanResult(result, cleanCode);
          return;
        } catch (processError) {
          if (isTransientQueueError(processError)) {
            const queued = await queueResolveScan(
              cleanCode,
              source,
              requestId,
              meta
            );
            if (queued) {
              beep('warn');
              blockDuplicate(cleanCode, HARD_BLOCK_AFTER_SAVE_MS);
              setScanMessage(
                'ยังยืนยันผลไม่ได้ · เก็บรายการไว้ตรวจสอบอัตโนมัติ: ' + cleanCode,
                'WARN'
              );
              return;
            }
          }
          throw processError;
        }
      }

      let lookupRaw;

      try {
        lookupRaw = await API.lookupInboundWorkflow(state.moduleId, cleanCode, {
          method: 'MANUAL',
          lookupMethod: 'MANUAL',
          qrText: meta && meta.rawText ? meta.rawText : cleanCode,
          scanSource: source
        });
      } catch (lookupError) {
        if (isTransientQueueError(lookupError)) {
          const queued = await queueResolveScan(cleanCode, source, requestId, meta);
          if (queued) {
            beep('warn');
            blockDuplicate(cleanCode, HARD_BLOCK_AFTER_SAVE_MS);
            setScanMessage('เครือข่ายไม่เสถียร · เก็บรายการรอตรวจสอบแล้ว: ' + cleanCode, 'WARN');
            return;
          }
        }

        throw lookupError;
      }

      const lookup = normalizeLookup(lookupRaw);
      state.currentLookup = lookup;
      renderLookupResult(lookup);
      upsertDashboardItemFromLookup(lookup);
      renderDashboard();

      const action = getAutoAction(lookup);
      if (action.type === 'SUBMIT_DOCUMENT') {
        await autoSubmitDocument(lookup, source, requestId);
      } else if (action.type === 'RETURN_DOCUMENT') {
        await autoReturnDocument(lookup, source, requestId);
      } else {
        beep(action.level === 'WARN' ? 'warn' : 'success');
        setScanMessage(action.message, action.level || 'SUCCESS');
        blockDuplicate(cleanCode, HARD_BLOCK_AFTER_SAVE_MS);
      }
    } catch (error) {
      /* Validation/ข้อมูลไม่พบ แก้แล้วสแกนซ้ำได้ทันที; Timeout ยังกันซ้ำไว้ */
      if (!isTransientQueueError(error)) {
        state.recentCodes.delete(cleanCode);
      }
      beep('error');
      renderLookupError(cleanCode, error);
      setScanMessage(errorMessage(error), 'ERROR');
    } finally {
      state.inFlightCodes.delete(cleanCode);
      keepCameraStandby();
      setScannerStatus('พร้อมสแกนรายการถัดไป', state.scanner && state.scanner.running ? 'READY' : 'IDLE');
      resetForNextScan();
    }
  }

  function handleProcessScanResult(result, fallbackAutoId) {
    const lookup = normalizeLookup(result, {autoId: fallbackAutoId});
    const autoId = text(
      lookup && lookup.record && lookup.record.autoId || fallbackAutoId
    );
    const action = text(result && result.resolvedAction).toUpperCase();
    const committed = result && result.committed === true;
    const replay = result && result.idempotentReplay === true;

    state.currentLookup = lookup;
    renderLookupResult(lookup);
    upsertDashboardItemFromLookup(lookup);
    renderDashboard();
    blockDuplicate(autoId, HARD_BLOCK_AFTER_SAVE_MS);

    if (committed) {
      if (replay) {
        beep('duplicate');
        setScanMessage(
          result.message || 'คำขอนี้ดำเนินการแล้ว ระบบไม่บันทึกซ้ำ: ' + autoId,
          'WARN'
        );
      } else if (action === 'RETURN_DOCUMENT') {
        beep('success');
        setScanMessage('บันทึกรับเอกสารคืนแล้ว: ' + autoId, 'SUCCESS');
      } else {
        beep('success');
        setScanMessage('บันทึกยื่นเอกสารแล้ว: ' + autoId, 'SUCCESS');
      }
      scheduleRevisionCheckAfterWrite();
      return;
    }

    if (action === 'GATE_OUT_COMPLETED' || action === 'DOCUMENT_ALREADY_RETURNED') {
      beep('success');
      setScanMessage(result.message || 'รายการนี้ดำเนินการครบแล้ว: ' + autoId, 'SUCCESS');
      return;
    }

    beep('warn');
    setScanMessage(
      result && result.message ||
      lookup && lookup.state && lookup.state.nextStepText ||
      'สถานะนี้ยังไม่พร้อมบันทึกขั้นตอนถัดไป: ' + autoId,
      'WARN'
    );
  }

  async function autoSubmitDocument(lookup, source, requestId) {
    const autoId = lookup.record.autoId;
    const payload = buildQueueWorkflowPayload(lookup, {
      entryCode: autoId,
      qrText: autoId,
      method: 'MANUAL',
      lookupMethod: 'MANUAL',
      scanSource: source || 'SCAN',
      note: 'บันทึกอัตโนมัติจากการสแกน Inbound',
      clientRequestId: requestId,
      requestId
    });

    setScanMessage('พบข้อมูล กำลังบันทึกยื่นเอกสาร: ' + autoId, 'BUSY');

    try {
      const result = await API.submitInboundDocument(state.moduleId, payload);
      const updated = normalizeLookup(result, lookup.record);
      state.currentLookup = updated;
      renderLookupResult(updated);
      upsertDashboardItemFromLookup(updated);
      renderDashboard();
      blockDuplicate(autoId, HARD_BLOCK_AFTER_SAVE_MS);

      if (result && (result.duplicateStage || result.noWrite)) {
        beep('duplicate');
        setScanMessage(result.message || 'รายการนี้ยื่นเอกสารแล้ว ระบบไม่บันทึกซ้ำ: ' + autoId, 'WARN');
      } else {
        beep('success');
        setScanMessage('บันทึกยื่นเอกสารแล้ว: ' + autoId, 'SUCCESS');
      }

      scheduleRevisionCheckAfterWrite();
      return;
    } catch (error) {
      if (isTransientQueueError(error)) {
        const queued = await queueSpecificAction('SUBMIT_DOCUMENT', lookup, payload);
        if (queued) {
          beep('warn');
          blockDuplicate(autoId, HARD_BLOCK_AFTER_SAVE_MS);
          setScanMessage('ยังยืนยันผลไม่ได้ · เก็บงานยื่นเอกสารไว้รอส่ง: ' + autoId, 'WARN');
          return;
        }
      }

      throw error;
    }
  }

  async function autoReturnDocument(lookup, source, requestId) {
    const autoId = lookup.record.autoId;
    const payload = buildQueueWorkflowPayload(lookup, {
      entryCode: autoId,
      qrText: autoId,
      method: 'MANUAL',
      lookupMethod: 'MANUAL',
      scanSource: source || 'SCAN',
      note: 'รับเอกสารคืนอัตโนมัติจากการสแกน Inbound',
      clientRequestId: requestId,
      requestId
    });

    setScanMessage('พบข้อมูล กำลังบันทึกรับเอกสารคืน: ' + autoId, 'BUSY');

    try {
      const result = await API.returnInboundDocument(state.moduleId, payload);
      const updated = normalizeLookup(result, lookup.record);
      state.currentLookup = updated;
      renderLookupResult(updated);
      upsertDashboardItemFromLookup(updated);
      renderDashboard();
      blockDuplicate(autoId, HARD_BLOCK_AFTER_SAVE_MS);

      if (result && (result.duplicateStage || result.noWrite)) {
        beep('duplicate');
        setScanMessage(result.message || 'รายการนี้รับเอกสารคืนแล้ว ระบบไม่บันทึกซ้ำ: ' + autoId, 'WARN');
      } else {
        beep('success');
        setScanMessage('บันทึกรับเอกสารคืนแล้ว: ' + autoId, 'SUCCESS');
      }

      scheduleRevisionCheckAfterWrite();
      return;
    } catch (error) {
      if (isTransientQueueError(error)) {
        const queued = await queueSpecificAction('RETURN_DOCUMENT', lookup, payload);
        if (queued) {
          beep('warn');
          blockDuplicate(autoId, HARD_BLOCK_AFTER_SAVE_MS);
          setScanMessage('ยังยืนยันผลไม่ได้ · เก็บงานรับเอกสารคืนไว้รอส่ง: ' + autoId, 'WARN');
          return;
        }
      }

      throw error;
    }
  }

  function getWorkflowExpectation(autoId) {
    const code = normalizeCode(autoId);
    const item = state.dashboardItems.find((entry) =>
      normalizeCode(entry && entry.autoId) === code
    ) || null;
    const status = text(item && item.statusCode).toUpperCase();

    if (!item) {
      return {
        expectedStatusCode: '',
        expectedActionCode: ''
      };
    }

    if (!status || status === 'GATE_IN_ONLY' || status === 'WAITING_DOCUMENT_SUBMISSION') {
      return {
        expectedStatusCode: status || 'WAITING_DOCUMENT_SUBMISSION',
        expectedActionCode: 'SUBMIT_DOCUMENT'
      };
    }

    if (status === 'RECEIVING_COMPLETED') {
      return {
        expectedStatusCode: status,
        expectedActionCode: 'RETURN_DOCUMENT'
      };
    }

    return {
      expectedStatusCode: status,
      expectedActionCode: 'NO_WRITE_REQUIRED'
    };
  }

  function getAutoAction(lookup) {
    const record = lookup && lookup.record ? lookup.record : {};
    const workflow = lookup && lookup.state ? lookup.state : {};
    const status = String(workflow.statusCode || '').toUpperCase();

    if (!record.autoId) return {type: 'NONE', level: 'WARN', message: 'ไม่พบ Auto ID'};
    if (record.timestampOut || workflow.gateOutAt) return {type: 'NONE', level: 'WARN', message: 'รายการนี้มีเวลาออกคลังแล้ว: ' + record.autoId};
    if (workflow.cancelled || status === 'CANCELLED') return {type: 'NONE', level: 'WARN', message: 'รายการนี้ถูกยกเลิกแล้ว: ' + (workflow.cancelReason || record.autoId)};

    if (!workflow.documentSubmittedAt && !['DOCUMENT_SUBMITTED', 'RECEIVING_COMPLETED', 'DOCUMENT_RETURNED'].includes(status)) {
      return {type: 'SUBMIT_DOCUMENT', level: 'BUSY', message: 'บันทึกยื่นเอกสาร'};
    }

    if (workflow.documentSubmittedAt && !workflow.receivingCompletedAt) {
      return {type: 'NONE', level: 'WARN', message: 'รายการนี้ยื่นเอกสารแล้ว ไม่บันทึกซ้ำ · รอ User/Admin กดรับสินค้าเสร็จ: ' + record.autoId};
    }

    /*
     * Round 06 Part 08:
     * ใช้เวลาจริงของ Workflow เป็นหลัก ไม่ล็อกเฉพาะ statusCode
     * เพราะบางรอบ Dashboard/Lookup อาจส่ง statusCode ช้ากว่า timestamp
     */
    if (workflow.receivingCompletedAt && !workflow.documentReturnedAt) {
      return {type: 'RETURN_DOCUMENT', level: 'BUSY', message: 'บันทึกรับเอกสารคืน'};
    }

    if (workflow.documentReturnedAt || status === 'DOCUMENT_RETURNED') {
      return {type: 'NONE', level: 'SUCCESS', message: 'รายการนี้รับเอกสารคืนแล้ว ไม่บันทึกซ้ำ · รอ Gate Out: ' + record.autoId};
    }

    if (status === 'GATE_OUT_COMPLETED') {
      return {type: 'NONE', level: 'SUCCESS', message: 'รายการนี้ออก Gate Out แล้ว ปิดงานสมบูรณ์: ' + record.autoId};
    }

    return {type: 'NONE', level: 'WARN', message: workflow.nextStepText || 'สถานะนี้ยังไม่พร้อมบันทึกขั้นตอนถัดไป'};
  }

  async function loadWorkflowDashboard(silent, options) {
    const config = options && typeof options === 'object' ? options : {};

    if (!state.moduleId || !API || typeof API.getInboundWorkflowDashboard !== 'function') {
      if (!state.dashboardItems.length) {
        restoreDashboardCache({silent: true});
      }
      renderDashboard();
      return;
    }

    if (config.cacheFirst !== false && !state.dashboardItems.length) {
      restoreDashboardCache({silent: true});
    }

    const requestToken = ++state.dashboardRequestToken;

    try {
      if (!silent) {
        setScanMessage('กำลังโหลดตารางสถานะจากฐานข้อมูล', 'BUSY');
      }

      const data = await API.getInboundWorkflowDashboard(state.moduleId, {
        limit: Number(DASHBOARD_LIMIT) || 1000,
        cacheBust: Date.now()
      });

      if (requestToken !== state.dashboardRequestToken) {
        return;
      }

      const payload = dashboardPayload(data);
      applyDashboardMetadata(payload);
      const nextItems = normalizeDashboardItems(payload);
      const hadLocalItems = state.dashboardItems.length > 0;

      if (nextItems.length > 0 || !hadLocalItems) {
        state.dashboardItems = nextItems;
        state.dashboardLoadedAt = payload.generatedAt || formatBangkokDateTime(new Date());
        saveDashboardCache();
        renderDashboard();

        if (!silent) {
          const total = state.dashboardTotalRows || nextItems.length;
          setScanMessage(
            'โหลดข้อมูลล่าสุดแล้ว ' + nextItems.length +
            (total > nextItems.length ? ' จากทั้งหมด ' + total + ' รายการ' : ' รายการ'),
            'SUCCESS'
          );
        }
      } else {
        renderDashboard();
        if (!silent) {
          setScanMessage('ไม่พบรายการใหม่จากฐานข้อมูล แต่คงข้อมูลล่าสุดบนหน้าจอไว้', 'WARN');
        }
      }
    } catch (error) {
      console.warn('workflow dashboard failed', error);

      if (!state.dashboardItems.length) {
        restoreDashboardCache({silent: true});
      }

      renderDashboard();

      if (!silent) {
        setScanMessage('โหลดตารางไม่สำเร็จ แต่ยังคงข้อมูลล่าสุดไว้: ' + errorMessage(error), 'WARN');
      }
    } finally {
      focusCodeInput(false);
    }
  }

  function dashboardPayload(data) {
    return data && data.data && typeof data.data === 'object'
      ? data.data
      : data && typeof data === 'object'
        ? data
        : {};
  }

  function applyDashboardMetadata(payload) {
    const source = payload && typeof payload === 'object' ? payload : {};
    state.dashboardRevision = text(source.dataRevision || state.dashboardRevision);
    state.rulesRevision = text(source.rulesRevision || state.rulesRevision);
    state.dashboardTotalRows = Number(
      source.totalRows ||
      source.pagination && source.pagination.totalRows ||
      source.summary && source.summary.totalWorkflow ||
      0
    ) || 0;
    state.dashboardSummary = source.summary && typeof source.summary === 'object'
      ? source.summary
      : state.dashboardSummary;
    state.effectiveSlaRules = source.effectiveSlaRules && typeof source.effectiveSlaRules === 'object'
      ? source.effectiveSlaRules
      : state.effectiveSlaRules;

    const serverSla = state.dashboardSummary && state.dashboardSummary.sla;
    if (serverSla && typeof serverSla === 'object') {
      state.slaSummary = {
        normal: Number(serverSla.normal) || 0,
        warning: Number(serverSla.warning) || 0,
        critical: Number(serverSla.critical) || 0
      };
    }
  }

  function handleForegroundWriteChange(event) {
    const detail = event && event.detail && typeof event.detail === 'object'
      ? event.detail
      : {};
    state.foregroundWriteActive = detail.active === true;

    if (!state.foregroundWriteActive) {
      scheduleRevisionCheckAfterWrite();
    }
  }

  function scheduleRevisionCheckAfterWrite() {
    window.clearTimeout(state.postWriteRevisionTimer);
    state.postWriteRevisionTimer = window.setTimeout(() => {
      if (
        navigator.onLine !== false &&
        document.visibilityState === 'visible' &&
        state.foregroundWriteActive !== true
      ) {
        void pollDashboardRevision();
      }
    }, 450);
  }

  function startDashboardPolling() {
    window.clearInterval(state.dashboardPollTimer);
    state.dashboardPollTimer = window.setInterval(() => {
      void pollDashboardRevision();
    }, DASHBOARD_POLL_MS);
  }

  async function pollDashboardRevision() {
    if (
      state.dashboardPollBusy ||
      state.foregroundWriteActive === true ||
      document.visibilityState !== 'visible' ||
      navigator.onLine === false ||
      !state.moduleId ||
      !API ||
      typeof API.getInboundWorkflowDashboard !== 'function'
    ) {
      return;
    }

    state.dashboardPollBusy = true;

    try {
      const data = await API.getInboundWorkflowDashboard(state.moduleId, {
        limit: 1,
        revisionOnly: true,
        knownRevision: state.dashboardRevision,
        cacheBust: Date.now()
      });
      const payload = dashboardPayload(data);
      const previousRevision = state.dashboardRevision;
      applyDashboardMetadata(payload);

      if (payload.unchanged === true && previousRevision) {
        return;
      }

      if (!previousRevision || payload.dataRevision !== previousRevision) {
        await loadWorkflowDashboard(true, {
          cacheFirst: false,
          reason: 'REVISION_CHANGED'
        });
      }
    } catch (error) {
      console.warn('inbound revision poll failed', error);
    } finally {
      state.dashboardPollBusy = false;
    }
  }

  function restoreDashboardCache(options) {
    const config = options && typeof options === 'object' ? options : {};

    try {
      const key = dashboardCacheKey();
      if (!key) {
        return false;
      }

      const raw = window.localStorage.getItem(key);
      if (!raw) {
        if (config.replace === true) {
          state.dashboardItems = [];
          renderDashboard();
        }
        return false;
      }

      const cached = JSON.parse(raw);
      const items = Array.isArray(cached.items) ? cached.items : [];

      state.dashboardItems = items
        .map(normalizeDashboardItem)
        .filter((item) => item.autoId)
        .slice(0, DASHBOARD_CACHE_MAX_ITEMS)
        .sort((a, b) => dateToMs(b.updatedAt) - dateToMs(a.updatedAt));

      state.dashboardLoadedAt = String(cached.savedAt || '');
      state.dashboardRevision = text(cached.dataRevision);
      state.rulesRevision = text(cached.rulesRevision);
      state.dashboardTotalRows = Number(cached.totalRows) || state.dashboardItems.length;
      state.dashboardSummary = cached.summary && typeof cached.summary === 'object'
        ? cached.summary
        : null;
      state.effectiveSlaRules = cached.effectiveSlaRules && typeof cached.effectiveSlaRules === 'object'
        ? cached.effectiveSlaRules
        : {};
      state.dashboardCacheRestored = true;
      resetWorkflowPage();
      renderDashboard();

      if (!config.silent && state.dashboardItems.length) {
        setScanMessage('แสดงข้อมูลล่าสุดจากเครื่องก่อน แล้วกำลังตรวจฐานข้อมูลจริง', 'WARN');
      }

      return state.dashboardItems.length > 0;
    } catch (error) {
      console.warn('restore inbound dashboard cache failed', error);
      return false;
    }
  }

  function saveDashboardCache() {
    try {
      const key = dashboardCacheKey();
      if (!key) {
        return;
      }

      const items = state.dashboardItems
        .slice()
        .sort((a, b) => dateToMs(b.updatedAt) - dateToMs(a.updatedAt))
        .slice(0, DASHBOARD_CACHE_MAX_ITEMS);

      window.localStorage.setItem(
        key,
        JSON.stringify({
          version: 11,
          moduleId: state.moduleId,
          savedAt: formatBangkokDateTime(new Date()),
          dataRevision: state.dashboardRevision,
          rulesRevision: state.rulesRevision,
          totalRows: state.dashboardTotalRows,
          summary: state.dashboardSummary,
          effectiveSlaRules: state.effectiveSlaRules,
          items
        })
      );
    } catch (error) {
      console.warn('save inbound dashboard cache failed', error);
    }
  }

  function dashboardCacheKey() {
    const moduleId = String(state.moduleId || '').trim();
    if (!moduleId) {
      return '';
    }

    return DASHBOARD_CACHE_PREFIX + moduleId;
  }

  function normalizeDashboardItems(data) {
    const source = data && data.data && typeof data.data === 'object' ? data.data : data && typeof data === 'object' ? data : {};
    const list = []
      .concat(Array.isArray(source.items) ? source.items : [])
      .concat(Array.isArray(source.waitingReceiving) ? source.waitingReceiving : [])
      .concat(Array.isArray(source.receivingCompleted) ? source.receivingCompleted : [])
      .concat(Array.isArray(source.documentReturned) ? source.documentReturned : []);
    const map = new Map();
    list.forEach((item) => {
      const normalized = normalizeDashboardItem(item);
      if (!normalized.autoId) return;
      const existing = map.get(normalized.autoId);
      if (!existing || dateToMs(normalized.updatedAt) >= dateToMs(existing.updatedAt)) map.set(normalized.autoId, normalized);
    });
    return Array.from(map.values()).sort((a, b) => dateToMs(b.updatedAt) - dateToMs(a.updatedAt));
  }

  function normalizeDashboardItem(item) {
    const source = item && typeof item === 'object' ? item : {};
    const statusCode = String(source.statusCode || source.status || '').trim().toUpperCase();
    const record = source.record || source.vehicle || source.sourceRecord || {};
    return {
      autoId: text(source.autoId || source.entryCode || source.recordId || record.autoId),
      statusCode,
      statusName: text(source.statusName || statusName(statusCode)),
      nextStepText: text(source.nextStepText),
      appointmentNumber: text(source.appointmentNumber || source.appointment || record.appointmentNumber || record.appointment),
      companyName: text(source.companyName || source.company || record.companyName || record.company),
      driverName: composeDriverName(source, record),
      registration: text(source.registration || source.plate || record.registration || record.plate),
      province: text(source.province || record.province),
      phone: text(source.phone || source.mobile || record.phone || record.mobile),
      vehicleType: text(source.vehicleType || record.vehicleType),
      gateInAt: text(source.gateInAt || source.timestampIn || record.timestampIn),
      documentSubmittedAt: text(source.documentSubmittedAt),
      receivingCompletedAt: text(source.receivingCompletedAt),
      documentReturnedAt: text(source.documentReturnedAt),
      gateOutAt: text(source.gateOutAt || source.timestampOut || record.timestampOut),
      updatedAt: text(source.updatedAt || source.updatedAtText || source.generatedAt),
      updatedBy: text(source.updatedBy),
      cancelled: source.cancelled === true || statusCode === 'CANCELLED',
      cancelReason: text(source.cancelReason)
    };
  }

  function normalizeLookup(result, fallbackRecord) {
    const data = result && result.data && typeof result.data === 'object' ? result.data : result && typeof result === 'object' ? result : {};
    const rawRecord = data.record || data.vehicle || data.sourceRecord || fallbackRecord || {};
    const rawState = data.state || data.workflowState || data.currentState || {};
    const autoId = text(rawRecord.autoId || rawRecord.autoID || rawRecord.entryCode || rawState.autoId || data.autoId || data.entryCode);
    const firstName = text(rawRecord.firstName || rawRecord.name || rawRecord.driverFirstName || rawRecord['ชื่อ']);
    const lastName = text(rawRecord.lastName || rawRecord.surname || rawRecord.driverLastName || rawRecord['สกุล'] || rawRecord['นามสกุล']);
    const prefix = text(rawRecord.prefix || rawRecord.title || rawRecord['คำนำหน้า'] || rawRecord['คำนำหน้า ']);
    return {
      success: data.success !== false,
      record: {
        autoId,
        canonicalRecordId: text(rawRecord.canonicalRecordId),
        canonicalIdQuality: text(rawRecord.canonicalIdQuality),
        sourceRowNumber: Number(rawRecord.sourceRowNumber || rawRecord.rowNumber || 0) || 0,
        timestampInEpochMs: Number(rawRecord.timestampInEpochMs || 0) || 0,
        primaryValue: text(rawRecord.primaryValue),
        timestampIn: text(rawRecord.timestampIn || rawRecord.gateInAt || rawRecord.timestamp),
        timestampOut: text(rawRecord.timestampOut || rawRecord.gateOutAt),
        appointmentNumber: text(rawRecord.appointmentNumber || rawRecord.appointment || rawRecord.booking),
        companyName: text(rawRecord.companyName || rawRecord.company),
        phone: text(rawRecord.phone || rawRecord.mobile || rawRecord.tel),
        registration: text(rawRecord.registration || rawRecord.plate || rawRecord.vehiclePlate),
        province: text(rawRecord.province),
        vehicleType: text(rawRecord.vehicleType || rawRecord.type),
        driverName: composeDriverName(rawRecord, null, [prefix, firstName, lastName].filter(Boolean).join(' '))
      },
      state: {
        autoId,
        statusCode: text(rawState.statusCode || data.statusCode).toUpperCase(),
        statusName: text(rawState.statusName || data.statusName),
        nextStepText: text(rawState.nextStepText || data.nextStepText),
        documentSubmittedAt: text(rawState.documentSubmittedAt || rawState.documentSubmittedAtText),
        receivingCompletedAt: text(rawState.receivingCompletedAt || rawState.receivingCompletedAtText),
        documentReturnedAt: text(rawState.documentReturnedAt || rawState.documentReturnedAtText),
        gateOutAt: text(rawState.gateOutAt || rawState.gateOutAtText),
        updatedAt: text(rawState.updatedAt || rawState.updatedAtText),
        updatedBy: text(rawState.updatedBy),
        cancelled: rawState.cancelled === true || text(rawState.statusCode).toUpperCase() === 'CANCELLED',
        cancelReason: text(rawState.cancelReason)
      }
    };
  }

  function renderDashboard() {
    const counts = countSummary(state.dashboardItems);
    setText('countTotalWorkflow', counts.total);
    setText('countWaitingReceiving', counts.waitingReceiving);
    setText('countReceivingCompleted', counts.receivingCompleted);
    setText('countDocumentReturned', counts.documentReturned);
    setText('countCancelled', counts.cancelled);
    renderWorkflowTable();
  }

  function renderWorkflowTable() {
    const tbody = byId('workflowTableBody');
    if (!tbody) return;

    refreshAutoPageSize();

    const filtered = getFilteredDashboardItems();
    state.filteredTotal = filtered.length;

    const pageSize = getWorkflowPageSize();
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

    if (state.tablePage > totalPages) state.tablePage = totalPages;
    if (state.tablePage < 1) state.tablePage = 1;

    const startIndex = (state.tablePage - 1) * pageSize;
    const pageItems = filtered.slice(startIndex, startIndex + pageSize);

    if (!pageItems.length) {
      tbody.innerHTML = '<tr><td colspan="9" class="table-empty">ยังไม่มีข้อมูลตามเงื่อนไข</td></tr>';
      renderWorkflowPagination(0, 0, 0, 1, 1);
      return;
    }

    tbody.innerHTML = pageItems.map((item) => {
      const sla = calculateSlaState(item);
      return `
      <tr data-auto-id="${escapeHtml(item.autoId)}" data-sla="${escapeHtml(sla.level)}">
        <td><span class="workflow-cell-main">${escapeHtml(item.appointmentNumber || '-')}</span></td>
        <td><span class="workflow-cell-main">${escapeHtml(item.companyName || '-')}</span></td>
        <td><span class="workflow-cell-main">${escapeHtml(item.driverName || '-')}</span></td>
        <td><span class="workflow-cell-main">${escapeHtml(formatPlateWithProvince(item))}</span></td>
        <td><span class="workflow-cell-main">${escapeHtml(item.phone || '-')}</span></td>
        <td>
          <div class="sla-cell">
            <span class="status-pill" data-status="${escapeHtml(item.statusCode)}" data-sla="${escapeHtml(sla.level)}">
              ${escapeHtml(item.statusName || statusName(item.statusCode))}
            </span>
            ${sla.enabled ? `<span class="sla-mini-progress" data-sla="${escapeHtml(sla.level)}" title="${escapeHtml(sla.label + ' · ' + sla.elapsedText)}"><i style="width:${escapeHtml(String(sla.percent || 0))}%"></i></span>` : ''}
          </div>
        </td>
        <td><span class="workflow-cell-main">${escapeHtml(displayLatestTime(item) || '-')}</span></td>
        <td class="workflow-auto-id"><strong>${escapeHtml(item.autoId || '-')}</strong></td>
        <td><button type="button" class="icon-button" data-open-detail title="ดูรายละเอียด">ดู</button></td>
      </tr>`;
    }).join('');

    renderWorkflowPagination(
      startIndex + 1,
      startIndex + pageItems.length,
      filtered.length,
      state.tablePage,
      totalPages
    );
  }

  function getFilteredDashboardItems() {
    const query = state.dashboardQuery;

    return state.dashboardItems.filter((item) => {
      const statusOk =
        state.statusFilter === 'ALL' ||
        item.statusCode === state.statusFilter ||
        (state.statusFilter === 'CANCELLED' && item.cancelled);

      if (!statusOk) return false;
      if (!query) return true;

      return [
        item.autoId,
        item.appointmentNumber,
        item.companyName,
        item.driverName,
        item.registration,
        item.province,
        item.phone,
        item.statusName
      ]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });
  }

  function getWorkflowPageSize() {
    if (state.tablePageSize !== 'AUTO') {
      return clampInteger(state.tablePageSize, 5, 200, 20);
    }

    return clampInteger(state.computedPageSize, 8, 80, 20);
  }

  function getWorkflowTotalPages() {
    const pageSize = getWorkflowPageSize();
    const total = Number(state.filteredTotal) || getFilteredDashboardItems().length;
    return Math.max(1, Math.ceil(total / pageSize));
  }

  function refreshAutoPageSize() {
    if (state.tablePageSize !== 'AUTO') return;

    const wrap = byId('workflowTableWrap') || document.querySelector('.workflow-table-wrap');
    if (!wrap) return;

    const height = Math.max(0, Math.floor(wrap.getBoundingClientRect().height));
    if (!height) return;

    /*
     * หักความสูงหัวตารางออก แล้วคำนวณจากความสูงแถวจริงโดยประมาณ
     * เพื่อให้ตารางใช้พื้นที่เต็ม แต่ไม่วาดรายการเกินจอมากเกินไป
     */
    const headerHeight = 40;
    const rowHeight = window.innerWidth >= 861 ? 48 : 58;
    const nextSize = Math.floor((height - headerHeight) / rowHeight);

    state.computedPageSize = clampInteger(nextSize, 8, 80, 20);
  }

  function renderWorkflowPagination(from, to, total, page, totalPages) {
    const summary = byId('workflowTablePageSummary');
    const indicator = byId('workflowPageIndicator');
    const prev = byId('workflowPrevPage');
    const next = byId('workflowNextPage');

    if (summary) {
      if (!total) {
        summary.textContent = 'ไม่พบข้อมูลตามเงื่อนไข';
      } else {
        const sizeText = state.tablePageSize === 'AUTO'
          ? 'อัตโนมัติ ' + getWorkflowPageSize() + ' แถว/หน้า'
          : getWorkflowPageSize() + ' แถว/หน้า';

        const serverTotal = Number(state.dashboardTotalRows) || total;
        summary.textContent = 'แสดง ' + from + '–' + to + ' จากข้อมูลที่โหลด ' + total +
          (serverTotal > total ? ' · ทั้งระบบ ' + serverTotal : '') +
          ' รายการ · ' + sizeText;
      }
    }

    if (indicator) indicator.textContent = 'หน้า ' + page + ' / ' + totalPages;
    if (prev) prev.disabled = page <= 1;
    if (next) next.disabled = page >= totalPages;
  }

  function resetWorkflowPage() {
    state.tablePage = 1;
  }

  function upsertDashboardItemFromLookup(lookup) {
    const item = dashboardItemFromLookup(lookup);
    if (!item.autoId) return;
    resetWorkflowPage();
    state.dashboardItems = [item]
      .concat(state.dashboardItems.filter((entry) => entry.autoId !== item.autoId))
      .sort((a, b) => dateToMs(b.updatedAt) - dateToMs(a.updatedAt));
    saveDashboardCache();
  }

  function dashboardItemFromLookup(lookup) {
    const record = lookup && lookup.record ? lookup.record : {};
    const workflow = lookup && lookup.state ? lookup.state : {};
    const statusCode = text(workflow.statusCode).toUpperCase();
    return {
      autoId: text(record.autoId || workflow.autoId),
      statusCode,
      statusName: text(workflow.statusName || statusName(statusCode)),
      nextStepText: text(workflow.nextStepText),
      appointmentNumber: text(record.appointmentNumber),
      companyName: text(record.companyName),
      driverName: text(record.driverName),
      registration: text(record.registration),
      province: text(record.province),
      phone: text(record.phone),
      vehicleType: text(record.vehicleType),
      gateInAt: text(record.timestampIn),
      documentSubmittedAt: text(workflow.documentSubmittedAt),
      receivingCompletedAt: text(workflow.receivingCompletedAt),
      documentReturnedAt: text(workflow.documentReturnedAt),
      gateOutAt: text(record.timestampOut || workflow.gateOutAt),
      updatedAt: text(workflow.updatedAt || formatBangkokDateTime(new Date())),
      updatedBy: text(workflow.updatedBy),
      cancelled: workflow.cancelled === true || statusCode === 'CANCELLED',
      cancelReason: text(workflow.cancelReason)
    };
  }

  function renderLookupResult(lookup) {
    const panel = byId('lookupResultPanel');
    const body = byId('resultBody');
    if (!panel || !body) return;
    const record = lookup.record || {};
    const workflow = lookup.state || {};
    const status = workflow.statusName || statusName(workflow.statusCode) || '-';
    panel.hidden = false;
    setText('resultTitle', 'ผลการสแกนล่าสุด');
    setText('resultStatusBadge', status);
    body.innerHTML = `
      <div class="result-identity">
        <strong>${escapeHtml(record.appointmentNumber || '-')} · ${escapeHtml(record.companyName || '-')}</strong>
        <span>${escapeHtml(record.driverName || '-')} · ${escapeHtml(formatPlate(record))}${record.province ? ' · ' + escapeHtml(record.province) : ''} · ${escapeHtml(record.phone || '-')}</span>
        <small>Auto ID: ${escapeHtml(record.autoId || '-')}</small>
      </div>
      <div class="result-grid">
        ${fieldHtml('เลขนัดหมาย', record.appointmentNumber || '-')}
        ${fieldHtml('ชื่อบริษัท', record.companyName || '-')}
        ${fieldHtml('ชื่อ พขร.', record.driverName || '-')}
        ${fieldHtml('ทะเบียน / จังหวัด', formatPlate(record) + (record.province ? ' · ' + record.province : ''))}
        ${fieldHtml('เบอร์โทร', record.phone || '-')}
        ${fieldHtml('Auto ID', record.autoId || '-')}
        ${fieldHtml('เวลาเข้า Gate In', record.timestampIn || '-')}
        ${fieldHtml('ยื่นเอกสาร', workflow.documentSubmittedAt || '-')}
        ${fieldHtml('รับสินค้าเสร็จ', workflow.receivingCompletedAt || '-')}
        ${fieldHtml('รับเอกสารคืน', workflow.documentReturnedAt || '-')}
        ${fieldHtml('ขั้นตอนถัดไป', workflow.nextStepText || '-')}
        ${fieldHtml('อัปเดตล่าสุด', workflow.updatedAt || '-')}
      </div>
    `;
  }

  function renderLookupError(code, error) {
    const panel = byId('lookupResultPanel');
    const body = byId('resultBody');
    if (!panel || !body) return;
    panel.hidden = false;
    setText('resultTitle', 'ไม่พบหรือใช้รหัสนี้ไม่ได้');
    setText('resultStatusBadge', error && error.code ? error.code : 'ERROR');
    body.innerHTML = `
      <div class="result-identity">
        <strong>${escapeHtml(code || '-')}</strong>
        <span>${escapeHtml(errorMessage(error))}</span>
      </div>
    `;
  }


  /************************************************************
   * Phase 2A — Durable Pending Queue / Network Recovery
   ************************************************************/

  async function setupPendingQueue() {
    updateNetworkState();

    if (CONFIG.INBOUND_QUEUE_ENABLED === false) {
      state.queueReady = false;
      renderQueueStatus({
        pending: 0,
        failed: 0,
        paused: 0,
        committed: 0,
        online: navigator.onLine !== false,
        storageMode: 'DISABLED'
      });
      return;
    }

    if (!PENDING_QUEUE || typeof PENDING_QUEUE.init !== 'function') {
      state.queueReady = false;
      renderQueueStatus({
        pending: 0,
        failed: 1,
        paused: 0,
        committed: 0,
        online: navigator.onLine !== false,
        storageMode: 'NOT_LOADED'
      });
      console.warn('ไม่พบ inbound-offline-queue.js');
      return;
    }

    try {
      const queueInitResult = await PENDING_QUEUE.init({
        api: API,
        getActor: getCurrentQueueActor,
        config: {
          maxItems: Number(CONFIG.INBOUND_QUEUE_MAX_ITEMS) || 500,
          maxAttempts: Number(CONFIG.INBOUND_QUEUE_MAX_ATTEMPTS) || 12,
          retryBaseMs: Math.min(
            Number(CONFIG.INBOUND_QUEUE_RETRY_BASE_MS) || FAST_QUEUE_RETRY_BASE_MS,
            FAST_QUEUE_RETRY_BASE_MS
          ),
          retryMaxMs: Math.min(
            Number(CONFIG.INBOUND_QUEUE_RETRY_MAX_MS) || FAST_QUEUE_RETRY_MAX_MS,
            FAST_QUEUE_RETRY_MAX_MS
          ),
          autoFlushMs: Math.min(
            Number(CONFIG.INBOUND_QUEUE_AUTO_FLUSH_MS) || FAST_QUEUE_AUTO_FLUSH_MS,
            FAST_QUEUE_AUTO_FLUSH_MS
          ),
          committedRetentionMs:
            (Number(CONFIG.INBOUND_QUEUE_COMMITTED_RETENTION_HOURS) || 24) * 60 * 60 * 1000,
          failedRetentionMs:
            (Number(CONFIG.INBOUND_QUEUE_FAILED_RETENTION_DAYS) || 7) * 24 * 60 * 60 * 1000
        }
      });

      state.queueReady = true;

      if (Number(queueInitResult && queueInitResult.revivedLegacyCount || 0) > 0) {
        setScanMessage(
          'พบรายการค้างจากระบบรุ่นก่อน กำลังตรวจสอบผลและกู้คืนอัตโนมัติ',
          'BUSY'
        );
      }

      state.queueUnsubscribe = PENDING_QUEUE.subscribe(() => {
        void refreshQueueSummary();
        if (navigator.onLine !== false) scheduleFastQueueFlush(80);
      });
      PENDING_QUEUE.startAutoFlush();
      await refreshQueueSummary();

      if (navigator.onLine !== false) {
        scheduleFastQueueFlush(80);
      }
    } catch (error) {
      state.queueReady = false;
      console.error('setup pending queue failed', error);
      renderQueueStatus({
        pending: 0,
        failed: 1,
        paused: 0,
        committed: 0,
        online: navigator.onLine !== false,
        storageMode: 'ERROR'
      });
    }
  }

  function getCurrentQueueActor() {
    const user = state.session && state.session.user
      ? state.session.user
      : {};

    return {
      username: text(user.username),
      role: normalizeRole(user.role)
    };
  }

  async function refreshQueueSummary() {
    if (!state.queueReady || !PENDING_QUEUE || typeof PENDING_QUEUE.getSummary !== 'function') {
      updateNetworkState();
      return;
    }

    try {
      const summary = await PENDING_QUEUE.getSummary({
        moduleId: state.moduleId
      });
      state.queueSummary = summary;
      renderQueueStatus(summary);
    } catch (error) {
      console.warn('refresh queue summary failed', error);
    }
  }

  function renderQueueStatus(summary) {
    const data = summary && typeof summary === 'object'
      ? summary
      : state.queueSummary;
    const online = navigator.onLine !== false;
    const pending = Number(data.pending || 0);
    const failed = Number(data.failed || 0);
    const paused = Number(data.paused || 0);
    const storageMode = text(data.storageMode || state.queueSummary.storageMode);

    state.queueSummary = Object.assign({}, state.queueSummary, data, {
      online,
      pending,
      failed,
      paused,
      storageMode
    });

    const network = byId('inboundNetworkState');
    const detail = byId('inboundQueueDetail');
    const queueButton = byId('inboundQueueButton');
    const failedButton = byId('inboundFailedQueueButton');
    const retryButton = byId('inboundRetryQueueButton');

    setText('inboundPendingCount', pending);
    setText('inboundFailedCount', failed);

    if (network) {
      if (!online) {
        network.textContent = 'ออฟไลน์ · รับรหัสไว้ในเครื่องอัตโนมัติ';
        network.dataset.state = 'OFFLINE';
      } else if (pending > 0) {
        network.textContent = 'ออนไลน์ · กำลังส่ง ' + pending + ' รายการ';
        network.dataset.state = 'PENDING';
      } else {
        network.textContent = 'พร้อมสแกน';
        network.dataset.state = 'ONLINE';
      }
    }

    if (detail) {
      if (!state.queueReady && CONFIG.INBOUND_QUEUE_ENABLED !== false) {
        detail.textContent = 'โหมดสำรองไม่พร้อม แต่ยังสามารถส่งตรงได้';
      } else if (!online) {
        detail.textContent = 'สแกนต่อได้ตามปกติ ระบบจะส่งเองเมื่ออินเทอร์เน็ตกลับมา';
      } else if (pending > 0) {
        detail.textContent = 'สแกนรายการถัดไปได้ทันที · ระบบกำลังบันทึกด้านหลัง';
      } else {
        detail.textContent = 'ยิงรหัสแล้วรับรายการถัดไปได้ทันที';
      }
    }

    /* Fast Scan Mode ซ่อนเครื่องมือดูแล Queue จากผู้ปฏิบัติงาน */
    if (queueButton) {
      queueButton.hidden = true;
      queueButton.disabled = true;
    }

    if (failedButton) {
      failedButton.hidden = true;
      failedButton.disabled = true;
    }

    if (retryButton) {
      retryButton.hidden = true;
      retryButton.disabled = true;
    }

    updateConnectionFromNetwork();
  }

  function updateNetworkState() {
    renderQueueStatus(Object.assign({}, state.queueSummary, {
      online: navigator.onLine !== false
    }));
  }

  function updateConnectionFromNetwork() {
    const user = state.session && state.session.user
      ? state.session.user
      : {};
    const role = normalizeRole(user.role);

    if (navigator.onLine === false) {
      setConnection('OFFLINE · สแกนต่อได้', 'WARN');
      return;
    }

    if (Number(state.queueSummary.pending || 0) > 0) {
      setConnection('ONLINE · กำลังบันทึกด้านหลัง', 'LOADING');
      return;
    }

    setConnection(role === 'ADMIN' ? 'ADMIN MODE' : 'INBOUND ONLINE', 'READY');
  }

  function handleNetworkOnline() {
    updateNetworkState();
    setScanMessage('ออนไลน์แล้ว · ระบบกำลังส่งข้อมูลที่เก็บไว้ให้อัตโนมัติ', 'SUCCESS');

    if (state.queueReady) {
      scheduleFastQueueFlush(30);
    }
  }

  function handleNetworkOffline() {
    updateNetworkState();
    setScanMessage('ออฟไลน์ · สแกนต่อได้ ระบบเก็บข้อมูลไว้และจะส่งเองเมื่อออนไลน์', 'WARN');
  }

  function handleQueueOperationEvent(event) {
    const detail = event && event.detail && typeof event.detail === 'object'
      ? event.detail
      : {};
    const operation = detail.operation || {};

    void refreshQueueSummary();

    if (detail.type === 'COMMITTED') {
      const result = extractQueueLookupResult(detail.result);
      if (
        normalizeCode(operation.moduleId) === normalizeCode(state.moduleId) &&
        result && result.record && result.record.autoId
      ) {
        const normalized = normalizeLookup(result);
        state.currentLookup = normalized;
        upsertDashboardItemFromLookup(normalized);
        renderDashboard();
      }

      scheduleQueueDashboardRefresh();
      return;
    }

    if (detail.type === 'FAILED' && document.visibilityState === 'visible') {
      const failedCode = operation.autoId || '-';
      setScanMessage(
        'รหัส ' + failedCode + ' ไม่สามารถดำเนินการได้ · กรุณาตรวจสอบรหัสแล้วสแกนใหม่',
        'WARN'
      );
    }
  }

  function extractQueueLookupResult(result) {
    const source = result && typeof result === 'object' ? result : {};

    if (source.result && typeof source.result === 'object') {
      return source.result;
    }

    if (source.lookup && typeof source.lookup === 'object') {
      return source.lookup;
    }

    if (source.data && typeof source.data === 'object') {
      return source.data;
    }

    return source;
  }

  function scheduleQueueDashboardRefresh() {
    window.clearTimeout(state.queueRefreshTimer);
    state.queueRefreshTimer = window.setTimeout(() => {
      scheduleRevisionCheckAfterWrite();
    }, 1400);
  }

  function scheduleFastQueueFlush(delayMs) {
    if (!state.queueReady || navigator.onLine === false) return;

    if (state.fastQueueFlushRunning) {
      state.fastQueueFlushAgain = true;
      return;
    }

    window.clearTimeout(state.fastQueueFlushTimer);
    state.fastQueueFlushTimer = window.setTimeout(
      () => void runFastQueueFlush(),
      Math.max(0, Number(delayMs) || FAST_QUEUE_FLUSH_DELAY_MS)
    );
  }

  async function runFastQueueFlush() {
    if (
      state.fastQueueFlushRunning ||
      !state.queueReady ||
      navigator.onLine === false ||
      !PENDING_QUEUE ||
      typeof PENDING_QUEUE.flush !== 'function'
    ) {
      return;
    }

    state.fastQueueFlushRunning = true;
    state.fastQueueFlushAgain = false;

    try {
      await PENDING_QUEUE.flush({
        moduleId: state.moduleId,
        reason: 'FAST_SCAN_AUTO_FLUSH'
      });
      await refreshQueueSummary();
    } catch (error) {
      console.warn('fast queue flush failed', error);
    } finally {
      state.fastQueueFlushRunning = false;
      const counts = state.queueSummary.counts || {};
      const hasImmediateWork =
        Number(counts.PENDING || 0) > 0 ||
        Number(counts.UNKNOWN || 0) > 0;

      if (state.fastQueueFlushAgain || hasImmediateWork) {
        scheduleFastQueueFlush(hasImmediateWork ? 180 : 60);
      }
    }
  }

  async function queueResolveScan(autoId, source, requestId, meta) {
    if (!state.queueReady || !PENDING_QUEUE || typeof PENDING_QUEUE.enqueueResolveScan !== 'function') {
      return false;
    }

    const workflowExpectation = getWorkflowExpectation(autoId);
    const originalScanSource = text(source || 'SCAN').toUpperCase();
    const lookupMethod = originalScanSource === 'MANUAL'
      ? 'MANUAL'
      : 'SCAN';
    const response = await PENDING_QUEUE.enqueueResolveScan(
      state.moduleId,
      autoId,
      {
        entryCode: autoId,
        autoId,
        qrText: meta && meta.rawText ? meta.rawText : autoId,
        lookupMethod,
        method: lookupMethod,
        scanSource: 'QUEUE_REPLAY',
        originalScanSource,
        source: originalScanSource,
        expectedStatusCode: workflowExpectation.expectedStatusCode,
        expectedActionCode: workflowExpectation.expectedActionCode,
        note: 'รายการสแกนที่เก็บไว้ระหว่างเครือข่ายไม่พร้อม',
        clientRequestId: requestId,
        requestId
      }
    );

    void refreshQueueSummary();
    return Boolean(response && (response.queued || response.duplicate || response.revived));
  }

  async function queueSpecificAction(kind, lookup, payload) {
    if (!state.queueReady || !PENDING_QUEUE) {
      return false;
    }

    const action = String(kind || '').toUpperCase();
    const autoId = normalizeCode(
      lookup && lookup.record && lookup.record.autoId ||
      payload && (payload.autoId || payload.entryCode)
    );
    const body = buildQueueWorkflowPayload(lookup, payload || {});
    let response;

    if (action === 'SUBMIT_DOCUMENT') {
      response = await PENDING_QUEUE.enqueueSubmitDocument(state.moduleId, autoId, body);
    } else if (action === 'RETURN_DOCUMENT') {
      response = await PENDING_QUEUE.enqueueReturnDocument(state.moduleId, autoId, body);
    } else if (action === 'CANCEL_STAGE') {
      response = await PENDING_QUEUE.enqueueCancelStage(state.moduleId, autoId, body);
    } else {
      return false;
    }

    await refreshQueueSummary();
    return Boolean(response && (response.queued || response.duplicate || response.revived));
  }

  function buildQueueWorkflowPayload(lookup, payload) {
    const source = payload && typeof payload === 'object'
      ? Object.assign({}, payload)
      : {};
    const record = lookup && lookup.record && typeof lookup.record === 'object'
      ? lookup.record
      : {};
    const requestId = text(
      source.clientRequestId ||
      source.requestId ||
      createStableRequestId()
    );

    return Object.assign({}, source, {
      entryCode: text(source.entryCode || source.autoId || record.autoId),
      autoId: text(source.autoId || source.entryCode || record.autoId),
      canonicalRecordId: text(source.canonicalRecordId || record.canonicalRecordId),
      sourceRowNumber: Number(source.sourceRowNumber || record.sourceRowNumber || 0) || '',
      expectedTimestampIn: text(source.expectedTimestampIn || record.timestampIn),
      expectedTimestampInEpochMs:
        Number(source.expectedTimestampInEpochMs || record.timestampInEpochMs || 0) || '',
      expectedPrimaryValue: text(source.expectedPrimaryValue || record.primaryValue),
      clientRequestId: requestId,
      requestId
    });
  }

  function createStableRequestId() {
    if (PENDING_QUEUE && typeof PENDING_QUEUE.createRequestId === 'function') {
      return PENDING_QUEUE.createRequestId();
    }

    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    return 'REQ-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);
  }

  function isTransientQueueError(error) {
    if (PENDING_QUEUE && typeof PENDING_QUEUE.isTransientError === 'function') {
      return PENDING_QUEUE.isTransientError(error);
    }

    const code = text(error && error.code).toUpperCase();
    const status = Number(error && error.status) || 0;
    return [
      'NETWORK_ERROR',
      'REQUEST_TIMEOUT',
      'GAS_TIMEOUT',
      'GAS_CONNECTION_FAILED',
      'GAS_HTTP_ERROR'
    ].includes(code) || [0, 408, 429, 500, 502, 503, 504].includes(status);
  }

  async function retryPendingQueueNow() {
    if (!state.queueReady || !PENDING_QUEUE) {
      await showAlert('ระบบรอส่งไม่พร้อม', 'กรุณาตรวจว่าโหลดไฟล์ inbound-offline-queue.js แล้ว', 'warning');
      return;
    }

    if (navigator.onLine === false) {
      await showAlert('ยังออฟไลน์', 'รายการยังปลอดภัยอยู่ในเครื่อง ระบบจะส่งเมื่อเครือข่ายกลับมา', 'info');
      return;
    }

    try {
      setScanMessage('กำลังส่งรายการค้างใหม่ตามลำดับ', 'BUSY');
      await PENDING_QUEUE.retryAll({
        moduleId: state.moduleId,
        flush: true
      });
      await refreshQueueSummary();
      await loadWorkflowDashboard(true, {cacheFirst: false});

      if (Number(state.queueSummary.failed || 0) > 0) {
        setScanMessage('ยังมีบางรายการส่งไม่สำเร็จ กรุณาเปิดรายการรอส่งเพื่อตรวจสอบ', 'WARN');
      } else if (Number(state.queueSummary.pending || 0) > 0) {
        setScanMessage('บางรายการยังรอส่ง ระบบจะลองใหม่อัตโนมัติ', 'WARN');
      } else {
        setScanMessage('ส่งรายการค้างครบแล้ว', 'SUCCESS');
      }
    } catch (error) {
      setScanMessage('ส่งรายการค้างไม่สำเร็จ: ' + errorMessage(error), 'WARN');
      await showAlert('ส่งรายการค้างไม่สำเร็จ', errorMessage(error), 'error');
    }
  }

  async function openPendingQueueDialog(options) {
    if (!state.queueReady || !PENDING_QUEUE || typeof PENDING_QUEUE.list !== 'function') {
      await showAlert('ระบบรอส่งไม่พร้อม', 'ไม่พบข้อมูลคิวรอส่งในเบราว์เซอร์นี้', 'warning');
      return;
    }

    pauseScanFocus(30000);

    try {
      const operations = await PENDING_QUEUE.list({
        moduleId: state.moduleId
      });
      const active = operations
        .filter((operation) => operation.status !== 'COMMITTED')
        .sort((left, right) => {
          const priority = {
            FAILED: 0,
            PAUSED_AUTH: 1,
            PAUSED_ACTOR: 1,
            UNKNOWN: 2,
            RETRY_WAIT: 3,
            SENDING: 4,
            PENDING: 5
          };
          const leftPriority = priority[left.status] ?? 9;
          const rightPriority = priority[right.status] ?? 9;
          if (leftPriority !== rightPriority) return leftPriority - rightPriority;
          return Number(left.createdAt || 0) - Number(right.createdAt || 0);
        });

      const html = buildPendingQueueHtml(active, options);

      if (!window.Swal || typeof window.Swal.fire !== 'function') {
        window.alert(active.length
          ? active.map((item) => item.autoId + ' · ' + queueStatusLabel(item.status)).join('\n')
          : 'ไม่มีรายการรอส่ง');
        return;
      }

      const result = await window.Swal.fire({
        title: 'รายการรอส่ง Inbound',
        html,
        icon: active.some((item) => item.status === 'FAILED') ? 'warning' : 'info',
        showCancelButton: true,
        confirmButtonText: active.length && navigator.onLine !== false ? 'ส่งใหม่ตอนนี้' : 'ปิด',
        cancelButtonText: 'ปิด',
        showConfirmButton: true,
        reverseButtons: true,
        heightAuto: false,
        customClass: {
          popup: 'inbound-queue-popup'
        }
      });

      if (result && result.isConfirmed && active.length && navigator.onLine !== false) {
        await retryPendingQueueNow();
      }
    } catch (error) {
      await showAlert('เปิดรายการรอส่งไม่สำเร็จ', errorMessage(error), 'error');
    } finally {
      keepCameraStandby();
      focusCodeInput(false);
    }
  }

  function buildPendingQueueHtml(operations) {
    const list = Array.isArray(operations) ? operations : [];

    if (!list.length) {
      return '<div class="inbound-queue-empty">ไม่มีรายการรอส่งหรือรายการผิดพลาดใน Module นี้</div>';
    }

    return '<div class="inbound-queue-list">' + list.map((operation) => {
      const errorText = operation.lastError && operation.lastError.message
        ? operation.lastError.message
        : '';
      const nextAttempt = Number(operation.nextAttemptAt || 0) > Date.now()
        ? ' · ลองใหม่ ' + formatQueueDate(operation.nextAttemptAt)
        : '';

      return `
        <article class="inbound-queue-item" data-status="${escapeHtml(operation.status)}">
          <div class="inbound-queue-item__main">
            <strong>${escapeHtml(operation.autoId || '-')}</strong>
            <span>${escapeHtml(queueKindLabel(operation.kind))} · ส่งแล้ว ${Number(operation.attempts || 0)} ครั้ง</span>
            <small>สร้าง ${escapeHtml(formatQueueDate(operation.createdAt))}${escapeHtml(nextAttempt)}</small>
            ${errorText ? `<small>${escapeHtml(errorText)}</small>` : ''}
          </div>
          <span class="inbound-queue-item__status">${escapeHtml(queueStatusLabel(operation.status))}</span>
        </article>
      `;
    }).join('') + '</div>';
  }

  function queueKindLabel(kind) {
    const value = String(kind || '').toUpperCase();
    if (value === 'RESOLVE_SCAN') return 'ตรวจสถานะและทำขั้นตอนอัตโนมัติ';
    if (value === 'SUBMIT_DOCUMENT') return 'ยื่นเอกสาร Inbound';
    if (value === 'RETURN_DOCUMENT') return 'รับเอกสารคืน';
    if (value === 'CANCEL_STAGE') return 'ยกเลิกสถานะล่าสุด';
    return value || 'งาน Workflow';
  }

  function queueStatusLabel(status) {
    const value = String(status || '').toUpperCase();
    if (value === 'PENDING') return 'รอส่ง';
    if (value === 'SENDING') return 'กำลังส่ง';
    if (value === 'RETRY_WAIT') return 'รอลองใหม่';
    if (value === 'UNKNOWN') return 'ยังยืนยันผลไม่ได้';
    if (value === 'FAILED') return 'ต้องตรวจสอบ';
    if (value === 'PAUSED_AUTH') return 'รอเข้าสู่ระบบ';
    if (value === 'PAUSED_ACTOR') return 'รอบัญชีเดิม';
    if (value === 'COMMITTED') return 'ส่งสำเร็จ';
    return value || '-';
  }

  function formatQueueDate(value) {
    const milliseconds = Number(value) || 0;
    return milliseconds > 0
      ? formatBangkokDateTime(new Date(milliseconds))
      : '-';
  }

  async function openRecordDetailAlert(item) {
    if (!item) return;
    pauseScanFocus(24000);

    const html = buildRecordDetailHtml(item);

    if (!window.Swal || typeof window.Swal.fire !== 'function') {
      // fallback กรณี SweetAlert2 ยังไม่โหลด
      window.alert([
        'รายละเอียดรายการ',
        'เลขนัดหมาย: ' + (item.appointmentNumber || '-'),
        'บริษัท: ' + (item.companyName || '-'),
        'พขร.: ' + (item.driverName || '-'),
        'ทะเบียน: ' + (formatPlate(item) || '-') + (item.province ? ' ' + item.province : ''),
        'โทร: ' + (item.phone || '-'),
        'Auto ID: ' + (item.autoId || '-')
      ].join('\n'));
      return;
    }

    const canCancel = canCancelCurrentInboundStage(item);

    const result = await window.Swal.fire({
      title: '',
      html,
      icon: undefined,
      width: 'min(760px, calc(100vw - 24px))',
      padding: 0,
      heightAuto: false,
      showCloseButton: false,
      showDenyButton: canCancel,
      confirmButtonText: 'ปิด',
      denyButtonText: 'ยกเลิกสถานะล่าสุด',
      reverseButtons: true,
      customClass: {
        popup: 'inbound-detail-popup',
        actions: 'inbound-detail-actions',
        denyButton: 'inbound-detail-cancel-button'
      },
      didOpen: () => {
        pauseScanFocus(24000);
      },
      willClose: () => {
        window.setTimeout(() => {
          keepCameraStandby();
          focusCodeInput(false);
        }, 80);
      }
    });

    if (result && result.isDenied) {
      await openCancelCurrentStageDialog(item);
    }
  }

  function canCancelCurrentInboundStage(item) {
    if (!item || item.cancelled) return false;
    const status = String(item.statusCode || '').toUpperCase();

    /*
     * ให้ Inbound ยกเลิกเฉพาะสถานะที่ Inbound เป็นผู้บันทึก
     * - DOCUMENT_SUBMITTED: ยกเลิกการยื่นเอกสาร กลับไปรอยื่นเอกสาร
     * - DOCUMENT_RETURNED: ยกเลิกการรับเอกสารคืน กลับไปรอรับเอกสารคืน
     * ไม่ให้ Inbound ยกเลิก RECEIVING_COMPLETED เพราะเป็นงานของ User/Admin
     */
    return status === 'DOCUMENT_SUBMITTED' || status === 'DOCUMENT_RETURNED';
  }

  async function openCancelCurrentStageDialog(item) {
    if (!window.Swal || !item || !item.autoId) return;

    pauseScanFocus(30000);

    const stageText = item.statusName || statusName(item.statusCode) || 'สถานะล่าสุด';

    const result = await window.Swal.fire({
      title: 'ยกเลิกสถานะล่าสุด',
      html: `
        <div class="inbound-cancel-summary">
          <strong>${escapeHtml(item.appointmentNumber || '-')} · ${escapeHtml(item.companyName || '-')}</strong>
          <span>${escapeHtml(item.driverName || '-')} · ${escapeHtml(formatPlateWithProvince(item) || '-')}</span>
          <small>สถานะที่จะยกเลิก: ${escapeHtml(stageText)}</small>
        </div>
      `,
      input: 'textarea',
      inputLabel: 'เหตุผลการยกเลิก',
      inputPlaceholder: 'เช่น สแกนผิดคัน / คนขับนำ QR ผิด / บันทึกผิดขั้นตอน',
      inputAttributes: {
        maxlength: '300',
        autocapitalize: 'off',
        autocomplete: 'off'
      },
      showCancelButton: true,
      confirmButtonText: 'ยืนยันยกเลิก',
      cancelButtonText: 'กลับ',
      reverseButtons: true,
      customClass: {
        popup: 'inbound-cancel-popup'
      },
      preConfirm: (value) => {
        const reason = String(value || '').trim();
        if (reason.length < 5) {
          window.Swal.showValidationMessage('กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร');
          return false;
        }
        return reason;
      }
    });

    if (!result || !result.isConfirmed) {
      focusCodeInput(false);
      return;
    }

    const reason = String(result.value || '').trim();

    try {
      if (!API || typeof API.cancelInboundWorkflow !== 'function') {
        throw createClientError(
          'CANCEL_API_NOT_READY',
          'ยังไม่พบ API สำหรับยกเลิกสถานะ กรุณาวางไฟล์ api.js และ InboundWorkflowCancelService.gs จากชุดนี้'
        );
      }

      setScanMessage('กำลังยกเลิกสถานะล่าสุด: ' + item.autoId, 'BUSY');

      const cancelRequestId = createStableRequestId();
      const cancelPayload = {
        entryCode: item.autoId,
        autoId: item.autoId,
        reason,
        statusCode: item.statusCode,
        stageCode: item.statusCode,
        cancelScope: 'CURRENT_INBOUND_STAGE',
        clientRequestId: cancelRequestId,
        requestId: cancelRequestId
      };

      let response;

      try {
        response = await API.cancelInboundWorkflow(state.moduleId, cancelPayload);
      } catch (cancelError) {
        if (isTransientQueueError(cancelError)) {
          const queued = await queueSpecificAction(
            'CANCEL_STAGE',
            {record: {autoId: item.autoId}},
            cancelPayload
          );

          if (queued) {
            beep('warn');
            setScanMessage('ยังยืนยันผลไม่ได้ · เก็บคำสั่งยกเลิกไว้รอส่ง: ' + item.autoId, 'WARN');
            await window.Swal.fire({
              icon: 'info',
              title: 'เก็บคำสั่งไว้ในเครื่องแล้ว',
              text: 'ระบบจะส่งคำสั่งยกเลิกด้วยรหัสคำขอเดิมเมื่อเครือข่ายพร้อม',
              confirmButtonText: 'รับทราบ'
            });
            return;
          }
        }

        throw cancelError;
      }

      const updated = normalizeLookup(response, item);
      state.currentLookup = updated;
      renderLookupResult(updated);
      upsertDashboardItemFromLookup(updated);
      renderDashboard();
      beep('success');
      setScanMessage('ยกเลิกสถานะล่าสุดแล้ว: ' + item.autoId, 'SUCCESS');
      await loadWorkflowDashboard(true);

      await window.Swal.fire({
        icon: 'success',
        title: 'ยกเลิกเรียบร้อย',
        text: 'ระบบบันทึกเหตุผลและปรับสถานะรายการแล้ว',
        confirmButtonText: 'รับทราบ'
      });
    } catch (error) {
      beep('error');
      setScanMessage(errorMessage(error), 'ERROR');
      await showAlert('ยกเลิกไม่สำเร็จ', errorMessage(error), 'error');
    } finally {
      keepCameraStandby();
      focusCodeInput(false);
    }
  }

  function buildRecordDetailHtml(item) {
    const plate = formatPlate(item) + (item.province ? ' · ' + item.province : '');
    const statusText = item.statusName || statusName(item.statusCode);

    return `
      <article class="inbound-detail-modal">
        <header class="inbound-detail-modal__header">
          <div>
            <small>INBOUND WORKFLOW DETAIL</small>
            <h2>${escapeHtml(item.appointmentNumber || '-')} · ${escapeHtml(item.companyName || '-')}</h2>
            <p>${escapeHtml(item.driverName || '-')} · ${escapeHtml(plate || '-')}</p>
          </div>
          <span class="inbound-detail-modal__status">${escapeHtml(statusText || '-')}</span>
        </header>

        <section class="inbound-detail-modal__primary">
          ${detailBox('เลขนัดหมาย', item.appointmentNumber)}
          ${detailBox('ชื่อบริษัท', item.companyName)}
          ${detailBox('ชื่อ พขร.', item.driverName)}
          ${detailBox('ทะเบียน / จังหวัด', plate)}
        </section>

        <section class="inbound-detail-modal__body">
          ${detailBox('เบอร์โทร', item.phone)}
          ${detailBox('Auto ID', item.autoId)}
          ${detailBox('ประเภทรถ', item.vehicleType)}
          ${detailBox('เวลาเข้า Gate In', item.gateInAt)}
          ${detailBox('ยื่นเอกสาร Inbound', item.documentSubmittedAt)}
          ${detailBox('รับสินค้าเสร็จ', item.receivingCompletedAt)}
          ${detailBox('รับเอกสารคืน', item.documentReturnedAt)}
          ${detailBox('Gate Out', item.gateOutAt)}
          ${detailBox('ขั้นตอนถัดไป', item.nextStepText)}
          ${detailBox('อัปเดตล่าสุด', item.updatedAt)}
          ${item.cancelled ? detailBox('เหตุผลยกเลิก', item.cancelReason) : ''}
        </section>
      </article>
    `;
  }

  function detailBox(label, value) {
    return `
      <div class="detail-box">
        <span>${escapeHtml(label || '')}</span>
        <strong>${escapeHtml(value || '-')}</strong>
      </div>
    `;
  }

  function clearCurrentResult() {
    state.currentLookup = null;
    const panel = byId('lookupResultPanel');
    if (panel) panel.hidden = true;
  }

  function resetForNextScan() {
    window.setTimeout(() => {
      clearInput();
      focusCodeInput(false);
    }, 20);
  }

  function clearInput() {
    state.hardwareScanBuffer = '';
    window.clearTimeout(state.hardwareScanTimer);
    state.hardwareScanBuffer = '';
    window.clearTimeout(state.hardwareScanTimer);
    const input = byId('entryCodeInput');
    if (input) input.value = '';
  }

  function getEntryCode() {
    return normalizeCode(byId('entryCodeInput')?.value || '');
  }


  function bindHardwareScannerCapture() {
    if (state.hardwareScannerBound) return;
    state.hardwareScannerBound = true;

    /*
     * Hotfix 23:
     * - ถ้า focus อยู่ในช่อง Auto ID ให้ browser กรอกค่าตามปกติ ห้าม preventDefault
     * - Global capture ใช้เฉพาะกรณี focus หลุดไปที่ body/พื้นที่ว่าง เพื่อรับเครื่องสแกนที่ยิงนอกช่อง
     * - ไม่แย่งค่าจากช่องค้นหา, select, textarea, SweetAlert
     */
    document.addEventListener('keydown', (event) => {
      if (!shouldCaptureHardwareKey(event)) return;

      const input = byId('entryCodeInput');
      if (!input || input.disabled) return;

      unlockAudio();

      const key = String(event.key || '');
      const isTerminator = key === 'Enter' || key === 'Tab';

      if (isTerminator) {
        event.preventDefault();
        event.stopPropagation();

        window.clearTimeout(state.hardwareScanTimer);
        const code = normalizeCode(state.hardwareScanBuffer || input.value || '');

        state.hardwareScanBuffer = '';
        state.keyboardCaptureActive = false;

        if (code) {
          setEntryCodeInput(code, {focus: true});
          void processCode(code, {
            source: 'HARDWARE_SCANNER_GLOBAL_ENTER',
            rawText: code
          });
        }

        return;
      }

      if (key.length === 1) {
        event.preventDefault();
        event.stopPropagation();

        state.keyboardCaptureActive = true;
        state.hardwareScanBuffer += key;
        setEntryCodeInput(state.hardwareScanBuffer, {focus: true});

        window.clearTimeout(state.hardwareScanTimer);
        state.hardwareScanTimer = window.setTimeout(() => {
          const code = normalizeCode(state.hardwareScanBuffer || input.value || '');
          state.hardwareScanBuffer = '';
          state.keyboardCaptureActive = false;

          if (looksLikeCompleteCode(code)) {
            setEntryCodeInput(code, {focus: true});
            void processCode(code, {
              source: 'HARDWARE_SCANNER_GLOBAL_AUTO',
              rawText: code
            });
          }
        }, 220);
      }
    }, true);

    document.addEventListener('paste', (event) => {
      if (!shouldCaptureHardwarePaste(event)) return;

      const text = String(
        event.clipboardData &&
        event.clipboardData.getData('text') ||
        ''
      ).trim();

      if (!text) return;

      const code = normalizeCode(text);
      if (!looksLikeCompleteCode(code)) return;

      event.preventDefault();
      event.stopPropagation();

      state.hardwareScanBuffer = '';
      setEntryCodeInput(code, {focus: true});
      void processCode(code, {
        source: 'HARDWARE_SCANNER_GLOBAL_PASTE',
        rawText: code
      });
    }, true);
  }

  function shouldCaptureHardwareKey(event) {
    if (!event || event.ctrlKey || event.altKey || event.metaKey) return false;
    if (event.isComposing) return false;

    const key = String(event.key || '');
    if (key !== 'Enter' && key !== 'Tab' && key.length !== 1) return false;

    const active = document.activeElement;
    const input = byId('entryCodeInput');

    /*
     * จุดสำคัญ:
     * ถ้า focus อยู่ในช่อง Auto ID อยู่แล้ว ให้ปล่อยให้ช่องรับค่าตามปกติ
     * นี่คือพฤติกรรมที่กล่องสแกนใช้งานได้ในรอบแรก ๆ
     */
    if (active === input) return false;

    if (active) {
      const tag = String(active.tagName || '').toUpperCase();
      if (active.closest && active.closest('.swal2-container')) return false;
      if (active.id === 'workflowSearchInput') return false;
      if (tag === 'TEXTAREA' || tag === 'SELECT') return false;
      if (tag === 'INPUT') return false;
    }

    return true;
  }

  function shouldCaptureHardwarePaste(event) {
    const active = document.activeElement;
    const input = byId('entryCodeInput');

    /*
     * ถ้า paste ลงช่อง Auto ID โดยตรง ให้ input handler ทำงานเอง
     */
    if (active === input) return false;

    if (active) {
      const tag = String(active.tagName || '').toUpperCase();
      if (active.closest && active.closest('.swal2-container')) return false;
      if (active.id === 'workflowSearchInput') return false;
      if (tag === 'TEXTAREA' || tag === 'SELECT') return false;
      if (tag === 'INPUT') return false;
    }

    return true;
  }

  function setEntryCodeInput(value, options) {
    const input = byId('entryCodeInput');
    if (!input) return;

    input.value = String(value || '');

    const config = options && typeof options === 'object' ? options : {};
    if (config.focus !== false && document.activeElement !== input) {
      try { input.focus({preventScroll: true}); } catch (error) { input.focus(); }
    }

    const cursor = input.value.length;
    try { input.setSelectionRange(cursor, cursor); } catch (error) {}
  }

  function handlePointerIntent(event) {
    const target = event.target;
    if (!target) return;

    if (
      target.closest('.scanner-card') ||
      target.closest('#manualLookupForm') ||
      target.closest('#startCameraButton') ||
      target.closest('#stopCameraButton') ||
      target.closest('.swal2-container')
    ) {
      return;
    }

    pauseScanFocus();
  }

  function pauseScanFocus(durationMs) {
    state.suppressFocusUntil = Date.now() + (Number(durationMs) || FOCUS_SUPPRESS_MS);
  }

  function shouldFocusCodeInput(force) {
    if (force === true) return true;
    if (Date.now() < state.suppressFocusUntil) return false;

    const active = document.activeElement;
    if (!active) return true;
    if (active.id === 'workflowSearchInput') return false;
    if (active.tagName === 'SELECT') return false;
    if (active.closest && active.closest('.inbound-right')) return false;
    return true;
  }

  function focusCodeInput(force) {
    if (!shouldFocusCodeInput(force)) return;
    const input = byId('entryCodeInput');
    if (!input || input.disabled) return;

    try { input.focus({preventScroll: true}); } catch (error) { input.focus(); }

    /*
     * ห้าม select() อัตโนมัติ
     * เพราะกล่องสแกนยิงรหัสเร็วมาก ถ้า select แทรกกลางจังหวะจะทำให้ข้อมูลหายหรือไม่เข้า
     */
    try {
      const cursor = String(input.value || '').length;
      input.setSelectionRange(cursor, cursor);
    } catch (error) {}
  }

  function looksLikeCompleteCode(code) {
    const value = normalizeCode(code);
    if (value.length < MIN_CODE_LENGTH) return false;

    /*
     * Auto ID หน้างานที่พบใช้รูปแบบ SK + ตัวเลขหลายหลัก เช่น SK02042159476
     * ไม่ควรรีบ process ตอนยังได้แค่บางส่วนของรหัส
     */
    if (/^SK\d{10,14}$/i.test(value)) return true;

    /*
     * กรณี QR/Barcode รูปแบบอื่น ให้รอความยาวอย่างน้อย 12 ตัวอักษร
     */
    return value.length >= 12 && /^[A-Z0-9_-]+$/i.test(value);
  }

  function normalizeCode(value) {
    return String(value || '')
      .trim()
      .replace(/^https?:\/\/[^?]+\?/i, '')
      .replace(/^.*(?:autoId|entryCode|code)=/i, '')
      .split(/[&#\s]/)[0]
      .trim()
      .toUpperCase();
  }

  function isDuplicateBlocked(code) {
    const until = state.recentCodes.get(code) || 0;
    return Date.now() < until;
  }

  function blockDuplicate(code, ms) {
    state.recentCodes.set(code, Date.now() + (Number(ms) || DUPLICATE_BLOCK_MS));
    if (state.scanner && typeof state.scanner.blockText === 'function') {
      state.scanner.blockText(code, Number(ms) || DUPLICATE_BLOCK_MS);
    }
    cleanupDuplicateMap();
  }

  function cleanupDuplicateMap() {
    const now = Date.now();
    state.recentCodes.forEach((until, code) => {
      if (until < now) state.recentCodes.delete(code);
    });
  }

  function countSummary(items) {
    const list = Array.isArray(items) ? items : [];
    const server = state.dashboardSummary && typeof state.dashboardSummary === 'object'
      ? state.dashboardSummary
      : null;
    const localSla = {
      normal: 0,
      warning: 0,
      critical: 0
    };

    list.forEach((item) => {
      const sla = calculateSlaState(item);
      if (!sla.enabled) return;
      if (sla.level === 'CRITICAL') localSla.critical += 1;
      else if (sla.level === 'WARNING') localSla.warning += 1;
      else localSla.normal += 1;
    });

    if (!(server && server.sla)) {
      state.slaSummary = localSla;
    }

    return {
      total: server ? Number(server.totalWorkflow) || 0 : list.length,
      waitingReceiving: server
        ? Number(server.waitingReceiving) || 0
        : list.filter((item) => item.statusCode === 'DOCUMENT_SUBMITTED').length,
      receivingCompleted: server
        ? Number(server.receivingCompleted) || 0
        : list.filter((item) => item.statusCode === 'RECEIVING_COMPLETED').length,
      documentReturned: server
        ? Number(server.documentReturned) || 0
        : list.filter((item) => item.statusCode === 'DOCUMENT_RETURNED').length,
      cancelled: server
        ? Number(server.cancelled) || 0
        : list.filter((item) => item.cancelled || item.statusCode === 'CANCELLED').length
    };
  }

  function calculateSlaState(item) {
    const statusCode = String(item && item.statusCode || '').trim().toUpperCase();
    const rules = state.effectiveSlaRules && typeof state.effectiveSlaRules === 'object'
      ? state.effectiveSlaRules
      : {};
    const rule = rules[statusCode];

    if (!rule || rule.configured !== true || rule.enabled !== true || item.cancelled) {
      return {
        enabled: false,
        level: 'NONE',
        label: '',
        elapsedMinutes: 0,
        elapsedText: '',
        percent: 0
      };
    }

    const baseTime =
      (statusCode === 'GATE_IN_ONLY' || statusCode === 'WAITING_DOCUMENT_SUBMISSION')
        ? item.gateInAt || item.updatedAt
        : statusCode === 'DOCUMENT_SUBMITTED'
          ? item.documentSubmittedAt || item.updatedAt || item.gateInAt
          : statusCode === 'RECEIVING_COMPLETED'
          ? item.receivingCompletedAt || item.updatedAt
          : statusCode === 'DOCUMENT_RETURNED'
            ? item.documentReturnedAt || item.updatedAt
            : item.updatedAt;

    const startedAt = dateToMs(baseTime);
    if (!startedAt) {
      return {
        enabled: true,
        level: 'NORMAL',
        label: rule.label || 'อยู่ในขั้นตอน',
        elapsedMinutes: 0,
        elapsedText: '-',
        percent: 0
      };
    }

    const elapsedMinutes =
      Math.max(
        0,
        Math.floor((Date.now() - startedAt) / 60000)
      );

    const warningMinutes =
      Number(rule.warningMinutes) || 0;

    const criticalMinutes =
      Number(rule.redMinutes ?? rule.criticalMinutes) || 0;

    let level = 'NORMAL';

    if (criticalMinutes && elapsedMinutes >= criticalMinutes) {
      level = 'CRITICAL';
    } else if (warningMinutes && elapsedMinutes >= warningMinutes) {
      level = 'WARNING';
    }

    const basePercent =
      criticalMinutes
        ? Math.min(100, Math.round((elapsedMinutes / criticalMinutes) * 100))
        : warningMinutes
          ? Math.min(100, Math.round((elapsedMinutes / warningMinutes) * 100))
          : 0;

    return {
      enabled: true,
      level,
      label:
        level === 'CRITICAL'
          ? 'เกินเวลา'
          : level === 'WARNING'
            ? 'ใกล้เกินเวลา'
            : rule.label || 'ปกติ',
      elapsedMinutes,
      elapsedText:
        elapsedMinutes >= 60
          ? Math.floor(elapsedMinutes / 60) + ' ชม. ' + (elapsedMinutes % 60) + ' นาที'
          : elapsedMinutes + ' นาที',
      percent:
        Math.max(4, basePercent)
    };
  }

  function displayLatestTime(item) {
    return item.documentReturnedAt || item.receivingCompletedAt || item.documentSubmittedAt || item.gateInAt || item.updatedAt || '';
  }

  function statusName(code) {
    const value = String(code || '').toUpperCase();
    if (value === 'DOCUMENT_SUBMITTED') return 'รอรับสินค้า';
    if (value === 'RECEIVING_COMPLETED') return 'รอรับเอกสารคืน';
    if (value === 'DOCUMENT_RETURNED') return 'คืนเอกสารแล้ว';
    if (value === 'GATE_OUT_COMPLETED') return 'ออกคลังแล้ว';
    if (value === 'CANCELLED') return 'ยกเลิก';
    if (value === 'GATE_IN_ONLY' || value === 'WAITING_DOCUMENT_SUBMISSION') return 'รอยื่นเอกสาร';
    return value || 'รอยื่นเอกสาร';
  }

  function formatPlate(item) {
    return text(item.registration || item.plate || '-');
  }

  function formatPlateWithProvince(item) {
    const plate = formatPlate(item);
    const province = text(item && item.province);
    return [plate && plate !== '-' ? plate : '', province].filter(Boolean).join(' · ') || '-';
  }

  function fieldHtml(label, value) {
    return `<div class="result-field"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || '-')}</strong></div>`;
  }

  function selectedField(label, value) {
    return `<div class="selected-field"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || '-')}</strong></div>`;
  }

  function setLookupBusy(isBusy) {
    const input = byId('entryCodeInput');
    const button = byId('lookupCodeButton');
    if (input) input.disabled = Boolean(isBusy);
    if (button) button.disabled = Boolean(isBusy);
  }

  function setScanMessage(message, mode) {
    const element = byId('scanMessage');
    if (!element) return;
    element.textContent = message || '';
    element.dataset.state = mode || 'IDLE';
  }

  function setScannerStatus(message, mode) {
    const element = byId('scannerStatus');
    if (!element) return;
    element.textContent = message || '';
    element.dataset.state = mode || 'IDLE';
  }

  function setConnection(message, mode) {
    const element = byId('inboundConnection');
    if (!element) return;
    element.textContent = message || '';
    element.dataset.state = mode || 'LOADING';
  }

  function showLoading(show) {
    byId('inboundLoading')?.classList.toggle('is-hidden', !show);
  }

  function startClock() {
    updateClock();
    state.clockTimer = window.setInterval(updateClock, 1000);
  }

  function updateClock() {
    setText('inboundDateTime', formatBangkokDateTime(new Date()));
  }

  function formatBangkokDateTime(date) {
    const value = date instanceof Date ? date : new Date(date);
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Bangkok',
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }).formatToParts(value).reduce((acc, item) => {
      acc[item.type] = item.value;
      return acc;
    }, {});
    return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}:${parts.second}`;
  }

  function dateToMs(value) {
    if (!value) return 0;
    const textValue = String(value).trim();
    const match = textValue.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/);
    if (match) {
      return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4]), Number(match[5]), Number(match[6])).getTime();
    }
    const ms = Date.parse(textValue);
    return Number.isFinite(ms) ? ms : 0;
  }

  function unlockAudio() {
    if (state.audioUnlocked) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      state.audioContext = state.audioContext || new AudioContext();
      if (state.audioContext.state === 'suspended') state.audioContext.resume();
      state.audioUnlocked = true;
    } catch (error) {}
  }

  function beep(type) {
    try {
      unlockAudio();
      const ctx = state.audioContext;
      if (!ctx) return;
      const now = ctx.currentTime;
      const volume = type === 'error' ? 0.62 : type === 'success' ? 0.58 : type === 'scan' ? 0.52 : 0.42;
      const freqs = type === 'success' ? [880, 1175] : type === 'error' ? [260, 180] : type === 'duplicate' ? [420] : type === 'warn' ? [520, 420] : [980];
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = freq;
        const start = now + index * 0.08;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.095);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.11);
      });
    } catch (error) {}
  }

  async function logout() {
    try {
      if (API && typeof API.logout === 'function') await API.logout();
    } catch (error) {}
    try { window.sessionStorage.removeItem('alertvendor_access_token'); } catch (error) {}
    try { window.localStorage.removeItem('alertvendor_access_token'); } catch (error) {}
    redirectToLogin();
  }

  function redirectToLogin() {
    window.location.replace(CONFIG.LOGIN_URL || './login.html');
  }

  function destroy() {
    window.clearInterval(state.clockTimer);
    window.clearInterval(state.dashboardPollTimer);
    window.clearTimeout(state.inputTimer);
    window.clearTimeout(state.queueRefreshTimer);
    window.clearTimeout(state.fastQueueFlushTimer);

    if (state.queueUnsubscribe) {
      try { state.queueUnsubscribe(); } catch (error) {}
      state.queueUnsubscribe = null;
    }

    if (PENDING_QUEUE && typeof PENDING_QUEUE.stopAutoFlush === 'function') {
      PENDING_QUEUE.stopAutoFlush();
    }

    window.removeEventListener('online', handleNetworkOnline);
    window.removeEventListener('offline', handleNetworkOffline);
    window.removeEventListener('inboundqueueoperation', handleQueueOperationEvent);
    window.removeEventListener(
      'alertvendor:foreground-write-change',
      handleForegroundWriteChange
    );
    stopCamera();
  }

  function normalizeRole(value) {
    const role = String(value || '').trim().toUpperCase();
    if (role === 'ADMIN') return 'ADMIN';
    if (role === 'INBOUND') return 'INBOUND';
    return 'USER';
  }

  function showAlert(title, message, icon) {
    if (window.Swal) {
      return window.Swal.fire({title, text: message, icon: icon || 'info', confirmButtonText: 'ตกลง'});
    }
    window.alert(title + '\n' + message);
    return Promise.resolve();
  }


  function clampInteger(value, minimum, maximum, fallback) {
    const number = Math.floor(Number(value));
    if (!Number.isFinite(number)) return fallback;
    return Math.min(Math.max(number, minimum), maximum);
  }

  function debounce(fn, delay) {
    let timer = 0;
    return function (...args) {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => fn.apply(this, args), Number(delay) || 120);
    };
  }

  function byId(id) { return document.getElementById(id); }
  function setText(id, value) { const el = byId(id); if (el) el.textContent = String(value ?? ''); }

  function composeDriverName(primary, secondary, fallback) {
    const first = primary && typeof primary === 'object' ? primary : {};
    const second = secondary && typeof secondary === 'object' ? secondary : {};

    const direct = text(
      first.driverName ||
      first.personName ||
      first.fullName ||
      first['ชื่อ พขร.'] ||
      first['ชื่อผู้ขับ'] ||
      first['ชื่อคนขับ'] ||
      second.driverName ||
      second.personName ||
      second.fullName ||
      second['ชื่อ พขร.'] ||
      second['ชื่อผู้ขับ'] ||
      second['ชื่อคนขับ']
    );

    if (direct) {
      return direct;
    }

    const prefix = text(
      first.prefix ||
      first.title ||
      first['คำนำหน้า'] ||
      first['คำนำหน้า '] ||
      second.prefix ||
      second.title ||
      second['คำนำหน้า'] ||
      second['คำนำหน้า ']
    );

    const firstName = text(
      first.firstName ||
      first.name ||
      first.driverFirstName ||
      first['ชื่อ'] ||
      second.firstName ||
      second.name ||
      second.driverFirstName ||
      second['ชื่อ']
    );

    const lastName = text(
      first.lastName ||
      first.surname ||
      first.driverLastName ||
      first['สกุล'] ||
      first['นามสกุล'] ||
      second.lastName ||
      second.surname ||
      second.driverLastName ||
      second['สกุล'] ||
      second['นามสกุล']
    );

    return text(
      [prefix, firstName, lastName].filter(Boolean).join(' ') ||
      fallback ||
      ''
    );
  }

  function text(value) { return value === null || value === undefined ? '' : String(value).trim(); }
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function errorMessage(error) {
    return String(error && (error.message || error.details && error.details.message) || error || 'เกิดข้อผิดพลาด');
  }
  function createClientError(code, message) {
    const error = new Error(message || code);
    error.code = code;
    return error;
  }
})(window, document);
