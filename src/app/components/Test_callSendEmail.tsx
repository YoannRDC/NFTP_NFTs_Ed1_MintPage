'use client'

import { useState } from 'react'

export default function TestEmailButton() {
  const [status, setStatus] = useState<string>('')

  const handleTestEmail = async () => {
    setStatus('Envoi en cours…')
    try {
      const res = await fetch('/api/ApiEmailCodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'yoann.radenac@gmail.com',
          downloadCode: 'TEST_CODE_123'
        })
      })
      const json = await res.json()
      if (res.ok) {
        setStatus('✅ Email envoyé avec succès !')
      } else {
        setStatus(`❌ Erreur : ${json.error || JSON.stringify(json)}`)
      }
    } catch (err: any) {
      setStatus(`❌ Erreur réseau : ${err.message}`)
    }
  }

  return (
    <div>
      <button
        onClick={handleTestEmail}
        style={{
          padding: '8px 16px',
          backgroundColor: '#0050ef',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Tester l’envoi email
      </button>
      {status && <p style={{ marginTop: '8px' }}>{status}</p>}
    </div>
  )
}
