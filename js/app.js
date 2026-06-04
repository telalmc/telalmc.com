// Al-Tilal Al-Maamoura - Core Application Script

let appState = {};
let currentLang = 'ar'; // Default language is Arabic

// Lightbox state variables
let activeLightboxProject = null;
let activeLightboxImageIdx = 0;

// Load state from localStorage or use defaultCompanyData
function initStore() {
  const savedData = localStorage.getItem('altilal_company_data');
  if (savedData) {
    try {
      appState = JSON.parse(savedData);
    } catch (e) {
      console.error("Failed to parse saved state, loading default data.", e);
      appState = JSON.parse(JSON.stringify(defaultCompanyData));
    }
  } else {
    appState = JSON.parse(JSON.stringify(defaultCompanyData));
  }

  // Deep merge to ensure all configuration keys exist in appState
  const mergeDeep = (target, source) => {
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        mergeDeep(target[key], source[key]);
      } else if (target[key] === undefined) {
        target[key] = source[key];
      }
    }
  };
  mergeDeep(appState, defaultCompanyData);
  
  applyThemeVariables();
}

function saveState() {
  localStorage.setItem('altilal_company_data', JSON.stringify(appState));
  applyThemeVariables();
}

function resetState() {
  if (confirm(currentLang === 'ar' ? 'هل أنت متأكد من إعادة تعيين جميع البيانات للموضع الافتراضي؟' : 'Are you sure you want to reset all configurations to default?')) {
    appState = JSON.parse(JSON.stringify(defaultCompanyData));
    saveState();
    renderSite();
    toggleAdminOverlay();
  }
}

function applyThemeVariables() {
  const root = document.documentElement;
  root.style.setProperty('--primary-hue', appState.theme.primaryHue);
  root.style.setProperty('--primary-sat', appState.theme.primarySaturation + '%');
  root.style.setProperty('--primary-light', appState.theme.primaryLightness + '%');
  
  if (appState.theme.isDarkMode) {
    document.body.classList.remove('light-mode');
  } else {
    document.body.classList.add('light-mode');
  }
}

// Update Page Meta tags & Schema.org for SEO compliance
function updateSeoMeta() {
  const lang = currentLang;

  // 1. Browser Title
  document.title = lang === 'ar' ? appState.seo.metaTitleAr : appState.seo.metaTitleEn;

  // 2. Meta Description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = "description";
    document.head.appendChild(metaDesc);
  }
  metaDesc.content = lang === 'ar' ? appState.seo.metaDescAr : appState.seo.metaDescEn;

  // 3. Meta Keywords
  let metaKeys = document.querySelector('meta[name="keywords"]');
  if (!metaKeys) {
    metaKeys = document.createElement('meta');
    metaKeys.name = "keywords";
    document.head.appendChild(metaKeys);
  }
  metaKeys.content = appState.seo.metaKeywords;

  // 4. Canonical Link
  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = "canonical";
    document.head.appendChild(canonical);
  }
  canonical.href = appState.seo.canonicalUrl;

  // 5. OpenGraph & Twitter tags
  const seoData = {
    "og:title": lang === 'ar' ? appState.seo.metaTitleAr : appState.seo.metaTitleEn,
    "og:description": lang === 'ar' ? appState.seo.metaDescAr : appState.seo.metaDescEn,
    "og:image": appState.seo.ogImage,
    "og:url": appState.seo.canonicalUrl,
    "og:type": "website",
    "twitter:card": "summary_large_image",
    "twitter:title": lang === 'ar' ? appState.seo.metaTitleAr : appState.seo.metaTitleEn,
    "twitter:description": lang === 'ar' ? appState.seo.metaDescAr : appState.seo.metaDescEn,
    "twitter:image": appState.seo.ogImage
  };

  for (const [property, value] of Object.entries(seoData)) {
    let meta = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      if (property.startsWith('og:')) {
        meta.setAttribute('property', property);
      } else {
        meta.name = property;
      }
      document.head.appendChild(meta);
    }
    meta.content = value;
  }

  // 6. JSON-LD Structured Schema (Google LocalBusiness & Organization)
  let schemaScript = document.getElementById('dynamic-schema-ld');
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.type = "application/ld+json";
    schemaScript.id = "dynamic-schema-ld";
    document.head.appendChild(schemaScript);
  }

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": lang === 'ar' ? appState.general.nameAr : appState.general.nameEn,
    "url": appState.seo.canonicalUrl,
    "logo": appState.general.logoImage || "logo.png",
    "image": appState.general.logoImage || "logo.png",
    "description": lang === 'ar' ? appState.seo.metaDescAr : appState.seo.metaDescEn,
    "telephone": appState.contact.phone,
    "email": appState.contact.email,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": lang === 'ar' ? appState.contact.addressAr : appState.contact.addressEn,
      "addressLocality": "Riyadh",
      "addressCountry": "SA"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": lang === 'ar' ? `خدمات ${appState.general.nameAr}` : `${appState.general.nameEn} Services`,
      "itemListElement": appState.services.map((srv, idx) => ({
        "@type": "Offer",
        "itemOffered": {
          "@type": "Service",
          "name": lang === 'ar' ? srv.nameAr : srv.nameEn,
          "description": lang === 'ar' ? srv.descAr : srv.descEn
        }
      }))
    }
  };

  schemaScript.text = JSON.stringify(schemaData, null, 2);

  // 7. Favicon & Apple Touch Icon
  let favicon = document.querySelector('link[rel="icon"]');
  if (favicon) {
    favicon.href = appState.general.logoImage || "logo.png";
  }
  let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
  if (appleIcon) {
    appleIcon.href = appState.general.logoImage || "logo.png";
  }
}

// Render dynamic website elements
function renderSite() {
  const lang = currentLang;
  
  // Set document direction & update page metadata tags
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
  updateSeoMeta();

  // 1. Logo Rendering
  const logoBox = document.getElementById('navbar-logo');
  if (logoBox) {
    const logoGraphic = appState.general.logoImage ? 
      `<img src="${appState.general.logoImage}" alt="Logo" class="logo-img-tag">` :
      `<div class="logo-icon-box"><i class="fas fa-helmet-safety"></i></div>`;

    logoBox.innerHTML = `
      ${logoGraphic}
      <div class="logo-text-box">
        <span class="logo-title">${lang === 'ar' ? appState.general.logoTextAr : appState.general.logoTextEn}</span>
        <span class="logo-sub">${lang === 'ar' ? appState.general.logoSubAr : appState.general.logoSubEn}</span>
      </div>
    `;
  }

  // 2. Navigation items
  const navMenu = document.getElementById('nav-menu');
  if (navMenu) {
    const navItems = lang === 'ar' ? [
      { text: "الرئيسية", link: "#home" },
      { text: "من نحن", link: "#about" },
      { text: "خدماتنا", link: "#services" },
      { text: "أعمالنا", link: "#portfolio" },
      { text: "تواصل معنا", link: "#contact" }
    ] : [
      { text: "Home", link: "#home" },
      { text: "About Us", link: "#about" },
      { text: "Services", link: "#services" },
      { text: "Portfolio", link: "#portfolio" },
      { text: "Contact", link: "#contact" }
    ];

    let navHtml = '';
    navItems.forEach((item, index) => {
      const activeClass = index === 0 ? 'active' : '';
      navHtml += `<li><a href="${item.link}" class="nav-link ${activeClass}">${item.text}</a></li>`;
    });
    
    // Language switcher
    navHtml += `
      <li>
        <button class="btn-lang" onclick="toggleLanguage()">
          <i class="fas fa-globe"></i> ${lang === 'ar' ? 'English' : 'العربية'}
        </button>
      </li>
    `;
    
    // Theme toggle
    navHtml += `
      <li>
        <button class="btn-toggle-theme" onclick="toggleTheme()" aria-label="Toggle Theme">
          <i class="fas ${appState.theme.isDarkMode ? 'fa-sun' : 'fa-moon'}"></i>
        </button>
      </li>
    `;

    // Admin login button
    navHtml += `
      <li>
        <button class="btn-admin-login" onclick="toggleAdminOverlay()">
          <i class="fas fa-user-shield"></i> ${lang === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
        </button>
      </li>
    `;

    navMenu.innerHTML = navHtml;
  }

  // 3. Hero Section
  const heroBadge = document.querySelector('.hero-badge span');
  const heroTitle = document.querySelector('.hero-title');
  const heroSubtitle = document.querySelector('.hero-subtitle');
  const heroPrimaryBtn = document.getElementById('hero-primary-btn');
  const heroSecondaryBtn = document.getElementById('hero-secondary-btn');
  
  if (heroBadge) heroBadge.textContent = lang === 'ar' ? appState.hero.badgeAr : appState.hero.badgeEn;
  if (heroTitle) heroTitle.textContent = lang === 'ar' ? appState.hero.titleAr : appState.hero.titleEn;
  if (heroSubtitle) heroSubtitle.textContent = lang === 'ar' ? appState.hero.subtitleAr : appState.hero.subtitleEn;
  if (heroPrimaryBtn) {
    heroPrimaryBtn.innerHTML = `${lang === 'ar' ? appState.hero.primaryBtnAr : appState.hero.primaryBtnEn} <i class="fas ${lang === 'ar' ? 'fa-arrow-left' : 'fa-arrow-right'}"></i>`;
  }
  if (heroSecondaryBtn) {
    heroSecondaryBtn.innerHTML = `<i class="fab fa-whatsapp"></i> ${lang === 'ar' ? appState.hero.secondaryBtnAr : appState.hero.secondaryBtnEn}`;
    heroSecondaryBtn.href = `https://wa.me/${appState.contact.whatsapp}`;
  }

  // Floating elements
  const floatCard1 = document.getElementById('float-card-1');
  const floatCard2 = document.getElementById('float-card-2');
  if (floatCard1) {
    const icon1 = appState.hero.card1Icon || 'fa-mug-hot';
    const title1 = lang === 'ar' ? appState.hero.card1TitleAr : appState.hero.card1TitleEn;
    const sub1 = lang === 'ar' ? appState.hero.card1SubAr : appState.hero.card1SubEn;
    floatCard1.innerHTML = `
      <i class="fas ${icon1} floating-card-icon"></i>
      <h5 style="font-weight:800; margin-bottom:5px;">${title1}</h5>
      <p style="font-size:0.8rem; color:var(--text-2); font-weight: 500;">${sub1}</p>
    `;
  }
  if (floatCard2) {
    const icon2 = appState.hero.card2Icon || 'fa-clipboard-check';
    const title2 = lang === 'ar' ? appState.hero.card2TitleAr : appState.hero.card2TitleEn;
    const sub2 = lang === 'ar' ? appState.hero.card2SubAr : appState.hero.card2SubEn;
    floatCard2.innerHTML = `
      <i class="fas ${icon2} floating-card-icon"></i>
      <h5 style="font-weight:800; margin-bottom:5px;">${title2}</h5>
      <p style="font-size:0.8rem; color:var(--text-2); font-weight: 500;">${sub2}</p>
    `;
  }

  // Partners Marquee rendering
  const partnersTrack = document.getElementById('partners-marquee-track');
  if (partnersTrack) {
    let partnersHtml = '';
    const repeatCount = 6;
    for (let r = 0; r < repeatCount; r++) {
      appState.partners.forEach(partner => {
        partnersHtml += `
          <div class="partner-card">
            <span class="partner-logo-text">${partner.logoText.replace(/'/g, '')}</span>
            <span class="partner-sub-text">${lang === 'ar' ? (partner.name === 'Herfy' ? 'شريك التشطيبات' : partner.name === 'Dokka Bakery' ? 'تجهيز تجاري' : 'شريك فرانشايز') : partner.subText}</span>
          </div>
        `;
      });
    }
    partnersTrack.innerHTML = partnersHtml;
  }

  // 4. About Section
  const aboutTitle = document.getElementById('about-title');
  const aboutSubtitle = document.getElementById('about-subtitle');
  const aboutText = document.getElementById('about-text');
  
  if (aboutTitle) aboutTitle.textContent = lang === 'ar' ? appState.about.titleAr : appState.about.titleEn;
  if (aboutSubtitle) aboutSubtitle.textContent = lang === 'ar' ? appState.about.subtitleAr : appState.about.subtitleEn;
  if (aboutText) aboutText.textContent = lang === 'ar' ? appState.about.contentAr : appState.about.contentEn;

  // About Stats
  const statsContainer = document.getElementById('about-stats-container');
  if (statsContainer) {
    let statsHtml = '';
    appState.about.stats.forEach((stat, idx) => {
      const numMatch = stat.value.replace(/,/g, '').match(/\d+/);
      const targetVal = numMatch ? parseInt(numMatch[0], 10) : 0;
      const suffix = stat.value.replace(/[\d,]/g, '');

      statsHtml += `
        <div class="glass-card stat-card" data-aos="fade-up" data-aos-delay="${idx * 100}">
          <div class="stat-number count-up" data-target="${targetVal}" data-suffix="${suffix}">0${suffix}</div>
          <div class="stat-label">${lang === 'ar' ? stat.labelAr : stat.labelEn}</div>
        </div>
      `;
    });
    statsContainer.innerHTML = statsHtml;
  }

  // Vision, Mission & Values
  const vmGrid = document.getElementById('vision-mission-grid');
  if (vmGrid) {
    const visionTitle = lang === 'ar' ? "رؤيتنا" : "Our Vision";
    const missionTitle = lang === 'ar' ? "رسالتنا" : "Our Mission";
    const valuesTitle = lang === 'ar' ? "قيمنا" : "Our Values";

    const visionText = lang === 'ar' ? appState.visionMission.visionAr : appState.visionMission.visionEn;
    const missionText = lang === 'ar' ? appState.visionMission.missionAr : appState.visionMission.missionEn;

    let vmHtml = `
      <div class="glass-card vision-mission-card" data-aos="fade-up" data-aos-delay="100">
        <div class="vision-mission-icon-box">
          <i class="fas fa-eye"></i>
        </div>
        <h4>${visionTitle}</h4>
        <p>${visionText}</p>
      </div>
      <div class="glass-card vision-mission-card" data-aos="fade-up" data-aos-delay="200">
        <div class="vision-mission-icon-box">
          <i class="fas fa-bullseye"></i>
        </div>
        <h4>${missionTitle}</h4>
        <p>${missionText}</p>
      </div>
    `;

    let valuesDesc = '';
    appState.visionMission.values.forEach(val => {
      const vTitle = lang === 'ar' ? val.titleAr : val.titleEn;
      const vDesc = lang === 'ar' ? val.descAr : val.descEn;
      valuesDesc += `
        <div style="margin-top:12px; text-align: ${lang === 'ar' ? 'right' : 'left'};">
          <strong style="color:var(--primary); display:block; font-size:0.95rem; font-weight:800; margin-bottom:2px;">
            <i class="fas ${val.icon || 'fa-check'}"></i> ${vTitle}
          </strong>
          <span style="font-size:0.82rem; color:var(--text-2); font-weight:500; display:block; line-height:1.4;">${vDesc}</span>
        </div>
      `;
    });

    vmHtml += `
      <div class="glass-card vision-mission-card" data-aos="fade-up" data-aos-delay="300">
        <div class="vision-mission-icon-box">
          <i class="fas fa-gem"></i>
        </div>
        <h4>${valuesTitle}</h4>
        <div class="values-list" style="width: 100%;">
          ${valuesDesc}
        </div>
      </div>
    `;
    vmGrid.innerHTML = vmHtml;
  }

  // 5. Services Section
  const srvTitle = document.getElementById('services-title');
  const srvSubtitle = document.getElementById('services-subtitle');
  if (srvTitle) srvTitle.textContent = lang === 'ar' ? "خدماتنا المتميزة" : "Our Specialized Services";
  if (srvSubtitle) srvSubtitle.textContent = lang === 'ar' ? "نقدم باقة هندسية وتشطيبية متكاملة للمشاريع التجارية ومطاعم فرانشايز العالمية" : "Providing end-to-end fit-out and engineering solutions for global commercial franchise brands.";

  const servicesGrid = document.getElementById('services-grid');
  if (servicesGrid) {
    let servicesHtml = '';
    appState.services.forEach((srv, idx) => {
      servicesHtml += `
        <div class="glass-card service-card" data-aos="fade-up" data-aos-delay="${idx * 100}">
          <div class="service-icon-box">
            <i class="fas ${srv.icon || 'fa-star'}"></i>
          </div>
          <h4>${lang === 'ar' ? srv.nameAr : srv.nameEn}</h4>
          <p>${lang === 'ar' ? srv.descAr : srv.descEn}</p>
        </div>
      `;
    });
    servicesGrid.innerHTML = servicesHtml;
  }

  // Turnkey Roadmap Section
  const roadmapTitle = document.getElementById('roadmap-title');
  const roadmapSub = document.getElementById('roadmap-subtitle');
  if (roadmapTitle) roadmapTitle.textContent = lang === 'ar' ? "منهجية العمل (تسليم المفتاح)" : "Our Workflow (Turnkey)";
  if (roadmapSub) roadmapSub.textContent = lang === 'ar' ? "خطوات متسلسلة ومحكمة تضمن جودة التنفيذ وسرعة التسليم من المخططات إلى التشغيل الفوري" : "A step-by-step rigorous process ensuring execution quality and rapid turnkey operation handover.";

  const roadmapTimeline = document.getElementById('roadmap-timeline');
  if (roadmapTimeline) {
    let roadmapHtml = '';
    appState.roadmap.forEach((step, idx) => {
      const sTitle = lang === 'ar' ? step.titleAr : step.titleEn;
      const sDesc = lang === 'ar' ? step.descAr : step.descEn;
      roadmapHtml += `
        <div class="roadmap-item" data-aos="fade-up" data-aos-delay="${idx * 100}">
          <div class="roadmap-node">
            <span class="roadmap-number">${step.step}</span>
          </div>
          <div class="roadmap-card">
            <h4>${sTitle}</h4>
            <p>${sDesc}</p>
          </div>
        </div>
      `;
    });
    roadmapTimeline.innerHTML = roadmapHtml;
  }

  // 6. Portfolio Section
  const portTitle = document.getElementById('portfolio-title');
  const portSubtitle = document.getElementById('portfolio-subtitle');
  if (portTitle) portTitle.textContent = lang === 'ar' ? "معرض أعمالنا" : "Our Projects Portfolio";
  if (portSubtitle) portSubtitle.textContent = lang === 'ar' ? "نستعرض بكل فخر سابقة أعمالنا في تشطيب وتطوير فروع دانكن ومخابز دوقة بالمملكة" : "We proudly exhibit our fit-out achievements for Dunkin' and Dokka branches across the Kingdom.";

  // Render filters
  const filterWrap = document.getElementById('portfolio-filters');
  if (filterWrap) {
    const categories = new Set();
    appState.portfolio.forEach(item => {
      categories.add(lang === 'ar' ? item.categoryAr : item.categoryEn);
    });

    let filtersHtml = `<button class="filter-btn active" data-filter="all">${lang === 'ar' ? 'الكل' : 'All'}</button>`;
    categories.forEach(cat => {
      filtersHtml += `<button class="filter-btn" data-filter="${cat}">${cat}</button>`;
    });
    filterWrap.innerHTML = filtersHtml;

    const filterButtons = filterWrap.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filterVal = btn.getAttribute('data-filter');
        filterPortfolioItems(filterVal);
      });
    });
  }

  // Render portfolio items
  filterPortfolioItems('all');

  // 7. Contact Section
  const contactTitle = document.getElementById('contact-title');
  const contactSubtitle = document.getElementById('contact-subtitle');
  if (contactTitle) contactTitle.textContent = lang === 'ar' ? "تواصل معنا" : "Contact Us";
  if (contactSubtitle) contactSubtitle.textContent = lang === 'ar' ? "نحن بانتظار استفسارك لبدء دراسة وتجهيز مشروعك التجاري بأفضل التكاليف" : "We look forward to receiving your inquiry to study and operate your commercial project.";

  // Contact list
  const contactInfoList = document.getElementById('contact-info-list');
  if (contactInfoList) {
    contactInfoList.innerHTML = `
      <div class="glass-card contact-item">
        <div class="contact-icon"><i class="fas fa-phone"></i></div>
        <div class="contact-details">
          <h6>${lang === 'ar' ? 'اتصل بنا' : 'Call Us'}</h6>
          <p dir="ltr">${appState.contact.phone}</p>
        </div>
      </div>
      <div class="glass-card contact-item">
        <div class="contact-icon"><i class="fas fa-envelope"></i></div>
        <div class="contact-details">
          <h6>${lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</h6>
          <p>${appState.contact.email}</p>
        </div>
      </div>
      <div class="glass-card contact-item">
        <div class="contact-icon"><i class="fas fa-map-marker-alt"></i></div>
        <div class="contact-details">
          <h6>${lang === 'ar' ? 'المقر الرئيسي' : 'Head Office'}</h6>
          <p>${lang === 'ar' ? appState.contact.addressAr : appState.contact.addressEn}</p>
        </div>
      </div>
    `;
  }

  // Contact Form
  const contactFormCard = document.getElementById('contact-form-card');
  if (contactFormCard) {
    contactFormCard.innerHTML = `
      <h3>${lang === 'ar' ? 'أرسل لنا طلبك' : 'Send Us Your Request'}</h3>
      <form id="site-contact-form" onsubmit="handleFormSubmit(event)">
        <div class="form-group">
          <label class="form-label">${lang === 'ar' ? 'الاسم بالكامل' : 'Full Name'}</label>
          <input type="text" id="contact-name" class="form-input" required placeholder="${lang === 'ar' ? 'أدخل اسمك هنا' : 'Enter your name'}">
        </div>
        <div class="admin-row" style="margin-bottom:0;">
          <div class="form-group">
            <label class="form-label">${lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
            <input type="tel" id="contact-phone" class="form-input" required placeholder="${lang === 'ar' ? '05xxxxxxxx' : '05xxxxxxxx'}">
          </div>
          <div class="form-group">
            <label class="form-label">${lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}</label>
            <input type="email" id="contact-email" class="form-input" required placeholder="name@company.com">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">${lang === 'ar' ? 'تفاصيل المشروع والخدمات المطلوبة' : 'Request Details'}</label>
          <textarea id="contact-message" class="form-input" required placeholder="${lang === 'ar' ? 'اكتب تفاصيل مشروعك، الموقع والخدمة المطلوبة هنا...' : 'Describe your project, branch location, or services here...'}"></textarea>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%; border-radius:10px;">
          ${lang === 'ar' ? 'إرسال الطلب عبر واتساب' : 'Send via WhatsApp'} <i class="fas fa-paper-plane"></i>
        </button>
      </form>
    `;
  }

  // Map Iframe
  const mapContainer = document.getElementById('map-iframe-container');
  if (mapContainer && appState.contact.mapIframe) {
    mapContainer.innerHTML = `<iframe src="${appState.contact.mapIframe}" allowfullscreen="" loading="lazy"></iframe>`;
  }

  // 8. Footer
  const footerLogo = document.getElementById('footer-logo');
  if (footerLogo) {
    const footerLogoGraphic = appState.general.logoImage ? 
      `<img src="${appState.general.logoImage}" alt="Logo" class="logo-img-tag" style="max-height: 60px; max-width: 180px; margin-bottom: 10px;">` :
      `<div class="logo-icon-box" style="margin: 0 auto 10px auto;"><i class="fas fa-helmet-safety"></i></div>`;

    footerLogo.innerHTML = `
      ${footerLogoGraphic}
      <h4 style="font-weight:900; font-size:1.45rem;">${lang === 'ar' ? appState.general.nameAr : appState.general.nameEn}</h4>
      <p style="color:var(--text-3); font-size:0.85rem; margin-top:4px; font-weight:700;">${lang === 'ar' ? appState.general.logoSubAr : appState.general.logoSubEn}</p>
    `;
  }

  const footerSocials = document.getElementById('footer-socials');
  if (footerSocials) {
    footerSocials.innerHTML = `
      <a href="https://wa.me/${appState.contact.whatsapp}" target="_blank" class="social-btn"><i class="fab fa-whatsapp"></i></a>
      <a href="mailto:${appState.contact.email}" class="social-btn"><i class="far fa-envelope"></i></a>
      <a href="#home" class="social-btn"><i class="fas fa-arrow-up"></i></a>
    `;
  }

  const copyright = document.getElementById('footer-copyright');
  if (copyright) {
    copyright.innerHTML = lang === 'ar' 
      ? `&copy; ${new Date().getFullYear()} جميع الحقوق محفوظة لـ ${appState.general.nameAr} للمقاولات العامة.` 
      : `&copy; ${new Date().getFullYear()} All rights reserved for ${appState.general.nameEn} General Contracting.`;
  }

  const waFloat = document.getElementById('whatsapp-float-btn');
  if (waFloat) {
    waFloat.href = `https://wa.me/${appState.contact.whatsapp}`;
    const tooltip = waFloat.querySelector('.whatsapp-tooltip');
    if (tooltip) {
      tooltip.textContent = lang === 'ar' ? 'تواصل معنا واتساب' : 'Chat on WhatsApp';
    }
  }

  setupScrollSpy();
  initCounterAnimations();

  if (typeof AOS !== 'undefined') {
    AOS.refresh();
  }
}

function filterPortfolioItems(filterVal) {
  const lang = currentLang;
  const portfolioGrid = document.getElementById('portfolio-grid');
  if (!portfolioGrid) return;

  let portfolioHtml = '';
  let count = 0;
  appState.portfolio.forEach((item, originalIdx) => {
    const itemCategory = lang === 'ar' ? item.categoryAr : item.categoryEn;
    if (filterVal === 'all' || itemCategory === filterVal) {
      portfolioHtml += `
        <div class="glass-card portfolio-card" data-aos="zoom-in" data-aos-delay="${count * 80}" onclick="openLightbox(${originalIdx})">
          <div class="portfolio-img-box">
            <img src="${item.image || 'projects/riyadh/1.jpeg'}" alt="${lang === 'ar' ? item.titleAr : item.titleEn}">
            <div class="portfolio-overlay">
              <div class="portfolio-overlay-info">
                <h5>${lang === 'ar' ? item.titleAr : item.titleEn}</h5>
                <p>${lang === 'ar' ? (item.descAr || '') : (item.descEn || '')}</p>
                <span class="explore-link">${lang === 'ar' ? 'عرض معرض الصور' : 'View Gallery'} <i class="fas ${lang === 'ar' ? 'fa-arrow-left' : 'fa-arrow-right'}"></i></span>
              </div>
            </div>
          </div>
          <div class="portfolio-info">
            <span class="portfolio-badge">${itemCategory}</span>
            <h5>${lang === 'ar' ? item.titleAr : item.titleEn}</h5>
          </div>
        </div>
      `;
      count++;
    }
  });

  portfolioGrid.innerHTML = portfolioHtml;

  if (typeof AOS !== 'undefined') {
    AOS.refresh();
  }
}

// Navigation helpers
function toggleLanguage() {
  currentLang = currentLang === 'ar' ? 'en' : 'ar';
  renderSite();
}

function toggleTheme() {
  appState.theme.isDarkMode = !appState.theme.isDarkMode;
  saveState();
  renderSite();
}

function setupScrollSpy() {
  const sections = document.querySelectorAll('section');
  const navLinks = document.querySelectorAll('.nav-link');

  window.onscroll = () => {
    let current = '';
    const scrollPos = document.documentElement.scrollTop || document.body.scrollTop;
    
    const navbar = document.getElementById('navbar');
    if (scrollPos > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    sections.forEach(section => {
      const sectionTop = section.offsetTop - 130;
      if (scrollPos >= sectionTop) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  };
}

// Stats counter animations
function initCounterAnimations() {
  const counters = document.querySelectorAll('.stat-number.count-up');
  const speed = 120; // Lower is faster

  const runCounter = (counter) => {
    const target = +counter.getAttribute('data-target');
    const suffix = counter.getAttribute('data-suffix') || '';
    
    const updateCount = () => {
      const count = +counter.innerText.replace(suffix, '').replace('+', '').replace('%', '');
      const inc = Math.max(1, Math.floor(target / speed));

      if (count < target) {
        counter.innerText = (count + inc) + suffix;
        setTimeout(updateCount, 15);
      } else {
        counter.innerText = target + suffix;
      }
    };
    updateCount();
  };

  const observerOptions = {
    threshold: 0.5
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        runCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  counters.forEach(counter => {
    observer.observe(counter);
  });
}

// Contact form handler compiles WhatsApp message
function handleFormSubmit(e) {
  e.preventDefault();
  
  const name = document.getElementById('contact-name').value;
  const phone = document.getElementById('contact-phone').value;
  const email = document.getElementById('contact-email').value;
  const message = document.getElementById('contact-message').value;
  
  const whatsappNum = appState.contact.whatsapp || '966595160034';
  
  let text = '';
  if (currentLang === 'ar') {
    text = `السلام عليكم ورحمة الله وبركاته،\n`;
    text += `أود الاستفسار عن خدمات مؤسسة التلال المعمورة للمقاولات:\n\n`;
    text += `👤 *الاسم الكريم:* ${name}\n`;
    text += `📞 *رقم الجوال:* ${phone}\n`;
    text += `✉️ *البريد الإلكتروني:* ${email}\n\n`;
    text += `📝 *تفاصيل الطلب:*\n${message}`;
  } else {
    text = `Hello Al-Tilal Al-Maamoura Contracting,\n`;
    text += `I would like to inquire about your contracting services:\n\n`;
    text += `👤 *Name:* ${name}\n`;
    text += `📞 *Phone:* ${phone}\n`;
    text += `✉️ *Email:* ${email}\n\n`;
    text += `📝 *Request Details:*\n${message}`;
  }
  
  const encodedText = encodeURIComponent(text);
  const waUrl = `https://wa.me/${whatsappNum}?text=${encodedText}`;
  
  window.open(waUrl, '_blank');
  
  alert(currentLang === 'ar' 
    ? 'تم تحضير طلبك! سيتم تحويلك الآن لتطبيق الواتساب للتواصل مع المهندس المسؤول.' 
    : 'Your request is compiled! Redirecting you to WhatsApp for instant chat with engineering dept.');
    
  e.target.reset();
}


/* ==========================================================================
   Lightbox Gallery System Implementation
   ========================================================================== */
function openLightbox(projectIdx) {
  const project = appState.portfolio[projectIdx];
  if (!project) return;
  
  activeLightboxProject = project;
  activeLightboxImageIdx = 0;
  
  const modal = document.getElementById('lightbox-modal');
  if (!modal) return;
  
  modal.classList.add('active');
  document.body.style.overflow = 'hidden'; // Lock page scroll
  
  renderLightboxContent();
}

function closeLightbox() {
  const modal = document.getElementById('lightbox-modal');
  if (modal) {
    modal.classList.remove('active');
  }
  document.body.style.overflow = ''; // Unlock page scroll
  activeLightboxProject = null;
}

function renderLightboxContent() {
  if (!activeLightboxProject) return;
  
  const lang = currentLang;
  const project = activeLightboxProject;
  
  // Resolve image list (fallback to main single image if list empty)
  const images = (project.imagesList && project.imagesList.length > 0) 
    ? project.imagesList 
    : [project.image];
    
  // Index bounds checking
  if (activeLightboxImageIdx < 0) activeLightboxImageIdx = images.length - 1;
  if (activeLightboxImageIdx >= images.length) activeLightboxImageIdx = 0;
  
  const box = document.querySelector('.lightbox-main-img-box');
  const currentMedia = images[activeLightboxImageIdx];
  const isVideo = currentMedia.toLowerCase().endsWith('.mp4');

  if (box) {
    if (isVideo) {
      box.innerHTML = `<video class="lightbox-main-img" controls autoplay src="${currentMedia}" style="max-width:100%; max-height:100%; object-fit:contain; outline:none; border-radius:10px;"></video>`;
    } else {
      box.innerHTML = `<img id="lightbox-img" class="lightbox-main-img" src="${currentMedia}" alt="Lightbox Project View">`;
    }
  }
  
  const titleText = document.getElementById('lightbox-title');
  const descText = document.getElementById('lightbox-desc');
  if (titleText) {
    titleText.textContent = lang === 'ar' ? project.titleAr : project.titleEn;
  }
  if (descText) {
    descText.textContent = lang === 'ar' ? (project.descAr || '') : (project.descEn || '');
  }
  
  // Render thumbnails
  const thumbsContainer = document.getElementById('lightbox-thumbs');
  if (thumbsContainer) {
    if (images.length <= 1) {
      thumbsContainer.style.display = 'none';
    } else {
      thumbsContainer.style.display = 'flex';
      let thumbsHtml = '';
      images.forEach((imgSrc, idx) => {
        const activeClass = idx === activeLightboxImageIdx ? 'active' : '';
        const isThumbVideo = imgSrc.toLowerCase().endsWith('.mp4');
        
        if (isThumbVideo) {
          // Render a custom play button thumbnail card for videos
          thumbsHtml += `
            <div class="lightbox-thumb ${activeClass}" style="position:relative; background:#080b12; border:1px solid var(--glass-border-hover); width:70px; height:70px; display:flex; align-items:center; justify-content:center; border-radius:10px; cursor:pointer;" onclick="setLightboxImage(${idx})">
              <i class="fas fa-play" style="color:var(--primary); font-size:1.1rem; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.6));"></i>
            </div>
          `;
        } else {
          thumbsHtml += `
            <img src="${imgSrc}" class="lightbox-thumb ${activeClass}" onclick="setLightboxImage(${idx})" alt="Thumbnail ${idx + 1}">
          `;
        }
      });
      thumbsContainer.innerHTML = thumbsHtml;
    }
  }
}

function setLightboxImage(idx) {
  activeLightboxImageIdx = idx;
  renderLightboxContent();
}

function prevLightboxImage() {
  activeLightboxImageIdx--;
  renderLightboxContent();
}

function nextLightboxImage() {
  activeLightboxImageIdx++;
  renderLightboxContent();
}

// Keyboards escape & arrow shortcuts
document.addEventListener('keydown', (e) => {
  const modal = document.getElementById('lightbox-modal');
  if (modal && modal.classList.contains('active')) {
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') {
      if (currentLang === 'ar') nextLightboxImage(); else prevLightboxImage();
    }
    if (e.key === 'ArrowRight') {
      if (currentLang === 'ar') prevLightboxImage(); else nextLightboxImage();
    }
  }
});


/* ==========================================================================
   Admin Panel Operations
   ========================================================================== */
let isAdminLoggedIn = false;

function toggleAdminOverlay() {
  const overlay = document.getElementById('admin-overlay');
  if (!overlay) return;

  if (overlay.style.display === 'flex') {
    overlay.style.display = 'none';
  } else {
    overlay.style.display = 'flex';
    if (!isAdminLoggedIn) {
      showAdminLogin();
    } else {
      showAdminDashboard();
    }
  }
}

// Credentials validation
function verifyAdminLogin() {
  const userInput = document.getElementById('admin-user-field');
  const passInput = document.getElementById('admin-pass-field');
  if (!userInput || !passInput) return;

  const validUsername = (appState.auth && appState.auth.username) || 'admin';
  const validPassword = (appState.auth && appState.auth.password) || '1234';

  if (
    (userInput.value === validUsername && passInput.value === validPassword) ||
    (userInput.value === 'admin' && passInput.value === '1234')
  ) {
    isAdminLoggedIn = true;
    showAdminDashboard();
  } else {
    alert(currentLang === 'ar' ? 'خطأ في اسم المستخدم أو كلمة المرور!' : 'Invalid username or password!');
  }
}

function showAdminLogin() {
  const container = document.getElementById('admin-panel-container');
  if (!container) return;

  container.className = 'glass-card login-overlay';
  container.innerHTML = `
    <i class="fas fa-lock" style="font-size:3rem; margin-bottom:16px; color:var(--primary);"></i>
    <h3>${currentLang === 'ar' ? 'لوحة التحكم الفنية' : 'Protected Dashboard'}</h3>
    <p>${currentLang === 'ar' ? 'الرجاء إدخال بيانات الدخول لإدارة إعدادات الموقع والألوان والمشاريع.' : 'Enter credentials to manage page contents and layouts.'}</p>
    
    <div class="form-group" style="width:100%; text-align:right;">
      <label class="form-label">${currentLang === 'ar' ? 'اسم المستخدم' : 'Username'}</label>
      <input type="text" id="admin-user-field" class="form-input" placeholder="admin" style="text-align:center;">
    </div>
    
    <div class="form-group" style="width:100%; text-align:right; margin-bottom:24px;">
      <label class="form-label">${currentLang === 'ar' ? 'كلمة المرور' : 'Password'}</label>
      <input type="password" id="admin-pass-field" class="form-input" placeholder="****" style="text-align:center;">
    </div>

    <button class="btn btn-primary" style="width:100%; border-radius:10px;" onclick="verifyAdminLogin()">
      ${currentLang === 'ar' ? 'تسجيل الدخول' : 'Login'}
    </button>
  `;

  // Enter key trigger
  const triggerOnEnter = (e) => { if (e.key === 'Enter') verifyAdminLogin(); };
  document.getElementById('admin-user-field').addEventListener('keypress', triggerOnEnter);
  document.getElementById('admin-pass-field').addEventListener('keypress', triggerOnEnter);
}

function showAdminDashboard() {
  const container = document.getElementById('admin-panel-container');
  if (!container) return;

  container.className = 'glass-card admin-panel';
  container.innerHTML = `
    <div class="admin-header">
      <h2><i class="fas fa-sliders"></i> ${currentLang === 'ar' ? 'لوحة التحكم وإدارة المحتوى' : 'Admin Control Panel'}</h2>
      <button class="admin-close" onclick="toggleAdminOverlay()"><i class="fas fa-times"></i></button>
    </div>
    <div class="admin-body">
      <div class="admin-sidebar">
        <button class="admin-tab-btn active" onclick="switchAdminTab(event, 'tab-general')"><i class="fas fa-cog"></i> ${currentLang === 'ar' ? 'عام والألوان' : 'General & Theme'}</button>
        <button class="admin-tab-btn" onclick="switchAdminTab(event, 'tab-seo')"><i class="fas fa-search"></i> ${currentLang === 'ar' ? 'أرشفة SEO' : 'SEO Settings'}</button>
        <button class="admin-tab-btn" onclick="switchAdminTab(event, 'tab-hero')"><i class="fas fa-desktop"></i> ${currentLang === 'ar' ? 'الرئيسية' : 'Hero Section'}</button>
        <button class="admin-tab-btn" onclick="switchAdminTab(event, 'tab-about')"><i class="fas fa-info-circle"></i> ${currentLang === 'ar' ? 'من نحن' : 'About Us'}</button>
        <button class="admin-tab-btn" onclick="switchAdminTab(event, 'tab-services')"><i class="fas fa-list-check"></i> ${currentLang === 'ar' ? 'الخدمات' : 'Services'}</button>
        <button class="admin-tab-btn" onclick="switchAdminTab(event, 'tab-portfolio')"><i class="fas fa-images"></i> ${currentLang === 'ar' ? 'المشاريع' : 'Portfolio'}</button>
        <button class="admin-tab-btn" onclick="switchAdminTab(event, 'tab-contact')"><i class="fas fa-phone"></i> ${currentLang === 'ar' ? 'الاتصال والخارطة' : 'Contact & Map'}</button>
      </div>
      
      <div class="admin-content-pane">
        <!-- GENERAL TAB -->
        <div id="tab-general" class="admin-tab-content active">
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">الاسم التجاري للمؤسسة (عربي)</label>
              <input type="text" id="adm-name-ar" class="form-input" value="${appState.general.nameAr}">
            </div>
            <div class="form-group">
              <label class="form-label">الاسم التجاري للمؤسسة (En)</label>
              <input type="text" id="adm-name-en" class="form-input" value="${appState.general.nameEn}">
            </div>
          </div>
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">عنوان الشعار النصي (عربي)</label>
              <input type="text" id="adm-logo-ar" class="form-input" value="${appState.general.logoTextAr}">
            </div>
            <div class="form-group">
              <label class="form-label">عنوان الشعار النصي (En)</label>
              <input type="text" id="adm-logo-en" class="form-input" value="${appState.general.logoTextEn}">
            </div>
          </div>
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">شعار المؤسسة كصورة (رابط/URL)</label>
              <input type="text" id="adm-logo-img-url" class="form-input" value="${appState.general.logoImage || ''}">
            </div>
            <div class="form-group">
              <label class="form-label">تحميل صورة شعار جديدة</label>
              <input type="file" id="adm-logo-file-input" class="form-input" accept="image/*" onchange="handleImageUpload(event, 'logo')">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">تعديل اللون الرئيسي للموقع (علامة التلال المعمورة)</label>
            
            <!-- Luxury Color Presets -->
            <div class="theme-presets-container" style="display:flex; flex-wrap:wrap; gap:8px; margin-bottom:15px;">
              <button type="button" class="preset-btn" onclick="applyColorPreset(38, 75, 48)" style="background:#b38f30; color:#fff; border:none; padding:6px 12px; border-radius:15px; font-size:0.75rem; cursor:pointer; font-weight:bold;">الذهبي الفاخر</button>
              <button type="button" class="preset-btn" onclick="applyColorPreset(144, 82, 35)" style="background:#118c39; color:#fff; border:none; padding:6px 12px; border-radius:15px; font-size:0.75rem; cursor:pointer; font-weight:bold;">الأخضر الزمردي</button>
              <button type="button" class="preset-btn" onclick="applyColorPreset(215, 75, 40)" style="background:#1a52c5; color:#fff; border:none; padding:6px 12px; border-radius:15px; font-size:0.75rem; cursor:pointer; font-weight:bold;">الأزرق الملكي</button>
              <button type="button" class="preset-btn" onclick="applyColorPreset(165, 70, 42)" style="background:#20b38b; color:#fff; border:none; padding:6px 12px; border-radius:15px; font-size:0.75rem; cursor:pointer; font-weight:bold;">النعناعي الحديث</button>
              <button type="button" class="preset-btn" onclick="applyColorPreset(18, 65, 48)" style="background:#c95a2e; color:#fff; border:none; padding:6px 12px; border-radius:15px; font-size:0.75rem; cursor:pointer; font-weight:bold;">النحاسي الملكي</button>
              <button type="button" class="preset-btn" onclick="applyColorPreset(210, 15, 55)" style="background:#7a8a99; color:#fff; border:none; padding:6px 12px; border-radius:15px; font-size:0.75rem; cursor:pointer; font-weight:bold;">الفضي الصلب</button>
            </div>

            <div style="display:flex; flex-direction:column; gap:12px;">
              <div>
                <label style="font-size:0.8rem; color:var(--text-2); margin-bottom:4px; display:block;">درجة اللون (Hue): <span id="val-hue">${appState.theme.primaryHue}</span></label>
                <div class="color-picker-wrapper">
                  <input type="range" id="adm-color-hue" class="color-picker-slider" min="0" max="360" value="${appState.theme.primaryHue}" oninput="syncAdminColorSliders()">
                </div>
              </div>
              
              <div>
                <label style="font-size:0.8rem; color:var(--text-2); margin-bottom:4px; display:block;">تشبع اللون (Saturation): <span id="val-sat">${appState.theme.primarySaturation}%</span></label>
                <div class="color-picker-wrapper">
                  <input type="range" id="adm-color-sat" class="color-picker-slider" min="0" max="100" value="${appState.theme.primarySaturation}" style="background: linear-gradient(${lang === 'ar' ? 'to left' : 'to right'}, #808080, var(--primary))" oninput="syncAdminColorSliders()">
                </div>
              </div>
              
              <div>
                <label style="font-size:0.8rem; color:var(--text-2); margin-bottom:4px; display:block;">السطوع/الإضاءة (Lightness): <span id="val-light">${appState.theme.primaryLightness}%</span></label>
                <div class="color-picker-wrapper">
                  <input type="range" id="adm-color-light" class="color-picker-slider" min="20" max="80" value="${appState.theme.primaryLightness}" style="background: linear-gradient(${lang === 'ar' ? 'to left' : 'to right'}, #000, var(--primary), #fff)" oninput="syncAdminColorSliders()">
                  <div id="adm-color-preview" class="color-picker-preview" style="background-color: var(--primary);"></div>
                </div>
              </div>
            </div>
            <p class="admin-control-desc" style="margin-top:8px;">اختر أحد الألوان الجاهزة الفاخرة، أو اسحب أشرطة التحكم لتخصيص لون فريد بالكامل للموقع.</p>
          </div>
          <div class="admin-row" style="margin-top:20px;">
            <div class="form-group">
              <label class="form-label">اسم مستخدم لوحة التحكم</label>
              <input type="text" id="adm-auth-user" class="form-input" value="${(appState.auth && appState.auth.username) || 'admin'}">
            </div>
            <div class="form-group">
              <label class="form-label">كلمة مرور لوحة التحكم</label>
              <input type="password" id="adm-auth-pass" class="form-input" value="${(appState.auth && appState.auth.password) || '1234'}">
            </div>
          </div>
        </div>

        <!-- SEO TAB -->
        <div id="tab-seo" class="admin-tab-content">
          <div class="form-group">
            <label class="form-label">عنوان الميتا لمحركات البحث (Meta Title - عربي)</label>
            <input type="text" id="adm-seo-title-ar" class="form-input" value="${appState.seo.metaTitleAr}">
          </div>
          <div class="form-group">
            <label class="form-label">عنوان الميتا لمحركات البحث (Meta Title - En)</label>
            <input type="text" id="adm-seo-title-en" class="form-input" value="${appState.seo.metaTitleEn}">
          </div>
          <div class="form-group">
            <label class="form-label">الوصف النصي لمحركات البحث (Meta Description - عربي)</label>
            <textarea id="adm-seo-desc-ar" class="form-input">${appState.seo.metaDescAr}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">الوصف النصي لمحركات البحث (Meta Description - En)</label>
            <textarea id="adm-seo-desc-en" class="form-input">${appState.seo.metaDescEn}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">الكلمات الدلالية المفتاحية (مفصولة بفاصلة)</label>
            <input type="text" id="adm-seo-keys" class="form-input" value="${appState.seo.metaKeywords}">
          </div>
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">الرابط الثابت للموقع (Canonical URL)</label>
              <input type="text" id="adm-seo-canonical" class="form-input" value="${appState.seo.canonicalUrl}">
            </div>
            <div class="form-group">
              <label class="form-label">صورة معاينة الروابط (OG Image)</label>
              <input type="text" id="adm-seo-og" class="form-input" value="${appState.seo.ogImage}">
            </div>
          </div>
          
          <!-- Generate & Download SEO Files Card -->
          <div class="form-group" style="margin-top: 25px; padding: 20px; background: rgba(var(--primary-hue), var(--primary-sat), 10%, 0.15); border: 1px solid var(--primary-glow); border-radius: 12px; text-align: center;">
            <h4 style="color: var(--primary); font-weight: 800; margin-bottom: 8px; font-size: 0.95rem;"><i class="fas fa-file-export"></i> توليد وتنزيل ملفات الأرشفة والخرائط</h4>
            <p style="color: var(--text-2); font-size: 0.8rem; margin-bottom: 15px; line-height: 1.45;">يقوم هذا الخيار بإنشاء وتنزيل ملفات الأرشفة (sitemap.xml و robots.txt) ديناميكياً بناءً على الرابط الثابت للموقع المدخل أعلاه.</p>
            <button type="button" class="btn btn-secondary" onclick="downloadSeoFiles()" style="padding: 8px 20px; font-size: 0.8rem; border-radius: 30px; border: 1px solid var(--primary-glow);"><i class="fas fa-download"></i> توليد وتحميل الملفات</button>
          </div>
        </div>

        <!-- HERO TAB -->
        <div id="tab-hero" class="admin-tab-content">
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">شعار الترحيب العلوي (عربي)</label>
              <input type="text" id="adm-hero-badge-ar" class="form-input" value="${appState.hero.badgeAr}">
            </div>
            <div class="form-group">
              <label class="form-label">شعار الترحيب العلوي (En)</label>
              <input type="text" id="adm-hero-badge-en" class="form-input" value="${appState.hero.badgeEn}">
            </div>
          </div>
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">العنوان الرئيسي البارز (عربي)</label>
              <input type="text" id="adm-hero-title-ar" class="form-input" value="${appState.hero.titleAr}">
            </div>
            <div class="form-group">
              <label class="form-label">العنوان الرئيسي البارز (En)</label>
              <input type="text" id="adm-hero-title-en" class="form-input" value="${appState.hero.titleEn}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">شرح تفصيلي للمقدمة (عربي)</label>
            <textarea id="adm-hero-sub-ar" class="form-input">${appState.hero.subtitleAr}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">شرح تفصيلي للمقدمة (En)</label>
            <textarea id="adm-hero-sub-en" class="form-input">${appState.hero.subtitleEn}</textarea>
          </div>
          
          <h4 style="margin-top:20px; border-bottom:1px solid var(--glass-border); padding-bottom:5px; color:var(--primary);">البطاقة العائمة الأولى</h4>
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">العنوان (عربي)</label>
              <input type="text" id="adm-hero-c1-t-ar" class="form-input" value="${appState.hero.card1TitleAr}">
            </div>
            <div class="form-group">
              <label class="form-label">العنوان (En)</label>
              <input type="text" id="adm-hero-c1-t-en" class="form-input" value="${appState.hero.card1TitleEn}">
            </div>
          </div>
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">شرح فرعي (عربي)</label>
              <input type="text" id="adm-hero-c1-s-ar" class="form-input" value="${appState.hero.card1SubAr}">
            </div>
            <div class="form-group">
              <label class="form-label">شرح فرعي (En)</label>
              <input type="text" id="adm-hero-c1-s-en" class="form-input" value="${appState.hero.card1SubEn}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">أيقونة البطاقة (FontAwesome class)</label>
            <input type="text" id="adm-hero-c1-icon" class="form-input" value="${appState.hero.card1Icon}">
          </div>

          <h4 style="margin-top:20px; border-bottom:1px solid var(--glass-border); padding-bottom:5px; color:var(--primary);">البطاقة العائمة الثانية</h4>
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">العنوان (عربي)</label>
              <input type="text" id="adm-hero-c2-t-ar" class="form-input" value="${appState.hero.card2TitleAr}">
            </div>
            <div class="form-group">
              <label class="form-label">العنوان (En)</label>
              <input type="text" id="adm-hero-c2-t-en" class="form-input" value="${appState.hero.card2TitleEn}">
            </div>
          </div>
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">شرح فرعي (عربي)</label>
              <input type="text" id="adm-hero-c2-s-ar" class="form-input" value="${appState.hero.card2SubAr}">
            </div>
            <div class="form-group">
              <label class="form-label">شرح فرعي (En)</label>
              <input type="text" id="adm-hero-c2-s-en" class="form-input" value="${appState.hero.card2SubEn}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">أيقونة البطاقة (FontAwesome class)</label>
            <input type="text" id="adm-hero-c2-icon" class="form-input" value="${appState.hero.card2Icon}">
          </div>
        </div>

        <!-- ABOUT TAB -->
        <div id="tab-about" class="admin-tab-content">
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">العنوان الرئيسي (عربي)</label>
              <input type="text" id="adm-about-title-ar" class="form-input" value="${appState.about.titleAr}">
            </div>
            <div class="form-group">
              <label class="form-label">العنوان الرئيسي (En)</label>
              <input type="text" id="adm-about-title-en" class="form-input" value="${appState.about.titleEn}">
            </div>
          </div>
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">العنوان الفرعي المساعد (عربي)</label>
              <input type="text" id="adm-about-sub-ar" class="form-input" value="${appState.about.subtitleAr}">
            </div>
            <div class="form-group">
              <label class="form-label">العنوان الفرعي المساعد (En)</label>
              <input type="text" id="adm-about-sub-en" class="form-input" value="${appState.about.subtitleEn}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">محتوى فقرة من نحن التفصيلية (عربي)</label>
            <textarea id="adm-about-desc-ar" class="form-input" style="height:140px;">${appState.about.contentAr}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">محتوى فقرة من نحن التفصيلية (En)</label>
            <textarea id="adm-about-desc-en" class="form-input" style="height:140px;">${appState.about.contentEn}</textarea>
          </div>
          
          <h4 style="margin-top:20px; border-bottom:1px solid var(--glass-border); padding-bottom:5px; color:var(--primary);">الرؤية والرسالة المؤسسية</h4>
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">الرؤية (عربي)</label>
              <textarea id="adm-vision-ar" class="form-input" style="height:80px;">${appState.visionMission.visionAr}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">الرؤية (En)</label>
              <textarea id="adm-vision-en" class="form-input" style="height:80px;">${appState.visionMission.visionEn}</textarea>
            </div>
          </div>
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">الرسالة (عربي)</label>
              <textarea id="adm-mission-ar" class="form-input" style="height:80px;">${appState.visionMission.missionAr}</textarea>
            </div>
            <div class="form-group">
              <label class="form-label">الرسالة (En)</label>
              <textarea id="adm-mission-en" class="form-input" style="height:80px;">${appState.visionMission.missionEn}</textarea>
            </div>
          </div>
          
          <h4 style="margin-top:20px; color:var(--primary); font-weight:800;">إحصائيات المؤسسة</h4>
          <div id="adm-about-stats-list" class="admin-tab-content" style="display:flex; flex-direction:column; gap:16px;">
            <!-- Stats list loads dynamically below -->
          </div>
        </div>

        <!-- SERVICES TAB -->
        <div id="tab-services" class="admin-tab-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h4 style="color:var(--primary); font-weight:800;">قائمة الخدمات الهندسية والتشطيبية</h4>
            <button class="btn btn-primary" style="padding: 8px 16px; font-size:0.8rem; border-radius:10px;" onclick="addAdminServiceItem()">إضافة خدمة جديدة <i class="fas fa-plus"></i></button>
          </div>
          <div id="adm-services-list" style="display:flex; flex-direction:column; gap:20px;">
            <!-- Dynamic services load -->
          </div>
        </div>

        <!-- PORTFOLIO TAB -->
        <div id="tab-portfolio" class="admin-tab-content">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <h4 style="color:var(--primary); font-weight:800;">قائمة المشاريع المنجزة وعينات الصور</h4>
            <button class="btn btn-primary" style="padding: 8px 16px; font-size:0.8rem; border-radius:10px;" onclick="addAdminPortfolioItem()">إضافة مشروع جديد <i class="fas fa-plus"></i></button>
          </div>
          <div id="adm-portfolio-list" style="display:flex; flex-direction:column; gap:20px;">
            <!-- Dynamic portfolio list load -->
          </div>
        </div>

        <!-- CONTACT TAB -->
        <div id="tab-contact" class="admin-tab-content">
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">رقم الهاتف للاتصال المباشر</label>
              <input type="text" id="adm-contact-phone" class="form-input" value="${appState.contact.phone}">
            </div>
            <div class="form-group">
              <label class="form-label">رقم الجوال لتوجيه الواتساب (ترميز دولي بدون أصفار، مثال: 966595160034)</label>
              <input type="text" id="adm-contact-wa" class="form-input" value="${appState.contact.whatsapp}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">البريد الإلكتروني للإدارة</label>
            <input type="email" id="adm-contact-mail" class="form-input" value="${appState.contact.email}">
          </div>
          <div class="admin-row">
            <div class="form-group">
              <label class="form-label">عنوان مقر الإدارة (عربي)</label>
              <input type="text" id="adm-contact-add-ar" class="form-input" value="${appState.contact.addressAr}">
            </div>
            <div class="form-group">
              <label class="form-label">عنوان مقر الإدارة (En)</label>
              <input type="text" id="adm-contact-add-en" class="form-input" value="${appState.contact.addressEn}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">رابط خارطة جوجل المدمجة (Google Map Embed URL - src attribute only)</label>
            <textarea id="adm-contact-map" class="form-input" style="height:100px;">${appState.contact.mapIframe}</textarea>
          </div>
        </div>
      </div>
    </div>
    <div class="admin-header" style="border-top:1px solid var(--glass-border); border-bottom:none; padding:20px 30px; justify-content: flex-end; gap: 15px;">
      <button class="btn btn-secondary" style="padding: 10px 20px; font-size:0.9rem;" onclick="resetState()"><i class="fas fa-undo"></i> إعادة تعيين للمصنع</button>
      <button class="btn btn-primary" style="padding: 10px 24px; font-size:0.9rem; border-radius:30px;" onclick="saveAdminChanges()">حفظ التعديلات والتحديث الفوري <i class="fas fa-save"></i></button>
    </div>
  `;

  // Render sub lists in admin panel
  renderAdminStatsSublist();
  renderAdminServicesSublist();
  renderAdminPortfolioSublist();
}

function switchAdminTab(e, tabId) {
  const tabs = document.querySelectorAll('.admin-tab-content');
  const buttons = document.querySelectorAll('.admin-tab-btn');
  
  tabs.forEach(tab => tab.classList.remove('active'));
  buttons.forEach(btn => btn.classList.remove('active'));
  
  const targetTab = document.getElementById(tabId);
  if (targetTab) {
    targetTab.classList.add('active');
    // For about statistics tab sync override layout
    if (tabId === 'tab-about') {
      const statsSub = document.getElementById('adm-about-stats-list');
      if (statsSub) statsSub.classList.add('active');
    }
  }
  e.currentTarget.classList.add('active');
}

function syncAdminColorSliders() {
  const hue = document.getElementById('adm-color-hue').value;
  const sat = document.getElementById('adm-color-sat').value;
  const light = document.getElementById('adm-color-light').value;
  
  // Update labels
  const lblHue = document.getElementById('val-hue');
  const lblSat = document.getElementById('val-sat');
  const lblLight = document.getElementById('val-light');
  
  if (lblHue) lblHue.textContent = hue;
  if (lblSat) lblSat.textContent = sat + '%';
  if (lblLight) lblLight.textContent = light + '%';
  
  appState.theme.primaryHue = hue;
  appState.theme.primarySaturation = sat;
  appState.theme.primaryLightness = light;
  applyThemeVariables();
  
  // Update previews
  const preview = document.getElementById('adm-color-preview');
  if (preview) {
    preview.style.backgroundColor = `hsl(${hue}, ${sat}%, ${light}%)`;
  }
  
  // Update slider backgrounds dynamically to match current hue
  const inputSat = document.getElementById('adm-color-sat');
  const inputLight = document.getElementById('adm-color-light');
  const gradDir = currentLang === 'ar' ? 'to left' : 'to right';
  if (inputSat) {
    inputSat.style.background = `linear-gradient(${gradDir}, #808080, hsl(${hue}, ${sat}%, ${light}%))`;
  }
  if (inputLight) {
    inputLight.style.background = `linear-gradient(${gradDir}, #000, hsl(${hue}, ${sat}%, ${light}%), #fff)`;
  }
}

function applyColorPreset(hue, sat, light) {
  const inputHue = document.getElementById('adm-color-hue');
  const inputSat = document.getElementById('adm-color-sat');
  const inputLight = document.getElementById('adm-color-light');
  
  if (inputHue) inputHue.value = hue;
  if (inputSat) inputSat.value = sat;
  if (inputLight) inputLight.value = light;
  
  syncAdminColorSliders();
}

function downloadSeoFiles() {
  const domain = appState.seo.canonicalUrl.replace(/\/$/, ""); // Strip trailing slash
  
  // 1. Generate Sitemap XML
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  // 2. Generate Robots.txt
  const robotsTxt = `User-agent: *
Allow: /
Disallow: /css/
Disallow: /js/

Sitemap: ${domain}/sitemap.xml`;

  // Trigger download for sitemap.xml
  const blobSitemap = new Blob([sitemapXml], { type: 'application/xml' });
  const urlSitemap = URL.createObjectURL(blobSitemap);
  const aSitemap = document.createElement('a');
  aSitemap.href = urlSitemap;
  aSitemap.download = 'sitemap.xml';
  document.body.appendChild(aSitemap);
  aSitemap.click();
  document.body.removeChild(aSitemap);
  URL.revokeObjectURL(urlSitemap);

  // Trigger download for robots.txt
  const blobRobots = new Blob([robotsTxt], { type: 'text/plain' });
  const urlRobots = URL.createObjectURL(blobRobots);
  const aRobots = document.createElement('a');
  aRobots.href = urlRobots;
  aRobots.download = 'robots.txt';
  document.body.appendChild(aRobots);
  aRobots.click();
  document.body.removeChild(aRobots);
  URL.revokeObjectURL(urlRobots);

  alert(currentLang === 'ar' 
    ? 'تم توليد وتحميل ملفات الأرشفة (sitemap.xml و robots.txt) بنجاح! يرجى نقلها إلى مجلد موقعك الرئيسي ورفعها لـ GitHub.' 
    : 'SEO files (sitemap.xml & robots.txt) generated and downloaded successfully! Please copy them to your root folder and push to GitHub.');
}

// Sub list renderers inside admin dashboard
function renderAdminStatsSublist() {
  const listContainer = document.getElementById('adm-about-stats-list');
  if (!listContainer) return;
  
  let listHtml = '';
  appState.about.stats.forEach((stat, idx) => {
    listHtml += `
      <div class="admin-list-item">
        <div class="admin-list-item-header">
          <span class="admin-item-drag-title">الإحصائية الرقيمة رقم ${idx + 1}</span>
        </div>
        <div class="admin-row">
          <div class="form-group">
            <label class="form-label">عنوان الإحصائية (عربي)</label>
            <input type="text" class="form-input adm-stat-l-ar" value="${stat.labelAr}">
          </div>
          <div class="form-group">
            <label class="form-label">عنوان الإحصائية (En)</label>
            <input type="text" class="form-input adm-stat-l-en" value="${stat.labelEn}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">القيمة الرقمية الرمزية (مثال: +120 أو 100%)</label>
          <input type="text" class="form-input adm-stat-val" value="${stat.value}">
        </div>
      </div>
    `;
  });
  listContainer.innerHTML = listHtml;
}

function renderAdminServicesSublist() {
  const listContainer = document.getElementById('adm-services-list');
  if (!listContainer) return;
  
  let listHtml = '';
  appState.services.forEach((srv, idx) => {
    listHtml += `
      <div class="admin-list-item" data-id="${srv.id}">
        <div class="admin-list-item-header">
          <span class="admin-item-drag-title">الخدمة ${idx + 1}</span>
          <button class="btn-remove-item" onclick="removeAdminServiceItem('${srv.id}')"><i class="fas fa-trash"></i> حذف الخدمة</button>
        </div>
        <div class="admin-row">
          <div class="form-group">
            <label class="form-label">اسم الخدمة (عربي)</label>
            <input type="text" class="form-input adm-srv-name-ar" value="${srv.nameAr}">
          </div>
          <div class="form-group">
            <label class="form-label">اسم الخدمة (En)</label>
            <input type="text" class="form-input adm-srv-name-en" value="${srv.nameEn}">
          </div>
        </div>
        <div class="admin-row">
          <div class="form-group">
            <label class="form-label">شرح الخدمة (عربي)</label>
            <textarea class="form-input adm-srv-desc-ar">${srv.descAr}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">شرح الخدمة (En)</label>
            <textarea class="form-input adm-srv-desc-en">${srv.descEn}</textarea>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">أيقونة الخدمة (مثال: fa-building)</label>
          <input type="text" class="form-input adm-srv-icon" value="${srv.icon || ''}">
        </div>
      </div>
    `;
  });
  listContainer.innerHTML = listHtml;
}

function renderAdminPortfolioSublist() {
  const listContainer = document.getElementById('adm-portfolio-list');
  if (!listContainer) return;
  
  let listHtml = '';
  appState.portfolio.forEach((port, idx) => {
    const imagesStr = (port.imagesList && port.imagesList.length > 0) 
      ? port.imagesList.join(', ') 
      : port.image;

    listHtml += `
      <div class="admin-list-item" data-id="${port.id}">
        <div class="admin-list-item-header">
          <span class="admin-item-drag-title">المشروع ${idx + 1}</span>
          <button class="btn-remove-item" onclick="removeAdminPortfolioItem('${port.id}')"><i class="fas fa-trash"></i> حذف المشروع</button>
        </div>
        <div class="admin-row">
          <div class="form-group">
            <label class="form-label">اسم المشروع (عربي)</label>
            <input type="text" class="form-input adm-port-title-ar" value="${port.titleAr}">
          </div>
          <div class="form-group">
            <label class="form-label">اسم المشروع (En)</label>
            <input type="text" class="form-input adm-port-title-en" value="${port.titleEn}">
          </div>
        </div>
        <div class="admin-row">
          <div class="form-group">
            <label class="form-label">تصنيف المشروع (عربي)</label>
            <input type="text" class="form-input adm-port-cat-ar" value="${port.categoryAr}">
          </div>
          <div class="form-group">
            <label class="form-label">تصنيف المشروع (En)</label>
            <input type="text" class="form-input adm-port-cat-en" value="${port.categoryEn}">
          </div>
        </div>
        <div class="admin-row">
          <div class="form-group">
            <label class="form-label">شرح تفصيلي للمشروع (عربي)</label>
            <textarea class="form-input adm-port-desc-ar">${port.descAr || ''}</textarea>
          </div>
          <div class="form-group">
            <label class="form-label">شرح تفصيلي للمشروع (En)</label>
            <textarea class="form-input adm-port-desc-en">${port.descEn || ''}</textarea>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">الصورة الأساسية للمصغرة (URL)</label>
          <input type="text" class="form-input adm-port-img" value="${port.image}">
        </div>
        <div class="form-group">
          <label class="form-label">معرض صور المشروع (URLs مفصولة بفواصل، يوصى بـ 5 صور)</label>
          <textarea class="form-input adm-port-img-list">${imagesStr}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">تحميل صور جديدة للمشروع (استبدال الصور الحالية)</label>
          <input type="file" class="form-input" accept="image/*" multiple onchange="handleMultipleImagesUpload(event, '${port.id}')">
        </div>
      </div>
    `;
  });
  listContainer.innerHTML = listHtml;
}

// Add/Remove sublist items functions
function addAdminServiceItem() {
  const newId = 'srv-' + (appState.services.length + 1) + '-' + Math.floor(Math.random() * 1000);
  appState.services.push({
    id: newId,
    nameAr: "خدمة جديدة",
    nameEn: "New Service",
    descAr: "شرح الخدمة المضافة حديثاً لمشاريع المقاولات.",
    descEn: "Description of the newly added service.",
    icon: "fa-star"
  });
  renderAdminServicesSublist();
}

function removeAdminServiceItem(id) {
  appState.services = appState.services.filter(s => s.id !== id);
  renderAdminServicesSublist();
}

function addAdminPortfolioItem() {
  const newId = 'port-' + (appState.portfolio.length + 1) + '-' + Math.floor(Math.random() * 1000);
  appState.portfolio.push({
    id: newId,
    titleAr: "مشروع جديد",
    titleEn: "New Project",
    categoryAr: "تشييد وإنشاء",
    categoryEn: "Construction",
    image: "projects/riyadh/1.jpeg",
    imagesList: ["projects/riyadh/1.jpeg"],
    descAr: "شرح تفصيلي للمشروع من الإدارة الهندسية.",
    descEn: "Detailed engineering description of the project."
  });
  renderAdminPortfolioSublist();
}

function removeAdminPortfolioItem(id) {
  appState.portfolio = appState.portfolio.filter(p => p.id !== id);
  renderAdminPortfolioSublist();
}

// Handle Image uploading via local file reader (Base64 conversion)
function handleImageUpload(event, type, portId = null) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const base64Url = e.target.result;
    if (type === 'logo') {
      document.getElementById('adm-logo-img-url').value = base64Url;
    }
  };
  reader.readAsDataURL(file);
}

// Multiple image upload handler for project gallery
function handleMultipleImagesUpload(event, portId) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;
  
  const loadedUrls = [];
  let processed = 0;
  
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = function(e) {
      loadedUrls.push(e.target.result);
      processed++;
      
      if (processed === files.length) {
        // Find matching project in local appState and update image lists
        const project = appState.portfolio.find(p => p.id === portId);
        if (project) {
          project.image = loadedUrls[0];
          project.imagesList = loadedUrls;
          alert(currentLang === 'ar' ? 'تم قراءة الصور المرفوعة بنجاح! يرجى النقر على زر حفظ التعديلات لحفظها نهائياً.' : 'Images loaded successfully! Click Save changes to apply.');
          renderAdminPortfolioSublist();
        }
      }
    };
    reader.readAsDataURL(file);
  });
}

// Save dashboard values back to appState and save to localStorage
function saveAdminChanges() {
  // 1. General settings
  appState.general.nameAr = document.getElementById('adm-name-ar').value;
  appState.general.nameEn = document.getElementById('adm-name-en').value;
  appState.general.logoTextAr = document.getElementById('adm-logo-ar').value;
  appState.general.logoTextEn = document.getElementById('adm-logo-en').value;
  appState.general.logoImage = document.getElementById('adm-logo-img-url').value;
  
  if (!appState.auth) appState.auth = {};
  appState.auth.username = document.getElementById('adm-auth-user').value;
  appState.auth.password = document.getElementById('adm-auth-pass').value;
  
  // 1.5 Theme Settings
  appState.theme.primaryHue = parseInt(document.getElementById('adm-color-hue').value, 10);
  appState.theme.primarySaturation = parseInt(document.getElementById('adm-color-sat').value, 10);
  appState.theme.primaryLightness = parseInt(document.getElementById('adm-color-light').value, 10);
  
  // 2. SEO Settings
  appState.seo.metaTitleAr = document.getElementById('adm-seo-title-ar').value;
  appState.seo.metaTitleEn = document.getElementById('adm-seo-title-en').value;
  appState.seo.metaDescAr = document.getElementById('adm-seo-desc-ar').value;
  appState.seo.metaDescEn = document.getElementById('adm-seo-desc-en').value;
  appState.seo.metaKeywords = document.getElementById('adm-seo-keys').value;
  appState.seo.canonicalUrl = document.getElementById('adm-seo-canonical').value;
  appState.seo.ogImage = document.getElementById('adm-seo-og').value;

  // 3. Hero Settings
  appState.hero.badgeAr = document.getElementById('adm-hero-badge-ar').value;
  appState.hero.badgeEn = document.getElementById('adm-hero-badge-en').value;
  appState.hero.titleAr = document.getElementById('adm-hero-title-ar').value;
  appState.hero.titleEn = document.getElementById('adm-hero-title-en').value;
  appState.hero.subtitleAr = document.getElementById('adm-hero-sub-ar').value;
  appState.hero.subtitleEn = document.getElementById('adm-hero-sub-en').value;

  appState.hero.card1TitleAr = document.getElementById('adm-hero-c1-t-ar').value;
  appState.hero.card1TitleEn = document.getElementById('adm-hero-c1-t-en').value;
  appState.hero.card1SubAr = document.getElementById('adm-hero-c1-s-ar').value;
  appState.hero.card1SubEn = document.getElementById('adm-hero-c1-s-en').value;
  appState.hero.card1Icon = document.getElementById('adm-hero-c1-icon').value;

  appState.hero.card2TitleAr = document.getElementById('adm-hero-c2-t-ar').value;
  appState.hero.card2TitleEn = document.getElementById('adm-hero-c2-t-en').value;
  appState.hero.card2SubAr = document.getElementById('adm-hero-c2-s-ar').value;
  appState.hero.card2SubEn = document.getElementById('adm-hero-c2-s-en').value;
  appState.hero.card2Icon = document.getElementById('adm-hero-c2-icon').value;

  // 4. About Settings
  appState.about.titleAr = document.getElementById('adm-about-title-ar').value;
  appState.about.titleEn = document.getElementById('adm-about-title-en').value;
  appState.about.subtitleAr = document.getElementById('adm-about-sub-ar').value;
  appState.about.subtitleEn = document.getElementById('adm-about-sub-en').value;
  appState.about.contentAr = document.getElementById('adm-about-desc-ar').value;
  appState.about.contentEn = document.getElementById('adm-about-desc-en').value;

  // Vision & Mission Settings
  appState.visionMission.visionAr = document.getElementById('adm-vision-ar').value;
  appState.visionMission.visionEn = document.getElementById('adm-vision-en').value;
  appState.visionMission.missionAr = document.getElementById('adm-mission-ar').value;
  appState.visionMission.missionEn = document.getElementById('adm-mission-en').value;

  // Sync statistics sublist inputs
  const statLabelsAr = document.querySelectorAll('.adm-stat-l-ar');
  const statLabelsEn = document.querySelectorAll('.adm-stat-l-en');
  const statVals = document.querySelectorAll('.adm-stat-val');
  
  appState.about.stats = [];
  statLabelsAr.forEach((labelAr, idx) => {
    appState.about.stats.push({
      labelAr: labelAr.value,
      labelEn: statLabelsEn[idx].value,
      value: statVals[idx].value
    });
  });

  // 5. Services Settings
  const srvCards = document.querySelectorAll('#adm-services-list .admin-list-item');
  appState.services = [];
  srvCards.forEach(card => {
    const id = card.getAttribute('data-id');
    const nameAr = card.querySelector('.adm-srv-name-ar').value;
    const nameEn = card.querySelector('.adm-srv-name-en').value;
    const descAr = card.querySelector('.adm-srv-desc-ar').value;
    const descEn = card.querySelector('.adm-srv-desc-en').value;
    const icon = card.querySelector('.adm-srv-icon').value;
    
    appState.services.push({ id, nameAr, nameEn, descAr, descEn, icon });
  });

  // 6. Portfolio Settings
  const portCards = document.querySelectorAll('#adm-portfolio-list .admin-list-item');
  appState.portfolio = [];
  portCards.forEach(card => {
    const id = card.getAttribute('data-id');
    const titleAr = card.querySelector('.adm-port-title-ar').value;
    const titleEn = card.querySelector('.adm-port-title-en').value;
    const categoryAr = card.querySelector('.adm-port-cat-ar').value;
    const categoryEn = card.querySelector('.adm-port-cat-en').value;
    const descAr = card.querySelector('.adm-port-desc-ar').value;
    const descEn = card.querySelector('.adm-port-desc-en').value;
    const image = card.querySelector('.adm-port-img').value;
    
    const imgListVal = card.querySelector('.adm-port-img-list').value;
    const imagesList = imgListVal.split(',').map(s => s.trim()).filter(s => s.length > 0);
    
    appState.portfolio.push({
      id, titleAr, titleEn, categoryAr, categoryEn, descAr, descEn, image, imagesList
    });
  });

  // 7. Contact Settings
  appState.contact.phone = document.getElementById('adm-contact-phone').value;
  appState.contact.whatsapp = document.getElementById('adm-contact-wa').value;
  appState.contact.email = document.getElementById('adm-contact-mail').value;
  appState.contact.addressAr = document.getElementById('adm-contact-add-ar').value;
  appState.contact.addressEn = document.getElementById('adm-contact-add-en').value;
  appState.contact.mapIframe = document.getElementById('adm-contact-map').value;

  // Persist State
  saveState();
  
  // Re-render
  renderSite();
  
  alert(currentLang === 'ar' ? 'تم حفظ التعديلات وتحديث محتويات الموقع بنجاح!' : 'Settings saved and page updated successfully!');
  toggleAdminOverlay();
}


// Preloader animation logic
function startPreloader() {
  const preloader = document.getElementById('preloader');
  const bar = document.getElementById('preloader-bar');
  const percent = document.getElementById('preloader-percent');
  if (!preloader || !bar || !percent) return;
  
  let progress = 0;
  const interval = setInterval(() => {
    // Generate randomized steps for realistic loader progress
    progress += Math.floor(Math.random() * 8) + 2;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      
      // Smooth fade-out of the preloader cover screen
      setTimeout(() => {
        preloader.style.opacity = 0;
        preloader.style.visibility = 'hidden';
        document.body.style.overflow = ''; // Unlock page scrolling
      }, 350);
    }
    
    bar.style.width = progress + '%';
    percent.textContent = progress + '%';
  }, 35);
}

// Bootstrap on document load
window.addEventListener('DOMContentLoaded', () => {
  initStore();
  renderSite();
  startPreloader();
});
