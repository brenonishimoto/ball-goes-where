import { FLAG_CODES } from '../../utils/constants';
import 'flag-icons/css/flag-icons.min.css';
import './Flag.scss';

const SPECIAL_CODE_MAP = {
  ENG: 'gb',
  SCO: 'gb',
};

export default function Flag({ country, size = 'md' }) {
  const countryCode = FLAG_CODES[country] || '';
  const normalizedCode = SPECIAL_CODE_MAP[countryCode] || countryCode.toLowerCase();
  const hasValidCode = normalizedCode.length === 2;

  return (
    <span
      className={hasValidCode ? `fi fi-${normalizedCode} flag flag-${size}` : `flag flag-${size}`}
      title={country}
      role="img"
      aria-label={country}
    />
  );
}
