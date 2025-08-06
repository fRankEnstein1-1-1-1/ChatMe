import React from 'react';

export default function Avatar({ size = 40, name = '', style = {} }) {
  if (!name || typeof name !== 'string') return null;
  const initials = name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const getGradientColors = (inputName) => {
    const charCode = inputName?.charCodeAt(0) || 0;
    const gradients = [
      ['#FF8C00', '#F44336'],
      ['#6A5ACD', '#20B2AA'],
      ['#4CAF50', '#FFC107'],
      ['#F44336', '#6A5ACD'],
      ['#20B2AA', '#4CAF50'],
      ['#FFC107', '#FF8C00'],
    ];
    return gradients[charCode % gradients.length];
  };

  const [color1, color2] = getGradientColors(name);

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(135deg, ${color1}, ${color2})`,
    color: '#FFFFFF',
    fontWeight: 600,
    fontSize: size * 0.4,
    textAlign: 'center',
    ...style,
  };

  return (
    <div style={avatarStyle}>
      {initials || '??'}
    </div>
  );
}
