import { createFileRoute, redirect } from '@tanstack/react-router'
import { api } from '../lib/api'

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const state = await api.state()
    throw redirect({ to: state.session ? '/inbox' : '/welcome' })
  },
})
