import { useEffect, useState } from 'react'
import { eventTime, localDate } from './domain.ts'
import type { Menu } from './domain'
import { catalog } from './catalog.ts'

export type Contact = { id: string; name: string; phone: string; notes: string; kind: 'client' | 'employee' | 'supplier' }
export type Event = { id: string; title: string; clientId: string; date: string; time: string; location: string; guests: number; expected: number; status: 'request' | 'confirmed' | 'completed' | 'cancelled'; menuNames: string[]; consultation?: boolean }
export type Movement = { id: string; eventId: string; date: string; kind: 'deposit' | 'payment' | 'expense'; description: string; amount: number }
export type Store = { menus: Menu[]; contacts: Contact[]; events: Event[]; movements: Movement[] }

const storageKey = 'cg-catering-demo-v2'
const shiftedDate = (offset: number) => localDate(new Date(Date.now() + offset * 3600000))

function sampleData(): Store {
  const tomorrow = new Date(Date.now() + 20 * 3600000)
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/Asuncion', hour: '2-digit', minute: '2-digit' }).format(tomorrow)
  const today = localDate()
  return {
    menus: catalog,
    contacts: [
      { id: 'client-1', name: 'Familia Ejemplo', phone: '', notes: 'Datos de prueba', kind: 'client' },
      { id: 'client-2', name: 'Estudio de Ejemplo', phone: '', notes: 'Datos de prueba', kind: 'client' },
      { id: 'staff-1', name: 'Equipo de servicio', phone: '', notes: 'Montaje y atención de sala', kind: 'employee' },
      { id: 'supplier-1', name: 'Vajilla de Ejemplo', phone: '', notes: 'Alquiler de vajilla', kind: 'supplier' },
    ],
    events: [
      { id: 'evt-1', title: 'Recepción familiar', clientId: 'client-1', date: localDate(tomorrow), time, location: 'Asunción', guests: 75, expected: 6200000, status: 'confirmed', menuNames: [] },
      { id: 'evt-2', title: 'Cena de equipo', clientId: 'client-2', date: shiftedDate(192), time: '19:00', location: 'Luque', guests: 45, expected: 3300000, status: 'confirmed', menuNames: [] },
    ],
    movements: [
      { id: 'mov-1', eventId: 'evt-1', date: today, kind: 'deposit', description: 'Seña de ejemplo', amount: 1800000 },
      { id: 'mov-2', eventId: 'evt-1', date: today, kind: 'expense', description: 'Montaje de ejemplo', amount: 700000 },
      { id: 'mov-3', eventId: 'evt-2', date: today, kind: 'deposit', description: 'Seña de ejemplo', amount: 1100000 },
    ],
  }
}

export function useDemoStore() {
  const [store, setStore] = useState<Store>(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) return JSON.parse(saved) as Store
    } catch { /* Use the sample when storage is unavailable. */ }
    return sampleData()
  })
  const [persistent, setPersistent] = useState(true)
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(store))
    } catch {
      setPersistent(false)
    }
  }, [store])
  return { store, setStore, persistent }
}

export function totals(event: Event, movements: Movement[]) {
  const entries = movements.filter(item => item.eventId === event.id)
  const income = entries.filter(item => item.kind !== 'expense').reduce((sum, item) => sum + item.amount, 0)
  const costs = entries.filter(item => item.kind === 'expense').reduce((sum, item) => sum + item.amount, 0)
  return { income, costs, balance: Math.max(0, event.expected - income), profit: income - costs, projectedProfit: event.expected - costs }
}

export function hasPaymentAlert(event: Event, movements: Movement[], now: number) {
  const hours = (eventTime(event.date, event.time) - now) / 3600000
  return event.status === 'confirmed' && !event.consultation && hours >= 0 && hours <= 24 && totals(event, movements).balance > 0
}
