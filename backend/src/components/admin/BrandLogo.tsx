export const BrandLogo = () => {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.58rem',
        padding: '0.44rem 0.72rem',
        borderRadius: '0.7rem',
        background: 'linear-gradient(135deg, #001489 0%, #0a2db8 100%)',
        color: '#ffffff',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 18px rgba(0, 20, 137, 0.26)',
        maxWidth: '100%',
      }}
    >
      <div
        style={{
          width: '0.52rem',
          height: '0.52rem',
          borderRadius: '999px',
          backgroundColor: '#ed8b00',
          flexShrink: 0,
        }}
      />
      <div style={{ lineHeight: 1.1 }}>
        <div style={{ fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.08em' }}>ALLES SANIERT</div>
        <div style={{ fontSize: '0.58rem', opacity: 0.94, letterSpacing: '0.1em' }}>{'SCHR\u00D6DER GESNBR'}</div>
      </div>
    </div>
  )
}
