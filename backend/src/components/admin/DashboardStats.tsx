import { createLocalReq, type Payload } from 'payload'
import type { User } from '../../payload-types'
import { isCMSUser } from '../../utils/access'

export const DashboardStats = async ({payload,user}: {payload:Payload,user?:User}) => {
  if (!isCMSUser(user)) return null
  const req = await createLocalReq({user},payload)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  const [products,categories,open,recent] = await Promise.all([
    payload.count({collection:'products',where:{isActive:{equals:true}},req,overrideAccess:false}),
    payload.count({collection:'categories',where:{isActive:{equals:true}},req,overrideAccess:false}),
    payload.count({collection:'requests',where:{status:{in:['new','in_progress']}},req,overrideAccess:false}),
    payload.count({collection:'requests',where:{createdAt:{greater_than_equal:sevenDaysAgo}},req,overrideAccess:false}),
  ])
  return <section className="cms-statistics" aria-labelledby="cms-statistics-title">
    <h2 id="cms-statistics-title">Ihre Übersicht</h2>
    <div className="cms-stat-grid">{[['Aktive Produkte',products],['Aktive Kategorien',categories],['Offene Anfragen',open],['Anfragen der letzten 7 Tage',recent]].map(([label,result]) => <article className="cms-stat-card" key={String(label)}>
      <span>{String(label)}</span><strong>{new Intl.NumberFormat('de-AT').format((result as {totalDocs:number}).totalDocs)}</strong>
    </article>)}</div>
  </section>
}
