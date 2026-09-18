import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import { downloadTextFile } from '../domain/download'
import App from './App'

vi.mock('../domain/download', () => ({
  TRIP_CSV_FILENAME: 'travel-itinerary.csv',
  downloadTextFile: vi.fn(),
}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('多日視覺編排', () => {
  it('shows a light Markdown format example above the editor', () => {
    render(<App />)

    expect(screen.getByText('格式範例')).toBeInTheDocument()
    expect(screen.getByLabelText('Markdown 格式範例')).toHaveTextContent('@09:00')
  })

  it('creates backlog and day columns only from Markdown headings', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Markdown 行程'), {
      target: {
        value: `# 京都

## 備案
- A | A | 60

## Day 1 | 2026-10-03
- B | B | 30

## Day 2 | 2026-10-04`,
      },
    })

    const backlog = screen.getByRole('region', { name: '備案' })
    const dayOne = screen.getByRole('region', { name: 'Day 1' })
    const dayTwo = screen.getByRole('region', { name: 'Day 2' })
    expect(within(backlog).getByRole('article', { name: 'A' })).toBeInTheDocument()
    expect(within(dayOne).getByRole('article', { name: 'B' })).toBeInTheDocument()
    expect(within(dayTwo).getAllByRole('group', { name: /^\d{2}:00$/ })).toHaveLength(24)
    expect(within(dayTwo).getByText('拖到這裡可清除時間')).toBeInTheDocument()
  })

  it('renders 24 hourly slots and keeps untimed day items separate', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Markdown 行程'), {
      target: {
        value: `# 時間軸

## 備案

## Day 1 | 2026-10-03
- @09:30 A | A | 60
- B | B | 30`,
      },
    })

    const dayOne = screen.getByRole('region', { name: 'Day 1' })
    const hourlySlots = within(dayOne).getAllByRole('group', { name: /^\d{2}:00$/ })
    expect(hourlySlots).toHaveLength(24)
    expect(within(dayOne).getByRole('group', { name: '09:00' })).toContainElement(
      screen.getByRole('article', { name: 'A' }),
    )
    expect(within(dayOne).getByRole('region', { name: '未設定時間' })).toContainElement(
      screen.getByRole('article', { name: 'B' }),
    )
  })

  it('sizes scheduled cards according to their duration', () => {
    render(<App />)
    fireEvent.change(screen.getByLabelText('Markdown 行程'), {
      target: {
        value: `# 時間軸

## 備案

## Day 1 | 2026-10-03
- @09:00 A | A | 140`,
      },
    })

    const card = screen.getByRole('article', { name: 'A' })
    expect(card).toHaveClass('timedPlaceCard')
    expect(card.style.getPropertyValue('--duration-height')).toBe('177.33333333333334px')
  })

  it('offers the current CSV through a stable download filename', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '下載 CSV 時間表' }))

    expect(downloadTextFile).toHaveBeenCalledWith(
      expect.stringContaining('section,date,order,startTime,endTime,name,mapQuery,durationMinutes,note'),
      'travel-itinerary.csv',
    )
  })

  it('renders an ordered Google Maps preview when the Embed key is configured', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_EMBED_API_KEY', 'test-key')
    render(<App />)
    fireEvent.change(screen.getByLabelText('Markdown 行程'), {
      target: {
        value: `# 路線預覽

## 備案

## Day 1
- @09:00 A | 東京站 | 60
- @11:00 B | 淺草寺 | 60`,
      },
    })

    const preview = screen.getByTitle('Day 1 Google Maps 路線預覽')
    const url = new URL(preview.getAttribute('src') ?? '')
    expect(url.pathname).toBe('/maps/embed/v1/directions')
    expect(url.searchParams.get('origin')).toBe('東京站')
    expect(url.searchParams.get('destination')).toBe('淺草寺')
    expect(url.searchParams.has('mode')).toBe(false)
    expect(preview).toHaveAttribute('loading', 'lazy')
    expect(preview).toHaveAttribute('allowfullscreen')
    expect(preview).toHaveAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
  })

  it('keeps the route link and shows setup guidance when the Embed key is absent', () => {
    vi.stubEnv('VITE_GOOGLE_MAPS_EMBED_API_KEY', '')
    render(<App />)
    fireEvent.change(screen.getByLabelText('Markdown 行程'), {
      target: {
        value: `# 路線預覽

## 備案

## Day 1
- A | 東京站 | 60
- B | 淺草寺 | 60`,
      },
    })

    expect(screen.queryByTitle(/Google Maps 路線預覽/)).not.toBeInTheDocument()
    expect(screen.getByText(/VITE_GOOGLE_MAPS_EMBED_API_KEY/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /開啟 Google Maps 路線/ })).toBeInTheDocument()
  })
})
