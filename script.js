const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.nav-links');

toggle.addEventListener('click', () => {
  const expanded = toggle.getAttribute('aria-expanded') === 'true';
  toggle.setAttribute('aria-expanded', String(!expanded));
  navigation.classList.toggle('open', !expanded);
});

navigation.addEventListener('click', (event) => {
  if (event.target.closest('a')) {
    toggle.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('open');
  }
});

document.querySelector('#year').textContent = new Date().getFullYear();

const chatForm = document.querySelector('#chatForm');
const chatInput = document.querySelector('#chatInput');
const chatMessages = document.querySelector('#chatMessages');
const chatPrompts = document.querySelector('.chat-prompts');
const sendButton = chatForm.querySelector('button[type="submit"]');

const dek450Knowledge = [
  {
    intent: 'safety',
    terms: ['dose', 'dosage', 'how many', 'how much should', 'take for', 'treatment', 'treat', 'symptom', 'diagnose', 'pregnant', 'pregnancy', 'side effect', 'safe for me', 'interaction', 'medicine for', 'antibiotic'],
    answer: 'I can help with store and product information, but I can’t recommend a medicine, dose, or treatment. Please speak with our pharmacist or your healthcare professional for personal advice.'
  },
  {
    intent: 'location',
    terms: ['where', 'location', 'address', 'directions', 'find you', 'situated', 'map', 'near'],
    answer: 'Dek450 Pharmacy is in Klagon, Lashibi, Tema, near Sakumono Police Station at NDC Junction, Cowpea Street, CB69. Use “Open map” in the Contact section for directions.'
  },
  {
    intent: 'contact',
    terms: ['phone', 'call', 'contact', 'number', 'telephone', 'reach you'],
    answer: 'Call our team on 053 380 5134, 050 211 3175, or 024 844 2602.'
  },
  {
    intent: 'hours',
    terms: ['open', 'opening hours', 'hours', 'closing', 'when are you'],
    answer: 'I don’t have confirmed opening hours. Please call 053 380 5134 or 050 211 3175 before visiting.'
  },
  {
    intent: 'medical-supplies',
    terms: ['medical supply', 'medical supplies', 'bulk order', 'bulk supply', 'clinic supply', 'supply business', 'care provider', 'wholesale'],
    answer: 'Dek450 Medical Supplies serves clinics, pharmacies, and care providers with product sourcing and bulk supply inquiries. Use the “Discuss a supply order” link at the bottom of the page to call our team.'
  },
  {
    intent: 'availability',
    terms: ['stock', 'available', 'availability', 'in stock', 'price', 'cost', 'buy', 'sell', 'do you have', 'how much is'],
    answer: 'Stock and prices can change. Call our team on 053 380 5134 or 050 211 3175 to confirm today’s availability and price.'
  },
  {
    intent: 'serum',
    terms: ['serum', 'facial', 'alpha arbutin', 'arbutin', 'niacinamide'],
    answer: 'The gallery includes TWG facial serums, including 5-in-1 and Alpha-Arbutin options. Contact us to confirm current stock and price.'
  },
  {
    intent: 'body-care',
    terms: ['lotion', 'body care', 'rice pulp'],
    answer: 'The gallery shows TWG body lotions, including rice pulp and niacinamide options in 500 ml bottles. Contact us to check what is currently in stock.'
  },
  {
    intent: 'vitamins',
    terms: ['vitamin', 'd3', 'omega', 'fish oil'],
    answer: 'Vitamin D3 and Omega-3 supplement options are shown in the gallery. Ask our pharmacist for guidance, and call us to confirm availability.'
  },
  {
    intent: 'probiotics',
    terms: ['probiotic', 'gummy', 'gummies', 'women', 'menopause', 'vaginal', 'flora'],
    answer: 'The gallery includes women’s, menopause, vaginal, and general probiotic capsule and gummy options. Check each pack for ingredients and directions, and ask our pharmacist about suitability.'
  },
  {
    intent: 'magnesium',
    terms: ['magnesium'],
    answer: 'A magnesium complex supplement is shown in the gallery. For ingredients, suitability, and current stock, speak with our pharmacy team.'
  },
  {
    intent: 'other-products',
    terms: ['primrose', 'skin radiance', 'collagen', 'biotin', 'shilajit', 'kidney cleanse', 'ovaboost', 'pcos', 'fertility', 'coq10', 'memory', 'focus', 'eye vitamins', 'joint support', 'sleep', 'supplement', 'product', 'products', 'carry', 'browse'],
    answer: 'The gallery features skincare and body care, vitamins, gummies, and wellness supplements such as OvaBoost, PCOS multivitamin, CoQ10, Joint Support, Memory & Focus, and Kidney Cleanse. Product examples and availability may change; call to confirm current stock. For personal advice, speak with our pharmacist.'
  }
];

function normalizeQuestion(value) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function getDek450Answer(question) {
  const normalized = normalizeQuestion(question);
  const words = new Set(normalized.split(' '));
  let bestMatch = null;
  let bestScore = 0;

  for (const item of dek450Knowledge) {
    const score = item.terms.reduce((total, term) => {
      const normalizedTerm = normalizeQuestion(term);
      return total + (normalized.includes(normalizedTerm) || (!normalizedTerm.includes(' ') && words.has(normalizedTerm)) ? 1 : 0);
    }, 0);
    if (score > bestScore) {
      bestMatch = item;
      bestScore = score;
    }
  }

  if (bestMatch) return bestMatch.answer;
  return 'I can help with products in our gallery, checking today’s availability, our Lashibi location, or medical-supply inquiries. Try asking about one of those, or call 053 380 5134 for help.';
}

function addChatMessage(text, kind) {
  const row = document.createElement('div');
  row.className = 'message-row ' + (kind === 'user' ? 'user-row' : 'assistant-row');

  const content = document.createElement('div');
  content.className = 'message-content';

  const author = document.createElement('span');
  author.className = 'message-author';
  author.textContent = kind === 'user' ? 'YOU' : 'DEK450 ASSISTANT';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (kind === 'user' ? 'user-bubble' : 'assistant-bubble');
  bubble.textContent = text;

  if (kind !== 'user') {
    const avatar = document.createElement('span');
    avatar.className = 'message-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = '✦';
    row.append(avatar);
  }

  content.append(author, bubble);
  row.append(content);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showTyping() {
  const row = document.createElement('div');
  row.className = 'message-row assistant-row typing-row';
  row.setAttribute('aria-label', 'Dek450 Assistant is preparing a reply');

  const avatar = document.createElement('span');
  avatar.className = 'message-avatar';
  avatar.setAttribute('aria-hidden', 'true');
  avatar.textContent = '✦';

  const content = document.createElement('div');
  content.className = 'message-content';
  const author = document.createElement('span');
  author.className = 'message-author';
  author.textContent = 'DEK450 ASSISTANT';
  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble assistant-bubble typing-bubble';
  bubble.setAttribute('aria-hidden', 'true');
  bubble.innerHTML = '<i></i><i></i><i></i>';
  content.append(author, bubble);
  row.append(avatar, content);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return row;
}

function askDek450(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) return;
  addChatMessage(cleanQuestion, 'user');
  chatInput.value = '';
  sendButton.disabled = true;
  const typing = showTyping();

  window.setTimeout(() => {
    typing.remove();
    addChatMessage(getDek450Answer(cleanQuestion), 'assistant');
    sendButton.disabled = false;
    chatInput.focus();
  }, 420);
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  askDek450(chatInput.value);
});

chatPrompts.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-question]');
  if (button) askDek450(button.dataset.question);
});
