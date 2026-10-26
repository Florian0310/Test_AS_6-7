'use client'
import { useState } from 'react'
import { useAuth, useConfig, useDocumentInfo } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'
import { isAdminUser, isCMSUser } from '../../utils/access'

export const AcceptRequest = () => {
  const {user} = useAuth(), {config} = useConfig(), {id,data,setData} = useDocumentInfo(), router = useRouter()
  const [busy,setBusy] = useState(false), [error,setError] = useState('')
  if (!id || !isCMSUser(user) || isAdminUser(user)) return null
  const closed = ['accepted','rejected','completed'].includes(data?.status)
  const accept = async () => {
    if (busy) return
    setBusy(true); setError('')
    try {
      const response = await fetch(`${config.routes.api}/requests/${encodeURIComponent(id)}`,{method:'PATCH',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'accepted'}),signal:AbortSignal.timeout(15000)})
      if (!response.ok) throw new Error('Die Anfrage konnte nicht angenommen werden. Bitte laden Sie die Seite neu und prüfen Sie den aktuellen Status.')
      const result = await response.json()
      setData(result.doc); router.refresh()
    } catch (cause) {setError(cause instanceof Error ? cause.message : 'Bitte versuchen Sie es erneut.')} finally {setBusy(false)}
  }
  return <div className="cms-accept-request">
    {closed ? <span className="cms-role">{data?.status === 'accepted' ? 'Anfrage angenommen' : 'Anfrage geschlossen'}</span> : <button className="cms-button" type="button" disabled={busy} onClick={accept}>{busy ? 'Wird angenommen …' : 'Anfrage annehmen'}</button>}
    <p role="status" className="cms-action-status">{error}</p>
  </div>
}
