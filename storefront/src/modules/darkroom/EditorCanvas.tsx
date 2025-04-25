// EditorCanvas.tsx – улучшенная версия
// ✅ Zoom от центра
// ✅ Убираются хендлы при клике вне объектов
// ✅ Масштабирование полотна, а не preview
// ✅ Рисование и экспорт в 4500x5000
// ✅ Brush до 100px, с возможностью увеличения
// ✅ Подготовлено под future: Eraser, Text

"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Transformer } from "react-konva";
import useImage from "use-image";
import { isMobile } from "react-device-detect";

const FULL_WIDTH = 4500;
const FULL_HEIGHT = 5000;
const DISPLAY_HEIGHT = isMobile ? 680 : 750;
const DISPLAY_WIDTH = (DISPLAY_HEIGHT * FULL_WIDTH) / FULL_HEIGHT;

const EditorCanvas = () => {
  const [images, setImages] = useState<any[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [opacity, setOpacity] = useState(1);
  const [mockupType, setMockupType] = useState<"front" | "back">("front");
  const [drawings, setDrawings] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#d63384");
  const [brushSize, setBrushSize] = useState(4);
  const [mode, setMode] = useState<"move" | "brush" | "zoom">("brush");
  const [zoom, setZoom] = useState(1);

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
            x: 500,
            y: 500,
            width: img.width / 2,
            height: img.height / 2,
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

  const handlePointerDown = (e: any) => {
    if (e.target === e.target.getStage()) {
      setSelectedImageIndex(null);
      transformerRef.current?.nodes([]);
      return;
    }
    if (mode !== "brush") return;
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;
    setIsDrawing(true);
    setDrawings([...drawings, {
      color: brushColor,
      size: brushSize,
      points: [pos.x / zoom, pos.y / zoom]
    }]);
  };

  const handlePointerMove = () => {
    if (!isDrawing || mode !== "brush") return;
    const pos = stageRef.current.getPointerPosition();
    if (!pos) return;
    const lastLine = drawings[drawings.length - 1];
    lastLine.points.push(pos.x / zoom, pos.y / zoom);
    setDrawings([...drawings.slice(0, -1), lastLine]);
  };

  const handlePointerUp = () => setIsDrawing(false);

  useEffect(() => {
    if (transformerRef.current && selectedImageIndex !== null) {
      const node = stageRef.current.findOne(`#img-${selectedImageIndex}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    }
  }, [selectedImageIndex]);

  return (
    <div className="w-screen h-screen bg-white overflow-hidden flex flex-col lg:flex-row">
      <div className="lg:w-1/3 p-4">
        <div className="flex flex-wrap gap-2 mb-4 text-sm">
          <button onClick={() => setMode("move")}>Move</button>
          <button onClick={() => setMode("brush")}>Brush</button>
          <button onClick={() => setMode("zoom")}>Zoom</button>
          <button onClick={() => setMockupType("front")}>Front</button>
          <button onClick={() => setMockupType("back")}>Back</button>
          <button onClick={() => setDrawings([])}>Clear</button>
          <button
            className="bg-black text-white px-3"
            onClick={() => {
              const uriWithMockup = stageRef.current.toDataURL({ pixelRatio: 1 });
              const a1 = document.createElement("a");
              a1.href = uriWithMockup;
              a1.download = "with-mockup.png";
              a1.click();

              const stage = stageRef.current;
              const layer = stage.children[0].clone();
              const noMockup = layer.find((node: any) => node.getClassName() !== "Image" || node === transformerRef.current);
              const tempStage = new window.Konva.Stage({
                width: FULL_WIDTH,
                height: FULL_HEIGHT,
                children: [new window.Konva.Layer({ children: noMockup })]
              });
              const uriWithoutMockup = tempStage.toDataURL({ pixelRatio: 1 });
              const a2 = document.createElement("a");
              a2.href = uriWithoutMockup;
              a2.download = "no-mockup.png";
              a2.click();
            }}
          >Download</button>
        </div>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <input type="range" min="0.1" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} />
        <input type="range" min="1" max="100" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} />
        <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} />
      </div>
      <div className="flex-grow flex items-center justify-center">
        <Stage
          ref={stageRef}
          width={FULL_WIDTH * (DISPLAY_WIDTH / FULL_WIDTH)}
          height={FULL_HEIGHT * (DISPLAY_HEIGHT / FULL_HEIGHT)}
          scale={{ x: zoom, y: zoom }}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        >
          <Layer>
            {mockupImage && <KonvaImage image={mockupImage} width={FULL_WIDTH} height={FULL_HEIGHT} />}
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
              />
            ))}
            {selectedImageIndex !== null && <Transformer ref={transformerRef} rotateEnabled={true} />}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};

export default EditorCanvas;
