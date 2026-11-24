import { useState } from 'react'
import type { FormEvent } from 'react'
import { ChevronLeft, ChevronRight, Plus, Pencil, Wallet } from 'lucide-react'
import type { AdminSection } from './Admin'
import { formatDate, guaranies, localDate, validGuests } from './domain'
import type { Event } from './store'
import { Dialog, Empty } from './ui'

export const statuses: Record<Event['status'], string> = {
  request: 'Solicitud', confirmed: 'Confirmado', completed: 'Finalizado', cancelled: 'Cancelado',
}

const dateFor = (month: string, day: number) => new Date(month + '-01T12:00:00Z').setUTCDate(day)
export function monthLabel(month: string) {
  return new Intl.DateTimeFormat('es-PY', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dateFor(month, 1))
}
export function shiftMonth(month: string, amount: number) {
  const day = new Date(dateFor(month, 1))
  day.setUTCMonth(day.getUTCMonth() + amount)
  return day.toISOString().slice(0, 7)
}
export function MonthNav({ month, move }: { month: string; move: (amount: number) => void }) {
  return <div className="month-nav">
    <button type="button" className="icon-button" aria-label="Mes anterior" onClick={() => move(-1)}><ChevronLeft size={19}/></button>
    <span>{monthLabel(month)}</span>
    <button type="button" className="icon-button" aria-label="Mes siguiente" onClick={() => move(1)}><ChevronRight size={19}/></button>
  </div>
}

function newEvent(date: string): Event {
  return { id: '', title: '', clientId: '', date, time: '20:00', location: '', guests: 50, expected: 0, status: 'confirmed', menuNames: [] }
}

export function Calendar({ store, setStore, onFinance }: AdminSection & { onFinance: (id: string) => void }) {
  const [month, setMonth] = useState(() => localDate().slice(0, 7))
  const [selected, setSelected] = useState('')
  const [draft, setDraft] = useState<Event | null>(null)
  const firstWeekday = (new Date(dateFor(month, 1)).getUTCDay() + 6) % 7
  const count = new Date(dateFor(shiftMonth(month, 1), 0)).getUTCDate()
  const events = store.events.filter(event => event.date.startsWith(month) && (!selected || event.date === selected))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!draft || !draft.title.trim() || !draft.location.trim() || !validGuests(draft.guests)) return
    const saved = { ...draft, id: draft.id || crypto.randomUUID(), title: draft.title.trim(), location: draft.location.trim() }
    setStore(previous => ({ ...previous, events: draft.id ? previous.events.map(event => event.id === saved.id ? saved : event) : [...previous.events, saved] }))
    setMonth(saved.date.slice(0, 7))
    setSelected(saved.date)
    setDraft(null)
  }

  const change = <K extends keyof Event>(field: K, value: Event[K]) => setDraft(current => current && ({ ...current, [field]: value }))

  return <>
    <div className="section-heading compact"><div><h2>Calendario de eventos</h2><p>Consulta reservas y organiza próximos eventos.</p></div>
      <button type="button" className="button button-dark" onClick={() => setDraft(newEvent(selected || (month === localDate().slice(0, 7) ? localDate() : month + '-01')))}><Plus size={17}/> Nuevo evento</button>
    </div>
    <div className="panel admin-panel">
      <div className="calendar-head"><MonthNav month={month} move={offset => { setSelected(''); setMonth(shiftMonth(month, offset)) }}/>{selected && <button type="button" className="text-button" onClick={() => setSelected('')}>Ver todo el mes</button>}</div>
      <div className="calendar-grid">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(label => <span className="weekday" key={label}>{label}</span>)}
        {Array.from({ length: firstWeekday }, (_, index) => <span key={'empty-' + index}/>)}
        {Array.from({ length: count }, (_, index) => {
          const number = index + 1
          const date = month + '-' + String(number).padStart(2, '0')
          const items = store.events.filter(event => event.date === date)
          return <button type="button" className={'calendar-day' + (selected === date ? ' selected' : '') + (date === localDate() ? ' today' : '')} aria-label={formatDate(date) + ', ' + items.length + ' eventos'} aria-pressed={selected === date} key={date}
            onClick={() => setSelected(selected === date ? '' : date)}>{number}{items.length > 0 && <span>{items.length}</span>}</button>
        })}
      </div>
    </div>
    <div className="panel admin-panel">
      <h3>{selected ? 'Eventos del ' + formatDate(selected) : 'Eventos del mes'}</h3>
      {events.length ? <ul className="record-list">{events.map(event => <li key={event.id}>
        <div><strong>{event.title}</strong><small>{formatDate(event.date)} · {event.time} · {event.location} · {event.guests} invitados</small>
          {!!event.menuNames.length && <small>{event.menuNames.join(' / ')}</small>}
          <small>{event.consultation ? 'Importe a confirmar' : guaranies(event.expected)} · {statuses[event.status]}</small></div>
        <div className="row-actions"><button type="button" className="icon-button" aria-label={'Ver pagos de ' + event.title} onClick={() => onFinance(event.id)}><Wallet size={18}/></button>
          <button type="button" className="icon-button" aria-label={'Editar evento ' + event.title} onClick={() => setDraft(event)}><Pencil size={18}/></button></div>
      </li>)}</ul> : <Empty text="Todavía no hay eventos en este periodo."/>}
    </div>
    {draft && <Dialog title={draft.id ? 'Editar evento' : 'Nuevo evento'} onClose={() => setDraft(null)}>
      <form onSubmit={submit}>
        <label>Nombre del evento <input required pattern=".*\S.*" maxLength={100} value={draft.title} onChange={e => change('title', e.target.value)}/></label>
        <label>Cliente <select value={draft.clientId} onChange={e => change('clientId', e.target.value)}><option value="">Sin asignar</option>{store.contacts.filter(item => item.kind === 'client').map(client => <option value={client.id} key={client.id}>{client.name}</option>)}</select></label>
        <div className="form-grid">
          <label>Fecha <input type="date" required value={draft.date} onChange={e => change('date', e.target.value)}/></label>
          <label>Hora de inicio <input type="time" required value={draft.time} onChange={e => change('time', e.target.value)}/></label>
          <label>Ubicación <input required pattern=".*\S.*" maxLength={160} value={draft.location} onChange={e => change('location', e.target.value)}/></label>
          <label>Invitados <input type="number" required min="1" max="1000000" value={draft.guests || ''} onChange={e => change('guests', Number(e.target.value))}/></label>
          <label>Importe acordado (₲) <input type="number" required min="0" max="1000000000000" value={draft.expected} onChange={e => setDraft({ ...draft, expected: Number(e.target.value), consultation: false })}/></label>
          <label>Estado <select value={draft.status} onChange={e => change('status', e.target.value as Event['status'])}>{Object.entries(statuses).map(([id, name]) => <option value={id} key={id}>{name}</option>)}</select></label>
        </div>
        {draft.consultation && <p>Importe pendiente de confirmar. Actualiza el monto cuando esté acordado.</p>}
        <div className="dialog-actions"><button className="button button-dark" type="submit">Guardar evento</button></div>
      </form>
    </Dialog>}
  </>
}
