import React, { useState, useEffect } from 'react';
import { Check, Clock, X, Package, Truck, ChefHat } from 'lucide-react';

const statusConfig = {
  pending: {
    icon: Clock,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    label: 'Pendente',
    description: 'Pedido recebido e aguardando confirmação'
  },
  preparing: {
    icon: ChefHat,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    label: 'Preparando',
    description: 'Pedido sendo preparado pela cozinha'
  },
  ready: {
    icon: Package,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    label: 'Pronto',
    description: 'Pedido pronto para retirada/entrega'
  },
  delivered: {
    icon: Truck,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    label: 'Entregue',
    description: 'Pedido entregue com sucesso'
  },
  cancelled: {
    icon: X,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    label: 'Cancelado',
    description: 'Pedido foi cancelado'
  }
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const mockNotifications = [
      {
        id: '1',
        orderId: '#12345',
        status: 'delivered',
        message: 'Seu pedido foi entregue com sucesso!',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        customerName: 'João Silva',
        isRead: false
      },
      {
        id: '2',
        orderId: '#12346',
        status: 'ready',
        message: 'Pedido pronto para retirada',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        customerName: 'Maria Santos',
        isRead: false
      },
      {
        id: '3',
        orderId: '#12347',
        status: 'preparing',
        message: 'Preparação iniciada na cozinha',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        customerName: 'Pedro Costa',
        isRead: true
      },
      {
        id: '4',
        orderId: '#12348',
        status: 'cancelled',
        message: 'Pedido cancelado pelo cliente',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
        customerName: 'Ana Oliveira',
        isRead: true
      },
      {
        id: '5',
        orderId: '#12349',
        status: 'pending',
        message: 'Novo pedido recebido',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        customerName: 'Carlos Lima',
        isRead: false
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const markAsRead = (id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, isRead: true }))
    );
  };

  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}min atrás`;
    } else if (hours < 24) {
      return `${hours}h atrás`;
    } else {
      return `${days}d atrás`;
    }
  };

  const filteredNotifications = notifications.filter((notif) => {
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'today') {
      const today = new Date();
      const notifDate = new Date(notif.timestamp);
      return notifDate.toDateString() === today.toDateString();
    }
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                Notificações
              </h1>
              <p className="text-slate-600">
                Acompanhe o status dos seus pedidos em tempo real
              </p>
            </div>
            {unreadCount > 0 && (
              <div className="flex items-center gap-4">
                <span className="bg-red-100 text-red-800 text-sm font-medium px-3 py-1 rounded-full">
                  {unreadCount} não lidas
                </span>
                <button
                  onClick={markAllAsRead}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                >
                  Marcar todas como lidas
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 mb-8">
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Não lidas ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('today')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Hoje
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-xl shadow-lg p-12 border border-slate-200 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Nenhuma notificação encontrada
              </h3>
              <p className="text-slate-500">
                {filter === 'unread'
                  ? 'Todas as notificações foram lidas'
                  : 'Você não tem notificações no momento'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const config = statusConfig[notification.status];
              const IconComponent = config.icon;

              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-xl shadow-lg border transition-all duration-300 hover:shadow-xl ${
                    notification.isRead
                      ? 'border-slate-200 opacity-75'
                      : 'border-l-4 border-l-blue-500 border-slate-200'
                  }`}
                >
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-full ${config.bgColor} ${config.borderColor} border-2`}>
                        <IconComponent className={`w-6 h-6 ${config.color}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold text-slate-800">
                              Pedido {notification.orderId}
                            </h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.color}`}>
                              {config.label}
                            </span>
                          </div>
                          <span className="text-sm text-slate-500">
                            {getRelativeTime(notification.timestamp)}
                          </span>
                        </div>

                        <p className="text-slate-600 mb-2">
                          <strong>Cliente:</strong> {notification.customerName}
                        </p>

                        <p className="text-slate-700 mb-3">{notification.message}</p>
                        <p className="text-sm text-slate-500 mb-4">{config.description}</p>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">
                            {new Date(notification.timestamp).toLocaleString('pt-BR')}
                          </span>

                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Marcar como lida
                            </button>
                          )}
                        </div>
                      </div>

                      {!notification.isRead && (
                        <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
