const WHATSAPP_NUMBER = "27692202159";

const icons = {
  bot: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/></svg>`,
  chat: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>`,
  gear: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>`,
  app: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/></svg>`,
};

const services = [
  {
    title: "AI Chatbots",
    description: "Automate customer support and lead qualification 24/7",
    price: "R2,000 setup + R500/month",
    icon: icons.bot,
  },
  {
    title: "WhatsApp Automation",
    description: "Streamline customer communication and sales follow-ups",
    price: "R1,500/month",
    icon: icons.chat,
  },
  {
    title: "Lead Generation Systems",
    description: "Attract and qualify leads automatically using AI",
    price: "R2,500 setup + R800/month",
    icon: icons.chart,
  },
  {
    title: "Business Process Automation",
    description: "Full-package automation for your entire business workflow",
    price: "R5,000/month",
    icon: icons.gear,
  },
  {
    title: "We Build Apps",
    description: "Custom mobile and web apps built to grow your business",
    price: "From R15,000",
    icon: icons.app,
  },
];

function whatsappUrl(message) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

function renderServices() {
  const grid = document.getElementById("servicesGrid");
  if (!grid) return;

  grid.innerHTML = services
    .map((service) => {
      const interestMessage = `Hello Leroy AI Solutions, I'm interested in ${service.title}. Please assist me.`;
      return `
        <article class="service-card">
          <div class="service-icon">${service.icon}</div>
          <h3>${service.title}</h3>
          <p>${service.description}</p>
          <div class="price">${service.price}</div>
          <a class="btn btn-primary" href="${whatsappUrl(interestMessage)}" target="_blank" rel="noopener">
            Get This Service
          </a>
        </article>
      `;
    })
    .join("");
}

function setupContactForm() {
  const form = document.getElementById("contactForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const message = `Hello Leroy AI Solutions, I'm interested in your services.

Name: ${data.get("name")}
Phone: ${data.get("phone")}
Business Type: ${data.get("businessType")}
Message: ${data.get("message")}`;

    window.open(whatsappUrl(message), "_blank", "noopener");
  });
}

function setupNavToggle() {
  const toggle = document.getElementById("navToggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    links.classList.toggle("open");
  });

  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => links.classList.remove("open"));
  });
}

renderServices();
setupContactForm();
setupNavToggle();
