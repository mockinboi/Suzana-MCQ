// Ace Your Exam - Marketing & Management MCQ
// Quiz + Application Cases + True/False + Revision Sheets + Glossary

(function() {
  const DATA = window.APP_DATA;
  if (!DATA) { document.getElementById('app').innerHTML = '<p style="padding:20px;color:red;">Error: data files not loaded.</p>'; return; }

  const app = document.getElementById('app');
  const appEl = app;
  let state = { screen: 'home', subject: null, mode: null, qIndex: 0, answers: [], score: 0, answered: false, shuffled: [] };

  // === NORMALIZATION: randomly redistribute correct answers ===
  (function normalizeQuestions() {
    function reshuffleOptions(item) {
      if (!item.options || item.correct === undefined) return;
      const correctAnswer = item.options[item.correct];
      const shuffled = [...item.options];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const newCorrect = shuffled.indexOf(correctAnswer);
      item.options = shuffled;
      item.correct = newCorrect;
    }
    for (const subj in DATA.subjects) {
      DATA.subjects[subj].forEach(q => reshuffleOptions(q));
    }
    for (const key in DATA.applicationCases) {
      DATA.applicationCases[key].forEach(c => {
        if (c.questions) c.questions.forEach(q => reshuffleOptions(q));
      });
    }
    console.log('Questions normalized - random distribution of correct answers');
  })();

  // === PERSISTENT ERROR MANAGEMENT ===
  const ERRORS_KEY = 'suzana_errors_v2';
  function getErrorsKey() { return ERRORS_KEY; }
  function loadErrors() { try { return JSON.parse(localStorage.getItem(getErrorsKey()) || '{}'); } catch(e) { return {}; } }
  function saveErrors(errors) { localStorage.setItem(getErrorsKey(), JSON.stringify(errors)); }
  function recordError(questionData, subject) {
    const errors = loadErrors();
    if (!errors[subject]) errors[subject] = {};
    if (!errors[subject][questionData.id]) {
      errors[subject][questionData.id] = { ...questionData, subject, wrongCount: 1, correctStreak: 0, addedAt: Date.now() };
    } else {
      errors[subject][questionData.id].wrongCount++;
      errors[subject][questionData.id].correctStreak = 0;
    }
    saveErrors(errors);
  }
  function recordCorrect(subject, questionId) {
    const errors = loadErrors();
    if (errors[subject] && errors[subject][questionId]) {
      errors[subject][questionId].correctStreak = (errors[subject][questionId].correctStreak || 0) + 1;
      if (errors[subject][questionId].correctStreak >= 5) {
        delete errors[subject][questionId];
        if (Object.keys(errors[subject]).length === 0) delete errors[subject];
        saveErrors(errors);
        return true;
      }
      saveErrors(errors);
      return false;
    }
    return false;
  }
  function getErrorCount() {
    const errors = loadErrors();
    let count = 0;
    for (const subj in errors) count += Object.keys(errors[subj]).length;
    return count;
  }
  function getErrorsForSubject(subject) {
    const errors = loadErrors();
    return errors[subject] ? Object.values(errors[subject]) : [];
  }
  function getAllErrors() {
    const errors = loadErrors();
    const all = [];
    for (const subj in errors) all.push(...Object.values(errors[subj]));
    return all;
  }

  const breathing = [
    "Take a deep breath... exhale slowly. You're making progress, every question brings you closer to success.",
    "Pause. Breathe. You've already come a long way. Every answer, right or wrong, is a step forward.",
    "You're not alone in this preparation. What you learn today will serve you in your future career.",
    "Marketing & Management are dynamic fields. Your persistence is your greatest strength.",
    "Mistake = Learning. Each explanation you read reinforces your long-term memory.",
    "Take a break, drink some water. Your brain needs hydration to function well.",
  ];

  const moods = {
    perfect: ["Excellent! You've mastered this material!", "Impressive! Keep it up!", "Flawless! You're exam-ready!"],
    good: ["Very good! Just a little more effort and it'll be perfect.", "Great work! Your revision is paying off.", "You're progressing well, keep going!"],
    ok: ["Not bad at all. Review the explanations to consolidate.", "You're on the right track. The explanations will help.", "Keep at it, repetition is key to memorization."],
    low: ["Don't get discouraged. Every mistake is a learning opportunity.", "Take the time to read the explanations carefully.", "The exam isn't here yet. You have time to improve."]
  };

  const subjLabels = { mkt: 'Marketing', mgmt: 'Management' };
  const subjIcons = { mkt: '&#x1F4C8;', mgmt: '&#x1F4CA;' };

  function shuffle(arr) { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function getMood(score, total) { if (total === 0) return moods.low; const pct = score / total; if (pct >= 0.9) return moods.perfect; if (pct >= 0.7) return moods.good; if (pct >= 0.5) return moods.ok; return moods.low; }
  function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  // ==================== HOME ====================
  function renderHome() {
    state = { screen: 'home', subject: null, mode: null, qIndex: 0, answers: [], score: 0, answered: false, shuffled: [] };
    const totalMkt = DATA.subjects.mkt.length;
    const totalMgmt = DATA.subjects.mgmt.length;
    const totalCases = (DATA.applicationCases ? DATA.applicationCases.mkt.length + DATA.applicationCases.mgmt.length : 0);
    const totalVF = (DATA.vraiFaux ? (DATA.vraiFaux.mkt ? DATA.vraiFaux.mkt.length : 0) + (DATA.vraiFaux.mgmt ? DATA.vraiFaux.mgmt.length : 0) : 0);
    const totalSheets = (DATA.revisionSheets ? (DATA.revisionSheets.mkt ? DATA.revisionSheets.mkt.length : 0) + (DATA.revisionSheets.mgmt ? DATA.revisionSheets.mgmt.length : 0) : 0);
    const totalGlossary = (DATA.glossary || []).length;
    const errCount = getErrorCount();

    appEl.innerHTML = `
      <div style="text-align:center;margin:4px 0 12px;">
        <span style="font-size:0.85rem;color:var(--muted);">&#x1F4CA; <strong>${totalMkt + totalMgmt}</strong> MCQ · <strong>${totalCases}</strong> cases · <strong>${totalVF}</strong> True/False · <strong>${totalSheets}</strong> sheets · <strong>${totalGlossary}</strong> terms</span>
        ${errCount > 0 ? '<br><span style="font-size:0.8rem;background:var(--accent);color:white;padding:3px 10px;border-radius:12px;display:inline-block;margin-top:6px;">' + errCount + ' error(s) saved</span>' : ''}
      </div>
      <div class="tabs">
        <button class="tab active" onclick="document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));this.classList.add('active');App.showHomeTab('quiz')">&#x1F4DD; MCQ</button>
        <button class="tab" onclick="document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));this.classList.add('active');App.showHomeTab('cases')">&#x1F3E2; Cases</button>
        <button class="tab" onclick="document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));this.classList.add('active');App.showHomeTab('revision')">&#x1F4DA; Revision</button>
      </div>
      <div id="homeTabContent"></div>
    `;
    showHomeTab('quiz');
  }

  function showHomeTab(tab) {
    const ct = document.getElementById('homeTabContent');
    if (!ct) return;
    const totalVF = (DATA.vraiFaux ? Object.values(DATA.vraiFaux).reduce((s,a) => s + (a ? a.length : 0), 0) : 0);
    const totalSheets = (DATA.revisionSheets ? Object.values(DATA.revisionSheets).reduce((s,a) => s + (a ? a.length : 0), 0) : 0);
    const totalGlossary = (DATA.glossary || []).length;
    const totalCases = (DATA.applicationCases ? Object.values(DATA.applicationCases).reduce((s,a) => s + (a ? a.length : 0), 0) : 0);
    if (tab === 'quiz') {
      ct.innerHTML = `
        <div class="home-grid">
          <div class="card special" style="border-left:4px solid var(--accent);background:linear-gradient(135deg,#fff5f5,#fff);" onclick="App.startCrashTest()"><div class="icon">&#x26A1;</div><h3>Crash Test — 25 questions</h3><p>Express quiz mixing Marketing &amp; Management. 25 random questions, results at the end.</p><small>&#x23F1; ~10 min</small></div>
          <div class="card subject-mkt" onclick="App.startQuiz('mkt')"><div class="icon">&#x1F4C8;</div><h3>Marketing</h3><p>Customer value, STP, 4Ps, consumer behavior, brand strategy, digital marketing, pricing...</p><small>${DATA.subjects.mkt.length} MCQ</small></div>
          <div class="card subject-mgmt" onclick="App.startQuiz('mgmt')"><div class="icon">&#x1F4CA;</div><h3>Management</h3><p>Planning, organizing, leading, controlling, strategy, ethics, motivation, leadership...</p><small>${DATA.subjects.mgmt.length} MCQ</small></div>
        </div>`;
    } else if (tab === 'cases') {
      ct.innerHTML = `
        <div class="home-grid">
          <div class="card special" onclick="App.showApplicationCases('mkt')"><div class="icon">&#x1F3E2;</div><h3>Marketing Cases</h3><p>Real-world marketing scenarios with analysis questions</p><small>${(DATA.applicationCases||{}).mkt ? DATA.applicationCases.mkt.length : 0} cases</small></div>
          <div class="card special" onclick="App.showApplicationCases('mgmt')"><div class="icon">&#x1F3E2;</div><h3>Management Cases</h3><p>Real-world management scenarios with analysis questions</p><small>${(DATA.applicationCases||{}).mgmt ? DATA.applicationCases.mgmt.length : 0} cases</small></div>
          <div class="card special" onclick="App.showAllCases()"><div class="icon">&#x1F4D6;</div><h3>All Cases</h3><p>Browse all application cases covering both Marketing and Management</p><small>Full view</small></div>
        </div>`;
    } else if (tab === 'revision') {
      ct.innerHTML = `
        <div class="home-grid">
          <div class="card special" style="border-left:4px solid var(--accent);" onclick="App.showMyErrors()"><div class="icon">&#x1F504;</div><h3>My Errors <span id="errBadge" style="background:var(--accent);color:white;padding:2px 8px;border-radius:10px;font-size:0.75rem;"></span></h3><p>Review only the questions you got wrong — a correct answer removes it from the list!</p><small>Persistent (localStorage)</small></div>
          <div class="card special" onclick="App.startVF()"><div class="icon">&#x2705;</div><h3>True or False</h3><p>Quick quiz — choose TRUE or FALSE for each statement</p><small>${totalVF} questions</small></div>
          <div class="card special" onclick="App.showRevisionSheets()"><div class="icon">&#x1F4CB;</div><h3>Revision Sheets</h3><p>Summaries by topic: Marketing Mix, BCG Matrix, Porter's Five Forces, Maslow, PLC...</p><small>${totalSheets} sheets</small></div>
          <div class="card special" onclick="App.showGlossaire()"><div class="icon">&#x1F4D6;</div><h3>Glossary &amp; Acronyms</h3><p>Definitions of key terms + all acronyms explained (STP, CRM, SBU, BCG, PLC...)</p><small>${totalGlossary} entries</small></div>
        </div>`;
      setTimeout(() => {
        const badge = document.getElementById('errBadge');
        if (badge) {
          const count = getErrorCount();
          badge.textContent = count > 0 ? count + ' error(s)' : 'None';
          badge.style.display = count > 0 ? 'inline' : 'none';
        }
      }, 50);
    }
  }

  // ==================== QUIZ MODE ====================
  function startQuiz(subject) {
    state.subject = subject; state.mode = 'quiz'; state.qIndex = 0; state.answers = []; state.score = 0; state.answered = false;
    state.shuffled = shuffle([...DATA.subjects[subject]]);
    renderQuestion();
  }

  function renderQuestion() {
    if (state.qIndex >= state.shuffled.length) { renderResults(); return; }
    const q = state.shuffled[state.qIndex];
    const total = state.shuffled.length;
    const current = state.qIndex + 1;

    appEl.innerHTML = `
      <div style="margin-bottom:12px;">
        <button class="btn btn-outline btn-sm" onclick="App.renderHome()">&#x2190; Back</button>
        <div class="breathing" style="display:block;margin:8px 0;font-style:italic;color:var(--muted);">${randomItem(breathing)}</div>
      </div>
      <div class="quiz-header">
        <span class="badge">${subjLabels[state.subject]}</span>
        <span class="badge">${q.difficulty === 'easy' ? '&#x2B50;' : q.difficulty === 'medium' ? '&#x2B50;&#x2B50;' : '&#x2B50;&#x2B50;&#x2B50;'}</span>
        <span class="progress">Q ${current}/${total}</span>
        <span class="score">Score: ${state.score}/${state.answers.length}</span>
      </div>
      <div class="question-card">
        <div class="q-number">Q${current}</div>
        <h3>${q.question}</h3>
        <div class="options" id="optionsContainer">
          ${q.options.map((opt, i) => `
            <div class="option" data-index="${i}" onclick="App.selectAnswer(${i})">
              <span class="letter">${String.fromCharCode(65 + i)}</span>
              <span>${(opt||'').substring(3)}</span>
            </div>`).join('')}
        </div>
        <div id="feedbackArea"></div>
      </div>
      <div class="actions">
        ${state.qIndex < total - 1 ? '<button class="btn btn-primary" id="nextBtn" disabled onclick="App.nextQuestion()">Next &#x2192;</button>' : '<button class="btn btn-success" id="nextBtn" disabled onclick="App.nextQuestion()">See Results</button>'}
      </div>`;
  }

  function selectAnswer(index) {
    if (state.answered) return;
    state.answered = true;
    const q = state.shuffled[state.qIndex];
    const isCorrect = index === q.correct;
    state.answers.push({ questionId: q.id, selected: index, correct: q.correct, isCorrect });
    if (isCorrect) state.score++;

    if (!isCorrect && state.mode === 'quiz') {
      recordError({ id: q.id, question: q.question, options: q.options, correct: q.correct, explanation: q.explanation, source: q.source, difficulty: q.difficulty }, state.subject);
    }

    document.querySelectorAll('.option').forEach((opt, i) => {
      opt.classList.add('disabled');
      if (i === q.correct) opt.classList.add('correct');
      if (i === index && !isCorrect) opt.classList.add('wrong');
    });

    const fb = document.getElementById('feedbackArea');
    if (isCorrect) {
      fb.innerHTML = '<div class="memo" style="background:#d5f5e3;border-color:#27ae60;"><strong>&#x2713; ' + randomItem(["Great! Right answer!", "Exactly! You've got this!", "Perfect! Keep going!", "Yes, that's correct!"]) + '</strong></div>';
    } else {
      fb.innerHTML = '<div class="memo"><strong>&#x26A0; Not quite. Correct answer: ' + String.fromCharCode(65 + q.correct) + '</strong><br><br><strong>&#x1F4DD; Explanation:</strong> ' + q.explanation + '<br><br><span class="source">&#x1F4C2; Source: ' + (q.source || '') + '</span></div>';
    }
    const nb = document.getElementById('nextBtn'); if (nb) nb.disabled = false;
  }

  function nextQuestion() { state.qIndex++; state.answered = false; state.qIndex >= state.shuffled.length ? renderResults() : (renderQuestion(), window.scrollTo({top:0,behavior:'smooth'})); }

  function renderResults() {
    const total = state.shuffled.length; const pct = total > 0 ? Math.round((state.score / total) * 100) : 0;
    const mood = randomItem(getMood(state.score, total));
    const wrong = state.answers.filter(a => !a.isCorrect);

    let wrongHtml = '';
    if (wrong.length > 0) {
      wrongHtml = '<div style="text-align:left;margin-top:20px;"><h3 style="margin-bottom:12px;">&#x1F4DD; Review of errors (' + wrong.length + ')</h3>';
      wrong.forEach((a, i) => {
        const q = state.shuffled.find(sq => sq.id === a.questionId); if (!q) return;
        wrongHtml += '<div class="accordion"><div class="accordion-header" onclick="this.nextElementSibling.classList.toggle(\'open\')"><span>Q'+(i+1)+'. ' + q.question.substring(0,80) + '...</span><span style="font-size:0.8rem;">'+(q.difficulty==='hard'?'&#x2B50;&#x2B50;&#x2B50;':q.difficulty==='medium'?'&#x2B50;&#x2B50;':'&#x2B50;')+'</span></div><div class="accordion-content"><p><strong>Your answer:</strong> '+String.fromCharCode(65+a.selected)+' &mdash; <strong>Correct:</strong> '+String.fromCharCode(65+q.correct)+'</p><p style="margin-top:8px;">'+q.explanation+'</p><p style="font-size:0.8rem;color:var(--muted);margin-top:8px;font-style:italic;">&#x1F4C2; '+(q.source||'')+'</p></div></div>';
      });
      wrongHtml += '</div>';
    }

    appEl.innerHTML = `
      <div class="results">
        <h2>${pct>=70?'&#x1F389;':pct>=50?'&#x1F44D;':'&#x1F4AA;'} ${mood}</h2>
        <div class="final-score">${state.score}/${total}</div>
        <p style="font-size:1.2rem;color:var(--muted);">${pct}% success rate</p>
        <div class="stats">
          <div class="stat"><div class="num" style="color:var(--success)">${state.score}</div><div class="label">Correct</div></div>
          <div class="stat"><div class="num" style="color:var(--accent)">${wrong.length}</div><div class="label">Incorrect</div></div>
          <div class="stat"><div class="num">${total}</div><div class="label">Total</div></div>
        </div>
        ${wrongHtml}
        <div class="actions" style="margin-top:24px;">
          <button class="btn btn-primary" onclick="App.startQuiz('${state.subject}')">&#x1F504; Restart</button>
          <button class="btn btn-outline" onclick="App.renderHome()">&#x1F3E0; Home</button>
        </div>
      </div>`;
  }

  // ==================== TRUE / FALSE ====================
  function startVF(subject) {
    if (!subject) {
      appEl.innerHTML = '<div style="margin-bottom:12px;"><button class="btn btn-outline btn-sm" onclick="App.renderHome()">&#x2190; Back</button></div><h2 style="margin:16px 0;">&#x2705; True or False &mdash; Choose your subject</h2><div class="home-grid">' +
        ['mkt','mgmt'].map(s => '<div class="card subject-'+s+'" onclick="App.startVF(\''+s+'\')"><div class="icon">'+subjIcons[s]+'</div><h3>'+subjLabels[s]+'</h3><p>Quick True/False</p><small>' + ((DATA.vraiFaux||{})[s] ? DATA.vraiFaux[s].length : 0) + ' questions</small></div>').join('') +
      '</div>';
      return;
    }
    state.subject = subject; state.mode = 'vf'; state.qIndex = 0; state.answers = []; state.score = 0; state.answered = false;
    state.shuffled = shuffle([...(DATA.vraiFaux||{})[subject] || []]);
    renderVFQuestion();
  }

  function renderVFQuestion() {
    if (state.qIndex >= state.shuffled.length) { renderVFResults(); return; }
    const q = state.shuffled[state.qIndex];
    const total = state.shuffled.length;
    appEl.innerHTML = `
      <div style="margin-bottom:12px;"><button class="btn btn-outline btn-sm" onclick="App.renderHome()">&#x2190; Back</button></div>
      <div class="quiz-header"><span class="badge">${subjLabels[state.subject]} &mdash; True/False</span><span class="progress">Q ${state.qIndex+1}/${total}</span><span class="score">Score: ${state.score}/${state.answers.length}</span></div>
      <div class="question-card">
        <h3 style="font-size:1.1rem;">${q.statement}</h3>
        <p style="color:var(--muted);font-size:0.9rem;text-align:center;margin:12px 0;">Is this statement true or false?</p>
        <div class="options">
          <div class="option" onclick="App.selectVFAnswer(true)"><span class="letter" style="background:var(--success);color:white;">T</span><span>TRUE</span></div>
          <div class="option" onclick="App.selectVFAnswer(false)"><span class="letter" style="background:var(--accent);color:white;">F</span><span>FALSE</span></div>
        </div>
        <div id="feedbackArea"></div>
      </div>
      <div class="actions">
        ${state.qIndex < total - 1 ? '<button class="btn btn-primary" id="nextBtn" disabled onclick="App.nextVFQuestion()">Next &#x2192;</button>' : '<button class="btn btn-success" id="nextBtn" disabled onclick="App.nextVFQuestion()">See Results</button>'}
      </div>`;
  }

  function selectVFAnswer(userAnswer) {
    if (state.answered) return;
    state.answered = true;
    const q = state.shuffled[state.qIndex];
    const isCorrect = userAnswer === q.answer;
    state.answers.push({ questionId: q.id, selected: userAnswer, correct: q.answer, isCorrect });
    if (isCorrect) state.score++;

    if (!isCorrect && state.mode === 'vf') {
      recordError({ id: q.id, question: q.statement, options: ['TRUE', 'FALSE'], correct: q.answer ? 0 : 1, explanation: q.explanation, source: q.source, difficulty: 'easy' }, state.subject);
    }

    document.querySelectorAll('.option').forEach(opt => opt.classList.add('disabled'));
    const opts = document.querySelectorAll('.option');
    const correctIdx = q.answer ? 0 : 1;
    const selectedIdx = userAnswer ? 0 : 1;
    if (opts[correctIdx]) opts[correctIdx].classList.add('correct');
    if (!isCorrect && opts[selectedIdx]) opts[selectedIdx].classList.add('wrong');

    const fb = document.getElementById('feedbackArea');
    if (isCorrect) {
      fb.innerHTML = '<div class="memo" style="background:#d5f5e3;border-color:#27ae60;"><strong>&#x2713; Correct!</strong></div>';
    } else {
      fb.innerHTML = '<div class="memo"><strong>&#x26A0; ' + (q.answer ? 'TRUE' : 'FALSE') + '!</strong> ' + q.explanation + '<br><span class="source">&#x1F4C2; '+(q.source||'')+'</span></div>';
    }
    const nb = document.getElementById('nextBtn'); if (nb) nb.disabled = false;
  }

  function nextVFQuestion() { state.qIndex++; state.answered = false; state.qIndex >= state.shuffled.length ? renderVFResults() : (renderVFQuestion(), window.scrollTo({top:0,behavior:'smooth'})); }

  function renderVFResults() {
    const total = state.shuffled.length; const pct = total > 0 ? Math.round((state.score / total) * 100) : 0;
    const wrong = state.answers.filter(a => !a.isCorrect);
    let wrongHtml = '';
    if (wrong.length > 0) {
      wrongHtml = '<div style="text-align:left;margin-top:20px;"><h3>&#x1F4DD; Review ('+wrong.length+')</h3>';
      wrong.forEach((a, i) => {
        const q = state.shuffled.find(sq => sq.id === a.questionId); if (!q) return;
        wrongHtml += '<div class="accordion"><div class="accordion-header" onclick="this.nextElementSibling.classList.toggle(\'open\')"><span>Q'+(i+1)+'. '+q.statement.substring(0,80)+'...</span></div><div class="accordion-content"><p><strong>Answer:</strong> '+(q.answer?'TRUE':'FALSE')+' &mdash; You answered: '+(a.selected?'TRUE':'FALSE')+'</p><p style="margin-top:8px;">'+q.explanation+'</p><p style="font-size:0.8rem;color:var(--muted);margin-top:8px;font-style:italic;">&#x1F4C2; '+(q.source||'')+'</p></div></div>';
      });
      wrongHtml += '</div>';
    }
    appEl.innerHTML = '<div class="results"><h2>'+ (pct>=70?'&#x1F389;':pct>=50?'&#x1F44D;':'&#x1F4AA;') + ' '+randomItem(getMood(state.score,total))+'</h2><div class="final-score">'+state.score+'/'+total+'</div><p style="font-size:1.2rem;color:var(--muted);">'+pct+'%</p><div class="stats"><div class="stat"><div class="num" style="color:var(--success)">'+state.score+'</div><div class="label">Correct</div></div><div class="stat"><div class="num" style="color:var(--accent)">'+wrong.length+'</div><div class="label">Incorrect</div></div><div class="stat"><div class="num">'+total+'</div><div class="label">Total</div></div></div>'+wrongHtml+'<div class="actions" style="margin-top:24px;"><button class="btn btn-primary" onclick="App.startVF(\''+state.subject+'\')">&#x1F504; Restart</button><button class="btn btn-outline" onclick="App.renderHome()">&#x1F3E0; Home</button></div></div>';
  }

  // ==================== REVISION SHEETS ====================
  function showRevisionSheets(subject) {
    if (!subject) {
      appEl.innerHTML = '<div style="margin-bottom:12px;"><button class="btn btn-outline btn-sm" onclick="App.renderHome()">&#x2190; Back</button></div><h2 style="margin:16px 0;">&#x1F4CB; Revision Sheets &mdash; Choose your subject</h2><div class="home-grid">' +
        ['mkt','mgmt'].map(s => '<div class="card subject-'+s+'" onclick="App.showRevisionSheets(\''+s+'\')"><div class="icon">'+subjIcons[s]+'</div><h3>'+subjLabels[s]+'</h3><p>Summary sheets</p><small>' + ((DATA.revisionSheets||{})[s] ? DATA.revisionSheets[s].length : 0) + ' sheets</small></div>').join('') +
      '</div>';
      return;
    }
    const sheets = (DATA.revisionSheets||{})[subject] || [];
    appEl.innerHTML = '<div style="margin-bottom:12px;"><button class="btn btn-outline btn-sm" onclick="App.showRevisionSheets()">&#x2190; Subjects</button></div><h2 style="margin:16px 0;">&#x1F4CB; Revision Sheets &mdash; '+subjLabels[subject]+'</h2>';
    sheets.forEach(f => {
      const div = document.createElement('div'); div.className = 'case-card';
      div.innerHTML = '<h2>'+f.title+'</h2><div style="white-space:pre-line;line-height:1.7;font-size:0.95rem;margin:12px 0;">'+(f.content||'')+'</div>'+(f.keyPoints ? '<div class="recommendation"><h3>&#x1F511; Key Points</h3>'+f.keyPoints.map(p => '&#x2022; '+p).join('<br>')+'</div>' : '')+(f.source ? '<p style="font-size:0.8rem;color:var(--muted);margin-top:8px;font-style:italic;">&#x1F4C2; '+f.source+'</p>' : '');
      appEl.appendChild(div);
    });
  }

  // ==================== GLOSSARY ====================
  function showGlossaire() {
    const terms = DATA.glossary || [];
    appEl.innerHTML = '<div style="margin-bottom:12px;display:flex;gap:8px;align-items:center;"><button class="btn btn-outline btn-sm" onclick="App.renderHome()">&#x2190; Back</button><input type="text" id="glossaireSearch" placeholder="&#x1F50D; Search a term..." style="flex:1;padding:8px 12px;border:2px solid var(--border);border-radius:8px;font-size:0.95rem;" oninput="App.filterGlossaire()"></div><h2 style="margin:16px 0;">&#x1F4D6; Glossary ('+terms.length+' terms)</h2><div id="glossaireList"></div>';
    renderGlossaireList(terms);
  }

  function renderGlossaireList(terms) {
    const list = document.getElementById('glossaireList'); if (!list) return;
    list.innerHTML = terms.map(t => '<div class="accordion"><div class="accordion-header" onclick="this.nextElementSibling.classList.toggle(\'open\')"><span><strong>'+t.term+'</strong></span><span style="font-size:0.8rem;color:var(--muted);">'+(t.category||'')+'</span></div><div class="accordion-content"><p>'+t.definition+'</p>'+(t.source ? '<p style="font-size:0.8rem;color:var(--muted);margin-top:8px;font-style:italic;">&#x1F4C2; '+t.source+'</p>' : '')+'</div></div>').join('');
  }

  function filterGlossaire() {
    const q = (document.getElementById('glossaireSearch')?.value || '').toLowerCase();
    const terms = (DATA.glossary || []).filter(t => (t.term||'').toLowerCase().includes(q) || (t.definition||'').toLowerCase().includes(q));
    renderGlossaireList(terms);
  }

  // ==================== APPLICATION CASES ====================
  function showApplicationCases(subject) {
    const cases = (DATA.applicationCases||{})[subject] || [];
    appEl.innerHTML = '<div style="margin-bottom:12px;"><button class="btn btn-outline btn-sm" onclick="App.renderHome()">&#x2190; Back</button></div><h2 style="margin:16px 0;">&#x1F3E2; '+subjLabels[subject]+' Cases ('+cases.length+')</h2>';
    cases.forEach(c => renderCase(c));
  }

  function showAllCases() {
    const all = [...((DATA.applicationCases||{}).mkt || []), ...((DATA.applicationCases||{}).mgmt || [])];
    appEl.innerHTML = '<div style="margin-bottom:12px;"><button class="btn btn-outline btn-sm" onclick="App.renderHome()">&#x2190; Back</button></div><h2 style="margin:16px 0;">&#x1F4D6; All Cases ('+all.length+')</h2>';
    all.forEach(c => renderCase(c));
  }

  function renderCase(c) {
    const div = document.createElement('div'); div.className = 'case-card';
    let html = '<h2>'+c.title+'</h2><p style="color:var(--muted);font-size:0.85rem;">'+ (c.subject||'') +'</p>';
    if (c.scenario) html += '<div class="case-content"><p>'+c.scenario+'</p></div>';
    html = addCaseQuestions(html, c);
    if (c.analysis) html += '<div class="case-analysis" style="margin-top:12px;"><h3>&#x1F50D; Analysis</h3><p>'+c.analysis+'</p></div>';
    if (c.recommendation) html += '<div class="recommendation"><h3>&#x1F3AF; Recommendation</h3><p>'+c.recommendation+'</p></div>';
    if (c.sources) html += '<div style="margin-top:8px;font-size:0.8rem;color:var(--muted);">&#x1F4C2; Sources: '+c.sources.join(' ; ')+'</div>';
    div.innerHTML = html; appEl.appendChild(div);
  }

  function addCaseQuestions(html, c) {
    if (!c.questions) return html;
    html += '<div class="case-analysis"><h3>&#x1F4CB; Analysis Questions</h3>';
    c.questions.forEach((q, qi) => {
      const qId = 'case_'+c.id+'_q'+qi;
      html += '<div style="margin-top:12px;"><p><strong>'+(qi+1)+'. '+q.question+'</strong></p><div class="options" style="margin-top:6px;">';
      q.options.forEach((opt, oi) => {
        html += '<div class="option" onclick="App.toggleCaseAnswer(\''+qId+'\','+oi+','+q.correct+',this)"><span class="letter">'+String.fromCharCode(65+oi)+'</span><span>'+((opt||'').substring ? (opt||'').substring(3) : (opt||''))+'</span></div>';
      });
      html += '<div id="feedback_'+qId+'" style="margin-top:8px;"></div></div>';
    });
    html += '</div>';
    return html;
  }

  function toggleCaseAnswer(qId, selected, correct, el) {
    const container = el.parentElement;
    if (container.classList.contains('disabled-answers')) return;
    container.classList.add('disabled-answers');
    container.querySelectorAll('.option').forEach((opt, i) => {
      opt.style.pointerEvents = 'none';
      if (i === correct) opt.classList.add('correct');
      if (i === selected && i !== correct) opt.classList.add('wrong');
    });
    const fb = document.getElementById('feedback_'+qId); if (!fb) return;
    if (selected === correct) {
      fb.innerHTML = '<div class="memo" style="background:#d5f5e3;border-color:#27ae60;"><strong>&#x2713; Correct!</strong></div>';
    } else {
      const qObj = findCaseQuestion(qId);
      fb.innerHTML = '<div class="memo"><strong>&#x26A0; Correct answer: '+String.fromCharCode(65+correct)+'</strong><br>'+(qObj?qObj.explanation:'')+'</div>';
    }
  }

  function findCaseQuestion(qId) {
    const allCases = [...((DATA.applicationCases||{}).mkt || []), ...((DATA.applicationCases||{}).mgmt || [])];
    for (const c of allCases) {
      if (c.questions) for (let qi=0; qi<c.questions.length; qi++) if (qId==='case_'+c.id+'_q'+qi) return c.questions[qi];
    }
    return null;
  }

  // ==================== MY ERRORS (persistent review) ====================
  function showMyErrors() {
    const all = getAllErrors();
    if (all.length === 0) {
      appEl.innerHTML = '<div style="margin-bottom:12px;"><button class="btn btn-outline btn-sm" onclick="App.renderHome()">&#x2190; Back</button></div><div style="text-align:center;padding:40px;"><h2>&#x1F389; No errors recorded!</h2><p style="color:var(--muted);margin-top:8px;">Keep doing MCQs, errors will be saved automatically.</p></div>';
      return;
    }
    const bySubj = {};
    for (const e of all) {
      if (!bySubj[e.subject]) bySubj[e.subject] = [];
      bySubj[e.subject].push(e);
    }
    appEl.innerHTML = '<div style="margin-bottom:12px;"><button class="btn btn-outline btn-sm" onclick="App.renderHome()">&#x2190; Back</button></div><h2 style="margin:16px 0;">&#x1F504; My Errors ('+all.length+')</h2><p style="color:var(--muted);margin-bottom:16px;">Click on a subject to redo only the questions you got wrong. A correct answer removes it from the list.</p>';
    for (const [subj, errs] of Object.entries(bySubj)) {
      const label = subjLabels[subj] || subj;
      const icon = subjIcons[subj] || '&#x1F4DD;';
      const div = document.createElement('div');
      div.className = 'card special';
      div.style.marginBottom = '12px';
      div.innerHTML = '<div class="icon">'+icon+'</div><h3>'+label+'</h3><p>'+errs.length+' question(s) to review</p><small>Click to review</small>';
      div.onclick = () => retryErrors(subj);
      appEl.appendChild(div);
    }
    const resetDiv = document.createElement('div');
    resetDiv.style.cssText = 'text-align:center;margin-top:20px;';
    resetDiv.innerHTML = '<button class="btn btn-outline btn-sm" onclick="if(confirm(\'Delete all recorded errors?\')){localStorage.removeItem(\''+getErrorsKey()+'\');App.showMyErrors();}">&#x1F5D1;&#xFE0F; Reset all errors</button>';
    appEl.appendChild(resetDiv);
  }

  function retryErrors(subject) {
    const errs = getErrorsForSubject(subject);
    if (errs.length === 0) {
      showMyErrors();
      return;
    }
    state.subject = subject;
    state.mode = 'retry';
    state.qIndex = 0;
    state.answers = [];
    state.score = 0;
    state.answered = false;
    state.shuffled = shuffle(errs);
    state.retryTotal = errs.length;
    renderRetryQuestion();
  }

  function renderRetryQuestion() {
    if (state.qIndex >= state.shuffled.length) {
      renderRetryResults();
      return;
    }
    const q = state.shuffled[state.qIndex];
    const total = state.shuffled.length;
    const current = state.qIndex + 1;

    appEl.innerHTML = `
      <div style="margin-bottom:12px;">
        <button class="btn btn-outline btn-sm" onclick="App.showMyErrors()">&#x2190; Back to errors</button>
        <div class="breathing" style="display:block;margin:8px 0;font-style:italic;color:var(--muted);">${randomItem(breathing)}</div>
      </div>
      <div class="quiz-header">
        <span class="badge">&#x1F504; Retry &mdash; ${subjLabels[state.subject]}</span>
        <span class="progress">Q ${current}/${total}</span>
        <span class="score">Corrected: ${state.score}/${state.answers.length}</span>
        <span class="badge" style="background:var(--accent);">&#x274C; ${state.retryTotal - current} remaining</span>
      </div>
      <div class="question-card">
        <div class="q-number">Q${current} &mdash; already ${q.wrongCount || 1} error(s)</div>
        <h3>${q.question}</h3>
        <div class="options" id="optionsContainer">
          ${q.options.map((opt, i) => `
            <div class="option" data-index="${i}" onclick="App.selectRetryAnswer(${i})">
              <span class="letter">${String.fromCharCode(65 + i)}</span>
              <span>${(opt||'').substring ? (opt||'').substring(3) : (opt||'')}</span>
            </div>`).join('')}
        </div>
        <div id="feedbackArea"></div>
      </div>
      <div class="actions">
        ${state.qIndex < total - 1 ? '<button class="btn btn-primary" id="nextBtn" disabled onclick="App.nextRetryQuestion()">Next &#x2192;</button>' : '<button class="btn btn-success" id="nextBtn" disabled onclick="App.nextRetryQuestion()">Finish</button>'}
        <button class="btn btn-outline btn-sm" id="skipBtn" onclick="App.skipRetryQuestion()" style="margin-left:8px;">Skip &#x23ED;</button>
      </div>`;
  }

  function selectRetryAnswer(index) {
    if (state.answered) return;
    state.answered = true;
    const q = state.shuffled[state.qIndex];
    const isCorrect = index === q.correct;

    state.answers.push({ questionId: q.id, selected: index, correct: q.correct, isCorrect });

    document.querySelectorAll('.option').forEach((opt, i) => {
      opt.classList.add('disabled');
      if (i === q.correct) opt.classList.add('correct');
      if (i === index && !isCorrect) opt.classList.add('wrong');
    });

    const fb = document.getElementById('feedbackArea');
    if (isCorrect) {
      state.score++;
      q.correctStreak = (q.correctStreak || 0) + 1;
      const removed = recordCorrect(state.subject, q.id);
      const need = 5;
      const streak = q.correctStreak;
      if (removed || streak >= need) {
        fb.innerHTML = '<div class="memo" style="background:#d5f5e3;border-color:#27ae60;"><strong>&#x2713; Well done! '+need+'/'+need+' correct answers &mdash; error definitively removed! &#x1F389;</strong></div>';
      } else {
        fb.innerHTML = '<div class="memo" style="background:#d5f5e3;border-color:#27ae60;"><strong>&#x2713; Correct!</strong> Progress: <strong>'+streak+'/'+need+'</strong> correct answers. <strong>'+(need-streak)+'</strong> more to validate definitively.<br><div style="background:#ddd;border-radius:4px;height:8px;margin-top:8px;"><div style="background:var(--success);height:100%;border-radius:4px;width:'+Math.round(streak/need*100)+'%;transition:width 0.3s;"></div></div></div>';
      }
    } else {
      const prevStreak = q.correctStreak || 0;
      q.correctStreak = 0;
      recordError({ id: q.id, question: q.question, options: q.options, correct: q.correct, explanation: q.explanation, source: q.source, difficulty: q.difficulty }, state.subject);
      fb.innerHTML = '<div class="memo"><strong>&#x26A0; Still wrong. Correct answer: '+String.fromCharCode(65 + q.correct)+'</strong><br><br><strong>&#x1F4DD; Reminder:</strong> '+q.explanation+'<br><br><span class="source">&#x1F4C2; '+(q.source||'')+'</span><br><br><em>'+(prevStreak > 0 ? 'You had '+prevStreak+'/5 correct answers, counter reset. &#x1F504;' : 'This question stays in your error list.')+'</em></div>';
    }
    const nb = document.getElementById('nextBtn'); if (nb) { nb.disabled = false; nb.focus(); }
  }

  function skipRetryQuestion() {
    state.qIndex++;
    state.answered = false;
    if (state.qIndex >= state.shuffled.length) {
      renderRetryResults();
    } else {
      renderRetryQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function nextRetryQuestion() {
    state.qIndex++;
    state.answered = false;
    if (state.qIndex >= state.shuffled.length) {
      renderRetryResults();
    } else {
      renderRetryQuestion();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function renderRetryResults() {
    const total = state.retryTotal;
    const remaining = getErrorsForSubject(state.subject).length;
    appEl.innerHTML = `
      <div class="results">
        <h2>${remaining === 0 ? '&#x1F389; Congratulations!' : '&#x1F4AA; Keep going!'}</h2>
        <div class="final-score">${state.score}/${total} corrected</div>
        <p style="font-size:1.2rem;color:var(--muted);">${remaining === 0 ? 'All errors in this subject are resolved!' : 'Still '+remaining+' error(s) to correct.'}</p>
        <div class="stats">
          <div class="stat"><div class="num" style="color:var(--success)">${state.score}</div><div class="label">Corrected &#x2713;</div></div>
          <div class="stat"><div class="num" style="color:var(--accent)">${remaining}</div><div class="label">Remaining &#x274C;</div></div>
          <div class="stat"><div class="num">${total}</div><div class="label">Total</div></div>
        </div>
        <div class="actions" style="margin-top:24px;">
          ${remaining > 0 ? '<button class="btn btn-primary" onclick="App.retryErrors(\''+state.subject+'\')">&#x1F504; Continue retry</button>' : ''}
          <button class="btn btn-outline" onclick="App.showMyErrors()">&#x1F4CB; My errors</button>
          <button class="btn btn-outline" onclick="App.renderHome()">&#x1F3E0; Home</button>
        </div>
      </div>`;
  }

  // ==================== GLOSSARY SIDE PANEL ====================
  function toggleGlossary() {
    const panel = document.getElementById('glossaryPanel');
    const overlay = document.getElementById('glossaryOverlay');
    if (!panel || !overlay) return;
    const isOpen = panel.classList.contains('open');
    if (isOpen) {
      panel.classList.remove('open');
      overlay.classList.remove('open');
    } else {
      panel.classList.add('open');
      overlay.classList.add('open');
      renderGlossaryPanelList();
    }
  }

  function renderGlossaryPanelList() {
    const list = document.getElementById('glossaryPanelList');
    if (!list) return;
    const searchVal = (document.getElementById('glossaryPanelSearch')?.value || '').toLowerCase();
    let terms = DATA.glossary || [];
    if (searchVal) {
      terms = terms.filter(t => (t.term||'').toLowerCase().includes(searchVal) || (t.definition||'').toLowerCase().includes(searchVal));
    } else {
      terms = terms.sort((a,b) => (a.term||'').localeCompare(b.term||''));
    }
    if (terms.length === 0) {
      list.innerHTML = '<p style="color:var(--muted);text-align:center;padding:20px;">No results.</p>';
    } else {
      list.innerHTML = terms.map(t => {
        const catTag = t.category ? '<span class="cat">[' + t.category + ']</span>' : '';
        return '<div class="item"><div class="term">' + catTag + ' ' + (t.term||'') + '</div><div class="def">' + (t.definition||'') + '</div></div>';
      }).join('');
    }
  }

  function filterGlossaryPanel() { renderGlossaryPanelList(); }

  // Keyboard shortcut Alt+G, Escape
  document.addEventListener('keydown', function(e) {
    if (e.altKey && e.key === 'g') { e.preventDefault(); toggleGlossary(); }
    if (e.key === 'Escape') {
      const panel = document.getElementById('glossaryPanel');
      if (panel && panel.classList.contains('open')) {
        panel.classList.remove('open');
        document.getElementById('glossaryOverlay')?.classList.remove('open');
      }
    }
  });

  // ==================== CRASH TEST (25 random questions) ====================
  function startCrashTest() {
    const allQuestions = [...DATA.subjects.mkt, ...DATA.subjects.mgmt];
    const picked = shuffle(allQuestions).slice(0, 25);
    state.subject = 'crash';
    state.mode = 'quiz';
    state.qIndex = 0;
    state.answers = [];
    state.score = 0;
    state.answered = false;
    state.shuffled = picked;
    renderCrashQuestion();
  }

  function renderCrashQuestion() {
    if (state.qIndex >= state.shuffled.length) { renderCrashResults(); return; }
    const q = state.shuffled[state.qIndex];
    const total = state.shuffled.length;
    const current = state.qIndex + 1;

    appEl.innerHTML = `
      <div style="margin-bottom:12px;">
        <button class="btn btn-outline btn-sm" onclick="App.renderHome()">&#x2190; Back</button>
        <div class="breathing" style="display:block;margin:8px 0;font-style:italic;color:var(--muted);">${randomItem(breathing)}</div>
      </div>
      <div class="quiz-header">
        <span class="badge">&#x26A1; Crash Test</span>
        <span class="progress">Q ${current}/${total}</span>
      </div>
      <div class="question-card">
        <div class="q-number">Q${current}</div>
        <h3>${q.question}</h3>
        <div class="options" id="optionsContainer">
          ${q.options.map((opt, i) => `
            <div class="option" data-index="${i}" onclick="App.selectCrashAnswer(${i})">
              <span class="letter">${String.fromCharCode(65 + i)}</span>
              <span>${(opt||'').substring(3)}</span>
            </div>`).join('')}
        </div>
        <div id="feedbackArea" style="display:none;"></div>
      </div>
      <div class="actions" style="justify-content:center;">
        <span style="color:var(--muted);font-size:0.85rem;">Click your answer to go to the next question</span>
      </div>`;
  }

  function selectCrashAnswer(index) {
    if (state.answered) return;
    state.answered = true;
    const q = state.shuffled[state.qIndex];
    const isCorrect = index === q.correct;
    state.answers.push({ questionId: q.id, selected: index, correct: q.correct, isCorrect });
    if (isCorrect) state.score++;
    if (!isCorrect) {
      let qSubject = 'mkt';
      if (DATA.subjects.mgmt.some(mq => mq.id === q.id)) qSubject = 'mgmt';
      recordError({ id: q.id, question: q.question, options: q.options, correct: q.correct, explanation: q.explanation, source: q.source, difficulty: q.difficulty }, qSubject);
    }
    document.querySelectorAll('.option').forEach((opt, i) => {
      opt.classList.add('disabled');
      if (i === index) opt.classList.add('selected');
    });
    setTimeout(() => nextCrashQuestion(), 400);
  }

  function nextCrashQuestion() {
    state.qIndex++; state.answered = false;
    state.qIndex >= state.shuffled.length ? renderCrashResults() : (renderCrashQuestion(), window.scrollTo({top:0,behavior:'smooth'}));
  }

  function renderCrashResults() {
    const total = state.shuffled.length;
    const pct = total > 0 ? Math.round((state.score / total) * 100) : 0;
    const mood = randomItem(getMood(state.score, total));
    const wrong = state.answers.filter(a => !a.isCorrect);
    let wrongHtml = '';
    if (wrong.length > 0) {
      wrongHtml = '<div style="text-align:left;margin-top:20px;"><h3 style="margin-bottom:12px;">&#x1F4DD; Review of errors ('+wrong.length+')</h3>';
      wrong.forEach((a, i) => {
        const q = state.shuffled.find(sq => sq.id === a.questionId); if (!q) return;
        wrongHtml += '<div class="accordion"><div class="accordion-header" onclick="this.nextElementSibling.classList.toggle(\'open\')"><span>Q'+(i+1)+'. '+q.question.substring(0,80)+'...</span></div><div class="accordion-content"><p><strong>Your answer:</strong> '+String.fromCharCode(65+a.selected)+' &mdash; <strong>Correct:</strong> '+String.fromCharCode(65+q.correct)+'</p><p style="margin-top:8px;">'+q.explanation+'</p><p style="font-size:0.8rem;color:var(--muted);margin-top:8px;font-style:italic;">&#x1F4C2; '+(q.source||'')+'</p></div></div>';
      });
      wrongHtml += '</div>';
    }
    appEl.innerHTML = `
      <div class="results">
        <h2>&#x26A1; ${pct>=70?'&#x1F389;':pct>=50?'&#x1F44D;':'&#x1F4AA;'} ${mood}</h2>
        <div class="final-score">${state.score}/${total}</div>
        <p style="font-size:1.2rem;color:var(--muted);">${pct}% success rate</p>
        <div class="stats">
          <div class="stat"><div class="num" style="color:var(--success)">${state.score}</div><div class="label">Correct</div></div>
          <div class="stat"><div class="num" style="color:var(--accent)">${wrong.length}</div><div class="label">Incorrect</div></div>
          <div class="stat"><div class="num">${total}</div><div class="label">Total</div></div>
        </div>
        ${wrongHtml}
        <div class="actions" style="margin-top:24px;">
          <button class="btn btn-primary" onclick="App.startCrashTest()">&#x1F504; New Crash Test</button>
          <button class="btn btn-outline" onclick="App.renderHome()">&#x1F3E0; Home</button>
        </div>
      </div>`;
  }

  window.App = { renderHome, showHomeTab, startQuiz, selectAnswer, nextQuestion, startVF, selectVFAnswer, nextVFQuestion, showRevisionSheets, showGlossaire, filterGlossaire, showApplicationCases, showAllCases, toggleCaseAnswer, showMyErrors, retryErrors, selectRetryAnswer, skipRetryQuestion, nextRetryQuestion, toggleGlossary, filterGlossaryPanel, startCrashTest, selectCrashAnswer, nextCrashQuestion };
  renderHome();
})();
