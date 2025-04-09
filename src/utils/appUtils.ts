export const dayMapping: { [key: string]: string } = {
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
};

export const convertTo24Hour = (time: string) => {
    if (/^\d{2}:\d{2}$/.test(time)) {
        // Already in 24-hour format, return as-is
        return time;
    }

    const [hourStr, minuteStr, period] = time.split(/:| /);
    let hour = parseInt(hourStr, 10);

    if (period?.toUpperCase() === "PM" && hour !== 12) {
        hour += 12;
    } else if (period?.toUpperCase() === "AM" && hour === 12) {
        hour = 0;
    }

    return `${String(hour).padStart(2, "0")}:${minuteStr}`;
};