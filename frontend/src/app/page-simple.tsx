export default function SimplePage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          ZYKOR - Sistema de Gestão
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Sistema funcionando corretamente!
        </p>
        <a 
          href="/login" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg inline-block"
        >
          Ir para Login
        </a>
      </div>
    </div>
  );
}
