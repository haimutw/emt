const templateHTML = await fetch('/templates/mcq/index.html').then(res => res.text());

export default {
  template: templateHTML,
  props: ['catalogs', 'routeParam', 'userHistory'],
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
  watch: {
    userHistory: {
      deep: true,
      immediate: true,
      handler(h) {
        this.mcqScores = (h && h.mcq) ? h.mcq : {};
      }
    },
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
    openMcq(filename) {
      this.$root.navigate('Mcq', filename);
    },
    goBack() {
      this.$root.navigate('Mcq');
    },

    saveScore(filename, score) {
      const oldScore = this.mcqScores[filename] || 0;
      if (score >= oldScore) {
        this.$emit('update-history', { type: 'mcq', key: filename, value: score });
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
        const res = await fetch('/data/questions/' + filename);
        let rawData = await res.json();
        let questionPool = Array.isArray(rawData) ? rawData : rawData.questions;
        let limit = Array.isArray(rawData) ? null : rawData.test_info?.question_limit;

        this.shuffleArray(questionPool);
        if (limit && limit > 0 && limit < questionPool.length) {
          questionPool = questionPool.slice(0, limit);
        }

        let processedData = questionPool.map(q => {
          let mappedOptions = q.options.map((text, idx) => ({ text: text, isCorrect: (idx + 1) === q.answer }));
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
      } catch (e) {
        this.$emit('show-toast', { msg: '讀取題庫失敗，請確認路徑或 JSON 格式是否正確。', type: 'error' });
      }
    },

    selectAnswer(qIndex, optIndex) {
      if (this.showExplanations) return;
      this.userAnswers[qIndex] = optIndex;
    },

    checkAnswers() {
      if (this.userAnswers.includes(null)) {
        this.$emit('show-toast', { msg: '請將所有題目作答完畢！', type: 'error' });
        return;
      }

      let correct = 0;
      this.mcqData.forEach((q, i) => { if (this.userAnswers[i] === q.answer) correct++; });
      let scorePerQuestion = 100 / this.mcqData.length;
      this.scoreResult = Math.round(correct * scorePerQuestion);

      this.saveScore(this.currentMcqFile, this.scoreResult);
      this.$emit('show-toast', { msg: '測驗成績已結算並儲存！', type: 'success' }); // ★ 儲存成功提示

      this.showExplanations = true;
      this.showCompletionModal = true;

      const container = this.$refs.mcqContainer;
      if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
    },

    reviewExplanations() { this.showCompletionModal = false; }
  }
}