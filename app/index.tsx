// app/index.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  Alert,
  Platform,
} from "react-native";
import * as Location from "expo-location";

// CONFIGURAÇÃO: URL do webhook n8n
const WEBHOOK_URL = "https://pinier-unshorn-arlena.ngrok-free.dev/webhook/rastreion8n";

// Parâmetros de decisão de movimento
const SPEED_MOVING_THRESHOLD_MS = 0.5; // m/s, acima disso considera "ANDANDO"
const DISTANCE_MOVING_THRESHOLD_M = 10; // metros, deslocamento mínimo para "ANDANDO"
const MIN_UPDATE_INTERVAL_MS = 5000; // intervalo mínimo entre envios = 1 min

type LatLng = { latitude: number; longitude: number };


// Haversine para distância em metros
function distanceMeters(a: LatLng, b: LatLng): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000; // raio da Terra em metros
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);

  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}
F
export default function Index() {
  const [placa, setPlaca] = useState<string>("");
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [statusMov, setStatusMov] = useState<"PARADO" | "ANDANDO">("PARADO");
  const [lastSentAt, setLastSentAt] = useState<Date | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );

  const lastLocationRef = useRef<Location.LocationObject | null>(null);
  const lastWebhookTsRef = useRef<number>(0);
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    return () => {
      // cleanup ao desmontar
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
        subscriptionRef.current = null;
      }
    };
  }, []);

  const requestPermissions = async (): Promise<boolean> => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Permita acesso à localização para iniciar o rastreamento."
      );
      return false;
    }
    if (Platform.OS === "android") {
      // melhora a precisão quando disponível
      try {
        await Location.enableNetworkProviderAsync();
      } catch {
        // silencioso
      }
    }
    return true;
  };

  const startTracking = async (): Promise<void> => {
    if (!placa || placa.trim().length < 7) {
      Alert.alert("Placa inválida", "Informe a placa completa do veículo.");
      return;
    }
    const ok = await requestPermissions();
    if (!ok) return;

    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000, // tentar obter posição a cada ~5s
        distanceInterval: 5, // ou quando mover ~5m
        mayShowUserSettingsDialog: true,
      },
      (loc: Location.LocationObject) => {
        setLocation(loc);
        const coords = loc.coords;

        const prevCoords = lastLocationRef.current?.coords;
        const speedVal = coords.speed ?? 0; // speed pode ser null
        const hasSpeed = coords.speed !== null && !Number.isNaN(speedVal);

        let moving = false;
        if (hasSpeed) {
          moving = speedVal > SPEED_MOVING_THRESHOLD_MS;
        } else if (prevCoords) {
          const dist = distanceMeters(
            { latitude: prevCoords.latitude, longitude: prevCoords.longitude },
            { latitude: coords.latitude, longitude: coords.longitude }
          );
          moving = dist >= DISTANCE_MOVING_THRESHOLD_M;
        }

        setStatusMov(moving ? "ANDANDO" : "PARADO");
        lastLocationRef.current = loc;

        const now = Date.now();
        if (now - lastWebhookTsRef.current >= MIN_UPDATE_INTERVAL_MS) {
          void sendWebhook(
            placa.trim().toUpperCase(),
            moving ? "ANDANDO" : "PARADO",
            coords
          );
          lastWebhookTsRef.current = now;
          setLastSentAt(new Date(now));
        }
      }
    );

    subscriptionRef.current = sub;
    setIsTracking(true);
  };

  const stopTracking = (): void => {
    if (subscriptionRef.current) {
      subscriptionRef.current.remove();
      subscriptionRef.current = null;
    }
    setIsTracking(false);
  };

  const sendWebhook = async (
    placaValue: string,
    statusValue: "PARADO" | "ANDANDO",
    coords: Location.LocationObjectCoords
  ): Promise<void> => {
    const ts = new Date();
    const hh = String(ts.getHours()).padStart(2, "0");
    const mm = String(ts.getMinutes()).padStart(2, "0");
    const ss = String(ts.getSeconds()).padStart(2, "0");

    const payload = {
      status: statusValue, // "PARADO" | "ANDANDO"
      veiculo: placaValue, // placa
      coordenadas: {
        lat: coords.latitude,
        long: coords.longitude,
        precisao: coords.accuracy ?? null, // metros
      },
      ultimo_envio: `${hh}:${mm}:${ss}`, // hora local hh:mm:ss
    };

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.warn("Falha no webhook:", res.status, text);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("Erro ao enviar webhook:", msg);
    }
  };

  const formatLastSent = (date: Date | null): string => {
    if (!date) return "—";
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    const ss = String(date.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rastreamento de motorista</Text>

      <Text style={styles.label}>Placa do veículo</Text>
      <TextInput
        style={styles.input}
        value={placa}
        onChangeText={setPlaca}
        placeholder="ABC-1234"
        autoCapitalize="characters"
        // maxLength={8}
      />

      <View style={styles.row}>
        <Button
          title={isTracking ? "Parar Rastreamento" : "Iniciar Rastreamento"}
          onPress={isTracking ? stopTracking : startTracking}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status</Text>
        <Text style={styles.cardText}>Status de movimento: {statusMov}</Text>
        {location && (
          <>
            <Text style={styles.cardText}>
              Coordenadas: {location.coords.latitude.toFixed(6)},{" "}
              {location.coords.longitude.toFixed(6)}
            </Text>
            <Text style={styles.cardText}>
              Precisão:{" "}
              {location.coords.accuracy
                ? `${Math.round(location.coords.accuracy)} m`
                : "N/A"}
            </Text>
          </>
        )}
        <Text style={styles.cardText}>
          Último envio: {formatLastSent(lastSentAt)}
        </Text>
      </View>

      <Text style={styles.footer}>Rodando no Expo em primeiro plano.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, paddingTop: 48, backgroundColor: "#fff" },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 16 },
  label: { fontSize: 14, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 12,
  },
  row: { flexDirection: "row", gap: 12, marginBottom: 16 },
  card: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
    backgroundColor: "#fafafa",
  },
  cardTitle: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  cardText: { fontSize: 14, marginBottom: 6 },
  footer: { marginTop: 16, fontSize: 12, color: "#666" },
});
