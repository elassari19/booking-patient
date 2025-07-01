import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '@/store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Additional hook for checking if Redux has been rehydrated
export const useIsRehydrated = () => {
  return useAppSelector((state) => state._persist?.rehydrated ?? false);
};
