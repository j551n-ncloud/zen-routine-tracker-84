
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Sun, 
  Cloud, 
  CloudRain, 
  CloudSnow, 
  CloudLightning, 
  Wind, 
  Search,
  Droplets,
  Thermometer,
  Eye,
  Compass
} from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "sonner";
import { useTheme } from "@/providers/theme-provider";

interface WeatherData {
  lat: number;
  lon: number;
  timezone: string;
  current: {
    dt: number;
    sunrise: number;
    sunset: number;
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
    dew_point: number;
    uvi: number;
    clouds: number;
    visibility: number;
    wind_speed: number;
    wind_deg: number;
    wind_gust?: number;
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
  };
  daily?: Array<{
    dt: number;
    temp: {
      day: number;
      min: number;
      max: number;
    };
    weather: Array<{
      id: number;
      main: string;
      description: string;
      icon: string;
    }>;
  }>;
}

interface Coordinates {
  lat: number;
  lon: number;
}

const WeatherWidget: React.FC = () => {
  const [cityName, setCityName] = useState("");
  const [savedCity, setSavedCity] = useLocalStorage("weather-city", "");
  const [weatherData, setWeatherData] = useLocalStorage<WeatherData | null>("weather-data", null);
  const [coordinates, setCoordinates] = useLocalStorage<Coordinates | null>("weather-coordinates", null);
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const API_KEY = "b67a3c00fc5ca379a2e2f05afb9b866e";

  const getCoordinates = async (city: string): Promise<Coordinates | null> => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error("City not found");
      }
      
      const data = await response.json();
      if (data.length === 0) {
        throw new Error("City not found");
      }
      
      return {
        lat: data[0].lat,
        lon: data[0].lon
      };
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      return null;
    }
  };

  const fetchWeather = async (city: string) => {
    if (!city.trim()) {
      toast.error("Please enter a city name");
      return;
    }

    setLoading(true);
    try {
      // First get coordinates
      const coords = await getCoordinates(city);
      if (!coords) {
        throw new Error("Could not find coordinates for the city");
      }
      
      setCoordinates(coords);
      
      // Then fetch weather with OneCall API
      const response = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${coords.lat}&lon=${coords.lon}&exclude=minutely,hourly,alerts&units=metric&appid=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error("Weather data not available");
      }
      
      const data = await response.json();
      setWeatherData(data);
      setSavedCity(city);
      toast.success("Weather updated");
    } catch (error) {
      toast.error("Could not fetch weather data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (weatherId: number) => {
    if (weatherId >= 200 && weatherId < 300) return <CloudLightning className="h-8 w-8" />;
    if (weatherId >= 300 && weatherId < 600) return <CloudRain className="h-8 w-8" />;
    if (weatherId >= 600 && weatherId < 700) return <CloudSnow className="h-8 w-8" />;
    if (weatherId >= 700 && weatherId < 800) return <Wind className="h-8 w-8" />;
    if (weatherId === 800) return <Sun className="h-8 w-8" />;
    return <Cloud className="h-8 w-8" />;
  };

  // Fallback to legacy API if OneCall API doesn't work
  const fetchLegacyWeather = async (city: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error("City not found");
      }
      
      const data = await response.json();
      
      // Create a structure similar to OneCall API for compatibility
      const legacyData = {
        lat: data.coord.lat,
        lon: data.coord.lon,
        timezone: data.name,
        current: {
          dt: data.dt,
          sunrise: data.sys.sunrise,
          sunset: data.sys.sunset,
          temp: data.main.temp,
          feels_like: data.main.feels_like,
          pressure: data.main.pressure,
          humidity: data.main.humidity,
          dew_point: 0, // Not available in legacy API
          uvi: 0, // Not available in legacy API
          clouds: data.clouds.all,
          visibility: data.visibility,
          wind_speed: data.wind.speed,
          wind_deg: data.wind.deg,
          weather: data.weather
        }
      };
      
      setWeatherData(legacyData);
      setSavedCity(city);
      toast.success("Weather updated");
    } catch (error) {
      toast.error("Could not fetch weather data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (savedCity && !weatherData) {
      fetchWeather(savedCity);
    }
  }, [savedCity, weatherData]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card className={`shadow-subtle ${isDarkMode ? 'bg-card text-card-foreground' : ''}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Weather</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Enter city name"
            value={cityName}
            onChange={(e) => setCityName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                fetchWeather(cityName);
              }
            }}
          />
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => fetchWeather(cityName)}
            disabled={loading}
          >
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {weatherData ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">{savedCity}</h3>
                <p className="text-sm text-muted-foreground">
                  {weatherData.current.weather[0].description}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {Math.round(weatherData.current.temp)}°C
                </p>
                <p className="text-xs text-muted-foreground">
                  Feels like {Math.round(weatherData.current.feels_like)}°C
                </p>
              </div>
              <div className="text-primary">
                {getWeatherIcon(weatherData.current.weather[0].id)}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span>Humidity: {weatherData.current.humidity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Wind className="h-4 w-4 text-blue-500" />
                <span>Wind: {Math.round(weatherData.current.wind_speed)} m/s</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-500" />
                <span>Visibility: {(weatherData.current.visibility / 1000).toFixed(1)} km</span>
              </div>
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-blue-500" />
                <span>Pressure: {weatherData.current.pressure} hPa</span>
              </div>
            </div>
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <div>
                <span className="flex items-center gap-1">
                  <Sun className="h-3 w-3 text-yellow-500" />
                  Sunrise: {formatTime(weatherData.current.sunrise)}
                </span>
              </div>
              <div>
                <span className="flex items-center gap-1">
                  <Sun className="h-3 w-3 text-orange-500" />
                  Sunset: {formatTime(weatherData.current.sunset)}
                </span>
              </div>
            </div>
            
            {weatherData.daily && weatherData.daily.length > 0 && (
              <div className="border-t pt-2 mt-2">
                <h4 className="text-xs font-medium mb-2">Forecast</h4>
                <div className="flex justify-between">
                  {weatherData.daily.slice(1, 4).map((day) => (
                    <div key={day.dt} className="text-center">
                      <div className="text-xs">{new Date(day.dt * 1000).toLocaleDateString([], {weekday: 'short'})}</div>
                      <div className="my-1">{getWeatherIcon(day.weather[0].id)}</div>
                      <div className="text-xs">{Math.round(day.temp.max)}°</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>Enter a city to see the weather</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeatherWidget;
