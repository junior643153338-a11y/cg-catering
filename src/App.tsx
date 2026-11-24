import { useEffect, useState } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, ChefHat, ChevronDown, LockKeyhole, MapPin, Menu as MenuIcon, MessageCircle, Sparkles, UsersRound, X } from 'lucide-react'
import { categories, emptyPlan, guaranies } from './domain'
import type { Menu, Plan } from './domain'
import { hero, logo, photos } from './photos'
import { groupNames } from './catalog'
import { Brand, Empty } from './ui'
import { useDemoStore } from './store'
import PublicTools from './PublicTools'
import Admin from './Admin'

export default function App() {
  const { store, setStore, persistent } = useDemoStore()
  const [hash, setHash] = useState(window.location.hash)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [plan, setPlan] = useState<Plan>(emptyPlan)
  const [filter, setFilter] = useState('Todas')
  const [visibleCount, setVisibleCount] = useState(9)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [announcement, setAnnouncement] = useState('')
  const admin = hash === '#admin'
  const selected = store.menus.filter(item => item.active && plan.menuIds.includes(item.id)).length
  const filtered = store.menus.filter(item => item.active && (filter === 'Todas' || item.category === filter))

  useEffect(() => {
    const onHash = () => {
      setHash(window.location.hash)
      setMobileOpen(false)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    if (hash === '#admin' || hash === '#inicio') {
      window.scrollTo({ top: 0, behavior: 'instant' })
      return
    }
    const id = hash.slice(1)
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
  }, [hash])

  function toggleMenu(menu: Menu, guestCount?: number) {
    const isSelected = plan.menuIds.includes(menu.id)
    setPlan(previous => {
      const others = previous.menuIds.filter(id => id !== menu.id && (!menu.group || store.menus.find(item => item.id === id)?.group !== menu.group))
      return { ...previous, guests: !isSelected && guestCount ? guestCount : previous.guests, menuIds: isSelected ? others : [...others, menu.id] }
    })
    setAnnouncement(isSelected ? menu.name + ' retirado.' : menu.name + ' añadido a tu presupuesto.')
  }

  return <>
    <a className="skip" href="#principal">Saltar al contenido</a>
    <header className="site-header">
      <div className="wrap header-inner">
        <a href="#inicio" aria-label="CG Catering, inicio" onClick={() => setMobileOpen(false)}><Brand /></a>
        {admin ? <a href="#inicio" className="button button-header">Ver sitio público <ArrowUpRight size={16}/></a> : <>
          <button className="mobile-toggle icon-button" type="button" aria-label={mobileOpen ? 'Cerrar navegación' : 'Abrir navegación'} aria-expanded={mobileOpen} aria-controls="nav-main" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X/> : <MenuIcon/>}
          </button>
          <nav id="nav-main" className={'main-nav' + (mobileOpen ? ' is-open' : '')} aria-label="Navegación principal">
            <a href="#inicio" onClick={() => setMobileOpen(false)}>Inicio</a>
            <a href="#menus" onClick={() => setMobileOpen(false)}>Menús</a>
            <a href="#presupuesto" onClick={() => setMobileOpen(false)}>Mi presupuesto{selected > 0 && <span className="nav-count">{selected}</span>}</a>
            <a className="button button-header" href="#admin" onClick={() => setMobileOpen(false)}><LockKeyhole size={14}/> Administración</a>
          </nav>
        </>}
      </div>
    </header>
    <main id="principal">
      {admin ? <Admin store={store} setStore={setStore} persistent={persistent}/> : <>
        <section id="inicio" className="hero" aria-labelledby="hero-heading">
          <img className="hero-image" src={hero} alt="" fetchPriority="high"/>
          <div className="wrap hero-content">
            <p className="eyebrow gold"><span/> Cristian Garay Recepciones &amp; Catering</p>
            <h1 id="hero-heading">El arte de<br/> <em>celebrar.</em></h1>
            <p className="hero-description">Catering para los momentos que reúnen. Explora las opciones y arma el presupuesto a tu medida.</p>
            <div className="flex flex-wrap gap-3">
              <a className="button button-gold" href="#presupuesto">Planificar mi evento <ArrowRight size={18}/></a>
              <a className="button button-outline-light" href="#menus">Explorar menús <ArrowDown size={16}/></a>
            </div>
          </div>
          <div className="wrap hero-location"><span><MapPin size={15}/> Paraguay</span><span>Versión de demostración</span></div>
        </section>

        <section id="menus" className="catalog section-light">
          <div className="wrap">
            <div className="section-heading">
              <div>
                <p className="eyebrow"><span/> Catálogo de menús</p>
                <h2>Sabores para compartir</h2>
                <p>Explora las opciones y añade tus favoritas al presupuesto.</p>
              </div>
              <button className="text-button" type="button" onClick={() => setAssistantOpen(true)}><Sparkles size={18}/> Ayúdame a elegir <ArrowUpRight size={16}/></button>
            </div>
            <div className="filters" aria-label="Filtrar por tipo de menú">
              {['Todas', ...categories].map(item => <button key={item} className={filter === item ? 'chip active' : 'chip'} type="button" aria-pressed={filter === item} onClick={() => { setFilter(item); setVisibleCount(9) }}>{item === 'Todas' ? 'Todos' : item}</button>)}
            </div>
            <p className="caption demo-caption" role="status">{filtered.length} {filtered.length === 1 ? 'opción' : 'opciones'} · Precios en guaraníes</p>
            <p className="sr-only" role="status">{announcement}</p>
            {filtered.length ? <div className="menu-grid">
              {filtered.slice(0, visibleCount).map(menu => {
                const chosen = plan.menuIds.includes(menu.id)
                const photo = menu.photo && photos[menu.photo]
                return <article className="menu-card" key={menu.id}>
                  <div className={'menu-visual' + (photo ? '' : ' without-photo')}>
                    {photo && <img src={photo} alt={'Foto del catálogo: ' + menu.name} loading="lazy" width="768" height="512"/>}
                    <span>{menu.category}</span>
                  </div>
                  <div className="menu-body">
                    {menu.group && <p className="variant">{groupNames[menu.group]} · Opción {menu.variant}</p>}
                    <h3>{menu.name}</h3>
                    <p>{menu.description}</p>
                    {menu.minimum !== null && <p className="menu-detail"><UsersRound size={15}/> {menu.belowMinimumConsultation ? 'Desde ' : 'Mínimo de '}{menu.minimum} invitados{menu.belowMinimumConsultation && ' · Menos: consultar'}</p>}
                    {(menu.details.length > 0 || menu.terms || menu.choice) && <details><summary>Ver ingredientes y condiciones <ChevronDown size={14}/></summary><div>
                      {menu.details.map(detail => <p key={detail}>{detail}</p>)}
                      {menu.choice && <p>{menu.choice.label} (elige {menu.choice.count}): {menu.choice.options.join(' · ')}.</p>}
                      {menu.terms && <p>{menu.terms}</p>}
                    </div></details>}
                    <div className="menu-action">
                      <span>{menu.price === null ? 'Sujeto a consulta' : <>{guaranies(menu.price)}<small>{menu.unit === 'person' ? ' / persona' : ' / evento'}</small></>}</span>
                      <button type="button" className={'card-select' + (chosen ? ' chosen' : '')} aria-label={(chosen ? 'Quitar ' : 'Añadir ') + menu.name} aria-pressed={chosen} onClick={() => toggleMenu(menu)}>{chosen ? 'Quitar' : 'Añadir'} <span aria-hidden="true">{chosen ? '−' : '+'}</span></button>
                    </div>
                  </div>
                </article>
              })}
            </div> : <Empty text="No hay opciones disponibles en esta categoría."/>}
            {visibleCount < filtered.length && <div className="more-menus"><button className="button button-outline" type="button" onClick={() => setVisibleCount(count => count + 9)}>Ver más menús <ChevronDown size={17}/></button></div>}
          </div>
        </section>

        <PublicTools plan={plan} setPlan={setPlan} store={store} setStore={setStore} toggleMenu={toggleMenu}
          assistantOpen={assistantOpen} setAssistantOpen={setAssistantOpen}/>
        <footer className="site-footer">
          <div className="wrap footer-grid">
            <div><a href="#inicio"><img className="footer-logo" src={logo} alt="Cristian Garay Recepciones & Catering" loading="lazy"/></a><p>Paraguay</p></div>
            <div><span className="footer-heading">Planifica tu evento</span><a href="#menus"><ChefHat size={16}/> Ver menús</a><a href="#presupuesto"><CalendarDays size={16}/> Armar presupuesto</a></div>
            <div><span className="footer-heading">Contacto</span><a href="https://wa.me/595972948659" target="_blank" rel="noreferrer"><MessageCircle size={16}/> +595 972 948 659</a><a href="#admin"><LockKeyhole size={15}/> Administración</a></div>
          </div>
          <div className="wrap footer-bottom">CG Catering <span>Demo · Presupuestos sujetos a confirmación</span></div>
        </footer>
      </>}
    </main>
  </>
}
