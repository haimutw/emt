import Home from './home.js';
import Material from './material.js';
import Mcq from './mcq.js';
import Gcs from './gcs.js';
import Scenario from './scenario.js';
import { catalogs } from './config.js';

const { createApp } = Vue;

createApp({
  components: { Home, Material, Mcq, Gcs, Scenario },
  data() {
    return {
      currentView: 'Home',
      routeParam: null,
      isDark: false,
      user: null,
      googleTokenClient: null,
      userHistory: { materials: [], mcq: {}, gcs: {}, last_material: null },
      toast: { visible: false, message: '', type: 'success' },
      toastTimer: null,
      catalogs: catalogs
    }
  },
  mounted() {
    this.isDark = localStorage.getItem('theme_preference') === 'dark';
    this.applyTheme();

    const savedUser = localStorage.getItem('emt_user');
    if (savedUser) {
      this.user = JSON.parse(savedUser);
      this.loadUserHistory();
    }

    window.addEventListener('popstate', this.parseRoute);
    this.parseRoute();

    setTimeout(() => {
      if (window.google) {
        this.googleTokenClient = google.accounts.oauth2.initTokenClient({
          client_id: "84232068621-ffnj02d13eoilf2j7nogjoqh53sn09rd.apps.googleusercontent.com",
          scope: "profile email",
          callback: async (tokenResponse) => {
            if (tokenResponse && tokenResponse.access_token) {
              this.fetchGoogleUserProfile(tokenResponse.access_token);
            }
          }
        });
      }
    }, 500);
  },
  unmounted() {
    window.removeEventListener('popstate', this.parseRoute);
  },
  methods: {
    getRepoName() {
      return '/emt'; 
    },

    toggleTheme() {
      this.isDark = !this.isDark;
      localStorage.setItem('theme_preference', this.isDark ? 'dark' : 'light');
      this.applyTheme();
    },
    
    applyTheme() {
      if (this.isDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    },

    showToast(payload) {
      if (this.toastTimer) clearTimeout(this.toastTimer);
      const msg = typeof payload === 'string' ? payload : payload.msg;
      const type = payload.type || 'success';
      this.toast = { visible: true, message: msg, type: type };
      this.toastTimer = setTimeout(() => {
        this.toast.visible = false;
      }, 3000);
    },

    login() {
      if (this.googleTokenClient) {
        this.googleTokenClient.requestAccessToken();
      } else {
        this.showToast({ msg: "Google 登入系統尚未載入完成，請稍後再試。", type: "error" });
      }
    },

    async fetchGoogleUserProfile(accessToken) {
      try {
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const data = await res.json();
        this.user = { name: data.name, email: data.email, picture: data.picture };

        localStorage.setItem('emt_user', JSON.stringify(this.user));
        this.loadUserHistory();
        this.showToast({ msg: `歡迎回來，${this.user.name}！`, type: "success" });
      } catch (error) {
        this.showToast({ msg: "登入失敗，請稍後再試。", type: "error" });
      }
    },

    logout() {
      this.user = null;
      this.userHistory = { materials: [], mcq: {}, gcs: {}, last_material: null };
      localStorage.removeItem('emt_user');
      this.showToast({ msg: "已成功登出。", type: "success" });
    },

    loadUserHistory() {
      if (!this.user) return;
      const historyKey = `emt_history_${this.user.email}`;
      const savedHistory = localStorage.getItem(historyKey);
      if (savedHistory) {
        this.userHistory = JSON.parse(savedHistory);
      } else {
        this.userHistory = { materials: [], mcq: {}, gcs: {}, last_material: null };
      }
    },

    saveUserHistory() {
      if (!this.user) return;
      const historyKey = `emt_history_${this.user.email}`;
      localStorage.setItem(historyKey, JSON.stringify(this.userHistory));
    },

    handleHistoryUpdate(payload) {
      if (!this.user) {
        this.showToast({ msg: "請先登入 Google 帳號以儲存學習進度！", type: "error" });
        return;
      }

      if (payload.type === 'materials') {
        if (!this.userHistory.materials.includes(payload.value)) this.userHistory.materials.push(payload.value);
      } else if (payload.type === 'last_material') {
        this.userHistory.last_material = payload.value;
      } else if (payload.type === 'mcq' || payload.type === 'gcs') {
        this.userHistory[payload.type][payload.key] = payload.value;
      }

      this.saveUserHistory();
    },

    navigate(view, param = null) {
      const repo = this.getRepoName();
      const path = param ? `${repo}/${view}/${param}` : `${repo}/${view}`;
      window.history.pushState({ view, param }, '', path);
      this.currentView = view;
      this.routeParam = param;
    },

    parseRoute() {
      const repo = this.getRepoName();
      let path = window.location.pathname;

      if (path.startsWith(repo)) {
        path = path.slice(repo.length);
      }

      const parts = path.split('/').filter(Boolean);

      const view = parts[0] || 'Home';
      const param = parts[1] || null;

      const validViews = ['Home', 'Material', 'Mcq', 'Gcs', 'Scenario'];

      if (validViews.includes(view)) {
        this.currentView = view;
        this.routeParam = param;
      } else {
        this.currentView = 'Home';
        this.routeParam = null;
        window.history.replaceState(null, '', `${repo}/Home`);
      }
    },

    navClass(viewName) {
      const base = 'px-3 py-1.5 md:px-5 md:py-2.5 rounded-full text-xs md:text-sm font-bold transition-all duration-300 border flex items-center whitespace-nowrap ';
      if (this.currentView === viewName) {
        return viewName === 'Scenario'
          ? base + 'bg-medical-red dark:bg-red-600 text-white border-medical-red dark:border-red-600 shadow-md'
          : base + 'bg-medical-blue dark:bg-blue-600 text-white border-medical-blue dark:border-blue-600 shadow-md';
      }
      return base + 'text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800';
    }
  }
}).mount('#app');