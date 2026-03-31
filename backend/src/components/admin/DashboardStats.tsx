import type { Payload } from 'payload'

type DashboardStatsProps = {
  payload: Payload
}

const countDocuments = async (
  payload: Payload,
  collection: 'categories' | 'products' | 'requests',
  where?: any,
): Promise<number> => {
  const payloadWithCount = payload as Payload & {
    count?: (args: {
      collection: 'categories' | 'products' | 'requests'
      where?: Record<string, unknown>
      overrideAccess?: boolean
      req?: unknown
    }) => Promise<{ totalDocs?: number }>
  }

  if (typeof payloadWithCount.count === 'function') {
    const result = await payloadWithCount.count({
      collection,
      where,
      overrideAccess: true,
    })

    return Number(result?.totalDocs || 0)
  }

  const result = await payload.find({
    collection,
    where,
    limit: 0,
    depth: 0,
    overrideAccess: true,
  })

  return Number(result?.totalDocs || 0)
}

const toLabelValue = (value: number): string => new Intl.NumberFormat('de-AT').format(value)

const StatCard = ({ label, value }: { label: string; value: string }) => {
  return (
    <article
      style={{
        border: '1px solid rgba(148, 163, 184, 0.25)',
        borderRadius: '0.9rem',
        padding: '0.9rem',
        background: 'rgba(248, 250, 252, 0.65)',
      }}
    >
      <div style={{ fontSize: '0.82rem', opacity: 0.85 }}>{label}</div>
      <div style={{ marginTop: '0.22rem', fontSize: '1.35rem', fontWeight: 800 }}>{value}</div>
    </article>
  )
}

export const DashboardStats = async ({ payload }: DashboardStatsProps) => {
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [activeProducts, activeCategories, openRequests, requestsLast7Days] = await Promise.all([
    countDocuments(payload, 'products', { isActive: { equals: true } }),
    countDocuments(payload, 'categories', { isActive: { equals: true } }),
    countDocuments(payload, 'requests', {
      status: {
        in: ['new', 'in_progress'],
      },
    }),
    countDocuments(payload, 'requests', {
      createdAt: {
        greater_than_equal: sevenDaysAgo.toISOString(),
      },
    }),
  ])

  return (
    <section
      style={{
        marginTop: '0.9rem',
        padding: '1rem 1.1rem',
        borderRadius: '0.9rem',
        border: '1px solid rgba(148, 163, 184, 0.25)',
        background: 'rgba(255, 255, 255, 0.45)',
      }}
    >
      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Schnellstatistik</h3>
      <div
        style={{
          marginTop: '0.8rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '0.75rem',
        }}
      >
        <StatCard label="Aktive Produkte" value={toLabelValue(activeProducts)} />
        <StatCard label="Aktive Kategorien" value={toLabelValue(activeCategories)} />
        <StatCard label="Offene Anfragen" value={toLabelValue(openRequests)} />
        <StatCard label="Anfragen (7 Tage)" value={toLabelValue(requestsLast7Days)} />
      </div>
    </section>
  )
}
