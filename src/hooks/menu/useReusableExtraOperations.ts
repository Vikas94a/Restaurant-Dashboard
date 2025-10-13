"use client";

import { useState, useCallback, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { ReusableExtraGroup, CustomizationGroup } from '@/utils/menuTypes';

interface UseReusableExtraOperationsProps {
  restaurantId: string;
  setConfirmDialog: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>>;
}

interface FirebaseError {
  code?: string;
  message?: string;
}

const transformToCustomizationGroup = (reusableExtra: ReusableExtraGroup): CustomizationGroup => {
  return {
    id: reusableExtra.id,
    groupName: reusableExtra.groupName,
    selectionType: reusableExtra.selectionType,
    required: reusableExtra.required || false,
    choices: reusableExtra.choices.map(choice => ({
      ...choice,
      isDefault: false,
      isEditing: false
    }))
  };
};

export const useReusableExtraOperations = ({
  restaurantId,
  setConfirmDialog,
}: UseReusableExtraOperationsProps) => {
  const [reusableExtras, setReusableExtras] = useState<CustomizationGroup[]>([]);
  const [loadingExtras, setLoadingExtras] = useState(true);

  const fetchReusableExtras = useCallback(async () => {
    if (!restaurantId) {
      setReusableExtras([]);
      setLoadingExtras(false);
      return;
    }
    setLoadingExtras(true);
    try {
      const restaurantRef = doc(db, "restaurants", restaurantId);
      const restaurantDoc = await getDoc(restaurantRef);
      
      if (!restaurantDoc.exists()) {
        setReusableExtras([]);
        return;
      }

      const extrasRef = collection(db, "restaurants", restaurantId, "reusableExtraGroups");
      const querySnapshot = await getDocs(extrasRef);
      
      if (querySnapshot.empty) {
        setReusableExtras([]);
        return;
      }

      const fetchedExtras = querySnapshot.docs.map(doc => {
        const data = doc.data() as ReusableExtraGroup;
        return transformToCustomizationGroup({ ...data, id: doc.id });
      });
      
      setReusableExtras(fetchedExtras);
    } catch (error) {
      const fbError = error as FirebaseError;
      if (fbError.code !== 'permission-denied') {
        toast.error("Failed to load reusable extras.");
      }
      setReusableExtras([]);
    } finally {
      setLoadingExtras(false);
    }
  }, [restaurantId]);

  const addReusableExtraGroup = useCallback(async (groupData: Omit<ReusableExtraGroup, 'id'>) => {
    if (!restaurantId) {
      toast.error("Restaurant ID is missing.");
      return null;
    }
    setLoadingExtras(true);
    try {
      const extrasRef = collection(db, "restaurants", restaurantId, "reusableExtraGroups");
      
      // Ensure required field is explicitly set
      const addData = {
        ...groupData,
        required: groupData.required ?? false
      };
      
      const docRef = await addDoc(extrasRef, addData);
      const newGroup = transformToCustomizationGroup({ ...addData, id: docRef.id });
      setReusableExtras(prev => [...prev, newGroup]);
      toast.success("Reusable extra group added successfully.");
      return docRef.id;
    } catch (error) {
      toast.error("Failed to add reusable extra group.");
      return null;
    } finally {
      setLoadingExtras(false);
    }
  }, [restaurantId]);

  const updateReusableExtraGroup = useCallback(async (groupId: string, groupData: Partial<Omit<ReusableExtraGroup, 'id'>>) => {
    if (!restaurantId) {
      toast.error("Restaurant ID is missing.");
      return;
    }
    setLoadingExtras(true);
    try {
      const groupRef = doc(db, "restaurants", restaurantId, "reusableExtraGroups", groupId);
      
      // Ensure required field is explicitly set
      const updateData = {
        ...groupData,
        required: groupData.required ?? false
      };
      
      await updateDoc(groupRef, updateData);
      setReusableExtras(prev => prev.map(g => g.id === groupId ? transformToCustomizationGroup({ ...g, ...updateData, id: groupId }) : g));
      toast.success("Reusable extra group updated successfully.");
    } catch (error) {
      toast.error("Failed to update reusable extra group.");
    } finally {
      setLoadingExtras(false);
    }
  }, [restaurantId]);

  const deleteReusableExtraGroup = useCallback(async (groupId: string) => {
    if (!restaurantId) {
      toast.error("Restaurant ID is missing.");
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: "Delete Reusable Extra Group",
      message: `Are you sure you want to delete this reusable extra group? This action cannot be undone and might affect items using it.`,
      onConfirm: async () => {
        setLoadingExtras(true);
        try {
          const groupRef = doc(db, "restaurants", restaurantId, "reusableExtraGroups", groupId);
          await deleteDoc(groupRef);
          setReusableExtras(prev => prev.filter(g => g.id !== groupId));
          toast.success("Reusable extra group deleted successfully.");
        } catch (error) {
          toast.error("Failed to delete reusable extra group.");
        } finally {
          setLoadingExtras(false);
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      },
    });
  }, [restaurantId, setConfirmDialog]);

  useEffect(() => {
    fetchReusableExtras();
  }, [fetchReusableExtras]);

  return {
    reusableExtras,
    loadingExtras,
    addReusableExtraGroup,
    updateReusableExtraGroup,
    deleteReusableExtraGroup,
  };
}; 