import { ref, onMounted, watch } from 'vue';

export function useSplitterPosition(defaultPosition: number = 50) {
  const STORAGE_KEY = 'splitter-position';
  const position = ref(defaultPosition);

  // Load position from localStorage on mount
  onMounted(() => {
    try {
      const savedPosition = localStorage.getItem(STORAGE_KEY);
      if (savedPosition !== null) {
        position.value = Number(savedPosition);
      }
    } catch (error) {
      console.error('Failed to load splitter position from localStorage:', error);
    }
  });

  // Save position to localStorage when it changes
  watch(position, (newPosition) => {
    try {
      localStorage.setItem(STORAGE_KEY, String(newPosition));
    } catch (error) {
      console.error('Failed to save splitter position to localStorage:', error);
    }
  });

  return {
    position,
  };
}
