const classData = {
    "물리학2": ["B반", "D반", "E반"],
    "통합과학": ["4반", "5반", "6반", "7반", "8반", "9반"]
};

// 시간표 데이터
const schedule = {
    "월": {
        "물리학2": {
           "D반": 3
        },
        "통합과학": {
            "9반": 1,
            "5반": 4
        }
    },
    "화": {
        "물리학2": {
            "B반": 1,
            "D반": 2,
            "E반": 5
        },
        "통합과학": {
            "7반": 6
        }
    },
    "수": {
        "물리학2": {
            "E반": 3,
            "B반": 6
        },
        "통합과학": {
            "8반": 5
        }
    },
    "목": {
        "물리학2": {
            "D반": 4
            },
        "통합과학": {
            "4반": 2
        }
    },
    "금": {
        "통합과학": {
            "6반": 4
        },
        "물리학2": {
            "E반": 1,
            "B반": 2            
        }
    }
};

// students.js의 데이터를 사용
let allStudents = window.students || [];
let studentDB = JSON.parse(localStorage.getItem('teacher_students') || JSON.stringify(allStudents));
let cachedClassNotes = [];

document.addEventListener('DOMContentLoaded', async () => {
    document.getElementById('date').valueAsDate = new Date();
    handleDateChange();
    addStudentRow();
    await renderMemoList();
});

// --- 네비게이션 제어 ---

async function switchTab(tab) {
    const sections = ['input-section', 'list-section'];
    sections.forEach(s => document.getElementById(s).classList.add('hidden'));

    // 상단 탭 버튼 (데스크탑)
    const tabInput = document.getElementById('tab-input');
    const tabList  = document.getElementById('tab-list');
    // 하단 탭 버튼 (모바일)
    const btmInput = document.getElementById('bottom-tab-input');
    const btmList  = document.getElementById('bottom-tab-list');

    const activeTop   = "px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-sm whitespace-nowrap shrink-0 bg-blue-600 text-white transition-all";
    const inactiveTop = "px-3 py-1.5 sm:py-2 rounded-lg font-semibold text-sm whitespace-nowrap shrink-0 text-slate-600 hover:bg-slate-100 transition-all";
    const activeBtn   = "btm-tab active";
    const inactiveBtn = "btm-tab";

    if (tab === 'input') {
        document.getElementById('input-section').classList.remove('hidden');
        if (tabInput) tabInput.className = activeTop;
        if (tabList)  tabList.className  = inactiveTop;
        if (btmInput) btmInput.className = activeBtn;
        if (btmList)  btmList.className  = inactiveBtn;
    } else if (tab === 'list') {
        document.getElementById('list-section').classList.remove('hidden');
        if (tabInput) tabInput.className = inactiveTop;
        if (tabList)  tabList.className  = activeTop;
        if (btmInput) btmInput.className = inactiveBtn;
        if (btmList)  btmList.className  = activeBtn;
        await renderMemoList();
    }
}

function handleSubjectChange() {
    const subject = document.getElementById('subject').value;
    const classSelect = document.getElementById('class-group');
    if (!subject) {
        classSelect.innerHTML = '<option value="">과목을 먼저 선택하세요</option>';
        document.getElementById('period').value = '';
        handleClassChange();
        return;
    }
    classSelect.innerHTML = '<option value="">반 선택</option>';
    if (window.currentDay && schedule[window.currentDay] && schedule[window.currentDay][subject]) {
        const classes = Object.keys(schedule[window.currentDay][subject]);
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls;
            option.textContent = cls;
            classSelect.appendChild(option);
        });
    } else {
        classSelect.innerHTML = '<option value="">날짜를 먼저 선택하세요</option>';
    }
    handleClassChange();
}

function handleClassChange() {
    const subject = document.getElementById('subject').value;
    const classGroup = document.getElementById('class-group').value;
    const searchBtn = document.getElementById('btn-search-student');
    
    if (window.currentDay && schedule[window.currentDay] && schedule[window.currentDay][subject] && schedule[window.currentDay][subject][classGroup]) {
        const period = schedule[window.currentDay][subject][classGroup];
        document.getElementById('period').value = period;
    } else {
        document.getElementById('period').value = '';
    }
    
    // 과목과 반이 모두 선택되었는지 확인
    if (subject && classGroup && allStudents.some(s => s.subject === subject && s.class === classGroup)) {
        searchBtn.disabled = false;
    } else {
        searchBtn.disabled = true;
    }
}

// --- 날짜 및 교시 자동 설정 ---

function handleDateChange() {
    const dateValue = document.getElementById('date').value;
    if (!dateValue) return;
    const date = new Date(dateValue);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    window.currentDay = days[date.getDay()];
    // 날짜 변경 시 과목과 반 리셋
    document.getElementById('subject').value = '';
    document.getElementById('class-group').innerHTML = '<option value="">과목을 먼저 선택하세요</option>';
    document.getElementById('period').value = '';
    handleClassChange();
}

// --- 모달 제어 ---

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// --- 학생 선택 기능 ---

function openStudentSearch() {
    const subject = document.getElementById('subject').value;
    const classGroup = document.getElementById('class-group').value;
    
    if (!subject || !classGroup) {
        alert("먼저 과목과 반을 선택해주세요.");
        return;
    }
    
    document.getElementById('search-modal-title').textContent = `${subject} ${classGroup} 학생 선택`;
    document.getElementById('student-filter').value = '';
    renderStudentSearchList();
    document.getElementById('student-search-modal').classList.add('active');
}

function renderStudentSearchList() {
    const subject = document.getElementById('subject').value;
    const classGroup = document.getElementById('class-group').value;
    const filter = document.getElementById('student-filter').value.toLowerCase();
    const container = document.getElementById('search-results');
    
    const addedIds = Array.from(document.querySelectorAll('.std-id')).map(input => input.value);

    // allStudents (students.js 데이터)에서 필터링
    const filtered = allStudents.filter(s => 
        s.subject === subject && 
        s.class === classGroup && 
        !addedIds.includes(s.id) &&
        (s.name.toLowerCase().includes(filter) || s.id.includes(filter))
    );

    if (filtered.length === 0) {
        container.innerHTML = '<p class="text-center py-10 text-slate-400 text-sm">해당하는 학생이 없거나 이미 모두 추가되었습니다.</p>';
        return;
    }

    container.innerHTML = filtered.map(s => `
        <button onclick="selectStudent('${s.id}', '${s.name}')" class="w-full text-left p-3 rounded-lg hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all flex justify-between items-center group">
            <span class="font-bold text-slate-700 group-hover:text-blue-700">${s.id} ${s.name}</span>
            <span class="text-xs text-blue-400 opacity-0 group-hover:opacity-100 font-semibold">선택</span>
        </button>
    `).join('');
}

function filterStudentList() {
    renderStudentSearchList();
}

function selectStudent(id, name) {
    const rows = document.querySelectorAll('#student-list > div');
    let targetRow = null;
    
    for (let row of rows) {
        const idVal = row.querySelector('.std-id').value;
        const nameVal = row.querySelector('.std-name').value;
        const noteVal = row.querySelector('.std-note').value;
        if (!idVal && !nameVal && !noteVal) {
            targetRow = row;
            break;
        }
    }

    if (!targetRow) {
        addStudentRow();
        targetRow = document.getElementById('student-list').lastElementChild;
    }

    targetRow.querySelector('.std-id').value = id;
    targetRow.querySelector('.std-name').value = name;
    targetRow.querySelector('.std-note').focus();
    
    closeModal('student-search-modal');
    showToast(`${name} 학생이 추가되었습니다.`);
}

// --- 공통 기능 ---

function addStudentRow() {
    const container = document.getElementById('student-list');
    const rowId = 'student-' + Date.now();
    const div = document.createElement('div');
    div.id = rowId;
        div.className = 'flex flex-col gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100 fade-in';
    div.innerHTML = `
            <div class="flex gap-2 items-center">
                <input type="text" placeholder="학번" class="std-id w-20 shrink-0 px-2 py-1.5 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                <input type="text" placeholder="성명" class="std-name flex-1 min-w-0 w-0 px-2 py-1.5 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm">
                <button onclick="removeStudentRow('${rowId}')" class="shrink-0 text-slate-400 hover:text-red-500 px-2 py-1">✕</button>
            </div>
            <textarea placeholder="특기사항 입력" class="std-note w-full px-2 py-2 border border-slate-200 rounded focus:ring-2 focus:ring-blue-500 outline-none text-sm h-20 resize-none"></textarea>
    `;
    container.appendChild(div);
}

function removeStudentRow(id) {
    const row = document.getElementById(id);
    if (document.querySelectorAll('.std-id').length > 1) {
        row.remove();
    } else {
        row.querySelectorAll('input, textarea').forEach(el => el.value = '');
    }
}

async function saveMemo() {
    try {
        const date = document.getElementById('date').value;
        const subject = document.getElementById('subject').value;
        const classGroup = document.getElementById('class-group').value;
        const period = document.getElementById('period').value;
        const progress = document.getElementById('lesson-progress').value;
        const generalNote = document.getElementById('general-note').value;

        if (!subject || !classGroup || !period) {
            showToast("기본 수업 정보를 입력해주세요.");
            return;
        }

        const studentRows = document.querySelectorAll('#student-list > div');
        const students = [];
        studentRows.forEach(row => {
            const id = row.querySelector('.std-id').value;
            const name = row.querySelector('.std-name').value;
            const note = row.querySelector('.std-note').value;
            if (id || name || note) {
                students.push({ id, name, note });
            }
        });

        const memo = { id: Date.now(), date, subject, classGroup, period, progress, generalNote, students };
        const memoRef = ref(db, 'memos/' + memo.id);
        await set(memoRef, memo);
        showToast("수업 기록이 저장되었습니다.");
        resetForm();
    } catch (error) {
        console.error('Save error:', error);
        alert('저장 중 오류가 발생했습니다.');
    }
}

function resetForm() {
    document.getElementById('lesson-progress').value = '';
    document.getElementById('general-note').value = '';
    document.getElementById('student-list').innerHTML = '';
    addStudentRow();
}

async function renderMemoList() {
    try {
        const container = document.getElementById('memo-container');
        const emptyState = document.getElementById('empty-state');
        const downloadBtn = document.getElementById('btn-download');
        const downloadGeneralBtn = document.getElementById('btn-download-general');
        const memosRef = ref(db, 'memos');
        const snapshot = await get(memosRef);
        let savedData = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            savedData = Object.values(data);
        }

        const hasStudentRecords = savedData.some(memo => memo.students && memo.students.length > 0);

        if (savedData.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            downloadBtn.classList.add('hidden');
            downloadGeneralBtn.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        if (hasStudentRecords) {
            downloadBtn.classList.remove('hidden');
        } else {
            downloadBtn.classList.add('hidden');
        }
        downloadGeneralBtn.classList.remove('hidden');
    
    container.innerHTML = savedData.map(memo => `
        <div class="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
            <div class="bg-slate-50 px-6 py-3 border-b border-slate-200 flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <span class="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">${memo.subject}</span>
                    <span class="text-sm font-semibold text-slate-600">${memo.date} / ${memo.classGroup} / ${memo.period}교시</span>
                </div>
                <button onclick="deleteMemo(${memo.id})" class="text-slate-400 hover:text-red-500 text-xs">삭제</button>
            </div>
            <div class="p-6 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase mb-1">수업 진도</p>
                        <p class="text-slate-800 font-medium">${memo.progress || '-'}</p>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-400 uppercase mb-1">학급 특기사항</p>
                        <p class="text-slate-600 text-sm whitespace-pre-wrap">${memo.generalNote || '-'}</p>
                    </div>
                </div>
                ${memo.students && memo.students.length > 0 ? `
                <div class="mt-4 pt-4 border-t border-slate-100">
                    <p class="text-xs font-bold text-slate-400 uppercase mb-2">학생별 관찰 기록</p>
                    <div class="space-y-2">
                        ${memo.students.map(s => `
                            <div class="text-sm bg-blue-50/50 p-2 rounded flex flex-wrap gap-2">
                                <span class="font-bold text-blue-600 min-w-[100px]">${s.id} ${s.name}</span>
                                <span class="text-slate-700">${s.note || '(내용 없음)'}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
    } catch (error) {
        console.error('Render error:', error);
        alert('기록을 불러오는 중 오류가 발생했습니다.');
    }
}

async function deleteMemo(id) {
    try {
        if (confirm("이 기록을 삭제하시겠습니까?")) {
            const memoRef = ref(db, 'memos/' + id);
            await remove(memoRef);
            renderMemoList();
            showToast("삭제되었습니다.");
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('삭제 중 오류가 발생했습니다.');
    }
}

async function downloadExcel() {
    try {
        const memosRef = ref(db, 'memos');
        const snapshot = await get(memosRef);
        let savedData = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            savedData = Object.values(data);
        }
        console.log('Student records data:', savedData);
        const excelRows = [];
        savedData.forEach(memo => {
            if (memo.students && memo.students.length > 0) {
                memo.students.forEach(std => {
                    excelRows.push({
                        "학번": std.id,
                        "학생": std.name,
                        "기록날짜": memo.date,
                        "학생별 관찰기록": std.note
                    });
                });
            }
        });

        if (excelRows.length === 0) return alert("추출할 학생 기록이 없습니다.");

        const worksheet = XLSX.utils.json_to_sheet(excelRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "학생관찰기록");
        XLSX.writeFile(workbook, `학생기록_${new Date().toISOString().split('T')[0]}.xlsx`);
        showToast("엑셀 파일이 생성되었습니다.");
    } catch (error) {
        console.error('Download error:', error);
        alert('다운로드 중 오류가 발생했습니다. 콘솔을 확인하세요.');
    }
}

async function downloadGeneralNotesExcel() {
    try {
        const memosRef = ref(db, 'memos');
        const snapshot = await get(memosRef);
        let savedData = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            savedData = Object.values(data);
        }
        console.log('General notes data:', savedData);
        const excelRows = [];
        savedData.forEach(memo => {
            excelRows.push({
                "기록날짜": memo.date,
                "과목": memo.subject,
                "반": memo.classGroup,
                "교시": memo.period,
                "수업 진도": memo.progress || '',
                "학급 특기사항": memo.generalNote || ''
            });
        });

        if (excelRows.length === 0) return alert("추출할 기록이 없습니다.");

        const worksheet = XLSX.utils.json_to_sheet(excelRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "수업 특기사항");
        XLSX.writeFile(workbook, `수업특기사항_${new Date().toISOString().split('T')[0]}.xlsx`);
        showToast("특기사항 엑셀 파일이 생성되었습니다.");
    } catch (error) {
        console.error('Download error:', error);
        alert('다운로드 중 오류가 발생했습니다. 콘솔을 확인하세요.');
    }
}

async function openClassNotesView() {
    try {
        const memosRef = ref(db, 'memos');
        const snapshot = await get(memosRef);
        let savedData = [];

        if (snapshot.exists()) {
            const data = snapshot.val();
            savedData = Object.values(data);
        }

        cachedClassNotes = savedData;
        renderClassFilterOptions(savedData);
        document.getElementById('class-notes-filter').value = '';
        renderClassNotesByClass(savedData, '');
        document.getElementById('class-notes-modal').classList.add('active');
    } catch (error) {
        console.error('Class notes view error:', error);
        alert('반별 특기사항을 불러오는 중 오류가 발생했습니다.');
    }
}

function renderClassFilterOptions(memos) {
    const filterSelect = document.getElementById('class-notes-filter');
    const classKeys = Array.from(new Set(
        memos
            .filter(memo => memo.generalNote && String(memo.generalNote).trim())
            .map(memo => memo.classGroup || '미분류')
    )).sort((a, b) => a.localeCompare(b, 'ko'));

    filterSelect.innerHTML = '<option value="">전체 반</option>' + classKeys.map(classKey =>
        `<option value="${classKey}">${classKey}</option>`
    ).join('');
}

function filterClassNotesView() {
    const selectedClass = document.getElementById('class-notes-filter').value;
    renderClassNotesByClass(cachedClassNotes, selectedClass);
}

function renderClassNotesByClass(memos, selectedClass) {
    const container = document.getElementById('class-notes-content');
    const notesOnly = memos
        .filter(memo => memo.generalNote && String(memo.generalNote).trim())
        .filter(memo => !selectedClass || (memo.classGroup || '미분류') === selectedClass)
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    if (notesOnly.length === 0) {
        container.innerHTML = `
            <div class="py-16 text-center border border-slate-200 rounded-xl bg-slate-50">
                <p class="text-slate-500">조건에 맞는 반별 특기사항이 없습니다.</p>
            </div>
        `;
        return;
    }

    const grouped = notesOnly.reduce((acc, memo) => {
        const classKey = memo.classGroup || '미분류';
        if (!acc[classKey]) {
            acc[classKey] = [];
        }
        acc[classKey].push(memo);
        return acc;
    }, {});

    const sortedClassKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'ko'));

    container.innerHTML = sortedClassKeys.map(classKey => `
        <div class="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div class="bg-indigo-50 px-4 py-3 border-b border-slate-200">
                <h4 class="font-bold text-indigo-700">${classKey}</h4>
            </div>
            <div class="p-4 space-y-3">
                ${grouped[classKey].map(memo => `
                    <div class="rounded-lg border border-slate-200 p-3 bg-slate-50">
                        <p class="text-xs text-slate-500 mb-1">${memo.date || '-'} / ${memo.subject || '-'} / ${memo.period || '-'}교시</p>
                        <p class="text-sm text-slate-700 mb-1"><span class="font-semibold text-slate-600">수업 진도:</span> ${memo.progress || '-'}</p>
                        <p class="text-sm text-slate-700 whitespace-pre-wrap">${memo.generalNote}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

// 전역 함수로 노출
window.schedule = schedule;
window.switchTab = switchTab;
window.handleSubjectChange = handleSubjectChange;
window.handleClassChange = handleClassChange;
window.handleDateChange = handleDateChange;
window.closeModal = closeModal;
window.openStudentSearch = openStudentSearch;
window.filterStudentList = filterStudentList;
window.selectStudent = selectStudent;
window.addStudentRow = addStudentRow;
window.removeStudentRow = removeStudentRow;
window.saveMemo = saveMemo;
window.resetForm = resetForm;
window.renderMemoList = renderMemoList;
window.deleteMemo = deleteMemo;
window.downloadExcel = downloadExcel;
window.downloadGeneralNotesExcel = downloadGeneralNotesExcel;
window.openClassNotesView = openClassNotesView;
window.filterClassNotesView = filterClassNotesView;
window.showToast = showToast;
