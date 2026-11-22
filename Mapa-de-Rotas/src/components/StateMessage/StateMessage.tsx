import styles from './StateMessage.module.scss';

interface StateMessageProps { title: string; description?: string; action?: { label: string; onClick: () => void }; }
export function StateMessage({ title, description, action }: StateMessageProps) {
  return <section className={styles.message} role="status"><strong>{title}</strong>{description && <p>{description}</p>}{action && <button type="button" onClick={action.onClick}>{action.label}</button>}</section>;
}
