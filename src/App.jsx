export default function App() {
  return (
    <div className="min-h-screen bg-cream font-sans text-charcoal flex items-center justify-center p-6">
      <div className="glass-card max-w-md w-full text-center">
        <h1 className="font-heading text-3xl font-bold text-estateGreen mb-3">
          Heritage Saver
        </h1>
        <p className="text-charcoal/60 text-sm tracking-wide">
          Project configured. Ready for development.
        </p>
        <div className="mt-6 flex gap-3 justify-center text-xs font-medium text-estateGreen/50">
          <span className="bg-estateGreen/10 px-3 py-1 rounded-full">React ✓</span>
          <span className="bg-estateGreen/10 px-3 py-1 rounded-full">Tailwind ✓</span>
          <span className="bg-estateGreen/10 px-3 py-1 rounded-full">Vite ✓</span>
        </div>
      </div>
    </div>
  );
}
