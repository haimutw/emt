const templateHTML = await fetch('/templates/scenario/index.html').then(res => res.text());

export default {
  template: templateHTML,
  props: ['catalogs', 'routeParam', 'userHistory'],
  data() {
    return {
      currentScenarioFile: null, scenarioData: null, activeScope: null,
      timeLeft: 0, timerInterval: null, isPaused: false,
      currentSceneId: null, patientVitals: {}, patientFlags: {}, actionLogs: [],

      score: 100, historyStack: [], undoCount: 0, maxUndo: 2,

      isActionInProgress: false, progressText: "", progressPercent: 0,
      activeTab: '1. 意識與大出血 (X)', selectedTool: null, assistantTask: null,
      toolboxGameOverMsg: null,

      toastWarning: null, showCompletionModal: false
    }
  },
  computed: {
    currentScene() {
      return this.scenarioData && this.currentSceneId ? this.scenarioData.scenes[this.currentSceneId] : null;
    },
    availableChoices() {
      if (!this.currentScene || !this.currentScene.choices) return [];
      return this.currentScene.choices.filter(choice => {
        if (!choice.target_scopes) return true;
        return choice.target_scopes.includes(this.activeScope.id);
      });
    },
    timeSpent() {
      if (!this.activeScope) return 0;
      return this.activeScope.time_limit - this.timeLeft;
    }
  },
  watch: {
    routeParam: {
      immediate: true,
      handler(newFilename) {
        if (newFilename) {
          this.fetchScenario(newFilename);
        } else {
          if (this.timerInterval) clearInterval(this.timerInterval);
          this.currentScenarioFile = null; this.scenarioData = null; this.activeScope = null;
          this.showCompletionModal = false; this.toastWarning = null;
        }
      }
    }
  },
  methods: {
    handleTabScroll(e) {
      if (e.deltaY !== 0) {
        e.preventDefault();
        this.$refs.toolboxTabs.scrollLeft += e.deltaY;
      }
    },
    openScenario(filename) {
      this.$root.navigate('Scenario', filename);
    },
    endScenario() {
      this.$root.navigate('Scenario');
    },

    async fetchScenario(filename) {
      try {
        const res = await fetch('/data/scenarios/' + filename);
        this.scenarioData = await res.json();
        this.currentScenarioFile = filename;
        this.activeScope = null;
      } catch (e) {
        this.$emit('show-toast', { msg: '讀取情境失敗，請確認檔案路徑。', type: 'error' });
      }
    },

    selectScope(scope) {
      this.activeScope = scope; this.timeLeft = scope.time_limit;
      this.currentSceneId = this.scenarioData.scenes.start_node;
      this.patientVitals = JSON.parse(JSON.stringify(this.scenarioData.initial_vitals));
      this.patientFlags = {}; this.actionLogs = ["無線電：抵達現場，開始評估。"];

      this.score = 100; this.historyStack = []; this.undoCount = 0;
      this.isPaused = false; this.toolboxGameOverMsg = null; this.assistantTask = null;
      this.toastWarning = null; this.showCompletionModal = false;
      this.startTimer();
    },

    startTimer() {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.timerInterval = setInterval(() => {
        if (!this.isPaused && !this.isActionInProgress && this.timeLeft > 0) {
          this.advanceTime(1);
        } else if (!this.isActionInProgress && this.timeLeft <= 0) {
          this.timeLeft = 0; clearInterval(this.timerInterval);
          this.triggerWarning("🚨 測驗時間到！任務強制結束。");
          setTimeout(() => this.endScenario(), 3000);
        }
      }, 1000);
    },

    advanceTime(seconds) {
      this.timeLeft = Math.max(0, this.timeLeft - seconds);
      if (this.assistantTask) {
        this.assistantTask.time_left -= seconds;
        if (this.assistantTask.time_left <= 0) {
          this.applyActionEffects(this.assistantTask.subAction);
          this.actionLogs.unshift(`🙋 【副手回報】已完成：${this.assistantTask.subAction.name}！`);
          this.assistantTask = null;
        }
      }
    },

    triggerWarning(msg) {
      this.toastWarning = msg;
      this.score = Math.max(0, this.score - 5);
      setTimeout(() => { this.toastWarning = null; }, 4000);
    },

    saveHistory() {
      this.historyStack.push({
        sceneId: this.currentSceneId, timeLeft: this.timeLeft, score: this.score,
        vitals: JSON.parse(JSON.stringify(this.patientVitals)),
        flags: JSON.parse(JSON.stringify(this.patientFlags)),
        logs: [...this.actionLogs],
        assistantTask: this.assistantTask ? JSON.parse(JSON.stringify(this.assistantTask)) : null,
        toolboxGameOverMsg: this.toolboxGameOverMsg
      });
    },

    undoLastStep() {
      if (this.historyStack.length === 0 || this.undoCount >= this.maxUndo) return;
      const last = this.historyStack.pop();
      this.currentSceneId = last.sceneId; this.timeLeft = last.timeLeft;
      this.patientVitals = last.vitals; this.patientFlags = last.flags;
      this.actionLogs = last.logs; this.assistantTask = last.assistantTask;
      this.toolboxGameOverMsg = last.toolboxGameOverMsg;

      this.undoCount++;
      this.score = Math.max(0, last.score - 10);
      this.isPaused = false; this.toolboxGameOverMsg = null;
      this.startTimer();
    },

    checkCompletion() {
      if (!this.availableChoices || this.availableChoices.length === 0) {
        if (!this.currentScene.is_game_over && !this.toolboxGameOverMsg) {
          this.isPaused = true; clearInterval(this.timerInterval);
          this.showCompletionModal = true;
        }
      }
    },

    makeChoice(choice) {
      this.saveHistory();
      if (choice.set_flag) this.patientFlags[choice.set_flag] = true;
      this.simulateActionWait(choice.text, choice.time_cost, () => {
        this.currentSceneId = choice.next_scene;
        if (this.currentScene && this.currentScene.is_game_over) {
          this.isPaused = true; clearInterval(this.timerInterval);
        } else {
          this.checkCompletion();
        }
      });
    },

    openToolboxModal(tool) {
      if (this.currentScene.disable_toolbox) return;
      this.selectedTool = tool;
    },

    closeToolboxModal() { this.selectedTool = null; },

    executeSubAction(subAction, delegateToAssistant = false) {
      if (subAction.prerequisite && !this.patientFlags[subAction.prerequisite.flag]) {
        this.triggerWarning(subAction.prerequisite.warning); return;
      }
      this.saveHistory();
      this.closeToolboxModal();

      if (subAction.fatal_condition && this.patientFlags[subAction.fatal_condition]) {
        this.toolboxGameOverMsg = subAction.fatal_message;
        this.isPaused = true; clearInterval(this.timerInterval); return;
      }
      if (subAction.fatal_condition === "no_collar" && !this.patientFlags['c_collar_on']) {
        this.toolboxGameOverMsg = subAction.fatal_message;
        this.isPaused = true; clearInterval(this.timerInterval); return;
      }

      if (delegateToAssistant) {
        if (this.assistantTask) {
          this.triggerWarning("⚠️ 處置錯誤：副手目前正在忙碌中，無法接辦新任務！");
          this.historyStack.pop(); return;
        }
        this.assistantTask = { subAction: subAction, time_left: subAction.time_cost };
        this.actionLogs.unshift(`🗣️ 指示副手執行：${subAction.name}...`);
        return;
      }

      this.simulateActionWait(subAction.name, subAction.time_cost, () => {
        this.applyActionEffects(subAction);
      });
    },

    applyActionEffects(subAction) {
      if (subAction.set_flag) this.patientFlags[subAction.set_flag] = true;
      if (subAction.vital_updates) {
        for (const [k, v] of Object.entries(subAction.vital_updates)) this.patientVitals[k] = v;
      }
      if (subAction.log) this.actionLogs.unshift(`🩺 ${subAction.log}`);
    },

    simulateActionWait(text, gameTimeCost, callback) {
      this.isActionInProgress = true;
      this.progressText = `執行中：${text} (耗時 ${gameTimeCost} 秒)...`;
      this.progressPercent = 0;
      const animationTime = 1200;
      const interval = 50;
      const step = 100 / (animationTime / interval);

      const progressInterval = setInterval(() => {
        this.progressPercent += step;
        if (this.progressPercent >= 100) {
          clearInterval(progressInterval);
          this.advanceTime(gameTimeCost);
          this.isActionInProgress = false;
          callback();
        }
      }, interval);
    }
  },
  unmounted() { if (this.timerInterval) clearInterval(this.timerInterval); }
}