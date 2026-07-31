/**
 * Frustration Detector — Shared Module
 * =====================================
 * Portable frustration-detection engine for any OrangeHRM page.
 *
 * Usage:
 *   <script src="frustration-detector.js"></script>
 *   <script>
 *     FrustrationDetector.init({
 *       rageTargets: ['#punchBtn', '#applyLeaveBtn'],
 *       jitterZone:  '#mainContent',
 *       cancelTargets: ['#logoutBtn'],
 *       enableRecorder: false,
 *       pageName: 'dashboard'
 *     });
 *   </script>
 *
 * The module injects its own banner HTML and survey overlay if not already
 * present in the DOM, so host pages need zero extra markup.
 */

// eslint-disable-next-line no-var
var FrustrationDetector = (function () {
  'use strict';

  // ── Configuration defaults ──────────────────────────────────────────────
  const DEFAULTS = {
    rageThreshold: 5,
    rageWindowMs: 3000,
    ssoThreshold: 3,
    ssoResetMs: 5000,
    cancelThreshold: 3,
    cancelResetMs: 2000,
    jitterSamples: 20,
    jitterAngle: 110,
    jitterReversals: 5,
    enableRecorder: false,
    pageName: 'unknown',
    rageTargets: [],
    cancelTargets: [],
    jitterZone: null,
  };

  let cfg = {};

  // ── State ───────────────────────────────────────────────────────────────
  let surveySeen = false;
  let rageClicks = [];
  let lastRageTs = 0;
  let cancelClicks = 0;
  let cancelTimeout = null;
  let mousePath = [];
  let jitterDetected = false;
  let failedAttempts = 0;

  // Recorder state
  let isRecording = false;
  let recordingStart = 0;
  let recordedEvents = [];
  let recorderTimer = null;
  let frustrationTriggersOccurred = {
    rageClick: false,
    ssoLocked: false,
    magicLink: false,
    mouseJitter: false,
    backtrack: false,
  };

  // ── DOM refs (created or found) ─────────────────────────────────────────
  let bannerContainer = null;
  let rageClickBanner = null;
  let mouseJitterBanner = null;
  let surveyOverlay = null;
  let frustrationSlider = null;
  let ratingDisplay = null;
  let surveyDismiss = null;
  let surveySubmitBtn = null;
  let surveyFeedback = null;

  // Recorder DOM
  let recWidget = null;
  let recEventCount = null;
  let recDuration = null;

  // ── Inject HTML ─────────────────────────────────────────────────────────
  function injectBanners() {
    if (document.getElementById('fd-banner-container')) {
      bannerContainer = document.getElementById('fd-banner-container');
      rageClickBanner = document.getElementById('fd-rageClickBanner');
      mouseJitterBanner = document.getElementById('fd-mouseJitterBanner');
      return;
    }

    bannerContainer = document.createElement('div');
    bannerContainer.id = 'fd-banner-container';
    bannerContainer.style.cssText =
      'position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:10px;max-width:400px;';

    bannerContainer.innerHTML = `
      <div class="alert-banner hidden" id="fd-rageClickBanner" style="
        background:#fff7ed;border:1px solid #fed7aa;padding:12px 16px;border-radius:10px;
        display:none;align-items:center;gap:10px;font-family:'Inter',sans-serif;font-size:0.88rem;
        box-shadow:0 4px 16px rgba(255,121,26,0.15);animation:fdSlideIn 0.3s ease;">
        <span style="font-size:1.3rem">💡</span>
        <div><strong>Need assistance?</strong> We noticed repeated rapid interactions on this page.</div>
      </div>
      <div class="alert-banner warning hidden" id="fd-mouseJitterBanner" style="
        background:#fffbe6;border:1px solid #ffe58f;padding:12px 16px;border-radius:10px;
        display:none;align-items:center;gap:10px;font-family:'Inter',sans-serif;font-size:0.88rem;
        box-shadow:0 4px 16px rgba(212,136,6,0.15);animation:fdSlideIn 0.3s ease;">
        <span style="font-size:1.3rem">💬</span>
        <div><strong>Feeling stuck?</strong> Open our live chat for instant help.</div>
      </div>`;

    document.body.appendChild(bannerContainer);
    rageClickBanner = document.getElementById('fd-rageClickBanner');
    mouseJitterBanner = document.getElementById('fd-mouseJitterBanner');

    // Animation keyframes
    if (!document.getElementById('fd-keyframes')) {
      const style = document.createElement('style');
      style.id = 'fd-keyframes';
      style.textContent = `
        @keyframes fdSlideIn {
          from { opacity:0; transform:translateX(40px); }
          to   { opacity:1; transform:translateX(0); }
        }`;
      document.head.appendChild(style);
    }
  }

  function injectSurvey() {
    if (document.getElementById('fd-surveyOverlay')) {
      surveyOverlay = document.getElementById('fd-surveyOverlay');
      frustrationSlider = document.getElementById('fd-frustrationSlider');
      ratingDisplay = document.getElementById('fd-ratingDisplay');
      surveyDismiss = document.getElementById('fd-surveyDismiss');
      surveySubmitBtn = document.getElementById('fd-surveySubmit');
      surveyFeedback = document.getElementById('fd-surveyFeedback');
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'fd-surveyOverlay';
    overlay.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(0,0,0,0.45);display:none;align-items:center;
      justify-content:center;z-index:10000;font-family:'Inter',sans-serif;`;
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:16px;padding:2rem;max-width:420px;width:90%;
        box-shadow:0 20px 60px rgba(0,0,0,0.2);text-align:center;">
        <h3 style="margin:0 0 0.5rem;color:#1e293b;font-size:1.15rem;">We noticed some friction...</h3>
        <p style="color:#64748b;font-size:0.9rem;margin-bottom:1.25rem;">
          How frustrated are you feeling right now on a scale of 1 to 5?</p>
        <div style="margin-bottom:1.25rem;">
          <input type="range" id="fd-frustrationSlider" min="1" max="5" value="3"
            style="width:100%;accent-color:#ff791a;">
          <div style="display:flex;justify-content:space-between;font-size:0.72rem;color:#94a3b8;margin-top:4px;">
            <span>1 (Calm)</span><span>2</span><span>3</span><span>4</span><span>5 (Highly Frustrated)</span>
          </div>
          <div id="fd-ratingDisplay" style="margin-top:8px;font-weight:700;color:#ff791a;font-size:0.9rem;">
            3/5 - Neutral / Impatient</div>
        </div>
        <div style="display:flex;gap:10px;justify-content:center;">
          <button id="fd-surveyDismiss" style="padding:8px 20px;border-radius:8px;border:1px solid #e2e8f0;
            background:#f8fafc;cursor:pointer;font-weight:600;color:#475569;">Dismiss</button>
          <button id="fd-surveySubmit" style="padding:8px 20px;border-radius:8px;border:none;
            background:linear-gradient(135deg,#ff791a,#eb5a00);color:#fff;cursor:pointer;font-weight:700;
            box-shadow:0 4px 12px rgba(255,121,26,0.3);">Submit Feedback</button>
        </div>
        <div id="fd-surveyFeedback" style="display:none;margin-top:12px;color:#16a34a;font-weight:600;">
          Thank you for your feedback!</div>
      </div>`;

    document.body.appendChild(overlay);
    surveyOverlay = overlay;
    frustrationSlider = document.getElementById('fd-frustrationSlider');
    ratingDisplay = document.getElementById('fd-ratingDisplay');
    surveyDismiss = document.getElementById('fd-surveyDismiss');
    surveySubmitBtn = document.getElementById('fd-surveySubmit');
    surveyFeedback = document.getElementById('fd-surveyFeedback');

    const ratingTexts = {
      1: '1/5 - Very Calm',
      2: '2/5 - Mildly Annoyed',
      3: '3/5 - Neutral / Impatient',
      4: '4/5 - Frustrated',
      5: '5/5 - Extremely Frustrated',
    };

    frustrationSlider.addEventListener('input', (e) => {
      ratingDisplay.textContent = ratingTexts[e.target.value] || e.target.value + '/5';
    });

    surveyDismiss.addEventListener('click', () => {
      surveyOverlay.style.display = 'none';
    });

    surveySubmitBtn.addEventListener('click', () => {
      surveyFeedback.style.display = 'block';
      surveyOverlay.setAttribute('data-submitted-rating', frustrationSlider.value);
      setTimeout(() => {
        surveyOverlay.style.display = 'none';
      }, 1000);
    });
  }

  // ── AI Evaluation ───────────────────────────────────────────────────────
  function evaluateFrustrationWithAI() {
    const payload = {
      obs_submit_clicks: rageClicks.length,
      obs_sso_clicks: 0,
      obs_cancel_clicks: cancelClicks,
      obs_jitter_reversals: jitterDetected ? 5 : 0,
      obs_rapid_click_bursts: rageClicks.length >= cfg.rageThreshold ? 1 : 0,
      failed_attempts: failedAttempts,
      page: cfg.pageName,
    };

    fetch('/api/predict_frustration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((result) => {
        console.log('[FrustrationDetector] AI result:', result);
        if (result.isFrustrated) {
          triggerSurvey();
        }
      })
      .catch(() => {
        // Fallback in-browser scoring
        let score =
          (rageClicks.length >= 5 ? 0.45 : 0) +
          (cancelClicks >= 3 ? 0.3 : 0) +
          (jitterDetected ? 0.35 : 0);
        if (score >= 0.5) triggerSurvey();
      });
  }

  function triggerSurvey() {
    if (surveySeen) return;
    surveySeen = true;
    if (surveyOverlay) {
      surveyOverlay.style.display = 'flex';
      frustrationSlider.value = 3;
      ratingDisplay.textContent = '3/5 - Neutral / Impatient';
      surveyFeedback.style.display = 'none';
    }
  }

  // ── Recording helpers ───────────────────────────────────────────────────
  function recordEvent(evt) {
    if (!isRecording) return;
    recordedEvents.push(evt);
    if (recEventCount) recEventCount.textContent = recordedEvents.length;
  }

  function recordTrigger(type) {
    frustrationTriggersOccurred[type] = true;
    recordEvent({
      type: 'trigger',
      triggerType: type,
      time: Date.now() - recordingStart,
    });
  }

  // ── Show banner helper ──────────────────────────────────────────────────
  function showBanner(el) {
    if (!el) return;
    el.classList.remove('hidden');
    el.style.display = 'flex';
  }

  // ── Rage-click handler ──────────────────────────────────────────────────
  function attachRageDetection() {
    cfg.rageTargets.forEach((selector) => {
      const els = document.querySelectorAll(selector);
      els.forEach((el) => {
        el.addEventListener('pointerdown', () => {
          const now = Date.now();
          if (now - lastRageTs < 20) return;
          lastRageTs = now;
          rageClicks.push(now);
          rageClicks = rageClicks.filter((t) => now - t < cfg.rageWindowMs);

          recordEvent({
            type: 'click',
            target: selector,
            time: now - recordingStart,
          });

          if (rageClicks.length >= cfg.rageThreshold) {
            window.rageclickdetected = true;
            recordTrigger('rageClick');
            showBanner(rageClickBanner);
            evaluateFrustrationWithAI();
          }
        });

        el.addEventListener('click', () => {
          evaluateFrustrationWithAI();
        });
      });
    });
  }

  // ── Cancel / backtrack handler ──────────────────────────────────────────
  function attachCancelDetection() {
    cfg.cancelTargets.forEach((selector) => {
      const els = document.querySelectorAll(selector);
      els.forEach((el) => {
        el.addEventListener('click', () => {
          cancelClicks++;
          if (cancelTimeout) clearTimeout(cancelTimeout);

          recordEvent({
            type: 'click',
            target: selector,
            time: Date.now() - recordingStart,
          });

          if (cancelClicks >= cfg.cancelThreshold) {
            recordTrigger('backtrack');
            cancelClicks = 0;
            evaluateFrustrationWithAI();
          }

          cancelTimeout = setTimeout(() => {
            cancelClicks = 0;
          }, cfg.cancelResetMs);
        });
      });
    });
  }

  // ── Jitter handler ──────────────────────────────────────────────────────
  function attachJitterDetection() {
    if (!cfg.jitterZone) return;
    const zone = document.querySelector(cfg.jitterZone);
    if (!zone) return;

    let lastMoveTime = 0;

    zone.addEventListener('mousemove', (e) => {
      // Recording
      if (isRecording) {
        const now = Date.now();
        if (now - lastMoveTime > 50) {
          recordEvent({
            type: 'mousemove',
            time: now - recordingStart,
            x: e.clientX,
            y: e.clientY,
          });
          lastMoveTime = now;
        }
      }

      if (jitterDetected) return;

      mousePath.push({ x: e.clientX, y: e.clientY, time: Date.now() });
      if (mousePath.length > cfg.jitterSamples) mousePath.shift();

      if (mousePath.length === cfg.jitterSamples) {
        let directionChanges = 0;
        for (let i = 2; i < mousePath.length; i++) {
          const p1 = mousePath[i - 2];
          const p2 = mousePath[i - 1];
          const p3 = mousePath[i];
          const v1 = { x: p2.x - p1.x, y: p2.y - p1.y };
          const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
          const m1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
          const m2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
          if (m1 > 5 && m2 > 5) {
            const dot = v1.x * v2.x + v1.y * v2.y;
            const cosTheta = Math.max(-1, Math.min(1, dot / (m1 * m2)));
            const angle = Math.acos(cosTheta) * (180 / Math.PI);
            if (angle > cfg.jitterAngle) directionChanges++;
          }
        }
        if (directionChanges >= cfg.jitterReversals) {
          jitterDetected = true;
          recordTrigger('mouseJitter');
          showBanner(mouseJitterBanner);
          evaluateFrustrationWithAI();
        }
      }
    });
  }

  // ── Public API ──────────────────────────────────────────────────────────
  function init(options) {
    cfg = Object.assign({}, DEFAULTS, options);
    injectBanners();
    injectSurvey();
    attachRageDetection();
    attachCancelDetection();
    attachJitterDetection();

    // Global click recorder (outside recorder widget)
    document.addEventListener('pointerdown', (e) => {
      if (!isRecording) return;
      if (recWidget && recWidget.contains(e.target)) return;
      recordEvent({
        type: 'click',
        target: e.target.id ? '#' + e.target.id : e.target.tagName.toLowerCase(),
        time: Date.now() - recordingStart,
        x: e.clientX,
        y: e.clientY,
      });
    });

    console.log(`[FrustrationDetector] Initialized on "${cfg.pageName}" page`);
  }

  // Recorder controls (callable from host pages or tests)
  function startRecording() {
    isRecording = true;
    recordedEvents = [];
    recordingStart = Date.now();
    frustrationTriggersOccurred = {
      rageClick: false,
      ssoLocked: false,
      magicLink: false,
      mouseJitter: false,
      backtrack: false,
    };
    recorderTimer = setInterval(() => {
      if (recDuration) {
        recDuration.textContent =
          ((Date.now() - recordingStart) / 1000).toFixed(1) + 's';
      }
    }, 100);
  }

  function stopRecording() {
    isRecording = false;
    if (recorderTimer) {
      clearInterval(recorderTimer);
      recorderTimer = null;
    }
    return {
      durationMs: Date.now() - recordingStart,
      frustrationDetected: { ...frustrationTriggersOccurred },
      events: [...recordedEvents],
    };
  }

  function saveRecording(name) {
    const data = stopRecording();
    data.name = name || 'session_' + Date.now();
    data.page = cfg.pageName;
    return fetch('/api/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json());
  }

  // Expose for tests
  function getState() {
    return {
      surveySeen,
      jitterDetected,
      rageClicks: rageClicks.length,
      cancelClicks,
      failedAttempts,
      isRecording,
      recordedEvents: recordedEvents.length,
    };
  }

  return {
    init,
    startRecording,
    stopRecording,
    saveRecording,
    getState,
    triggerSurvey,
    evaluateFrustrationWithAI,
  };
})();
