const tableBody = document.getElementById('table-body');
const totalCreditsCell = document.getElementById('total-credits');
const totalPointsCell = document.getElementById('total-points');
const cgpaCell = document.getElementById('cgpa');
const addBtn = document.getElementById('add-semester');
const removeBtn = document.getElementById('remove-semester');
const clearAllBtn = document.getElementById('clear-all');
const addArrearBtn = document.getElementById('add-arrear');
const scaleInput = document.getElementById('scale-input');

let semesters = 8;

// Change grade points to numbers 10-3 and F
const GRADE_POINTS = {
  '10': 10,
  '9': 9,
  '8': 8,
  '7': 7,
  '6': 6,
  '5': 5,
  '4': 4,
  '3': 3,
  'F': 0
};
// Change grade points to numbers 10-3 and F, in decreasing order
const GRADE_OPTIONS = ['10', '9', '8', '7', '6', '5', '4', '3', '2','1','0'];

// Modal elements
const modal = document.getElementById('manual-gpa-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalSemesterName = document.getElementById('modal-semester-name');
const subjectsList = document.getElementById('subjects-list');
const addSubjectBtn = document.getElementById('add-subject');
const saveGpaBtn = document.getElementById('save-gpa');
const manualGpaError = document.getElementById('manual-gpa-error');

let currentManualRow = null;
let currentScale = parseFloat(scaleInput ? scaleInput.value : 10) || 10;

function createRow(idx, credits = '', cumulativePoints = '', currentPoints = '', isArrear = false) {
  const tr = document.createElement('tr');
  // Create each cell with data-label for mobile
  const semCell = document.createElement('td');
  semCell.setAttribute('data-label', 'Semester');
  semCell.style.fontWeight = 'normal';
  semCell.style.fontSize = '1rem';
  semCell.style.letterSpacing = '0';
  semCell.style.textAlign = 'left';
  semCell.textContent = isArrear ? 'Arrear' : `${idx + 1}`;

  const creditsCell = document.createElement('td');
  creditsCell.setAttribute('data-label', 'Credits Earned');
  creditsCell.appendChild(Object.assign(document.createElement('input'), {
    type: 'number', min: 1, step: 1, className: 'credits', value: credits
  }));

  const cumulativeCell = document.createElement('td');
  cumulativeCell.setAttribute('data-label', 'Cumulative Points');
  cumulativeCell.appendChild(Object.assign(document.createElement('input'), {
    type: 'number', min: 0, step: 1, className: 'cumulative-points', value: cumulativePoints
  }));

  const currentCell = document.createElement('td');
  currentCell.setAttribute('data-label', 'Current Points');
  currentCell.appendChild(Object.assign(document.createElement('input'), {
    type: 'number', min: 0, step: 1, className: 'current-points', value: currentPoints
  }));

  const gpaCell = document.createElement('td');
  gpaCell.setAttribute('data-label', 'GPA');
  gpaCell.className = 'gpa';

  tr.appendChild(semCell);
  tr.appendChild(creditsCell);
  tr.appendChild(cumulativeCell);
  tr.appendChild(currentCell);
  tr.appendChild(gpaCell);
  return tr;
}

function createManualButton() {
  const btn = document.createElement('button');
  btn.textContent = 'Manual GPA Entry';
  btn.className = 'manual-gpa-btn';
  return btn;
}

function createSubjectRow(credits = '', grade = '10') {
  const div = document.createElement('div');
  div.className = 'subject-row';
  div.innerHTML = `
    <label>Credits: <input type="number" min="1" step="1" class="subject-credits" value="${credits}" /></label>
    <label>Grade: <select class="subject-grade">
      ${GRADE_OPTIONS.map(g => `<option value="${g}">${g}</option>`).join('')}
    </select></label>
    <button type="button" class="remove-subject">Remove</button>
  `;
  div.querySelector('.subject-grade').value = grade;
  div.querySelector('.remove-subject').onclick = () => {
    div.remove();
  };
  return div;
}

function updateTable() {
  let totalCredits = 0;
  let totalPoints = 0;
  const rows = tableBody.querySelectorAll('tr');
  // First, sync cumulative/current points for all rows
  rows.forEach((row, idx) => {
    const cumulativeInput = row.querySelector('.cumulative-points');
    const currentInput = row.querySelector('.current-points');
    let cumulative = parseFloat(cumulativeInput.value);
    let current = parseFloat(currentInput.value);
    // If user is editing cumulative, recalculate current for this row, then recalc cumulative for all following rows
    if (document.activeElement === cumulativeInput) {
      if (isNaN(cumulative) || cumulative === 0) {
        currentInput.value = 0;
        // Set all following cumulative/current to 0
        for (let i = idx + 1; i < rows.length; i++) {
          rows[i].querySelector('.cumulative-points').value = 0;
          rows[i].querySelector('.current-points').value = 0;
        }
      } else {
        let prevCumulative = idx === 0 ? 0 : parseFloat(rows[idx - 1].querySelector('.cumulative-points').value) || 0;
        current = cumulative - prevCumulative;
        currentInput.value = !isNaN(current) && current >= 0 ? current : 0;
        // Recalculate cumulative for all following rows
        let runningCumulative = cumulative;
        for (let i = idx + 1; i < rows.length; i++) {
          const nextCurrentInput = rows[i].querySelector('.current-points');
          const nextCumulativeInput = rows[i].querySelector('.cumulative-points');
          let nextCurrent = parseFloat(nextCurrentInput.value);
          if (!isNaN(nextCurrent) && nextCurrent > 0) {
            runningCumulative += nextCurrent;
            nextCumulativeInput.value = runningCumulative;
          } else {
            runningCumulative = 0;
            nextCumulativeInput.value = 0;
            nextCurrentInput.value = 0;
          }
        }
      }
    }
    // If user is editing current, recalculate cumulative for this and all following rows
    else if (document.activeElement === currentInput) {
      if (isNaN(current) || current === 0) {
        cumulativeInput.value = 0;
        // Set all following cumulative/current to 0
        for (let i = idx + 1; i < rows.length; i++) {
          rows[i].querySelector('.cumulative-points').value = 0;
          rows[i].querySelector('.current-points').value = 0;
        }
      } else {
        let prevCumulative = idx === 0 ? 0 : parseFloat(rows[idx - 1].querySelector('.cumulative-points').value) || 0;
        cumulative = prevCumulative + current;
        cumulativeInput.value = !isNaN(cumulative) && cumulative >= 0 ? cumulative : 0;
        // Recalculate cumulative for all following rows
        let runningCumulative = cumulative;
        for (let i = idx + 1; i < rows.length; i++) {
          const nextCurrentInput = rows[i].querySelector('.current-points');
          const nextCumulativeInput = rows[i].querySelector('.cumulative-points');
          let nextCurrent = parseFloat(nextCurrentInput.value);
          if (!isNaN(nextCurrent) && nextCurrent > 0) {
            runningCumulative += nextCurrent;
            nextCumulativeInput.value = runningCumulative;
          } else {
            runningCumulative = 0;
            nextCumulativeInput.value = 0;
            nextCurrentInput.value = 0;
          }
        }
      }
    }
  });
  // Now calculate GPA and totals
  rows.forEach((row, idx) => {
    const creditsInput = row.querySelector('.credits');
    const currentInput = row.querySelector('.current-points');
    const gpaCell = row.querySelector('.gpa');
    const credits = parseFloat(creditsInput.value);
    const current = parseFloat(currentInput.value);
    let gpa = 0;
    let showGpa = true;
    if (!isNaN(credits) && credits > 0 && !isNaN(current)) {
      gpa = current / credits;
      // Scale GPA to selected scale
      gpa = gpa * (currentScale / 10);
      totalCredits += credits;
      totalPoints += current;
    } else if (!isNaN(credits) && credits > 0 && (isNaN(current) || current === 0)) {
      showGpa = false;
      totalCredits += credits;
    }
    gpaCell.textContent = showGpa && credits > 0 ? gpa.toFixed(2) : '';
  });
  // Scale CGPA to selected scale
  let cgpa = totalCredits > 0 ? (totalPoints / totalCredits) : 0;
  cgpa = cgpa * (currentScale / 10);
  totalCreditsCell.textContent = totalCredits;
  // Sum only the Current Points column for the footer total
  let currentPointsSum = 0;
  rows.forEach(row => {
    const currentInput = row.querySelector('.current-points');
    let current = parseFloat(currentInput.value);
    if (!isNaN(current) && current > 0) currentPointsSum += current;
  });
  totalPointsCell.textContent = Math.round(currentPointsSum);
  cgpaCell.textContent = cgpa.toFixed(2);
}

function openManualModal(rowIdx) {
  subjectsList.innerHTML = '';
  manualGpaError.textContent = '';
  modalSemesterName.textContent = `SEM ${parseInt(rowIdx) + 1}`;
  modal.style.display = 'flex';
  currentManualRow = rowIdx;
  // Optionally, prefill with 1 subject
  subjectsList.appendChild(createSubjectRow());
}

function closeManualModal() {
  modal.style.display = 'none';
  currentManualRow = null;
}

addSubjectBtn.onclick = () => {
  subjectsList.appendChild(createSubjectRow());
};
closeModalBtn.onclick = closeManualModal;
window.onclick = function(event) {
  if (event.target === modal) closeManualModal();
};

saveGpaBtn.onclick = () => {
  const subjectRows = subjectsList.querySelectorAll('.subject-row');
  let totalCredits = 0;
  let totalPoints = 0;
  let hasFail = false;
  let valid = true;
  subjectRows.forEach(row => {
    const credits = parseFloat(row.querySelector('.subject-credits').value);
    const grade = row.querySelector('.subject-grade').value;
    if (isNaN(credits) || credits < 1) valid = false;
    if (grade === 'F') hasFail = true;
    totalCredits += credits;
    totalPoints += credits * GRADE_POINTS[grade];
  });
  if (!valid || subjectRows.length === 0) {
    manualGpaError.textContent = 'Please enter valid credits for all subjects.';
    return;
  }
  // Update the main table row using the actual row index
  const row = tableBody.children[currentManualRow];
  if (!row) return;
  const creditsInput = row.querySelector('.credits');
  const cumulativeInput = row.querySelector('.cumulative-points');
  const currentInput = row.querySelector('.current-points');
  if (hasFail) {
    creditsInput.value = totalCredits;
    cumulativeInput.value = 0;
    currentInput.value = 0;
  } else {
    creditsInput.value = totalCredits;
    currentInput.value = totalPoints;
    // Update cumulative points for this row
    let prevRow = currentManualRow > 0 ? tableBody.children[currentManualRow - 1] : null;
    let prevCumulative = prevRow ? parseFloat(prevRow.querySelector('.cumulative-points').value) || 0 : 0;
    cumulativeInput.value = prevCumulative + totalPoints;
  }
  updateTable();
  closeManualModal();
};

function updateSemesterLabels() {
  let semIdx = 1;
  Array.from(tableBody.children).forEach(row => {
    const firstCell = row.querySelector('td');
    if (firstCell) {
      if (firstCell.getAttribute('data-label') === 'Semester') {
        if (firstCell.textContent === 'Arrear') {
          // leave as 'Arrear'
        } else {
          firstCell.textContent = semIdx++;
        }
      }
    }
  });
}

// Update addSemesterRow to accept an optional index
function addSemesterRow(credits = '', cumulativePoints = '', currentPoints = '', forcedIdx = null) {
  // Remove the 8 semester restriction
  // let semCount = 0;
  // Array.from(tableBody.children).forEach(row => {
  //   if (row.firstChild && row.firstChild.textContent.startsWith('SEM')) semCount++;
  // });
  // if (semCount >= semesters) return;
  const rows = Array.from(tableBody.children);
  let semCount = 0;
  rows.forEach(row => {
    if (row.firstChild && row.firstChild.textContent.startsWith('SEM')) semCount++;
  });
  const idx = forcedIdx !== null ? forcedIdx : semCount;
  const row = createRow(idx, credits, cumulativePoints, currentPoints, false);
  // Add manual GPA button
  const manualCell = document.createElement('td');
  manualCell.setAttribute('data-label', 'Manual GPA Entry');
  const manualBtn = createManualButton();
  manualBtn.onclick = () => openManualModal(Array.from(tableBody.children).indexOf(row));
  manualCell.appendChild(manualBtn);
  row.appendChild(manualCell);
  tableBody.appendChild(row);
  attachInputListeners(row);
  updateSemesterLabels();
  updateTable();
}

function removeSemesterRow() {
  if (tableBody.children.length > 1) {
    tableBody.removeChild(tableBody.lastChild);
    updateSemesterLabels();
    updateTable();
  }
}

function attachInputListeners(row) {
  const creditsInput = row.querySelector('.credits');
  const cumulativeInput = row.querySelector('.cumulative-points');
  const currentInput = row.querySelector('.current-points');
  creditsInput.addEventListener('input', () => {
    if (creditsInput.value < 1) creditsInput.value = '';
    if (parseFloat(creditsInput.value) < 0) creditsInput.value = 0;
    updateTable();
  });
  cumulativeInput.addEventListener('input', () => {
    if (parseFloat(cumulativeInput.value) < 0) cumulativeInput.value = 0;
    updateTable();
  });
  currentInput.addEventListener('input', () => {
    if (parseFloat(currentInput.value) < 0) currentInput.value = 0;
    updateTable();
  });
}

addBtn.addEventListener('click', () => {
  addSemesterRow();
});

removeBtn.addEventListener('click', () => {
  removeSemesterRow();
});

function clearAllSemesters() {
  const rows = tableBody.querySelectorAll('tr');
  rows.forEach(row => {
    row.querySelector('.credits').value = '';
    row.querySelector('.cumulative-points').value = '';
    row.querySelector('.current-points').value = '';
    row.querySelector('.gpa').textContent = '';
  });
  updateSemesterLabels();
  updateTable();
}

clearAllBtn.addEventListener('click', clearAllSemesters);

addArrearBtn.addEventListener('click', () => {
  const idx = tableBody.children.length;
  const row = createRow(0, '', '', '', true);
  // Add manual GPA button
  const manualCell = document.createElement('td');
  manualCell.setAttribute('data-label', 'Manual GPA Entry');
  const manualBtn = createManualButton();
  manualBtn.onclick = () => openManualModal(idx);
  manualCell.appendChild(manualBtn);
  row.appendChild(manualCell);
  tableBody.appendChild(row);
  attachInputListeners(row);
  updateTable();
});

if (scaleInput) {
  scaleInput.addEventListener('input', function() {
    let val = scaleInput.value;
    // Allow empty input for editing
    if (val === '' || val === null) {
      currentScale = 10; // fallback for calculations
      updateTable();
      return;
    }
    val = parseFloat(val);
    if (isNaN(val) || val < 1) {
      scaleInput.value = '';
      return;
    }
    if (val > 10) val = 10;
    currentScale = val;
    scaleInput.value = val;
    updateTable();
  });
}

// Prevent negative values in subject credits (manual GPA modal)
document.addEventListener('input', function(e) {
  if (e.target && e.target.classList && e.target.classList.contains('subject-credits')) {
    if (parseFloat(e.target.value) < 0) e.target.value = 0;
  }
});

// Initialize with 8 semesters (only once, at the end of the file)
for (let i = 0; i < semesters; i++) {
  addSemesterRow();
}

// Mobile controls event listeners
const addSemesterMobileBtn = document.getElementById('add-semester-mobile');
const addArrearMobileBtn = document.getElementById('add-arrear-mobile');
const removeSemesterMobileBtn = document.getElementById('remove-semester-mobile');
if (addSemesterMobileBtn) addSemesterMobileBtn.addEventListener('click', () => addSemesterRow());
if (addArrearMobileBtn) addArrearMobileBtn.addEventListener('click', () => {
  const idx = tableBody.children.length;
  const row = createRow(0, '', '', '', true);
  // Add manual GPA button
  const manualCell = document.createElement('td');
  manualCell.setAttribute('data-label', 'Manual GPA Entry');
  const manualBtn = createManualButton();
  manualBtn.onclick = () => openManualModal(idx);
  manualCell.appendChild(manualBtn);
  row.appendChild(manualCell);
  tableBody.appendChild(row);
  attachInputListeners(row);
  updateTable();
});
if (removeSemesterMobileBtn) removeSemesterMobileBtn.addEventListener('click', () => removeSemesterRow()); 