import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import './header.scss'

export default function Header() {
  const { user, isAuthenticated, login, register, logout, loadingAuth } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const cleanName = name.trim()
    const cleanEmail = email.trim().toLowerCase()
    const cleanPassword = password.trim()

    if (!cleanEmail || !cleanPassword || (mode === 'register' && !cleanName)) {
      setFormError(mode === 'register' ? 'Preencha nome, email e senha.' : 'Preencha email e senha.')
      return
    }

    setSubmitting(true)

    try {
      if (mode === 'register') {
        await register({ name: cleanName, email: cleanEmail, password: cleanPassword })
      } else {
        await login({ email: cleanEmail, password: cleanPassword })
      }

      setName('')
      setEmail('')
      setPassword('')
      setFormError('')
      setIsModalOpen(false)
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Falha na autenticacao.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <header className="header">
        <div className="header-container">
          <div className="header-logo">
            <h1>⚽ Bolao Copa</h1>
          </div>
          <nav className="header-nav">
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/table" className="nav-link">Tabela</Link>
            <Link to="/phase1" className="nav-link">Fase 1</Link>
            <Link to="/phase2" className="nav-link">Fase 2</Link>
            <Link to="/phase3" className="nav-link">Fase 3</Link>
            <Link to="/leaderboard" className="nav-link">Ranking</Link>
            <button
              type="button"
              className="auth-round-btn"
              onClick={() => setIsModalOpen(true)}
              aria-label={isAuthenticated ? 'Abrir conta' : 'Abrir login'}
            >
              {isAuthenticated ? user?.email?.slice(0, 1)?.toUpperCase() || 'U' : '+'}
            </button>
          </nav>
        </div>
      </header>

      {isModalOpen ? (
        <div className="auth-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="auth-modal" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="auth-modal-close"
              onClick={() => setIsModalOpen(false)}
              aria-label="Fechar"
            >
              x
            </button>

            {isAuthenticated ? (
              <div className="auth-modal-user">
                <h3>Conta conectada</h3>
                <p>Nome: <strong>{user?.name}</strong></p>
                <p>Email: <strong>{user?.email}</strong></p>
                <button
                  type="button"
                  className="auth-modal-primary"
                  onClick={() => {
                    logout()
                    setIsModalOpen(false)
                  }}
                >
                  Sair
                </button>
              </div>
            ) : (
              <>
                <div className="auth-modal-tabs">
                  <button
                    type="button"
                    className={`auth-modal-tab ${mode === 'login' ? 'is-active' : ''}`}
                    onClick={() => {
                      setMode('login')
                      setFormError('')
                    }}
                  >
                    Entrar
                  </button>
                  <button
                    type="button"
                    className={`auth-modal-tab ${mode === 'register' ? 'is-active' : ''}`}
                    onClick={() => {
                      setMode('register')
                      setFormError('')
                    }}
                  >
                    Criar conta
                  </button>
                </div>

                <form className="auth-modal-form" onSubmit={handleSubmit}>
                  {mode === 'register' ? (
                    <input
                      type="text"
                      placeholder="Nome"
                      autoComplete="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      disabled={submitting || loadingAuth}
                    />
                  ) : null}
                  <input
                    type="email"
                    placeholder="Email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={submitting || loadingAuth}
                  />
                  <input
                    type="password"
                    placeholder="Senha"
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={submitting || loadingAuth}
                  />

                  {formError ? <p className="auth-modal-error">{formError}</p> : null}

                  <button type="submit" className="auth-modal-primary" disabled={submitting || loadingAuth}>
                    {submitting ? 'Enviando...' : mode === 'register' ? 'Criar conta' : 'Entrar'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      ) : null}
    </>
  )
}
