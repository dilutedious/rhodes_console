(function () {
    // --- CONFIGURATION ---
    const STORAGE_KEY = 'prts_gemini_api_key';
    const PRTS_SYSTEM_PROMPT = "You are PRTS. Cold, logical. Use LaTeX for math. You have access to Google Search; use it for current events.";
    let ACTIVE_MODEL_ID = null; 
    let collapseTimer = null;

    // --- UI INJECTION ---
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #prts-container { position: fixed; top: 90px; right: 40px; width: 380px; z-index: 9998; font-family: 'Oswald', sans-serif; display: flex; flex-direction: column; align-items: flex-end; gap: 10px; pointer-events: none; }
            
            /* WRAPPER */
            #prts-input-wrap { 
                pointer-events: auto; position: relative; height: 50px; width: 50px; 
                background: rgba(10, 10, 10, 0.8); backdrop-filter: blur(12px); 
                border: 1px solid rgba(255, 255, 255, 0.2); border-left: none; border-radius: 50%; 
                display: flex; align-items: center; justify-content: center; 
                transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1); 
                box-shadow: 0 4px 15px rgba(0,0,0,0.5); overflow: hidden; cursor: pointer;
            }
            #prts-input-wrap.expanded { width: 100%; border-radius: 25px; background: rgba(10, 10, 10, 0.6); border-left: 4px solid #29B6F6; justify-content: flex-start; }
            #prts-input-wrap.expanded:focus-within { background: rgba(0, 0, 0, 0.9); border-color: #29B6F6; box-shadow: 0 0 15px rgba(41, 182, 246, 0.3); }

            /* ICON */
            .prts-trigger-icon { position: absolute; width: 14px; height: 14px; border: 2px solid #fff; transform: rotate(45deg); transition: all 0.4s ease; box-shadow: 0 0 5px rgba(255,255,255,0.5); opacity: 1; left: 17px; }
            #prts-input-wrap.expanded .prts-trigger-icon { opacity: 0; transform: rotate(225deg) scale(0.5); }

            /* INPUT */
            #prts-input { flex: 1; background: transparent; border: none; color: #fff; font-family: 'Noto Sans JP', sans-serif; font-size: 0.9rem; outline: none; padding: 0 20px; opacity: 0; pointer-events: none; transition: opacity 0.3s ease 0.1s; }
            #prts-input-wrap.expanded #prts-input { opacity: 1; pointer-events: auto; }
            #prts-input::placeholder { color: rgba(255, 255, 255, 0.5); font-family: 'Oswald', sans-serif; letter-spacing: 1px; text-transform: uppercase; }
            
            /* RESPONSE BOX - SHORTER HEIGHT */
            #prts-response { 
                pointer-events: auto; width: 100%; opacity: 0; 
                max-height: 0; /* Hidden initially */
                background: rgba(20, 20, 20, 0.90); backdrop-filter: blur(15px); 
                border-right: 2px solid #29B6F6; border-radius: 12px; 
                color: #e0e0e0; font-family: 'Noto Sans JP', sans-serif; font-size: 0.9rem; line-height: 1.6; 
                transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1); 
                box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-top: 0; 
                display: flex; flex-direction: column; 
            }
            #prts-response.active { 
                /* Increased offset to 350px to make box shorter above weather */
                max-height: calc(100vh - 350px); 
                opacity: 1; margin-top: 10px; 
            }
            
            .prts-header-bar { display: flex; justify-content: flex-end; padding: 8px 15px 0 0; }
            #prts-clear { cursor: pointer; font-size: 1rem; color: #29B6F6; opacity: 0.7; transition: opacity 0.2s; }
            #prts-clear:hover { opacity: 1; text-shadow: 0 0 8px #29B6F6; }
            #prts-response-content { padding: 10px 20px 20px 20px; overflow-y: auto; }
            
            /* FORMATTING */
            #prts-response-content strong, b { color: #fff; font-weight: 700; }
            #prts-response-content em, i { color: #81D4FA; font-style: italic; }
            #prts-response-content h3 { font-family: 'Oswald', sans-serif; color: #29B6F6; font-weight: 500; margin: 15px 0 5px 0; border-bottom: 1px solid rgba(41,182,246,0.3); font-size: 1rem; letter-spacing: 1px; }
            #prts-response-content ul, #prts-response-content ol { margin: 8px 0; padding-left: 20px; }
            #prts-response-content li { margin-bottom: 4px; }
            #prts-response-content code { background: rgba(0,0,0,0.4); padding: 2px 5px; border-radius: 4px; font-family: 'Consolas', monospace; color: #FFCC80; font-size: 0.85rem; }
            
            /* MATH CSS */
            .prts-math-block { display: block; background: rgba(41, 182, 246, 0.1); padding: 12px; border-radius: 4px; text-align: center; margin: 8px 0; border-left: 2px solid #29B6F6; font-family: 'Times New Roman', serif; color: #E1F5FE; overflow-x: auto; }
            .prts-math-inline { font-family: 'Times New Roman', serif; color: #81D4FA; padding: 0 2px; }
            
            /* TABLE / ALIGN FIX */
            .prts-latex-table { width: 100%; border-collapse: collapse; margin: 10px 0; font-family: 'Times New Roman', serif; color: #E1F5FE; }
            .prts-latex-table td { padding: 2px 4px; vertical-align: baseline; }
            .prts-latex-table td:first-child { text-align: right; width: 50%; }
            .prts-latex-table td:last-child { text-align: left; width: 50%; }
            
            .math-func { font-family: 'Times New Roman', serif; font-style: normal; margin-right: 2px; }
            .frac { display: inline-flex; flex-direction: column; vertical-align: middle; text-align: center; font-size: 0.9em; margin: 0 4px; }
            .frac > .num { border-bottom: 1px solid rgba(255,255,255,0.7); padding: 0 2px; display: block; }
            .frac > .denom { display: block; padding: 0 2px; }

            .prts-loader { height: 2px; width: 100%; background: linear-gradient(90deg, transparent, #29B6F6, transparent); position: absolute; bottom: 0; left: -100%; animation: loading-scan 1.5s infinite linear; display: none; }
            @keyframes loading-scan { 0% { left: -100%; } 100% { left: 100%; } }
            #prts-response-content::-webkit-scrollbar { width: 4px; }
            #prts-response-content::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
            #prts-response-content::-webkit-scrollbar-thumb { background: #29B6F6; }
        `;
        document.head.appendChild(style);
    }

    function createUI() {
        const old = document.getElementById('prts-container');
        if (old) old.remove();
        const container = document.createElement('div');
        container.id = 'prts-container';
        container.innerHTML = `
            <div id="prts-input-wrap">
                <div class="prts-trigger-icon"></div>
                <input type="text" id="prts-input" placeholder="ACCESS TERMINAL..." autocomplete="off">
                <div class="prts-loader" id="prts-loader"></div>
            </div>
            <div id="prts-response">
                <div class="prts-header-bar"><span id="prts-clear">✕</span></div>
                <div id="prts-response-content"></div>
            </div>
        `;
        document.body.appendChild(container);

        const wrap = document.getElementById('prts-input-wrap');
        const input = document.getElementById('prts-input');

        const expand = () => { clearTimeout(collapseTimer); wrap.classList.add('expanded'); };
        const attemptCollapse = () => {
            if (input.value.trim().length > 0 || document.activeElement === input) return;
            collapseTimer = setTimeout(() => {
                if (input.value.trim().length === 0 && document.activeElement !== input) { wrap.classList.remove('expanded'); }
            }, 3000);
        };

        wrap.addEventListener('mouseenter', expand);
        input.addEventListener('focus', expand);
        wrap.addEventListener('mouseleave', attemptCollapse);
        input.addEventListener('blur', attemptCollapse);
        input.addEventListener('input', () => { if (input.value.trim().length > 0) clearTimeout(collapseTimer); });
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleQuery(input.value); });
        document.getElementById('prts-clear').addEventListener('click', () => { 
            document.getElementById('prts-response').classList.remove('active'); 
            input.value = ''; attemptCollapse();
        });
    }

    function triggerToast(message, type = 'info', title = 'SYS') {
        const container = document.getElementById('rhodes-toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `rhodes-toast ${type}`;
        toast.innerHTML = `<span class="rhodes-toast-header">// ${title}:</span><span class="rhodes-toast-msg">${message}</span>`;
        toast.style.animation = 'toastSlideIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards';
        container.prepend(toast); 
        setTimeout(() => { toast.style.animation = 'toastFadeOut 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards'; setTimeout(() => { if (container.contains(toast)) container.removeChild(toast); }, 600); }, 5000);
    }

    // --- PARSERS ---

    function parseMathSymbols(str) {
        let out = str;
        const functions = ['sin', 'cos', 'tan', 'log', 'ln', 'lim', 'max', 'min', 'text'];
        functions.forEach(f => { 
            const reg = new RegExp(`\\\\${f}\\b`, 'g');
            out = out.replace(reg, `<span class="math-func">${f}</span>`); 
        });

        const map = {
            '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\theta': 'θ',
            '\\lambda': 'λ', '\\mu': 'μ', '\\pi': 'π', '\\sigma': 'σ', '\\phi': 'φ',
            '\\omega': 'ω', '\\Delta': 'Δ', '\\Omega': 'Ω', '\\Sigma': 'Σ',
            '\\rightarrow': '→', '\\Rightarrow': '⇒', '\\leftrightarrow': '↔', '\\Leftrightarrow': '⇔', '\\implies': '⇒',
            '\\approx': '≈', '\\neq': '≠', '\\leq': '≤', '\\geq': '≥',
            '\\cdot': '⋅', '\\times': '×', '\\infty': '∞', '\\pm': '±', '\\partial': '∂', '\\nabla': '∇',
            '\\,': ' ', '\\;': ' ', '\\quad': '    '
        };
        Object.keys(map).sort((a,b)=>b.length-a.length).forEach(k => { out = out.replaceAll(k, map[k]); });

        out = out.replace(/\^\{([^\}]+)\}/g, '<sup>$1</sup>').replace(/\^([0-9a-zA-Z]+)/g, '<sup>$1</sup>');
        out = out.replace(/_\{([^\}]+)\}/g, '<sub>$1</sub>').replace(/_([0-9a-zA-Z]+)/g, '<sub>$1</sub>');
        out = out.replace(/\\frac\{([^\}]+)\}\{([^\}]+)\}/g, '<div class="frac"><span class="num">$1</span><span class="denom">$2</span></div>');
        out = out.replace(/\\left\(/g, '(').replace(/\\right\)/g, ')'); 
        out = out.replace(/\{([0-9a-zA-Z\+\-\=\s]+)\}/g, '$1');
        return out;
    }

    function formatLatexStructure(text) {
        let out = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        out = out.replace(/\\begin\{enumerate\}/g, '<ol>').replace(/\\end\{enumerate\}/g, '</ol>');
        out = out.replace(/\\begin\{itemize\}/g, '<ul>').replace(/\\end\{itemize\}/g, '</ul>');
        out = out.replace(/\\item\s/g, '<li>');
        out = out.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (match, content) => {
            let rows = content.split('\\\\').filter(r => r.trim());
            let html = '<table class="prts-latex-table">';
            rows.forEach(row => {
                let cells = row.split('&');
                html += '<tr>';
                cells.forEach(cell => html += `<td>${parseMathSymbols(cell)}</td>`);
                html += '</tr>';
            });
            return html + '</table>';
        });
        out = out.replace(/\\textbf\{([^\}]+)\}/g, '<b>$1</b>');
        out = out.replace(/\\textit\{([^\}]+)\}/g, '<i>$1</i>');
        out = out.replace(/\\text\{([^\}]+)\}/g, '<span>$1</span>'); 
        return out;
    }

    function formatMarkdown(text) {
        if (!text) return "";
        let out = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const codeBlocks = [];
        out = out.replace(/```([\s\S]*?)```/g, (m, c) => { codeBlocks.push(c); return `__CODEBLOCK_${codeBlocks.length - 1}__`; });
        out = formatLatexStructure(out); 
        out = out.replace(/\$\$([\s\S]*?)\$\$/g, (m, c) => `<div class="prts-math-block">${parseMathSymbols(c)}</div>`);
        out = out.replace(/\$([^$]+)\$/g, (m, c) => `<span class="prts-math-inline">${parseMathSymbols(c)}</span>`);
        out = out.replace(/^### (.*$)/gm, '<h3>$1</h3>').replace(/^## (.*$)/gm, '<h3>$1</h3>').replace(/^# (.*$)/gm, '<h3>$1</h3>');
        out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>');
        out = out.replace(/^\s*[\-\*]\s+(.*)$/gm, '<ul><li>$1</li></ul>').replace(/<\/ul>\s*<ul>/g, ''); 
        out = out.replace(/^\s*\d+\.\s+(.*)$/gm, '<ol><li>$1</li></ol>').replace(/<\/ol>\s*<ol>/g, '');
        out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
        out = out.replace(/\n/g, '<br>');
        out = out.replace(/__CODEBLOCK_(\d+)__/g, (m, i) => `<pre><code>${codeBlocks[i]}</code></pre>`);
        return out;
    }

    // --- API & LOGIC ---
    async function discoverBestModel(apiKey) {
        try {
            const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const d = await r.json();
            if (d.error) throw new Error(d.error.message);
            const m = d.models.filter(x => x.supportedGenerationMethods?.includes("generateContent"));
            if (!m.length) throw new Error("NO_MODELS");
            m.sort((a,b) => (a.name.includes('flash') && !b.name.includes('flash') ? -1 : 1));
            return m[0].name.replace('models/', '');
        } catch { return "gemini-1.5-flash"; }
    }

    async function handleQuery(query) {
        if (!query.trim()) return;
        const input = document.getElementById('prts-input');
        const loader = document.getElementById('prts-loader');
        const respBox = document.getElementById('prts-response');
        const contentDiv = document.getElementById('prts-response-content');

        let apiKey = localStorage.getItem(STORAGE_KEY);
        if (!apiKey) {
            apiKey = prompt("API INITIALIZATION REQUIRED.\nPlease enter your Google Gemini API Key:");
            if (apiKey) localStorage.setItem(STORAGE_KEY, apiKey);
            else { triggerToast("KEY_REQUIRED", "error", "AUTH"); return; }
        }

        input.disabled = true; loader.style.display = 'block'; respBox.classList.remove('active'); 

        if (!ACTIVE_MODEL_ID) ACTIVE_MODEL_ID = await discoverBestModel(apiKey);

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${ACTIVE_MODEL_ID}:generateContent?key=${apiKey}`;
            const payload = {
                contents: [{ role: "user", parts: [{ text: PRTS_SYSTEM_PROMPT + "\n\nUser Query: " + query }] }],
                tools: [{ googleSearch: {} }], 
                safetySettings: [{category:"HARM_CATEGORY_HARASSMENT",threshold:"BLOCK_NONE"},{category:"HARM_CATEGORY_HATE_SPEECH",threshold:"BLOCK_NONE"},{category:"HARM_CATEGORY_SEXUALLY_EXPLICIT",threshold:"BLOCK_NONE"},{category:"HARM_CATEGORY_DANGEROUS_CONTENT",threshold:"BLOCK_NONE"}],
                generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
            };
            const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const d = await r.json();
            if (!r.ok) throw new Error(d.error?.message || "HTTP Error");
            
            contentDiv.innerHTML = formatMarkdown(d.candidates[0].content.parts[0].text);
            respBox.classList.add('active');
        } catch (error) {
            console.error(error);
            if(error.message.includes("429")) triggerToast("OVERLOAD", "error", "FATAL");
            else if(error.message.includes("API key")) { localStorage.removeItem(STORAGE_KEY); triggerToast("INVALID KEY", "error", "AUTH"); }
            else triggerToast("NET ERROR", "error", "NET");
        } finally { input.disabled = false; input.focus(); loader.style.display = 'none'; }
    }

    injectStyles();
    createUI();
})();