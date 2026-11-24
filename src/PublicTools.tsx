import { useState } from 'react'
import type { Dispatch, FormEvent, SetStateAction } from 'react'
import { ArrowRight, CalendarCheck, CircleAlert, FileDown, MessageCircle, Sparkles, X } from 'lucide-react'
import { allowedPlan, categories, displayName, formatDate, guaranies, localDate, quoteFor, recommend, validGuests, whatsAppLink } from './domain'
import { commercialTerms } from './catalog'
import type { Menu, Plan } from './domain'
import type { Event, Store } from './store'
import { Dialog, Empty } from './ui'

type Props = {
  plan: Plan
  setPlan: Dispatch<SetStateAction<Plan>>
  store: Store
  setStore: Dispatch<SetStateAction<Store>>
  toggleMenu: (menu: Menu, guests?: number) => void
  assistantOpen: boolean
  setAssistantOpen: (open: boolean) => void
}

export default function PublicTools({ plan, setPlan, store, setStore, toggleMenu, assistantOpen, setAssistantOpen }: Props) {
  const [modal, setModal] = useState<'booking' | 'contact' | null>(null)
  const [booking, setBooking] = useState<{ id: string; link: string } | null>(null)
  const [pdfBusy, setPdfBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [name, setName] = useState('')
  const quote = quoteFor(plan, store.menus)
  const ready = allowedPlan(plan, store.menus)
  const change = <K extends keyof Plan>(field: K, value: Plan[K]) => setPlan(previous => ({ ...previous, [field]: value }))

  function saveBooking(event: FormEvent) {
    event.preventDefault()
    if (!allowedPlan(plan, store.menus) || !name.trim() || booking) return
    const id = crypto.randomUUID()
    const clientId = crypto.randomUUID()
    const request: Event = {
      id, clientId, title: 'Solicitud de ' + name.trim(), date: plan.date, time: plan.time,
      location: plan.location.trim(), guests: plan.guests, expected: quote.subtotal, status: 'request',
      menuNames: quote.lines.map(line => displayName(line.menu) + (line.choices.length ? ' · ' + line.choices.join(', ') : '')),
      consultation: quote.consultation,
    }
    setStore(previous => ({
      ...previous, events: [...previous.events, request],
      contacts: [...previous.contacts, { id: clientId, name: name.trim(), phone: '', notes: 'Solicitud de la demo', kind: 'client' }],
    }))
    setBooking({ id: id.slice(0, 8).toUpperCase(), link: whatsAppLink(plan, store.menus, true, name) })
  }

  async function download() {
    if (!allowedPlan(plan, store.menus) || pdfBusy) return
    setPdfBusy(true)
    setNotice('')
    try {
      const { saveQuote } = await import('./pdf')
      await saveQuote(plan, store.menus)
      setNotice('Presupuesto PDF generado.')
    } catch {
      setNotice('No se pudo generar el PDF. Vuelve a intentarlo.')
    } finally {
      setPdfBusy(false)
    }
  }

  function toggleChoice(menuId: string, option: string) {
    setPlan(previous => {
      const selected = previous.choices[menuId] ?? []
      return { ...previous, choices: { ...previous.choices, [menuId]: selected.includes(option) ? selected.filter(value => value !== option) : [...selected, option] } }
    })
  }

  return <>
    <section id="presupuesto" className="planner">
      <div className="wrap">
        <div className="section-heading">
          <div>
            <p className="eyebrow"><span/> Configurador de eventos</p>
            <h2>Tu próximo evento</h2>
            <p>Completa los datos y revisa el presupuesto antes de solicitar una reserva.</p>
          </div>
        </div>
        <div className="planner-grid">
          <div className="panel planner-fields">
            <h3>Datos del evento</h3>
            <div className="form-grid">
              <label>Fecha <input type="date" required min={localDate()} value={plan.date} onChange={event => change('date', event.target.value)}/></label>
              <label>Hora de inicio <input type="time" required value={plan.time} onChange={event => change('time', event.target.value)}/></label>
              <label>Ubicación <input type="text" required maxLength={160} placeholder="Ej. Asunción" value={plan.location} onChange={event => change('location', event.target.value)}/></label>
              <label>Cantidad de invitados <input type="number" required min={1} max={1000000} step={1} value={plan.guests || ''} onChange={event => change('guests', Number(event.target.value))}/></label>
            </div>
            <fieldset className="planner-menu">
              <legend>Selecciona tus menús</legend>
              {store.menus.filter(menu => menu.active).map(menu => <label className="check-row" key={menu.id}>
                <input type="checkbox" checked={plan.menuIds.includes(menu.id)} onChange={() => toggleMenu(menu)}/>
                <span>{displayName(menu)}</span>
                <small>{menu.price === null ? 'Sujeto a consulta' : guaranies(menu.price) + (menu.unit === 'person' ? ' / pers.' : ' / evento')}</small>
              </label>)}
            </fieldset>
            {quote.lines.filter(line => line.menu.choice).map(({ menu, choices }) => <fieldset className="menu-choices" key={menu.id}>
              <legend>{menu.name} · {menu.choice!.label} (elige {menu.choice!.count})</legend>
              {menu.choice!.options.map(option => <label className="check-row" key={option}>
                <input type="checkbox" checked={choices.includes(option)} disabled={!choices.includes(option) && choices.length >= menu.choice!.count} onChange={() => toggleChoice(menu.id, option)}/>
                <span>{option}</span>
              </label>)}
            </fieldset>)}
            <details className="commercial-terms">
              <summary>Condiciones de reserva y servicio</summary>
              <ul>{commercialTerms.map(term => <li key={term}>{term}</li>)}</ul>
            </details>
          </div>
          <aside className="estimate" aria-label="Resumen del presupuesto">
            <h3>Tu presupuesto</h3>
            <p className="estimate-subtitle">{validGuests(plan.guests) ? plan.guests + ' invitados' : 'Invitados por definir'} · {formatDate(plan.date)}</p>
            <div className="estimate-lines" aria-live="polite">
              {quote.lines.length ? quote.lines.map(({ menu, subtotal, minimumMet, underMinimumConsultation, choices }) => <div className="estimate-row" key={menu.id}>
                <div>{displayName(menu)}<small>{underMinimumConsultation ? 'Consultar disponibilidad para menos de ' + menu.minimum : !minimumMet ? (validGuests(plan.guests) ? 'Mínimo de ' + menu.minimum + ' invitados' : 'Revisa la cantidad de invitados') : menu.unit === 'person' && menu.price !== null ? guaranies(menu.price) + ' × ' + plan.guests : menu.terms}</small>
                  {!!choices.length && <small>{choices.join(' · ')}</small>}</div>
                <strong>{!minimumMet && !underMinimumConsultation ? 'Pendiente' : subtotal === null ? 'A consultar' : guaranies(subtotal)}</strong>
                <button type="button" className="icon-button small" aria-label={'Retirar del presupuesto ' + menu.name} onClick={() => toggleMenu(menu)}><X size={15}/></button>
              </div>) : <p>Añade un menú para empezar.</p>}
            </div>
            <div className="estimate-total"><span>{quote.complete ? 'Total estimado' : quote.subtotal > 0 ? 'Subtotal disponible' : 'Total estimado'}</span>
              <strong>{quote.complete || quote.subtotal > 0 ? guaranies(quote.subtotal) : quote.consultation ? 'A consultar' : '—'}</strong>
            </div>
            {!quote.complete && quote.subtotal > 0 && <p className="estimate-hint">El total final está pendiente de confirmación.</p>}
            {!ready && <p className="estimate-hint"><CircleAlert size={16}/>{quote.blocked ? 'Ajusta el número de invitados según los mínimos indicados.' : quote.pendingChoices ? 'Completa las opciones de bebidas o entradas del menú.' : 'Indica una fecha y hora futuras, una ubicación y al menos un menú.'}</p>}
            <div className="estimate-actions">
              <button type="button" className="button button-gold" disabled={!ready} onClick={() => { setBooking(null); setName(''); setModal('booking') }}><CalendarCheck size={17}/> Solicitar reserva <ArrowRight size={17}/></button>
              <button type="button" className="button button-outline-light" disabled={!ready || pdfBusy} onClick={download}><FileDown size={17}/> {pdfBusy ? 'Generando PDF…' : 'Descargar PDF'}</button>
              <button type="button" className="button button-outline-light" disabled={!ready} onClick={() => setModal('contact')}><MessageCircle size={17}/> Preparar WhatsApp</button>
            </div>
            <p className="estimate-hint" role="status">{notice || 'Presupuesto de demostración sujeto a confirmación.'}</p>
          </aside>
        </div>
      </div>
    </section>
    <button type="button" className="assistant-fab" aria-label="Abrir asistente de menús" onClick={() => setAssistantOpen(true)}><Sparkles size={21}/><span>Asistente</span></button>
    {assistantOpen && <Assistant menus={store.menus} plan={plan} onClose={() => setAssistantOpen(false)} onPick={toggleMenu}/>}
    {modal === 'contact' && <Dialog title="Consulta por WhatsApp" onClose={() => setModal(null)}>
      <p>Revisa el mensaje de demostración en WhatsApp. Tú eliges si lo envías.</p>
      <div className="dialog-actions"><a className="button button-dark" href={whatsAppLink(plan, store.menus, false)} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Abrir WhatsApp</a></div>
    </Dialog>}
    {modal === 'booking' && <Dialog title={booking ? 'Solicitud guardada' : 'Solicitar reserva'} onClose={() => setModal(null)}>
      {booking ? <>
        <p>Referencia <strong>{booking.id}</strong>. La solicitud de prueba figura en la administración de este navegador y queda pendiente de confirmación.</p>
        <div className="dialog-actions"><a className="button button-dark" href={booking.link} target="_blank" rel="noreferrer"><MessageCircle size={18}/> Abrir WhatsApp</a><button type="button" className="button button-outline" onClick={() => setModal(null)}>Volver</button></div>
      </> : <form onSubmit={saveBooking}>
        <p>{formatDate(plan.date)} · {plan.time} · {plan.guests} invitados<br/>{plan.location}</p>
        <p>Para confirmar una reserva se requiere una seña. El saldo vence 24 horas antes del evento.</p>
        <label>Nombre de prueba <input autoComplete="off" required pattern=".*\S.*" maxLength={100} value={name} onChange={event => setName(event.target.value)} placeholder="Ej. Cliente de prueba"/></label>
        <div className="dialog-actions"><button className="button button-dark" type="submit"><CalendarCheck size={18}/> Guardar solicitud de prueba</button></div>
      </form>}
    </Dialog>}
  </>
}

function Assistant({ menus, plan, onClose, onPick }: { menus: Menu[]; plan: Plan; onClose: () => void; onPick: (menu: Menu, guests: number) => void }) {
  const [guests, setGuests] = useState(plan.guests || 50)
  const [budget, setBudget] = useState('')
  const [category, setCategory] = useState('Todas')
  const [result, setResult] = useState<ReturnType<typeof recommend> | null>(null)
  function submit(event: FormEvent) {
    event.preventDefault()
    if (validGuests(guests) && budget && Number.isSafeInteger(Number(budget)) && Number(budget) >= 0) setResult(recommend(menus, guests, Number(budget), category))
  }
  return <Dialog title="Asistente de menús" onClose={onClose}>
    <p>El asistente de demostración usa reglas de presupuesto y cantidad de invitados para sugerir opciones.</p>
    <form onSubmit={submit}>
      <div className="form-grid">
        <label>Invitados <input type="number" required min={1} max={1000000} value={guests || ''} onChange={event => { setGuests(Number(event.target.value)); setResult(null) }}/></label>
        <label>Presupuesto total (₲) <input type="number" required min={0} max={1000000000000000} placeholder="Ej. 5.000.000" value={budget} onChange={event => { setBudget(event.target.value); setResult(null) }}/></label>
      </div>
      <label>Tipo de menú <select value={category} onChange={event => { setCategory(event.target.value); setResult(null) }}>{['Todas', ...categories].map(item => <option key={item}>{item}</option>)}</select></label>
      <div className="dialog-actions"><button className="button button-dark" type="submit"><Sparkles size={17}/> Recomendar menús</button></div>
    </form>
    {result && <div className="assistant-result" aria-live="polite">
      {!result.priced.length && <Empty text="No encontramos opciones con un precio disponible dentro de ese presupuesto."/>}
      {[...result.priced, ...result.consultation.map(menu => ({ menu, total: null }))].map(({ menu, total }) =>
        <div className="result-row" key={menu.id}><div><strong>{displayName(menu)}</strong><small>{total === null ? 'Sujeto a consulta' : guaranies(total)}</small></div>
          <button type="button" className="card-select" aria-label={(plan.menuIds.includes(menu.id) ? 'Quitar ' : 'Añadir ') + menu.name} aria-pressed={plan.menuIds.includes(menu.id)} onClick={() => onPick(menu, guests)}>{plan.menuIds.includes(menu.id) ? 'Quitar' : 'Añadir'}</button></div>)}
    </div>}
  </Dialog>
}
