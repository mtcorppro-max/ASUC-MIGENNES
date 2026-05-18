'use strict';

/* =============================================================
   CONFIG – Remplacez ces valeurs quand vous les aurez
   ============================================================= */
const CONFIG = {
    TENUP_URL: 'https://tenup.fft.fr/club/51890047',

    FACEBOOK_URL: 'https://www.facebook.com/asucmtennis',

    // TODO (optionnel) : Pour l'API Facebook Graph
    // FB_PAGE_ID:      'VOTRE_PAGE_ID',
    // FB_ACCESS_TOKEN: 'VOTRE_ACCESS_TOKEN',
};

/* =============================================================
   LIENS DE RÉSERVATION (Tenup)
   ============================================================= */
const reserveIds = [
    'reserveBtn', 'heroReserveBtn', 'tennisBtnReserve',
    'padelBtnReserve', 'ctaBandReserve', 'contactReserveBtn', 'footerReserveBtn', 'tarifsReserveBtn',
];
reserveIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.href   = CONFIG.TENUP_URL;
    el.target = '_blank';
    el.rel    = 'noopener noreferrer';
});

// Lien Tenup dans la section contact (texte)
const contactTenup = document.getElementById('contactTenupLink');
if (contactTenup) {
    contactTenup.href   = CONFIG.TENUP_URL;
    contactTenup.target = '_blank';
    contactTenup.rel    = 'noopener noreferrer';
}

/* =============================================================
   LIENS FACEBOOK
   ============================================================= */
const fbIds = ['facebookPageBtn', 'contactFbLink', 'footerFbLink'];
fbIds.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.href = CONFIG.FACEBOOK_URL;
});

/* =============================================================
   HEADER – changement au scroll
   ============================================================= */
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    header?.classList.toggle('scrolled', window.scrollY > 70);
}, { passive: true });

/* =============================================================
   MENU MOBILE
   ============================================================= */
const hamburger = document.getElementById('hamburger');
const navMenu   = document.getElementById('navMenu');

hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navMenu?.classList.toggle('open');
});

navMenu?.querySelectorAll('.nav__link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger?.classList.remove('open');
        navMenu?.classList.remove('open');
    });
});

document.addEventListener('click', e => {
    if (!hamburger?.contains(e.target) && !navMenu?.contains(e.target)) {
        hamburger?.classList.remove('open');
        navMenu?.classList.remove('open');
    }
});

/* =============================================================
   SMOOTH SCROLL
   ============================================================= */
document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const offset = (header?.offsetHeight || 72) + 12;
        window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
    });
});

/* =============================================================
   REVEAL AU SCROLL (Intersection Observer)
   ============================================================= */
const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => entry.target.classList.add('visible'), i * 70);
        revealObs.unobserve(entry.target);
    });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/* =============================================================
   CARD STACK (section membres)
   ============================================================= */
(function () {
    const stage    = document.querySelector('#galleryStack .cstack__stage');
    const dotsWrap = document.getElementById('galleryStackDots');
    if (!stage) return;

    const cards  = Array.from(stage.querySelectorAll('.cstack__card'));
    const len    = cards.length;
    const MAX    = 2; // cartes visibles de chaque côté
    let active   = 0;
    let autoPlay;

    // Positions relatives par offset (adaptées selon le contexte)
    const isGallery = stage.closest('#galleryStack') !== null;
    const POS = isGallery ? {
        tx:    [0,  190, 330],
        rotZ:  [0,   13,  23],
        ty:    [0,   12,  26],
        scale: [1.03, 0.90, 0.78],
    } : {
        tx:    [0,  130, 230],
        rotZ:  [0,   13,  23],
        ty:    [0,   10,  22],
        scale: [1.04, 0.91, 0.80],
    };

    function signedOff(i) {
        let off = i - active;
        if (off >  Math.floor(len / 2)) off -= len;
        if (off < -Math.ceil (len / 2)) off += len;
        return off;
    }

    function update() {
        cards.forEach((card, i) => {
            const off = signedOff(i);
            const abs = Math.abs(off);
            const sign = off < 0 ? -1 : 1;
            const vis  = abs <= MAX;

            card.classList.toggle('is-active', off === 0);
            card.classList.toggle('is-hidden', !vis);
            card.style.zIndex = 100 - abs;

            if (!vis) return;

            const tx    = sign * POS.tx[abs];
            const rotZ  = sign * POS.rotZ[abs];
            const ty    = off === 0 ? -20 : POS.ty[abs];   // lift actif
            const scale = POS.scale[abs];

            card.style.transform = `translateX(${tx}px) translateY(${ty}px) rotateZ(${rotZ}deg) scale(${scale})`;
        });

        dotsWrap.querySelectorAll('.cstack__dot').forEach((d, i) =>
            d.classList.toggle('active', i === active));
    }

    function goTo(idx) {
        active = ((idx % len) + len) % len;
        update();
    }

    function buildDots() {
        dotsWrap.innerHTML = '';
        cards.forEach((_, i) => {
            const btn = document.createElement('button');
            btn.className = 'cstack__dot' + (i === 0 ? ' active' : '');
            btn.addEventListener('click', () => { goTo(i); resetAuto(); });
            dotsWrap.appendChild(btn);
        });
    }

    function resetAuto() {
        clearInterval(autoPlay);
        autoPlay = setInterval(() => goTo(active + 1), 3200);
    }

    // Clic sur une carte
    cards.forEach((card, i) => {
        card.addEventListener('click', () => {
            if (signedOff(i) !== 0) { goTo(i); resetAuto(); }
        });
    });

    // Swipe tactile
    let touchX = 0;
    stage.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
    stage.addEventListener('touchend',   e => {
        const d = touchX - e.changedTouches[0].clientX;
        if (Math.abs(d) > 50) { goTo(active + (d > 0 ? 1 : -1)); resetAuto(); }
    });

    // Pause au survol
    stage.addEventListener('mouseenter', () => clearInterval(autoPlay));
    stage.addEventListener('mouseleave', resetAuto);

    buildDots();
    update();
    resetAuto();
})();

/* =============================================================
   ONGLETS TARIFS
   ============================================================= */
document.querySelectorAll('.tarifs__tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.tarifs__tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tarifs__panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById('tab-' + target)?.classList.add('active');
    });
});

/* =============================================================
   GALERIE CAROUSEL
   ============================================================= */
(function () {
    const track    = document.getElementById('galleryTrack');
    const prevBtn  = document.getElementById('galleryPrev');
    const nextBtn  = document.getElementById('galleryNext');
    const dotsWrap = document.getElementById('galleryDots');
    if (!track) return;

    const slides = Array.from(track.children);
    let current  = 0;
    let autoPlay;

    function getVisible() {
        return window.innerWidth < 640 ? 1 : window.innerWidth < 1024 ? 2 : 3;
    }

    function getMax() { return slides.length - getVisible(); }

    function goTo(index) {
        const visible = getVisible();
        current = Math.max(0, Math.min(index, getMax()));
        const slideW = slides[0].offsetWidth;
        const gap    = parseInt(getComputedStyle(track).gap) || 16;
        track.style.transform = `translateX(-${current * (slideW + gap)}px)`;
        prevBtn.disabled = current === 0;
        nextBtn.disabled = current >= getMax();
        dotsWrap.querySelectorAll('.gallery__dot').forEach((d, i) => {
            d.classList.toggle('active', i === current);
        });
    }

    function buildDots() {
        dotsWrap.innerHTML = '';
        const count = getMax() + 1;
        for (let i = 0; i < count; i++) {
            const btn = document.createElement('button');
            btn.className = 'gallery__dot' + (i === 0 ? ' active' : '');
            btn.setAttribute('aria-label', `Aller à la photo ${i + 1}`);
            btn.addEventListener('click', () => { goTo(i); resetAuto(); });
            dotsWrap.appendChild(btn);
        }
    }

    function resetAuto() {
        clearInterval(autoPlay);
        autoPlay = setInterval(() => goTo(current >= getMax() ? 0 : current + 1), 4000);
    }

    prevBtn.addEventListener('click', () => { goTo(current - 1); resetAuto(); });
    nextBtn.addEventListener('click', () => { goTo(current + 1); resetAuto(); });

    track.parentElement.addEventListener('mouseenter', () => clearInterval(autoPlay));
    track.parentElement.addEventListener('mouseleave', resetAuto);

    let touchStartX = 0;
    track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend',   e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) { goTo(diff > 0 ? current + 1 : current - 1); resetAuto(); }
    });

    window.addEventListener('resize', () => { buildDots(); goTo(Math.min(current, getMax())); });

    buildDots();
    goTo(0);
    resetAuto();
})();

/* =============================================================
   COMPTEURS ANIMÉS
   ============================================================= */
function animateCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 1400;
    const step     = target / (duration / 16);
    let current    = 0;
    const timer    = setInterval(() => {
        current += step;
        if (current >= target) {
            el.textContent = target;
            clearInterval(timer);
        } else {
            el.textContent = Math.floor(current);
        }
    }, 16);
}

const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        animateCounter(entry.target);
        counterObs.unobserve(entry.target);
    });
}, { threshold: 0.5 });

document.querySelectorAll('.counter').forEach(el => counterObs.observe(el));

/* =============================================================
   FACEBOOK API – intégration dynamique
   =============================================================
   Pour activer :
   1. Créez une app Facebook sur developers.facebook.com
   2. Générez un token de page (Page Access Token)
   3. Renseignez FB_PAGE_ID et FB_ACCESS_TOKEN dans CONFIG ci-dessus
   4. Décommentez les lignes ci-dessous et appelez loadFacebookPosts()
   ============================================================= */

async function loadFacebookPosts() {
    const { FB_PAGE_ID, FB_ACCESS_TOKEN } = CONFIG;
    if (!FB_PAGE_ID || !FB_ACCESS_TOKEN) return;

    const url = `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/posts`
              + `?fields=message,created_time,full_picture,likes.summary(true),comments.summary(true)`
              + `&limit=3&access_token=${FB_ACCESS_TOKEN}`;

    try {
        const res  = await fetch(url);
        const data = await res.json();
        if (data.error || !data.data?.length) return;

        const feed = document.getElementById('facebookFeed');
        if (!feed) return;

        feed.innerHTML = data.data.map(post => {
            const date     = new Date(post.created_time).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
            const likes    = post.likes?.summary?.total_count    || 0;
            const comments = post.comments?.summary?.total_count || 0;
            const msg      = (post.message || '').slice(0, 300);
            const img      = post.full_picture
                ? `<img src="${post.full_picture}" alt="" style="width:100%;border-radius:8px;margin-bottom:.75rem;object-fit:cover;max-height:200px;">`
                : '';
            return `
                <div class="news__card reveal">
                    <div class="news__card-head">
                        <div class="news__avatar"><i class="fas fa-tennis-ball"></i></div>
                        <div class="news__meta"><strong>TC Migennes</strong><span>${date}</span></div>
                        <i class="fab fa-facebook-square news__fb-icon"></i>
                    </div>
                    ${img}
                    <p class="news__text">${msg}${post.message?.length > 300 ? '…' : ''}</p>
                    <div class="news__foot">
                        <span><i class="fas fa-thumbs-up"></i> ${likes}</span>
                        <span><i class="fas fa-comment"></i> ${comments}</span>
                    </div>
                </div>`;
        }).join('');

        feed.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
    } catch (err) {
        console.error('Erreur API Facebook :', err);
    }
}

loadFacebookPosts();
