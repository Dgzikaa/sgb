'use client';

interface AssistantButtonProps {
  onClick: () => void;
  hasNewMessages?: boolean;
  isOpen?: boolean;
}

export default function AssistantButton({
  onClick,
  hasNewMessages = false,
  isOpen = false,
}: AssistantButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        fixed bottom-6 right-6 z-40
        w-16 h-16 rounded-2xl
        bg-gradient-to-br from-indigo-500 to-purple-600
        text-white text-2xl
        shadow-2xl hover:shadow-indigo-500/30
        transition-all duration-300 ease-out
        hover:scale-110 active:scale-95
        border-2 border-white/20
        ${isOpen ? 'rotate-180' : 'rotate-0'}
        group relative
      `}
      title="SGB Assistant"
    >
      {/* Ícone principal */}
      <div
        className={`
        transition-all duration-300
        ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}
      `}
      >
        🤖
      </div>

      {/* Ícone quando aberto */}
      <div
        className={`
        absolute inset-0 flex items-center justify-center
        transition-all duration-300
        ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}
      `}
      >
        ✖️
      </div>

      {/* Indicador de notificação */}
      {hasNewMessages && !isOpen && (
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white animate-pulse">
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping"></div>
        </div>
      )}

      {/* Pulse ring quando há mensagens */}
      {hasNewMessages && !isOpen && (
        <div className="absolute inset-0 rounded-2xl border-2 border-red-400 animate-ping"></div>
      )}

      {/* Hover effect ring */}
      <div className="absolute inset-0 rounded-2xl border-2 border-white/0 group-hover:border-white/30 transition-all duration-300"></div>

      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/10 group-hover:to-transparent transition-all duration-300"></div>
    </button>
  );
}
