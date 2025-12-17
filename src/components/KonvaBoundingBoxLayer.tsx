import { useEffect, useRef, useState } from "react";
import { Layer, Rect, Stage } from "react-konva";

interface KonvaBoundingBoxLayerProps {
  width: number;
  height: number;
  onSelect: (boxes: Array<Array<number>>) => void;
}

export default function KonvaBoundingBoxLayer({
  width,
  height,
  onSelect,
}: KonvaBoundingBoxLayerProps) {
  const stageRef = useRef<any>(null);
  const [draftRect, setDraftRect] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [boxes, setBoxes] = useState<Array<Array<number>>>([]); // [w,h,x,y] 리스트

  const handleMouseDown = (e: any) => {
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    setDraftRect({ x: pos.x, y: pos.y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: any) => {
    if (!draftRect) return;
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    setDraftRect({
      ...draftRect,
      width: pos.x - draftRect.x,
      height: pos.y - draftRect.y,
    });
  };

  const handleMouseUp = () => {
    if (!draftRect) return;

    // 좌표를 좌상단 기준으로 정규화해 항상 양수 너비/높이를 유지
    const x1 = draftRect.x;
    const y1 = draftRect.y;
    const x2 = draftRect.x + draftRect.width;
    const y2 = draftRect.y + draftRect.height;

    const x = Math.min(x1, x2);
    const y = Math.min(y1, y2);
    const w = Math.abs(draftRect.width);
    const h = Math.abs(draftRect.height);

    const nextBoxes = [...boxes, [x, y, w, h]];
    setBoxes(nextBoxes);
    onSelect(nextBoxes);

    setDraftRect(null);
  };

  const handleReset = () => {
    setBoxes([]);
    onSelect([]);
  };

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      style={{ position: "absolute", top: 0, left: 0, pointerEvents: "auto" }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <Layer>
        {boxes.map((b, idx) => {
          const [x, y, w, h] = b;
          return (
            <Rect
              key={idx}
              x={x}
              y={y}
              width={w}
              height={h}
              stroke="#f62579"
              strokeWidth={2}
              fill="#f6257979"
            />
          );
        })}
        {draftRect && (
          <Rect
            x={draftRect.x}
            y={draftRect.y}
            width={draftRect.width}
            height={draftRect.height}
            stroke="#f62579"
            strokeWidth={2}
            fill="#f6257979"
          />
        )}
      </Layer>
    </Stage>
  );
}
