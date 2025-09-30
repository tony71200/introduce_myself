(function () {
  const DATA_URL = "./data.xml";
  const PLACEHOLDER_IMAGE = "./assets/images/placeholders/no-image-3x4.svg";

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

  const getHTMLContent = (node, selector, fallback = "") => {
    if (!node) return fallback;
    const target = selector ? node.querySelector(selector) : node;
    if (!target) return fallback;
    return (target.innerHTML || "").trim();
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
    const experiencesContainer = document.querySelector("[data-resume-experiences]");
    if (experiencesContainer) {
      experiencesContainer.innerHTML = "";
      const experiences = doc.querySelectorAll("resume > experiences > item");
      if (!experiences.length) {
        const empty = document.createElement("li");
        empty.className = "timeline-item";
        empty.textContent = "No experiences available.";
        experiencesContainer.appendChild(empty);
      } else {
        experiences.forEach(itemNode => {
          const li = document.createElement("li");
          li.className = "timeline-item";

          const companyEl = document.createElement("h4");
          companyEl.className = "h4";
          companyEl.textContent = getText(itemNode, "company");
          li.appendChild(companyEl);

          const roleEl = document.createElement("h5");
          roleEl.className = "h5 timeline-item-title";
          roleEl.textContent = getText(itemNode, "role");
          li.appendChild(roleEl);

          const datesEl = document.createElement("span");
          datesEl.textContent = getText(itemNode, "dates");
          li.appendChild(datesEl);

          const summaryEl = document.createElement("p");
          summaryEl.className = "timeline-text";
          summaryEl.innerHTML = getHTMLContent(itemNode, "summary");
          li.appendChild(summaryEl);

          experiencesContainer.appendChild(li);
        });
      }
    }

    const educationContainer = document.querySelector("[data-resume-education]");
    if (educationContainer) {
      educationContainer.innerHTML = "";
      const educationItems = doc.querySelectorAll("resume > education > item");
      if (!educationItems.length) {
        const empty = document.createElement("li");
        empty.className = "timeline-item";
        empty.textContent = "No education records available.";
        educationContainer.appendChild(empty);
      } else {
        educationItems.forEach(itemNode => {
          const li = document.createElement("li");
          li.className = "timeline-item";

          const schoolEl = document.createElement("h4");
          schoolEl.className = "h4";
          schoolEl.textContent = getText(itemNode, "school");
          li.appendChild(schoolEl);

          const datesEl = document.createElement("span");
          datesEl.textContent = getText(itemNode, "dates");
          li.appendChild(datesEl);

          const summaryEl = document.createElement("p");
          summaryEl.className = "timeline-text";
          summaryEl.innerHTML = getHTMLContent(itemNode, "summary");
          li.appendChild(summaryEl);

          educationContainer.appendChild(li);
        });
      }
    }
  };

  const applyPublications = (doc) => {
    const wrapper = document.querySelector("[data-publications-wrapper]");
    if (!wrapper) return;
    wrapper.innerHTML = "";

    const yearNodes = doc.querySelectorAll("publications > year");
    if (!yearNodes.length) {
      const empty = document.createElement("p");
      empty.className = "timeline-empty";
      empty.textContent = "No publications available.";
      wrapper.appendChild(empty);
      return;
    }

    yearNodes.forEach(yearNode => {
      const yearValue = (yearNode.getAttribute("value") || yearNode.textContent || "").trim();

      const section = document.createElement("section");
      section.className = "timeline";

      const titleWrapper = document.createElement("div");
      titleWrapper.className = "title-wrapper";
      const iconBox = document.createElement("div");
      iconBox.className = "icon-box";
      const icon = document.createElement("ion-icon");
      icon.setAttribute("name", "book-outline");
      iconBox.appendChild(icon);
      const yearHeading = document.createElement("h3");
      yearHeading.className = "h3";
      yearHeading.textContent = yearValue;
      titleWrapper.appendChild(iconBox);
      titleWrapper.appendChild(yearHeading);
      section.appendChild(titleWrapper);

      const list = document.createElement("ol");
      list.className = "timeline-list";

      const publications = yearNode.querySelectorAll("publication");
      if (!publications.length) {
        const emptyItem = document.createElement("li");
        emptyItem.className = "timeline-item";
        emptyItem.textContent = "No publications recorded.";
        list.appendChild(emptyItem);
      } else {
        publications.forEach(pub => {
          const li = document.createElement("li");
          li.className = "timeline-item";
          li.style.marginBottom = "20px";

          const h4 = document.createElement("h4");
          h4.className = "h4";
          h4.style.margin = "0";
          const titleText = getText(pub, "title");
          const link = getText(pub, "link");
          if (link) {
            const anchor = document.createElement("a");
            anchor.setAttribute("href", link);
            anchor.setAttribute("target", "_blank");
            anchor.setAttribute("rel", "noopener");
            anchor.style.color = "#ffffff";
            anchor.style.textDecoration = "none";
            anchor.textContent = titleText || link;
            h4.appendChild(anchor);
          } else {
            h4.textContent = titleText;
          }
          li.appendChild(h4);

          const authors = document.createElement("h5");
          authors.className = "h5 timeline-item-title";
          authors.style.margin = "5px 0";
          authors.style.color = "#cccccc";
          authors.innerHTML = getHTMLContent(pub, "authors");
          li.appendChild(authors);

          const venue = document.createElement("span");
          venue.textContent = getText(pub, "venue");
          li.appendChild(venue);

          const summary = document.createElement("p");
          summary.className = "timeline-text";
          summary.style.marginTop = "6px";
          summary.textContent = getText(pub, "summary");
          li.appendChild(summary);

          list.appendChild(li);
        });
      }

      section.appendChild(list);
      wrapper.appendChild(section);
    });
  };

  const buildGalleryFromNodes = (galleryKey, nodes) => {
    const root = document.querySelector(`[data-gallery="${galleryKey}"]`);
    if (!root) return;

    const filterList = root.querySelector("[data-gallery-filter-list]");
    const selectList = root.querySelector("[data-gallery-select-list]");
    const selectValue = root.querySelector("[data-gallery-select-value]");
    const itemsList = root.querySelector("[data-gallery-items]");

    if (!itemsList) return;

    if (filterList) filterList.innerHTML = "";
    if (selectList) selectList.innerHTML = "";
    itemsList.innerHTML = "";
    if (selectValue) selectValue.textContent = "Select category";

    const entries = Array.from(nodes || []).map(node => {
      const title = getText(node, "title");
      const description = getHTMLContent(node, "description");
      const rawCategory = (node.getAttribute("category") || "General").trim();
      const categoryDisplay = rawCategory ? rawCategory.replace(/&amp;/g, "&") : "General";
      const categoryValue = (categoryDisplay || "General").toLowerCase();
      const link = node.getAttribute("link") || "";

      const media = [];
      const thumbnailNode = node.querySelector("thumbnail");
      if (thumbnailNode) {
        const thumbSrc = (thumbnailNode.getAttribute("src") || "").trim();
        if (thumbSrc) {
          media.push({
            type: "image",
            src: thumbSrc,
            alt: thumbnailNode.getAttribute("alt") || title || "gallery media"
          });
        }
      }

      node.querySelectorAll("item").forEach(itemNode => {
        const child = itemNode.firstElementChild;
        if (!child) return;
        const src = (child.getAttribute("src") || "").trim();
        if (!src) return;
        const type = child.tagName.toLowerCase();
        const alt = child.getAttribute("alt") || title || "gallery media";
        const poster = child.getAttribute("poster");
        const mediaEntry = {
          type: type === "video" ? "video" : "image",
          src,
          alt
        };
        if (poster) mediaEntry.poster = poster;
        media.push(mediaEntry);
      });

      const firstImage = media.find(item => item.type === "image");
      const firstMedia = media[0];
      let cardImage = PLACEHOLDER_IMAGE;
      let cardAlt = title || "Project";
      if (firstImage) {
        cardImage = firstImage.src;
        cardAlt = firstImage.alt || cardAlt;
      } else if (firstMedia) {
        cardImage = firstMedia.poster || firstMedia.src || PLACEHOLDER_IMAGE;
        cardAlt = firstMedia.alt || cardAlt;
      }

      return {
        title,
        description,
        categoryDisplay: categoryDisplay || "General",
        categoryValue: categoryValue || "general",
        link,
        media,
        cardImage,
        cardAlt
      };
    }).filter(entry => {
      return entry && (entry.title || entry.description || entry.media.length);
    });

    if (!entries.length) {
      const empty = document.createElement("li");
      empty.className = "project-item empty";
      empty.textContent = "No items available.";
      itemsList.appendChild(empty);
      return;
    }

    const categories = [];
    entries.forEach(entry => {
      const value = entry.categoryValue || "general";
      if (!categories.some(cat => cat[0] === value)) {
        categories.push([value, entry.categoryDisplay || "General"]);
      }
    });

    const categoryPairs = [["all", "All"]];
    categories.forEach(([value, label]) => {
      if (!categoryPairs.some(cat => cat[0] === value)) {
        categoryPairs.push([value, label || "General"]);
      }
    });

    if (filterList) {
      categoryPairs.forEach(([value, label], index) => {
        const li = document.createElement("li");
        li.className = "filter-item";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = label;
        btn.setAttribute("data-gallery-filter-btn", "");
        btn.dataset.filterValue = value;
        if (index === 0) btn.classList.add("active");
        li.appendChild(btn);
        filterList.appendChild(li);
      });
    }

    if (selectList) {
      categoryPairs.forEach(([value, label]) => {
        const li = document.createElement("li");
        li.className = "select-item";
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = label;
        btn.setAttribute("data-gallery-select-item", "");
        btn.dataset.selectValue = value;
        li.appendChild(btn);
        selectList.appendChild(li);
      });
    }

    if (selectValue && categoryPairs.length) {
      selectValue.textContent = categoryPairs[0][1];
    }

    entries.forEach(entry => {
      const li = document.createElement("li");
      li.className = "project-item active";
      li.setAttribute("data-gallery-item", "");
      li.setAttribute("data-filter-item", "");
      li.dataset.category = entry.categoryValue || "general";
      li.dataset.media = JSON.stringify(entry.media || []);
      if (entry.link) {
        li.dataset.link = entry.link;
      } else {
        delete li.dataset.link;
      }

      const card = document.createElement("article");
      card.className = "project-card";
      card.setAttribute("role", "button");
      card.setAttribute("tabindex", "0");
      card.setAttribute("data-gallery-trigger", "");

      const figure = document.createElement("figure");
      figure.className = "project-img";
      const iconBox = document.createElement("div");
      iconBox.className = "project-item-icon-box";
      const icon = document.createElement("ion-icon");
      icon.setAttribute("name", "eye-outline");
      iconBox.appendChild(icon);
      figure.appendChild(iconBox);
      const img = document.createElement("img");
      img.setAttribute("loading", "lazy");
      img.setAttribute("src", entry.cardImage || PLACEHOLDER_IMAGE);
      img.setAttribute("alt", entry.cardAlt || entry.title || "Project image");
      figure.appendChild(img);
      card.appendChild(figure);

      const titleEl = document.createElement("h3");
      titleEl.className = "project-title";
      titleEl.setAttribute("data-gallery-title", "");
      titleEl.textContent = entry.title || "Untitled";
      card.appendChild(titleEl);

      const categoryEl = document.createElement("p");
      categoryEl.className = "project-category";
      categoryEl.textContent = entry.categoryDisplay || "General";
      card.appendChild(categoryEl);

      const descEl = document.createElement("div");
      descEl.className = "project-desc";
      descEl.setAttribute("data-gallery-description", "");
      if (entry.description) {
        descEl.innerHTML = entry.description;
      }
      descEl.hidden = true;
      card.appendChild(descEl);

      li.appendChild(card);
      itemsList.appendChild(li);
    });
  };

  const applyPortfolio = (doc) => {
    buildGalleryFromNodes("portfolio", doc.querySelectorAll("portfolio > projects > project"));
  };

  const applyCertificates = (doc) => {
    buildGalleryFromNodes("certificates", doc.querySelectorAll("certificates > certificate"));
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
    applyCertificates(xmlDoc);
    applyContact(xmlDoc);
    applyFooter(xmlDoc);
    document.dispatchEvent(new CustomEvent("site-data-updated", { detail: { xml: xmlDoc } }));
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
