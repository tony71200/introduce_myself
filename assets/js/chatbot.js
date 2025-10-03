import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.12.0/dist/transformers.min.js';
// Chatbot implementation using Hugging Face Transformers.js
// Model: https://huggingface.co/gpt2

env.allowLocalModels = true; // Allow loading local models
env.useBrowserCache = true; // Enable browser cache for models
// env.cacheSize = 100 * 1024 * 1024; // 100 MB cache size

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder('utf-8');

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
    const html = await fetch('chatbot.html').then(res => res.text());
    container.innerHTML = html;

    const toggleButton = container.querySelector('[data-chatbot-toggle]');
    const closeButton = container.querySelector('[data-chatbot-close]');
    const windowEl = container.querySelector('[data-chatbot-window]');
    const messagesEl = container.querySelector('[data-chatbot-messages]');
    const statusEl = container.querySelector('[data-chatbot-status]');
    const formEl = container.querySelector('[data-chatbot-form]');
    const inputEl = container.querySelector('[data-chatbot-input]');
    const sendButton = container.querySelector('[data-chatbot-send]');

    if (windowEl) {
        windowEl.setAttribute('hidden', '');
    }
    if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', 'false');
    }

    const ragEngine = createRagEngine({
        statusEl,
        onReady: () => {
            inputEl.disabled = false;
            sendButton.disabled = false;
            inputEl.focus();
            sendButton.focus();
        },
        onError: (error) => {
            appendMessage(messagesEl, error, 'bot');
        },
    });

    setupToggle(toggleButton, closeButton, windowEl);
    autoScroll(messagesEl);

    formEl.addEventListener('submit', async (event) => {
        event.preventDefault();
        const text = inputEl.value.trim();
        if (!text) return;

        appendMessage(messagesEl, text, 'user');
        inputEl.value = '';
        appendMessage(messagesEl, 'Đang suy nghĩ...', 'bot', { temporary: true });
        const thinkingBubble = messagesEl.lastElementChild;

        try {
            const response = await ragEngine.ask(text);
            thinkingBubble.remove();
            appendMessage(messagesEl, response, 'bot');
        }catch(error) {
            console.error("Error during RAG processing:", error);
            thinkingBubble.remove();
            appendMessage(messagesEl, "Xin lỗi, đã có lỗi xảy ra khi xử lý yêu cầu của bạn.", 'bot');
        }
    });
}

function setupToggle(toggleButton, closeButton, windowEl) {
    if (!toggleButton || !windowEl || !closeButton) {
        return;
    }

    const closeWindow = () => {
        windowEl.setAttribute('hidden', '');
        toggleButton.setAttribute('aria-hidden', 'false');
        
    };

    const openWindow = () => {
        windowEl.removeAttribute('hidden');
        toggleButton.setAttribute('aria-hidden', 'true');
    };

    toggleButton.addEventListener('click', () => {
        const isHidden = windowEl.hasAttribute('hidden');
        if (isHidden) {
        openWindow();
        } else {
        closeWindow();
        }
    });

    closeButton.addEventListener('click', () => {
        closeWindow();
    });

    closeWindow();
}

function appendMessage(messagesEl, text, role, options = {}) {
    if (!messagesEl) return;

    const bubble = document.createElement('div');
    bubble.classList.add('chatbot-message');
    bubble.classList.add(role === 'user' ? 'chatbot-message--user' : 'chatbot-message--bot');

    const paragraph = document.createElement('p');
    paragraph.textContent = normalizeText(text);
    bubble.appendChild(paragraph);

    if (options.temporary) {
        bubble.dataset.temporary = 'true';
    }

    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
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
        ready : false,
    };

    initialize();

    async function initialize() {
        try {
            if (statusEl) {
                statusEl.textContent = 'Đang tải mô hình...';
            }

            const [portfolioRes, privateRes] = await Promise.all([
                fetch('data.json'),
                fetch('assets/data/private_knowledge.json')
            ]);

            const portfolio = await portfolioRes.json();
            const privateData = await privateRes.json();

            const entries = buildKnowledgeEntries(portfolio, privateData);
            console.log(entries);

            if (statusEl) {
                statusEl.textContent = `Initializing embedding (${entries.length} entries)...`;
            }

            state.embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

            for (let index = 0; index < entries.length; index++) {
                const entry = entries[index];
                const embedding = await generateEmbedding(state.embedder, entry.embeddingText);
                state.knowledgeBase.push({ ...entry, embedding });
                if (statusEl) {
                    statusEl.textContent = `Processing data (${index + 1} / ${entries.length})...`;
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
                return 'I am still warming up. Please wait a moment!'
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

            return buildAnswer(relevantMatches);
        }
    };
}

async function generateEmbedding(embedder, text) {
    const normalized = prepareForEmbedding(text);
    const output = await embedder(normalized, { pooling: 'mean', normalize: true });
    return Array.from(output.data);
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

function buildAnswer(matches) {
    if (!matches.length) {
        return '';
    }

    const topMatch = matches[0];
    const additionalMatches = matches.slice(1);
    const sources = Array.from(new Set(matches.map((match) => match.source).filter(Boolean)));
    const confidence = Math.max(...matches.map((match) => match.similarity ?? 0));

    const viParagraphs = [];
    // viParagraphs.push(`🇻🇳 Trả lời cho câu hỏi "${question}":`);
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
    // const englishQuestion = formatSummaryForLanguage(question, 'en');
    // enParagraphs.push(`🇬🇧 Answer for "${englishQuestion}":`);
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

    return [viParagraphs.join('\n'), enParagraphs.join('\n')].join('\n\n---\n\n');
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
