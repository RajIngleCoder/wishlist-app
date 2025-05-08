import React from 'react';
import { User } from 'lucide-react';

type Collaborator = {
  id: string;
  name: string;
  color: string;
  isActive?: boolean;
};

type CollaboratorsListProps = {
  collaborators: Collaborator[];
};

const CollaboratorsList = ({ collaborators }: CollaboratorsListProps) => {
  return (
    <div className="flex -space-x-2 overflow-hidden">
      {collaborators.map((collaborator) => (
        <div
          key={collaborator.id}
          className="relative inline-block"
          title={collaborator.name}
        >
          {collaborator.isActive && (
            <span
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-400"
              style={{ transform: 'translate(25%, 25%)' }}
            />
          )}
          <div
            className="relative h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
            style={{ backgroundColor: collaborator.color }}
          >
            {collaborator.name.charAt(0)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CollaboratorsList;