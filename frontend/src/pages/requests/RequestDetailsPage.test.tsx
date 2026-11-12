import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, test, vi } from 'vitest'
import { RequestDetailsPage } from './RequestDetailsPage'
import { api } from '@/service/api'
vi.mock('@/service/api', () => ({ api: vi.fn<typeof api>() }))
const id = '11111111-1111-4111-8111-111111111111'
let status: string
let fail: boolean
let editable: boolean
const record = () => ({
  id,
  categoria: 'SVO',
  status,
  flag_urgencia: true,
  solicitante_nome: 'Maria Real',
  setor_nome: 'Operacional',
  data_necessidade: '2026-12-01T12:00:00Z',
  criado_em: '2026-11-12T12:00:00Z',
  historico: [],
  pode_editar: editable,
  pode_cancelar: true,
})
beforeEach(() => {
  vi.resetAllMocks()
  status = 'Pendente'
  fail = false
  editable = false
  vi.mocked(api).mockImplementation(async (_path, options) => {
    if (options?.method === 'PATCH') {
      if (fail) throw new Error('Viagem em andamento impede cancelamento')
      status = 'Cancelada'
      return {} as never
    }
    return { message: record() } as never
  })
})
function mount(requestId = id) {
  render(
    <MemoryRouter initialEntries={[`/viagens/solicitacoes/${requestId}`]}>
      <Routes>
        <Route path="/viagens/solicitacoes/:id" element={<RequestDetailsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}
test('carrega os dados reais do ID da URL sem preencher exemplos', async () => {
  mount()
  expect(await screen.findByText('Maria Real')).toBeInTheDocument()
  expect(api).toHaveBeenCalledWith(`/solicitacoes/${id}`)
  expect(screen.getByText(id)).toBeInTheDocument()
  expect(screen.queryByText('João Silva')).not.toBeInTheDocument()
  expect(
    screen.queryByRole('button', { name: 'Editar solicitação' }),
  ).not.toBeInTheDocument()
})
test('exibe erro de acesso ou inexistência sem apresentar dados fictícios', async () => {
  vi.mocked(api).mockRejectedValue(new Error('Solicitação não encontrada'))
  mount()
  expect(await screen.findByRole('alert')).toHaveTextContent('Solicitação não encontrada')
  expect(screen.queryByText('Maria Real')).not.toBeInTheDocument()
})
test('cancelamento exige motivo e confirma pela API antes de recarregar', async () => {
  mount()
  await userEvent.click(
    await screen.findByRole('button', { name: 'Cancelar solicitação' }),
  )
  const confirm = screen.getByRole('button', { name: 'Confirmar cancelamento' })
  expect(confirm).toBeDisabled()
  await userEvent.type(screen.getByLabelText('Motivo do cancelamento'), 'Reprogramação')
  await userEvent.click(confirm)
  expect(await screen.findByText('Cancelada')).toBeInTheDocument()
  expect(api).toHaveBeenCalledWith(`/solicitacoes/${id}/cancelar`, {
    method: 'PATCH',
    body: JSON.stringify({ motivo: 'Reprogramação' }),
  })
})
test('falha no cancelamento mantém formulário e não simula sucesso', async () => {
  fail = true
  mount()
  await userEvent.click(
    await screen.findByRole('button', { name: 'Cancelar solicitação' }),
  )
  await userEvent.type(screen.getByLabelText('Motivo do cancelamento'), 'Teste')
  await userEvent.click(screen.getByRole('button', { name: 'Confirmar cancelamento' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Viagem em andamento')
  expect(screen.getByLabelText('Motivo do cancelamento')).toHaveValue('Teste')
  expect(screen.queryByText('Cancelada')).not.toBeInTheDocument()
})
test('edição envia somente os campos suportados pela API', async () => {
  editable = true
  mount()
  await userEvent.click(await screen.findByRole('button', { name: 'Editar solicitação' }))
  await userEvent.clear(screen.getByLabelText('Categoria'))
  await userEvent.type(screen.getByLabelText('Categoria'), 'administrativa')
  await userEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(`/solicitacoes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        categoria: 'administrativa',
        flag_urgencia: true,
        data_necessidade: '2026-12-01T12:00:00.000Z',
      }),
    }),
  )
})
