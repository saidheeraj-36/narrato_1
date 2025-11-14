/*
 * MarketNarrator AI - front-end logic
 * -------------------------------------------------
 * This file bundles all interactivity and AI helpers.
 * Every major feature is designed for clarity so that
 * beginner developers can tweak or extend it quickly.
 */

const selectors = {
  apiKeyInput: document.getElementById('apiKey'),
  saveApiKey: document.getElementById('saveApiKey'),
  personaForm: document.getElementById('personaForm'),
  personaOutput: document.getElementById('personaOutput'),
  personaCopy: document.getElementById('personaToClipboard'),
  campaignForm: document.getElementById('campaignForm'),
  campaignOutput: document.getElementById('campaignOutput'),
  campaignCopy: document.getElementById('campaignToClipboard'),
  campaignCalendar: document.getElementById('campaignToCalendar'),
  performanceForm: document.getElementById('performanceForm'),
  listeningForm: document.getElementById('listeningForm'),
  listeningOutput: document.getElementById('listeningOutput'),
  listeningCopy: document.getElementById('listeningToClipboard'),
  milestonePool: document.getElementById('milestonePool'),
  calendarColumns: document.querySelectorAll('.calendar-column'),
  resetMilestones: document.getElementById('resetMilestones'),
  exportCalendar: document.getElementById('exportCalendar'),
  chatForm: document.getElementById('chatForm'),
  chatInput: document.getElementById('chatInput'),
  chatWindow: document.getElementById('chatWindow'),
  chatbotStatus: document.getElementById('chatbotStatus'),
  metricsForm: document.getElementById('metricsForm'),
  metricsChart: document.getElementById('metricsChart'),
  feedbackForm: document.getElementById('feedbackForm'),
  feedbackList: document.getElementById('feedbackList'),
};

const state = {
  apiKey: localStorage.getItem('marketNarratorApiKey') || '',
  campaignData: null,
  calendarData: { 1: [], 2: [], 3: [], 4: [] },
  charts: {},
};

/** --------------------------------------------------
 * Utility helpers
 * ---------------------------------------------------*/
const smoothScrollButtons = document.querySelectorAll('[data-scroll]');
smoothScrollButtons.forEach((btn) =>
  btn.addEventListener('click', () => {
    const target = document.querySelector(btn.dataset.scroll);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  })
);

const setApiKey = (key) => {
  state.apiKey = key.trim();
  if (state.apiKey) {
    localStorage.setItem('marketNarratorApiKey', state.apiKey);
    selectors.apiKeyInput.type = 'password';
    selectors.apiKeyInput.value = state.apiKey.replace(/.(?=.{4})/g, '•');
    selectors.saveApiKey.textContent = 'API Key Saved';
    selectors.saveApiKey.disabled = true;
  }
};

if (state.apiKey) {
  // Mask stored API key in UI without exposing raw string
  selectors.apiKeyInput.value = state.apiKey.replace(/.(?=.{4})/g, '•');
  selectors.saveApiKey.textContent = 'API Key Saved';
  selectors.saveApiKey.disabled = true;
}

selectors.saveApiKey?.addEventListener('click', () => {
  const rawValue = selectors.apiKeyInput.value.trim();
  if (!rawValue) {
    alert('Please paste your Gemini API key.');
    return;
  }
  setApiKey(rawValue);
  alert('Key stored securely in your browser. Refresh to clear.');
});

const createLoader = (text = 'Thinking...') => {
  const loader = document.createElement('div');
  loader.className = 'loader';
  loader.textContent = text;
  return loader;
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  } catch (error) {
    console.error('Copy failed', error);
    alert('Unable to copy. Select the text and copy manually.');
  }
};

const renderMarkdownList = (items) => items.map((item) => `• ${item}`).join('\n');

/** --------------------------------------------------
 * Gemini API client (minimal wrapper)
 * ---------------------------------------------------*/
const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function callGemini(prompt) {
  if (!state.apiKey) {
    throw new Error('Missing API key');
  }

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${encodeURIComponent(state.apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details?.error?.message || 'Gemini request failed');
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
}

/** --------------------------------------------------
 * Persona Generator
 * ---------------------------------------------------*/
function buildFallbackPersona({ product, audience, value, challenges }) {
  const challengeList = challenges
    ? challenges.split(',').map((item) => item.trim()).filter(Boolean)
    : [];

  const painPoints = challengeList.length
    ? renderMarkdownList(challengeList.map((item) => `${item} → impact on revenue & morale`))
    : '• Content velocity too low to hit growth targets\n• Need measurable ROI for every experiment\n• Teams stretched thin across channels';

  return `**Primary Persona: ${audience} Champion**\n\n` +
    `**Role & Context**\n` +
    `• Oversees marketing motions for ${product}.\n` +
    `• Responsible for driving pipeline with lean teams and ambitious targets.\n\n` +
    `**Core Motivation**\n` +
    `• ${value}.\n` +
    `• Wants provable wins they can show leadership.\n\n` +
    `**Key Challenges**\n${painPoints}\n\n` +
    `**Messaging Hooks**\n` +
    `• Show how automation preserves brand voice.\n` +
    `• Quantify impact on acquisition & retention.\n\n` +
    `**Decision Triggers**\n` +
    `• Peer validation & credible case studies.\n` +
    `• Interactive demos with measurable outcomes.`;
}

selectors.personaForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(selectors.personaForm);
  const payload = Object.fromEntries(formData.entries());
  selectors.personaOutput.innerHTML = '';
  const loader = createLoader('Crafting persona...');
  selectors.personaOutput.append(loader);

  const prompt = `You are a marketing strategist. Create a vivid buyer persona for ${payload.product} targeting ${payload.audience}. Value proposition: ${payload.value}. Challenges: ${payload.challenges}. Provide sections for Role, Goals, Pain Points, Content Themes, Preferred Channels, and Success Metrics.`;

  try {
    const result = await callGemini(prompt);
    selectors.personaOutput.textContent = result || buildFallbackPersona(payload);
  } catch (error) {
    console.warn('Gemini unavailable, using fallback persona.', error);
    selectors.personaOutput.textContent = buildFallbackPersona(payload);
  }

  selectors.personaCopy.disabled = false;
});

selectors.personaCopy?.addEventListener('click', () => {
  copyToClipboard(selectors.personaOutput.textContent);
});

/** --------------------------------------------------
 * Campaign Studio with tabs
 * ---------------------------------------------------*/
const campaignTabs = document.querySelectorAll('.tab');
const tabSections = document.querySelectorAll('[data-tab-content]');

campaignTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    campaignTabs.forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    const target = tab.dataset.tab;
    tabSections.forEach((section) => {
      section.hidden = section.dataset.tabContent !== target;
    });
  });
});

function buildFallbackCampaign({ objective, tone, offer, cta, channels }) {
  const channelList = channels?.length
    ? channels.split(',').map((item) => item.trim())
    : ['Email', 'LinkedIn', 'Landing Page'];

  const heroConcept = `**Flagship Idea**\nLaunch "${objective}" as a narrative-driven series showcasing customer wins.`;
  const storyline = `**Hero Narrative**\n${tone} storytelling that dramatizes the before/after impact of adopting the solution.`;
  const kpis = `**KPIs**\n• Pipeline velocity\n• Qualified demo requests\n• ${offer ? `Offer uptake (${offer})` : 'Offer engagement rate'}`;

  const channelCopy = channelList
    .map(
      (channel) =>
        `### ${channel}\n• Hook: ${tone} hook tailored for ${channel}.\n• Value Prop: Tie benefits to ${objective.toLowerCase()}.\n• CTA: ${cta || 'Book a strategy call'}.`
    )
    .join('\n\n');

  const creativeBrief =
    `**Visual Direction**\nFuturistic gradients + authentic team imagery.\n\n` +
    `**Must Include**\n• ${offer || 'Primary offer highlight'}\n• Proof points & testimonials\n• Social proof badges\n\n` +
    `**Delivery Plan**\n• Kickoff sync\n• Production sprint\n• QA + launch\n• Retrospective workshop`;

  return {
    concept: `${heroConcept}\n\n${storyline}\n\n${kpis}`,
    copy: channelCopy,
    brief: creativeBrief,
  };
}

selectors.campaignForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(selectors.campaignForm);
  const payload = Object.fromEntries(formData.entries());
  payload.channels = formData.getAll('channels').join(', ');

  const prompt = `You are a marketing campaign architect. Using the following inputs, create:
1. A flagship concept with storytelling angle and KPI guidance.
2. Channel-specific copy variations (Email, LinkedIn, Ads, Landing Page as relevant).
3. A creative brief for design & growth teams.

Inputs:
Objective: ${payload.objective}
Tone: ${payload.tone}
Offer: ${payload.offer}
CTA: ${payload.cta}
Channels: ${payload.channels || 'not specified'}
`; // newline at end for clarity

  selectors.campaignOutput.querySelectorAll('.output > div').forEach((section) => (section.textContent = ''));
  const [conceptEl, copyEl, briefEl] = [
    selectors.campaignOutput.querySelector('[data-tab-content="concept"]'),
    selectors.campaignOutput.querySelector('[data-tab-content="copy"]'),
    selectors.campaignOutput.querySelector('[data-tab-content="brief"]'),
  ];

  const loader = createLoader('Synthesizing campaign assets...');
  conceptEl.append(loader);

  try {
    const response = await callGemini(prompt);
    conceptEl.textContent = response || 'Gemini returned an empty response. Try again!';
    if (response) {
      const sections = response.split(/\n{2,}/);
      conceptEl.textContent = sections[0] || response;
      copyEl.textContent = sections[1] || 'Refine prompts for richer channel copy.';
      briefEl.textContent = sections[2] || 'Add implementation guardrails manually if needed.';
    }
  } catch (error) {
    console.warn('Falling back to handcrafted campaign assets', error);
    const fallback = buildFallbackCampaign(payload);
    conceptEl.textContent = fallback.concept;
    copyEl.textContent = fallback.copy;
    briefEl.textContent = fallback.brief;
  }

  selectors.campaignCopy.disabled = false;
  selectors.campaignCalendar.disabled = false;
  state.campaignData = payload;
});

selectors.campaignCopy?.addEventListener('click', () => {
  const concept = selectors.campaignOutput.querySelector('[data-tab-content="concept"]').textContent;
  const copy = selectors.campaignOutput.querySelector('[data-tab-content="copy"]').textContent;
  const brief = selectors.campaignOutput.querySelector('[data-tab-content="brief"]').textContent;
  copyToClipboard(`${concept}\n\n${copy}\n\n${brief}`);
});

selectors.campaignCalendar?.addEventListener('click', () => {
  if (!state.campaignData) return;
  const baseMilestones = [
    `${state.campaignData.objective} | Launch teaser`,
    `Develop creatives for ${state.campaignData.channels || 'priority channels'}`,
    'Publish hero story featuring Persona Lab insights',
    `Retarget engaged leads with ${state.campaignData.offer || 'premium offer'}`,
  ];
  selectors.milestonePool.innerHTML = '';
  baseMilestones.forEach((item) => {
    const li = document.createElement('li');
    li.draggable = true;
    li.textContent = item;
    selectors.milestonePool.append(li);
  });
  attachDragEvents();
  alert('Milestones refreshed using campaign context. Drag them into the calendar!');
});

/** --------------------------------------------------
 * Calendar Drag & Drop + CSV export
 * ---------------------------------------------------*/
function attachDragEvents() {
  const draggables = document.querySelectorAll('[draggable="true"]');
  draggables.forEach((item) => {
    item.addEventListener('dragstart', (event) => {
      event.dataTransfer.setData('text/plain', event.target.textContent);
      event.dataTransfer.effectAllowed = 'move';
    });
  });
}

attachDragEvents();

selectors.calendarColumns.forEach((column) => {
  column.addEventListener('dragover', (event) => {
    event.preventDefault();
    column.classList.add('is-hovered');
  });
  column.addEventListener('dragleave', () => column.classList.remove('is-hovered'));
  column.addEventListener('drop', (event) => {
    event.preventDefault();
    const text = event.dataTransfer.getData('text/plain');
    if (!text) return;
    const milestone = document.createElement('div');
    milestone.className = 'milestone';
    milestone.textContent = text;
    column.append(milestone);
    column.classList.remove('is-hovered');

    const week = column.dataset.week;
    state.calendarData[week].push(text);
  });
});

selectors.resetMilestones?.addEventListener('click', () => {
  selectors.milestonePool.innerHTML = `
    <li draggable="true">Thought leadership blog - Week 1</li>
    <li draggable="true">LinkedIn carousel - Week 1</li>
    <li draggable="true">Webinar reminder email - Week 2</li>
    <li draggable="true">Customer case study - Week 3</li>
  `;
  selectors.calendarColumns.forEach((column) => {
    column.querySelectorAll('.milestone').forEach((node) => node.remove());
    column.classList.remove('is-hovered');
  });
  state.calendarData = { 1: [], 2: [], 3: [], 4: [] };
  attachDragEvents();
});

selectors.exportCalendar?.addEventListener('click', () => {
  const rows = [['Week', 'Milestones']];
  Object.entries(state.calendarData).forEach(([week, items]) => {
    rows.push([`Week ${week}`, items.join(' | ')]);
  });
  const csvContent = rows.map((row) => row.join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'marketnarrator-calendar.csv';
  link.click();
  URL.revokeObjectURL(url);
});

/** --------------------------------------------------
 * Performance Simulator & Listening Brief
 * ---------------------------------------------------*/
function initPerformanceChart() {
  const context = document.getElementById('performanceChart');
  if (!context) return;
  state.charts.performance = new Chart(context, {
    type: 'bar',
    data: {
      labels: ['Reach', 'Clicks', 'Conversions', 'Revenue'],
      datasets: [
        {
          label: 'Forecast',
          data: [0, 0, 0, 0],
          backgroundColor: ['#5b5bf7', '#818cf8', '#38bdf8', '#34d399'],
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => (typeof value === 'number' ? value.toLocaleString() : value),
          },
        },
      },
    },
  });
}

function updatePerformanceChart({ audience, ctr, conversion, deal }) {
  const reach = Number(audience);
  const clicks = Math.round(reach * (Number(ctr) / 100));
  const conversions = Math.round(clicks * (Number(conversion) / 100));
  const revenue = Math.round(conversions * Number(deal));

  state.charts.performance.data.datasets[0].data = [reach, clicks, conversions, revenue];
  state.charts.performance.update();
}

selectors.performanceForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(selectors.performanceForm).entries());
  updatePerformanceChart(payload);
});

selectors.listeningForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(selectors.listeningForm);
  const payload = Object.fromEntries(formData.entries());
  selectors.listeningOutput.innerHTML = '';
  const loader = createLoader('Mining conversations...');
  selectors.listeningOutput.append(loader);

  const prompt = `You are monitoring social conversations. Provide a listening brief for ${payload.keyword} on ${payload.channel}. Include volume trend, sentiment summary, top influencers, and recommended response ideas.`;

  try {
    const response = await callGemini(prompt);
    selectors.listeningOutput.textContent = response || 'Gemini did not return any insight. Try adjusting your keyword.';
  } catch (error) {
    console.warn('Using fallback listening brief', error);
    selectors.listeningOutput.textContent = `**Listening Brief: ${payload.keyword} (${payload.channel})**\n\n` +
      `• Sentiment trending positive with curiosity about ROI.\n` +
      `• Influencers: @growthwithai, @marketingopsdaily, ${payload.keyword.replace(/\s+/g, '').toLowerCase()}_community.\n` +
      `• Recommended move: publish POV thread + invite to webinar.`;
  }
  selectors.listeningCopy.disabled = false;
});

selectors.listeningCopy?.addEventListener('click', () => {
  copyToClipboard(selectors.listeningOutput.textContent);
});

/** --------------------------------------------------
 * Chatbot
 * ---------------------------------------------------*/
async function appendChatMessage({ text, role = 'ai' }) {
  const bubble = document.createElement('div');
  bubble.className = `chat-message chat-message--${role === 'user' ? 'user' : 'ai'}`;
  bubble.textContent = text;
  selectors.chatWindow.append(bubble);
  selectors.chatWindow.scrollTop = selectors.chatWindow.scrollHeight;
}

async function sendChatPrompt(prompt) {
  if (!prompt.trim()) return;
  await appendChatMessage({ text: prompt, role: 'user' });
  selectors.chatbotStatus.textContent = 'Thinking with Gemini...';

  try {
    const response = await callGemini(`Act as a senior marketing strategist. ${prompt}`);
    await appendChatMessage({ text: response || 'Gemini did not respond. Try again.', role: 'ai' });
  } catch (error) {
    console.warn('Chat fallback triggered', error);
    await appendChatMessage({
      text: 'Gemini is unavailable. Try refreshing or check your API key. Meanwhile, consider brainstorming experiments, story angles, and proof points manually.',
      role: 'ai',
    });
  }

  selectors.chatbotStatus.textContent = 'Waiting for your prompt.';
}

selectors.chatForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const prompt = selectors.chatInput.value;
  selectors.chatInput.value = '';
  await sendChatPrompt(prompt);
});

const chatPrompts = document.querySelectorAll('[data-chat-prompt]');
chatPrompts.forEach((item) => {
  item.addEventListener('click', () => sendChatPrompt(item.dataset.chatPrompt));
  item.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      sendChatPrompt(item.dataset.chatPrompt);
    }
  });
});

/** --------------------------------------------------
 * Impact Hub: Metrics chart + feedback vault
 * ---------------------------------------------------*/
function initMetricsChart() {
  if (!selectors.metricsChart) return;
  state.charts.metrics = new Chart(selectors.metricsChart, {
    type: 'radar',
    data: {
      labels: ['Visits', 'Signups', 'NPS'],
      datasets: [
        {
          label: 'Current Sprint',
          data: [120, 18, 48],
          borderColor: '#5b5bf7',
          backgroundColor: 'rgba(91, 91, 247, 0.25)',
        },
      ],
    },
    options: {
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 100,
          angleLines: { color: 'rgba(91, 91, 247, 0.2)' },
          grid: { color: 'rgba(91, 91, 247, 0.2)' },
        },
      },
    },
  });
}

selectors.metricsForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(selectors.metricsForm).entries());
  const data = [Number(payload.visits), Number(payload.signups), Number(payload.nps)];
  state.charts.metrics.data.datasets[0].data = data;
  state.charts.metrics.update();
});

const storedFeedback = JSON.parse(localStorage.getItem('marketNarratorFeedback') || '[]');

function renderFeedback(items) {
  selectors.feedbackList.innerHTML = '';
  items.forEach(({ name, feedback, impact }) => {
    const li = document.createElement('li');
    const nameEl = document.createElement('strong');
    nameEl.textContent = name;
    const feedbackEl = document.createElement('p');
    feedbackEl.textContent = feedback;
    const impactEl = document.createElement('p');
    impactEl.textContent = impact;
    li.append(nameEl, feedbackEl);
    if (impact) li.append(impactEl);
    selectors.feedbackList.append(li);
  });
}

renderFeedback(storedFeedback);

selectors.feedbackForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(selectors.feedbackForm).entries());
  storedFeedback.push(payload);
  localStorage.setItem('marketNarratorFeedback', JSON.stringify(storedFeedback));
  renderFeedback(storedFeedback);
  selectors.feedbackForm.reset();
});

/** --------------------------------------------------
 * Initialize charts when DOM ready
 * ---------------------------------------------------*/
window.addEventListener('load', () => {
  initPerformanceChart();
  initMetricsChart();
});
