import React from 'react';
import { Building2, MapPin } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building2 className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">BTP Calculateur</h1>
              <p className="text-blue-100 text-sm">Gestion des coûts chantier</p>
            </div>
          </div>
          <div className="flex items-center text-blue-100">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="text-sm">Montpellier, France</span>
          </div>
        </div>
      </div>
    </header>
  );
};
