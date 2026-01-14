import React, { useState, useEffect, useCallback } from "react";
import { Text, View, StyleSheet, Button, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Camera, CameraView } from "expo-camera";
import { router, useFocusEffect } from "expo-router";
import { store } from "@/services/storage";
import { credentialService, Credential } from "@/services/credentials";
import { Ban } from "lucide-react-native";
import { Controller } from "@/services/db/controllers";

export default function Security() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [controller, setController] = useState<Controller | null>(null)

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      // Reload controller when screen comes into focus to get updated gate
      const loadController = async () => {
        const controller = await store.getController();
        setController(controller);
      };
      loadController();

      return () => {
        setScanned(true);
      };
    }, []),
  );

  useEffect(() => {
    const init = async () => {
      setController(await store.getController())
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
    };

    init();
  }, []);

  async function handleBarcodeScanned({ data }: { data: any }) {
    setScanned(true);
    try {
      console.log("data: ", data)
      const preCredential: { id: string } = JSON.parse(data);
      const credential: Credential = new Credential(parseInt(preCredential.id));

      const controller = await store.getController();
      if (controller) {
        router.push({
          pathname: "/credential",
          params: {
            credential: Credential.toBase64(credential),
          },
        });
      } else {
        //TODO: Handle error
        throw new Error()
      }
    } catch (error) {
      console.error(error)
      router.push("/credential/invalid")
    }
  }

  if (hasPermission === null) {
    return <ActivityIndicator size="large" />
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 justify-center items-center gap-8 bg-black">
        <Ban size={64} color={'white'} />
        <Text className="text-2xl text-white">No hay acceso a la cámara</Text>
        <Text className="w-min text-xl text-white text-center">Otorgue permisos a la aplicación para poder escanear</Text>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 flex-col" edges={['top']}>
      {controller && <View className="h-fit w-full bg-black text-center px-4 py-3">
        <Text className="w-full text-center text-white text-2xl">{controller?.name} {controller?.lastname}</Text>
        <Text className="w-full text-center text-white text-2xl">Puerta {controller?.gate}</Text>
      </View>}
      <View className="flex-1">
        <CameraView
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ["qr", "pdf417"],
          }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>
    </SafeAreaView>
  );
}
