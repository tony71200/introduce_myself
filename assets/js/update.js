(function () {
  const DATA_URL = "./data.json";

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
    if (groups.length === 0) return;
    const firstGroup = groups[0];
    const yearValue = coerceString(firstGroup.year || firstGroup.value);
    const yearEl = document.querySelector("[data-publication-year]");
    setText(yearEl, (yearValue || "").trim());

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

  const applyPortfolio = (data) => {
    const projects = Array.isArray(data?.portfolio?.projects) ? data.portfolio.projects : [];
    projects.forEach(project => {
      const index = coerceString(project.index);
      const item = document.querySelector(`[data-project-index="${index}"]`);
      if (!item) return;
      const category = coerceString(project.category);
      if (category) {
        item.dataset.category = category.toLowerCase();
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
    applyContact(payload);
    applyFooter(payload);
    document.dispatchEvent(new Event("site-data-updated"));
  };

  const loadData = () => {
    fetch(DATA_URL, { cache: "no-cache" })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch ${DATA_URL}: ${response.status}`);
        }
        return response.json();
      })
      .then(applyAll)
      .catch(err => {
        console.error("Unable to load site data", err);
      });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadData, { once: true });
  } else {
    loadData();
  }
})();
