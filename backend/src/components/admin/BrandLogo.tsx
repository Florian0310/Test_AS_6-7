export const BrandLogo = () => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.62rem',
        padding: '0.5rem 0.78rem',
        borderRadius: '0.72rem',
        background: 'linear-gradient(135deg, #001489 0%, #0a2db8 100%)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 10px 20px rgba(0, 20, 137, 0.28)',
      }}
    >
      <div
        style={{
          width: '0.6rem',
          height: '0.6rem',
          borderRadius: '999px',
          backgroundColor: '#ed8b00',
        }}
      />
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em' }}>ALLES SANIERT</div>
        <div style={{ fontSize: '0.6rem', opacity: 0.94, letterSpacing: '0.12em' }}>SCHR\u00d6DER GESNBR</div>
      </div>
    </div>
  )
}