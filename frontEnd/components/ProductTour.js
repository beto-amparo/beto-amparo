// src/components/ProductTour.js
import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import CustomTooltip from './CustomTooltip'; // Importe seu tooltip customizado

const ProductTour = ({ steps, tourKey, onTourFinish }) => {
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`hasSeen${tourKey}Tour`);
    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, [tourKey]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
      localStorage.setItem(`hasSeen${tourKey}Tour`, 'true');
      if (onTourFinish) {
        onTourFinish();
      }
    }
  };

  if (!runTour || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous={true}
      showProgress={false} // Desativar showProgress padrão do Joyride, pois o CustomTooltip o renderiza
      showSkipButton={true}
      // Remova a prop 'locale' daqui, pois o CustomTooltip gerencia os textos
      callback={handleJoyrideCallback}
      tooltipComponent={CustomTooltip} // <--- Use seu componente de tooltip customizado aqui
      styles={{
        options: {
          zIndex: 10000,
        },
        overlay: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        },
        spotlight: {
          borderRadius: '8px',
        },
        // Os estilos de tooltip, button e arrow serão aplicados via CSS para as classes do CustomTooltip
        // Mantenha apenas o arrow.color se quiser que a seta siga a cor do fundo do tooltip, que será definida no CSS
        arrow: {
          color: '#3681B6', // A seta terá a mesma cor do fundo do tooltip (definida via CSS)
        },
      }}
    />
  );
};

export default ProductTour;