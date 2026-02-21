export default {
  props: ['catalogs', 'routeParam'],
  data() {
    return { 
      currentMcqFile: null, 
      mcqData: [], 
      userAnswers: [], 
      scoreResult: null, 
      showExplanations: false,
      showCompletionModal: false,
      mcqScores: {}
    }
  },
  created() {
    this.loadHistory();
  },
  watch: {
    routeParam: {
      immediate: true,
      handler(newFilename) {
        if (newFilename) {
          this.fetchMcq(newFilename);
        } else {
          this.currentMcqFile = null;
          this.showCompletionModal = false; 
          this.showExplanations = false;
        }
      }
    }
  },
  methods: {
    openMcq(filename) { window.location.hash = `#Mcq/${filename}`; },
    goBack() { window.location.hash = `#Mcq`; },
    
    loadHistory() {
      const history = JSON.parse(localStorage.getItem('emt_history') || '{"mcq":{}}');
      this.mcqScores = history.mcq || {};
    },

    saveScore(filename, score) {
      const oldScore = this.mcqScores[filename] || 0;
      if (score >= oldScore) {
        this.mcqScores[filename] = score;
        const history = JSON.parse(localStorage.getItem('emt_history') || '{"mcq":{}}');
        history.mcq = this.mcqScores;
        localStorage.setItem('emt_history', JSON.stringify(history));
      }
    },

    shuffleArray(array) {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    },

    async fetchMcq(filename) {
      try {
        const res = await fetch('./data/questions/' + filename);
        let rawData = await res.json();

        let questionPool = Array.isArray(rawData) ? rawData : rawData.questions;
        let limit = Array.isArray(rawData) ? null : rawData.test_info?.question_limit;

        this.shuffleArray(questionPool);

        if (limit && limit > 0 && limit < questionPool.length) {
          questionPool = questionPool.slice(0, limit);
        }

        let processedData = questionPool.map(q => {

          let mappedOptions = q.options.map((text, idx) => ({ 
            text: text, 
            isCorrect: (idx + 1) === q.answer 
          }));
          
          this.shuffleArray(mappedOptions);
          
          let newAnswerIndex = mappedOptions.findIndex(opt => opt.isCorrect);
          
          return { ...q, options: mappedOptions.map(opt => opt.text), answer: newAnswerIndex };
        });

        this.mcqData = processedData;
        this.currentMcqFile = filename;
        this.userAnswers = new Array(this.mcqData.length).fill(null);
        this.scoreResult = null; 
        this.showExplanations = false;
        this.showCompletionModal = false; 
      } catch (e) { alert("讀取題庫失敗，請確認路徑或 JSON 格式是否正確。"); }
    },

    selectAnswer(qIndex, optIndex) {
      if (this.showExplanations) return; 
      this.userAnswers[qIndex] = optIndex;
    },
    
    checkAnswers() {
      if (this.userAnswers.includes(null)) { alert("請將所有題目作答完畢！"); return; }
      
      let correct = 0;
      this.mcqData.forEach((q, i) => { if (this.userAnswers[i] === q.answer) correct++; });
      
      let scorePerQuestion = 100 / this.mcqData.length;
      this.scoreResult = Math.round(correct * scorePerQuestion);
      
      this.saveScore(this.currentMcqFile, this.scoreResult);

      this.showExplanations = true;
      this.showCompletionModal = true; 
      
      const container = this.$refs.mcqContainer;
      if(container) container.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    reviewExplanations() {
      this.showCompletionModal = false;
    }
  },
  template: `
    <div class="bg-slate-50 md:rounded-2xl shadow-sm border-x border-b md:border-t border-slate-200 relative overflow-hidden flex flex-col w-full min-h-[80vh] md:min-h-[85vh]">
      
      <transition name="fade-slide">
        <div v-if="showCompletionModal" class="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[100] flex flex-col items-center justify-center text-center p-4 overflow-y-auto w-full h-full">
          <i class="fa-solid fa-award text-7xl md:text-8xl text-yellow-400 mb-6 animate-bounce mt-10"></i>
          <h2 class="text-3xl md:text-5xl font-black text-white mb-4 tracking-widest">測驗完成</h2>
          <p class="text-slate-300 mb-10 max-w-2xl leading-relaxed text-sm md:text-lg px-2">你已經完成本單元的學科測驗！</p>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8 w-full max-w-2xl mb-10">
            <div class="bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-inner">
              <p class="text-slate-400 text-sm md:text-base font-bold mb-2">總結算分數</p>
              <p :class="['text-6xl md:text-7xl font-black', scoreResult >= 80 ? 'text-green-400' : 'text-red-400']">{{ scoreResult }} <span class="text-2xl font-medium">分</span></p>
            </div>
            <div class="bg-slate-800 rounded-2xl p-6 md:p-8 border border-slate-700 shadow-inner">
              <p class="text-slate-400 text-sm md:text-base font-bold mb-2">答對題數</p>
              <p class="text-5xl md:text-6xl font-black text-cyan-400">{{ Math.round((scoreResult / 100) * mcqData.length) }}<span class="text-2xl md:text-3xl text-slate-500"> / {{ mcqData.length }}</span></p>
            </div>
          </div>
          
          <div class="flex flex-col sm:flex-row gap-4 w-full max-w-2xl mb-10">
            <button @click="reviewExplanations" class="flex-1 px-8 py-4 bg-slate-700 text-white rounded-full font-bold text-lg md:text-xl hover:bg-slate-600 shadow-lg border-2 border-slate-500 transition-all"><i class="fa-solid fa-book-open-reader mr-2"></i>檢視錯題詳解</button>
            <button @click="goBack" class="flex-1 px-8 py-4 bg-medical-blue text-white rounded-full font-bold text-lg md:text-xl hover:bg-blue-800 shadow-lg border-2 border-blue-400 transition-all"><i class="fa-solid fa-arrow-left mr-2"></i>返回測驗目錄</button>
          </div>
        </div>
      </transition>

      <div v-if="!currentMcqFile" class="p-5 md:p-10 flex-1 flex flex-col">
        <h2 class="text-2xl md:text-3xl font-bold text-medical-blue mb-6 md:mb-8 border-l-4 border-medical-blue pl-4 tracking-wide">選擇測驗題組</h2>
        <div class="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          
          <button v-for="item in catalogs.questions" :key="item.file" @click="openMcq(item.file)" class="text-left p-6 md:p-8 rounded-3xl border-2 border-slate-200 bg-white hover:border-medical-blue hover:shadow-xl transition-all group flex flex-col justify-between h-full relative overflow-hidden">
            <div v-if="mcqScores[item.file] !== undefined" :class="['absolute top-0 right-0 text-white px-3 py-1.5 rounded-bl-2xl font-bold text-[10px] md:text-xs shadow-sm', mcqScores[item.file] >= 80 ? 'bg-green-500' : 'bg-yellow-500']">
              <i class="fa-solid fa-star mr-1"></i>最高分: {{ mcqScores[item.file] }}
            </div>
            <div>
              <i class="fa-solid fa-file-signature text-4xl md:text-5xl text-slate-300 group-hover:text-medical-blue mb-4 md:mb-6 block transition-colors mt-2"></i>
              <span class="font-black text-lg md:text-xl text-slate-700 group-hover:text-medical-blue leading-snug">{{ item.title }}</span>
            </div>
            <div class="mt-6 flex justify-end">
              <span class="text-xs md:text-sm font-bold text-slate-400 group-hover:text-medical-blue bg-slate-50 group-hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors border border-slate-100 group-hover:border-blue-100 shadow-sm">開始測驗 <i class="fa-solid fa-arrow-right ml-1"></i></span>
            </div>
          </button>
        </div>
      </div>
      
      <div v-else class="flex flex-col flex-1 h-full relative">
        <div class="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 p-3 md:p-5 flex justify-between items-center shadow-sm shrink-0">
          <div class="flex items-center gap-3 md:gap-4">
            <button @click="goBack" class="text-slate-500 hover:text-medical-blue w-10 h-10 md:w-auto md:px-5 md:py-2.5 rounded-full bg-slate-100 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 border border-slate-200 shadow-sm font-bold text-sm md:text-base">
              <i class="fa-solid fa-arrow-left"></i> <span class="hidden md:block">返回題庫</span>
            </button>
            <div v-if="!showExplanations" class="bg-blue-50 border border-blue-200 text-medical-blue px-3 py-1 md:px-4 md:py-1.5 rounded-lg text-xs md:text-sm font-bold shadow-sm">
              <i class="fa-solid fa-list-ol mr-1"></i> 共 {{ mcqData.length }} 題 / 每題 {{ Math.round((100 / mcqData.length) * 10) / 10 }} 分
            </div>
          </div>
          <div v-if="scoreResult !== null" class="bg-slate-800 text-white px-3 md:px-6 py-1.5 md:py-2 rounded-xl text-sm md:text-lg font-black shadow-inner flex items-center gap-2">
            <i class="fa-solid fa-star text-yellow-400"></i>
            得分: <span :class="scoreResult >= 80 ? 'text-green-400' : 'text-red-400'">{{ scoreResult }}</span>
          </div>
        </div>
        
        <div ref="mcqContainer" class="p-4 md:p-10 flex-1 overflow-y-auto no-scrollbar w-full flex flex-col items-center bg-slate-100">
          <div class="max-w-4xl w-full space-y-6 md:space-y-8 pb-10">
            
            <transition name="fade-slide">
              <div v-if="scoreResult !== null && !showCompletionModal" class="bg-slate-800 p-6 md:p-8 rounded-3xl shadow-xl border-2 border-slate-700 text-center relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="flex items-center gap-4">
                  <i :class="['fa-solid text-5xl md:text-6xl', scoreResult >= 80 ? 'fa-circle-check text-green-500' : 'fa-triangle-exclamation text-red-500']"></i>
                  <div class="text-left">
                    <h2 class="text-2xl md:text-3xl font-black text-white tracking-widest">測驗結算</h2>
                    <p class="text-slate-400 font-bold text-sm md:text-base mt-1">請檢視下方各題詳解</p>
                  </div>
                </div>
                <div :class="['text-5xl md:text-6xl font-black', scoreResult >= 80 ? 'text-green-400' : 'text-red-400']">
                  {{ scoreResult }}<span class="text-xl md:text-2xl font-bold ml-1 text-slate-400">分</span>
                </div>
              </div>
            </transition>

            <div v-for="(q, index) in mcqData" :key="q.id" class="bg-white p-5 md:p-8 rounded-2xl md:rounded-3xl shadow-sm border-2 border-slate-200 relative overflow-hidden transition-all hover:shadow-md">
              <div class="absolute top-0 left-0 bg-medical-blue text-white px-5 py-1.5 rounded-br-2xl font-mono text-sm font-bold shadow-sm">Q{{ index + 1 }}</div>
              <p class="font-black text-lg md:text-2xl text-slate-800 mb-6 mt-5 leading-relaxed tracking-wide">{{ q.question }}</p>
              <div class="space-y-3 md:space-y-4">
                <button v-for="(opt, optIndex) in q.options" :key="optIndex" @click="selectAnswer(index, optIndex)" :disabled="showExplanations" :class="['w-full text-left p-4 md:p-5 rounded-2xl border-2 transition-all flex items-center gap-3 md:gap-5 group outline-none', showExplanations ? 'cursor-not-allowed' : 'hover:border-medical-blue active:scale-[0.98]', userAnswers[index] === optIndex ? 'border-medical-blue bg-blue-50/50 shadow-sm' : 'border-slate-100 bg-white hover:bg-slate-50']">
                  <div :class="['w-6 h-6 md:w-7 md:h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors', userAnswers[index] === optIndex ? 'border-medical-blue bg-white' : 'border-slate-300 group-hover:border-medical-blue bg-white']"><div v-if="userAnswers[index] === optIndex" class="w-3 h-3 md:w-3.5 md:h-3.5 bg-medical-blue rounded-full"></div></div>
                  <span :class="['text-base md:text-lg font-bold leading-snug', userAnswers[index] === optIndex ? 'text-medical-blue' : 'text-slate-600 group-hover:text-slate-800']">{{ opt }}</span>
                  <div v-if="showExplanations && optIndex === q.answer" class="ml-auto text-green-500 text-xl md:text-2xl"><i class="fa-solid fa-circle-check"></i></div>
                  <div v-if="showExplanations && userAnswers[index] === optIndex && optIndex !== q.answer" class="ml-auto text-red-500 text-xl md:text-2xl"><i class="fa-solid fa-circle-xmark"></i></div>
                </button>
              </div>
              
              <transition name="fade-slide">
                <div v-if="showExplanations" class="mt-6 md:mt-8 overflow-hidden rounded-2xl border-2 shadow-inner" :class="userAnswers[index] === q.answer ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'">
                  <div class="p-5 md:p-6 flex flex-col md:flex-row items-start gap-4 md:gap-6">
                    <div :class="['shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white font-black text-2xl md:text-3xl shadow-md', userAnswers[index] === q.answer ? 'bg-green-500' : 'bg-red-500']">
                      <i :class="['fa-solid', userAnswers[index] === q.answer ? 'fa-check' : 'fa-xmark']"></i>
                    </div>
                    <div class="flex-1 w-full">
                      <h4 :class="['font-black text-lg md:text-xl mb-1 md:mb-2 tracking-wide', userAnswers[index] === q.answer ? 'text-green-700' : 'text-red-700']">{{ userAnswers[index] === q.answer ? '回答正確' : '回答錯誤' }}</h4>
                      <p class="text-sm md:text-base font-bold text-slate-600 leading-relaxed mb-4">正確答案為：<span class="text-slate-800 underline decoration-2 underline-offset-4">{{ q.options[q.answer] }}</span></p>
                      <div class="bg-white/70 p-4 md:p-5 rounded-xl border border-white/50 shadow-sm relative">
                        <span class="font-black text-medical-blue text-xs md:text-sm tracking-widest block mb-2"><i class="fa-solid fa-chalkboard-user mr-1.5"></i>解析</span>
                        <p class="text-slate-700 text-sm md:text-base leading-relaxed font-medium">{{ q.explanation }}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </transition>
            </div>

            <button v-if="!showExplanations" @click="checkAnswers" class="w-full py-5 md:py-6 bg-medical-blue text-white rounded-3xl font-black text-xl md:text-2xl shadow-xl hover:bg-blue-800 hover:shadow-2xl active:scale-[0.98] transition-all flex justify-center items-center gap-3 border-2 border-blue-400">
              <i class="fa-solid fa-paper-plane"></i> 交卷並檢視成績
            </button>
            
          </div>
        </div>
      </div>
    </div>
  `
}