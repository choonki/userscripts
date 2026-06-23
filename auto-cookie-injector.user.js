// ==UserScript==
// @name         Auto Cookie Injector (자동 쿠키 주입기)
// @namespace    https://github.com/choonki
// @version      1.0
// @description  웹사이트에 접속할 때 쿠키를 자동으로 주입해 준다.
// @match        *://*.google.com/*
// @include      /^https?:\/\/([^\/]+\.)?sbxh\d+\.com\/.*$/
// @include      /^https?:\/\/([^\/]+\.)?toki\d+\.com\/.*$/
// @grant        GM_cookie
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/choonki/userscripts/main/auto-cookie-injector.user.js
// @downloadURL  https://raw.githubusercontent.com/choonki/userscripts/main/auto-cookie-injector.user.js
// ==/UserScript==

(function() {
    'use strict';

    const currentHost = window.location.hostname;

    // 쿠키 설정 리스트 (domain 값에 점이 붙지 않도록 설정)
    const cookieRules = [
        {
            // 1. 구글 (검색 설정: 검색 맞춤 설정, 세이프 서치, 언어 및 지역, 새 창에 검색결과 표시, 인기 급상승 검색어 자동 완성)
            pattern: /google\.com$/,
            cookies: [
                { domain: 'google.com', name: 'NID', value: '532=fIAMYJeoRPrmjO33hRFhqFXm-BtFj-O9-S1cIStilyQyYMMc6v5QIxnzQz2W5oF5Pi64H9Cqmc-PcniiOkli6FeNWY2bxQaHZqYdkWh1dWdYP7aw9-F7ce8pBK1q_FNjmcPD3u4rH68FUzoazIrgSws6NJ3UNc5MBKh4_fvWQNkqW4ejE_ZLlKXz2QkxAM9s9nWx4u5FgPt17l_G6dJD16E7zhHMGlIgVVH_tgmX5FIeBb5M3MRU5I-t1u96P0GiGFW1d80N6hD6Trkv94QYmEeTYNFUDxdI6ppgZ2ZOMVveqyt0-CvjGPtRtg' }
            ]
        },
        {
            // 2. sbxh + 숫자 도메인 대응
            pattern: /sbxh\d+\.com$/,
            cookies: [
                { domain: 'AUTO', name: 'newtoki_sid', value: '7dcc7f4b4a0666dfff7eaf6d6b9c440a068f3c2f541517689c5abea270af0483' }
            ]
        },
        {
            // 3. toki + 숫자 도메인 대응
            pattern: /toki\d+\.com$/,
            cookies: [
                { domain: 'AUTO', name: 'newtoki_sid', value: '7dcc7f4b4a0666dfff7eaf6d6b9c440a068f3c2f541517689c5abea270af0483' }
            ]
        }
    ];

    // 규칙들을 순회하며 현재 호스트와 매칭되는지 확인
    cookieRules.forEach(rule => {
        const match = currentHost.match(rule.pattern);

        if (match) {
            // 주소창에서 메인 도메인을 추출할 때 앞에 점(.)을 붙이지 않습니다. (예: sbxh9.com)
            const detectedDomain = match[0];

            rule.cookies.forEach(cookie => {
                // domain이 'AUTO' 인 경우 추출된 도메인을 사용하고, 아니면 설정된 고정 도메인을 사용합니다.
                const finalDomain = cookie.domain === 'AUTO' ? detectedDomain : cookie.domain;

                GM_cookie.set({
                    url: window.location.href,
                    domain: finalDomain,
                    name: cookie.name,
                    value: cookie.value,
                    path: '/',
                    secure: true,
                    httpOnly: true,
                    expirationDate: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30) // 30일 유지
                }, function(error) {
                    if (error) {
                        console.error(`[Cookie Injector] ${finalDomain} - ${cookie.name} 주입 실패:`, error);
                    } else {
                        console.log(`[Cookie Injector] ${finalDomain} - ${cookie.name} 주입 성공!`);
                    }
                });
            });
        }
    });
})();
