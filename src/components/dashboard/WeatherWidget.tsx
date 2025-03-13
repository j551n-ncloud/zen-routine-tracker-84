
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Search } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { toast } from "sonner";

const WeatherWidget: React.FC = () => {
  const [cityName, setCityName] = useState("");
  const [savedCity, setSavedCity] = useLocalStorage("weather-city", "");
  const [weatherData, setWeatherData] = useLocalStorage("weather-data", null);
  const [loading, setLoading] = useState(false);

  const fetchWeather = async (city: string) => {
    if (!city.trim()) {
      toast.error("Please enter a city name");
      return;
    }

    setLoading(true);
    try {
      const apiKey = "4a6b5fdf2365f93dd7293f8477b71e2a"; // This is a free API key for demo purposes
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
      );
      
      if (!response.ok) {
        throw new Error("City not found");
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

  React.useEffect(() => {
    if (savedCity && !weatherData) {
      fetchWeather(savedCity);
    }
  }, [savedCity, weatherData]);

  return (
    <Card className="shadow-subtle">
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
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{weatherData.name}</h3>
              <p className="text-sm text-muted-foreground">
                {weatherData.weather[0].description}
              </p>
              <p className="text-2xl font-bold mt-1">
                {Math.round(weatherData.main.temp)}°C
              </p>
              <p className="text-xs text-muted-foreground">
                Feels like {Math.round(weatherData.main.feels_like)}°C
              </p>
            </div>
            <div className="text-primary">
              {getWeatherIcon(weatherData.weather[0].id)}
            </div>
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
