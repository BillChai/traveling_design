import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

const addPlace = async (user: ReturnType<typeof userEvent.setup>, name: string) => {
  const input = screen.getByLabelText(/景點名稱/)
  await user.type(input, name)
  await user.click(screen.getByRole('button', { name: '加入備案' }))
}

const moveTo = async (
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  destination: string,
) => {
  const card = screen.getByRole('article', { name })
  const select = within(card).getByLabelText('移動到')
  await user.selectOptions(select, within(select).getByRole('option', { name: destination }))
  await user.click(within(card).getByRole('button', { name: '移動' }))
}

describe('多日行程編排', () => {
  it('moves, reorders, and returns places with explicit controls', async () => {
    const user = userEvent.setup()
    render(<App />)
    await addPlace(user, 'A')
    await addPlace(user, 'B')
    await user.click(screen.getByRole('button', { name: '新增一天' }))

    await moveTo(user, 'A', 'Day 1')
    await moveTo(user, 'B', 'Day 1')
    const cardA = screen.getByRole('article', { name: 'A' })
    await user.click(within(cardA).getByRole('button', { name: 'A 下移' }))

    const dayOne = screen.getByRole('heading', { name: 'Day 1' }).closest('section')!
    expect(within(dayOne).getAllByRole('article').map((node) => node.getAttribute('aria-label'))).toEqual(['B', 'A'])

    await moveTo(user, 'A', '備案區')
    const backlog = screen.getByRole('heading', { name: '備案區' }).closest('section')!
    expect(within(backlog).getByRole('article', { name: 'A' })).toBeInTheDocument()
  })

  it('protects the last day and returns places when deleting another day', async () => {
    const user = userEvent.setup()
    render(<App />)
    const initialDelete = screen.getByRole('button', { name: '刪除這天' })
    expect(initialDelete).toBeDisabled()

    await addPlace(user, 'A')
    await moveTo(user, 'A', 'Day 1')
    await user.click(screen.getByRole('button', { name: '新增一天' }))
    const dayOne = screen.getByRole('heading', { name: 'Day 1' }).closest('section')!
    await user.click(within(dayOne).getByRole('button', { name: '刪除這天' }))

    expect(screen.queryByRole('heading', { name: 'Day 2' })).not.toBeInTheDocument()
    const backlog = screen.getByRole('heading', { name: '備案區' }).closest('section')!
    expect(within(backlog).getByRole('article', { name: 'A' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '刪除這天' })).toBeDisabled()
  })
})
