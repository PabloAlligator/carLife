document.addEventListener('DOMContentLoaded', () => {
  /* =========================================================
     1. БУРГЕР-МЕНЮ
     ========================================================= */

  const burger = document.querySelector('.header__burger');
  const nav = document.querySelector('.header__nav');
  const header = document.querySelector('.header');

  if (burger && nav) {
    burger.addEventListener('click', () => {
      const isOpen = burger.classList.toggle('active');
      nav.classList.toggle('active', isOpen);

      burger.setAttribute('aria-expanded', String(isOpen));
      document.body.classList.toggle('menu-open', isOpen);
    });
  }

  /* =========================================================
     2. ПОЯВЛЕНИЕ / СКРЫТИЕ ШАПКИ ПРИ СКРОЛЛЕ
     ========================================================= */

  if (header) {
    let lastScroll = 0;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (ticking) return;

      ticking = true;

      requestAnimationFrame(() => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > lastScroll && currentScroll > 100) {
          header.classList.add('hidden');
        } else {
          header.classList.remove('hidden');
        }

        lastScroll = currentScroll;
        ticking = false;
      });
    });
  }

  /* =========================================================
     3. ПЛАВНЫЙ СКРОЛЛ К СЕКЦИЯМ
     ========================================================= */

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', function (e) {
      const href = this.getAttribute('href');

      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const headerHeight = header?.offsetHeight || 0;
      const topOffset = headerHeight + 20;
      const topPos =
        target.getBoundingClientRect().top + window.pageYOffset - topOffset;

      window.scrollTo({
        top: topPos,
        behavior: 'smooth',
      });

      if (burger && nav && nav.classList.contains('active')) {
        burger.classList.remove('active');
        nav.classList.remove('active');
        burger.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
      }
    });
  });

  /* =========================================================
     4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ФОРМЫ
     ========================================================= */

  function normalizeRussianPhone(phone) {
    const digits = String(phone || '').replace(/\D/g, '');

    if (digits.length === 11 && digits.startsWith('8')) {
      return '7' + digits.slice(1);
    }

    if (digits.length === 11 && digits.startsWith('7')) {
      return digits;
    }

    return digits;
  }

  function isValidRussianPhone(phone) {
    const normalized = normalizeRussianPhone(phone);
    return /^7\d{10}$/.test(normalized);
  }

  function formatPhoneForSend(phone) {
    const normalized = normalizeRussianPhone(phone);

    if (!/^7\d{10}$/.test(normalized)) return phone;

    return `+7 (${normalized.slice(1, 4)}) ${normalized.slice(
      4,
      7
    )}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
  }

  function resetForm() {
    if (!form) return;

    form.reset();
    form.style.display = '';
    if (successMsg) successMsg.style.display = 'none';
    if (errorMsg) errorMsg.style.display = 'none';

    if (submitBtn) submitBtn.disabled = false;
    if (btnText) btnText.textContent = 'ЗАПИСАТЬСЯ НА СЕРВИС';
  }

  window.resetForm = resetForm;

  /* =========================================================
     5. МАСКА / ОГРАНИЧЕНИЕ ВВОДА ТЕЛЕФОНА
     ========================================================= */

  const phoneInput = document.querySelector('input[name="phone"]');

  if (phoneInput) {
    phoneInput.addEventListener('input', (e) => {
      let value = e.target.value.replace(/[^\d+]/g, '');

      const digitsOnly = value.replace(/\D/g, '');

      if (digitsOnly.length > 11) {
        const trimmed = digitsOnly.slice(0, 11);
        e.target.value = value.startsWith('+') ? '+' + trimmed : trimmed;
        return;
      }

      e.target.value = value;
    });
  }

  /* =========================================================
     6. ОТЗЫВЫ / SWIPER
     ========================================================= */

  let reviewsSwiper = null;

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
        reviewsSwiper?.update();
      });

      toggle.addEventListener('click', () => {
        const isOpen = card.classList.toggle('is-open');

        toggle.textContent = isOpen ? 'Свернуть' : 'Читать больше';
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

        setTimeout(() => {
          reviewsSwiper?.update();
        }, 50);
      });

      window.addEventListener('resize', updateState);
    });
  }

  if (typeof Swiper !== 'undefined' && document.querySelector('.otzyvy-slider')) {
    reviewsSwiper = new Swiper('.otzyvy-slider', {
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
        },
      },

      on: {
        init() {
          initReviewToggles();
        },
      },
    });

    reviewsSwiper.on('slideChangeTransitionEnd', () => {
      reviewsSwiper?.update();
    });
  }

  /* =========================================================
     7. ФОРМА ЗАЯВКИ
     ========================================================= */

  const form = document.getElementById('connectForm');
  const successMsg = document.getElementById('successMessage');
  const errorMsg = document.getElementById('errorMessage');
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn?.querySelector('.btn-text');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      if (errorMsg) {
        errorMsg.style.display = 'none';
        errorMsg.innerHTML = `
          <div class="error-icon">✕</div>
          <h3>Ошибка отправки</h3>
          <p>Попробуйте позже или позвоните: +7 (923) 390-00-00</p>
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
            <p>Введите номер в формате 89233900000, +79233900000 или 8 (923) 390-00-00.</p>
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
          minute: '2-digit',
        }),
      };

      if (typeof emailjs === 'undefined') {
        console.error('EmailJS не подключён');

        if (errorMsg) {
          errorMsg.style.display = 'block';
          errorMsg.innerHTML = `
            <div class="error-icon">✕</div>
            <h3>EmailJS не подключён</h3>
            <p>Подключите библиотеку EmailJS или временно отключите отправку формы.</p>
          `;
        }

        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'ЗАПИСАТЬСЯ НА СЕРВИС';
        return;
      }

      emailjs
        .send('service_qxejzo5', 'template_kqa0m2l', data)
        .then((response) => {
          console.log('Успех EmailJS:', response.status, response.text);

          if (successMsg) successMsg.style.display = 'block';
          if (errorMsg) errorMsg.style.display = 'none';
          form.style.display = 'none';

          if (submitBtn) submitBtn.disabled = false;
          if (btnText) btnText.textContent = 'ЗАПИСАТЬСЯ НА СЕРВИС';
        })
        .catch((err) => {
          console.error('Ошибка EmailJS:', err);

          if (errorMsg) {
            errorMsg.style.display = 'block';
            errorMsg.innerHTML = `
              <div class="error-icon">✕</div>
              <h3>Ошибка отправки</h3>
              <p>Попробуйте позже или позвоните: +7 (923) 390-00-00</p>
            `;
          }

          if (successMsg) successMsg.style.display = 'none';

          if (submitBtn) submitBtn.disabled = false;
          if (btnText) btnText.textContent = 'ЗАПИСАТЬСЯ НА СЕРВИС';
        });
    });
  }

  /* =========================================================
     8. МОДАЛКА УСЛУГ
     ========================================================= */

  const modal = document.getElementById('serviceModal');

  if (modal) {
    const modalOverlay = modal.querySelector('.service-modal__overlay');
    const modalClose = modal.querySelector('.service-modal__close');

    const modalImage = document.getElementById('serviceModalImage');
    const modalTitle = document.getElementById('serviceModalTitle');
    const modalText = document.getElementById('serviceModalText');
    const modalPhone = document.getElementById('serviceModalPhone');
    const modalPhoneNumber = modalPhone?.querySelector(
      '.service-modal__phone-number'
    );

    const serviceCards = document.querySelectorAll('.uslugi__element');

    const formatPhone = (phone) => {
      const digits = String(phone || '').replace(/\D/g, '');

      if (
        digits.length === 11 &&
        (digits.startsWith('7') || digits.startsWith('8'))
      ) {
        const normalized = digits.startsWith('8')
          ? '7' + digits.slice(1)
          : digits;

        return `+7 (${normalized.slice(1, 4)}) ${normalized.slice(
          4,
          7
        )}-${normalized.slice(7, 9)}-${normalized.slice(9, 11)}`;
      }

      return phone || '+7 (923) 390-00-00';
    };

    const openModal = ({ title, text, image, phone }) => {
      if (modalTitle) modalTitle.textContent = title || '';
      if (modalText) modalText.textContent = text || '';

      if (modalImage) {
        modalImage.src = image || '';
        modalImage.alt = title || 'Изображение услуги';
      }

      const rawPhone = phone || '+79233900000';
      const formattedPhone = formatPhone(rawPhone);
      const telPhone = rawPhone.replace(/\D/g, '');

      if (modalPhone) {
        const normalizedPhone = telPhone.startsWith('8')
          ? '7' + telPhone.slice(1)
          : telPhone;
        modalPhone.href = `tel:+${normalizedPhone}`;
      }

      if (modalPhoneNumber) {
        modalPhoneNumber.textContent = formattedPhone;
      }

      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('modal-open');
    };

    const closeModal = () => {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('modal-open');

      setTimeout(() => {
        if (modalImage) {
          modalImage.src = '';
          modalImage.alt = '';
        }
      }, 250);
    };

    serviceCards.forEach((card) => {
      card.addEventListener('click', (event) => {
        const targetLink = event.target.closest('a');
        if (targetLink) {
          event.preventDefault();
        }

        openModal({
          title: card.dataset.title,
          text: card.dataset.text,
          image: card.dataset.image,
          phone: card.dataset.phone,
        });
      });
    });

    modalClose?.addEventListener('click', closeModal);
    modalOverlay?.addEventListener('click', closeModal);

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });
  }
});
