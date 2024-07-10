import { useState } from "react";
import { View, Text, Image, Keyboard } from "react-native";
import {
  MapPin,
  Calendar as IconCalendar,
  Settings2,
  UserRoundPlus,
  ArrowRight,
} from "lucide-react-native";
import { DateData } from "react-native-calendars";

import { colors } from "@/styles/colors";
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils";

import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { Calendar } from "@/components/calendar";
import dayjs from "dayjs";

enum StepForm {
  TRIP_DETAILS = 1,
  ADD_EMAIL = 2,
}

enum MODAL {
  NONE = 0,
  CALENDAR = 1,
  GUESTS = 2,
}

export default function Index() {
  //DATA
  const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS);
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected);
  const [destination, setDestination] = useState();
  const [btnState, setBtnState] = useState(false);

  //MODAL
  const [showModal, setShowModal] = useState(MODAL.NONE);

  function handleNextStepForm() {
    if (stepForm === StepForm.TRIP_DETAILS)
      return setStepForm(StepForm.ADD_EMAIL);
  }

  function handleSelectDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay,
    });

    setSelectedDates(dates);
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
            value={selectedDates.formatDatesInText}
            editable={stepForm === StepForm.TRIP_DETAILS}
            onFocus={() => Keyboard.dismiss()}
            showSoftInputOnFocus={false}
            onPressIn={() =>
              stepForm === StepForm.TRIP_DETAILS && setShowModal(MODAL.CALENDAR)
            }
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

      <Modal
        title="Select dates"
        subtitle="Select a departure and return date"
        visible={showModal === MODAL.CALENDAR}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="gap-4 mt-4">
          <Calendar
            minDate={dayjs().toISOString()}
            onDayPress={handleSelectDate}
            markedDates={selectedDates.dates}
          />

          <Button onPress={() => setShowModal(MODAL.NONE)}>
            <Button.Title>Confirm</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  );
}
