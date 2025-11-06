
import { useState, useEffect } from 'react';

interface Location {
  latitude: number;
  longitude: number;
}

interface GeolocationState {
  location: Location | null;
  error: string | null;
  loading: boolean;
}

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState({
        location: null,
        error: "Geolocation is not supported by your browser.",
        loading: false,
      });
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      setState({
        location: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        },
        error: null,
        loading: false,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      setState({
        location: null,
        error: error.message,
        loading: false,
      });
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError);
  }, []);

  return state;
};
