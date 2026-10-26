'use client'
import { useAuth } from '@payloadcms/ui'
import { isAdminUser } from '../../utils/access'

export const AdminIdentity = () => {
  const {user} = useAuth()
  if (!user) return null
  return <aside className="cms-identity" aria-label="Angemeldetes Konto">
    <span className="cms-role">{isAdminUser(user) ? 'Administrator' : 'Benutzer'}</span>
    <strong>{user.name || user.email}</strong>
    <a href="/admin/account">Mein Konto</a>
  </aside>
}
