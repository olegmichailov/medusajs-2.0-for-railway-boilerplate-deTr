// ВОССТАНОВЛЕННЫЙ ВАРИАНТ, КОТОРЫЙ БЫЛ ДО ИЗМЕНЕНИЙ — СОХРАНЁННЫЙ ВИД МОКАПА, РИСОВАНИЕ ПО ЦЕНТРУ ЭКРАНА, МАКЕТ НЕ МЕЛКИЙ

"use client";

import { useEffect, useRef, useState } from "react";
import { Stage, Layer, Image as KonvaImage, Line, Transformer } from "react-konva";
import useImage from "use-image";
import { isMobile } from "react-device-detect";

const CANVAS_WIDTH = 4500;
const CANVAS_HEIGHT = 5850;

const DISPLAY_HEIGHT = isMobile ? 680 : 750;
const DISPLAY_WIDTH = (DISPLAY_HEIGHT * CANVAS_WIDTH) / CANVAS_HEIGHT;

export default function EditorCanvas() {
  const [mockupImage] = useImage("/mockups/MOCAP_FRONT.png");
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const [drawings, setDrawings] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState("#d63384");
  const [brushSize, setBrushSize] = useState(4);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mode, setMode] = useState("brush");

  const scalePos = (pos) => ({
    x: (pos.x * CANVAS_WIDTH) / DISPLAY_WIDTH / scale - position.x,
    y: (pos.y * CANVAS_HEIGHT) / DISPLAY_HEIGHT / scale - position.y,
  });

  const handlePointerDown = (e) => {
    if (mode !== "brush") return;
    const pos = stageRef.current.getPointerPosition();
    const scaled = scalePos(pos);
    setIsDrawing(true);
    setDrawings([...drawings, { color: brushColor, size: brushSize, points: [scaled.x, scaled.y] }]);
  };

  const handlePointerMove = () => {
    if (!isDrawing || mode !== "brush") return;
    const pos = stageRef.current.getPointerPosition();
    const scaled = scalePos(pos);
    const lastLine = drawings[drawings.length - 1];
    lastLine.points = lastLine.points.concat([scaled.x, scaled.y]);
    setDrawings([...drawings.slice(0, -1), lastLine]);
  };

  const handlePointerUp = () => setIsDrawing(false);

  const handleZoom = (factor) => {
    const newScale = scale * factor;
    const center = {
      x: (CANVAS_WIDTH / 2) * (1 - factor) + position.x * factor,
      y: (CANVAS_HEIGHT / 2) * (1 - factor) + position.y * factor,
    };
    setScale(newScale);
    setPosition(center);
  };

  return (
    <div className="w-screen h-screen bg-white overflow-hidden flex flex-col lg:flex-row">
      <div className="lg:w-1/2 p-4">
        <div className="flex flex-wrap gap-2 mb-4 text-sm">
          <button onClick={() => setMode("move")}>Move</button>
          <button onClick={() => setMode("brush")}>Brush</button>
          <button onClick={() => setDrawings([])}>Clear</button>
          <button onClick={() => handleZoom(1.25)}>Zoom In</button>
          <button onClick={() => handleZoom(0.8)}>Zoom Out</button>
          <button
            onClick={() => {
              const uri = stageRef.current.toDataURL({ pixelRatio: 4 });
              const a = document.createElement("a");
              a.href = uri;
              a.download = "composition_mockup.png";
              a.click();
            }}
          >
            Download with Mockup
          </button>
        </div>
        <label className="block text-xs mb-1">Brush Size: {brushSize}px</label>
        <input
          type="range"
          min="1"
          max="80"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="w-full mb-2"
        />
        <label className="block text-xs mb-1">Brush Color</label>
        <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} />
      </div>

      <div className="lg:w-1/2 h-full flex items-center justify-center">
        <div style={{ width: DISPLAY_WIDTH, height: DISPLAY_HEIGHT }}>
          <Stage
            width={DISPLAY_WIDTH}
            height={DISPLAY_HEIGHT}
            scale={{ x: DISPLAY_WIDTH / CANVAS_WIDTH * scale, y: DISPLAY_HEIGHT / CANVAS_HEIGHT * scale }}
            x={-position.x * (DISPLAY_WIDTH / CANVAS_WIDTH * scale)}
            y={-position.y * (DISPLAY_HEIGHT / CANVAS_HEIGHT * scale)}
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
              <Transformer ref={transformerRef} rotateEnabled={true} />
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
}
