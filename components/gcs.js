export default {
  props: ['catalogs', 'routeParam'],
  data() {
    return {
      currentFile: null, cases: [], currentIndex: 0,
      actionLogs: [], userE: null, userV: null, userM: null,
      showResult: false, showCompletionModal: false, correctCount: 0,
      isActionInProgress: false, gcsScores: {}
    }
  },
  created() { this.loadHistory(); },
  watch: {
    routeParam: {
      immediate: true,
      handler(newFilename) {
        if (newFilename) this.fetchGcs(newFilename);
        else this.resetState();
      }
    }
  },
  computed: {
    currentCase() { return this.cases[this.currentIndex]; },
    userTotal() {
      if (this.userE && this.userV && this.userM) return this.userE + this.userV + this.userM;
      return '-';
    },
    isCorrect() {
      if (!this.currentCase || !this.showResult) return false;
      const ans = this.currentCase.answer;
      return this.userE === ans.e && this.userV === ans.v && this.userM === ans.m;
    }
  },
  methods: {
    openGcs(filename) { window.location.hash = `#Gcs/${filename}`; },
    goBack() { window.location.hash = `#Gcs`; },
    resetState() {
      this.currentFile = null; this.showCompletionModal = false; this.showResult = false;
    },
    loadHistory() {
      const history = JSON.parse(localStorage.getItem('emt_history') || '{"gcs":{}}');
      this.gcsScores = history.gcs || {};
    },
    saveScore(filename, score) {
      const oldScore = this.gcsScores[filename] || 0;
      if (score >= oldScore) {
        this.gcsScores[filename] = score;
        const history = JSON.parse(localStorage.getItem('emt_history') || '{"gcs":{}}');
        history.gcs = this.gcsScores;
        localStorage.setItem('emt_history', JSON.stringify(history));
      }
    },
    async fetchGcs(filename) {
      try {
        const res = await fetch('./data/gcs/' + filename);
        this.cases = await res.json();
        this.currentFile = filename;
        this.currentIndex = 0;
        this.correctCount = 0;
        this.resetCaseState();
      } catch (e) { alert("讀取 GCS 題庫失敗。"); }
    },
    resetCaseState() {
      this.actionLogs = []; this.userE = null; this.userV = null; this.userM = null;
      this.showResult = false;
      this.actionLogs.push("🩺 抵達現場，請點擊上方按鈕測試患者反應，並於右側給出 GCS 評分。");
    },
    doAction(action) {
      if (this.showResult) return;
      this.isActionInProgress = true;
      setTimeout(() => {
        this.actionLogs.unshift(`[${action.name}] ${action.log}`);
        this.isActionInProgress = false;
      }, 600);
    },
    checkAnswer() {
      if (!this.userE || !this.userV || !this.userM) {
        alert("請完整選擇 E、V、M 的分數！"); return;
      }
      this.showResult = true;
      if (this.isCorrect) this.correctCount++;
    },
    nextCase() {
      if (this.currentIndex + 1 < this.cases.length) {
        this.currentIndex++;
        this.resetCaseState();
      } else {
        const finalScore = Math.round((this.correctCount / this.cases.length) * 100);
        this.saveScore(this.currentFile, finalScore);
        this.showCompletionModal = true;
      }
    }
  },
  template: `
    <div class="bg-slate-50 md:rounded-2xl shadow-sm border-x border-b md:border-t border-slate-200 relative overflow-hidden flex flex-col w-full min-h-[80vh] md:min-h-[85vh]">
      
      <transition name="fade-slide">
        <div v-if="showCompletionModal" class="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-center p-4 w-full h-full">
          <i class="fa-solid fa-brain text-7xl md:text-8xl text-yellow-400 mb-6 animate-pulse mt-10"></i>
          <h2 class="text-3xl md:text-5xl font-black text-white mb-4 tracking-widest">GCS 測驗完成</h2>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 w-full max-w-2xl mb-10 mt-6">
            <div class="bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-inner">
              <p class="text-slate-400 text-sm md:text-base font-bold mb-2">答對題數</p>
              <p class="text-5xl md:text-6xl font-black text-cyan-400">{{ correctCount }}<span class="text-2xl md:text-3xl text-slate-500"> / {{ cases.length }}</span></p>
            </div>
            <div class="bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-inner">
              <p class="text-slate-400 text-sm md:text-base font-bold mb-2">總結算分數</p>
              <p :class="['text-6xl md:text-7xl font-black', Math.round((correctCount/cases.length)*100) >= 80 ? 'text-green-400' : 'text-red-400']">{{ Math.round((correctCount/cases.length)*100) }} <span class="text-2xl font-medium">分</span></p>
            </div>
          </div>
          <button @click="goBack" class="px-10 py-4 w-full max-w-md bg-medical-blue text-white rounded-full font-bold text-lg md:text-xl hover:bg-blue-800 shadow-lg border-2 border-blue-400 transition-all">返回目錄</button>
        </div>
      </transition>

      <div v-if="!currentFile" class="p-5 md:p-10 flex-1 flex flex-col">
        <h2 class="text-2xl md:text-3xl font-bold text-medical-blue mb-6 md:mb-8 border-l-4 border-medical-blue pl-4 tracking-wide">選擇 GCS 練習題組</h2>
        <div class="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <button v-for="item in catalogs.gcs" :key="item.file" @click="openGcs(item.file)" class="text-left p-6 md:p-8 rounded-3xl border-2 border-slate-200 bg-white hover:border-medical-blue hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between h-full">
            <div v-if="gcsScores[item.file] !== undefined" class="absolute top-0 right-0 text-white px-3 py-1.5 rounded-bl-2xl font-bold text-[10px] md:text-xs shadow-sm bg-medical-blue">
              <i class="fa-solid fa-star mr-1"></i>最高分: {{ gcsScores[item.file] }}
            </div>
            <div>
              <i class="fa-solid fa-brain text-4xl md:text-5xl text-slate-300 group-hover:text-medical-blue mb-4 md:mb-6 block transition-colors mt-2"></i>
              <span class="font-black text-lg md:text-xl text-slate-700 group-hover:text-medical-blue leading-snug">{{ item.title }}</span>
            </div>
          </button>
        </div>
      </div>
      
      <div v-else class="flex flex-col flex-1 h-full relative">
        <div class="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 p-3 md:p-5 flex justify-between items-center shadow-sm shrink-0">
          <button @click="goBack" class="text-slate-500 hover:text-medical-blue text-sm md:text-base font-bold bg-slate-100 hover:bg-blue-50 px-4 py-2 md:px-5 md:py-2.5 rounded-full transition-colors flex items-center gap-2 border border-slate-200 shadow-sm"><i class="fa-solid fa-arrow-left"></i> <span class="hidden md:inline">返回</span></button>
          <div class="bg-blue-50 border border-blue-200 text-medical-blue px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-bold shadow-sm">
            進度: {{ currentIndex + 1 }} / {{ cases.length }}
          </div>
        </div>
        
        <div class="p-3 md:p-6 lg:p-8 flex-1 overflow-y-auto no-scrollbar w-full">
          <div class="flex flex-col lg:grid lg:grid-cols-12 gap-5 md:gap-8 w-full h-full">
            
            <div class="lg:col-span-5 flex flex-col gap-4 md:gap-6 w-full">
              <div class="p-5 md:p-8 rounded-2xl shadow-sm border-2 bg-white border-slate-200">
                <h3 class="font-black text-sm md:text-base mb-3 uppercase flex items-center gap-2 text-medical-blue"><i class="fa-solid fa-clipboard-user"></i> 病患情境</h3>
                <p class="text-base md:text-lg leading-relaxed font-medium text-slate-700">{{ currentCase.description }}</p>
              </div>

              <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6">
                <h4 class="text-xs md:text-sm font-black text-slate-400 uppercase border-b border-slate-100 pb-2 mb-3"><i class="fa-solid fa-stethoscope mr-2"></i> 執行反應測試</h4>
                <div class="flex flex-wrap gap-2 md:gap-3">
                  <button v-for="(act, idx) in currentCase.actions" :key="idx" @click="doAction(act)" :disabled="showResult" :class="['px-3 py-2 md:px-4 md:py-3 rounded-xl border-2 text-xs md:text-sm font-bold transition-all shadow-sm active:scale-95', showResult ? 'opacity-50 cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400' : 'border-slate-200 bg-white hover:border-medical-blue hover:text-medical-blue text-slate-700']">
                    {{ act.name }}
                  </button>
                </div>
              </div>

              <div class="bg-slate-800 rounded-2xl shadow-inner border border-slate-700 p-4 md:p-6 flex flex-col h-48 md:h-64 w-full relative">
                <div v-if="isActionInProgress" class="absolute inset-0 bg-slate-900/60 z-10 flex items-center justify-center rounded-2xl"><i class="fa-solid fa-spinner fa-spin text-3xl text-white"></i></div>
                <h4 class="text-xs font-black text-slate-400 uppercase mb-3 flex justify-between items-center border-b border-slate-700 pb-2">
                  <span><i class="fa-solid fa-list-ul mr-2"></i> 反應日誌</span><span class="text-[10px] opacity-70">最新在上方</span>
                </h4>
                <div class="overflow-y-auto no-scrollbar space-y-2 flex-1 w-full pr-1">
                  <div v-for="(log, idx) in actionLogs" :key="idx" class="text-slate-300 text-xs md:text-sm border-l-4 border-medical-blue pl-3 py-2 bg-slate-900/60 rounded-r-lg leading-relaxed font-medium">{{ log }}</div>
                </div>
              </div>
            </div>

            <div class="lg:col-span-7 flex flex-col w-full h-full relative">
              <div class="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 md:p-6 w-full flex flex-col relative">
                
                <div class="flex justify-between items-center mb-4 md:mb-6 border-b border-slate-100 pb-3">
                  <div class="flex items-center gap-3">
                    <i class="fa-solid fa-calculator text-2xl md:text-3xl text-medical-red"></i>
                    <h3 class="font-black text-lg md:text-2xl text-slate-800">GCS 評分面板</h3>
                  </div>
                  <div class="bg-slate-800 text-white px-4 py-2 rounded-xl font-mono font-black text-xl md:text-2xl shadow-inner">
                    E{{ userE || '-' }} V{{ userV || '-' }} M{{ userM || '-' }} <span class="text-sm md:text-base font-sans text-slate-400 ml-2">Total:</span> <span class="text-green-400">{{ userTotal }}</span>
                  </div>
                </div>

                <div class="space-y-4 md:space-y-6 flex-1 overflow-y-auto no-scrollbar pb-24" :class="{'opacity-50 pointer-events-none': showResult}">
                  <div>
                    <p class="font-black text-slate-700 mb-2 md:mb-3 text-sm md:text-base"><span class="bg-blue-100 text-medical-blue px-2 py-0.5 rounded mr-2">E</span>睜眼反應 (Eye)</p>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                      <button v-for="val in [4,3,2,1]" :key="'e'+val" @click="userE = val" :class="['py-2 md:py-3 rounded-xl border-2 font-bold text-xs md:text-sm transition-all', userE === val ? 'bg-medical-blue border-medical-blue text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-medical-blue hover:text-medical-blue']">{{ val }} - {{ ['無反應', '痛刺激睜眼', '聲音刺激睜眼', '主動睜眼'][val-1] }}</button>
                    </div>
                  </div>
                  <div>
                    <p class="font-black text-slate-700 mb-2 md:mb-3 text-sm md:text-base"><span class="bg-green-100 text-green-700 px-2 py-0.5 rounded mr-2">V</span>最佳語言 (Verbal)</p>
                    <div class="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
                      <button v-for="val in [5,4,3,2,1]" :key="'v'+val" @click="userV = val" :class="['py-2 md:py-3 rounded-xl border-2 font-bold text-xs md:text-sm transition-all', userV === val ? 'bg-green-600 border-green-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-green-600 hover:text-green-600']">{{ val }} - {{ ['無反應', '無意義聲音', '不適當字詞', '混亂', '定向力正常'][val-1] }}</button>
                    </div>
                  </div>
                  <div>
                    <p class="font-black text-slate-700 mb-2 md:mb-3 text-sm md:text-base"><span class="bg-orange-100 text-orange-700 px-2 py-0.5 rounded mr-2">M</span>最佳運動 (Motor)</p>
                    <div class="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
                      <button v-for="val in [6,5,4,3,2,1]" :key="'m'+val" @click="userM = val" :class="['py-2 md:py-3 rounded-xl border-2 font-bold text-xs md:text-sm transition-all', userM === val ? 'bg-orange-600 border-orange-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-600 hover:border-orange-600 hover:text-orange-600']">{{ val }} - {{ ['無反應', '異常伸展', '異常屈曲', '痛刺激退縮', '痛刺激定位', '遵從口令'][val-1] }}</button>
                    </div>
                  </div>
                </div>

                <div class="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-white border-t border-slate-100 rounded-b-2xl">
                  <button v-if="!showResult" @click="checkAnswer" class="w-full py-4 bg-slate-800 text-white rounded-xl font-black text-lg md:text-xl shadow-lg hover:bg-slate-700 transition-all active:scale-[0.98]">提交 GCS 評估</button>
                  
                  <div v-else class="w-full flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-xl shadow-inner border-2" :class="isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                    <div class="flex items-center gap-4 w-full md:w-auto">
                      <i :class="['fa-solid text-4xl', isCorrect ? 'fa-circle-check text-green-500' : 'fa-triangle-exclamation text-red-500']"></i>
                      <div>
                        <h4 :class="['font-black text-lg', isCorrect ? 'text-green-700' : 'text-red-700']">{{ isCorrect ? '判斷正確！' : '判斷錯誤' }}</h4>
                        <p class="text-xs md:text-sm font-bold text-slate-600 mt-1">正解：E{{currentCase.answer.e}} V{{currentCase.answer.v}} M{{currentCase.answer.m}} ({{currentCase.answer.e + currentCase.answer.v + currentCase.answer.m}}分)</p>
                      </div>
                    </div>
                    <button @click="nextCase" class="w-full md:w-auto px-6 py-3 bg-medical-blue text-white rounded-xl font-bold shadow-md hover:bg-blue-800 transition-all whitespace-nowrap">下一題 <i class="fa-solid fa-arrow-right ml-1"></i></button>
                  </div>
                </div>

              </div>
              
              <transition name="fade-slide">
                <div v-if="showResult" class="mt-4 bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm relative">
                  <span class="font-black text-medical-blue text-xs md:text-sm tracking-widest block mb-2"><i class="fa-solid fa-chalkboard-user mr-1.5"></i>教官解析</span>
                  <p class="text-slate-700 text-sm md:text-base leading-relaxed font-medium">{{ currentCase.explanation }}</p>
                </div>
              </transition>
              
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}