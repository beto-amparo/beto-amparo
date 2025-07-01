import React from "react";
import { DayPicker } from "react-day-picker";
import { format, startOfDay, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import styles from "@/styles/Calendar.module.css"; // Importando o CSS customizado
// Componente Calendar customizado
const Calendar = ({
  className = "",
  classNames = {},
  showOutsideDays = true,
  ...props
}) => {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={`p-3 ${className} justify-center`}
      classNames={{
        months: "   sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: " space-y-4 relative",
        caption: "relative flex items-center justify-center mb-2",
        caption_label: `absolute text-sm font-semibold text-gray-800 ${styles.captionLabel}`,

        nav: "flex w-60 justify-between",
        
        
nav_button: "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 border border-gray-300 rounded-md text-sm text-gray-600 hover:text-gray-800 hover:border-gray-400",
nav_button_previous: "",
nav_button_next: "",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell:
          "h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20 " +
          "[&:has([aria-selected].day-range-end)]:rounded-r-md " +
          "[&:has([aria-selected].day-outside)]:bg-gray-50 " +
          "[&:has([aria-selected])]:bg-blue-50 " +
          "first:[&:has([aria-selected])]:rounded-l-md " +
          "last:[&:has([aria-selected])]:rounded-r-md",
        day: "text-center h-9 w-9 p-0 font-normal opacity-100 border-none hover:bg-gray-200 rounded-md transition-colors",
        day_selected: "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-600 focus:text-white rounded-md",
        day_today: "bg-yellow-100 text-yellow-800 font-semibold rounded-md",
        day_outside: "text-gray-400 opacity-50",
        day_disabled: "text-gray-100 opacity-25 bg-gray-50 cursor-not-allowed rounded-md",
        day_range_middle: "aria-selected:bg-blue-100 aria-selected:text-blue-700 rounded-none",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4" />,
        IconRight: () => <ChevronRight className="h-4 w-4" />,
   
      }}
      
      {...props}
    />
  );
};

// Componente principal
const AppointmentCalendar = ({ selectedDate, onDateSelect, availableDates }) => {
        
  const isDateAvailable = (date) => {
    if (!availableDates || availableDates.length === 0) return false;
    const normalizedDate = startOfDay(date);
    return availableDates.some((availableDateInArray) =>
      isSameDay(normalizedDate, availableDateInArray)
    );
  };

  return (
    <Card className="medical-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl text-gray-900">
          <CalendarIcon className="mr-2 h-5 w-5 text-blue-600" />
          Selecione uma Data
        </CardTitle>
        <p className="text-sm text-gray-600">
          Escolha uma data disponível para sua consulta
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          <Calendar
            mode="single"
            selected={selectedDate ? startOfDay(new Date(selectedDate)) : undefined}
            onSelect={(date) => {
              const normalizedDate = startOfDay(date);
              if (isDateAvailable(normalizedDate)) {
                onDateSelect(normalizedDate);
              }
            }}
            disabled={[
              { before: startOfDay(new Date()) },
              "unavailable",
            ]}
            locale={ptBR}
            className="rounded-md border-0 p-0"
            modifiers={{
              unavailable: (date) => !isDateAvailable(date),
              customAvailableStyle: isDateAvailable,
            }}
            modifiersClassNames={{
              customAvailableStyle: "bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md",
              unavailable: "text-gray-400 opacity-25 bg-gray-50 cursor-not-allowed rounded-md",
            }}
            classNames={{
              day_today: "bg-yellow-100 text-yellow-900 font-semibold rounded-md",
              day_selected: "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-600 focus:text-white rounded-md",
              day_disabled: "text-gray-400 opacity-25 bg-gray-50 cursor-not-allowed rounded-md",
            }}
          />

          {selectedDate && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center text-blue-800">
                <CalendarIcon className="h-4 w-4 mr-2" />
                <span className="font-medium">
                  Data selecionada:{" "}
                  {format(new Date(selectedDate), "dd 'de' MMMM 'de' yyyy", {
                    locale: ptBR,
                  })}
                </span>
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>
              • Datas em{" "}
              <span className="p-1 bg-blue-50 text-blue-700 rounded-sm text-xs">
                azul claro
              </span>{" "}
              indicam disponibilidade.
            </p>
          
            <p>• Datas indisponíveis são mais apagadas.</p>
            <p>• Selecione uma data para ver os horários disponíveis.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppointmentCalendar;
