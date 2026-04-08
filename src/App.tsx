import './App.css'
import { Header, Main, Footer } from './UserInterface'

export function App() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
      margin: 0,
      padding: 0
    }}>
      <Header />
      <div style={{ padding: '0 15px', flex: 1 }}>
        <Main />
      </div>
      <Footer />
    </div>
  )
}
