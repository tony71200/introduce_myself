'use strict';



// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });



// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
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


// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {

  testimonialsItem[i].addEventListener("click", function () {

    modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
    modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
    // quoteIcon.src = this.querySelector("[data-testimonials-quote_icon]").src;
    // quoteIcon.alt = this.querySelector("[data-testimonials-quote_icon]").alt;
    modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
    modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;

    testimonialsModalFunc();

  });

}

// add click event to modal close button
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);



// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

select.addEventListener("click", function () { elementToggleFunc(this); });

// add event in all select items
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(selectedValue);

  });
}

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {

  for (let i = 0; i < filterItems.length; i++) {

    if (selectedValue === "all") {
      filterItems[i].classList.add("active");
    } else if (selectedValue === filterItems[i].dataset.category) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }

  }

}

// add event in all filter button items for large screen
let lastClickedBtn = filterBtn[0];

for (let i = 0; i < filterBtn.length; i++) {

  filterBtn[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    filterFunc(selectedValue);

    lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;

  });

}



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
function buildMediaEl(type, src) {
  if (type === "video") {
    const v = document.createElement("video");
    v.src = src;
    v.controls = true;
    v.playsInline = true;
    return v;
  } else {
    const img = document.createElement("img");
    img.src = src;
    img.alt = "project media";
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
  portfolioModalMain.appendChild(buildMediaEl(first.type, first.src));

  // thumbs
  mediaList.forEach((m, idx) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.setAttribute("type", "button");
    btn.addEventListener("click", () => {
      portfolioModalMain.innerHTML = "";
      portfolioModalMain.appendChild(buildMediaEl(m.type, m.src));
    });
    if (m.type === "image") {
      const thumb = document.createElement("img");
      thumb.src = m.src;
      thumb.alt = "thumb";
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
    if (src) media.push({ type: "image", src });
  }
  // 2) Read hidden extras: .project-media > [data-type][data-src]
  const extras = projectItem.querySelectorAll(".project-media [data-src]");
  extras.forEach(el => {
    const type = (el.getAttribute("data-type") || "image").toLowerCase();
    const src = el.getAttribute("data-src") || "";
    if (src) media.push({ type, src });
  });
  return media;
}

// Attach click listeners to portfolio items
const projectItems = document.querySelectorAll(".projects .project-item");
projectItems.forEach(item => {
  item.addEventListener("click", (ev) => {
    // prevent following any nested <a>
    ev.preventDefault();
    ev.stopPropagation();

    const titleEl = item.querySelector(".project-title");
    const descEl = item.querySelector(".project-desc"); // optional: user may add .project-desc hidden in HTML
    const title = titleEl ? titleEl.textContent.trim() : "Project";
    const desc = descEl ? descEl.innerHTML : "";

    const media = extractMediaFromProject(item);
    renderPortfolioGallery(title, desc, media);
    togglePortfolioModal();
  });

  // Also cancel anchor default if any
  const a = item.querySelector("a");
  if (a) {
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
    });
  }
});

// Close handlers
portfolioCloseBtn.addEventListener("click", togglePortfolioModal);
portfolioOverlay.addEventListener("click", togglePortfolioModal);