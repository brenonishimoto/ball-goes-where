import { Link } from 'react-router-dom'
import './header.scss'

export default function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <h1>⚽ Bolão Copa</h1>
        </div>
        <nav className="header-nav">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/table" className="nav-link">Tabela</Link>
          <Link to="/predictions" className="nav-link">Palpites</Link>
          <Link to="/leaderboard" className="nav-link">Ranking</Link>
        </nav>
      </div>
    </header>
  )
}
