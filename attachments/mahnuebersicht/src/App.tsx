import { useState } from 'react'
import { offenePosten } from './data/posten'
import { Kennzahlen } from './components/Kennzahlen'
import { PostenTabelle } from './components/PostenTabelle'

export function App() {
  const [versendet, setVersendet] = useState<number | null>(null)

  // Aktueller Stand: ein Mahnlauf mahnt immer alle offenen Posten.
  function mahnlaufStarten() {
    setVersendet(offenePosten.length)
  }

  return (
    <>
      <header className="topbar">
        <strong>Primorio</strong>
        <nav>Buchhaltung › Mahnwesen</nav>
      </header>

      <main>
        <div className="titel">
          <div>
            <h1>Mahnübersicht</h1>
            <p>Alle offenen Posten, die fällig und noch nicht bezahlt sind.</p>
          </div>
          <button onClick={mahnlaufStarten}>Alle mahnen</button>
        </div>

        <Kennzahlen posten={offenePosten} />

        {versendet !== null && (
          <p className="hinweis" role="status">
            {versendet} Mahnungen wurden versendet.
          </p>
        )}

        <PostenTabelle posten={offenePosten} />
      </main>
    </>
  )
}
