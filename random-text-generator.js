// ==UserScript==
// @name         Random Text Generator & Auto Input (Shuffle & Mutate)
// @namespace    https://github.com/choonki
// @version      1.4
// @description  문장 순서 섞기 + 자음/모음 랜덤 변경 + 화면 갱신 대응 + textarea DOM 강제 반영
// @match        *://*/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/choonki/userscripts/main/random-text-generator.js
// @downloadURL  https://raw.githubusercontent.com/choonki/userscripts/main/random-text-generator.js
// ==/UserScript==

(function() {
    'use strict';

    // 매칭하고 싶은 URL 정규식 패턴들을 배열로 정의
    const targetPatterns = [
        // 뉴토끼 게시판의 글
        /^https:\/\/sbxh\d+\.com\/[a-zA-Z0-9_-]+-board\/\d+.*$/
    ];

    // 현재 URL이 배열 안의 패턴 중 하나라도 일치하는지 검사
    const isMatched = targetPatterns.some(pattern => pattern.test(window.location.href));

    if (!isMatched) {
        return; // 일치하는 패턴이 없으면 즉시 종료
    }

    if (document.getElementById('random-text-gen-ui')) return;

    const originalText = "감사합니다. 잘 읽겠습니다. 즐거운 하루 보내세요.";

    // 1. 문장을 마침표 기준으로 나누고 순서를 무작위로 섞는 함수
    function getShuffledText() {
        // 마침표 기준으로 분리 후 빈 문자열 제거 및 공백 정리
        const parts = originalText.split('.')
            .map(s => s.trim())
            .filter(s => s.length > 0);

        // 피셔-예이츠(Fisher-Yates) 셔플 알고리즘으로 배열 순서 섞기
        for (let i = parts.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [parts[i], parts[j]] = [parts[j], parts[i]];
        }

        // 다시 마침표와 띄어쓰기를 붙여서 하나의 문장으로 완성
        return parts.map(s => s + ".").join(" ");
    }

    // 2. 한글 자음/모음 랜덤 변경 함수
    function mutateText(text) {
        const hangulIndices = [];
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            if (code >= 0xAC00 && code <= 0xD7A3) {
                hangulIndices.push(i);
            }
        }

        if (hangulIndices.length === 0) return text;

        const targetIdx = hangulIndices[Math.floor(Math.random() * hangulIndices.length)];
        const code = text.charCodeAt(targetIdx) - 0xAC00;

        let choIdx = Math.floor(code / 588);
        let jungIdx = Math.floor((code % 588) / 28);
        let jongIdx = code % 28;

        const partToChange = Math.floor(Math.random() * 3);

        function getRandomInt(max, exclude) {
            let r;
            do {
                r = Math.floor(Math.random() * max);
            } while (r === exclude);
            return r;
        }

        if (partToChange === 0) {
            choIdx = getRandomInt(19, choIdx);
        } else if (partToChange === 1) {
            jungIdx = getRandomInt(21, jungIdx);
        } else {
            jongIdx = getRandomInt(28, jongIdx);
        }

        const newChar = String.fromCharCode(0xAC00 + (choIdx * 588) + (jungIdx * 28) + jongIdx);

        return text.substring(0, targetIdx) + newChar + text.substring(targetIdx + 1);
    }

    // --- UI 생성 ---
    const container = document.createElement('div');
    container.id = 'random-text-gen-ui';
    container.style.position = 'fixed';
    container.style.bottom = '20px';
    container.style.left = '20px';
    container.style.zIndex = '99999999';
    container.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
    container.style.color = '#ffffff';
    container.style.padding = '15px';
    container.style.borderRadius = '10px';
    container.style.fontFamily = '"Malgun Gothic", "Apple SD Gothic Neo", sans-serif';
    container.style.boxShadow = '0 5px 15px rgba(0,0,0,0.4)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.width = '280px';

    const textDisplay = document.createElement('div');
    textDisplay.style.fontSize = '14px';
    textDisplay.style.lineHeight = '1.4';
    textDisplay.style.wordBreak = 'keep-all';

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.gap = '8px';

    const btnStyle = `
        flex: 1;
        padding: 8px 0;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-weight: bold;
        font-size: 13px;
        transition: background 0.2s;
    `;

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '복사';
    copyBtn.style.cssText = btnStyle + 'background-color: #4CAF50; color: white;';
    copyBtn.onmouseover = () => copyBtn.style.backgroundColor = '#45a049';
    copyBtn.onmouseout = () => copyBtn.style.backgroundColor = '#4CAF50';

    const retryBtn = document.createElement('button');
    retryBtn.textContent = '다시';
    retryBtn.style.cssText = btnStyle + 'background-color: #2196F3; color: white;';
    retryBtn.onmouseover = () => retryBtn.style.backgroundColor = '#1e88e5';
    retryBtn.onmouseout = () => retryBtn.style.backgroundColor = '#2196F3';

    btnContainer.appendChild(copyBtn);
    btnContainer.appendChild(retryBtn);
    container.appendChild(textDisplay);
    container.appendChild(btnContainer);
    document.body.appendChild(container);

    // --- 타겟 텍스트 영역 자동 입력 함수 ---
    function autoFillTextarea(text) {
        const targetElement = document.querySelector('.comment-form > textarea');

        if (targetElement) {
            targetElement.textContent = text;

            const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            if (nativeTextAreaValueSetter) {
                nativeTextAreaValueSetter.call(targetElement, text);
            } else {
                targetElement.value = text;
            }

            targetElement.dispatchEvent(new Event('input', { bubbles: true }));
            targetElement.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    // --- 핵심 텍스트 갱신 로직 ---
    function refreshText() {
        // 문장 순서 먼저 섞기
        const shuffledBaseText = getShuffledText();
        // 섞인 문장을 기반으로 자음/모음 1개 랜덤 변형
        const finalText = mutateText(shuffledBaseText);

        // UI 및 폼 업데이트
        textDisplay.textContent = finalText;
        autoFillTextarea(finalText);
    }

    // 초기 실행
    window.addEventListener('load', () => {
        setTimeout(refreshText, 500);
    });

    // --- 버튼 이벤트 ---
    copyBtn.addEventListener('click', () => {
        const textToCopy = textDisplay.textContent;
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(textToCopy).then(showCopiedFeedback);
        } else {
            if (typeof GM_setClipboard !== "undefined") {
                GM_setClipboard(textToCopy);
                showCopiedFeedback();
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = textToCopy;
                document.body.appendChild(textArea);
                textArea.select();
                try {
                    document.execCommand('copy');
                    showCopiedFeedback();
                } catch (err) {
                    console.error('복사 실패:', err);
                }
                document.body.removeChild(textArea);
            }
        }
    });

    function showCopiedFeedback() {
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '복사됨!';
        copyBtn.style.backgroundColor = '#388E3C';
        setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.backgroundColor = '#4CAF50';
        }, 1000);
    }

    retryBtn.addEventListener('click', refreshText);

    // --- 화면 갱신(SPA 라우팅) 감지 로직 ---
    const originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(this, arguments);
        setTimeout(refreshText, 500);
    };

    const originalReplaceState = history.replaceState;
    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        setTimeout(refreshText, 500);
    };

    window.addEventListener('popstate', () => {
        setTimeout(refreshText, 500);
    });

})();
