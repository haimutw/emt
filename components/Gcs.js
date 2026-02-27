export default {
  props: ['catalogs', 'routeParam', 'userHistory'],
  data() {
    return {
      cases: [], 
      currentIndex: 0, 
      practiceCount: 1, 
      
      latestActionName: "提示",
      latestReaction: "抵達現場，請點擊上方按鈕測試患者反應，並給出評分。",
      
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
        { id: 'motorPain', name: '運動刺激', icon: 'fa-bolt', req: 'motor' }
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
          const res = await fetch('./data/gcs/' + item.file);
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
  },
  template: `
    <div class="bg-slate-50 dark:bg-slate-900 md:rounded-2xl shadow-sm border-x border-b md:border-t border-slate-200 dark:border-slate-700 relative overflow-hidden flex flex-col w-full h-full transition-colors">
      
      <div v-if="cases.length === 0" class="flex-1 flex flex-col items-center justify-center">
        <i class="fa-solid fa-spinner fa-spin-pulse text-4xl text-medical-blue dark:text-blue-400 mb-4"></i>
        <p class="text-slate-500 font-bold tracking-widest">載入題庫中...</p>
      </div>
      
      <div v-else class="flex flex-col flex-1 h-full relative overflow-hidden">
        
        <div class="z-30 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 p-2.5 md:p-4 flex justify-between items-center shadow-sm shrink-0 transition-colors">
          <div class="flex items-center gap-2 md:gap-3 px-2">
            <i class="fa-solid fa-brain text-xl md:text-2xl text-medical-blue dark:text-blue-400"></i>
            <h3 class="font-black text-base md:text-xl text-slate-800 dark:text-slate-100">GCS 練習</h3>
          </div>
          <div class="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-medical-blue dark:text-blue-400 px-3 py-1 md:px-4 md:py-1.5 rounded-xl text-xs md:text-sm font-bold shadow-sm flex items-center gap-2">
            <i class="fa-solid fa-infinity"></i> 練習數: {{ practiceCount }}
          </div>
        </div>
        
        <div ref="gcsContainer" class="p-3 md:p-5 flex-1 overflow-y-auto overscroll-none no-scrollbar w-full scroll-smooth">
          <div class="flex flex-col lg:grid lg:grid-cols-12 gap-4 md:gap-6 w-full h-full">
            
            <div class="lg:col-span-5 flex flex-col gap-3 md:gap-4 w-full h-full">
              <div class="p-4 md:p-5 rounded-2xl shadow-sm border-2 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shrink-0">
                <h3 class="font-black text-sm mb-2 uppercase flex items-center gap-2 text-medical-blue dark:text-blue-400"><i class="fa-solid fa-clipboard-user"></i> 情境宣示</h3>
                <p class="text-sm md:text-base leading-relaxed font-bold text-slate-700 dark:text-slate-200">{{ currentCase.description }}</p>
              </div>

              <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 md:p-4 shrink-0">
                <h4 class="text-xs font-black text-slate-400 uppercase border-b border-slate-100 dark:border-slate-700 pb-2 mb-3"><i class="fa-solid fa-stethoscope mr-2"></i> 選擇測試項目</h4>
                <div class="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <button v-for="act in fixedActions" :key="act.id" @click="doAction(act)" :disabled="showResult || (act.req && !actionProgress[act.req])" 
                    :class="['py-2 px-2 rounded-xl border-2 text-xs md:text-sm font-bold transition-all shadow-sm flex flex-col items-center justify-center gap-1 active:scale-95', 
                             showResult ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-400' : 
                             (act.req && !actionProgress[act.req]) ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400' : 
                             actionProgress[act.id] ? 'border-medical-blue dark:border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-medical-blue dark:text-blue-400' : 
                             'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-medical-blue dark:hover:border-blue-500 hover:text-medical-blue dark:hover:text-blue-400 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30']">
                    <i :class="['fa-solid md:text-lg mb-0.5', act.icon]"></i>
                    {{ act.name }}
                  </button>
                </div>
              </div>

              <transition name="fade-slide" mode="out-in">
                <div :key="latestActionName" class="flex-1 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-2xl shadow-md border-2 border-blue-200 dark:border-blue-800 p-4 md:p-6 flex flex-col items-center justify-center text-center min-h-[140px] relative overflow-hidden">
                  <div class="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -z-10"></div>
                  <div v-if="isActionInProgress" class="flex flex-col items-center gap-2 text-medical-blue dark:text-blue-400">
                    <i class="fa-solid fa-spinner fa-spin-pulse text-3xl"></i>
                    <p class="font-bold tracking-widest text-xs animate-pulse">{{ latestActionName }}中...</p>
                  </div>
                  <div v-else class="w-full">
                    <span class="inline-block bg-medical-blue text-white px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold tracking-widest mb-2 shadow-sm">
                      <i class="fa-solid fa-comment-medical mr-1"></i>{{ latestActionName }}
                    </span>
                    <p class="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 leading-snug">{{ latestReaction }}</p>
                  </div>
                </div>
              </transition>
            </div>

            <div class="lg:col-span-7 flex flex-col w-full h-full relative">
              <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm rounded-2xl p-4 md:p-5 w-full flex flex-col h-full transition-colors relative">
                
                <div class="flex flex-wrap justify-between items-center gap-3 mb-3 md:mb-4 border-b border-slate-100 dark:border-slate-700 pb-3 shrink-0">
                  <div class="flex items-center gap-2 md:gap-3">
                    <i class="fa-solid fa-calculator text-xl md:text-2xl text-medical-red dark:text-red-500"></i>
                    <h3 class="font-black text-base md:text-xl text-slate-800 dark:text-slate-100">GCS 評估</h3>
                  </div>
                  
                  <div class="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end">
                    <div class="flex items-center bg-slate-100 dark:bg-slate-700/50 rounded-full p-0.5 border border-slate-200 dark:border-slate-600 shrink-0">
                      <button @click="showHelperText = false" :class="['px-3 py-1 rounded-full text-[10px] md:text-xs font-bold transition-all', !showHelperText ? 'bg-white dark:bg-slate-800 shadow-sm text-medical-blue dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300']">數字</button>
                      <button @click="showHelperText = true" :class="['px-3 py-1 rounded-full text-[10px] md:text-xs font-bold transition-all', showHelperText ? 'bg-white dark:bg-slate-800 shadow-sm text-medical-blue dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300']">提示</button>
                    </div>
                    
                    <div class="bg-slate-800 dark:bg-slate-900 text-white px-3 py-1.5 rounded-lg font-mono font-black text-sm md:text-base shadow-inner border border-slate-600 shrink-0 flex items-center">
                      E{{ userE || '-' }} V{{ userV || '-' }} M{{ userM || '-' }} <span class="text-[10px] md:text-xs font-sans text-slate-400 ml-1.5 md:ml-2">Total:</span> <span class="text-green-400 ml-1">{{ userTotal }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex-1 relative flex flex-col">
                  <transition name="fade-slide" mode="out-in">
                    
                    <div v-if="!showResult" key="scoring" class="flex flex-col justify-between h-full gap-2">
                      <div class="space-y-2 md:space-y-3 flex-1 overflow-y-auto no-scrollbar pr-1">
                        
                        <div class="bg-slate-50 dark:bg-slate-900/50 p-2 md:p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                          <p class="font-black text-slate-700 dark:text-slate-200 mb-2 text-xs md:text-sm"><span class="bg-blue-100 dark:bg-blue-900/50 text-medical-blue dark:text-blue-400 px-1.5 py-0.5 rounded mr-1.5">E</span>睜眼反應</p>
                          <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <button v-for="val in [4,3,2,1]" :key="'e'+val" @click="userE = val" 
                              :class="['border-2 transition-all shadow-sm active:scale-95 flex flex-col items-center justify-center py-2 md:py-3 rounded-xl gap-0.5', 
                                       userE === val ? 'bg-medical-blue border-medical-blue text-white shadow-md transform scale-[1.05]' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-medical-blue dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30']">
                              <span class="text-xl md:text-2xl font-black">{{ val }}</span>
                              <span v-if="showHelperText" class="text-[11px] md:text-xs font-bold leading-tight mt-0.5">{{ ['沒有反應', '疼痛刺激睜眼', '呼喚睜眼', '主動睜眼'][val-1] }}</span>
                            </button>
                          </div>
                        </div>

                        <div class="bg-slate-50 dark:bg-slate-900/50 p-2 md:p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                          <p class="font-black text-slate-700 dark:text-slate-200 mb-2 text-xs md:text-sm"><span class="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded mr-1.5">V</span>最佳語言</p>
                          <div class="grid grid-cols-3 md:grid-cols-5 gap-2">
                            <button v-for="val in [5,4,3,2,1]" :key="'v'+val" @click="userV = val" 
                              :class="['border-2 transition-all shadow-sm active:scale-95 flex flex-col items-center justify-center py-2 md:py-3 px-1 rounded-xl gap-0.5', 
                                       userV === val ? 'bg-green-600 border-green-600 text-white shadow-md transform scale-[1.05]' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-green-600 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30']">
                              <span class="text-xl md:text-2xl font-black">{{ val }}</span>
                              <span v-if="showHelperText" class="text-[10px] md:text-[11px] font-bold leading-tight mt-0.5">{{ ['沒有反應', '只能發出聲音', '只能說出單詞', '回答錯誤', '回答正確'][val-1] }}</span>
                            </button>
                          </div>
                        </div>

                        <div class="bg-slate-50 dark:bg-slate-900/50 p-2 md:p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                          <p class="font-black text-slate-700 dark:text-slate-200 mb-2 text-xs md:text-sm"><span class="bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded mr-1.5">M</span>最佳運動</p>
                          <div class="grid grid-cols-3 md:grid-cols-6 gap-2">
                            <button v-for="val in [6,5,4,3,2,1]" :key="'m'+val" @click="userM = val" 
                              :class="['border-2 transition-all shadow-sm active:scale-95 flex flex-col items-center justify-center py-2 md:py-3 px-1 rounded-xl gap-0.5', 
                                       userM === val ? 'bg-orange-600 border-orange-600 text-white shadow-md transform scale-[1.05]' : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-orange-600 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30']">
                              <span class="text-xl md:text-2xl font-black">{{ val }}</span>
                              <span v-if="showHelperText" class="text-[10px] md:text-[11px] font-bold leading-tight mt-0.5">{{ ['沒有反應', '異常伸展', '疼痛刺激肢體屈曲', '疼痛刺激肢體僵直', '定位疼痛刺激', '聽從指示'][val-1] }}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      <button @click="checkAnswer" class="mt-2 w-full py-3 bg-slate-800 dark:bg-blue-600 text-white rounded-xl font-black text-base md:text-lg shadow-md hover:bg-slate-700 dark:hover:bg-blue-700 transition-all active:scale-[0.98] border-2 border-slate-600 dark:border-blue-400 shrink-0">
                        <i class="fa-solid fa-paper-plane mr-2"></i> 提交評估結果
                      </button>
                    </div>

                    <div v-else key="result" class="flex flex-col justify-between h-full">
                      <div class="bg-slate-50 dark:bg-slate-800/80 p-4 md:p-5 rounded-xl border-2 h-full flex flex-col" :class="isCorrect ? 'border-green-400 dark:border-green-600' : 'border-red-400 dark:border-red-600'">
                        
                        <div class="flex items-center gap-3 mb-3 border-b border-slate-200 dark:border-slate-700 pb-3 shrink-0">
                          <i :class="['fa-solid text-3xl', isCorrect ? 'fa-circle-check text-green-500' : 'fa-triangle-exclamation text-red-500']"></i>
                          <div>
                            <h4 :class="['font-black text-lg md:text-xl', isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400']">{{ isCorrect ? '判斷完全正確！' : '判斷有誤，請看解析' }}</h4>
                            <p class="text-xs font-bold text-slate-500 mt-0.5">正確總分：{{currentCase.answer.e + currentCase.answer.v + currentCase.answer.m}} 分</p>
                          </div>
                        </div>

                        <div class="grid grid-cols-3 gap-2 mb-3 shrink-0">
                          <div class="text-center p-2 rounded-xl border" :class="userE === currentCase.answer.e ? 'bg-green-100/50 border-green-200 dark:bg-green-900/30' : 'bg-red-100/50 border-red-200 dark:bg-red-900/30'">
                            <p class="text-[10px] font-bold text-slate-500 mb-0.5">E (睜眼反應)</p>
                            <p class="font-black text-base md:text-lg" :class="userE === currentCase.answer.e ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{userE}} <span class="text-[10px] font-normal text-slate-400">/ 正解 {{currentCase.answer.e}}</span></p>
                          </div>
                          <div class="text-center p-2 rounded-xl border" :class="userV === currentCase.answer.v ? 'bg-green-100/50 border-green-200 dark:bg-green-900/30' : 'bg-red-100/50 border-red-200 dark:bg-red-900/30'">
                            <p class="text-[10px] font-bold text-slate-500 mb-0.5">V (語言反應)</p>
                            <p class="font-black text-base md:text-lg" :class="userV === currentCase.answer.v ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{userV}} <span class="text-[10px] font-normal text-slate-400">/ 正解 {{currentCase.answer.v}}</span></p>
                          </div>
                          <div class="text-center p-2 rounded-xl border" :class="userM === currentCase.answer.m ? 'bg-green-100/50 border-green-200 dark:bg-green-900/30' : 'bg-red-100/50 border-red-200 dark:bg-red-900/30'">
                            <p class="text-[10px] font-bold text-slate-500 mb-0.5">M (運動反應)</p>
                            <p class="font-black text-base md:text-lg" :class="userM === currentCase.answer.m ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{userM}} <span class="text-[10px] font-normal text-slate-400">/ 正解 {{currentCase.answer.m}}</span></p>
                          </div>
                        </div>

                        <div class="flex-1 overflow-y-auto no-scrollbar bg-blue-50/50 dark:bg-slate-900/50 p-3 md:p-4 rounded-xl border border-blue-100 dark:border-slate-700">
                          <span class="font-black text-medical-blue dark:text-blue-400 text-[11px] md:text-xs tracking-widest block mb-1.5"><i class="fa-solid fa-chalkboard-user mr-1.5"></i>解析</span>
                          <p class="text-slate-700 dark:text-slate-300 text-xs md:text-sm leading-relaxed font-bold">{{ currentCase.explanation }}</p>
                        </div>
                      </div>

                      <button @click="nextCase" class="mt-3 w-full py-3 bg-medical-blue dark:bg-blue-600 text-white rounded-xl font-black text-base md:text-lg shadow-md hover:bg-blue-800 dark:hover:bg-blue-700 transition-all active:scale-95 border-2 border-blue-400 shrink-0">
                        前往下一題 <i class="fa-solid fa-arrow-right ml-2"></i>
                      </button>
                    </div>

                  </transition>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
}