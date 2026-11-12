import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './SolicitacoesPendentesPage.module.scss';

interface Solicitacao {
  id: string;
  importante: boolean;
  horario: string;
  origem: string;
  destino: string;
  carga: string;
  setor: string;
}

const MOCK_SOLICITACOES: Solicitacao[] = [
  { id: '2401', importante: true, horario: 'Hoje · 10:30', origem: 'Central SVO', destino: 'Posto Sul', carga: 'Equipamentos', setor: 'Logística' },
  { id: '2402', importante: false, horario: 'Hoje · 14:00', origem: 'Terminal Norte', destino: 'Base SVO', carga: 'Documentos Oficiais', setor: 'Administrativo' },
];

export default function SolicitacoesPendentesPage() {
  const [busca, setBusca] = useState('');

  const solicitacoesFiltradas = MOCK_SOLICITACOES.filter((sol) =>
    sol.id.includes(busca) || 
    sol.origem.toLowerCase().includes(busca.toLowerCase()) || 
    sol.destino.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className={styles.page}>
      {/* Link de Voltar */}
      <Link to="/viagens" className={styles.backLink}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Voltar para Painel de Viagens
      </Link>

      <header className={styles.header}>
        <h1>Solicitações Pendentes</h1>
        <p>Analise, aprove e atribua veículos às novas solicitações</p>
      </header>

      {/* Barra de Filtros */}
      <div className={styles.filterBar}>
        <div className={styles.chips}>
          <span className={styles.chipPendente}>2 pendentes</span>
          <span className={styles.chipImportante}>1 importante</span>
        </div>
        <input 
          type="text" 
          placeholder="Buscar solicitação..." 
          className={styles.searchInput}
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Lista de Cards */}
      <div className={styles.list}>
        {solicitacoesFiltradas.map((sol) => (
          <div key={sol.id} className={`${styles.card} ${sol.importante ? styles.cardDestaque : ''}`}>
            
            <div className={styles.cardHeader}>
              <div className={styles.cardTitleGroup}>
                <h2>Descrição da Solicitação #{sol.id}</h2>
                {sol.importante && <span className={styles.badgeImportante}>Importante</span>}
              </div>
              <span className={styles.time}>⏱ {sol.horario}</span>
            </div>

            <div className={styles.cardDetails}>
              <span><strong>Origem:</strong> {sol.origem} <span className={styles.arrow}>→</span> <strong>Destino:</strong> {sol.destino}</span>
              <span><strong>Carga:</strong> {sol.carga}</span>
              <span><strong>Setor:</strong> {sol.setor}</span>
            </div>

            <div className={styles.cardActions}>
              <button className={styles.btnAprovar}>✓ Aprovar</button>
              <button className={styles.btnRecusar}>✕ Recusar</button>
              <button className={styles.btnAtribuir}>🚙 Atribuir</button>
              <button className={styles.btnDetalhes}>ⓘ Ver detalhes</button>
            </div>

          </div>
        ))}
        
        {solicitacoesFiltradas.length === 0 && (
          <p style={{ color: '#64748b', textAlign: 'center', marginTop: '2rem' }}>Nenhuma solicitação encontrada.</p>
        )}
      </div>
    </div>
  );
}