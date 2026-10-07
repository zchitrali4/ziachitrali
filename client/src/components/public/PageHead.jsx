import { usePageMeta } from '../../hooks/usePageMeta.js';

export function PageHead(props) {
  usePageMeta(props);
  return null;
}
