import { Platform } from "react-native";
import Constants from "expo-constants";

import { Aula } from "@/src/types/agenda";
import { formatTime } from "@/src/utils/dateUtils";
import { getAulasHoje } from "./agendaService";

let Notifications: typeof import("expo-notifications") | null = null;
let notificationHandlerConfigured = false;

async function getNotifications() {
  if (!Notifications) {
    Notifications = await import("expo-notifications");
  }

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldPlaySound: false,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return Notifications;
}

function isExpoGo() {
  return Constants.appOwnership === "expo";
}

export async function configureLocalNotifications() {
  if (Platform.OS === "web" || isExpoGo()) return false;

  try {
    const Notifications = await getNotifications();
    const current = await Notifications.getPermissionsAsync();
    const finalStatus =
      current.status === "granted" ? current.status : (await Notifications.requestPermissionsAsync()).status;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("aulas-professor", {
        name: "Aulas do professor",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    return finalStatus === "granted";
  } catch {
    return false;
  }
}

export function buildAulaNotificationBody(aulas: Aula[]) {
  return aulas
    .map((aula) => {
      const local = aula.local?.nome || aula.local_nome || "local a confirmar";
      return `${aula.nome} - ${formatTime(aula.horario_inicio)} em ${local}`;
    })
    .join("\n");
}

export async function notifyAulasHoje() {
  const permitido = await configureLocalNotifications();
  if (!permitido) return;

  const aulas = await getAulasHoje();
  if (aulas.length === 0) return;

  const Notifications = await getNotifications();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: aulas.length === 1 ? "Você tem 1 aula hoje" : `Você tem ${aulas.length} aulas hoje`,
      body: buildAulaNotificationBody(aulas),
      data: { tipo: "AULAS_HOJE" },
    },
    trigger: null,
  });
}

export async function registerForPushNotificationsLater() {
  if (Platform.OS === "web" || isExpoGo()) {
    return null;
  }

  const Notifications = await getNotifications();
  const { data } = await Notifications.getExpoPushTokenAsync();
  return data;
}
