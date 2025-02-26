"use client"

import { useEffect, useRef } from "react"

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resize()
    window.addEventListener("resize", resize)

    class Particle {
      x: number
      y: number
      baseX: number
      baseY: number
      size: number
      density: number
      speed: number
      angle: number
      amplitude: number
      hue: number

      constructor(x: number, y: number) {
        this.x = x
        this.y = y
        this.baseX = x
        this.baseY = y
        this.size = Math.random() * 2 + 1
        this.density = Math.random() * 20 + 10
        this.speed = 0.02 + Math.random() * 0.03
        this.angle = Math.random() * Math.PI * 2
        this.amplitude = 40 + Math.random() * 60
        this.hue = Math.random() * 30 // Slight color variation
      }

      update(mouse: { x: number; y: number }) {
        this.angle += this.speed

        // Base movement
        this.x = this.baseX + Math.cos(this.angle) * this.amplitude
        this.y = this.baseY + Math.sin(this.angle) * this.amplitude

        // Mouse interaction
        const dx = mouse.x - this.x
        const dy = mouse.y - this.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        const forceDirectionX = dx / distance
        const forceDirectionY = dy / distance
        const maxDistance = 150
        const force = (maxDistance - distance) / maxDistance

        if (distance < maxDistance) {
          this.x -= forceDirectionX * force * 5
          this.y -= forceDirectionY * force * 5
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${220 + this.hue}, 70%, 80%, 0.8)`
        ctx.fill()
      }
    }

    const particles: Particle[] = []
    const mouse = { x: 0, y: 0 }
    const particleCount = Math.min(100, (canvas.width * canvas.height) / 20000)
    
    // Create particles in a grid pattern
    const cols = Math.floor(Math.sqrt(particleCount))
    const rows = Math.floor(particleCount / cols)
    const cellWidth = canvas.width / cols
    const cellHeight = canvas.height / rows

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        particles.push(
          new Particle(
            j * cellWidth + cellWidth / 2,
            i * cellHeight + cellHeight / 2
          )
        )
      }
    }

    canvas.addEventListener("mousemove", (e) => {
      mouse.x = e.x
      mouse.y = e.y
    })

    const animate = () => {
      ctx.fillStyle = "rgba(3, 3, 3, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        particle.update(mouse)
        particle.draw(ctx)

        // Draw connections
        particles.forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const maxDistance = 150

          if (distance < maxDistance) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(255, 255, 255, ${
              (maxDistance - distance) / maxDistance * 0.15
            })`
            ctx.lineWidth = 1
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.stroke()

            // Add glow effect at intersection points
            const gradient = ctx.createRadialGradient(
              particle.x,
              particle.y,
              0,
              particle.x,
              particle.y,
              maxDistance * 0.5
            )
            gradient.addColorStop(0, `rgba(255, 255, 255, ${
              (maxDistance - distance) / maxDistance * 0.1
            })`)
            gradient.addColorStop(1, "rgba(255, 255, 255, 0)")
            ctx.fillStyle = gradient
            ctx.fill()
          }
        })
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none bg-[#030303]">
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent opacity-90" />
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0"
        style={{ filter: "blur(1px)" }}
      />
    </div>
  )
}
