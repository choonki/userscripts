// ==UserScript==
// @name         체크박스 범위 선택기 (Checkbox Range Selector)
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  웹 페이지 내의 체크박스를 특정 범위로 지정하여 일괄 선택/해제합니다. (첫 번째 체크박스 제외 기능 추가)
// @match        *://*/*
// @grant        none
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

    // 패널 내부 HTML 구성 (첫 번째 제외 옵션 추가)
    panel.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
            ☑️ 체크박스 제어
        </div>
        <div style="margin-bottom: 8px;">
            <label style="cursor: pointer; display: flex; align-items: center; gap: 4px;">
                <input type="checkbox" id="cb-exclude-first" checked>
                첫 번째 체크박스 제외 (전체선택 등)
            </label>
        </div>
        <div style="margin-bottom: 8px;">
            <label for="cb-start">시작: </label>
            <input type="number" id="cb-start" style="width: 50px; padding: 2px;" min="1" value="1">
            <label for="cb-end" style="margin-left: 5px;">끝: </label>
            <input type="number" id="cb-end" style="width: 50px; padding: 2px;" min="1" value="10">
        </div>
        <div style="display: flex; gap: 5px;">
            <button id="cb-check" style="flex: 1; cursor: pointer; padding: 4px; background: #4CAF50; color: white; border: none; border-radius: 4px;">선택</button>
            <button id="cb-uncheck" style="flex: 1; cursor: pointer; padding: 4px; background: #f44336; color: white; border: none; border-radius: 4px;">해제</button>
        </div>
    `;

    document.body.appendChild(panel);

    // 2. 체크박스 제어 로직
    function toggleCheckboxes(check) {
        // 스크립트 UI에 있는 체크박스(#cb-exclude-first)는 제외하고 페이지 내의 모든 체크박스를 배열로 가져옵니다.
        let checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]:not(#cb-exclude-first)'));

        // '첫 번째 체크박스 제외' 옵션이 켜져 있다면 배열의 첫 번째 요소를 제거합니다.
        const excludeFirst = document.getElementById('cb-exclude-first').checked;
        if (excludeFirst && checkboxes.length > 0) {
            checkboxes.shift();
        }

        // 사용자는 1부터 숫자를 세지만, 자바스크립트 배열은 0부터 시작하므로 -1을 해줍니다.
        const start = parseInt(document.getElementById('cb-start').value, 10) - 1;
        const end = parseInt(document.getElementById('cb-end').value, 10) - 1;

        if (isNaN(start) || isNaN(end) || start < 0 || start > end) {
            alert('올바른 범위를 입력하세요. (시작 번호는 끝 번호보다 작거나 같아야 합니다)');
            return;
        }

        let count = 0;
        // 지정된 범위만큼 반복하며 체크 상태 변경
        for (let i = start; i <= end; i++) {
            if (checkboxes[i]) {
                if (checkboxes[i].checked !== check) {
                    checkboxes[i].checked = check;

                    // React, Vue 등 프레임워크 호환성을 위한 이벤트 강제 발생
                    checkboxes[i].dispatchEvent(new Event('change', { bubbles: true }));
                    checkboxes[i].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                }
                count++;
            }
        }

        // 시각적 피드백
        const actionText = check ? '선택' : '해제';
        console.log(`[체크박스 선택기] ${count}개의 체크박스가 ${actionText} 되었습니다.`);
    }

    // 3. 버튼에 이벤트 리스너 연결
    document.getElementById('cb-check').addEventListener('click', () => toggleCheckboxes(true));
    document.getElementById('cb-uncheck').addEventListener('click', () => toggleCheckboxes(false));

})();
