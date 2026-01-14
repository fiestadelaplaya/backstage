import React, { useEffect, useState } from "react";
import { Dropdown } from 'react-native-element-dropdown';
import { router } from "expo-router";
import { Check } from "lucide-react-native";
import { View, Text, ActivityIndicator, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ErrorModal from "@/components/error";
import { Controller, Gate } from "@/services/db/controllers";
import { store } from "@/services/storage";
import { gateDb } from "@/services/db/gate";

export default function GateScreen() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [controller, setController] = useState<Controller | null>(null)
  const [selectedGate, setSelectedGate] = useState<Gate | null>(null)
  const [confirming, setConfirming] = useState(false)

  const gateData = Object.values(Gate).map(gate => ({
    label: gate,
    value: gate,
  }))

  useEffect(() => {
    const init = async () => {
      setError(null)
      const controller = await store.getController()
      setController(controller)
      if (controller) {
        setSelectedGate(controller.gate)
      }
    }

    init()
      .catch(e => setError(e.stack))
      .finally(() => setLoading(false))
  }, [])

  async function handleConfirm() {
    if (!controller || !selectedGate) {
      return
    }

    setConfirming(true)
    setError(null)

    try {
      await gateDb.changeGate(controller, selectedGate)
      // Update controller in storage with new gate
      const updatedController = { ...controller, gate: selectedGate }
      await store.setController(updatedController)
      setController(updatedController)
      // Navigate back or show success
      router.back()
    } catch (e: any) {
      setError(e.stack || e.message || "Error al cambiar la puerta")
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (error) {
    return (
      <View className="flex flex-col h-full w-full items-center justify-center p-4 bg-black">
        <ErrorModal stacktrace={error} />
      </View>
    )
  }


  return (
    <SafeAreaView className="flex-1 flex-col items-center">
      <View className="w-full h-full flex flex-col items-center justify-center p-4">
        <View style={{ elevation: 1 }} className="bg-white rounded-xl p-8 w-4/5 flex flex-col items-center justify-center gap-4">
          <Text className="w-full text-center text-2xl">Cambio de puerta</Text>
          <View className="w-full">
            <Dropdown
              data={gateData}
              labelField="label"
              valueField="value"
              placeholder="Seleccione una puerta"
              value={selectedGate}
              onChange={(item) => setSelectedGate(item.value)}
              style={styles.dropdown}
              selectedTextStyle={styles.selectedTextStyle}
              placeholderStyle={styles.placeholderStyle}
            />
          </View>
          <Pressable
            onPress={handleConfirm}
            disabled={!selectedGate || confirming || selectedGate === controller?.gate}
            className={`w-full p-4 rounded-xl flex flex-row items-center justify-center ${
              !selectedGate || confirming || selectedGate === controller?.gate
                ? "bg-gray-300"
                : "bg-blue-500"
            }`}
          >
            {confirming ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Check size={20} color="white" />
                <Text className="text-white text-lg ml-2">Confirmar</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
      {error && <ErrorModal stacktrace={error} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    height: 50,
    borderColor: '#9CA3AF',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
  },
  selectedTextStyle: {
    fontSize: 16,
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
});
