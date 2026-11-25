const toggle = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#primary-nav');

function setMenu(expanded) {
  toggle.setAttribute('aria-expanded', String(expanded));
  toggle.setAttribute('aria-label', expanded ? 'Close navigation' : 'Open navigation');
  navigation.classList.toggle('open', expanded);
}

toggle.addEventListener('click', () => {
  setMenu(toggle.getAttribute('aria-expanded') !== 'true');
});

navigation.addEventListener('click', (event) => {
  const link = event.target.closest('a');
  if (!link || toggle.getAttribute('aria-expanded') !== 'true') return;

  const target = document.getElementById(link.hash.slice(1));
  setMenu(false);
  if (target) {
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    toggle.focus();
  }
});

document.addEventListener('click', (event) => {
  if (toggle.getAttribute('aria-expanded') === 'true' && !event.target.closest('.site-header')) setMenu(false);
});

window.matchMedia('(max-width: 650px)').addEventListener('change', () => setMenu(false));

const catalog = document.querySelector('#catalog-tools');
const catalogSearch = document.querySelector('#catalog-search');
const catalogCategory = document.querySelector('#catalog-category');
const catalogStatus = document.querySelector('#catalog-status');
const catalogReset = document.querySelector('#catalog-reset');
const catalogEmpty = document.querySelector('#catalog-empty');

function normalizeSearch(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

const catalogProducts = [...document.querySelectorAll('#product-grid .product-tile')].map((card) => ({
  card,
  category: card.dataset.category,
  text: normalizeSearch([...card.querySelector('.product-tile-copy').children].map((field) => field.textContent).join(' ') + ' ' + card.querySelector('img').alt)
}));

function updateCatalog() {
  const terms = normalizeSearch(catalogSearch.value).split(' ').filter(Boolean);
  const category = catalogCategory.value;
  let visible = 0;

  for (const product of catalogProducts) {
    const matches = (!category || category === product.category) && terms.every((term) => product.text.includes(term));
    product.card.hidden = !matches;
    if (matches) visible += 1;
  }

  catalogStatus.textContent = visible === 1 ? '1 product' : `${visible} products`;
  catalogEmpty.hidden = visible !== 0;
  catalogReset.hidden = !catalogSearch.value && !category;
}

catalogSearch.addEventListener('input', updateCatalog);
catalogCategory.addEventListener('change', updateCatalog);
catalogReset.addEventListener('click', () => {
  catalogSearch.value = '';
  catalogCategory.value = '';
  catalogSearch.focus();
  updateCatalog();
});
updateCatalog();
catalog.hidden = false;

document.querySelector('#year').textContent = new Date().getFullYear();

const chatForm = document.querySelector('#chatForm');
const chatInput = document.querySelector('#chatInput');
const chatMessages = document.querySelector('#chatMessages');
const chatPrompts = document.querySelector('.chat-prompts');
const chatReset = document.querySelector('#chatReset');
const welcomeMessage = chatMessages.firstElementChild.cloneNode(true);
const hours = [...document.querySelectorAll('.pharmacy-hours time')].map((time) => time.textContent);
function contactAction(link, channel) {
  return { label: channel + ' ' + link.querySelector('[data-contact-number]').textContent.trim(), href: link.getAttribute('href') };
}
const callActions = [...document.querySelectorAll('.contact-phone')].map((link) => contactAction(link, 'Call'));
const mainPhone = callActions[0];
const whatsapp = contactAction(document.querySelector('.contact-whatsapp'), 'WhatsApp');
const directions = { label: 'Directions to Sakumono Police Station', href: document.querySelector('.address-route').href };
const pharmacyMapSearch = { label: 'Find Dek450 in Google Maps', href: document.querySelector('.address-search').href };
const catalogLink = { label: 'Browse products', href: '#products' };
const supplyLink = { label: 'Medical supplies enquiries', href: '#medical-supplies' };
const contactLink = { label: 'Hours and contact', href: '#contact' };

const chatProducts = catalogProducts.map(({ card, category }) => {
  const name = card.querySelector('h3').textContent;
  const description = card.querySelector('.product-tile-copy p').textContent;
  const alt = card.querySelector('img').alt;
  const label = card.querySelector('.product-detail-link');
  const nameKey = normalizeSearch(name);
  if (!card.id) card.id = 'product-' + nameKey.replaceAll(' ', '-');
  return {
    name, description, category, nameKey,
    alias: normalizeSearch(alt),
    label: label && { label: 'View ' + name + ' label', href: label.href },
    link: { label: 'See ' + name, href: '#' + card.id, product: card }
  };
});
let lastProduct = null;

function hasPhrase(value, phrase) {
  return (' ' + value + ' ').includes(' ' + phrase + ' ');
}

function findProduct(value) {
  const ignored = new Set('a an and care do for have i is it me of or please product show support tell the to what you your'.split(' '));
  const query = value.split(' ').filter((word) => !ignored.has(word));
  const scores = chatProducts.map((product) => {
    const nameWords = product.nameKey.split(' ').filter((word) => !ignored.has(word) && word.length > 2);
    const overlap = nameWords.filter((word) => query.includes(word)).length;
    const fullMatch = hasPhrase(value, product.nameKey) || hasPhrase(value, product.alias);
    const compactQuery = value.replaceAll(' ', '');
    const coq10 = product.nameKey.startsWith('coq10 ') && compactQuery.includes('coq10');
    const alphaBrain = product.nameKey === 'memory focus' && hasPhrase(value, 'alpha brain');
    const dha = product.nameKey.includes('dha 500') && (hasPhrase(value, 'dha') || hasPhrase(value, 'fish oil'));
    const vitamin = product.nameKey.startsWith('vitamin d3') && (hasPhrase(value, 'vitamin d3') || hasPhrase(value, 'd3'));
    const score = fullMatch ? 20 + nameWords.length : coq10 || alphaBrain || dha || vitamin ? 16 : overlap >= 2 ? overlap : 0;
    return { product, score };
  }).sort((a, b) => b.score - a.score);
  if (!scores[0]?.score || scores[0].score === scores[1]?.score) return null;
  return scores[0].product;
}

function getDek450Answer(question) {
  const value = normalizeSearch(question);
  const replies = [];
  const actions = new Map();
  const add = (text, ...links) => {
    replies.push(text);
    for (const link of links) if (link) actions.set(link.href, link);
  };
  const clinical = /\b(dose|dosage|side effects?|interactions?|pregnan\w*|breastfeed\w*|symptoms?|diagnos\w*|treat\w*|cure\w*|safe for me|can i take|should i take|how to take|what can i take|what should i take|how many (should|can)|medicine for|medication for|recommend)\b/.test(value);
  const prescription = /\b(prescriptions?|antibiotics?|cholesterol medicines?|statins?|rocephin\w*|ceftriaxone|augmentin|amoxicillin|zithromax|azithromycin|lipitor|atorvastatin|crestor|rosuvastatin)\b/.test(value);
  const availability = /\b(stock|availab\w*|price|cost|buy|sell|purchase|do you (have|carry|sell)|out of stock|how much (is|does))\b/.test(value);
  const timing = /\b(open\w*|clos(e|es|ing|ed)|hours|time can i visit|what time|today|sunday|saturday|weekends?|holidays?)\b/.test(value);

  if (timing && !(/\bopen (the )?(map|catalog|label)\b/.test(value) && !/\b(hours|time|when)\b/.test(value))) {
    let text = 'Our posted opening hours are ' + hours[0] + ' to ' + hours[1] + ', Ghana time.';
    if (/\b(now|today|sunday|saturday|weekends?|holidays?|tomorrow)\b/.test(value)) {
      text += ' Call before travelling to confirm the schedule for your visit.';
    }
    add(text, contactLink, mainPhone);
  }
  if (/\b(where (are you|is dek450)|location|address|directions|find you|map|lashibi|sakumono|landmark|how (can|do) i get there)\b/.test(value)) {
    add('Visit us in Klagon, Lashibi, Tema, near Sakumono Police Station at NDC Junction, Cowpea Street (CB69). The directions link uses Sakumono Police Station as the nearby landmark.', directions, pharmacyMapSearch);
  }
  if (/\b(whatsapp|whats app)\b/.test(value)) {
    add('You can message Dek450 Pharmacy on WhatsApp.', whatsapp);
  }
  if (/\b(phone|telephone|contact|number|numbers|call|reach you|email)\b/.test(value) &&
      !/\b(whatsapp|whats app)\b/.test(value)) {
    add('Call either pharmacy number or message us on WhatsApp.', ...callActions, whatsapp);
  }
  if (/\b(medical suppl(y|ies)|wholesale|bulk|clinic suppl\w*|sourcing)\b/.test(value)) {
    add('Dek450 Medical Supplies handles sourcing and bulk enquiries for clinics, pharmacies and care providers.', supplyLink, mainPhone);
  }
  if (clinical) {
    add('For advice about symptoms, doses, side effects or whether a medicine is right for you, speak with our pharmacist or your healthcare professional.', mainPhone);
  }
  if (prescription) {
    add('Call the pharmacy team about your prescription or medicine enquiry. They can check availability and tell you what to bring.', mainPhone);
  }
  if (/\b(deliver\w*|shipping|payment|pay|mobile money|momo|insurance|nhis|returns?|refunds?)\b/.test(value)) {
    add('Please call the pharmacy to confirm delivery, payment, insurance or returns arrangements for your request.', mainPhone);
  }

  const product = findProduct(value) || (/\b(it|its|that one|same one)\b/.test(value) ? lastProduct : null);
  if (product && !clinical && !prescription) {
    lastProduct = product;
    add(product.name + '. ' + product.description, product.link, product.label);
  }
  if (availability && !prescription) {
    add('The catalog shows product information. Call our team to confirm current stock and price' + (product ? ' for ' + product.name : '') + '.', mainPhone, whatsapp);
  }
  if (!product && !clinical && !prescription && !availability && /\b(products?|catalog|browse|supplements?|vitamins?|probiotics?|skincare|body care|gummies)\b/.test(value)) {
    add('Browse the catalog and search by product name or category. It includes skincare, vitamins, probiotics and supplements.', catalogLink);
  }
  if (!replies.length) {
    if (/^(thanks|thank you|ok|okay|cheers)( very much)?$/.test(value)) {
      add('You’re welcome. Ask another question whenever you’re ready.');
    } else {
      add('Try asking about opening hours, directions, prescriptions, or a product by name. For anything else, call our pharmacy team.', catalogLink, mainPhone);
    }
  }
  return { replies, actions: [...actions.values()] };
}

function addChatMessage(lines, kind, actions = []) {
  const row = document.createElement('div');
  row.className = 'message-row ' + (kind === 'user' ? 'user-row' : 'assistant-row');

  const content = document.createElement('div');
  content.className = 'message-content';
  const author = document.createElement('span');
  author.className = 'message-author';
  author.textContent = kind === 'user' ? 'You' : 'Dek450 Assistant';

  const bubble = document.createElement('div');
  bubble.className = 'chat-bubble ' + (kind === 'user' ? 'user-bubble' : 'assistant-bubble');
  for (const line of lines) {
    const paragraph = document.createElement('p');
    paragraph.textContent = line;
    bubble.append(paragraph);
  }
  if (actions.length) {
    const links = document.createElement('div');
    links.className = 'chat-actions';
    for (const action of actions) {
      const anchor = document.createElement('a');
      anchor.href = action.href;
      anchor.textContent = action.label;
      if (action.href.startsWith('https:')) {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
      }
      if (action.product) {
        anchor.addEventListener('click', () => {
          if (action.product.hidden) {
            catalogSearch.value = '';
            catalogCategory.value = '';
            updateCatalog();
          }
        });
      }
      links.append(anchor);
    }
    bubble.append(links);
  }
  content.append(author, bubble);
  row.append(content);
  chatMessages.append(row);
  return row;
}

function askDek450(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion) {
    chatInput.focus();
    return;
  }
  addChatMessage([cleanQuestion], 'user');
  const { replies, actions } = getDek450Answer(cleanQuestion);
  const reply = addChatMessage(replies, 'assistant', actions);
  chatMessages.scrollTop += reply.getBoundingClientRect().top - chatMessages.getBoundingClientRect().top - 14;
  chatInput.value = '';
  chatReset.hidden = false;
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  askDek450(chatInput.value);
  chatInput.focus();
});

chatPrompts.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-question]');
  if (button) askDek450(button.dataset.question);
});

chatReset.addEventListener('click', () => {
  chatMessages.replaceChildren(welcomeMessage.cloneNode(true));
  chatMessages.scrollTop = 0;
  chatInput.value = '';
  lastProduct = null;
  chatReset.hidden = true;
  chatInput.focus();
});

document.querySelectorAll('[data-motion]').forEach((button) => {
  const preview = button.closest('figure').querySelector('.motion-preview');
  const still = preview.getAttribute('src');

  button.addEventListener('click', () => {
    if (button.getAttribute('aria-disabled') === 'true') return;

    button.setAttribute('aria-disabled', 'true');
    button.textContent = 'Loading preview…';

    const finish = (message) => {
      preview.src = still;
      button.removeAttribute('aria-disabled');
      button.textContent = message;
    };

    const reset = new AbortController();
    preview.addEventListener('load', () => {
      reset.abort();
      button.textContent = 'Playing preview…';
      window.setTimeout(() => finish('Replay preview'), 2100);
    }, { once: true, signal: reset.signal });

    preview.addEventListener('error', () => {
      reset.abort();
      finish('Retry preview');
    }, { once: true, signal: reset.signal });

    const source = new URL(button.dataset.motion, document.baseURI);
    source.searchParams.set('play', String(Date.now()));
    preview.src = source.href;
  });
});
