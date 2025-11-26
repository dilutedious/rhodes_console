(function () {
    // --- CONFIGURATION ---
    const STORAGE_KEY = 'prts_gemini_api_key';
    const PRTS_SYSTEM_PROMPT = "You are PRTS. You are a cold, logical AI assistant. Keep responses concise. Use Markdown for formatting.";
    
    let ACTIVE_MODEL_ID = null; 

    // --- UI INJECTION ---
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #prts-container {
                position: fixed; top: 90px; right: 40px; width: 380px; z-index: 9998;
                font-family: 'Oswald', sans-serif; display: flex; flex-direction: column;
                align-items: flex-end; gap: 10px; pointer-events: none;
            }
            #prts-input-wrap {
                pointer-events: auto; position: relative; width: 100%; height: 50px;
                background: rgba(10, 10, 10, 0.5); backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-left: 4px solid #29B6F6;
                border-radius: 25px;
                display: flex; align-items: center; transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.5); overflow: hidden;
            }
            #prts-input-wrap:focus-within {
                background: rgba(0, 0, 0, 0.8); border-color: #29B6F6;
                box-shadow: 0 0 15px rgba(41, 182, 246, 0.3);
            }
            #prts-input {
                flex: 1; background: transparent; border: none; color: #fff;
                font-family: 'Noto Sans JP', sans-serif; font-size: 0.9rem;
                outline: none; padding: 0 20px;
            }
            #prts-input::placeholder {
                color: rgba(255, 255, 255, 0.5); font-family: 'Oswald', sans-serif;
                letter-spacing: 1px; text-transform: uppercase;
            }
            
            /* RESPONSE BOX STYLING */
            #prts-response {
                pointer-events: auto; width: 100%; max-height: 0; overflow: hidden; opacity: 0;
                background: rgba(20, 20, 20, 0.90); backdrop-filter: blur(15px);
                border-right: 2px solid #29B6F6; border-radius: 12px;
                color: #e0e0e0; font-family: 'Noto Sans JP', sans-serif;
                font-size: 0.9rem; line-height: 1.6; transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
                box-shadow: 0 10px 30px rgba(0,0,0,0.5); margin-top: 0;
                display: flex; flex-direction: column;
            }
            #prts-response.active {
                max-height: 600px; opacity: 1; margin-top: 10px;
            }

            /* Header / Close Bar */
            .prts-header-bar {
                display: flex; justify-content: flex-end; padding: 8px 15px 0 0;
            }
            #prts-clear {
                cursor: pointer; font-size: 1rem; color: #29B6F6; opacity: 0.7; transition: opacity 0.2s;
            }
            #prts-clear:hover { opacity: 1; text-shadow: 0 0 8px #29B6F6; }

            /* Content Area */
            #prts-response-content {
                padding: 10px 20px 20px 20px;
                overflow-y: auto;
            }
            
            /* --- MARKDOWN STYLES --- */
            #prts-response-content strong { color: #fff; font-weight: 700; }
            #prts-response-content em { color: #81D4FA; font-style: italic; }
            #prts-response-content h3 { 
                font-family: 'Oswald', sans-serif; color: #29B6F6; font-weight: 500; 
                margin: 15px 0 5px 0; border-bottom: 1px solid rgba(41,182,246,0.3); 
                font-size: 1rem; letter-spacing: 1px;
            }
            #prts-response-content ul, #prts-response-content ol { margin: 5px 0; padding-left: 20px; }
            #prts-response-content li { margin-bottom: 4px; }
            
            /* Code */
            #prts-response-content code { 
                background: rgba(0,0,0,0.4); padding: 2px 5px; border-radius: 4px; 
                font-family: 'Consolas', monospace; color: #FFCC80; font-size: 0.85rem;
            }
            #prts-response-content pre {
                background: rgba(0,0,0,0.5); padding: 10px; border-radius: 6px;
                overflow-x: auto; border: 1px solid rgba(255,255,255,0.1); margin: 10px 0;
            }
            #prts-response-content pre code {
                background: transparent; padding: 0; color: #e0e0e0;
            }

            /* Math Styling (Visual distinction for LaTeX) */
            .prts-math-block {
                background: rgba(41, 182, 246, 0.08);
                border-left: 3px solid #29B6F6;
                padding: 10px;
                margin: 8px 0;
                font-family: 'Times New Roman', serif;
                font-style: italic;
                color: #E1F5FE;
            }
            .prts-math-inline {
                font-family: 'Times New Roman', serif;
                font-style: italic;
                color: #81D4FA;
                padding: 0 2px;
            }

            /* Loading Bar */
            .prts-loader {
                height: 2px; width: 100%; background: linear-gradient(90deg, transparent, #29B6F6, transparent);
                position: absolute; bottom: 0; left: -100%; animation: loading-scan 1.5s infinite linear; display: none;
            }
            @keyframes loading-scan { 0% { left: -100%; } 100% { left: 100%; } }
            
            /* Scrollbar */
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
                <input type="text" id="prts-input" placeholder="ACCESS TERMINAL..." autocomplete="off">
                <div class="prts-loader" id="prts-loader"></div>
            </div>
            <div id="prts-response">
                <div class="prts-header-bar"><span id="prts-clear">✕</span></div>
                <div id="prts-response-content"></div>
            </div>
        `;

        document.body.appendChild(container);

        const input = document.getElementById('prts-input');
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleQuery(input.value);
        });

        document.getElementById('prts-clear').addEventListener('click', () => {
            document.getElementById('prts-response').classList.remove('active');
            input.value = '';
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
        setTimeout(() => {
            toast.style.animation = 'toastFadeOut 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards';
            setTimeout(() => { if (container.contains(toast)) container.removeChild(toast); }, 600);
        }, 5000);
    }

    // --- PARSER LOGIC ---

    function formatMarkdown(text) {
        if (!text) return "";

        // 1. Escape HTML first to prevent XSS
        let out = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

        // 2. Extract Code Blocks (to avoid formatting inside them)
        const codeBlocks = [];
        out = out.replace(/```([\s\S]*?)```/g, (match, content) => {
            codeBlocks.push(content);
            return `__CODEBLOCK_${codeBlocks.length - 1}__`;
        });

        // 3. Math Block Formatting ($$ ... $$)
        out = out.replace(/\$\$([\s\S]*?)\$\$/g, '<div class="prts-math-block">$1</div>');

        // 4. Inline Math Formatting ($ ... $)
        // We style it serif/italic so it looks like math even if not rendered
        out = out.replace(/\$([^$]+)\$/g, '<span class="prts-math-inline">$1</span>');

        // 5. Headers (## Title)
        out = out.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        out = out.replace(/^## (.*$)/gm, '<h3>$1</h3>');
        out = out.replace(/^# (.*$)/gm, '<h3>$1</h3>');

        // 6. Bold & Italic
        out = out.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        out = out.replace(/\*(.*?)\*/g, '<em>$1</em>');

        // 7. Lists
        // Unordered (* or -)
        out = out.replace(/^\s*[\-\*]\s+(.*)$/gm, '<ul><li>$1</li></ul>');
        // Fix double ULs (merge adjacent uls)
        out = out.replace(/<\/ul>\s*<ul>/g, ''); 
        
        // Ordered (1.)
        out = out.replace(/^\s*\d+\.\s+(.*)$/gm, '<ol><li>$1</li></ol>');
        out = out.replace(/<\/ol>\s*<ol>/g, '');

        // 8. Inline Code
        out = out.replace(/`([^`]+)`/g, '<code>$1</code>');

        // 9. Newlines to breaks
        out = out.replace(/\n/g, '<br>');

        // 10. Restore Code Blocks
        out = out.replace(/__CODEBLOCK_(\d+)__/g, (match, index) => {
            return `<pre><code>${codeBlocks[index]}</code></pre>`;
        });

        return out;
    }

    // --- DISCOVERY & API ---
    async function discoverBestModel(apiKey) {
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            const data = await response.json();
            if (data.error) throw new Error(data.error.message);
            const chatModels = data.models.filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent"));
            if (chatModels.length === 0) throw new Error("NO_MODELS");
            chatModels.sort((a, b) => {
                const nameA = a.name.toLowerCase(), nameB = b.name.toLowerCase();
                if (nameA.includes('flash') && !nameB.includes('flash')) return -1;
                if (nameB.includes('flash') && !nameA.includes('flash')) return 1;
                return 0;
            });
            return chatModels[0].name.replace('models/', '');
        } catch (e) {
            console.error("Discovery Failed:", e);
            return "gemini-1.5-flash"; 
        }
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

        input.disabled = true;
        loader.style.display = 'block';
        respBox.classList.remove('active'); 

        if (!ACTIVE_MODEL_ID) {
            triggerToast("CALIBRATING...", "info", "SETUP");
            ACTIVE_MODEL_ID = await discoverBestModel(apiKey);
        }

        try {
            let responseText = await callGeminiAPI(query, apiKey, ACTIVE_MODEL_ID);
            contentDiv.innerHTML = formatMarkdown(responseText);
            respBox.classList.add('active');
        } catch (error) {
            console.error("Run Failed:", error);
            if (error.message.includes("429")) {
                try {
                    let fallback = await callGeminiAPI(query, apiKey, "gemini-pro");
                    contentDiv.innerHTML = formatMarkdown(fallback);
                    respBox.classList.add('active');
                } catch (e2) { triggerToast("SYSTEM OVERLOAD", "error", "FATAL"); }
            } else if (error.message.includes("API key")) {
                localStorage.removeItem(STORAGE_KEY);
                triggerToast("INVALID KEY", "error", "AUTH");
            } else {
                triggerToast("NET ERROR", "error", "NET");
            }
        } finally {
            input.disabled = false;
            input.focus();
            loader.style.display = 'none';
        }
    }

    async function callGeminiAPI(userPrompt, key, model) {
        const cleanModel = model.replace('models/', '');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${key}`;
        
        const payload = {
            contents: [{ role: "user", parts: [{ text: PRTS_SYSTEM_PROMPT + "\n\nUser Query: " + userPrompt }] }],
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ],
            generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "HTTP Error");
        if (!data.candidates || !data.candidates.length) throw new Error("NO_CONTENT");
        
        return data.candidates[0].content.parts[0].text;
    }

    injectStyles();
    createUI();
})();