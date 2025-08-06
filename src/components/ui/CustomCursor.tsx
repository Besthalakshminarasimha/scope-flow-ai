import { useEffect, useState } from "react";

export function CustomCursor() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseOver = (e: Event) => {
      const target = e.target as HTMLElement;
      const isInteractive = target.matches('button, a, input, [role="button"], .cursor-pointer');
      setIsHovering(isInteractive);
    };

    const handleMouseOut = () => {
      setIsHovering(false);
    };

    document.addEventListener('mousemove', updateMousePosition);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mousemove', updateMousePosition);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  return (
    <>
      {/* Cursor Dot */}
      <div
        className="cursor-dot"
        style={{
          left: mousePosition.x - 4,
          top: mousePosition.y - 4,
          transform: isHovering ? 'scale(1.5)' : 'scale(1)',
        }}
      />
      
      {/* Cursor Ring */}
      <div
        className={`cursor-ring ${isHovering ? 'hover' : ''}`}
        style={{
          left: mousePosition.x - 12,
          top: mousePosition.y - 12,
        }}
      />
    </>
  );
}