/* ==========================================================================
   4hands — franchise landing
   Vanilla JS init registry. GSAP loaded via CDN, gracefully degrades.
   ========================================================================== */

(() => {
    'use strict';

    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktop = () => window.matchMedia('(min-width: 1024px)').matches;
    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    // ----- Boot -----
    document.addEventListener('DOMContentLoaded', () => {
        initScrollProgress();
        initStickyNav();
        initSmoothAnchors();
        initModal();
        initRevealOnScroll();
        initTimeline();
        initCounters();
        initParallax();
        initPathAnimation();
        initCasesSlider();
        initFAQ();
        initCustomCursor();
        initTilt();
        initPhoneMask();
        initForm();
    });

    // --------------------------------------------------------------------
    // Scroll progress bar
    // --------------------------------------------------------------------
    function initScrollProgress() {
        const bar = document.getElementById('scrollProgress');
        if (!bar) return;
        let ticking = false;
        const update = () => {
            const h = document.documentElement;
            const max = h.scrollHeight - h.clientHeight;
            const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
            bar.style.width = pct + '%';
            ticking = false;
        };
        window.addEventListener('scroll', () => {
            if (!ticking) { requestAnimationFrame(update); ticking = true; }
        }, { passive: true });
        update();
    }

    // --------------------------------------------------------------------
    // Sticky nav: appear after hero scrolled past
    // --------------------------------------------------------------------
    function initStickyNav() {
        const nav = document.getElementById('stickyNav');
        if (!nav) return;
        const trigger = () => {
            if (window.scrollY > window.innerHeight * 0.6) nav.classList.add('is-visible');
            else nav.classList.remove('is-visible');
        };
        window.addEventListener('scroll', trigger, { passive: true });
        trigger();
    }

    // --------------------------------------------------------------------
    // Smooth anchor scrolling (offset for sticky nav)
    // --------------------------------------------------------------------
    function initSmoothAnchors() {
        document.querySelectorAll('a[href^="#"]').forEach((a) => {
            a.addEventListener('click', (e) => {
                const id = a.getAttribute('href');
                if (!id || id === '#' || id === '#capture') return; // #capture handled by modal
                const target = document.querySelector(id);
                if (!target) return;
                e.preventDefault();
                const top = target.getBoundingClientRect().top + window.scrollY - 20;
                window.scrollTo({ top, behavior: isReducedMotion ? 'auto' : 'smooth' });
            });
        });
    }

    // --------------------------------------------------------------------
    // Reveal on scroll (generic [data-reveal])
    // --------------------------------------------------------------------
    function initRevealOnScroll() {
        const els = document.querySelectorAll('[data-reveal]');
        if (!els.length || isReducedMotion) {
            els.forEach((el) => el.classList.add('is-revealed'));
            return;
        }
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
        els.forEach((el) => {
            if (el.classList.contains('timeline-item')) return; // GSAP handles these
            io.observe(el);
        });
    }

    // --------------------------------------------------------------------
    // Timeline — GSAP ScrollTrigger per item (slide from left)
    // --------------------------------------------------------------------
    function initTimeline() {
        const items = document.querySelectorAll('.timeline-item[data-reveal]');
        if (!items.length) return;

        if (isReducedMotion) {
            items.forEach((el) => el.classList.add('is-revealed'));
            return;
        }

        // GSAP path
        if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);

            items.forEach((item) => {
                const dot = item.querySelector('.timeline-dot');

                const tl = gsap.timeline({
                    scrollTrigger: {
                        trigger: item,
                        start: 'top 88%',
                        toggleActions: 'play none none none',
                    }
                });

                // Animate container — this overrides [data-reveal] opacity:0 via inline style
                tl.fromTo(item,
                    { opacity: 0, x: -32 },
                    { opacity: 1, x: 0, duration: 0.7, ease: 'power3.out',
                      clearProps: 'transform' },
                    0
                );

                // Dot pops in with bounce
                if (dot) {
                    tl.fromTo(dot,
                        { scale: 0 },
                        { scale: 1, duration: 0.5, ease: 'back.out(2.5)' },
                        0.15
                    );
                }
            });
            return;
        }

        // IO fallback (no GSAP)
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-revealed');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });
        items.forEach((el) => io.observe(el));
    }

    // --------------------------------------------------------------------
    // Animated counters
    // --------------------------------------------------------------------
    function initCounters() {
        const counters = document.querySelectorAll('.counter');
        if (!counters.length) return;
        if (isReducedMotion) {
            counters.forEach((c) => { c.textContent = c.dataset.counterTo; });
            return;
        }
        const animate = (el) => {
            const target = parseFloat(el.dataset.counterTo);
            const decimals = parseInt(el.dataset.counterDecimals || '0', 10);
            const duration = 1400;
            const start = performance.now();
            const tick = (now) => {
                const t = Math.min(1, (now - start) / duration);
                const eased = 1 - Math.pow(1 - t, 3);
                const v = target * eased;
                el.textContent = decimals > 0 ? v.toFixed(decimals).replace('.', ',') : Math.round(v).toLocaleString('ru-RU');
                if (t < 1) requestAnimationFrame(tick);
                else el.textContent = decimals > 0 ? target.toFixed(decimals).replace('.', ',') : target.toLocaleString('ru-RU');
            };
            requestAnimationFrame(tick);
        };
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animate(entry.target);
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.6 });
        counters.forEach((c) => io.observe(c));
    }

    // --------------------------------------------------------------------
    // Parallax orbs (hero) — subtle on mousemove + scroll
    // --------------------------------------------------------------------
    function initParallax() {
        if (isReducedMotion) return;
        const orbs = document.querySelectorAll('[data-parallax]');
        if (!orbs.length) return;

        let mx = 0, my = 0, sy = 0;
        let raf = null;

        const apply = () => {
            orbs.forEach((orb) => {
                const f = parseFloat(orb.dataset.parallax) || 0.2;
                orb.style.transform = `translate(${mx * f * 30}px, ${my * f * 30 + sy * f * -0.3}px)`;
            });
            raf = null;
        };
        const schedule = () => { if (!raf) raf = requestAnimationFrame(apply); };

        if (isFinePointer) {
            window.addEventListener('mousemove', (e) => {
                mx = (e.clientX / window.innerWidth) - 0.5;
                my = (e.clientY / window.innerHeight) - 0.5;
                schedule();
            });
        }
        window.addEventListener('scroll', () => { sy = window.scrollY; schedule(); }, { passive: true });
    }

    // --------------------------------------------------------------------
    // Path animation (Wow scroll-scrub on desktop, IO slide-up on mobile)
    // --------------------------------------------------------------------
    function initPathAnimation() {

        // Mobile: stacked cards reveal
        const mobileCards = document.querySelectorAll('.path-mobile-card');
        if (mobileCards.length) {
            if (isReducedMotion) {
                mobileCards.forEach((c) => c.classList.add('is-visible'));
            } else {
                const io = new IntersectionObserver((entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('is-visible');
                            io.unobserve(entry.target);
                        }
                    });
                }, { threshold: 0.2 });
                mobileCards.forEach((c) => io.observe(c));
            }
        }

        // Desktop scrub — needs GSAP + ScrollTrigger + viewport ≥ 1024
        if (!isDesktop()) return;
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
        if (isReducedMotion) {
            // show all layers statically
            document.querySelectorAll('.path-desktop .path-layer').forEach((l) => l.style.opacity = '1');
            return;
        }

        gsap.registerPlugin(ScrollTrigger);

        const track = document.getElementById('pathTrack');
        const pin = document.getElementById('pathPin');
        const layers = document.querySelectorAll('#pathStage .path-layer');
        const steps = document.querySelectorAll('#pathSteps .path-step');
        if (!track || !pin || layers.length < 4) return;

        // Set initial state — layer 1 visible, others hidden
        gsap.set(layers[0], { opacity: 1, scale: 1 });
        gsap.set([layers[1], layers[2], layers[3]], { opacity: 0, scale: 1.04 });

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: track,
                start: 'top top',
                end: 'bottom bottom',
                scrub: 0.8,
                onUpdate: (self) => {
                    const p = self.progress;
                    let stepIdx = 0;
                    if (p > 0.75) stepIdx = 3;
                    else if (p > 0.5) stepIdx = 2;
                    else if (p > 0.25) stepIdx = 1;
                    steps.forEach((s, i) => s.classList.toggle('is-active', i === stepIdx));
                },
            },
        });

        // 0 → 0.33: layer 2 fades in over layer 1
        tl.to(layers[1], { opacity: 1, scale: 1, duration: 1, ease: 'power2.inOut' }, 0)
          .to(layers[0], { opacity: 0.5, duration: 1, ease: 'power2.inOut' }, 0)
          // 0.33 → 0.66: layer 3 (furniture)
          .to(layers[2], { opacity: 1, scale: 1, duration: 1, ease: 'power2.inOut' }, 1)
          // 0.66 → 1: layer 4 (people)
          .to(layers[3], { opacity: 1, scale: 1, duration: 1, ease: 'power2.inOut' }, 2);
    }

    // --------------------------------------------------------------------
    // Cases slider — arrow buttons
    // --------------------------------------------------------------------
    function initCasesSlider() {
        const track = document.getElementById('casesTrack');
        const prev = document.getElementById('casesPrev');
        const next = document.getElementById('casesNext');
        if (!track || !prev || !next) return;

        const cardWidth = () => {
            const card = track.querySelector('.case-card');
            if (!card) return 380;
            const style = getComputedStyle(track);
            const gap = parseFloat(style.gap) || 20;
            return card.offsetWidth + gap;
        };

        const updateButtons = () => {
            prev.disabled = track.scrollLeft <= 4;
            next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
        };

        prev.addEventListener('click', () => {
            track.scrollBy({ left: -cardWidth(), behavior: isReducedMotion ? 'auto' : 'smooth' });
        });
        next.addEventListener('click', () => {
            track.scrollBy({ left: cardWidth(), behavior: isReducedMotion ? 'auto' : 'smooth' });
        });

        track.addEventListener('scroll', updateButtons, { passive: true });
        window.addEventListener('resize', updateButtons);
        updateButtons();
    }

    // --------------------------------------------------------------------
    // FAQ — open one at a time
    // --------------------------------------------------------------------
    function initFAQ() {
        const items = document.querySelectorAll('.faq-item');
        items.forEach((item) => {
            item.addEventListener('toggle', () => {
                if (item.open) {
                    items.forEach((other) => {
                        if (other !== item && other.open) other.open = false;
                    });
                }
            });
        });
    }

    // --------------------------------------------------------------------
    // Modal popup — single popup for all CTAs
    // --------------------------------------------------------------------
    function initModal() {
        const overlay  = document.getElementById('modalOverlay');
        const backdrop = document.getElementById('modalBackdrop');
        const closeBtn = document.getElementById('modalClose');
        if (!overlay) return;

        const openModal = (formatName) => {
            overlay.classList.add('is-open');
            document.body.classList.add('modal-open');
            const ff = document.getElementById('modalFormatField');
            if (ff) ff.value = formatName || '';
            setTimeout(() => {
                const first = overlay.querySelector('input[type="text"]:not([tabindex="-1"])');
                if (first) first.focus();
            }, 320);
        };

        const closeModal = () => {
            overlay.classList.remove('is-open');
            document.body.classList.remove('modal-open');
        };

        backdrop.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

        // Intercept all #capture anchor links
        document.querySelectorAll('a[href="#capture"]').forEach((a) => {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                openModal();
            });
        });

        // Intercept format-card CTAs (pass format name)
        document.querySelectorAll('[data-cta-format]').forEach((btn) => {
            btn.addEventListener('click', () => openModal(btn.dataset.formatName || ''));
        });

        // Modal form validation + submit
        const form    = document.getElementById('modalForm');
        const success = document.getElementById('modalSuccess');
        if (!form) return;

        const setErr = (name, on) => {
            const f = form.querySelector(`[data-field="${name}"]`);
            if (f) f.classList.toggle('has-error', on);
        };

        const validate = () => {
            const d = new FormData(form);
            const name  = (d.get('name')  || '').toString().trim();
            const phone = (d.get('phone') || '').toString().replace(/\D/g, '');
            const consentInput = form.querySelector('input[name="consent"]');
            const consentLabel = consentInput?.closest('.consent');
            const ok1 = name.length >= 2;  setErr('name',  !ok1);
            const ok2 = phone.length >= 12; setErr('phone', !ok2);
            const ok4 = !!consentInput?.checked;
            if (!ok4) consentLabel?.classList.add('has-error');
            else consentLabel?.classList.remove('has-error');
            return ok1 && ok2 && ok4;
        };

        form.querySelectorAll('input').forEach((inp) => {
            inp.addEventListener('input', () => inp.closest('.field')?.classList.remove('has-error'));
            inp.addEventListener('change', () => {
                if (inp.type === 'checkbox' && inp.name === 'consent' && inp.checked) {
                    inp.closest('.consent')?.classList.remove('has-error');
                }
            });
        });

        // phone mask on modal phone input
        const modalPhone = document.getElementById('modalPhoneInput');
        if (modalPhone) applyPhoneMask(modalPhone);

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const hp = form.querySelector('input[name="company"]');
            if (hp && hp.value.trim()) return;
            if (!validate()) { showToast('Проверьте поля формы'); return; }
            submitLead(form, success);
        });
    }

    // --------------------------------------------------------------------
    // Format CTA — scroll to form, prefill format hidden field
    // --------------------------------------------------------------------
    function initFormatCTA() {
        document.querySelectorAll('[data-cta-format]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const formatName = btn.dataset.formatName || '';
                const formatField = document.getElementById('formatField');
                const nameInput = document.querySelector('#leadForm input[name="name"]');
                if (formatField) formatField.value = formatName;
                const target = document.getElementById('capture');
                if (target) {
                    const top = target.getBoundingClientRect().top + window.scrollY - 20;
                    window.scrollTo({ top, behavior: isReducedMotion ? 'auto' : 'smooth' });
                    setTimeout(() => { if (nameInput) nameInput.focus(); }, 700);
                }
            });
        });
    }

    // --------------------------------------------------------------------
    // Custom cursor (desktop fine pointer only)
    // --------------------------------------------------------------------
    function initCustomCursor() {
        if (!isFinePointer || isReducedMotion) return;
        const dot = document.getElementById('cursorDot');
        const ring = document.getElementById('cursorRing');
        if (!dot || !ring) return;

        document.body.classList.add('has-cursor');

        let dx = 0, dy = 0, rx = 0, ry = 0;
        let raf;

        window.addEventListener('mousemove', (e) => {
            dx = e.clientX; dy = e.clientY;
            dot.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
            if (!raf) raf = requestAnimationFrame(updateRing);
        });

        const updateRing = () => {
            rx += (dx - rx) * 0.18;
            ry += (dy - ry) * 0.18;
            ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
            if (Math.abs(dx - rx) > 0.5 || Math.abs(dy - ry) > 0.5) raf = requestAnimationFrame(updateRing);
            else raf = null;
        };

        const interactiveSel = 'a, button, [role="button"], input, label, summary, .case-card, .bento-tile';
        document.addEventListener('mouseover', (e) => {
            if (e.target.closest(interactiveSel)) document.body.classList.add('cursor-active');
        });
        document.addEventListener('mouseout', (e) => {
            if (e.target.closest(interactiveSel)) document.body.classList.remove('cursor-active');
        });

        // hide when cursor leaves window
        document.addEventListener('mouseleave', () => {
            dot.style.opacity = '0';
            ring.style.opacity = '0';
        });
        document.addEventListener('mouseenter', () => {
            dot.style.opacity = '1';
            ring.style.opacity = '1';
        });
    }

    // --------------------------------------------------------------------
    // Subtle tilt effect on [data-tilt] elements (desktop only)
    // --------------------------------------------------------------------
    function initTilt() {
        if (!isFinePointer || isReducedMotion) return;
        document.querySelectorAll('[data-tilt]').forEach((el) => {
            const max = 6;
            el.addEventListener('mousemove', (e) => {
                const r = el.getBoundingClientRect();
                const x = (e.clientX - r.left) / r.width - 0.5;
                const y = (e.clientY - r.top) / r.height - 0.5;
                el.style.transform = `perspective(900px) rotateY(${x * max}deg) rotateX(${-y * max}deg)`;
                el.style.transition = 'transform 0.05s linear';
            });
            el.addEventListener('mouseleave', () => {
                el.style.transform = 'perspective(900px) rotateY(0) rotateX(0)';
                el.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
            });
        });
    }

    // --------------------------------------------------------------------
    // UZ phone mask: +998 __ ___-__-__
    // --------------------------------------------------------------------
    function applyPhoneMask(input) {
        if (!input) return;
        const format = (val) => {
            let digits = val.replace(/\D/g, '');
            if (digits.startsWith('998')) digits = digits.slice(3);
            else if (digits.startsWith('0')) digits = digits.slice(1);
            digits = digits.slice(0, 9);
            let out = '+998';
            if (digits.length > 0) out += ' ' + digits.slice(0, 2);
            if (digits.length >= 3) out += ' ' + digits.slice(2, 5);
            if (digits.length >= 6) out += '-' + digits.slice(5, 7);
            if (digits.length >= 8) out += '-' + digits.slice(7, 9);
            return out;
        };
        input.addEventListener('input', () => {
            const end = input.selectionStart === input.value.length;
            input.value = format(input.value);
            if (end) input.setSelectionRange(input.value.length, input.value.length);
        });
        input.addEventListener('focus', () => { if (!input.value) input.value = '+998 '; });
        input.addEventListener('blur',  () => { if (input.value === '+998 ') input.value = ''; });
    }

    function initPhoneMask() {
        applyPhoneMask(document.getElementById('phoneInput'));
    }

    // --------------------------------------------------------------------
    // Form: client-side validation + honeypot + success state
    // --------------------------------------------------------------------
    function initForm() {
        const form = document.getElementById('leadForm');
        const success = document.getElementById('formSuccess');
        if (!form) return;

        const setError = (fieldName, on) => {
            const field = form.querySelector(`[data-field="${fieldName}"]`);
            if (field) field.classList.toggle('has-error', on);
        };

        const validate = () => {
            let ok = true;
            const data = new FormData(form);
            const name = (data.get('name') || '').toString().trim();
            const phone = (data.get('phone') || '').toString().replace(/\D/g, '');
            const consentInput = form.querySelector('input[name="consent"]');
            const consentLabel = consentInput?.closest('.consent');
            const consent = consentInput?.checked;

            if (name.length < 2) { setError('name', true); ok = false; } else setError('name', false);
            if (phone.length < 12) { setError('phone', true); ok = false; } else setError('phone', false);
            if (!consent) { consentLabel?.classList.add('has-error'); ok = false; }
            else { consentLabel?.classList.remove('has-error'); }

            return ok;
        };

        // Live clear errors as user types / checks
        form.querySelectorAll('input').forEach((inp) => {
            inp.addEventListener('input', () => {
                const wrap = inp.closest('.field');
                if (wrap) wrap.classList.remove('has-error');
            });
            inp.addEventListener('change', () => {
                if (inp.type === 'checkbox' && inp.name === 'consent' && inp.checked) {
                    inp.closest('.consent')?.classList.remove('has-error');
                }
            });
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();

            // Honeypot
            const hp = form.querySelector('input[name="company"]');
            if (hp && hp.value.trim().length > 0) return;

            if (!validate()) {
                showToast('Проверьте поля формы');
                return;
            }

            submitLead(form, success);
        });
    }

    // --------------------------------------------------------------------
    // Shared lead submit → POST /api/lead
    // Returns true on success, false on network/validation error.
    // --------------------------------------------------------------------
    async function submitLead(form, successEl) {
        const btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.style.opacity = '0.7'; }

        const d = new FormData(form);
        const payload = {
            name:      (d.get('name')      || '').toString().trim(),
            phone:     (d.get('phone')     || '').toString().replace(/\D/g, ''),
            format:     (d.get('format')    || '') || null,
            ads_consent: !!d.get('ads_consent'),
            source:     'franch-uz-landing',
            market:     'uz',
        };

        const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxtUkvpbRA_6ChtFTAtEQOD-uWWTdrvlSHqKfVviY8PtxydIOTgO8g7OVc5Y-hRuwv6/exec';

        try {
            // Send to Google Sheets (no-cors requires text/plain for simple request)
            await fetch(SHEETS_URL, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(payload),
            });

            // Also send to AMO when server is configured (silent fail if not ready) —
            // awaited so navigation below doesn't cancel the request mid-flight
            await fetch('/api/lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            }).catch(() => {});

            window.location.href = '/uz/thank-you';
            return true;
        } catch (err) {
            console.error('Lead submit error:', err);
            showToast('Ошибка отправки — попробуйте ещё раз');
            if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
            return false;
        }
    }

    // --------------------------------------------------------------------
    // Toast helper
    // --------------------------------------------------------------------
    function showToast(message) {
        const toast = document.getElementById('toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('is-visible');
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toast.classList.remove('is-visible'), 3500);
    }

})();
