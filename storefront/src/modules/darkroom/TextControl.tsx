// Final, без разрушений, с твоим дизайном, фиксами и зумом по центру.

"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Transformer } from "react-konva";
import useImage from "use-image";
import { useRouter } from "next/navigation";
import { isMobile } from "react-device-detect";

const CANVAS_WIDTH = 4500;
const CANVAS_HEIGHT = 5000;
const DISPLAY_HEIGHT = isMobile ? 680 : 750;
const DISPLAY_WIDTH = (DISPLAY_HEIGHT * CANVAS_WIDTH) / CANVAS_HEIGHT;

const EditorCanvas = () => {
  const router = useRouter();
  const [images, setImages] = useState<any[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [opacity, setOpacity] = useState(1);
  const [mockupType, setMockupType] = useState<"front" | "back">("front");
  const [drawings, setDrawings] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#d63384");
  const [brushSize, setBrushSize] = useState(4);
  const [mode, setMode] = useState<"move" | "brush">("brush");
  const [menuOpen, setMenuOpen] = useState(false);
  const [zoom, setZoom] = useState(0.15);

  const [mockupImage] = useImage(
    mockupType === "front"
      ? "/mockups/MOCAP_FRONT.png"
      : "/mockups/MOCAP_BACK.png"
  );

  const transformerRef = useRef<any>(null);
  const stageRef = useRef<any>(null);

  const scalePos = (pos: { x: number; y: number }) => ({
    x: pos.x / zoom,
    y: pos.y / zoom,
  });

  const handlePointerDown = (e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedImageIndex(null);
    }
    if (mode !== "brush") return;
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;
    const scaled = scalePos(pos);
    setIsDrawing(true);
    setDrawings((prev) => [...prev, { color: brushColor, size: brushSize, points: [scaled.x, scaled.y] }]);
  };

  const handlePointerMove = () => {
    if (!isDrawing || mode !== "brush") return;
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;
    const scaled = scalePos(pos);
    setDrawings((prev) => {
      const last = prev[prev.length - 1];
      const updated = { ...last, points: [...last.points, scaled.x, scaled.y] };
      return [...prev.slice(0, -1), updated];
    });
  };

  const handlePointerUp = () => setIsDrawing(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.src = reader.result as string;
      img.onload = () => {
        const newImage = {
          image: img,
          x: 100,
          y: 150,
          width: img.width,
          height: img.height,
          rotation: 0,
          opacity: 1,
          id: Date.now().toString(),
        };
        setImages((prev) => [...prev, newImage]);
        setSelectedImageIndex(images.length);
        setMode("move");
      };
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (transformerRef.current && selectedImageIndex !== null) {
      const node = stageRef.current.findOne(`#img-${selectedImageIndex}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedImageIndex]);

  const download = (withMockup = true) => {
    const stage = stageRef.current;
    const layer = stage.getLayers()[0];
    if (!withMockup) {
      mockupImage && mockupImage.remove && layer.remove(mockupImage);
    }
    const dataURL = stage.toDataURL({ pixelRatio: 1 });
    const a = document.createElement("a");
    a.href = dataURL;
    a.download = withMockup ? "composition_mockup.png" : "composition_clean.png";
    a.click();
  };

  return (
    <div className="w-screen h-screen bg-white overflow-hidden flex flex-col lg:flex-row">
      <div className={`lg:w-1/2 p-4 ${isMobile ? "absolute z-50 top-0 w-full bg-white" : ""}`}>
        {isMobile && (
          <div className="flex justify-between items-center mb-2">
            <button onClick={() => router.back()} className="text-sm border px-3 py-1">Back</button>
            <button className="text-sm border px-3 py-1" onClick={() => setMenuOpen(!menuOpen)}>Create</button>
          </div>
        )}
        <div className={`${isMobile && !menuOpen ? "hidden" : "block"}`}>
          <div className="flex flex-wrap gap-2 mb-4 text-sm">
            <button className={`border px-3 py-1 ${mode === "move" ? "bg-black text-white" : ""}`} onClick={() => setMode("move")}>Move</button>
            <button className={`border px-3 py-1 ${mode === "brush" ? "bg-black text-white" : ""}`} onClick={() => setMode("brush")}>Brush</button>
            <button className="border px-3 py-1" onClick={() => setMockupType("front")}>Front</button>
            <button className="border px-3 py-1" onClick={() => setMockupType("back")}>Back</button>
            <button className="border px-3 py-1" onClick={() => setDrawings([])}>Clear</button>
            <button className="border px-3 py-1" onClick={() => setZoom((z) => Math.min(1, z + 0.05))}>Zoom In</button>
            <button className="border px-3 py-1" onClick={() => setZoom((z) => Math.max(0.05, z - 0.05))}>Zoom Out</button>
            <button className="bg-black text-white px-3 py-1" onClick={() => download(false)}>Download Clean</button>
            <button className="bg-black text-white px-3 py-1" onClick={() => download(true)}>Download with Mockup</button>
          </div>
          <input type="file" accept="image/*" onChange={handleFileChange} className="mb-3" />
          <label className="block text-xs mb-1">Opacity: {Math.round(opacity * 100)}%</label>
          <input type="range" min="0" max="1" step="0.01" value={opacity} onChange={(e) => {
            setOpacity(Number(e.target.value));
            if (selectedImageIndex !== null) {
              const newImages = [...images];
              newImages[selectedImageIndex].opacity = Number(e.target.value);
              setImages(newImages);
            }
          }} className="w-full mb-2 h-[2px] bg-black appearance-none cursor-pointer" />
          <label className="block text-xs mb-1">Brush Size: {brushSize}px</label>
          <input type="range" min="1" max="120" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full mb-2 h-[2px] bg-black appearance-none cursor-pointer" />
          <label className="block text-xs mb-1">Brush Color</label>
          <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-8 h-8 border p-0 cursor-pointer" />
        </div>
      </div>

      <div className="lg:w-1/2 h-full flex items-center justify-center">
        <div style={{ width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT, transform: "translateY(-30px) scale(0.95)" }}>
          <Stage
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            scale={{ x: zoom, y: zoom }}
            x={(DISPLAY_WIDTH - CANVAS_WIDTH * zoom) / 2}
            y={(DISPLAY_HEIGHT - CANVAS_HEIGHT * zoom) / 2}
            ref={stageRef}
            onMouseDown={handlePointerDown}
            onMousemove={handlePointerMove}
            onMouseup={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            <Layer>
              {mockupImage && <KonvaImage image={mockupImage} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />}
              {images.map((img, index) => (
                <KonvaImage
                  key={img.id}
                  id={`img-${index}`}
                  image={img.image}
                  x={img.x}
                  y={img.y}
                  width={img.width}
                  height={img.height}
                  rotation={img.rotation}
                  opacity={img.opacity}
                  draggable={mode === "move"}
                  onClick={() => setSelectedImageIndex(index)}
                  onTap={() => setSelectedImageIndex(index)}
                />
              ))}
              {drawings.map((line, i) => (
                <Line
                  key={i}
                  points={line.points}
                  stroke={line.color}
                  strokeWidth={line.size}
                  tension={0.5}
                  lineCap="round"
                  globalCompositeOperation="source-over"
                />
              ))}
              {selectedImageIndex !== null && <Transformer ref={transformerRef} rotateEnabled={true} anchorSize={10} />} 
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default EditorCanvas;
