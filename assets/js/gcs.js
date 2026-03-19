const templateHTML = await fetch('/templates/gcs/index.html').then(res => res.text());

export default {
  template: templateHTML,
  props: ['catalogs', 'routeParam', 'userHistory'],
  data() {
    return {
      cases: [], 
      currentIndex: 0, 
      practiceCount: 1, 
      
      latestActionName: "系統提示",
      latestReaction: "🩺 抵達現場，請點擊上方按鈕測試患者反應，並給出 GCS 評分。",
      
      userE: null, userV: null, userM: null,
      showResult: false, isActionInProgress: false,
      showHelperText: false,

      actionProgress: { call: false, tap: false, pain: false, talk: false, motor: false, motorPain: false },
   
      fixedActions: [
        { id: 'call', name: '呼叫患者', icon: 'fa-bullhorn', req: null },
        { id: 'tap', name: '拍肩呼叫', icon: 'fa-hand', req: 'call' },
        { id: 'pain', name: '疼痛刺激', icon: 'fa-bolt', req: 'tap' },
        { id: 'talk', name: '對話測試', icon: 'fa-comment-medical', req: null },
        { id: 'motor', name: '運動測試', icon: 'fa-person-walking', req: null },
        { id: 'motorPain', name: '運動測試 疼痛刺激', icon: 'fa-bolt', req: 'motor' }
      ]
    }
  },
  watch: {
    catalogs: {
      immediate: true,
      deep: true,
      handler(newVals) {
        if (newVals && newVals.gcs && newVals.gcs.length > 0 && this.cases.length === 0) {
          this.fetchGcs();
        }
      }
    }
  },
  computed: {
    currentCase() { return this.cases[this.currentIndex] || {}; },
    userTotal() {
      if (this.userE && this.userV && this.userM) return this.userE + this.userV + this.userM;
      return '-';
    },
    isCorrect() {
      if (!this.currentCase.answer || !this.showResult) return false;
      const ans = this.currentCase.answer;
      return this.userE === ans.e && this.userV === ans.v && this.userM === ans.m;
    }
  },
  methods: {
    shuffleArray(array) {
      let newArr = [...array];
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    },
    async fetchGcs() {
      try {
        let allCases = [];
        for (let item of this.catalogs.gcs) {
          const res = await fetch('/data/gcs/' + item.file);
          const data = await res.json();
          allCases = allCases.concat(data);
        }
        this.cases = this.shuffleArray(allCases);
        this.currentIndex = 0;
        this.practiceCount = 1;
        this.resetCaseState();
      } catch (e) { 
        this.$emit('show-toast', { msg: '讀取 GCS 題庫失敗。', type: 'error' });
      }
    },
    resetCaseState() {
      this.userE = null; this.userV = null; this.userM = null;
      this.showResult = false;
      this.actionProgress = { call: false, tap: false, pain: false, talk: false, motor: false, motorPain: false };
      this.latestActionName = "系統提示";
      this.latestReaction = "🩺 抵達現場，請點擊上方按鈕測試患者反應，並給出 GCS 評分。";
      
      const container = this.$refs.gcsContainer;
      if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
    },
    doAction(action) {
      if (this.showResult || this.isActionInProgress) return;
      if (action.req && !this.actionProgress[action.req]) {
        this.$emit('show-toast', { msg: '請依序執行評估步驟！', type: 'error' });
        return;
      }

      this.isActionInProgress = true;
      this.latestActionName = action.name;
      this.latestReaction = "測試中...";
      
      setTimeout(() => {
        this.actionProgress[action.id] = true;
        this.latestReaction = this.currentCase.responses ? (this.currentCase.responses[action.name] || "（沒有反應）") : "資料格式錯誤";
        this.isActionInProgress = false;
      }, 500); 
    },
    checkAnswer() {
      if (!this.userE || !this.userV || !this.userM) {
        this.$emit('show-toast', { msg: '請完整選擇 E、V、M 的分數！', type: 'error' });
        return;
      }
      this.showResult = true;
    },
    nextCase() {
      this.practiceCount++;
      if (this.currentIndex + 1 < this.cases.length) {
        this.currentIndex++;
      } else {
        this.cases = this.shuffleArray(this.cases);
        this.currentIndex = 0;
        this.$emit('show-toast', { msg: '題庫已全數練習完畢，已重新洗牌！', type: 'success' });
      }
      this.resetCaseState();
    }
  }
}