import React from 'react';

interface BlogGeometricGraphicProps {
  iconType?: string;
  className?: string;
}

export const BlogGeometricGraphic: React.FC<BlogGeometricGraphicProps> = ({
  iconType = 'iso-striped-cube',
  className = 'w-24 h-24',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {iconType === 'cube-outline-stripes' && (
        <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="none">
          <g transform="translate(50, 50)">
            {/* Outer isometric cube */}
            <path d="M 0,-34 L 30,-17 L 30,17 L 0,34 L -30,17 L -30,-17 Z" stroke="currentColor" strokeWidth="3" />
            <path d="M 0,-34 L 0,0 L 30,17" stroke="currentColor" strokeWidth="3" />
            <path d="M 0,0 L -30,17" stroke="currentColor" strokeWidth="3" />
            {/* Left face stripes */}
            <path d="M -24,-10 L -24,8" stroke="currentColor" strokeWidth="2.5" />
            <path d="M -18,-5 L -18,13" stroke="currentColor" strokeWidth="2.5" />
            <path d="M -12,0 L -12,18" stroke="currentColor" strokeWidth="2.5" />
            <path d="M -6,5 L -6,23" stroke="currentColor" strokeWidth="2.5" />
            {/* Right face inner cutout */}
            <rect x="6" y="-6" width="14" height="14" stroke="currentColor" strokeWidth="2.5" fill="none" transform="skewY(26)" />
          </g>
        </svg>
      )}

      {iconType === 'hex-layers' && (
        <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="none">
          <g transform="translate(50, 50)">
            {/* Hexagonal layered stripes */}
            <path d="M 0,-34 L 30,-17 L 30,17 L 0,34 L -30,17 L -30,-17 Z" stroke="currentColor" strokeWidth="3.5" />
            <path d="M 0,-26 L 23,-13 L 23,13 L 0,26 L -23,13 L -23,-13 Z" stroke="currentColor" strokeWidth="2.5" />
            <path d="M 0,-18 L 16,-9 L 16,9 L 0,18 L -16,9 L -16,-9 Z" stroke="currentColor" strokeWidth="2.5" fill="white" />
            {/* Dense inner hatching */}
            <path d="M -28,-14 L -23,-10" stroke="currentColor" strokeWidth="2" />
            <path d="M -28,-6 L -23,-2" stroke="currentColor" strokeWidth="2" />
            <path d="M -28,2 L -23,6" stroke="currentColor" strokeWidth="2" />
            <path d="M -28,10 L -23,14" stroke="currentColor" strokeWidth="2" />
            <path d="M 28,-14 L 23,-10" stroke="currentColor" strokeWidth="2" />
            <path d="M 28,-6 L 23,-2" stroke="currentColor" strokeWidth="2" />
            <path d="M 28,2 L 23,6" stroke="currentColor" strokeWidth="2" />
            <path d="M 28,10 L 23,14" stroke="currentColor" strokeWidth="2" />
            <polygon points="0,-8 7,-4 7,4 0,8 -7,4 -7,-4" fill="currentColor" />
          </g>
        </svg>
      )}

      {iconType === 'radial-star' && (
        <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="none">
          <g transform="translate(50, 50)">
            {/* Central square core rotated 45 deg */}
            <rect x="-8" y="-8" width="16" height="16" fill="currentColor" transform="rotate(45)" />
            {/* Radiating comb rays in 4 directions */}
            {/* Top branch */}
            <line x1="0" y1="-8" x2="0" y2="-32" stroke="currentColor" strokeWidth="3.5" />
            <line x1="-12" y1="-18" x2="12" y2="-18" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-18" y1="-26" x2="18" y2="-26" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-24" y1="-34" x2="24" y2="-34" stroke="currentColor" strokeWidth="3" />
            {/* Bottom branch */}
            <line x1="0" y1="8" x2="0" y2="32" stroke="currentColor" strokeWidth="3.5" />
            <line x1="-12" y1="18" x2="12" y2="18" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-18" y1="26" x2="18" y2="26" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-24" y1="34" x2="24" y2="34" stroke="currentColor" strokeWidth="3" />
            {/* Left & Right branches */}
            <line x1="-8" y1="0" x2="-32" y2="0" stroke="currentColor" strokeWidth="3.5" />
            <line x1="-18" y1="-12" x2="-18" y2="12" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-26" y1="-18" x2="-26" y2="18" stroke="currentColor" strokeWidth="2.5" />
            <line x1="8" y1="0" x2="32" y2="0" stroke="currentColor" strokeWidth="3.5" />
            <line x1="18" y1="-12" x2="18" y2="12" stroke="currentColor" strokeWidth="2.5" />
            <line x1="26" y1="-18" x2="26" y2="18" stroke="currentColor" strokeWidth="2.5" />
          </g>
        </svg>
      )}

      {iconType === 'striped-cube-cutout' && (
        <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="none">
          <g transform="translate(50, 50)">
            <path d="M 0,-34 L 30,-17 L 30,17 L 0,34 L -30,17 L -30,-17 Z" stroke="currentColor" strokeWidth="3" />
            {/* Left face stripes */}
            <line x1="-24" y1="-12" x2="-24" y2="12" stroke="currentColor" strokeWidth="3" />
            <line x1="-16" y1="-8" x2="-16" y2="16" stroke="currentColor" strokeWidth="3" />
            <line x1="-8" y1="-4" x2="-8" y2="20" stroke="currentColor" strokeWidth="3" />
            {/* Top cutout */}
            <polygon points="0,-30 24,-16 0,-2 -24,-16" stroke="currentColor" strokeWidth="2" fill="none" />
            {/* Right solid square inset */}
            <polygon points="6,2 24,-8 24,12 6,22" fill="currentColor" />
          </g>
        </svg>
      )}

      {iconType === 'nested-stairs-cube' && (
        <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="none">
          <g transform="translate(50, 50)">
            {/* Horizontal striped top block */}
            <polygon points="0,-34 30,-17 0,0 -30,-17" fill="none" stroke="currentColor" strokeWidth="2" />
            <line x1="-24" y1="-20" x2="6" y2="-4" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-18" y1="-23" x2="12" y2="-7" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-12" y1="-26" x2="18" y2="-10" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-6" y1="-30" x2="24" y2="-14" stroke="currentColor" strokeWidth="2.5" />
            {/* Bottom step blocks */}
            <polygon points="0,0 30,-17 30,17 0,34" fill="currentColor" />
            <polygon points="-30,-17 0,0 0,34 -30,17" stroke="currentColor" strokeWidth="2" fill="white" />
            <line x1="-24" y1="-10" x2="-24" y2="14" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-16" y1="-5" x2="-16" y2="19" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-8" y1="0" x2="-8" y2="24" stroke="currentColor" strokeWidth="2.5" />
          </g>
        </svg>
      )}

      {iconType === 'iso-striped-block' && (
        <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="none">
          <g transform="translate(50, 50)">
            {/* Isometric block with prominent vertical stripes on top and sides */}
            <polygon points="0,-34 32,-18 0,-2 -32,-18" stroke="currentColor" strokeWidth="2" />
            <line x1="-24" y1="-22" x2="-24" y2="-14" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-16" y1="-26" x2="-16" y2="-10" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-8" y1="-30" x2="-8" y2="-6" stroke="currentColor" strokeWidth="2.5" />
            <line x1="0" y1="-32" x2="0" y2="-2" stroke="currentColor" strokeWidth="2.5" />
            <line x1="8" y1="-30" x2="8" y2="-6" stroke="currentColor" strokeWidth="2.5" />
            <line x1="16" y1="-26" x2="16" y2="-10" stroke="currentColor" strokeWidth="2.5" />
            <line x1="24" y1="-22" x2="24" y2="-14" stroke="currentColor" strokeWidth="2.5" />

            <polygon points="-32,-18 0,-2 0,30 -32,14" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-24" y1="-6" x2="-24" y2="18" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-16" y1="-2" x2="-16" y2="22" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-8" y1="2" x2="-8" y2="26" stroke="currentColor" strokeWidth="2.5" />

            <polygon points="0,-2 32,-18 32,14 0,30" fill="currentColor" />
          </g>
        </svg>
      )}

      {iconType === 'hex-maze' && (
        <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="none">
          <g transform="translate(50, 50)">
            <path d="M 0,-34 L 30,-17 L 30,17 L 0,34 L -30,17 L -30,-17 Z" stroke="currentColor" strokeWidth="3" />
            {/* Concentric hexagonal maze */}
            <path d="M -20,-11 L 0,-22 L 20,-11 L 20,11 L 0,22 L -20,11 Z" stroke="currentColor" strokeWidth="3" fill="none" />
            <path d="M -10,-5 L 0,-11 L 10,-5 L 10,5 L 0,11 L -10,5 Z" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <line x1="-28" y1="-5" x2="-20" y2="-1" stroke="currentColor" strokeWidth="3" />
            <line x1="20" y1="-1" x2="28" y2="-5" stroke="currentColor" strokeWidth="3" />
            <polygon points="0,-4 4,-2 4,2 0,4 -4,2 -4,-2" fill="currentColor" />
          </g>
        </svg>
      )}

      {iconType === 'branch-rays' && (
        <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="none">
          <g transform="translate(50, 50)">
            {/* Cross with branching angled hatch */}
            <line x1="0" y1="-32" x2="0" y2="32" stroke="currentColor" strokeWidth="4" />
            <line x1="-32" y1="0" x2="32" y2="0" stroke="currentColor" strokeWidth="4" />
            {/* Diagonal slashes */}
            <line x1="-24" y1="-16" x2="-16" y2="-24" stroke="currentColor" strokeWidth="3" />
            <line x1="-16" y1="-8" x2="-8" y2="-16" stroke="currentColor" strokeWidth="3" />
            <line x1="24" y1="-16" x2="16" y2="-24" stroke="currentColor" strokeWidth="3" />
            <line x1="16" y1="-8" x2="8" y2="-16" stroke="currentColor" strokeWidth="3" />
            <line x1="-24" y1="16" x2="-16" y2="24" stroke="currentColor" strokeWidth="3" />
            <line x1="-16" y1="8" x2="-8" y2="16" stroke="currentColor" strokeWidth="3" />
            <line x1="24" y1="16" x2="16" y2="24" stroke="currentColor" strokeWidth="3" />
            <line x1="16" y1="8" x2="8" y2="16" stroke="currentColor" strokeWidth="3" />
          </g>
        </svg>
      )}

      {iconType === 'wireframe-box' && (
        <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="none">
          <g transform="translate(50, 50)">
            <polygon points="0,-34 30,-17 0,0 -30,-17" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <polygon points="-30,-17 0,0 0,34 -30,17" stroke="currentColor" strokeWidth="2.5" fill="none" />
            <polygon points="0,0 30,-17 30,17 0,34" stroke="currentColor" strokeWidth="2.5" fill="none" />
            {/* Diagonal hatched lines inside left face */}
            <line x1="-26" y1="-10" x2="-20" y2="12" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-18" y1="-5" x2="-12" y2="17" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-10" y1="0" x2="-4" y2="22" stroke="currentColor" strokeWidth="2.5" />
            {/* Center solid black square accent */}
            <rect x="8" y="2" width="12" height="12" fill="currentColor" transform="skewY(-26)" />
          </g>
        </svg>
      )}

      {iconType === 'striped-offset-block' && (
        <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="none">
          <g transform="translate(50, 50)">
            {/* Top hatched slab */}
            <polygon points="0,-34 26,-19 0,-4 -26,-19" stroke="currentColor" strokeWidth="2" />
            <line x1="-20" y1="-21" x2="6" y2="-6" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-14" y1="-24" x2="12" y2="-9" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-8" y1="-28" x2="18" y2="-13" stroke="currentColor" strokeWidth="2.5" />
            {/* Left face horizontal slats */}
            <polygon points="-26,-19 0,-4 0,10 -26,-5" stroke="currentColor" strokeWidth="2" />
            <line x1="-22" y1="-14" x2="-4" y2="-1" stroke="currentColor" strokeWidth="2" />
            <line x1="-22" y1="-9" x2="-4" y2="4" stroke="currentColor" strokeWidth="2" />
            {/* Lower black offset cube */}
            <polygon points="-8,4 18,-11 18,19 -8,34" fill="currentColor" />
          </g>
        </svg>
      )}

      {iconType === 'iso-slat-block-2' && (
        <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="none">
          <g transform="translate(50, 50)">
            {/* Slat block with vertical stripes */}
            <polygon points="0,-34 32,-18 0,-2 -32,-18" stroke="currentColor" strokeWidth="2" fill="white" />
            <line x1="-24" y1="-22" x2="-24" y2="-14" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-16" y1="-26" x2="-16" y2="-10" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-8" y1="-30" x2="-8" y2="-6" stroke="currentColor" strokeWidth="2.5" />
            <line x1="0" y1="-32" x2="0" y2="-2" stroke="currentColor" strokeWidth="2.5" />
            <line x1="8" y1="-30" x2="8" y2="-6" stroke="currentColor" strokeWidth="2.5" />
            <line x1="16" y1="-26" x2="16" y2="-10" stroke="currentColor" strokeWidth="2.5" />
            <line x1="24" y1="-22" x2="24" y2="-14" stroke="currentColor" strokeWidth="2.5" />

            <polygon points="-32,-18 0,-2 0,30 -32,14" fill="currentColor" />
            <polygon points="0,-2 32,-18 32,14 0,30" fill="currentColor" />
          </g>
        </svg>
      )}

      {iconType === 'cutout-cube-2' && (
        <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="none">
          <g transform="translate(50, 50)">
            <polygon points="0,-34 30,-17 0,0 -30,-17" stroke="currentColor" strokeWidth="3" />
            <polygon points="-30,-17 0,0 0,34 -30,17" stroke="currentColor" strokeWidth="3" />
            {/* Vertical lines on left face */}
            <line x1="-24" y1="-12" x2="-24" y2="12" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-16" y1="-8" x2="-16" y2="16" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-8" y1="-4" x2="-8" y2="20" stroke="currentColor" strokeWidth="2.5" />
            {/* Right side cutout box */}
            <polygon points="0,0 30,-17 30,17 0,34" stroke="currentColor" strokeWidth="3" />
            <polygon points="8,-3 22,-11 22,9 8,17" fill="currentColor" />
          </g>
        </svg>
      )}

      {/* Default fallback: iso-striped-cube */}
      {(iconType === 'iso-striped-cube' ||
        ![
          'cube-outline-stripes',
          'hex-layers',
          'radial-star',
          'striped-cube-cutout',
          'nested-stairs-cube',
          'iso-striped-block',
          'hex-maze',
          'branch-rays',
          'wireframe-box',
          'striped-offset-block',
          'iso-slat-block-2',
          'cutout-cube-2',
        ].includes(iconType)) && (
        <svg viewBox="0 0 100 100" className="w-full h-full text-black" fill="none">
          <g transform="translate(50, 50)">
            {/* Top Face */}
            <path d="M 0,-34 L 30,-17 L 0,0 L -30,-17 Z" stroke="currentColor" strokeWidth="2" fill="white" />
            <line x1="-20" y1="-21" x2="-20" y2="-13" stroke="currentColor" strokeWidth="2.5" />
            <line x1="-10" y1="-26" x2="-10" y2="-8" stroke="currentColor" strokeWidth="2.5" />
            <line x1="0" y1="-30" x2="0" y2="-4" stroke="currentColor" strokeWidth="2.5" />
            <line x1="10" y1="-26" x2="10" y2="-8" stroke="currentColor" strokeWidth="2.5" />
            <line x1="20" y1="-21" x2="20" y2="-13" stroke="currentColor" strokeWidth="2.5" />

            {/* Left Face */}
            <path d="M -30,-17 L 0,0 L 0,34 L -30,17 Z" fill="currentColor" />

            {/* Right Face with Slat Lines */}
            <path d="M 0,0 L 30,-17 L 30,17 L 0,34 Z" stroke="currentColor" strokeWidth="2" fill="white" />
            <line x1="8" y1="-4" x2="8" y2="24" stroke="currentColor" strokeWidth="2.5" />
            <line x1="16" y1="-8" x2="16" y2="20" stroke="currentColor" strokeWidth="2.5" />
            <line x1="24" y1="-12" x2="24" y2="16" stroke="currentColor" strokeWidth="2.5" />
          </g>
        </svg>
      )}
    </div>
  );
};

export default BlogGeometricGraphic;
