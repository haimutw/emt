export default {
  props: ['catalogs', 'routeParam'],
  data() {
    return { 
      currentMaterialHtml: null,
      readMaterials: []
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
          this.fetchMaterial(newFilename);
        } else {
          this.currentMaterialHtml = null; 
        }
      }
    }
  },
  methods: {
    openMaterial(filename) { window.location.hash = `#Material/${filename}`; },
    goBack() { window.location.hash = `#Material`; },
    
    loadHistory() {
      const history = JSON.parse(localStorage.getItem('emt_history') || '{"materials":[]}');
      this.readMaterials = history.materials || [];
    },
    
    markAsRead(filename) {
      if (!this.readMaterials.includes(filename)) {
        this.readMaterials.push(filename);
        const history = JSON.parse(localStorage.getItem('emt_history') || '{"materials":[]}');
        history.materials = this.readMaterials;
        localStorage.setItem('emt_history', JSON.stringify(history));
      }
    },

    async fetchMaterial(filename) {
      try {
        const res = await fetch('./data/materials/' + filename);
        const mdText = await res.text();
        this.currentMaterialHtml = marked.parse(mdText);
        this.markAsRead(filename);
      } catch (e) { alert("讀取教材失敗，請確認檔案路徑。"); }
    }
  },
  template: `
    <div class="bg-slate-50 md:rounded-2xl shadow-sm border-x border-b md:border-t border-slate-200 relative overflow-hidden flex flex-col w-full min-h-[80vh] md:min-h-[85vh]">
      
      <div v-if="!currentMaterialHtml" class="p-5 md:p-10 flex-1 flex flex-col">
        <h2 class="text-2xl md:text-3xl font-bold text-medical-blue mb-6 md:mb-8 border-l-4 border-medical-blue pl-4 tracking-wide">選擇教材章節</h2>
        <div class="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          
          <button v-for="item in catalogs.materials" :key="item.file" @click="openMaterial(item.file)" class="text-left p-6 md:p-8 rounded-3xl border-2 border-slate-200 bg-white hover:border-medical-blue hover:shadow-xl transition-all group flex flex-col justify-between h-full relative overflow-hidden">
            
            <div v-if="readMaterials.includes(item.file)" class="absolute top-0 right-0 bg-green-500 text-white px-3 py-1.5 rounded-bl-2xl font-bold text-[10px] md:text-xs shadow-sm">
              <i class="fa-solid fa-check-double mr-1"></i> 已完讀
            </div>

            <div>
              <i class="fa-solid fa-book-medical text-4xl md:text-5xl text-slate-300 group-hover:text-medical-blue mb-4 md:mb-6 block transition-colors mt-2"></i>
              <span class="font-black text-lg md:text-xl text-slate-700 group-hover:text-medical-blue leading-snug">{{ item.title }}</span>
            </div>
            <div class="mt-6 flex justify-end">
              <span class="text-xs md:text-sm font-bold text-slate-400 group-hover:text-medical-blue bg-slate-50 group-hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors border border-slate-100 group-hover:border-blue-100 shadow-sm">開始閱讀 <i class="fa-solid fa-arrow-right ml-1"></i></span>
            </div>
          </button>
        </div>
      </div>
      
      <div v-else class="flex flex-col flex-1 h-full relative">
        <div class="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200 p-3 md:p-5 flex items-center shadow-sm shrink-0">
          <button @click="goBack" class="text-slate-500 hover:text-medical-blue text-sm md:text-base font-bold bg-slate-100 hover:bg-blue-50 px-5 py-2.5 rounded-full transition-colors flex items-center gap-2 border border-slate-200 shadow-sm">
            <i class="fa-solid fa-arrow-left"></i> 返回目錄
          </button>
        </div>
        <div class="p-4 md:p-10 flex-1 overflow-y-auto w-full flex justify-center no-scrollbar bg-slate-100">
          <div class="prose prose-slate prose-blue prose-sm md:prose-lg max-w-4xl w-full bg-white p-6 md:p-12 rounded-2xl md:rounded-3xl shadow-md border border-slate-200 leading-loose" v-html="currentMaterialHtml"></div>
        </div>
      </div>
    </div>
  `
}