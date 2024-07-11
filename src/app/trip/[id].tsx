import { useEffect, useState } from "react";
import { Alert, Keyboard, Text, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  CalendarRange,
  Info,
  MapPin,
  Settings2,
  Calendar as IconCalendar,
  User,
  Mail,
} from "lucide-react-native";
import dayjs from "dayjs";

import { TripDetails, tripServer } from "@/server/trip-server";

import { colors } from "@/styles/colors";
import Loading from "@/components/loading";
import { Input } from "@/components/input";
import { Button } from "@/components/button";

import { Activities } from "./activities";
import { Details } from "./details";
import { Modal } from "@/components/modal";
import { Calendar } from "@/components/calendar";
import { calendarUtils, DatesSelected } from "@/utils/calendarUtils";
import { DateData } from "react-native-calendars";
import { participantsServer } from "@/server/participants-server";
import { validateInput } from "@/utils/validateInput";
import { tripStorage } from "@/storage/trip";

export type TripData = TripDetails & {
  when: string;
};

enum MODAL {
  NONE = 0,
  UPDATE_TRIP = 1,
  CALENDAR = 2,
  CONFIRM_ATTENDANCE = 3,
}

export default function Trip() {
  //LOADING
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false);
  const [isConfirmingAttendance, setIsConfirmingAttendance] = useState(false);

  //DATA
  const [tripDetails, setTripDetails] = useState({} as TripData);
  const [option, setOption] = useState<"activity" | "details">("activity");
  const [destination, setDestination] = useState("");
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  //MODAL
  const [showModal, setShowModal] = useState(MODAL.NONE);

  const tripParams = useLocalSearchParams<{
    id: string;
    participant?: string;
  }>();

  async function getTripDetails() {
    try {
      setIsLoadingTrip(true);

      if (tripParams.participant) setShowModal(MODAL.CONFIRM_ATTENDANCE);
      if (!tripParams.id) return router.back();
      const trip = await tripServer.getByID(tripParams.id);

      const maxLengthDestination = 10;
      const destination =
        trip.destination.length > maxLengthDestination
          ? trip.destination.slice(0, maxLengthDestination) + "..."
          : trip.destination;

      const starts_at = dayjs(trip.starts_at).format("DD");
      const ends_at = dayjs(trip.ends_at).format("DD");
      const monthSt = dayjs(trip.starts_at).format("MMM");
      const monthEn = dayjs(trip.ends_at).format("MMM");
      const dateBetween =
        monthSt === monthEn
          ? `${starts_at} to ${ends_at} from ${monthSt}`
          : `${starts_at} from ${monthSt} to ${ends_at} from ${monthSt}`;

      setDestination(trip.destination);
      setTripDetails({ ...trip, when: `${destination} from ${dateBetween}.` });
    } catch (e) {
      console.log(e);
    } finally {
      setIsLoadingTrip(false);
    }
  }

  function handleSelectDate(selectedDay: DateData) {
    const dates = calendarUtils.orderStartsAtAndEndsAt({
      startsAt: selectedDates.startsAt,
      endsAt: selectedDates.endsAt,
      selectedDay,
    });

    setSelectedDates(dates);

    // if (destination.trim().length < 4 || !dates.startsAt || !dates.endsAt)
    //   setBtnState(false);
    // else setBtnState(true);
  }

  async function handleUpdateTrip() {
    try {
      if (!tripParams.id) return;

      if (!destination || !selectedDates.startsAt || !selectedDates.endsAt)
        return Alert.alert(
          "Update trip",
          "RecordRemember to fill in the fields correctly"
        );

      setIsUpdatingTrip(true);
      await tripServer.update({
        destination,
        id: tripParams.id,
        starts_at: dayjs(selectedDates.startsAt.dateString).toString(),
        ends_at: dayjs(selectedDates.endsAt.dateString).toString(),
      });

      Alert.alert("Update trip", "Trip updated successfully", [
        {
          text: "Ok",
          onPress: () => {
            setShowModal(MODAL.NONE);
            getTripDetails;
          },
        },
      ]);
    } catch (e) {
      console.log(e);
    } finally {
      setIsUpdatingTrip(false);
    }
  }

  async function handleConfirmAttendance() {
    try {
      if (!tripParams.id || !tripParams.participant) {
        return;
      }

      if (!guestName.trim() || !guestEmail.trim()) {
        return Alert.alert(
          "Confirmação",
          "Preencha nome e e-mail para confirmar a viagem!"
        );
      }

      if (!validateInput.email(guestEmail.trim())) {
        return Alert.alert("Confirmação", "E-mail inválido!");
      }

      setIsConfirmingAttendance(true);

      await participantsServer.confirmTripByParticipantId({
        participantId: tripParams.participant,
        name: guestName,
        email: guestEmail.trim(),
      });

      Alert.alert("Confirmation", "Trip confirmed successfully!");

      await tripStorage.save(tripParams.id);

      setShowModal(MODAL.NONE);
    } catch (error) {
      console.log(error);
      Alert.alert("Confirmation", "Unable to confirm!");
    } finally {
      setIsConfirmingAttendance(false);
    }
  }

  async function handleRemoveTrip() {
    try {
      Alert.alert("Remove trip", "Are you sure you want to remove the trip?", [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            await tripStorage.remove();
            router.navigate("/");
          },
        },
      ]);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    getTripDetails();
  }, []);

  if (isLoadingTrip) return <Loading />;

  return (
    <View className="flex-1 px-5 pt-16">
      <Input variant="tertiary">
        <MapPin color={colors.zinc[400]} size={20} />
        <Input.Field value={tripDetails.when} readOnly />
        <TouchableOpacity
          className="w-9 h-9 bg-zinc-800 items-center justify-center rounded"
          onPress={() => setShowModal(MODAL.UPDATE_TRIP)}
        >
          <Settings2 color={colors.zinc[400]} size={20} />
        </TouchableOpacity>
      </Input>

      {option === "activity" ? (
        <Activities tripDetails={tripDetails} />
      ) : (
        <Details tripId={tripDetails.id} />
      )}

      <View className="w-full absolute -bottom-1 self-center justify-end pb-5 z-10 bg-zinc-950">
        <View className="w-full flex-row bg-zinc-900 p-4 rounded-lg border border-zinc-800 gap-2">
          <Button
            className="flex-1"
            onPress={() => setOption("activity")}
            variant={option === "activity" ? "primary" : "secondary"}
          >
            <CalendarRange
              color={
                option === "activity" ? colors.lime[950] : colors.zinc[400]
              }
              size={20}
            />
            <Button.Title>Activities</Button.Title>
          </Button>

          <Button
            className="flex-1"
            onPress={() => setOption("details")}
            variant={option === "details" ? "primary" : "secondary"}
          >
            <Info
              color={option === "details" ? colors.lime[950] : colors.zinc[400]}
              size={20}
            />
            <Button.Title>Details</Button.Title>
          </Button>
        </View>
      </View>

      <Modal
        title="Update trip"
        subtitle=""
        visible={showModal === MODAL.UPDATE_TRIP}
        onClose={() => setShowModal(MODAL.NONE)}
      >
        <View className="gap-2 my-4">
          <Input variant="secondary">
            <MapPin color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Where?"
              value={destination}
              onChangeText={setDestination}
            />
          </Input>
          <Input variant="secondary">
            <IconCalendar color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="When?"
              value={selectedDates.formatDatesInText}
              onFocus={() => Keyboard.dismiss()}
              showSoftInputOnFocus={false}
              onPressIn={() => setShowModal(MODAL.CALENDAR)}
            />
          </Input>
          <Button
            onPress={handleUpdateTrip}
            // disabled={!btnState}
            isLoading={isUpdatingTrip}
          >
            <Button.Title>Update</Button.Title>
          </Button>
          <TouchableOpacity activeOpacity={0.8} onPress={handleRemoveTrip}>
            <Text className="text-red-400 text-center mt-6">Remove trip</Text>
          </TouchableOpacity>
        </View>
      </Modal>

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

          <Button onPress={() => setShowModal(MODAL.UPDATE_TRIP)}>
            <Button.Title>Confirm</Button.Title>
          </Button>
        </View>
      </Modal>

      <Modal
        title="Confirm attendance"
        visible={showModal === MODAL.CONFIRM_ATTENDANCE}
      >
        <View className="gap-4 mt-4">
          <Text className="text-zinc-400 font-regular leading-6 my-2">
            You have been invited to participate in a trip to
            <Text className="font-semibold text-zinc-100">
              {" "}
              {tripDetails.destination}{" "}
            </Text>
            on the dates of{" "}
            <Text className="font-semibold text-zinc-100">
              {dayjs(tripDetails.starts_at).date()} to{" "}
              {dayjs(tripDetails.ends_at).date()}{" "}
              {dayjs(tripDetails.ends_at).format("MMMM")}. {"\n\n"}
            </Text>
            To confirm your presence on the trip, fill in the information below:
          </Text>

          <Input variant="secondary">
            <User color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Your full name"
              onChangeText={setGuestName}
            />
          </Input>

          <Input variant="secondary">
            <Mail color={colors.zinc[400]} size={20} />
            <Input.Field
              placeholder="Confirmation email"
              onChangeText={setGuestEmail}
            />
          </Input>

          <Button
            isLoading={isConfirmingAttendance}
            onPress={handleConfirmAttendance}
          >
            <Button.Title>Confirm my presence</Button.Title>
          </Button>
        </View>
      </Modal>
    </View>
  );
}
