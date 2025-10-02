'use strict';



// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });



// testimonials variables
const testimonialsList = document.querySelector("[data-testimonials-list]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
// const quoteIcon = document.querySelector("[data-quote_icon]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function () {
  modalContainer.classList.toggle("active");
  overlay.classList.toggle("active");
}


const populateTestimonialModal = (card) => {
  const avatar = card.querySelector("[data-testimonials-avatar]");
  if (avatar) {
    modalImg.src = avatar.src;
    modalImg.alt = avatar.alt;
  }
  modalTitle.innerHTML = card.querySelector("[data-testimonials-title]")?.innerHTML || "";
  modalText.innerHTML = card.querySelector("[data-testimonials-text]")?.innerHTML || "";
  testimonialsModalFunc();
};

if (testimonialsList) {
  testimonialsList.addEventListener("click", (event) => {
    const card = event.target.closest("[data-testimonials-item]");
    if (!card) return;
    populateTestimonialModal(card);
  });

  testimonialsList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const card = event.target.closest("[data-testimonials-item]");
    if (!card) return;
    event.preventDefault();
    populateTestimonialModal(card);
  });
}

// add click event to modal close button
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);



// custom select & filter variables
const select = document.querySelector("[data-select]");
const selectList = document.querySelector("[data-select-list]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterList = document.querySelector("[data-filter-list]");

if (select) {
  select.addEventListener("click", function () { elementToggleFunc(this); });
}

const filterFunc = (rawValue) => {
  const normalized = (rawValue || "all").toLowerCase();
  const items = document.querySelectorAll("[data-filter-item]");
  items.forEach(item => {
    const category = (item.dataset.category || "").toLowerCase();
    if (normalized === "all" || normalized === category) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
};

let lastClickedBtn = filterList ? filterList.querySelector("[data-filter-btn].active") : null;

const setActiveFilterButton = (button) => {
  if (lastClickedBtn && lastClickedBtn !== button) {
    lastClickedBtn.classList.remove("active");
  }
  if (button) {
    button.classList.add("active");
  }
  lastClickedBtn = button || null;
};

const syncSelectValueToActive = () => {
  if (!selectValue) return;
  if (lastClickedBtn) {
    selectValue.innerText = lastClickedBtn.textContent.trim();
  } else {
    selectValue.innerText = "Select category";
  }
};

if (filterList) {
  filterList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter-btn]");
    if (!button) return;
    const value = (button.dataset.filterValue || button.textContent || "").trim().toLowerCase();
    filterFunc(value || "all");
    setActiveFilterButton(button);
    if (selectValue) {
      selectValue.innerText = button.textContent.trim();
    }
  });
}

if (selectList) {
  selectList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-select-item]");
    if (!button) return;
    event.preventDefault();
    const value = (button.dataset.filterValue || button.textContent || "").trim().toLowerCase();
    const label = button.textContent.trim();
    if (selectValue) {
      selectValue.innerText = label;
    }
    filterFunc(value || "all");
    if (filterList) {
      const match = filterList.querySelector(`[data-filter-btn][data-filter-value="${button.dataset.filterValue || value}"]`);
      setActiveFilterButton(match || null);
    }
    if (select) {
      elementToggleFunc(select);
    }
  });
}

syncSelectValueToActive();
filterFunc((lastClickedBtn?.dataset.filterValue || lastClickedBtn?.textContent || "all"));

document.addEventListener("site-data-updated", () => {
  lastClickedBtn = filterList ? filterList.querySelector("[data-filter-btn].active") : null;
  syncSelectValueToActive();
  const activeValue = (lastClickedBtn?.dataset.filterValue || lastClickedBtn?.textContent || "all").trim().toLowerCase();
  filterFunc(activeValue || "all");
});



// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {

    // check form validation
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }

  });
}



// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {

    for (let i = 0; i < pages.length; i++) {
      if (this.innerHTML.toLowerCase() === pages[i].dataset.page) {
        pages[i].classList.add("active");
        navigationLinks[i].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        pages[i].classList.remove("active");
        navigationLinks[i].classList.remove("active");
      }
    }

  });
}

/* ========= Portfolio Modal (Gallery) ========= */
const portfolioModalContainer = document.querySelector("[data-portfolio-modal-container]");
const portfolioOverlay = document.querySelector("[data-portfolio-overlay]");
const portfolioCloseBtn = document.querySelector("[data-portfolio-modal-close-btn]");
const portfolioModalTitle = document.querySelector("[data-portfolio-modal-title]");
const portfolioModalMain = document.querySelector("[data-portfolio-modal-main]");
const portfolioModalThumbs = document.querySelector("[data-portfolio-modal-thumbs]");
const portfolioModalDesc = document.querySelector("[data-portfolio-modal-desc]");

// helper: open/close
const togglePortfolioModal = () => {
  portfolioModalContainer.classList.toggle("active");
  portfolioOverlay.classList.toggle("active");
};

// Build media element (image or video)
function buildMediaEl(type, src, altText) {
  if (type === "video") {
    const v = document.createElement("video");
    v.src = src;
    v.controls = true;
    v.playsInline = true;
    if (altText) {
      v.setAttribute("aria-label", altText);
    }
    return v;
  } else {
    const img = document.createElement("img");
    img.src = src;
    img.alt = altText || "project media";
    img.loading = "lazy";
    return img;
  }
}

// Render gallery into modal
function renderPortfolioGallery(title, desc, mediaList) {
  portfolioModalTitle.textContent = title || "Project";
  portfolioModalDesc.innerHTML = desc || "";

  // clear containers
  portfolioModalMain.innerHTML = "";
  portfolioModalThumbs.innerHTML = "";

  if (!mediaList || mediaList.length === 0) {
    const empty = document.createElement("div");
    empty.textContent = "No media available for this project.";
    portfolioModalMain.appendChild(empty);
    return;
  }

  // set main
  const first = mediaList[0];
  portfolioModalMain.appendChild(buildMediaEl(first.type, first.src, first.alt));

  // thumbs
  mediaList.forEach((m, idx) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.setAttribute("type", "button");
    btn.addEventListener("click", () => {
      portfolioModalMain.innerHTML = "";
      portfolioModalMain.appendChild(buildMediaEl(m.type, m.src, m.alt));
    });
    if (m.type === "image") {
      const thumb = document.createElement("img");
      thumb.src = m.src;
      thumb.alt = m.alt || "thumb";
      btn.appendChild(thumb);
    } else {
      // simple placeholder for video thumb: use <img> if poster available later
      const thumb = document.createElement("img");
      thumb.src = m.poster || m.src; // browsers may not show video thumb from mp4; image poster recommended
      btn.appendChild(thumb);
    }
    li.appendChild(btn);
    portfolioModalThumbs.appendChild(li);
  });
}

// Extract media list from a project-item element
function extractMediaFromProject(projectItem) {
  const media = [];
  // 1) Use main figure image if present
  const img = projectItem.querySelector(".project-img img");
  if (img && img.getAttribute("src")) {
    const src = img.getAttribute("src").trim();
    if (src) media.push({ type: "image", src, alt: img.getAttribute("alt") || "" });
  }
  // 2) Read hidden extras: .project-media > [data-type][data-src]
  const extras = projectItem.querySelectorAll(".project-media [data-src]");
  extras.forEach(el => {
    const type = (el.getAttribute("data-type") || "image").toLowerCase();
    const src = el.getAttribute("data-src") || "";
    if (src) {
      media.push({
        type,
        src,
        alt: el.getAttribute("data-alt") || "",
        poster: el.getAttribute("data-poster") || ""
      });
    }
  });
  return media;
}

const projectList = document.querySelector("[data-project-list]") || document.querySelector(".projects .project-list");

const activateProject = (item, ev) => {
  if (ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }

  const link = item.dataset.projectLink;
  if (link) {
    window.open(link, "_blank", "noopener");
  }

  const media = extractMediaFromProject(item);
  if (media.length === 0) return;

  const titleEl = item.querySelector(".project-title");
  const descEl = item.querySelector(".project-desc");
  const title = titleEl ? titleEl.textContent.trim() : "Project";
  const desc = descEl ? descEl.innerHTML : "";

  renderPortfolioGallery(title, desc, media);
  togglePortfolioModal();
};

if (projectList) {
  projectList.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-portfolio-trigger]");
    if (!trigger) return;
    const item = trigger.closest(".project-item");
    if (!item) return;
    activateProject(item, event);
  });

  projectList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const trigger = event.target.closest("[data-portfolio-trigger]");
    if (!trigger) return;
    const item = trigger.closest(".project-item");
    if (!item) return;
    activateProject(item, event);
  });
}

// Close handlers
portfolioCloseBtn.addEventListener("click", togglePortfolioModal);
portfolioOverlay.addEventListener("click", togglePortfolioModal);

/* ========= Certificate Modal (Gallery) ========= */

const certificateModalContainer = document.querySelector("[data-certificate-modal-container]");
const certificateOverlay = document.querySelector("[data-certificate-overlay]");
const certificateCloseBtn = document.querySelector("[data-certificate-modal-close-btn]");
const certificateModalTitle = document.querySelector("[data-certificate-modal-title]");
const certificateModalMain = document.querySelector("[data-certificate-modal-main]");
const certificateModalDesc = document.querySelector("[data-certificate-modal-desc]");

// helper: open/close
const toggleCertificateModal = () => {
  certificateModalContainer.classList.toggle("active");
  certificateOverlay.classList.toggle("active");
};

// Render gallery into modal
function renderCertificateGallery(title, desc, media) {
  certificateModalTitle.textContent = title || "Project";
  certificateModalDesc.innerHTML = desc || "";

  // clear containers
  certificateModalMain.innerHTML = "";

  // set main
  const first = media;
  if (!first || !first.src) {
    const empty = document.createElement("div");
    empty.textContent = "No media available for this certificate.";
    certificateModalMain.appendChild(empty);
    return;
  }

  certificateModalMain.appendChild(buildMediaEl(first.type || "image", first.src, first.alt));
}

const certificateList = document.querySelector("[data-certificates-list]");

const activateCertificates = (item, ev) => {
  if (ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }

  const link = item.dataset.certificateLink;
  if (link) {
    window.open(link, "_blank", "noopener");
  }

  const titleEl = item.querySelector(".certificate-title");
  const descEl = item.querySelector(".certificate-desc");
  const title = titleEl ? titleEl.textContent.trim() : "Certificate";
  const desc = descEl ? descEl.innerHTML : "";

  renderCertificateGallery(title, desc, {
    type: "image",
    src: item.dataset.certificateSrc,
    alt: item.dataset.certificateAlt
  });
  toggleCertificateModal();
};

if (certificateList && certificateModalContainer && certificateOverlay && certificateCloseBtn) {
  certificateList.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-certificate-trigger]");
    if (!trigger) return;
    const item = trigger.closest(".certificate-item");
    if (!item) return;
    activateCertificates(item, event);
  });

  certificateList.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const trigger = event.target.closest("[data-certificate-trigger]");
    if (!trigger) return;
    const item = trigger.closest(".certificate-item");
    if (!item) return;
    activateCertificates(item, event);
  });

  // Close handlers
  certificateCloseBtn.addEventListener("click", toggleCertificateModal);
  certificateOverlay.addEventListener("click", toggleCertificateModal);
}
