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

const dek450Answers = [
  { terms: ['where', 'location', 'address', 'directions', 'find', 'situated', 'map'], answer: 'We are in Klagon, Lashibi, Tema, near Sakumono Police Station at NDC Junction, Cowpea Street, CB69. Use the “Get directions” link on this page for a map.' },
  { terms: ['phone', 'call', 'contact', 'number', 'telephone'], answer: 'You can call Dek450 Pharmacy on 053 380 5134, 050 211 3175, or 024 844 2602.' },
  { terms: ['open', 'hours', 'time', 'closing'], answer: 'I don’t have confirmed opening hours. Please call 053 380 5134 or 050 211 3175 before visiting.' },
  { terms: ['stock', 'available', 'availability', 'price', 'cost', 'buy', 'sell'], answer: 'Stock and prices can change. Please call our team on 053 380 5134 or 050 211 3175 to check today’s availability and price.' },
  { terms: ['serum', 'facial', 'alpha', 'arbutin', 'niacinamide'], answer: 'The gallery includes TWG facial serum options, including 5-in-1 and Alpha-Arbutin serums. Please contact the pharmacy to confirm current stock and price.' },
  { terms: ['lotion', 'body', 'rice', 'pulp'], answer: 'The gallery shows TWG body lotions, including rice pulp and niacinamide options in 500 ml bottles. Contact us to check what is currently in stock.' },
  { terms: ['vitamin', 'd3', 'omega', 'fish', 'oil'], answer: 'Vitamin D3 and Omega-3 supplement options are shown in the gallery. Ask our pharmacist for guidance and call us to confirm availability.' },
  { terms: ['probiotic', 'gummy', 'gummies', 'women'], answer: 'The gallery includes probiotic capsules and women’s probiotic gummies. Please check the label and contact our pharmacist with product questions.' },
  { terms: ['magnesium'], answer: 'A magnesium complex supplement is shown in the gallery. For ingredients, suitability, and current stock, please speak with our pharmacy team.' },
  { terms: ['primrose', 'skin radiance', 'collagen', 'biotin', 'shilajit', 'supplement', 'product', 'products', 'carry'], answer: 'Our gallery features skincare, body care, vitamins, and wellness supplements, including evening primrose oil, Skin Radiance, collagen/biotin, and shilajit gummies. Product examples may change; call us to confirm stock.' },
  { terms: ['dose', 'dosage', 'take', 'treatment', 'symptom', 'diagnose', 'pregnant', 'side effect', 'prescription', 'medicine for'], answer: 'I can share general product information, but I can’t recommend a medicine or dose. Please speak with our pharmacist or your healthcare professional for personal medical advice.' }
];

function getDek450Answer(question) {
  const words = question.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
  let best = { score: 0, answer: '' };
  for (const item of dek450Answers) {
    const score = item.terms.reduce((total, term) => total + (words.includes(term) || question.toLowerCase().includes(term) ? 1 : 0), 0);
    if (score > best.score) best = { score, answer: item.answer };
  }
  return best.answer || 'I can help with the products shown here, availability, and our Lashibi location. Try asking about a product name or call 053 380 5134 for more help.';
}

function addChatMessage(text, kind) {
  const message = document.createElement('div');
  message.className = 'chat-bubble ' + (kind === 'user' ? 'user-bubble' : 'assistant-bubble');
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function askDek450(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) return;
  addChatMessage(cleanQuestion, 'user');
  chatInput.value = '';
  window.setTimeout(() => addChatMessage(getDek450Answer(cleanQuestion), 'assistant'), 250);
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  askDek450(chatInput.value);
});

chatPrompts.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-question]');
  if (button) askDek450(button.dataset.question);
});
