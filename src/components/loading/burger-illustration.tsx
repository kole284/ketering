export function BurgerIllustration() {
  return (
    <svg
      className="intro-burger"
      viewBox="0 0 220 170"
      role="img"
      aria-label="Stilizovan burger"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="intro-burger-bun-top"
        d="M42 77c3-35 31-57 68-57s65 22 68 57H42Z"
      />
      <path className="intro-burger-sesame" d="M78 45c7-4 12-4 18 0" />
      <path className="intro-burger-sesame" d="M119 39c6-3 11-3 17 1" />
      <path className="intro-burger-sesame" d="M139 59c6-3 11-3 16 1" />
      <path
        className="intro-burger-lettuce"
        d="M36 84c10-10 20 8 31-1 10-9 20 8 31-1 10-8 21 8 33-1 10-8 21 8 33-1 8-7 14-2 20 4v13H36V84Z"
      />
      <path className="intro-burger-cheese" d="M43 96h134l-14 24-14-17-15 22-16-22-15 18-16-18-15 22-14-22-15 17-14-24Z" />
      <path className="intro-burger-patty" d="M36 111c0-9 8-16 18-16h112c10 0 18 7 18 16s-8 16-18 16H54c-10 0-18-7-18-16Z" />
      <path className="intro-burger-bun-bottom" d="M48 132h124c8 0 14 6 14 14s-6 14-14 14H48c-8 0-14-6-14-14s6-14 14-14Z" />
    </svg>
  );
}
