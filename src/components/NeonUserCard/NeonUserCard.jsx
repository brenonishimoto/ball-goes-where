import Card from '../Card/Card';
import { useNeonUser } from '../../hooks/useNeonUser';
import './neonusercard.scss';

const formatValue = (value, fallback = 'Não informado') => value || fallback;

const getClerkDisplayName = (user) => {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim();
  return user?.fullName || fullName || user?.username || user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress || user?.id;
};

const getClerkEmail = (user) => user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress || null;

export default function NeonUserCard() {
  const { user, neonUser, loadingNeonUser, error, neonConfigured, refreshNeonUser } = useNeonUser();

  if (!user) {
    return null;
  }

  const statusLabel = loadingNeonUser
    ? 'Sincronizando'
    : error
      ? 'Atenção'
      : neonUser
        ? 'Sincronizado'
        : neonConfigured
          ? 'Aguardando dados'
          : 'Somente Clerk';

  return (
    <Card className="neon-user-card">
      <div className="neon-user-card__top">
        <div>
          <span className="neon-user-card__eyebrow">Clerk + Neon</span>
          <h2>Usuário conectado</h2>
        </div>
        <span className={`neon-user-card__badge neon-user-card__badge--${statusLabel.toLowerCase().replace(/\s+/g, '-')}`}>
          {statusLabel}
        </span>
      </div>

      {error ? <p className="neon-user-card__message neon-user-card__message--error">{error}</p> : null}

      <div className="neon-user-card__grid">
        <div>
          <span className="neon-user-card__label">Nome</span>
          <strong>{formatValue(neonUser?.name ?? getClerkDisplayName(user))}</strong>
        </div>
        <div>
          <span className="neon-user-card__label">Email</span>
          <strong>{formatValue(neonUser?.email ?? getClerkEmail(user))}</strong>
        </div>
        <div>
          <span className="neon-user-card__label">Clerk ID</span>
          <strong>{formatValue(neonUser?.clerkId ?? user.id)}</strong>
        </div>
        <div>
          <span className="neon-user-card__label">Neon ID</span>
          <strong>{formatValue(neonUser?.id, 'Sem registro no Neon')}</strong>
        </div>
      </div>

      <div className="neon-user-card__actions">
        <button
          type="button"
          className="neon-user-card__button"
          onClick={() => void refreshNeonUser()}
          disabled={!neonConfigured || loadingNeonUser}
        >
          {loadingNeonUser ? 'Atualizando...' : 'Atualizar do Neon'}
        </button>
      </div>
    </Card>
  );
}