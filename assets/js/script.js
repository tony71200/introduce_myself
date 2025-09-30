'use strict';

(function () {
  const elementToggleFunc = (elem) => {
    if (elem) {
      elem.classList.toggle('active');
    }
  };

  const initSidebarToggle = () => {
    const sidebar = document.querySelector('[data-sidebar]');
    const sidebarBtn = document.querySelector('[data-sidebar-btn]');
    if (!sidebar || !sidebarBtn) return;
    sidebarBtn.addEventListener('click', () => elementToggleFunc(sidebar));
  };

  const initTestimonialsModal = () => {
    const items = document.querySelectorAll('[data-testimonials-item]');
    const modalContainer = document.querySelector('[data-modal-container]');
    const modalCloseBtn = document.querySelector('[data-modal-close-btn]');
    const overlay = document.querySelector('[data-overlay]');
    const modalImg = document.querySelector('[data-modal-img]');
    const modalTitle = document.querySelector('[data-modal-title]');
    const modalText = document.querySelector('[data-modal-text]');

    if (!items.length || !modalContainer || !modalCloseBtn || !overlay || !modalImg || !modalTitle || !modalText) {
      return;
    }

    const toggleModal = () => {
      modalContainer.classList.toggle('active');
      overlay.classList.toggle('active');
    };

    items.forEach(item => {
      item.addEventListener('click', () => {
        const avatar = item.querySelector('[data-testimonials-avatar]');
        if (avatar) {
          modalImg.src = avatar.src || '';
          modalImg.alt = avatar.alt || '';
        }
        const titleEl = item.querySelector('[data-testimonials-title]');
        const textEl = item.querySelector('[data-testimonials-text]');
        if (titleEl) modalTitle.innerHTML = titleEl.innerHTML;
        if (textEl) modalText.innerHTML = textEl.innerHTML;
        toggleModal();
      });
    });

    modalCloseBtn.addEventListener('click', toggleModal);
    overlay.addEventListener('click', toggleModal);
  };

  const initFormValidation = () => {
    const form = document.querySelector('[data-form]');
    const formInputs = document.querySelectorAll('[data-form-input]');
    const formBtn = document.querySelector('[data-form-btn]');
    if (!form || !formBtn || !formInputs.length) return;

    formInputs.forEach(input => {
      input.addEventListener('input', () => {
        if (form.checkValidity()) {
          formBtn.removeAttribute('disabled');
        } else {
          formBtn.setAttribute('disabled', '');
        }
      });
    });
  };

  const initNavigation = () => {
    const navigationLinks = document.querySelectorAll('[data-nav-link]');
    const pages = document.querySelectorAll('[data-page]');
    if (!navigationLinks.length || !pages.length) return;

    navigationLinks.forEach(link => {
      link.addEventListener('click', function () {
        const target = (this.textContent || '').trim().toLowerCase();
        pages.forEach((page, index) => {
          if (page.dataset.page === target) {
            page.classList.add('active');
            navigationLinks[index].classList.add('active');
            window.scrollTo(0, 0);
          } else {
            page.classList.remove('active');
            navigationLinks[index].classList.remove('active');
          }
        });
      });
    });
  };

  const galleryModal = {
    container: null,
    overlay: null,
    closeBtn: null,
    title: null,
    main: null,
    thumbs: null,
    desc: null,
    toggle: null,
  };
  let galleryModalListenersBound = false;

  const cacheGalleryModal = () => {
    galleryModal.container = document.querySelector('[data-gallery-modal-container]');
    galleryModal.overlay = document.querySelector('[data-gallery-overlay]');
    galleryModal.closeBtn = document.querySelector('[data-gallery-modal-close-btn]');
    galleryModal.title = document.querySelector('[data-gallery-modal-title]');
    galleryModal.main = document.querySelector('[data-gallery-modal-main]');
    galleryModal.thumbs = document.querySelector('[data-gallery-modal-thumbs]');
    galleryModal.desc = document.querySelector('[data-gallery-modal-desc]');

    if (!galleryModal.container || !galleryModal.overlay || !galleryModal.closeBtn) {
      return;
    }

    if (!galleryModal.toggle) {
      galleryModal.toggle = () => {
        if (!galleryModal.container || !galleryModal.overlay) return;
        galleryModal.container.classList.toggle('active');
        galleryModal.overlay.classList.toggle('active');
      };
    }

    if (!galleryModalListenersBound) {
      galleryModal.closeBtn.addEventListener('click', galleryModal.toggle);
      galleryModal.overlay.addEventListener('click', galleryModal.toggle);
      galleryModalListenersBound = true;
    }
  };

  const buildMediaElement = (media) => {
    if (!media || !media.src) {
      return document.createElement('div');
    }
    if (media.type === 'video') {
      const video = document.createElement('video');
      video.src = media.src;
      if (media.poster) {
        video.setAttribute('poster', media.poster);
      }
      video.controls = true;
      video.playsInline = true;
      return video;
    }
    const img = document.createElement('img');
    img.src = media.src;
    img.alt = media.alt || 'gallery media';
    img.loading = 'lazy';
    return img;
  };

  const renderGalleryModal = (title, desc, mediaList) => {
    if (!galleryModal.container) return;
    if (galleryModal.title) galleryModal.title.textContent = title || 'Project';
    if (galleryModal.desc) galleryModal.desc.innerHTML = desc || '';

    if (galleryModal.main) galleryModal.main.innerHTML = '';
    if (galleryModal.thumbs) galleryModal.thumbs.innerHTML = '';

    if (!mediaList || mediaList.length === 0) {
      if (galleryModal.main) {
        const empty = document.createElement('div');
        empty.textContent = 'No media available for this item.';
        galleryModal.main.appendChild(empty);
      }
      return;
    }

    const first = mediaList[0];
    if (galleryModal.main) {
      galleryModal.main.appendChild(buildMediaElement(first));
    }

    if (galleryModal.thumbs) {
      mediaList.forEach(media => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.addEventListener('click', () => {
          if (!galleryModal.main) return;
          galleryModal.main.innerHTML = '';
          galleryModal.main.appendChild(buildMediaElement(media));
        });
        const thumb = document.createElement('img');
        thumb.src = media.type === 'video' ? (media.poster || media.src) : media.src;
        thumb.alt = media.alt || 'preview';
        thumb.loading = 'lazy';
        btn.appendChild(thumb);
        li.appendChild(btn);
        galleryModal.thumbs.appendChild(li);
      });
    }
  };

  const parseMediaFromDataset = (item) => {
    const raw = item.dataset.media;
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(m => m && m.src);
      }
    } catch (err) {
      console.warn('Unable to parse media dataset', err);
    }
    return [];
  };

  const setupGalleryFilters = (root) => {
    const select = root.querySelector('[data-gallery-select]');
    const selectValue = root.querySelector('[data-gallery-select-value]');
    const selectItems = root.querySelectorAll('[data-gallery-select-item]');
    const filterButtons = root.querySelectorAll('[data-gallery-filter-btn]');
    const filterItems = root.querySelectorAll('[data-gallery-item]');

    if (!filterItems.length) return;

    const readValue = (el, key) => {
      if (!el) return '';
      const dataKey = key && el.dataset ? el.dataset[key] : '';
      const base = dataKey && dataKey.trim() ? dataKey : (el.textContent || '');
      return base.trim().toLowerCase();
    };

    const readLabel = (el) => (el ? (el.textContent || '').trim() : '');

    const filterFunc = (selectedValue) => {
      const value = (selectedValue || 'all').toLowerCase();
      filterItems.forEach(item => {
        const category = (item.dataset.category || '').toLowerCase();
        if (value === 'all' || value === category) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });
    };

    if (select) {
      select.addEventListener('click', () => elementToggleFunc(select));
    }

    selectItems.forEach(item => {
      item.addEventListener('click', () => {
        const label = readLabel(item);
        const value = readValue(item, 'selectValue');
        if (selectValue) selectValue.textContent = label;
        if (select) elementToggleFunc(select);
        filterFunc(value);
        let matchedBtn = null;
        filterButtons.forEach(btn => {
          const isActive = readValue(btn, 'filterValue') === value;
          btn.classList.toggle('active', isActive);
          if (isActive) matchedBtn = btn;
        });
        lastClickedBtn = matchedBtn || lastClickedBtn;
      });
    });

    let lastClickedBtn = Array.from(filterButtons).find(btn => btn.classList.contains('active')) || null;
    if (!lastClickedBtn && filterButtons.length) {
      lastClickedBtn = filterButtons[0];
      lastClickedBtn.classList.add('active');
    }

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const label = readLabel(btn);
        const value = readValue(btn, 'filterValue');
        if (selectValue) selectValue.textContent = label;
        filterFunc(value);
        if (lastClickedBtn && lastClickedBtn !== btn) {
          lastClickedBtn.classList.remove('active');
        }
        btn.classList.add('active');
        lastClickedBtn = btn;
      });
    });

    const initialLabel = readLabel(lastClickedBtn) || 'All';
    const initialValue = readValue(lastClickedBtn, 'filterValue') || 'all';
    if (selectValue && initialLabel) selectValue.textContent = initialLabel;
    filterFunc(initialValue);
  };

  const setupGalleryModalTriggers = (root) => {
    if (!galleryModal.container) return;
    const items = root.querySelectorAll('[data-gallery-item]');
    items.forEach(item => {
      const trigger = item.querySelector('[data-gallery-trigger]');
      if (!trigger) return;
      const activate = (event) => {
        event.preventDefault();
        event.stopPropagation();

        const link = item.dataset.link;
        if (link) {
          window.open(link, '_blank', 'noopener');
        }

        const mediaList = parseMediaFromDataset(item);
        if (!mediaList.length) return;

        const titleEl = item.querySelector('[data-gallery-title]');
        const descEl = item.querySelector('[data-gallery-description]');
        const title = titleEl ? titleEl.textContent.trim() : 'Project';
        const desc = descEl ? descEl.innerHTML : '';

        renderGalleryModal(title, desc, mediaList);
        if (typeof galleryModal.toggle === 'function') {
          galleryModal.toggle();
        }
      };

      trigger.addEventListener('click', activate);
      trigger.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          activate(ev);
        }
      });
    });
  };

  const initGallery = (root) => {
    setupGalleryFilters(root);
    setupGalleryModalTriggers(root);
  };

  const initGalleries = () => {
    const galleries = document.querySelectorAll('[data-gallery]');
    if (!galleries.length) return;
    galleries.forEach(initGallery);
  };

  document.addEventListener('DOMContentLoaded', () => {
    initSidebarToggle();
    initTestimonialsModal();
    initFormValidation();
    initNavigation();
    cacheGalleryModal();
    initGalleries();
  });

  document.addEventListener('site-data-updated', () => {
    cacheGalleryModal();
    initGalleries();
  });
})();
