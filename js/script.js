import { db } from './firebase-config.js';
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  const tokyo = [35.7, 139.7];
  const taiwan = [23.7, 121.0];

  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth() + 1;

  function zeroPad(num) {
    return String(num).padStart(2, "0");
  }

  function getRecords() {
    return JSON.parse(localStorage.getItem("trainingRecords")) || [];
  }

  function saveRecords(records) {
    localStorage.setItem("trainingRecords", JSON.stringify(records));
  }

  function calculateTotalVolume() {
    const records = getRecords();
    let total = 0;
    records.forEach(record => {
      if (record.exercises && Array.isArray(record.exercises)) {
        record.exercises.forEach(ex => {
          const weight = parseFloat(ex.weight) || 0;
          const reps = parseFloat(ex.reps) || 0;
          const sets = parseFloat(ex.sets) || 0;
          total += weight * reps * sets;
        });
      }
    });
    return total;
  }

  function updateTotalVolume() {
    const totalVolumeElem = document.getElementById("totalVolume");
    if (totalVolumeElem) {
      totalVolumeElem.textContent = "総合トレーニングボリューム: " + calculateTotalVolume();
    }
  }

  function getNearestRecord(dateStr, part) {
    if (!part) return null;
    const currentDate = new Date(dateStr);
    const records = getRecords();
    const filtered = records.filter(r => {
      if (!r.bodyPart || r.bodyPart !== part) return false;
      const rDate = new Date(r.date);
      return rDate < currentDate;
    });
    if (filtered.length === 0) return null;
    filtered.sort((a, b) => (a.date < b.date ? 1 : (a.date > b.date ? -1 : 0)));
    return filtered[0] || null;
  }

  function updateMonthDisplay() {
    const md = document.getElementById("monthDisplay");
    if (md) {
      md.textContent = `${currentYear}年${currentMonth}月`;
    }
  }

  function getSelectedBodyPart() {
    const select = document.getElementById("bodyPartSelect");
    return select ? select.value : "";
  }

  function generateCalendar(year, month) {
    const calendarContainer = document.querySelector(".calendar");
    if (!calendarContainer) return;
    calendarContainer.innerHTML = "";

    const allRecords = getRecords();

    const weekdays = ["月", "火", "水", "木", "金", "土", "日"];
    const headerRow = document.createElement("div");
    headerRow.classList.add("calendar-header");
    headerRow.style.display = "grid";
    headerRow.style.gridTemplateColumns = "repeat(7, 1fr)";
    weekdays.forEach(day => {
      const headerCell = document.createElement("div");
      headerCell.classList.add("header-cell");
      headerCell.textContent = day;
      headerRow.appendChild(headerCell);
    });
    calendarContainer.appendChild(headerRow);

    const calendarGrid = document.createElement("div");
    calendarGrid.classList.add("calendar-grid");
    calendarGrid.style.display = "grid";
    calendarGrid.style.gridTemplateColumns = "repeat(7, 1fr)";

    const firstDay = new Date(year, month - 1, 1);
    const lastDate = new Date(year, month, 0).getDate();
    let startDay = firstDay.getDay();
    if (startDay === 0) startDay = 7;
    const offset = startDay - 1;

    for (let i = 0; i < offset; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.classList.add("calendar-day", "empty-day");
      calendarGrid.appendChild(emptyCell);
    }

    for (let date = 1; date <= lastDate; date++) {
      const cell = document.createElement("div");
      cell.classList.add("calendar-day");

      const dayInfo = document.createElement("div");
      dayInfo.classList.add("day-info");
      dayInfo.textContent = date;

      const currentCellDate = `${year}-${zeroPad(month)}-${zeroPad(date)}`;
      if (currentCellDate === getTodayString()) {
        dayInfo.classList.add("today");
      }

      cell.appendChild(dayInfo);

      const dateKey = `${year}-${zeroPad(month)}-${zeroPad(date)}`;
      const foundRecord = allRecords.find(r => r.date === dateKey);
      if (foundRecord) {
        const summaryDiv = document.createElement("div");
        summaryDiv.classList.add("day-summary");
        summaryDiv.textContent = (foundRecord.bodyPart === "upper") ? "上半身" : "下半身";
        cell.appendChild(summaryDiv);
      }

      const recordButton = document.createElement("button");
      recordButton.classList.add("edit-button", "btn", "btn-sm");
      recordButton.innerHTML = '<i class="bi bi-pencil"></i>';
      recordButton.addEventListener("click", () => {
        openModalForDate(year, month, date);
      });
      cell.appendChild(recordButton);

      calendarGrid.appendChild(cell);
    }

    const totalCells = offset + lastDate;
    const remainder = totalCells % 7;
    if (remainder > 0) {
      const trailingEmptyCells = 7 - remainder;
      for (let i = 0; i < trailingEmptyCells; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.classList.add("calendar-day", "empty-day");
        calendarGrid.appendChild(emptyCell);
      }
    }
    calendarContainer.appendChild(calendarGrid);
  }

  function getTodayString() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function openModalForDate(year, month, day) {
    const formattedDate = `${year}-${zeroPad(month)}-${zeroPad(day)}`;
    const modalTitle = document.getElementById("dayModalLabel");
    if (modalTitle) modalTitle.textContent = `${formattedDate}のログ`;
    const modalDateInput = document.getElementById("modal-date");
    if (modalDateInput) modalDateInput.value = formattedDate;

    const exerciseContainer = document.getElementById("exercise-container");
    if (exerciseContainer) exerciseContainer.innerHTML = "";
    const bodyPartSelect = document.getElementById("bodyPartSelect");
    if (bodyPartSelect) bodyPartSelect.value = "";
    const memoElem = document.getElementById("modalMemo");
    if (memoElem) memoElem.value = "";

    const records = getRecords();
    const recordIndex = records.findIndex(r => r.date === formattedDate);
    const record = records[recordIndex] || null;

    if (record) {
      if (bodyPartSelect) bodyPartSelect.value = record.bodyPart;
      record.exercises.forEach(ex => {
        addExerciseRow(ex.name, ex.weight, ex.reps, ex.sets);
      });
      if (memoElem) memoElem.value = record.memo || "";
      const deleteButton = document.getElementById("deleteRecordButton");
      if (deleteButton) {
        deleteButton.disabled = false;
        deleteButton.onclick = () => { deleteRecord(recordIndex); };
      }
    } else {
      const deleteButton = document.getElementById("deleteRecordButton");
      if (deleteButton) {
        deleteButton.disabled = true;
        deleteButton.onclick = null;
      }
      if (bodyPartSelect) {
        bodyPartSelect.onchange = null;
        bodyPartSelect.addEventListener("change", function onBodyPartChange() {
          const selectedPart = bodyPartSelect.value;
          if (!selectedPart) return;
          if (!record) {
            const nearest = getNearestRecord(formattedDate, selectedPart);
            if (nearest && exerciseContainer) {
              exerciseContainer.innerHTML = "";
              nearest.exercises.forEach(ex => {
                addExerciseRow(ex.name, ex.weight, ex.reps, ex.sets);
              });
            }
          }
        });
      }
    }
    $("#dayModal").modal("show");
    $("#dayModal").on("shown.bs.modal", function () {
      if (bodyPartSelect) bodyPartSelect.focus();
    });
  }

  $("#dayModal").on("hidden.bs.modal", function () {
    const monthLeft = document.getElementById("monthLeft");
    if (monthLeft) monthLeft.focus();
  });

  function deleteRecord(index) {
    let records = getRecords();
    records.splice(index, 1);
    saveRecords(records);
    $("#dayModal").modal("hide");
    generateCalendar(currentYear, currentMonth);
    updateTotalVolume(); // 削除後に総合計更新
  }

  function addExerciseRow(name = "", weight = "", reps = "", sets = "") {
    const container = document.getElementById("exercise-container");
    if (!container) return;
    const row = document.createElement("div");
    row.classList.add("exercise-row");

    // 種目
    const nameCol = document.createElement("div");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.classList.add("form-control", "exercise-name");
    nameInput.placeholder = "種目";
    nameInput.value = name;
    nameCol.appendChild(nameInput);
    row.appendChild(nameCol);

    // 負荷 (kg)
    const weightCol = document.createElement("div");
    const weightInput = document.createElement("input");
    weightInput.type = "number";
    weightInput.classList.add("form-control", "exercise-weight");
    weightInput.placeholder = "kg";
    weightInput.value = weight;
    weightCol.appendChild(weightInput);
    row.appendChild(weightCol);

    // 回数 (回)
    const repsCol = document.createElement("div");
    const repsInput = document.createElement("input");
    repsInput.type = "number";
    repsInput.classList.add("form-control", "exercise-reps");
    repsInput.placeholder = "回";
    repsInput.value = reps;
    repsCol.appendChild(repsInput);
    row.appendChild(repsCol);

    // セット数 (set)
    const setsCol = document.createElement("div");
    const setsInput = document.createElement("input");
    setsInput.type = "number";
    setsInput.classList.add("form-control", "exercise-sets");
    setsInput.placeholder = "set";
    setsInput.value = sets;
    setsCol.appendChild(setsInput);
    row.appendChild(setsCol);

    // ゴミ箱ボタン
    const delCol = document.createElement("div");
    const delButton = document.createElement("button");
    delButton.type = "button";
    delButton.classList.add("btn", "custom-btn2");
    delButton.innerHTML = '<i class="bi bi-x-circle-fill"></i>';
    delButton.onclick = () => { row.remove(); };
    delCol.appendChild(delButton);
    row.appendChild(delCol);

    container.appendChild(row);
  }

  const saveModalButton = document.getElementById("saveModalButton");
  if (saveModalButton) {
    saveModalButton.addEventListener("click", () => {
      const modalDate = document.getElementById("modal-date") ? document.getElementById("modal-date").value : "";
      const bodyPart = getSelectedBodyPart();
      const exerciseRows = document.querySelectorAll(".exercise-row");
      let exercises = [];

      exerciseRows.forEach(row => {
        const name = row.querySelector(".exercise-name")?.value || "";
        const weight = row.querySelector(".exercise-weight")?.value || "";
        const reps = row.querySelector(".exercise-reps")?.value || "";
        const sets = row.querySelector(".exercise-sets")?.value || "";
        if (name.trim() !== "" || weight !== "" || reps !== "" || sets !== "") {
          exercises.push({ name, weight, reps, sets });
        }
      });

      const memoElem = document.getElementById("modalMemo");
      const memo = memoElem ? memoElem.value : "";
      let records = getRecords();
      const recordIndex = records.findIndex(r => r.date === modalDate);
      const newRecord = { date: modalDate, bodyPart, exercises, memo };

      if (recordIndex >= 0) {
        records[recordIndex] = newRecord;
      } else {
        records.push(newRecord);
      }

      saveRecords(records);
      $("#dayModal").modal("hide");
      generateCalendar(currentYear, currentMonth);
      updateTotalVolume(); // 保存後に総合計更新

      backupToFirestore();
    });
  }

  const addExerciseBtn = document.getElementById("add-exercise");
  if (addExerciseBtn) {
    addExerciseBtn.addEventListener("click", () => { addExerciseRow(); });
  }

  function setFixedExercises() {
    const exerciseContainer = document.getElementById("exercise-container");
    if (exerciseContainer) {
      exerciseContainer.innerHTML = "";
      const selected = getSelectedBodyPart();
      const fixedUpper = ["ラット", "アブ", "チェスト", "ロー", "トーソ"];
      const fixedLower = ["プレス", "カール", "エクス", "アブ", "アダ"];
      if (selected === "upper") {
        fixedUpper.forEach(exName => { addExerciseRow(exName, "", "", ""); });
      } else if (selected === "lower") {
        fixedLower.forEach(exName => { addExerciseRow(exName, "", "", ""); });
      }
    }
  }

  const bodyPartSelectGlobal = document.getElementById("bodyPartSelect");
  if (bodyPartSelectGlobal) {
    bodyPartSelectGlobal.addEventListener("change", setFixedExercises);
  }

  updateMonthDisplay();
  generateCalendar(currentYear, currentMonth);
  updateTotalVolume(); // ページ読み込み時に総合計表示

  const monthLeft = document.getElementById("monthLeft");
  if (monthLeft) {
    monthLeft.addEventListener("click", () => {
      currentMonth--;
      if (currentMonth < 1) {
        currentMonth = 12;
        currentYear--;
      }
      updateMonthDisplay();
      generateCalendar(currentYear, currentMonth);
    });
  }
  const monthRight = document.getElementById("monthRight");
  if (monthRight) {
    monthRight.addEventListener("click", () => {
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
      updateMonthDisplay();
      generateCalendar(currentYear, currentMonth);
    });
  }

  // Firestore リストア & バックアップ
  async function restoreFromFirestore() {
    try {
      const backupsCol = collection(db, "backups");
      const q = query(backupsCol, orderBy("timestamp", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        alert("バックアップデータが見つかりませんでした。");
        return;
      }
      let backupData;
      querySnapshot.forEach(docSnap => { backupData = docSnap.data(); });
      if (backupData && backupData.records) {
        localStorage.setItem("trainingRecords", JSON.stringify(backupData.records));
        alert("Firestoreからのリストアが完了しました。");
        generateCalendar(currentYear, currentMonth);
        updateTotalVolume(); // リストア後に総合計更新
      } else {
        alert("バックアップデータの形式が不正です。");
      }
    } catch (error) {
      console.error("Firestoreからのリストアエラー:", error);
      alert("Firestoreからのリストアに失敗しました。");
    }
  }

  const restoreIcon = document.getElementById("restoreIcon");
  if (restoreIcon) {
    restoreIcon.addEventListener("click", () => { restoreFromFirestore(); });
  }
  const backupIcon = document.getElementById("backupIcon");
  if (backupIcon) {
    backupIcon.addEventListener("click", () => { backupToFirestore(); });
  }

  function backupToFirestore() {
    const trainingRecords = JSON.parse(localStorage.getItem("trainingRecords")) || [];
    const date = new Date();
    const formattedDateBackup = date.toISOString().split("T")[0];
    const backupRef = doc(collection(db, "backups"), formattedDateBackup);
    setDoc(backupRef, {
      records: trainingRecords,
      timestamp: serverTimestamp()
    })
      .then(() => { console.log("Firestore へのバックアップ成功"); })
      .catch(error => { console.error("Firestore へのバックアップエラー:", error); });
  }

  // メモ一覧表示（memo.html 用）
  function displayMemos() {
    const records = JSON.parse(localStorage.getItem("trainingRecords")) || [];
    const memos = records.filter(record => record.memo && record.memo.trim() !== "");
    memos.sort((a, b) => (a.date < b.date ? 1 : (a.date > b.date ? -1 : 0)));
    const memoList = document.getElementById("memoList");
    if (!memoList) return;
  
    if (memos.length === 0) {
      memoList.innerHTML = "<p>メモはありません。</p>";
      return;
    }
  
    // 曜日の配列。getDay() は0:日～6:土なので対応
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  
    memos.forEach(record => {
      const container = document.createElement("div");
      container.className = "memo-entry mb-3";
      const dateElem = document.createElement("h5");
      
      // record.date は "YYYY-MM-DD" の形式なので、new Date() に渡して曜日を取得
      const dateObj = new Date(record.date);
      const weekday = weekdays[dateObj.getDay()];
      
      // 年月日に加えて曜日を(X)形式で表示する
      dateElem.textContent = `${record.date} (${weekday})`;
      container.appendChild(dateElem);
      
      const memoElem = document.createElement("p");
      memoElem.textContent = record.memo;
      container.appendChild(memoElem);
      
      const hr = document.createElement("hr");
      container.appendChild(hr);
      
      memoList.appendChild(container);
    });
  }
  
  if (document.getElementById("memoList")) {
    displayMemos();
  }

  // ===============================
// ここから象の画像クリックで吹き出し表示／非表示の処理を追加
// ===============================
const elephantImg = document.getElementById("elephantImg");
  const elephantBubble = document.getElementById("elephantBubble");

  if (elephantImg && elephantBubble) {
    elephantImg.addEventListener("click", function() {
      // クリック時にはまず吹き出しを非表示にしておく
      elephantBubble.classList.remove("visible");
      elephantBubble.innerText = "";  // 以前のテキストをクリア

      // API 呼び出しして、結果が返ってきたら表示
      updateSpeechBubble();
    });
  }
  // Gemini API を呼び出す関数
  function Gemini(prompt) {
    return fetch("https://callgemini-jzp4kcwnxa-uc.a.run.app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt })
    })
      .then(res => {
        if (!res.ok) throw new Error("Network error");
        return res.json();
      })
      .then(data => data.result)
      .catch(err => {
        console.error("Gemini error:", err);
        return "エラー";
      });
  }
  

  function getTodayString() {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function createPromptWithDate(dateStr) {
    return `あなたはWikipediaマニアです。${dateStr}が何の日か教えてください。書式は必ず'今日は「XXの日」だゾウ！'にして、XXを含めて18文字以内で出力すること。ハッシュタグなどの他の記号は絶対に入れないこと。`;
  }

  // 吹き出し更新用の関数
  function updateSpeechBubble() {
    const todayStr = getTodayString();
    const prompt = createPromptWithDate(todayStr);

    Gemini(prompt).then(result => {
      // APIの結果が返ってきたら吹き出し内にテキストをセットし、表示状態にする
      elephantBubble.innerText = result;
      elephantBubble.classList.add("visible");
    
    // 8秒後に吹き出しを自動で非表示にする
    setTimeout(() => {
      elephantBubble.classList.remove("visible");
    }, 6000);

    });
  }
});
