// src/components/CustomTooltip.js
import React from 'react';
// Não precisa de `Image` se não estiver usando dentro deste componente

const CustomTooltip = ({
  continuous,
  index,
  step,
  backProps,    // <--- backProps é essencial para o botão Voltar
  closeProps,
  primaryProps, // Props para o botão Próximo/Finalizar
  skipProps,
  isLastStep,
  size,
  tooltipProps,
}) => {
  const nextButtonText = isLastStep ? 'Finalizar' : 'Próximo';
  const skipButtonText = 'Pular';
  const backButtonText = 'Voltar';

  const progressText = `Passo ${index + 1} de ${size}`;

  return (
    <div {...tooltipProps} className="custom-joyride-tooltip">
      {step.title && (
        <h3 className="custom-joyride-title">
          {step.title}
        </h3>
      )}
      <div className="custom-joyride-content">
        {step.content}
      </div>

      <div className="custom-joyride-footer">
        {/* Adiciona a barra de progresso */}
        <div className="custom-joyride-progress">
          {progressText}
        </div>
        <div className="custom-joyride-buttons">
          {/* Renderiza o botão Voltar APENAS se não for o primeiro passo */}
          {index > 0 && (
            <button {...backProps} className="custom-joyride-button custom-joyride-button-back">
              {backButtonText}
            </button>
          )}
          {/* Renderiza o botão Pular se for permitido pelo passo */}
          {step.showSkipButton && (
            <button {...skipProps} className="custom-joyride-button custom-joyride-button-skip">
              {skipButtonText}
            </button>
          )}
          {/* Renderiza o botão Próximo/Finalizar se o tour for contínuo */}
          {continuous && (
            <button {...primaryProps} className="custom-joyride-button custom-joyride-button-next-primary">
              {nextButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomTooltip;