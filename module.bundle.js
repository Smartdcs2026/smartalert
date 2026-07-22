/* ROUND4_HOTFIX5_RECEIVING_INSTANT_UI: 2026.07.22 */
/* SMARTALERT_AUTOMATIC_HANDOVER_ONLY_BUILD: 2026.07.22 */
/* PROFILE_AWARE_TIMING_R1_BUILD: 2026.07.21 */
/* SMARTALERT BASELINE 2 FINAL HOTFIX 5 — PROFILE-AWARE MODULE
 * Build: 2026.07.21-baseline2-final-hotfix5-optional-inbound-v1
 * Gate In can route directly to Receiving when submit scan is disabled.
 */

/*
 * AlertVendor Consolidated Bundle
 * Output: github-pages/module.bundle.js
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
                25000
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
 * SOURCE 03: module-data-bridge(8).js
 * ============================================================ */
/**
 * module-data-bridge.js
 * PHASE 3A — Unified Operational Board Data Bridge
 *
 * แหล่งข้อมูลหลักของหน้า Module ต้องเป็น Operational Board เท่านั้น
 * ไฟล์นี้เก็บ Snapshot เต็มเพื่อให้ Detail/Controller อื่นอ่านข้อมูลชุดเดียวกัน
 */
(function (window, document) {
  'use strict';

  const state = {
    installed: false,
    installTimer: null,
    records: [],
    module: null,
    board: null,
    generatedAt: '',
    updatedAt: 0,
    serverOffsetMs: 0,
    source: 'NONE'
  };

  installWhenReady();

  function installWhenReady() {
    const api = window.VehicleAPI;

    if (!api) {
      state.installTimer = window.setTimeout(installWhenReady, 30);
      return;
    }

    wrapMethod(api, 'getOperationalBoard', 'OPERATIONAL_BOARD');

    /* Legacy capture only. Production page must not call this method. */
    wrapMethod(api, 'getRecords', 'LEGACY_RECORDS');

    state.installed = true;
  }

  function wrapMethod(api, methodName, sourceName) {
    const current = api && api[methodName];

    if (typeof current !== 'function' || current.__phase3aDataBridge) {
      return;
    }

    const original = current.bind(api);
    const wrapped = async function (...args) {
      const result = await original(...args);
      captureResult(result, sourceName);
      return result;
    };

    wrapped.__phase3aDataBridge = true;
    wrapped.__original = original;
    api[methodName] = wrapped;
  }

  function captureResult(result, sourceName) {
    if (!result || typeof result !== 'object') {
      return;
    }

    state.records = Array.isArray(result.records)
      ? result.records.slice()
      : [];

    state.module = result.module && typeof result.module === 'object'
      ? { ...(state.module || {}), ...result.module }
      : state.module;

    state.board = sourceName === 'OPERATIONAL_BOARD'
      ? result
      : state.board;

    state.generatedAt = String(result.generatedAt || '');
    state.updatedAt = Date.now();
    state.source = sourceName;

    const generatedMs = parseDateTime(state.generatedAt);
    state.serverOffsetMs = Number.isFinite(generatedMs)
      ? generatedMs - Date.now()
      : 0;

    const detail = {
      count: state.records.length,
      generatedAt: state.generatedAt,
      updatedAt: state.updatedAt,
      source: state.source,
      integrity: result.integrity || null,
      cached: result.cached === true
    };

    document.dispatchEvent(new CustomEvent('alertvendor:records-updated', { detail }));
    window.dispatchEvent(new CustomEvent('alertvendor:records-updated', { detail }));
  }

  function parseDateTime(value) {
    const text = String(value || '').trim();
    const thaiMatch = text.match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/
    );

    if (thaiMatch) {
      return new Date(
        Number(thaiMatch[3]),
        Number(thaiMatch[2]) - 1,
        Number(thaiMatch[1]),
        Number(thaiMatch[4]),
        Number(thaiMatch[5]),
        Number(thaiMatch[6])
      ).getTime();
    }

    const parsed = Date.parse(text);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function getRecords() {
    return state.records.slice();
  }

  function getModule() {
    return state.module ? { ...state.module } : null;
  }

  function getBoard() {
    return state.board || null;
  }

  function getNowMs() {
    return Date.now() + Number(state.serverOffsetMs || 0);
  }

  function getSnapshot() {
    return {
      records: getRecords(),
      module: getModule(),
      board: getBoard(),
      generatedAt: state.generatedAt,
      updatedAt: state.updatedAt,
      serverOffsetMs: state.serverOffsetMs,
      source: state.source
    };
  }

  window.AlertVendorRecordBridge = {
    getRecords,
    getModule,
    getBoard,
    getNowMs,
    getSnapshot,
    isReady: () => state.source === 'OPERATIONAL_BOARD',
    get updatedAt() { return state.updatedAt; },
    get source() { return state.source; }
  };

})(window, document);


/* ============================================================
 * SOURCE 04: module-stability(5).js
 * ============================================================ */
/**
 * module-stability.js
 * ROUND 29 — Interaction and Timeline Stability
 *
 * ต้องโหลดหลัง api.js และก่อน module.js
 */
(function (window, document) {
  'use strict';

  const API =
    window.VehicleAPI;

  const state = {
    refreshDepth: 0,
    refreshWindowUntil: 0,
    preRefreshScrollLeft: 0,
    preRefreshWindowY: 0,
    userIntentUntil: 0,
    globalScrollTimer: null,
    initialSettled: false,
    restoring: false,
    timeline: null,
    observer: null,
    restoreRaf: null,
    restoreTimer: null,
    lastMovementSignature: '',
    lastMovementGeneratedAt: '',
    lastMovementGeneratedAtEpochMs: null
  };

  wrapApiRefresh(
    'getRecords'
  );

  wrapApiRefresh(
    'getOperationalBoard'
  );

  wrapApiRefresh(
    'getMovementSummary',
    stabilizeMovementGeneratedAt
  );

  document.addEventListener(
    'DOMContentLoaded',
    initializeTimelineStability
  );

  window.addEventListener(
    'beforeunload',
    destroyTimelineStability
  );

  function wrapApiRefresh(
    methodName,
    transformResult
  ) {
    if (
      !API ||
      typeof API[methodName] !==
        'function' ||
      API[methodName]
        .__round29Wrapped
    ) {
      return;
    }

    const original =
      API[methodName].bind(
        API
      );

    const wrapped =
      async function (...args) {
        if (methodName === 'getRecords' || methodName === 'getOperationalBoard') {
          await waitForUserScrollIdle();
        }

        beginRefreshWindow();

        try {
          const result =
            await original(
              ...args
            );

          return typeof transformResult ===
            'function'
              ? transformResult(
                  result
                )
              : result;

        } finally {
          endRefreshWindow();
        }
      };

    wrapped.__round29Wrapped =
      true;

    API[methodName] =
      wrapped;
  }


  function beginRefreshWindow() {
    state.refreshDepth += 1;

    const timeline =
      state.timeline ||
      document.getElementById(
        'hourlyTimeline'
      );

    if (timeline) {
      state.preRefreshScrollLeft =
        timeline.scrollLeft;
    }

    state.preRefreshWindowY =
      window.scrollY;
  }


  function endRefreshWindow() {
    state.refreshDepth =
      Math.max(
        0,
        state.refreshDepth - 1
      );

    /*
     * Promise ของ API จบก่อน module.js วาด DOM
     * จึงเปิดช่วงป้องกันต่ออีกเล็กน้อย
     */
    state.refreshWindowUntil =
      Date.now() + 1400;

    if (Date.now() > state.userIntentUntil) {
      window.setTimeout(restoreTimelinePosition, 0);
      window.setTimeout(restoreTimelinePosition, 80);
      window.setTimeout(restoreTimelinePosition, 260);
    }
  }


  function stabilizeMovementGeneratedAt(
    result
  ) {
    if (
      !result ||
      typeof result !==
        'object'
    ) {
      return result;
    }

    const signature =
      stableMovementSignature(
        result
      );

    if (
      signature ===
        state.lastMovementSignature &&
      state.lastMovementGeneratedAt
    ) {
      return {
        ...result,
        generatedAt:
          state.lastMovementGeneratedAt,
        generatedAtEpochMs:
          state
            .lastMovementGeneratedAtEpochMs
      };
    }

    state.lastMovementSignature =
      signature;

    state.lastMovementGeneratedAt =
      result.generatedAt || '';

    state.lastMovementGeneratedAtEpochMs =
      result.generatedAtEpochMs ||
      null;

    return result;
  }


  function stableMovementSignature(
    result
  ) {
    return JSON.stringify({
      thresholds:
        result.thresholds || {},
      currentState:
        stableCurrentState(
          result.currentState
        ),
      currentRound:
        stableMetric(
          result.currentRound
        ),
      today:
        stableMetric(
          result.today
        ),
      rolling24:
        stableMetric(
          result.rolling24
        ),
      hours:
        stableHours(
          result.hours
        )
    });
  }


  function stableCurrentState(source) {
    const value =
      source &&
      typeof source ===
        'object'
        ? source
        : {};

    return {
      activeNow:
        Number(
          value.activeNow
        ) || 0,
      normal:
        Number(
          value.normal
        ) || 0,
      warning:
        Number(
          value.warning
        ) || 0,
      overdue:
        Number(
          value.overdue
        ) || 0,
      incomplete:
        Number(
          value.incomplete
        ) || 0,
      nearAutoClose:
        Number(
          value.nearAutoClose
        ) || 0
    };
  }


  function stableMetric(source) {
    const value =
      source &&
      typeof source ===
        'object'
        ? source
        : {};

    return {
      in:
        Number(value.in) || 0,
      outReal:
        Number(
          value.outReal
        ) || 0,
      outAuto:
        Number(
          value.outAuto
        ) || 0,
      outTotal:
        Number(
          value.outTotal
        ) || 0,
      total:
        Number(
          value.total ||
          value.movementTotal
        ) || 0,
      net:
        Number(value.net) || 0
    };
  }


  function stableHours(source) {
    const value =
      source &&
      typeof source ===
        'object'
        ? source
        : {};

    const result = {};

    Object.keys(value)
      .sort()
      .forEach(
        (key) => {
          result[key] =
            (
              Array.isArray(
                value[key]
              )
                ? value[key]
                : []
            ).map(
              (hour) => ({
                startEpochMs:
                  Number(
                    hour.startEpochMs ||
                    hour.startMs
                  ) || 0,
                label:
                  String(
                    hour.label ||
                    hour.hourLabel ||
                    hour.hour ||
                    ''
                  ),
                in:
                  Number(
                    hour.in
                  ) || 0,
                outReal:
                  Number(
                    hour.outReal
                  ) || 0,
                outAuto:
                  Number(
                    hour.outAuto
                  ) || 0,
                outTotal:
                  Number(
                    hour.outTotal
                  ) || 0,
                net:
                  Number(
                    hour.net
                  ) || 0
              })
            );
        }
      );

    return result;
  }


  function initializeTimelineStability() {
    state.timeline =
      document.getElementById(
        'hourlyTimeline'
      );

    if (!state.timeline) {
      return;
    }

    const markUserIntent =
      () => {
        state.userIntentUntil =
          Date.now() + 2600;

        state.preRefreshScrollLeft =
          state.timeline.scrollLeft;

        state.preRefreshWindowY =
          window.scrollY;
      };

    [
      'pointerdown',
      'touchstart',
      'wheel',
      'keydown'
    ].forEach(
      (eventName) => {
        state.timeline.addEventListener(
          eventName,
          markUserIntent,
          {
            passive:
              eventName !==
              'keydown'
          }
        );
      }
    );

    document
      .getElementById(
        'moduleHourlyDetailToggle'
      )
      ?.addEventListener(
        'pointerdown',
        markUserIntent,
        {
          passive: true
        }
      );

    state.timeline.addEventListener(
      'scroll',
      () => {
        if (!state.restoring) {
          state.preRefreshScrollLeft =
            state.timeline.scrollLeft;
        }
      },
      {
        passive: true
      }
    );

    window.addEventListener(
      'scroll',
      rememberWindowScroll,
      { passive: true }
    );

    ['wheel','touchstart','touchmove','pointerdown','keydown'].forEach((eventName) => {
      window.addEventListener(
        eventName,
        markGlobalUserIntent,
        { passive: eventName !== 'keydown' }
      );
    });

    /*
     * ป้องกัน scrollIntoView ที่เกิดจาก Silent Refresh
     * แต่ยังอนุญาตเมื่อผู้ใช้กด/ลาก Timeline เอง
     */
    patchScrollIntoView();

    state.observer =
      new MutationObserver(
        () => {
          if (
            !state.initialSettled ||
            !isRefreshWindow()
          ) {
            return;
          }

          scheduleTimelineRestore();
        }
      );

    state.observer.observe(
      state.timeline,
      {
        childList: true,
        subtree: true
      }
    );

    window.setTimeout(
      () => {
        state.initialSettled = true;
        state.preRefreshScrollLeft =
          state.timeline.scrollLeft;
        state.preRefreshWindowY =
          window.scrollY;
      },
      2200
    );
  }


  function markGlobalUserIntent() {
    state.userIntentUntil = Date.now() + 700;

    if (!state.restoring) {
      state.preRefreshWindowY = window.scrollY;
    }

    document.body.classList.add('is-user-scrolling');

    if (state.globalScrollTimer) {
      window.clearTimeout(state.globalScrollTimer);
    }

    state.globalScrollTimer = window.setTimeout(() => {
      state.globalScrollTimer = null;
      state.preRefreshWindowY = window.scrollY;
      document.body.classList.remove('is-user-scrolling');
    }, 180);
  }


  async function waitForUserScrollIdle() {
    const startedAt = Date.now();

    while (
      Date.now() < state.userIntentUntil &&
      Date.now() - startedAt < 1200
    ) {
      await new Promise((resolve) => window.setTimeout(resolve, 80));
    }
  }


  function rememberWindowScroll() {
    if (state.restoring) return;
    markGlobalUserIntent();
  }

  function patchScrollIntoView() {
    const prototype =
      window.Element &&
      window.Element.prototype;

    if (
      !prototype ||
      prototype.scrollIntoView
        .__round29Wrapped
    ) {
      return;
    }

    const original =
      prototype.scrollIntoView;

    const wrapped =
      function (...args) {
        const insideTimeline =
          state.timeline &&
          (
            this === state.timeline ||
            state.timeline.contains(
              this
            )
          );

        if (
          insideTimeline &&
          state.initialSettled &&
          isRefreshWindow() &&
          Date.now() >
            state.userIntentUntil
        ) {
          scheduleTimelineRestore();
          return;
        }

        return original.apply(
          this,
          args
        );
      };

    wrapped.__round29Wrapped =
      true;

    prototype.scrollIntoView =
      wrapped;
  }


  function isRefreshWindow() {
    return (
      state.refreshDepth > 0 ||
      Date.now() <
        state.refreshWindowUntil
    );
  }


  function scheduleTimelineRestore() {
    if (state.restoreRaf) {
      window.cancelAnimationFrame(
        state.restoreRaf
      );
    }

    state.restoreRaf =
      window.requestAnimationFrame(
        () => {
          state.restoreRaf =
            window.requestAnimationFrame(
              restoreTimelinePosition
            );
        }
      );

    if (state.restoreTimer) {
      window.clearTimeout(state.restoreTimer);
    }

    if (state.globalScrollTimer) {
      window.clearTimeout(state.globalScrollTimer);
    }

    state.restoreTimer =
      window.setTimeout(
        restoreTimelinePosition,
        180
      );
  }


  function restoreTimelinePosition() {
    if (
      !state.timeline ||
      !state.initialSettled ||
      Date.now() <=
        state.userIntentUntil
    ) {
      return;
    }

    state.restoring = true;

    const maxLeft =
      Math.max(
        0,
        state.timeline.scrollWidth -
        state.timeline.clientWidth
      );

    state.timeline.scrollLeft =
      Math.min(
        maxLeft,
        Math.max(
          0,
          state.preRefreshScrollLeft
        )
      );

    if (
      !document.querySelector('.swal2-container') &&
      Date.now() > state.userIntentUntil &&
      Math.abs(window.scrollY - state.preRefreshWindowY) > 24
    ) {
      window.scrollTo({
        top: state.preRefreshWindowY,
        left: window.scrollX,
        behavior: 'auto'
      });
    }

    window.requestAnimationFrame(
      () => {
        state.restoring = false;
      }
    );
  }


  function destroyTimelineStability() {
    if (state.observer) {
      state.observer.disconnect();
    }

    if (state.restoreRaf) {
      window.cancelAnimationFrame(
        state.restoreRaf
      );
    }

    if (state.restoreTimer) {
      window.clearTimeout(
        state.restoreTimer
      );
    }

    window.removeEventListener(
      'scroll',
      rememberWindowScroll
    );
  }

})(window, document);


/* ============================================================
 * SOURCE 05: module-operations(5).js
 * ============================================================ */
/**
 * module-operations.js
 * ROUND 55 — Dedicated Styled Record Detail SweetAlert
 * PRODUCTION R19 — OPERATIONAL ALERT user control
 *
 * - แสดงเลขนัดหมายและทะเบียนอย่างชัดเจน
 * - แสดงเวลา Gate In, ระยะเวลารวม, เวลาเกิน SLA และขั้นตอน
 * - สร้างเสียงเตือนด้วย Web Audio โดยไม่ต้องมีไฟล์เสียง
 * - ป้องกันเสียงดังซ้ำจาก Silent Refresh
 */
(function (window, document) {
  'use strict';

  const AUDIO_STORAGE_KEY =
    'ALERT_VENDOR_OVERDUE_SOUND_V1';

  const SOUND_COOLDOWN_MS =
    10 * 60 * 1000;

  const VIBRATION_STORAGE_KEY =
    'ALERT_VENDOR_OVERDUE_VIBRATION_V1';

  const VIBRATION_COOLDOWN_MS =
    10 * 60 * 1000;

  /*
   * เก็บ Snapshot ที่ผู้ใช้กด “รับทราบ” ล่าสุด
   * เพื่อแยก “รายการทั้งหมด” กับ “รายการใหม่ในรอบนี้”
   */
  const OVERDUE_ACK_STORAGE_KEY =
    'ALERT_VENDOR_OVERDUE_ACK_SNAPSHOT_V1';

  const state = {
    observer: null,
    swalTimer: null,
    audioContext: null,
    audioUnlocked: false,
    pendingAudio: false,
    activeAlertSignature: '',
    lastPlayedSignature: '',
    lastPlayedAt: 0,
    lastVibratedSignature: '',
    lastVibratedAt: 0,
    acknowledgedOverdueKeys:
      new Set(),
    currentOverdueRecords:
      new Map(),
    originalSwalFire:
      null,
    destroyed: false
  };

  document.addEventListener(
    'DOMContentLoaded',
    initialize
  );

  window.addEventListener(
    'beforeunload',
    destroy
  );


  function initialize() {
    restoreSoundState();
    restoreVibrationState();
    restoreOverdueAcknowledgement();
    annotateVehicleCards();
    observeVehicleList();
    bindAudioUnlock();
    patchSweetAlertWhenReady();

    document.addEventListener(
      'alertvendor:records-updated',
      annotateVehicleCards
    );

    document.addEventListener(
      'alertvendor:operational-alert-changed',
      handleOperationalAlertSetting
    );
  }


  function observeVehicleList() {
    const list =
      document.getElementById(
        'vehicleList'
      );

    if (!list) {
      return;
    }

    state.observer =
      new MutationObserver(
        debounce(
          annotateVehicleCards,
          80
        )
      );

    state.observer.observe(
      list,
      {
        childList: true,
        subtree: true
      }
    );
  }


  function annotateVehicleCards() {
    document
      .querySelectorAll(
        '.vehicle-card[data-record-id]'
      )
      .forEach(
        (card) => {
          card
            .querySelectorAll(
              '.vehicle-field'
            )
            .forEach(
              (field) => {
                const label =
                  normalize(
                    text(
                      field.querySelector(
                        'span'
                      )
                    )
                  );

                let role =
                  'OTHER';

                if (
                  matches(
                    label,
                    [
                      'เลขนัดหมาย',
                      'หมายเลขนัดหมาย',
                      'นัดหมาย',
                      'appointment',
                      'booking'
                    ]
                  )
                ) {
                  role =
                    'APPOINTMENT';
                } else if (
                  matches(
                    label,
                    [
                      'ทะเบียน',
                      'ทะเบียนรถ',
                      'registration',
                      'plate',
                      'เลขตู้',
                      'container'
                    ]
                  )
                ) {
                  role =
                    'REGISTRATION';
                } else if (
                  matches(
                    label,
                    [
                      'ชื่อ',
                      'driver',
                      'คนขับ',
                      'ผู้ขับ'
                    ]
                  )
                ) {
                  role =
                    'DRIVER';
                }

                field.dataset
                  .operationalRole =
                  role;
              }
            );
        }
      );
  }


  function patchSweetAlertWhenReady() {
    if (state.destroyed) {
      return;
    }

    if (
      !window.Swal ||
      typeof window.Swal.fire !==
        'function'
    ) {
      state.swalTimer =
        window.setTimeout(
          patchSweetAlertWhenReady,
          120
        );

      return;
    }

    if (
      window.Swal.fire
        .__round45Patched
    ) {
      return;
    }

    const original =
      window.Swal.fire.bind(
        window.Swal
      );

    state.originalSwalFire =
      original;

    const wrapped =
      function (...args) {
        const options =
          normalizeSwalOptions(
            args
          );

        const marker =
          [
            options.title,
            options.text,
            options.html
          ]
            .map(
              (value) =>
                String(
                  value ||
                  ''
                )
            )
            .join(' ');

        const records =
          collectOverdueRecords();

        if (
          isOverdueAlert(
            marker
          ) &&
          records.length > 0
        ) {
          if (!isOperationalAlertEnabled()) {
            return Promise.resolve({
              isConfirmed: false,
              isDenied: false,
              isDismissed: true,
              dismiss:
                'operational-alert-disabled'
            });
          }

          return original(
            enhanceOverdueAlert(
              options,
              records
            )
          );
        }

        return original(
          ...args
        );
      };

    wrapped.__round45Patched =
      true;

    window.Swal.fire =
      wrapped;
  }


  function normalizeSwalOptions(
    args
  ) {
    if (
      args[0] &&
      typeof args[0] ===
        'object'
    ) {
      return {
        ...args[0]
      };
    }

    return {
      title:
        args[0] || '',
      text:
        args[1] || '',
      icon:
        args[2] || undefined
    };
  }


  function isOverdueAlert(
    marker
  ) {
    const value =
      String(
        marker ||
        ''
      );

    return (
      value.includes(
        'พบรถอยู่ในพื้นที่เกินกำหนด'
      ) ||
      value.includes(
        'อยู่ในพื้นที่เกินกำหนด'
      ) ||
      value.includes(
        'รถ/ตู้เกินเวลา'
      ) ||
      value.includes(
        'รายการเกิน SLA'
      ) ||
      value.includes(
        'พบรถอยู่ในพื้นที่เกินเวลา'
      )
    );
  }


  function isOperationalAlertEnabled() {
    const controller =
      window.AlertVendorOperationalAlert;

    if (
      !controller ||
      typeof controller.isEnabled !==
        'function'
    ) {
      return true;
    }

    try {
      return controller.isEnabled() !== false;
    } catch (error) {
      return true;
    }
  }

  function handleOperationalAlertSetting(
    event
  ) {
    const enabled =
      !event ||
      !event.detail ||
      event.detail.enabled !== false;

    if (enabled) {
      return;
    }

    state.pendingAudio = false;
    stopAlarmVibration();

    if (
      state.audioContext &&
      state.audioContext.state ===
        'running' &&
      typeof state.audioContext.suspend ===
        'function'
    ) {
      state.audioContext
        .suspend()
        .catch(
          () => undefined
        );
    }

    const popup =
      document.querySelector(
        '.swal2-popup.av-overdue-popup-v50, .overdue-command-popup'
      );

    if (
      popup &&
      window.Swal &&
      typeof window.Swal.close ===
        'function'
    ) {
      window.Swal.close();
    }
  }

  function enhanceOverdueAlert(
    source,
    records
  ) {
    const oldDidOpen =
      source.didOpen;

    const oldWillClose =
      source.willClose;

    const oldPreConfirm =
      source.preConfirm;

    const alertModel =
      createOverdueAlertModel(
        records
      );

    const automaticSignature =
      buildAlertSignature(
        alertModel.newRecords
      );

    const manualSignature =
      buildAlertSignature(
        records
      );

    state.activeAlertSignature =
      manualSignature;

    state.currentOverdueRecords =
      new Map(
        records.map(
          (record) => [
            String(
              record.recordId ||
              ''
            ),
            record
          ]
        )
      );

    return {
      ...source,

      icon:
        undefined,
      iconHtml:
        '',
      title:
        '',
      text:
        '',

      html:
        buildOverdueHtml(
          alertModel
        ),

      confirmButtonText:
        'รับทราบ',
      showConfirmButton:
        true,
      showCloseButton:
        true,
      allowOutsideClick:
        false,
      allowEscapeKey:
        true,
      returnFocus:
        false,
      heightAuto:
        false,
      scrollbarPadding:
        false,
      width:
        'min(820px, calc(100vw - 14px))',
      padding:
        '0',

      customClass: {
        popup:
          'av-overdue-popup-v50',
        title:
          'av-overdue-hidden-title-v50',
        icon:
          'av-overdue-hidden-icon-v50',
        htmlContainer:
          'av-overdue-html-v50',
        actions:
          'av-overdue-actions-v50',
        confirmButton:
          'av-overdue-confirm-v50',
        closeButton:
          'av-overdue-close-v50'
      },

      preConfirm:
        async (...args) => {
          if (
            typeof oldPreConfirm ===
              'function'
          ) {
            const previousResult =
              await oldPreConfirm(
                ...args
              );

            if (
              previousResult ===
                false
            ) {
              return false;
            }
          }

          acknowledgeOverdueRecords(
            records
          );

          return true;
        },

      didOpen:
        (popup) => {
          const titleNode =
            popup.querySelector(
              '.swal2-title'
            );

          const iconNode =
            popup.querySelector(
              '.swal2-icon'
            );

          if (titleNode) {
            titleNode.style.display =
              'none';
          }

          if (iconNode) {
            iconNode.style.display =
              'none';
          }

          popup.style.height =
            'auto';

          popup.style.minHeight =
            '0';

          popup.style.maxWidth =
            'calc(100vw - 14px)';

          popup.style.overflow =
            'hidden';

          if (
            typeof oldDidOpen ===
              'function'
          ) {
            oldDidOpen(
              popup
            );
          }

          bindOverdueAlertActions(
            popup
          );

          if (
            source
              .suppressAutomaticFeedback !==
              true &&
            alertModel.newRecords
              .length > 0
          ) {
            requestAlarmFeedback(
              automaticSignature,
              false
            );
          }
        },

      willClose:
        (popup) => {
          state.pendingAudio =
            false;

          stopAlarmVibration();

          if (
            typeof oldWillClose ===
              'function'
          ) {
            oldWillClose(
              popup
            );
          }
        }
    };
  }

  function bindOverdueAlertActions(
    popup
  ) {
    popup
      .querySelectorAll(
        '[data-overdue-detail-record]'
      )
      .forEach(
        (button) => {
          button.addEventListener(
            'click',
            () => {
              openSeparateOverdueDetailAlert(
                button.dataset
                  .overdueDetailRecord
              );
            }
          );
        }
      );

    popup
      .querySelector(
        '[data-overdue-play-sound]'
      )
      ?.addEventListener(
        'click',
        () => {
          requestAlarmVibration(
            state.activeAlertSignature,
            true
          );

          unlockAudio()
            .then(
              () =>
                playAlarmSequence(
                  true
                )
            )
            .catch(
              () => undefined
            );
        }
      );
  }


  async function openSeparateOverdueDetailAlert(
    recordId
  ) {
    const id =
      String(
        recordId ||
        ''
      );

    const record =
      state.currentOverdueRecords.get(
        id
      );

    if (!record) {
      return;
    }

    const fire =
      state.originalSwalFire ||
      window.Swal.fire.bind(
        window.Swal
      );

    const result =
      await fire(
        buildSeparateOverdueDetailOptions(
          record
        )
      );

    if (
      result &&
      result.isConfirmed
    ) {
      reopenOverdueListAlert();
      return;
    }

    if (
      result &&
      result.isDenied
    ) {
      window.setTimeout(
        () => {
          scrollToRecord(
            id
          );
        },
        80
      );
    }
  }


  function reopenOverdueListAlert() {
    const records =
      Array.from(
        state.currentOverdueRecords
          .values()
      );

    if (
      records.length === 0
    ) {
      return;
    }

    const fire =
      state.originalSwalFire ||
      window.Swal.fire.bind(
        window.Swal
      );

    /*
     * ใช้ original Swal.fire โดยตรง ป้องกัน Wrapper
     * จับ Alert ของเราแล้วสร้างซ้ำอีกรอบ
     */
    fire(
      enhanceOverdueAlert(
        {
          title:
            'พบรถอยู่ในพื้นที่เกินกำหนด',

          suppressAutomaticFeedback:
            true
        },
        records
      )
    );
  }


  function buildSeparateOverdueDetailOptions(
    record
  ) {
    return {
      icon:
        undefined,
      iconHtml:
        '',
      title:
        '',
      text:
        '',

      html:
        buildSeparateOverdueDetailHtml(
          record
        ),

      showConfirmButton:
        true,
      confirmButtonText:
        'กลับไปดูรายการ',

      showDenyButton:
        true,
      denyButtonText:
        'ไปยังการ์ดในหน้าหลัก',

      showCloseButton:
        true,
      allowOutsideClick:
        false,
      allowEscapeKey:
        true,
      returnFocus:
        false,
      heightAuto:
        false,
      scrollbarPadding:
        false,
      width:
        'min(620px, calc(100vw - 12px))',
      padding:
        '0',

      customClass: {
        popup:
          'av-record-detail-popup-v55',
        title:
          'av-record-detail-hidden-v55',
        icon:
          'av-record-detail-hidden-v55',
        htmlContainer:
          'av-record-detail-html-v55',
        actions:
          'av-record-detail-actions-v55',
        confirmButton:
          'av-record-detail-back-v55',
        denyButton:
          'av-record-detail-main-v55',
        closeButton:
          'av-record-detail-close-v55'
      },

      didRender:
        (popup) => {
          applyRecordDetailPopupClasses(
            popup
          );
        },

      didOpen:
        (popup) => {
          applyRecordDetailPopupClasses(
            popup
          );
        }
    };
  }


  function applyRecordDetailPopupClasses(
    popup
  ) {
    if (!popup) {
      return;
    }

    popup.classList.add(
      'av-record-detail-popup-v55'
    );

    popup.style.width =
      'min(620px, calc(100vw - 12px))';

    popup.style.maxWidth =
      'calc(100vw - 12px)';

    popup.style.height =
      'auto';

    popup.style.minHeight =
      '0';

    popup.style.padding =
      '0';

    popup.style.overflow =
      'hidden';

    const titleNode =
      popup.querySelector(
        '.swal2-title'
      );

    const iconNode =
      popup.querySelector(
        '.swal2-icon'
      );

    const htmlNode =
      popup.querySelector(
        '.swal2-html-container'
      );

    const actionsNode =
      popup.querySelector(
        '.swal2-actions'
      );

    const confirmButton =
      popup.querySelector(
        '.swal2-confirm'
      );

    const denyButton =
      popup.querySelector(
        '.swal2-deny'
      );

    const closeButton =
      popup.querySelector(
        '.swal2-close'
      );

    if (titleNode) {
      titleNode.classList.add(
        'av-record-detail-hidden-v55'
      );

      titleNode.style.display =
        'none';
    }

    if (iconNode) {
      iconNode.classList.add(
        'av-record-detail-hidden-v55'
      );

      iconNode.style.display =
        'none';
    }

    htmlNode?.classList.add(
      'av-record-detail-html-v55'
    );

    actionsNode?.classList.add(
      'av-record-detail-actions-v55'
    );

    confirmButton?.classList.add(
      'av-record-detail-back-v55'
    );

    denyButton?.classList.add(
      'av-record-detail-main-v55'
    );

    closeButton?.classList.add(
      'av-record-detail-close-v55'
    );
  }


  function buildSeparateOverdueDetailHtml(
    record
  ) {
    const driver =
      String(
        record.driver ||
        ''
      ).trim();

    return `
      <article class="av-record-detail-layout-v55">
        <header class="av-record-detail-header-v55">
          <span>
            รายละเอียดรายการ
          </span>

          <strong>
            เลขนัดหมาย
            ${escapeHtml(
              record.appointment
            )}
          </strong>
        </header>

        <div class="av-record-detail-body-v55">
          <section class="av-record-detail-company-v55">
            <span>
              บริษัท / Vendor
            </span>

            <strong>
              ${escapeHtml(
                record.company
              )}
            </strong>
          </section>

          <section class="av-record-detail-grid-v55">
            <div class="av-record-detail-item-v55">
              <span>
                ทะเบียนรถ / หมายเลขตู้
              </span>

              <strong>
                ${escapeHtml(
                  record.registration
                )}
              </strong>
            </div>

            ${
              driver
                ? `
                    <div class="av-record-detail-item-v55">
                      <span>
                        ชื่อผู้ขับ
                      </span>

                      <strong>
                        ${escapeHtml(
                          driver
                        )}
                      </strong>
                    </div>
                  `
                : ''
            }

            <div class="av-record-detail-item-v55">
              <span>
                เวลา Gate In
              </span>

              <strong>
                ${escapeHtml(
                  record.gateIn
                )}
              </strong>
            </div>

            <div class="av-record-detail-item-v55">
              <span>
                เวลาอยู่ในพื้นที่
              </span>

              <strong>
                ${escapeHtml(
                  record.duration
                )}
              </strong>
            </div>

            <div class="av-record-detail-item-v55 is-overdue">
              <span>
                เกิน SLA แล้ว
              </span>

              <strong>
                ${escapeHtml(
                  record.overdueDuration
                )}
              </strong>
            </div>

            <div class="av-record-detail-item-v55">
              <span>
                ขั้นตอนปัจจุบัน
              </span>

              <strong>
                ${escapeHtml(
                  record.stage
                )}
              </strong>
            </div>
          </section>
        </div>
      </article>
    `;
  }

  function collectOverdueRecords() {
    const thresholdSeconds =
      getOverdueThresholdSeconds();

    const bridgeRecords =
      collectBridgeOverdueRecords(
        thresholdSeconds
      );

    /*
     * ใช้ข้อมูลจาก API ทั้งหมดเป็นแหล่งหลัก
     * จึงไม่กระทบเมื่อหน้าเลือก “ปกติ” หรือค้นหาอยู่
     */
    if (
      bridgeRecords.length > 0
    ) {
      return bridgeRecords;
    }

    /*
     * Fallback สำหรับกรณี Bridge ยังไม่พร้อม
     * เช่น เปิดไฟล์เก่าโดยไม่เพิ่ม module-data-bridge.js
     */
    return collectDomOverdueRecords(
      thresholdSeconds
    );
  }


  function collectBridgeOverdueRecords(
    thresholdSeconds
  ) {
    const bridge =
      window
        .AlertVendorRecordBridge;

    if (
      !bridge ||
      typeof bridge.getRecords !==
        'function'
    ) {
      return [];
    }

    const records =
      bridge.getRecords();

    if (
      !Array.isArray(
        records
      ) ||
      records.length === 0
    ) {
      return [];
    }

    const nowMs =
      typeof bridge.getNowMs ===
        'function'
        ? bridge.getNowMs()
        : Date.now();

    return records
      .filter(
        (record) => {
          if (
            !record ||
            record.isCurrentlyInArea ===
              false
          ) {
            return false;
          }

          const timestampMs =
            getRecordTimestampMs(
              record
            );

          if (
            !Number.isFinite(
              timestampMs
            )
          ) {
            return false;
          }

          const durationValue =
            Math.max(
              0,
              Math.floor(
                (
                  nowMs -
                  timestampMs
                ) /
                1000
              )
            );

          return (
            durationValue >=
            thresholdSeconds
          );
        }
      )
      .map(
        (record) =>
          mapBridgeRecord(
            record,
            thresholdSeconds,
            nowMs
          )
      )
      .sort(
        (left, right) =>
          right.durationSeconds -
          left.durationSeconds
      );
  }


  function mapBridgeRecord(
    record,
    thresholdSeconds,
    nowMs
  ) {
    const fields =
      Array.isArray(
        record.fields
      )
        ? record.fields
        : [];

    const recordId =
      String(
        record.recordId ||
        record.id ||
        ''
      );

    const timestampMs =
      getRecordTimestampMs(
        record
      );

    const durationValue =
      Math.max(
        0,
        Math.floor(
          (
            nowMs -
            timestampMs
          ) /
          1000
        )
      );

    const card =
      findVehicleCardByRecordId(
        recordId
      );

    const company =
      String(
        record.primaryValue ||
        findRawField(
          fields,
          [
            'บริษัท',
            'vendor',
            'company'
          ]
        ) ||
        'ไม่ระบุบริษัท'
      ).trim();

    const appointment =
      findRawField(
        fields,
        [
          'เลขนัดหมาย',
          'หมายเลขนัดหมาย',
          'นัดหมาย',
          'appointment',
          'booking'
        ]
      ) ||
      inferRawNumericField(
        fields
      ) ||
      '-';

    const registration =
      findRawField(
        fields,
        [
          'ทะเบียน',
          'ทะเบียนรถ',
          'registration',
          'plate',
          'เลขตู้',
          'หมายเลขตู้',
          'container'
        ]
      ) ||
      '-';

    const driver =
      findRawField(
        fields,
        [
          'ชื่อผู้ขับ',
          'ชื่อคนขับ',
          'พนักงานขับรถ',
          'driver',
          'ชื่อ'
        ]
      ) ||
      '';

    return {
      recordId,

      company,

      appointment,

      registration,

      driver,

      gateIn:
        String(
          record.timestampIn ||
          record.gateIn ||
          '-'
        ),

      duration:
        formatDuration(
          durationValue
        ),

      durationSeconds:
        durationValue,

      overdueDuration:
        formatDuration(
          Math.max(
            0,
            durationValue -
            thresholdSeconds
          )
        ),

      stage:
        getReceivingStageFromCard(
          card
        ) ||
        String(
          record.receivingStage ||
          record.stage ||
          'อยู่ในพื้นที่'
        ),

      details:
        extractRawFieldDetails(
          fields
        )
    };
  }


  function collectDomOverdueRecords(
    thresholdSeconds
  ) {
    return Array.from(
      document.querySelectorAll(
        '.vehicle-card[data-status="OVERDUE"][data-record-id]'
      )
    )
      .map(
        (card) => {
          const fields =
            Array.from(
              card.querySelectorAll(
                '.vehicle-field'
              )
            );

          const duration =
            text(
              card.querySelector(
                '.vehicle-card__timer'
              )
            ) ||
            '-';

          const durationValue =
            durationSeconds(
              duration
            );

          return {
            recordId:
              String(
                card.dataset.recordId ||
                ''
              ),

            company:
              text(
                card.querySelector(
                  '.vehicle-card__title'
                )
              ) ||
              text(
                card.querySelector(
                  '.vehicle-card__header strong'
                )
              ) ||
              'ไม่ระบุบริษัท',

            appointment:
              findField(
                fields,
                [
                  'เลขนัดหมาย',
                  'หมายเลขนัดหมาย',
                  'นัดหมาย',
                  'appointment',
                  'booking'
                ]
              ) ||
              inferNumericField(
                fields
              ) ||
              '-',

            registration:
              findField(
                fields,
                [
                  'ทะเบียน',
                  'ทะเบียนรถ',
                  'registration',
                  'plate',
                  'เลขตู้',
                  'container'
                ]
              ) ||
              '-',

            driver:
              findField(
                fields,
                [
                  'ชื่อผู้ขับ',
                  'ชื่อคนขับ',
                  'พนักงานขับรถ',
                  'driver',
                  'ชื่อ'
                ]
              ) ||
              '',

            gateIn:
              text(
                card.querySelector(
                  '.vehicle-in-time strong'
                )
              ) ||
              '-',

            duration,

            durationSeconds:
              durationValue,

            overdueDuration:
              formatDuration(
                Math.max(
                  0,
                  durationValue -
                  thresholdSeconds
                )
              ),

            stage:
              getReceivingStageFromCard(
                card
              ) ||
              'อยู่ในพื้นที่',

            details:
              extractVehicleFieldDetails(
                fields
              )
          };
        }
      )
      .sort(
        (left, right) =>
          right.durationSeconds -
          left.durationSeconds
      );
  }


  function getRecordTimestampMs(
    record
  ) {
    const epoch =
      Number(
        record &&
        record.timestampInEpochMs
      );

    if (
      Number.isFinite(
        epoch
      ) &&
      epoch > 0
    ) {
      return epoch;
    }

    const value =
      String(
        record &&
        (
          record.timestampIn ||
          record.gateIn
        ) ||
        ''
      ).trim();

    const thaiMatch =
      value.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/
      );

    if (thaiMatch) {
      return new Date(
        Number(
          thaiMatch[3]
        ),
        Number(
          thaiMatch[2]
        ) - 1,
        Number(
          thaiMatch[1]
        ),
        Number(
          thaiMatch[4]
        ),
        Number(
          thaiMatch[5]
        ),
        Number(
          thaiMatch[6]
        )
      ).getTime();
    }

    const parsed =
      Date.parse(
        value
      );

    return Number.isFinite(
      parsed
    )
      ? parsed
      : NaN;
  }


  function findRawField(
    fields,
    labels
  ) {
    const targets =
      (
        Array.isArray(
          labels
        )
          ? labels
          : []
      ).map(
        normalize
      );

    for (
      const field
      of (
        Array.isArray(
          fields
        )
          ? fields
          : []
      )
    ) {
      const label =
        normalize(
          field &&
          (
            field.label ||
            field.name ||
            field.id
          )
        );

      if (
        targets.some(
          (target) =>
            label.includes(
              target
            )
        )
      ) {
        const value =
          String(
            field &&
            (
              field.value ??
              field.displayValue ??
              ''
            )
          ).trim();

        if (value) {
          return value;
        }
      }
    }

    return '';
  }


  function inferRawNumericField(
    fields
  ) {
    for (
      const field
      of (
        Array.isArray(
          fields
        )
          ? fields
          : []
      )
    ) {
      const value =
        String(
          field &&
          (
            field.value ??
            field.displayValue ??
            ''
          )
        ).trim();

      if (
        /^\d{6,10}$/.test(
          value
        )
      ) {
        return value;
      }
    }

    return '';
  }


  function extractRawFieldDetails(
    fields
  ) {
    const result =
      [];

    const used =
      new Set();

    (
      Array.isArray(
        fields
      )
        ? fields
        : []
    ).forEach(
      (field) => {
        const label =
          String(
            field &&
            (
              field.label ||
              field.name ||
              field.id ||
              'ข้อมูล'
            )
          ).trim();

        const value =
          String(
            field &&
            (
              field.value ??
              field.displayValue ??
              ''
            )
          ).trim();

        const key =
          normalize(
            label
          );

        if (
          !value ||
          value === '-' ||
          used.has(
            key
          )
        ) {
          return;
        }

        used.add(
          key
        );

        result.push({
          label,
          value
        });
      }
    );

    return result;
  }


  function findVehicleCardByRecordId(
    recordId
  ) {
    return Array.from(
      document.querySelectorAll(
        '.vehicle-card[data-record-id]'
      )
    ).find(
      (card) =>
        String(
          card.dataset.recordId ||
          ''
        ) ===
        String(
          recordId ||
          ''
        )
    ) ||
    null;
  }


  function getReceivingStageFromCard(
    card
  ) {
    if (!card) {
      return '';
    }

    return (
      text(
        card.querySelector(
          '.receiving-card-stage__head strong'
        )
      ) ||
      text(
        card.querySelector(
          '.receiving-stage-badge'
        )
      ) ||
      ''
    );
  }

  function extractVehicleFieldDetails(
    fields
  ) {
    const result =
      [];

    const usedLabels =
      new Set();

    (
      Array.isArray(
        fields
      )
        ? fields
        : []
    ).forEach(
      (field) => {
        const label =
          text(
            field.querySelector(
              'span'
            )
          ) ||
          'ข้อมูล';

        const value =
          text(
            field.querySelector(
              'strong, a'
            )
          ) ||
          '';

        const normalizedLabel =
          normalize(
            label
          );

        if (
          !value ||
          value === '-' ||
          usedLabels.has(
            normalizedLabel
          )
        ) {
          return;
        }

        usedLabels.add(
          normalizedLabel
        );

        result.push({
          label,
          value
        });
      }
    );

    return result;
  }


  function getOverdueThresholdSeconds() {
    const value =
      text(
        document.getElementById(
          'thresholdOverdueText'
        )
      );

    const hourMatch =
      value.match(
        /(\d+(?:\.\d+)?)\s*ชั่วโมง/
      );

    if (hourMatch) {
      return Math.round(
        Number(
          hourMatch[1]
        ) *
        3600
      );
    }

    const minuteMatch =
      value.match(
        /(\d+(?:\.\d+)?)\s*นาที/
      );

    if (minuteMatch) {
      return Math.round(
        Number(
          minuteMatch[1]
        ) *
        60
      );
    }

    return 60 * 60;
  }


  function createOverdueAlertModel(
    records
  ) {
    const allRecords =
      Array.isArray(
        records
      )
        ? records
        : [];

    const newRecords =
      allRecords.filter(
        (record) =>
          !state
            .acknowledgedOverdueKeys
            .has(
              getOverdueRecordKey(
                record
              )
            )
      );

    return {
      allRecords,
      newRecords
    };
  }


  function buildOverdueHtml(
    alertModel
  ) {
    const allRecords =
      alertModel.allRecords ||
      [];

    const newRecords =
      alertModel.newRecords ||
      [];

    const thresholdText =
      text(
        document.getElementById(
          'thresholdOverdueText'
        )
      ) ||
      'ตามเกณฑ์โมดูล';

    return `
      <div class="av-overdue-dialog-v49">
        <header class="av-overdue-header-v49">
          <div class="av-overdue-heading-v49">
            <small>
              OPERATIONAL ALERT
            </small>

            <h2>
              รถ/ตู้สินค้าเกินเวลา
            </h2>

            <p>
              เกณฑ์ควบคุม
              ${escapeHtml(
                thresholdText
              )}
              · เทียบรายการใหม่จากรอบที่กดรับทราบล่าสุด
            </p>
          </div>

          <div class="av-overdue-header-summary-v49">
            <span>
              <small>ทั้งหมด</small>
              <strong>
                ${allRecords.length}
              </strong>
            </span>

            <span class="is-new">
              <small>ใหม่รอบนี้</small>
              <strong>
                ${newRecords.length}
              </strong>
            </span>

            <button
              type="button"
              class="av-overdue-feedback-v49"
              data-overdue-play-sound
              aria-label="เล่นเสียงและสั่นเตือนอีกครั้ง"
            >
              <span aria-hidden="true">
                🔔
              </span>

              <b>
                เตือนซ้ำ
              </b>
            </button>
          </div>
        </header>

        <div class="av-overdue-split-v49">
          ${buildOverduePanelHtml(
            'ทั้งหมดที่เกินเวลา',
            allRecords,
            'ALL'
          )}

          ${buildOverduePanelHtml(
            'เข้ามาใหม่ในรอบนี้',
            newRecords,
            'NEW'
          )}
        </div>

        <footer class="av-overdue-footer-v49">
          <span>
            1 รายการใช้ 2 แถว:
            เลขนัดหมาย /
            บริษัท · ทะเบียน · เวลาอยู่ในพื้นที่
          </span>

          <span>
            แตะแถวเพื่อดูรายละเอียดข้อมูลทั้งหมด
          </span>
        </footer>

      </div>
    `;
  }


  function buildOverduePanelHtml(
    title,
    records,
    panelType
  ) {
    const isNewPanel =
      panelType ===
      'NEW';

    return `
      <section
        class="av-overdue-panel-v49 ${
          isNewPanel
            ? 'is-new-panel'
            : 'is-all-panel'
        }"
      >
        <header class="av-overdue-panel-header-v49">
          <strong>
            ${escapeHtml(
              title
            )}
          </strong>

          <span>
            ${records.length}
            รายการ
          </span>
        </header>

        <div
          class="av-overdue-rows-v49"
          role="list"
          aria-label="${escapeHtml(
            title
          )}"
        >
          ${
            records.length > 0
              ? records
                  .map(
                    (record) =>
                      buildOverdueRowHtml(
                        record,
                        isNewPanel
                      )
                  )
                  .join('')
              : `
                  <div class="av-overdue-empty-v49">
                    <strong>
                      ไม่มีรายการใหม่
                    </strong>

                    <span>
                      รายการเดิมยังอยู่ฝั่งซ้ายและติดตามต่อได้
                    </span>
                  </div>
                `
          }
        </div>
      </section>
    `;
  }


  function buildOverdueRowHtml(
    record,
    isNew
  ) {
    const accessibleText =
      [
        'เลขนัดหมาย ' +
          record.appointment,
        'บริษัท ' +
          record.company,
        'ทะเบียน ' +
          record.registration,
        'เวลาอยู่ในพื้นที่ ' +
          record.duration
      ].join(', ');

    return `
      <button
        type="button"
        class="av-overdue-row-v49 ${
          isNew
            ? 'is-new'
            : ''
        }"
        data-overdue-detail-record="${escapeHtml(
          record.recordId
        )}"
        role="listitem"
        aria-label="${escapeHtml(
          accessibleText
        )}"
      >
        <span class="av-overdue-row-top-v49">
          <small>
            นัดหมาย
          </small>

          <strong>
            ${escapeHtml(
              record.appointment
            )}
          </strong>

          ${
            isNew
              ? `
                  <em>
                    ใหม่
                  </em>
                `
              : ''
          }
        </span>

        <span class="av-overdue-row-bottom-v49">
          <span
            class="is-company"
            title="${escapeHtml(
              record.company
            )}"
          >
            ${escapeHtml(
              record.company
            )}
          </span>

          <span
            class="is-registration"
            title="${escapeHtml(
              record.registration
            )}"
          >
            ${escapeHtml(
              record.registration
            )}
          </span>

          <strong class="is-duration">
            ${escapeHtml(
              record.duration
            )}
          </strong>
        </span>
      </button>
    `;
  }


  function getOverdueRecordKey(
    record
  ) {
    const source =
      record &&
      typeof record ===
        'object'
        ? record
        : {};

    return [
      source.recordId ||
        '',
      source.appointment ||
        '',
      source.registration ||
        '',
      source.gateIn ||
        ''
    ]
      .map(
        (value) =>
          String(
            value ||
            ''
          ).trim()
      )
      .join('|');
  }


  function acknowledgeOverdueRecords(
    records
  ) {
    const keys =
      (
        Array.isArray(
          records
        )
          ? records
          : []
      )
        .map(
          getOverdueRecordKey
        )
        .filter(Boolean);

    state.acknowledgedOverdueKeys =
      new Set(
        keys
      );

    persistOverdueAcknowledgement();
  }

  function buildAlertSignature(
    records
  ) {
    return records
      .map(
        (record) =>
          [
            record.recordId,
            record.appointment,
            record.registration
          ].join('|')
      )
      .sort()
      .join('::');
  }


  function bindAudioUnlock() {
    [
      'pointerdown',
      'touchstart',
      'keydown'
    ].forEach(
      (eventName) => {
        document.addEventListener(
          eventName,
          handleAudioUnlock,
          {
            passive: true,
            capture: true
          }
        );
      }
    );
  }


  function handleAudioUnlock() {
    unlockAudio()
      .then(
        () => {
          if (
            state.pendingAudio &&
            document.querySelector(
              '.overdue-command-popup'
            )
          ) {
            state.pendingAudio =
              false;

            playAlarmSequence(
              false
            );
          }
        }
      )
      .catch(
        () => undefined
      );
  }


  async function unlockAudio() {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return false;
    }

    if (!state.audioContext) {
      state.audioContext =
        new AudioContextClass();
    }

    if (
      state.audioContext.state ===
      'suspended'
    ) {
      await state.audioContext.resume();
    }

    state.audioUnlocked =
      state.audioContext.state ===
      'running';

    return state.audioUnlocked;
  }


  function requestAlarmFeedback(
    signature,
    force
  ) {
    if (!isOperationalAlertEnabled()) {
      return;
    }

    requestAlarmVibration(
      signature,
      force
    );

    requestAlarmSound(
      signature,
      force
    );
  }


  function requestAlarmVibration(
    signature,
    force
  ) {
    if (!isOperationalAlertEnabled()) {
      return false;
    }

    if (
      !window.navigator ||
      typeof window.navigator.vibrate !==
        'function'
    ) {
      return false;
    }

    const now =
      Date.now();

    const duplicate =
      !force &&
      signature &&
      signature ===
        state.lastVibratedSignature &&
      now -
        state.lastVibratedAt <
        VIBRATION_COOLDOWN_MS;

    if (duplicate) {
      return false;
    }

    try {
      /*
       * เตือน 3 จังหวะ:
       * สั้น - สั้น - ยาว
       */
      const accepted =
        window.navigator.vibrate(
          [
            180,
            110,
            180,
            110,
            360
          ]
        );

      if (accepted !== false) {
        state.lastVibratedSignature =
          signature ||
          state.activeAlertSignature ||
          '';

        state.lastVibratedAt =
          now;

        persistVibrationState();

        return true;
      }
    } catch (error) {
      return false;
    }

    return false;
  }


  function stopAlarmVibration() {
    if (
      !window.navigator ||
      typeof window.navigator.vibrate !==
        'function'
    ) {
      return;
    }

    try {
      window.navigator.vibrate(
        0
      );
    } catch (error) {
      // Ignore unsupported vibration errors.
    }
  }


  function requestAlarmSound(
    signature,
    force
  ) {
    if (!isOperationalAlertEnabled()) {
      state.pendingAudio = false;
      return;
    }

    const now =
      Date.now();

    const duplicate =
      !force &&
      signature &&
      signature ===
        state.lastPlayedSignature &&
      now -
        state.lastPlayedAt <
        SOUND_COOLDOWN_MS;

    if (duplicate) {
      return;
    }

    state.activeAlertSignature =
      signature;

    unlockAudio()
      .then(
        (unlocked) => {
          if (!unlocked) {
            state.pendingAudio =
              true;
            return;
          }

          playAlarmSequence(
            force
          );
        }
      )
      .catch(
        () => {
          state.pendingAudio =
            true;
        }
      );
  }


  function playAlarmSequence(
    force
  ) {
    if (
      !state.audioContext ||
      state.audioContext.state !==
        'running'
    ) {
      state.pendingAudio =
        true;
      return;
    }

    const signature =
      state.activeAlertSignature;

    const now =
      Date.now();

    if (
      !force &&
      signature &&
      signature ===
        state.lastPlayedSignature &&
      now -
        state.lastPlayedAt <
        SOUND_COOLDOWN_MS
    ) {
      return;
    }

    const context =
      state.audioContext;

    const start =
      context.currentTime +
      0.025;

    const notes = [
      {
        frequency: 880,
        offset: 0,
        duration: .13
      },
      {
        frequency: 660,
        offset: .18,
        duration: .13
      },
      {
        frequency: 880,
        offset: .36,
        duration: .24
      }
    ];

    notes.forEach(
      (note) => {
        const oscillator =
          context.createOscillator();

        const gain =
          context.createGain();

        oscillator.type =
          'sine';

        oscillator.frequency.setValueAtTime(
          note.frequency,
          start + note.offset
        );

        gain.gain.setValueAtTime(
          0.0001,
          start + note.offset
        );

        gain.gain.exponentialRampToValueAtTime(
          0.12,
          start +
          note.offset +
          0.018
        );

        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          start +
          note.offset +
          note.duration
        );

        oscillator.connect(
          gain
        );

        gain.connect(
          context.destination
        );

        oscillator.start(
          start + note.offset
        );

        oscillator.stop(
          start +
          note.offset +
          note.duration +
          0.03
        );
      }
    );

    state.pendingAudio =
      false;

    state.lastPlayedSignature =
      signature;

    state.lastPlayedAt =
      now;

    persistSoundState();
  }


  function restoreSoundState() {
    try {
      const saved =
        JSON.parse(
          window.localStorage.getItem(
            AUDIO_STORAGE_KEY
          ) ||
          '{}'
        );

      state.lastPlayedSignature =
        String(
          saved.signature ||
          ''
        );

      state.lastPlayedAt =
        Number(
          saved.timestamp
        ) || 0;
    } catch (error) {
      state.lastPlayedSignature =
        '';

      state.lastPlayedAt =
        0;
    }
  }


  function restoreVibrationState() {
    try {
      const saved =
        JSON.parse(
          window.localStorage.getItem(
            VIBRATION_STORAGE_KEY
          ) ||
          '{}'
        );

      state.lastVibratedSignature =
        String(
          saved.signature ||
          ''
        );

      state.lastVibratedAt =
        Number(
          saved.timestamp
        ) || 0;
    } catch (error) {
      state.lastVibratedSignature =
        '';

      state.lastVibratedAt =
        0;
    }
  }


  function persistVibrationState() {
    try {
      window.localStorage.setItem(
        VIBRATION_STORAGE_KEY,
        JSON.stringify({
          signature:
            state.lastVibratedSignature,

          timestamp:
            state.lastVibratedAt
        })
      );
    } catch (error) {
      // Storage may be disabled.
    }
  }


  function restoreOverdueAcknowledgement() {
    try {
      const saved =
        JSON.parse(
          window.localStorage.getItem(
            OVERDUE_ACK_STORAGE_KEY
          ) ||
          '[]'
        );

      state.acknowledgedOverdueKeys =
        new Set(
          Array.isArray(saved)
            ? saved
                .map(
                  (value) =>
                    String(
                      value ||
                      ''
                    )
                )
                .filter(Boolean)
            : []
        );
    } catch (error) {
      state.acknowledgedOverdueKeys =
        new Set();
    }
  }


  function persistOverdueAcknowledgement() {
    try {
      window.localStorage.setItem(
        OVERDUE_ACK_STORAGE_KEY,
        JSON.stringify(
          Array.from(
            state
              .acknowledgedOverdueKeys
          )
        )
      );
    } catch (error) {
      // Storage may be disabled.
    }
  }


  function persistSoundState() {
    try {
      window.localStorage.setItem(
        AUDIO_STORAGE_KEY,
        JSON.stringify({
          signature:
            state.lastPlayedSignature,
          timestamp:
            state.lastPlayedAt
        })
      );
    } catch (error) {
      // localStorage may be unavailable in private mode.
    }
  }


  function findField(
    fields,
    patterns
  ) {
    const targets =
      patterns.map(
        normalize
      );

    for (
      const field of fields
    ) {
      const label =
        normalize(
          text(
            field.querySelector(
              'span'
            )
          )
        );

      if (
        targets.some(
          (target) =>
            label.includes(
              target
            )
        )
      ) {
        return (
          text(
            field.querySelector(
              'strong, a'
            )
          ) ||
          '-'
        );
      }
    }

    return '';
  }


  function inferNumericField(
    fields
  ) {
    for (
      const field of fields
    ) {
      const value =
        text(
          field.querySelector(
            'strong, a'
          )
        );

      if (
        /^\d{5,12}$/.test(
          value
        )
      ) {
        return value;
      }
    }

    return '';
  }


  function scrollToRecord(
    id
  ) {
    const card =
      Array.from(
        document.querySelectorAll(
          '.vehicle-card[data-record-id]'
        )
      )
        .find(
          (item) =>
            String(
              item.dataset.recordId ||
              ''
            ) ===
            String(
              id ||
              ''
            )
        );

    if (!card) {
      return;
    }

    card.classList.remove(
      'is-receiving-filter-hidden'
    );

    card.removeAttribute(
      'aria-hidden'
    );

    card.scrollIntoView({
      behavior:
        window.matchMedia(
          '(prefers-reduced-motion: reduce)'
        ).matches
          ? 'auto'
          : 'smooth',
      block:
        'center'
    });

    card.classList.add(
      'receiving-highlight'
    );

    window.setTimeout(
      () => {
        card.classList.remove(
          'receiving-highlight'
        );
      },
      1800
    );
  }


  function formatDuration(
    seconds
  ) {
    const value =
      Math.max(
        0,
        Math.floor(
          Number(
            seconds
          ) || 0
        )
      );

    const hours =
      Math.floor(
        value / 3600
      );

    const minutes =
      Math.floor(
        (
          value % 3600
        ) / 60
      );

    const secs =
      value % 60;

    return [
      hours,
      minutes,
      secs
    ]
      .map(
        (part) =>
          String(
            part
          ).padStart(
            2,
            '0'
          )
      )
      .join(':');
  }


  function durationSeconds(
    value
  ) {
    const parts =
      String(
        value ||
        ''
      )
        .split(':')
        .map(Number);

    if (
      parts.length !== 3 ||
      parts.some(
        (part) =>
          !Number.isFinite(
            part
          )
      )
    ) {
      return 0;
    }

    return (
      parts[0] * 3600 +
      parts[1] * 60 +
      parts[2]
    );
  }


  function text(
    element
  ) {
    return String(
      element &&
      element.textContent ||
      ''
    ).trim();
  }


  function normalize(
    value
  ) {
    return String(
      value ||
      ''
    )
      .trim()
      .toLowerCase()
      .replace(
        /[\s_\-:]+/g,
        ''
      );
  }


  function matches(
    value,
    patterns
  ) {
    return patterns
      .map(
        normalize
      )
      .some(
        (pattern) =>
          value.includes(
            pattern
          )
      );
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


  function debounce(
    fn,
    delay
  ) {
    let timer =
      null;

    return (
      ...args
    ) => {
      window.clearTimeout(
        timer
      );

      timer =
        window.setTimeout(
          () => {
            timer =
              null;

            fn(
              ...args
            );
          },
          delay
        );
    };
  }


  function destroy() {
    state.destroyed =
      true;

    document.removeEventListener(
      'alertvendor:operational-alert-changed',
      handleOperationalAlertSetting
    );

    if (
      state.observer
    ) {
      state.observer.disconnect();
    }

    if (
      state.swalTimer
    ) {
      window.clearTimeout(
        state.swalTimer
      );
    }

    if (
      state.audioContext &&
      typeof state.audioContext
        .close ===
        'function'
    ) {
      state.audioContext
        .close()
        .catch(
          () => undefined
        );
    }
  }

})(window, document);


/* ============================================================
 * SOURCE 06: module(8).js
 * ============================================================ */
/**
 * module.js
 * ROUND 3 — Mobile-first Responsive + Adaptive Revision Polling
 *
 * ปรับปรุง:
 * - Auto Refresh แบบเงียบ ไม่แสดง Spinner/Toast
 * - ไม่ล้างหรือสร้างการ์ดใหม่เมื่อข้อมูลไม่เปลี่ยน
 * - รักษาตำแหน่ง Scroll เมื่อข้อมูลเปลี่ยน
 * - รองรับข้อมูลจำนวนมากและหน้าจอมือถือ
 * - คง Login, Calendar, Checkout และ SweetAlert เดิม
 * - Control Tower สรุปสถานการณ์คลังแบบ 24 ชั่วโมง
 * - Timeline รายชั่วโมง เลื่อนและแตะกรองได้บนมือถือ
 * - Progress Bar และสีการ์ดตามเกณฑ์ของแต่ละ Module
 * - เรียงรายการตามความเร่งด่วนและเวลาที่ใกล้เกณฑ์ที่สุด
 * - เคลียร์รายการออกจากหน้าจอตามค่ากลางของระบบ
 * - Movement Summary: เข้า ออก รวม สุทธิ รอบ 4 ชั่วโมง และวันนี้
 * - Timeline แบบ Focus Carousel แสดงเข้า ออก และสุทธิรายชั่วโมง
 * - แสดง Info เกณฑ์สีของแต่ละ Module จากค่าที่ Admin กำหนด
 * - Production R17: Action Sheet CSS + Shift Handover Accuracy
 * - Production R19: OPERATIONAL ALERT เปิด/ปิดรายผู้ใช้และรายโมดูล
 * - Production R23: ย้ายตัวควบคุมแจ้งเตือนไป Footer โดยไม่ลอยทับเนื้อหา
 * - ROUND 3: Revision-only polling แบบ adaptive, หยุดเมื่อซ่อน Tab และไม่ refresh เต็มระหว่างการ์ดกำลัง Commit
 * - ROUND 02: Gate Out ใช้ Stable Request ID และตรวจ Commit หลัง Timeout
 * - ROUND 02 REVISION 1: Receiving ย้ายการ์ดทันทีและไม่ย้อนกลับจาก Snapshot ที่ตามหลัง
 * - ROUND 05: หยุด Revision Polling ระหว่าง Foreground Write และเก็บ Performance Trace
 */
(function (window, document) {
  const MODULE_RECEIVING_HANDOFF_BUILD = '2026.07.20-round11-revision2-receiving-handoff-v1';
  'use strict';

  const CONFIG = window.APP_CONFIG || {};
  const API = window.VehicleAPI;
  const CHECKOUT_PENDING_PREFIX =
    'smartalert:checkout-pending:v1:';
  const CHECKOUT_VERIFY_ATTEMPTS = 3;
  const RECEIVING_COMMITTED_OVERLAY_PREFIX =
    'smartalert:receiving-handoff:v1:';
  const RECEIVING_COMMITTED_OVERLAY_MAX_AGE_MS =
    24 * 60 * 60 * 1000;
  let receivingCommittedOverlayCache = null;
  let receivingCommittedOverlayCacheKey = '';

  const OPERATIONAL_ALERT_STORAGE_PREFIX =
    'smartalert:operational-alert:v1';

  const OVERDUE_BADGE_ICON_URL =
    './icons/icon-192.png';

  const OVERDUE_BADGE_FAVICON_SIZE =
    64;

  const OPERATIONAL_BOARD_CACHE_PREFIX =
    'smartalert:module-board:phase1';
  const OPERATIONAL_BOARD_CACHE_MAX_AGE_MS =
    15 * 60 * 1000;
  const OPERATIONAL_BOARD_STALE_AFTER_MS =
    90 * 1000;


  const REVISION_POLL_MIN_MS = 2500;
  const REVISION_POLL_MAX_MS = 20000;
  const REVISION_POLL_RESUME_MS = 350;

  const state = {
    moduleId: '',
    session: null,
    module: null,
    records: [],
    filteredRecords: [],
    operationalBoard: null,
    boardHealth: 'LOADING',
    boardError: null,
    lastBoardSuccessAt: 0,
    usingCachedBoard: false,
    operationalStageFilter: 'ALL',
    shiftFilter: 'ALL',
    sortMode: 'LONGEST',
    mobileWorkspace: 'LIST',
    searchText: '',
    statusFilter: 'ALL',
    serverOffsetMs: 0,
    clockTimer: null,
    durationTimer: null,
    refreshTimer: null,
    refreshInProgress: false,
    handoverInProgress: false,
    recordsSignature: '',
    hasLoadedRecords: false,
    movementSummary: null,
    movementSummarySignature: '',
    movementRefreshInProgress: false,
    movementLoaded: false,
    dataRevision: '',
    rulesRevision: '',
    revisionCheckInProgress: false,
    revisionPollDelayMs: REVISION_POLL_MIN_MS,
    revisionPollFailures: 0,
    revisionPollLastAt: 0,
    foregroundWriteActive: false,
    foregroundWriteCount: 0,
    movementScope: 'CURRENT_ROUND',
    timelineMode: 'ROLLING_24',
    selectedTimelineStartMs: null,
    timelineFocusedStartMs: null,
    timelineShouldFocus: true,
    timelineScrollRaf: null,
    timelineSnapTimer: null,
    autoClosePersistTimer: null,
    lastAutoClosePersistAttemptMs: 0,
    cardNodes: new Map(),
    alertRunning: false,
    serverAlertCheckInProgress: false,
    lastServerAlertCheckAt: 0,
    lastServerAlertDeliveryEpochMs: 0,
    userInteracted: false,
    operationalAlertEnabled: true,
    operationalAlertStorageKey: '',

    /*
     * เก็บรายการ Active ก่อนซ่อนรายการครบ Auto Close
     * เพื่อให้ badge ยังคงนับจนกว่า Backend จะบันทึก Timestamp Out จริง
     */
    badgeRecords: [],
    overdueBadgeCount: -1,
    baseDocumentTitle: document.title,
    badgeIconImage: null,
    badgeIconReady: false,

    destroyed: false
  };

  /*
   * Controller กลางสำหรับ module.js และ module-operations.js
   * ปิดเฉพาะ OPERATIONAL ALERT อัตโนมัติ ไม่กระทบ Error,
   * การยืนยันบันทึก หรือ SweetAlert สำคัญประเภทอื่น
   */
  window.AlertVendorOperationalAlert = {
    isEnabled:
      () => isOperationalAlertEnabled(),

    setEnabled:
      (enabled) =>
        setOperationalAlertEnabled(
          enabled,
          {
            persist: true,
            emit: true
          }
        ),

    toggle:
      () =>
        setOperationalAlertEnabled(
          !isOperationalAlertEnabled(),
          {
            persist: true,
            emit: true
          }
        ),

    syncUi:
      () => syncOperationalAlertToggle()
  };

  /*
   * ใช้ delegated click แบบ capture เพื่อให้ปุ่มทำงานได้แน่นอน
   * แม้สคริปต์ส่วนอื่นจะหยุด event bubbling หรือมีการจัด DOM ใหม่
   */
  document.addEventListener(
    'click',
    handleOperationalAlertToggleClick,
    true
  );

  document.addEventListener('DOMContentLoaded', initializePage);
  window.addEventListener('beforeunload', destroyPage);
  document.addEventListener('pointerdown', markUserInteraction, { once: true });
  document.addEventListener('keydown', markUserInteraction, { once: true });

  async function initializePage() {
    if (document.body) {
      document.body.dataset.operationalBoardBuild =
        '2026.07.13-r18-workflow-wording-accuracy';
      document.body.dataset.shiftHandoverBuild =
        '2026.07.13-r18-workflow-wording-accuracy';
      document.body.dataset.operationalAlertBuild =
        '2026.07.13-r24-footer-alert-visual-polish';
    }

    initializeOverdueBadgeSystem();

    if (typeof window.Swal === 'undefined') {
      console.error('ไม่พบ SweetAlert2');
      return;
    }

    if (!API) {
      await Swal.fire({
        icon: 'error',
        title: 'เริ่มต้นระบบไม่สำเร็จ',
        text: 'ไม่พบไฟล์ api.js',
        confirmButtonText: 'ปิด'
      });
      return;
    }

    state.moduleId = getModuleIdFromUrl();

    if (!state.moduleId) {
      await Swal.fire({
        icon: 'error',
        title: 'ไม่พบโมดูล',
        text: 'URL ไม่ได้ระบุรหัสโมดูล',
        confirmButtonText: 'กลับหน้าหลัก',
        allowOutsideClick: false
      });
      redirectToDashboard();
      return;
    }

    bindEvents();
    setMobileWorkspace('LIST');
    startClock();
    showPageLoading(true);

    try {
      const session = await API.me();

      if (!session || !session.authenticated) {
        redirectToLogin();
        return;
      }

      const sessionRole = normalizeSessionRole(session);

      /*
       * ตัดสินสิทธิ์จาก /api/auth/me ของ Session ปัจจุบันเท่านั้น
       * ห้ามใช้ role/user cache รุ่นเก่าใน localStorage เพราะอาจค้างเป็น INBOUND
       * แล้วพา ADMIN/USER ไปหน้า inbound.html ผิดบัญชี
       */
      if (sessionRole === 'INBOUND') {
        redirectToInbound();
        return;
      }

      if (sessionRole !== 'ADMIN' && sessionRole !== 'USER') {
        API.clearSession && API.clearSession();
        redirectToLogin();
        return;
      }

      clearLegacyInboundRouteArtifacts();
      state.session = session;
      initializeOperationalAlertPreference();

      if (
        session.user &&
        session.user.mustChangePassword
      ) {
        await Swal.fire({
          icon: 'warning',
          title: 'ต้องเปลี่ยนรหัสผ่าน',
          text: 'กรุณากลับไปหน้าหลักและเปลี่ยนรหัสผ่านก่อนใช้งาน',
          confirmButtonText: 'กลับหน้าหลัก',
          allowOutsideClick: false
        });

        redirectToDashboard();
        return;
      }

      renderSession();

      state.module = await API.getModule(state.moduleId);
      renderModuleHeader();

      await loadRecords({
        silentError: false,
        showSuccessToast: false,
        forceRender: true
      });

      startDurationTimer();
      startAutoRefresh();

    } catch (error) {
      if (isAuthenticationError(error)) {
        await showSessionExpired();
        return;
      }

      await showApiError(error, 'เปิดหน้าสถานะไม่สำเร็จ');

    } finally {
      showPageLoading(false);
    }
  }

  function bindEvents() {
    const backButton =
      document.getElementById(
        'backButton'
      );

    const logoutButton =
      document.getElementById(
        'logoutButton'
      );

    const calendarButton =
      document.getElementById(
        'calendarButton'
      );

    const thresholdInfoButton =
      document.getElementById(
        'thresholdInfoButton'
      );

    const searchInput =
      document.getElementById(
        'searchInput'
      );

    const statusFilter =
      document.getElementById(
        'statusFilter'
      );

    const focusStatusGroup =
      document.getElementById(
        'criticalStatusFilters'
      );

    const sortSelect =
      document.getElementById(
        'focusSortSelect'
      );

    const mobileWorkspaceTabs =
      document.getElementById(
        'mobileWorkspaceTabs'
      );

    const mobileConflictFilter =
      document.getElementById(
        'mobileConflictFilter'
      );

    const operationalStageGroup =
      document.getElementById(
        'operationalStageFilters'
      );

    const operationalShiftGroup =
      document.getElementById(
        'operationalShiftFilters'
      );

    const operationalResetButton =
      document.getElementById(
        'operationalResetFilters'
      );

    const operationalRefreshButton =
      document.getElementById(
        'operationalBoardRefresh'
      );

    const shiftHandoverAddNoteButton =
      document.getElementById(
        'shiftHandoverAddNote'
      );

    const shiftHandoverAcknowledgeButton =
      document.getElementById(
        'shiftHandoverAcknowledge'
      );

    const shiftHandoverRefreshButton =
      document.getElementById(
        'shiftHandoverRefresh'
      );

    const movementScopeGroup =
      document.getElementById(
        'movementScopeGroup'
      );

    const timeline =
      document.getElementById(
        'hourlyTimeline'
      );

    const timelineModeGroup =
      document.getElementById(
        'timelineModeGroup'
      );

    const timelineApplyFilterButton =
      document.getElementById(
        'timelineApplyFilterButton'
      );

    const timelineClearButton =
      document.getElementById(
        'timelineClearButton'
      );

    backButton &&
      backButton.addEventListener(
        'click',
        redirectToDashboard
      );

    logoutButton &&
      logoutButton.addEventListener(
        'click',
        handleLogout
      );

    calendarButton &&
      calendarButton.addEventListener(
        'click',
        openCalendar
      );

    thresholdInfoButton &&
      thresholdInfoButton.addEventListener(
        'click',
        openThresholdInfo
      );

    searchInput &&
      searchInput.addEventListener(
        'input',
        debounce(
          () => {
            state.searchText =
              String(
                searchInput.value || ''
              )
                .trim()
                .toLowerCase();

            applyFiltersAndRender();
          },
          180
        )
      );

    statusFilter &&
      statusFilter.addEventListener(
        'change',
        () => {
          state.statusFilter =
            String(
              statusFilter.value ||
              'ALL'
            ).toUpperCase();

          syncCriticalStatusUi();
          applyFiltersAndRender();
        }
      );

    focusStatusGroup &&
      focusStatusGroup.addEventListener(
        'click',
        (event) => {
          const button =
            event.target.closest(
              '[data-focus-status]'
            );

          if (!button) {
            return;
          }

          clearQuickFilterContext({
            keepStatus: true
          });

          state.statusFilter =
            String(
              button.dataset.focusStatus ||
              'ALL'
            ).toUpperCase();

          if (statusFilter) {
            statusFilter.value =
              state.statusFilter;
          }

          syncCriticalStatusUi();
          setMobileWorkspace('LIST', {
            scroll: isMobileViewport()
          });
          applyFiltersAndRender();
        }
      );

    sortSelect &&
      sortSelect.addEventListener(
        'change',
        () => {
          state.sortMode =
            String(
              sortSelect.value ||
              'LONGEST'
            ).toUpperCase();

          applyFiltersAndRender();
        }
      );

    mobileWorkspaceTabs &&
      mobileWorkspaceTabs.addEventListener(
        'click',
        (event) => {
          const button =
            event.target.closest(
              '[data-mobile-workspace]'
            );

          if (!button) {
            return;
          }

          setMobileWorkspace(
            button.dataset.mobileWorkspace ||
            'LIST',
            {
              scroll: true
            }
          );
        }
      );

    mobileConflictFilter &&
      mobileConflictFilter.addEventListener(
        'click',
        () => {
          const nextConflictState =
            state.operationalStageFilter ===
              'DATA_CONFLICT'
              ? 'ALL'
              : 'DATA_CONFLICT';

          clearQuickFilterContext();
          state.operationalStageFilter =
            nextConflictState;

          syncOperationalFilterUi();
          syncCriticalStatusUi();
          setMobileWorkspace('LIST', {
            scroll: isMobileViewport()
          });
          applyFiltersAndRender();
        }
      );

    operationalStageGroup &&
      operationalStageGroup.addEventListener(
        'click',
        (event) => {
          const button =
            event.target.closest(
              '[data-operational-stage]'
            );

          if (!button) {
            return;
          }

          clearQuickFilterContext({
            keepStage: true
          });

          state.operationalStageFilter =
            String(
              button.dataset.operationalStage ||
              'ALL'
            ).toUpperCase();

          syncOperationalFilterUi();
          syncCriticalStatusUi();
          if (isMobileViewport()) {
            setMobileWorkspace('LIST', {
              scroll: true
            });
          }
          applyFiltersAndRender();
        }
      );

    operationalShiftGroup &&
      operationalShiftGroup.addEventListener(
        'click',
        (event) => {
          const button =
            event.target.closest(
              '[data-operational-shift]'
            );

          if (!button) {
            return;
          }

          clearQuickFilterContext({
            keepShift: true
          });

          state.shiftFilter =
            String(
              button.dataset.operationalShift ||
              'ALL'
            ).toUpperCase();

          syncOperationalFilterUi();
          if (isMobileViewport()) {
            setMobileWorkspace('LIST', {
              scroll: true
            });
          }
          applyFiltersAndRender();
        }
      );

    operationalResetButton &&
      operationalResetButton.addEventListener(
        'click',
        () => {
          clearQuickFilterContext();
          syncOperationalFilterUi();
          syncCriticalStatusUi();
          if (isMobileViewport()) {
            setMobileWorkspace('LIST', {
              scroll: true
            });
          }
          applyFiltersAndRender();
        }
      );

    operationalRefreshButton &&
      operationalRefreshButton.addEventListener(
        'click',
        () => void loadRecords({
          silentError: false,
          showSuccessToast: true,
          forceRender: true,
          forceRefresh: true
        })
      );

    shiftHandoverAddNoteButton &&
      shiftHandoverAddNoteButton.addEventListener(
        'click',
        () => void handleShiftHandoverAction(
          'ADD_NOTE'
        )
      );

    shiftHandoverAcknowledgeButton &&
      shiftHandoverAcknowledgeButton.addEventListener(
        'click',
        () => void handleShiftHandoverAction(
          'ACKNOWLEDGE'
        )
      );

    shiftHandoverRefreshButton &&
      shiftHandoverRefreshButton.addEventListener(
        'click',
        () => void handleShiftHandoverAction(
          'REFRESH_SNAPSHOT'
        )
      );

    document.addEventListener(
      'alertvendor:refresh-operational-board',
      () => void loadRecords({
        silentError: true,
        showSuccessToast: false,
        forceRender: true,
        forceRefresh: true
      })
    );


    window.addEventListener(
      'alertvendor:foreground-write-change',
      handleForegroundWriteChange
    );

    document.addEventListener(
      'alertvendor:receiving-committed',
      (event) => {
        handleReceivingCommittedEvent(
          event && event.detail
        );
      }
    );

    document.addEventListener(
      'alertvendor:receiving-accepted',
      (event) => {
        handleReceivingAcceptedEvent(
          event && event.detail
        );
      }
    );

    document.addEventListener(
      'alertvendor:receiving-rejected',
      (event) => {
        handleReceivingRejectedEvent(
          event && event.detail
        );
      }
    );

    document.addEventListener(
      'alertvendor:check-operational-board-revision',
      () => {
        scheduleNextRevisionCheck(120);
      }
    );

    document
      .querySelector('[data-operational-scroll]')
      ?.addEventListener(
        'click',
        () => {
          document
            .getElementById('operationalBoardPanel')
            ?.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
        }
      );

    movementScopeGroup &&
      movementScopeGroup.addEventListener(
        'click',
        (event) => {
          const button =
            event.target.closest(
              '[data-movement-scope]'
            );

          if (!button) {
            return;
          }

          state.movementScope =
            String(
              button.dataset.movementScope ||
              'CURRENT_ROUND'
            ).toUpperCase();

          renderMovementOverview();
        }
      );

    document
      .querySelectorAll(
        '[data-summary-filter]'
      )
      .forEach(
        (button) => {
          button.addEventListener(
            'click',
            () => {
              const value =
                String(
                  button.dataset
                    .summaryFilter ||
                  'ALL'
                ).toUpperCase();

              state.statusFilter =
                value;

              if (statusFilter) {
                statusFilter.value =
                  value;
              }

              syncCriticalStatusUi();
              setMobileWorkspace('LIST', {
                scroll: isMobileViewport()
              });
              applyFiltersAndRender();
            }
          );
        }
      );

    timelineModeGroup &&
      timelineModeGroup.addEventListener(
        'click',
        (event) => {
          const button =
            event.target.closest(
              '[data-timeline-mode]'
            );

          if (!button) {
            return;
          }

          state.timelineMode =
            String(
              button.dataset.timelineMode ||
              'ROLLING_24'
            ).toUpperCase();

          state.selectedTimelineStartMs =
            null;

          state.timelineFocusedStartMs =
            null;

          state.timelineShouldFocus =
            true;

          renderTimeline();
          applyFiltersAndRender();
        }
      );

    timeline &&
      timeline.addEventListener(
        'click',
        (event) => {
          const button =
            event.target.closest(
              '[data-hour-start-ms]'
            );

          if (!button) {
            return;
          }

          const startMs =
            Number(
              button.dataset.hourStartMs
            );

          if (
            !Number.isFinite(startMs)
          ) {
            return;
          }

          state.timelineFocusedStartMs =
            startMs;

          button.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
          });

          renderTimelineFocusPreviewFromElement(
            button
          );
        }
      );

    timeline &&
      timeline.addEventListener(
        'scroll',
        () => {
          scheduleTimelineCenterEffect(
            timeline
          );

          scheduleTimelineCenterSnap(
            timeline
          );
        },
        {
          passive: true
        }
      );

    timeline &&
      timeline.addEventListener(
        'pointerdown',
        () => {
          if (
            state.timelineSnapTimer
          ) {
            window.clearTimeout(
              state.timelineSnapTimer
            );

            state.timelineSnapTimer =
              null;
          }
        }
      );

    timelineApplyFilterButton &&
      timelineApplyFilterButton.addEventListener(
        'click',
        () => {
          if (
            !Number.isFinite(
              Number(
                state.timelineFocusedStartMs
              )
            )
          ) {
            return;
          }

          state.selectedTimelineStartMs =
            Number(
              state.timelineFocusedStartMs
            );

          renderTimeline();
          applyFiltersAndRender();
        }
      );

    timelineClearButton &&
      timelineClearButton.addEventListener(
        'click',
        () => {
          state.selectedTimelineStartMs =
            null;

          renderTimeline();
          applyFiltersAndRender();
        }
      );

    document.addEventListener(
      'visibilitychange',
      () => {
        if (document.visibilityState !== 'visible') {
          stopAutoRefresh();
          return;
        }

        state.revisionPollFailures = 0;
        state.revisionPollDelayMs = REVISION_POLL_MIN_MS;

        if (
          !state.refreshInProgress &&
          !state.movementRefreshInProgress &&
          state.hasLoadedRecords &&
          navigator.onLine
        ) {
          scheduleNextRevisionCheck(REVISION_POLL_RESUME_MS);
        }
      }
    );

    window.addEventListener(
      'online',
      () => {
        state.revisionPollFailures = 0;
        state.revisionPollDelayMs = REVISION_POLL_MIN_MS;

        if (!state.destroyed) {
          scheduleNextRevisionCheck(REVISION_POLL_RESUME_MS);
        }
      }
    );

    window.addEventListener(
      'offline',
      () => {
        stopAutoRefresh();

        if (state.hasLoadedRecords) {
          state.boardHealth = 'STALE';
          state.usingCachedBoard = true;
          renderModuleSnapshotState();
        }
      }
    );
  }

  function clearQuickFilterContext(options) {
    const config =
      options &&
      typeof options === 'object'
        ? options
        : {};

    if (config.keepStatus !== true) {
      state.statusFilter = 'ALL';
      const statusSelect =
        document.getElementById(
          'statusFilter'
        );
      if (statusSelect) {
        statusSelect.value = 'ALL';
      }
    }

    if (config.keepStage !== true) {
      state.operationalStageFilter = 'ALL';
    }

    if (config.keepShift !== true) {
      state.shiftFilter = 'ALL';
    }

    state.selectedTimelineStartMs = null;
    state.searchText = '';

    const searchInput =
      document.getElementById(
        'searchInput'
      );
    if (searchInput) {
      searchInput.value = '';
    }
  }

  function isMobileViewport() {
    return window.matchMedia(
      '(max-width: 767px)'
    ).matches;
  }

  function setMobileWorkspace(
    workspace,
    options
  ) {
    const allowed = [
      'LIST',
      'STAGES',
      'SHIFTS',
      'HANDOVER'
    ];
    const next =
      allowed.includes(
        String(workspace || '').toUpperCase()
      )
        ? String(workspace).toUpperCase()
        : 'LIST';

    state.mobileWorkspace = next;

    if (document.body) {
      document.body.dataset.mobileWorkspace =
        next;
    }

    document
      .querySelectorAll(
        '[data-mobile-workspace]'
      )
      .forEach((button) => {
        const active =
          String(
            button.dataset.mobileWorkspace ||
            ''
          ).toUpperCase() === next;

        button.classList.toggle(
          'is-active',
          active
        );
        button.setAttribute(
          'aria-pressed',
          active ? 'true' : 'false'
        );
      });

    const config =
      options &&
      typeof options === 'object'
        ? options
        : {};

    if (
      config.scroll === true &&
      isMobileViewport()
    ) {
      const target =
        next === 'LIST'
          ? document.getElementById(
              'vehicleList'
            )
          : document.getElementById(
              'operationalBoardPanel'
            );

      window.requestAnimationFrame(
        () => target?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      );
    }
  }

  function syncCriticalStatusUi() {
    document
      .querySelectorAll(
        '[data-focus-status]'
      )
      .forEach((button) => {
        const active =
          String(
            button.dataset.focusStatus ||
            'ALL'
          ).toUpperCase() ===
          String(
            state.statusFilter ||
            'ALL'
          ).toUpperCase();

        button.classList.toggle(
          'is-active',
          active
        );
        button.setAttribute(
          'aria-pressed',
          active ? 'true' : 'false'
        );
      });

    const conflictButton =
      document.getElementById(
        'mobileConflictFilter'
      );

    if (conflictButton) {
      const active =
        state.operationalStageFilter ===
        'DATA_CONFLICT';
      conflictButton.classList.toggle(
        'is-active',
        active
      );
      conflictButton.setAttribute(
        'aria-pressed',
        active ? 'true' : 'false'
      );
    }
  }

  function markUserInteraction() {
    state.userInteracted = true;
  }



  function applyEmbeddedMovementSnapshot(board) {
    const movement =
      board &&
      board.dashboard &&
      board.dashboard.movement &&
      typeof board.dashboard.movement === 'object'
        ? board.dashboard.movement
        : null;

    if (!movement) {
      return false;
    }

    const signature = buildMovementSummarySignature(movement);
    const changed =
      !state.movementLoaded ||
      signature !== state.movementSummarySignature;

    state.movementSummary = movement;
    state.movementSummarySignature = signature;
    state.movementLoaded = true;
    state.movementRefreshInProgress = false;

    renderModuleThresholdInfo();
    renderMovementOverview();

    if (changed) {
      renderTimeline();
    }

    return true;
  }

  async function loadMovementSummary(
    options
  ) {
    if (
      applyEmbeddedMovementSnapshot(state.operationalBoard)
    ) {
      return;
    }

    if (
      state.movementRefreshInProgress ||
      state.destroyed ||
      !API ||
      typeof API.getMovementSummary !==
        'function'
    ) {
      return;
    }

    const config =
      options &&
      typeof options === 'object'
        ? options
        : {};

    state.movementRefreshInProgress =
      true;

    try {
      const result =
        await API.getMovementSummary(
          state.moduleId,
          {
            mode: 'all'
          }
        );

      if (
        !result ||
        typeof result !== 'object'
      ) {
        throw new Error(
          'Movement Summary ส่งข้อมูลไม่ถูกต้อง'
        );
      }

      const signature =
        buildMovementSummarySignature(
          result
        );

      const changed =
        config.forceRender === true ||
        !state.movementLoaded ||
        signature !==
          state.movementSummarySignature;

      state.movementSummary =
        result;

      state.movementSummarySignature =
        signature;

      state.movementLoaded =
        true;

      if (
        result.generatedAt
      ) {
        updateServerOffset(
          result.generatedAt
        );
      }

      renderModuleThresholdInfo();
      renderMovementOverview();

      if (changed) {
        renderTimeline();
      }

    } catch (error) {
      console.warn(
        'Movement Summary ไม่พร้อม',
        error
      );

      renderMovementUnavailable();

      if (
        !config.silentError &&
        !isAuthenticationError(error)
      ) {
        await showApiError(
          error,
          'โหลดสรุปเข้า–ออกไม่สำเร็จ'
        );
      }

    } finally {
      state.movementRefreshInProgress =
        false;
    }
  }


  function buildMovementSummarySignature(
    result
  ) {
    return JSON.stringify({
      generatedAt:
        result.generatedAt || '',
      thresholds:
        result.thresholds || {},
      currentState:
        result.currentState || {},
      currentRound:
        result.currentRound || {},
      today:
        result.today || {},
      rolling24:
        result.rolling24 || {},
      hours:
        result.hours || {}
    });
  }
  async function loadRecords(options) {
    if (
      state.refreshInProgress ||
      state.destroyed
    ) {
      return;
    }

    const config =
      options &&
      typeof options === 'object'
        ? options
        : {};

    if (
      config.background === true &&
      hasActiveCardWrite()
    ) {
      scheduleNextRevisionCheck(REVISION_POLL_MIN_MS);
      return;
    }

    state.refreshInProgress =
      true;

    const vehicleList =
      document.getElementById(
        'vehicleList'
      );

    vehicleList &&
      vehicleList.setAttribute(
        'aria-busy',
        'true'
      );

    try {
      let result;

      if (
        !API ||
        typeof API.getOperationalBoard !==
          'function'
      ) {
        const missingError =
          new Error(
            'ไม่พบ Operational Board API'
          );
        missingError.code =
          'OPERATIONAL_BOARD_API_MISSING';
        throw missingError;
      }

      try {
        result =
          await API.getOperationalBoard(
            state.moduleId,
            {
              limit: 1500,
              forceRefresh:
                config.forceRefresh === true
            }
          );

        assertOperationalBoardResult(
          result
        );

        state.operationalBoard =
          result;
        state.boardError = null;
        state.lastBoardSuccessAt =
          Date.now();
        state.usingCachedBoard =
          false;
        state.boardHealth =
          result.integrity &&
          result.integrity.success === false
            ? 'INTEGRITY_ERROR'
            : 'LIVE';

        if (
          state.boardHealth === 'LIVE'
        ) {
          saveOperationalBoardSnapshot(
            result
          );
        }

      } catch (boardError) {
        const cachedBoard =
          readOperationalBoardSnapshot();

        state.boardError =
          boardError;

        if (!cachedBoard) {
          state.operationalBoard =
            null;
          state.boardHealth =
            'BLOCKED';
          state.usingCachedBoard =
            false;
          renderModuleSnapshotState();
          throw boardError;
        }

        result = cachedBoard;
        state.operationalBoard =
          cachedBoard;
        state.boardHealth =
          'STALE';
        state.usingCachedBoard =
          true;

        console.warn(
          'Operational Board โหลดไม่สำเร็จ ใช้ Snapshot ล่าสุดแบบอ่านอย่างเดียว',
          boardError
        );
      }

      if (
        result &&
        result.module
      ) {
        state.module = {
          ...state.module,
          ...result.module
        };

        renderModuleHeader();
      }

      updateServerOffset(
        result &&
        result.generatedAt
      );

      state.dataRevision = String(
        result && result.dataRevision || ''
      );
      state.rulesRevision = String(
        result && result.rulesRevision || ''
      );
      applyEmbeddedMovementSnapshot(result);

      const nextRecords =
        result &&
        Array.isArray(
          result.records
        )
          ? result.records.map(
              normalizeOperationalRecord
            )
          : [];

      const previousSignature =
        state.recordsSignature;

      state.records =
        nextRecords;

      recalculateAllRecords();

      /*
       * สำเนารายการ Active ทั้งหมดหลังคำนวณสถานะ
       * รายการนี้ไม่ถูกตัดออกจาก badge จนกว่า API รอบใหม่
       * จะยืนยันว่ามี Timestamp Out แล้ว
       */
      state.badgeRecords =
        state.records.slice();

      updateOverdueBadgePresentation();

      const expiredCount =
        dropExpiredRecordsFromView();

      if (expiredCount > 0) {
        requestAutoClosePersistence();
      }

      const nextSignature =
        buildRecordsSignature(
          state.records
        );

      const mustRender =
        config.forceRender === true ||
        !state.hasLoadedRecords ||
        nextSignature !==
          previousSignature;

      state.recordsSignature =
        nextSignature;

      renderSummary();
      renderOperationalBoard();
      renderTimeline();

      if (mustRender) {
        const previousScrollY =
          window.scrollY;

        applyFiltersAndRender();

        if (
          state.hasLoadedRecords
        ) {
          window.requestAnimationFrame(
            () => {
              window.scrollTo({
                top: previousScrollY,
                behavior: 'auto'
              });
            }
          );
        }
      }

      setText(
        'lastUpdated',
        (
          state.boardHealth === 'LIVE'
            ? 'ข้อมูลล่าสุด '
            : state.boardHealth === 'INTEGRITY_ERROR'
              ? 'ข้อมูลล่าสุด แต่พบความไม่สมดุล '
              : 'Snapshot สำรอง '
        ) +
          (
            result &&
            result.generatedAt
              ? result.generatedAt
              : formatBangkokDateTime(
                  getCurrentServerDate()
                )
          )
      );

      renderModuleSnapshotState();

      state.hasLoadedRecords =
        true;

      document.dispatchEvent(
        new CustomEvent(
          'alertvendor:records-updated',
          {
            detail: {
              moduleId: state.moduleId,
              generatedAt:
                result && result.generatedAt || '',
              records: state.records,
              operationalBoard:
                state.operationalBoard
            }
          }
        )
      );

      if (
        config.showSuccessToast
      ) {
        showToast(
          'อัปเดตข้อมูลแล้ว',
          'success'
        );
      }

      checkOverdueAlerts();

    } catch (error) {
      if (
        isAuthenticationError(
          error
        )
      ) {
        await showSessionExpired();
        return;
      }

      if (!config.silentError) {
        await showApiError(
          error,
          'โหลดข้อมูลไม่สำเร็จ'
        );
      }

    } finally {
      state.refreshInProgress =
        false;

      vehicleList &&
        vehicleList.setAttribute(
          'aria-busy',
          'false'
        );
    }
  }

  function assertOperationalBoardResult(result) {
    if (
      !result ||
      typeof result !== 'object' ||
      !Array.isArray(result.records)
    ) {
      const error = new Error(
        'Operational Board ส่งข้อมูลไม่สมบูรณ์'
      );
      error.code = 'OPERATIONAL_BOARD_INVALID_RESPONSE';
      throw error;
    }
  }

  function operationalBoardStorageKey() {
    const username = String(
      state.session &&
      state.session.user &&
      state.session.user.username ||
      state.session &&
      state.session.username ||
      'anonymous'
    ).trim().toLowerCase();

    return [
      OPERATIONAL_BOARD_CACHE_PREFIX,
      username,
      String(state.moduleId || '').trim().toLowerCase()
    ].join(':');
  }

  function saveOperationalBoardSnapshot(board) {
    try {
      window.sessionStorage.setItem(
        operationalBoardStorageKey(),
        JSON.stringify({
          savedAt: Date.now(),
          board: board
        })
      );
    } catch (error) {
      console.warn(
        'บันทึก Operational Board Snapshot ไม่สำเร็จ',
        error
      );
    }
  }

  function readOperationalBoardSnapshot() {
    try {
      const raw = window.sessionStorage.getItem(
        operationalBoardStorageKey()
      );

      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      const ageMs = Date.now() - Number(parsed.savedAt || 0);
      const board = parsed.board;

      if (
        ageMs < 0 ||
        ageMs > OPERATIONAL_BOARD_CACHE_MAX_AGE_MS ||
        !board ||
        !Array.isArray(board.records) ||
        !board.integrity ||
        board.integrity.success !== true
      ) {
        window.sessionStorage.removeItem(
          operationalBoardStorageKey()
        );
        return null;
      }

      board.__clientSnapshotSavedAt = Number(parsed.savedAt || 0);
      return board;
    } catch (error) {
      console.warn(
        'อ่าน Operational Board Snapshot ไม่สำเร็จ',
        error
      );
      return null;
    }
  }

  function renderModuleSnapshotState() {
    const panel = document.getElementById(
      'moduleSnapshotState'
    );
    const title = document.getElementById(
      'moduleSnapshotTitle'
    );
    const detail = document.getElementById(
      'moduleSnapshotDetail'
    );
    const retryButton = document.getElementById(
      'moduleSnapshotRetry'
    );

    if (!panel) {
      return;
    }

    const generatedAt = String(
      state.operationalBoard &&
      state.operationalBoard.generatedAt ||
      ''
    );
    const ageMs = state.lastBoardSuccessAt
      ? Date.now() - state.lastBoardSuccessAt
      : Number.MAX_SAFE_INTEGER;

    let status = state.boardHealth;

    if (
      status === 'LIVE' &&
      ageMs > OPERATIONAL_BOARD_STALE_AFTER_MS
    ) {
      status = 'STALE';
    }

    panel.dataset.state = status;
    document.body.dataset.boardHealth = status;

    const map = {
      LOADING: {
        title: 'กำลังตรวจสอบข้อมูล',
        detail: 'กำลังยืนยันข้อมูลล่าสุดจากระบบ',
        retry: false
      },
      LIVE: {
        title: 'ข้อมูลพร้อมใช้งาน',
        detail: generatedAt
          ? 'อัปเดตล่าสุด ' + generatedAt
          : 'ข้อมูลล่าสุดพร้อมใช้งาน',
        retry: false
      },
      STALE: {
        title: 'กำลังใช้ข้อมูลล่าสุดที่มี',
        detail: generatedAt
          ? 'ข้อมูลล่าสุดที่ยืนยันได้ ' + generatedAt + ' · ปิดปุ่มบันทึกชั่วคราว'
          : 'เครือข่ายไม่พร้อม · ปิดปุ่มบันทึกชั่วคราว',
        retry: true
      },
      INTEGRITY_ERROR: {
        title: 'พบข้อมูลไม่สมดุล',
        detail: 'ระบบปิดปุ่มบันทึกเพื่อป้องกันการเปลี่ยนสถานะผิดคัน ให้ Admin ตรวจสอบ',
        retry: true
      },
      BLOCKED: {
        title: 'ไม่สามารถยืนยันสถานะรถได้',
        detail: 'ยังยืนยันข้อมูลล่าสุดไม่ได้ ระบบจึงปิดการบันทึกเพื่อป้องกันข้อมูลผิดพลาด',
        retry: true
      }
    };

    const info = map[status] || map.BLOCKED;
    const accessibleSummary = [info.title, info.detail]
      .filter(Boolean)
      .join(' — ');

    if (title) title.textContent = info.title;
    if (detail) detail.textContent = info.detail;

    panel.setAttribute('aria-label', accessibleSummary);
    panel.setAttribute('title', accessibleSummary);
    bindCompactSnapshotStatus_(panel);

    if (status === 'LIVE') {
      panel.classList.remove('is-open');
      panel.setAttribute('aria-expanded', 'false');
    }

    if (retryButton) {
      retryButton.hidden = !info.retry;
      retryButton.disabled = state.refreshInProgress;
      retryButton.onclick = info.retry
        ? () => void loadRecords({
            silentError: false,
            showSuccessToast: true,
            forceRender: true,
            forceRefresh: true
          })
        : null;
    }

    document.dispatchEvent(
      new CustomEvent(
        'alertvendor:module-board-health',
        {
          detail: {
            state: status,
            writable: status === 'LIVE',
            generatedAt: generatedAt,
            errorCode: String(
              state.boardError &&
              state.boardError.code ||
              ''
            )
          }
        }
      )
    );
  }

  function bindCompactSnapshotStatus_(panel) {
    if (!panel || panel.dataset.compactStatusBound === 'TRUE') {
      return;
    }

    panel.dataset.compactStatusBound = 'TRUE';

    const setOpen = (open) => {
      panel.classList.toggle('is-open', open);
      panel.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    panel.addEventListener('click', (event) => {
      const target = event.target;

      if (
        target &&
        typeof target.closest === 'function' &&
        target.closest('button')
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      setOpen(!panel.classList.contains('is-open'));
    });

    panel.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        setOpen(!panel.classList.contains('is-open'));
      } else if (event.key === 'Escape') {
        setOpen(false);
        panel.blur();
      }
    });

    document.addEventListener('click', (event) => {
      if (!panel.contains(event.target)) {
        setOpen(false);
      }
    });
  }


  function buildRecordsSignature(records) {
    const list =
      Array.isArray(records)
        ? records
        : [];

    return JSON.stringify(
      list.map(
        (record) => ({
          recordId:
            record.recordId || '',

          sourceRowNumber:
            Number(
              record.sourceRowNumber
            ) || 0,

          primaryValue:
            record.primaryValue || '',

          timestampIn:
            record.timestampIn || '',

          timestampInEpochMs:
            Number(
              record.timestampInEpochMs
            ) || 0,

          isCurrentlyInArea:
            Boolean(
              record.isCurrentlyInArea
            ),

          isIncomplete:
            Boolean(
              record.isIncomplete
            ),

          canCheckout:
            Boolean(
              record.canCheckout
            ),

          operationalStage:
            record.operationalStage || '',

          statusCode:
            record.statusCode || '',

          statusStartedAtEpochMs:
            Number(record.statusStartedAtEpochMs) || 0,

          stageRuleKey:
            record.stageSla && record.stageSla.ruleKey || '',

          stageRulesRevision:
            record.stageSla && record.stageSla.rulesRevision || '',

          dataHealthCode:
            record.dataHealthCode || '',

          receivingCompleteAt:
            record.receivingCompleteAt || '',

          workflowStatusCode:
            record.workflowStatusCode || '',

          entryShiftCode:
            record.entryShiftCode || '',

          ownerShiftCode:
            record.ownerShiftCode || '',

          carryOver:
            Boolean(record.carryOver),

          canCompleteReceiving:
            Boolean(record.canCompleteReceiving),

          fields:
            Array.isArray(
              record.fields
            )
              ? record.fields.map(
                  (field) => ({
                    id:
                      field.id ||
                      field.fieldId ||
                      '',

                    label:
                      field.label || '',

                    value:
                      field.value || '',

                    type:
                      field.type || '',

                    primary:
                      Boolean(
                        field.primary
                      ),

                    order:
                      Number(
                        field.order
                      ) || 0
                  })
                )
              : []
        })
      )
    );
  }

  function recalculateAllRecords() {
    const nowMs = getCurrentServerTimeMs();

    state.records.forEach((record) => {
      updateRecordComputedState(record, nowMs);
    });
  }

  function updateRecordComputedState(record, nowMs) {
    if (
      !record ||
      !record.isCurrentlyInArea ||
      !Number.isFinite(Number(record.timestampInEpochMs))
    ) {
      if (record) {
        record.statusCode = 'INCOMPLETE';
        record.statusLabel = getStatusLabel('INCOMPLETE');
        record.priorityText = 'ตรวจสอบข้อมูลเวลาเข้า';
        record.progressPercent = 0;
      }
      return;
    }

    const totalDurationSeconds = Math.max(
      0,
      Math.floor(
        (nowMs - Number(record.timestampInEpochMs)) / 1000
      )
    );
    const stageThresholds = getRecordStageThresholds(record, nowMs);
    const autoCloseThresholds = getModuleThresholds();
    const autoCloseRemainingSeconds = Math.max(
      0,
      autoCloseThresholds.autoCloseSeconds - totalDurationSeconds
    );

    record.durationSeconds = totalDurationSeconds;
    record.durationDisplay = formatDurationSeconds(totalDurationSeconds);
    record.statusElapsedSeconds = stageThresholds.elapsedSeconds;
    record.statusCode = stageThresholds.statusCode;
    record.statusLabel = getStatusLabel(stageThresholds.statusCode);
    record.statusColor = getStatusColor(stageThresholds.statusCode);
    record.isOverdue = stageThresholds.statusCode === 'OVERDUE';
    record.isExpired36H =
      totalDurationSeconds >= autoCloseThresholds.autoCloseSeconds;
    record.autoCloseRemainingSeconds = autoCloseRemainingSeconds;
    record.isNearAutoClose =
      !record.isExpired36H &&
      autoCloseRemainingSeconds <= autoCloseThresholds.nearAutoCloseSeconds;
    record.progressPercent = calculateProgressPercent(
      stageThresholds.elapsedSeconds,
      stageThresholds
    );
    record.warningMarkerPercent =
      stageThresholds.redSeconds > 0
        ? Math.max(
            0,
            Math.min(
              100,
              (stageThresholds.warningSeconds /
                stageThresholds.redSeconds) * 100
            )
          )
        : 0;
    record.priorityText = buildPriorityText(record, stageThresholds);
    record.priorityScore = calculatePriorityScore(record, stageThresholds);
  }

  function getRecordStageThresholds(record, nowMs) {
    const stageSla =
      record &&
      record.stageSla &&
      typeof record.stageSla === 'object'
        ? record.stageSla
        : {};
    const configured = stageSla.configured === true;
    const startedAtEpochMs = Number(
      stageSla.startedAtEpochMs ||
      record.statusStartedAtEpochMs
    );
    const warningMinutes = Number(stageSla.warningMinutes);
    const redMinutes = Number(stageSla.redMinutes);

    if (
      !configured ||
      !Number.isFinite(startedAtEpochMs) ||
      !Number.isFinite(warningMinutes) ||
      !Number.isFinite(redMinutes) ||
      redMinutes <= warningMinutes
    ) {
      return {
        configured: false,
        elapsedSeconds: 0,
        warningSeconds: 0,
        redSeconds: 0,
        statusCode: 'INCOMPLETE'
      };
    }

    const elapsedSeconds = Math.max(
      0,
      Math.floor((Number(nowMs) - startedAtEpochMs) / 1000)
    );
    const warningSeconds = warningMinutes * 60;
    const redSeconds = redMinutes * 60;

    return {
      configured: true,
      elapsedSeconds,
      warningSeconds,
      redSeconds,
      warningMinutes,
      redMinutes,
      statusCode:
        elapsedSeconds >= redSeconds
          ? 'OVERDUE'
          : elapsedSeconds >= warningSeconds
            ? 'WARNING'
            : 'NORMAL'
    };
  }



  function getModuleThresholds() {
    const module =
      state.module || {};

    const movementThresholds =
      state.movementSummary &&
      state.movementSummary.thresholds
        ? state.movementSummary.thresholds
        : {};

    const greenMinutes = 0;
    const warningMinutes = 0;
    const redMinutes = 1;

    const autoCloseHours =
      Math.max(
        1,
        Number(
          movementThresholds.autoCloseHours
        ) ||
        Number(CONFIG.DEFAULT_AUTO_CLOSE_HOURS) ||
        36
      );

    const nearAutoCloseHours =
      Math.max(
        1,
        Number(
          movementThresholds.nearAutoCloseHours
        ) ||
        2
      );

    return {
      greenMinutes,
      warningMinutes,
      redMinutes,
      warningSeconds:
        warningMinutes * 60,
      redSeconds:
        redMinutes * 60,
      autoCloseHours,
      autoCloseSeconds:
        autoCloseHours * 60 * 60,
      nearAutoCloseHours,
      nearAutoCloseSeconds:
        nearAutoCloseHours * 60 * 60
    };
  }


  function calculateProgressPercent(
    durationSeconds,
    thresholds
  ) {
    if (
      !thresholds ||
      thresholds.redSeconds <= 0
    ) {
      return 0;
    }

    return Math.max(
      0,
      Math.min(
        100,
        (
          Number(durationSeconds) /
          thresholds.redSeconds
        ) * 100
      )
    );
  }


  function buildPriorityText(
    record,
    thresholds
  ) {
    if (
      !record ||
      record.statusCode ===
        'INCOMPLETE'
    ) {
      return 'ตรวจสอบข้อมูล';
    }

    if (
      record.isNearAutoClose
    ) {
      return (
        'ระบบจะเคลียร์ใน ' +
        formatDurationSeconds(
          record.autoCloseRemainingSeconds
        )
      );
    }

    if (
      record.statusCode ===
      'OVERDUE'
    ) {
      return (
        'เกินเกณฑ์สีแดง ' +
        formatCompactDuration(
          Number(record.statusElapsedSeconds || 0) -
          thresholds.redSeconds
        )
      );
    }

    if (
      record.statusCode ===
      'WARNING'
    ) {
      return (
        'เหลือ ' +
        formatCompactDuration(
          thresholds.redSeconds -
          Number(record.statusElapsedSeconds || 0)
        ) +
        ' ก่อนเข้าสีแดง'
      );
    }

    return (
      'เหลือ ' +
      formatCompactDuration(
        thresholds.warningSeconds -
        Number(record.statusElapsedSeconds || 0)
      ) +
      ' ก่อนเข้าสีส้ม'
    );
  }


  function calculatePriorityScore(
    record,
    thresholds
  ) {
    if (!record) {
      return 999999999;
    }

    if (
      record.isNearAutoClose
    ) {
      return (
        0 * 1000000000 +
        Math.max(
          0,
          record.autoCloseRemainingSeconds
        )
      );
    }

    if (
      record.statusCode ===
      'OVERDUE'
    ) {
      return (
        1 * 1000000000 -
        Math.max(
          0,
          Number(record.statusElapsedSeconds || 0)
        )
      );
    }

    if (
      record.statusCode ===
      'WARNING'
    ) {
      return (
        2 * 1000000000 +
        Math.max(
          0,
          thresholds.redSeconds -
          Number(record.statusElapsedSeconds || 0)
        )
      );
    }

    if (
      record.statusCode ===
      'NORMAL'
    ) {
      return (
        3 * 1000000000 +
        Math.max(
          0,
          thresholds.warningSeconds -
          record.durationSeconds
        )
      );
    }

    return 4 * 1000000000;
  }


  function formatCompactDuration(
    totalSeconds
  ) {
    const seconds =
      Math.max(
        0,
        Math.floor(
          Number(totalSeconds) || 0
        )
      );

    const hours =
      Math.floor(
        seconds / 3600
      );

    const minutes =
      Math.floor(
        (
          seconds % 3600
        ) / 60
      );

    if (hours > 0) {
      return (
        hours +
        ' ชม. ' +
        minutes +
        ' นาที'
      );
    }

    return (
      Math.max(
        1,
        minutes
      ) +
      ' นาที'
    );
  }


  function dropExpiredRecordsFromView() {
    const beforeCount =
      state.records.length;

    state.records =
      state.records.filter(
        (record) =>
          !record.isExpired36H
      );

    return (
      beforeCount -
      state.records.length
    );
  }


  function requestAutoClosePersistence() {
    const now =
      Date.now();

    if (
      now -
      state.lastAutoClosePersistAttemptMs <
      60000
    ) {
      return;
    }

    state.lastAutoClosePersistAttemptMs =
      now;

    if (
      state.autoClosePersistTimer
    ) {
      window.clearTimeout(
        state.autoClosePersistTimer
      );
    }

    state.autoClosePersistTimer =
      window.setTimeout(
        async () => {
          state.autoClosePersistTimer =
            null;

          if (
            state.refreshInProgress ||
            state.destroyed
          ) {
            return;
          }

          await loadRecords({
              silentError: true,
              showSuccessToast: false,
              forceRender: false
            });
        },
        600
      );
  }


  function renderSession() {
    const user =
      state.session && state.session.user
        ? state.session.user
        : {};

    setText(
      'userDisplayName',
      user.displayName ||
      user.username ||
      '-'
    );
  }

  function renderModuleHeader() {
    const module = state.module || {};

    setText(
      'moduleTitle',
      module.name ||
      state.moduleId
    );

    setText(
      'moduleDescription',
      module.description ||
      'ติดตามสถานะรถและตู้สินค้าในพื้นที่'
    );

    state.baseDocumentTitle =
      (
        module.name ||
        'สถานะรถ'
      ) +
      ' | ' +
      (
        CONFIG.APP_NAME ||
        'ระบบติดตามสถานะรถ'
      );

    updateOverdueBadgePresentation(
      true
    );

    const calendarButton =
      document.getElementById(
        'calendarButton'
      );

    if (calendarButton) {
      calendarButton.classList.toggle(
        'is-hidden',
        !module.calendarEnabled
      );
    }

    renderModuleThresholdInfo();
    updateAutoRefreshStatus();
  }



  function renderModuleThresholdInfo() {
    const container = document.getElementById('moduleThresholdInfo');
    if (!container) return;

    const autoClose = getModuleThresholds();
    const effectiveSla =
      state.operationalBoard &&
      state.operationalBoard.effectiveSla ||
      {};
    const coverage = effectiveSla.coverage || {};

    setText('thresholdNormalText', 'ตามขั้นตอน');
    setText(
      'thresholdWarningText',
      Number(coverage.configuredCount) + '/' +
      Number(coverage.totalCount || 4) + ' กฎ'
    );
    setText('thresholdOverdueText', 'Admin กำหนด');
    setText('thresholdAutoCloseText', autoClose.autoCloseHours + ' ชั่วโมง');
    setText('controlNearAutoCloseLabel', 'ใกล้ครบ ' + autoClose.autoCloseHours + ' ชม.');
    setText('timelineAutoCloseLegend', 'ใกล้ครบ ' + autoClose.autoCloseHours + ' ชม.');
  }


  async function openThresholdInfo() {
    const effectiveSla =
      state.operationalBoard &&
      state.operationalBoard.effectiveSla ||
      {};
    const rules = Array.isArray(effectiveSla.rules)
      ? effectiveSla.rules
      : [];
    const autoClose = getModuleThresholds();
    const rows = rules.map((rule) => `
      <div data-status="${rule.configured ? 'NORMAL' : 'INCOMPLETE'}">
        <span>${escapeHtml(rule.label || rule.key || '-')}</span>
        <strong>${rule.configured
            ? escapeHtml(String(rule.warningMinutes)) +
              ' / ' +
              escapeHtml(String(rule.redMinutes)) +
              ' นาที'
            : 'ยังไม่ตั้งค่า'}
        </strong>
      </div>
    `);

    await Swal.fire({
      icon: 'info',
      title: 'เกณฑ์ SLA รายขั้นตอนจาก Admin',
      html: `
        <div class="threshold-info-dialog">
          ${rows.join('') || '<p>ยังไม่พบเกณฑ์ SLA</p>'}
          <div data-status="AUTO_CLOSE">
            <span>เคลียร์อัตโนมัติ</span>
            <strong>ครบ ${escapeHtml(String(autoClose.autoCloseHours))} ชั่วโมง</strong>
          </div>
          <p>
            สีของรถคำนวณจากเวลาที่เริ่มขั้นตอนปัจจุบัน ไม่ใช่เวลารวมตั้งแต่ Gate In
            · Rules Revision ${escapeHtml(state.rulesRevision || '-')}
          </p>
        </div>
      `,
      confirmButtonText: 'ปิด'
    });
  }


  function renderMovementUnavailable() {
    const panel =
      document.getElementById(
        'movementOverview'
      );

    if (!panel) {
      return;
    }

    panel.dataset.state =
      'UNAVAILABLE';

    setText(
      'movementScopeTitle',
      'รอข้อมูลสรุปเข้า–ออก'
    );

    setText(
      'movementScopeTime',
      'ระบบ Active ยังใช้งานได้ตามปกติ'
    );

    setText(
      'movementAnalysisTitle',
      'Movement Summary ยังไม่พร้อม'
    );

    setText(
      'movementAnalysisMessage',
      'ตรวจสอบการติดตั้ง API รอบที่ 15'
    );
  }


  function renderMovementOverview() {
    const panel =
      document.getElementById(
        'movementOverview'
      );

    if (!panel) {
      return;
    }

    document
      .querySelectorAll(
        '[data-movement-scope]'
      )
      .forEach(
        (button) => {
          button.classList.toggle(
            'is-active',
            String(
              button.dataset.movementScope ||
              ''
            ).toUpperCase() ===
            state.movementScope
          );
        }
      );

    const summary =
      state.movementSummary;

    if (!summary) {
      renderMovementUnavailable();
      return;
    }

    const isToday =
      state.movementScope ===
      'TODAY';

    const metric =
      isToday
        ? summary.today
        : summary.currentRound;

    if (!metric) {
      renderMovementUnavailable();
      return;
    }

    const analysis =
      metric.analysis || {};

    panel.dataset.state =
      String(
        analysis.level ||
        'NORMAL'
      ).toUpperCase();

    setText(
      'movementScopeEyebrow',
      isToday
        ? 'TODAY MOVEMENT'
        : 'CURRENT 4-HOUR ROUND'
    );

    setText(
      'movementScopeTitle',
      isToday
        ? 'ภาพรวมวันนี้'
        : (
            metric.label ||
            'รอบปัจจุบัน'
          )
    );

    setText(
      'movementScopeTime',
      isToday
        ? (
            summary.today.date ||
            summary.selectedDate ||
            ''
          )
        : (
            metric.timeLabel ||
            ''
          )
    );

    const remainingWrap =
      document.getElementById(
        'movementRemainingWrap'
      );

    if (remainingWrap) {
      remainingWrap.classList.toggle(
        'is-hidden',
        isToday
      );
    }

    updateMovementCountdown();

    setText(
      'movementIn',
      String(
        Number(metric.in) || 0
      )
    );

    setText(
      'movementOutTotal',
      String(
        Number(metric.outTotal) || 0
      )
    );

    setText(
      'movementTotal',
      String(
        Number(metric.movementTotal) || 0
      )
    );

    setText(
      'movementNet',
      formatSignedNumber(
        metric.net
      )
    );

    setText(
      'movementOutReal',
      String(
        Number(metric.outReal) || 0
      )
    );

    setText(
      'movementOutAuto',
      String(
        Number(metric.outAuto) || 0
      )
    );

    const currentState =
      summary.currentState || {};

    setText(
      'movementActiveNow',
      String(
        Number(currentState.activeNow) ||
        state.records.length ||
        0
      )
    );

    setText(
      'movementOverdueNow',
      String(
        Number(currentState.overdue) ||
        0
      )
    );

    setText(
      'movementAnalysisTitle',
      analysis.title ||
      'กำลังประเมินสถานการณ์'
    );

    setText(
      'movementAnalysisMessage',
      analysis.message ||
      ''
    );

    renderMovementMiniChart();
  }


  function updateMovementCountdown() {
    const element =
      document.getElementById(
        'movementRemaining'
      );

    if (
      !element ||
      state.movementScope ===
        'TODAY'
    ) {
      return;
    }

    const metric =
      state.movementSummary &&
      state.movementSummary.currentRound;

    const endMs =
      Number(
        metric &&
        metric.endEpochMs
      );

    if (!Number.isFinite(endMs)) {
      element.textContent =
        '--:--:--';
      return;
    }

    const remainingSeconds =
      Math.max(
        0,
        Math.floor(
          (
            endMs -
            getCurrentServerTimeMs()
          ) / 1000
        )
      );

    element.textContent =
      formatDurationSeconds(
        remainingSeconds
      );
  }


  function renderMovementMiniChart() {
    const container =
      document.getElementById(
        'movementMiniChart'
      );

    if (!container) {
      return;
    }

    const hours =
      getMovementChartHours();

    if (
      !Array.isArray(hours) ||
      hours.length === 0
    ) {
      container.innerHTML = `
        <div class="movement-chart-empty">
          ยังไม่มีข้อมูลรายชั่วโมง
        </div>
      `;
      return;
    }

    const maximum =
      Math.max(
        1,
        ...hours.map(
          (hour) =>
            Math.max(
              Number(hour.in) || 0,
              Number(hour.outTotal) || 0
            )
        )
      );

    container.innerHTML =
      hours.map(
        (hour) => {
          const inValue =
            Number(hour.in) || 0;

          const outValue =
            Number(hour.outTotal) || 0;

          const inWidth =
            Math.max(
              inValue > 0 ? 7 : 0,
              Math.round(
                inValue /
                maximum *
                100
              )
            );

          const outWidth =
            Math.max(
              outValue > 0 ? 7 : 0,
              Math.round(
                outValue /
                maximum *
                100
              )
            );

          return `
            <div class="movement-chart-row">
              <strong>${escapeHtml(String(hour.label || '--'))}:00</strong>

              <div class="movement-chart-bars">
                <div>
                  <span>เข้า</span>
                  <i style="width:${inWidth}%"></i>
                  <b>${inValue}</b>
                </div>

                <div>
                  <span>ออก</span>
                  <i style="width:${outWidth}%"></i>
                  <b>${outValue}</b>
                </div>
              </div>

              <em>${escapeHtml(formatSignedNumber(hour.net))}</em>
            </div>
          `;
        }
      ).join('');
  }


  function getMovementChartHours() {
    const summary =
      state.movementSummary;

    if (
      !summary ||
      !summary.hours
    ) {
      return [];
    }

    const todayHours =
      Array.isArray(
        summary.hours.today
      )
        ? summary.hours.today
        : [];

    if (
      state.movementScope ===
      'TODAY'
    ) {
      return todayHours;
    }

    const round =
      summary.currentRound || {};

    const startMs =
      Number(round.startEpochMs);

    const endMs =
      Number(round.endEpochMs);

    if (
      !Number.isFinite(startMs) ||
      !Number.isFinite(endMs)
    ) {
      return [];
    }

    return todayHours.filter(
      (hour) => {
        const hourStart =
          Number(
            hour.startEpochMs
          );

        return (
          hourStart >= startMs &&
          hourStart < endMs
        );
      }
    );
  }


  function formatSignedNumber(value) {
    const number =
      Number(value) || 0;

    return number > 0
      ? '+' + number
      : String(number);
  }
  function renderSummary() {
    const summary =
      buildLocalSummary(
        state.records
      );

    setText(
      'summaryTotal',
      String(summary.total)
    );

    setText(
      'summaryNormal',
      String(summary.normal)
    );

    setText(
      'summaryWarning',
      String(summary.warning)
    );

    setText(
      'summaryOverdue',
      String(summary.overdue)
    );

    setText(
      'summaryIncomplete',
      String(summary.incomplete)
    );

    setText(
      'focusCountAll',
      String(summary.total)
    );
    setText(
      'focusCountNormal',
      String(summary.normal)
    );
    setText(
      'focusCountWarning',
      String(summary.warning)
    );
    setText(
      'focusCountOverdue',
      String(summary.overdue)
    );
    setText(
      'mobileTabListCount',
      String(summary.total)
    );

    syncCriticalStatusUi();

    setText(
      'controlTotal',
      String(summary.total)
    );

    setText(
      'controlNormal',
      String(summary.normal)
    );

    setText(
      'controlWarning',
      String(summary.warning)
    );

    setText(
      'controlOverdue',
      String(summary.overdue)
    );

    setText(
      'controlNearAutoClose',
      String(summary.nearAutoClose)
    );

    renderWarehouseSituation(
      summary
    );
  }

  function buildLocalSummary(records) {
    const list =
      Array.isArray(records)
        ? records
        : [];

    return {
      total:
        list.length,

      normal:
        list.filter(
          (record) =>
            record.statusCode ===
            'NORMAL'
        ).length,

      warning:
        list.filter(
          (record) =>
            record.statusCode ===
            'WARNING'
        ).length,

      overdue:
        list.filter(
          (record) =>
            record.statusCode ===
            'OVERDUE'
        ).length,

      incomplete:
        list.filter(
          (record) =>
            record.statusCode ===
              'INCOMPLETE' ||
            record.isIncomplete
        ).length,

      nearAutoClose:
        list.filter(
          (record) =>
            record.isNearAutoClose
        ).length
    };
  }

  function isReceivingWorkCardRecord(record) {
    return Boolean(
      record &&
      String(record.operationalStage || '').toUpperCase() === 'WAITING_RECEIVING' &&
      record.isCurrentlyInArea !== false
    );
  }

  function applyFiltersAndRender() {
    const searchText =
      state.searchText;

    const statusFilter =
      state.statusFilter;

    const matchedRecords =
      state.records.filter(
        (record) => {
          if (
            !isAdmin() &&
            (
              record._receivingHandoffHidden === true ||
              record.receivingHandoffHidden === true
            )
          ) {
            return false;
          }

          if (
            statusFilter !== 'ALL' &&
            record.statusCode !==
              statusFilter
          ) {
            return false;
          }

          if (
            !recordMatchesOperationalStage(
              record
            )
          ) {
            return false;
          }

          if (
            !recordMatchesShiftFilter(
              record
            )
          ) {
            return false;
          }

          if (
            !recordMatchesTimeline(
              record
            )
          ) {
            return false;
          }

          if (!searchText) {
            return true;
          }

          const haystack =
            String(
              record.searchText ||
              [
                record.primaryValue,
                record.timestampIn,
                record.statusLabel,
                record.priorityText,
                ...(Array.isArray(record.fields)
                  ? record.fields.map(
                      (field) =>
                        field.value
                    )
                  : [])
              ]
                .filter(Boolean)
                .join(' ')
            ).toLowerCase();

          return haystack.includes(
            searchText
          );
        }
      );

    /*
     * หน้า Module เป็นคิวงาน Receiving เท่านั้น
     * รถที่ยังรอยื่นเอกสารคงอยู่ใน Summary และเปิดดูผ่านรายการแบบเรียบง่าย
     * แต่ห้ามวาดเป็นการ์ดที่อาจทำให้ผู้ใช้เข้าใจว่าพร้อมรับสินค้าแล้ว
     */
    state.filteredRecords = matchedRecords.filter(isReceivingWorkCardRecord);

    sortRecords(
      state.filteredRecords
    );

    renderVehicleCards(
      state.filteredRecords
    );

    setText(
      'resultCount',
      'งานรอรับสินค้า ' +
      state.filteredRecords.length +
      ' รายการ'
    );

    updateActiveFilterText();
    syncCriticalStatusUi();
  }


  function receivingCommittedOverlayStorageKey() {
    const moduleId =
      String(
        state.moduleId ||
        new URLSearchParams(
          window.location.search
        ).get('id') ||
        new URLSearchParams(
          window.location.search
        ).get('moduleId') ||
        ''
      ).trim();

    return (
      RECEIVING_COMMITTED_OVERLAY_PREFIX +
      moduleId
    );
  }

  function readReceivingCommittedOverlays() {
    try {
      const key =
        receivingCommittedOverlayStorageKey();

      if (
        receivingCommittedOverlayCache &&
        receivingCommittedOverlayCacheKey ===
          key
      ) {
        const now =
          Date.now();
        let changed =
          false;

        Object.keys(
          receivingCommittedOverlayCache
        ).forEach(
          (recordId) => {
            const expiresAt =
              Number(
                receivingCommittedOverlayCache[
                  recordId
                ] &&
                receivingCommittedOverlayCache[
                  recordId
                ].expiresAt ||
                0
              );

            if (
              !expiresAt ||
              expiresAt <= now
            ) {
              delete receivingCommittedOverlayCache[
                recordId
              ];
              changed =
                true;
            }
          }
        );

        if (changed) {
          if (
            Object.keys(
              receivingCommittedOverlayCache
            ).length
          ) {
            localStorage.setItem(
              key,
              JSON.stringify(
                receivingCommittedOverlayCache
              )
            );
          } else {
            localStorage.removeItem(
              key
            );
          }
        }

        return receivingCommittedOverlayCache;
      }

      const parsed =
        JSON.parse(
          localStorage.getItem(key) ||
          '{}'
        );
      const map =
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
          ? parsed
          : {};
      const now =
        Date.now();
      let changed =
        false;

      Object.keys(map).forEach(
        (recordId) => {
          const expiresAt =
            Number(
              map[recordId] &&
              map[recordId].expiresAt ||
              0
            );

          if (
            !expiresAt ||
            expiresAt <= now
          ) {
            delete map[recordId];
            changed = true;
          }
        }
      );

      if (changed) {
        if (Object.keys(map).length) {
          localStorage.setItem(
            key,
            JSON.stringify(map)
          );
        } else {
          localStorage.removeItem(key);
        }
      }

      receivingCommittedOverlayCache =
        map;
      receivingCommittedOverlayCacheKey =
        key;

      return map;
    } catch (error) {
      receivingCommittedOverlayCache =
        {};
      receivingCommittedOverlayCacheKey =
        receivingCommittedOverlayStorageKey();
      return receivingCommittedOverlayCache;
    }
  }

  function saveReceivingCommittedOverlay(detail) {
    const item =
      detail &&
      typeof detail === 'object'
        ? detail
        : {};
    const recordId =
      String(
        item.recordId || ''
      ).trim();

    if (!recordId) {
      return;
    }

    try {
      const key =
        receivingCommittedOverlayStorageKey();
      const map =
        readReceivingCommittedOverlays();
      const now =
        Date.now();

      map[recordId] = {
        recordId:
          recordId,

        canonicalRecordId:
          String(
            item.canonicalRecordId ||
            ''
          ),

        sourceRowNumber:
          Number(
            item.sourceRowNumber ||
            0
          ) || 0,

        autoId:
          String(
            item.autoId ||
            ''
          ),

        receivingCompleteAt:
          String(
            item.receivingCompleteAt ||
            ''
          ),

        committedAt:
          now,

        expiresAt:
          now +
          RECEIVING_COMMITTED_OVERLAY_MAX_AGE_MS
      };

      localStorage.setItem(
        key,
        JSON.stringify(map)
      );
      receivingCommittedOverlayCache =
        map;
      receivingCommittedOverlayCacheKey =
        key;
    } catch (error) {
      console.warn(
        'เก็บ Local Receiving Transition ไม่สำเร็จ',
        error
      );
    }
  }

  function removeReceivingCommittedOverlay(
    recordId
  ) {
    const cleanRecordId =
      String(
        recordId || ''
      ).trim();

    if (!cleanRecordId) {
      return;
    }

    try {
      const key =
        receivingCommittedOverlayStorageKey();
      const map =
        readReceivingCommittedOverlays();

      if (!map[cleanRecordId]) {
        return;
      }

      delete map[cleanRecordId];

      if (Object.keys(map).length) {
        localStorage.setItem(
          key,
          JSON.stringify(map)
        );
      } else {
        localStorage.removeItem(key);
      }

      receivingCommittedOverlayCache =
        map;
      receivingCommittedOverlayCacheKey =
        key;
    } catch (error) {
      // Local overlay เป็นเพียง UX guard ไม่กระทบธุรกรรมหลัก
    }
  }

  function findReceivingCommittedOverlay(
    record
  ) {
    const item =
      record &&
      typeof record === 'object'
        ? record
        : {};
    const map =
      readReceivingCommittedOverlays();
    const recordId =
      String(
        item.recordId || ''
      ).trim();

    if (
      recordId &&
      map[recordId]
    ) {
      return map[recordId];
    }

    const canonicalRecordId =
      String(
        item.canonicalRecordId || ''
      ).trim();
    const sourceRowNumber =
      Number(
        item.sourceRowNumber || 0
      ) || 0;
    const autoId =
      String(
        item.autoId ||
        item.sourceAutoId ||
        ''
      ).trim()
        .toUpperCase();

    return Object.values(map).find(
      (overlay) => {
        if (
          canonicalRecordId &&
          String(
            overlay.canonicalRecordId || ''
          ).trim() ===
            canonicalRecordId
        ) {
          return true;
        }

        if (
          sourceRowNumber > 0 &&
          Number(
            overlay.sourceRowNumber || 0
          ) ===
            sourceRowNumber
        ) {
          return true;
        }

        return Boolean(
          autoId &&
          String(
            overlay.autoId || ''
          ).trim()
            .toUpperCase() ===
            autoId
        );
      }
    ) || null;
  }

  function applyLocalReceivingCommittedOverlay(
    record
  ) {
    const item =
      record &&
      typeof record === 'object'
        ? record
        : {};

    const serverStage =
      String(
        item.operationalStage || ''
      ).toUpperCase();
    const serverAlreadyAdvanced =
      Boolean(
        item.receivingCompleteAt ||
        item.workflowReceivingCompletedAt ||
        [
          'WAITING_DOCUMENT_RETURN',
          'WAITING_GATE_OUT'
        ].includes(serverStage)
      );

    /*
     * เมื่อ Snapshot จาก Server ตามทันแล้ว ล้าง UX overlay ได้
     * แต่ห้ามล้างจาก Object ที่เราเพิ่งอัปเดตแบบ Local
     */
    if (
      serverAlreadyAdvanced &&
      item._receivingOverlayApplied !== true
    ) {
      removeReceivingCommittedOverlay(
        item.recordId
      );
      return item;
    }

    const overlay =
      findReceivingCommittedOverlay(
        item
      );

    if (!overlay) {
      return item;
    }

    const stageMeta =
      getOperationalStageMeta(
        'WAITING_DOCUMENT_RETURN'
      );
    const completedAt =
      String(
        overlay.receivingCompleteAt ||
        item.receivingCompleteAt ||
        item.workflowReceivingCompletedAt ||
        ''
      ).trim();

    item.receivingCompleteAt =
      completedAt;
    item.workflowReceivingCompletedAt =
      completedAt;
    item.operationalStage =
      'WAITING_DOCUMENT_RETURN';
    item.operationalStageLabel =
      stageMeta.label;
    item.operationalStageDescription =
      stageMeta.description;
    item.operationalStageOrder =
      stageMeta.order;
    item.canCompleteReceiving =
      false;
    item.receivingEnabled =
      true;
    item.workflowStatusCode =
      'RECEIVING_COMPLETED';
    item.workflowStatusLabel =
      'รับสินค้าเสร็จแล้ว';
    item._receivingOverlayApplied =
      true;
    item._receivingHandoffHidden =
      true;

    return item;
  }


  function normalizeOperationalRecord(record) {
    const item =
      applyLocalReceivingCommittedOverlay(
        record &&
        typeof record === 'object'
          ? record
          : {}
      );

    if (!item.operationalStage) {
      item.operationalStage =
        item.receivingCompleteAt
          ? 'WAITING_DOCUMENT_RETURN'
          : 'WAITING_INBOUND_DOCUMENT';
    }

    if (!item.operationalStageLabel) {
      item.operationalStageLabel =
        getOperationalStageMeta(
          item.operationalStage
        ).label;
    }

    if (!Number.isFinite(
      Number(item.operationalStageOrder)
    )) {
      item.operationalStageOrder =
        getOperationalStageMeta(
          item.operationalStage
        ).order;
    }

    item.entryShift =
      item.entryShift &&
      typeof item.entryShift === 'object'
        ? item.entryShift
        : null;

    item.ownerShift =
      item.ownerShift &&
      typeof item.ownerShift === 'object'
        ? item.ownerShift
        : null;

    item.entryShiftCode =
      item.entryShiftCode ||
      item.entryShift &&
      item.entryShift.code ||
      '';

    item.ownerShiftCode =
      item.ownerShiftCode ||
      item.ownerShift &&
      item.ownerShift.code ||
      '';

    return item;
  }


  function shouldHideRecordFromMainList(record) {
    const stage =
      String(
        record && record.operationalStage || ''
      ).toUpperCase();

    return stage === 'WAITING_DOCUMENT_RETURN';
  }

  function handleReceivingAcceptedEvent(detail) {
    return handleReceivingCommittedEvent(detail);
  }

  function handleReceivingRejectedEvent(detail) {
    const payload = detail && typeof detail === 'object' ? detail : {};
    const recordId = String(payload.recordId || '').trim();
    const canonicalRecordId = String(payload.canonicalRecordId || '').trim();
    const sourceRowNumber = Number(payload.sourceRowNumber || 0) || 0;
    const autoId = String(payload.autoId || '').trim().toUpperCase();

    if (recordId) removeReceivingCommittedOverlay(recordId);

    let changed = false;
    state.records = (Array.isArray(state.records) ? state.records : []).map((record) => {
      const matches =
        Boolean(recordId && String(record.recordId || '').trim() === recordId) ||
        Boolean(canonicalRecordId && String(record.canonicalRecordId || '').trim() === canonicalRecordId) ||
        Boolean(sourceRowNumber > 0 && Number(record.sourceRowNumber || 0) === sourceRowNumber) ||
        Boolean(autoId && String(record.autoId || record.sourceAutoId || '').trim().toUpperCase() === autoId);

      if (!matches) return record;
      changed = true;
      const next = Object.assign({}, record);
      const restoredStage = String(
        payload.previousOperationalStage ||
        'WAITING_RECEIVING'
      ).toUpperCase();
      const restoredMeta = getOperationalStageMeta(restoredStage);

      next._receivingHandoffHidden = false;
      next.receivingHandoffHidden = false;
      next._receivingOverlayApplied = false;
      next.operationalStage = restoredStage;
      next.operationalStageLabel = restoredMeta.label;
      next.operationalStageDescription = restoredMeta.description;
      next.operationalStageOrder = restoredMeta.order;
      next.workflowStatusCode = String(
        payload.previousWorkflowStatusCode ||
        'DOCUMENT_SUBMITTED'
      );
      next.workflowStatusLabel =
        next.workflowStatusCode === 'DOCUMENT_SUBMITTED'
          ? 'ยื่นเอกสารแล้ว'
          : next.workflowStatusLabel;
      next.receivingCompleteAt = String(
        payload.previousReceivingCompleteAt || ''
      );
      next.workflowReceivingCompletedAt =
        next.receivingCompleteAt;
      next.canCompleteReceiving =
        restoredStage === 'WAITING_RECEIVING';
      next.receivingEnabled = true;
      return normalizeOperationalRecord(next);
    });

    if (changed) {
      state.recordsSignature = buildRecordsSignature(state.records);
      renderOperationalBoard();
      applyFiltersAndRender();
    }
    scheduleNextRevisionCheck(120);
    return changed;
  }

  function handleReceivingCommittedEvent(detail) {
    const payload =
      detail && typeof detail === 'object'
        ? detail
        : {};

    const recordId =
      String(
        payload.recordId || ''
      ).trim();
    const canonicalRecordId =
      String(
        payload.canonicalRecordId || ''
      ).trim();
    const sourceRowNumber =
      Number(
        payload.sourceRowNumber || 0
      ) || 0;
    const autoId =
      String(
        payload.autoId || ''
      ).trim()
        .toUpperCase();

    if (
      !recordId &&
      !canonicalRecordId &&
      sourceRowNumber < 1 &&
      !autoId
    ) {
      return false;
    }

    saveReceivingCommittedOverlay(
      payload
    );

    if (
      !Array.isArray(state.records) ||
      state.records.length === 0
    ) {
      return false;
    }

    let changed = false;

    state.records = state.records.map(
      (record) => {
        const currentRecordId =
          String(
            record &&
            record.recordId ||
            ''
          ).trim();
        const currentCanonicalId =
          String(
            record &&
            record.canonicalRecordId ||
            ''
          ).trim();
        const currentSourceRow =
          Number(
            record &&
            record.sourceRowNumber ||
            0
          ) || 0;
        const currentAutoId =
          String(
            record &&
            (
              record.autoId ||
              record.sourceAutoId
            ) ||
            ''
          ).trim()
            .toUpperCase();

        const matches =
          Boolean(
            recordId &&
            currentRecordId === recordId
          ) ||
          Boolean(
            canonicalRecordId &&
            currentCanonicalId ===
              canonicalRecordId
          ) ||
          Boolean(
            sourceRowNumber > 0 &&
            currentSourceRow ===
              sourceRowNumber
          ) ||
          Boolean(
            autoId &&
            currentAutoId === autoId
          );

        if (!matches) {
          return record;
        }

        changed = true;

        const next =
          Object.assign(
            {},
            record
          );
        const stageMeta =
          getOperationalStageMeta(
            'WAITING_DOCUMENT_RETURN'
          );
        const completedAt =
          String(
            payload.receivingCompleteAt ||
            next.receivingCompleteAt ||
            next.workflowReceivingCompletedAt ||
            ''
          ).trim();

        next.receivingCompleteAt =
          completedAt;
        next.workflowReceivingCompletedAt =
          completedAt;
        next.operationalStage =
          'WAITING_DOCUMENT_RETURN';
        next.operationalStageLabel =
          stageMeta.label;
        next.operationalStageDescription =
          stageMeta.description;
        next.operationalStageOrder =
          stageMeta.order;
        next.canCompleteReceiving =
          false;
        next.receivingEnabled =
          true;
        next.workflowStatusCode =
          'RECEIVING_COMPLETED';
        next.workflowStatusLabel =
          'รับสินค้าเสร็จแล้ว';
        next._receivingOverlayApplied =
          true;
        next._receivingHandoffHidden =
          true;
        next.receivingHandoffHidden =
          true;

        return normalizeOperationalRecord(
          next
        );
      }
    );

    if (!changed) {
      return false;
    }

    state.recordsSignature =
      buildRecordsSignature(
        state.records
      );

    renderOperationalBoard();
    applyFiltersAndRender();
    scheduleNextRevisionCheck(350);

    return true;
  }

  function recordMatchesOperationalStage(record) {
    const filter =
      String(
        state.operationalStageFilter ||
        'ALL'
      ).toUpperCase();

    if (filter === 'ALL') {
      return !shouldHideRecordFromMainList(
        record
      );
    }

    return String(
      record.operationalStage || ''
    ).toUpperCase() === filter;
  }

  function recordMatchesShiftFilter(record) {
    const filter =
      String(
        state.shiftFilter ||
        'ALL'
      ).toUpperCase();

    if (filter === 'ALL') {
      return true;
    }

    if (filter === 'CURRENT') {
      const currentCode =
        state.operationalBoard &&
        state.operationalBoard.currentShift
          ? String(
              state.operationalBoard
                .currentShift.code || ''
            ).toUpperCase()
          : '';

      return Boolean(
        currentCode &&
        String(
          record.ownerShiftCode || ''
        ).toUpperCase() ===
          currentCode
      );
    }

    if (filter === 'CARRY_OVER') {
      return record.carryOver === true;
    }

    if (filter === 'UNSCHEDULED') {
      return !record.entryShiftCode;
    }

    return String(
      record.entryShiftCode || ''
    ).toUpperCase() === filter;
  }

  function getOperationalStageMeta(code) {
    const key =
      String(code || '').toUpperCase();

    const map = {
      WAITING_INBOUND_DOCUMENT: {
        label: 'รอ พขร.ยื่นเอกสาร',
        shortLabel: 'รอ พขร.ยื่นเอกสาร',
        description: 'รอ พขร.นำเอกสารไปยื่นที่ห้อง Inbound',
        order: 10
      },
      WAITING_RECEIVING: {
        label: 'รอรับสินค้าเสร็จ',
        shortLabel: 'รอรับสินค้า',
        description: 'พขร.ยื่นเอกสารแล้ว พร้อมบันทึกรับสินค้าเสร็จ',
        order: 20
      },
      WAITING_DOCUMENT_RETURN: {
        label: 'พขร.รอรับเอกสารคืน',
        shortLabel: 'พขร.รอเอกสารคืน',
        description: 'รับสินค้าเสร็จแล้ว พขร.รอรับเอกสารคืนจากห้อง Inbound',
        order: 30
      },
      WAITING_GATE_OUT: {
        label: 'รอ Gate Out',
        shortLabel: 'รอ Gate Out',
        description: 'พขร.รับเอกสารคืนแล้ว รอสแกน Gate Out จริง',
        order: 40
      },
      DATA_CONFLICT: {
        label: 'ข้อมูลขัดแย้ง',
        shortLabel: 'ข้อมูลขัดแย้ง',
        description: 'ให้ Admin ตรวจสอบข้อมูลที่ไม่สอดคล้องกัน',
        order: 90
      }
    };

    return map[key] || map.DATA_CONFLICT;
  }

  function renderOperationalBoard() {
    renderModuleSnapshotState();

    const board =
      state.operationalBoard || {};
    /*
     * จำนวนบนตัวกรองต้องคำนวณจาก Array เดียวกับที่ใช้วาดการ์ด
     * ห้ามใช้ Summary จาก Snapshot หาก state.records ถูกตัดรายการ Auto Close แล้ว
     */
    const summary =
      buildOperationalSummary(
        state.records
      );
    const stageCounts =
      summary.stages || {};

    setText(
      'operationalCountAll',
      String(summary.activeTotal || 0)
    );

    [
      'WAITING_INBOUND_DOCUMENT',
      'WAITING_RECEIVING',
      'WAITING_DOCUMENT_RETURN',
      'WAITING_GATE_OUT',
      'DATA_CONFLICT'
    ].forEach((code) => {
      const suffix =
        code
          .split('_')
          .map(
            (part) =>
              part.charAt(0) +
              part.slice(1).toLowerCase()
          )
          .join('');
      const countText =
        String(
          Number(stageCounts[code]) || 0
        );

      setText(
        'operationalCount' + suffix,
        countText
      );

      setText(
        'focusOperationalCount' + suffix,
        countText
      );
    });

    setText(
      'operationalCarryOverCount',
      String(summary.carryOver || 0)
    );
    setText(
      'mobileCriticalConflictCount',
      String(
        Number(stageCounts.DATA_CONFLICT) ||
        0
      )
    );
    setText(
      'mobileTabStageCount',
      String(
        (Number(stageCounts.WAITING_RECEIVING) || 0) +
        (Number(stageCounts.DATA_CONFLICT) || 0)
      )
    );
    setText(
      'mobileTabShiftCount',
      String(summary.carryOver || 0)
    );

    syncCriticalStatusUi();

    const currentShift =
      board.currentShift || null;

    setText(
      'operationalCurrentShift',
      currentShift
        ? 'กะปัจจุบัน ' +
          currentShift.code +
          ' · ' +
          currentShift.start +
          '–' +
          currentShift.end
        : 'ยังไม่ได้เปิดระบบกะหรือเวลาปัจจุบันไม่อยู่ในช่วงกะ'
    );

    setText(
      'operationalSnapshotTime',
      board.generatedAt
        ? 'Snapshot ' +
          board.generatedAt
        : 'กำลังใช้ข้อมูลรายการปัจจุบัน'
    );

    const integrityNode =
      document.getElementById(
        'operationalIntegrity'
      );
    const integrity =
      board.integrity || null;

    if (integrityNode) {
      const integrityOk =
        integrity &&
        integrity.success === true;
      const staleMode =
        state.boardHealth === 'STALE';
      const blockedMode =
        state.boardHealth === 'BLOCKED';

      integrityNode.dataset.state =
        staleMode
          ? 'FALLBACK'
          : blockedMode
            ? 'ERROR'
            : integrityOk
              ? 'OK'
              : 'ERROR';

      integrityNode.textContent =
        staleMode
          ? 'Snapshot สำรอง · ปิดการบันทึกชั่วคราว'
          : blockedMode
            ? 'ไม่พบ Snapshot ที่เชื่อถือได้'
            : integrityOk
              ? 'ข้อมูลครบถ้วน · 1 รายการต่อ 1 สถานะ'
              : 'พบข้อมูลไม่สมดุล · ปิดการบันทึกเพื่อความปลอดภัย';
    }

    renderOperationalShiftFilters();
    renderOperationalShiftSummaries();
    renderShiftHandover();
    syncOperationalFilterUi();
  }

  function buildOperationalSummary(records) {
    const sourceList =
      Array.isArray(records)
        ? records
        : [];
    const list = isAdmin()
      ? sourceList
      : sourceList.filter((record) => !(
          record &&
          (
            record._receivingHandoffHidden === true ||
            record.receivingHandoffHidden === true
          )
        ));
    const stages = {
      WAITING_INBOUND_DOCUMENT: 0,
      WAITING_RECEIVING: 0,
      WAITING_DOCUMENT_RETURN: 0,
      WAITING_GATE_OUT: 0,
      DATA_CONFLICT: 0
    };

    list.forEach((record) => {
      const code =
        String(
          record.operationalStage ||
          'DATA_CONFLICT'
        ).toUpperCase();

      if (stages[code] === undefined) {
        stages.DATA_CONFLICT += 1;
      } else {
        stages[code] += 1;
      }
    });

    return {
      activeTotal: list.length,
      stages,
      carryOver:
        list.filter(
          (record) =>
            record.carryOver === true
        ).length
    };
  }

  function renderOperationalShiftFilters() {
    const container =
      document.getElementById(
        'operationalShiftFilters'
      );

    if (!container) {
      return;
    }

    const board =
      state.operationalBoard || {};
    const config =
      board.shiftConfig || {};
    const shifts =
      config.enabled === true &&
      Array.isArray(config.shifts)
        ? config.shifts
        : [];
    const counts = {};

    state.records.forEach((record) => {
      const code =
        String(
          record.entryShiftCode ||
          'UNSCHEDULED'
        ).toUpperCase();

      counts[code] =
        (counts[code] || 0) + 1;
    });

    const buttons = [
      {
        code: 'ALL',
        label: 'ทุกกะ',
        count: state.records.length
      },
      {
        code: 'CURRENT',
        label: 'กะปัจจุบัน',
        count:
          board.currentShift
            ? state.records.filter(
                (record) =>
                  String(
                    record.ownerShiftCode || ''
                  ).toUpperCase() ===
                  String(
                    board.currentShift.code || ''
                  ).toUpperCase()
              ).length
            : 0
      },
      ...shifts.map((shift) => ({
        code:
          String(
            shift.code || ''
          ).toUpperCase(),
        label:
          'กะ ' +
          String(
            shift.code || ''
          ).toUpperCase(),
        title:
          String(shift.name || '') +
          ' ' +
          String(shift.start || '') +
          '–' +
          String(shift.end || ''),
        count:
          counts[
            String(
              shift.code || ''
            ).toUpperCase()
          ] || 0
      })),
      {
        code: 'CARRY_OVER',
        label: 'ค้างข้ามกะ',
        count:
          state.records.filter(
            (record) =>
              record.carryOver === true
          ).length
      }
    ];

    if (
      state.records.some(
        (record) =>
          !record.entryShiftCode
      )
    ) {
      buttons.push({
        code: 'UNSCHEDULED',
        label: 'ไม่ทราบกะ',
        count: counts.UNSCHEDULED || 0
      });
    }

    container.innerHTML = '';

    buttons.forEach((item) => {
      const button =
        document.createElement(
          'button'
        );

      button.type = 'button';
      button.dataset.operationalShift =
        item.code;
      button.title = item.title || item.label;
      button.innerHTML =
        '<span>' +
        escapeHtml(item.label) +
        '</span><strong>' +
        escapeHtml(String(item.count)) +
        '</strong>';

      container.appendChild(button);
    });
  }

  function renderOperationalShiftSummaries() {
    const container =
      document.getElementById(
        'operationalShiftSummaryGrid'
      );

    if (!container) {
      return;
    }

    const summaries =
      state.operationalBoard &&
      Array.isArray(
        state.operationalBoard
          .shiftSummaries
      )
        ? state.operationalBoard
            .shiftSummaries
        : [];

    container.innerHTML = '';

    if (summaries.length === 0) {
      const empty =
        document.createElement(
          'div'
        );
      empty.className =
        'operational-shift-empty';
      empty.textContent =
        'ยังไม่ได้เปิดระบบกะสำหรับ Module นี้';
      container.appendChild(empty);
      return;
    }

    summaries.forEach((summary) => {
      const card =
        document.createElement(
          'article'
        );
      card.className =
        'operational-shift-card' +
        (
          summary.isCurrent
            ? ' is-current'
            : ''
        );

      const stage =
        summary.stages || {};

      card.innerHTML = `
        <header>
          <div>
            <small>${summary.isCurrent ? 'กะปัจจุบัน' : 'กะปฏิบัติงาน'}</small>
            <strong>กะ ${escapeHtml(summary.code || '-')} · ${escapeHtml(summary.name || '')}</strong>
          </div>
          <span>${escapeHtml(summary.start || '')}–${escapeHtml(summary.end || '')}</span>
        </header>
        <div class="operational-shift-card__metrics">
          <div><span>คงค้างต้นกะ</span><strong>${Number(summary.openingBalance) || 0}</strong></div>
          <div><span>Gate In</span><strong>${Number(summary.gateIn) || 0}</strong></div>
          <div><span>Gate Out จริง</span><strong>${Number(summary.gateOutActual) || 0}</strong></div>
          <div><span>Auto Close</span><strong>${Number(summary.autoClose) || 0}</strong></div>
          <div><span>คงค้างปลายกะ</span><strong>${Number(summary.closingBalance) || 0}</strong></div>
          <div><span>Active จากกะนี้</span><strong>${Number(summary.activeFromShift) || 0}</strong></div>
        </div>
        <div class="operational-shift-card__stages">
          <span>รอ พขร.ยื่น ${Number(stage.WAITING_INBOUND_DOCUMENT) || 0}</span>
          <span>รอรับ ${Number(stage.WAITING_RECEIVING) || 0}</span>
          <span>พขร.รอคืน ${Number(stage.WAITING_DOCUMENT_RETURN) || 0}</span>
          <span>รอออก ${Number(stage.WAITING_GATE_OUT) || 0}</span>
          <span>ขัดแย้ง ${Number(stage.DATA_CONFLICT) || 0}</span>
        </div>
      `;

      container.appendChild(card);
    });
  }

  function renderShiftHandover() {
    const panel =
      document.getElementById(
        'shiftHandoverPanel'
      );

    if (!panel) {
      return;
    }

    const board =
      state.operationalBoard || {};
    const handover =
      board.handover &&
      typeof board.handover === 'object'
        ? board.handover
        : {
            enabled: false,
            status: 'NOT_AVAILABLE',
            statusLabel:
              'ยังไม่พบข้อมูลส่งมอบอัตโนมัติ'
          };

    const status =
      String(
        handover.status ||
        'NOT_AVAILABLE'
      ).toUpperCase();
    const fromShift =
      handover.fromShift || {};
    const rawToShift =
      handover.toShift || {};
    const currentShift =
      board.currentShift || {};
    const activeShiftCount =
      board.shiftConfig &&
      Array.isArray(
        board.shiftConfig.shifts
      )
        ? board.shiftConfig.shifts
          .filter((shift) =>
            shift.active !== false
          ).length
        : 0;
    const fromCode =
      normalizeShiftCode(
        fromShift.code
      );
    const toCode =
      normalizeShiftCode(
        rawToShift.code
      );
    const sameShiftConflict = Boolean(
      activeShiftCount > 1 &&
      fromCode &&
      toCode &&
      fromCode === toCode
    );
    const pairValid =
      handover.pairValid !== false &&
      !sameShiftConflict;
    const toShift =
      pairValid
        ? rawToShift
        : currentShift;
    const effectiveStatus =
      pairValid
        ? status
        : 'PAIR_INVALID';

    panel.dataset.status =
      effectiveStatus;

    setText(
      'shiftHandoverStatus',
      pairValid
        ? handover.statusLabel || status
        : 'พบ Snapshot กะไม่ถูกต้อง · รอระบบซ่อมอัตโนมัติ'
    );
    setText(
      'mobileTabHandoverState',
      !pairValid
        ? '!'
        : handover.acknowledged === true
          ? '✓'
          : [
              'AUTO_FINALIZED',
              'ACKNOWLEDGED'
            ].includes(status)
            ? '!'
            : '–'
    );

    setText(
      'shiftHandoverFrom',
      fromShift.code
        ? formatShiftTitle(
            fromShift,
            fromShift.code
          )
        : '-'
    );

    setText(
      'shiftHandoverTo',
      toShift.code
        ? formatShiftTitle(
            toShift,
            toShift.code
          )
        : '-'
    );

    setText(
      'shiftHandoverUpdatedAt',
      handover.updatedAt ||
      handover.finalizedAt ||
      handover.draftAt ||
      handover.generatedAt ||
      '-'
    );

    const metricsNode =
      document.getElementById(
        'shiftHandoverMetrics'
      );

    const summary =
      handover.summary || {};
    const metrics =
      summary.metrics || {};

    if (metricsNode) {
      const metricItems = [
        ['คงค้างส่งต่อ', metrics.activeTotal],
        ['รอ พขร.ยื่นเอกสาร', metrics.waitingInboundDocument],
        ['รอรับสินค้า', metrics.waitingReceiving],
        ['พขร.รอเอกสารคืน', metrics.waitingDocumentReturn],
        ['รอ Gate Out', metrics.waitingGateOut],
        ['ข้อมูลขัดแย้ง', metrics.dataConflict],
        ['เกินเวลา', metrics.overdueAtEnd],
        ['ค้างข้ามกะ', metrics.carryOver]
      ];

      metricsNode.innerHTML =
        metricItems
          .map((item) => `
            <div>
              <span>${escapeHtml(item[0])}</span>
              <strong>${Number(item[1]) || 0}</strong>
            </div>
          `)
          .join('');
    }

    const noteParts = [];

    if (!pairValid) {
      noteParts.push(
        handover.pairWarning ||
        'Snapshot เดิมระบุกะส่งมอบและกะรับมอบเป็นกะเดียวกัน ระบบจะไม่ให้รับทราบรายการนี้'
      );
    }

    if (handover.autoTransferredAt) {
      noteParts.push(
        'ส่งมอบอัตโนมัติเมื่อ ' +
        handover.autoTransferredAt
      );
    }

    setText(
      'shiftHandoverNote',
      noteParts.length
        ? noteParts.join(' | ')
        : 'ระบบส่งมอบคงค้างให้กะถัดไปอัตโนมัติ ผู้ใช้ไม่ต้องกดหรือระบุข้อมูล'
    );

    const hasSnapshot = Boolean(
      handover.snapshotKey &&
      pairValid
    );
    const enabled =
      handover.enabled !== false;
    const finalized =
      pairValid &&
      [
        'AUTO_FINALIZED',
        'ACKNOWLEDGED'
      ].includes(status);

    const addNoteButton =
      document.getElementById(
        'shiftHandoverAddNote'
      );
    const acknowledgeButton =
      document.getElementById(
        'shiftHandoverAcknowledge'
      );
    const refreshButton =
      document.getElementById(
        'shiftHandoverRefresh'
      );

    if (addNoteButton) {
      addNoteButton.hidden = true;
      addNoteButton.disabled = true;
    }

    if (acknowledgeButton) {
      acknowledgeButton.hidden = true;
      acknowledgeButton.disabled = true;
    }

    if (refreshButton) {
      refreshButton.hidden =
        !isAdmin();
      refreshButton.disabled =
        state.handoverInProgress ||
        !enabled;
    }
  }


  async function handleShiftHandoverAction(
    action
  ) {
    if (
      state.handoverInProgress ||
      !API ||
      typeof API.updateShiftHandover !==
        'function'
    ) {
      return;
    }

    const handover =
      state.operationalBoard &&
      state.operationalBoard.handover ||
      {};

    const cleanAction =
      String(action || '')
        .trim()
        .toUpperCase();

    let note = '';

    if (cleanAction === 'ADD_NOTE') {
      const result =
        await Swal.fire({
          icon: 'info',
          title: 'หมายเหตุส่งมอบงาน',
          input: 'textarea',
          inputValue:
            handover.note || '',
          inputPlaceholder:
            'ระบุข้อมูลที่กะถัดไปควรทราบ',
          inputAttributes: {
            maxlength: '1000'
          },
          showCancelButton: true,
          confirmButtonText: 'บันทึกหมายเหตุ',
          cancelButtonText: 'ยกเลิก',
          reverseButtons: true
        });

      if (!result.isConfirmed) {
        return;
      }

      note =
        String(
          result.value || ''
        ).trim();
    }

    if (cleanAction === 'ACKNOWLEDGE') {
      const result =
        await Swal.fire({
          icon: 'question',
          title: 'รับทราบงานจากกะก่อน',
          text:
            'การรับทราบเป็นหลักฐานการเปิดดูเท่านั้น ไม่บล็อกการทำงานหลัก',
          input: 'textarea',
          inputPlaceholder:
            'หมายเหตุรับมอบ (ไม่บังคับ)',
          inputAttributes: {
            maxlength: '1000'
          },
          showCancelButton: true,
          confirmButtonText: 'รับทราบงาน',
          cancelButtonText: 'ยกเลิก',
          reverseButtons: true
        });

      if (!result.isConfirmed) {
        return;
      }

      note =
        String(
          result.value || ''
        ).trim();
    }

    if (cleanAction === 'REFRESH_SNAPSHOT') {
      const result =
        await Swal.fire({
          icon: 'warning',
          title: 'สร้าง Snapshot ใหม่',
          text:
            'ระบบจะคำนวณสถานะล่าสุดและอัปเดต Snapshot ส่งมอบของกะที่เกี่ยวข้อง',
          showCancelButton: true,
          confirmButtonText: 'สร้าง Snapshot',
          cancelButtonText: 'ยกเลิก',
          reverseButtons: true
        });

      if (!result.isConfirmed) {
        return;
      }
    }

    state.handoverInProgress = true;
    renderShiftHandover();

    try {
      const updated =
        await API.updateShiftHandover(
          state.moduleId,
          cleanAction,
          {
            snapshotKey:
              handover.snapshotKey || '',
            note: note
          }
        );

      if (
        state.operationalBoard &&
        updated
      ) {
        state.operationalBoard.handover =
          updated;
      }

      await Swal.fire({
        icon: 'success',
        title:
          cleanAction === 'ACKNOWLEDGE'
            ? 'รับทราบงานแล้ว'
            : cleanAction === 'ADD_NOTE'
              ? 'บันทึกหมายเหตุแล้ว'
              : 'อัปเดต Snapshot แล้ว',
        confirmButtonText: 'ตกลง',
        timer: 1300,
        timerProgressBar: true
      });

      await loadRecords({
        silentError: true,
        showSuccessToast: false,
        forceRender: true,
        forceRefresh: true
      });

    } catch (error) {
      await showApiError(
        error,
        'ดำเนินการส่งมอบงานไม่สำเร็จ'
      );

    } finally {
      state.handoverInProgress = false;
      renderShiftHandover();
    }
  }


  function syncOperationalFilterUi() {
    document
      .querySelectorAll(
        '[data-operational-stage]'
      )
      .forEach((button) => {
        const active =
          String(
            button.dataset
              .operationalStage ||
            'ALL'
          ).toUpperCase() ===
          String(
            state.operationalStageFilter ||
            'ALL'
          ).toUpperCase();

        button.classList.toggle(
          'is-active',
          active
        );
        button.setAttribute(
          'aria-pressed',
          active ? 'true' : 'false'
        );
      });

    document
      .querySelectorAll(
        '[data-operational-shift]'
      )
      .forEach((button) => {
        const active =
          String(
            button.dataset
              .operationalShift ||
            'ALL'
          ).toUpperCase() ===
          String(
            state.shiftFilter ||
            'ALL'
          ).toUpperCase();

        button.classList.toggle(
          'is-active',
          active
        );
        button.setAttribute(
          'aria-pressed',
          active ? 'true' : 'false'
        );
      });
  }

  function createOperationalStageBlock(record) {
    const meta =
      getOperationalStageMeta(
        record.operationalStage
      );
    const section =
      document.createElement(
        'section'
      );

    section.className =
      'vehicle-operational-stage';
    section.dataset.stage =
      record.operationalStage ||
      'DATA_CONFLICT';

    const heading =
      document.createElement('div');
    heading.className =
      'vehicle-operational-stage__heading';

    const title =
      document.createElement('strong');
    title.textContent =
      record.operationalStageLabel ||
      meta.label;

    const health =
      document.createElement('span');
    health.className =
      'vehicle-operational-health';
    health.dataset.health =
      record.dataHealthCode || 'OK';
    health.textContent =
      record.dataHealthLabel ||
      'ข้อมูลสอดคล้อง';

    heading.appendChild(title);
    heading.appendChild(health);

    const description =
      document.createElement('p');
    description.textContent =
      record.operationalStageDescription ||
      meta.description;

    const timeline =
      document.createElement('div');
    timeline.className =
      'vehicle-operational-stage__timeline';

    const stageTimes = [
      ['Gate In', record.timestampIn],
      ['พขร.ยื่นเอกสาร', record.documentSubmittedAt],
      ['รับสินค้าเสร็จ', record.receivingCompleteAt],
      ['พขร.รับเอกสารคืน', record.documentReturnedAt]
    ];

    stageTimes.forEach((item) => {
      const node =
        document.createElement('div');
      node.className =
        item[1]
          ? 'is-complete'
          : 'is-pending';
      node.innerHTML =
        '<span>' +
        escapeHtml(item[0]) +
        '</span><strong>' +
        escapeHtml(item[1] || '--:--:--') +
        '</strong>';
      timeline.appendChild(node);
    });

    const shifts =
      document.createElement('div');
    shifts.className =
      'vehicle-operational-stage__shifts';
    const currentShiftCode =
      record.currentShiftCode ||
      record.responsibleShiftCode ||
      record.ownerShiftCode ||
      '';

    shifts.innerHTML = `
      <span>กะที่รถเข้า <strong>${escapeHtml(record.entryShiftCode || '-')}</strong></span>
      <span>กะปัจจุบัน <strong>${escapeHtml(currentShiftCode || '-')}</strong></span>
      ${record.carryOver ? `<span class="is-carry">ส่งต่อ ${escapeHtml(record.entryShiftCode || '-')} → ${escapeHtml(currentShiftCode || '-')} <strong>${Number(record.carryOverShiftCount) || 1} ช่วงกะ</strong></span>` : ''}
    `;

    section.appendChild(heading);
    section.appendChild(description);
    section.appendChild(timeline);
    section.appendChild(shifts);

    if (
      record.receivingEnabled !== false
    ) {
      const actions =
        document.createElement('div');
      actions.className =
        'vehicle-operational-stage__actions';

      const button =
        document.createElement('button');
      button.type = 'button';
      button.className =
        'receiving-complete-button';
      button.dataset.recordId =
        record.recordId || '';
      button.dataset.canonicalRecordId =
        record.canonicalRecordId || '';
      button.dataset.sourceRowNumber =
        String(
          Number(record.sourceRowNumber) || 0
        );
      button.dataset.expectedTimestampIn =
        record.timestampIn || '';
      button.dataset.expectedTimestampInEpochMs =
        String(
          Number(record.timestampInEpochMs) || 0
        );
      button.dataset.expectedPrimaryValue =
        record.primaryValue || '';
      button.dataset.entryCode =
        record.autoId ||
        record.sourceAutoId ||
        '';
      button.dataset.operationalStage =
        record.operationalStage || '';
      button.dataset.canComplete =
        record.canCompleteReceiving
          ? 'TRUE'
          : 'FALSE';
      button.disabled =
        record.canCompleteReceiving !== true;
      button.setAttribute(
        'aria-disabled',
        button.disabled
          ? 'true'
          : 'false'
      );
      button.textContent =
        record.canCompleteReceiving
          ? 'บันทึกรับสินค้าเสร็จ'
          : meta.shortLabel;
      button.title =
        record.canCompleteReceiving
          ? 'บันทึกเวลารับสินค้าเสร็จ'
          : (
              record.operationalStageDescription ||
              meta.description
            );

      actions.appendChild(button);
      section.appendChild(actions);
    }

    return section;
  }

  function sortRecords(records) {
    const mode =
      String(
        state.sortMode ||
        'LONGEST'
      ).toUpperCase();

    records.sort(
      (left, right) => {
        if (mode === 'LONGEST') {
          const durationDelta =
            (Number(right.durationSeconds) || 0) -
            (Number(left.durationSeconds) || 0);

          if (durationDelta !== 0) {
            return durationDelta;
          }

          return (
            Number(left.timestampInEpochMs) || 0
          ) - (
            Number(right.timestampInEpochMs) || 0
          );
        }

        if (mode === 'NEWEST') {
          return (
            Number(right.timestampInEpochMs) || 0
          ) - (
            Number(left.timestampInEpochMs) || 0
          );
        }

        if (mode === 'APPOINTMENT') {
          return String(
            getPriorityIdentity(left)
              .appointmentNumber ||
            left.primaryValue ||
            ''
          ).localeCompare(
            String(
              getPriorityIdentity(right)
                .appointmentNumber ||
              right.primaryValue ||
              ''
            ),
            'th',
            {
              numeric: true,
              sensitivity: 'base'
            }
          );
        }

        if (mode === 'COMPANY') {
          return String(
            getPriorityIdentity(left)
              .companyName ||
            ''
          ).localeCompare(
            String(
              getPriorityIdentity(right)
                .companyName ||
              ''
            ),
            'th',
            {
              numeric: true,
              sensitivity: 'base'
            }
          );
        }

        const leftConflict =
          left.operationalStage ===
            'DATA_CONFLICT'
            ? 0
            : 1;
        const rightConflict =
          right.operationalStage ===
            'DATA_CONFLICT'
            ? 0
            : 1;

        if (leftConflict !== rightConflict) {
          return leftConflict - rightConflict;
        }

        const leftScore =
          Number.isFinite(
            Number(left.priorityScore)
          )
            ? Number(left.priorityScore)
            : 999999999999;
        const rightScore =
          Number.isFinite(
            Number(right.priorityScore)
          )
            ? Number(right.priorityScore)
            : 999999999999;

        if (leftScore !== rightScore) {
          return leftScore - rightScore;
        }

        const leftOperationalOrder =
          Number(left.operationalStageOrder) ||
          50;
        const rightOperationalOrder =
          Number(right.operationalStageOrder) ||
          50;

        if (
          leftOperationalOrder !==
          rightOperationalOrder
        ) {
          return leftOperationalOrder -
            rightOperationalOrder;
        }

        return (
          Number(left.timestampInEpochMs) || 0
        ) - (
          Number(right.timestampInEpochMs) || 0
        );
      }
    );
  }


  function renderWarehouseSituation(
    summary
  ) {
    const element =
      document.getElementById(
        'warehouseSituation'
      );

    if (!element) {
      return;
    }

    let stateCode =
      'NORMAL';

    let label =
      'สถานการณ์ปกติ';

    let message =
      'ยังไม่มีรายการที่ต้องเร่งดำเนินการ';

    if (
      summary.nearAutoClose > 0
    ) {
      stateCode =
        'AUTO_CLOSE';

      label =
        'มีรายการค้างนาน';

      message =
        summary.nearAutoClose +
        ' รายการใกล้ครบ ' +
        getModuleThresholds().autoCloseHours +
        ' ชั่วโมง';

    } else if (
      summary.overdue > 0
    ) {
      stateCode =
        'CRITICAL';

      label =
        'ต้องเร่งดำเนินการ';

      message =
        summary.overdue +
        ' รายการเกินเกณฑ์ของโมดูล';

    } else if (
      summary.warning > 0
    ) {
      stateCode =
        'WATCH';

      label =
        'ต้องติดตามใกล้ชิด';

      message =
        summary.warning +
        ' รายการใกล้เกินเวลา';

    } else if (
      summary.incomplete > 0
    ) {
      stateCode =
        'DATA';

      label =
        'ต้องตรวจสอบข้อมูล';

      message =
        summary.incomplete +
        ' รายการมีข้อมูลไม่สมบูรณ์';
    }

    element.dataset.state =
      stateCode;

    setText(
      'situationLabel',
      label
    );

    setText(
      'situationMessage',
      message
    );
  }


  function renderTimeline() {
    const container =
      document.getElementById(
        'hourlyTimeline'
      );

    if (!container) {
      return;
    }

    document
      .querySelectorAll(
        '[data-timeline-mode]'
      )
      .forEach(
        (button) => {
          button.classList.toggle(
            'is-active',
            String(
              button.dataset.timelineMode ||
              ''
            ).toUpperCase() ===
            state.timelineMode
          );
        }
      );

    const slots =
      buildTimelineSlots();

    container.innerHTML =
      slots.map(
        (slot) => {
          const selected =
            state.selectedTimelineStartMs ===
            slot.startMs;

          return `
            <button
              type="button"
              class="timeline-hour timeline-hour--movement${selected ? ' is-selected' : ''}${slot.isCurrent ? ' is-current' : ''}"
              data-hour-start-ms="${slot.startMs}"
              data-hour-end-ms="${slot.endMs}"
              data-hour-label="${escapeHtml(slot.fullLabel)}"
              data-in="${slot.in}"
              data-out="${slot.outTotal}"
              data-out-real="${slot.outReal}"
              data-out-auto="${slot.outAuto}"
              data-net="${slot.net}"
              data-movement-total="${slot.movementTotal}"
              data-status="${escapeHtml(slot.statusCode)}"
              aria-pressed="${selected ? 'true' : 'false'}"
            >
              <span class="timeline-hour__time">${escapeHtml(slot.label)}</span>

              <div class="timeline-hour__movement">
                <span>
                  <small>เข้า</small>
                  <strong>${slot.in}</strong>
                </span>

                <span>
                  <small>ออก</small>
                  <strong>${slot.outTotal}</strong>
                </span>
              </div>

              <div class="timeline-hour__net">
                สุทธิ
                <strong>${escapeHtml(formatSignedNumber(slot.net))}</strong>
              </div>

              <small class="timeline-hour__caption">${escapeHtml(slot.caption)}</small>
              <i aria-hidden="true"></i>
            </button>
          `;
        }
      ).join('');

    const clearButton =
      document.getElementById(
        'timelineClearButton'
      );

    if (clearButton) {
      clearButton.classList.toggle(
        'is-hidden',
        state.selectedTimelineStartMs ===
          null
      );
    }

    window.requestAnimationFrame(
      () => {
        updateTimelineCenterEffect(
          container
        );
      }
    );

    if (
      state.timelineShouldFocus
    ) {
      state.timelineShouldFocus =
        false;

      window.requestAnimationFrame(
        () => {
          const target =
            container.querySelector(
              '.timeline-hour.is-current'
            ) ||
            container.lastElementChild;

          target &&
            target.scrollIntoView({
              behavior: 'auto',
              block: 'nearest',
              inline: 'center'
            });

          window.requestAnimationFrame(
            () => {
              updateTimelineCenterEffect(
                container
              );
            }
          );
        }
      );
    }
  }


  function scheduleTimelineCenterEffect(
    container
  ) {
    if (
      state.timelineScrollRaf
    ) {
      window.cancelAnimationFrame(
        state.timelineScrollRaf
      );
    }

    state.timelineScrollRaf =
      window.requestAnimationFrame(
        () => {
          state.timelineScrollRaf =
            null;

          updateTimelineCenterEffect(
            container
          );
        }
      );
  }


  function updateTimelineCenterEffect(
    container
  ) {
    if (!container) {
      return;
    }

    const items =
      Array.from(
        container.querySelectorAll(
          '.timeline-hour'
        )
      );

    if (
      items.length === 0
    ) {
      return;
    }

    const containerRect =
      container.getBoundingClientRect();

    const centerX =
      containerRect.left +
      containerRect.width / 2;

    const maximumDistance =
      Math.max(
        1,
        containerRect.width * 0.46
      );

    let nearestItem =
      null;

    let nearestDistance =
      Number.POSITIVE_INFINITY;

    items.forEach(
      (item) => {
        const rect =
          item.getBoundingClientRect();

        const itemCenter =
          rect.left +
          rect.width / 2;

        const distance =
          Math.abs(
            itemCenter -
            centerX
          );

        const proximity =
          1 -
          Math.min(
            1,
            distance /
            maximumDistance
          );

        const eased =
          proximity *
          proximity;

        /*
         * High Contrast Carousel
         * การ์ดด้านข้างยังต้องอ่านได้ ไม่ย่อหรือจางมากเกินไป
         */
        const scale =
          0.72 +
          eased * 0.50;

        const opacity =
          0.58 +
          proximity * 0.42;

        const blur =
          Math.max(
            0,
            (
              1 - proximity
            ) * 0.20
          );

        const lift =
          eased * -10;

        item.style.setProperty(
          '--timeline-focus-scale',
          scale.toFixed(3)
        );

        item.style.setProperty(
          '--timeline-focus-opacity',
          opacity.toFixed(3)
        );

        item.style.setProperty(
          '--timeline-focus-blur',
          blur.toFixed(2) + 'px'
        );

        item.style.setProperty(
          '--timeline-focus-lift',
          lift.toFixed(1) + 'px'
        );

        item.style.zIndex =
          String(
            Math.round(
              proximity * 20
            )
          );

        item.classList.remove(
          'is-centered'
        );

        if (
          distance <
          nearestDistance
        ) {
          nearestDistance =
            distance;

          nearestItem =
            item;
        }
      }
    );

    if (nearestItem) {
      nearestItem.classList.add(
        'is-centered'
      );

      state.timelineFocusedStartMs =
        Number(
          nearestItem.dataset.hourStartMs
        );

      renderTimelineFocusPreviewFromElement(
        nearestItem
      );
    }
  }


  function renderTimelineFocusPreviewFromElement(
    element
  ) {
    if (!element) {
      return;
    }

    setText(
      'timelineFocusLabel',
      element.dataset.hourLabel ||
      '--:00–--:59'
    );

    setText(
      'timelineFocusIn',
      element.dataset.in ||
      '0'
    );

    setText(
      'timelineFocusOut',
      element.dataset.out ||
      '0'
    );

    setText(
      'timelineFocusNet',
      formatSignedNumber(
        element.dataset.net
      )
    );

    setText(
      'timelineFocusMovement',
      element.dataset.movementTotal ||
      '0'
    );

    setText(
      'timelineFocusOutDetail',
      'ออกจริง ' +
      (
        element.dataset.outReal ||
        '0'
      ) +
      ' • ระบบปิด ' +
      (
        element.dataset.outAuto ||
        '0'
      )
    );

    const preview =
      document.getElementById(
        'timelineFocusPreview'
      );

    if (preview) {
      preview.dataset.status =
        element.dataset.status ||
        'EMPTY';
    }

    const applyButton =
      document.getElementById(
        'timelineApplyFilterButton'
      );

    if (applyButton) {
      const focusedStart =
        Number(
          element.dataset.hourStartMs
        );

      applyButton.textContent =
        state.selectedTimelineStartMs ===
          focusedStart
          ? 'กำลังกรองชั่วโมงนี้'
          : 'กรองรายการชั่วโมงนี้';
    }
  }



  function scheduleTimelineCenterSnap(
    container
  ) {
    if (
      state.timelineSnapTimer
    ) {
      window.clearTimeout(
        state.timelineSnapTimer
      );
    }

    state.timelineSnapTimer =
      window.setTimeout(
        () => {
          state.timelineSnapTimer =
            null;

          if (
            !container ||
            state.destroyed ||
            container.scrollWidth <=
              container.clientWidth + 4
          ) {
            return;
          }

          const centered =
            container.querySelector(
              '.timeline-hour.is-centered'
            );

          centered &&
            centered.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest',
              inline: 'center'
            });
        },
        135
      );
  }



  function buildTimelineSlots() {
    const summary =
      state.movementSummary;

    const movementHours =
      summary &&
      summary.hours
        ? (
            state.timelineMode ===
              'TODAY'
              ? summary.hours.today
              : summary.hours.rolling24
          )
        : null;

    if (
      Array.isArray(movementHours) &&
      movementHours.length > 0
    ) {
      const currentHourStart =
        getBangkokHourStartMs(
          getCurrentServerTimeMs()
        );

      return movementHours.map(
        (hour) => {
          const startMs =
            Number(
              hour.startEpochMs
            ) ||
            parseBangkokDateTime(
              hour.start
            )?.getTime() ||
            0;

          const endMs =
            Number(
              hour.endEpochMs
            ) ||
            (
              startMs +
              60 * 60 * 1000
            );

          const inValue =
            Number(hour.in) || 0;

          const outReal =
            Number(hour.outReal) || 0;

          const outAuto =
            Number(hour.outAuto) || 0;

          const outTotal =
            Number(hour.outTotal) ||
            outReal + outAuto;

          const movementTotal =
            Number(hour.movementTotal) ||
            inValue + outTotal;

          const net =
            Number(hour.net) ||
            inValue - outTotal;

          return {
            startMs,
            endMs,
            label:
              String(
                hour.label ||
                getBangkokDateParts(
                  startMs
                ).hour
              ).padStart(2, '0'),
            fullLabel:
              formatTimelineRange(
                startMs
              ),
            in: inValue,
            outReal,
            outAuto,
            outTotal,
            movementTotal,
            net,
            total: movementTotal,
            activeNow:
              Number(hour.activeNow) || 0,
            statusCode:
              String(
                hour.statusCode ||
                'EMPTY'
              ).toUpperCase(),
            isCurrent:
              startMs ===
              currentHourStart,
            caption:
              movementTotal > 0
                ? 'รวม ' +
                  movementTotal +
                  ' ครั้ง'
                : 'ไม่มีการเคลื่อนไหว'
          };
        }
      );
    }

    return buildFallbackTimelineSlots();
  }




  function buildFallbackTimelineSlots() {
    const nowMs =
      getCurrentServerTimeMs();

    const currentHourStart =
      getBangkokHourStartMs(
        nowMs
      );

    const slots = [];

    if (
      state.timelineMode ===
      'TODAY'
    ) {
      const dayStart =
        getBangkokDayStartMs(
          nowMs
        );

      for (
        let hour = 0;
        hour < 24;
        hour += 1
      ) {
        const startMs =
          dayStart +
          hour * 60 * 60 * 1000;

        slots.push(
          buildTimelineSlot(
            startMs,
            String(hour).padStart(
              2,
              '0'
            )
          )
        );
      }

    } else {
      for (
        let offset = 23;
        offset >= 0;
        offset -= 1
      ) {
        const startMs =
          currentHourStart -
          offset * 60 * 60 * 1000;

        slots.push(
          buildTimelineSlot(
            startMs,
            getBangkokDateParts(
              startMs
            ).hour
          )
        );
      }
    }

    return slots;
  }
  function buildTimelineSlot(
    startMs,
    label
  ) {
    const endMs =
      startMs +
      60 * 60 * 1000;

    const records =
      state.records.filter(
        (record) => {
          const timestamp =
            getRecordTimestampInMs(
              record
            );

          return (
            timestamp >= startMs &&
            timestamp < endMs
          );
        }
      );

    const summary =
      buildLocalSummary(records);

    let statusCode =
      'EMPTY';

    if (
      summary.nearAutoClose > 0
    ) {
      statusCode =
        'AUTO_CLOSE';

    } else if (
      summary.overdue > 0
    ) {
      statusCode =
        'OVERDUE';

    } else if (
      summary.warning > 0
    ) {
      statusCode =
        'WARNING';

    } else if (
      summary.normal > 0
    ) {
      statusCode =
        'NORMAL';

    } else if (
      summary.incomplete > 0
    ) {
      statusCode =
        'INCOMPLETE';
    }

    const currentHourStart =
      getBangkokHourStartMs(
        getCurrentServerTimeMs()
      );

    return {
      startMs,
      endMs,
      label,
      fullLabel:
        formatTimelineRange(
          startMs
        ),
      in: records.length,
      outReal: 0,
      outAuto: 0,
      outTotal: 0,
      movementTotal:
        records.length,
      net:
        records.length,
      total:
        records.length,
      activeNow:
        records.length,
      statusCode,
      isCurrent:
        startMs ===
        currentHourStart,
      caption:
        records.length > 0
          ? 'Active ' +
            records.length
          : 'ไม่มีรายการ'
    };
  }


  function recordMatchesTimeline(
    record
  ) {
    if (
      state.selectedTimelineStartMs ===
      null
    ) {
      return true;
    }

    const timestamp =
      getRecordTimestampInMs(
        record
      );

    return (
      timestamp >=
        state.selectedTimelineStartMs &&
      timestamp <
        state.selectedTimelineStartMs +
        60 * 60 * 1000
    );
  }


  function updateActiveFilterText() {
    const element =
      document.getElementById(
        'activeTimelineFilter'
      );

    if (!element) {
      return;
    }

    if (
      state.selectedTimelineStartMs ===
      null
    ) {
      element.textContent =
        'แสดงทุกชั่วโมง';

      return;
    }

    element.textContent =
      'กรองเวลาเข้า ' +
      formatTimelineRange(
        state.selectedTimelineStartMs
      );
  }


  function getRecordTimestampInMs(
    record
  ) {
    const epoch =
      Number(
        record &&
        record.timestampInEpochMs
      );

    if (
      Number.isFinite(epoch)
    ) {
      return epoch;
    }

    const parsed =
      parseBangkokDateTime(
        record &&
        record.timestampIn
      );

    return parsed
      ? parsed.getTime()
      : 0;
  }


  function getBangkokDateParts(
    timestampMs
  ) {
    const formatter =
      new Intl.DateTimeFormat(
        'en-GB',
        {
          timeZone:
            CONFIG.TIMEZONE ||
            'Asia/Bangkok',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: 'h23'
        }
      );

    const result = {};

    formatter
      .formatToParts(
        new Date(timestampMs)
      )
      .forEach(
        (part) => {
          result[part.type] =
            part.value;
        }
      );

    return result;
  }


  function getBangkokHourStartMs(
    timestampMs
  ) {
    const parts =
      getBangkokDateParts(
        timestampMs
      );

    return new Date(
      parts.year +
      '-' +
      parts.month +
      '-' +
      parts.day +
      'T' +
      parts.hour +
      ':00:00+07:00'
    ).getTime();
  }


  function getBangkokDayStartMs(
    timestampMs
  ) {
    const parts =
      getBangkokDateParts(
        timestampMs
      );

    return new Date(
      parts.year +
      '-' +
      parts.month +
      '-' +
      parts.day +
      'T00:00:00+07:00'
    ).getTime();
  }


  function formatTimelineHourLabel(
    timestampMs,
    current
  ) {
    const parts =
      getBangkokDateParts(
        timestampMs
      );

    return current
      ? 'ตอนนี้ ' +
        parts.hour
      : parts.hour;
  }


  function formatTimelineRange(
    startMs
  ) {
    const parts =
      getBangkokDateParts(
        startMs
      );

    return (
      parts.day +
      '/' +
      parts.month +
      ' ' +
      parts.hour +
      ':00–' +
      parts.hour +
      ':59'
    );
  }
  function renderVehicleCards(records) {
    const container =
      document.getElementById(
        'vehicleList'
      );

    const emptyState =
      document.getElementById(
        'vehicleEmpty'
      );

    if (!container) {
      return;
    }

    state.cardNodes.clear();
    container.innerHTML = '';

    if (
      !records ||
      records.length === 0
    ) {
      emptyState &&
        emptyState.classList.remove(
          'is-hidden'
        );

      return;
    }

    emptyState &&
      emptyState.classList.add(
        'is-hidden'
      );

    const fragment =
      document.createDocumentFragment();

    records.forEach(
      (record, index) => {
        const result =
          createVehicleCard(
            record,
            index
          );

        fragment.appendChild(
          result.element
        );

        state.cardNodes.set(
          record.recordId,
          result.nodes
        );
      }
    );

    container.appendChild(
      fragment
    );
  }



  function normalizeBooleanFlag(
    value
  ) {
    if (value === true) {
      return true;
    }

    const text =
      String(
        value === null ||
        value === undefined
          ? ''
          : value
      )
        .trim()
        .toUpperCase();

    return [
      'TRUE',
      '1',
      'YES',
      'Y',
      'ON'
    ].includes(text);
  }


  function isPrimaryField(
    field
  ) {
    if (!field) {
      return false;
    }

    return (
      normalizeBooleanFlag(
        field.primary
      ) ||
      normalizeBooleanFlag(
        field.isPrimary
      ) ||
      normalizeBooleanFlag(
        field.isPrimaryField
      ) ||
      String(
        field.role || ''
      ).trim().toUpperCase() ===
        'PRIMARY'
    );
  }


  function getPrimaryField(
    record
  ) {
    const fields =
      Array.isArray(
        record &&
        record.fields
      )
        ? record.fields
        : [];

    return (
      fields.find(
        (field) =>
          isPrimaryField(field)
      ) ||
      null
    );
  }


  function getPrimaryLabel(
    record
  ) {
    const primaryField =
      getPrimaryField(record);

    return String(
      record &&
      (
        record.primaryLabel ||
        record.primaryDisplayName
      ) ||
      primaryField &&
      (
        primaryField.label ||
        primaryField.displayName ||
        primaryField.name
      ) ||
      'ข้อมูลหลัก'
    ).trim();
  }


  function normalizeComparableText(
    value
  ) {
    return String(
      value === null ||
      value === undefined
        ? ''
        : value
    )
      .trim()
      .replace(
        /\s+/g,
        ' '
      )
      .toLowerCase();
  }


  function normalizeFieldLabel(
    value
  ) {
    return normalizeComparableText(
      value
    )
      .replace(
        /[\s_\-:]+/g,
        ''
      );
  }


  function isTimestampInField(
    field,
    record
  ) {
    const label =
      normalizeFieldLabel(
        field &&
        (
          field.label ||
          field.displayName ||
          field.name
        )
      );

    const value =
      normalizeComparableText(
        field &&
        field.value
      );

    const timestampIn =
      normalizeComparableText(
        record &&
        record.timestampIn
      );

    const aliases = [
      'เวลาเข้าพื้นที่',
      'เวลาเข้า',
      'timestampin',
      'intimestamp',
      'checkintime'
    ];

    return (
      aliases.includes(label) ||
      (
        timestampIn &&
        value === timestampIn &&
        (
          label.includes('เวลาเข้า') ||
          label.includes('timestampin')
        )
      )
    );
  }


  function isAppointmentFieldLabel(value) {
    const label =
      normalizeFieldLabel(value);

    return (
      label.includes('เลขนัดหมาย') ||
      label.includes('หมายเลขนัดหมาย') ||
      label.includes('appointment') ||
      label.includes('bookingnumber') ||
      label === 'booking'
    );
  }


  function isCompanyFieldLabel(value) {
    const label =
      normalizeFieldLabel(value);

    return (
      label.includes('บริษัท') ||
      label.includes('company') ||
      label.includes('vendor') ||
      label.includes('supplier')
    );
  }


  function getPriorityIdentity(record) {
    const data =
      record &&
      typeof record === 'object'
        ? record
        : {};

    const result = {
      appointmentNumber:
        String(
          data.appointmentNumber ||
          data.appointment ||
          ''
        ).trim(),
      companyName:
        String(
          data.companyName ||
          data.company ||
          ''
        ).trim()
    };

    const fields =
      Array.isArray(data.fields)
        ? data.fields
        : [];

    fields.forEach((field) => {
      const label =
        field &&
        (
          field.label ||
          field.displayName ||
          field.name
        );
      const value =
        String(
          field && field.value ||
          ''
        ).trim();

      if (!value) {
        return;
      }

      if (
        !result.appointmentNumber &&
        isAppointmentFieldLabel(label)
      ) {
        result.appointmentNumber =
          value;
      }

      if (
        !result.companyName &&
        isCompanyFieldLabel(label)
      ) {
        result.companyName =
          value;
      }
    });

    const primaryLabel =
      getPrimaryLabel(data);
    const primaryValue =
      String(
        data.primaryValue || ''
      ).trim();

    if (
      !result.appointmentNumber &&
      primaryValue &&
      isAppointmentFieldLabel(
        primaryLabel
      )
    ) {
      result.appointmentNumber =
        primaryValue;
    }

    if (
      !result.companyName &&
      primaryValue &&
      isCompanyFieldLabel(
        primaryLabel
      )
    ) {
      result.companyName =
        primaryValue;
    }

    return result;
  }


  function isPriorityIdentityField(
    field,
    identity
  ) {
    const label =
      field &&
      (
        field.label ||
        field.displayName ||
        field.name
      );
    const value =
      normalizeComparableText(
        field && field.value
      );

    return (
      isAppointmentFieldLabel(label) ||
      isCompanyFieldLabel(label) ||
      (
        identity.appointmentNumber &&
        value ===
          normalizeComparableText(
            identity.appointmentNumber
          )
      ) ||
      (
        identity.companyName &&
        value ===
          normalizeComparableText(
            identity.companyName
          )
      )
    );
  }


  function getDisplayFields(
    record,
    options
  ) {
    const config =
      options &&
      typeof options === 'object'
        ? options
        : {};

    const fields =
      Array.isArray(
        record &&
        record.fields
      )
        ? record.fields
        : [];

    const primaryValue =
      normalizeComparableText(
        record &&
        record.primaryValue
      );

    const priorityIdentity =
      getPriorityIdentity(record);

    const unique =
      new Set();

    return fields
      .filter(
        (field) => {
          if (
            !field ||
            !String(
              field.value || ''
            ).trim()
          ) {
            return false;
          }

          if (
            isPrimaryField(field)
          ) {
            return false;
          }

          if (
            isPriorityIdentityField(
              field,
              priorityIdentity
            )
          ) {
            return false;
          }

          const fieldValue =
            normalizeComparableText(
              field.value
            );

          /*
           * ป้องกันข้อมูลหลักกลับมาแสดงซ้ำ
           * แม้ Backend รุ่นเก่าจะไม่ได้ส่ง primary=true
           */
          if (
            primaryValue &&
            fieldValue ===
              primaryValue
          ) {
            return false;
          }

          if (
            config.excludeTimestampIn !==
              false &&
            isTimestampInField(
              field,
              record
            )
          ) {
            return false;
          }

          const label =
            String(
              field.label ||
              field.displayName ||
              field.name ||
              '-'
            ).trim();

          const uniqueKey =
            normalizeFieldLabel(label) +
            '|' +
            fieldValue;

          if (
            unique.has(
              uniqueKey
            )
          ) {
            return false;
          }

          unique.add(
            uniqueKey
          );

          return true;
        }
      )
      .sort(
        (left, right) =>
          Number(
            left.order ||
            left.position ||
            0
          ) -
          Number(
            right.order ||
            right.position ||
            0
          )
      );
  }
  function createVehicleCard(
    record,
    index
  ) {
    const priorityIdentity =
      getPriorityIdentity(record);

    const article =
      document.createElement(
        'article'
      );

    article.className =
      'vehicle-card vehicle-card--professional';

    article.dataset.status =
      record.statusCode ||
      'INCOMPLETE';

    article.dataset.recordId =
      record.recordId || '';

    article.dataset.canonicalRecordId =
      record.canonicalRecordId || '';

    article.dataset.operationalStage =
      record.operationalStage ||
      'DATA_CONFLICT';

    article.dataset.entryShift =
      record.entryShiftCode || '';

    article.dataset.ownerShift =
      record.ownerShiftCode || '';

    article.dataset.carryOver =
      record.carryOver
        ? 'TRUE'
        : 'FALSE';

    article.dataset.nearAutoClose =
      record.isNearAutoClose
        ? 'TRUE'
        : 'FALSE';

    article.tabIndex =
      0;

    article.setAttribute(
      'role',
      'button'
    );

    article.setAttribute(
      'aria-label',
      'ดูรายละเอียด ' +
      (
        priorityIdentity.appointmentNumber ||
        priorityIdentity.companyName ||
        record.primaryValue ||
        'รายการรถ'
      )
    );

    const statusRail =
      document.createElement(
        'div'
      );

    statusRail.className =
      'vehicle-card__rail';

    const rank =
      document.createElement(
        'span'
      );

    rank.className =
      'vehicle-card__rank';

    rank.textContent =
      index < 3
        ? 'เร่งด่วน ' +
          (index + 1)
        : 'ลำดับ ' +
          (index + 1);

    const header =
      document.createElement(
        'div'
      );

    header.className =
      'vehicle-card__header';

    const titleWrap =
      document.createElement(
        'div'
      );

    titleWrap.className =
      'vehicle-card__title-wrap';

    const primaryLabel =
      document.createElement(
        'span'
      );

    primaryLabel.className =
      'vehicle-card__primary-label';

    primaryLabel.textContent =
      priorityIdentity.appointmentNumber
        ? 'เลขนัดหมาย'
        : getPrimaryLabel(record);

    const title =
      document.createElement(
        'h2'
      );

    title.className =
      'vehicle-card__title vehicle-card__appointment';

    title.textContent =
      priorityIdentity.appointmentNumber ||
      record.primaryValue ||
      'ไม่พบเลขนัดหมาย';

    const companyLabel =
      document.createElement(
        'span'
      );
    companyLabel.className =
      'vehicle-card__company-label';
    companyLabel.textContent =
      'บริษัท';

    const company =
      document.createElement(
        'p'
      );
    company.className =
      'vehicle-card__company';
    company.textContent =
      priorityIdentity.companyName ||
      'ไม่พบชื่อบริษัท';

    const statusLine =
      document.createElement(
        'div'
      );

    statusLine.className =
      'vehicle-card__status-line';

    const statusBadge =
      document.createElement(
        'span'
      );

    statusBadge.className =
      'vehicle-status-badge';

    statusBadge.dataset.status =
      record.statusCode ||
      'INCOMPLETE';

    statusBadge.textContent =
      record.statusLabel ||
      'ไม่ทราบสถานะ';

    const timer =
      document.createElement(
        'strong'
      );

    timer.className =
      'vehicle-card__timer';

    timer.textContent =
      record.durationDisplay ||
      '--:--:--';

    statusLine.appendChild(
      statusBadge
    );

    statusLine.appendChild(
      timer
    );

    titleWrap.appendChild(
      primaryLabel
    );

    titleWrap.appendChild(
      title
    );

    titleWrap.appendChild(
      companyLabel
    );

    titleWrap.appendChild(
      company
    );

    titleWrap.appendChild(
      statusLine
    );

    header.appendChild(
      titleWrap
    );

    const progress =
      document.createElement(
        'div'
      );

    progress.className =
      'vehicle-progress';

    const progressTrack =
      document.createElement(
        'div'
      );

    progressTrack.className =
      'vehicle-progress__track';

    const progressFill =
      document.createElement(
        'div'
      );

    progressFill.className =
      'vehicle-progress__fill';

    progressFill.style.width =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            record.progressPercent
          ) || 0
        )
      ) + '%';

    const warningMarker =
      document.createElement(
        'span'
      );

    warningMarker.className =
      'vehicle-progress__marker';

    warningMarker.style.left =
      Math.max(
        0,
        Math.min(
          100,
          Number(
            record.warningMarkerPercent
          ) || 0
        )
      ) + '%';

    progressTrack.appendChild(
      progressFill
    );

    progressTrack.appendChild(
      warningMarker
    );

    const progressLabels =
      document.createElement(
        'div'
      );

    progressLabels.className =
      'vehicle-progress__labels';

    const thresholds =
      getRecordStageThresholds(
        record,
        getCurrentServerTimeMs()
      );

    progressLabels.innerHTML = thresholds.configured
      ? `
          <span>เริ่มขั้นตอน</span>
          <span>เฝ้าระวัง ${escapeHtml(String(thresholds.warningMinutes))} นาที</span>
          <span>เกินเวลา ${escapeHtml(String(thresholds.redMinutes))} นาที</span>
        `
      : `
          <span>เริ่มขั้นตอน</span>
          <span>ยังไม่ตั้งเกณฑ์</span>
          <span>ตรวจสอบใน Admin</span>
        `;

    progress.appendChild(
      progressTrack
    );

    progress.appendChild(
      progressLabels
    );

    const priorityText =
      document.createElement(
        'p'
      );

    priorityText.className =
      'vehicle-card__priority-text';

    priorityText.textContent =
      record.priorityText ||
      'กำลังประเมินสถานะ';

    const detailGrid =
      document.createElement(
        'div'
      );

    detailGrid.className =
      'vehicle-detail-grid';

    getDisplayFields(
      record,
      {
        excludeTimestampIn: true
      }
    )
      .slice(0, 4)
      .forEach(
        (field) => {
          detailGrid.appendChild(
            createFieldElement(field)
          );
        }
      );

    const operationalBlock =
      createOperationalStageBlock(
        record
      );

    const footer =
      document.createElement(
        'div'
      );

    footer.className =
      'vehicle-card__footer';

    const inTime =
      document.createElement(
        'div'
      );

    inTime.className =
      'vehicle-in-time';

    const inTimeLabel =
      document.createElement(
        'span'
      );

    inTimeLabel.textContent =
      'เวลาเข้าพื้นที่';

    const inTimeValue =
      document.createElement(
        'strong'
      );

    inTimeValue.textContent =
      record.timestampIn ||
      'ไม่พบข้อมูล';

    inTime.appendChild(
      inTimeLabel
    );

    inTime.appendChild(
      inTimeValue
    );

    footer.appendChild(
      inTime
    );

    if (
      record.canCheckout &&
      isAdmin()
    ) {
      const checkoutButton =
        document.createElement(
          'button'
        );

      checkoutButton.type =
        'button';

      checkoutButton.className =
        'button button--checkout';

      checkoutButton.textContent =
        'บันทึกออกพื้นที่';

      checkoutButton.addEventListener(
        'click',
        (event) => {
          event.stopPropagation();

          handleCheckout(
            record,
            checkoutButton
          );
        }
      );

      footer.appendChild(
        checkoutButton
      );
    }

    article.appendChild(
      statusRail
    );

    article.appendChild(
      rank
    );

    article.appendChild(
      header
    );

    article.appendChild(
      progress
    );

    article.appendChild(
      priorityText
    );

    if (
      detailGrid.childElementCount > 0
    ) {
      article.appendChild(
        detailGrid
      );
    }

    if (operationalBlock) {
      article.appendChild(
        operationalBlock
      );
    }

    article.appendChild(
      footer
    );

    const openDetails =
      (event) => {
        if (
          event &&
          event.target.closest(
            'button, a, input, select'
          )
        ) {
          return;
        }

        openRecordDetail(
          record
        );
      };

    article.addEventListener(
      'click',
      openDetails
    );

    article.addEventListener(
      'keydown',
      (event) => {
        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault();
          openRecordDetail(record);
        }
      }
    );

    return {
      element: article,
      nodes: {
        card: article,
        timer,
        statusBadge,
        progressFill,
        priorityText
      }
    };
  }

  function createFieldElement(field) {
    const item = document.createElement('div');
    item.className = 'vehicle-field';

    const label = document.createElement('span');
    label.textContent = field.label || '-';
    item.appendChild(label);

    if (field.type === 'PHONE') {
      const link = document.createElement('a');
      link.href =
        'tel:' +
        sanitizePhone(field.value);
      link.textContent = field.value;
      item.appendChild(link);
      return item;
    }

    const value = document.createElement('strong');
    value.textContent = field.value;
    item.appendChild(value);

    return item;
  }



  function normalizeShiftCode(value) {
    return String(value || '')
      .trim()
      .replace(/^กะ\s*/i, '')
      .trim()
      .toUpperCase();
  }

  function formatShiftTitle(
    shift,
    fallbackCode
  ) {
    const data =
      shift && typeof shift === 'object'
        ? shift
        : {};
    const code = normalizeShiftCode(
      data.code ||
      data.shiftCode ||
      fallbackCode ||
      ''
    );
    const rawName = String(
      data.name ||
      data.shiftName ||
      ''
    ).trim();
    const normalizedName =
      normalizeShiftCode(rawName);
    const meaningfulName =
      rawName &&
      normalizedName !== code
        ? rawName
        : '';

    if (!code) {
      return '-';
    }

    return (
      'กะ ' + code +
      (
        meaningfulName
          ? ' · ' + meaningfulName
          : ''
      )
    );
  }

  function formatShiftWindow(shift) {
    const data =
      shift && typeof shift === 'object'
        ? shift
        : {};
    const start = String(
      data.start || ''
    ).trim();
    const end = String(
      data.end || ''
    ).trim();
    const businessDate = String(
      data.businessDate || ''
    ).trim();
    const parts = [];

    if (start || end) {
      parts.push(
        (start || '--:--') +
        '–' +
        (end || '--:--')
      );
    }

    if (businessDate) {
      parts.push(
        'วันปฏิบัติงาน ' +
        businessDate
      );
    }

    return parts.join(' · ') ||
      'ไม่พบช่วงเวลากะ';
  }

  function buildRecordShiftPresentation(record) {
    const board =
      state.operationalBoard || {};
    const entryShift =
      record.entryShift &&
      typeof record.entryShift === 'object'
        ? record.entryShift
        : {};
    const currentShift =
      record.currentShift &&
      typeof record.currentShift === 'object'
        ? record.currentShift
        : record.responsibleShift &&
          typeof record.responsibleShift === 'object'
          ? record.responsibleShift
          : board.currentShift &&
            typeof board.currentShift === 'object'
            ? board.currentShift
            : record.ownerShift &&
              typeof record.ownerShift === 'object'
              ? record.ownerShift
              : {};
    const entryCode = normalizeShiftCode(
      entryShift.code ||
      record.entryShiftCode ||
      ''
    );
    const currentCode = normalizeShiftCode(
      currentShift.code ||
      record.currentShiftCode ||
      record.responsibleShiftCode ||
      record.ownerShiftCode ||
      ''
    );
    const transitionCount = Math.max(
      0,
      Number(
        record.carryOverShiftCount
      ) || 0
    );
    const carryOver = Boolean(
      record.carryOver ||
      (
        entryCode &&
        currentCode &&
        entryCode !== currentCode
      )
    );

    let transitionText =
      'ยังไม่สามารถระบุการส่งต่องานได้';
    let transitionDetail =
      'ตรวจสอบการตั้งค่ากะในหน้า Admin';

    if (entryCode && currentCode) {
      if (carryOver) {
        transitionText =
          'กะ ' + entryCode +
          ' → กะ ' + currentCode;
        transitionDetail =
          Math.max(1, transitionCount) +
          ' ช่วงกะ';
      } else {
        transitionText =
          'อยู่ภายในกะ ' +
          currentCode +
          ' เดียวกัน';
        transitionDetail =
          'ยังไม่ผ่านจุดเปลี่ยนกะ';
      }
    }

    return {
      entryTitle:
        formatShiftTitle(
          entryShift,
          entryCode
        ),
      entryWindow:
        formatShiftWindow(
          entryShift
        ),
      currentTitle:
        formatShiftTitle(
          currentShift,
          currentCode
        ),
      currentWindow:
        formatShiftWindow(
          currentShift
        ),
      transitionText:
        transitionText,
      transitionDetail:
        transitionDetail,
      carryOver:
        carryOver
    };
  }

  function buildRecordTimeline(record) {
    const hasDocument = Boolean(
      record.documentSubmittedAt
    );
    const hasReceiving = Boolean(
      record.receivingCompleteAt ||
      record.workflowReceivingCompletedAt
    );
    const hasReturn = Boolean(
      record.documentReturnedAt
    );

    return [
      {
        label: 'Gate In',
        value:
          record.timestampIn ||
          'ไม่พบเวลา Gate In',
        state:
          record.timestampIn
            ? 'complete'
            : 'pending'
      },
      {
        label: 'พขร.ยื่นเอกสาร',
        value:
          record.documentSubmittedAt ||
          'รอดำเนินการ',
        state:
          hasDocument
            ? 'complete'
            : 'pending'
      },
      {
        label: 'รับสินค้าเสร็จ',
        value:
          record.receivingCompleteAt ||
          record.workflowReceivingCompletedAt ||
          (
            hasDocument
              ? 'รอดำเนินการ'
              : 'ยังไม่พร้อมดำเนินการ'
          ),
        state:
          hasReceiving
            ? 'complete'
            : hasDocument
              ? 'pending'
              : 'blocked'
      },
      {
        label: 'พขร.รับเอกสารคืน',
        value:
          record.documentReturnedAt ||
          (
            hasReceiving
              ? 'รอดำเนินการ'
              : 'ยังไม่พร้อมดำเนินการ'
          ),
        state:
          hasReturn
            ? 'complete'
            : hasReceiving
              ? 'pending'
              : 'blocked'
      }
    ];
  }

  function openRecordDetail(record) {
    const identity =
      getPriorityIdentity(record);
    const stageMeta =
      getOperationalStageMeta(
        record.operationalStage
      );
    const appointment =
      identity.appointmentNumber ||
      record.primaryValue ||
      'ไม่พบเลขนัดหมาย';
    const company =
      identity.companyName ||
      'ไม่พบชื่อบริษัท';
    const shiftPresentation =
      buildRecordShiftPresentation(
        record
      );

    const fields =
      getDisplayFields(
        record,
        {
          excludeTimestampIn: true
        }
      ).filter((field) => {
        const label =
          normalizeFieldLabel(
            field.label ||
            field.displayName ||
            ''
          );
        return ![
          'เลขนัดหมาย',
          'หมายเลขนัดหมาย',
          'appointment',
          'บริษัท',
          'ชื่อบริษัท',
          'company'
        ].includes(label);
      });

    const fieldHtml =
      fields
        .map(
          (field) => `
            <div class="record-action-row">
              <span>${escapeHtml(field.label || field.displayName || '-')}</span>
              <strong>${escapeHtml(field.value || '-')}</strong>
            </div>
          `
        )
        .join('');

    const timelineHtml =
      buildRecordTimeline(record)
        .map((item, index) => `
          <div class="record-action-timeline__item is-${escapeHtml(item.state)}">
            <b class="record-action-timeline__index">${index + 1}</b>
            <span>${escapeHtml(item.label)}</span>
            <strong>${escapeHtml(item.value)}</strong>
          </div>
        `)
        .join('');

    let disabledReceivingLabel =
      stageMeta.shortLabel;

    if (
      record.operationalStage ===
      'WAITING_INBOUND_DOCUMENT'
    ) {
      disabledReceivingLabel =
        'รอ พขร.ยื่นเอกสารก่อน';
    } else if (
      record.operationalStage ===
      'DATA_CONFLICT'
    ) {
      disabledReceivingLabel =
        'ข้อมูลขัดแย้ง — ติดต่อ Admin';
    }

    const receivingButton =
      record.receivingEnabled === false
        ? ''
        : `
          <button
            type="button"
            class="record-action-primary receiving-complete-button"
            data-record-id="${escapeHtml(record.recordId || '')}"
            data-canonical-record-id="${escapeHtml(record.canonicalRecordId || '')}"
            data-source-row-number="${Number(record.sourceRowNumber) || 0}"
            data-expected-timestamp-in="${escapeHtml(record.timestampIn || '')}"
            data-expected-timestamp-in-epoch-ms="${Number(record.timestampInEpochMs) || 0}"
            data-expected-primary-value="${escapeHtml(record.primaryValue || '')}"
            data-entry-code="${escapeHtml(record.autoId || record.sourceAutoId || '')}"
            data-operational-stage="${escapeHtml(record.operationalStage || '')}"
            data-can-complete="${record.canCompleteReceiving ? 'TRUE' : 'FALSE'}"
            ${record.canCompleteReceiving ? '' : 'disabled aria-disabled="true"'}
            title="${escapeHtml(record.operationalStageDescription || stageMeta.description)}"
          >
            ${escapeHtml(
              record.canCompleteReceiving
                ? 'บันทึกรับสินค้าเสร็จ'
                : disabledReceivingLabel
            )}
          </button>
        `;

    const checkoutButton =
      record.canCheckout &&
      isAdmin()
        ? `
          <button
            id="recordDetailCheckoutButton"
            type="button"
            class="record-action-secondary"
          >
            บันทึกออกพื้นที่
          </button>
        `
        : '';

    Swal.fire({
      width: 760,
      position:
        isMobileViewport()
          ? 'bottom'
          : 'center',
      title: '',
      html: `
        <article class="record-action-sheet" data-status="${escapeHtml(record.statusCode || 'INCOMPLETE')}">
          <header class="record-action-sheet__identity">
            <div>
              <span>เลขนัดหมาย</span>
              <strong>${escapeHtml(appointment)}</strong>
            </div>
            <div>
              <span>บริษัท</span>
              <h2>${escapeHtml(company)}</h2>
            </div>
          </header>

          <div class="record-action-sheet__status">
            <span data-status="${escapeHtml(record.statusCode || 'INCOMPLETE')}">${escapeHtml(record.statusLabel || '-')}</span>
            <strong>${escapeHtml(record.durationDisplay || '--:--:--')}</strong>
          </div>

          <section class="record-action-sheet__stage">
            <div>
              <span>ขั้นตอนปัจจุบัน</span>
              <strong>${escapeHtml(record.operationalStageLabel || stageMeta.label)}</strong>
            </div>
            <p>${escapeHtml(record.operationalStageDescription || stageMeta.description)}</p>
          </section>

          <section class="record-action-timeline">
            ${timelineHtml}
          </section>

          <section class="record-action-shifts">
            <div class="record-action-shift-card">
              <span>กะที่รถเข้า</span>
              <strong>${escapeHtml(shiftPresentation.entryTitle)}</strong>
              <small>${escapeHtml(shiftPresentation.entryWindow)}</small>
            </div>
            <div class="record-action-shift-card is-current">
              <span>กะปัจจุบัน</span>
              <strong>${escapeHtml(shiftPresentation.currentTitle)}</strong>
              <small>${escapeHtml(shiftPresentation.currentWindow)}</small>
            </div>
            <div class="record-action-shift-card is-handover">
              <span>การส่งต่องาน</span>
              <strong>${escapeHtml(shiftPresentation.transitionText)}</strong>
              <small>${escapeHtml(shiftPresentation.transitionDetail)}</small>
            </div>
          </section>

          <section class="record-action-details">
            <div class="record-action-row">
              <span>เวลาเข้าพื้นที่</span>
              <strong>${escapeHtml(record.timestampIn || '-')}</strong>
            </div>
            ${fieldHtml}
          </section>

          <footer class="record-action-sheet__actions">
            ${receivingButton}
            ${checkoutButton}
          </footer>
        </article>
      `,
      showConfirmButton: true,
      confirmButtonText: 'ปิด',
      showCloseButton: true,
      heightAuto: false,
      customClass: {
        popup: 'record-action-popup',
        htmlContainer: 'record-action-html',
        actions: 'record-action-close-actions',
        confirmButton: 'record-action-close-button'
      },
      didOpen: (popup) => {
        const checkout =
          popup.querySelector(
            '#recordDetailCheckoutButton'
          );

        checkout?.addEventListener(
          'click',
          async () => {
            Swal.close();
            await handleCheckout(
              record,
              checkout
            );
          }
        );
      }
    });
  }

  /************************************************************
   * Dynamic Overdue App Badge
   *
   * ตัวเลข = รายการเกินเวลาสะสมทั้งหมดที่:
   * - ยังอยู่ในพื้นที่
   * - ยังไม่มี Timestamp Out
   * - ข้ามเกณฑ์ OVERDUE ของโมดูลแล้ว
   *
   * ไม่รีเซ็ตเมื่อเปลี่ยนชั่วโมง
   ************************************************************/

  function initializeOverdueBadgeSystem() {
    state.baseDocumentTitle =
      String(document.title || '')
        .replace(
          /^\(\d+\+?\)\s*/,
          ''
        )
        .trim() ||
      'สถานะรถ';

    const icon = new Image();

    icon.decoding = 'async';

    icon.addEventListener(
      'load',
      () => {
        state.badgeIconReady = true;
        updateDynamicFavicon(
          Math.max(
            0,
            Number(
              state.overdueBadgeCount
            ) || 0
          )
        );
      },
      {
        once: true
      }
    );

    icon.addEventListener(
      'error',
      () => {
        state.badgeIconReady = false;
      },
      {
        once: true
      }
    );

    icon.src =
      OVERDUE_BADGE_ICON_URL;

    state.badgeIconImage =
      icon;

    updateOverdueBadgePresentation(
      true
    );
  }


  function updateOverdueBadgePresentation(
    force
  ) {
    const count =
      calculateAccumulatedOverdueCount();

    if (
      force !== true &&
      count ===
        state.overdueBadgeCount
    ) {
      return;
    }

    state.overdueBadgeCount =
      count;

    updateVisibleOverdueBadge(
      count
    );

    updateDocumentTitleBadge(
      count
    );

    updateDynamicFavicon(
      count
    );

    void updateSystemAppBadge(
      count
    );
  }


  function calculateAccumulatedOverdueCount() {
    const records =
      Array.isArray(
        state.badgeRecords
      )
        ? state.badgeRecords
        : [];

    return records.filter(
      isAccumulatedOverdueRecord
    ).length;
  }


  function isAccumulatedOverdueRecord(
    record
  ) {
    if (!record) {
      return false;
    }

    if (
      record.isCurrentlyInArea !==
      true
    ) {
      return false;
    }

    if (
      recordHasTimestampOut(
        record
      )
    ) {
      return false;
    }

    return (
      record.statusCode ===
        'OVERDUE' ||
      record.isOverdue === true
    );
  }


  function recordHasTimestampOut(
    record
  ) {
    const directValues = [
      record.timestampOut,
      record.timestampOutDisplay,
      record.timestampOutEpochMs
    ];

    if (
      directValues.some(
        hasMeaningfulTimestampValue
      )
    ) {
      return true;
    }

    const fields =
      Array.isArray(
        record.fields
      )
        ? record.fields
        : [];

    return fields.some(
      (field) => {
        const label =
          String(
            field &&
            (
              field.label ||
              field.name ||
              field.id ||
              ''
            )
          )
            .trim()
            .toLowerCase();

        const isOutField =
          label ===
            'timestamp out' ||
          label.includes(
            'timestamp out'
          ) ||
          label.includes(
            'เวลาออก'
          );

        return (
          isOutField &&
          hasMeaningfulTimestampValue(
            field && field.value
          )
        );
      }
    );
  }


  function hasMeaningfulTimestampValue(
    value
  ) {
    if (
      value instanceof Date &&
      !Number.isNaN(
        value.getTime()
      )
    ) {
      return true;
    }

    if (
      typeof value ===
      'number'
    ) {
      return (
        Number.isFinite(value) &&
        value > 0
      );
    }

    const text =
      String(
        value === null ||
        value === undefined
          ? ''
          : value
      )
        .trim()
        .toLowerCase();

    if (!text) {
      return false;
    }

    return ![
      '-',
      '--',
      'null',
      'undefined',
      'ยังไม่มีข้อมูล',
      'ไม่มีข้อมูล'
    ].includes(text);
  }


  function updateVisibleOverdueBadge(
    count
  ) {
    const container =
      document.getElementById(
        'overdueAppBadge'
      );

    const countElement =
      document.getElementById(
        'overdueAppBadgeCount'
      );

    if (countElement) {
      countElement.textContent =
        count > 99
          ? '99+'
          : String(count);
    }

    if (container) {
      container.dataset.count =
        String(count);

      container.classList.toggle(
        'is-zero',
        count <= 0
      );

      container.setAttribute(
        'aria-label',
        count > 0
          ? (
              'มีตู้เกินเวลาสะสม ' +
              count +
              ' ตู้ที่ยังไม่มีเวลาออก'
            )
          : 'ไม่มีตู้เกินเวลาค้าง'
      );
    }
  }


  function updateDocumentTitleBadge(
    count
  ) {
    const baseTitle =
      String(
        state.baseDocumentTitle ||
        document.title ||
        'สถานะรถ'
      )
        .replace(
          /^\(\d+\+?\)\s*/,
          ''
        )
        .trim();

    document.title =
      count > 0
        ? (
            '(' +
            (
              count > 99
                ? '99+'
                : count
            ) +
            ') ' +
            baseTitle
          )
        : baseTitle;
  }


  async function updateSystemAppBadge(
    count
  ) {
    try {
      if (
        count > 0 &&
        typeof navigator.setAppBadge ===
          'function'
      ) {
        await navigator.setAppBadge(
          count
        );

        return;
      }

      if (
        count <= 0 &&
        typeof navigator.clearAppBadge ===
          'function'
      ) {
        await navigator.clearAppBadge();
      }

    } catch (error) {
      /*
       * บาง Browser ไม่รองรับหรือจำกัดสิทธิ์
       * ระบบยังคงแสดง favicon และชื่อแท็บได้
       */
      console.debug(
        'App Badge ไม่พร้อม',
        error
      );
    }
  }


  function ensureDynamicFaviconLink() {
    let link =
      document.getElementById(
        'dynamicFavicon'
      );

    if (!link) {
      link =
        document.createElement(
          'link'
        );

      link.id =
        'dynamicFavicon';

      link.rel =
        'icon';

      link.type =
        'image/png';

      document.head.appendChild(
        link
      );
    }

    return link;
  }


  function updateDynamicFavicon(
    count
  ) {
    const size =
      OVERDUE_BADGE_FAVICON_SIZE;

    const canvas =
      document.createElement(
        'canvas'
      );

    canvas.width =
      size;

    canvas.height =
      size;

    const context =
      canvas.getContext(
        '2d'
      );

    if (!context) {
      return;
    }

    context.clearRect(
      0,
      0,
      size,
      size
    );

    if (
      state.badgeIconReady &&
      state.badgeIconImage
    ) {
      context.drawImage(
        state.badgeIconImage,
        0,
        0,
        size,
        size
      );

    } else {
      drawFallbackBadgeIcon(
        context,
        size
      );
    }

    if (count > 0) {
      drawFaviconBadge(
        context,
        size,
        count
      );
    }

    const link =
      ensureDynamicFaviconLink();

    link.href =
      canvas.toDataURL(
        'image/png'
      );
  }


  function drawFallbackBadgeIcon(
    context,
    size
  ) {
    const radius =
      12;

    const gradient =
      context.createLinearGradient(
        0,
        0,
        size,
        size
      );

    gradient.addColorStop(
      0,
      '#0b2f46'
    );

    gradient.addColorStop(
      1,
      '#0f766e'
    );

    context.fillStyle =
      gradient;

    context.beginPath();

    context.roundRect(
      0,
      0,
      size,
      size,
      radius
    );

    context.fill();

    context.fillStyle =
      '#ffffff';

    context.font =
      '800 21px Arial';

    context.textAlign =
      'center';

    context.textBaseline =
      'middle';

    context.fillText(
      'DC',
      size / 2,
      size / 2 + 1
    );
  }


  function drawFaviconBadge(
    context,
    size,
    count
  ) {
    const label =
      count > 99
        ? '99+'
        : String(count);

    const wide =
      label.length >= 3;

    const centerX =
      wide
        ? size - 17
        : size - 14;

    const centerY =
      14;

    const radiusX =
      wide
        ? 17
        : 13;

    const radiusY =
      13;

    context.save();

    context.shadowColor =
      'rgba(127, 29, 29, 0.42)';

    context.shadowBlur =
      4;

    context.fillStyle =
      '#ef2b2d';

    context.beginPath();

    context.ellipse(
      centerX,
      centerY,
      radiusX,
      radiusY,
      0,
      0,
      Math.PI * 2
    );

    context.fill();

    context.shadowBlur =
      0;

    context.lineWidth =
      2;

    context.strokeStyle =
      '#ffffff';

    context.stroke();

    context.fillStyle =
      '#ffffff';

    context.font =
      wide
        ? '800 10px Arial'
        : '800 15px Arial';

    context.textAlign =
      'center';

    context.textBaseline =
      'middle';

    context.fillText(
      label,
      centerX,
      centerY + 0.5
    );

    context.restore();
  }


  function clearOverdueBadgePresentation() {
    state.badgeRecords =
      [];

    state.overdueBadgeCount =
      0;

    updateVisibleOverdueBadge(
      0
    );

    updateDocumentTitleBadge(
      0
    );

    updateDynamicFavicon(
      0
    );

    void updateSystemAppBadge(
      0
    );
  }


  function startClock() {
    updateClock();

    state.clockTimer = window.setInterval(
      updateClock,
      1000
    );
  }

  function updateClock() {
    setText(
      'currentDateTime',
      formatBangkokDateTime(
        getCurrentServerDate()
      )
    );
  }

  function startDurationTimer() {
    if (state.durationTimer) {
      window.clearInterval(state.durationTimer);
    }

    state.durationTimer = window.setInterval(
      tickDurations,
      1000
    );
  }

  function tickDurations() {
    if (
      state.destroyed ||
      document.visibilityState !==
        'visible'
    ) {
      return;
    }

    const nowMs =
      getCurrentServerTimeMs();

    updateMovementCountdown();

    let statusChanged =
      false;

    let nearAutoCloseChanged =
      false;

    const expiredRecordIds =
      [];

    state.records.forEach(
      (record) => {
        const previousStatus =
          record.statusCode;

        const previousNearAutoClose =
          Boolean(
            record.isNearAutoClose
          );

        updateRecordComputedState(
          record,
          nowMs
        );

        if (
          record.isExpired36H
        ) {
          expiredRecordIds.push(
            record.recordId
          );

          return;
        }

        const nodes =
          state.cardNodes.get(
            record.recordId
          );

        if (nodes) {
          nodes.timer.textContent =
            record.durationDisplay ||
            '--:--:--';

          nodes.priorityText.textContent =
            record.priorityText ||
            '';

          nodes.progressFill.style.width =
            Math.max(
              0,
              Math.min(
                100,
                Number(
                  record.progressPercent
                ) || 0
              )
            ) + '%';

          nodes.card.dataset.nearAutoClose =
            record.isNearAutoClose
              ? 'TRUE'
              : 'FALSE';

          if (
            previousStatus !==
            record.statusCode
          ) {
            nodes.card.dataset.status =
              record.statusCode;

            nodes.statusBadge.dataset.status =
              record.statusCode;

            nodes.statusBadge.textContent =
              record.statusLabel;

            statusChanged =
              true;
          }
        }

        if (
          previousNearAutoClose !==
          Boolean(
            record.isNearAutoClose
          )
        ) {
          nearAutoCloseChanged =
            true;
        }
      }
    );

    /*
     * อัปเดต badge ทุกครั้งที่สถานะของรายการข้ามเกณฑ์
     * แต่จะวาด favicon ใหม่เฉพาะเมื่อจำนวนเปลี่ยน
     */
    updateOverdueBadgePresentation();

    if (
      expiredRecordIds.length > 0
    ) {
      const expiredSet =
        new Set(
          expiredRecordIds
        );

      state.records =
        state.records.filter(
          (record) =>
            !expiredSet.has(
              record.recordId
            )
        );

      state.recordsSignature =
        buildRecordsSignature(
          state.records
        );

      requestAutoClosePersistence();
    }

    if (
      statusChanged ||
      nearAutoCloseChanged ||
      expiredRecordIds.length > 0
    ) {
      renderSummary();
      renderTimeline();
      applyFiltersAndRender();
      checkOverdueAlerts();
    }

    const seconds =
      Math.floor(
        nowMs / 1000
      );

    if (
      seconds % 60 === 0
    ) {
      renderTimeline();
    }
  }

  function handleOperationalAlertToggleClick(event) {
    const target =
      event && event.target &&
      typeof event.target.closest === 'function'
        ? event.target.closest(
            '#operationalAlertToggle'
          )
        : null;

    if (!target) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (
      window.AlertVendorOperationalAlert &&
      typeof window.AlertVendorOperationalAlert.toggle ===
        'function'
    ) {
      window.AlertVendorOperationalAlert.toggle();
    }
  }


  function initializeOperationalAlertPreference() {
    state.operationalAlertStorageKey =
      buildOperationalAlertStorageKey();

    let enabled = true;

    try {
      const stored =
        window.localStorage.getItem(
          state.operationalAlertStorageKey
        );

      if (stored !== null) {
        enabled =
          stored !== '0' &&
          stored !== 'false' &&
          stored !== 'OFF';
      }
    } catch (error) {
      enabled = true;
    }

    setOperationalAlertEnabled(
      enabled,
      {
        persist: false,
        emit: true,
        forceEmit: true
      }
    );
  }

  function buildOperationalAlertStorageKey() {
    const user =
      state.session &&
      state.session.user
        ? state.session.user
        : {};

    const rawUserKey =
      user.id ||
      user.userId ||
      user.username ||
      user.email ||
      user.displayName ||
      'anonymous';

    const safeUserKey =
      String(rawUserKey)
        .trim()
        .toLowerCase()
        .replace(
          /[^a-z0-9ก-๙@._-]+/gi,
          '_'
        ) ||
      'anonymous';

    return [
      OPERATIONAL_ALERT_STORAGE_PREFIX,
      state.moduleId || 'unknown-module',
      safeUserKey
    ].join(':');
  }

  function isOperationalAlertEnabled() {
    return state.operationalAlertEnabled !== false;
  }

  function setOperationalAlertEnabled(
    enabled,
    options = {}
  ) {
    const nextEnabled =
      enabled !== false;

    const changed =
      state.operationalAlertEnabled !==
      nextEnabled;

    state.operationalAlertEnabled =
      nextEnabled;

    if (
      options.persist !== false &&
      state.operationalAlertStorageKey
    ) {
      try {
        window.localStorage.setItem(
          state.operationalAlertStorageKey,
          nextEnabled ? '1' : '0'
        );
      } catch (error) {
        // Browser may block localStorage in privacy mode.
      }
    }

    syncOperationalAlertToggle();

    if (
      options.emit !== false &&
      (
        changed ||
        options.forceEmit === true
      )
    ) {
      document.dispatchEvent(
        new CustomEvent(
          'alertvendor:operational-alert-changed',
          {
            detail: {
              enabled: nextEnabled,
              moduleId: state.moduleId
            }
          }
        )
      );
    }
  }

  function syncOperationalAlertToggle() {
    const button =
      document.getElementById(
        'operationalAlertToggle'
      );

    const status =
      document.getElementById(
        'operationalAlertToggleStatus'
      );

    const icon =
      document.getElementById(
        'operationalAlertToggleIcon'
      );

    const enabled =
      isOperationalAlertEnabled();

    if (button) {
      button.classList.toggle(
        'is-enabled',
        enabled
      );

      button.classList.toggle(
        'is-disabled',
        !enabled
      );

      button.setAttribute(
        'aria-checked',
        enabled ? 'true' : 'false'
      );

      button.dataset.state =
        enabled ? 'ON' : 'OFF';

      button.disabled = false;

      button.setAttribute(
        'aria-label',
        enabled
          ? 'ปิดการแจ้งเตือนอัตโนมัติ'
          : 'เปิดการแจ้งเตือนอัตโนมัติ'
      );

      button.title =
        enabled
          ? 'การแจ้งเตือนเปิดอยู่ — กดเพื่อปิด'
          : 'การแจ้งเตือนปิดอยู่ — กดเพื่อเปิด';
    }

    if (icon) {
      icon.textContent =
        enabled ? '🔔' : '🔕';
    }

    if (status) {
      status.textContent =
        enabled ? 'เปิด' : 'ปิด';

      status.setAttribute(
        'aria-hidden',
        'true'
      );
    }
  }

  function handleForegroundWriteChange(event) {
    const detail = event && event.detail && typeof event.detail === 'object'
      ? event.detail
      : {};

    state.foregroundWriteActive = detail.active === true;
    state.foregroundWriteCount = Math.max(0, Number(detail.count) || 0);

    if (state.foregroundWriteActive) {
      stopAutoRefresh();
      return;
    }

    if (
      !state.destroyed &&
      document.visibilityState === 'visible' &&
      navigator.onLine
    ) {
      scheduleNextRevisionCheck(REVISION_POLL_RESUME_MS);
    }
  }

  function startAutoRefresh() {
    stopAutoRefresh();

    state.revisionPollFailures = 0;
    state.revisionPollDelayMs = REVISION_POLL_MIN_MS;

    if (
      document.visibilityState === 'visible' &&
      navigator.onLine &&
      !state.destroyed
    ) {
      scheduleNextRevisionCheck(REVISION_POLL_MIN_MS);
    }

    updateAutoRefreshStatus();
  }

  function stopAutoRefresh() {
    if (state.refreshTimer) {
      window.clearTimeout(state.refreshTimer);
      state.refreshTimer = null;
    }
  }

  function scheduleNextRevisionCheck(delayMs) {
    stopAutoRefresh();

    if (
      state.destroyed ||
      document.visibilityState !== 'visible' ||
      !navigator.onLine
    ) {
      return;
    }

    const delay = Math.max(
      250,
      Number(delayMs) || state.revisionPollDelayMs || REVISION_POLL_MIN_MS
    );

    state.refreshTimer = window.setTimeout(
      () => {
        state.refreshTimer = null;
        void checkOperationalBoardRevision();
      },
      delay
    );
  }

  function hasActiveCardWrite() {
    return Boolean(
      state.foregroundWriteActive ||
      document.querySelector(
        '.vehicle-card[data-receiving-save-state], .vehicle-card[aria-busy="true"]'
      )
    );
  }

  function resetRevisionBackoff() {
    state.revisionPollFailures = 0;
    state.revisionPollDelayMs = REVISION_POLL_MIN_MS;
  }

  function increaseRevisionBackoff() {
    state.revisionPollFailures = Math.min(
      6,
      Number(state.revisionPollFailures || 0) + 1
    );

    state.revisionPollDelayMs = Math.min(
      REVISION_POLL_MAX_MS,
      REVISION_POLL_MIN_MS * Math.pow(2, state.revisionPollFailures)
    );
  }

  async function checkOperationalBoardRevision() {
    if (
      state.revisionCheckInProgress ||
      state.refreshInProgress ||
      state.destroyed ||
      state.foregroundWriteActive ||
      !navigator.onLine ||
      document.visibilityState !== 'visible'
    ) {
      scheduleNextRevisionCheck(state.revisionPollDelayMs);
      return;
    }

    state.revisionCheckInProgress = true;
    state.revisionPollLastAt = Date.now();

    try {
      const revision = await API.getOperationalBoard(
        state.moduleId,
        {
          revisionOnly: true,
          knownRevision: state.dataRevision || ''
        }
      );

      resetRevisionBackoff();

      if (
        revision &&
        revision.unchanged === true
      ) {
        return;
      }

      /*
       * ห้ามโหลด Full Snapshot ทับการ์ดที่กำลัง Commit/Verify อยู่
       * การ์ดอื่นยังใช้งานต่อได้ และจะตรวจ Revision ใหม่ในรอบถัดไป
       */
      if (hasActiveCardWrite()) {
        scheduleNextRevisionCheck(REVISION_POLL_MIN_MS);
        return;
      }

      await loadRecords({
        silentError: true,
        showSuccessToast: false,
        forceRender: false,
        forceRefresh: true,
        background: true
      });
    } catch (error) {
      increaseRevisionBackoff();
      console.warn(
        'ตรวจ Board Revision ไม่สำเร็จ จะลองใหม่แบบ Adaptive Backoff',
        error
      );
    } finally {
      state.revisionCheckInProgress = false;

      if (!state.destroyed) {
        scheduleNextRevisionCheck(state.revisionPollDelayMs);
      }
    }
  }


  function updateAutoRefreshStatus() {
    const element =
      document.getElementById(
        'autoRefreshStatus'
      );

    if (element) {
      element.classList.add(
        'is-hidden'
      );
    }
  }

  async function checkOverdueAlerts() {
    if (state.alertRunning || state.serverAlertCheckInProgress || !state.module || !state.module.alertEnabled || !isOperationalAlertEnabled()) return;
    const now = Date.now();
    if (now - state.lastServerAlertCheckAt < 15000) return;
    state.lastServerAlertCheckAt = now;
    state.serverAlertCheckInProgress = true;
    try {
      const result = await API.getInboundWorkflowSlaAlerts(state.moduleId, {
        limit: 50,
        sinceEpochMs: state.lastServerAlertDeliveryEpochMs,
        evaluate: true
      });
      const deliveries = result && Array.isArray(result.deliveries) ? result.deliveries : [];
      if (Number(result && result.latestDeliveryEpochMs) > state.lastServerAlertDeliveryEpochMs) {
        state.lastServerAlertDeliveryEpochMs = Number(result.latestDeliveryEpochMs);
      }
      const overdueDeliveries = deliveries.filter((row) => String(row['ระดับ'] || '').toUpperCase() === 'OVERDUE');
      if (!overdueDeliveries.length) return;
      const active = result && Array.isArray(result.activeAlerts) ? result.activeAlerts : [];
      const keys = new Set(overdueDeliveries.map((row) => String(row['รหัสแจ้งเตือน'] || '')));
      const alerts = active.filter((row) => keys.has(String(row['รหัสแจ้งเตือน'] || ''))).slice(0, 8);
      state.alertRunning = true;
      notifyDevice();
      const html = document.createElement('div'); html.className = 'overdue-alert-list';
      (alerts.length ? alerts : overdueDeliveries).slice(0, 8).forEach((row) => {
        const item = document.createElement('div'); item.className = 'overdue-alert-item';
        const title = document.createElement('strong'); title.textContent = row['บริษัท'] || row['ข้อความ'] || 'พบรายการเกินเวลา';
        const detail = document.createElement('span'); detail.textContent = [row['ชื่อขั้นตอน'] || row['ขั้นตอน'] || '', row['เลขนัดหมาย'] ? ('นัดหมาย ' + row['เลขนัดหมาย']) : '', row['เวลาค้าง (วินาที)'] ? ('ค้าง ' + Math.floor(Number(row['เวลาค้าง (วินาที)']) / 60) + ' นาที') : ''].filter(Boolean).join(' • ');
        item.appendChild(title); item.appendChild(detail); html.appendChild(item);
      });
      await Swal.fire({ icon: 'warning', title: 'Alert Engine พบงานเกินเวลา', html, confirmButtonText: 'รับทราบ', allowOutsideClick: false });
    } catch (error) {
      console.warn('โหลด Server Alert ไม่สำเร็จ ใช้ Local Fallback', error);
      await checkOverdueAlertsLocalFallback();
    } finally {
      state.serverAlertCheckInProgress = false;
      state.alertRunning = false;
    }
  }

  async function checkOverdueAlertsLocalFallback() {
    const now = Date.now();
    const overdueRecords = state.records.filter((record) => {
      if (record.statusCode !== 'OVERDUE') return false;
      const repeatMinutes = Math.max(1, Number(record.stageSla && record.stageSla.repeatMinutes) || 10);
      const key = getAlertStorageKey(record.recordId);
      const lastShown = Number(sessionStorage.getItem(key) || 0);
      return now - lastShown >= repeatMinutes * 60 * 1000;
    });
    if (!overdueRecords.length) return;
    overdueRecords.forEach((record) => sessionStorage.setItem(getAlertStorageKey(record.recordId), String(now)));
    notifyDevice();
    const html = document.createElement('div'); html.className = 'overdue-alert-list';
    overdueRecords.slice(0, 5).forEach((record) => {
      const item = document.createElement('div'); item.className = 'overdue-alert-item';
      const title = document.createElement('strong'); title.textContent = record.primaryValue || record.companyName || 'ไม่พบข้อมูลหลัก';
      const detail = document.createElement('span'); detail.textContent = (record.operationalStageLabel || '') + ' • ' + (record.statusLabel || 'เกินเวลา');
      item.appendChild(title); item.appendChild(detail); html.appendChild(item);
    });
    await Swal.fire({ icon: 'warning', title: 'พบงานเกินเวลา', html, confirmButtonText: 'รับทราบ', allowOutsideClick: false });
  }

  function getAlertStorageKey(recordId) {
    return (
      'vehicle-overdue:' +
      state.moduleId +
      ':' +
      recordId
    );
  }

  function notifyDevice() {
    if (
      state.module &&
      state.module.vibrationEnabled &&
      navigator.vibrate
    ) {
      navigator.vibrate([250, 100, 250]);
    }

    if (
      state.module &&
      state.module.soundEnabled &&
      state.userInteracted
    ) {
      playAlertSound();
    }
  }

  function playAlertSound() {
    try {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;

      if (!AudioContext) {
        return;
      }

      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = 880;

      gain.gain.setValueAtTime(
        0.0001,
        context.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.18,
        context.currentTime + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        context.currentTime + 0.35
      );

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.36);

      oscillator.addEventListener('ended', () => {
        context.close().catch(() => null);
      });

    } catch (error) {
      console.warn(
        'ไม่สามารถเล่นเสียงแจ้งเตือนได้',
        error
      );
    }
  }

  async function handleCheckout(record, button) {
    if (!isAdmin()) {
      await Swal.fire({
        icon: 'error',
        title: 'ไม่มีสิทธิ์',
        text: 'เฉพาะผู้ดูแลระบบเท่านั้นที่บันทึกเวลาออกได้',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    const clientRequestId = checkoutGetOrCreateRequestId_(record);
    const payload = buildCheckoutPayload(record, clientRequestId);
    let result = null;

    setButtonLoading(button, true, 'กำลังตรวจสอบ...');
    showLoading(
      'กำลังตรวจสอบข้อมูล',
      'ระบบกำลังตรวจสอบข้อมูลล่าสุดก่อนบันทึก'
    );

    try {
      const preview = await API.previewCheckout(
        state.moduleId,
        payload
      );

      Swal.close();

      const confirmation = await Swal.fire({
        icon: 'question',
        title: 'ยืนยันออกจากพื้นที่',
        html: createCheckoutPreviewHtml(preview.record || record),
        showCancelButton: true,
        confirmButtonText: 'ยืนยันบันทึกออก',
        cancelButtonText: 'ยกเลิก',
        reverseButtons: true,
        allowOutsideClick: false
      });

      if (!confirmation.isConfirmed) {
        checkoutClearPending_(record);
        return;
      }

      checkoutSavePending_(record, payload);
      showLoading(
        'กำลังบันทึกเวลาออก',
        'ระบบกำลังยืนยัน Gate Out กรุณาอย่ากดซ้ำ'
      );

      try {
        result = await API.checkout(
          state.moduleId,
          payload
        );
      } catch (error) {
        if (!checkoutIsAmbiguousError_(error)) {
          throw error;
        }

        showLoading(
          'กำลังตรวจสอบผลการบันทึก',
          'การเชื่อมต่อไม่แน่นอน ระบบกำลังตรวจ Timestamp Out จริง'
        );

        result = await checkoutVerifyCommit_(payload, error);

        if (!result || result.completed !== true) {
          throw error;
        }
      }

      Swal.close();
      checkoutClearPending_(record);

      const replayText = result && result.idempotentReplay === true
        ? '<div class="checkout-replay-note">รายการนี้มี Gate Out แล้ว ระบบไม่บันทึกซ้ำ</div>'
        : '';
      const closeTypeText = result && result.closeType === 'AUTO_CLOSE'
        ? '<div class="checkout-replay-note">รายการนี้ถูกปิดอัตโนมัติก่อนคำขอนี้</div>'
        : '';

      await Swal.fire({
        icon: 'success',
        title: result && result.closeType === 'AUTO_CLOSE'
          ? 'รายการถูกปิดอัตโนมัติแล้ว'
          : 'บันทึกออกจากพื้นที่แล้ว',
        html: `
          <div class="checkout-success-detail">
            <div>
              <span>เวลาออก</span>
              <strong>${escapeHtml(result && result.timestampOut || '-')}</strong>
            </div>

            <div>
              <span>ระยะเวลา</span>
              <strong>${escapeHtml(result && result.durationDisplay || '-')}</strong>
            </div>
          </div>
          ${replayText}
          ${closeTypeText}
        `,
        confirmButtonText: 'ตกลง'
      });

      await loadRecords({
        silentError: false,
        showSuccessToast: false,
        forceRender: true
      });

    } catch (error) {
      Swal.close();

      if (!checkoutIsAmbiguousError_(error)) {
        checkoutClearPending_(record);
      }

      await showApiError(
        error,
        'บันทึกเวลาออกไม่สำเร็จ'
      );

      if (
        [
          'ALREADY_CHECKED_OUT',
          'RECORD_CHANGED',
          'RECORD_NO_LONGER_MATCHES',
          'RECORD_NO_LONGER_ACTIVE',
          'STATE_CONFLICT'
        ].includes(error && error.code)
      ) {
        await loadRecords({
          silentError: true,
          showSuccessToast: false,
          forceRender: true
        });
      }

    } finally {
      setButtonLoading(button, false);
    }
  }

  function buildCheckoutPayload(record, clientRequestId) {
    const stableRequestId = String(
      clientRequestId || checkoutGetOrCreateRequestId_(record)
    ).trim();

    return {
      recordId: record.recordId,
      sourceRowNumber: record.sourceRowNumber,
      expectedTimestampIn: record.timestampIn,
      expectedTimestampInEpochMs: record.timestampInEpochMs,
      expectedPrimaryValue: record.primaryValue,
      clientRequestId: stableRequestId,
      requestId: stableRequestId
    };
  }


  function checkoutCreateRequestId_() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === 'function'
    ) {
      return window.crypto.randomUUID();
    }

    return (
      'checkout-' +
      Date.now().toString(36) +
      '-' +
      Math.random().toString(36).slice(2, 12)
    );
  }

  function checkoutPendingKey_(record) {
    return CHECKOUT_PENDING_PREFIX + [
      String(state.moduleId || ''),
      String(record && record.recordId || ''),
      String(record && record.sourceRowNumber || ''),
      String(record && record.timestampInEpochMs || record.timestampIn || '')
    ].join('|');
  }

  function checkoutGetOrCreateRequestId_(record) {
    const key = checkoutPendingKey_(record);

    try {
      const saved = JSON.parse(
        window.sessionStorage.getItem(key) || 'null'
      );
      const savedId = String(
        saved && (saved.clientRequestId || saved.requestId) || ''
      ).trim();

      if (savedId) {
        return savedId;
      }
    } catch (error) {
      /* สร้าง Request ID ใหม่เมื่อ Storage อ่านไม่ได้ */
    }

    return checkoutCreateRequestId_();
  }

  function checkoutSavePending_(record, payload) {
    try {
      window.sessionStorage.setItem(
        checkoutPendingKey_(record),
        JSON.stringify({
          ...payload,
          moduleId: state.moduleId,
          savedAt: Date.now()
        })
      );
    } catch (error) {
      console.warn('เก็บคำขอ Gate Out สำหรับ Recovery ไม่สำเร็จ', error);
    }
  }

  function checkoutClearPending_(record) {
    try {
      window.sessionStorage.removeItem(
        checkoutPendingKey_(record)
      );
    } catch (error) {
      /* ไม่กระทบธุรกรรมหลัก */
    }
  }

  function checkoutIsAmbiguousError_(error) {
    return [
      'NETWORK_ERROR',
      'REQUEST_TIMEOUT',
      'GAS_TIMEOUT',
      'GAS_CONNECTION_FAILED',
      'GAS_HTTP_ERROR',
      'GAS_INVALID_RESPONSE',
      'CHECKOUT_COMMIT_NOT_VERIFIED'
    ].includes(
      String(error && error.code || '').toUpperCase()
    ) || Boolean(
      error &&
      error.details &&
      error.details.verificationRequired === true
    );
  }

  async function checkoutVerifyCommit_(payload, originalError) {
    let lastError = originalError;

    for (
      let attempt = 1;
      attempt <= CHECKOUT_VERIFY_ATTEMPTS;
      attempt += 1
    ) {
      if (attempt > 1) {
        await new Promise((resolve) => {
          window.setTimeout(resolve, attempt * 500);
        });
      }

      try {
        const status = await API.getCheckoutCommitStatus(
          state.moduleId,
          payload
        );

        if (status && status.completed === true) {
          return {
            ...status,
            success: true,
            committed: true,
            idempotentReplay: true,
            recoveredFromAmbiguousResponse: true,
            verificationCount: attempt
          };
        }
      } catch (error) {
        lastError = error;

        if (!checkoutIsAmbiguousError_(error)) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  function createCheckoutPreviewHtml(record) {
    const fields = Array.isArray(record.fields)
      ? record.fields
          .filter((field) => field.value)
          .slice(0, 4)
      : [];

    const fieldHtml =
      fields
        .map(
          (field) => `
            <div class="checkout-preview-row">
              <span>${escapeHtml(field.label || '-')}</span>
              <strong>${escapeHtml(field.value || '-')}</strong>
            </div>
          `
        )
        .join('');

    return `
      <div class="checkout-preview">
        <div class="checkout-preview-primary">
          ${escapeHtml(record.primaryValue || '-')}
        </div>

        ${fieldHtml}

        <div class="checkout-preview-row">
          <span>เวลาเข้า</span>
          <strong>${escapeHtml(record.timestampIn || '-')}</strong>
        </div>

        <div class="checkout-preview-row">
          <span>ระยะเวลาปัจจุบัน</span>
          <strong>${escapeHtml(record.durationDisplay || '-')}</strong>
        </div>
      </div>
    `;
  }

  async function openCalendar() {
    if (
      !state.module ||
      !state.module.calendarEnabled
    ) {
      await Swal.fire({
        icon: 'info',
        title: 'ปฏิทินถูกปิดใช้งาน',
        confirmButtonText: 'ตกลง'
      });
      return;
    }

    const now = getCurrentServerDate();

    let selectedMonth =
      Number(
        formatInBangkok(now, 'M')
      );

    let selectedYear =
      Number(
        formatInBangkok(now, 'yyyy')
      );

    await Swal.fire({
      width: 760,
      title: 'ปฏิทินข้อมูลรถ',
      html: `
        <div id="calendarModal" class="calendar-modal">
          <div class="calendar-toolbar">
            <button id="calendarPrev" type="button">‹</button>
            <strong id="calendarMonthLabel">กำลังโหลด...</strong>
            <button id="calendarNext" type="button">›</button>
          </div>

          <div class="calendar-weekdays">
            <span>อา.</span>
            <span>จ.</span>
            <span>อ.</span>
            <span>พ.</span>
            <span>พฤ.</span>
            <span>ศ.</span>
            <span>ส.</span>
          </div>

          <div id="calendarGrid" class="calendar-grid"></div>

          <div class="calendar-legend">
            <span data-severity="GREEN">ปิดงานครบ</span>
            <span data-severity="ORANGE">ยังมีงาน Active</span>
            <span data-severity="GRAY">ข้อมูลต้องตรวจสอบ</span>
          </div>
        </div>
      `,
      showConfirmButton: true,
      confirmButtonText: 'ปิด',
      showCancelButton: true,
      cancelButtonText: 'วันนี้',
      reverseButtons: true,
      didOpen: () => {
        const prevButton =
          document.getElementById('calendarPrev');

        const nextButton =
          document.getElementById('calendarNext');

        prevButton && prevButton.addEventListener(
          'click',
          async () => {
            selectedMonth -= 1;

            if (selectedMonth < 1) {
              selectedMonth = 12;
              selectedYear -= 1;
            }

            await renderCalendarMonth(
              selectedMonth,
              selectedYear
            );
          }
        );

        nextButton && nextButton.addEventListener(
          'click',
          async () => {
            selectedMonth += 1;

            if (selectedMonth > 12) {
              selectedMonth = 1;
              selectedYear += 1;
            }

            await renderCalendarMonth(
              selectedMonth,
              selectedYear
            );
          }
        );

        renderCalendarMonth(
          selectedMonth,
          selectedYear
        );
      }
    }).then(async (result) => {
      if (
        result.dismiss ===
        Swal.DismissReason.cancel
      ) {
        await openDailySummary(
          formatBangkokDateOnly(now)
        );
      }
    });
  }

  async function renderCalendarMonth(month, year) {
    const label =
      document.getElementById('calendarMonthLabel');

    const grid =
      document.getElementById('calendarGrid');

    if (!label || !grid) {
      return;
    }

    label.textContent =
      getThaiMonthName(month) +
      ' ' +
      year;

    grid.innerHTML =
      '<div class="calendar-loading">กำลังโหลดข้อมูล...</div>';

    try {
      const result =
        await API.getCalendar(
          state.moduleId,
          month,
          year
        );

      const dayMap = new Map();

      (
        Array.isArray(result.days)
          ? result.days
          : []
      ).forEach((day) => {
        dayMap.set(day.date, day);
      });

      grid.innerHTML = '';

      const firstDay =
        new Date(
          Date.UTC(
            year,
            month - 1,
            1
          )
        ).getUTCDay();

      const daysInMonth =
        new Date(
          Date.UTC(
            year,
            month,
            0
          )
        ).getUTCDate();

      for (
        let blank = 0;
        blank < firstDay;
        blank += 1
      ) {
        const empty =
          document.createElement('span');

        empty.className =
          'calendar-day calendar-day--empty';

        grid.appendChild(empty);
      }

      for (
        let dayNumber = 1;
        dayNumber <= daysInMonth;
        dayNumber += 1
      ) {
        const dateKey =
          pad2(dayNumber) +
          '/' +
          pad2(month) +
          '/' +
          year;

        const data =
          dayMap.get(dateKey);

        const button =
          document.createElement('button');

        button.type = 'button';
        button.className = 'calendar-day';
        button.dataset.severity =
          data
            ? data.severity
            : 'NONE';

        if (
          dateKey ===
          formatBangkokDateOnly(
            getCurrentServerDate()
          )
        ) {
          button.classList.add(
            'calendar-day--today'
          );
        }

        const number =
          document.createElement('strong');

        number.textContent =
          String(dayNumber);

        const count =
          document.createElement('span');

        count.textContent =
          data
            ? data.totalRecords +
              ' คัน'
            : '';

        button.appendChild(number);
        button.appendChild(count);

        if (data) {
          button.addEventListener(
            'click',
            () => {
              Swal.close();
              openDailySummary(dateKey);
            }
          );
        } else {
          button.disabled = true;
        }

        grid.appendChild(button);
      }

    } catch (error) {
      grid.innerHTML = '';

      const errorBox =
        document.createElement('div');

      errorBox.className =
        'calendar-loading calendar-loading--error';

      errorBox.textContent =
        buildErrorMessage(error);

      grid.appendChild(errorBox);
    }
  }

  async function openDailySummary(date) {
    showLoading(
      'กำลังโหลดข้อมูลรายวัน',
      'วันที่ ' + date
    );

    try {
      const result =
        await API.getDailySummary(
          state.moduleId,
          date
        );

      Swal.close();

      await Swal.fire({
        width: 900,
        title:
          'ข้อมูลประจำวันที่ ' +
          date,
        html:
          createDailySummaryHtml(
            result
          ),
        confirmButtonText: 'ปิด'
      });

    } catch (error) {
      Swal.close();

      await showApiError(
        error,
        'โหลดข้อมูลรายวันไม่สำเร็จ'
      );
    }
  }

  function createDailySummaryHtml(result) {
    const summary = result && result.summary ? result.summary : {};
    const records = Array.isArray(result && result.records) ? result.records : [];
    const summaryItems = [
      ['Gate In', summary.totalRecords || 0, 'คัน'],
      ['รอยื่นเอกสาร', summary.waitingDocumentSubmission || 0, 'คัน'],
      ['รอรับสินค้า', summary.waitingReceiving || 0, 'คัน'],
      ['รอรับเอกสารคืน', summary.receivingCompleted || 0, 'คัน'],
      ['คืนเอกสารแล้ว', summary.documentReturned || 0, 'คัน'],
      ['Gate Out', summary.gateOutCompleted || summary.exitedRecords || 0, 'คัน'],
      ['ยัง Active', summary.activeRecords || 0, 'คัน'],
      ['เวลารวมเฉลี่ย', getDurationDisplay(summary.averageDuration), '']
    ];
    const summaryHtml = summaryItems.map(function (item) {
      const label = item[0], value = item[1], unit = item[2];
      return '<div class="daily-summary-item"><span>' + escapeHtml(label) + '</span><strong>' +
        escapeHtml(String(value)) + (unit ? '<small>' + escapeHtml(unit) + '</small>' : '') +
        '</strong></div>';
    }).join('');
    const rowsHtml = records.length === 0
      ? '<div class="daily-empty">ไม่พบรายการในวันที่เลือก</div>'
      : '<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">' +
        '<thead><tr><th style="text-align:center;padding:7px">ลำดับ</th><th style="text-align:left;padding:7px">เลขนัดหมาย</th>' +
        '<th style="text-align:left;padding:7px">บริษัท</th><th style="text-align:left;padding:7px">Gate In</th>' +
        '<th style="text-align:left;padding:7px">สถานะ</th><th style="text-align:left;padding:7px">Gate Out / ระยะเวลา</th></tr></thead><tbody>' +
        records.map(function (record, index) {
          return '<tr style="border-top:1px solid #e3ebf0"><td style="text-align:center;padding:8px">' + (index + 1) + '</td>' +
            '<td style="padding:8px;font-weight:800">' + escapeHtml(record.appointmentNumber || record.primaryValue || '-') + '</td>' +
            '<td style="padding:8px">' + escapeHtml(record.companyName || '-') + '</td>' +
            '<td style="padding:8px;white-space:nowrap">' + escapeHtml(record.timestampIn || '-') + '</td>' +
            '<td style="padding:8px">' + escapeHtml(record.statusLabel || '-') + '</td>' +
            '<td style="padding:8px;white-space:nowrap">' + escapeHtml(record.timestampOut || 'ยังไม่ Gate Out') +
            '<br><small>' + escapeHtml(record.durationDisplay || '-') + '</small></td></tr>';
        }).join('') + '</tbody></table></div>';
    return '<div class="daily-summary"><div class="daily-summary-grid">' + summaryHtml +
      '</div><div class="daily-record-list">' + rowsHtml + '</div></div>';
  }

  function getDurationDisplay(value) {
    if (
      value &&
      typeof value === 'object'
    ) {
      return value.display || '-';
    }

    return value || '-';
  }

  async function handleLogout() {
    const confirmation =
      await Swal.fire({
        icon: 'question',
        title: 'ออกจากระบบ?',
        text: 'ยืนยันการออกจากระบบ',
        showCancelButton: true,
        confirmButtonText: 'ออกจากระบบ',
        cancelButtonText: 'ยกเลิก',
        reverseButtons: true
      });

    if (!confirmation.isConfirmed) {
      return;
    }

    showLoading(
      'กำลังออกจากระบบ',
      'กรุณารอสักครู่'
    );

    try {
      await API.logout();
    } catch (error) {
      console.warn(
        'Logout ไม่สำเร็จ',
        error
      );
    } finally {
      Swal.close();
    }

    clearOverdueBadgePresentation();
    redirectToLogin();
  }

  async function showSessionExpired() {
    await Swal.fire({
      icon: 'warning',
      title: 'Session หมดอายุ',
      text: 'กรุณาเข้าสู่ระบบใหม่',
      confirmButtonText: 'ไปหน้าเข้าสู่ระบบ',
      allowOutsideClick: false
    });

    clearOverdueBadgePresentation();
    redirectToLogin();
  }

  function normalizeSessionRole(session) {
    const user =
      session &&
      session.user &&
      typeof session.user === 'object'
        ? session.user
        : session || {};

    const role = String(user.role || '')
      .trim()
      .toUpperCase();

    if (role === 'ADMIN') return 'ADMIN';
    if (role === 'INBOUND') return 'INBOUND';
    if (role === 'USER') return 'USER';

    return '';
  }

  function clearLegacyInboundRouteArtifacts() {
    const keys = [
      'vcw_inbound_only',
      'alertvendor_user',
      'alertvendor_current_user',
      'currentUser',
      'auth_user',
      'user',
      'vehicle_status_user',
      'alertvendor_session',
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
    ];

    [window.sessionStorage, window.localStorage]
      .forEach((storage) => {
        keys.forEach((key) => {
          try {
            storage.removeItem(key);
          } catch (error) {
            /* Browser อาจปิด Storage บางชนิด */
          }
        });
      });
  }

  function isAdmin() {
    return normalizeSessionRole(state.session) === 'ADMIN';
  }

  function updateServerOffset(generatedAt) {
    const serverDate =
      parseBangkokDateTime(
        generatedAt
      );

    if (!serverDate) {
      state.serverOffsetMs = 0;
      return;
    }

    state.serverOffsetMs =
      serverDate.getTime() -
      Date.now();
  }

  function getCurrentServerTimeMs() {
    return (
      Date.now() +
      state.serverOffsetMs
    );
  }

  function getCurrentServerDate() {
    return new Date(
      getCurrentServerTimeMs()
    );
  }

  function parseBangkokDateTime(value) {
    const text =
      String(value || '').trim();

    const match =
      text.match(
        /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/
      );

    if (!match) {
      return null;
    }

    const iso =
      match[3] +
      '-' +
      match[2] +
      '-' +
      match[1] +
      'T' +
      match[4] +
      ':' +
      match[5] +
      ':' +
      match[6] +
      '+07:00';

    const date = new Date(iso);

    return Number.isNaN(
      date.getTime()
    )
      ? null
      : date;
  }

  function formatBangkokDateTime(date) {
    const formatter =
      new Intl.DateTimeFormat(
        'en-GB',
        {
          timeZone:
            CONFIG.TIMEZONE ||
            'Asia/Bangkok',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hourCycle: 'h23'
        }
      );

    const parts = {};

    formatter
      .formatToParts(date)
      .forEach((part) => {
        parts[part.type] =
          part.value;
      });

    return (
      parts.day +
      '/' +
      parts.month +
      '/' +
      parts.year +
      ' ' +
      parts.hour +
      ':' +
      parts.minute +
      ':' +
      parts.second
    );
  }

  function formatBangkokDateOnly(date) {
    return new Intl.DateTimeFormat(
      'en-GB',
      {
        timeZone:
          CONFIG.TIMEZONE ||
          'Asia/Bangkok',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }
    ).format(date);
  }

  function formatInBangkok(date, part) {
    const options = {
      timeZone:
        CONFIG.TIMEZONE ||
        'Asia/Bangkok'
    };

    if (part === 'M') {
      options.month = 'numeric';
    } else if (part === 'yyyy') {
      options.year = 'numeric';
    }

    return new Intl.DateTimeFormat(
      'en-US',
      options
    ).format(date);
  }

  function formatDurationSeconds(totalSeconds) {
    const seconds = Math.max(
      0,
      Math.floor(
        Number(totalSeconds) || 0
      )
    );

    const hours =
      Math.floor(seconds / 3600);

    const minutes =
      Math.floor(
        (
          seconds % 3600
        ) / 60
      );

    const remaining =
      seconds % 60;

    return (
      String(hours).padStart(2, '0') +
      ':' +
      String(minutes).padStart(2, '0') +
      ':' +
      String(remaining).padStart(2, '0')
    );
  }

  function getStatusLabel(statusCode) {
    const labels = {
      NORMAL: 'ปกติ',
      WARNING: 'ใกล้เกินเวลา',
      OVERDUE: 'เกินเวลา',
      INCOMPLETE: 'ข้อมูลไม่สมบูรณ์'
    };

    return (
      labels[statusCode] ||
      'ไม่ทราบสถานะ'
    );
  }

  function getStatusColor(statusCode) {
    const colors = {
      NORMAL: 'GREEN',
      WARNING: 'ORANGE',
      OVERDUE: 'RED',
      INCOMPLETE: 'GRAY'
    };

    return (
      colors[statusCode] ||
      'GRAY'
    );
  }

  function showPageLoading(show) {
    const element =
      document.getElementById('pageLoading');

    element &&
      element.classList.toggle(
        'is-hidden',
        !show
      );
  }

  function showVehicleLoading(show) {
    const element =
      document.getElementById('vehicleLoading');

    element &&
      element.classList.toggle(
        'is-hidden',
        !show
      );
  }

  function setButtonLoading(button, loading, text) {
    if (!button) {
      return;
    }

    if (loading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText =
          button.textContent;
      }

      button.disabled = true;
      button.textContent =
        text ||
        'กำลังดำเนินการ...';

      return;
    }

    button.disabled = false;

    if (button.dataset.originalText) {
      button.textContent =
        button.dataset.originalText;
    }
  }

  function showLoading(title, text) {
    Swal.fire({
      title,
      text: text || '',
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  }

  function showToast(message, icon) {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon: icon || 'success',
      title: message,
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true
    });
  }

  function showApiError(error, title) {
    return Swal.fire({
      icon: 'error',
      title:
        title ||
        'เกิดข้อผิดพลาด',
      html:
        buildErrorHtml(error),
      confirmButtonText: 'ตกลง'
    });
  }

  function buildErrorHtml(error) {
    const requestId =
      error && error.requestId
        ? String(error.requestId)
        : '';

    return `
      <div class="swal-error-content">
        <div>
          ${escapeHtml(buildErrorMessage(error))}
        </div>

        ${
          requestId
            ? `
              <div class="request-id">
                รหัสอ้างอิง: ${escapeHtml(requestId)}
              </div>
            `
            : ''
        }
      </div>
    `;
  }

  function buildErrorMessage(error) {
    if (!error) {
      return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ';
    }

    const messages = {
      AUTH_REQUIRED:
        'กรุณาเข้าสู่ระบบ',
      SESSION_EXPIRED:
        'Session หมดอายุ กรุณาเข้าสู่ระบบใหม่',
      ORIGIN_NOT_ALLOWED:
        'โดเมนเว็บไซต์ยังไม่ได้รับอนุญาตใน Cloudflare',
      ALREADY_CHECKED_OUT:
        'รายการนี้ถูกบันทึกออกจากพื้นที่แล้ว',
      RECORD_CHANGED:
        'ข้อมูลรายการเปลี่ยนแปลงแล้ว กรุณารีเฟรชข้อมูล',
      RECORD_NO_LONGER_MATCHES:
        'รายการนี้ไม่ตรงกับเงื่อนไขของโมดูลแล้ว',
      CHECKOUT_BUSY:
        'ระบบกำลังบันทึกรายการอื่น กรุณาลองใหม่',
      INCOMPLETE_RECORD:
        'ข้อมูลรายการไม่สมบูรณ์ จึงยังบันทึกออกไม่ได้',
      REQUEST_TIMEOUT:
        'ระบบใช้เวลาตอบกลับนานเกินกำหนด',
      NETWORK_ERROR:
        'ไม่สามารถเชื่อมต่อระบบได้ กรุณาตรวจสอบอินเทอร์เน็ต'
    };

    return (
      messages[error.code] ||
      error.message ||
      'เกิดข้อผิดพลาดจากระบบ'
    );
  }

  function isAuthenticationError(error) {
    return Boolean(
      error &&
      (
        error.status === 401 ||
        [
          'AUTH_REQUIRED',
          'SESSION_EXPIRED',
          'INVALID_SESSION',
          'INVALID_SESSION_SIGNATURE',
          'SESSION_VERSION_EXPIRED'
        ].includes(error.code)
      )
    );
  }

  function setText(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent = value;
    }
  }

  function sanitizePhone(value) {
    return String(value || '')
      .replace(/[^0-9+]/g, '');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function debounce(callback, delay) {
    let timeoutId = null;

    return function (...args) {
      window.clearTimeout(timeoutId);

      timeoutId = window.setTimeout(
        () => {
          callback.apply(this, args);
        },
        delay
      );
    };
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function getThaiMonthName(month) {
    const names = [
      '',
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม'
    ];

    return names[Number(month)] || '';
  }

  function getModuleIdFromUrl() {
    const url =
      new URL(window.location.href);

    return String(
      url.searchParams.get('id') ||
      ''
    ).trim();
  }

  function redirectToDashboard() {
    window.location.href =
      CONFIG.DASHBOARD_URL ||
      './index.html';
  }

  function redirectToInbound() {
    window.location.replace(
      CONFIG.INBOUND_URL ||
      './inbound.html'
    );
  }

  function redirectToLogin() {
    window.location.replace(
      CONFIG.LOGIN_URL ||
      './login.html'
    );
  }


  window.VehicleModule = Object.freeze({
    refreshOperationalBoard(
      forceRefresh
    ) {
      return loadRecords({
        silentError: true,
        showSuccessToast: false,
        forceRender: true,
        forceRefresh:
          forceRefresh !== false
      });
    },

    getRecord(recordId) {
      return state.records.find(
        (record) =>
          String(record.recordId || '') ===
          String(recordId || '')
      ) || null;
    },

    getOperationalBoard() {
      return state.operationalBoard;
    },

    applyReceivingAccepted(detail) {
      return handleReceivingAcceptedEvent(
        detail
      );
    },

    applyReceivingCommitted(detail) {
      return handleReceivingCommittedEvent(
        detail
      );
    },

    applyReceivingRejected(detail) {
      return handleReceivingRejectedEvent(
        detail
      );
    },

    getServerTimeMs() {
      return getCurrentServerTimeMs();
    },

    verifyOperationalBoardRevision(
      delayMs
    ) {
      scheduleNextRevisionCheck(
        Math.max(
          120,
          Number(delayMs) ||
          120
        )
      );

      return true;
    },

    getBoardState() {
      const health = String(
        document.body.dataset.boardHealth ||
        state.boardHealth ||
        'BLOCKED'
      ).toUpperCase();

      return {
        health,
        writable: health === 'LIVE',
        generatedAt:
          state.operationalBoard &&
          state.operationalBoard.generatedAt ||
          '',
        integrity:
          state.operationalBoard &&
          state.operationalBoard.integrity ||
          null
      };
    }
  });

  function destroyPage() {
    state.destroyed = true;
    window.removeEventListener(
      'alertvendor:foreground-write-change',
      handleForegroundWriteChange
    );
    stopAutoRefresh();

    [
      state.clockTimer,
      state.durationTimer,
      state.autoClosePersistTimer,
      state.timelineSnapTimer
    ].forEach((timer) => {
      if (timer) {
        window.clearInterval(timer);
      }
    });
  }

})(window, document);


/* ============================================================
 * SOURCE 07: receiving(5).js
 * ============================================================ */
'use strict';

/************************************************************
 * receiving.js
 * ROUND 11 REVISION 2 — Receiving Production One-Click
 *
 * หน้าที่ของ Browser
 * 1) จับเวลา ณ ตอนกด
 * 2) เก็บคำสั่งในเครื่องก่อนส่ง Network
 * 3) นำการ์ดออกจากงานที่ต้องทำทันที
 * 4) ส่งคำสั่งไป Server และตรวจสถานะเงียบ ๆ
 *
 * Browser ไม่ประมวลผล Workflow และไม่เปิด Popup ขวางงาน
 ************************************************************/

(function (window, document) {
  const BUILD = '2026.07.22-round4-hotfix5-receiving-instant-ui-v1';
  const STORAGE_PREFIX = 'smartalert:receiving-command:v1:';
  const MAX_ITEM_AGE_MS = 24 * 60 * 60 * 1000;
  const SEND_RETRY_MIN_MS = 1800;
  const SEND_RETRY_MAX_MS = 30000;
  const STATUS_POLL_MS = 4000;
  const LOOP_MS = 1500;
  const pending = new Map();
  let loopTimer = null;
  let loopRunning = false;

  const PERMANENT_CODES = new Set([
    'AUTH_REQUIRED',
    'FORBIDDEN',
    'MODULE_ID_REQUIRED',
    'INVALID_RECORD_ID',
    'RECORD_NOT_FOUND',
    'STALE_RECORD',
    'SOURCE_RECORD_CHANGED',
    'RECORD_ALREADY_OUT',
    'NOT_CURRENTLY_IN_AREA',
    'DOCUMENT_NOT_SUBMITTED',
    'RECEIVING_NOT_ALLOWED',
    'RECEIVING_DISABLED',
    'RECEIVING_COMMAND_REJECTED',
    'DOCUMENT_SUBMIT_REQUIRED',
    'WORKFLOW_STATE_NOT_READY_FOR_RECEIVING',
    'WORKFLOW_STAGE_ORDER_INVALID',
    'WORKFLOW_CANCELLED',
    'WORKFLOW_ALREADY_CLOSED',
    'WORKFLOW_RECEIVING_EVENT_MISSING',
    'WORKFLOW_ALREADY_GATE_OUT',
    'WORKFLOW_ALREADY_CANCELLED'
  ]);

  function initialize() {
    document.body.dataset.receivingUiBuild = BUILD;
    injectUi();
    loadPending();
    document.addEventListener('click', handleClick, true);
    window.addEventListener('online', scheduleLoopNow);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') scheduleLoopNow();
    });
    applyPendingToBoard();
    updateStrip();
    scheduleLoopNow();
  }

  async function handleClick(event) {
    const button = event.target && event.target.closest
      ? event.target.closest('.receiving-complete-button')
      : null;
    if (!button) return;

    event.preventDefault();
    event.stopPropagation();

    if (button.disabled || button.dataset.canComplete === 'FALSE') return;

    /*
     * คลิกที่ผ่าน Guard แล้วเป็นเจ้าของโดย Receiving handler เพียงตัวเดียว
     * ป้องกัน module-workflow-guard listener ตัวถัดไปเปิด SweetAlert ซ้ำ
     * หลังปุ่มถูกเปลี่ยนเป็นสถานะกำลังบันทึก
     */
    event.stopImmediatePropagation();

    const moduleId = getModuleId();
    const recordId = String(button.dataset.recordId || '').trim();
    if (!moduleId || !recordId) {
      showToast('error', 'ไม่พบข้อมูลรถสำหรับรับสินค้าเสร็จ');
      return;
    }

    const existing = findPendingByRecord(recordId);
    if (existing) {
      showToast('info', 'รายการนี้รับคำสั่งแล้ว ไม่ต้องกดซ้ำ');
      return;
    }

    const record = getRecord(recordId) || {};
    const clickedAtEpochMs = getServerSyncedNow();
    const command = {
      requestId: createRequestId(moduleId, recordId, clickedAtEpochMs),
      moduleId: moduleId,
      recordId: recordId,
      canonicalRecordId: String(
        button.dataset.canonicalRecordId || record.canonicalRecordId || ''
      ).trim(),
      sourceRowNumber: Number(
        button.dataset.sourceRowNumber || record.sourceRowNumber || 0
      ) || 0,
      expectedTimestampIn: String(
        button.dataset.expectedTimestampIn || record.timestampIn || ''
      ).trim(),
      expectedTimestampInEpochMs: Number(
        button.dataset.expectedTimestampInEpochMs || record.timestampInEpochMs || 0
      ) || 0,
      expectedPrimaryValue: String(
        button.dataset.expectedPrimaryValue || record.primaryValue || ''
      ).trim(),
      entryCode: String(
        button.dataset.entryCode || record.autoId || record.sourceAutoId || ''
      ).trim(),
      autoId: String(
        button.dataset.entryCode || record.autoId || record.sourceAutoId || ''
      ).trim(),
      clientRequestId: '',
      clientActionAtEpochMs: clickedAtEpochMs,
      receivingCompleteAt: formatDateTime(clickedAtEpochMs),
      createdAtEpochMs: Date.now(),
      updatedAtEpochMs: Date.now(),
      status: 'LOCAL_ACCEPTED',
      sendAttempts: 0,
      nextSendAtEpochMs: Date.now(),
      nextStatusAtEpochMs: 0,
      serverAccepted: false,
      lastCode: '',
      lastMessage: '',
      previousOperationalStage: String(
        record.operationalStage || 'WAITING_RECEIVING'
      ),
      previousWorkflowStatusCode: String(
        record.workflowStatusCode ||
        record.statusCode ||
        'DOCUMENT_SUBMITTED'
      ),
      previousReceivingCompleteAt: String(
        record.receivingCompleteAt || ''
      )
    };
    command.clientRequestId = command.requestId;

    command.status = navigator.onLine === true ? 'SENDING' : 'LOCAL_ACCEPTED';
    pending.set(command.requestId, command);
    persistPending();
    setButtonsForRecord(recordId, true);

    /*
     * ย้ายการ์ดออกจากงานรอรับสินค้าทันที
     * คำสั่งถูกเก็บใน Local Storage ก่อนแล้ว
     * ถ้า Backend ปฏิเสธจริง ระบบจะคืนการ์ดด้วยข้อมูลเดิม
     */
    dispatchAccepted(command);
    closeDetailModal();
    updateStrip();

    showToast(
      navigator.onLine === true ? 'info' : 'warning',
      navigator.onLine === true
        ? 'รับคำสั่งแล้ว · ย้ายรายการไปขั้นตอนถัดไป ' + (command.expectedPrimaryValue || command.entryCode || '')
        : 'อุปกรณ์ออฟไลน์ เก็บคำสั่งไว้และจะแจ้งผลเมื่อเชื่อมต่อ'
    );

    void submitCommand(command);
  }

  async function submitCommand(command) {
    if (!command || command.inFlight === true || !navigator.onLine) return;
    if (!window.VehicleAPI || typeof window.VehicleAPI.completeReceiving !== 'function') {
      command.lastCode = 'API_NOT_READY';
      scheduleSendRetry(command);
      return;
    }

    command.inFlight = true;
    command.status = command.serverAccepted ? 'SERVER_ACCEPTED' : 'SENDING';
    command.sendAttempts = Number(command.sendAttempts || 0) + 1;
    command.updatedAtEpochMs = Date.now();
    persistPending();
    updateStrip();

    try {
      const result = await window.VehicleAPI.completeReceiving(
        command.moduleId,
        commandPayload(command)
      );

      const code = normalizeCode(result && result.code);
      if (result && (result.rejected === true || result.review === true || isPermanentCode(code))) {
        rejectCommand(command, code, result.message || 'ไม่สามารถบันทึกรายการนี้ได้');
        return;
      }

      if (result && (
        result.workflowCommitted === true ||
        (result.committed === true && result.completed === true)
      )) {
        command.serverAccepted = true;
        command.status = 'DONE';
        command.receivingCompleteAt = String(
          result.receivingCompleteAt || command.receivingCompleteAt
        );
        command.lastCode = code || 'RECEIVING_COMMAND_ACCEPTED';
        command.lastMessage = String(result.message || 'รับคำสั่งแล้ว');
        command.nextStatusAtEpochMs = Date.now() + 800;
        command.updatedAtEpochMs = Date.now();
        persistPending();

        if (command.status === 'DONE') {
          completeCommand(command, result);
        } else {
          updateStrip();
          scheduleLoopNow();
        }
        return;
      }

      command.lastCode = code || 'UNKNOWN_RESPONSE';
      command.lastMessage = String(result && result.message || 'ระบบยังไม่ยืนยันคำสั่ง');
      scheduleSendRetry(command);
    } catch (error) {
      const code = normalizeCode(error && (error.code || error.apiCode));
      if (isPermanentCode(code)) {
        rejectCommand(command, code, error.message || 'ไม่สามารถบันทึกรายการนี้ได้');
        return;
      }

      /* Timeout อาจเกิดหลัง Server append สำเร็จแล้ว จึงตรวจสถานะก่อนส่งซ้ำ */
      command.lastCode = code || 'NETWORK_OR_TIMEOUT';
      command.lastMessage = String(error && error.message || 'การเชื่อมต่อไม่เสถียร');
      command.status = command.serverAccepted ? 'SERVER_ACCEPTED' : 'VERIFYING';
      command.nextStatusAtEpochMs = Date.now() + 800;
      command.nextSendAtEpochMs = Date.now() + retryDelay(command.sendAttempts);
      command.updatedAtEpochMs = Date.now();
      persistPending();
      updateStrip();
      scheduleLoopNow();
    } finally {
      command.inFlight = false;
    }
  }

  async function pollCommand(command) {
    if (!command || command.status === 'DONE' || command.inFlight === true || !navigator.onLine) return;
    if (!window.VehicleAPI || typeof window.VehicleAPI.getReceivingCommitStatus !== 'function') return;

    command.inFlight = true;
    command.status = 'VERIFYING';
    command.updatedAtEpochMs = Date.now();
    persistPending();

    try {
      const result = await window.VehicleAPI.getReceivingCommitStatus(
        command.moduleId,
        commandPayload(command)
      );
      const code = normalizeCode(result && result.code);

      if (result && (result.rejected === true || result.review === true || isPermanentCode(code))) {
        rejectCommand(command, code, result.message || 'คำสั่งนี้ไม่สามารถบันทึกได้');
        return;
      }

      if (result && (result.workflowCommitted === true || result.completed === true || result.done === true || result.committed === true)) {
        completeCommand(command, result);
        return;
      }

      if (result && (result.found === true || result.queueAccepted === true || result.commandAccepted === true)) {
        command.serverAccepted = true;
        command.status = 'SERVER_ACCEPTED';
        command.lastCode = code || 'RECEIVING_COMMAND_PENDING';
        command.lastMessage = String(result.message || 'ระบบกำลังบันทึกข้อมูลส่วนกลาง');
        command.nextStatusAtEpochMs = Date.now() + STATUS_POLL_MS;
        command.updatedAtEpochMs = Date.now();
        persistPending();
        updateStrip();
        return;
      }

      if (!command.serverAccepted && Date.now() >= Number(command.nextSendAtEpochMs || 0)) {
        command.status = 'LOCAL_ACCEPTED';
      } else {
        command.nextStatusAtEpochMs = Date.now() + STATUS_POLL_MS;
      }
      persistPending();
    } catch (error) {
      const code = normalizeCode(error && (error.code || error.apiCode));
      if (isPermanentCode(code)) {
        rejectCommand(command, code, error.message || 'คำสั่งนี้ไม่สามารถบันทึกได้');
        return;
      }
      command.lastCode = code || 'STATUS_CHECK_FAILED';
      command.status = command.serverAccepted ? 'SERVER_ACCEPTED' : 'LOCAL_ACCEPTED';
      command.nextStatusAtEpochMs = Date.now() + STATUS_POLL_MS;
      command.updatedAtEpochMs = Date.now();
      persistPending();
    } finally {
      command.inFlight = false;
      updateStrip();
    }
  }

  function completeCommand(command, result) {
    command.status = 'DONE';
    command.updatedAtEpochMs = Date.now();
    dispatchCommitted(command, result || {});
    pending.delete(command.requestId);
    persistPending();
    updateStrip();
    showToast(
      'success',
      'บันทึกรับสินค้าเสร็จแล้ว ' +
        (
          command.expectedPrimaryValue ||
          command.entryCode ||
          ''
        )
    );
    scheduleBoardRevisionCheck();
  }

  function rejectCommand(command, code, message) {
    pending.delete(command.requestId);
    persistPending();
    setButtonsForRecord(command.recordId, false);
    dispatchRejected(command, code, message);
    updateStrip();
    showToast(
      'error',
      (message || 'ไม่สามารถบันทึกรับสินค้าเสร็จได้') +
        (code ? ' [' + code + ']' : '')
    );
    scheduleBoardRefresh();
  }

  function scheduleSendRetry(command) {
    command.status = command.serverAccepted ? 'SERVER_ACCEPTED' : 'LOCAL_ACCEPTED';
    command.nextSendAtEpochMs = Date.now() + retryDelay(command.sendAttempts);
    command.nextStatusAtEpochMs = Date.now() + 800;
    command.updatedAtEpochMs = Date.now();
    persistPending();
    updateStrip();
    scheduleLoopNow();
  }

  async function processLoop() {
    if (loopRunning) return;
    loopRunning = true;
    try {
      const now = Date.now();
      const items = Array.from(pending.values());
      for (const command of items) {
        if (now - Number(command.createdAtEpochMs || now) > MAX_ITEM_AGE_MS) {
          rejectCommand(
            command,
            'COMMAND_EXPIRED',
            'คำสั่งค้างเกิน 24 ชั่วโมง กรุณาตรวจสอบกับ Admin'
          );
          continue;
        }
        if (!navigator.onLine || command.inFlight === true) continue;

        if (
          command.serverAccepted === true &&
          now >= Number(command.nextStatusAtEpochMs || 0)
        ) {
          await pollCommand(command);
          continue;
        }

        if (
          command.serverAccepted !== true &&
          now >= Number(command.nextStatusAtEpochMs || 0) &&
          command.sendAttempts > 0
        ) {
          await pollCommand(command);
          if (command.serverAccepted === true || command.status === 'DONE') continue;
        }

        if (
          command.serverAccepted !== true &&
          now >= Number(command.nextSendAtEpochMs || 0)
        ) {
          await submitCommand(command);
        }
      }
    } finally {
      loopRunning = false;
      scheduleLoop();
    }
  }

  function scheduleLoopNow() {
    if (loopTimer) window.clearTimeout(loopTimer);
    loopTimer = window.setTimeout(processLoop, 100);
  }

  function scheduleLoop() {
    if (loopTimer) window.clearTimeout(loopTimer);
    loopTimer = window.setTimeout(processLoop, LOOP_MS);
  }

  function commandPayload(command) {
    return {
      recordId: command.recordId,
      canonicalRecordId: command.canonicalRecordId,
      sourceRowNumber: command.sourceRowNumber,
      expectedTimestampIn: command.expectedTimestampIn,
      expectedTimestampInEpochMs: command.expectedTimestampInEpochMs,
      expectedPrimaryValue: command.expectedPrimaryValue,
      entryCode: command.entryCode,
      autoId: command.autoId,
      clientActionAtEpochMs: command.clientActionAtEpochMs,
      queuedAt: command.clientActionAtEpochMs,
      clientOfflineAtClick: navigator.onLine !== true,
      clientRequestId: command.requestId,
      requestId: command.requestId
    };
  }

  function dispatchAccepted(command) {
    const detail = transitionDetail(command);
    if (
      window.VehicleModule &&
      typeof window.VehicleModule.applyReceivingAccepted === 'function'
    ) {
      window.VehicleModule.applyReceivingAccepted(detail);
    } else {
      document.dispatchEvent(new CustomEvent('alertvendor:receiving-accepted', { detail }));
    }
  }

  function dispatchCommitted(command, result) {
    const detail = Object.assign(transitionDetail(command), { result: result || {} });
    if (
      window.VehicleModule &&
      typeof window.VehicleModule.applyReceivingCommitted === 'function'
    ) {
      window.VehicleModule.applyReceivingCommitted(detail);
    } else {
      document.dispatchEvent(new CustomEvent('alertvendor:receiving-committed', { detail }));
    }
  }

  function dispatchRejected(command, code, message) {
    const detail = Object.assign(transitionDetail(command), {
      code: code || 'RECEIVING_COMMAND_REJECTED',
      message: message || 'ไม่สามารถบันทึกได้'
    });
    if (
      window.VehicleModule &&
      typeof window.VehicleModule.applyReceivingRejected === 'function'
    ) {
      window.VehicleModule.applyReceivingRejected(detail);
    } else {
      document.dispatchEvent(new CustomEvent('alertvendor:receiving-rejected', { detail }));
    }
  }

  function transitionDetail(command) {
    return {
      requestId: command.requestId,
      moduleId: command.moduleId,
      recordId: command.recordId,
      canonicalRecordId: command.canonicalRecordId,
      sourceRowNumber: command.sourceRowNumber,
      autoId: command.autoId || command.entryCode,
      receivingCompleteAt: command.receivingCompleteAt,
      receivingCompleteEpochMs: command.clientActionAtEpochMs,
      hideFromReceivingWorkspace: true,
      previousOperationalStage:
        command.previousOperationalStage || 'WAITING_RECEIVING',
      previousWorkflowStatusCode:
        command.previousWorkflowStatusCode || 'DOCUMENT_SUBMITTED',
      previousReceivingCompleteAt:
        command.previousReceivingCompleteAt || ''
    };
  }

  function applyPendingToBoard() {
    pending.forEach(function (command) {
      command.status = 'VERIFYING';
      command.serverAccepted = false;
      command.nextStatusAtEpochMs = 0;
      setButtonsForRecord(command.recordId, true);
      dispatchAccepted(command);
    });
    persistPending();
  }

  function setButtonsForRecord(recordId, disabled) {
    const safe = cssEscape(recordId);
    document.querySelectorAll(
      '.receiving-complete-button[data-record-id="' + safe + '"]'
    ).forEach(function (button) {
      button.disabled = disabled === true;
      button.setAttribute('aria-disabled', disabled === true ? 'true' : 'false');
      button.dataset.receivingCommandPending = disabled === true ? 'TRUE' : 'FALSE';
      if (disabled === true) button.textContent = 'กำลังยืนยัน...';
      else button.textContent = 'บันทึกรับสินค้าเสร็จ';
    });
  }

  function updateStrip() {
    const strip = document.getElementById('receivingCommandStrip');
    if (!strip) return;
    const count = pending.size;
    if (!count) {
      strip.hidden = true;
      strip.dataset.state = 'IDLE';
      strip.textContent = '';
      return;
    }

    const offline = navigator.onLine !== true;
    const waitingServer = Array.from(pending.values()).filter(function (item) {
      return item.serverAccepted !== true;
    }).length;
    strip.hidden = false;
    strip.dataset.state = offline ? 'OFFLINE' : 'SYNCING';
    strip.innerHTML =
      '<strong>' + (offline ? 'เก็บคำสั่งในเครื่อง' : 'กำลังยืนยันกับระบบส่วนกลาง') + '</strong>' +
      '<span>' + count + ' รายการ' +
      (waitingServer ? ' · รอยืนยัน ' + waitingServer : '') +
      ' · รายการถูกย้ายออกจากงานรอรับสินค้าแล้ว</span>';
  }

  function injectUi() {
    if (!document.getElementById('receivingCommandStrip')) {
      const strip = document.createElement('div');
      strip.id = 'receivingCommandStrip';
      strip.className = 'receiving-command-strip';
      strip.hidden = true;
      const main = document.querySelector('main');
      if (main) main.insertBefore(strip, main.firstChild);
      else document.body.appendChild(strip);
    }

    if (!document.getElementById('receivingCommandToastRoot')) {
      const root = document.createElement('div');
      root.id = 'receivingCommandToastRoot';
      root.className = 'receiving-command-toast-root';
      root.setAttribute('aria-live', 'polite');
      document.body.appendChild(root);
    }
  }

  function showToast(type, message) {
    const root = document.getElementById('receivingCommandToastRoot');
    if (!root) return;
    const toast = document.createElement('div');
    toast.className = 'receiving-command-toast is-' + String(type || 'info');
    toast.innerHTML =
      '<span aria-hidden="true">' +
      (type === 'success' ? '✓' : type === 'error' ? '!' : '•') +
      '</span><p>' + escapeHtml(message) + '</p>';
    root.appendChild(toast);
    window.setTimeout(function () {
      toast.classList.add('is-leaving');
      window.setTimeout(function () { toast.remove(); }, 250);
    }, type === 'error' ? 7000 : 3600);
  }

  function loadPending() {
    pending.clear();
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey()) || '{}');
      const now = Date.now();
      Object.keys(parsed).forEach(function (requestId) {
        const item = parsed[requestId];
        if (!item || now - Number(item.createdAtEpochMs || 0) > MAX_ITEM_AGE_MS) return;
        item.inFlight = false;
        pending.set(requestId, item);
      });
    } catch (error) {
      localStorage.removeItem(storageKey());
    }
  }

  function persistPending() {
    try {
      const data = {};
      pending.forEach(function (item, requestId) {
        const copy = Object.assign({}, item);
        delete copy.inFlight;
        data[requestId] = copy;
      });
      if (Object.keys(data).length) localStorage.setItem(storageKey(), JSON.stringify(data));
      else localStorage.removeItem(storageKey());
    } catch (error) {
      /* UI ยังทำงานต่อได้ */
    }
  }

  function findPendingByRecord(recordId) {
    return Array.from(pending.values()).find(function (item) {
      return String(item.recordId || '') === String(recordId || '');
    }) || null;
  }

  function storageKey() {
    return STORAGE_PREFIX + getModuleId();
  }

  function getModuleId() {
    return String(
      new URLSearchParams(window.location.search).get('id') ||
      new URLSearchParams(window.location.search).get('moduleId') ||
      document.body.dataset.moduleId ||
      ''
    ).trim().toLowerCase();
  }

  function getRecord(recordId) {
    if (window.VehicleModule && typeof window.VehicleModule.getRecord === 'function') {
      return window.VehicleModule.getRecord(recordId) || null;
    }
    return null;
  }

  function getServerSyncedNow() {
    if (window.VehicleModule && typeof window.VehicleModule.getServerTimeMs === 'function') {
      const value = Number(window.VehicleModule.getServerTimeMs());
      if (Number.isFinite(value) && value > 0) return value;
    }
    return Date.now();
  }

  function createRequestId(moduleId, recordId, epochMs) {
    const random = window.crypto && typeof window.crypto.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
    return ['RCV2', moduleId, recordId, epochMs, random].join('|').slice(0, 200);
  }

  function retryDelay(attempt) {
    return Math.min(
      SEND_RETRY_MAX_MS,
      SEND_RETRY_MIN_MS * Math.pow(2, Math.min(5, Math.max(0, Number(attempt || 1) - 1)))
    );
  }

  function normalizeCode(value) {
    return String(value || '').trim().toUpperCase();
  }

  function isPermanentCode(code) {
    const clean = normalizeCode(code);
    if (PERMANENT_CODES.has(clean)) return true;
    return [
      'FORBIDDEN',
      'STALE',
      'NOT_FOUND',
      'ALREADY_OUT',
      'NOT_CURRENTLY_IN_AREA',
      'SOURCE_RECORD_CHANGED'
    ].some(function (token) { return clean.indexOf(token) >= 0; });
  }

  function scheduleBoardRevisionCheck() {
    window.setTimeout(function () {
      if (
        window.VehicleModule &&
        typeof window.VehicleModule.verifyOperationalBoardRevision === 'function'
      ) {
        window.VehicleModule.verifyOperationalBoardRevision(120);
      } else {
        document.dispatchEvent(new CustomEvent('alertvendor:check-operational-board-revision'));
      }
    }, 300);
  }

  function scheduleBoardRefresh() {
    window.setTimeout(function () {
      if (
        window.VehicleModule &&
        typeof window.VehicleModule.refreshOperationalBoard === 'function'
      ) {
        void window.VehicleModule.refreshOperationalBoard(true);
      } else {
        document.dispatchEvent(new CustomEvent('alertvendor:refresh-operational-board'));
      }
    }, 250);
  }

  function closeDetailModal() {
    try {
      if (window.Swal && typeof window.Swal.close === 'function') window.Swal.close();
    } catch (error) {}
  }

  function formatDateTime(epochMs) {
    const date = new Date(Number(epochMs) || Date.now());
    const pad = function (value) { return String(value).padStart(2, '0'); };
    return [pad(date.getDate()), pad(date.getMonth() + 1), date.getFullYear()].join('/') +
      ' ' + [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(':');
  }

  function timeOnly(epochMs) {
    return formatDateTime(epochMs).slice(-8);
  }

  function cssEscape(value) {
    if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(value || ''));
    return String(value || '').replace(/["\\]/g, '\\$&');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }

  window.VehicleReceiving = Object.freeze({
    build: BUILD,
    getPendingCount: function () { return pending.size; },
    retryNow: scheduleLoopNow
  });
})(window, document);


/* ============================================================
 * SOURCE 08: module-workflow-guard(4).js
 * ============================================================ */
/**
 * module-workflow-guard.js
 * PRODUCTION R13 — Local Operational Stage Guard
 *
 * Guard นี้ไม่เรียก API แยกและไม่สร้าง/ซ่อนการ์ด
 * ใช้สถานะจาก Unified Operational Board Snapshot เดียวกับ module.js
 */
(function (window, document) {
  'use strict';

  const BUILD =
    '2026.07.21-baseline2-final-hotfix3-destination-receiving-v1';

  document.addEventListener(
    'DOMContentLoaded',
    initialize
  );

  function initialize() {
    if (document.body) {
      document.body.dataset.workflowGuardBuild =
        BUILD;
    }

    document.addEventListener(
      'click',
      guardReceivingAction,
      true
    );
  }

  function guardReceivingAction(event) {
    const button =
      event.target.closest(
        '.receiving-complete-button'
      );

    if (!button) {
      return;
    }

    const stage =
      String(
        button.dataset.operationalStage ||
        ''
      ).toUpperCase();

    /*
     * Receiving handler ถูกลงทะเบียนก่อน Guard และจะเปลี่ยนปุ่มเป็น disabled
     * พร้อมตั้ง receivingCommandPending=TRUE หลังรับคลิกที่ถูกต้องแล้ว
     * Guard ต้องไม่ตีความสถานะหลังคลิกนั้นว่าเป็นขั้นตอนไม่พร้อม
     */
    const commandPending =
      button.dataset.receivingCommandPending ===
        'TRUE';

    if (commandPending) {
      return;
    }

    const allowed =
      stage === 'WAITING_RECEIVING' &&
      button.dataset.canComplete ===
        'TRUE' &&
      !button.disabled;

    if (allowed) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    const message =
      guardMessage(stage);

    if (window.Swal) {
      void Swal.fire({
        icon: stage === 'DATA_CONFLICT'
          ? 'error'
          : 'warning',
        title: stage === 'DATA_CONFLICT'
          ? 'ข้อมูลรายการขัดแย้ง'
          : 'ยังไม่ถึงขั้นตอนรับสินค้าเสร็จ',
        text: message,
        confirmButtonText: 'ตกลง'
      });
    }
  }

  function guardMessage(stage) {
    const messages = {
      WAITING_INBOUND_DOCUMENT:
        'ต้องให้ Inbound สแกนยื่นเอกสารก่อน',
      WAITING_DOCUMENT_RETURN:
        'รายการนี้รับสินค้าเสร็จแล้ว กำลังรอรับเอกสารคืน',
      WAITING_GATE_OUT:
        'รายการนี้รับเอกสารคืนแล้ว กำลังรอ Gate Out',
      DATA_CONFLICT:
        'ข้อมูล Receiving, Workflow หรือ Gate Out ไม่สอดคล้องกัน กรุณาให้ Admin ตรวจสอบ'
    };

    return messages[stage] ||
      'สถานะปัจจุบันยังไม่พร้อมบันทึกรับสินค้าเสร็จ';
  }
})(window, document);


/* ============================================================
 * SOURCE 09: module-workflow-bridge(4).js
 * ============================================================ */
/************************************************************
 * module-workflow-bridge.js
 * ROUND 05 — Hide receiving-completed cards + completed list
 *
 * โหลดหลัง api.js, receiving.js และ module.js
 ************************************************************/
(function (window, document) {
  'use strict';

  const API = window.VehicleAPI;
  const state = {
    moduleId: '',
    data: null,
    timer: null,
    refreshTimer: null,
    observer: null,
    loading: false
  };

  document.addEventListener('DOMContentLoaded', initialize);
  window.addEventListener('beforeunload', destroy);

  function initialize() {
    state.moduleId = getModuleId();

    if (!state.moduleId || !API || typeof API.getInboundWorkflowDashboard !== 'function') {
      return;
    }

    ensureToolbar();
    bindEvents();
    observeCards();
    refreshWorkflowState(true);

    state.refreshTimer = window.setInterval(function () {
      refreshWorkflowState(true);
    }, 30000);

    document.addEventListener('alertvendor:records-updated', function (event) {
      const records = event && event.detail && Array.isArray(event.detail.records)
        ? event.detail.records
        : null;
      if (records) {
        syncFromOperationalRecords(records, event.detail.generatedAt || '');
      }
      scheduleApply();
    });
  }

  function bindEvents() {
    document.addEventListener('click', function (event) {
      const button = event.target.closest('[data-workflow-list]');
      if (!button) return;

      openWorkflowList(button.dataset.workflowList || 'RECEIVING_COMPLETED');
    });
  }

  function ensureToolbar() {
    if (document.getElementById('moduleWorkflowStrip')) {
      return;
    }

    const container = document.querySelector('.module-container') || document.body;
    const strip = document.createElement('section');
    strip.id = 'moduleWorkflowStrip';
    strip.className = 'module-workflow-strip';
    strip.innerHTML = `
      <button type="button" class="module-workflow-button" data-workflow-list="WAITING_DOCUMENT_SUBMISSION">
        รอยื่นเอกสาร <strong id="workflowWaitingDocumentCount">0</strong>
      </button>
      <button type="button" class="module-workflow-button" data-workflow-list="DOCUMENT_SUBMITTED">
        รอรับสินค้า <strong id="workflowWaitingReceivingCount">0</strong>
      </button>
      <button type="button" class="module-workflow-button" data-workflow-list="RECEIVING_COMPLETED">
        เสร็จแล้ว <strong id="workflowReceivingCompletedCount">0</strong>
      </button>
      <button type="button" class="module-workflow-button" data-workflow-list="DOCUMENT_RETURNED">
        คืนเอกสาร <strong id="workflowDocumentReturnedCount">0</strong>
      </button>
    `;

    container.insertBefore(strip, container.firstChild);
  }

  async function refreshWorkflowState(silent) {
    if (state.loading) return;

    state.loading = true;

    try {
      const data = await API.getInboundWorkflowDashboard(state.moduleId, {limit: 80});
      state.data = normalizeDashboard(data);
      updateCounts();
      applyCardRules();
    } catch (error) {
      if (!silent) {
        console.warn('โหลด Workflow Dashboard ไม่สำเร็จ', error);
      }
    } finally {
      state.loading = false;
    }
  }

  function normalizeDashboard(data) {
    const source = data && data.data && typeof data.data === 'object'
      ? data.data
      : data || {};

    const items = Array.isArray(source.items) ? source.items : [];

    return {
      raw: source,
      items: items.map(function (item) {
        return {
          autoId: String(item.autoId || item.recordId || '').trim(),
          statusCode: String(item.statusCode || '').trim().toUpperCase(),
          statusName: String(item.statusName || '').trim(),
          receivingCompletedAt: String(item.receivingCompletedAt || '').trim(),
          documentReturnedAt: String(item.documentReturnedAt || '').trim(),
          updatedAt: String(item.updatedAt || '').trim(),
          updatedBy: String(item.updatedBy || '').trim(),
          appointmentNumber: String(item.appointmentNumber || item.appointment || '').trim(),
          companyName: String(item.companyName || item.company || '').trim(),
          gateInAt: String(item.gateInAt || item.timestampIn || '').trim()
        };
      }),
      summary: source.summary || {}
    };
  }

  function updateCounts() {
    const data = state.data || {items: []};

    setText('workflowWaitingDocumentCount', countStatus(data.items, 'WAITING_DOCUMENT_SUBMISSION'));
    setText('workflowWaitingReceivingCount', countStatus(data.items, 'DOCUMENT_SUBMITTED'));
    setText('workflowReceivingCompletedCount', countStatus(data.items, 'RECEIVING_COMPLETED'));
    setText('workflowDocumentReturnedCount', countStatus(data.items, 'DOCUMENT_RETURNED'));
  }

  function countStatus(items, status) {
    return items.filter(function (item) {
      return item.statusCode === status;
    }).length;
  }

  function applyCardRules() {
    const data = state.data;
    if (!data) return;

    const byAutoId = new Map();
    data.items.forEach(function (item) {
      if (item.autoId) byAutoId.set(item.autoId, item);
    });

    document.querySelectorAll('.vehicle-card[data-record-id]').forEach(function (card) {
      const recordId = String(card.dataset.recordId || '').trim();
      const item = findItemForCard(card, recordId, byAutoId);
      const status = item ? item.statusCode : '';

      const hide = status === 'WAITING_DOCUMENT_SUBMISSION' ||
        status === 'RECEIVING_COMPLETED' || status === 'DOCUMENT_RETURNED';
      card.classList.toggle('workflow-hidden-after-receiving', hide);

      const completeButton = card.querySelector('[data-receiving-complete-record]');
      if (completeButton) {
        const ready = status === 'DOCUMENT_SUBMITTED';
        completeButton.disabled = !ready;
        completeButton.classList.toggle('is-disabled-by-workflow', !ready);

        if (!ready) {
          completeButton.title = 'ต้องให้ Inbound ยื่นเอกสารก่อน';
          ensureWaitDocumentNote(card, status);
        } else {
          completeButton.title = '';
          removeWaitDocumentNote(card);
        }
      }
    });
  }

  function findItemForCard(card, recordId, byAutoId) {
    if (byAutoId.has(recordId)) {
      return byAutoId.get(recordId);
    }

    const text = String(card.textContent || '').toUpperCase();
    let matched = null;

    byAutoId.forEach(function (item, autoId) {
      if (!matched && autoId && text.indexOf(String(autoId).toUpperCase()) >= 0) {
        matched = item;
      }
    });

    return matched;
  }

  function ensureWaitDocumentNote(card, status) {
    if (status === 'RECEIVING_COMPLETED' || status === 'DOCUMENT_RETURNED') return;
    if (card.querySelector('.workflow-wait-document-note')) return;

    const note = document.createElement('div');
    note.className = 'workflow-wait-document-note';
    note.textContent = status
      ? 'ระบบเอกสารยังไม่ถึงขั้นรับสินค้าเสร็จ'
      : 'รอ Inbound ยื่นเอกสารก่อน';

    card.appendChild(note);
  }

  function removeWaitDocumentNote(card) {
    card.querySelectorAll('.workflow-wait-document-note').forEach(function (node) {
      node.remove();
    });
  }

  function openWorkflowList(status) {
    const data = state.data || {items: []};
    const cleanStatus = String(status || 'RECEIVING_COMPLETED').toUpperCase();
    const title = cleanStatus === 'WAITING_DOCUMENT_SUBMISSION'
      ? 'รายการรอยื่นเอกสาร'
      : cleanStatus === 'DOCUMENT_SUBMITTED'
        ? 'รายการรอรับสินค้าเสร็จ'
      : cleanStatus === 'DOCUMENT_RETURNED'
        ? 'รายการรับเอกสารคืนแล้ว'
        : 'รายการรับสินค้าเสร็จแล้ว';

    const items = data.items
      .filter(function (item) { return item.statusCode === cleanStatus; })
      .slice(0, 50);

    const html = `
      <article class="workflow-completed-panel">
        <header>
          <small>WORKFLOW LIST</small>
          <h2>${escapeHtml(title)} (${items.length})</h2>
        </header>
        <div class="workflow-completed-list">
          ${items.length ? items.map(function (item, index) {
            return workflowItemHtml(item, index, cleanStatus);
          }).join('') : '<div class="empty-state">ไม่มีรายการในสถานะนี้</div>'}
        </div>
      </article>
    `;

    window.Swal.fire({
      title: '',
      html: html,
      showCloseButton: true,
      confirmButtonText: 'ปิด',
      width: 'min(720px, calc(100vw - 16px))',
      customClass: {
        popup: 'workflow-completed-popup',
        htmlContainer: 'workflow-completed-html'
      }
    });
  }

  function workflowItemHtml(item, index, status) {
    if (status === 'WAITING_DOCUMENT_SUBMISSION') {
      return `
        <article class="workflow-completed-item">
          <div>
            <strong>${escapeHtml(String(index + 1) + '. ' + (item.appointmentNumber || '-'))}</strong>
            <span>${escapeHtml(item.companyName || '-')}</span>
          </div>
          <small>${escapeHtml(item.gateInAt || item.updatedAt || '-')}</small>
        </article>
      `;
    }

    return `
      <article class="workflow-completed-item">
        <div>
          <strong>${escapeHtml(item.autoId || '-')}</strong>
          <span>${escapeHtml(item.statusName || item.statusCode || '-')}</span>
        </div>
        <small>${escapeHtml(item.receivingCompletedAt || item.documentReturnedAt || item.updatedAt || '-')}</small>
      </article>
    `;
  }

  function syncFromOperationalRecords(records, generatedAt) {
    const items = records.map(function (record) {
      const stage = String(record && record.operationalStage || '').toUpperCase();
      const statusCode = stage === 'WAITING_INBOUND_DOCUMENT'
        ? 'WAITING_DOCUMENT_SUBMISSION'
        : stage === 'WAITING_RECEIVING'
          ? 'DOCUMENT_SUBMITTED'
          : stage === 'WAITING_DOCUMENT_RETURN'
            ? 'RECEIVING_COMPLETED'
            : stage === 'WAITING_GATE_OUT'
              ? 'DOCUMENT_RETURNED'
              : 'DATA_CONFLICT';
      const fields = Array.isArray(record && record.fields) ? record.fields : [];

      function fieldValue(labels) {
        const normalized = labels.map(function (value) {
          return String(value || '').trim().toLowerCase().replace(/[\s_\-:]+/g, '');
        });
        const field = fields.find(function (entry) {
          const label = String(entry && (entry.label || entry.displayName || entry.name) || '')
            .trim().toLowerCase().replace(/[\s_\-:]+/g, '');
          return normalized.indexOf(label) >= 0;
        });
        return String(field && field.value || '').trim();
      }

      return {
        autoId: String(record && (record.autoId || record.sourceAutoId) || '').trim(),
        statusCode: statusCode,
        statusName: String(record && record.operationalStageLabel || statusCode).trim(),
        receivingCompletedAt: String(record && record.receivingCompleteAt || '').trim(),
        documentReturnedAt: String(record && record.documentReturnedAt || '').trim(),
        updatedAt: String(record && record.updatedAt || generatedAt || '').trim(),
        updatedBy: String(record && record.updatedBy || '').trim(),
        appointmentNumber: String(record && record.appointmentNumber || fieldValue(['เลขนัดหมาย','หมายเลขนัดหมาย','appointment']) || record && record.primaryValue || '').trim(),
        companyName: String(record && record.companyName || fieldValue(['ชื่อบริษัท','บริษัท','company']) || '').trim(),
        gateInAt: String(record && record.timestampIn || '').trim()
      };
    });

    state.data = {
      raw: {generatedAt: generatedAt || ''},
      items: items,
      summary: {}
    };
    updateCounts();
    applyCardRules();
  }

  function observeCards() {
    const list = document.getElementById('vehicleList');
    if (!list || typeof MutationObserver !== 'function') return;

    state.observer = new MutationObserver(scheduleApply);
    state.observer.observe(list, {childList: true, subtree: true});
  }

  function scheduleApply() {
    if (state.timer) window.clearTimeout(state.timer);
    state.timer = window.setTimeout(applyCardRules, 120);
  }

  function getModuleId() {
    const params = new URLSearchParams(window.location.search);
    return String(params.get('id') || params.get('module') || '').trim();
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  }

  function escapeHtml(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function destroy() {
    if (state.timer) window.clearTimeout(state.timer);
    if (state.refreshTimer) window.clearInterval(state.refreshTimer);
    if (state.observer) state.observer.disconnect();
  }
})(window, document);


/* ============================================================
 * SOURCE 10: module-focus(6).js
 * ============================================================ */
/************************************************************
 * module-focus.js
 * ROUND 56 — Card-first Workspace + Shift Movement
 *
 * เป้าหมาย:
 * - เปิดหน้าแล้วเห็นการ์ดรถ/ตู้ทันที
 * - เก็บส่วนสรุปเดิมไว้เป็น Data Source
 * - เปิดภาพรวม/งานเร่งด่วน/Receiving/รอบ/สถิติ
 *   ผ่าน SweetAlert เมื่อผู้ใช้ต้องการ
 ************************************************************/

(function (window, document) {
  'use strict';

  const state = {
    observer:
      null,

    syncTimer:
      null,

    sortTimer:
      null,

    userChangedFilter:
      false,

    defaultViewApplied:
      false,

    destroyed:
      false
  };


  document.addEventListener(
    'DOMContentLoaded',
    initialize
  );

  window.addEventListener(
    'beforeunload',
    destroy
  );


  function initialize() {
    bindToolbar();
    bindVehicleTools();
    syncWorkspace();

    state.observer =
      new MutationObserver(
        scheduleSync
      );

    state.observer.observe(
      document.body,
      {
        subtree:
          true,
        childList:
          true,
        characterData:
          true,
        attributes:
          true,
        attributeFilter: [
          'class',
          'data-status',
          'data-receiving-stage',
          'aria-hidden',
          'aria-pressed'
        ]
      }
    );

    window.setTimeout(
      applyDefaultCardView,
      900
    );

    window.setTimeout(
      syncWorkspace,
      1300
    );

    document.addEventListener(
      'alertvendor:records-updated',
      () => {
        syncWorkspace();
        applyCardSort();
      }
    );
  }


  function destroy() {
    state.destroyed =
      true;

    if (state.observer) {
      state.observer.disconnect();
    }

    window.clearTimeout(
      state.syncTimer
    );

    window.clearTimeout(
      state.sortTimer
    );
  }


  function bindToolbar() {
    document
      .querySelectorAll(
        '[data-focus-status]'
      )
      .forEach(
        (button) => {
          button.addEventListener(
            'click',
            () => {
              state.userChangedFilter =
                true;

              applyStatusFilter(
                button.dataset
                  .focusStatus ||
                'ALL'
              );
            }
          );
        }
      );

    document
      .querySelectorAll(
        '[data-focus-receiving]'
      )
      .forEach(
        (button) => {
          button.addEventListener(
            'click',
            () => {
              state.userChangedFilter =
                true;

              applyReceivingFilter(
                button.dataset
                  .focusReceiving ||
                'ALL'
              );
            }
          );
        }
      );

    document
      .querySelectorAll(
        '[data-focus-insight]'
      )
      .forEach(
        (button) => {
          button.addEventListener(
            'click',
            () => {
              openInsight(
                button.dataset
                  .focusInsight
              );
            }
          );
        }
      );
  }


  function bindVehicleTools() {
    const statusFilter =
      document.getElementById(
        'statusFilter'
      );

    const sortSelect =
      document.getElementById(
        'focusSortSelect'
      );

    statusFilter
      ?.addEventListener(
        'change',
        () => {
          state.userChangedFilter =
            true;

          syncActiveFilters();
        }
      );

    sortSelect
      ?.addEventListener(
        'change',
        () => {
          state.userChangedFilter =
            true;
          applyCardSort();
        }
      );
  }


  function applyDefaultCardView() {
    if (
      state.destroyed ||
      state.userChangedFilter ||
      state.defaultViewApplied
    ) {
      return;
    }

    state.defaultViewApplied =
      true;

    setStatusSelect(
      'ALL'
    );

    clickReceivingFilter(
      'ALL'
    );

    applyCardSort();
    syncActiveFilters();
  }


  function applyStatusFilter(
    status
  ) {
    clickReceivingFilter(
      'ALL'
    );

    setStatusSelect(
      status
    );

    syncActiveFilters();
    applyCardSort();
  }


  function applyReceivingFilter(
    stage
  ) {
    setStatusSelect(
      'ALL'
    );

    clickReceivingFilter(
      stage
    );

    syncActiveFilters();
    applyCardSort();
  }


  function setStatusSelect(
    status
  ) {
    const select =
      document.getElementById(
        'statusFilter'
      );

    if (!select) {
      return;
    }

    select.value =
      String(
        status ||
        'ALL'
      ).toUpperCase();

    select.dispatchEvent(
      new Event(
        'change',
        {
          bubbles:
            true
        }
      )
    );
  }


  function clickReceivingFilter(
    stage
  ) {
    const button =
      document.querySelector(
        `#receivingFlowPanel [data-receiving-filter="${String(
          stage ||
          'ALL'
        ).toUpperCase()}"]`
      );

    button?.click();
  }


  function scheduleSync() {
    if (state.destroyed) {
      return;
    }

    window.clearTimeout(
      state.syncTimer
    );

    state.syncTimer =
      window.setTimeout(
        syncWorkspace,
        100
      );

    window.clearTimeout(
      state.sortTimer
    );

    state.sortTimer =
      window.setTimeout(
        applyCardSort,
        180
      );
  }


  function syncWorkspace() {
    syncCounts();
    syncActiveFilters();
    syncReceivingAvailability();
  }


  function syncCounts() {
    setText(
      'focusCountAll',
      readText(
        'controlTotal',
        'summaryTotal'
      )
    );

    setText(
      'focusCountNormal',
      readText(
        'controlNormal',
        'summaryNormal'
      )
    );

    setText(
      'focusCountWarning',
      readText(
        'controlWarning',
        'summaryWarning'
      )
    );

    setText(
      'focusCountOverdue',
      readText(
        'controlOverdue',
        'summaryOverdue'
      )
    );

    setText(
      'focusCountWaitingReceiving',
      readText(
        'receivingWaitingCount',
        'receivingFilterWaitingCount'
      )
    );

    setText(
      'focusCountWaitingGateOut',
      readText(
        'receivingWaitingGateOutCount',
        'receivingFilterGateOutCount'
      )
    );
  }


  function syncReceivingAvailability() {
    const panel =
      document.getElementById(
        'receivingFlowPanel'
      );

    const available =
      Boolean(
        panel &&
        !panel.classList.contains(
          'is-hidden'
        ) &&
        panel.getAttribute(
          'aria-hidden'
        ) !== 'true'
      );

    document
      .querySelectorAll(
        '.module-focus-receiving-filter'
      )
      .forEach(
        (button) => {
          button.hidden =
            !available;
        }
      );

    const insightButton =
      document.getElementById(
        'focusReceivingInsightButton'
      );

    if (insightButton) {
      insightButton.hidden =
        !available;
    }
  }


  function syncActiveFilters() {
    const status =
      String(
        document.getElementById(
          'statusFilter'
        )?.value ||
        'ALL'
      ).toUpperCase();

    const receiving =
      String(
        document.querySelector(
          '#receivingFlowPanel [data-receiving-filter][aria-pressed="true"]'
        )?.dataset
          .receivingFilter ||
        'ALL'
      ).toUpperCase();

    document
      .querySelectorAll(
        '[data-focus-status]'
      )
      .forEach(
        (button) => {
          const active =
            receiving === 'ALL' &&
            String(
              button.dataset
                .focusStatus ||
              ''
            ).toUpperCase() ===
              status;

          button.classList.toggle(
            'is-active',
            active
          );
        }
      );

    document
      .querySelectorAll(
        '[data-focus-receiving]'
      )
      .forEach(
        (button) => {
          const active =
            status === 'ALL' &&
            String(
              button.dataset
                .focusReceiving ||
              ''
            ).toUpperCase() ===
              receiving;

          button.classList.toggle(
            'is-active',
            active
          );
        }
      );
  }


  function applyCardSort() {
    const list =
      document.getElementById(
        'vehicleList'
      );

    if (!list) {
      return;
    }

    const mode =
      document.getElementById(
        'focusSortSelect'
      )?.value ||
      'LONGEST';

    const cards =
      Array.from(
        list.querySelectorAll(
          '.vehicle-card'
        )
      );

    if (
      cards.length < 2
    ) {
      return;
    }

    cards.sort(
      (a, b) =>
        compareCards(
          a,
          b,
          mode
        )
    );

    const fragment =
      document.createDocumentFragment();

    cards.forEach(
      (card) => {
        fragment.appendChild(
          card
        );
      }
    );

    list.appendChild(
      fragment
    );
  }


  function compareCards(
    a,
    b,
    mode
  ) {
    if (mode === 'NEWEST') {
      return (
        readGateInEpoch(b) -
        readGateInEpoch(a)
      );
    }

    if (mode === 'APPOINTMENT') {
      return getField(
        a,
        [
          'นัดหมาย',
          'appointment'
        ]
      ).localeCompare(
        getField(
          b,
          [
            'นัดหมาย',
            'appointment'
          ]
        ),
        'th',
        {
          numeric:
            true
        }
      );
    }

    if (mode === 'COMPANY') {
      return getCompany(a)
        .localeCompare(
          getCompany(b),
          'th'
        );
    }

    return (
      readDurationSeconds(b) -
      readDurationSeconds(a)
    );
  }


  function readDurationSeconds(
    card
  ) {
    const value =
      card.querySelector(
        '.vehicle-card__timer'
      )?.textContent ||
      '0';

    const numbers =
      String(value)
        .match(/\d+/g)
        ?.map(Number) ||
      [];

    if (numbers.length >= 3) {
      return (
        numbers[
          numbers.length - 3
        ] *
          3600 +
        numbers[
          numbers.length - 2
        ] *
          60 +
        numbers[
          numbers.length - 1
        ]
      );
    }

    return 0;
  }


  function readGateInEpoch(
    card
  ) {
    const value =
      getField(
        card,
        [
          'gate in',
          'เวลาเข้าพื้นที่',
          'เข้าพื้นที่'
        ]
      );

    const match =
      value.match(
        /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/
      );

    if (!match) {
      return 0;
    }

    return new Date(
      Number(match[3]),
      Number(match[2]) - 1,
      Number(match[1]),
      Number(match[4]),
      Number(match[5]),
      Number(match[6])
    ).getTime();
  }


  function openInsight(
    type
  ) {
    if (
      !window.Swal ||
      typeof window.Swal.fire !==
        'function'
    ) {
      return;
    }

    const normalized =
      String(
        type ||
        ''
      ).toUpperCase();

    if (normalized === 'URGENT') {
      openUrgentInsight();
      return;
    }

    if (normalized === 'RECEIVING') {
      openReceivingInsight();
      return;
    }

    if (normalized === 'ROUND') {
      openRoundInsight();
      return;
    }

    if (normalized === 'STATS') {
      openStatsInsight();
      return;
    }

    openOverviewInsight();
  }


  function openOverviewInsight() {
    const items = [
      {
        label:
          'ทั้งหมด',
        value:
          readText(
            'controlTotal',
            'summaryTotal'
          ),
        status:
          'ALL'
      },
      {
        label:
          'ปกติ',
        value:
          readText(
            'controlNormal',
            'summaryNormal'
          ),
        status:
          'NORMAL'
      },
      {
        label:
          'ใกล้เกินเวลา',
        value:
          readText(
            'controlWarning',
            'summaryWarning'
          ),
        status:
          'WARNING'
      },
      {
        label:
          'เกินเวลา',
        value:
          readText(
            'controlOverdue',
            'summaryOverdue'
          ),
        status:
          'OVERDUE'
      },
      {
        label:
          'ข้อมูลไม่สมบูรณ์',
        value:
          readText(
            'controlIncomplete',
            'summaryIncomplete'
          ),
        status:
          'INCOMPLETE'
      },
      {
        label:
          document.getElementById(
            'controlNearAutoCloseLabel'
          )?.textContent ||
          'ใกล้เคลียร์อัตโนมัติ',
        value:
          readText(
            'controlNearAutoClose'
          ),
        status:
          ''
      }
    ];

    showFocusModal({
      title:
        'ภาพรวมสถานะรถในพื้นที่',

      subtitle:
        document.getElementById(
          'situationLabel'
        )?.textContent ||
        'สถานการณ์ปัจจุบัน',

      html: `
        <div class="focus-modal-metrics">
          ${items
            .map(
              (item) => `
                <button
                  type="button"
                  data-focus-modal-status="${escapeHtml(
                    item.status
                  )}"
                  ${item.status
                    ? ''
                    : 'disabled'}
                >
                  <span>
                    ${escapeHtml(
                      item.label
                    )}
                  </span>

                  <strong>
                    ${escapeHtml(
                      item.value
                    )}
                  </strong>
                </button>
              `
            )
            .join('')}
        </div>

        <div class="focus-modal-note">
          <strong>
            เกณฑ์เวลา
          </strong>

          <span>
            ปกติ
            ${escapeHtml(
              readText(
                'thresholdNormalText'
              )
            )}
            · เฝ้าระวัง
            ${escapeHtml(
              readText(
                'thresholdWarningText'
              )
            )}
            · เกินเวลา
            ${escapeHtml(
              readText(
                'thresholdOverdueText'
              )
            )}
          </span>
        </div>
      `,

      didOpen:
        (popup) => {
          popup
            .querySelectorAll(
              '[data-focus-modal-status]'
            )
            .forEach(
              (button) => {
                if (
                  button.disabled
                ) {
                  return;
                }

                button.addEventListener(
                  'click',
                  () => {
                    window.Swal.close();

                    applyStatusFilter(
                      button.dataset
                        .focusModalStatus
                    );
                  }
                );
              }
            );
        }
    });
  }


  function openUrgentInsight() {
    const records =
      getCardRecords()
        .filter(
          (record) =>
            record.status ===
              'OVERDUE' ||
            record.status ===
              'WARNING'
        )
        .sort(
          (a, b) =>
            b.durationSeconds -
            a.durationSeconds
        );

    showFocusModal({
      title:
        'งานเร่งด่วน',

      subtitle:
        `${records.length} รายการที่ควรติดตามก่อน`,

      html:
        records.length > 0
          ? `
              <div class="focus-modal-list">
                ${records
                  .slice(
                    0,
                    20
                  )
                  .map(
                    (record, index) =>
                      buildRecordRow(
                        record,
                        index + 1
                      )
                  )
                  .join('')}
              </div>
            `
          : emptyInsight(
              'ไม่มีรายการเร่งด่วนในขณะนี้'
            ),

      didOpen:
        bindModalRecordRows
    });
  }


  function openReceivingInsight() {
    const records =
      getCardRecords()
        .filter(
          (record) =>
            record.receivingStage ===
              'WAITING_RECEIVING' ||
            record.receivingStage ===
              'WAITING_GATE_OUT'
        )
        .sort(
          (a, b) =>
            b.durationSeconds -
            a.durationSeconds
        );

    showFocusModal({
      title:
        'Receiving Flow',

      subtitle:
        'ติดตามขั้นตอนรับสินค้าและ Gate Out',

      html: `
        <div class="focus-modal-metrics focus-modal-metrics--receiving">
          ${metricHtml(
            'รอรับสินค้าเสร็จ',
            readText(
              'receivingWaitingCount'
            )
          )}

          ${metricHtml(
            'รับเสร็จรอ Gate Out',
            readText(
              'receivingWaitingGateOutCount'
            )
          )}

          ${metricHtml(
            'รับสินค้าเสร็จวันนี้',
            readText(
              'receivingCompletedTodayCount'
            )
          )}

          ${metricHtml(
            'ข้อมูลไม่ครบ',
            readText(
              'receivingMissingCount'
            )
          )}

          ${metricHtml(
            'เฉลี่ย เข้า → รับเสร็จ',
            readText(
              'receivingAverageStageOne'
            )
          )}

          ${metricHtml(
            'เฉลี่ย รับเสร็จ → Gate Out',
            readText(
              'receivingAverageStageTwo'
            )
          )}
        </div>

        ${
          records.length > 0
            ? `
                <div class="focus-modal-section-title">
                  รายการที่กำลังดำเนินการ
                </div>

                <div class="focus-modal-list">
                  ${records
                    .slice(
                      0,
                      16
                    )
                    .map(
                      (record, index) =>
                        buildRecordRow(
                          record,
                          index + 1,
                          record.stage
                        )
                    )
                    .join('')}
                </div>
              `
            : emptyInsight(
                'ไม่มีรายการใน Receiving Flow'
              )
        }
      `,

      didOpen:
        bindModalRecordRows
    });
  }


  function openRoundInsight() {
    if (
      window.ModuleShiftUI &&
      typeof window.ModuleShiftUI.open ===
        'function'
    ) {
      window.ModuleShiftUI.open();
      return;
    }

    const chart =
      document.getElementById(
        'movementMiniChart'
      );

    showFocusModal({
      title:
        'รอบ 4 ชั่วโมงล่าสุด',

      subtitle:
        document.getElementById(
          'movementScopeTime'
        )?.textContent ||
        'ข้อมูลการเคลื่อนไหวล่าสุด',

      width:
        'min(860px, calc(100vw - 14px))',

      html: `
        <div class="focus-modal-metrics focus-modal-metrics--round">
          ${metricHtml(
            'Gate In',
            readText(
              'movementIn'
            )
          )}

          ${metricHtml(
            'Gate Out จริง',
            readText(
              'movementOutReal'
            )
          )}

          ${metricHtml(
            'สุทธิจริง',
            readText(
              'movementNetActual'
            )
          )}

          ${metricHtml(
            'ระบบเคลียร์',
            readText(
              'movementOutAuto'
            )
          )}
        </div>

        <div class="focus-modal-analysis">
          <strong>
            ${escapeHtml(
              readText(
                'movementAnalysisTitle'
              )
            )}
          </strong>

          <span>
            ${escapeHtml(
              readText(
                'movementAnalysisMessage'
              )
            )}
          </span>
        </div>

        <div class="focus-modal-chart">
          ${
            chart &&
            chart.innerHTML.trim()
              ? chart.innerHTML
              : `
                  <div class="focus-modal-empty">
                    ยังไม่มีข้อมูลกราฟ
                  </div>
                `
          }
        </div>
      `
    });
  }


  function openStatsInsight() {
    const stats = [
      [
        'Gate In',
        readText(
          'movementIn'
        )
      ],
      [
        'Gate Out จริง',
        readText(
          'movementOutReal'
        )
      ],
      [
        'สุทธิจริง',
        readText(
          'movementNetActual'
        )
      ],
      [
        'ระบบเคลียร์ข้อมูล',
        readText(
          'movementOutAuto'
        )
      ],
      [
        'เฉลี่ย เข้า → รับเสร็จ',
        readText(
          'receivingAverageStageOne'
        )
      ],
      [
        'เฉลี่ย รับเสร็จ → Gate Out',
        readText(
          'receivingAverageStageTwo'
        )
      ],
      [
        'รับสินค้าเสร็จวันนี้',
        readText(
          'receivingCompletedTodayCount'
        )
      ],
      [
        'ออกโดยไม่บันทึกรับเสร็จ',
        readText(
          'receivingMissingCount'
        )
      ]
    ];

    showFocusModal({
      title:
        'สถิติการปฏิบัติงาน',

      subtitle:
        'ข้อมูลวิเคราะห์ที่เปิดดูเมื่อต้องการ',

      html: `
        <div class="focus-modal-table">
          ${stats
            .map(
              ([label, value]) => `
                <div>
                  <span>
                    ${escapeHtml(
                      label
                    )}
                  </span>

                  <strong>
                    ${escapeHtml(
                      value
                    )}
                  </strong>
                </div>
              `
            )
            .join('')}
        </div>
      `
    });
  }


  function showFocusModal(
    options
  ) {
    const source =
      options ||
      {};

    window.Swal.fire({
      icon:
        undefined,
      iconHtml:
        '',
      title:
        '',
      text:
        '',

      html: `
        <article class="focus-modal">
          <header class="focus-modal__header">
            <div>
              <small>
                MODULE INFORMATION
              </small>

              <h2>
                ${escapeHtml(
                  source.title ||
                  'ข้อมูลเพิ่มเติม'
                )}
              </h2>

              <p>
                ${escapeHtml(
                  source.subtitle ||
                  ''
                )}
              </p>
            </div>
          </header>

          <div class="focus-modal__body">
            ${source.html || ''}
          </div>
        </article>
      `,

      width:
        source.width ||
        'min(720px, calc(100vw - 14px))',

      padding:
        '0',

      showCloseButton:
        true,

      confirmButtonText:
        'ปิด',

      allowOutsideClick:
        true,

      heightAuto:
        false,

      scrollbarPadding:
        false,

      customClass: {
        popup:
          'focus-modal-popup',
        title:
          'focus-modal-hidden',
        icon:
          'focus-modal-hidden',
        htmlContainer:
          'focus-modal-html',
        actions:
          'focus-modal-actions',
        confirmButton:
          'focus-modal-confirm',
        closeButton:
          'focus-modal-close'
      },

      didOpen:
        (popup) => {
          popup
            .querySelector(
              '.swal2-title'
            )
            ?.setAttribute(
              'hidden',
              ''
            );

          popup
            .querySelector(
              '.swal2-icon'
            )
            ?.setAttribute(
              'hidden',
              ''
            );

          if (
            typeof source.didOpen ===
              'function'
          ) {
            source.didOpen(
              popup
            );
          }
        }
    });
  }


  function bindModalRecordRows(
    popup
  ) {
    popup
      .querySelectorAll(
        '[data-focus-record-id]'
      )
      .forEach(
        (button) => {
          button.addEventListener(
            'click',
            () => {
              const recordId =
                button.dataset
                  .focusRecordId;

              window.Swal.close();

              window.setTimeout(
                () => {
                  focusRecord(
                    recordId
                  );
                },
                100
              );
            }
          );
        }
      );
  }


  function focusRecord(
    recordId
  ) {
    const card =
      Array.from(
        document.querySelectorAll(
          '.vehicle-card[data-record-id]'
        )
      ).find(
        (element) =>
          String(
            element.dataset
              .recordId ||
            ''
          ) ===
          String(
            recordId ||
            ''
          )
      );

    if (!card) {
      return;
    }

    card.scrollIntoView({
      behavior:
        'smooth',
      block:
        'center'
    });

    card.classList.add(
      'is-focus-highlight'
    );

    window.setTimeout(
      () => {
        card.classList.remove(
          'is-focus-highlight'
        );
      },
      2200
    );
  }


  function getCardRecords() {
    const bridgeRecords =
      getBridgeCardRecords();

    if (
      bridgeRecords.length > 0
    ) {
      return bridgeRecords;
    }

    return getDomCardRecords();
  }


  function getBridgeCardRecords() {
    const bridge =
      window
        .AlertVendorRecordBridge;

    if (
      !bridge ||
      typeof bridge.getRecords !==
        'function'
    ) {
      return [];
    }

    const records =
      bridge.getRecords();

    if (
      !Array.isArray(
        records
      ) ||
      records.length === 0
    ) {
      return [];
    }

    const nowMs =
      typeof bridge.getNowMs ===
        'function'
        ? bridge.getNowMs()
        : Date.now();

    const warningSeconds =
      getThresholdSeconds(
        'thresholdWarningText',
        45 * 60
      );

    const overdueSeconds =
      getThresholdSeconds(
        'thresholdOverdueText',
        60 * 60
      );

    const visibleCards =
      new Map(
        Array.from(
          document.querySelectorAll(
            '.vehicle-card[data-record-id]'
          )
        ).map(
          (card) => [
            String(
              card.dataset
                .recordId ||
              ''
            ),
            card
          ]
        )
      );

    return records
      .filter(
        (record) =>
          record &&
          record.isCurrentlyInArea !==
            false
      )
      .map(
        (record) => {
          const timestampMs =
            getBridgeTimestampMs(
              record
            );

          const durationSeconds =
            Number.isFinite(
              timestampMs
            )
              ? Math.max(
                  0,
                  Math.floor(
                    (
                      nowMs -
                      timestampMs
                    ) /
                    1000
                  )
                )
              : 0;

          const status =
            durationSeconds >=
              overdueSeconds
              ? 'OVERDUE'
              : durationSeconds >=
                  warningSeconds
                ? 'WARNING'
                : Number.isFinite(
                    timestampMs
                  )
                  ? 'NORMAL'
                  : 'INCOMPLETE';

          const fields =
            Array.isArray(
              record.fields
            )
              ? record.fields
              : [];

          const recordId =
            String(
              record.recordId ||
              record.id ||
              ''
            );

          const card =
            visibleCards.get(
              recordId
            );

          const stage =
            card
              ?.querySelector(
                '.receiving-card-stage__head strong'
              )
              ?.textContent
              ?.trim() ||
            card
              ?.querySelector(
                '.receiving-stage-badge'
              )
              ?.textContent
              ?.trim() ||
            String(
              record.receivingStage ||
              record.stage ||
              ''
            );

          return {
            recordId,

            status,

            receivingStage:
              String(
                card?.dataset
                  .receivingStage ||
                record.receivingStage ||
                ''
              ).toUpperCase(),

            stage,

            company:
              String(
                record.primaryValue ||
                getRawField(
                  fields,
                  [
                    'บริษัท',
                    'vendor',
                    'company'
                  ]
                ) ||
                '-'
              ),

            appointment:
              getRawField(
                fields,
                [
                  'เลขนัดหมาย',
                  'หมายเลขนัดหมาย',
                  'นัดหมาย',
                  'appointment',
                  'booking'
                ]
              ) ||
              inferRawAppointment(
                fields
              ) ||
              '-',

            registration:
              getRawField(
                fields,
                [
                  'ทะเบียน',
                  'หมายเลขตู้',
                  'เลขตู้',
                  'registration',
                  'container'
                ]
              ) ||
              '-',

            driver:
              getRawField(
                fields,
                [
                  'ชื่อผู้ขับ',
                  'ชื่อคนขับ',
                  'ผู้ขับ',
                  'driver',
                  'ชื่อ'
                ]
              ) ||
              '-',

            duration:
              formatFocusDuration(
                durationSeconds
              ),

            durationSeconds
          };
        }
      );
  }


  function getDomCardRecords() {
    return Array.from(
      document.querySelectorAll(
        '.vehicle-card[data-record-id]'
      )
    ).map(
      (card) => {
        const stage =
          card.querySelector(
            '.receiving-card-stage__head strong'
          )?.textContent?.trim() ||
          '';

        return {
          recordId:
            card.dataset
              .recordId ||
            '',

          status:
            String(
              card.dataset.status ||
              'INCOMPLETE'
            ).toUpperCase(),

          receivingStage:
            String(
              card.dataset
                .receivingStage ||
              ''
            ).toUpperCase(),

          stage,

          company:
            getCompany(card),

          appointment:
            getField(
              card,
              [
                'นัดหมาย',
                'appointment'
              ]
            ) ||
            '-',

          registration:
            getField(
              card,
              [
                'ทะเบียน',
                'หมายเลขตู้',
                'container'
              ]
            ) ||
            '-',

          driver:
            getField(
              card,
              [
                'ชื่อ',
                'ผู้ขับ',
                'คนขับ',
                'driver'
              ]
            ) ||
            '-',

          duration:
            card.querySelector(
              '.vehicle-card__timer'
            )?.textContent?.trim() ||
            '-',

          durationSeconds:
            readDurationSeconds(
              card
            )
        };
      }
    );
  }


  function getBridgeTimestampMs(
    record
  ) {
    const epoch =
      Number(
        record &&
        record.timestampInEpochMs
      );

    if (
      Number.isFinite(
        epoch
      ) &&
      epoch > 0
    ) {
      return epoch;
    }

    const value =
      String(
        record &&
        (
          record.timestampIn ||
          record.gateIn
        ) ||
        ''
      ).trim();

    const match =
      value.match(
        /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/
      );

    if (match) {
      return new Date(
        Number(match[3]),
        Number(match[2]) - 1,
        Number(match[1]),
        Number(match[4]),
        Number(match[5]),
        Number(match[6])
      ).getTime();
    }

    const parsed =
      Date.parse(
        value
      );

    return Number.isFinite(
      parsed
    )
      ? parsed
      : NaN;
  }


  function getThresholdSeconds(
    elementId,
    fallback
  ) {
    const value =
      document.getElementById(
        elementId
      )?.textContent ||
      '';

    const numberMatch =
      String(value)
        .replace(/,/g, '')
        .match(
          /(\d+(?:\.\d+)?)/
        );

    const number =
      numberMatch
        ? Number(
            numberMatch[1]
          )
        : NaN;

    if (
      !Number.isFinite(
        number
      )
    ) {
      return fallback;
    }

    if (
      /ชั่วโมง|hour/i.test(
        value
      )
    ) {
      return Math.round(
        number *
        3600
      );
    }

    return Math.round(
      number *
      60
    );
  }


  function getRawField(
    fields,
    keywords
  ) {
    const targets =
      keywords.map(
        normalize
      );

    for (
      const field
      of (
        Array.isArray(
          fields
        )
          ? fields
          : []
      )
    ) {
      const label =
        normalize(
          field &&
          (
            field.label ||
            field.name ||
            field.id
          )
        );

      if (
        targets.some(
          (target) =>
            label.includes(
              target
            )
        )
      ) {
        const value =
          String(
            field &&
            (
              field.value ??
              field.displayValue ??
              ''
            )
          ).trim();

        if (value) {
          return value;
        }
      }
    }

    return '';
  }


  function inferRawAppointment(
    fields
  ) {
    for (
      const field
      of (
        Array.isArray(
          fields
        )
          ? fields
          : []
      )
    ) {
      const value =
        String(
          field &&
          (
            field.value ??
            field.displayValue ??
            ''
          )
        ).trim();

      if (
        /^\d{6,10}$/.test(
          value
        )
      ) {
        return value;
      }
    }

    return '';
  }


  function formatFocusDuration(
    totalSeconds
  ) {
    const value =
      Math.max(
        0,
        Number(
          totalSeconds
        ) ||
        0
      );

    const hours =
      Math.floor(
        value /
        3600
      );

    const minutes =
      Math.floor(
        (
          value %
          3600
        ) /
        60
      );

    const seconds =
      Math.floor(
        value %
        60
      );

    return [
      hours,
      minutes,
      seconds
    ]
      .map(
        (part) =>
          String(part)
            .padStart(
              2,
              '0'
            )
      )
      .join(':');
  }

  function buildRecordRow(
    record,
    index,
    note
  ) {
    return `
      <button
        type="button"
        class="focus-modal-record"
        data-focus-record-id="${escapeHtml(
          record.recordId
        )}"
      >
        <span class="focus-modal-record__rank">
          ${index}
        </span>

        <span class="focus-modal-record__identity">
          <strong>
            ${escapeHtml(
              record.appointment
            )}
          </strong>

          <small>
            ${escapeHtml(
              record.company
            )}
            ·
            ${escapeHtml(
              record.registration
            )}
          </small>
        </span>

        <span class="focus-modal-record__time">
          <strong>
            ${escapeHtml(
              record.duration
            )}
          </strong>

          <small>
            ${escapeHtml(
              note ||
              statusLabel(
                record.status
              )
            )}
          </small>
        </span>
      </button>
    `;
  }


  function metricHtml(
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
            value
          )}
        </strong>
      </div>
    `;
  }


  function emptyInsight(
    message
  ) {
    return `
      <div class="focus-modal-empty">
        ${escapeHtml(
          message
        )}
      </div>
    `;
  }


  function statusLabel(
    status
  ) {
    const map = {
      NORMAL:
        'ปกติ',
      WARNING:
        'ใกล้เกินเวลา',
      OVERDUE:
        'เกินเวลา',
      INCOMPLETE:
        'ข้อมูลไม่สมบูรณ์'
    };

    return (
      map[status] ||
      status ||
      '-'
    );
  }


  function getCompany(
    card
  ) {
    return (
      card.querySelector(
        '.vehicle-card__title'
      )?.textContent?.trim() ||
      card.querySelector(
        '.vehicle-card__header strong'
      )?.textContent?.trim() ||
      '-'
    );
  }


  function getField(
    card,
    keywords
  ) {
    const normalizedKeywords =
      keywords.map(
        normalize
      );

    const fields =
      Array.from(
        card.querySelectorAll(
          '.vehicle-field'
        )
      );

    for (
      const field
      of fields
    ) {
      const label =
        normalize(
          field.querySelector(
            'span'
          )?.textContent ||
          ''
        );

      if (
        normalizedKeywords.some(
          (keyword) =>
            label.includes(
              keyword
            )
        )
      ) {
        return (
          field.querySelector(
            'strong, a'
          )?.textContent?.trim() ||
          ''
        );
      }
    }

    return '';
  }


  function normalize(
    value
  ) {
    return String(
      value ||
      ''
    )
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');
  }


  function readText(
    ...ids
  ) {
    for (
      const id
      of ids
    ) {
      const value =
        document.getElementById(
          id
        )?.textContent?.trim();

      if (value) {
        return value;
      }
    }

    return '0';
  }


  function setText(
    id,
    value
  ) {
    const element =
      document.getElementById(
        id
      );

    if (element) {
      element.textContent =
        value ||
        '0';
    }
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
 * SOURCE 11: module-workspace-compact(1).js
 * ============================================================ */
/**
 * module-workspace-compact.js
 * ROUND 3 — Responsive Workspace Runtime
 * Build: 2026.07.17-round3-responsive-r2-mobile-two-cards
 */
(function (window, document) {
  'use strict';

  const BUILD = '2026.07.17-round3-responsive-r2-mobile-two-cards';
  const state = {
    resizeRaf: 0,
    observer: null,
    mutationObserver: null,
    liveRegion: null,
    destroyed: false
  };

  document.addEventListener('DOMContentLoaded', initialize, { once: true });
  window.addEventListener('pagehide', destroy, { once: true });

  function initialize() {
    if (!document.body || !document.body.classList.contains('module-page')) {
      return;
    }

    document.body.dataset.moduleWorkspaceBuild = BUILD;
    document.documentElement.style.overflowX = 'clip';

    ensureLiveRegion();
    measureLayout();
    observeLayout();
    observeVehicleCards();
    bindEvents();
    updateFullscreenState();
  }

  function bindEvents() {
    window.addEventListener('resize', scheduleMeasure, { passive: true });
    window.addEventListener('orientationchange', scheduleMeasure, { passive: true });
    document.addEventListener('fullscreenchange', updateFullscreenState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenState);
    document.addEventListener('alertvendor:records-updated', () => {
      window.requestAnimationFrame(() => {
        decorateVehicleCards();
        measureLayout();
      });
    });
    document.addEventListener('smartalert:receiving-card-state', handleReceivingCardState);
  }

  function scheduleMeasure() {
    if (state.resizeRaf) {
      window.cancelAnimationFrame(state.resizeRaf);
    }

    state.resizeRaf = window.requestAnimationFrame(() => {
      state.resizeRaf = 0;
      measureLayout();
    });
  }

  function measureLayout() {
    if (state.destroyed || !document.body) return;

    const header = document.querySelector('.module-header');
    const footer = document.querySelector('body.module-page > footer.app-footer.module-footer');
    const container = document.querySelector('.module-container');
    const width = Math.max(0, document.documentElement.clientWidth || window.innerWidth || 0);

    document.documentElement.style.setProperty(
      '--module-header-measured',
      Math.ceil(header ? header.getBoundingClientRect().height : 58) + 'px'
    );
    document.documentElement.style.setProperty(
      '--module-footer-measured',
      Math.ceil(footer ? footer.getBoundingClientRect().height : 38) + 'px'
    );

    document.body.dataset.moduleViewport = viewportName(width);

    if (container) {
      const containerWidth = Math.round(container.getBoundingClientRect().width);
      container.dataset.workspaceDensity = densityName(containerWidth);
    }

    detectPageOverflow();
  }

  function viewportName(width) {
    if (width < 390) return 'PHONE_SMALL';
    if (width < 600) return 'PHONE';
    if (width < 900) return 'TABLET';
    if (width < 1280) return 'NOTEBOOK';
    if (width < 1700) return 'DESKTOP';
    return 'WIDE';
  }

  function densityName(width) {
    if (width < 480) return 'COMPACT';
    if (width < 900) return 'MEDIUM';
    return 'COMFORTABLE';
  }

  function observeLayout() {
    if (typeof ResizeObserver !== 'function') return;

    state.observer = new ResizeObserver(scheduleMeasure);
    [
      document.querySelector('.module-header'),
      document.querySelector('.module-container'),
      document.querySelector('body.module-page > footer.app-footer.module-footer')
    ].filter(Boolean).forEach((node) => state.observer.observe(node));
  }

  function observeVehicleCards() {
    const list = document.getElementById('vehicleList');
    if (!list || typeof MutationObserver !== 'function') {
      decorateVehicleCards();
      return;
    }

    state.mutationObserver = new MutationObserver((mutations) => {
      let changed = false;
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length) {
          changed = true;
        }
      });

      if (changed) {
        window.requestAnimationFrame(() => {
          decorateVehicleCards();
          detectPageOverflow();
        });
      }
    });

    state.mutationObserver.observe(list, {
      childList: true,
      subtree: true
    });

    decorateVehicleCards();
  }

  function decorateVehicleCards() {
    document.querySelectorAll('.vehicle-card').forEach((card) => {
      if (card.dataset.round3Responsive === 'TRUE') return;

      card.dataset.round3Responsive = 'TRUE';
      card.querySelectorAll('.vehicle-field strong, .vehicle-field a').forEach((node) => {
        const value = String(node.textContent || '').trim();
        if (value) node.title = value;
      });
    });
  }

  function handleReceivingCardState(event) {
    const detail = event && event.detail && typeof event.detail === 'object'
      ? event.detail
      : {};
    const recordId = String(detail.recordId || '');
    const active = detail.active === true;
    const card = findCard(recordId);

    if (card) {
      card.classList.toggle('is-receiving-busy', active);
      if (active) {
        card.setAttribute('aria-busy', 'true');
      } else if (!card.querySelector('.receiving-card-progress, .receiving-live-status')) {
        card.removeAttribute('aria-busy');
      }
    }

    if (active && detail.message) {
      announce(String(detail.message));
    }
  }

  function findCard(recordId) {
    if (!recordId) return null;
    const escaped = window.CSS && typeof window.CSS.escape === 'function'
      ? window.CSS.escape(recordId)
      : recordId.replace(/["\\]/g, '\\$&');
    return document.querySelector('.vehicle-card[data-record-id="' + escaped + '"]');
  }

  function ensureLiveRegion() {
    let region = document.getElementById('moduleWorkspaceLiveRegion');
    if (!region) {
      region = document.createElement('div');
      region.id = 'moduleWorkspaceLiveRegion';
      region.className = 'sr-only';
      region.setAttribute('role', 'status');
      region.setAttribute('aria-live', 'polite');
      region.setAttribute('aria-atomic', 'true');
      document.body.appendChild(region);
    }
    state.liveRegion = region;
  }

  function announce(message) {
    if (!state.liveRegion) return;
    state.liveRegion.textContent = '';
    window.setTimeout(() => {
      if (state.liveRegion) state.liveRegion.textContent = message;
    }, 30);
  }

  function updateFullscreenState() {
    const active = Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement
    );
    document.body && document.body.classList.toggle('is-native-fullscreen', active);
    scheduleMeasure();
  }

  function detectPageOverflow() {
    if (!document.body) return;

    const rootWidth = document.documentElement.clientWidth;
    const overflow = document.documentElement.scrollWidth > rootWidth + 2;
    document.body.dataset.horizontalOverflow = overflow ? 'TRUE' : 'FALSE';

    if (overflow) {
      console.warn('ROUND 3: พบองค์ประกอบกว้างเกินหน้าจอ', {
        viewportWidth: rootWidth,
        scrollWidth: document.documentElement.scrollWidth
      });
    }
  }

  function destroy() {
    state.destroyed = true;
    if (state.resizeRaf) window.cancelAnimationFrame(state.resizeRaf);
    if (state.observer) state.observer.disconnect();
    if (state.mutationObserver) state.mutationObserver.disconnect();
  }
})(window, document);

/**
 * ROUND 3 REVISION 4 — Professional Mobile Menu + Workspace Presentation
 * Build: 2026.07.17-round3-r4-professional-module-ui
 */
(function (window, document) {
  'use strict';

  const BUILD = '2026.07.17-round3-r4-professional-module-ui';
  const STORAGE_KEY = 'alertvendor:module:operational-board-collapsed';
  const state = {
    drawerOpen: false,
    historyEntryActive: false,
    scrollY: 0,
    previousFocus: null,
    observer: null,
    userObserver: null,
    titleObserver: null
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }

  function initialize() {
    if (!document.body || !document.body.classList.contains('module-page')) return;

    document.body.dataset.moduleProfessionalUiBuild = BUILD;
    bindDrawer();
    bindDrawerActions();
    bindSnapshotMirror();
    bindIdentityMirror();
    bindFullscreenState();
    bindOperationalBoardCollapse();
    syncSnapshotMirror();
    syncIdentityMirror();
    syncFullscreenLabel();
  }

  function element(id) {
    return document.getElementById(id);
  }

  function bindDrawer() {
    const openButton = element('mobileModuleMenuButton');
    const closeButton = element('mobileModuleDrawerClose');
    const overlay = element('mobileModuleDrawerOverlay');
    const drawer = element('mobileModuleDrawer');

    if (!openButton || !closeButton || !overlay || !drawer) return;

    openButton.addEventListener('click', () => openDrawer({ pushHistory: true }));
    closeButton.addEventListener('click', requestCloseDrawer);
    overlay.addEventListener('click', requestCloseDrawer);

    drawer.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        requestCloseDrawer();
        return;
      }

      if (event.key === 'Tab') trapFocus(event, drawer);
    });

    window.addEventListener('popstate', () => {
      if (!state.drawerOpen) return;
      state.historyEntryActive = false;
      closeDrawerNow();
    });

    window.addEventListener('resize', () => {
      if (window.matchMedia('(min-width: 961px)').matches && state.drawerOpen) {
        closeDrawerNow();
      }
    }, { passive: true });
  }

  function openDrawer(options) {
    if (state.drawerOpen) return;

    const drawer = element('mobileModuleDrawer');
    const overlay = element('mobileModuleDrawerOverlay');
    const button = element('mobileModuleMenuButton');
    if (!drawer || !overlay || !button) return;

    const config = options && typeof options === 'object' ? options : {};
    state.drawerOpen = true;
    state.previousFocus = document.activeElement;
    state.scrollY = Math.max(0, window.scrollY || window.pageYOffset || 0);

    overlay.hidden = false;
    drawer.setAttribute('aria-hidden', 'false');
    drawer.classList.add('is-open');
    button.setAttribute('aria-expanded', 'true');
    document.body.classList.add('module-menu-open');
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + state.scrollY + 'px';
    document.body.style.width = '100%';

    if (config.pushHistory !== false && !state.historyEntryActive) {
      try {
        window.history.pushState({ alertVendorModuleDrawer: true }, '', window.location.href);
        state.historyEntryActive = true;
      } catch (error) {
        state.historyEntryActive = false;
      }
    }

    window.requestAnimationFrame(() => {
      const first = firstFocusable(drawer) || drawer;
      first.focus({ preventScroll: true });
    });
  }

  function requestCloseDrawer() {
    if (!state.drawerOpen) return;

    if (state.historyEntryActive) {
      state.historyEntryActive = false;
      window.history.back();
      return;
    }

    closeDrawerNow();
  }

  function closeDrawerNow() {
    const drawer = element('mobileModuleDrawer');
    const overlay = element('mobileModuleDrawerOverlay');
    const button = element('mobileModuleMenuButton');

    state.drawerOpen = false;
    drawer && drawer.classList.remove('is-open');
    drawer && drawer.setAttribute('aria-hidden', 'true');
    if (overlay) overlay.hidden = true;
    button && button.setAttribute('aria-expanded', 'false');

    if (document.body) {
      document.body.classList.remove('module-menu-open');
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    }

    window.scrollTo({ top: state.scrollY, left: 0, behavior: 'auto' });

    const focusTarget = state.previousFocus && document.contains(state.previousFocus)
      ? state.previousFocus
      : button;
    focusTarget && focusTarget.focus({ preventScroll: true });
  }

  function trapFocus(event, container) {
    const focusable = getFocusable(container);
    if (!focusable.length) {
      event.preventDefault();
      container.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function getFocusable(container) {
    return Array.from(container.querySelectorAll([
      'button:not([disabled]):not([hidden])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(','))).filter((node) => {
      const style = window.getComputedStyle(node);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  function firstFocusable(container) {
    return getFocusable(container)[0] || null;
  }

  function bindDrawerActions() {
    document.querySelectorAll('[data-module-menu-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = String(button.dataset.moduleMenuAction || '').toUpperCase();
        runDrawerAction(action);
      });
    });

    const retry = element('mobileDrawerSnapshotRetry');
    retry && retry.addEventListener('click', () => {
      const source = element('moduleSnapshotRetry');
      if (source && !source.hidden && !source.disabled) source.click();
    });
  }

  function runDrawerAction(action) {
    const map = {
      DASHBOARD: 'moduleDashboardLauncher',
      CALENDAR: 'calendarButton',
      REFRESH: 'operationalBoardRefresh',
      ALERT: 'operationalAlertToggle',
      THRESHOLD: 'thresholdInfoButton',
      HOME: 'backButton',
      LOGOUT: 'logoutButton'
    };

    if (action === 'FULLSCREEN') {
      void toggleFullscreen();
      return;
    }

    const target = element(map[action]);
    if (!target) return;

    const waitsForHistoryClose = state.historyEntryActive;
    requestCloseDrawer();
    window.setTimeout(() => target.click(), waitsForHistoryClose ? 120 : 30);
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      } else {
        const target = document.documentElement;
        if (target.requestFullscreen) await target.requestFullscreen({ navigationUI: 'hide' });
        else if (target.webkitRequestFullscreen) target.webkitRequestFullscreen();
      }
    } catch (error) {
      console.warn('เปิดโหมดเต็มหน้าจอไม่สำเร็จ', error);
    } finally {
      syncFullscreenLabel();
    }
  }

  function bindFullscreenState() {
    document.addEventListener('fullscreenchange', syncFullscreenLabel);
    document.addEventListener('webkitfullscreenchange', syncFullscreenLabel);
  }

  function syncFullscreenLabel() {
    const label = element('mobileMenuFullscreenLabel');
    if (!label) return;
    label.textContent = document.fullscreenElement || document.webkitFullscreenElement
      ? 'ออกจากเต็มหน้าจอ'
      : 'เปิดเต็มหน้าจอ';
  }

  function bindSnapshotMirror() {
    const panel = element('moduleSnapshotState');
    if (!panel || typeof MutationObserver !== 'function') return;

    state.observer = new MutationObserver(syncSnapshotMirror);
    state.observer.observe(panel, {
      attributes: true,
      attributeFilter: ['data-state', 'aria-label'],
      childList: true,
      subtree: true,
      characterData: true
    });

    document.addEventListener('alertvendor:module-board-health', syncSnapshotMirror);
  }

  function syncSnapshotMirror() {
    const panel = element('moduleSnapshotState');
    const sourceTitle = element('moduleSnapshotTitle');
    const sourceDetail = element('moduleSnapshotDetail');
    const sourceRetry = element('moduleSnapshotRetry');
    const drawerStatus = document.querySelector('.module-mobile-menu__status');
    const drawerTitle = element('mobileDrawerSnapshotTitle');
    const drawerDetail = element('mobileDrawerSnapshotDetail');
    const drawerRetry = element('mobileDrawerSnapshotRetry');
    const menuButton = element('mobileModuleMenuButton');

    const status = String(panel && panel.dataset.state || 'LOADING').toUpperCase();
    drawerStatus && drawerStatus.setAttribute('data-drawer-status', status);
    menuButton && menuButton.setAttribute('data-server-state', status);
    if (drawerTitle) drawerTitle.textContent = String(sourceTitle && sourceTitle.textContent || 'กำลังตรวจสอบข้อมูล').trim();
    if (drawerDetail) drawerDetail.textContent = String(sourceDetail && sourceDetail.textContent || '').trim();
    if (drawerRetry) {
      drawerRetry.hidden = !sourceRetry || sourceRetry.hidden;
      drawerRetry.disabled = Boolean(sourceRetry && sourceRetry.disabled);
    }
  }

  function bindIdentityMirror() {
    const user = element('userDisplayName');
    const title = element('moduleTitle');
    if (typeof MutationObserver !== 'function') return;

    if (user) {
      state.userObserver = new MutationObserver(syncIdentityMirror);
      state.userObserver.observe(user, { childList: true, subtree: true, characterData: true });
    }

    if (title) {
      state.titleObserver = new MutationObserver(syncIdentityMirror);
      state.titleObserver.observe(title, { childList: true, subtree: true, characterData: true });
    }
  }

  function syncIdentityMirror() {
    const sourceUser = element('userDisplayName');
    const sourceTitle = element('moduleTitle');
    const drawerUser = element('mobileModuleDrawerUser');
    const drawerTitle = element('mobileModuleDrawerTitle');

    if (drawerUser) {
      const name = String(sourceUser && sourceUser.textContent || '').trim();
      drawerUser.textContent = name ? 'ผู้ใช้งาน: ' + name : 'กำลังอ่านข้อมูลผู้ใช้งาน';
    }

    if (drawerTitle) {
      const name = String(sourceTitle && sourceTitle.textContent || '').trim();
      drawerTitle.textContent = name || 'สถานะรถและตู้สินค้า';
    }
  }

  function bindOperationalBoardCollapse() {
    const panel = element('operationalBoardPanel');
    const toggle = element('operationalBoardCollapseToggle');
    if (!panel || !toggle) return;

    let collapsed = true;
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      collapsed = saved === null ? true : saved === 'TRUE';
    } catch (error) {
      collapsed = true;
    }

    setOperationalBoardCollapsed(collapsed);

    toggle.addEventListener('click', () => {
      setOperationalBoardCollapsed(!panel.classList.contains('is-professional-collapsed'));
    });

    document.querySelectorAll('[data-mobile-workspace]').forEach((button) => {
      button.addEventListener('click', () => {
        const workspace = String(button.dataset.mobileWorkspace || 'LIST').toUpperCase();
        if (workspace !== 'LIST' && window.matchMedia('(max-width: 767px)').matches) {
          panel.classList.remove('is-professional-collapsed');
        }
      });
    });
  }

  function setOperationalBoardCollapsed(collapsed) {
    const panel = element('operationalBoardPanel');
    const toggle = element('operationalBoardCollapseToggle');
    if (!panel || !toggle) return;

    panel.classList.toggle('is-professional-collapsed', collapsed);
    toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    toggle.textContent = collapsed ? 'เปิดภาพรวมกะ' : 'ย่อภาพรวมกะ';

    try {
      window.sessionStorage.setItem(STORAGE_KEY, collapsed ? 'TRUE' : 'FALSE');
    } catch (error) {
      // sessionStorage อาจถูกปิดในโหมดส่วนตัวบางอุปกรณ์
    }
  }
})(window, document);


/* ============================================================
 * SOURCE 12: module-executive(8).js
 * ============================================================ */
/**
 * module-executive.js
 * ROUND 28 — ลดข้อมูลซ้ำและคำนวณสุทธิจริง
 */
(function (window, document) {
  'use strict';

  document.addEventListener(
    'DOMContentLoaded',
    initializeExecutiveModuleUi
  );

  function initializeExecutiveModuleUi() {
    bindHourlyToggle();
    observeMovementNumbers();
    updateActualNet();
  }

  function bindHourlyToggle() {
    const button =
      document.getElementById(
        'moduleHourlyDetailToggle'
      );

    const panel =
      document.getElementById(
        'moduleHourlyDetails'
      );

    if (!button || !panel) {
      return;
    }

    button.addEventListener(
      'click',
      () => {
        const expanded =
          button.getAttribute(
            'aria-expanded'
          ) === 'true';

        const nextExpanded =
          !expanded;

        button.setAttribute(
          'aria-expanded',
          String(nextExpanded)
        );

        button.textContent =
          nextExpanded
            ? 'ซ่อนรายละเอียดรายชั่วโมง'
            : 'ดูรายละเอียดรายชั่วโมง';

        panel.hidden =
          !nextExpanded;

        panel.classList.toggle(
          'is-collapsed',
          !nextExpanded
        );

        document.body.classList.toggle(
          'module-hourly-expanded',
          nextExpanded
        );

        if (nextExpanded) {
          window.requestAnimationFrame(
            () => {
              panel.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          );
        }
      }
    );
  }

  function observeMovementNumbers() {
    const observer =
      new MutationObserver(
        updateActualNet
      );

    [
      document.getElementById(
        'movementIn'
      ),
      document.getElementById(
        'movementOutReal'
      )
    ]
      .filter(Boolean)
      .forEach(
        (element) => {
          observer.observe(
            element,
            {
              childList: true,
              characterData: true,
              subtree: true
            }
          );
        }
      );
  }

  function updateActualNet() {
    const inCount =
      readNumber('movementIn');

    const outReal =
      readNumber('movementOutReal');

    const net =
      inCount - outReal;

    const target =
      document.getElementById(
        'movementNetActual'
      );

    if (target) {
      target.textContent =
        net > 0
          ? '+' + net
          : String(net);
    }
  }

  function readNumber(id) {
    const element =
      document.getElementById(id);

    const value =
      Number(
        String(
          element &&
          element.textContent ||
          '0'
        ).replace(
          /[^\d.-]/g,
          ''
        )
      );

    return Number.isFinite(value)
      ? value
      : 0;
  }

})(window, document);


/* ============================================================
 * SOURCE 13: dashboard-link(10).js
 * ============================================================ */
/**
 * dashboard-link.js
 * ROUND 3 REVISION 4 — Professional Header Dashboard Launcher
 *
 * รองรับ Header เดิมและ Header แบบ Unified Command Bar
 */
(function (window, document) {
  'use strict';

  const BUTTON_ID =
    'moduleDashboardLauncher';

  const state = {
    observer: null,
    retryTimer: null,
    destroyed: false
  };

  document.addEventListener(
    'DOMContentLoaded',
    initializeDashboardLauncher
  );

  window.addEventListener(
    'beforeunload',
    destroyDashboardLauncher
  );

  function initializeDashboardLauncher() {
    ensureDashboardLauncher();

    state.observer =
      new MutationObserver(
        debounce(
          ensureDashboardLauncher,
          80
        )
      );

    state.observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );

    scheduleRetry();
  }


  function ensureDashboardLauncher() {
    document.body && document.body.classList.add('has-module-dashboard-launcher');
    if (state.destroyed) {
      return;
    }

    const existing =
      document.getElementById(
        BUTTON_ID
      );

    const target =
      resolveLauncherTarget();

    if (!target) {
      scheduleRetry();
      return;
    }

    target.classList.add('module-dashboard-launcher-host');

    if (existing) {
      if (
        existing.parentElement !==
        target
      ) {
        target.appendChild(
          existing
        );
      }

      syncLauncherHref(
        existing
      );

      return;
    }

    const button =
      createDashboardLauncher();

    target.appendChild(
      button
    );
  }


  function resolveLauncherTarget() {
    return (
      document.getElementById('moduleDashboardHost') ||
      document.querySelector(
        '.module-command-bar .module-clock'
      ) ||
      document.querySelector(
        '.module-header .module-clock'
      ) ||
      document.querySelector(
        '.module-title-row .module-clock'
      ) ||
      document.querySelector(
        '.module-clock'
      ) ||
      document.querySelector(
        '.module-command-bar'
      ) ||
      document.querySelector(
        '.module-header__inner'
      )
    );
  }


  function createDashboardLauncher() {
    const button =
      document.createElement(
        'button'
      );

    button.id =
      BUTTON_ID;

    button.type =
      'button';

    button.className =
      'module-dashboard-launcher';

    button.setAttribute(
      'aria-label',
      'เปิด Dashboard'
    );

    button.setAttribute(
      'title',
      'เปิด Dashboard'
    );

    button.innerHTML = `
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          d="M4 20V10M10 20V4M16 20v-7M22 20H2"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>

      <span>
        เปิด Dashboard
      </span>
    `;

    button.addEventListener(
      'click',
      openDashboard
    );

    syncLauncherHref(
      button
    );

    button.style.setProperty(
      'color',
      '#ffffff',
      'important'
    );

    button.style.setProperty(
      'opacity',
      '1',
      'important'
    );

    const label =
      button.querySelector(
        'span'
      );

    if (label) {
      label.style.setProperty(
        'color',
        '#ffffff',
        'important'
      );

      label.style.setProperty(
        'opacity',
        '1',
        'important'
      );
    }

    return button;
  }


  function syncLauncherHref(button) {
    button.dataset.moduleId =
      getModuleId();
  }


  function openDashboard() {
    const moduleId =
      getModuleId();

    if (!moduleId) {
      return;
    }

    const dashboardUrl =
      new URL(
        './dashboard/index.html',
        window.location.href
      );

    dashboardUrl.searchParams.set(
      'module',
      moduleId
    );

    window.location.href =
      dashboardUrl.toString();
  }


  function getModuleId() {
    return String(
      new URL(
        window.location.href
      ).searchParams.get(
        'id'
      ) ||
      ''
    ).trim();
  }


  function scheduleRetry() {
    if (
      state.destroyed ||
      state.retryTimer
    ) {
      return;
    }

    state.retryTimer =
      window.setTimeout(
        () => {
          state.retryTimer = null;
          ensureDashboardLauncher();
        },
        350
      );
  }


  function debounce(
    fn,
    delay
  ) {
    let timer = null;

    return function (...args) {
      window.clearTimeout(
        timer
      );

      timer =
        window.setTimeout(
          () => {
            timer = null;
            fn(...args);
          },
          delay
        );
    };
  }


  function destroyDashboardLauncher() {
    state.destroyed = true;

    if (state.observer) {
      state.observer.disconnect();
    }

    if (state.retryTimer) {
      window.clearTimeout(
        state.retryTimer
      );
    }
  }

})(window, document);


/* ============================================================
 * SOURCE 14: module-shift(5).js
 * ============================================================ */
/**
 * module-shift.js
 * ROUND 56 — Movement Scope + Shift UI
 */
(function (window, document) {
  'use strict';

  const state = {
    moduleId: '',
    config: null,
    activeScope: 'ROLLING_4H',
    selectedDate: '',
    selectedShift: '',
    requestToken: 0
  };

  function open() {
    state.moduleId = (
      new URLSearchParams(
        window.location.search
      ).get('id') || ''
    ).trim();

    state.selectedDate = todayIso();

    window.Swal.fire({
      icon: undefined,
      title: '',
      html: buildShellHtml(),
      showConfirmButton: true,
      confirmButtonText: 'ปิด',
      showCloseButton: true,
      allowOutsideClick: true,
      heightAuto: false,
      width: 'min(900px, calc(100vw - 10px))',
      padding: '0',
      customClass: {
        popup: 'shift-movement-popup',
        title: 'shift-movement-hidden',
        icon: 'shift-movement-hidden',
        htmlContainer: 'shift-movement-html',
        actions: 'shift-movement-actions',
        confirmButton: 'shift-movement-confirm',
        closeButton: 'shift-movement-close'
      },
      didOpen: (popup) => {
        bindShell(popup);
        loadInitial(popup);
      }
    });
  }

  function buildShellHtml() {
    return `
      <article class="shift-movement">
        <header class="shift-movement__header">
          <div>
            <small>VEHICLE MOVEMENT</small>
            <h2>การเคลื่อนไหวรถ/ตู้</h2>
            <p>เลือกช่วงข้อมูลที่ต้องการตรวจสอบ</p>
          </div>

          <span id="shiftMovementModuleName">
            กำลังโหลด...
          </span>
        </header>

        <nav class="shift-movement__tabs">
          <button
            type="button"
            class="is-active"
            data-shift-scope="ROLLING_4H"
          >
            4 ชั่วโมงล่าสุด
          </button>

          <button
            type="button"
            data-shift-scope="TODAY"
          >
            วันนี้
          </button>

          <button
            type="button"
            data-shift-scope="CURRENT_SHIFT"
            data-shift-required
          >
            กะปัจจุบัน
          </button>

          <button
            type="button"
            data-shift-scope="SHIFT"
            data-shift-required
          >
            เลือกกะ
          </button>
        </nav>

        <section
          class="shift-movement__selector"
          data-shift-selector
          hidden
        >
          <label>
            <span>วันที่ปฏิบัติงาน</span>
            <input
              type="date"
              id="shiftMovementDate"
              value="${escapeHtml(state.selectedDate)}"
            >
          </label>

          <label>
            <span>กะ</span>
            <select id="shiftMovementCode">
              <option value="">กำลังโหลด...</option>
            </select>
          </label>

          <button
            type="button"
            id="shiftMovementApply"
          >
            แสดงข้อมูล
          </button>
        </section>

        <section
          id="shiftMovementContent"
          class="shift-movement__content"
        >
          ${loadingHtml()}
        </section>
      </article>
    `;
  }

  async function loadInitial(popup) {
    try {
      state.config =
        await window.VehicleAPI.getShiftConfig(
          state.moduleId
        );

      renderConfig(popup);

      state.activeScope =
        state.config &&
        state.config.enabled
          ? 'CURRENT_SHIFT'
          : 'ROLLING_4H';

      activateScopeButton(
        popup,
        state.activeScope
      );

      await loadScope(popup);
    } catch (error) {
      renderError(popup, error);
    }
  }

  function bindShell(popup) {
    popup
      .querySelectorAll('[data-shift-scope]')
      .forEach((button) => {
        button.addEventListener(
          'click',
          async () => {
            if (button.disabled) {
              return;
            }

            state.activeScope =
              button.dataset.shiftScope;

            activateScopeButton(
              popup,
              state.activeScope
            );

            const selector =
              popup.querySelector(
                '[data-shift-selector]'
              );

            selector.hidden =
              state.activeScope !== 'SHIFT';

            if (
              state.activeScope !== 'SHIFT'
            ) {
              await loadScope(popup);
            }
          }
        );
      });

    popup
      .querySelector('#shiftMovementApply')
      ?.addEventListener(
        'click',
        async () => {
          state.selectedDate =
            popup.querySelector(
              '#shiftMovementDate'
            )?.value || todayIso();

          state.selectedShift =
            popup.querySelector(
              '#shiftMovementCode'
            )?.value || '';

          await loadScope(popup);
        }
      );
  }

  function renderConfig(popup) {
    const config = state.config || {};

    const name =
      popup.querySelector(
        '#shiftMovementModuleName'
      );

    if (name) {
      name.textContent =
        config.enabled
          ? `ระบบกะ: เปิด · ${config.version || '-'}`
          : 'ระบบกะ: ปิด';
    }

    popup
      .querySelectorAll('[data-shift-required]')
      .forEach((button) => {
        button.disabled =
          config.enabled !== true;
        button.hidden =
          config.enabled !== true;
      });

    const select =
      popup.querySelector(
        '#shiftMovementCode'
      );

    const shifts =
      Array.isArray(config.shifts)
        ? config.shifts.filter(
            (item) => item.active !== false
          )
        : [];

    if (select) {
      select.innerHTML =
        shifts.map((item) => `
          <option value="${escapeHtml(item.code)}">
            ${escapeHtml(item.name)}
            ${escapeHtml(item.start)}–${escapeHtml(item.end)}
          </option>
        `).join('');
    }

    state.selectedShift =
      shifts[0]
        ? shifts[0].code
        : '';
  }

  function activateScopeButton(
    popup,
    scope
  ) {
    popup
      .querySelectorAll('[data-shift-scope]')
      .forEach((button) => {
        button.classList.toggle(
          'is-active',
          button.dataset.shiftScope === scope
        );
      });
  }

  async function loadScope(popup) {
    const token = ++state.requestToken;

    const content =
      popup.querySelector(
        '#shiftMovementContent'
      );

    if (!content) {
      return;
    }

    content.innerHTML = loadingHtml();

    try {
      const data =
        await window.VehicleAPI.getMovementScope(
          state.moduleId,
          {
            scope: state.activeScope,
            date: state.selectedDate,
            shift: state.selectedShift
          }
        );

      if (token !== state.requestToken) {
        return;
      }

      content.innerHTML =
        renderScopeHtml(data);
    } catch (error) {
      if (token !== state.requestToken) {
        return;
      }

      renderError(popup, error);
    }
  }

  function renderScopeHtml(data) {
    const metric = data?.metrics || {};
    const range = data?.range || {};
    const hours = Array.isArray(data?.hours)
      ? data.hours
      : [];

    const title =
      range.shiftCode
        ? `${range.shiftName || 'กะ'} (${range.shiftCode})`
        : scopeLabel(data?.scope);

    return `
      <section class="shift-movement__scope-head">
        <div>
          <small>${escapeHtml(title)}</small>

          <strong>
            ${escapeHtml(range.startAt || '-')}
            –
            ${escapeHtml(
              range.effectiveEndAt ||
              range.endAt ||
              '-'
            )}
          </strong>
        </div>

        <span class="${
          range.completed
            ? 'is-complete'
            : 'is-live'
        }">
          ${
            range.completed
              ? 'จบช่วงแล้ว'
              : 'กำลังดำเนินการ'
          }
        </span>
      </section>

      <section class="shift-movement__metrics">
        ${metricHtml(
          'คงค้างต้นช่วง',
          metric.openingBalance
        )}

        ${metricHtml(
          'Gate In',
          metric.gateIn
        )}

        ${metricHtml(
          'Gate Out จริง',
          metric.gateOutActual
        )}

        ${metricHtml(
          'Auto Close',
          metric.autoClose
        )}

        ${metricHtml(
          'คงค้างท้ายช่วง',
          metric.closingBalance
        )}

        ${metricHtml(
          'เกิน SLA ปลายช่วง',
          metric.overdueAtEnd,
          'is-danger'
        )}
      </section>

      <section class="shift-movement__performance">
        ${performanceHtml(
          'SLA ผ่านเกณฑ์',
          percent(metric.slaCompliancePercent)
        )}

        ${performanceHtml(
          'เวลาเฉลี่ย',
          minutes(metric.averageDwellMinutes)
        )}

        ${performanceHtml(
          'P90',
          minutes(metric.p90DwellMinutes)
        )}

        ${performanceHtml(
          'เวลานานที่สุด',
          minutes(metric.maxDwellMinutes)
        )}

        ${performanceHtml(
          'Peak Active',
          number(metric.peakActive)
        )}

        ${performanceHtml(
          'คุณภาพข้อมูล',
          percent(metric.dataCompletenessPercent)
        )}
      </section>

      <section class="shift-movement__chart">
        <header>
          <strong>การเคลื่อนไหวรายชั่วโมง</strong>
          <span>${hours.length} ช่วง</span>
        </header>

        <div class="shift-movement__chart-body">
          ${
            hours.length
              ? hours.map(hourHtml).join('')
              : `
                  <div class="shift-movement__empty">
                    ยังไม่มีข้อมูลรายชั่วโมง
                  </div>
                `
          }
        </div>
      </section>
    `;
  }

  function hourHtml(hour) {
    const maximum = Math.max(
      1,
      Number(hour.gateIn) || 0,
      Number(hour.gateOutActual) || 0,
      Number(hour.activeAtEnd) || 0
    );

    return `
      <div class="shift-hour-row">
        <strong>
          ${escapeHtml(hour.label || '-')}
        </strong>

        <div class="shift-hour-bars">
          <span>
            <small>เข้า</small>

            <i
              style="width:${barWidth(
                hour.gateIn,
                maximum
              )}%"
            ></i>

            <b>${number(hour.gateIn)}</b>
          </span>

          <span>
            <small>ออก</small>

            <i
              style="width:${barWidth(
                hour.gateOutActual,
                maximum
              )}%"
            ></i>

            <b>${number(hour.gateOutActual)}</b>
          </span>
        </div>

        <em>
          คงค้าง ${number(hour.activeAtEnd)}
        </em>
      </div>
    `;
  }

  function metricHtml(
    label,
    value,
    className
  ) {
    return `
      <div class="${className || ''}">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(number(value))}</strong>
      </div>
    `;
  }

  function performanceHtml(
    label,
    value
  ) {
    return `
      <div>
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `;
  }

  function renderError(popup, error) {
    const content =
      popup.querySelector(
        '#shiftMovementContent'
      );

    if (content) {
      content.innerHTML = `
        <div class="shift-movement__error">
          <strong>ไม่สามารถโหลดข้อมูลได้</strong>

          <span>
            ${escapeHtml(
              error?.message ||
              'เกิดข้อผิดพลาด'
            )}
          </span>
        </div>
      `;
    }
  }

  function loadingHtml() {
    return `
      <div class="shift-movement__loading">
        <span></span>
        <strong>กำลังคำนวณข้อมูล...</strong>
      </div>
    `;
  }

  function scopeLabel(scope) {
    const map = {
      ROLLING_4H: '4 ชั่วโมงล่าสุด',
      TODAY: 'วันนี้',
      CURRENT_SHIFT: 'กะปัจจุบัน',
      SHIFT: 'กะที่เลือก',
      BUSINESS_DAY: 'วันปฏิบัติงาน'
    };

    return map[String(scope || '').toUpperCase()]
      || 'การเคลื่อนไหว';
  }

  function todayIso() {
    const now = new Date();

    return [
      now.getFullYear(),
      String(now.getMonth() + 1)
        .padStart(2, '0'),
      String(now.getDate())
        .padStart(2, '0')
    ].join('-');
  }

  function barWidth(value, maximum) {
    return Math.max(
      0,
      Math.min(
        100,
        (Number(value) || 0) /
          maximum *
          100
      )
    );
  }

  function number(value) {
    const numeric = Number(value);

    return Number.isFinite(numeric)
      ? new Intl.NumberFormat(
          'th-TH',
          {
            maximumFractionDigits: 2
          }
        ).format(numeric)
      : String(value ?? '-');
  }

  function percent(value) {
    return `${number(value)}%`;
  }

  function minutes(value) {
    return `${number(value)} นาที`;
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  window.ModuleShiftUI = {
    open
  };

})(window, document);


/* BASELINE 2 FINAL HOTFIX 5 — Workflow Profile display helper */
window.SmartAlertWorkflowProfileLabel = function (profile) {
  const code = String(profile && profile.code || '').toUpperCase();
  if (code === 'FULL_INBOUND' || code === 'FULL_INBOUND_LEGACY') return 'Inbound เต็มรูปแบบ';
  if (code === 'SUBMIT_ONLY') return 'สแกนยื่นเอกสารเท่านั้น';
  if (code === 'RETURN_ONLY') return 'สแกนคืนเอกสารเท่านั้น';
  if (code === 'BYPASS_INBOUND') return 'ไม่ใช้ขั้นตอน Inbound';
  return code || '-';
};
