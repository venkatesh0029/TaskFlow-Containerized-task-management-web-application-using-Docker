import React from "react";

interface ConfettiBurstProps {
  show: boolean;
}

// Lightweight CSS-based confetti for quick celebratory feedback without extra deps
export function ConfettiBurst({ show }: ConfettiBurstProps) {
  if (!show) return null;

  const pieces = Array.from({ length: 24 });

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50 }}>
      <style>
        {`
        @keyframes fall-spin {
          0% { transform: translateY(-20vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        `}
      </style>
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.2;
        const duration = 1.2 + Math.random() * 0.6;
        const size = 6 + Math.floor(Math.random() * 6);
        const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7", "#06b6d4"];
        const color = colors[i % colors.length];
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              top: 0,
              left: `${left}%`,
              width: size,
              height: size,
              backgroundColor: color,
              borderRadius: 2,
              opacity: 0,
              transform: "translateY(-20vh)",
              animation: `fall-spin ${duration}s ease-out ${delay}s forwards`,
            }}
          />
        );
      })}
    </div>
  );
}


