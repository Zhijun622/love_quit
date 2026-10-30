(() => {
  "use strict";
  const data = window.QUIZ_DATA;
  const $ = (id) => document.getElementById(id);
  const screens = ["start-screen", "quiz-screen", "result-screen"];
  let current = 0;
  let answers = Array(data.questions.length).fill(null);
  let lastResultText = "";

  const showScreen = (id) => {
    screens.forEach((screenId) => $(screenId).classList.toggle("hidden", screenId !== id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function renderQuestion() {
    const q = data.questions[current];
    const answered = answers[current] !== null;
    $("current-number").textContent = String(current + 1).padStart(2, "0");
    $("question-index").textContent = `QUESTION ${String(current + 1).padStart(2, "0")}`;
    $("question-title").textContent = q.question;
    const percent = Math.round(((current + 1) / data.questions.length) * 100);
    $("progress-fill").style.width = `${percent}%`;
    $("progress-percent").textContent = `${percent}%`;
    $("options-list").innerHTML = "";
    q.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option" + (answers[current] === option.key ? " selected" : "");
      button.setAttribute("aria-pressed", answers[current] === option.key ? "true" : "false");
      const key = document.createElement("span");
      key.className = "option-key";
      key.textContent = option.key;
      const text = document.createElement("span");
      text.className = "option-text";
      text.textContent = option.text;
      button.append(key, text);
      button.addEventListener("click", () => {
        answers[current] = option.key;
        renderQuestion();
      });
      $("options-list").appendChild(button);
    });
    $("prev-btn").disabled = current === 0;
    $("next-btn").disabled = !answered;
    $("next-btn").innerHTML = current === data.questions.length - 1
      ? "查看结果 <span>✧</span>" : "下一题 <span>→</span>";
  }

  function getOutcome(counts) {
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const [first, second, third] = sorted;
    // 先判断三高：前三名的分数跨度不超过 2，即归入多面型。
    if (first[1] - third[1] <= 2) return { key: "BALANCED", reason: "前三项分数接近，偏好较为多元" };
    // 纯型：最高项至少比其余每一项多 3 个。
    if (first[1] - second[1] >= 3) return { key: first[0], reason: `${first[0]} 比第二高的选项多 ${first[1] - second[1]} 次，达到纯型判定条件` };
    // 双高：最高与次高相差不超过 2，按两项组合映射。
    const pair = [first[0], second[0]].sort().join("");
    return { key: pair, reason: `${first[0]} 与 ${second[0]} 两项分数接近，归入双高混合型` };
  }

  function renderResult() {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    answers.forEach((answer) => { if (answer) counts[answer] += 1; });
    const outcome = getOutcome(counts);
    const result = data.results[outcome.key];
    $("result-title").textContent = result.title;
    $("result-tag").textContent = result.tag;
    $("result-summary").textContent = result.summary;
    $("result-scene").textContent = result.scene;
    $("result-why").textContent = result.why;
    $("result-match").textContent = result.match;
    $("score-bars").innerHTML = "";
    Object.entries(counts).forEach(([key, value]) => {
      const row = document.createElement("div");
      row.className = "score-row";
      const label = document.createElement("strong");
      label.textContent = key;
      const track = document.createElement("div");
      track.className = "score-track";
      const fill = document.createElement("div");
      fill.className = "score-fill";
      fill.style.width = `${(value / data.questions.length) * 100}%`;
      track.appendChild(fill);
      const number = document.createElement("span");
      number.className = "score-value";
      number.textContent = value;
      row.append(label, track, number);
      $("score-bars").appendChild(row);
    });
    $("score-explain").textContent = `计分结果：${outcome.reason}。A=${counts.A}，B=${counts.B}，C=${counts.C}，D=${counts.D}。`;
    lastResultText = `我的测试结果是「${result.title}」\n${result.tag}\n\n${result.summary}\n\n来测测你的互动偏好：${window.location.href}`;
    $("share-feedback").textContent = "";
    showScreen("result-screen");
  }

  $("start-btn").addEventListener("click", () => {
    current = 0;
    answers = Array(data.questions.length).fill(null);
    renderQuestion();
    showScreen("quiz-screen");
  });
  $("prev-btn").addEventListener("click", () => {
    if (current > 0) { current -= 1; renderQuestion(); }
  });
  $("next-btn").addEventListener("click", () => {
    if (answers[current] === null) return;
    if (current < data.questions.length - 1) {
      current += 1;
      renderQuestion();
    } else {
      renderResult();
    }
  });
  $("restart-btn").addEventListener("click", () => {
    current = 0;
    answers = Array(data.questions.length).fill(null);
    showScreen("start-screen");
  });
  $("share-btn").addEventListener("click", async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "测测你的 XP", text: lastResultText });
        $("share-feedback").textContent = "已打开系统分享面板。";
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(lastResultText);
        $("share-feedback").textContent = "结果文案已复制，可以分享给朋友啦。";
      } else {
        const area = document.createElement("textarea");
        area.value = lastResultText;
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        document.execCommand("copy");
        area.remove();
        $("share-feedback").textContent = "结果文案已复制，可以分享给朋友啦。";
      }
    } catch (error) {
      if (error && error.name !== "AbortError") $("share-feedback").textContent = "分享暂不可用，你可以截图保存结果。";
    }
  });

  // 支持通过 ?start=1 直接进入答题页，方便将链接发给参与者。
  if (new URLSearchParams(window.location.search).get("start") === "1") {
    current = 0;
    renderQuestion();
    showScreen("quiz-screen");
  }
})();
