import { Credential, credentialService } from "@/services/credentials";
import { Controller } from "@/services/db/controllers";
import { Role, User, UserState, userDb } from "@/services/db/users";
import { store } from "@/services/storage";
import { useLocalSearchParams } from "expo-router";
import { Image } from "expo-image"
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import Access from "@/components/access";
import ErrorModal from "@/components/error";
import { access } from "@/services/access";

export default function ScannedUserPage() {
  const { credential: encodedCredential }: { credential: string } =
    useLocalSearchParams();
  const credential = Credential.fromBase64(encodedCredential);

  const [state, setState] = useState<{ user: User, controller: Controller, canAccess: boolean } | null>(null)
  const [roleClassName, setRoleClassName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [spectator, setSpectator] = useState(false)

  useEffect(() => {
    const init = async () => {
      setError(null)
      const controller = await store.getController();
      const user = await userDb.getUser(credential.id);
      if (controller && user) {
        const canAccess = access(user, controller.gate)
        if (!controller.gate) {
          setSpectator(true)
        }
        setState({
          user,
          controller,
          canAccess
        })
        switch (user.role) {
          case Role.A:
            setRoleClassName('bg-green-400')
            break
          case Role.B:
            setRoleClassName('bg-orange-400')
            break
          case Role.C:
            setRoleClassName('bg-lime-400')
            break
          case Role.D:
            setRoleClassName('bg-purple-400')
            break
          case Role.E:
            setRoleClassName('bg-rose-400')
            break
          case Role.P:
            setRoleClassName('bg-blue-400')
            break
          case Role.X:
            setRoleClassName('text-white bg-black')
            break
        }
      }
    };

    init()
      .catch(e => {
        setError(e.stack)
      })
      .finally(() => setLoading(false))
  }, []);

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

  if (state) {
    return (
      <View className="flex-1 justify-evenly items-center gap-8 py-24 px-8 w-full">
        <View className="bg-white flex-2 items-center h-fit w-full gap-2 pt-8 rounded-xl overflow-hidden min-w-4/5" style={{ elevation: 1 }}>
          {state.user.group &&
            <Text>
              {state.user.group}
            </Text>
          }
          <Text className="text-4xl font-black">
            {state.user.name} {state.user.lastname}
          </Text>
          <Text className="text-2xl">
            DNI: {state.user.dni}
          </Text>
          <View className={`w-full flex items-center gap-2 p-2 ${roleClassName}`}>
            <Text className={`text-3xl w-full text-center ${roleClassName}`}>Nivel de acceso</Text>
            <Text className={`h-22 w-full justify-self-stretch align-middle text-center text-4xl font-bold ${roleClassName}`}>
              {state.user.role}
            </Text>
          </View>
        </View>
        {!spectator &&
          <Access user={state.user} controller={state.controller} canAccess={state.canAccess} />
        }
      </View>
    );
  } else {
    return null
  }
}
