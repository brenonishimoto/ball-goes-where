import { FLAG_CODES } from '../../utils/constants';
import 'flag-icons/css/flag-icons.min.css';
import './Flag.scss';


export default function Flag({ country, size = 'md' }) {
  const countryCode = FLAG_CODES[country] || '';

  // flag-icons usa IDs como "gb-eng" / "gb-sct" (minúsculos e com hífen).
  const normalizedCode = countryCode.toLowerCase().replace(/_/g, '-');

  // Aceita ISO2 (ex: "br") e também códigos compostos (ex: "gb-eng").
  const hasValidCode = normalizedCode.length === 2 || normalizedCode.includes('-');


  return (
    <span
      className={hasValidCode ? `fi fi-${normalizedCode} flag flag-${size}` : `flag flag-${size}`}
      title={country}
      role="img"
      aria-label={country}
    />
  );
}
