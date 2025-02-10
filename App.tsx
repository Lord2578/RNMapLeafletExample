import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      #map { height: 95vh; width: 100vw; }
      #mapContainer { height: 500px; width: 100% }
    </style>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  </head>
  <body>
  <div id="mapContainer">
    <div id="map"></div>
  </div>
    
    <script>
      var map = L.map('map').setView([49.8397, 24.0297], 13); // Львів
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      
      
      var polygon1 = L.polygon([
        [49.8400, 24.0300],
        [49.8420, 24.0300],
        [49.8420, 24.0320],
        [49.8400, 24.0320]
      ]).addTo(map).bindPopup("Полігон 1 - район 1");

      var polygon2 = L.polygon([
        [49.8350, 24.0250],
        [49.8370, 24.0250],
        [49.8370, 24.0270],
        [49.8350, 24.0270]
      ]).addTo(map).bindPopup("Полігон 2 - район 2");

      var popup = L.popup();
      var marker;

      function onMapClick(e) {
          marker = L.marker(e.latlng).addTo(map) 
              .bindPopup("Ви натиснули на: " + e.latlng.toString())
              .openPopup();
          popup
              .setLatLng(e.latlng)
              .setContent("You clicked the map at " + e.latlng.toString())
              .openOn(map);
      }

      map.on('click', onMapClick);
    </script>
  </body>
  </html>
`;

const LeafletMap = () => {
  return (
    <>
    <StatusBar barStyle="light-content" />
    <View style={styles.container}>

        <WebView originWhitelist={['*']} source={{ html: htmlContent }} />

    </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    height: "96%",
    width: "100%",
    marginTop: 40
  },

});

export default LeafletMap;


