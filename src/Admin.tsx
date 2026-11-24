import { useEffect, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { ArrowRight, Bell, CalendarDays, ChefHat, LayoutDashboard, LockKeyhole, LogOut, UsersRound, Wallet, BriefcaseBusiness } from 'lucide-react'
import { formatDate, guaranies, localDate } from './domain'
import { hasPaymentAlert, totals } from './store'
import type { Store } from './store'
import { Empty } from './ui'
import { Calendar, monthLabel, shiftMonth, MonthNav } from './Calendar'
import { Contacts, Finance, MenuEditor } from './AdminRecords'

const routes = [
  { label: 'Resumen', icon: LayoutDashboard }, { label: 'Calendario', icon: CalendarDays },
  { label: 'Clientes', icon: UsersRound }, { label: 'Pagos y gastos', icon: Wallet },
  { label: 'Equipo y proveedores', icon: BriefcaseBusiness }, { label: 'Menús y precios', icon: ChefHat },
] as const

export type StoreEditor = Dispatch<SetStateAction<Store>>
export type AdminSection = { store: Store; setStore: StoreEditor }

const sessionKey = 'cg-demo-access'

export default function Admin({ store, setStore, persistent }: AdminSection & { persistent: boolean }) {
  const [access, setAccess] = useState(() => {
    try { return sessionStorage.getItem(sessionKey) === '1' } catch { return false }
  })
  const [tab, setTab] = useState<typeof routes[number]['label']>('Resumen')
  const [month, setMonth] = useState(() => localDate().slice(0, 7))
  const [now, setNow] = useState(Date.now)
  const [eventId, setEventId] = useState('')
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15000)
    return () => window.clearInterval(timer)
  }, [])

  function setSession(isOpen: boolean) {
    try {
      if (isOpen) sessionStorage.setItem(sessionKey, '1')
      else sessionStorage.removeItem(sessionKey)
    } catch { /* The demo can still be accessed without storage. */ }
    setAccess(isOpen)
    setTab('Resumen')
  }

  if (!access) return <section className="admin-login">
    <div className="panel">
      <span className="login-icon"><LockKeyhole size={26}/></span>
      <h1>Administración</h1>
      <p>Explora el calendario, las finanzas y el catálogo con datos de prueba guardados en este navegador. El acceso seguro con Supabase está previsto para producción.</p>
      <button type="button" className="button button-dark" onClick={() => setSession(true)}>Entrar al panel demo <ArrowRight size={18}/></button>
    </div>
  </section>

  const alerts = store.events.filter(event => hasPaymentAlert(event, store.movements, now))
  const monthEvents = store.events.filter(event => event.date.startsWith(month))
  const monthMovements = store.movements.filter(item => item.date.startsWith(month))
  const income = monthMovements.filter(item => item.kind !== 'expense').reduce((sum, item) => sum + item.amount, 0)
  const expenses = monthMovements.filter(item => item.kind === 'expense').reduce((sum, item) => sum + item.amount, 0)
  const requests = monthEvents.filter(event => event.status === 'request').length
  const metrics = [
    { title: 'Eventos del mes', value: String(monthEvents.filter(event => event.status !== 'cancelled').length) },
    { title: 'Ingresos cobrados', value: guaranies(income) }, { title: 'Gastos registrados', value: guaranies(expenses) }, { title: 'Resultado de caja', value: guaranies(income - expenses) },
  ]

  function showFinance(id: string) { setEventId(id); setTab('Pagos y gastos') }

  return <section className="admin-shell wrap">
    <div className="admin-intro"><div><p className="eyebrow"><span/> Panel de demostración</p><h1>Administración</h1><p>Gestiona eventos, cobros y menús de CG Catering.</p></div>
      <button type="button" className="button button-outline" onClick={() => setSession(false)}><LogOut size={17}/> Salir</button>
    </div>
    {!persistent && <p role="alert" className="warning">El navegador bloqueó el almacenamiento. Los cambios se perderán al cerrar o recargar la página.</p>}
    <div className="admin-layout">
      <nav className="admin-nav" aria-label="Administración">
        {routes.map(({ label, icon: Icon }) => <button key={label} className={tab === label ? 'active' : ''} type="button" aria-current={tab === label ? 'page' : undefined} onClick={() => setTab(label)}><Icon size={19}/>{label}</button>)}
      </nav>
      <div className="admin-content">
        {tab === 'Resumen' && <>
          <div className="section-heading compact"><div><h2>Resumen mensual</h2><p>{monthLabel(month)} · {requests} solicitudes de reserva</p></div><MonthNav month={month} move={offset => setMonth(shiftMonth(month, offset))}/></div>
          <div className="metrics">{metrics.map(item => <div className="metric" key={item.title}><span>{item.title}</span><strong>{item.value}</strong></div>)}</div>
          <div className="panel admin-panel">
            <h3 className="section-icon"><Bell size={21}/> Avisos de pago</h3>
            {alerts.length ? <ul className="record-list">{alerts.map(event => <li key={event.id}><div><strong>{event.title}</strong><small>{formatDate(event.date)} · {event.time} · Vence dentro del plazo de 24 h</small></div><button type="button" className="button button-outline" onClick={() => showFinance(event.id)}>{guaranies(totals(event, store.movements).balance)} pendientes</button></li>)}</ul> : <Empty text="No hay eventos confirmados en las próximas 24 horas con saldo pendiente."/>}
          </div>
          <div className="panel admin-panel"><h3>Eventos del mes</h3>
            {monthEvents.length ? <ul className="record-list">{[...monthEvents].sort((a,b) => a.date.localeCompare(b.date)).map(event => <li key={event.id}><div><strong>{event.title}</strong><small>{formatDate(event.date)} · {event.guests} invitados · {event.location}</small></div><button className="text-button" type="button" onClick={() => showFinance(event.id)}>Ver saldo <ArrowRight size={16}/></button></li>)}</ul> : <Empty text="No hay eventos registrados para este mes."/>}
          </div>
        </>}
        {tab === 'Calendario' && <Calendar store={store} setStore={setStore} onFinance={showFinance}/>}
        {tab === 'Clientes' && <Contacts store={store} setStore={setStore} clientsOnly/>}
        {tab === 'Equipo y proveedores' && <Contacts store={store} setStore={setStore} clientsOnly={false}/>}
        {tab === 'Pagos y gastos' && <Finance store={store} setStore={setStore} eventId={eventId} setEventId={setEventId}/>}
        {tab === 'Menús y precios' && <MenuEditor store={store} setStore={setStore}/>}
      </div>
    </div>
  </section>
}
