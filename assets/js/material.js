const templateHTML = await fetch('/templates/material/index.html').then(res => res.text());

export default {
  template: templateHTML,
  props: ['catalogs', 'routeParam', 'userHistory'],
  data() {
    return {
      currentMaterialHtml: null, readMaterials: [], readTimeLeft: 0,
      readInterval: null, isAtBottom: false, readingProgress: 0, showBackToTop: false
    }
  },
  watch: {
    userHistory: { deep: true, immediate: true, handler(h) { this.readMaterials = (h && h.materials) ? h.materials : []; } },
    routeParam: {
      immediate: true, handler(newFilename) {
        if (newFilename) { this.fetchMaterial(newFilename); }
        else { this.currentMaterialHtml = null; this.readingProgress = 0; this.showBackToTop = false; if (this.readInterval) clearInterval(this.readInterval); }
      }
    }
  },
  unmounted() { if (this.readInterval) clearInterval(this.readInterval); },
  methods: {
    openMaterial(filename) {
      this.$root.navigate('Material', filename);
    },
    goBack() {
      this.$root.navigate('Material');
    },
    setLastViewed(filename) { this.$emit('update-history', { type: 'last_material', value: filename }); },

    markAsRead(filename) {
      if (!this.readMaterials.includes(filename)) {
        this.$emit('update-history', { type: 'materials', value: filename });
        this.$emit('show-toast', { msg: '章節閱讀完成，進度已儲存！', type: 'success' });
      }
    },

    async fetchMaterial(filename) {
      try {
        const res = await fetch('/data/materials/' + filename);
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
  }
}