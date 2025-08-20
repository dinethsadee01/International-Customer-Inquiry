"use client";

import React from "react";
import { useState, useEffect } from "react";
import {
  CalendarPlus,
  CalendarMinus,
  CalendarCheck,
  Plane,
  Hotel,
  BedDouble,
  Users,
  Gift,
  Car,
  Sparkles,
  CheckCircle,
  AlertCircle,
  Info,
  Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { format, differenceInCalendarDays, addDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { RoomSelector } from "@/components/ui/room-selector";
import { supabase } from "@/lib/supabase"; // Import the Supabase client

type FormData = Record<
  string,
  string | string[] | Record<string, number> | RoomSelection[]
>;

interface RoomSelection {
  category: string;
  type: string;
  quantity: number;
}

interface FormSection {
  title: string;
  description: string;
  icon: React.ReactNode;
  fields: string[];
  required?: string[];
}

export default function InquiryForm() {
  const [formData, setFormData] = useState<FormData>({});
  const [dates, setDates] = useState<{ [key: string]: Date | null }>({
    "Arrival Date": null,
    "Departure Date": null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentSection, setCurrentSection] = useState(0);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const sections: FormSection[] = [
    {
      title: "Customer",
      description: "Tell us about yourself",
      icon: <Users className="w-6 h-6" />,
      fields: [
        "Customer Name",
        "Customer Email",
        "Customer Contact",
        "Customer Nationality",
        "Customer Country",
        "Arrival Flight",
        "Departure Flight",
      ],
      required: [
        "Customer Name",
        "Customer Email",
        "Customer Contact",
        "Customer Nationality",
        "Customer Country",
      ],
    },
    {
      title: "Travel Dates",
      description: "When would you like to travel?",
      icon: <CalendarCheck className="w-6 h-6" />,
      fields: ["Arrival Date", "Departure Date", "No. of Nights"],
      required: ["Arrival Date", "Departure Date"],
    },
    {
      title: "Accommodation",
      description: "Choose your perfect stay",
      icon: <Hotel className="w-6 h-6" />,
      fields: ["Hotel Category", "Room Selection", "Basis"],
      required: ["Hotel Category", "Room Selection", "Basis"],
    },
    {
      title: "Group Details",
      description: "Tell us about your travel group",
      icon: <Users className="w-6 h-6" />,
      fields: ["No of pax", "Children"],
      required: ["No of pax", "Children"],
    },
    {
      title: "Experience & Services",
      description: "Customize your journey",
      icon: <Sparkles className="w-6 h-6" />,
      fields: [
        "Tour type",
        "Transport",
        "Site / Interests",
        "Other service",
        "Special Arrangements",
      ],
      required: [
        "Tour type",
        "Transport",
        "Site / Interests",
        "Other service",
        "Special Arrangements",
      ],
    },
  ];

  const isFormValid = () => {
    const allRequiredFields = sections.flatMap(
      (section) => section.required || []
    );
    for (const field of allRequiredFields) {
      const value = formData[field];
      if (field === "Room Selection") {
        // Check if room selection has at least one valid room
        if (!Array.isArray(value) || value.length === 0) {
          return false;
        }
        const rooms = value as RoomSelection[];
        const hasValidRoom = rooms.some(
          (room) => room.category && room.type && room.quantity > 0
        );
        if (!hasValidRoom) {
          return false;
        }
      } else if (
        !value ||
        (Array.isArray(value) && value.length === 0) ||
        (typeof value === "string" && value.trim() === "")
      ) {
        return false;
      }
    }
    // Add conditional check for "Other Hotel Category"
    if (
      formData["Hotel Category"] === "Other" &&
      (!formData["Other Hotel Category"] ||
        (typeof formData["Other Hotel Category"] === "string" &&
          (formData["Other Hotel Category"] as string).trim() === ""))
    ) {
      return false;
    }
    // Add conditional check for "Special Arrangements Date"
    if (
      formData["Special Arrangements"] &&
      formData["Special Arrangements"] !== "None" &&
      (!formData["Special Arrangements Date"] ||
        (typeof formData["Special Arrangements Date"] === "string" &&
          (formData["Special Arrangements Date"] as string).trim() === ""))
    ) {
      return false;
    }
    for (const key in errors) {
      if (errors[key]) {
        return false;
      }
    }
    return true;
  };

  // Define Flight Details fields and icon for rendering under Travel Dates
  const flightDetails = {
    icon: <Plane className="w-6 h-6" />,
    fields: ["Arrival Flight", "Departure Flight"],
  };

  const fieldConfig: Record<string, any> = {
    "Customer Name": {
      type: "text",
      icon: <Users size={18} />,
      placeholder: "Your full name",
    },
    "Customer Email": {
      type: "text",
      icon: <Users size={18} />,
      placeholder: "Your email address",
    },
    "Customer Contact": {
      type: "text",
      icon: <Users size={18} />,
      placeholder: "Your contact number",
    },
    "Customer Nationality": {
      type: "text",
      icon: <Users size={18} />,
      placeholder: "Your nationality",
    },
    "Customer Country": {
      type: "text",
      icon: <Users size={18} />,
      placeholder: "Your country",
    },
    "Arrival Flight": {
      type: "text",
      icon: <Plane size={18} />,
      placeholder: "e.g., AA123, 10:30 AM",
    },
    "Departure Flight": {
      type: "text",
      icon: <Plane size={18} />,
      placeholder: "e.g., AA456, 2:15 PM",
    },
    "Arrival Date": {
      type: "date",
      icon: <CalendarPlus size={18} />,
      placeholder: "Select arrival date",
    },
    "Departure Date": {
      type: "date",
      icon: <CalendarMinus size={18} />,
      placeholder: "Select departure date",
    },
    "No. of Nights": { type: "display", icon: <CalendarCheck size={18} /> },
    "Tour type": {
      type: "select",
      icon: <Sparkles size={18} />,
      options: [
        "Round trip",
        "Beach stay",
        "City stay",
        "Round trip + Beach",
        "Beach stay + city",
      ],
      help: "Choose the type of experience you prefer",
    },
    "Hotel Category": {
      type: "select",
      icon: <Hotel size={18} />,
      options: ["5 Star", "4 Star", "Boutique Villas", "Other"],
      help: "Select your preferred accommodation standard",
    },
    "Other Hotel Category": {
      type: "text",
      placeholder: "Please specify the Hotel Category type",
    },
    "Room Selection": {
      type: "room-selector",
      icon: <BedDouble size={18} />,
      roomCategories: ["Standard", "Deluxe", "Superior", "Luxury", "Suite"],
      roomTypes: ["SGL", "DBL", "TRIP", "QTRP"],
      help: "(Select your room combinations - Category, Type, and Quantity)",
    },
    Basis: {
      type: "select",
      icon: <Gift size={18} />,
      options: ["RO", "BB", "HB", "FB", "AI"],
      help: "RO=Room Only, BB=Bed & Breakfast, HB=Half Board, FB=Full Board, AI=All Inclusive",
    },
    Transport: {
      type: "select",
      icon: <Car size={18} />,
      options: ["Car", "Van", "Mini bus", "Coach", "Baggage Van"],
    },
    Children: {
      type: "select",
      icon: <Users size={18} />,
      options: ["None", "0 to 4.9", "5 to 11.9", "Teens"],
    },
    "Site / Interests": {
      type: "multiselect",
      icon: <Sparkles size={18} />,
      options: [
        "Culture",
        "Nature",
        "Wildlife",
        "Wellness",
        "Adventure",
        "Sun & Sea",
      ],
    },
    "Other service": {
      type: "multiselect",
      icon: <Car size={18} />,
      options: [
        "None",
        "Jeep 4x4",
        "Boat Service",
        "Train Rides",
        "Village Tours",
      ],
      help: "(Select 'None' if no additional services are needed)",
      allowCustom: true,
    },
    "No of pax": {
      type: "text",
      icon: <Users size={18} />,
      placeholder: "Total number of travelers",
    },
    "Special Arrangements": {
      type: "select",
      icon: <Gift size={18} />,
      options: ["None", "B'Day", "Anniversary", "Engagement", "Wedding"],
    },
    "Special Arrangements Date": {
      type: "date",
      icon: <CalendarPlus size={18} />,
      placeholder: "Select date for the special arrangement",
    },
  };

  // Calculate progress
  const totalFields = Object.keys(fieldConfig).length;
  const completedFields = Object.keys(formData).filter(
    (key) => formData[key] && formData[key] !== ""
  ).length;
  const progress = (completedFields / totalFields) * 100;

  // Auto-calculate nights
  useEffect(() => {
    if (dates["Arrival Date"] && dates["Departure Date"]) {
      const nights = differenceInCalendarDays(
        dates["Departure Date"],
        dates["Arrival Date"]
      );
      if (nights >= 0) {
        setFormData((prev) => ({
          ...prev,
          "No. of Nights": nights.toString(),
        }));
        // Clear any date-related errors
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors["Departure Date"];
          return newErrors;
        });
      } else {
        setErrors((prev) => ({
          ...prev,
          "Departure Date": "Departure date must be after arrival date",
        }));
      }
    }
  }, [dates]);

  // Validation
  const validateField = (field: string, value: string) => {
    const allRequiredFields = sections.flatMap(
      (section) => section.required || []
    );
    // General required check - only for required fields
    if (
      allRequiredFields.includes(field) &&
      (!value || (typeof value === "string" && value.trim() === ""))
    ) {
      return `${field} is required`;
    }
    if (
      field === "Special Arrangements Date" &&
      formData["Special Arrangements"] &&
      formData["Special Arrangements"] !== "None" &&
      (!value || (typeof value === "string" && value.trim() === ""))
    ) {
      return "Please specify the date for the special arrangement";
    }
    // Field-specific validation
    switch (field) {
      case "Customer Email":
        if (!/^\S+@\S+\.\S+$/.test(value)) {
          return "Please enter a valid email address";
        }
        break;
      case "Customer Contact":
        if (!/^[\d\s+\-()]{7,}$/.test(value)) {
          return "Please enter a valid contact number";
        }
        break;
      case "Arrival Date":
      case "Departure Date":
      case "Special Arrangements Date":
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          return "Please select a valid date";
        }
        break;
      case "No of pax":
        if (isNaN(Number(value)) || Number(value) <= 0) {
          return "Please enter a valid number of travelers";
        }
        break;
      case "Arrival Flight":
      case "Departure Flight":
        if (value && typeof value === "string" && value.trim().length < 3) {
          return `Please enter a valid ${field.toLowerCase()}`;
        }
        break;
      default:
        break;
    }
    return "";
  };

  const handleFieldChange = (
    field: string,
    value: string | string[] | Record<string, number> | RoomSelection[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear Special Arrangements Date if Special Arrangements is set to "None"
    if (field === "Special Arrangements" && value === "None") {
      setFormData((prev) => {
        const newData = { ...prev };
        delete newData["Special Arrangements Date"];
        return newData;
      });
      setDates((prev) => ({
        ...prev,
        "Special Arrangements Date": null,
      }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors["Special Arrangements Date"];
        return newErrors;
      });
    }

    // Validate on change
    let error = "";
    if (field === "Room Selection") {
      // Special handling for room selection validation
      const rooms = Array.isArray(value) ? (value as RoomSelection[]) : [];
      if (rooms.length === 0) {
        error = "Please add at least one room";
      } else {
        const hasInvalidRoom = rooms.some(
          (room) => !room.category || !room.type || room.quantity <= 0
        );
        if (hasInvalidRoom) {
          error = "Please fill all room details";
        } else {
          // Check for duplicate room combinations
          const roomCombinations = new Map<string, number>();
          for (let i = 0; i < rooms.length; i++) {
            const room = rooms[i];
            if (room.category && room.type) {
              const combination = `${room.category}-${room.type}`;
              if (roomCombinations.has(combination)) {
                error = `Duplicate room combination: ${room.category} ${room.type}. Increase quantity instead of adding the same room type multiple times.`;
                break;
              }
              roomCombinations.set(combination, i);
            }
          }
        }
      }
    } else if (
      typeof value === "string" ||
      (Array.isArray(value) && typeof value[0] === "string")
    ) {
      error = validateField(
        field,
        Array.isArray(value)
          ? (value as string[]).join(", ")
          : (value as string)
      );
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Handle Submit
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setHasSubmitted(true);

    // Check if form is valid before submitting
    if (!isFormValid()) {
      return;
    }

    // Prepare client data (convert undefined/null to empty string, arrays to comma-separated, objects to JSON)
    const clientData: Record<string, any> = {
      full_name: formData["Customer Name"] || "",
      email_address: formData["Customer Email"] || "",
      contact_number: formData["Customer Contact"] || "",
      nationality: formData["Customer Nationality"] || "",
      country: formData["Customer Country"] || "",
      arrival_date: dates["Arrival Date"]
        ? dates["Arrival Date"].toISOString()
        : null,
      departure_date: dates["Departure Date"]
        ? dates["Departure Date"].toISOString()
        : null,
      no_of_nights: formData["No. of Nights"]
        ? parseInt(formData["No. of Nights"] as string) || 0
        : null,
      hotel_category:
        formData["Hotel Category"] === "Other"
          ? `Other: ${formData["Other Hotel Category"]}`
          : (formData["Hotel Category"] as string) || "",
      room_type: Array.isArray(formData["Room Selection"])
        ? JSON.stringify(formData["Room Selection"])
        : JSON.stringify([]),
      basis: formData["Basis"] || "",
      no_of_pax: formData["No of pax"]
        ? parseInt(formData["No of pax"] as string) || 0
        : null,
      children: formData["Children"] || "",
      tour_type: formData["Tour type"] || "",
      transport: formData["Transport"] || "",
      site_interests: Array.isArray(formData["Site / Interests"])
        ? formData["Site / Interests"]
        : formData["Site / Interests"]
        ? [formData["Site / Interests"]]
        : null,
      other_service: Array.isArray(formData["Other service"])
        ? (formData["Other service"] as string[]).includes("None")
          ? ["None"]
          : formData["Other service"]
        : formData["Other service"]
        ? [formData["Other service"]]
        : ["None"],
      special_arrangements: formData["Special Arrangements"] || "",
      special_arrangements_date: dates["Special Arrangements Date"]
        ? dates["Special Arrangements Date"].toISOString()
        : null,
      arrival_flight: formData["Arrival Flight"] || "",
      departure_flight: formData["Departure Flight"] || "",
    };

    // Log the data being sent for debugging
    console.log("Form data being submitted:", formData);
    console.log("Dates being submitted:", dates);
    console.log("Client data for database:", clientData);

    // List of required fields (update to match your Supabase schema)
    const requiredFields = [
      "full_name",
      "email_address",
      "contact_number",
      "arrival_date",
      "departure_date",
      // Add more required fields as per your Supabase schema
    ];
    // Validate all required fields and set errors
    const newErrors: Record<string, string> = {};
    requiredFields.forEach((field) => {
      if (
        !clientData[field] ||
        clientData[field] === "" ||
        clientData[field] === null
      ) {
        const fieldName = field
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase());
        newErrors[field] = `${fieldName} is required`;
      }
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      // Don't submit if there are errors
      return;
    }

    // Insert the data into Supabase
    const response = await supabase
      .from("client_inquiry")
      .insert([clientData])
      .select(); // Get the inserted row(s) back

    // Log the full response for debugging
    // commit
    console.log("Supabase insert response:", response);

    const { data, error, status, statusText } = response;
    if (error) {
      console.error("Error saving client inquiry:", error);
      alert(
        `Supabase error: ${
          error.message || JSON.stringify(error)
        } (Status: ${status} ${statusText})`
      );
    } else if (data && data.length > 0) {
      console.log("Client inquiry saved successfully:", data);
      alert("Client inquiry saved successfully!");
      // Reset form completely
      setFormData({});
      setDates({
        "Arrival Date": null,
        "Departure Date": null,
        "Special Arrangements Date": null,
      });
      setCurrentSection(0);
      setHasSubmitted(false);
      setErrors({});
    } else {
      alert("Unknown error: No data returned from Supabase.");
    }
  };

  // Clear the current section's fields
  const handleClearSection = () => {
    const fieldsToClear = sections[currentSection].fields;

    const newFormData = { ...formData };
    fieldsToClear.forEach((field) => {
      delete newFormData[field];
    });
    if (fieldsToClear.includes("Hotel Category")) {
      delete newFormData["Other Hotel Category"];
    }
    if (fieldsToClear.includes("Special Arrangements")) {
      delete newFormData["Special Arrangements Date"];
    }

    if (
      fieldsToClear.includes("Arrival Date") ||
      fieldsToClear.includes("Departure Date") ||
      fieldsToClear.includes("Special Arrangements")
    ) {
      const newDates = { ...dates };
      if (fieldsToClear.includes("Arrival Date"))
        newDates["Arrival Date"] = null;
      if (fieldsToClear.includes("Departure Date"))
        newDates["Departure Date"] = null;
      if (fieldsToClear.includes("Special Arrangements"))
        newDates["Special Arrangements Date"] = null;
      setDates(newDates);
    }

    setFormData(newFormData);

    const newErrors = { ...errors };
    fieldsToClear.forEach((field) => {
      delete newErrors[field];
    });
    if (fieldsToClear.includes("Hotel Category")) {
      delete newErrors["Other Hotel Category"];
    }
    if (fieldsToClear.includes("Special Arrangements")) {
      delete newErrors["Special Arrangements Date"];
    }
    setErrors(newErrors);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
            Plan Your Perfect Trip
          </h1>
          <p className="text-gray-600 text-lg">
            Let's create an amazing travel experience tailored just for you.
          </p>
        </header>

        <div className="mb-12">
          <div className="flex items-center">
            {sections.map((section, index) => (
              <React.Fragment key={section.title}>
                <div className="flex flex-col items-center">
                  <Button
                    variant={currentSection >= index ? "default" : "outline"}
                    className={`rounded-full w-12 h-12 p-0 flex items-center justify-center ${
                      currentSection === index
                        ? "ring-2 ring-offset-2 ring-black"
                        : ""
                    }`}
                    onClick={() => setCurrentSection(index)}
                  >
                    {section.icon}
                  </Button>
                  <p className="text-sm mt-2 text-center">{section.title}</p>
                </div>
                {index < sections.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full ${
                      currentSection > index ? "bg-green-600" : "bg-gray-300"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <main>
          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {sections[currentSection].icon}
                      {sections[currentSection].title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {sections[currentSection].fields.map((field) => {
                        const config = fieldConfig[field] || {
                          type: "text",
                          placeholder: field,
                        };
                        const value = formData[field];
                        const errorMsg = errors[field];
                        const showError =
                          !!errorMsg && (hasSubmitted || value !== undefined);

                        if (config.type === "display") {
                          return (
                            <div
                              key={field}
                              className="space-y-2 md:col-span-2"
                            >
                              <label className="text-sm font-medium text-gray-700">
                                {field}
                              </label>
                              <div className="p-2 bg-gray-100 rounded-md text-lg font-semibold">
                                {String(formData[field] || "0")}
                              </div>
                            </div>
                          );
                        }

                        if (config.type === "select") {
                          return (
                            <React.Fragment key={field}>
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                  {field}
                                </label>
                                <Select
                                  onValueChange={(val) =>
                                    handleFieldChange(field, val)
                                  }
                                  value={typeof value === "string" ? value : ""}
                                >
                                  <SelectTrigger
                                    className={`${
                                      showError
                                        ? "border-red-500"
                                        : value && value !== "" && !showError
                                        ? "border-green-500"
                                        : "border-gray-300"
                                    }`}
                                  >
                                    <SelectValue
                                      className="text-gray-700"
                                      placeholder={
                                        config.placeholder ||
                                        "Choose an option..."
                                      }
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {config.options &&
                                      config.options.map((option: string) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                                {showError && (
                                  <div className="flex items-center gap-1 text-red-500 text-sm">
                                    {errorMsg}
                                  </div>
                                )}
                              </div>
                              {field === "Hotel Category" &&
                                value === "Other" && (
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                      Specify Other Hotel Category
                                    </label>
                                    <Input
                                      placeholder="Please specify the Hotel Category type"
                                      onChange={(e) =>
                                        handleFieldChange(
                                          "Other Hotel Category",
                                          e.target.value
                                        )
                                      }
                                      value={
                                        (formData[
                                          "Other Hotel Category"
                                        ] as string) || ""
                                      }
                                      className={`${
                                        errors["Other Hotel Category"]
                                          ? "border-red-500"
                                          : formData["Other Hotel Category"]
                                          ? "border-green-500"
                                          : "border-gray-300"
                                      }`}
                                    />
                                    {errors["Other Hotel Category"] && (
                                      <div className="flex items-center gap-1 text-red-500 text-sm">
                                        {errors["Other Hotel Category"]}
                                      </div>
                                    )}
                                  </div>
                                )}
                              {field === "Special Arrangements" &&
                                value !== "None" &&
                                value && (
                                  <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">
                                      Date of {String(value)}
                                    </label>
                                    <Input
                                      type="date"
                                      placeholder="Select date for the special arrangement"
                                      onChange={(e) => {
                                        handleFieldChange(
                                          "Special Arrangements Date",
                                          e.target.value
                                        );
                                        setDates((prev) => ({
                                          ...prev,
                                          "Special Arrangements Date": e.target
                                            .value
                                            ? new Date(e.target.value)
                                            : null,
                                        }));
                                      }}
                                      value={
                                        (formData[
                                          "Special Arrangements Date"
                                        ] as string) || ""
                                      }
                                      className={`${
                                        errors["Special Arrangements Date"]
                                          ? "border-red-500"
                                          : formData[
                                              "Special Arrangements Date"
                                            ]
                                          ? "border-green-500"
                                          : "border-gray-300"
                                      }`}
                                    />
                                    {errors["Special Arrangements Date"] && (
                                      <div className="flex items-center gap-1 text-red-500 text-sm">
                                        {errors["Special Arrangements Date"]}
                                      </div>
                                    )}
                                  </div>
                                )}
                            </React.Fragment>
                          );
                        } else if (config.type === "date") {
                          return (
                            <div key={field} className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                {field}
                              </label>
                              <Input
                                type="date"
                                placeholder={config.placeholder}
                                value={
                                  value
                                    ? typeof value === "string"
                                      ? value
                                      : ""
                                    : ""
                                }
                                onChange={(e) => {
                                  handleFieldChange(field, e.target.value);
                                  setDates((prev) => ({
                                    ...prev,
                                    [field]: e.target.value
                                      ? new Date(e.target.value)
                                      : null,
                                  }));
                                }}
                                className={`${
                                  showError
                                    ? "border-red-500"
                                    : value && value !== "" && !showError
                                    ? "border-green-500"
                                    : "border-gray-300"
                                }`}
                              />
                              {showError && (
                                <div className="flex items-center gap-1 text-red-500 text-sm">
                                  {errorMsg}
                                </div>
                              )}
                            </div>
                          );
                        } else if (config.type === "multiselect") {
                          const selected =
                            Array.isArray(value) && typeof value[0] === "string"
                              ? (value as string[])
                              : [];
                          return (
                            <div key={field} className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                {field}
                                <span className="text-xs text-gray-500 ml-2">
                                  {config.help}
                                </span>
                              </label>
                              <div className="flex flex-wrap gap-2 p-2 border rounded-md">
                                {config.options &&
                                  config.options.map((option: string) => (
                                    <label
                                      key={option}
                                      className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        className="form-checkbox h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        checked={selected.includes(option)}
                                        onChange={() => {
                                          let newSelected: string[];
                                          if (selected.includes(option)) {
                                            newSelected = selected.filter(
                                              (o: string) => o !== option
                                            );
                                          } else {
                                            newSelected = [...selected, option];
                                          }
                                          handleFieldChange(field, newSelected);
                                        }}
                                      />
                                      <span className="text-sm">{option}</span>
                                    </label>
                                  ))}
                                {/* Show custom options that aren't in the predefined list */}
                                {selected
                                  .filter(
                                    (item) => !config.options?.includes(item)
                                  )
                                  .map((customOption: string) => (
                                    <label
                                      key={customOption}
                                      className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer bg-blue-50"
                                    >
                                      <input
                                        type="checkbox"
                                        className="form-checkbox h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        checked={true}
                                        onChange={() => {
                                          const newSelected = selected.filter(
                                            (o: string) => o !== customOption
                                          );
                                          handleFieldChange(field, newSelected);
                                        }}
                                      />
                                      <span className="text-sm text-green-700">
                                        {customOption}
                                      </span>
                                    </label>
                                  ))}
                              </div>
                              {/* Add custom option input if allowCustom is true */}
                              {config.allowCustom && (
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Add custom service..."
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        const customValue =
                                          e.currentTarget.value.trim();
                                        if (
                                          customValue &&
                                          !selected.includes(customValue)
                                        ) {
                                          const newSelected = [
                                            ...selected,
                                            customValue,
                                          ];
                                          handleFieldChange(field, newSelected);
                                          e.currentTarget.value = "";
                                        }
                                      }
                                    }}
                                    className="flex-1"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={(e) => {
                                      const input = e.currentTarget
                                        .previousElementSibling as HTMLInputElement;
                                      const customValue = input.value.trim();
                                      if (
                                        customValue &&
                                        !selected.includes(customValue)
                                      ) {
                                        const newSelected = [
                                          ...selected,
                                          customValue,
                                        ];
                                        handleFieldChange(field, newSelected);
                                        input.value = "";
                                      }
                                    }}
                                  >
                                    Add
                                  </Button>
                                </div>
                              )}
                              {showError && (
                                <div className="flex items-center gap-1 text-red-500 text-sm">
                                  {errorMsg}
                                </div>
                              )}
                            </div>
                          );
                        } else if (config.type === "room-selector") {
                          const roomSelections =
                            Array.isArray(value) && typeof value[0] === "object"
                              ? (value as RoomSelection[])
                              : [];

                          const addRoom = () => {
                            const newRooms: RoomSelection[] = [
                              ...roomSelections,
                              { category: "", type: "", quantity: 1 },
                            ];
                            handleFieldChange(field, newRooms);
                          };

                          const removeRoom = (index: number) => {
                            const newRooms = roomSelections.filter(
                              (_, i) => i !== index
                            );
                            handleFieldChange(field, newRooms);
                          };

                          const updateRoom = (
                            index: number,
                            key: keyof RoomSelection,
                            val: any
                          ) => {
                            const newRooms = [...roomSelections];
                            const room = newRooms[index];
                            if (room) {
                              newRooms[index] = { ...room, [key]: val };
                              handleFieldChange(field, newRooms);
                            }
                          };

                          return (
                            <div
                              key={field}
                              className="space-y-2 md:col-span-2"
                            >
                              <label className="text-sm font-medium text-gray-700">
                                {field}
                                <span className="text-xs text-gray-500 ml-2">
                                  {config.help}
                                </span>
                              </label>
                              <div
                                className={`space-y-3 p-4 border rounded-md ${
                                  showError
                                    ? "border-red-500"
                                    : value &&
                                      Array.isArray(value) &&
                                      value.length > 0 &&
                                      !showError
                                    ? "border-green-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {roomSelections.map(
                                  (room: RoomSelection, index: number) => (
                                    <div
                                      key={index}
                                      className="flex gap-3 items-end"
                                    >
                                      <div className="flex-1">
                                        <label className="text-xs text-gray-600">
                                          Category
                                        </label>
                                        <Select
                                          onValueChange={(val) =>
                                            updateRoom(index, "category", val)
                                          }
                                          value={room.category || ""}
                                        >
                                          <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Category" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {config.roomCategories?.map(
                                              (category: string) => (
                                                <SelectItem
                                                  key={category}
                                                  value={category}
                                                >
                                                  {category}
                                                </SelectItem>
                                              )
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="flex-1">
                                        <label className="text-xs text-gray-600">
                                          Type
                                        </label>
                                        <Select
                                          onValueChange={(val) =>
                                            updateRoom(index, "type", val)
                                          }
                                          value={room.type || ""}
                                        >
                                          <SelectTrigger className="h-9">
                                            <SelectValue placeholder="Type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {config.roomTypes?.map(
                                              (type: string) => (
                                                <SelectItem
                                                  key={type}
                                                  value={type}
                                                >
                                                  {type}
                                                </SelectItem>
                                              )
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="w-20">
                                        <label className="text-xs text-gray-600">
                                          Qty
                                        </label>
                                        <Input
                                          type="number"
                                          min="1"
                                          max="10"
                                          value={room.quantity || 1}
                                          onChange={(e) =>
                                            updateRoom(
                                              index,
                                              "quantity",
                                              parseInt(e.target.value) || 1
                                            )
                                          }
                                          className="h-9"
                                        />
                                      </div>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeRoom(index)}
                                        className="h-9 px-2"
                                        disabled={roomSelections.length === 1}
                                      >
                                        Remove
                                      </Button>
                                    </div>
                                  )
                                )}
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={addRoom}
                                  className="w-full"
                                >
                                  + Add Another Room
                                </Button>
                              </div>
                              {showError && (
                                <div className="flex items-center gap-1 text-red-500 text-sm">
                                  {errorMsg}
                                </div>
                              )}
                            </div>
                          );
                        } else {
                          return (
                            <div key={field} className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                {field}
                              </label>
                              <Input
                                placeholder={config.placeholder || field}
                                onChange={(e) =>
                                  handleFieldChange(field, e.target.value)
                                }
                                value={typeof value === "string" ? value : ""}
                                className={`${
                                  showError
                                    ? "border-red-500"
                                    : value && value !== "" && !showError
                                    ? "border-green-500"
                                    : "border-gray-300"
                                }`}
                              />
                              {showError && (
                                <div className="flex items-center gap-1 text-red-500 text-sm">
                                  {errorMsg}
                                </div>
                              )}
                            </div>
                          );
                        }
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setCurrentSection(Math.max(0, currentSection - 1))
                }
                disabled={currentSection === 0}
              >
                Previous
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearSection}
                >
                  Clear
                </Button>
                {currentSection < sections.length - 1 ? (
                  <Button
                    type="button"
                    onClick={() =>
                      setCurrentSection(
                        Math.min(sections.length - 1, currentSection + 1)
                      )
                    }
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={!isFormValid()}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Submit Inquiry
                  </Button>
                )}
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
