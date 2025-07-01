import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TimeSlots = ({
  selectedDate,
  selectedTime,
  onTimeSelect,
  scheduleConfigurations
}) => {
  let morningSlots = [];
  let afternoonSlots = [];

  if (selectedDate) {
    const selectedDateFormatted = format(selectedDate, 'yyyy-MM-dd');

    const config = scheduleConfigurations.find(item => item.data === selectedDateFormatted);

    if (config) {
      const timeSlots = config.intervalos.map(slot => ({
        ...slot,
        time: slot.inicio,           
               
      }));

      morningSlots = timeSlots.filter(slot => {
        const hour = parseInt(slot.inicio.split(':')[0]);
        return hour < 12;
      });

      afternoonSlots = timeSlots.filter(slot => {
        const hour = parseInt(slot.inicio.split(':')[0]);
        return hour >= 12;
      });
    }
  }

  const renderTimeSlots = (slots, title) => (
    <div className="space-y-4">
      <h4 className="font-semibold text-gray-900 flex items-center">
        <Clock className="h-4 w-4 mr-2 text-blue-600" />
        {title}
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {slots.map((slot) => (
          <div
            key={slot.time}
            onClick={() => slot.available && onTimeSelect(slot.time, slot.professional, slot.service)}
            className={`cursor-pointer p-4 h-auto flex-col items-start text-left transition-all duration-200 rounded-lg border text-sm ${
              selectedTime === slot.time
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105'
                : slot.available
                  ? 'bg-blue-100 text-blue-800 border-blue-300 hover:bg-blue-200 hover:border-blue-400 hover:shadow-md'
                  : 'opacity-40 cursor-not-allowed bg-gray-50 border-gray-200'
            }`}
          >
            <div className="font-semibold text-base">{slot.time}</div>
            <div className={`text-xs mt-1 ${selectedTime === slot.time ? 'text-blue-100' : 'text-gray-600'}`}>
              {slot.professional}
            </div>
            <div className={`text-xs ${selectedTime === slot.time ? 'text-blue-200' : 'text-gray-500'}`}>
              {slot.service}
            </div>
            {!slot.available && (
              <div className="text-xs text-red-500 font-medium mt-1">
                Indisponível
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (!selectedDate) {
    return (
      <Card className="medical-card">
        <CardContent className="p-8 text-center">
          <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Selecione uma data primeiro
          </h3>
          <p className="text-gray-500">
            Escolha uma data no calendário para ver os horários disponíveis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="medical-card">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl text-gray-900">
          <Clock className="mr-2 h-5 w-5 text-blue-600" />
          Horários Disponíveis
        </CardTitle>
        <p className="text-sm text-gray-600">
          {format(new Date(selectedDate), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {renderTimeSlots(morningSlots, 'Manhã')}
        {renderTimeSlots(afternoonSlots, 'Tarde')}

        {selectedTime && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center text-green-800">
              <Users className="h-4 w-4 mr-2" />
              <span className="font-medium">
                Horário selecionado: {selectedTime}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-gray-500 space-y-1">
          <p>• Clique em um horário para selecioná-lo</p>
          <p>• O tempo de atendimento varia conforme o serviço</p>
          <p>• Chegue 10 minutos antes do horário agendado</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeSlots;
