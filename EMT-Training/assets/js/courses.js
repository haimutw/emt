const templateHTML = await fetch('./templates/courses/index.html').then(res => res.text());

export default {
  template: templateHTML,
  props: ['catalogs', 'routeParam', 'userHistory'],
  data() {
    return {
      currentFile: null,
      currentTitle: null,
      currentMarkdown: null,
      currentModule: null,         // 新增：模組名稱
      currentSuggestedTime: null,  // 新增：建議閱讀時間
      readProgress: 0,
      readTimeSeconds: 0,
      minReadTimeRequired: 10, 
      timerInterval: null
    }
  },
  computed: {
    markdownHtml() {
      return this.currentMarkdown ? marked.parse(this.currentMarkdown) : '';
    }
  },
  watch: {
    routeParam: {
      immediate: true,
      handler(newFilename) {
        if (newFilename) {
          this.openCourses(newFilename);
        } else {
          this.currentFile = null;
          this.currentTitle = null;
          this.currentModule = null;         // 清空模組名稱
          this.currentSuggestedTime = null;  // 清空建議時間
          this.currentMarkdown = null;
          if (this.timerInterval) clearInterval(this.timerInterval);
        }
      }
    }
  },
  methods: {
    openCourses(filename) {
      this.$root.navigate('Courses', filename);
      this.$emit('update-history', { type: 'last_Courses', value: filename });
      this.fetchCourses(filename);
    },
    goBack() {
      this.$root.navigate('Courses');
    },
    async fetchCourses(filename) {
      try {
        const mat = this.catalogs.courses.find(m => m.file === filename);
        this.currentTitle = mat ? mat.title : null;

        this.currentModule = mat && mat.module ? mat.module : 'EMT-1 基礎模組';
        this.currentSuggestedTime = mat && mat.readTime ? mat.readTime : 10;
        
        const res = await fetch('./data/courses/' + filename);
        if (!res.ok) throw new Error('File not found');
        this.currentMarkdown = await res.text();
        this.currentFile = filename;
        
        this.readProgress = 0;
        this.readTimeSeconds = 0;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => { this.readTimeSeconds++; }, 1000);
        
        this.$nextTick(() => { this.onCoursescroll(); });
      } catch (e) {
        this.$emit('show-toast', { msg: '讀取教材失敗，請確認檔案路徑。', type: 'error' });
        this.goBack();
      }
    },
    onCoursescroll() {
      const el = this.$refs.markdownBody;
      if (!el) return;
      const scrollTop = el.scrollTop;
      const scrollHeight = el.scrollHeight;
      const clientHeight = el.clientHeight;
      
      if (scrollHeight <= clientHeight) {
        this.readProgress = 100;
        this.markAsRead();
        return;
      }
      
      const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
      this.readProgress = Math.min(100, Math.max(0, progress));
      
      if (this.readProgress > 95) {
        this.markAsRead();
      }
    },
    markAsRead() {
      if (this.readTimeSeconds >= this.minReadTimeRequired && !this.isRead(this.currentFile)) {
        this.$emit('update-history', { type: 'courses', value: this.currentFile });
        this.$emit('show-toast', { msg: '恭喜！已完成此章節閱讀。', type: 'success' });
      }
    },
    isRead(filename) {
      return this.userHistory && this.userHistory.courses && this.userHistory.courses.includes(filename);
    }
  },
  unmounted() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}