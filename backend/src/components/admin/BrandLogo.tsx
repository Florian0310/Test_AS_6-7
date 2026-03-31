export const BrandLogo = () => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.45rem 0.7rem',
        borderRadius: '0.65rem',
        background: 'linear-gradient(135deg, #001489 0%, #0a2db8 100%)',
        color: '#ffffff',
        boxShadow: '0 8px 18px rgba(0, 20, 137, 0.28)',
      }}
    >
      <div
        style={{
          width: '0.58rem',
          height: '0.58rem',
          borderRadius: '999px',
          backgroundColor: '#ed8b00',
        }}
      />
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em' }}>ALLES SANIERT</div>
        <div style={{ fontSize: '0.6rem', opacity: 0.9, letterSpacing: '0.14em' }}>SCHRÖDER GESNBR</div>
      </div>
    </div>
  )
}
