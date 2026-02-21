export default {
  props: ['catalogs'],
  data() {
    return {
      stats: {
        readCount: 0,
        bestMcq: 0,
        bestGcs: 0,
        lastViewedFile: null,
        lastViewedTitle: null,
        isLastViewedRead: false
      }
    }
  },
  created() {
    this.loadStats();
  },
  methods: {
    loadStats() {
      const history = JSON.parse(localStorage.getItem('emt_history') || '{}');

      const readMats = history.materials || [];
      this.stats.readCount = readMats.length;

      const mcqScores = Object.values(history.mcq || {});
      this.stats.bestMcq = mcqScores.length > 0 ? Math.max(...mcqScores) : 0;

      const gcsScores = Object.values(history.gcs || {});
      this.stats.bestGcs = gcsScores.length > 0 ? Math.max(...gcsScores) : 0;

      const lastFile = history.last_material;
      if (lastFile && this.catalogs && this.catalogs.materials) {
        const mat = this.catalogs.materials.find(m => m.file === lastFile);
        if (mat) {
          this.stats.lastViewedFile = lastFile;
          this.stats.lastViewedTitle = mat.title;
          this.stats.isLastViewedRead = readMats.includes(lastFile);
        }
      }
    },
    continueReading() {
      if (this.stats.lastViewedFile) {
        window.location.hash = `#Material/${this.stats.lastViewedFile}`;
      }
    }
  },
  template: `
    <div class="bg-slate-50 md:rounded-3xl shadow-sm border-x border-b md:border-t border-slate-200 p-6 md:p-10 flex flex-col items-center min-h-[80vh] md:min-h-[85vh] relative overflow-hidden w-full">
      <div class="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-blue-100/60 via-blue-50/20 to-transparent pointer-events-none"></div>
      <div class="text-center max-w-5xl mx-auto relative z-10 w-full flex flex-col flex-1">
        <div class="mb-8 md:mb-12 mt-4 md:mt-8">
        <i class="fa-solid fa-heart-pulse text-6xl md:text-7xl text-medical-red animate-pulse"></i>
        <br><br><br>
          <h2 class="text-3xl md:text-5xl font-black text-slate-800 mb-4 tracking-tight">掌握每一秒的<span class="text-transparent bg-clip-text bg-gradient-to-r from-medical-blue to-medical-red">黃金救援</span></h2>
          <p class="text-base md:text-lg text-slate-500 leading-relaxed font-medium max-w-2xl mx-auto mb-8">
            專為初級救護技術員（EMT-1）打造的數位訓練系統。<br class="hidden md:block">結合學理基礎、單項訓練，有助於提升測驗時的準確度。
          </p>

          <div class="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 max-w-4xl mx-auto">
            
            <div class="flex flex-1 w-full justify-around md:justify-start gap-4 md:gap-10 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-10">
              <div class="text-left">
                <p class="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"><i class="fa-solid fa-book-open mr-1"></i>已完讀課程</p>
                <p class="text-2xl md:text-3xl font-black text-medical-blue">{{ stats.readCount }} <span class="text-sm font-medium text-slate-400">篇</span></p>
              </div>
              <div class="text-left">
                <p class="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"><i class="fa-solid fa-file-signature mr-1"></i>學科最高分</p>
                <p :class="['text-2xl md:text-3xl font-black', stats.bestMcq >= 80 ? 'text-green-500' : 'text-slate-700']">{{ stats.bestMcq || '-' }}</p>
              </div>
              <div class="text-left">
                <p class="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest mb-1"><i class="fa-solid fa-brain mr-1"></i>GCS 最高分</p>
                <p :class="['text-2xl md:text-3xl font-black', stats.bestGcs >= 80 ? 'text-green-500' : 'text-slate-700']">{{ stats.bestGcs || '-' }}</p>
              </div>
            </div>

            <div v-if="stats.lastViewedFile" class="shrink-0 w-full md:w-auto text-left flex flex-col items-start md:items-end">
              <p class="text-xs text-slate-400 font-bold mb-2">
                <span v-if="stats.isLastViewedRead" class="text-green-500"><i class="fa-solid fa-check"></i> 已讀完的章節：</span>
                <span v-else class="text-orange-500 animate-pulse"><i class="fa-regular fa-clock"></i> 尚未讀完，繼續閱讀：</span>
              </p>
              <button @click="continueReading" class="max-w-[250px] md:max-w-xs truncate px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition-all border w-full text-center md:text-left"
                :class="stats.isLastViewedRead ? 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100' : 'bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100 hover:shadow-md'">
                {{ stats.lastViewedTitle }} <i class="fa-solid fa-arrow-right ml-1"></i>
              </button>
            </div>
            <div v-else class="shrink-0 text-sm font-bold text-slate-400 flex items-center">
              <i class="fa-solid fa-info-circle mr-2"></i> 尚未擁有進度
            </div>

          </div>
        </div>
        
        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 text-left w-full mb-12">
          
          <a href="#Material" class="block p-6 md:p-8 rounded-3xl border-2 border-slate-100 bg-white hover:border-blue-300 hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative">
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <div class="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
              <i class="fa-solid fa-book-medical text-2xl md:text-3xl"></i>
            </div>
            <h3 class="font-black text-xl text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">課程知識</h3>
            <p class="text-sm text-slate-500 font-medium leading-relaxed mb-4">結構化 EMT-1 所需完備之內容。</p>
            <span class="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg">開始課程 <i class="fa-solid fa-arrow-right ml-1"></i></span>
          </a>

          <a href="#Mcq" class="block p-6 md:p-8 rounded-3xl border-2 border-slate-100 bg-white hover:border-indigo-300 hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative">
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <div class="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
              <i class="fa-solid fa-file-signature text-2xl md:text-3xl"></i>
            </div>
            <h3 class="font-black text-xl text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">學科測驗</h3>
            <p class="text-sm text-slate-500 font-medium leading-relaxed mb-4">隨機題庫與自動批改，附帶詳解能夠補足知識盲區。</p>
            <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg">開始測驗 <i class="fa-solid fa-arrow-right ml-1"></i></span>
          </a>

          <a href="#Gcs" class="block p-6 md:p-8 rounded-3xl border-2 border-slate-100 bg-white hover:border-teal-300 hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative">
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-teal-50 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <div class="w-14 h-14 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-teal-600 group-hover:text-white transition-colors shadow-sm">
              <i class="fa-solid fa-brain text-2xl md:text-3xl"></i>
            </div>
            <h3 class="font-black text-xl text-slate-800 mb-2 group-hover:text-teal-600 transition-colors">GCS 訓練</h3>
            <p class="text-sm text-slate-500 font-medium leading-relaxed mb-4">互動式昏迷指數評估練習，透過反應測試精準判斷 EVM 分數。</p>
            <span class="text-xs font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg">開始練習 <i class="fa-solid fa-arrow-right ml-1"></i></span>
          </a>

          <a href="" class="block p-6 md:p-8 rounded-3xl border-2 border-slate-100 bg-white hover:border-red-300 hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative">
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-red-50 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
            <div class="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-red-600 group-hover:text-white transition-colors shadow-sm">
              <i class="fa-solid fa-truck-medical text-2xl md:text-3xl"></i>
            </div>
            <h3 class="font-black text-xl text-slate-800 mb-2 group-hover:text-red-600 transition-colors">新功能進請期待</h3>
            <p class="text-sm text-slate-500 font-medium leading-relaxed mb-4">新功能進請期待。</p>
            <span class="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg">即將推出 <i class="fa-solid fa-arrow-right ml-1"></i></span>
          </a>
        </div>
        
      </div>
    </div>
  `
}