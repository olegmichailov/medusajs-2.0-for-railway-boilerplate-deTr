"use client"

import { useEffect, useRef, useState } from "react"
import { fabric } from "fabric"
import { HexColorPicker } from "react-colorful"

export default function EditorCanvas() {
  const canvasRef = useRef<fabric.Canvas | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [mode, setMode] = useState("brush")
  const [color, setColor] = useState("#d64a94")
  const [brushSize, setBrushSize] = useState(4)
  const [opacity, setOpacity] = useState(1)

  const CANVAS_WIDTH = 4000
  const CANVAS_HEIGHT = 4000

  useEffect(() => {
    const fabricCanvas = new fabric.Canvas("canvas", {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      preserveObjectStacking: true,
      backgroundColor: "white",
    })

    fabric.Image.fromURL("/mockups/MOCAP_FRONT.png", (img) => {
      img.scaleToWidth(CANVAS_WIDTH)
      fabricCanvas.setBackgroundImage(img, fabricCanvas.renderAll.bind(fabricCanvas))
    })

    fabricCanvas.isDrawingMode = true
    fabricCanvas.freeDrawingBrush.color = color
    fabricCanvas.freeDrawingBrush.width = brushSize
    canvasRef.current = fabricCanvas

    const center = fabricCanvas.getCenter()
    fabricCanvas.absolutePan({ x: 0, y: 0 })

    return () => {
      fabricCanvas.dispose()
    }
  }, [])

  useEffect(() => {
    if (!canvasRef.current) return
    canvasRef.current.freeDrawingBrush.color = color
    canvasRef.current.freeDrawingBrush.width = brushSize
  }, [color, brushSize])

  const handleZoomIn = () => {
    if (!canvasRef.current) return
    const zoom = canvasRef.current.getZoom() * 1.2
    canvasRef.current.zoomToPoint({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }, zoom)
  }

  const handleZoomOut = () => {
    if (!canvasRef.current) return
    const zoom = canvasRef.current.getZoom() / 1.2
    canvasRef.current.zoomToPoint({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 }, zoom)
  }

  const handleClear = () => {
    if (!canvasRef.current) return
    const bg = canvasRef.current.backgroundImage
    canvasRef.current.clear()
    if (bg) {
      canvasRef.current.setBackgroundImage(bg, canvasRef.current.renderAll.bind(canvasRef.current))
    }
  }

  const handleDownload = (withMockup = false) => {
    if (!canvasRef.current) return

    const originalBg = canvasRef.current.backgroundImage

    if (!withMockup) canvasRef.current.setBackgroundImage(null, canvasRef.current.renderAll.bind(canvasRef.current))

    const dataURL = canvasRef.current.toDataURL({ format: "jpeg", quality: 1 })
    const link = document.createElement("a")
    link.href = dataURL
    link.download = withMockup ? "composition_mockup.jpeg" : "composition_clean.jpeg"
    link.click()

    if (!withMockup && originalBg) {
      canvasRef.current.setBackgroundImage(originalBg, canvasRef.current.renderAll.bind(canvasRef.current))
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !canvasRef.current) return
    const reader = new FileReader()
    reader.onload = () => {
      fabric.Image.fromURL(reader.result as string, (img) => {
        img.set({ left: 100, top: 100, opacity })
        canvasRef.current!.add(img)
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="w-screen h-screen bg-white overflow-hidden flex flex-col lg:flex-row">
      <div className="lg:w-1/2 p-4">
        <div className="flex flex-wrap gap-2 mb-4 text-sm">
          <button onClick={() => setMode("move")} className={`border px-3 py-1 ${mode === "move" ? "bg-black text-white" : ""}`}>Move</button>
          <button onClick={() => setMode("brush")} className={`border px-3 py-1 ${mode === "brush" ? "bg-black text-white" : ""}`}>Brush</button>
          <button onClick={() => handleDownload(true)} className="border px-3 py-1">Download with Mockup</button>
          <button onClick={() => handleDownload(false)} className="border px-3 py-1">Download Clean</button>
          <button onClick={() => handleClear()} className="border px-3 py-1">Clear</button>
          <button onClick={handleZoomIn} className="border px-3 py-1">Zoom In</button>
          <button onClick={handleZoomOut} className="border px-3 py-1">Zoom Out</button>
        </div>
        <div className="mb-4">
          <label className="block mb-1">Opacity: {Math.round(opacity * 100)}%</label>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Brush Size: {brushSize}px</label>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Brush Color</label>
          <HexColorPicker color={color} onChange={setColor} />
        </div>
        <div>
          <input type="file" onChange={handleImageUpload} />
        </div>
      </div>
      <div className="lg:w-1/2 overflow-auto flex items-center justify-center" ref={containerRef}>
        <canvas id="canvas" className="border" />
      </div>
    </div>
  )
}
