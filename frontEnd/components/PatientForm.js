import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { User, Calendar, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ClientForm = ({
  selectedDate,
  selectedTime,
  selectedProfessional,
  selectedService,
  onSubmit,


}) => {

  const handleConfirm = () => {
    if (!selectedDate || !selectedTime) {
     
      return;
    }

    const appointmentData = {
      data: selectedDate,
      horario: selectedTime,
      profissional: selectedProfessional,
      servico: selectedService,
    };

    onSubmit(appointmentData);
  };

  if (!selectedDate || !selectedTime) {
    return (
      <Card className="medical-card mb-7">
        <CardContent className="p-8 text-center">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">
            Complete a seleção
          </h3>
          <p className="text-gray-500">
            Selecione uma data e horário para confirmar seu agendamento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="medical-card mb-7 ">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl text-gray-900">
          <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
          Confirmar Agendamento
        </CardTitle>
        <p className="text-sm text-gray-600">
          Revise os detalhes do seu agendamento e confirme
        </p>
      </CardHeader>
      <CardContent>
        <div className="mb-6 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 mb-4 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Detalhes do Agendamento
          </h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-gray-600">Data:</span>
              <span className="font-semibold text-gray-900">
                {format(selectedDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-gray-600">Horário:</span>
              <span className="font-semibold text-gray-900">{selectedTime}</span>
            </div>
            
            
           {(selectedProfessional && <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              
              <span className="text-gray-600">Profissional:</span>
              <span className="font-semibold text-gray-900">{selectedProfessional}</span>
              
            </div>
          )}
          { selectedService && (
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-gray-600">Serviço:</span>
              <span className="font-semibold text-gray-900">{selectedService}</span>
            </div>
          )}
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4 mb-6 border border-yellow-200">
          <h4 className="font-semibold text-yellow-800 mb-2">Instruções Importantes:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Chegue 10 minutos antes do horário agendado</li>
            <li>• Traga um documento com foto</li>
            <li>• Em caso de cancelamento, avise com 24h de antecedência</li>
          </ul>
        </div>



        <p className="text-xs text-gray-500 text-center mt-4">
          Ao confirmar, você receberá uma notificação com os detalhes do agendamento.
        </p>

        <div className="mt-6  flex justify-center">
          <button
            onClick={handleConfirm}
            className= " bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition"
          >
            Confirmar
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientForm;
