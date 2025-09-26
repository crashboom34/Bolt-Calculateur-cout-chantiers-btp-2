import React, { useState } from 'react';
import { PosteTravail } from '../domain/api';

interface PostesFormProps {
  value: PosteTravail[];
  onChange: (value: PosteTravail[]) => void;
}

const PostesForm: React.FC<PostesFormProps> = ({ value, onChange }) => {
  const [newPoste, setNewPoste] = useState<{ nom: string; charge: string }>({
    nom: '',
    charge: ''
  });
  const [errors, setErrors] = useState<{ nom?: string; charge?: string }>({});

  const validatePoste = (poste: { nom: string; charge: string }) => {
    const newErrors: { nom?: string; charge?: string } = {};
    let isValid = true;

    if (!poste.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
      isValid = false;
    }

    const chargeValue = parseFloat(poste.charge);
    if (isNaN(chargeValue) || chargeValue < 0) {
      newErrors.charge = 'La charge doit être un nombre positif';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleAddPoste = () => {
    if (validatePoste(newPoste)) {
      const newPosteItem: PosteTravail = {
        id: crypto.randomUUID(),
        nom: newPoste.nom.trim(),
        charge: parseFloat(newPoste.charge)
      };
      
      onChange([...value, newPosteItem]);
      
      // Réinitialiser le formulaire
      setNewPoste({ nom: '', charge: '' });
      setErrors({});
    }
  };

  const handleDeletePoste = (id: string) => {
    onChange(value.filter(poste => poste.id !== id));
  };

  const handleEditPoste = (id: string, field: 'nom' | 'charge', newValue: string) => {
    const updatedPostes = value.map(poste => {
      if (poste.id === id) {
        if (field === 'nom') {
          return { ...poste, nom: newValue };
        } else if (field === 'charge') {
          const chargeValue = parseFloat(newValue);
          if (!isNaN(chargeValue) && chargeValue >= 0) {
            return { ...poste, charge: chargeValue };
          }
        }
      }
      return poste;
    });
    
    onChange(updatedPostes);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Postes de travail</h3>
      
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="text-left p-2 border">Nom</th>
            <th className="text-left p-2 border">Charge (h)</th>
            <th className="text-left p-2 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {value.map(poste => (
            <tr key={poste.id} className="border-b">
              <td className="p-2 border">
                <input
                  type="text"
                  value={poste.nom}
                  onChange={(e) => handleEditPoste(poste.id, 'nom', e.target.value)}
                  className="w-full p-1 border rounded"
                />
              </td>
              <td className="p-2 border">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={poste.charge}
                  onChange={(e) => handleEditPoste(poste.id, 'charge', e.target.value)}
                  className="w-full p-1 border rounded"
                />
              </td>
              <td className="p-2 border">
                <button
                  onClick={() => handleDeletePoste(poste.id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Supprimer
                </button>
              </td>
            </tr>
          ))}
          
          {/* Ligne pour ajouter un nouveau poste */}
          <tr>
            <td className="p-2 border">
              <input
                type="text"
                value={newPoste.nom}
                onChange={(e) => setNewPoste({ ...newPoste, nom: e.target.value })}
                placeholder="Nom du poste"
                className={`w-full p-1 border rounded ${errors.nom ? 'border-red-500' : ''}`}
              />
              {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom}</p>}
            </td>
            <td className="p-2 border">
              <input
                type="number"
                min="0"
                step="0.5"
                value={newPoste.charge}
                onChange={(e) => setNewPoste({ ...newPoste, charge: e.target.value })}
                placeholder="Heures"
                className={`w-full p-1 border rounded ${errors.charge ? 'border-red-500' : ''}`}
              />
              {errors.charge && <p className="text-red-500 text-xs mt-1">{errors.charge}</p>}
            </td>
            <td className="p-2 border">
              <button
                onClick={handleAddPoste}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Ajouter
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      
      {value.length === 0 && (
        <p className="text-gray-500 italic">Aucun poste de travail défini</p>
      )}
    </div>
  );
};

export default PostesForm;
