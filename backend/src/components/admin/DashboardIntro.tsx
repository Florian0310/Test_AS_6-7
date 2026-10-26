import type { User } from '../../payload-types'
import { isAdminUser } from '../../utils/access'

export const DashboardIntro = ({user}: {user?: User}) => <section className="cms-welcome">
  <div><span className="cms-eyebrow">Alles Saniert · Mietverwaltung</span>
    <h1>Guten Tag{user?.name ? `, ${user.name}` : ''}.</h1>
    <p>{isAdminUser(user) ? 'Verwalten Sie Produkte, Anfragen, Ihr Team und die Website an einem Ort.' : 'Pflegen Sie Produkte und nehmen Sie neue Mietanfragen an.'}</p>
  </div>
  <div className="cms-shortcuts">
    <a className="cms-button" href="/admin/collections/requests">Anfragen ansehen</a>
    <a className="cms-button cms-button--secondary" href="/admin/collections/products/create">Produkt anlegen</a>
    {isAdminUser(user) && <a className="cms-text-link" href="/admin/collections/users">Team verwalten</a>}
    <a className="cms-text-link" href={process.env.FRONTEND_PUBLIC_URL || 'http://localhost:8000'} target="_blank" rel="noreferrer">Website öffnen ↗</a>
  </div>
</section>
