const templateHTML = await fetch('./templates/home/index.html').then(res => res.text());

export default {
  template: templateHTML,
  props: ['catalogs', 'userHistory'],
  data() {
    return {
      stats: { readCount: 0, bestMcq: 0, bestGcs: 0, lastViewedFile: null, lastViewedTitle: null, isLastViewedRead: false }
    }
  },
  watch: {
    userHistory: {
      deep: true,
      immediate: true,
      handler(newHistory) {
        this.loadStats(newHistory);
      }
    }
  },
  methods: {
    loadStats(history) {
      if (!history) return;
      const readMats = history.courses || [];
      this.stats.readCount = readMats.length;

      const quizScores = Object.values(history.quiz || {});
      this.stats.bestMcq = quizScores.length > 0 ? Math.max(...quizScores) : 0;

      const gcsScores = Object.values(history.gcs || {});
      this.stats.bestGcs = gcsScores.length > 0 ? Math.max(...gcsScores) : 0;

      const lastFile = history.last_courses;
      if (lastFile && this.catalogs && this.catalogs.courses) {
        const mat = this.catalogs.courses.find(m => m.file === lastFile);
        if (mat) {
          this.stats.lastViewedFile = lastFile;
          this.stats.lastViewedTitle = mat.title;
          this.stats.isLastViewedRead = readMats.includes(lastFile);
        }
      }
    },
    continueReading() {
      if (this.stats.lastViewedFile) this.$root.navigate('Courses', this.stats.lastViewedFile);
    }
  }
}