export default {
  props: ['catalogs', 'routeParam', 'userHistory'],
  data() {
    return { 
      currentMaterialHtml: null, readMaterials: [], readTimeLeft: 0,
      readInterval: null, isAtBottom: false, readingProgress: 0, showBackToTop: false
    }
  },
  watch: {
    userHistory: { deep: true, immediate: true, handler(h) { this.readMaterials = (h && h.materials) ? h.materials : []; } },
    routeParam: { immediate: true, handler(newFilename) {
      if (newFilename) { this.fetchMaterial(newFilename); } 
      else { this.currentMaterialHtml = null; this.readingProgress = 0; this.showBackToTop = false; if (this.readInterval) clearInterval(this.readInterval); }
    }}
  },
  unmounted() { if (this.readInterval) clearInterval(this.readInterval); },
  methods: {
    openMaterial(filename) { window.location.hash = `#Material/${filename}`; },
    goBack() { window.location.hash = `#Material`; },
    setLastViewed(filename) { this.$emit('update-history', { type: 'last_material', value: filename }); },

    markAsRead(filename) {
      if (!this.readMaterials.includes(filename)) {
        this.$emit('update-history', { type: 'materials', value: filename });
        this.$emit('show-toast', { msg: '章節閱讀完成，進度已儲存！', type: 'success' });
      }
    },

    async fetchMaterial(filename) {
      try {
        const res = await fetch('./data/materials/' + filename);
        const mdText = await res.text();
        this.currentMaterialHtml = marked.parse(mdText);
        
        this.setLastViewed(filename);
        this.isAtBottom = false;
        this.readingProgress = 0;

        if (this.readInterval) clearInterval(this.readInterval);
        if (!this.readMaterials.includes(filename)) {
          this.readTimeLeft = 60;
          this.readInterval = setInterval(() => {
            this.readTimeLeft--;
            if (this.readTimeLeft <= 0) {
              clearInterval(this.readInterval);
              if (this.isAtBottom) this.markAsRead(filename);
            }
          }, 1000);
        } else {
          this.readTimeLeft = 0;
        }

        this.$nextTick(() => {
          const container = this.$refs.scrollContainer;
          if (container) {
            container.scrollTop = 0;
            setTimeout(() => {
              if (container.scrollHeight <= container.clientHeight + 10) {
                this.isAtBottom = true;
                this.readingProgress = 100;
              }
            }, 500);
          }
        });
      } catch (e) { 
        this.$emit('show-toast', { msg: '讀取教材失敗，請確認檔案路徑。', type: 'error' }); // 取代 alert
      }
    },
    checkScroll(e) {
      const { scrollTop, clientHeight, scrollHeight } = e.target;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll > 0) { this.readingProgress = Math.min(100, (scrollTop / maxScroll) * 100); } else { this.readingProgress = 100; }
      this.showBackToTop = scrollTop > 300;
      const reachedBottom = (scrollTop > 10 && (scrollTop + clientHeight >= scrollHeight - 50));
      this.isAtBottom = reachedBottom || (maxScroll <= 10);
      if (this.isAtBottom && this.readTimeLeft <= 0 && this.routeParam) { this.markAsRead(this.routeParam); }
    },
    scrollToTop() {
      const container = this.$refs.scrollContainer;
      if (container) { container.scrollTo({ top: 0, behavior: 'smooth' }); }
    }
  },
  template: `
    <div class="bg-slate-50 dark:bg-slate-900 md:rounded-2xl shadow-sm border-x border-b md:border-t border-slate-200 dark:border-slate-700 relative overflow-hidden flex flex-col w-full h-full transition-colors">
      <div v-if="!currentMaterialHtml" class="p-5 md:p-10 flex-1 flex flex-col">
        <h2 class="text-2xl md:text-3xl font-bold text-medical-blue dark:text-blue-400 mb-6 md:mb-8 border-l-4 border-medical-blue dark:border-blue-400 pl-4 tracking-wide">選擇教材章節</h2>
        <div class="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <button v-for="item in catalogs.materials" :key="item.file" @click="openMaterial(item.file)" class="text-left p-6 md:p-8 rounded-3xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-medical-blue dark:hover:border-blue-500 hover:shadow-xl transition-all group flex flex-col justify-between h-full relative overflow-hidden">
            <div v-if="readMaterials.includes(item.file)" class="absolute top-0 right-0 bg-green-500 dark:bg-green-600 text-white px-3 py-1.5 rounded-bl-2xl font-bold text-[10px] md:text-xs shadow-sm"><i class="fa-solid fa-check-double mr-1"></i> 已完讀</div>
            <div><i class="fa-solid fa-book-medical text-4xl md:text-5xl text-slate-300 dark:text-slate-600 group-hover:text-medical-blue dark:group-hover:text-blue-400 mb-4 md:mb-6 block transition-colors mt-2"></i><span class="font-black text-lg md:text-xl text-slate-700 dark:text-slate-200 group-hover:text-medical-blue dark:group-hover:text-blue-400 leading-snug">{{ item.title }}</span></div>
            <div class="mt-6 flex justify-end"><span class="text-xs md:text-sm font-bold text-slate-400 dark:text-slate-500 group-hover:text-medical-blue dark:group-hover:text-blue-400 bg-slate-50 dark:bg-slate-700 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 px-4 py-2 rounded-lg transition-colors border border-slate-100 dark:border-slate-600 shadow-sm">開始閱讀 <i class="fa-solid fa-arrow-right ml-1"></i></span></div>
          </button>
        </div>
      </div>
      <div v-else class="flex flex-col flex-1 h-full relative">
        <div class="sticky top-0 z-20 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 p-3 md:p-5 flex justify-between items-center shadow-sm shrink-0 transition-colors">
          <div class="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-medical-blue to-medical-red dark:from-blue-500 dark:to-red-500 transition-all duration-150 ease-out" :style="{ width: readingProgress + '%' }"></div>
          <button @click="goBack" class="text-slate-500 dark:text-slate-400 hover:text-medical-blue dark:hover:text-blue-400 text-sm md:text-base font-bold bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-slate-600 px-5 py-2.5 rounded-full transition-colors flex items-center gap-2 border border-slate-200 dark:border-slate-600 shadow-sm active:scale-95"><i class="fa-solid fa-arrow-left"></i> 返回目錄</button>
          <div v-if="readMaterials.includes(routeParam)" class="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold border border-green-200 dark:border-green-800 shadow-sm flex items-center gap-2 animate-pulse"><i class="fa-solid fa-check-circle"></i> 閱讀完成</div>
          <div v-else-if="readTimeLeft > 0" class="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold border border-orange-200 dark:border-orange-800 shadow-sm flex items-center gap-2"><i class="fa-solid fa-hourglass-half"></i> 需閱讀 {{ readTimeLeft }} 秒</div>
          <div v-else class="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold border border-blue-200 dark:border-blue-800 shadow-sm flex items-center gap-2"><i class="fa-solid fa-arrow-down animate-bounce"></i> 請滑動至底部完成</div>
        </div>
        <div ref="scrollContainer" @scroll="checkScroll" class="p-4 md:p-10 flex-1 overflow-y-auto overscroll-none w-full flex justify-center no-scrollbar bg-slate-50 dark:bg-slate-900 relative scroll-smooth transition-colors">
          <div class="prose max-w-5xl w-full p-2 md:p-8 pb-32 transition-colors" v-html="currentMaterialHtml"></div>
          <transition name="fade-slide">
            <button v-if="showBackToTop" @click="scrollToTop" class="fixed bottom-8 right-8 md:bottom-12 md:right-12 w-12 h-12 md:w-14 md:h-14 bg-slate-800 dark:bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center text-lg md:text-xl hover:bg-medical-blue dark:hover:bg-blue-500 hover:-translate-y-1 transition-all z-50 border-2 border-white/20 dark:border-white/10 active:scale-95"><i class="fa-solid fa-arrow-up"></i></button>
          </transition>
        </div>
      </div>
    </div>
  `
}