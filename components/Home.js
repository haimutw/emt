export default {
  template: `
    <div class="bg-slate-50 md:rounded-2xl shadow-sm border-x border-b md:border-t border-slate-200 p-6 md:p-12 flex flex-col items-center justify-center min-h-[80vh] md:min-h-[85vh] relative overflow-hidden w-full">
      <div class="absolute top-0 inset-x-0 h-48 bg-gradient-to-b from-blue-100/50 to-transparent"></div>
      
      <div class="text-center max-w-4xl mx-auto relative z-10 w-full">
        <div class="mb-6 md:mb-10 inline-block p-5 md:p-6 bg-white rounded-full shadow-lg border border-slate-100">
          <i class="fa-solid fa-heart-pulse text-6xl md:text-7xl text-medical-red animate-pulse"></i>
        </div>
        <h2 class="text-3xl md:text-5xl font-black text-slate-800 mb-4 md:mb-6 tracking-tight">掌握每一秒的黃金救援</h2>
        <p class="text-base md:text-xl text-slate-500 mb-10 md:mb-16 leading-relaxed font-medium max-w-2xl mx-auto">
          專為初級救護技術員（EMT-1）打造的現代化訓練平台。<br class="hidden md:block">結合了學科知識、模擬測驗與帶有時間壓力的實戰情境演練。
        </p>
        
        <div class="grid md:grid-cols-3 gap-5 md:gap-8 text-left">
          <div class="p-6 md:p-8 rounded-3xl border-2 border-slate-200 bg-white hover:border-medical-blue hover:shadow-xl transition-all group">
            <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-medical-blue transition-all">
              <i class="fa-solid fa-book-open text-medical-blue group-hover:text-white text-2xl md:text-3xl transition-colors"></i>
            </div>
            <h3 class="font-black text-xl text-slate-800 mb-3 group-hover:text-medical-blue transition-colors">結構化教材</h3>
            <p class="text-sm md:text-base text-slate-500 font-medium leading-relaxed">支援 Markdown 豐富排版，讓法規與學理知識更加清晰易讀，隨時掌握重點。</p>
          </div>
          <div class="p-6 md:p-8 rounded-3xl border-2 border-slate-200 bg-white hover:border-medical-blue hover:shadow-xl transition-all group">
            <div class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-medical-blue transition-all">
              <i class="fa-solid fa-list-check text-medical-blue group-hover:text-white text-2xl md:text-3xl transition-colors"></i>
            </div>
            <h3 class="font-black text-xl text-slate-800 mb-3 group-hover:text-medical-blue transition-colors">智能學科題庫</h3>
            <p class="text-sm md:text-base text-slate-500 font-medium leading-relaxed">測驗後自動對答並計分，附帶教官級專業詳解，有效鞏固學科記憶與觀念。</p>
          </div>
          <div class="p-6 md:p-8 rounded-3xl border-2 border-red-50 bg-white hover:border-medical-red hover:shadow-xl transition-all group">
            <div class="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-medical-red transition-all">
              <i class="fa-solid fa-truck-fast text-medical-red group-hover:text-white text-2xl md:text-3xl transition-colors"></i>
            </div>
            <h3 class="font-black text-xl text-slate-800 mb-3 group-hover:text-medical-red transition-colors">高壓情境模擬</h3>
            <p class="text-sm md:text-base text-slate-500 font-medium leading-relaxed">結合真實倒數計時、生命徵象監視器與劇情分支，鍛鍊臨床判斷與實戰抗壓性。</p>
          </div>
        </div>
      </div>
    </div>
  `
}