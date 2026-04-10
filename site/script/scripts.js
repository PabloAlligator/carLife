
// 1. Бургер-меню

const burger = document.querySelector('.header__burger');
const nav = document.querySelector('.header__nav');


if (burger && nav) {
    burger.addEventListener('click', () => {
        burger.classList.toggle('active');
        nav.classList.toggle('active');
    });
}


// 2. Появление шапки при скролле

const header = document.querySelector('.header');

// Более чувствительная версия с таймаутом
if (header) {
    let lastScroll = 0;
    let ticking = false;
    
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const currentScroll = window.pageYOffset;
                
                if (currentScroll > lastScroll && currentScroll > 100) {
                    header.classList.add('hidden');
                } else if (currentScroll < lastScroll && currentScroll < lastScroll - 10) {
                    header.classList.remove('hidden');
                }
                
                lastScroll = currentScroll;
                ticking = false;
            });
            ticking = true;
        }
    });
}


// 3. Плавный скролл к секциям

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const href = this.getAttribute('href');
            if (!href || href === '#') return;

            const target = document.querySelector(href);
            if (!target) return;

            const headerHeight = header?.offsetHeight || 0;
            const topOffset = headerHeight + 20;

            const topPos = target.getBoundingClientRect().top + window.pageYOffset - topOffset;

            window.scrollTo({
                top: topPos,
                behavior: 'smooth'
            });

            if (burger && nav && nav.classList.contains('active')) {
                burger.classList.remove('active');
                nav.classList.remove('active');
            }
        });
    });
});


// 6. Маска ввода телефона

const phoneInput = document.querySelector('input[name="phone"]');

if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/[^\d+]/g, '');

        // если начали с 7, +7, 8 — не мешаем, просто ограничим длину
        const digitsOnly = value.replace(/\D/g, '');

        if (digitsOnly.length > 11) {
            let trimmed = digitsOnly.slice(0, 11);

            if (value.startsWith('+')) {
                e.target.value = '+' + trimmed;
            } else {
                e.target.value = trimmed;
            }
            return;
        }

        e.target.value = value;
    });
}

// отзывы

const reviewsSwiper = new Swiper('.otzyvy-slider', {
    slidesPerView: 3,
    spaceBetween: 20,
    loop: true,
    speed: 700,
    autoHeight: false,

    navigation: {
        nextEl: '.otzyvy-button-next',
        prevEl: '.otzyvy-button-prev',
    },

    breakpoints: {
        0: {
            slidesPerView: 1.1,
            spaceBetween: 12,
        },
        480: {
            slidesPerView: 1.2,
            spaceBetween: 14,
        },
        768: {
            slidesPerView: 2,
            spaceBetween: 16,
        },
        1200: {
            slidesPerView: 3,
            spaceBetween: 20,
        }
    },

    on: {
        init() {
            initReviewToggles();
        }
    }
});

function initReviewToggles() {
    const reviewCards = document.querySelectorAll('.otzyvy-card');

    reviewCards.forEach((card) => {
        if (card.dataset.ready === 'true') return;
        card.dataset.ready = 'true';

        const text = card.querySelector('.otzyvy-card__text');
        const toggle = card.querySelector('.otzyvy-card__toggle');

        if (!text || !toggle) return;

        const updateState = () => {
            const wasOpen = card.classList.contains('is-open');

            if (wasOpen) {
                card.classList.remove('is-open');
                toggle.textContent = 'Читать больше';
                toggle.setAttribute('aria-expanded', 'false');
            }

            card.classList.remove('is-short');

            const isOverflowing = text.scrollHeight > text.clientHeight + 2;

            if (!isOverflowing) {
                card.classList.add('is-short');
            }

            if (wasOpen && !card.classList.contains('is-short')) {
                card.classList.add('is-open');
                toggle.textContent = 'Свернуть';
                toggle.setAttribute('aria-expanded', 'true');
            }
        };

        requestAnimationFrame(() => {
            updateState();
            reviewsSwiper.update();
        });

        toggle.addEventListener('click', () => {
            const isOpen = card.classList.toggle('is-open');

            toggle.textContent = isOpen ? 'Свернуть' : 'Читать больше';
            toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

            setTimeout(() => {
                reviewsSwiper.update();
            }, 50);
        });

        window.addEventListener('resize', updateState);
    });
}

reviewsSwiper.on('slideChangeTransitionEnd', () => {
    reviewsSwiper.update();
});

// 7. Отправка формы

if (form) {
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        if (errorMsg) {
            errorMsg.style.display = 'none';
            errorMsg.innerHTML = `
                <div class="error-icon">✕</div>
                <h3>Ошибка отправки</h3>
                <p>Попробуйте позже или позвоните: +7 (983) 190-50-50</p>
            `;
        }

        const formData = new FormData(form);

        const rawName = (formData.get('name') || '').toString().trim();
        const rawPhone = (formData.get('phone') || '').toString().trim();
        const rawService = (formData.get('service') || '').toString().trim();
        const rawComment = (formData.get('comment') || '').toString().trim();

        if (!rawName) {
            if (errorMsg) {
                errorMsg.style.display = 'block';
                errorMsg.innerHTML = `
                    <div class="error-icon">✕</div>
                    <h3>Проверьте имя</h3>
                    <p>Введите ваше имя.</p>
                `;
            }
            return;
        }

        if (!isValidRussianPhone(rawPhone)) {
            if (errorMsg) {
                errorMsg.style.display = 'block';
                errorMsg.innerHTML = `
                    <div class="error-icon">✕</div>
                    <h3>Проверьте номер телефона</h3>
                    <p>Введите номер в формате 89233906649, +79233906649 или 8 (923) 390-66-49.</p>
                `;
            }
            return;
        }

        if (!rawService) {
            if (errorMsg) {
                errorMsg.style.display = 'block';
                errorMsg.innerHTML = `
                    <div class="error-icon">✕</div>
                    <h3>Выберите услугу</h3>
                    <p>Нужно выбрать услугу перед отправкой.</p>
                `;
            }
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        if (btnText) btnText.textContent = 'ОТПРАВЛЯЕМ...';

        const data = {
            name: rawName || '—',
            phone: formatPhoneForSend(rawPhone) || rawPhone,
            service: rawService || '—',
            comment: rawComment || '—',
            send_date: new Date().toLocaleString('ru-RU', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        };

        console.log('Отправляемые данные:', data);

        emailjs.send(
            'service_qxejzo5', // ВСТАВЬ СЮДА СВОЙ НАСТОЯЩИЙ SERVICE ID
            'template_kqa0m2l',
            data
        )
            .then((response) => {
                console.log('Успех EmailJS:', response.status, response.text);

                if (successMsg) successMsg.style.display = 'block';
                if (errorMsg) errorMsg.style.display = 'none';
                form.style.display = 'none';

                if (submitBtn) submitBtn.disabled = false;
                if (btnText) btnText.textContent = 'ЗАПИСАТЬСЯ БЕСПЛАТНО';
            })
            .catch((err) => {
                console.error('Ошибка EmailJS:', err);

                if (errorMsg) {
                    errorMsg.style.display = 'block';
                    errorMsg.innerHTML = `
                        <div class="error-icon">✕</div>
                        <h3>Ошибка отправки</h3>
                        <p>Попробуйте позже или позвоните: +7 (983) 190-50-50</p>
                    `;
                }

                if (successMsg) successMsg.style.display = 'none';

                if (submitBtn) submitBtn.disabled = false;
                if (btnText) btnText.textContent = 'ЗАПИСАТЬСЯ БЕСПЛАТНО';
            });
    });
}


// 8. Сброс формы

function resetForm() {
    if (!form) return;

    form.reset();
    form.style.display = '';
    if (successMsg) successMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';
}

// модалка 

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('serviceModal');
    const modalOverlay = modal.querySelector('.service-modal__overlay');
    const modalClose = modal.querySelector('.service-modal__close');

    const modalImage = document.getElementById('serviceModalImage');
    const modalTitle = document.getElementById('serviceModalTitle');
    const modalText = document.getElementById('serviceModalText');
    const modalPhone = document.getElementById('serviceModalPhone');
    const modalPhoneNumber = modalPhone.querySelector('.service-modal__phone-number');

    const serviceCards = document.querySelectorAll('.uslugi__element');

    const formatPhone = (phone) => {
        const digits = phone.replace(/\D/g, '');

        if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
            const normalized = digits.startsWith('8') ? '7' + digits.slice(1) : digits;
            return `+7 (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
        }

        return phone;
    };

    const openModal = ({ title, text, image, phone }) => {
        modalTitle.textContent = title || '';
        modalText.textContent = text || '';
        modalImage.src = image || '';
        modalImage.alt = title || 'Изображение услуги';

        const formattedPhone = formatPhone(phone || '+79233906649');
        const telPhone = (phone || '+79233906649').replace(/\D/g, '');

        modalPhone.href = `tel:+${telPhone.startsWith('8') ? '7' + telPhone.slice(1) : telPhone}`;
        modalPhoneNumber.textContent = formattedPhone;

        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    };

    const closeModal = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');

        setTimeout(() => {
            modalImage.src = '';
            modalImage.alt = '';
        }, 250);
    };

    serviceCards.forEach((card) => {
        card.addEventListener('click', (event) => {
            event.preventDefault();

            const data = {
                title: card.dataset.title,
                text: card.dataset.text,
                image: card.dataset.image,
                phone: card.dataset.phone
            };

            openModal(data);
        });
    });

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
});
