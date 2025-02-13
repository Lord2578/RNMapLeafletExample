import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { Button, Card, useTheme } from 'react-native-paper';

const LeafletMap = () => {
    const { colors } = useTheme();
    const [location, setLocation] = useState({
        latitude: 49.8397,
        longitude: 24.0297
    });
    const [isTracking, setIsTracking] = useState(false);
    const [route, setRoute] = useState<number[][]>([]);
    const [permissionGranted, setPermissionGranted] = useState(false);

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.warn('Дозвіл на доступ до локації відхилено');
                return;
            }
            setPermissionGranted(true);
            const { coords } = await Location.getCurrentPositionAsync();
            setLocation(coords);
        })();
    }, []);

    useEffect(() => {
        let subscription: Location.LocationSubscription | null = null;

        const startTracking = async () => {
            if (!permissionGranted || !isTracking) return;

            try {
                subscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.Balanced,
                        timeInterval: 5000,
                        distanceInterval: 20,
                    },
                    ({ coords }) => {
                        setLocation(coords);
                        setRoute(prev => {
                            const lastPoint = prev[prev.length - 1];
                            if (!lastPoint ||
                                lastPoint[0] !== coords.latitude ||
                                lastPoint[1] !== coords.longitude) {
                                return [...prev, [coords.latitude, coords.longitude]];
                            }
                            return prev;
                        });
                    }
                );
            } catch (error) {
                console.error('Помилка трекінгу:', error);
            }
        };

        startTracking();
        return () => subscription?.remove();
    }, [isTracking, permissionGranted]);

    const memoizedHtmlContent = useMemo(
        () => htmlContent(location.latitude, location.longitude, route),
        [location, route]
    );

    const toggleTracking = useCallback(() =>
            setIsTracking(prev => !prev),
        []);

    const resetRoute = useCallback(() =>
            setRoute([]),
        []);

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" />
            <View style={styles.container}>
                <WebView
                    originWhitelist={['*']}
                    source={{ html: memoizedHtmlContent }}
                    injectedJavaScript={route.length > 0 ? `
            if (window.polyline) {
              polyline.setLatLngs(${JSON.stringify(route)});
              map.fitBounds(polyline.getBounds());
            }
          ` : ''}
                    bounces={false}
                    scrollEnabled={false}
                />
                <Card style={[styles.buttonsCard, { backgroundColor: colors.surface }]}>
                    <Card.Actions>
                        <Button
                            mode="contained"
                            icon={isTracking ? "stop" : "play"}
                            onPress={toggleTracking}
                            style={styles.button}
                            labelStyle={styles.buttonLabel}
                            buttonColor={isTracking ? colors.error : colors.primary}
                        >
                            {isTracking ? "Зупинити" : "Почати"}
                        </Button>

                        <Button
                            mode="outlined"
                            icon="delete"
                            onPress={resetRoute}
                            style={styles.button}
                            labelStyle={styles.buttonLabel}
                            textColor={colors.error}
                        >
                            Скинути
                        </Button>
                    </Card.Actions>
                </Card>
            </View>
        </SafeAreaView>
    );
};

const htmlContent = (lat: number, lon: number, route: number[][]) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <style>
    #map { height: 90vh; width: 95vw; }
    #searchBox { width: 90%; padding: 8px; margin: 10px; font-size: 16px; }
  </style>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
  <input id="searchBox" type="text" placeholder="Введіть адресу і натисніть Enter..." />
  <div id="map"></div>

  <script>
    var map = L.map('map').setView([${lat}, ${lon}], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    var marker = L.marker([${lat}, ${lon}]).addTo(map)
      .bindPopup("Ваше місцезнаходження")
      .openPopup();

    var route = ${JSON.stringify(route)};
    var polyline = L.polyline(route, { color: 'blue' }).addTo(map);

    document.getElementById('searchBox').addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        var query = this.value;
        fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query))
          .then(response => response.json())
          .then(data => {
            if (data.length > 0) {
              var { lat, lon } = data[0];
              if (marker) map.removeLayer(marker);
              marker = L.marker([lat, lon]).addTo(map).bindPopup(query).openPopup();
              map.setView([lat, lon], 13);
            }
          });
      }
    });

    function onMapClick(e) {
      marker = L.marker(e.latlng).addTo(map) 
          .bindPopup("Ви натиснули на: " + e.latlng.toString())
          .openPopup();
    }

    map.on('click', onMapClick);
  </script>
</body>
</html>
`;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    buttonsCard: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        right: 16,
        borderRadius: 8,
    },
    button: {
        marginHorizontal: 8,
        borderRadius: 4,
    },
    buttonLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default LeafletMap;