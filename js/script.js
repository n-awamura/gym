// Firestore関連のインポート（必要に応じて使用）
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", function () {
  // --------------------------------
  // 基本の年月情報
  // --------------------------------
  let currentYear = new Date().getFullYear();
  let currentMonth = new Date().getMonth() + 1; // 1～12

  // --------------------------------
  // ヘルパー関数
  // --------------------------------
  function zeroPad(num) {
    return String(num).padStart(2, "0");
  }

  // localStorage から記録を取得
  function getRecords() {
    return JSON.parse(localStorage.getItem("trainingRecords")) || [];
  }

  // localStorage に記録を保存
  function saveRecords(records) {
    localStorage.setItem("trainingRecords", JSON.stringify(records));
  }

  /**
   * 指定した dateStr (YYYY-MM-DD) より過去で、
   * bodyPart === part のうち最も近い日付のレコードを返す
   * 見つからなければ null
   */
  function getNearestRecord(dateStr, part) {
    if (!part) return null;
    const currentDate = new Date(dateStr); // 例: "2025-03-08"
    const records = getRecords();
    // 指定部位かつ、日付が過去のレコードのみ抽出
    const filtered = records.filter(r => {
      if (!r.bodyPart || r.bodyPart !== part) return false;
      const rDate = new Date(r.date);
      return rDate < currentDate;
    });
    if (filtered.length === 0) return null;
    // 日付が近い順に降順ソート（最新の過去レコードを先頭に）
    filtered.sort((a, b) => (a.date < b.date ? 1 : (a.date > b.date ? -1 : 0)));
    return filtered[0] || null;
  }

  // ▼ <YYYY年M月> 形式で表示 (HTML側は id="monthDisplay")
  function updateMonthDisplay() {
    const md = document.getElementById("monthDisplay");
    if (md) {
      md.textContent = `${currentYear}年${currentMonth}月`;
    }
  }

  // ▼ 部位（上半身・下半身）の選択値を返す関数（プルダウンに対応）
  function getSelectedBodyPart() {
    const select = document.getElementById("bodyPartSelect");
    return select ? select.value : "";
  }

  // --------------------------------
  // カレンダー生成（index.html 用）
  // --------------------------------
  function generateCalendar(year, month) {
    const calendarContainer = document.querySelector(".calendar");
    if (!calendarContainer) return;
    calendarContainer.innerHTML = "";
  
    const allRecords = getRecords();
  
    // 曜日ヘッダー（月曜始まり）
    const weekdays = ["月", "火", "水", "木", "金", "土", "日"];
    const headerRow = document.createElement("div");
    headerRow.classList.add("calendar-header");
    headerRow.style.display = "grid";
    headerRow.style.gridTemplateColumns = "repeat(7, 1fr)";
    weekdays.forEach((day) => {
      const headerCell = document.createElement("div");
      headerCell.classList.add("header-cell");
      headerCell.textContent = day;
      headerRow.appendChild(headerCell);
    });
    calendarContainer.appendChild(headerRow);
  
    // カレンダーグリッド
    const calendarGrid = document.createElement("div");
    calendarGrid.classList.add("calendar-grid");
    calendarGrid.style.display = "grid";
    calendarGrid.style.gridTemplateColumns = "repeat(7, 1fr)";
  
    const firstDay = new Date(year, month - 1, 1);
    const lastDate = new Date(year, month, 0).getDate();
    let startDay = firstDay.getDay(); // 0 = 日曜, 6 = 土曜
    if (startDay === 0) startDay = 7;
    const offset = startDay - 1;
  
    // 前月分の空白セル
    for (let i = 0; i < offset; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.classList.add("calendar-day", "empty-day");
      calendarGrid.appendChild(emptyCell);
    }
  
    // 当月のセル
    for (let date = 1; date <= lastDate; date++) {
      const cell = document.createElement("div");
      cell.classList.add("calendar-day");
  
      // 日付表示
      const dayInfo = document.createElement("div");
      dayInfo.classList.add("day-info");
      dayInfo.textContent = date;
      cell.appendChild(dayInfo);
  
      // localStorage から該当日の記録取得
      const dateKey = `${year}-${zeroPad(month)}-${zeroPad(date)}`;
      const foundRecord = allRecords.find((r) => r.date === dateKey);
      if (foundRecord) {
        const summaryDiv = document.createElement("div");
        summaryDiv.classList.add("day-summary");
        summaryDiv.textContent =
          foundRecord.bodyPart === "upper" ? "上半身" : "下半身";
        cell.appendChild(summaryDiv);
      }
  
      // 編集ボタン
      const recordButton = document.createElement("button");
      recordButton.classList.add("edit-button", "btn", "btn-sm");
      recordButton.innerHTML = '<i class="bi bi-pencil"></i>';
      recordButton.addEventListener("click", () => {
        openModalForDate(year, month, date);
      });
      cell.appendChild(recordButton);
  
      calendarGrid.appendChild(cell);
    }
  
    // 末尾に trailing empty cells を追加してグリッドを整える
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
  
  // --------------------------------
  // モーダルを開く（index.html 用）
  // --------------------------------
  function openModalForDate(year, month, day) {
    const formattedDate = `${year}-${zeroPad(month)}-${zeroPad(day)}`;
    
    // モーダルヘッダーのタイトルを設定
    const modalTitle = document.getElementById("dayModalLabel");
    if (modalTitle) {
      modalTitle.textContent = `${formattedDate}のログ`;
    }
    
    // 隠しフィールドに日付を設定
    const modalDateInput = document.getElementById("modal-date");
    if (modalDateInput) {
      modalDateInput.value = formattedDate;
    }
    
    // フォームの初期化
    const exerciseContainer = document.getElementById("exercise-container");
    if (exerciseContainer) {
      exerciseContainer.innerHTML = "";
    }
    const bodyPartSelect = document.getElementById("bodyPartSelect");
    if (bodyPartSelect) {
      bodyPartSelect.value = "";
    }
    const memoElem = document.getElementById("modalMemo");
    if (memoElem) {
      memoElem.value = "";
    }
    
    // 既存レコードのチェック
    const records = getRecords();
    const recordIndex = records.findIndex((r) => r.date === formattedDate);
    const record = records[recordIndex] || null;
    
    if (record) {
      // 既存レコードがある場合はその内容をロード
      if (bodyPartSelect) {
        bodyPartSelect.value = record.bodyPart;
      }
      record.exercises.forEach((ex) => {
        addExerciseRow(ex.name, ex.weight, ex.reps, ex.sets);
      });
      if (memoElem) {
        memoElem.value = record.memo || "";
      }
      const deleteButton = document.getElementById("deleteRecordButton");
      if (deleteButton) {
        deleteButton.disabled = false;
        deleteButton.onclick = () => {
          deleteRecord(recordIndex);
        };
      }
    } else {
      // 新規の場合は削除ボタンは無効化
      const deleteButton = document.getElementById("deleteRecordButton");
      if (deleteButton) {
        deleteButton.disabled = true;
        deleteButton.onclick = null;
      }
      
      // ここで、新規の場合のみ、部位が選択された際に近いレコードをロードするための処理を追加
      if (bodyPartSelect) {
        // 一度以前の change イベントリスナーを削除（念のため）
        bodyPartSelect.onchange = null;
        bodyPartSelect.addEventListener("change", function onBodyPartChange() {
          const selectedPart = bodyPartSelect.value;
          if (!selectedPart) return;
          // 既存レコードがない場合のみ実行
          if (!record) {
            const nearest = getNearestRecord(formattedDate, selectedPart);
            if (nearest) {
              // 近い記録が見つかった場合、exerciseContainer をクリアしてその種目をロード
              if (exerciseContainer) {
                exerciseContainer.innerHTML = "";
                nearest.exercises.forEach((ex) => {
                  addExerciseRow(ex.name, ex.weight, ex.reps, ex.sets);
                });
              }
              // メモ欄もコピーしたい場合は下記コメントアウトを外す
              // if (memoElem) {
              //   memoElem.value = nearest.memo || "";
              // }
            } else {
              // 近い記録がなければ、固定種目を表示する（必要に応じて）
              setFixedExercises();
            }
          }
        });
      }
    }
    
    // モーダル表示（Bootstrap のメソッド）
    $("#dayModal").modal("show");
    
    // モーダルが表示された直後に bodyPartSelect にフォーカスを移動
    $("#dayModal").on("shown.bs.modal", function () {
      if (bodyPartSelect) {
        bodyPartSelect.focus();
      }
    });
  }
  
  // モーダルが閉じられた直後にカレンダーの「monthLeft」ボタンにフォーカスを戻す
  $("#dayModal").on("hidden.bs.modal", function () {
    const monthLeft = document.getElementById("monthLeft");
    if (monthLeft) {
      monthLeft.focus();
    }
  });
  
  // --------------------------------
  // 記録削除
  // --------------------------------
  function deleteRecord(index) {
    let records = getRecords();
    records.splice(index, 1);
    saveRecords(records);
    if (typeof $ === "function" && $("#dayModal").modal) {
      $("#dayModal").modal("hide");
    }
    generateCalendar(currentYear, currentMonth);
  }
  
  // --------------------------------
  // 種目入力フォーム追加
  // --------------------------------
  function addExerciseRow(name = "", weight = "", reps = "", sets = "") {
    const container = document.getElementById("exercise-container");
    if (!container) return;
    const row = document.createElement("div");
    row.classList.add("exercise-row");
  
    // 1) 種目
    const nameCol = document.createElement("div");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.classList.add("form-control", "exercise-name");
    nameInput.placeholder = "種目";
    nameInput.value = name;
    nameCol.appendChild(nameInput);
    row.appendChild(nameCol);
  
    // 2) 負荷 (kg)
    const weightCol = document.createElement("div");
    const weightInput = document.createElement("input");
    weightInput.type = "number";
    weightInput.classList.add("form-control", "exercise-weight");
    weightInput.placeholder = "kg";
    weightInput.value = weight;
    weightCol.appendChild(weightInput);
    row.appendChild(weightCol);
  
    // 3) 回数 (回)
    const repsCol = document.createElement("div");
    const repsInput = document.createElement("input");
    repsInput.type = "number";
    repsInput.classList.add("form-control", "exercise-reps");
    repsInput.placeholder = "回";
    repsInput.value = reps;
    repsCol.appendChild(repsInput);
    row.appendChild(repsCol);
  
    // 4) セット数 (set)
    const setsCol = document.createElement("div");
    const setsInput = document.createElement("input");
    setsInput.type = "number";
    setsInput.classList.add("form-control", "exercise-sets");
    setsInput.placeholder = "set";
    setsInput.value = sets;
    setsCol.appendChild(setsInput);
    row.appendChild(setsCol);
  
    // 5) ゴミ箱ボタン（アイコン：x-circle-fill）
    const delCol = document.createElement("div");
    const delButton = document.createElement("button");
    delButton.type = "button";
    delButton.classList.add("btn", "custom-btn2");
    delButton.innerHTML = '<i class="bi bi-x-circle-fill"></i>';
    delButton.onclick = () => {
      row.remove();
    };
    delCol.appendChild(delButton);
    row.appendChild(delCol);
  
    container.appendChild(row);
  }
  
  // --------------------------------
  // モーダル保存処理
  // --------------------------------
  const saveModalButton = document.getElementById("saveModalButton");
  if (saveModalButton) {
    saveModalButton.addEventListener("click", () => {
      const modalDate = document.getElementById("modal-date") ? document.getElementById("modal-date").value : "";
      const bodyPart = getSelectedBodyPart();
      const exerciseRows = document.querySelectorAll(".exercise-row");
      let exercises = [];
  
      exerciseRows.forEach((row) => {
        const name = row.querySelector(".exercise-name") ? row.querySelector(".exercise-name").value : "";
        const weight = row.querySelector(".exercise-weight") ? row.querySelector(".exercise-weight").value : "";
        const reps = row.querySelector(".exercise-reps") ? row.querySelector(".exercise-reps").value : "";
        const sets = row.querySelector(".exercise-sets") ? row.querySelector(".exercise-sets").value : "";
        if (name.trim() !== "" || weight !== "" || reps !== "" || sets !== "") {
          exercises.push({ name, weight, reps, sets });
        }
      });
  
      const memoElem = document.getElementById("modalMemo");
      const memo = memoElem ? memoElem.value : "";
      let records = getRecords();
      const recordIndex = records.findIndex((r) => r.date === modalDate);
      const newRecord = { date: modalDate, bodyPart, exercises, memo };
  
      if (recordIndex >= 0) {
        records[recordIndex] = newRecord;
      } else {
        records.push(newRecord);
      }
  
      saveRecords(records);
      if (typeof $ === "function" && $("#dayModal").modal) {
        $("#dayModal").modal("hide");
      }
      generateCalendar(currentYear, currentMonth);
  
      // モーダル保存と同時に自動バックアップ
      backupToFirestore();
    });
  }
  
  // --------------------------------
  // 種目追加ボタンのイベント
  // --------------------------------
  const addExerciseBtn = document.getElementById("add-exercise");
  if (addExerciseBtn) {
    addExerciseBtn.addEventListener("click", () => {
      addExerciseRow();
    });
  }
  
  // --------------------------------
  // 固定種目を自動表示する関数（部位プルダウンの change イベント対応）
  // --------------------------------
  function setFixedExercises() {
    const exerciseContainer = document.getElementById("exercise-container");
    if (exerciseContainer) {
      exerciseContainer.innerHTML = "";
      const selected = getSelectedBodyPart(); // "upper" or "lower"
      const fixedUpper = ["ラット", "アブ", "チェスト", "ロー", "トーソ"];
      const fixedLower = ["プレス", "カール", "エクス", "アブ", "アダ"];
      if (selected === "upper") {
        fixedUpper.forEach((exName) => {
          addExerciseRow(exName, "", "", "");
        });
      } else if (selected === "lower") {
        fixedLower.forEach((exName) => {
          addExerciseRow(exName, "", "", "");
        });
      }
    }
  }
  
  // --------------------------------
  // 部位プルダウンの change イベント設定（※通常の固定種目用）
  // --------------------------------
  const bodyPartSelectGlobal = document.getElementById("bodyPartSelect");
  if (bodyPartSelectGlobal) {
    bodyPartSelectGlobal.addEventListener("change", setFixedExercises);
  }
  
  // --------------------------------
  // 初期表示（カレンダー生成など、index.html 用）
  // --------------------------------
  updateMonthDisplay();
  generateCalendar(currentYear, currentMonth);
  
  // --------------------------------
  // 月移動イベント (< と >)（index.html 用）
  // --------------------------------
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
  
  // --------------------------------
  // Firestore 自動バックアップ関連（保存時のみ実行）
  // --------------------------------
  async function restoreFromFirestore() {
    try {
      const backupsCol = collection(window.db, "backups");
      const q = query(backupsCol, orderBy("timestamp", "desc"), limit(1));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        alert("バックアップデータが見つかりませんでした。");
        return;
      }
      let backupData;
      querySnapshot.forEach((docSnap) => {
        backupData = docSnap.data();
      });
      if (backupData && backupData.records) {
        localStorage.setItem("trainingRecords", JSON.stringify(backupData.records));
        alert("Firestoreからのリストアが完了しました。");
        generateCalendar(currentYear, currentMonth);
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
    restoreIcon.addEventListener("click", () => {
      restoreFromFirestore();
    });
  }
  const backupIcon = document.getElementById("backupIcon");
  if (backupIcon) {
    backupIcon.addEventListener("click", () => {
      backupToFirestore();
    });
  }
  
  function backupToFirestore() {
    const trainingRecords = JSON.parse(localStorage.getItem("trainingRecords")) || [];
    const date = new Date();
    const formattedDateBackup = date.toISOString().split("T")[0];
    const backupRef = doc(collection(window.db, "backups"), formattedDateBackup);
    setDoc(backupRef, {
      records: trainingRecords,
      timestamp: serverTimestamp()
    })
      .then(() => {
        console.log("Firestore へのバックアップ成功");
      })
      .catch((error) => {
        console.error("Firestore へのバックアップエラー:", error);
      });
  }
  
  // --------------------------------
  // メモ一覧表示用の処理（memo.html 用）
  // --------------------------------
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
  
    memos.forEach(record => {
      const container = document.createElement("div");
      container.className = "memo-entry mb-3";
  
      const dateElem = document.createElement("h5");
      dateElem.textContent = record.date;
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
});