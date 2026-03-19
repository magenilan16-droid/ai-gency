// Persistent trip storage using localStorage
// Each trip is stored under "aigency_trip_{id}"

export function saveTrip(id, data) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`aigency_trip_${id}`, JSON.stringify(data));
}

export function getTrip(id) {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`aigency_trip_${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function updateTrip(id, data) {
  saveTrip(id, data);
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Create a blank manual trip template
export function createEmptyTrip({ destination, startDate, endDate, travelers, budget, currency, style }) {
  const days = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000));
  const dailyItinerary = Array.from({ length: days }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return {
      day: i + 1,
      date: date.toISOString().split("T")[0],
      title: `Day ${i + 1} in ${destination}`,
      activities: [
        { time: "morning", name: "Morning Activity", description: "Click to edit this activity.", estimated_cost: 0 },
        { time: "afternoon", name: "Afternoon Activity", description: "Click to edit this activity.", estimated_cost: 0 },
        { time: "evening", name: "Evening Activity", description: "Click to edit this activity.", estimated_cost: 0 },
      ],
      daily_cost: 0,
      accommodation: "Add your hotel here",
    };
  });

  return {
    summary: `Your custom trip to ${destination}. Edit each day to build your perfect itinerary!`,
    destination,
    days,
    travelers: Number(travelers),
    total_estimated_cost: Number(budget),
    currency,
    style,
    daily_itinerary: dailyItinerary,
    budget_breakdown: {
      accommodation: Math.round(budget * 0.4),
      food: Math.round(budget * 0.25),
      activities: Math.round(budget * 0.2),
      transportation: Math.round(budget * 0.1),
      other: Math.round(budget * 0.05),
    },
    tips: [
      "Add your own tips here",
      "Research local transportation options",
      "Check visa requirements in advance",
      "Book popular attractions ahead of time",
      "Learn a few local phrases",
    ],
    form: { destination, startDate, endDate, travelers, budget, currency, style },
    isManual: true,
  };
}
