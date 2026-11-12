import { useState } from 'react'
import styles from './AtendimentoSVOPage.module.scss'

export function AtendimentoSVOPage() {
  const [nome, setNome] = useState('')
  const [cpf, setCpf] = useState('')
  const [nascimento, setNascimento] = useState('')
  const [obito, setObito] = useState('')
  const [endereco, setEndereco] = useState('')
  const [bairro, setBairro] = useState('')
  const [cidade, setCidade] = useState('')
  const [uf, setUf] = useState('')
  const [solicitante, setSolicitante] = useState('')
  const [telefone, setTelefone] = useState('')
  const [parentesco, setParentesco] = useState('')

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Atendimento SVO</h1>
        <p>Registro de solicitação de óbito e encaminhamento de remoção.</p>
      </header>

      <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
        <section className={styles.section}>
          <h2>1. Dados do Falecido</h2>

          <div>
            <label htmlFor="nome">Nome completo</label>
            <input
              id="nome"
              type="text"
              placeholder="Ex.: João da Silva"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              type="text"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(event) => setCpf(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="nascimento">Data de nascimento</label>
            <input
              id="nascimento"
              type="date"
              value={nascimento}
              onChange={(event) => setNascimento(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="obito">Data do óbito</label>
            <input
              id="obito"
              type="date"
              value={obito}
              onChange={(event) => setObito(event.target.value)}
            />
          </div>
        </section>
        <section className={styles.section}>
          <h2>2. Endereço de Remoção</h2>

          <div>
            <label htmlFor="endereco">Endereço de origem</label>
            <input
              id="endereco"
              type="text"
              placeholder="Rua, número, complemento"
              value={endereco}
              onChange={(event) => setEndereco(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="bairro">Bairro</label>
            <input
              id="bairro"
              type="text"
              placeholder="Bairro"
              value={bairro}
              onChange={(event) => setBairro(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="cidade">Cidade</label>
            <input
              id="cidade"
              type="text"
              placeholder="Cidade"
              value={cidade}
              onChange={(event) => setCidade(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="uf">UF</label>
            <input
              id="uf"
              type="text"
              placeholder="Ex.: SE"
              maxLength={2}
              value={uf}
              onChange={(event) => setUf(event.target.value)}
            />
          </div>
        </section>
        <section className={styles.section}>
          <h2>3. Dados do Solicitante</h2>

          <div>
            <label htmlFor="solicitante">Nome do solicitante</label>
            <input
              id="solicitante"
              type="text"
              placeholder="Nome completo do familiar/responsável"
              value={solicitante}
              onChange={(event) => setSolicitante(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="telefone">Telefone de contato</label>
            <input
              id="telefone"
              type="tel"
              placeholder="(00) 00000-0000"
              value={telefone}
              onChange={(event) => setTelefone(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="parentesco">Parentesco</label>
            <input
              id="parentesco"
              type="text"
              placeholder="Ex.: Filho(a), Cônjuge"
              value={parentesco}
              onChange={(event) => setParentesco(event.target.value)}
            />
          </div>
        </section>
        <section>
          <h2>4. Laudo e Documentação</h2>

          <div>
            <label htmlFor="documentos">Upload de documentos</label>

            <input id="documentos" type="file" accept=".pdf,.jpg,.jpeg,.png" multiple />

            <p>Anexe os arquivos e certidões necessários para o atendimento.</p>
          </div>
        </section>

        <div className={styles.actions}>
          <button type="reset">Cancelar</button>

          <button type="submit">Registrar Atendimento</button>
        </div>
      </form>
    </div>
  )
}
