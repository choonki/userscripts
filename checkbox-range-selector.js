// ==UserScript==
// @name         체크박스 범위 선택기 (Checkbox Range Selector)
// @namespace    https://github.com/choonki
// @version      1.5
// @description  웹 페이지 내의 체크박스를 특정 범위 또는 갯수로 지정하거나 전체 일괄 선택/해제합니다.
// @match        *://*/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/choonki/userscripts/main/checkbox-range-selector.js
// @downloadURL  https://raw.githubusercontent.com/choonki/userscripts/main/checkbox-range-selector.js
// ==/UserScript==

(function() {
    'use strict';

    // 매칭하고 싶은 URL 정규식 패턴들을 배열로 정의
    const targetPatterns = [
        // 뉴토끼 게시판의 글
        /^https:\/\/sbxh\d+\.com\/[a-zA-Z0-9_-]+-board\/\d+\/?$/
    ];

    // 현재 URL이 배열 안의 패턴 중 하나라도 일치하는지 검사
    const isMatched = targetPatterns.some(pattern => pattern.test(window.location.href));

    if (!isMatched) {
        return; // 일치하는 패턴이 없으면 즉시 종료
    }

    // 1. UI 패널 생성
    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.bottom = '20px';
    panel.style.right = '20px';
    panel.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    panel.style.border = '1px solid #ccc';
    panel.style.padding = '10px 15px';
    panel.style.zIndex = '999999';
    panel.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    panel.style.borderRadius = '8px';
    panel.style.fontFamily = 'sans-serif';
    panel.style.fontSize = '13px';
    panel.style.color = '#333';

    // 패널 내부 HTML 구성 (전체 선택/해제 버튼 추가)
    panel.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
            ☑️ 체크박스 제어
        </div>
        <div style="margin-bottom: 8px; display: flex; flex-direction: column; gap: 4px;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                <input type="checkbox" id="cb-exclude-first" checked>
                첫 번째 체크박스 제외 (전체선택 등)
            </label>
            <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                <input type="checkbox" id="cb-clear-before" checked>
                범위 실행 전 기존 선택 모두 해제
            </label>
        </div>
        <div style="margin-bottom: 8px; font-size: 12px;">
            <label style="cursor: pointer;"><input type="radio" name="cb-mode" value="range" checked> 범위 (시작~끝)</label>
            <label style="cursor: pointer; margin-left: 8px;"><input type="radio" name="cb-mode" value="count"> 갯수 (시작~N개)</label>
        </div>
        <div style="margin-bottom: 8px;">
            <label for="cb-start">시작: </label>
            <input type="number" id="cb-start" style="width: 50px; padding: 2px;" min="1" value="1">
            <label for="cb-val2" id="cb-val2-label" style="margin-left: 5px;">끝: </label>
            <input type="number" id="cb-val2" style="width: 50px; padding: 2px;" min="1" value="10">
        </div>
        <div style="display: flex; gap: 5px; margin-bottom: 5px;">
            <button id="cb-check" style="flex: 1; cursor: pointer; padding: 4px; background: #4CAF50; color: white; border: none; border-radius: 4px;">범위 선택</button>
            <button id="cb-uncheck" style="flex: 1; cursor: pointer; padding: 4px; background: #f44336; color: white; border: none; border-radius: 4px;">범위 해제</button>
        </div>
        <div style="display: flex; gap: 5px;">
            <button id="cb-check-all" style="flex: 1; cursor: pointer; padding: 4px; background: #2196F3; color: white; border: none; border-radius: 4px;">전체 선택</button>
            <button id="cb-uncheck-all" style="flex: 1; cursor: pointer; padding: 4px; background: #9E9E9E; color: white; border: none; border-radius: 4px;">전체 해제</button>
        </div>
    `;

    document.body.appendChild(panel);

    // 라디오 버튼 변경 시 라벨 텍스트 변경 이벤트
    const modeRadios = document.querySelectorAll('input[name="cb-mode"]');
    const val2Label = document.getElementById('cb-val2-label');
    
    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'range') {
                val2Label.textContent = '끝: ';
            } else {
                val2Label.textContent = '갯수: ';
            }
        });
    });

    // --- 공통 헬퍼 함수 ---

    // 제어 대상이 되는 체크박스 목록을 가져오는 함수 (UI 패널 제외 & 첫 번째 제외 옵션 적용)
    function getTargetCheckboxes() {
        let checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]')).filter(cb => !panel.contains(cb));
        const excludeFirst = document.getElementById('cb-exclude-first').checked;
        if (excludeFirst && checkboxes.length > 0) {
            checkboxes.shift();
        }
        return checkboxes;
    }

    // 체크박스 상태를 안전하게 변경하는 함수 (프레임워크 호환 이벤트 발생)
    function changeState(cb, targetState) {
        if (cb.checked !== targetState) {
            cb.checked = targetState;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
            cb.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }
    }

    // 2. 체크박스 범위 제어 로직
    function toggleRangeCheckboxes(check) {
        const checkboxes = getTargetCheckboxes();
        const mode = document.querySelector('input[name="cb-mode"]:checked').value;
        const start = parseInt(document.getElementById('cb-start').value, 10) - 1;
        const val2 = parseInt(document.getElementById('cb-val2').value, 10);
        
        let end;

        if (isNaN(start) || isNaN(val2) || start < 0 || val2 < 1) {
            alert('올바른 값을 입력하세요.');
            return;
        }

        if (mode === 'range') {
            end = val2 - 1;
            if (start > end) {
                alert('범위 지정 오류: 시작 번호는 끝 번호보다 작거나 같아야 합니다.');
                return;
            }
        } else if (mode === 'count') {
            end = start + val2 - 1;
        }

        // 실행 전 기존 선택 모두 해제 옵션
        const clearBefore = document.getElementById('cb-clear-before').checked;
        if (clearBefore) {
            checkboxes.forEach(cb => changeState(cb, false));
        }

        let count = 0;
        for (let i = start; i <= end; i++) {
            if (checkboxes[i]) {
                changeState(checkboxes[i], check);
                count++;
            }
        }

        const actionText = check ? '선택' : '해제';
        console.log(`[체크박스 선택기] 지정 범위 내 ${count}개의 요소가 ${actionText} 되었습니다.`);
    }

    // 3. 체크박스 전체 제어 로직
    function toggleAllCheckboxes(check) {
        const checkboxes = getTargetCheckboxes();
        let count = 0;
        
        checkboxes.forEach(cb => {
            changeState(cb, check);
            count++;
        });

        const actionText = check ? '전체 선택' : '전체 해제';
        console.log(`[체크박스 선택기] ${count}개의 요소가 ${actionText} 되었습니다.`);
    }

    // 4. 버튼에 이벤트 리스너 연결
    document.getElementById('cb-check').addEventListener('click', () => toggleRangeCheckboxes(true));
    document.getElementById('cb-uncheck').addEventListener('click', () => toggleRangeCheckboxes(false));
    document.getElementById('cb-check-all').addEventListener('click', () => toggleAllCheckboxes(true));
    document.getElementById('cb-uncheck-all').addEventListener('click', () => toggleAllCheckboxes(false));

})();
