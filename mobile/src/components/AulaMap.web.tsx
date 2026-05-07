import { Linking, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

type AulaMapProps = {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
  style?: StyleProp<ViewStyle>;
};

export default function AulaMap({ coordinates, description, style, title }: AulaMapProps) {
  const query = `${coordinates.latitude},${coordinates.longitude}`;

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      <Pressable onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`)}>
        <Text style={styles.link}>Abrir no Google Maps</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    backgroundColor: "#f4f0eb",
    justifyContent: "center",
    padding: 16,
  },
  title: {
    color: "#1f2933",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  description: {
    color: "#65717e",
    marginTop: 8,
    textAlign: "center",
  },
  link: {
    color: "#2f6f73",
    fontWeight: "900",
    marginTop: 12,
  },
});
