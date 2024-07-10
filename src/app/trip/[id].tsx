import { useEffect, useState } from "react";
import { Alert, Keyboard, TouchableOpacity, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import {
  CalendarRange,
  Info,
  MapPin,
  Settings2,
  Calendar as IconCalendar,
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

export type TripData = TripDetails & {
  when: string;
};

enum MODAL {
  NONE = 0,
  UPDATE_TRIP = 1,
  CALENDAR = 2,
}

export default function Trip() {
  //LOADING
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);
  const [isUpdatingTrip, setIsUpdatingTrip] = useState(false);

  //DATA
  const [tripDetails, setTripDetails] = useState({} as TripData);
  const [option, setOption] = useState<"activity" | "details">("activity");
  const [destination, setDestination] = useState("");
  const [selectedDates, setSelectedDates] = useState({} as DatesSelected);

  //MODAL
  const [showModal, setShowModal] = useState(MODAL.NONE);

  const tripId = useLocalSearchParams<{ id: string }>().id;

  async function getTripDetails() {
    try {
      setIsLoadingTrip(true);
      if (!tripId) return router.back();

      const trip = await tripServer.getByID(tripId);

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
          ? `${starts_at} a ${ends_at} de ${monthSt}`
          : `${starts_at} de ${monthSt} a ${ends_at} de ${monthSt}`;

      setDestination(trip.destination);
      setTripDetails({ ...trip, when: `${destination} de ${dateBetween}.` });
    } catch (e) {
      setIsLoadingTrip(false);
      console.log(e);
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

  async function handleUpdateTrip(params: type) {
    try {
      if (!tripId) return;

      if (!destination || !selectedDates.startsAt || !selectedDates.endsAt)
        return Alert.alert(
          "Update trip",
          "RecordRemember to fill in the fields correctly"
        );

      setIsUpdatingTrip(true);
      await tripServer.update({
        destination,
        id: tripId,
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
        <View className="w-full flex-row bg-zinc-900 border border-zinc-800 p-4 gap-2 rounded-lg">
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
            <Button.Title>Atividades</Button.Title>
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
            <Button.Title>Detalhes</Button.Title>
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
    </View>
  );
}