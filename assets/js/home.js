const templateHTML = await fetch('/templates/home/index.html').then(res => res.text());

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
        this.$root.navigate('Material', this.stats.lastViewedFile);
      }
    }
  }
}