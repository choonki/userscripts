// ==UserScript==
// @name         Auto Fit Image Width (이미지 가로폭 맞춤 및 세로 스크롤)
// @namespace    https://github.com/choonki
// @version      1.0
// @description  우클릭 컨텍스트 메뉴에서 실행 시 이미지 가로폭을 100%로 맞추고 세로 스크롤을 허용합니다.
// @match        *://*/*.jpg*
// @match        *://*/*.jpeg*
// @match        *://*/*.png*
// @match        *://*/*.gif*
// @match        *://*/*.webp*
// @match        *://*/*.bmp*
// @grant        none
// @run-at       context-menu
// @updateURL    https://raw.githubusercontent.com/choonki/userscripts/main/auto-fit-image-width.user.js
// @downloadURL  https://raw.githubusercontent.com/choonki/userscripts/main/auto-fit-image-width.user.js
// ==/UserScript==

(function() {
    'use strict';

    const img = document.querySelector('img');

    if (img) {
        img.style.width = '100vw';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.style.margin = '0';
        img.style.padding = '0';
        img.style.display = 'block';

        document.body.style.margin = '0';
        document.body.style.padding = '0';
        document.body.style.display = 'block';
        document.body.style.overflowY = 'auto';
        document.body.style.overflowX = 'hidden';
    }
})();
