import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.12.0/dist/transformers.min.js';
// Chatbot implementation using Hugging Face Transformers.js
// Model: https://huggingface.co/gpt2

env.allowLocalModels = true; // Allow loading local models
env.useBrowserCache = true; // Enable browser cache for models
// env.cacheSize = 100 * 1024 * 1024; // 100 MB cache size

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8');

const EMBEDDING_CACHE = createEmbeddingCache();

const CACHE_VERSION = 'v1.1';

const TRANSLATION_PAIRS = [
    { vi: 'Người được giới thiệu', en: 'Profile' },
    { vi: 'Vai trò nổi bật', en: 'Key roles' },
    { vi: 'Địa điểm hiện tại', en: 'Location' },
    { vi: 'Email liên hệ', en: 'Contact email' },
    { vi: 'Thời gian', en: 'Timeline' },
    { vi: 'Dịch vụ', en: 'Service' },
    { vi: 'Học tập tại', en: 'Studied at' },
    { vi: 'Chứng chỉ', en: 'Certificate' },
    { vi: 'Đơn vị cấp', en: 'Issuer' },
    { vi: 'Dự án', en: 'Project' },
    { vi: 'Lĩnh vực', en: 'Domain' },
    { vi: 'Công bố', en: 'Publication' },
    { vi: 'Sự kiện', en: 'Event' },
    { vi: 'Tóm tắt', en: 'Summary' },
    { vi: 'Email', en: 'Email' },
    { vi: 'Địa chỉ', en: 'Address' },
    { vi: 'Q:', en: 'Q:' },
    { vi: 'A:', en: 'A:' },
];

document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector('[data-chatbot-container]');
    if (!container) return;

    initChatbot(container).catch((error) => {
        console.error("Error initializing chatbot:", error);
    });
});

async function initChatbot(container) {
    const {
        toggleButton,
        closeButton,
        panel,
        messagesEl,
        statusEl,
        formEl,
        inputEl,
        sendButton,
        suggestionsEl,
        languageSelect,
        greetingLang,
    } = buildChatInterface(container);

    const state = {
        hasOpened: false,
        browserLang: greetingLang,
    };

    if (state.browserLang === 'vi') {
        inputEl.placeholder = 'Hỏi gì về Long…';
    } else if (state.browserLang === 'en') {
        inputEl.placeholder = 'Ask about Long…';
    }

    const greetingMessage = state.browserLang === 'vi'
        ? 'Xin chào! Mình là chatbot của Long (Tony). Cứ hỏi bất cứ điều gì về Long nhé!\nHello! I am Long\'s chatbot. Ask me anything and I\'ll reply with what I know.'
        : 'Hello! I am Long\'s chatbot. Ask me anything about Long (Tony) and I\'ll reply with what I know.\nXin chào! Mình là chatbot của Long (Tony). Cứ hỏi bất cứ điều gì về Long nhé!';

    appendMessage(messagesEl, greetingMessage, 'bot');

    const ragEngine = createRagEngine({
        statusEl,
        onReady: () => {
            inputEl.disabled = false;
            sendButton.disabled = false;
            if (state.hasOpened) {
                inputEl.focus();
            }
        },
        onError: (error) => {
            appendMessage(messagesEl, error, 'bot');
        },
    });

    setupToggle(toggleButton, closeButton, panel, {
        onOpen: () => {
            state.hasOpened = true;
            if (!messagesEl.childElementCount) {
                appendMessage(messagesEl, greetingMessage, 'bot');
            }
            if (!inputEl.disabled) {
                inputEl.focus();
            }
        },
    });

    autoScroll(messagesEl);

    suggestionsEl.addEventListener('click', (event) => {
        if (!(event.target instanceof HTMLButtonElement)) return;
        const text = event.target.dataset.prompt;
        if (!text) return;
        inputEl.value = text;
        formEl.requestSubmit();
    });

    languageSelect.addEventListener('change', (event) => {
        const value = event.target.value;
        if (value === 'vi') {
            inputEl.placeholder = 'Hỏi gì về Long…';
        } else if (value === 'en') {
            inputEl.placeholder = 'Ask about Long…';
        } else {
            inputEl.placeholder = 'Hỏi gì về Long… / Ask about Long…';
        }
    });

    formEl.addEventListener('submit', async (event) => {
        event.preventDefault();
        const text = inputEl.value.trim();
        if (!text) return;

        appendMessage(messagesEl, text, 'user');
        inputEl.value = '';

        const thinkingBubble = appendMessage(messagesEl, 'Đang suy nghĩ...', 'bot', {
            temporary: true,
        });

        try {
            const response = await ragEngine.ask(text);
            removeTemporaryBubble(thinkingBubble);
            appendMessage(messagesEl, response, 'bot');
        } catch (error) {
            console.error("Error during RAG processing:", error);
            removeTemporaryBubble(thinkingBubble);
            appendMessage(messagesEl, "Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn.", 'bot');
        }
    });
}

function buildChatInterface(container) {
    if (container) {
        container.innerHTML = '';
    }
    const root = container || document.body;

    if (!document.querySelector('style[data-cvchat-style]')) {
        const style = document.createElement('style');
        style.setAttribute('data-cvchat-style', '');
        style.textContent = `
        .cvchat-btn{position:fixed;right:24px;bottom:24px;width:58px;height:58px;border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--sky-crayola,#00c6ff),#5affc9);color:var(--white-1,#ffffff);box-shadow:0 18px 36px rgba(0,0,0,.25);font-size:26px;z-index:2200;transition:transform .25s ease,box-shadow .3s ease,background .3s ease}
        .cvchat-btn:hover,.cvchat-btn:focus-visible{transform:translateY(-4px);box-shadow:0 20px 40px rgba(0,0,0,.35),0 0 0 3px rgba(255,255,255,.18)}
        .cvchat-panel{position:fixed;right:24px;bottom:98px;width:408px;max-width:92vw;height:560px;max-height:74vh;border-radius:24px;background:rgba(14,14,16,.92);backdrop-filter:blur(18px);border:1px solid rgba(255,255,255,.08);box-shadow:0 24px 48px rgba(0,0,0,.45);display:none;flex-direction:column;overflow:hidden;z-index:2200;color:#f5f5f5}
        .cvchat-header{display:flex;align-items:center;justify-content:space-between;padding:16px 18px;background:linear-gradient(135deg,rgba(27,27,31,.92),rgba(18,18,22,.92));border-bottom:1px solid rgba(255,255,255,.08)}
        .cvchat-title{display:flex;align-items:center;gap:12px;font-weight:600;letter-spacing:.2px}
        .cvchat-title ion-icon{font-size:1.6rem;color:var(--sky-crayola,#5affc9)}
        .cvchat-title__text{display:flex;flex-direction:column;line-height:1.1}
        .cvchat-title__primary{font-size:15px}
        .cvchat-title__secondary{font-size:12px;color:rgba(255,255,255,.6)}
        .cvchat-tools{display:flex;align-items:center;gap:10px}
        .cvchat-lang{appearance:none;background:rgba(255,255,255,.08);color:#f5f5f5;border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:6px 10px;font-size:12px;transition:border-color .2s ease,background .2s ease}
        .cvchat-lang:focus-visible{outline:2px solid rgba(90,255,201,.65);outline-offset:2px;border-color:rgba(90,255,201,.75)}
        .cvchat-close{background:transparent;border:none;color:rgba(255,255,255,.7);font-size:20px;cursor:pointer;transition:color .2s ease}
        .cvchat-close:hover,.cvchat-close:focus-visible{color:#ffffff}
        .cvchat-status{padding:10px 18px;font-size:12px;border-bottom:1px dashed rgba(255,255,255,.12);color:rgba(255,255,255,.65);background:rgba(14,14,16,.6)}
        .cvchat-body{flex:1;display:flex;flex-direction:column;padding:18px;gap:12px;overflow-y:auto;scroll-behavior:smooth;background:rgba(8,8,10,.35)}
        .cvchat-msg{max-width:92%;padding:12px 14px;border-radius:18px;margin:0;line-height:1.45;font-size:14px;word-wrap:break-word;white-space:pre-wrap;box-shadow:inset 0 0 0 1px rgba(255,255,255,.05)}
        .cvchat-msg.user{margin-left:auto;background:linear-gradient(135deg,var(--sky-crayola,#00c6ff),#5affc9);color:#0d0d0d;border-bottom-right-radius:6px}
        .cvchat-msg.bot{margin-right:auto;background:rgba(255,255,255,.08);color:#f9fafc;border:1px solid rgba(255,255,255,.12);border-bottom-left-radius:6px}
        .cvchat-input{display:flex;gap:10px;padding:16px 18px;background:rgba(14,14,16,.92);border-top:1px solid rgba(255,255,255,.08)}
        .cvchat-input input{flex:1;padding:12px 14px;border-radius:16px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#ffffff;font-size:14px;transition:border-color .2s ease,background .2s ease}
        .cvchat-input input:focus-visible{outline:none;border-color:rgba(90,255,201,.7);background:rgba(255,255,255,.12)}
        .cvchat-input input:disabled{opacity:.6;cursor:not-allowed}
        .cvchat-input button{width:46px;height:46px;border-radius:50%;border:none;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--sky-crayola,#00c6ff),#54ffe0);color:#0f0f10;cursor:pointer;transition:transform .25s ease,box-shadow .3s ease,background .3s ease}
        .cvchat-input button ion-icon{font-size:1.1rem}
        .cvchat-input button:hover,.cvchat-input button:focus-visible{transform:translateY(-2px);box-shadow:0 16px 32px rgba(0,0,0,.32),0 0 0 3px rgba(90,255,201,.35);background:linear-gradient(135deg,var(--sky-crayola,#00e1ff),#7bffd8)}
        .cvchat-input button:disabled{opacity:.55;cursor:not-allowed;transform:none;box-shadow:none}
        .cvchat-suggests{display:flex;flex-wrap:wrap;gap:8px;padding:12px 18px;background:rgba(14,14,16,.92);border-top:1px solid rgba(255,255,255,.05)}
        .cvchat-chip{font-size:12px;border-radius:999px;border:1px solid rgba(90,255,201,.4);padding:7px 12px;background:rgba(255,255,255,.05);color:#e8fdf6;cursor:pointer;transition:background .2s ease,color .2s ease,border-color .2s ease}
        .cvchat-chip:hover,.cvchat-chip:focus-visible{background:linear-gradient(135deg,var(--sky-crayola,#00c6ff),#5affc9);color:#0d0d0d;border-color:transparent}
        @media (max-width: 600px){
            .cvchat-btn{right:16px;bottom:16px}
            .cvchat-panel{right:12px;left:12px;width:auto;max-width:none;height:72vh;bottom:94px}
        }
        `;
        document.head.appendChild(style);
    }

    const toggleButton = document.createElement('button');
    toggleButton.className = 'cvchat-btn';
    toggleButton.type = 'button';
    toggleButton.setAttribute('aria-label', 'Open chat');
    toggleButton.setAttribute('aria-expanded', 'false');
    toggleButton.innerHTML = '<ion-icon name="chatbox-ellipses"></ion-icon>';

    const panel = document.createElement('div');
    panel.className = 'cvchat-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'false');
    panel.innerHTML = `
        <div class="cvchat-header">
            <div class="cvchat-title">
                <ion-icon name="logo-ionitron" aria-hidden="true"></ion-icon>
                <div class="cvchat-title__text">
                    <span class="cvchat-title__primary">Assistant</span>
                    <span class="cvchat-title__secondary">Long Nguyen</span>
                </div>
            </div>
            <div class="cvchat-tools">
                <select class="cvchat-lang" data-cvchat-lang aria-label="Language">
                    <option value="auto">Auto</option>
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                </select>
                <button type="button" class="cvchat-close" data-cvchat-close aria-label="Close chat">
                    <ion-icon name="close-outline"></ion-icon>
                </button>
            </div>
        </div>
        <div class="cvchat-status" data-cvchat-status>Initializing connection...</div>
        <div class="cvchat-body" data-cvchat-messages aria-live="polite"></div>
        <div class="cvchat-suggests" data-cvchat-suggests></div>
        <form class="cvchat-input" data-cvchat-form>
            <input type="text" data-cvchat-input placeholder="Hỏi gì về Long… / Ask about Long…" autocomplete="off" disabled />
            <button type="submit" data-cvchat-send disabled>
                <ion-icon name="send"></ion-icon>
            </button>
        </form>
    `;

    root.appendChild(toggleButton);
    root.appendChild(panel);

    const messagesEl = panel.querySelector('[data-cvchat-messages]');
    const statusEl = panel.querySelector('[data-cvchat-status]');
    const formEl = panel.querySelector('[data-cvchat-form]');
    const inputEl = panel.querySelector('[data-cvchat-input]');
    const sendButton = panel.querySelector('[data-cvchat-send]');
    const closeButton = panel.querySelector('[data-cvchat-close]');
    const suggestionsEl = panel.querySelector('[data-cvchat-suggests]');
    const languageSelect = panel.querySelector('[data-cvchat-lang]');

    const browserLang = (navigator.language || 'en').toLowerCase().startsWith('vi') ? 'vi' : 'en';
    if (languageSelect) {
        languageSelect.value = 'auto';
    }

    const suggestions = [
        { vi: 'Long là ai?', en: 'Who is Long?' },
        { vi: 'Kỹ năng & công nghệ', en: 'Skills & tech stack' },
        { vi: 'Dự án nổi bật', en: 'Highlight projects' },
        { vi: 'Liên hệ / Contact', en: 'Contact' },
    ];

    suggestions.forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'cvchat-chip';
        button.textContent = browserLang === 'vi' ? item.vi : item.en;
        button.dataset.prompt = button.textContent;
        suggestionsEl.appendChild(button);
    });

    return {
        toggleButton,
        closeButton,
        panel,
        messagesEl,
        statusEl,
        formEl,
        inputEl,
        sendButton,
        suggestionsEl,
        languageSelect,
        greetingLang: browserLang,
    };
}

function setupToggle(toggleButton, closeButton, panel, { onOpen } = {}) {
    if (!toggleButton || !closeButton || !panel) return;

    const closeWindow = ({ focusToggle = true } = {}) => {
        panel.style.display = 'none';
        toggleButton.hidden = false;
        toggleButton.setAttribute('aria-expanded', 'false');
        if (focusToggle) {
            toggleButton.focus();
        }
    };

    const openWindow = () => {
        panel.style.display = 'flex';
        toggleButton.hidden = true;
        toggleButton.setAttribute('aria-expanded', 'true');
        closeButton.focus();
        if (typeof onOpen === 'function') {
            onOpen();
        }
    };

    toggleButton.addEventListener('click', openWindow);
    closeButton.addEventListener('click', () => closeWindow());

    closeWindow({ focusToggle: false });
}

function appendMessage(messagesEl, text, role, options = {}) {
    if (!messagesEl) return null;

    const bubble = document.createElement('div');
    bubble.classList.add('cvchat-msg');
    bubble.classList.add(role === 'user' ? 'user' : 'bot');
    bubble.textContent = normalizeText(text);

    if (options.temporary) {
        bubble.dataset.temporary = 'true';
    }

    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
}

function removeTemporaryBubble(bubble) {
    if (bubble && bubble.dataset.temporary === 'true' && bubble.parentElement) {
        bubble.remove();
    }
}

function autoScroll(messagesEl) {
    if (!messagesEl) return;
    const observer = new MutationObserver(() => {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    });
    observer.observe(messagesEl, { childList: true });
}

function createRagEngine({ statusEl, onReady, onError }) {

    const state = {
        embedder: null,
        knowledgeBase: [],
        ready: false,
        cacheKey: null,
        generator: null,
    };

    initialize();

    async function initialize() {
        try {
            if (statusEl) {
                statusEl.textContent = 'Đang tải dữ liệu hồ sơ...';
            }

            const [portfolioRes, privateRes] = await Promise.all([
                fetch('data.json'),
                fetch('assets/data/private_knowledge.json')
            ]);

            const portfolio = await portfolioRes.json();
            const privateData = await privateRes.json();

            const entries = buildKnowledgeEntries(portfolio, privateData);

            if (!entries.length) {
                throw new Error('No knowledge entries were generated.');
            }

            state.cacheKey = computeKnowledgeSignature(entries);

            let cachedVectors = null;
            if (EMBEDDING_CACHE.available) {
                if (statusEl) {
                    statusEl.textContent = 'Đang khôi phục embedding đã lưu...';
                }
                cachedVectors = await EMBEDDING_CACHE.get(state.cacheKey);
            }

            const embedderPromise = pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

            let usedCache = false;
            if (
                cachedVectors?.embeddings?.length === entries.length &&
                cachedVectors?.version === CACHE_VERSION
            ) {
                state.knowledgeBase = entries.map((entry, index) => ({
                    ...entry,
                    embedding: cachedVectors.embeddings[index],
                }));
                usedCache = true;
                if (statusEl) {
                    const updatedAt = cachedVectors.updatedAt
                        ? new Date(cachedVectors.updatedAt).toLocaleString()
                        : null;
                    statusEl.textContent = updatedAt
                        ? `Loaded ${entries.length} embeddings from cache (updated ${updatedAt}).`
                        : `Loaded ${entries.length} embeddings from cache.`;
                }
            } else if (statusEl) {
                statusEl.textContent = `Initializing embeddings (${entries.length} entries)...`;
            }

            state.embedder = await embedderPromise;

            if (!usedCache) {
                state.knowledgeBase = [];
                for (let index = 0; index < entries.length; index++) {
                    const entry = entries[index];
                    const embedding = await generateEmbedding(state.embedder, entry.embeddingText);
                    state.knowledgeBase.push({ ...entry, embedding });
                    if (statusEl) {
                        statusEl.textContent = `Processing data (${index + 1} / ${entries.length})...`;
                    }
                }

                if (EMBEDDING_CACHE.available) {
                    await EMBEDDING_CACHE.set(state.cacheKey, {
                        embeddings: state.knowledgeBase.map((item) => item.embedding),
                        updatedAt: Date.now(),
                        version: CACHE_VERSION,
                    });
                    await EMBEDDING_CACHE.clearExcept(state.cacheKey);
                }
            }

            state.ready = true;
            if (statusEl) {
                statusEl.textContent = 'Chatbot is ready. Ask questions!';
            }
            if (typeof onReady === 'function') {
                onReady();
            }

        } catch (error) {
            console.error("Error initializing RAG engine:", error);
            if (statusEl) {
                statusEl.textContent = 'Error initializing chatbot.';
            }
            if (typeof onError === 'function') {
                onError("I can't work because of data loading error. Please try reloading the page.");
            }
        }
    }
    return {
        async ask(question) {
            if (!state.ready || !state.embedder) {
                return 'I am still warming up. Please wait a moment!';
            }
            const cleanedQuestion = normalizeText(question).trim();
            console.log('User question:', cleanedQuestion);
            if (!cleanedQuestion) {
                return 'You can enter questions related to Long for my support!';
            }

            const queryEmbedding = await generateEmbedding(state.embedder, cleanedQuestion);
            const matches = rankBySimilarity(queryEmbedding, state.knowledgeBase).slice(0, 5);
            console.log('Top matches:', matches);
            const topScore = matches[0]?.similarity ?? 0;
            const dynamicThreshold = Math.max(0.28, topScore - 0.08);
            const relevantMatches = matches
                .filter((item) => item.similarity >= dynamicThreshold)
                .slice(0, 3)
                .map((item) => ({
                    summary: item.summary,
                    source: item.source,
                    similarity: item.similarity,
                }));
            console.log('Relevant matches:', relevantMatches);
            if (!relevantMatches.length) {
                return "Sorry, I don't have the information to answer that question based on the current profile.";
            }

            if (statusEl) {
                statusEl.textContent = 'Đang tổng hợp câu trả lời...';
            }

            const generator = await ensureGenerator();
            const answer = await buildAnswer(cleanedQuestion, relevantMatches, generator);

            if (statusEl) {
                statusEl.textContent = 'Chatbot is ready. Ask questions!';
            }

            return answer;
        }
    };

    async function ensureGenerator() {
        if (state.generator === false) {
            return null;
        }
        if (state.generator) {
            return state.generator;
        }

        try {
            if (statusEl) {
                statusEl.textContent = 'Đang tải mô hình tóm tắt câu trả lời...';
            }
            state.generator = await pipeline('text2text-generation', 'Xenova/LaMini-T5-61M');
            return state.generator;
        } catch (error) {
            console.warn('Unable to load generator model:', error);
            state.generator = false;
            return null;
        }
    }
}

async function generateEmbedding(embedder, text) {
    const normalized = prepareForEmbedding(text);
    const output = await embedder(normalized, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
}

function computeKnowledgeSignature(entries) {
    const payload = entries
        .map((entry) => `${entry.source ?? 'unknown'}|${entry.embeddingText}`)
        .join('||');
    return `${CACHE_VERSION}:${djb2(payload)}`;
}

function formatCitations(matches) {
    if (!matches.length) {
        return '';
    }
    const lines = matches.map((match, index) => {
        const label = match.source ? String(match.source) : 'portfolio';
        const similarity = typeof match.similarity === 'number'
            ? ` • score ${(match.similarity * 100).toFixed(1)}%`
            : '';
        return `[${index + 1}] ${label}${similarity}`;
    });
    return ['Tham chiếu / References:', ...lines].join('\n');
}

function buildKnowledgeEntries(portfolio, privateData) {
    const entries = [];
    const strip = (html) => {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent ? div.textContent.trim() : '';
    };

    const pushEntry = (summary, source) => {
        if (!summary) return;
        const sanitizedSummary = normalizeText(summary);
        if (!sanitizedSummary) return;
        entries.push({
            embeddingText: sanitizedSummary,
            summary: sanitizedSummary,
            source
        });
    };

    if (portfolio?.profile) {
        const { name, titles, contacts } = portfolio.profile;
        const titleText = Array.isArray(titles) ? titles.join(', ') : (titles || '');
        const location = contacts?.location?.display;

        const email = contacts?.email?.display;
        const profileSummary = [
            name ? `Người được giới thiệu: ${name}.` : '',
            titleText ? `Vai trò nổi bật: ${titleText}.` : '',
            location ? `Địa điểm hiện tại: ${location}.` : '',
            email ? `Email liên hệ: ${email}.` : '',
        ].filter(Boolean).join(' ');
        pushEntry(profileSummary, 'profile');
    }

    portfolio?.about?.paragraphs?.forEach((paragraph) => {
        if (paragraph?.html) {
            pushEntry(strip(paragraph.html), 'about');
        }
    });

    portfolio?.about?.services?.forEach((service) => {
        const title = service?.title;
        const description = service?.descriptionHtml ? strip(service.descriptionHtml) : '';
        const summary = [title ? `Dịch vụ: ${title}.` : '', description].filter(Boolean).join(' ');
        pushEntry(summary, 'services');
    });

    portfolio?.resume?.experiences?.forEach((experience) => {
        const summary = [
            experience?.role && experience?.company ? `${experience.role} tại ${experience.company}.` : '',
            experience?.dates ? `Thời gian: ${experience.dates}.` : '',
            experience?.summaryHtml ? strip(experience.summaryHtml) : '',
        ].filter(Boolean).join(' ');
        pushEntry(summary, 'experience');
    });

    portfolio?.resume?.education?.forEach((education) => {
        const summary = [
            education?.school ? `Học tập tại ${education.school}.` : '',
            education?.dates ? `Thời gian: ${education.dates}.` : '',
            education?.summaryHtml ? strip(education.summaryHtml) : '',
        ].filter(Boolean).join(' ');
        pushEntry(summary, 'education');
    });

    portfolio?.publications?.forEach((publicationYear) => {
        publicationYear?.items?.forEach((item) => {
        const summary = [
            item?.title ? `Công bố: ${item.title}.` : '',
            item?.venue ? `Sự kiện: ${item.venue}.` : '',
            item?.summary ? `Tóm tắt: ${item.summary}.` : '',
        ].filter(Boolean).join(' ');
        pushEntry(summary, 'publications');
        });
    });

    portfolio?.portfolio?.projects?.forEach((project) => {
        const summary = [
            project?.title ? `Dự án: ${project.title}.` : '',
            project?.category ? `Lĩnh vực: ${project.category}.` : '',
            project?.descriptionHtml ? strip(project.descriptionHtml) : '',
        ].filter(Boolean).join(' ');
        pushEntry(summary, 'projects');
    });

    portfolio?.certificates?.forms?.forEach((certificate) => {
        const summary = [
            certificate?.title ? `Chứng chỉ: ${certificate.title}.` : '',
            certificate?.from ? `Đơn vị cấp: ${certificate.from}.` : '',
            certificate?.descriptionHtml ? strip(certificate.descriptionHtml) : '',
        ].filter(Boolean).join(' ');
        pushEntry(summary, 'certificates');
    });

    if (portfolio?.contact) {
        const contactSummary = [
            portfolio.contact.email?.href ? `Email: ${portfolio.contact.email.href.replace('mailto:', '')}.` : '',
            portfolio.contact.map?.caption ? `Địa chỉ: ${portfolio.contact.map.caption}.` : '',
        ].filter(Boolean).join(' ');
        pushEntry(contactSummary, 'contact');
    }

    privateData?.entries?.forEach((entry) => {
        const question = entry?.question ? strip(entry.question) : '';
        const answer = entry?.answer ? strip(entry.answer) : '';
        const summary = [question ? `Q: ${question}` : '', answer ? `A: ${answer}` : ''].filter(Boolean).join(' ');
        pushEntry(summary, 'private');
    });

    return entries;
}

function cosineSimilarity(vecA, vecB) {
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dot += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (!normA || !normB) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function rankBySimilarity(queryEmbedding, knowledgeBase) {
    return knowledgeBase.map((entry) => ({
        ...entry,
        similarity: cosineSimilarity(queryEmbedding, entry.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity);
}

async function buildAnswer(question, matches, generator) {
    if (!matches.length) {
        return '';
    }

    if (generator) {
        try {
            const context = matches
                .map((match, index) => `[#${index + 1}] ${match.summary}`)
                .join('\n');
            const prompt = `Bạn là trợ lý song ngữ cho hồ sơ của Long Nguyen. Trả lời câu hỏi dưới đây theo định dạng:
- Đoạn 1: Tiếng Việt (có dấu), súc tích, dẫn nguồn bằng ký hiệu [#n] khi dùng thông tin.
- Đoạn 2: English paragraph, concise, keep citations [#n] aligned with the context.
Nếu không đủ thông tin, nói rõ.

Câu hỏi: ${question}
Ngữ cảnh:
${context}

Trả lời:`;
            const output = await generator(prompt, { max_new_tokens: 220, temperature: 0.4 });
            const generated = normalizeText(output?.[0]?.generated_text ?? '');
            if (generated) {
                return `${generated}\n\n${formatCitations(matches)}`;
            }
        } catch (error) {
            console.warn('Generator failed, falling back to extractive summary:', error);
        }
    }

    const topMatch = matches[0];
    const additionalMatches = matches.slice(1);
    const sources = Array.from(new Set(matches.map((match) => match.source).filter(Boolean)));
    const confidence = Math.max(...matches.map((match) => match.similarity ?? 0));

    const viParagraphs = [];
    viParagraphs.push(`🇻🇳 Trả lời cho câu hỏi: "${question}"`);
    viParagraphs.push(topMatch.summary);
    if (additionalMatches.length) {
        const details = additionalMatches
            .map((match) => match.summary)
            .join(' ');
        viParagraphs.push(`Thông tin bổ sung: ${details}`);
    }
    if (sources.length) {
        viParagraphs.push(`Nguồn tham khảo: ${sources.join(', ')}.`);
    }
    viParagraphs.push(`Độ tin cậy ước tính: ${(confidence * 100).toFixed(0)}%.`);

    const enParagraphs = [];
    const englishQuestion = formatSummaryForLanguage(question, 'en');
    enParagraphs.push(`🇬🇧 Answer for: "${englishQuestion}"`);
    enParagraphs.push(formatSummaryForLanguage(topMatch.summary, 'en'));
    if (additionalMatches.length) {
        const details = additionalMatches
            .map((match) => formatSummaryForLanguage(match.summary, 'en'))
            .join(' ');
        enParagraphs.push(`Additional context: ${details}`);
    }
    if (sources.length) {
        enParagraphs.push(`Sources: ${sources.join(', ')}.`);
    }
    enParagraphs.push(`Estimated confidence: ${(confidence * 100).toFixed(0)}%.`);

    return [viParagraphs.join('\n'), enParagraphs.join('\n'), formatCitations(matches)].join('\n\n---\n\n');
}

function normalizeText(text) {
    if (text == null) return '';
    const stringValue = typeof text === 'string' ? text : String(text);
    const normalized = stringValue.normalize('NFKC');
    const decoded = textDecoder.decode(textEncoder.encode(normalized));
    return decoded.replace(/\r\n/g, '\n').replace(/\u00A0/g, ' ').trim();
}

function prepareForEmbedding(text) {
    return removeDiacritics(normalizeText(text)).toLowerCase();
}

function createEmbeddingCache() {
    const available = typeof indexedDB !== 'undefined';
    const DB_NAME = 'long-chatbot-cache';
    const STORE_NAME = 'embeddings';
    const VERSION = 1;

    async function openDB() {
        if (!available) return null;
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, VERSION);
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'key' });
                }
            };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async function get(key) {
        try {
            const db = await openDB();
            if (!db) return null;
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readonly');
                const store = tx.objectStore(STORE_NAME);
                const request = store.get(key);
                request.onsuccess = () => resolve(request.result ? request.result.value : null);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.warn('Embedding cache get failed:', error);
            return null;
        }
    }

    async function set(key, value) {
        try {
            const db = await openDB();
            if (!db) return;
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const request = store.put({ key, value });
                request.onsuccess = () => resolve(true);
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.warn('Embedding cache set failed:', error);
        }
    }

    async function clearExcept(keepKey) {
        try {
            const db = await openDB();
            if (!db) return;
            return new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                const request = store.openCursor();
                request.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (!cursor) {
                        resolve(true);
                        return;
                    }
                    if (cursor.key !== keepKey) {
                        cursor.delete();
                    }
                    cursor.continue();
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.warn('Embedding cache cleanup failed:', error);
        }
    }

    return {
        available,
        get,
        set,
        clearExcept,
    };
}

function formatSummaryForLanguage(text, language) {
    const normalized = normalizeText(text);
    if (!normalized) return '';
    if (language !== 'en') {
        return normalized;
    }

    let english = normalized;
    TRANSLATION_PAIRS.forEach(({ vi, en }) => {
        english = english.replaceAll(vi, en);
    });
    english = removeDiacritics(english);
    return english;
}

function removeDiacritics(text) {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function djb2(str) {
    let hash = 5381;
    for (let index = 0; index < str.length; index++) {
        hash = ((hash << 5) + hash) ^ str.charCodeAt(index);
    }
    return (hash >>> 0).toString(16);
}
