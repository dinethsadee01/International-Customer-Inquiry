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

type FormData = Record<string, string | string[] | Record<string, number>>;

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
      fields: [
        "Hotel Category",
        "Room Category",
        "Room type",
        "No. of Rooms",
        "Basis",
      ],
      required: [
        "Hotel Category",
        "Room Category",
        "Room type",
        "No. of Rooms",
        "Basis",
      ],
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
        "Special Days",
      ],
      required: [
        "Tour type",
        "Transport",
        "Site / Interests",
        "Other service",
        "Special Arrangements",
        "Special Days",
      ],
    },
  ];

  const isFormValid = () => {
    const allRequiredFields = sections.flatMap(
      (section) => section.required || []
    );
    for (const field of allRequiredFields) {
      const value = formData[field];
      if (
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
      placeholder: "Please specify",
    },
    "Room Category": {
      type: "select",
      icon: <BedDouble size={18} />,
      options: ["Standard", "Deluxe", "Superior", "Luxury", "Suite"],
    },
    "Room type": {
      type: "select",
      icon: <BedDouble size={18} />,
      options: ["SGL", "DBL", "TRIP", "QTRP"],
      help: "SGL=Single, DBL=Double, TRIP=Triple, QTRP=Quadruple",
    },
    "No. of Rooms": {
      type: "select",
      icon: <Users size={18} />,
      options: ["01 DBL", "01 SGL", "2 TRIPL", "1 Suite", "1 QTRP"],
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
      type: "select",
      icon: <Car size={18} />,
      options: [
        "None",
        "Jeep 4x4",
        "Boat Service",
        "Train Rides",
        "Village Tours",
        "Other",
      ],
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
    "Special Days": {
      type: "select",
      icon: <CalendarCheck size={18} />,
      options: [
        "None",
        "24 Dec - X'mas",
        "31 Night",
        "Peak Season - Nov/Mar",
        "High Peak Season - 20 Dec/10 Jan",
        "Low Season - April/Oct",
        "Perahera Season - Jul/Aug",
      ],
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
      field === "Other Hotel Category" &&
      formData["Hotel Category"] === "Other" &&
      (!value || (typeof value === "string" && value.trim() === ""))
    ) {
      return "Please specify the hotel category";
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
    value: string | string[] | Record<string, number>
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Validate on change
    let error = "";
    if (typeof value === "string" || Array.isArray(value)) {
      error = validateField(
        field,
        Array.isArray(value) ? value.join(", ") : value
      );
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Handle Submit
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setHasSubmitted(true);

    // Prevent submit if any field in the form is empty (only those actually rendered)
    if (
      sections
        .flatMap((section) => section.fields)
        .some((field) => !formData[field] || formData[field] === "")
    ) {
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
        : "",
      departure_date: dates["Departure Date"]
        ? dates["Departure Date"].toISOString()
        : "",
      no_of_nights: formData["No. of Nights"]
        ? Number(formData["No. of Nights"])
        : null,
      hotel_category:
        formData["Hotel Category"] === "Other"
          ? `Other: ${formData["Other Hotel Category"]}`
          : (formData["Hotel Category"] as string) || "",
      room_category: formData["Room Category"] || "",
      room_type: formData["Room type"] || "",
      no_of_rooms:
        typeof formData["No. of Rooms"] === "object"
          ? JSON.stringify(formData["No. of Rooms"])
          : formData["No. of Rooms"] || "",
      basis: formData["Basis"] || "",
      no_of_pax: formData["No of pax"] ? Number(formData["No of pax"]) : null,
      children: formData["Children"] || "",
      tour_type: formData["Tour type"] || "",
      transport: formData["Transport"] || "",
      site_interests: Array.isArray(formData["Site / Interests"])
        ? formData["Site / Interests"]
        : formData["Site / Interests"]
        ? [formData["Site / Interests"]]
        : null,
      other_service: formData["Other service"] || "",
      special_arrangements: formData["Special Arrangements"] || "",
      special_days: formData["Special Days"] || "",
      arrival_flight: formData["Arrival Flight"] || "",
      departure_flight: formData["Departure Flight"] || "",
    };

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
      if (!clientData[field] || clientData[field] === "") {
        newErrors[field] = `${field.replace(/_/g, " ")} is required`;
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
      // Optionally reset form here
      setFormData({});
      setDates({ "Arrival Date": null, "Departure Date": null });
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

    if (
      fieldsToClear.includes("Arrival Date") ||
      fieldsToClear.includes("Departure Date")
    ) {
      const newDates = { ...dates };
      if (fieldsToClear.includes("Arrival Date"))
        newDates["Arrival Date"] = null;
      if (fieldsToClear.includes("Departure Date"))
        newDates["Departure Date"] = null;
      setDates(newDates);
    }

    setFormData(newFormData);

    const newErrors = { ...errors };
    fieldsToClear.forEach((field) => {
      delete newErrors[field];
    });
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
                                      Specify Other
                                    </label>
                                    <Input
                                      placeholder="Please specify"
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
                          const selected = Array.isArray(value) ? value : [];
                          return (
                            <div key={field} className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">
                                {field}
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
                                          let newSelected;
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
                                      <span>{option}</span>
                                    </label>
                                  ))}
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
