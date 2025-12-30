import { useEffect, useState } from 'react';
import './AnimatedCharacter.css';
import characterImage from '../assets/character.png';

export type CharacterState = 'idle' | 'listening' | 'speaking' | 'thinking';

interface AnimatedCharacterProps {
  state: CharacterState;
  onClick?: () => void;
}

/**
 * AnimatedCharacter Component
 * Simple image-based character with bounce animation
 */
export function AnimatedCharacter({ state, onClick }: AnimatedCharacterProps) {
  const [bounceOffset, setBounceOffset] = useState(0);

  useEffect(() => {
    let animationFrame: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const offset = Math.sin(elapsed * 2) * 10; // Bounce up and down
      setBounceOffset(offset);
      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <div className={`animated-character-container ${state}`}>
      <div
        className="character-wrapper"
        style={{
          transform: `translateY(${bounceOffset}px)`,
          cursor: onClick ? 'pointer' : 'default'
        }}
        onClick={onClick}
      >
        <img
          src={characterImage}
          alt="AI Character"
          className="character-image"
        />
        {state === 'listening' && <div className="listening-rings" />}
        {state === 'speaking' && <div className="speaking-waves" />}
      </div>
      <div className="character-state-label">{getStateLabel(state)}</div>
    </div>
  );
}

/**
 * Get state label text
 */
function getStateLabel(state: CharacterState): string {
  switch (state) {
    case 'listening':
      return 'Listening...';
    case 'speaking':
      return 'Speaking...';
    case 'thinking':
      return 'Thinking...';
    default:
      return 'Click to talk';
  }
}
