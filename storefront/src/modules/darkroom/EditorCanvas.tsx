"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Transformer } from "react-konva";
import useImage from "use-image";
import { useRouter } from "next/navigation";
import { isMobile } from "react-device-detect";

const CANVAS_WIDTH = 985;
const CANVAS_HEIGHT = 1271;

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
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const [mockupImage] = useImage(
    mockupType === "front" ? "/mockups/MOCAP_FRONT.png" : "/mockups/MOCAP_BACK.png"
  );

  const transformerRef = useRef<any>(null);
  const stageRef = useRef<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new window.Image();
        img.src = reader.result as string;
        img.onload = () => {
          const newImage = {
            image: img,
            x: 100,
            y: 150,
            width: img.width / 4,
            height: img.height / 4,
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
    }
  };

  const scalePos = (pos: { x: number; y: number }) => ({
    x: (pos.x - offset.x) / scale,
    y: (pos.y - offset.y) / scale,
  });

  const handlePointerDown = (e: any) => {
    const clickedEmpty = e.target === e.target.getStage();
    if (clickedEmpty) {
      setSelectedImageIndex(null);
    }
    if (mode !== "brush") return;
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;
    const scaled = scalePos(pos);
    setIsDrawing(true);
    setDrawings([...drawings, { color: brushColor, size: brushSize, points: [scaled.x, scaled.y] }]);
  };

  const handlePointerMove = () => {
    if (!isDrawing || mode !== "brush") return;
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;
    const scaled = scalePos(pos);
    const lastLine = drawings[drawings.length - 1];
    lastLine.points = lastLine.points.concat([scaled.x, scaled.y]);
    setDrawings([...drawings.slice(0, -1), lastLine]);
  };

  const handlePointerUp = () => setIsDrawing(false);

  const handleDownload = (withMockup: boolean) => {
    const uri = stageRef.current.toDataURL({
      pixelRatio: 3,
    });
    const a = document.createElement("a");
    a.href = uri;
    a.download = withMockup ? "composition_mockup.jpeg" : "composition_clean.jpeg";
    a.click();
  };

  useEffect(() => {
    if (transformerRef.current && selectedImageIndex !== null && mode === "move") {
      const node = stageRef.current.findOne(`#img-${selectedImageIndex}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
    }
  }, [selectedImageIndex, mode]);

  const zoom = (inOut: "in" | "out") => {
    const factor = inOut === "in" ? 1.2 : 0.8;
    const newScale = scale * factor;
    setScale(newScale);
    const center = {
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
    };
    setOffset({
      x: offset.x - (center.x * (factor - 1)),
      y: offset.y - (center.y * (factor - 1)),
    });
  };

  return (
    <div className="w-screen h-screen bg-white overflow-hidden flex flex-col lg:flex-row">
      <div className="lg:w-1/2 p-4">
        <div className="flex flex-wrap gap-2 mb-4 text-sm">
          <button onClick={() => setMode("move")} className={\`border px-3 py-1 \${mode === "move" ? "bg-black text-white" : ""}\`}>Move</button>
          <button onClick={() => setMode("brush")} className={\`border px-3 py-1 \${mode === "brush" ? "bg-black text-white" : ""}\`}>Brush</button>
          <button onClick={() => setMockupType("front")} className="border px-3 py-1">Front</button>
          <button onClick={() => setMockupType("back")} className="border px-3 py-1">Back</button>
          <button onClick={() => setDrawings([])} className="border px-3 py-1">Clear</button>
          <button onClick={() => zoom("in")} className="border px-3 py-1">Zoom In</button>
          <button onClick={() => zoom("out")} className="border px-3 py-1">Zoom Out</button>
          <button onClick={() => handleDownload(true)} className="bg-black text-white px-3 py-1">Download with Mockup</button>
          <button onClick={() => handleDownload(false)} className="border px-3 py-1">Download Clean</button>
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
        }} className="w-full mb-2" />
        <label className="block text-xs mb-1">Brush Size: {brushSize}px</label>
        <input type="range" min="1" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-full mb-2" />
        <label className="block text-xs mb-1">Brush Color</label>
        <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-8 h-8 border p-0 cursor-pointer" />
      </div>

      <div className="lg:w-1/2 h-full flex items-center justify-center">
        <div style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          <Stage
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            scale={{ x: scale, y: scale }}
            offset={offset}
            ref={stageRef}
            onMouseDown={handlePointerDown}
            onMousemove={handlePointerMove}
            onMouseup={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            <Layer>
              {mockupImage && (
                <KonvaImage image={mockupImage} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
              )}
              {images.map((img, index) => (
                <KonvaImage
                  key={img.id}
                  id={\`img-\${index}\`}
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
              <Transformer ref={transformerRef} />
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

export default EditorCanvas;
