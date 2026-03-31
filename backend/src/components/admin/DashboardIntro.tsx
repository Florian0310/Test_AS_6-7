export const DashboardIntro = () => {
  return (
    <section
      style={{
        marginBottom: '1rem',
        padding: '1rem 1.1rem',
        borderRadius: '0.9rem',
        border: '1px solid rgba(148, 163, 184, 0.25)',
        background: 'linear-gradient(180deg, rgba(14, 116, 144, 0.08), rgba(14, 116, 144, 0.03))',
      }}
    >
      <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Alles Saniert CMS</h2>
      <p style={{ margin: '0.35rem 0 0', opacity: 0.9, lineHeight: 1.45 }}>
        Produkte, Kategorien und Anfragen zentral verwalten. Die Startseite kann unter
        <strong> Website-Einstellungen</strong> inkl. „Beliebte Produkte“ direkt gepflegt werden.
      </p>
    </section>
  )
}
