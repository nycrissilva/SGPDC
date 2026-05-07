import { StyleProp, ViewStyle } from "react-native";
import MapView, { Marker } from "react-native-maps";

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
  return (
    <MapView
      initialRegion={{
        ...coordinates,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
      style={style}
    >
      <Marker coordinate={coordinates} description={description} title={title} />
    </MapView>
  );
}
