// Theme toggle and simple image modal for project previews
(function () {
	const root = document.documentElement;
	const themeKey = 'theme';
	const langKey = 'lang';

	// --- Theme (existing) ---
	const themeBtn = document.getElementById('theme-toggle');
	function applyTheme(theme) {
		if (theme === 'dark') {
			root.setAttribute('data-theme', 'dark');
			if (themeBtn) { themeBtn.textContent = currentLang === 'pt' ? 'Modo claro' : 'Light mode'; themeBtn.setAttribute('aria-pressed', 'true'); }
		} else {
			root.setAttribute('data-theme', 'light');
			if (themeBtn) { themeBtn.textContent = currentLang === 'pt' ? 'Modo escuro' : 'Dark mode'; themeBtn.setAttribute('aria-pressed', 'false'); }
		}
	}
	function getPreferredTheme() {
		const stored = localStorage.getItem(themeKey);
		if (stored) return stored;
		if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
		return 'light';
	}
	function toggleTheme() { const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; const next = current === 'dark' ? 'light' : 'dark'; applyTheme(next); localStorage.setItem(themeKey, next); }

	// --- Language + translations ---
	const langEnBtn = document.getElementById('lang-en');
	const langPtBtn = document.getElementById('lang-pt');
	let currentLang = localStorage.getItem(langKey) || (navigator.language && navigator.language.startsWith('pt') ? 'pt' : 'en');

	const texts = {
		en: {
			searchPlaceholder: 'Search projects...',
			open: 'Open',
			favorite: 'Favorite',
			favorited: 'Favorited',
			removedFav: 'Removed from favorites',
			opening: 'Opening project: ',
			visits: 'Visits: ',
			total: 'Total: ',
			openNewTab: 'Open in new tab',
			close: 'Close',
			backToTop: 'Back to top',
			lightMode: 'Light mode',
			darkMode: 'Dark mode',
			closeImg: 'Close'
		},
		pt: {
			searchPlaceholder: 'Pesquisar projetos...',
			open: 'Abrir',
			favorite: 'Favoritar',
			favorited: 'Favoritado',
			removedFav: 'Removido dos favoritos',
			opening: 'Abrindo projeto: ',
			visits: 'Visitas: ',
			total: 'Total: ',
			openNewTab: 'Abrir em nova aba',
			close: 'Fechar',
			backToTop: 'Voltar ao topo',
			lightMode: 'Modo claro',
			darkMode: 'Modo escuro',
			closeImg: 'Fechar'
		}
	};

	function applyLanguage(lang) {
		currentLang = lang;
		localStorage.setItem(langKey, lang);
		const t = texts[lang] || texts.en;
		// search placeholder
		const search = document.getElementById('project-search');
		if (search) search.placeholder = t.searchPlaceholder;
		// theme button text
		applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
		// open buttons and other UI
		document.querySelectorAll('.project-card').forEach(p => {
			const openBtn = p.querySelector('.open-btn');
			if (openBtn) openBtn.textContent = t.open;
			const favBtn = p.querySelector('.fav-btn');
			if (favBtn) favBtn.title = t.favorite;
			// titles
			const h2 = p.querySelector('h2');
			if (h2) {
				const title = (lang === 'pt') ? (p.dataset.titlePt || p.dataset.titleEn) : (p.dataset.titleEn || p.dataset.titlePt);
				const a = h2.querySelector('a');
				if (a) a.textContent = title; else h2.textContent = title;
			}
		});
		// visits label
		const visitCounter = document.getElementById('visit-counter');
		if (visitCounter) visitCounter.innerHTML = `${t.visits}<span id="visits">${localStorage.getItem('visits') || 0}</span>`;
		// total projects label
		const total = document.getElementById('total-projects');
		if (total) total.innerHTML = `${t.total}<span id="total-count">${projects.filter(p => p.style.display !== 'none').length}</span>`;
		// back-to-top title
		const backBtn = document.getElementById('back-to-top');
		if (backBtn) backBtn.title = t.backToTop;
	}

	if (langEnBtn) langEnBtn.addEventListener('click', () => applyLanguage('en'));
	if (langPtBtn) langPtBtn.addEventListener('click', () => applyLanguage('pt'));

	// --- Loading screen ---
	const loading = document.createElement('div');
	loading.className = 'loading-screen';
	loading.innerHTML = '<div class="spinner" aria-hidden="true"></div>';
	document.body.appendChild(loading);

	// ligar botão de tema
	if (themeBtn) themeBtn.addEventListener('click', () => { const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark'; applyTheme(next); localStorage.setItem(themeKey, next); });

	// --- Visits counter (localStorage) ---
	const visitsSpan = document.getElementById('visits');
	(function handleVisits(){
		try {
			let visits = parseInt(localStorage.getItem('visits') || '0', 10) || 0;
			visits++;
			localStorage.setItem('visits', String(visits));
			if (visitsSpan) visitsSpan.textContent = String(visits);
		} catch (e) { /* ignore */ }
	})();

	// --- Projects list and totals ---
	const projects = Array.from(document.querySelectorAll('.project-card'));
	const totalCount = document.getElementById('total-count');
	function updateTotal() { if (totalCount) totalCount.textContent = String(projects.filter(p => p.style.display !== 'none').length); }

	// assign ids
	projects.forEach((p, i) => { if (!p.dataset.id) p.dataset.id = `proj-${i}`; });
	updateTotal();

	// --- Toast helper ---
	function showToast(message, ms = 3000) {
		const t = document.createElement('div');
		t.className = 'toast';
		t.textContent = message;
		document.body.appendChild(t);
		setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, ms);
	}

	// --- Favorites (localStorage) ---
	function getFavorites() { try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; } }
	function saveFavorites(list) { localStorage.setItem('favorites', JSON.stringify(list)); }

	projects.forEach(p => {
		const id = p.dataset.id;
		const favBtn = p.querySelector('.fav-btn');
		const openBtn = p.querySelector('.open-btn');
		if (favBtn) {
			const favs = getFavorites();
			const pressed = favs.includes(id);
			favBtn.setAttribute('aria-pressed', String(pressed));
			if (pressed) favBtn.classList.add('favged');
			favBtn.addEventListener('click', () => {
				const favsNow = getFavorites();
				const idx = favsNow.indexOf(id);
				if (idx === -1) { favsNow.push(id); favBtn.setAttribute('aria-pressed', 'true'); favBtn.classList.add('favged'); showToast(currentLang === 'pt' ? 'Favoritado' : 'Favorited'); }
				else { favsNow.splice(idx, 1); favBtn.setAttribute('aria-pressed', 'false'); favBtn.classList.remove('favged'); showToast(currentLang === 'pt' ? 'Removido dos favoritos' : 'Removed from favorites'); }
				saveFavorites(favsNow);
			});
		}
		if (openBtn) {
			openBtn.addEventListener('click', () => {
				openProjectModal(p);
				showToast((currentLang === 'pt' ? 'Abrindo projeto: ' : 'Opening project: ') + (currentLang === 'pt' ? (p.dataset.titlePt || p.dataset.titleEn) : (p.dataset.titleEn || p.dataset.titlePt)), 1500);
			});
		}
	});

	// --- Search ---
	const searchInput = document.getElementById('project-search');
	if (searchInput) {
		searchInput.addEventListener('input', (e) => {
			const q = e.target.value.toLowerCase().trim();
			projects.forEach(p => {
				const title = ((p.dataset.titleEn || '') + ' ' + (p.dataset.titlePt || '') + ' ' + (p.textContent || '')).toLowerCase();
				const match = q === '' || title.includes(q);
				p.style.display = match ? '' : 'none';
			});
			updateTotal();
		});
	}

	// --- Back to top ---
	const back = document.createElement('button');
	back.id = 'back-to-top';
	back.type = 'button';
	back.title = 'Back to top';
	back.textContent = '↑';
	back.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
	document.body.appendChild(back);
	window.addEventListener('scroll', () => {
		if (window.scrollY > 200) back.style.display = 'block'; else back.style.display = 'none';
	});

	// --- Project modal (details) ---
	const projOverlay = document.createElement('div');
	projOverlay.className = 'project-modal-overlay';
	projOverlay.setAttribute('aria-hidden', 'true');
	projOverlay.innerHTML = '<div class="project-modal" role="dialog" aria-modal="true"><button class="modal-close">Close</button><div class="modal-content"></div></div>';
	document.body.appendChild(projOverlay);
	const modalContent = projOverlay.querySelector('.modal-content');
	const modalClose = projOverlay.querySelector('.modal-close');

	let lastFocusedElement = null;
	function trapFocus(container) {
		const focusable = Array.from(container.querySelectorAll('a, button, input, [tabindex]:not([tabindex="-1"])')).filter(el => !el.hasAttribute('disabled'));
		if (focusable.length === 0) return () => {};
		let idx = 0;
		focusable[0].focus();
		function keydown(e) {
			if (e.key === 'Tab') {
				e.preventDefault();
				if (e.shiftKey) idx = (idx - 1 + focusable.length) % focusable.length; else idx = (idx + 1) % focusable.length;
				focusable[idx].focus();
			}
			if (e.key === 'Escape') {
				e.preventDefault();
				if (container === projOverlay.querySelector('.project-modal')) closeProjectModal(); else removeImageModal();
			}
		}
		document.addEventListener('keydown', keydown);
		return () => document.removeEventListener('keydown', keydown);
	}

	function openProjectModal(project) {
		lastFocusedElement = document.activeElement;
		const title = (currentLang === 'pt') ? (project.dataset.titlePt || project.dataset.titleEn) : (project.dataset.titleEn || project.dataset.titlePt);
		const desc = (currentLang === 'pt') ? (project.dataset.descPt || project.dataset.descEn || '') : (project.dataset.descEn || project.dataset.descPt || '');
		const img = project.querySelector('img');
		const link = project.querySelector('a') ? project.querySelector('a').href : null;
		modalContent.innerHTML = '';
		if (img) {
			const im = document.createElement('img'); im.src = img.src; im.alt = img.alt || title; modalContent.appendChild(im);
		}
		const h = document.createElement('h2'); h.textContent = title; modalContent.appendChild(h);
		const p = document.createElement('p'); p.textContent = desc; modalContent.appendChild(p);
		if (link) {
			const a = document.createElement('a'); a.href = link; a.target = '_blank'; a.rel = 'noopener'; a.textContent = texts[currentLang].openNewTab; modalContent.appendChild(a);
		}
		projOverlay.style.display = 'flex'; projOverlay.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
		const removeTrap = trapFocus(projOverlay.querySelector('.project-modal'));
		projOverlay._removeTrap = removeTrap;
		modalClose.focus();
	}

	function closeProjectModal() { projOverlay.style.display = 'none'; projOverlay.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
	projOverlay.addEventListener('click', (e) => { if (e.target === projOverlay) closeProjectModal(); });
	modalClose.addEventListener('click', closeProjectModal);

	// ensure focus restoration and trap cleanup
	const origCloseProject = closeProjectModal;
	function removeImageModal() {
		const existing = document.querySelector('.modal-overlay');
		if (existing) existing.remove();
		document.body.style.overflow = '';
	}
	function closeProjectModal() {
		projOverlay.style.display = 'none';
		projOverlay.setAttribute('aria-hidden', 'true');
		document.body.style.overflow = '';
		if (projOverlay._removeTrap) projOverlay._removeTrap();
		if (lastFocusedElement) lastFocusedElement.focus();
	}

	// --- Image modal: clicking image opens the image-only modal (kept for quick preview) ---
	function openImageModal(src, alt) {
		lastFocusedElement = document.activeElement;
		const overlay = document.createElement('div'); overlay.className = 'modal-overlay'; overlay.tabIndex = -1;
		const img = document.createElement('img'); img.src = src; img.alt = alt || ''; img.className = 'modal-image';
		const close = document.createElement('button'); close.className = 'modal-close'; close.type = 'button'; close.innerText = texts[currentLang].closeImg || 'Close';
		overlay.appendChild(img); overlay.appendChild(close);
		function removeModal() { overlay.removeEventListener('click', overlayClick); close.removeEventListener('click', removeModal); if (overlay.parentNode) overlay.parentNode.removeChild(overlay); document.body.style.overflow = ''; if (lastFocusedElement) lastFocusedElement.focus(); }
		function overlayClick(ev) { if (ev.target === overlay) removeModal(); }
		overlay.addEventListener('click', overlayClick); close.addEventListener('click', removeModal);
		document.body.appendChild(overlay); document.body.style.overflow = 'hidden';
		const removeTrap = trapFocus(overlay);
		overlay._removeTrap = removeTrap;
		close.focus();
	}

	// Delegate clicks for images and open buttons
	document.addEventListener('click', (e) => {
		const img = e.target.closest('.project-card img');
		if (img && !e.target.closest('.open-btn')) { openImageModal(img.src, img.alt); }
	});

	// Initial language & theme
	applyTheme(getPreferredTheme());
	applyLanguage(currentLang);

	// Hide loading after minimal delay
	window.addEventListener('load', () => { setTimeout(() => { loading.remove(); }, 350); });
})();
