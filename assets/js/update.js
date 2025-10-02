(function () {
  const scriptTag = document.currentScript || document.querySelector("script[data-json-url]");
  const resolveUrl = (value, base) => {
    if (!value) return "";
    try {
      return new URL(value, base).href;
    } catch (error) {
      return value;
    }
  };
  const pageUrl = window.location.href;
  const scriptSrc = scriptTag?.src || "";
  const declaredUrl = scriptTag?.getAttribute("data-json-url");
  let DATA_URL = declaredUrl
    ? resolveUrl(declaredUrl, pageUrl)
    : scriptSrc
    ? resolveUrl("../../data.json", scriptSrc)
    : resolveUrl("./data.json", pageUrl);

  const templateCache = new Map();
  const ensureTemplate = (selector) => {
    if (!templateCache.has(selector)) {
      const template = document.querySelector(selector);
      if (!template || !template.content || !template.content.firstElementChild) {
        templateCache.set(selector, null);
      } else {
        templateCache.set(selector, template.content.firstElementChild);
      }
    }
    return templateCache.get(selector);
  };
  const getTemplateClone = (selector) => {
    const root = ensureTemplate(selector);
    return root ? root.cloneNode(true) : null;
  };

  const clearChildren = (node) => {
    if (node) {
      node.innerHTML = "";
    }
  };

  const coerceString = (value, fallback = "") => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === "string") return value;
    return String(value);
  };

  const setText = (element, value) => {
    if (element && typeof value === "string") {
      element.textContent = value;
    }
  };

  const setHTML = (element, value) => {
    if (element && typeof value === "string") {
      element.innerHTML = value;
    }
  };

  const applyMeta = (data) => {
    const metaTitle = coerceString(data?.meta?.title);
    if (metaTitle) {
      document.title = metaTitle;
      const titleEl = document.querySelector("[data-site-title]");
      setText(titleEl, metaTitle);
    }
  };

  const applyProfile = (data) => {
    const profile = data?.profile;
    if (!profile) return;

    const avatarData = profile.avatar;
    if (avatarData) {
      const avatarEl = document.querySelector("[data-profile-avatar]");
      if (avatarEl) {
        const src = coerceString(avatarData.src);
        const alt = coerceString(avatarData.alt);
        if (src) avatarEl.setAttribute("src", src);
        if (alt) avatarEl.setAttribute("alt", alt);
      }
    }

    const nameEl = document.querySelector("[data-profile-name]");
    setText(nameEl, coerceString(profile.name));

    const titlesContainer = document.querySelector("[data-profile-titles]");
    if (titlesContainer) {
      titlesContainer.innerHTML = "";
      const titles = Array.isArray(profile.titles) ? profile.titles : [];
      titles.forEach(titleValue => {
        const value = coerceString(titleValue).trim();
        if (!value) return;
        const p = document.createElement("p");
        p.className = "title";
        p.textContent = value;
        titlesContainer.appendChild(p);
      });
    }

    const contacts = profile.contacts && typeof profile.contacts === "object" ? profile.contacts : {};
    Object.entries(contacts).forEach(([key, contactData]) => {
      const li = document.querySelector(`[data-contact-key="${key}"]`);
      if (!li) return;
      const label = coerceString(contactData.label);
      const display = coerceString(contactData.display);
      const href = coerceString(contactData.href);
      const titleEl = li.querySelector(".contact-title");
      setText(titleEl, label);
      const linkEl = li.querySelector("a.contact-link");
      if (linkEl) {
        if (href) linkEl.setAttribute("href", href);
        setText(linkEl, display || href);
      }
      const timeEl = li.querySelector("time");
      if (timeEl) {
        const datetime = coerceString(contactData.datetime);
        if (datetime) timeEl.setAttribute("datetime", datetime);
        timeEl.textContent = display || datetime;
      }
      const addressEl = li.querySelector("address");
      if (addressEl) {
        setText(addressEl, display);
      }
    });

    const socials = profile.socials && typeof profile.socials === "object" ? profile.socials : {};
    Object.entries(socials).forEach(([key, urlValue]) => {
      const url = coerceString(urlValue).trim();
      if (!key || !url) return;
      const anchor = document.querySelector(`[data-social-key="${key}"]`);
      if (anchor) {
        anchor.setAttribute("href", url);
      }
    });
  };

  const applyAbout = (data) => {
    const paragraphs = Array.isArray(data?.about?.paragraphs) ? data.about.paragraphs : [];
    paragraphs.forEach(paragraph => {
      const index = coerceString(paragraph.index);
      const target = document.querySelector(`[data-about-paragraph="${index}"]`);
      if (target) {
        const html = coerceString(paragraph.html).trim();
        setHTML(target, html);
      }
    });

    const services = Array.isArray(data?.about?.services) ? data.about.services : [];
    services.forEach(service => {
      const index = coerceString(service.index);
      const wrapper = document.querySelector(`[data-service-index="${index}"]`);
      if (!wrapper) return;
      const icon = wrapper.querySelector("[data-service-icon]");
      const title = wrapper.querySelector("[data-service-title]");
      const text = wrapper.querySelector("[data-service-text]");
      const iconNode = service.icon;
      if (icon && iconNode) {
        const src = coerceString(iconNode.src);
        const alt = coerceString(iconNode.alt);
        if (src) icon.setAttribute("src", src);
        if (alt) icon.setAttribute("alt", alt);
      }
      setText(title, coerceString(service.title));
      setHTML(text, coerceString(service.descriptionHtml));
    });

    const testimonials = Array.isArray(data?.about?.testimonials) ? data.about.testimonials : [];
    const testimonialsList = document.querySelector("[data-testimonials-list]");
    if (testimonialsList && ensureTemplate("#testimonial-item-template")) {
      clearChildren(testimonialsList);
      testimonials.forEach((testimonial, idx) => {
        const item = getTemplateClone("#testimonial-item-template");
        if (!item) return;
        const indexValue = coerceString(testimonial.index || idx + 1);
        if (indexValue) {
          item.dataset.testimonialIndex = indexValue;
        }
        const card = item.querySelector("[data-testimonials-item]");
        if (card && indexValue) {
          card.dataset.testimonialIndex = indexValue;
        }
        const name = coerceString(testimonial.name);
        const quoteHtml = coerceString(testimonial.quoteHtml);
        const avatarData = testimonial.avatar;
        const titleEl = item.querySelector("[data-testimonials-title]");
        const textEl = item.querySelector("[data-testimonials-text]");
        setText(titleEl, name);
        setHTML(textEl, quoteHtml);
        if (avatarData) {
          const avatarEl = item.querySelector("[data-testimonials-avatar]");
          if (avatarEl) {
            const src = coerceString(avatarData.src);
            const alt = coerceString(avatarData.alt);
            if (src) avatarEl.setAttribute("src", src);
            if (alt) avatarEl.setAttribute("alt", alt);
          }
        }
        testimonialsList.appendChild(item);
      });
    } else {
      testimonials.forEach(testimonial => {
        const index = coerceString(testimonial.index);
        const item = document.querySelector(`[data-testimonial-index="${index}"]`);
        if (!item) return;
        const name = coerceString(testimonial.name);
        const quoteHtml = coerceString(testimonial.quoteHtml);
        const avatarData = testimonial.avatar;
        const titleEl = item.querySelector("[data-testimonials-title]");
        const textEl = item.querySelector("[data-testimonials-text]");
        setText(titleEl, name);
        if (quoteHtml) {
          setHTML(textEl, quoteHtml);
        }
        if (avatarData) {
          const avatarEl = item.querySelector("[data-testimonials-avatar]");
          if (avatarEl) {
            const src = coerceString(avatarData.src);
            const alt = coerceString(avatarData.alt);
            if (src) avatarEl.setAttribute("src", src);
            if (alt) avatarEl.setAttribute("alt", alt);
          }
        }
      });
    }
  };

  const applyResume = (data) => {
    const experiences = Array.isArray(data?.resume?.experiences) ? data.resume.experiences : [];
    experiences.forEach(itemNode => {
      const index = coerceString(itemNode.index);
      const li = document.querySelector(`[data-experience-index="${index}"]`);
      if (!li) return;
      setText(li.querySelector("[data-experience-company]"), coerceString(itemNode.company));
      setText(li.querySelector("[data-experience-role]"), coerceString(itemNode.role));
      setText(li.querySelector("[data-experience-dates]"), coerceString(itemNode.dates));
      setHTML(li.querySelector("[data-experience-summary]"), coerceString(itemNode.summaryHtml));
    });

    const education = Array.isArray(data?.resume?.education) ? data.resume.education : [];
    education.forEach(itemNode => {
      const index = coerceString(itemNode.index);
      const li = document.querySelector(`[data-education-index="${index}"]`);
      if (!li) return;
      setText(li.querySelector("[data-education-school]"), coerceString(itemNode.school));
      setText(li.querySelector("[data-education-dates]"), coerceString(itemNode.dates));
      setHTML(li.querySelector("[data-education-summary]"), coerceString(itemNode.summaryHtml));
    });
  };

  const applyPublications = (data) => {
    const groups = Array.isArray(data?.publications) ? data.publications : [];
    const yearEl = document.querySelector("[data-publication-year]");
    if (yearEl && groups.length > 0) {
      const firstGroup = groups[0];
      const yearValue = coerceString(firstGroup.year || firstGroup.value);
      setText(yearEl, (yearValue || "").trim());
    }

    const listEl = document.querySelector("[data-publication-list]");
    if (listEl && ensureTemplate("#publication-item-template")) {
      clearChildren(listEl);
      groups.forEach((group, groupIndex) => {
        const items = Array.isArray(group.items) ? group.items : [];
        items.forEach((pub, itemIndex) => {
          const node = getTemplateClone("#publication-item-template");
          if (!node) return;
          const indexValue = coerceString(pub.index || `${groupIndex + 1}-${itemIndex + 1}`);
          if (indexValue) {
            node.dataset.publicationIndex = indexValue;
          }
          const linkEl = node.querySelector("[data-publication-link]");
          const titleText = coerceString(pub.title);
          const linkHref = coerceString(pub.link);
          if (linkEl) {
            if (linkHref) {
              linkEl.setAttribute("href", linkHref);
            } else {
              linkEl.removeAttribute("href");
            }
            linkEl.textContent = titleText || linkHref || "";
          }
          setHTML(node.querySelector("[data-publication-authors]"), coerceString(pub.authorsHtml));
          setText(node.querySelector("[data-publication-venue]"), coerceString(pub.venue));
          setText(node.querySelector("[data-publication-summary]"), coerceString(pub.summary));
          listEl.appendChild(node);
        });
      });
      return;
    }

    groups.forEach(group => {
      const items = Array.isArray(group.items) ? group.items : [];
      items.forEach(pub => {
        const index = coerceString(pub.index);
        const wrapper = document.querySelector(`[data-publication-index="${index}"]`);
        if (!wrapper) return;
        const titleEl = wrapper.querySelector("[data-publication-title]");
        const linkEl = wrapper.querySelector("[data-publication-link]");
        const authorsEl = wrapper.querySelector("[data-publication-authors]");
        const venueEl = wrapper.querySelector("[data-publication-venue]");
        const summaryEl = wrapper.querySelector("[data-publication-summary]");
        const titleText = coerceString(pub.title);
        if (titleEl) setText(titleEl, titleText);
        if (linkEl) {
          const link = coerceString(pub.link);
          if (link) linkEl.setAttribute("href", link);
          linkEl.textContent = titleText || link || linkEl.textContent;
        }
        setHTML(authorsEl, coerceString(pub.authorsHtml));
        setText(venueEl, coerceString(pub.venue));
        setText(summaryEl, coerceString(pub.summary));
      });
    });
  };

  const ensureProjectMediaContainer = (projectItem) => {
    const host = projectItem.querySelector(".project-card") || projectItem;
    let container = host.querySelector(".project-media");
    if (!container) {
      container = document.createElement("div");
      container.className = "project-media";
      container.hidden = true;
      host.appendChild(container);
    }
    container.innerHTML = "";
    return container;
  };

  const updatePortfolioFilters = (categories) => {
    const filterList = document.querySelector("[data-filter-list]");
    const selectList = document.querySelector("[data-select-list]");
    const selectValueEl = document.querySelector("[data-selecct-value]");
    const entries = [["all", "All"], ...Array.from(categories.entries())];

    if (filterList) {
      clearChildren(filterList);
      entries.forEach(([key, label], index) => {
        const li = document.createElement("li");
        li.className = "filter-item";
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("data-filter-btn", "");
        button.dataset.filterValue = key;
        button.textContent = label;
        if (index === 0) {
          button.classList.add("active");
        }
        li.appendChild(button);
        filterList.appendChild(li);
      });
    }

    if (selectList) {
      clearChildren(selectList);
      entries.forEach(([key, label]) => {
        const li = document.createElement("li");
        li.className = "select-item";
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("data-select-item", "");
        button.dataset.filterValue = key;
        button.textContent = label;
        li.appendChild(button);
        selectList.appendChild(li);
      });
    }

    if (selectValueEl && entries.length > 0) {
      selectValueEl.textContent = entries[0][1];
    }
  };

  const applyPortfolio = (data) => {
    const projects = Array.isArray(data?.portfolio?.projects) ? data.portfolio.projects : [];
    const listEl = document.querySelector("[data-project-list]");
    const categories = new Map();

    if (listEl && ensureTemplate("#project-item-template")) {
      clearChildren(listEl);
      projects.forEach((project, idx) => {
        const item = getTemplateClone("#project-item-template");
        if (!item) return;
        const indexValue = coerceString(project.index || idx + 1);
        if (indexValue) {
          item.dataset.projectIndex = indexValue;
        }
        const card = item.querySelector(".project-card");
        if (card && indexValue) {
          card.dataset.projectIndex = indexValue;
        }
        const categoryLabel = coerceString(project.category);
        if (categoryLabel) {
          const key = categoryLabel.toLowerCase();
          item.dataset.category = key;
          const categoryEl = item.querySelector("[data-project-category]");
          setText(categoryEl, categoryLabel);
          if (!categories.has(key)) {
            categories.set(key, categoryLabel);
          }
        }
        const link = coerceString(project.link);
        if (link) {
          item.dataset.projectLink = link;
        }
        setText(item.querySelector("[data-project-title]"), coerceString(project.title));
        setHTML(item.querySelector("[data-project-description]"), coerceString(project.descriptionHtml));
        const thumb = project.thumbnail;
        if (thumb) {
          const img = item.querySelector("[data-project-image]");
          if (img) {
            const src = coerceString(thumb.src);
            const alt = coerceString(thumb.alt);
            if (src) img.setAttribute("src", src);
            if (alt) img.setAttribute("alt", alt);
          }
        }
        const mediaContainer = ensureProjectMediaContainer(item);
        const mediaItems = Array.isArray(project.media) ? project.media : [];
        mediaItems.forEach(media => {
          const type = coerceString(media.type || "image").toLowerCase();
          const src = coerceString(media.src);
          if (!src) return;
          const placeholder = document.createElement("span");
          placeholder.dataset.type = type;
          placeholder.dataset.src = src;
          const poster = coerceString(media.poster);
          if (poster) {
            placeholder.dataset.poster = poster;
          }
          const alt = coerceString(media.alt);
          if (alt) {
            placeholder.dataset.alt = alt;
          }
          mediaContainer.appendChild(placeholder);
        });
        listEl.appendChild(item);
      });
      updatePortfolioFilters(categories);
      return;
    }

    projects.forEach(project => {
      const index = coerceString(project.index);
      const item = document.querySelector(`[data-project-index="${index}"]`);
      if (!item) return;
      const category = coerceString(project.category);
      if (category) {
        const key = category.toLowerCase();
        item.dataset.category = key;
        if (!categories.has(key)) {
          categories.set(key, category);
        }
      }
      const link = coerceString(project.link);
      if (link) {
        item.dataset.projectLink = link;
      } else {
        delete item.dataset.projectLink;
      }
      const title = coerceString(project.title);
      setText(item.querySelector("[data-project-title]"), title);
      const categoryEl = item.querySelector("[data-project-category]");
      if (categoryEl) {
        const existing = categoryEl.textContent || "";
        const nextValue = category || existing;
        setText(categoryEl, nextValue);
      }
      setHTML(item.querySelector("[data-project-description]"), coerceString(project.descriptionHtml));
      const thumb = project.thumbnail;
      if (thumb) {
        const img = item.querySelector("[data-project-image]");
        if (img) {
          const src = coerceString(thumb.src);
          const alt = coerceString(thumb.alt);
          if (src) img.setAttribute("src", src);
          if (alt) img.setAttribute("alt", alt);
        }
      }

      const mediaContainer = ensureProjectMediaContainer(item);
      const mediaItems = Array.isArray(project.media) ? project.media : [];
      mediaItems.forEach(media => {
        const type = coerceString(media.type || "image").toLowerCase();
        const src = coerceString(media.src);
        if (!src) return;
        const placeholder = document.createElement("span");
        placeholder.dataset.type = type;
        placeholder.dataset.src = src;
        const poster = coerceString(media.poster);
        if (poster) {
          placeholder.dataset.poster = poster;
        }
        const alt = coerceString(media.alt);
        if (alt) {
          placeholder.dataset.alt = alt;
        }
        mediaContainer.appendChild(placeholder);
      });
    });

    updatePortfolioFilters(categories);
  };


  const applyCertificates = (data) => {
    const forms = Array.isArray(data?.certificates?.forms) ? data.certificates.forms : [];
    const listEl = document.querySelector("[data-certificates-list]");

    if (!listEl || !ensureTemplate("#certificate-item-template")) return;
    clearChildren(listEl);

    forms.forEach((form, idx) => {
      const item = getTemplateClone("#certificate-item-template");
      if (!item) return;
      const indexValue = coerceString(form.index || idx + 1);
      if (indexValue) {
        item.dataset.certificateIndex = indexValue;
      }
      const card = item.querySelector(".certificate-card");
      if (card && indexValue) {
        card.dataset.certificateIndex = indexValue;
      }
      const link = coerceString(form.link);
      if (link) {
        item.dataset.certificateLink = link;
      }
      
      const title = coerceString(form.title);
      setText(item.querySelector("[data-certificate-title]"), title);

      const issuer = coerceString(form.from || form.category);
      setText(item.querySelector("[data-certificate-category]"), issuer);

      setHTML(item.querySelector("[data-certificate-description]"), coerceString(form.descriptionHtml));

      const image = form?.image || form?.thumbnail || {};
      const imgEl = item.querySelector("[data-certificate-image]");
      const src = coerceString(image.src);
      const alt = coerceString(image.alt) || title || "Certificate";

      if (imgEl) {
        if (src) {
          imgEl.setAttribute("src", src);
          item.dataset.certificateSrc = src;
          if (card) {
            card.dataset.certificateSrc = src;
          }
        }
      }

      if (alt) {
        if (imgEl) {
          imgEl.setAttribute("alt", alt);
        }
        item.dataset.certificateAlt = alt;
        if (card) {
          card.dataset.certificateAlt = alt;
        }
      }

      listEl.appendChild(item);
    });
  };

  const applyContact = (data) => {
    const contact = data?.contact;
    if (!contact) return;
    const mapSrc = coerceString(contact.map?.src);
    const mapCaption = coerceString(contact.map?.caption);
    const iframe = document.querySelector("[data-map-embed]");
    if (iframe && mapSrc) iframe.setAttribute("src", mapSrc);
    const captionEl = document.querySelector("[data-map-caption]");
    setText(captionEl, mapCaption);

    const emailHref = coerceString(contact.email?.href);
    const emailLabel = coerceString(contact.email?.label);
    const emailBtn = document.querySelector("[data-contact-email]");
    if (emailBtn) {
      if (emailHref) emailBtn.setAttribute("href", emailHref);
      const labelSpan = emailBtn.querySelector("span");
      const current = labelSpan ? labelSpan.textContent : "";
      setText(labelSpan, emailLabel || current || "");
    }

    const socials = contact.socials && typeof contact.socials === "object" ? contact.socials : {};
    Object.entries(socials).forEach(([key, urlValue]) => {
      const url = coerceString(urlValue).trim();
      if (!key || !url) return;
      const anchor = document.querySelector(`[data-contact-social="${key}"]`);
      if (anchor) anchor.setAttribute("href", url);
    });
  };

  const applyFooter = (data) => {
    const copy = coerceString(data?.footer?.copyrightHtml);
    if (!copy) return;
    const footerEl = document.querySelector("[data-footer-copy]");
    setHTML(footerEl, copy);
  };

  const applyAll = (payload) => {
    applyMeta(payload);
    applyProfile(payload);
    applyAbout(payload);
    applyResume(payload);
    applyPublications(payload);
    applyPortfolio(payload);
    applyCertificates(payload);
    applyContact(payload);
    applyFooter(payload);
    document.dispatchEvent(new Event("site-data-updated"));
  };

  const fetchJson = async (url) => {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }
    return response.json();
  };

  const loadJsonViaIframe = (url) => new Promise((resolve, reject) => {
    if (!document.body) {
      reject(new Error("Document body is not available for iframe fallback."));
      return;
    }
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.setAttribute("aria-hidden", "true");
    const cleanup = () => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };
    iframe.addEventListener("load", () => {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!doc) throw new Error("Missing iframe document");
        const text = doc.body ? doc.body.textContent : "";
        if (!text) throw new Error("Empty response body");
        const parsed = JSON.parse(text);
        cleanup();
        resolve(parsed);
      } catch (error) {
        cleanup();
        reject(error);
      }
    });
    iframe.addEventListener("error", () => {
      cleanup();
      reject(new Error(`Failed to load ${url} via iframe`));
    });
    iframe.src = url;
    document.body.appendChild(iframe);
  });

  const loadData = async () => {
    try {
      const payload = await fetchJson(DATA_URL);
      applyAll(payload);
      return;
    } catch (primaryError) {
      if (window.location.protocol === "file:" && document.body) {
        try {
          console.warn(`fetch(${DATA_URL}) failed under file://; attempting iframe fallback.`, primaryError);
          const payload = await loadJsonViaIframe(DATA_URL);
          applyAll(payload);
          return;
        } catch (fallbackError) {
          console.error("Iframe fallback for data.json failed", fallbackError);
        }
      }
      console.error("Unable to load site data", primaryError);
      if (window.location.protocol === "file:") {
        console.error("Tip: Browsers often block fetch() on file URLs. Please run a local HTTP server (e.g. `python -m http.server`) or host the site via HTTP/S.");
      }
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadData, { once: true });
  } else {
    loadData();
  }
})();
