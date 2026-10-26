'use client'
import { SelectField, useAuth, useField } from '@payloadcms/ui'
import type { SelectFieldClientComponent } from 'payload'
import { isAdminUser } from '../../utils/access'

const labels: Record<string,string> = {new:'Neu',in_progress:'In Bearbeitung',answered:'Beantwortet',accepted:'Angenommen',rejected:'Abgelehnt',completed:'Abgeschlossen'}
export const RequestStatusField: SelectFieldClientComponent = props => {
  const {user} = useAuth(), {value} = useField<string>({path:props.path})
  if (isAdminUser(user)) return <SelectField {...props} />
  return <div className="cms-request-status"><span>Status</span><strong>{labels[value] || value}</strong></div>
}
