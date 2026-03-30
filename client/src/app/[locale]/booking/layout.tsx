export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* En-tête du Salon */}
        <div className="bg-black text-white p-6 text-center">
            <h1 className="text-2xl font-bold tracking-wider">be COLOR</h1>
            <p className="text-gray-400 text-sm mt-1">Salon de Coiffure & Coloration</p>
        </div>
        
        {children}
        
        {/* Pied de page */}
        <div className="bg-gray-50 p-4 text-center text-xs text-gray-400 border-t">
            © 2024 be COLOR - Réservation en ligne sécurisée
        </div>
      </div>
    </div>
  );
}