<!--
/**
 * OrangeHRM is a comprehensive Human Resource Management (HRM) System that captures
 * all the essential functionalities required for any enterprise.
 * Copyright (C) 2006 OrangeHRM Inc., http://www.orangehrm.com
 *
 * OrangeHRM is free software: you can redistribute it and/or modify it under the terms of
 * the GNU General Public License as published by the Free Software Foundation, either
 * version 3 of the License, or (at your option) any later version.
 *
 * OrangeHRM is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with OrangeHRM.
 * If not, see <https://www.gnu.org/licenses/>.
 */
 -->

<template>
  <login-layout>
    <oxd-text class="orangehrm-login-title" tag="h5">
      {{ $t('auth.login') }}
    </oxd-text>
    <div id="loginCard" class="orangehrm-login-form">
      <div class="orangehrm-login-error">
        <oxd-alert
          :show="error !== null"
          :message="error?.message || ''"
          type="error"
        ></oxd-alert>
        <oxd-sheet
          v-if="isDemoMode"
          type="gray-lighten-2"
          class="orangehrm-demo-credentials"
        >
          <oxd-text tag="p">Username : Admin</oxd-text>
          <oxd-text tag="p">Password : admin123</oxd-text>
        </oxd-sheet>

        <!-- General Notification Banners -->
        <div
          v-if="showRageClickBanner"
          id="rageClickBanner"
          class="alert-banner"
        >
          <div class="alert-content">
            <span class="icon">💡</span>
            <div>
              <strong>Need assistance?</strong> We noticed multiple rapid
              attempts.
              <a href="#" @click.prevent="resetPassword">Reset Password</a> or
              <a href="#" @click.prevent="contactSupport">Contact Support</a>.
            </div>
          </div>
        </div>

        <div
          v-if="showMagicLinkBanner"
          id="magicLinkBanner"
          class="alert-banner info"
        >
          <div class="alert-content">
            <span class="icon">✉️</span>
            <div>
              <strong>Too many failed attempts.</strong> Log in instantly via a
              <a href="#" @click.prevent="triggerMagicLink"
                >One-time Magic Link</a
              >
              instead.
            </div>
          </div>
        </div>

        <div
          v-if="showMouseJitterBanner"
          id="mouseJitterBanner"
          class="alert-banner warning"
        >
          <div class="alert-content">
            <span class="icon">💬</span>
            <div>
              <strong>Feeling stuck?</strong> Open our live chat for instant
              help.
            </div>
          </div>
        </div>
      </div>

      <oxd-form
        id="loginForm"
        ref="loginForm"
        method="post"
        :action="submitUrl"
        @submit-valid="onSubmit"
      >
        <input name="_token" :value="token" type="hidden" />

        <oxd-form-row>
          <oxd-input-field
            id="username"
            v-model="username"
            name="username"
            :label="$t('general.username')"
            label-icon="person"
            :placeholder="$t('auth.username')"
            :rules="rules.username"
            autofocus
          />
        </oxd-form-row>

        <oxd-form-row>
          <oxd-input-field
            id="password"
            v-model="password"
            name="password"
            :label="$t('general.password')"
            label-icon="key"
            :placeholder="$t('auth.password')"
            type="password"
            :rules="rules.password"
          />
        </oxd-form-row>

        <!-- Hidden inputs / state validation for tests -->
        <div id="loginFeedback" class="login-feedback"></div>

        <oxd-form-actions class="orangehrm-login-action">
          <oxd-button
            id="loginSubmit"
            class="orangehrm-login-button"
            display-type="main"
            :label="$t('auth.login')"
            type="submit"
            @pointerdown="handleLoginPointerDown"
          />
        </oxd-form-actions>
        <div class="orangehrm-login-forgot">
          <oxd-text class="orangehrm-login-forgot-header" @click="navigateUrl">
            {{ $t('auth.forgot_password') }}?
          </oxd-text>
        </div>

        <div class="divider">
          <span>or continue with Enterprise</span>
        </div>

        <!-- SSO Button (Unavailable module / frustration test target) -->
        <button
          id="ssoSubmit"
          type="button"
          class="btn-secondary locked"
          :class="{shake: ssoShake}"
          aria-disabled="true"
          @click.prevent="handleSsoClick"
        >
          <span class="lock-icon">🔒</span> Single Sign-On (SSO / Passkey)
          <div v-if="showSsoTooltip" id="ssoTooltip" class="tooltip">
            {{ ssoTooltipText }}
          </div>
        </button>

        <div class="card-footer">
          <button
            id="cancelButton"
            type="button"
            class="btn-link"
            @click.prevent="handleCancelClick"
          >
            Cancel & Go Back
          </button>
        </div>
      </oxd-form>

      <template v-if="authenticators.length > 0">
        <oxd-divider class="orangehrm-login-seperator"></oxd-divider>
        <social-media-auth :authenticators="authenticators"></social-media-auth>
      </template>
    </div>

    <div class="orangehrm-login-footer">
      <div v-if="showSocialMedia" class="orangehrm-login-footer-sm">
        <a
          href="https://www.linkedin.com/company/orangehrm/mycompany/"
          target="_blank"
        >
          <oxd-icon type="svg" class="orangehrm-sm-icon" name="linkedinFill" />
        </a>
        <a href="https://www.facebook.com/OrangeHRM/" target="_blank">
          <oxd-icon type="svg" class="orangehrm-sm-icon" name="facebookFill" />
        </a>
        <a href="https://twitter.com/orangehrm?lang=en" target="_blank">
          <oxd-icon type="svg" class="orangehrm-sm-icon" name="twitterFill" />
        </a>
        <a href="https://www.youtube.com/c/OrangeHRMInc" target="_blank">
          <oxd-icon type="svg" class="orangehrm-sm-icon" name="youtubeFill" />
        </a>
      </div>
      <slot name="footer"></slot>
    </div>

    <!-- Backtracking Reversion Check Modal -->
    <div v-if="showReversionModal" id="reversionModal" class="modal-overlay">
      <div class="modal-card">
        <h3>Need to head back?</h3>
        <p>
          It looks like you're trying to return to the previous page. Would you
          like to continue logging in or exit to the main directory?
        </p>
        <div class="modal-actions">
          <button
            id="modalContinue"
            type="button"
            class="btn-secondary"
            @click="showReversionModal = false"
          >
            Stay Here
          </button>
          <button
            id="modalExit"
            type="button"
            class="btn-danger"
            @click="exitToDirectory"
          >
            Exit Portal
          </button>
        </div>
      </div>
    </div>

    <!-- Frustration Survey Overlay -->
    <div
      v-if="showSurveyOverlay"
      id="surveyOverlay"
      class="modal-overlay"
      :data-submitted-rating="submittedRating"
    >
      <div class="modal-card">
        <h3>We want to hear from you</h3>
        <p>
          Our detector noticed some potential friction during your login. How
          frustrated were you feeling just now?
        </p>

        <div class="slider-container">
          <input
            id="frustrationSlider"
            v-model="frustrationRating"
            type="range"
            min="1"
            max="5"
            class="slider"
          />
          <div class="slider-labels">
            <span>Not at all</span>
            <span>Extremely</span>
          </div>
          <div id="ratingDisplay" class="rating-display">
            {{ ratingTexts[frustrationRating] }}
          </div>
        </div>

        <div class="modal-actions">
          <button
            id="surveyDismiss"
            type="button"
            class="btn-secondary"
            @click="showSurveyOverlay = false"
          >
            Dismiss
          </button>
          <button
            id="surveySubmit"
            type="button"
            class="btn-primary"
            @click="submitSurvey"
          >
            Submit Rating
          </button>
        </div>

        <div
          v-if="showSurveyFeedback"
          id="surveyFeedback"
          class="feedback-success"
        >
          Thank you! Your feedback helps us improve.
        </div>
      </div>
    </div>

    <!-- Floating Session Recorder Widget -->
    <div id="recorderWidget" class="recorder-widget">
      <div class="recorder-header">
        <h4>
          <span
            id="recorderStatusDot"
            class="recorder-status-dot"
            :class="{recording: isRecording}"
          ></span>
          Session Recorder
        </h4>
      </div>
      <div class="recorder-body">
        <div class="recorder-stats">
          <span
            >Events:
            <strong id="recEventCount">{{
              recordedEvents.length
            }}</strong></span
          >
          <span
            >Time:
            <strong id="recDuration">{{
              formatDuration(recDurationMs)
            }}</strong></span
          >
        </div>
        <div class="recorder-actions">
          <button
            id="recStartBtn"
            type="button"
            class="btn-record start"
            :disabled="isRecording"
            @click="startRecording"
          >
            Start
          </button>
          <button
            id="recStopBtn"
            type="button"
            class="btn-record stop"
            :disabled="!isRecording"
            @click="stopRecording"
          >
            Stop
          </button>
        </div>
        <div
          v-if="showSaveGroup"
          id="recSaveGroup"
          class="recorder-input-group"
        >
          <input
            id="recSessionName"
            v-model="sessionName"
            type="text"
            placeholder="Session Name"
            class="recorder-input"
          />
          <button
            id="recSaveBtn"
            type="button"
            class="btn-primary"
            @click="saveRecording"
          >
            Save to Test Schemes
          </button>
        </div>
        <div
          v-if="recMessage"
          id="recMsg"
          class="recorder-msg"
          :class="recMessageClass"
        >
          {{ recMessage }}
        </div>
      </div>
    </div>
  </login-layout>
</template>

<script>
import {urlFor} from '@ohrm/core/util/helper/url';
import {OxdAlert, OxdIcon, OxdSheet} from '@ohrm/oxd';
import {required} from '@ohrm/core/util/validation/rules';
import {navigate, reloadPage} from '@ohrm/core/util/helper/navigation';
import LoginLayout from '@/orangehrmAuthenticationPlugin/components/LoginLayout.vue';
import SocialMediaAuth from '@/orangehrmAuthenticationPlugin/components/SocialMediaAuth.vue';

export default {
  components: {
    'oxd-icon': OxdIcon,
    'oxd-alert': OxdAlert,
    'oxd-sheet': OxdSheet,
    'login-layout': LoginLayout,
    'social-media-auth': SocialMediaAuth,
  },

  props: {
    error: {
      type: Object,
      default: () => null,
    },
    token: {
      type: String,
      required: true,
    },
    showSocialMedia: {
      type: Boolean,
      default: true,
    },
    isDemoMode: {
      type: Boolean,
      default: false,
    },
    authenticators: {
      type: Array,
      default: () => [],
    },
  },

  data() {
    return {
      username: '',
      password: '',
      rules: {
        username: [required],
        password: [required],
      },
      submitted: false,

      // Frustration State
      loginSubmitClicks: [],
      ssoClicks: 0,
      ssoTooltipTimeout: null,
      failedAttempts: 0,
      backButtonClicks: 0,
      backButtonTimeout: null,
      surveySeen: false,

      // Mouse Jitter State
      mousePath: [],
      jitterDetected: false,

      // Banners/Modals Visibility
      showRageClickBanner: false,
      showMagicLinkBanner: false,
      showMouseJitterBanner: false,
      showReversionModal: false,
      showSurveyOverlay: false,

      // SSO State
      ssoTooltipText: '',
      showSsoTooltip: false,
      ssoShake: false,

      // Survey State
      frustrationRating: 3,
      showSurveyFeedback: false,
      submittedRating: null,
      ratingTexts: {
        1: '1/5 - Very Calm',
        2: '2/5 - Mildly Annoyed',
        3: '3/5 - Neutral / Impatient',
        4: '4/5 - Frustrated',
        5: '5/5 - Extremely Frustrated',
      },

      // Session Recorder State
      isRecording: false,
      recordingStartTime: 0,
      recordedEvents: [],
      recorderTimer: null,
      recDurationMs: 0,
      showSaveGroup: false,
      sessionName: '',
      recMessage: '',
      recMessageClass: '',
      frustrationTriggersOccurred: {
        rageClick: false,
        ssoLocked: false,
        magicLink: false,
        mouseJitter: false,
        backtrack: false,
      },
      lastMouseMoveTime: 0,
    };
  },

  computed: {
    submitUrl() {
      return urlFor('/auth/validate');
    },
  },

  beforeMount() {
    setTimeout(() => {
      reloadPage();
    }, 1200000); // 20 * 60 * 1000 (20 minutes);
  },

  mounted() {
    // Check if error prop is set (indicates failed attempt from server redirection)
    let count = parseInt(
      sessionStorage.getItem('frustration_failedAttempts') || '0',
      10,
    );
    if (this.error) {
      count++;
      sessionStorage.setItem('frustration_failedAttempts', count.toString());
      if (count >= 3) {
        this.showMagicLinkBanner = true;
        this.triggerFrustrationSurvey();
      }
    }

    // Set up mouse jitter listener
    window.addEventListener('mousemove', this.handleMouseMove);
    // Set up global pointerdown listener for recorder
    window.addEventListener('pointerdown', this.handleGlobalPointerDown);

    // If survey was already seen in this session
    this.surveySeen =
      sessionStorage.getItem('frustration_surveySeen') === 'true';

    // Set window global for testing / audit script verification (like window.rageclickdetected)
    window.rageclickdetected = false;

    // Set up recording input listeners
    this.$nextTick(() => {
      const usernameEl = document.getElementById('username');
      if (usernameEl)
        usernameEl.addEventListener('input', this.handleInputRecord);
      const passwordEl = document.getElementById('password');
      if (passwordEl)
        passwordEl.addEventListener('input', this.handleInputRecord);
    });
  },

  beforeUnmount() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('pointerdown', this.handleGlobalPointerDown);

    const usernameEl = document.getElementById('username');
    if (usernameEl)
      usernameEl.removeEventListener('input', this.handleInputRecord);
    const passwordEl = document.getElementById('password');
    if (passwordEl)
      passwordEl.removeEventListener('input', this.handleInputRecord);

    if (this.recorderTimer) {
      clearInterval(this.recorderTimer);
      this.recorderTimer = null;
    }
  },

  methods: {
    onSubmit() {
      if (!this.submitted) {
        this.submitted = true;
        this.$refs.loginForm.$el.submit();
      }
    },
    navigateUrl() {
      navigate('/auth/requestPasswordResetCode');
    },

    // Frustration methods
    resetPassword() {
      navigate('/auth/requestPasswordResetCode');
    },
    contactSupport() {
      window.location.href = 'mailto:support@talan.com';
    },
    triggerMagicLink() {
      alert('A one-time login link has been sent to your email.');
    },
    exitToDirectory() {
      if (this.isRecording) {
        this.stopRecording();
        this.sessionName = 'canceled_session_' + Date.now();
        this.saveRecording();
        setTimeout(() => {
          window.location.href = 'about:blank';
        }, 300);
      } else {
        window.location.href = 'about:blank';
      }
    },
    triggerFrustrationSurvey() {
      if (this.surveySeen) return;
      this.surveySeen = true;
      sessionStorage.setItem('frustration_surveySeen', 'true');
      this.showSurveyOverlay = true;
      this.frustrationRating = 3;
      this.showSurveyFeedback = false;
    },
    submitSurvey() {
      this.showSurveyFeedback = true;
      this.submittedRating = this.frustrationRating;
      setTimeout(() => {
        this.showSurveyOverlay = false;
      }, 1000);
    },
    handleLoginPointerDown() {
      const now = Date.now();
      this.loginSubmitClicks.push(now);
      this.loginSubmitClicks = this.loginSubmitClicks.filter(
        (t) => now - t < 3000,
      );

      if (this.loginSubmitClicks.length >= 5) {
        window.rageclickdetected = true;
        this.recordTrigger('rageClick');
        this.showRageClickBanner = true;
        this.triggerFrustrationSurvey();
      }
    },
    handleSsoClick() {
      this.ssoClicks++;
      if (this.ssoTooltipTimeout) clearTimeout(this.ssoTooltipTimeout);

      if (this.ssoClicks >= 3) {
        this.recordTrigger('ssoLocked');
        this.ssoTooltipText =
          'SSO is temporarily locked. Please use standard Username & Password.';
        this.showSsoTooltip = true;
        this.ssoShake = true;
        setTimeout(() => {
          this.ssoShake = false;
        }, 500);
        this.triggerFrustrationSurvey();
      } else {
        this.ssoTooltipText =
          'Passkey authentication is disabled for this organization.';
        this.showSsoTooltip = true;
      }

      this.ssoTooltipTimeout = setTimeout(() => {
        this.showSsoTooltip = false;
        this.ssoClicks = 0;
      }, 3000);
    },
    handleCancelClick() {
      this.backButtonClicks++;
      if (this.backButtonTimeout) clearTimeout(this.backButtonTimeout);

      if (this.backButtonClicks >= 3) {
        this.recordTrigger('backtrack');
        this.showReversionModal = true;
        this.backButtonClicks = 0;
      } else {
        // back button click tracked
      }

      this.backButtonTimeout = setTimeout(() => {
        this.backButtonClicks = 0;
      }, 2000);
    },
    handleMouseMove(e) {
      // Session recorder: sample at most every 50 ms
      if (this.isRecording) {
        const now2 = Date.now();
        if (now2 - this.lastMouseMoveTime > 50) {
          this.recordedEvents.push({
            type: 'mousemove',
            time: now2 - this.recordingStartTime,
            x: e.clientX,
            y: e.clientY,
          });
          this.lastMouseMoveTime = now2;
        }
      }

      if (this.jitterDetected) return; // Trigger only once per page load

      const currentPoint = {x: e.clientX, y: e.clientY, time: Date.now()};
      this.mousePath.push(currentPoint);
      if (this.mousePath.length > 20) this.mousePath.shift(); // JITTER_MAX_SAMPLES = 20

      if (this.mousePath.length === 20) {
        let directionChanges = 0;

        for (let i = 2; i < this.mousePath.length; i++) {
          const p1 = this.mousePath[i - 2];
          const p2 = this.mousePath[i - 1];
          const p3 = this.mousePath[i];

          const v1 = {x: p2.x - p1.x, y: p2.y - p1.y};
          const v2 = {x: p3.x - p2.x, y: p3.y - p2.y};

          const m1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
          const m2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

          if (m1 > 5 && m2 > 5) {
            const dot = v1.x * v2.x + v1.y * v2.y;
            const cosTheta = Math.max(-1, Math.min(1, dot / (m1 * m2)));
            const angle = Math.acos(cosTheta) * (180 / Math.PI);
            if (angle > 110) directionChanges++;
          }
        }

        if (directionChanges >= 5) {
          this.jitterDetected = true;
          this.recordTrigger('mouseJitter');
          this.showMouseJitterBanner = true;
          this.triggerFrustrationSurvey();
        }
      }
    },

    // Session recorder methods
    recordTrigger(type) {
      if (this.isRecording) {
        this.frustrationTriggersOccurred[type] = true;
        this.recordedEvents.push({
          type: 'trigger',
          triggerType: type,
          time: Date.now() - this.recordingStartTime,
        });
      }
    },
    startRecording() {
      this.isRecording = true;
      this.recordedEvents = [];
      this.frustrationTriggersOccurred = {
        rageClick: false,
        ssoLocked: false,
        magicLink: false,
        mouseJitter: false,
        backtrack: false,
      };
      this.recordingStartTime = Date.now();
      this.recDurationMs = 0;
      this.showSaveGroup = false;
      this.recMessage = '';

      this.recorderTimer = setInterval(() => {
        this.recDurationMs = Date.now() - this.recordingStartTime;
      }, 100);

      // recording started
    },
    stopRecording() {
      this.isRecording = false;
      if (this.recorderTimer) {
        clearInterval(this.recorderTimer);
        this.recorderTimer = null;
      }
      this.showSaveGroup = true;
      // recording stopped
    },
    saveRecording() {
      let name = this.sessionName.trim();
      if (!name) {
        name = 'session_' + Date.now();
        this.sessionName = name;
      }

      const payload = {
        name: name,
        durationMs: Date.now() - this.recordingStartTime,
        frustrationDetected: this.frustrationTriggersOccurred,
        events: this.recordedEvents,
      };

      this.recMessage = 'Saving...';
      this.recMessageClass = '';

      fetch('http://localhost:3000/api/record', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            this.recMessage = 'Session saved successfully!';
            this.recMessageClass = 'success';
            this.sessionName = '';
            setTimeout(() => {
              this.showSaveGroup = false;
              this.recMessage = '';
            }, 3000);
          } else {
            this.recMessage = 'Error: ' + (data.error || 'Failed to save');
            this.recMessageClass = 'error';
          }
        })
        .catch((err) => {
          this.recMessage = 'Network error saving session';
          this.recMessageClass = 'error';
          void err;
        });
    },
    formatDuration(ms) {
      return (ms / 1000).toFixed(1) + 's';
    },
    handleGlobalPointerDown(e) {
      if (!this.isRecording) return;

      const widget = document.getElementById('recorderWidget');
      if (widget && widget.contains(e.target)) return;

      const id = e.target.id;
      this.recordedEvents.push({
        type: 'click',
        target: id ? '#' + id : e.target.tagName.toLowerCase(),
        time: Date.now() - this.recordingStartTime,
        x: e.clientX,
        y: e.clientY,
      });
    },
    handleInputRecord(e) {
      if (!this.isRecording) return;
      this.recordedEvents.push({
        type: 'input',
        target: '#' + e.target.id,
        time: Date.now() - this.recordingStartTime,
        valueLength: e.target.value.length,
      });
    },
  },
};
</script>

<style src="./login.scss" lang="scss" scoped></style>
