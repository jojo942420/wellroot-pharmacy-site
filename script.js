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
const catalogShowAll = document.querySelector('#catalog-show-all');
const featuredProductCount = 12;
let fullCatalog = false;

function normalizeSearch(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}

const catalogProducts = [...document.querySelectorAll('#product-grid .product-tile')].map((card) => {
  const name = card.querySelector('h3').textContent;
  const nameKey = normalizeSearch(name);
  if (!card.id) card.id = 'product-' + nameKey.replaceAll(' ', '-');
  return {
    card, name, nameKey,
    category: card.dataset.category,
    text: normalizeSearch([...card.querySelector('.product-tile-copy').children].map((field) => field.textContent).join(' ') + ' ' + (card.querySelector('img')?.alt ?? ''))
  };
});

function updateCatalog() {
  const terms = normalizeSearch(catalogSearch.value).split(' ').filter(Boolean);
  const category = catalogCategory.value;
  const filtersActive = Boolean(terms.length || category);
  const limit = fullCatalog || filtersActive ? Infinity : featuredProductCount;
  let matchesFound = 0;

  for (const product of catalogProducts) {
    const matches = (!category || category === product.category) && terms.every((term) => product.text.includes(term));
    if (matches) matchesFound += 1;
    product.card.hidden = !matches || matchesFound > limit;
  }

  const showAllAvailable = matchesFound > limit;
  catalogStatus.textContent = showAllAvailable
    ? `Showing ${limit} of ${matchesFound} products`
    : matchesFound === 1 ? '1 product' : `${matchesFound} products`;
  catalogEmpty.hidden = matchesFound !== 0;
  catalogReset.hidden = !catalogSearch.value && !category;
  catalogShowAll.hidden = !showAllAvailable;
  if (showAllAvailable) catalogShowAll.textContent = `Show all ${matchesFound} products`;
}

catalogSearch.addEventListener('input', updateCatalog);
catalogCategory.addEventListener('change', updateCatalog);
catalogReset.addEventListener('click', () => {
  catalogSearch.value = '';
  catalogCategory.value = '';
  catalogSearch.focus();
  updateCatalog();
});
catalogShowAll.addEventListener('click', () => {
  const firstHidden = catalogProducts.find(({ card }) => card.hidden)?.card;
  fullCatalog = true;
  updateCatalog();
  if (firstHidden) {
    firstHidden.tabIndex = -1;
    firstHidden.focus();
  }
});

function revealProduct(card) {
  if (!card.hidden) return;
  catalogSearch.value = '';
  catalogCategory.value = '';
  fullCatalog = true;
  updateCatalog();
}

function revealLinkedProduct() {
  const card = document.getElementById(window.location.hash.slice(1));
  if (!card?.matches('#product-grid .product-tile')) return;
  revealProduct(card);
  requestAnimationFrame(() => card.scrollIntoView({ block: 'start' }));
}

updateCatalog();
catalog.hidden = false;
revealLinkedProduct();
window.addEventListener('hashchange', revealLinkedProduct);

document.querySelector('#year').textContent = new Date().getFullYear();

const chatForm = document.querySelector('#chatForm');
const chatInput = document.querySelector('#chatInput');
const chatMessages = document.querySelector('#chatMessages');
const chatPrompts = document.querySelector('.chat-prompts');
const chatReset = document.querySelector('#chatReset');
const chatStatus = document.querySelector('#chatStatus');
const pharmacistPortrait = document.querySelector('#pharmacistPortrait');
const reduceChatMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const welcomeMessage = chatMessages.firstElementChild.cloneNode(true);
const hours = [...document.querySelectorAll('.pharmacy-hours time')].map((time) => time.textContent);
function contactAction(link, channel) {
  return { label: channel + ' ' + link.querySelector('[data-contact-number]').textContent.trim(), href: link.getAttribute('href') };
}
const callActions = [...document.querySelectorAll('.contact-phone')].map((link) => contactAction(link, 'Call'));
const mainPhone = callActions[0];
const whatsapp = contactAction(document.querySelector('.contact-whatsapp'), 'WhatsApp');
const branchLocations = [
  {
    match: /\b(klagon|lashibi|tema|cowpea|ndc junction)\b/,
    address: 'Klagon branch: NDC Junction, Cowpea Street, off the Lashibi–Klagon Road, Klagon, Tema.',
    map: { label: 'Open Klagon area map', href: document.querySelector('#branch-klagon .address-route').href }
  },
  {
    match: /\b(tamale|karmina|kamina|barracks)\b/,
    address: 'Tamale branch: just around Karmina Barracks, Tamale, Northern Region.',
    map: { label: 'Open Tamale area map', href: document.querySelector('#branch-tamale .address-route').href }
  }
];
const catalogLink = { label: 'Browse products', href: '#products' };
const supplyLink = { label: 'Medical supplies enquiries', href: '#medical-supplies' };
const contactLink = { label: 'Hours and contact', href: '#contact' };

const chatProducts = catalogProducts.map(({ card, category, name, nameKey }) => {
  const description = card.querySelector('.product-tile-copy p').textContent;
  const alt = card.querySelector('img')?.alt ?? '';
  const label = card.querySelector('.product-detail-link');
  return {
    name, description, category, nameKey,
    alias: normalizeSearch(alt),
    label: label && { label: 'View ' + name + ' label', href: label.href },
    link: { label: 'See ' + name, href: '#' + card.id, product: card }
  };
});
const productAliases = new Map([
  ['coq10 300 mg', ['coq10', 'co q 10', 'coenzyme q10', 'coenzyme q 10']],
  ['omega 3 dha 500', ['dha', 'omega 3', 'fish oil']],
  ['vitamin d3 5 000 iu', ['vitamin d3', 'd3', '5000 iu']],
  ['lineone d3 k2 gummies', ['d3 k2', 'd3 and k2', 'vitamin d3 with k2', 'lineone gummies']],
  ['oral complete 60 capsules', ['oral complete', 'oral health capsules']],
  ['intimate rose myo d chiro inositol', ['inositol', 'myo inositol', 'd chiro', 'intimate rose']],
  ['sp 6 brightening toothpaste', ['sp 6', 'toothpaste']],
  ['memory focus', ['alpha brain', 'memory focus']],
  ['loris parfum reed diffusers', ['loris', 'reed diffusers', 'reed diffuser']]
]);
const categoryTopics = [
  ['oral-care', /\b(oral care|dental care|toothpastes?|teeth products?)\b/],
  ['home-fragrance', /\b(home fragrance|room fragrance|diffusers?|home scents?)\b/],
  ['probiotics', /\b(probiotics?)\b/],
  ['beauty', /\b(skincare|skin care|body care|beauty)\b/],
  ['vitamins', /\b(vitamins?|multivitamins?)\b/],
  ['wellness', /\b((womens|mens) wellness|fertility supplements)\b/],
  ['supplements', /\b(supplements?)\b/]
];
const comparison = /\b(compare|comparison|versus|vs|differ(ence|ent)|which (one|has))\b/;
let lastProducts = [];
let lastBranches = [];
let lastCategory = null;

function hasPhrase(value, phrase) {
  return (' ' + value + ' ').includes(' ' + phrase + ' ');
}

function findProducts(value) {
  const ignored = new Set('a an and care do for have i is it mg me of or please product show support tell the to what you your'.split(' '));
  const query = value.split(' ').filter((word) => !ignored.has(word));
  const scores = chatProducts.map((product) => {
    const nameWords = product.nameKey.split(' ').filter((word) => !ignored.has(word) && word.length > 2);
    const overlap = nameWords.filter((word) => query.includes(word)).length;
    const exact = [product.nameKey, ...(productAliases.get(product.nameKey) ?? [])]
      .filter((alias) => hasPhrase(value, alias))
      .sort((a, b) => b.length - a.length)[0];
    const score = exact ? 30 + exact.length : overlap >= 2 ? overlap : 0;
    return { product, score, exact };
  }).filter(({ score }) => score > 0).sort((a, b) => b.score - a.score);
  const direct = scores.filter(({ exact }) => exact).filter(({ exact }) =>
    !scores.some((other) => other.exact && other.exact !== exact &&
      hasPhrase(other.exact, exact) && !hasPhrase(value.replace(other.exact, ''), exact))
  );
  if (direct.length) return direct.sort((a, b) => value.indexOf(a.exact) - value.indexOf(b.exact))
    .slice(0, 3).map(({ product }) => product);
  if (scores[0] && scores[0].score !== scores[1]?.score) return [scores[0].product];
  return [];
}

function getDek450Answer(question, model = {}) {
  const value = normalizeSearch(question);
  const replies = [];
  const actions = new Map();
  const add = (text, ...links) => {
    replies.push(text);
    for (const link of links) if (link) actions.set(link.href, link);
  };
  const clinical = model.intent === 'personal' || /\b(dose|dosage|side effects?|interactions?|pregnan\w*|breastfeed\w*|symptoms?|diagnos\w*|treat\w*|cure\w*|safe for me|can i take|should i take|how to take|what can i take|what should i take|how many (should|can)|medicine for|medication for|recommend)\b/.test(value);
  const prescription = /\b(prescriptions?|antibiotics?|cholesterol medicines?|statins?|rocephin\w*|ceftriaxone|augmentin|amoxicillin|zithromax|azithromycin|lipitor|atorvastatin|crestor|rosuvastatin)\b/.test(value);
  const availability = model.intent === 'availability' || /\b(stock|availab\w*|price|cost|buy|sell|purchase|do you (have|carry|sell)|out of stock|how much (is|does))\b/.test(value);
  const timing = model.intent === 'hours' || /\b(open\w*|clos(e|es|ing|ed)|hours|time can i visit|what time|today|tomorrow|sunday|saturday|weekends?|holidays?)\b/.test(value);

  if (timing && !(/\bopen (the )?(map|catalog|label)\b/.test(value) && !/\b(hours|time|when)\b/.test(value))) {
    const branch = branchLocations.find(({ match }) => match.test(value));
    let text = 'Our posted opening hours are ' + hours[0] + ' to ' + hours[1] + ', Ghana time.';
    if (branch || /\b(now|today|sunday|saturday|weekends?|holidays?|tomorrow)\b/.test(value)) {
      text += ' Call before travelling to confirm the schedule for your visit.';
    }
    add(text, contactLink, mainPhone);
  }
  const namedBranches = branchLocations.filter((branch) => branch.match.test(value));
  const requestsDirections = model.intent === 'directions' || /\b(where (are you|is dek450|is your|is the branch)|locations?|addresses?|branches?|directions|find you|map|landmark|how (can|do) i get there|how to get there|how far)\b/.test(value);
  if (namedBranches.length) lastBranches = namedBranches;
  if (requestsDirections || (namedBranches.length && !timing && !availability && !clinical && !prescription)) {
    const selectedBranches = model.branches?.map((number) => branchLocations[number]).filter(Boolean) ?? [];
    const refersBack = /\b(there|that branch|that one|its)\b/.test(value);
    const locations = namedBranches.length ? namedBranches
      : selectedBranches.length ? selectedBranches
      : refersBack && lastBranches.length ? lastBranches : branchLocations;
    lastBranches = locations;
    for (const branch of locations) add(branch.address, branch.map);
    add('Map markers show the nearby street or landmark. Call the pharmacy for help finding the storefront.', mainPhone);
  }
  if (/\b(whatsapp|whats app)\b/.test(value)) {
    add('You can message Dek450 Pharmacy on WhatsApp.', whatsapp);
  }
  if ((model.intent === 'contact' || /\b(phone|telephone|contact|number|numbers|call|reach you|email)\b/.test(value)) &&
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

  const category = categoryTopics.find(([, pattern]) => pattern.test(value))?.[0];
  let products = findProducts(value);
  if (products.length && lastProducts.length === 1 && /^(with|versus|vs|and)\b/.test(value)) {
    products = [...new Set([...lastProducts, ...products])];
  }
  if (!products.length && model.products?.length) {
    products = model.products.map((number) => chatProducts[number]).filter(Boolean).slice(0, 3);
  }
  if (!products.length && /\b(it|its|them|they|both|each|those|that one|same one|the first|the second)\b/.test(value)) {
    products = lastProducts;
    if (/\b(the first|the second)\b/.test(value)) {
      products = products.slice(value.includes('the first') ? 0 : 1, value.includes('the first') ? 1 : 2);
    }
  }
  if (products.length && !clinical && !prescription) {
    if (products.length > 1 || !products.every((product) => lastProducts.includes(product))) lastProducts = products;
    if (comparison.test(value) && products.length < 2) {
      add('What would you like to compare ' + products[0].name + ' with?', products[0].link, catalogLink);
    } else if (!availability || /\b(compare|details?|about|difference|label|ingredients?)\b/.test(value)) {
      if (products.length > 1) add('Here’s what the catalog lists for each product.');
      for (const product of products) add(product.name + '. ' + product.description, product.link, product.label);
    }
  }
  if (availability && !prescription) {
    const names = products.length && !clinical ? ' for ' + products.map(({ name }) => name).join(' and ') : '';
    add('Call or message the pharmacy to confirm current stock and price' + names + '.', mainPhone, whatsapp);
  }
  if (!products.length && !clinical && !prescription && !availability) {
    if (category && !replies.length) {
      lastCategory = category;
      const options = chatProducts.filter((product) => product.category === category);
      const items = options.slice(0, 4);
      add('The catalog lists ' + options.length + ' products in this category, including ' + items.map(({ name }) => name).join(', ') + '.', ...items.map(({ link }) => link), catalogLink);
    } else if (lastCategory && /\b(more|others|else|any similar)\b/.test(value) && !replies.length) {
      const items = chatProducts.filter((product) => product.category === lastCategory).slice(4, 8);
      if (items.length) add('Other products in that category include ' + items.map(({ name }) => name).join(', ') + '.', ...items.map(({ link }) => link), catalogLink);
      else add('For more products in that category, ask the pharmacy team.', catalogLink, mainPhone);
    } else if (!replies.length && (model.intent === 'catalog' || /\b(products?|catalog|browse|gummies)\b/.test(value))) {
      add('Browse the catalog or ask for a specific product or category, such as oral care, skincare or probiotics.', catalogLink);
    }
  }
  const matched = replies.length > 0 || /^(thanks|thank you|ok|okay|cheers)( very much)?$/.test(value);
  if (!replies.length) {
    if (/^(thanks|thank you|ok|okay|cheers)( very much)?$/.test(value)) {
      add('You’re welcome. Ask another question whenever you’re ready.');
    } else {
      add('Try asking about opening hours, directions, prescriptions, or a product by name. For anything else, call our pharmacy team.', catalogLink, mainPhone);
    }
  }
  return { replies, actions: [...actions.values()], matched };
}

const modelIntents = ['unknown', 'catalog', 'directions', 'hours', 'contact', 'availability', 'personal'];

async function understandQuestion(question, signal) {
  const model = window.LanguageModel;
  if (!model) return null;

  let session;
  try {
    const options = {
      expectedInputs: [{ type: 'text', languages: ['en'] }],
      expectedOutputs: [{ type: 'text', languages: ['en'] }]
    };
    if (await model.availability(options) !== 'available' || signal.aborted) return null;
    session = await model.create({
      ...options,
      signal,
      initialPrompts: [{
        role: 'system',
        content: 'Classify a pharmacy website question. Select personal for health advice, symptoms, treatment, interactions or safety. Select other intents only for store information. Select product IDs only when the visitor refers to those products. Use unknown when unclear. JSON only.'
      }]
    });
    const input = JSON.stringify({
      matchedBranches: lastBranches.map((branch) => branchLocations.indexOf(branch)),
      previousProducts: lastProducts.map((item) => chatProducts.indexOf(item)),
      branchNames: ['Klagon, NDC Junction, Cowpea Street', 'Tamale, Karmina Barracks'],
      catalog: chatProducts.map(({ name }, id) => [id, name]),
      question
    });
    const result = JSON.parse(await session.prompt(input, {
      signal,
      responseConstraint: {
        type: 'object',
        properties: {
          intent: { type: 'string', enum: modelIntents },
          products: { type: 'array', items: { type: 'integer' }, maxItems: 3 },
          branches: { type: 'array', items: { type: 'integer' }, maxItems: 2 }
        },
        required: ['intent', 'products', 'branches'],
        additionalProperties: false
      }
    }));
    if (!result || !modelIntents.includes(result.intent)) return null;
    return {
      intent: result.intent,
      products: Array.isArray(result.products) ? [...new Set(result.products.filter(Number.isInteger))].slice(0, 3) : [],
      branches: Array.isArray(result.branches) ? [...new Set(result.branches.filter(Number.isInteger))].slice(0, 2) : []
    };
  } catch {
    return null;
  } finally {
    session?.destroy();
  }
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
        anchor.addEventListener('click', () => revealProduct(action.product));
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

const pharmacistStates = {
  ready: 'Ready for your question',
  composing: 'Ready when you are',
  thinking: 'Preparing your reply',
  replying: 'Reply ready'
};
let activeChatRequest = null;
const sendChat = chatForm.querySelector('button[type=submit]');
let portraitTimer;

function setPharmacistState(state) {
  clearTimeout(portraitTimer);
  chatStatus.textContent = pharmacistStates[state];
  pharmacistPortrait.dataset.state = state;
}

function setPharmacistInputState() {
  setPharmacistState(chatInput.value.trim() ? 'composing' : 'ready');
}

function showPharmacistReply({ replies, actions }) {
  const reply = addChatMessage(replies, 'assistant', actions);
  chatMessages.scrollTop += reply.getBoundingClientRect().top - chatMessages.getBoundingClientRect().top - 14;
  setPharmacistState('replying');
  portraitTimer = setTimeout(setPharmacistInputState, 1400);
}

chatInput.addEventListener('input', () => {
  if (!activeChatRequest) setPharmacistInputState();
});

async function askDek450(question) {
  const cleanQuestion = question.trim();
  if (!cleanQuestion || activeChatRequest) return;

  const request = new AbortController();
  activeChatRequest = request;
  sendChat.disabled = true;
  addChatMessage([cleanQuestion], 'user');
  chatMessages.scrollTop = chatMessages.scrollHeight;
  chatInput.value = '';
  chatReset.hidden = false;

  let answer = getDek450Answer(cleanQuestion);
  setPharmacistState('thinking');
  if (!answer.matched) {
    const modelRequest = new AbortController();
    request.signal.addEventListener('abort', () => modelRequest.abort(), { once: true });
    const timeout = setTimeout(() => modelRequest.abort(), 2600);
    const interrupted = new Promise((resolve) => modelRequest.signal.addEventListener('abort', () => resolve(null), { once: true }));
    const result = await Promise.race([understandQuestion(cleanQuestion, modelRequest.signal), interrupted]);
    clearTimeout(timeout);
    if (request.signal.aborted) return;
    if (result) answer = getDek450Answer(cleanQuestion, result);
  } else if (!reduceChatMotion.matches) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    if (request.signal.aborted) return;
  }
  activeChatRequest = null;
  sendChat.disabled = false;
  showPharmacistReply(answer);
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
  activeChatRequest?.abort();
  activeChatRequest = null;
  sendChat.disabled = false;
  setPharmacistState('ready');
  chatMessages.replaceChildren(welcomeMessage.cloneNode(true));
  chatMessages.scrollTop = 0;
  chatInput.value = '';
  lastProducts = [];
  lastBranches = [];
  lastCategory = null;
  chatReset.hidden = true;
  chatInput.focus();
});

document.querySelectorAll('[data-motion]').forEach((button) => {
  const preview = button.closest('figure').querySelector('.motion-preview');
  const still = preview.getAttribute('src');
  const subject = button.closest('figcaption').querySelector('strong').textContent.toLowerCase();

  function setPreviewLabel(label) {
    button.textContent = label;
    button.setAttribute('aria-label', `${label} of ${subject}`);
  }

  button.addEventListener('click', () => {
    if (button.getAttribute('aria-disabled') === 'true') return;

    button.setAttribute('aria-disabled', 'true');
    setPreviewLabel('Loading preview…');

    const finish = (message) => {
      preview.src = still;
      button.removeAttribute('aria-disabled');
      setPreviewLabel(message);
    };

    const reset = new AbortController();
    preview.addEventListener('load', () => {
      reset.abort();
      setPreviewLabel('Playing preview…');
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
