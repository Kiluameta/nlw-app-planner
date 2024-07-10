import { api } from "./api";

export type TripDetails = {
  id: string;
  destination: string;
  starts_at: string;
  ends_at: string;
  is_confirmed: boolean;
};

type TripCreate = Omit<TripDetails, "id" | "is_confirmed"> & {
  emails_to_invite: string[];
};

const routes = {
  getByID: (id: string) => `/trips/${id}`,
  update: (id: string) => `/trips/${id}`,
};

async function getByID(id: string) {
  try {
    const { data } = await api.get<{ trip: TripDetails }>(routes.getByID(id));
    return data.trip;
  } catch (e) {
    throw e;
  }
}

async function create({
  destination,
  starts_at,
  ends_at,
  emails_to_invite,
}: TripCreate) {
  try {
    const { data } = await api.post<{ tripId: string }>("/trips", {
      destination,
      starts_at,
      ends_at,
      emails_to_invite,
      owner_name: "Igor Gabriel",
      owner_email: "rogiborgessouza@outlook.com",
    });

    return data.tripId;
  } catch (e) {
    throw e;
  }
}

async function update({
  id,
  destination,
  starts_at,
  ends_at,
}: Omit<TripDetails, "is_confirmed">) {
  try {
    await api.put(routes.update(id), {
      destination,
      starts_at,
      ends_at,
    });
  } catch (e) {
    throw e;
  }
}

export const tripServer = { getByID, create, update };
