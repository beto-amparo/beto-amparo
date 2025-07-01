// Arquivo: src/components/AppointmentBooking.js
// (Componente principal que orquestra o agendamento)

import React, { useState, useRef, useEffect } from 'react';
import AppointmentCalendar from '@/components/AppointmentCalendar';
import TimeSlots from '@/components/TimeSlots';
import ClientForm from '@/components/PatientForm'; // Ajuste o caminho se o nome do arquivo for ClientForm.js
import { CheckCircle, Calendar as CalendarIconLucide } from 'lucide-react'; // Renomeado para evitar conflito com o componente Calendar
import { Link } from 'react-router-dom';
import { ptBR } from 'date-fns/locale'; // Adicionado para formatação pt-BR
import { useRouter } from 'next/router';
import { format, parseISO, startOfDay } from 'date-fns';
import Notification from '@/components/ui/Notification.js'; // Importando o componente de notificação
import NavBar from "@/components/NavBar"; 

const AppointmentBooking = () => {
  const router = useRouter();
  const { slug } = router.query;

  const [selectedDate, setSelectedDate] = useState();
  const [selectedTime, setSelectedTime] = useState();
  const [selectedProfessional, setSelectedProfessional] = useState();
  const [selectedService, setSelectedService] = useState();
  const [isBooked, setIsBooked] = useState(false);
  const [bookingData, setBookingData] = useState(null); 


  const [scheduleConfigurations, setScheduleConfigurations] = useState([]);
  const [calendarAvailableDates, setCalendarAvailableDates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const timeSlotsRef = useRef(null);
  const clientFormRef = useRef(null);
  const [notification, setNotification] = useState(null);
  const [corPrimaria, setCorPrimaria] = useState("#3B82F6");

  const show = (msg, type) => {
    setNotification({ message: msg, type });
  };

  useEffect(() => {
    if (slug) {
      


      async function fetchEmpresa() {
        try {

            const url = `${process.env.NEXT_PUBLIC_EMPRESA_API}/loja/slug/${slug}`;
            const response = await fetch(url);

            if (!response.ok) {
                let errorMessage = `Erro HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorData = await response.json();
                    if (errorData.message) {
                        errorMessage += ` - ${errorData.message}`;
                    }
                } catch (jsonError) {
                    // Não conseguiu parsear o JSON do erro
                }
                console.error("DEBUG: Erro na resposta da API de empresa:", errorMessage);
                return;
            }

            const data = await response.json();
            
            setCorPrimaria(data.cor_primaria || "#3B82F6"); // Define a cor primária ou usa um padrão
            console.log("DEBUG: Dados d:", corPrimaria);
            
        } catch (error) {
            console.error("DEBUG: Erro na requisição ao buscar empresa:", error.message || error);
        }
    }
    fetchEmpresa();
    fetchScheduleConfigurations(slug);

    }
  }, [slug]);

  const fetchScheduleConfigurations = async (slug) => {
    
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/${slug}/Horarios` , {
        method: "GET",
        credentials: 'include',
      });
      const data = await response.json();
      setScheduleConfigurations(data);
      
      if (response.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
        return;
      }

      console.log("DEBUG: Dados de horários recebidos:", data);
      if (data || data.length >  0  ) {
    
      const availableDates = data
  .filter(item => !!item.data) 
  .map(item => startOfDay(parseISO(item.data , 'yyyy-MM-dd')))
  .filter((date, index, self) =>
    index === self.findIndex(d => d.getTime() === date.getTime())
  );
  setCalendarAvailableDates(availableDates);
  
      }
    
  
      
      
     
    } catch (error) {
      console.error('Erro ao carregar configurações de agenda:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    
    if (selectedDate && !selectedTime && timeSlotsRef.current) {
      setTimeout(() => {
        timeSlotsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [selectedDate, selectedTime]);

  const handleTimeSelect = (time, professional, service) => {
    setSelectedTime(time);
    setSelectedProfessional(professional);
    setSelectedService(service);

   
    if (clientFormRef.current) {
      setTimeout(() => {
        clientFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleFormSubmit = async (formDataFromClient) => {
   
    try {  
      if(!formDataFromClient) {
        console.error("Dados do formulário não fornecidos");
        return;
      }
  
      const response = await fetch(`${process.env.NEXT_PUBLIC_EMPRESA_API}/${slug}/agendamento` , {
        method: "POST",
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataFromClient)

        
      });
      if (!response.ok) {
        const errorData = await response.json();
        show("Erro ao agendar: " + errorData.message, "error");
        return
        
      }
      const data = await response.json();
      show("Agendamento criado com sucesso!", "success");
                
    
      await fetchScheduleConfigurations(slug);
      
   
    } catch (error) {
   
      console.error("Erro ao submeter o agendamento:", error);
      
    }
  };

  const resetBooking = () => {
    setSelectedDate(undefined);
    setSelectedTime(undefined);
    setSelectedProfessional(undefined);
    setSelectedService(undefined);
    setIsBooked(false);
    setBookingData(null);
  };

  const Button = ({ children, onClick, className, type = 'button' }) => (
    <button onClick={onClick} type={type} className={`px-4 py-2 rounded text-white bg-blue-600 hover:bg-blue-700 transition-colors ${className}`}>
      {children}
    </button>
  );

  const OutlineButton = ({ children, onClick, className, type = 'button' }) => (
    <button onClick={onClick} type={type} className={`px-4 py-2 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition-colors ${className}`}>
      {children}
    </button>
  );

  if (isBooked && bookingData) {
    return (
      <div className="min-h-screen bg-gray-50">
        
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto bg-green-50 border border-green-200 rounded-lg shadow">
            <div className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Agendamento Confirmado!</h1>
              <p className="text-lg text-gray-600 mb-8">
                Seu agendamento foi confirmado com sucesso. Você receberá um e-mail de confirmação em breve.
              </p>
              <div className="bg-white rounded-lg p-6 space-y-4 text-left mb-8">
                <h3 className="font-semibold text-gray-900 text-lg border-b pb-2">Detalhes do Agendamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* Os campos nome, telefone, observacoes dependerão do ClientForm coletá-los */}
                  {bookingData.nome && <div><span className="text-gray-600">Cliente:</span><p className="font-medium">{bookingData.nome}</p></div>}
                  {bookingData.data && <div><span className="text-gray-600">Data:</span><p className="font-medium">{format(new Date(bookingData.data), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p></div>}
                  {bookingData.horario && <div><span className="text-gray-600">Horário:</span><p className="font-medium">{bookingData.horario}</p></div>}
                  {bookingData.profissional && <div><span className="text-gray-600">Profissional:</span><p className="font-medium">{bookingData.profissional}</p></div>}
                  {bookingData.servico && <div><span className="text-gray-600">Serviço:</span><p className="font-medium">{bookingData.servico}</p></div>}
                  {bookingData.telefone && <div><span className="text-gray-600">Telefone:</span><p className="font-medium">{bookingData.telefone}</p></div>}
                </div>
                {bookingData.observacoes && (
                  <div className="pt-4 border-t">
                    <span className="text-gray-600">Observações:</span>
                    <p className="font-medium mt-1">{bookingData.observacoes}</p>
                  </div>
                )}
              </div>
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2">Instruções Importantes:</h4>
                <ul className="text-sm text-blue-800 text-left space-y-1">
                  <li>• Chegue 10 minutos antes do horário agendado</li>
                  <li>• Traga um documento com foto</li>
                  <li>• Em caso de cancelamento, avise com 24h de antecedência</li>
                  <li>• Entre em contato conosco se tiver alguma dúvida</li>
                </ul>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button onClick={resetBooking} className="flex items-center justify-center">
                  <CalendarIconLucide className="mr-2 h-4 w-4" />
                  Fazer Novo Agendamento
                </Button>
                <Link to="/">
                  <OutlineButton className="w-full sm:w-auto">Voltar ao Início</OutlineButton>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }


  let currentStep = 1;
  if (selectedDate) currentStep = 2;
  if (selectedTime) currentStep = 3;


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav fixo no topo */}


{/* Espaço para não ficar atrás da navbar fixa */}
<div style={{ height: 56 }}></div>


      {/* Conteúdo principal com padding para o nav fixo */}
      <div className="container mx-auto px-4 pt-16 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Agendar Serviço</h1>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Selecione a data, horário e preencha seus dados para agendar seu serviço
          </p>
        </div>

        {/* Indicador de Progresso */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-center space-x-4">
            {/* Passo 1 */}
            <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                1
              </div>
              <span className="hidden sm:inline">Data</span>
            </div>

            {/* Barra entre passos */}
            <div className={`flex-1 h-1 rounded ${currentStep >= 2 ? 'bg-blue-200' : 'bg-gray-300'}`}></div>

            {/* Passo 2 */}

            <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                2
              </div>
              <span className="hidden sm:inline">Horário</span>
            </div>

            {/* Barra entre passos */}
            <div className={`flex-1 h-1 rounded ${currentStep >= 3 ? 'bg-blue-200' : 'bg-gray-300'}`}></div>

            {/* Passo 3 */}

            <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                3
              </div>
              <span className="hidden sm:inline">Dados</span>
            </div>
          </div>
        </div>

        {/* Conteúdo da página */}
        <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <AppointmentCalendar 
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              availableDates={calendarAvailableDates}
            />
          </div>
          <div className="lg:col-span-1" ref={timeSlotsRef}>
            <TimeSlots
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              onTimeSelect={handleTimeSelect}
              scheduleConfigurations={scheduleConfigurations}
            />
          </div>
          <div className="lg:col-span-1" ref={clientFormRef}>
            <ClientForm
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              selectedProfessional={selectedProfessional}
              selectedService={selectedService}
              onSubmit={handleFormSubmit}
              onTimeSelect={handleTimeSelect}
            />
            {notification && (
              <Notification
                message={notification.message}
                type={notification.type}
                onClose={() => setNotification(null)}
              />
            )}
            <NavBar site={slug} corPrimaria={corPrimaria} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;