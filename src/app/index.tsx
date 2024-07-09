import { View, Text, Image } from "react-native";
import {
  MapPin,
  Calendar as IconCalendar,
  Settings2,
  UserRoundPlus,
  ArrowRight,
} from "lucide-react-native";

import { Input } from "@/components/input";
import { colors } from "@/styles/colors";
import { Button } from "@/components/button";
import { useState } from "react";

enum StepForm {
  TRIP_DETAILS = 1,
  ADD_EMAIL = 2,
}

export default function Index() {
  const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS);

  function handleNextStepForm() {
    if (stepForm === StepForm.TRIP_DETAILS)
      return setStepForm(StepForm.ADD_EMAIL);
  }

  return (
    <View className="flex-1 items-center justify-center px-5">
      <Image
        source={require("@/assets/logo.png")}
        className="h-8"
        resizeMode="contain"
      />
      <Image source={require("@/assets/bg.png")} className="absolute" />
      <Text className="text-zinc-400 text-center mt-3 font-regular text-lg">
        Invite your friends and plan you{"\n"}next trip
      </Text>
      <View className="w-full bg-zinc-900 pb-4 px-4 rounded-xl my-8 border border-zinc-800">
        <Input>
          <MapPin color={colors.zinc[400]} size={20} />
          <Input.Field
            placeholder="Where?"
            editable={stepForm === StepForm.TRIP_DETAILS}
          />
        </Input>
        <Input>
          <IconCalendar color={colors.zinc[400]} size={20} />
          <Input.Field
            placeholder="When?"
            editable={stepForm === StepForm.TRIP_DETAILS}
          />
        </Input>
        {stepForm === StepForm.ADD_EMAIL && (
          <>
            <View className="border-b py-3 border-zinc-800">
              <Button
                variant="secondary"
                onPress={() => setStepForm(StepForm.TRIP_DETAILS)}
              >
                <Button.Title>Change location/date</Button.Title>
                <Settings2 size={20} color={colors.zinc[200]} />
              </Button>
            </View>

            <Input>
              <UserRoundPlus color={colors.zinc[400]} size={20} />
              <Input.Field placeholder="Who will be on the trip?" />
            </Input>
          </>
        )}

        <Button onPress={handleNextStepForm}>
          <Button.Title>
            {stepForm === StepForm.TRIP_DETAILS ? "Continue" : "Confirm Trip"}
          </Button.Title>
          <ArrowRight size={20} color={colors.lime[950]} />
        </Button>
      </View>

      <Text className="text-zinc-500 font-regular text-center text-base">
        When planning your trip through plann.er you automatically agree to our{" "}
        <Text className="text-zinc-300 underline">
          terms of use and privacy policies.
        </Text>
      </Text>
    </View>
  );
}
