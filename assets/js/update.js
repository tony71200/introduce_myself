(function () {
  const DATA_URL = "./data.xml";

  const parseXml = (xmlText) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, "application/xml");
    const parsererror = doc.querySelector("parsererror");
    if (parsererror) {
      throw new Error(parsererror.textContent || "Invalid XML format");
    }
    return doc;
  };

  const getText = (node, selector, fallback = "") => {
    if (!node) return fallback;
    const target = selector ? node.querySelector(selector) : node;
    if (!target) return fallback;
    return (target.textContent || "").trim();
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

  const applyMeta = (doc) => {
    const metaTitle = getText(doc, "meta > title", "");
    if (metaTitle) {
      document.title = metaTitle;
      const titleEl = document.querySelector("[data-site-title]");
      setText(titleEl, metaTitle);
    }
  };

  const applyProfile = (doc) => {
    const profile = doc.querySelector("profile");
    if (!profile) return;

    const avatarData = profile.querySelector("avatar");
    if (avatarData) {
      const avatarEl = document.querySelector("[data-profile-avatar]");
      if (avatarEl) {
        const src = avatarData.getAttribute("src");
        const alt = avatarData.getAttribute("alt");
        if (src) avatarEl.setAttribute("src", src);
        if (alt) avatarEl.setAttribute("alt", alt);
      }
    }

    const nameEl = document.querySelector("[data-profile-name]");
    setText(nameEl, getText(profile, "name"));

    const titlesContainer = document.querySelector("[data-profile-titles]");
    if (titlesContainer) {
      titlesContainer.innerHTML = "";
      profile.querySelectorAll("titles > title").forEach(titleNode => {
        const value = (titleNode.textContent || "").trim();
        if (!value) return;
        const p = document.createElement("p");
        p.className = "title";
        p.textContent = value;
        titlesContainer.appendChild(p);
      });
    }

    const contacts = {};
    profile.querySelectorAll("contacts > contact").forEach(contact => {
      const key = contact.getAttribute("key");
      if (!key) return;
      contacts[key] = contact;
    });
    Object.entries(contacts).forEach(([key, data]) => {
      const li = document.querySelector(`[data-contact-key="${key}"]`);
      if (!li) return;
      const label = getText(data, "label");
      const display = getText(data, "display");
      const href = getText(data, "href");
      const titleEl = li.querySelector(".contact-title");
      setText(titleEl, label);
      const linkEl = li.querySelector("a.contact-link");
      if (linkEl) {
        if (href) linkEl.setAttribute("href", href);
        setText(linkEl, display || href);
      }
      const timeEl = li.querySelector("time");
      if (timeEl) {
        const datetime = getText(data, "datetime");
        if (datetime) timeEl.setAttribute("datetime", datetime);
        timeEl.textContent = display || datetime;
      }
      const addressEl = li.querySelector("address");
      if (addressEl) {
        setText(addressEl, display);
      }
    });

    profile.querySelectorAll("socials > social").forEach(social => {
      const key = social.getAttribute("key");
      const url = (social.textContent || "").trim();
      if (!key || !url) return;
      const anchor = document.querySelector(`[data-social-key="${key}"]`);
      if (anchor) {
        anchor.setAttribute("href", url);
      }
    });
  };

  const applyAbout = (doc) => {
    doc.querySelectorAll("about > paragraphs > paragraph").forEach(paragraph => {
      const index = paragraph.getAttribute("index");
      const target = document.querySelector(`[data-about-paragraph="${index}"]`);
      if (target) {
        const html = (paragraph.textContent || "").trim();
        setHTML(target, html);
      }
    });

    doc.querySelectorAll("about > services > service").forEach(service => {
      const index = service.getAttribute("index");
      const wrapper = document.querySelector(`[data-service-index="${index}"]`);
      if (!wrapper) return;
      const icon = wrapper.querySelector("[data-service-icon]");
      const title = wrapper.querySelector("[data-service-title]");
      const text = wrapper.querySelector("[data-service-text]");
      const iconNode = service.querySelector("icon");
      if (icon && iconNode) {
        const src = iconNode.getAttribute("src");
        const alt = iconNode.getAttribute("alt");
        if (src) icon.setAttribute("src", src);
        if (alt) icon.setAttribute("alt", alt);
      }
      setText(title, getText(service, "title"));
      setHTML(text, getText(service, "description"));
    });

    doc.querySelectorAll("about > testimonials > testimonial").forEach(testimonial => {
      const index = testimonial.getAttribute("index");
      const item = document.querySelector(`[data-testimonial-index="${index}"]`);
      if (!item) return;
      const name = getText(testimonial, "name");
      const quote = testimonial.querySelector("quote");
      const avatarData = testimonial.querySelector("avatar");
      const titleEl = item.querySelector("[data-testimonials-title]");
      const textEl = item.querySelector("[data-testimonials-text]");
      setText(titleEl, name);
      if (quote) {
        const quoteHtml = (quote.textContent || "").trim();
        setHTML(textEl, quoteHtml);
      }
      if (avatarData) {
        const avatarEl = item.querySelector("[data-testimonials-avatar]");
        if (avatarEl) {
          const src = avatarData.getAttribute("src");
          const alt = avatarData.getAttribute("alt");
          if (src) avatarEl.setAttribute("src", src);
          if (alt) avatarEl.setAttribute("alt", alt);
        }
      }
    });
  };

  const applyResume = (doc) => {
    doc.querySelectorAll("resume > experiences > item").forEach(itemNode => {
      const index = itemNode.getAttribute("index");
      const li = document.querySelector(`[data-experience-index="${index}"]`);
      if (!li) return;
      setText(li.querySelector("[data-experience-company]"), getText(itemNode, "company"));
      setText(li.querySelector("[data-experience-role]"), getText(itemNode, "role"));
      setText(li.querySelector("[data-experience-dates]"), getText(itemNode, "dates"));
      setHTML(li.querySelector("[data-experience-summary]"), getText(itemNode, "summary"));
    });

    doc.querySelectorAll("resume > education > item").forEach(itemNode => {
      const index = itemNode.getAttribute("index");
      const li = document.querySelector(`[data-education-index="${index}"]`);
      if (!li) return;
      setText(li.querySelector("[data-education-school]"), getText(itemNode, "school"));
      setText(li.querySelector("[data-education-dates]"), getText(itemNode, "dates"));
      setHTML(li.querySelector("[data-education-summary]"), getText(itemNode, "summary"));
    });
  };

  const applyPublications = (doc) => {
    const yearNode = doc.querySelector("publications > year");
    if (!yearNode) return;
    const yearValue = yearNode.getAttribute("value") || yearNode.textContent || "";
    const yearEl = document.querySelector("[data-publication-year]");
    setText(yearEl, (yearValue || "").trim());

    yearNode.querySelectorAll("publication").forEach(pub => {
      const index = pub.getAttribute("index");
      const wrapper = document.querySelector(`[data-publication-index="${index}"]`);
      if (!wrapper) return;
      const titleEl = wrapper.querySelector("[data-publication-title]");
      const linkEl = wrapper.querySelector("[data-publication-link]");
      const authorsEl = wrapper.querySelector("[data-publication-authors]");
      const venueEl = wrapper.querySelector("[data-publication-venue]");
      const summaryEl = wrapper.querySelector("[data-publication-summary]");
      const titleText = getText(pub, "title");
      if (titleEl) setText(titleEl, titleText);
      if (linkEl) {
        const link = getText(pub, "link");
        if (link) linkEl.setAttribute("href", link);
        linkEl.textContent = titleText || link || linkEl.textContent;
      }
      setHTML(authorsEl, getText(pub, "authors"));
      setText(venueEl, getText(pub, "venue"));
      setText(summaryEl, getText(pub, "summary"));
    });
  };

  const applyPortfolio = (doc) => {
    doc.querySelectorAll("portfolio > projects > project").forEach(project => {
      const index = project.getAttribute("index");
      const item = document.querySelector(`[data-project-index="${index}"]`);
      if (!item) return;
      const category = project.getAttribute("category");
      if (category) {
        item.dataset.category = category.toLowerCase();
      }
      const link = project.getAttribute("link");
      if (typeof link === "string") {
        if (link) {
          item.dataset.projectLink = link;
        } else {
          delete item.dataset.projectLink;
        }
      }
      const title = getText(project, "title");
      setText(item.querySelector("[data-project-title]"), title);
      const categoryEl = item.querySelector("[data-project-category]");
      if (categoryEl) {
        const existing = categoryEl.textContent || "";
        const nextValue = category ? category.replace(/&amp;/g, "&") : existing;
        setText(categoryEl, nextValue);
      }
      setHTML(item.querySelector("[data-project-description]"), getText(project, "description"));
      const thumb = project.querySelector("thumbnail");
      if (thumb) {
        const img = item.querySelector("[data-project-image]");
        if (img) {
          const src = thumb.getAttribute("src");
          const alt = thumb.getAttribute("alt");
          if (src) img.setAttribute("src", src);
          if (alt) img.setAttribute("alt", alt);
        }
      }
    });
  };

  const applyContact = (doc) => {
    const contact = doc.querySelector("contact");
    if (!contact) return;
    const mapSrc = getText(contact, "map > src");
    const mapCaption = getText(contact, "map > caption");
    const iframe = document.querySelector("[data-map-embed]");
    if (iframe && mapSrc) iframe.setAttribute("src", mapSrc);
    const captionEl = document.querySelector("[data-map-caption]");
    setText(captionEl, mapCaption);

    const emailHref = getText(contact, "email > href");
    const emailLabel = getText(contact, "email > label");
    const emailBtn = document.querySelector("[data-contact-email]");
    if (emailBtn) {
      if (emailHref) emailBtn.setAttribute("href", emailHref);
      const labelSpan = emailBtn.querySelector("span");
      const current = labelSpan ? labelSpan.textContent : "";
      setText(labelSpan, emailLabel || current || "");
    }

    contact.querySelectorAll("socials > social").forEach(social => {
      const key = social.getAttribute("key");
      const url = (social.textContent || "").trim();
      if (!key || !url) return;
      const anchor = document.querySelector(`[data-contact-social="${key}"]`);
      if (anchor) anchor.setAttribute("href", url);
    });
  };

  const applyFooter = (doc) => {
    const copy = doc.querySelector("footer > copyright");
    if (!copy) return;
    const footerEl = document.querySelector("[data-footer-copy]");
    setHTML(footerEl, copy.textContent || "");
  };

  const applyAll = (xmlDoc) => {
    applyMeta(xmlDoc);
    applyProfile(xmlDoc);
    applyAbout(xmlDoc);
    applyResume(xmlDoc);
    applyPublications(xmlDoc);
    applyPortfolio(xmlDoc);
    applyContact(xmlDoc);
    applyFooter(xmlDoc);
    document.dispatchEvent(new Event("site-data-updated"));
  };

  const loadData = () => {
    fetch(DATA_URL, { cache: "no-cache" })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch ${DATA_URL}: ${response.status}`);
        }
        return response.text();
      })
      .then(parseXml)
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
