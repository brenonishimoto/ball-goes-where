import { Link } from 'react-router-dom'
import './Header.scss'

export default function Header() {
  return (
    <header className="header">
      <nav>
        <Link to="/">Home</Link>
        <Link to="/predictions">Palpites</Link>
        <Link to="/leaderboard">Ranking</Link>
      </nav>
    </header>
  )
}
