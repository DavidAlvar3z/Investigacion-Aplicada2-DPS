import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  Animated,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { Easing } from 'react-native-reanimated';

const departamentos = [
  { nombre: 'Ahuachapán', lat: 13.9211, lng: -89.8456 },
  { nombre: 'Santa Ana', lat: 13.9946, lng: -89.5597 },
  { nombre: 'Sonsonate', lat: 13.7188, lng: -89.7222 },
  { nombre: 'Chalatenango', lat: 14.0333, lng: -88.9333 },
  { nombre: 'La Libertad', lat: 13.4946, lng: -89.3228 },
  { nombre: 'San Salvador', lat: 13.6929, lng: -89.2182 },
  { nombre: 'Cuscatlán', lat: 13.8333, lng: -89.05 },
  { nombre: 'La Paz', lat: 13.5167, lng: -88.9833 },
  { nombre: 'Cabañas', lat: 13.8833, lng: -88.75 },
  { nombre: 'San Vicente', lat: 13.6333, lng: -88.7833 },
  { nombre: 'Usulután', lat: 13.35, lng: -88.45 },
  { nombre: 'San Miguel', lat: 13.4833, lng: -88.1833 },
  { nombre: 'Morazán', lat: 13.7667, lng: -88.1 },
  { nombre: 'La Unión', lat: 13.3333, lng: -87.8333 },
];

const API_KEY = '56737f69a08045dbb9122801252304';

export default function ARMapView() {
  const [locStatus, setLocStatus] = useState('❌ Solicitar permiso');
  const [connStatus, setConnStatus] = useState('Desconectado');
  const [modalCurrent, setModalCurrent] = useState(false);
  const [infoCurrent, setInfoCurrent] = useState({});
  const [forecast, setForecast] = useState([]);
  const [region, setRegion] = useState({
    latitude: 13.7,
    longitude: -89.2,
    latitudeDelta: 1.5,
    longitudeDelta: 1.5,
  });
  const [query, setQuery] = useState('');
  const [mapType, setMapType] = useState('standard');
  const modalOpacity = new Animated.Value(0);

  useEffect(() => {
    (async () => {
      const net = await Location.getProviderStatusAsync();
      setConnStatus(net.gpsAvailable ? 'Conectado' : 'Sin conexión');
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocStatus(status === 'granted' ? '✅ Activo' : '❌ Denegado');
    })();
  }, []);

  useEffect(() => {
    if (modalCurrent) {
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.ease,
        useNativeDriver: true,
      }).start();
    }
  }, [modalCurrent]);

  const getModalColor = (cond) => {
    if (!cond) return '#fff';
    cond = cond.toLowerCase();
    if (cond.includes('lluv') || cond.includes('chaparrón')) return 'rgba(135,206,250,0.8)';
    if (cond.includes('llovizna')) return 'rgba(176,196,222,0.8)';
    if (cond.includes('nubl') || cond.includes('nube')) return 'rgba(211,211,211,0.8)';
    if (cond.includes('sol') || cond.includes('despejado')) return 'rgba(255,223,0,0.8)';
    if (cond.includes('niebla') || cond.includes('bruma')) return 'rgba(220,220,220,0.8)';
    return '#fff';
  };

  const showWeather = async (location) => {
    let qParam;
    if (typeof location === 'string') {
      qParam = location;
    } else {
      qParam = `${location.lat},${location.lng}`;
      setRegion({ latitude: location.lat, longitude: location.lng, latitudeDelta: 0.5, longitudeDelta: 0.5 });
    }
    try {
      const { data: cur } = await axios.get(
        `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${qParam}&lang=es`
      );
      const { data: fc } = await axios.get(
        `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=${qParam}&lang=es&days=3`
      );
      setInfoCurrent({
        location: typeof location === 'string' ? location : location.nombre,
        temp: cur.current.temp_c,
        cond: cur.current.condition.text,
        wind: cur.current.wind_kph,
        icon: 'https:' + cur.current.condition.icon,
      });
      setForecast(
        fc.forecast.forecastday.map((day) => ({
          date: day.date,
          max: day.day.maxtemp_c,
          min: day.day.mintemp_c,
          icon: 'https:' + day.day.condition.icon,
        }))
      );
      setModalCurrent(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      {modalCurrent ? (
        <Modal visible={modalCurrent} transparent animationType="fade">
          <Animated.View style={[styles.overlay, { opacity: modalOpacity }]}>
            <View style={[styles.modal, { backgroundColor: getModalColor(infoCurrent.cond) }]}>
              <TouchableOpacity
                onPress={() => setModalCurrent(false)}
                style={styles.btnClose}
              >
                <Feather name="x-circle" size={25} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{infoCurrent.location}</Text>
              <Image source={{ uri: infoCurrent.icon }} style={styles.icon} />
              <View style={styles.modalRow}>
                <Feather name="sun" size={20} color="#f39c12" />
                <Text style={styles.modalText}> {infoCurrent.temp}°C</Text>
              </View>
              <View style={styles.modalRow}>
                <Feather name="wind" size={20} color="#3498db" />
                <Text style={styles.modalText}> {infoCurrent.wind} km/h</Text>
              </View>
              <View style={styles.modalRow}>
                <Feather name="cloud-rain" size={20} color="#7f8c8d" />
                <Text style={styles.modalText}> {infoCurrent.cond}</Text>
              </View>
              <View style={styles.forecastRow}>
                {forecast.map((f, i) => (
                  <View key={i} style={styles.dayBox}>
                    <Text style={styles.dayText}>{`${f.date.split('-')[2]}/${f.date.split('-')[1]}`}</Text>
                    <Image source={{ uri: f.icon }} style={styles.smallIcon} />
                    <Text style={styles.dayText}>{`${f.min}°/${f.max}°`}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        </Modal>
      ) : (
        <>
          <View style={styles.topBar}>
            <View style={styles.statusRow}>
              <Feather name="compass" size={18} color="#4a90e2" />
              <Text style={styles.statusText}>GPS: {locStatus}</Text>
            </View>
            <View style={styles.statusRow}>
              <Feather name="sun" size={18} color="#e25822" />
              <Text style={styles.statusText}>Temp actual: {infoCurrent.temp ?? '--'}°C</Text>
            </View>
            <View style={styles.statusRow}>
              <Feather name="wifi" size={18} color="#4a90e2" />
              <Text style={styles.statusText}>Conexión: {connStatus}</Text>
            </View>
            <Text style={styles.pickerLabel}>Seleccionar vista de mapa:</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={mapType}
                onValueChange={setMapType}
                style={styles.picker}
                itemStyle={styles.pickerItem}
                dropdownIconColor="#4a90e2"
              >
                <Picker.Item label="Estándar" value="standard" />
                <Picker.Item label="Satélite" value="satellite" />
                <Picker.Item label="Terreno" value="terrain" />
              </Picker>
            </View>
          </View>

          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            mapType={mapType}
            showsUserLocation
            showsMyLocationButton
          >
            {departamentos.map((dep, i) => (
              <Marker
                key={i}
                coordinate={{ latitude: dep.lat, longitude: dep.lng }}
                title={dep.nombre}
                onPress={() => showWeather(dep)}
              >
                <MaterialCommunityIcons name="map-marker-radius" size={32} color="#e63946" />
              </Marker>
            ))}
          </MapView>

          <View style={styles.searchBar}>
            <TextInput
              placeholder="Buscar ciudad o departamento"
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
            />
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => showWeather(query)}
            >
              <Feather name="search" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  topBar: {
    position: 'absolute',
    top: 30,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(255,255,255,0.95)',
    padding: 14,
    borderRadius: 18,
    elevation: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  statusText: { marginLeft: 8, color: '#333', fontSize: 14 },
  pickerLabel: { marginTop: 8, fontSize: 14, color: '#333' },
  pickerContainer: {
    marginTop: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 8, 
  },
  picker: { height: 50, color: '#000' },  
  pickerItem: { color: '#000', fontSize: 16 }, 
  searchBar: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    padding: 10,
    elevation: 6,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15 },
  searchButton: {
    backgroundColor: '#4a90e2',
    padding: 12,
    borderRadius: 25,
    marginLeft: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    borderRadius: 22,
    padding: 22,
    width: '82%',
    alignItems: 'center',
    elevation: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 12, color: '#333' },
  icon: { width: 60, height: 60, marginBottom: 10 },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  modalText: { fontSize: 16, color: '#333' },
  forecastRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginVertical: 12,
  },
  dayBox: {
    alignItems: 'center',
  },
  dayText: { fontSize: 14, color: '#333' },
  smallIcon: { width: 28, height: 28 },
  btnClose: {
    position: 'absolute',
    top: 10,  
    right: 10,   
    backgroundColor: '#e63946',
    padding: 12,
    borderRadius: 25,
    zIndex: 999,  
  },
}); 
