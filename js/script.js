// login.html 用のコード (ログイン処理)
if (window.location.href.includes('login.html')) {
    if (document.querySelector('form')) {

        // ユーザー情報をJSON形式で記述 (本来はサーバー側で管理)
        const users = [
            { email: 'test@example.com', password: 'password' },
            { email: 'user2@example.com', password: 'password2' } // 複数ユーザーも可能
        ];

        document.querySelector('form').addEventListener('submit', function(event) {
            event.preventDefault();

            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                window.location.href = 'index.html';
            } else {
                alert('メールアドレスまたはパスワードが違います');
            }
        });
    }
} else { // index.html 用の処理

    // 今日の日付を取得
    const today = new Date();

    // カレンダーを生成する関数
    function generateCalendar(year, month, trainingData = {}) {
        console.log("generateCalendar function called!");
        console.log("Year:", year, "Month:", month, "TrainingData:", trainingData);

        document.getElementById('current-year').textContent = year;
        document.getElementById('current-month').textContent = month + 1;

        const calendarDiv = document.querySelector('.calendar');
        calendarDiv.innerHTML = ''; // 既存のカレンダーをクリア

        const daysInMonth = new Date(year, month + 1, 0).getDate(); // 月の最終日を取得
        const firstDayOfWeek = new Date(year, month, 1).getDay(); // 月の最初の日の曜日

        // 曜日ヘッダー
        const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
        let headerRow = '<div class="row">';
        for (const day of weekDays) {
            headerRow += `<div class="col-md-1 calendar-day"><strong>${day}</strong></div>`;
        }
        headerRow += '</div>';
        calendarDiv.innerHTML += headerRow;

        let dayCounter = 1;
        let calendarHTML = '<div class="row">';

        // 最初の週の空白セル
        for (let i = 0; i < firstDayOfWeek; i++) {
            calendarHTML += '<div class="col-md-1 calendar-day"></div>';
        }

        // 日付セル
        while (dayCounter <= daysInMonth) {
            let dayClass = 'calendar-day';
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayCounter).padStart(2, '0')}`;

            console.log("Date:", dateStr);
            console.log("Training Data for this date:", trainingData[dateStr]);

            // LocalStorageのデータに基づいて gym-day クラスを適用
            if (trainingData[dateStr]) {
                dayClass += ' gym-day';
            }

            calendarHTML += `
                <div class="col-md-1 ${dayClass}" data-date="${dateStr}">
                    <div class="day-number">${dayCounter}</div>
                    <div class="day-content">
                    ${trainingData[dateStr] ? trainingData[dateStr].map(item => `${item.exercise}`).join('<br>') : ''}
                    </div>
                    <button class="btn btn-primary btn-sm record-button" data-toggle="modal" data-target="#dayModal">記録/編集</button>
                </div>`;

            if ((firstDayOfWeek + dayCounter) % 7 === 0) {
                calendarHTML += '</div><div class="row">';
            }
            dayCounter++;
        }

        // 最後の週の空白セル
        const lastDayOfWeek = new Date(year, month, daysInMonth).getDay();
        for (let i = lastDayOfWeek; i < 6; i++) {
            calendarHTML += '<div class="col-md-1 calendar-day"></div>';
        }

        calendarHTML += '</div>';
        calendarDiv.innerHTML = calendarHTML;
        console.log("Generated HTML:", calendarHTML);
    }

    // データの保存
    if (document.querySelector('#dayModal .btn-primary')) {
        document.querySelector('#dayModal .btn-primary').addEventListener('click', function() {
            const date = document.querySelector('#dayModal .modal-title').textContent.replace(' のトレーニング記録', '');
            const exercise = document.getElementById('exercise').value;
            const reps = document.getElementById('reps').value;

            let trainingData = JSON.parse(localStorage.getItem('trainingData')) || {};
            if (!trainingData[date]) {
                trainingData[date] = [];
            }
            trainingData[date].push({ exercise: exercise, reps: reps });
            localStorage.setItem('trainingData', JSON.stringify(trainingData));

            $('#dayModal').modal('hide');

            const currentYear = parseInt(document.getElementById('current-year').textContent);
            const currentMonth = parseInt(document.getElementById('current-month').textContent) - 1;
            loadTrainingData(); //データの再読み込み
        });
    }

    // データの読み込み
    function loadTrainingData() {
        console.log("loadTrainingData function called!");

        let trainingData = JSON.parse(localStorage.getItem('trainingData')) || {};

        let currentYear = today.getFullYear();
        let currentMonth = today.getMonth();

        // 初回読み込み時、または前月/次月ボタンが押されていない場合は、
        // current-year と current-month が空なので、現在の日付で初期化
        if(document.getElementById('current-year').textContent != ""){
            currentYear = parseInt(document.getElementById('current-year').textContent);
            currentMonth = parseInt(document.getElementById('current-month').textContent) - 1;
        }

        generateCalendar(currentYear, currentMonth, trainingData);

        // モーダル表示時の処理
        $('#dayModal').on('show.bs.modal', function(event) {
            var button = $(event.relatedTarget);
            var date = button.data('date') ||  document.querySelector('#dayModal .modal-title').textContent.replace(' のトレーニング記録', '');
            var modal = $(this);
            modal.find('.modal-title').text(date + ' のトレーニング記録');

            document.getElementById('recorded-sets').innerHTML = '';

            let trainingData = JSON.parse(localStorage.getItem('trainingData')) || {};

            if (trainingData[date]) {
                trainingData[date].forEach(function(set) {
                    const newSetDiv = document.createElement('div');
                    newSetDiv.classList.add('input-group', 'mb-3');

                    const exerciseInput = document.createElement('input');
                    exerciseInput.type = 'text';
                    exerciseInput.classList.add('form-control');
                    exerciseInput.placeholder = '種目';
                    exerciseInput.value = set.exercise;

                    const repsInput = document.createElement('input');
                    repsInput.type = 'number';
                    repsInput.classList.add('form-control');
                    repsInput.placeholder = '回数';
                    repsInput.value = set.reps;

                    const deleteButton = document.createElement('button');
                    deleteButton.type = 'button';
                    deleteButton.classList.add('btn', 'btn-danger');
                    deleteButton.textContent = '-';
                    deleteButton.addEventListener('click', function() {
                        newSetDiv.remove();
                    });

                    newSetDiv.appendChild(exerciseInput);
                    newSetDiv.appendChild(repsInput);
                    newSetDiv.appendChild(deleteButton);

                    document.getElementById('recorded-sets').appendChild(newSetDiv);
                });
            }
        });
    }

    // 前月ボタン
    if (document.getElementById('prev-month')) {
        document.getElementById('prev-month').addEventListener('click', function() {
            let currentYear = parseInt(document.getElementById('current-year').textContent);
            let currentMonth = parseInt(document.getElementById('current-month').textContent) - 1;
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            let trainingData = JSON.parse(localStorage.getItem('trainingData')) || {};
            generateCalendar(currentYear, currentMonth, trainingData);
        });
    }

    // 次月ボタン
    if (document.getElementById('next-month')) {
        document.getElementById('next-month').addEventListener('click', function() {
            let currentYear = parseInt(document.getElementById('current-year').textContent);
            let currentMonth = parseInt(document.getElementById('current-month').textContent) - 1;

            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            let trainingData = JSON.parse(localStorage.getItem('trainingData')) || {};
            generateCalendar(currentYear, currentMonth, trainingData);
        });
    }

      // モーダル表示時の処理
    if(document.getElementById('dayModal')){
        $('#dayModal').on('show.bs.modal', function (event) {
            var button = $(event.relatedTarget)
            var date = button.data('date')
            var modal = $(this)
            modal.find('.modal-title').text(date + ' のトレーニング記録')
        })
    }

    // +ボタン
    if(document.getElementById('add-set')){
        document.getElementById('add-set').addEventListener('click', function() {
        const recordedSets = document.getElementById('recorded-sets');

        const newSetDiv = document.createElement('div');
        newSetDiv.classList.add('input-group', 'mb-3');

        const exerciseInput = document.createElement('input');
        exerciseInput.type = 'text';
        exerciseInput.classList.add('form-control');
        exerciseInput.placeholder = '種目';

        const repsInput = document.createElement('input');
        repsInput.type = 'number';
        repsInput.classList.add('form-control');
        repsInput.placeholder = '回数';

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.classList.add('btn', 'btn-danger');
        deleteButton.textContent = '-';
        deleteButton.addEventListener('click', function() {
            newSetDiv.remove();
        });

        newSetDiv.appendChild(exerciseInput);
        newSetDiv.appendChild(repsInput);
        newSetDiv.appendChild(deleteButton);
        recordedSets.appendChild(newSetDiv)
        });
    }

    // ページ読み込み時
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOMContentLoaded event fired!"); // 確認用
        loadTrainingData();
    });
}