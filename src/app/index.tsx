import { useEffect, useState } from "react";
import { View, Text, Image, Keyboard, Alert } from "react-native";
import {
  MapPin,
  Calendar as IconCalendar,
  Settings2,
  UserRoundPlus,
  ArrowRight,
  AtSign,
} from "lucide-react-native";
import { DateData } from "react-native-calendars";
import dayjs from "dayjs";

import { colors } from "@/styles/colors";
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils";
import { validateInput } from "@/utils/validateInput";
import { tripStorage } from "@/storage/trip";

import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Modal } from "@/components/modal";
import { Calendar } from "@/components/calendar";
import { GuestEmail } from "@/components/email";
import { router } from "expo-router";
import { tripServer } from "@/server/trip-server";
import Loading from "@/components/loading";

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
  //LOADING
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isGettingTrip, setIsGettingTrip] = useState(true);

  //DATA
  const [stepForm, setStepForm] = useState(StepForm.TRIP_DETAILS);
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected);
  const [destination, setDestination] = useState("");
  const [btnState, setBtnState] = useState(false);
  const [email, setEmail] = useState("");
  const [emails, setEmails] = useState<string[]>([]);

  //MODAL
  const [showModal, setShowModal] = useState(MODAL.NONE);

  function handleNextStepForm() {
    if (stepForm === StepForm.TRIP_DETAILS)
      return setStepForm(StepForm.ADD_EMAIL);

    Alert.alert("New trip", "Confirm trip?", [
      {
        text: "No",
        style: "cancel",
      },
      {
        text: "Yes",
        onPress: createTrip,
      },
    ]);
  }

  function handleSelectDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay,
    });

    setSelectedDates(dates);

    if (destination.trim().length < 4 || !dates.startsAt || !dates.endsAt)
      setBtnState(false);
    else setBtnState(true);
  }

  function changeDestination(e: string) {
    setDestination(e);

    if (e.trim().length < 4 || !selectedDates.startsAt || !selectedDates.endsAt)
      setBtnState(false);
    else setBtnState(true);
  }

  function handleRemoveEmail(emailRemove: string) {
    setEmails((prevState) =>
      prevState.filter((emailItem) => emailItem != emailRemove)
    );
  }

  function handleAddEmail() {
    if (!validateInput.email(email))
      return Alert.alert("Guest", "Invalid email!");

    if (emails.find((emailItem) => emailItem === email))
      return Alert.alert("Guest", "Email already exist!");

    setEmails((prevState) => [...prevState, email]);
  }

  async function saveTrip(id: string) {
    try {
      await tripStorage.save(id);
      router.navigate(`/trip/${id}`);
    } catch (e) {
      Alert.alert("Trip", "Device out of space");
      console.log(e);
    }
  }

  async function createTrip() {
    try {
      setIsCreatingTrip(true);
      const newTrip = await tripServer.create({
        destination,
        starts_at: dayjs(selectedDates.startsAt?.dateString).toString(),
        ends_at: dayjs(selectedDates.endsAt?.dateString).toString(),
        emails_to_invite: emails,
      });

      Alert.alert("New trip", "Trip booked successfully!", [
        { text: "Ok", onPress: () => saveTrip(newTrip) },
      ]);
    } catch (e) {
      console.log(e);
      setIsCreatingTrip(false);
    }
  }

  async function getTrip() {
    try {
      const tripId = await tripStorage.get();
      if (!tripId) return setIsGettingTrip(false);

      const trip = await tripServer.getByID(tripId);
      if (trip) return router.navigate(`/trip/${tripId}`);
    } catch (e) {
      setIsGettingTrip(false);
      console.log(e);
    }
  }

  useEffect(() => {
    getTrip();
  }, []);

  if (isGettingTrip) return <Loading />;

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
            value={destination}
            editable={stepForm === StepForm.TRIP_DETAILS}
            onChangeText={(e) => changeDestination(e.toString())}
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
              <Input.Field
                placeholder="Who will be on the trip?"
                autoCorrect={false}
                value={
                  emails.length > 0
                    ? `${emails.length} ${
                        emails.length === 1
                          ? "pessoa convidada"
                          : "pessoas convidadas"
                      }`
                    : ""
                }
                onFocus={() => Keyboard.dismiss()}
                showSoftInputOnFocus={false}
                onPressIn={() => setShowModal(MODAL.GUESTS)}
              />
            </Input>
          </>
        )}

        <Button
          onPress={handleNextStepForm}
          disabled={!btnState}
          isLoading={isCreatingTrip}
        >
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

      <Modal
        title="Select guests"
        subtitle="Guests will receive emails to confirm their participation in the trip"
        visible={showModal === MODAL.GUESTS}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="my-2 flex-wrap gap-2 border-b border-zinc-800 py-5 items-start">
          {emails.length > 0 ? (
            emails.map((emailItem) => (
              <GuestEmail
                key={emailItem}
                email={emailItem}
                onRemove={() => handleRemoveEmail(emailItem)}
              />
            ))
          ) : (
            <Text className="text-zinc-600 text-base font-regular">
              No email added
            </Text>
          )}
        </View>

        <View className="gap-4 mt-4">
          <Input variant="secondary">
            <AtSign color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Enter the guest's email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              returnKeyType="send"
              onSubmitEditing={handleAddEmail}
            />
          </Input>

          <Button onPress={handleAddEmail}>
            <Button.Title>Invite</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  );
}
