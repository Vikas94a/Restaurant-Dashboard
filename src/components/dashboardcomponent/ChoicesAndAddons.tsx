"use client";

import ReusableExtrasManager from "./menu/ReusableExtrasManager";
import { ReusableExtraGroup } from "@/utils/menuTypes";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxesStacked } from '@fortawesome/free-solid-svg-icons';

interface ChoicesAndAddonsProps {
  restaurantId: string;
  reusableExtras: ReusableExtraGroup[];
  loadingExtras: boolean;
  addReusableExtraGroup: (groupData: Omit<ReusableExtraGroup, 'id'>) => Promise<string | null>;
  updateReusableExtraGroup: (groupId: string, groupData: Partial<Omit<ReusableExtraGroup, 'id'>>) => Promise<void>;
  deleteReusableExtraGroup: (groupId: string) => Promise<void>;
}

export default function ChoicesAndAddons({
  reusableExtras,
  loadingExtras,
  addReusableExtraGroup,
  updateReusableExtraGroup,
  deleteReusableExtraGroup,
}: ChoicesAndAddonsProps) {
  return (
    <aside className="w-80 bg-gray-50 p-4 border-l border-gray-200 h-full flex flex-col">
      <header className="py-2 mb-4 flex-shrink-0">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider flex items-center">
           Choices & Addons
        </h2>
      </header>
      <div className="flex-1 overflow-y-auto">
        <ReusableExtrasManager
          reusableExtras={reusableExtras}
          loadingExtras={loadingExtras}
          onAddGroup={addReusableExtraGroup}
          onUpdateGroup={updateReusableExtraGroup}
          onDeleteGroup={deleteReusableExtraGroup}
          isCompact={true} 
        />
      </div>
    </aside>
  );
}
