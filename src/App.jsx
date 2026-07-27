import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDown,
  ArrowRight,
  Award,
  Building2,
  Check,
  ChevronRight,
  CircleCheck,
  ExternalLink,
  Factory,
  Facebook,
  FileText,
  Gauge,
  HardHat,
  Instagram,
  LoaderCircle,
  Mail,
  MapPin,
  Menu,
  MessageCircle,
  Pause,
  Phone,
  Pickaxe,
  Play,
  Send,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  Volume2,
  VolumeX,
  Wrench,
  X,
} from 'lucide-react'

const CONTACT = {
  info: 'Info@Vikelamining.co.za',
  executive: 'Tebogo@vikelamining.co.za',
  admin: 'Admin@vikelamining.co.za',
  operations: 'Duduzile@vikelamining.co.za',
  phone: '+27 14 061 0718',
  mobile: '+27 61 188 36379',
  address: 'House No 46, Boitekong Ext 13, Rustenburg, North West, 0300',
  whatsapp: 'https://wa.me/276118836379',
  messenger: 'https://m.me/YourFacebookPageUsername',
  instagram: 'https://ig.me/m/YourInstagramHandle',
  x: 'https://x.com/messages/compose?recipient_id=YOUR_USER_ID',
}

const navLinks = [
  ['Home', '#home'],
  ['About us', '#about'],
  ['Services hub', '#services'],
  ['Safety & SHEQ', '#safety'],
  ['Visual gallery', '#gallery'],
  ['Contact us', '#contact'],
]

const services = [
  {
    number: '01',
    icon: Pickaxe,
    title: 'Mining & Underground',
    description:
      'End-to-end underground execution, development, rehabilitation and production support.',
    items: [
      'Contract mining & main development',
      'White area mining & drop raising-inverse',
      'Sweeping, vamping & haulage upgrades',
      'Gunnite, wetcrete, drycrete & thin liner',
      'Long anchors, stripes & superskin',
      'Clamp/arch sets & box construction',
    ],
  },
  {
    number: '02',
    icon: ShieldCheck,
    title: 'Technical & Safe Blasting',
    description:
      'Purpose-built blasting solutions that put controlled execution and worker protection first.',
    items: [
      'Safe blasting solutions',
      'Safety detonator clips',
      'Safety tampings',
      'AP wrap',
      'Blast-area risk controls',
      'Site-aligned technical support',
    ],
  },
  {
    number: '03',
    icon: Wrench,
    title: 'Engineering & Equipment',
    description:
      'Integrated equipment supply and multidisciplinary engineering for demanding mine environments.',
    items: [
      'Compressors, conveyors & spares',
      'Crusher spares, pumps & hoisting',
      'Cranes, winders, fuel & lubricants',
      'HDPE & PTFE pipe systems',
      'Earthmoving, crushing & screening',
      'Civil, electrical & mechanical works',
    ],
  },
  {
    number: '04',
    icon: Factory,
    title: 'Fabrication & Logistics',
    description:
      'Engineered steel systems and coordinated material movement from workshop to working face.',
    items: [
      'Surface & underground conveyors',
      'Tips, grizzlies, chutes & screens',
      'Bins and custom steel fabrication',
      'Ore transportation',
      'Fleet and route coordination',
      'Loading and hauling',
    ],
  },
]

const safetyPoints = [
  {
    icon: HardHat,
    title: 'PPE is non-negotiable',
    text: 'Mandatory, task-specific personal protective equipment is enforced across every work area.',
  },
  {
    icon: Gauge,
    title: 'Equipment fit for purpose',
    text: 'Tools, machines and safeguards are checked, maintained and used only as intended.',
  },
  {
    icon: FileText,
    title: 'Ready for the unexpected',
    text: 'Site-specific emergency and contingency plans support disciplined incident response.',
  },
  {
    icon: Users,
    title: 'Personal accountability',
    text: 'Every team member is empowered and responsible to stop unsafe work and act with care.',
  },
]

const galleryItems = [
  {
    id: 1,
    category: 'Underground Operations',
    title: 'Underground development',
    caption: 'Development cycles built around disciplined planning and safe production.',
    image:
      'https://images.unsplash.com/photo-1578319439584-104c94d37305?auto=format&fit=crop&w=1200&q=84',
    type: 'video',
  },
  {
    id: 2,
    category: 'Engineering & Equipment',
    title: 'Heavy equipment readiness',
    caption: 'Reliable plant and fit-for-purpose equipment for demanding operating conditions.',
    image:
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=84',
  },
  {
    id: 3,
    category: 'Steel Fabrication',
    title: 'Precision fabrication',
    caption: 'Robust components fabricated to meet site requirements and operating loads.',
    image:
      'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1200&q=84',
  },
  {
    id: 4,
    category: 'Logistics Fleet',
    title: 'Coordinated material movement',
    caption: 'Planned routes, reliable loading and disciplined fleet execution.',
    image:
      'https://images.unsplash.com/photo-1519003722824-194d4455a60c?auto=format&fit=crop&w=1200&q=84',
  },
  {
    id: 5,
    category: 'Engineering & Equipment',
    title: 'Mechanical capability',
    caption: 'Integrated maintenance and engineering support that keeps operations moving.',
    image:
      'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=1200&q=84',
  },
  {
    id: 6,
    category: 'Underground Operations',
    title: 'Ground support systems',
    caption: 'Practical reinforcement and support solutions for controlled underground access.',
    image:
      'https://images.unsplash.com/photo-1574689049868-e94ed5301745?auto=format&fit=crop&w=1200&q=84',
  },
  {
    id: 7,
    category: 'Steel Fabrication',
    title: 'Conveyor infrastructure',
    caption: 'Fabricated transfer systems designed for efficient materials handling.',
    image:
      'https://images.unsplash.com/photo-1565610222536-ef125c59da2e?auto=format&fit=crop&w=1200&q=84',
  },
  {
    id: 8,
    category: 'Logistics Fleet',
    title: 'Operational coordination',
    caption: 'Clear communication from dispatch through delivery and site handover.',
    image:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=84',
  },
]

const galleryFilters = [
  'All',
  'Underground Operations',
  'Engineering & Equipment',
  'Steel Fabrication',
  'Logistics Fleet',
]

const departments = [
  {
    label: 'General inquiries',
    name: 'Company information',
    email: CONTACT.info,
    icon: MessageCircle,
  },
  {
    label: 'Executive office',
    name: 'Ms. Dipalesa Tebogo Monare',
    email: CONTACT.executive,
    icon: Building2,
  },
  {
    label: 'Admin & tenders',
    name: 'Quotations and tender packs',
    email: CONTACT.admin,
    icon: FileText,
  },
  {
    label: 'Operations',
    name: 'Projects and team contact',
    email: CONTACT.operations,
    icon: HardHat,
  },
]

const socialLinks = [
  { label: 'WhatsApp', href: CONTACT.whatsapp, icon: MessageCircle },
  { label: 'Messenger', href: CONTACT.messenger, icon: Facebook },
  { label: 'Instagram', href: CONTACT.instagram, icon: Instagram },
  { label: 'X direct message', href: CONTACT.x, icon: Send },
]

function Logo({ inverse = false }) {
  return (
    <a className={`brand ${inverse ? 'brand--inverse' : ''}`} href="#home" aria-label="Vikela Mining home">
      <svg className="brand__mark" viewBox="0 0 56 56" aria-hidden="true">
        <path d="M5 4h46L30 52h-4L5 4Z" fill="currentColor" />
        <path d="M17 14h10l1 18 8-18h9L29 44h-3L17 14Z" fill="var(--brand-cut)" />
        <path d="M42 5h9L30 52h-4L42 5Z" fill="#ff9f1c" />
      </svg>
      <span className="brand__text">
        <strong>VIKELA</strong>
        <small>MINING (PTY) LTD</small>
      </span>
    </a>
  )
}

function MagneticLink({ children, className = '', href, onClick, type, ...props }) {
  const ref = useRef(null)

  const handleMove = (event) => {
    if (window.matchMedia('(pointer: coarse), (prefers-reduced-motion: reduce)').matches) return
    const rect = ref.current.getBoundingClientRect()
    const x = (event.clientX - rect.left - rect.width / 2) * 0.13
    const y = (event.clientY - rect.top - rect.height / 2) * 0.13
    ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }

  const reset = () => {
    if (ref.current) ref.current.style.transform = ''
  }

  if (href) {
    return (
      <a
        ref={ref}
        href={href}
        className={className}
        onMouseMove={handleMove}
        onMouseLeave={reset}
        {...props}
      >
        {children}
      </a>
    )
  }

  return (
    <button
      ref={ref}
      type={type ?? 'button'}
      className={className}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      {...props}
    >
      {children}
    </button>
  )
}

function TopBar() {
  return (
    <div className="topbar">
      <div className="shell topbar__inner">
        <div className="topbar__contacts">
          <a href={`mailto:${CONTACT.info}`}>
            <Mail size={14} />
            <span>{CONTACT.info}</span>
          </a>
          <span className="topbar__divider" aria-hidden="true" />
          <a href="tel:+27140610718">
            <Phone size={14} />
            <span>{CONTACT.phone}</span>
          </a>
          <a href="tel:+276118836379" className="topbar__secondary-phone">
            <span>{CONTACT.mobile}</span>
          </a>
        </div>
        <div className="topbar__socials" aria-label="Direct message channels">
          <span>Connect directly</span>
          {socialLinks.map(({ label, href, icon: Icon }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>
              <Icon size={15} />
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function Header({ onQuote }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <TopBar />
      <div className="nav-wrap">
        <div className="shell main-nav">
          <Logo />
          <nav className={`nav-links ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
            {navLinks.map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <button className="nav-links__mobile-quote" onClick={() => { setMenuOpen(false); onQuote() }}>
              Request a quote
              <ArrowRight size={17} />
            </button>
          </nav>
          <button className="nav-quote" onClick={onQuote}>
            Request a quote
            <ArrowRight size={17} />
          </button>
          <button
            className="menu-button"
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  )
}

function SectionHeading({ eyebrow, title, body, light = false, align = 'left' }) {
  return (
    <div className={`section-heading section-heading--${align} ${light ? 'section-heading--light' : ''}`}>
      <span className="eyebrow">
        <span />
        {eyebrow}
      </span>
      <h2>{title}</h2>
      {body && <p>{body}</p>}
    </div>
  )
}

function Hero({ onQuote }) {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(true)

  const togglePlayback = () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      videoRef.current.play()
      setPlaying(true)
    } else {
      videoRef.current.pause()
      setPlaying(false)
    }
  }

  const toggleMute = () => {
    if (!videoRef.current) return
    videoRef.current.muted = !videoRef.current.muted
    setMuted(videoRef.current.muted)
  }

  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <video
        ref={videoRef}
        className="hero__video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="https://images.unsplash.com/photo-1578319439584-104c94d37305?auto=format&fit=crop&w=2000&q=86"
        aria-hidden="true"
      >
        <source
          src="https://videos.pexels.com/video-files/2887463/2887463-hd_1920_1080_25fps.mp4"
          type="video/mp4"
        />
      </video>
      <div className="hero__scrim" />
      <div className="hero__grid" aria-hidden="true" />
      <div className="shell hero__content">
        <div className="hero__copy">
          <div className="hero__kicker">
            <span>South African mining capability</span>
            <span className="hero__kicker-line" />
          </div>
          <h1 id="hero-title">
            Pioneering modern,
            <span>sustainable mining</span>
            &amp; engineering
          </h1>
          <p className="hero__slogan">Zero Harm, High Performance &amp; Maximum Profits.</p>
          <div className="hero__actions">
            <MagneticLink className="button button--amber" href="#services">
              Explore capabilities
              <ArrowDown size={18} />
            </MagneticLink>
            <MagneticLink
              className="button button--glass"
              href={CONTACT.whatsapp}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={19} />
              Direct chat
            </MagneticLink>
            <button className="hero__text-action" onClick={onQuote}>
              Tender inquiry
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
      <div className="hero__trust-wrap">
        <div className="shell hero__trust">
          <div className="hero__trust-label">
            <ShieldCheck size={27} />
            <span>
              <small>Built on trust</small>
              Verified capability
            </span>
          </div>
          <div className="hero__trust-item">
            <strong>01</strong>
            <span>Level 1 B-BBEE<br />Contributor</span>
          </div>
          <div className="hero__trust-item">
            <strong>100%</strong>
            <span>Black female-owned<br />&amp; managed</span>
          </div>
          <div className="hero__trust-item">
            <CircleCheck size={23} />
            <span>Mine Health &amp; Safety<br />Act aligned</span>
          </div>
        </div>
      </div>
      <div className="hero__media-controls">
        <button onClick={togglePlayback} aria-label={playing ? 'Pause background video' : 'Play background video'}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button onClick={toggleMute} aria-label={muted ? 'Unmute background video' : 'Mute background video'}>
          {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </section>
  )
}

function About() {
  const leaders = [
    ['DM', 'Ms. Dipalesa Tebogo Monare', 'Managing Director / CEO'],
    ['RM', 'Mr. Rantsha Makgato', 'Project Manager'],
    ['MS', 'Mr. Mark Shirley', 'Operations / SHE Manager'],
  ]

  return (
    <section className="section about" id="about">
      <div className="shell">
        <div className="about__intro">
          <SectionHeading
            eyebrow="Who we are"
            title={<>Mining progress.<br />Built responsibly.</>}
            body="Vikela Mining combines practical mine-site capability with accountable leadership and a commitment to lasting value."
          />
          <div className="about__narrative">
            <p className="about__lead">
              We deliver sustainable mining, engineering, fabrication and logistics solutions that
              help our partners operate safely, efficiently and with confidence.
            </p>
            <p>
              Our approach goes beyond execution. We create pathways for skill transfer and job
              creation while building durable economic partnerships across private and public
              sectors. Every engagement is anchored in transparent planning, capable teams and
              responsible operational delivery.
            </p>
            <div className="about__principles">
              {['Sustainable operations', 'Skills transfer', 'Local job creation', 'Economic partnership'].map((item) => (
                <span key={item}><Check size={15} />{item}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="about__visual reveal">
          <img
            src="https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1600&q=85"
            alt="Industrial engineering team working together"
            loading="lazy"
          />
          <div className="about__visual-overlay">
            <span>Our operating promise</span>
            <strong>Responsible capability at every level.</strong>
          </div>
          <div className="about__legal">
            <Award size={24} />
            <span>
              <small>Registered under Companies Act</small>
              2021/804647/07
            </span>
          </div>
        </div>

        <div className="leadership">
          <div className="leadership__heading">
            <span>Leadership</span>
            <h3>Accountable from the top.</h3>
            <p>Experienced oversight across executive management, project delivery and SHE operations.</p>
          </div>
          <div className="leadership__grid">
            {leaders.map(([initials, name, role], index) => (
              <article className="leader-card reveal" key={name} style={{ '--delay': `${index * 90}ms` }}>
                <div className="leader-card__portrait">
                  <span>{initials}</span>
                  <div className="leader-card__lines" />
                </div>
                <div className="leader-card__content">
                  <span className="leader-card__index">0{index + 1}</span>
                  <h4>{name}</h4>
                  <p>{role}</p>
                  {index === 0 && (
                    <a href={`mailto:${CONTACT.executive}`} aria-label={`Email ${name}`}>
                      <Mail size={16} />
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Services({ onQuote }) {
  const [active, setActive] = useState(0)
  const ActiveIcon = services[active].icon

  return (
    <section className="section services" id="services">
      <div className="services__watermark" aria-hidden="true">CAPABILITY</div>
      <div className="shell">
        <div className="services__top">
          <SectionHeading
            eyebrow="Integrated service hub"
            title={<>One partner.<br />Four core disciplines.</>}
            body="A connected capability model designed to reduce handover friction and keep work moving from plan to production."
          />
          <button className="text-link" onClick={onQuote}>
            Discuss your scope
            <span><ArrowRight size={18} /></span>
          </button>
        </div>
        <div className="services__layout">
          <div className="services__tabs" role="tablist" aria-label="Mining service departments">
            {services.map((service, index) => {
              const Icon = service.icon
              return (
                <button
                  key={service.title}
                  className={active === index ? 'is-active' : ''}
                  onClick={() => setActive(index)}
                  role="tab"
                  aria-selected={active === index}
                  aria-controls={`service-panel-${index}`}
                  id={`service-tab-${index}`}
                >
                  <span className="services__tab-number">{service.number}</span>
                  <span className="services__tab-icon"><Icon size={22} /></span>
                  <span>{service.title}</span>
                  <ChevronRight size={19} />
                </button>
              )
            })}
          </div>
          <div
            className="service-panel"
            role="tabpanel"
            id={`service-panel-${active}`}
            aria-labelledby={`service-tab-${active}`}
          >
            <div className="service-panel__header">
              <span>{services[active].number}</span>
              <ActiveIcon size={33} />
            </div>
            <h3>{services[active].title}</h3>
            <p>{services[active].description}</p>
            <div className="service-panel__items">
              {services[active].items.map((item) => (
                <span key={item}>
                  <Check size={15} />
                  {item}
                </span>
              ))}
            </div>
            <button onClick={onQuote}>
              Request this capability
              <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Safety() {
  return (
    <section className="section safety" id="safety">
      <div className="safety__image" aria-hidden="true" />
      <div className="safety__mesh" aria-hidden="true" />
      <div className="shell safety__inner">
        <div className="safety__statement">
          <span className="eyebrow eyebrow--amber"><span />Safety, health, environment &amp; quality</span>
          <div className="safety__zero">
            <strong>ZERO</strong>
            <span>HARM</span>
          </div>
          <h2>No accidents.<br />No compromises.</h2>
          <p>
            Safety is not a target we trade against production. It is the operating condition for
            every task, every shift and every person.
          </p>
          <div className="safety__acts">
            <ShieldCheck size={26} />
            <div>
              <span>Full legislative alignment</span>
              <p>Mine Health and Safety Act No. 29 of 1996</p>
              <p>Occupational Health and Safety Act No. 85 of 1993</p>
            </div>
          </div>
        </div>
        <div className="safety__points">
          {safetyPoints.map(({ icon: Icon, title, text }, index) => (
            <article key={title} className="safety-point reveal" style={{ '--delay': `${index * 70}ms` }}>
              <div className="safety-point__number">0{index + 1}</div>
              <Icon size={27} />
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function Gallery({ onOpen }) {
  const [filter, setFilter] = useState('All')
  const filteredItems = useMemo(
    () => filter === 'All' ? galleryItems : galleryItems.filter((item) => item.category === filter),
    [filter],
  )

  return (
    <section className="section gallery" id="gallery">
      <div className="shell">
        <div className="gallery__top">
          <SectionHeading
            eyebrow="Inside the work"
            title="Capability in motion."
            body="Explore the environments, equipment and coordinated disciplines behind Vikela Mining delivery."
          />
          <div className="gallery__filters" role="group" aria-label="Filter project gallery">
            {galleryFilters.map((item) => (
              <button
                key={item}
                className={filter === item ? 'is-active' : ''}
                onClick={() => setFilter(item)}
                aria-pressed={filter === item}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="gallery__grid" aria-live="polite">
          {filteredItems.map((item, index) => (
            <button
              className={`gallery-card ${index === 0 ? 'gallery-card--wide' : ''}`}
              key={item.id}
              onClick={() => onOpen(item)}
              aria-label={`Open ${item.title}`}
            >
              <img src={item.image} alt="" loading="lazy" />
              <span className="gallery-card__shade" />
              <span className="gallery-card__category">{item.category}</span>
              {item.type === 'video' && (
                <span className="gallery-card__play"><Play size={21} fill="currentColor" /></span>
              )}
              <span className="gallery-card__content">
                <strong>{item.title}</strong>
                <span>View project <ArrowRight size={15} /></span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}

async function sendInquiry(data) {
  const response = await fetch(`https://formsubmit.co/ajax/${CONTACT.admin}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      ...data,
      _subject: `Website inquiry: ${data.service || data.department}`,
      _template: 'table',
      _captcha: 'false',
    }),
  })

  if (!response.ok) throw new Error('Inquiry service unavailable')
  return response.json()
}

function InquiryForm({ compact = false, onComplete }) {
  const [status, setStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const prefix = compact ? 'quote' : 'contact'

  const handleSubmit = async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form))
    if (data.website) return

    setStatus('submitting')
    setMessage('')
    try {
      await sendInquiry(data)
      setStatus('success')
      setMessage('Your inquiry has been sent to the Vikela Mining admin team.')
      form.reset()
      onComplete?.()
    } catch {
      const subject = encodeURIComponent(`Vikela Mining website inquiry — ${data.service}`)
      const body = encodeURIComponent(
        `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nDepartment: ${data.department}\nService: ${data.service}\n\n${data.message}`,
      )
      window.location.href = `mailto:${CONTACT.admin}?subject=${subject}&body=${body}`
      setStatus('fallback')
      setMessage('Your email app has been opened with the inquiry ready to send.')
    }
  }

  return (
    <form className={`inquiry-form ${compact ? 'inquiry-form--compact' : ''}`} onSubmit={handleSubmit}>
      <div className="form-row">
        <label htmlFor={`${prefix}-name`}>
          Full name <span>*</span>
          <input id={`${prefix}-name`} name="name" autoComplete="name" required placeholder="Your name" />
        </label>
        <label htmlFor={`${prefix}-email`}>
          Email address <span>*</span>
          <input
            id={`${prefix}-email`}
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="name@company.co.za"
          />
        </label>
      </div>
      <div className="form-row">
        <label htmlFor={`${prefix}-phone`}>
          Phone number <span>*</span>
          <input id={`${prefix}-phone`} name="phone" type="tel" autoComplete="tel" required placeholder="+27" />
        </label>
        <label htmlFor={`${prefix}-department`}>
          Department <span>*</span>
          <select id={`${prefix}-department`} name="department" required defaultValue="">
            <option value="" disabled>Select a department</option>
            <option>General inquiries</option>
            <option>Executive office</option>
            <option>Admin & tenders</option>
            <option>Operations</option>
          </select>
        </label>
      </div>
      <label htmlFor={`${prefix}-service`}>
        Service category <span>*</span>
        <select id={`${prefix}-service`} name="service" required defaultValue="">
          <option value="" disabled>Select required capability</option>
          {services.map((service) => <option key={service.title}>{service.title}</option>)}
          <option>Other / multiple services</option>
        </select>
      </label>
      <label htmlFor={`${prefix}-message`}>
        Project or inquiry details <span>*</span>
        <textarea
          id={`${prefix}-message`}
          name="message"
          required
          rows={compact ? 4 : 5}
          placeholder="Tell us about the scope, location and support you need..."
        />
      </label>
      <label className="form-honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex="-1" autoComplete="off" />
      </label>
      <div className="form-submit">
        <button className="button button--amber" type="submit" disabled={status === 'submitting'}>
          {status === 'submitting' ? (
            <><LoaderCircle className="spin" size={18} /> Sending inquiry</>
          ) : (
            <>Send inquiry <ArrowRight size={18} /></>
          )}
        </button>
        <p>
          Your request is sent directly to <strong>{CONTACT.admin}</strong>.
        </p>
      </div>
      {message && (
        <div className={`form-status form-status--${status}`} role="status">
          <CircleCheck size={18} />
          {message}
        </div>
      )}
    </form>
  )
}

function Contact() {
  return (
    <section className="section contact" id="contact">
      <div className="shell">
        <div className="contact__top">
          <SectionHeading
            eyebrow="Start a conversation"
            title={<>Let&apos;s move your<br />project forward.</>}
            body="Choose the right team below or send a detailed inquiry. We will route your request directly to the relevant department."
          />
          <div className="contact__phone-block">
            <span>Call our team directly</span>
            <a href="tel:+27140610718">{CONTACT.phone}</a>
            <a href="tel:+276118836379">{CONTACT.mobile}</a>
          </div>
        </div>
        <div className="department-grid">
          {departments.map(({ label, name, email, icon: Icon }) => (
            <a className="department-card reveal" href={`mailto:${email}`} key={label}>
              <div><Icon size={22} /></div>
              <span>{label}</span>
              <strong>{name}</strong>
              <small>{email}</small>
              <ArrowRight size={18} />
            </a>
          ))}
        </div>
        <div className="contact__hub">
          <div className="contact__form-wrap">
            <span className="contact__form-kicker"><Sparkles size={16} /> Secure inquiry form</span>
            <h3>Tell us what the work requires.</h3>
            <InquiryForm />
          </div>
          <aside className="contact__details">
            <div className="contact__address">
              <span className="contact__detail-icon"><MapPin size={23} /></span>
              <div>
                <span>Visit our Rustenburg office</span>
                <p>{CONTACT.address}</p>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=House+No+46+Boitekong+Ext+13+Rustenburg+North+West+0300"
                  target="_blank"
                  rel="noreferrer"
                >
                  Get directions <ExternalLink size={14} />
                </a>
              </div>
            </div>
            <div className="contact__map">
              <iframe
                title="Vikela Mining office location in Boitekong, Rustenburg"
                src="https://www.google.com/maps?q=House+No+46,+Boitekong+Ext+13,+Rustenburg,+North+West,+0300&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="contact__social">
              <span>Prefer direct messaging?</span>
              <div>
                {socialLinks.map(({ label, href, icon: Icon }) => (
                  <a key={label} href={href} target="_blank" rel="noreferrer">
                    <Icon size={18} />
                    {label}
                    <ExternalLink size={13} />
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}

function Footer({ onQuote }) {
  return (
    <footer className="footer">
      <div className="footer__cta">
        <div className="shell">
          <div>
            <span>Ready to scope the work?</span>
            <h2>Build your next project with Vikela.</h2>
          </div>
          <button className="button button--light" onClick={onQuote}>
            Request a quote
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
      <div className="shell footer__main">
        <div className="footer__brand">
          <Logo inverse />
          <p>Zero Harm, High Performance &amp; Maximum Profits.</p>
          <div className="footer__badges">
            <span>Level 1 B-BBEE</span>
            <span>100% Black Female-Owned</span>
          </div>
        </div>
        <div className="footer__column">
          <span>Navigate</span>
          {navLinks.slice(1).map(([label, href]) => <a href={href} key={href}>{label}</a>)}
        </div>
        <div className="footer__column">
          <span>Capabilities</span>
          {services.map((service) => <a href="#services" key={service.title}>{service.title}</a>)}
        </div>
        <div className="footer__column footer__column--contact">
          <span>Contact</span>
          <a href={`mailto:${CONTACT.info}`}><Mail size={15} />{CONTACT.info}</a>
          <a href="tel:+27140610718"><Phone size={15} />{CONTACT.phone}</a>
          <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer"><MessageCircle size={15} />WhatsApp direct</a>
          <p><MapPin size={15} />{CONTACT.address}</p>
        </div>
      </div>
      <div className="shell footer__bottom">
        <span>© {new Date().getFullYear()} Vikela Mining (Pty) Ltd. All rights reserved.</span>
        <span>Companies Act Registration 2021/804647/07</span>
      </div>
    </footer>
  )
}

function QuoteModal({ open, onClose }) {
  const closeRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.classList.add('modal-open')
    document.addEventListener('keydown', onKeyDown)
    closeRef.current?.focus()
    return () => {
      document.body.classList.remove('modal-open')
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="quote-title">
      <button className="modal__backdrop" aria-label="Close quote form" onClick={onClose} />
      <div className="modal__panel">
        <div className="modal__header">
          <div>
            <span>Quote &amp; tender desk</span>
            <h2 id="quote-title">Tell us about the scope.</h2>
            <p>Share the essentials and our team will route your inquiry to the right capability lead.</p>
          </div>
          <button ref={closeRef} className="modal__close" onClick={onClose} aria-label="Close quote form">
            <X size={21} />
          </button>
        </div>
        <InquiryForm compact />
        <div className="modal__direct">
          <span>Need an immediate response?</span>
          <a href={CONTACT.whatsapp} target="_blank" rel="noreferrer">
            <MessageCircle size={17} /> WhatsApp our team
          </a>
        </div>
      </div>
    </div>
  )
}

function Lightbox({ item, onClose }) {
  useEffect(() => {
    if (!item) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.classList.add('modal-open')
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('modal-open')
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [item, onClose])

  if (!item) return null
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={item.title}>
      <button className="lightbox__backdrop" onClick={onClose} aria-label="Close gallery item" />
      <div className="lightbox__panel">
        <button className="lightbox__close" onClick={onClose} aria-label="Close gallery item">
          <X size={22} />
        </button>
        <div className="lightbox__media">
          {item.type === 'video' ? (
            <video controls autoPlay playsInline poster={item.image}>
              <source
                src="https://videos.pexels.com/video-files/2887463/2887463-hd_1920_1080_25fps.mp4"
                type="video/mp4"
              />
            </video>
          ) : (
            <img src={item.image} alt={item.title} />
          )}
        </div>
        <div className="lightbox__caption">
          <span>{item.category}</span>
          <h3>{item.title}</h3>
          <p>{item.caption}</p>
        </div>
      </div>
    </div>
  )
}

function FloatingChannels() {
  const [open, setOpen] = useState(false)
  return (
    <div className={`floating-channels ${open ? 'is-open' : ''}`}>
      <div className="floating-channels__menu" aria-hidden={!open}>
        {socialLinks.slice(1).reverse().map(({ label, href, icon: Icon }) => (
          <a key={label} href={href} target="_blank" rel="noreferrer" tabIndex={open ? 0 : -1}>
            <span>{label}</span>
            <Icon size={18} />
          </a>
        ))}
      </div>
      <a
        className="floating-channels__whatsapp"
        href={CONTACT.whatsapp}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with Vikela Mining on WhatsApp"
      >
        <MessageCircle size={24} />
        <span>WhatsApp</span>
      </a>
      <button
        className="floating-channels__toggle"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close messaging channels' : 'Open messaging channels'}
        aria-expanded={open}
      >
        {open ? <X size={19} /> : <Sparkles size={19} />}
      </button>
    </div>
  )
}

function App() {
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [galleryItem, setGalleryItem] = useState(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12 },
    )
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <Header onQuote={() => setQuoteOpen(true)} />
      <main id="main-content">
        <Hero onQuote={() => setQuoteOpen(true)} />
        <About />
        <Services onQuote={() => setQuoteOpen(true)} />
        <Safety />
        <Gallery onOpen={setGalleryItem} />
        <Contact />
      </main>
      <Footer onQuote={() => setQuoteOpen(true)} />
      <FloatingChannels />
      <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
      <Lightbox item={galleryItem} onClose={() => setGalleryItem(null)} />
    </>
  )
}

export default App
