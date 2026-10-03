import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'

const W = 480
const H = 560
const COLS = 9
const ROWS = 5
const PLAYER_Y = H - 40

type Status = 'ready' | 'playing' | 'lost'
type Invader = { x: number; y: number; alive: boolean; row: number }
type Bullet = { x: number; y: number }

const ROW_COLORS = ['#ff4d6d', '#ff9f1c', '#ffe66d', '#2ec4b6', '#4cc9f0']

function createInvaders(): Invader[] {
  const list: Invader[] = []
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      list.push({ x: 40 + c * 46, y: 50 + r * 36, alive: true, row: r })
    }
  }
  return list
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keys = useRef<Record<string, boolean>>({})
  const game = useRef({
    playerX: W / 2,
    invaders: createInvaders(),
    dir: 1,
    bullets: [] as Bullet[],
    bombs: [] as Bullet[],
    lastShot: 0,
    score: 0,
    lives: 3,
    level: 1,
    status: 'ready' as Status,
  })
  const [hud, setHud] = useState({ score: 0, lives: 3, level: 1, status: 'ready' as Status })
  const [best, setBest] = useState(() => Number(localStorage.getItem('si-best') ?? 0))

  const syncHud = useCallback(() => {
    const g = game.current
    setHud({ score: g.score, lives: g.lives, level: g.level, status: g.status })
  }, [])

  const start = useCallback(() => {
    const g = game.current
    g.playerX = W / 2
    g.invaders = createInvaders()
    g.dir = 1
    g.bullets = []
    g.bombs = []
    g.score = 0
    g.lives = 3
    g.level = 1
    g.status = 'playing'
    syncHud()
  }, [syncHud])

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.code] = true
      if (['Space', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault()
      if (e.code === 'Enter' && game.current.status !== 'playing') start()
    }
    const up = (e: KeyboardEvent) => {
      keys.current[e.code] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [start])

  useEffect(() => {
    const ctx = canvasRef.current!.getContext('2d')!
    let raf = 0
    let last = performance.now()

    const endGame = () => {
      const g = game.current
      g.status = 'lost'
      if (g.score > Number(localStorage.getItem('si-best') ?? 0)) {
        localStorage.setItem('si-best', String(g.score))
        setBest(g.score)
      }
      syncHud()
    }

    const update = (dt: number, now: number) => {
      const g = game.current
      const k = keys.current
      if (k.ArrowLeft || k.KeyA) g.playerX -= 300 * dt
      if (k.ArrowRight || k.KeyD) g.playerX += 300 * dt
      g.playerX = Math.max(20, Math.min(W - 20, g.playerX))

      if (k.Space && now - g.lastShot > 350 && g.bullets.length < 3) {
        g.bullets.push({ x: g.playerX, y: PLAYER_Y - 16 })
        g.lastShot = now
      }

      g.bullets.forEach((b) => (b.y -= 460 * dt))
      g.bullets = g.bullets.filter((b) => b.y > -10)
      g.bombs.forEach((b) => (b.y += (200 + g.level * 20) * dt))
      g.bombs = g.bombs.filter((b) => b.y < H + 10)

      const alive = g.invaders.filter((i) => i.alive)
      if (alive.length === 0) {
        g.level++
        g.invaders = createInvaders()
        g.bullets = []
        g.bombs = []
        syncHud()
        return
      }

      const speed = (30 + g.level * 8) * (1 + (ROWS * COLS - alive.length) / 25)
      const minX = Math.min(...alive.map((i) => i.x))
      const maxX = Math.max(...alive.map((i) => i.x))
      let drop = 0
      if ((g.dir > 0 && maxX > W - 40) || (g.dir < 0 && minX < 40)) {
        g.dir *= -1
        drop = 14
      }
      alive.forEach((i) => {
        i.x += g.dir * speed * dt
        i.y += drop
      })

      if (Math.random() < dt * (0.8 + g.level * 0.3)) {
        const shooter = alive[Math.floor(Math.random() * alive.length)]
        g.bombs.push({ x: shooter.x, y: shooter.y + 10 })
      }

      for (const b of g.bullets) {
        for (const i of alive) {
          if (i.alive && Math.abs(b.x - i.x) < 16 && Math.abs(b.y - i.y) < 12) {
            i.alive = false
            b.y = -100
            g.score += 10 * (ROWS - i.row)
            syncHud()
            break
          }
        }
      }

      for (const b of g.bombs) {
        if (Math.abs(b.x - g.playerX) < 18 && Math.abs(b.y - PLAYER_Y) < 12) {
          b.y = H + 100
          g.lives--
          syncHud()
          if (g.lives <= 0) return endGame()
        }
      }

      if (alive.some((i) => i.alive && i.y > PLAYER_Y - 20)) endGame()
    }

    const drawInvader = (i: Invader) => {
      ctx.fillStyle = ROW_COLORS[i.row]
      ctx.fillRect(i.x - 14, i.y - 8, 28, 14)
      ctx.fillRect(i.x - 10, i.y - 12, 20, 4)
      ctx.fillRect(i.x - 14, i.y + 6, 4, 4)
      ctx.fillRect(i.x + 10, i.y + 6, 4, 4)
      ctx.fillStyle = '#0b0b1a'
      ctx.fillRect(i.x - 8, i.y - 4, 4, 4)
      ctx.fillRect(i.x + 4, i.y - 4, 4, 4)
    }

    const draw = () => {
      const g = game.current
      ctx.fillStyle = '#0b0b1a'
      ctx.fillRect(0, 0, W, H)
      g.invaders.forEach((i) => i.alive && drawInvader(i))

      ctx.fillStyle = '#7CFC00'
      ctx.fillRect(g.playerX - 18, PLAYER_Y, 36, 12)
      ctx.fillRect(g.playerX - 3, PLAYER_Y - 10, 6, 10)

      ctx.fillStyle = '#ffffff'
      g.bullets.forEach((b) => ctx.fillRect(b.x - 1.5, b.y, 3, 12))
      ctx.fillStyle = '#ff4d6d'
      g.bombs.forEach((b) => ctx.fillRect(b.x - 2, b.y, 4, 12))
    }

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (game.current.status === 'playing') update(dt, now)
      draw()
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [syncHud])

  const hold = (code: string, on: boolean) => () => {
    keys.current[code] = on
  }
  const touch = (code: string) => ({
    onPointerDown: hold(code, true),
    onPointerUp: hold(code, false),
    onPointerLeave: hold(code, false),
  })

  return (
    <div className="si-root">
      <h1>SPACE INVADERS</h1>
      <div className="si-hud">
        <span>SCORE {hud.score}</span>
        <span>LEVEL {hud.level}</span>
        <span>LIVES {'♥'.repeat(Math.max(hud.lives, 0))}</span>
        <span>BEST {best}</span>
      </div>
      <div className="si-stage">
        <canvas ref={canvasRef} width={W} height={H} />
        {hud.status !== 'playing' && (
          <div className="si-overlay">
            <h2>{hud.status === 'lost' ? 'GAME OVER' : 'READY?'}</h2>
            <p>Arrows / A-D to move, Space to shoot</p>
            <button onClick={start}>{hud.status === 'ready' ? 'Start' : 'Play again'}</button>
          </div>
        )}
      </div>
      <div className="si-touch">
        <button {...touch('ArrowLeft')}>◀</button>
        <button {...touch('Space')}>FIRE</button>
        <button {...touch('ArrowRight')}>▶</button>
      </div>
    </div>
  )
}

export default App
