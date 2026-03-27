const templateHTML = await fetch('./templates/quiz/index.html').then(res => res.text());

export default {
  template: templateHTML,
  props: ['catalogs', 'routeParam', 'userHistory'],
  data() {
    return { 
      currentQuizFile: null, 
      quizData: [], 
      userAnswers: [], 
      scoreResult: null, 
      showExplanations: false,
      showCompletionModal: false,
      quizScores: {},
      currentQuestionIndex: 0
    }
  },
  watch: {
    userHistory: {
      deep: true,
      immediate: true,
      handler(h) {
        this.quizScores = (h && h.mcq) ? h.mcq : {};
      }
    },
    routeParam: {
      immediate: true,
      handler(newFilename) {
        if (newFilename) {
          this.fetchMcq(newFilename);
        } else {
          this.currentQuizFile = null;
          this.showCompletionModal = false; 
          this.showExplanations = false;
          this.currentQuestionIndex = 0;
        }
      }
    }
  },
  methods: {
    openQuiz(filename) { this.$root.navigate('Quiz', filename); },
    goBack() { this.$root.navigate('Quiz'); },
    
    saveScore(filename, score) {
      const oldScore = this.quizScores[filename] || 0;
      if (score >= oldScore) {
        this.$emit('update-history', { type: 'quiz', key: filename, value: score });
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
        const res = await fetch('./data/quiz/' + filename);
        let rawData = await res.json();
        let quizPool = Array.isArray(rawData) ? rawData : rawData.quiz;
        let limit = Array.isArray(rawData) ? null : rawData.test_info?.question_limit;

        this.shuffleArray(quizPool);
        if (limit && limit > 0 && limit < quizPool.length) {
          quizPool = quizPool.slice(0, limit);
        }

        let processedData = quizPool.map(q => {
          let mappedOptions = q.options.map((text, idx) => ({ text: text, isCorrect: (idx + 1) === q.answer }));
          this.shuffleArray(mappedOptions);
          let newAnswerIndex = mappedOptions.findIndex(opt => opt.isCorrect);
          return { ...q, options: mappedOptions.map(opt => opt.text), answer: newAnswerIndex };
        });

        this.quizData = processedData;
        this.currentQuizFile = filename;
        this.userAnswers = new Array(this.quizData.length).fill(null);
        this.scoreResult = null; 
        this.showExplanations = false;
        this.showCompletionModal = false;
        this.currentQuestionIndex = 0;
      } catch (e) { 
        this.$emit('show-toast', { msg: '讀取內容失敗。', type: 'error' });
      }
    },

    nextQuestion() {
      if (this.currentQuestionIndex < this.quizData.length - 1) {
        this.currentQuestionIndex++;
      }
    },
    prevQuestion() {
      if (this.currentQuestionIndex > 0) {
        this.currentQuestionIndex--;
      }
    },
    goToQuestion(index) {
      this.currentQuestionIndex = index;
    },

    selectAnswer(qIndex, optIndex) {
      if (this.showExplanations) return; 
      this.userAnswers[qIndex] = optIndex;
      
      if (this.currentQuestionIndex < this.quizData.length - 1) {
        setTimeout(() => { this.nextQuestion(); }, 300);
      }
    },
    
    checkAnswers() {
      const firstUnanswered = this.userAnswers.indexOf(null);
      if (firstUnanswered !== -1) { 
        this.$emit('show-toast', { msg: `第 ${firstUnanswered + 1} 題尚未作答！已為您跳轉。`, type: 'error' });
        this.goToQuestion(firstUnanswered);
        return; 
      }
      
      let correct = 0;
      this.quizData.forEach((q, i) => { if (this.userAnswers[i] === q.answer) correct++; });
      let scorePerQuestion = 100 / this.quizData.length;
      this.scoreResult = Math.round(correct * scorePerQuestion);
      
      this.saveScore(this.currentQuizFile, this.scoreResult);
      this.$emit('show-toast', { msg: '測驗成績已結算並儲存！', type: 'success' }); 
      
      this.showExplanations = true;
      this.showCompletionModal = true;
      this.currentQuestionIndex = 0;
    },
    
    reviewExplanations() { this.showCompletionModal = false; }
  }
}